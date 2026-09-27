import { timeoutManager } from '@tanstack/react-query';

import { server } from '@/test/server';

// SafeAreaProvider waits for native inset data, which never arrives in Jest;
// the library's official mock provides fixed insets instead.
jest.mock(
  'react-native-safe-area-context',
  () =>
    jest.requireActual<{ default: unknown }>(
      'react-native-safe-area-context/jest/mock',
    ).default,
);

// MMKV swaps in an in-memory mock under Jest, but still imports Nitro's native
// bridge at load time. It only calls it lazily (never in tests), so a stub that
// fails loudly if it's ever reached is enough.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => {
      throw new Error('Native Nitro modules are unavailable in Jest.');
    },
  },
}));

// FlashList measures its native layout, which Jest doesn't have; its official
// setup mocks the measurements (a 400×900 viewport).
jest.requireActual<object>('@shopify/flash-list/jestSetup');

// NetInfo is a native module; the package ships a Jest mock.
jest.mock('@react-native-community/netinfo', () =>
  jest.requireActual<object>(
    '@react-native-community/netinfo/jest/netinfo-mock.js',
  ),
);

// TanStack Query keeps unused data for 24 hours, on a real timer (ADR-0011).
// Unref'd, its timers still fire, but can't keep Jest running after the tests.
const hasUnref = (timer: unknown): timer is { unref: () => void } =>
  typeof timer === 'object' &&
  timer !== null &&
  'unref' in timer &&
  typeof timer.unref === 'function';
const unref = <T>(timer: T): T => {
  if (hasUnref(timer)) timer.unref();
  return timer;
};
timeoutManager.setTimeoutProvider({
  setTimeout: (callback, delay) => unref(setTimeout(callback, delay)),
  clearTimeout: id => {
    clearTimeout(id);
  },
  setInterval: (callback, delay) => unref(setInterval(callback, delay)),
  clearInterval: id => {
    clearInterval(id);
  },
});

// Any request without a handler fails the test, so no test can hit the real network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
