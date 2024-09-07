import { v4 as uuidv4 } from 'uuid';
import { createStorage } from './base';
import { StorageEnum } from './enums';
import type { Site, SiteStorage } from './types';

const initialSites: Site[] = [
  {
    id: uuidv4(),
    domain: 'youtube.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'x.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'chatgpt.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'claude.ai',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'mail.google.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'meet.google.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'reddit.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'github.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'instagram.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'linkedin.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'twitter.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'web.snapchat.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'leetcode.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
  },
  {
    id: uuidv4(),
    domain: 'discord.com',
    totalTime: 0,
    isBlocked: false,
    dailyTime: 0,
    dailyLimit: null,
    isBeingTracked: true,
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
