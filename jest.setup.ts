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

// NetInfo is a native module; the package ships a Jest mock.
jest.mock('@react-native-community/netinfo', () =>
  jest.requireActual<object>(
    '@react-native-community/netinfo/jest/netinfo-mock.js',
  ),
);

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
