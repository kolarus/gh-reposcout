/**
 * Error reporting and logging behind an interface (ADR-0018). Development logs
 * to the console; release builds are silent until a real adapter (e.g. Sentry)
 * is plugged in here, a one-file change.
 */
export interface Monitoring {
  captureException: (
    error: unknown,
    context?: Readonly<Record<string, unknown>>,
  ) => void;
  log: (message: string, data?: Readonly<Record<string, unknown>>) => void;
}

export const monitoring: Monitoring = {
  captureException: (error, context) => {
    // console.warn, not console.error: handled errors shouldn't open the red LogBox.
    if (__DEV__) console.warn('[monitoring]', error, context ?? {});
  },
  log: (message, data) => {
    if (__DEV__) console.log('[monitoring]', message, data ?? {});
  },
};
