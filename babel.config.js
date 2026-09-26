/**
 * Babel configuration.
 * `@/` path alias mirrors tsconfig `paths` (layers: ADR-0005).
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: { '@': './src' },
      },
    ],
  ],
};
