import type { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { monitoring } from '@/shared/monitoring';
import { ThemeProvider, useTheme } from '@/shared/theme';
import { ErrorBoundary, ErrorFallback } from '@/shared/ui';

import { queryPersistOptions } from '../query/persistence';

/** Status bar icons follow the active theme, not just the OS setting. */
function ThemedStatusBar() {
  const theme = useTheme();
  return (
    <StatusBar
      barStyle={theme.name === 'dark' ? 'light-content' : 'dark-content'}
    />
  );
}

// TanStack has already discarded the unreadable cache; the app starts empty.
const onRestoreError = () => {
  monitoring.log('Persisted query cache could not be restored');
};

/**
 * App-wide providers, plus the root error boundary (ADR-0018). Queries wait
 * for the persisted cache to be restored before fetching (ADR-0011).
 */
export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <ErrorBoundary fallback={reset => <ErrorFallback onReset={reset} />}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={queryPersistOptions}
            onError={onRestoreError}
          >
            {children}
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
