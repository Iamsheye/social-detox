import * as browser from 'webextension-polyfill';
import { siteStorage } from '@extension/storage';

let currentTabId: number | null = null;
let currentDomain: string | null = null;
let startTime: number | null = null;
const domainTimes: { [domain: string]: { startTime: number | null; totalTime: number } } = {}; // Track time per domain

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

      if (site) {
        await siteStorage.update(site.id, {
          totalTime: site.totalTime + timeSpent,
          dailyTime: site.dailyTime + timeSpent,
        });
        console.log(
          '__UPDATED_TIME__',
          site.domain,
          'totalTime',
          site.totalTime + timeSpent,
          'dailyTime',
          site.dailyTime + timeSpent,
        );
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

// Debounce update time spent
let updateTimeout: ReturnType<typeof setTimeout> | null = null;

async function updateTimeSpentDebounced(): Promise<void> {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  updateTimeout = setTimeout(async () => {
    await updateTimeSpent();
  }, 1000); // Wait 1 second after tab switching before updating time spent
}

// Listen for tab changes
browser.tabs.onActivated.addListener(async activeInfo => {
  await updateTimeSpentDebounced(); // Update time for the previous tab
  currentTabId = activeInfo.tabId;
  const tab = await browser.tabs.get(currentTabId);
  if (tab.url && tab.url.startsWith('http')) {
    const newDomain = new URL(tab.url).hostname;

    if (currentDomain !== newDomain) {
      currentDomain = newDomain;
      startTime = Date.now(); // Start tracking time for the new domain
    }
  }
});

// Listen for tab updates
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url && tab.url.startsWith('http')) {
    await updateTimeSpentDebounced(); // Update time for the previous tab
    const newDomain = new URL(tab.url).hostname;

    if (currentDomain !== newDomain) {
      currentDomain = newDomain;
      startTime = Date.now(); // Start tracking time for the new domain
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
