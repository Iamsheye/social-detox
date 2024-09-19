import * as browser from 'webextension-polyfill';
import { siteStorage } from '@extension/storage';

let currentTabId: number | null = null;
let currentDomain: string | null = null;
let startTime: number | null = null;

const domainTimes: Record<
  string,
  {
    startTime: number | null;
    totalTime: number;
  }
> = {}; // Track time per domain

let timeInterval: NodeJS.Timeout | null = null;
let isSettingInterval = false;

const startInterval = () => {
  if (timeInterval) return; // Exit early if interval is already set

  if (isSettingInterval) return; // Exit if we're already in the process of setting the interval

  isSettingInterval = true;

  try {
    if (!timeInterval) {
      // Double-check timeInterval is still null
      timeInterval = setInterval(async () => {
        await queueUpdateTimeSpent('interval');
      }, 30000);
    }
  } finally {
    isSettingInterval = false;
  }
};

const stopInterval = () => {
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
};

export async function resetDailyTime() {
  try {
    const sites = await siteStorage.get();
    const updatedSites = sites.map(site => ({
      ...site,
      dailyTime: 0,
    }));
    await siteStorage.set(updatedSites);
  } catch (error) {
    console.error('Error resetting daily time:', error);
  }
}

async function checkAndResetDaily() {
  try {
    const { lastResetDate } = await browser.storage.local.get('lastResetDate');
    const today = new Date().toISOString().split('T')[0];

    if (!lastResetDate || lastResetDate !== today) {
      await resetDailyTime();
      await browser.storage.local.set({ lastResetDate: today });
    }
  } catch (error) {
    console.error('Error checking and resetting daily time:', error);
  }
}

let isUpdating = false;
let pendingUpdate: Promise<void> | null = null;

async function updateTimeSpent(source: string) {
  if (pendingUpdate) {
    await pendingUpdate;
    return;
  }

  if (isUpdating) {
    return;
  }

  isUpdating = true;

  try {
    await checkAndResetDaily();

    if (currentDomain && startTime) {
      const now = Date.now();
      const timeSpent = Math.floor((now - startTime) / 1000); // Convert to seconds

      if (!domainTimes[currentDomain]) {
        domainTimes[currentDomain] = { startTime: now, totalTime: 0 };
      }
      domainTimes[currentDomain].totalTime += timeSpent;

      try {
        const sites = await siteStorage.get();
        const site = sites.find(site => currentDomain?.includes(site.domain));

        if (!site) return;

        if (!site.isTrackingAllowed) {
          console.log(`Time tracking disabled for ${currentDomain}`);
          return;
        }

        const currentDate = new Date().toISOString().split('T')[0];

        const todayEntry = site.dateTracking.find(entry => entry.date === currentDate);

        if (todayEntry) {
          todayEntry.timeSpent += timeSpent;
        } else {
          site.dateTracking.push({ date: currentDate, timeSpent });

          // Ensure the dateTracking array doesn't exceed 30 elements
          if (site.dateTracking.length > 30) {
            site.dateTracking.shift(); // Remove the oldest entry
          }
        }

        site.dailyTime += timeSpent;

        await siteStorage.update(site.id, site);
        console.log(`___SOURCE: ${source}___`);
        console.log(`___${currentDomain}___ Time Spent: ${timeSpent} seconds___dailyTime: ${site.dailyTime}___`);
        await checkDailyLimit(site.id);
      } catch (error) {
        console.error('Error updating time spent:', error);
      }
    }

    startTime = Date.now(); // Reset start time for the next tracking period
  } finally {
    // Release the lock and clear pending update
    isUpdating = false;
    pendingUpdate = null;
  }
}

async function queueUpdateTimeSpent(source: string) {
  if (!pendingUpdate) {
    // Queue the update
    pendingUpdate = updateTimeSpent(source);
  }
  return pendingUpdate;
}

async function checkDailyLimit(siteId: string) {
  try {
    const sites = await siteStorage.get();
    const site = sites.find(site => site.id === siteId);

    if (!site) return;

    if (site.dailyLimit !== null && site.dailyTime / 60 >= site.dailyLimit) {
      await siteStorage.update(siteId, { isBlocked: true });
      if (currentTabId) {
        browser.tabs.sendMessage(currentTabId, { action: 'blockSite' });
      }
    }
  } catch (error) {
    console.error('Error checking daily limit:', error);
  }
}

async function handleTabChange(tabId: number, url: string | undefined) {
  if (url && url.startsWith('http')) {
    const newDomain = new URL(url).hostname;

    // First, handle time update for the previous domain/tab
    if (currentDomain) {
      await queueUpdateTimeSpent('handleTabChange');
    }

    const sites = await siteStorage.get();
    const site = sites.find(site => newDomain.includes(site.domain));

    if (site && site.isTrackingAllowed) {
      currentTabId = tabId;
      currentDomain = newDomain;
      startTime = Date.now();
      startInterval();
    } else {
      console.log(`Time tracking disabled for ${newDomain}`);
      stopInterval();
      // currentTabId = null;
      // currentDomain = null;
      // startTime = null;
    }
  } else {
    stopInterval();
    // currentTabId = null;
    // currentDomain = null;
    // startTime = null;
  }
}

// Listen for tab changes
browser.tabs.onActivated.addListener(async activeInfo => {
  const tab = await browser.tabs.get(activeInfo.tabId);
  await handleTabChange(activeInfo.tabId, tab.url);
});

// Listen for tab updates
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    await handleTabChange(tabId, tab.url);
  }
});

// Listen for tab close and update the time before the tab is removed
browser.tabs.onRemoved.addListener(async tabId => {
  if (tabId === currentTabId) {
    await queueUpdateTimeSpent('onRemoved');
  }
});

browser.runtime.onSuspend.addListener(() => {
  stopInterval();
});

browser.runtime.onStartup.addListener(checkAndResetDaily);

// Listen for window focus changes
browser.windows.onFocusChanged.addListener(async windowId => {
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    const [tab] = await browser.tabs.query({ active: true, windowId });

    if (tab && tab.id && tab.url) {
      await handleTabChange(tab.id, tab.url);
    }
  } else {
    // Window lost focus, update time spent
    stopInterval();
    await queueUpdateTimeSpent('onFocusChanged');
  }
});

// Listen for browser idle state changes
browser.idle.onStateChanged.addListener(async newState => {
  if (newState === 'active') {
    // Browser became active, reset tracking for current tab
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.id && tab.url) {
      await handleTabChange(tab.id, tab.url);
    }
  } else {
    // Browser became idle or locked, update time spent
    stopInterval();
    await queueUpdateTimeSpent('onStateChanged');
  }
});

// chrome.alarms.create('dailyReset', { periodInMinutes: 24 * 60 });

// chrome.alarms.onAlarm.addListener(alarm => {
//   if (alarm.name === 'dailyReset') {
//     resetDailyTime();
//   }
// });
