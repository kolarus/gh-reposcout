import { Suspense, type ReactNode } from 'react';

import { ErrorBoundary, ErrorFallback } from '@/shared/ui';

/**
 * Wraps every screen (React Navigation `screenLayout`): an error boundary so one
 * broken screen doesn't take down the tabs (ADR-0018), and a Suspense boundary
 * for lazily loaded screens (ADR-0006).
 */
export function ScreenLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={reset => <ErrorFallback onReset={reset} />}>
      <Suspense fallback={null}>{children}</Suspense>
    </ErrorBoundary>
  );
}
