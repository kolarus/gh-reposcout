import { monitoring } from './monitoring';

interface PromiseRejectionTracker {
  enablePromiseRejectionTracker: (options: {
    allRejections: boolean;
    onUnhandled: (id: number, rejection: unknown) => void;
  }) => void;
}

// React Native types HermesInternal as an opaque `null | {}`, so narrow at runtime
// instead of casting (ADR-0004). Absent outside Hermes (e.g. in Jest).
const hasPromiseTracker = (value: unknown): value is PromiseRejectionTracker =>
  typeof value === 'object' &&
  value !== null &&
  'enablePromiseRejectionTracker' in value &&
  typeof value.enablePromiseRejectionTracker === 'function';

let installed = false;

/**
 * Routes uncaught JS errors and (in release) unhandled promise rejections to
 * monitoring, so nothing fails silently (ADR-0018). The previous global handler
 * still runs, so React Native's own crash handling and LogBox keep working.
 */
export function installGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    monitoring.captureException(error, {
      source: 'global',
      isFatal: isFatal ?? false,
    });
    previous(error, isFatal);
  });

  // In development React Native already tracks rejections for LogBox; replacing
  // its tracker would hide those warnings.
  const hermes: unknown = Reflect.get(globalThis, 'HermesInternal');
  if (!__DEV__ && hasPromiseTracker(hermes)) {
    hermes.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (_id, rejection) => {
        monitoring.captureException(rejection, { source: 'unhandled-promise' });
      },
    });
  }
}
