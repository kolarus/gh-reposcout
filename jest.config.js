/**
 * Jest configuration (ADR-0013).
 * RN preset + our setup (MSW server lifecycle). `@/` alias comes from Babel.
 */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // MSW's exports map returns `null` for the `react-native` condition that the
    // RN Jest environment uses, so point its Node entry at the CommonJS build.
    // Scoped to MSW on purpose: adding the `node` condition globally would pull
    // Node builds of RN libraries into tests.
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  },
  transform: {
    // MSW's ESM-only runtime deps go through Babel too (see transformIgnorePatterns).
    '^.+\\.mjs$': 'babel-jest',
  },
  // Babel-transform React Native packages (any react-native*, @react-native*,
  // @react-navigation, @react-native-vector-icons, @shopify/flash-list; many
  // ship ES modules) and
  // MSW's ESM-only runtime deps: rettime, until-async, and the
  // @open-draft/deferred-promise v3 nested inside msw/node_modules, which is why
  // msw itself must be allowed (the pattern stops at the first node_modules/msw).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native[^/]*|@react-native[^/]*|@react-navigation|@react-native-vector-icons|@shopify/flash-list|msw|@open-draft|rettime|until-async)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/scripts/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.styles.ts',
    '!src/test/**',
  ],
};
