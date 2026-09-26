import { Component, type ReactNode } from 'react';

import { monitoring } from '@/shared/monitoring';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the children after a render error; `reset` retries. */
  fallback: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render errors so one broken screen or section doesn't take down the
 * app (ADR-0018). A small in-house class: React still requires a class here,
 * and a library would add a dependency for ~30 lines.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    monitoring.captureException(error, { source: 'error-boundary' });
  }

  reset = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    return this.state.hasError
      ? this.props.fallback(this.reset)
      : this.props.children;
  }
}
