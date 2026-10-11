import { DATA_MODE } from '../mode';
import { mockApi } from './mock';
import { remoteApi } from './remote';
import type { DataApi } from './types';

export const api: DataApi = DATA_MODE === 'mock' ? mockApi : remoteApi;
export type { DataApi, DateRange } from './types';
