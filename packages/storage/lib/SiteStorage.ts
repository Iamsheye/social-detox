import { v4 as uuidv4 } from 'uuid';
import { createStorage } from './base';
import { StorageEnum } from './enums';
import type { Site, SiteStorage } from './types';

const initialSites: Site[] = [
  {
    id: uuidv4(),
    domain: 'youtube.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'x.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'chatgpt.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'claude.ai',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'mail.google.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'meet.google.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'reddit.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'github.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'instagram.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'linkedin.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'figma.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'twitter.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'web.snapchat.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'leetcode.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
  {
    id: uuidv4(),
    domain: 'discord.com',
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isTrackingAllowed: true,
    dateTracking: [],
  },
];

const storage = createStorage<Site[]>('site-storage-key', initialSites, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// You can extend it with your own methods
export const siteStorage: SiteStorage = {
  ...storage,
  update: async (id, data) => {
    const sites = await storage.get();
    const site = sites.find(site => site.id === id);
    if (!site) return;
    await storage.set(sites.map(site => (site.id === id ? { ...site, ...data } : site)));
  },
};
