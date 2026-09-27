/**
 * Holds something back until the test says so: e.g. a fake response that
 * waits on `gate.opened`, so the test can assert the loading state, then call
 * `gate.open()`. Deterministic, unlike a timed delay (ADR-0013).
 */
export function createGate(): { opened: Promise<void>; open: () => void } {
  let release: () => void = () => undefined;
  const opened = new Promise<void>(resolve => {
    release = () => {
      resolve();
    };
  });
  return {
    opened,
    open: () => {
      release();
    },
  };
}
