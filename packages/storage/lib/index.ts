import { createStorage } from './base';
import { siteStorage } from './SiteStorage';
import { SessionAccessLevelEnum, StorageEnum } from './enums';
import type { BaseStorage } from './types';

export { siteStorage, createStorage, StorageEnum, SessionAccessLevelEnum };
export type { BaseStorage };
