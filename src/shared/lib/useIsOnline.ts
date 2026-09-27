import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const isOnline = () => onlineManager.isOnline();

/**
 * Whether the device is online, as TanStack Query sees it (fed by NetInfo,
 * ADR-0011). Using the same source as the query client means an offline
 * banner and paused queries always agree.
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, isOnline);
}
