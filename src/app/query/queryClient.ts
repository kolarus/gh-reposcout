import NetInfo from '@react-native-community/netinfo';
import {
  focusManager,
  onlineManager,
  QueryClient,
} from '@tanstack/react-query';
import { AppState } from 'react-native';

import { isRetryable } from '@/shared/api';
import { appConfig } from '@/shared/config';

/** Query defaults (ADR-0007): retry only transient failures, keep data for a day. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          isRetryable(error) && failureCount < appConfig.query.maxRetries,
        gcTime: appConfig.query.gcTimeMs,
      },
    },
  });
}

/**
 * Connects TanStack Query to the device (ADR-0011): queries pause while
 * offline instead of failing, and refetch when the app returns to the
 * foreground. Unknown reachability counts as online. Returns a cleanup.
 */
export function connectQueryManagers(): () => void {
  onlineManager.setEventListener(setOnline =>
    NetInfo.addEventListener(state => {
      setOnline(
        state.isConnected !== false && state.isInternetReachable !== false,
      );
    }),
  );
  focusManager.setEventListener(handleFocus => {
    const subscription = AppState.addEventListener('change', status => {
      handleFocus(status === 'active');
    });
    return () => {
      subscription.remove();
    };
  });
  return () => {
    onlineManager.setEventListener(() => undefined);
    focusManager.setEventListener(() => undefined);
  };
}
