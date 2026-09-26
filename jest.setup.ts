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
