import { setupServer } from 'msw/node';

/**
 * Shared MSW server for tests: the real API client code runs, only the network
 * is faked (ADR-0013). Tests add handlers with `server.use(...)`.
 */
export const server = setupServer();
