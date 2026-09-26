import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '@/shared/theme';
import { ErrorBoundary, ErrorFallback } from '@/shared/ui';

/** Status bar icons follow the active theme, not just the OS setting. */
function ThemedStatusBar() {
  const theme = useTheme();
  return (
    <StatusBar
      barStyle={theme.name === 'dark' ? 'light-content' : 'dark-content'}
    />
  );
}

/** App-wide providers, plus the root error boundary (ADR-0018). */
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
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
