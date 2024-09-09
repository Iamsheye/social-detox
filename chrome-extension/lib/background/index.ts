import * as browser from 'webextension-polyfill';
import { siteStorage } from '@extension/storage';

let currentTabId: number | null = null;
let currentDomain: string | null = null;
let startTime: number | null = null;

const domainTimes: {
  [domain: string]: {
    startTime: number | null;
    totalTime: number;
  };
} = {}; // Track time per domain

// Function to update time spent on the current site
async function updateTimeSpent() {
  if (currentDomain && startTime) {
    const now = Date.now();
    const timeSpent = Math.floor((now - startTime) / 1000); // Convert to seconds

    if (!domainTimes[currentDomain]) {
      domainTimes[currentDomain] = { startTime: now, totalTime: 0 };
    }
    domainTimes[currentDomain].totalTime += timeSpent; // Accumulate time spent on the domain
    startTime = now; // Reset start time for the next tracking period

    try {
      const sites = await siteStorage.get();
      const site = sites.find(site => currentDomain?.includes(site.domain));

      if (site && !site.isTrackingAllowed) {
        console.log(`Time tracking disabled for ${currentDomain}`);
        return;
      }

      if (site) {
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
        checkDailyLimit(site.id);
      }
    } catch (error) {
      console.error('Error updating time spent:', error);
    }
  }
}

// Function to check if daily limit is exceeded
async function checkDailyLimit(siteId: string) {
  try {
    const sites = await siteStorage.get();
    const site = sites.find(site => site.id === siteId);
    if (site && site.dailyLimit !== null && site.dailyTime >= site.dailyLimit) {
      await siteStorage.update(siteId, { isBlocked: true });
      if (currentTabId) {
        browser.tabs.sendMessage(currentTabId, { action: 'blockSite' });
      }
    }
  } catch (error) {
    console.error('Error checking daily limit:', error);
  }
}

let updateTimeout: ReturnType<typeof setTimeout> | null = null;

async function updateTimeSpentDebounced(): Promise<void> {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(async () => {
    const sites = await siteStorage.get();
    const site = sites.find(site => currentDomain?.includes(site.domain));

    if (site && site.isTrackingAllowed) {
      await updateTimeSpent();
    } else {
      console.log(`Time tracking disabled for ${currentDomain}`);
    }
  }, 1000); // Wait 1 second after tab switching before updating time spent
}

// Listen for tab changes
browser.tabs.onActivated.addListener(async activeInfo => {
  const sites = await siteStorage.get();
  const tab = await browser.tabs.get(activeInfo.tabId);

  if (tab.url && tab.url.startsWith('http')) {
    const newDomain = new URL(tab.url).hostname;
    const site = sites.find(site => newDomain.includes(site.domain));

    if (site && site.isTrackingAllowed) {
      await updateTimeSpentDebounced();
      currentTabId = activeInfo.tabId;
      currentDomain = newDomain;
      startTime = Date.now();
    } else {
      console.log(`Time tracking disabled for ${newDomain}`);
    }
  }
});

// Listen for tab updates
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url && tab.url.startsWith('http')) {
    const sites = await siteStorage.get();
    const newDomain = new URL(tab.url).hostname;
    const site = sites.find(site => newDomain.includes(site.domain));

    if (site && site.isTrackingAllowed) {
      await updateTimeSpentDebounced();
      currentTabId = tabId;
      currentDomain = newDomain;
      startTime = Date.now();
    } else {
      console.log(`Time tracking disabled for ${newDomain}`);
    }
  }
});

// Listen for tab close and update the time before the tab is removed
browser.tabs.onRemoved.addListener(async tabId => {
  if (tabId === currentTabId) {
    await updateTimeSpentDebounced();
  }
});

// Periodically update time spent (every half minute)
const timeInterval = setInterval(updateTimeSpent, 30000);

browser.runtime.onSuspend.addListener(() => {
  clearInterval(timeInterval);
});
