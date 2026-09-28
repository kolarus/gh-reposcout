/**
 * Babel configuration.
 * React Compiler first, as its docs require: it must see the original source
 * (ADR-0014). `export * as ns` (used by zod v4) isn't in React Native's preset.
 * `@/` path alias mirrors tsconfig `paths` (layers: ADR-0005).
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'babel-plugin-react-compiler',
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: { '@': './src' },
      },
    ],
  ],
  env: {
    // Jest runs CommonJS: turn the lazily loaded screens' import() into
    // require(), so tests can open them through the real navigator. Metro
    // handles import() itself in the app.
    test: { plugins: ['@babel/plugin-transform-dynamic-import'] },
  },
};
