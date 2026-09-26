// ESLint flat config. Rationale for each rule group lives in the ADRs:
// structure/boundaries ADR-0005, typing ADR-0004, styling ADR-0010,
// tooling ADR-0015, enforcement ADR-0022.
import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import jest from 'eslint-plugin-jest';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import testingLibrary from 'eslint-plugin-testing-library';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TS_FILES = ['**/*.{ts,tsx,mts}'];
const APP_FILES = ['src/**/*.{ts,tsx}'];
const TEST_FILES = ['**/*.test.{ts,tsx}', 'src/test/**', 'jest.setup.ts'];
const STYLE_FILES = ['src/**/*.styles.ts', 'src/shared/theme/**'];

/*
 * Restricted imports/syntax are defined once and filtered per override, because
 * ESLint overrides replace a rule's whole option list instead of merging it.
 */
const restrictedImportPaths = {
  flatList: {
    name: 'react-native',
    importNames: ['FlatList'],
    message: 'Use FlashList for lists (ADR-0009).',
  },
  image: {
    name: 'react-native',
    importNames: ['Image', 'ImageBackground'],
    message: 'Use the Avatar component from @/shared/ui (ADR-0009).',
  },
  text: {
    name: 'react-native',
    importNames: ['Text'],
    message: 'Use the Text component from @/shared/ui (ADR-0010).',
  },
  mmkv: {
    name: 'react-native-mmkv',
    message: 'MMKV instances are created only in @/shared/storage (ADR-0011).',
  },
};
const restrictedImportPatterns = [
  {
    group: ['react-native/*'],
    message:
      'No deep imports into react-native (strict TypeScript API, ADR-0002).',
  },
  {
    group: ['@react-native-vector-icons/*'],
    message: 'Use the Icon component from @/shared/ui (ADR-0010).',
  },
];
const noRestrictedImports = (...allowed) => [
  'error',
  {
    paths: Object.entries(restrictedImportPaths)
      .filter(([key]) => !allowed.includes(key))
      .map(([, value]) => value),
    patterns: restrictedImportPatterns.filter(
      p => !allowed.includes(p.group[0]),
    ),
  },
];

const restrictedSyntax = {
  styles: [
    {
      selector:
        "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
      message:
        'StyleSheet.create belongs in a sibling X.styles.ts file (ADR-0005, ADR-0010).',
    },
    {
      selector: "CallExpression[callee.name='makeStyles']",
      message:
        'makeStyles belongs in a sibling X.styles.ts file (ADR-0005, ADR-0010).',
    },
  ],
  jsxText: [
    {
      selector: 'JSXText[value=/\\S/]',
      message: 'User-facing copy comes from @/shared/i18n strings (ADR-0019).',
    },
  ],
};
const noRestrictedSyntax = (...allowed) => [
  'error',
  ...Object.entries(restrictedSyntax)
    .filter(([key]) => !allowed.includes(key))
    .flatMap(([, value]) => value),
];

/* ADR-0005 layers: app → screens → features → entities → shared. */
const LAYERS_BELOW = {
  app: ['screen', 'feature', 'entity', 'shared'],
  screen: ['feature', 'entity', 'shared'],
  feature: ['entity', 'shared'],
  entity: ['shared'],
  shared: ['shared'],
};
const boundaryPolicies = [
  // A layer may import the layers below it, only through a slice's public API.
  ...Object.entries(LAYERS_BELOW).map(([from, to]) => ({
    from: { element: { type: from } },
    allow: {
      to: { element: { types: to, fileInternalPath: 'index.ts' } },
    },
  })),
  // Inside one slice, anything goes (relative imports).
  ...Object.keys(LAYERS_BELOW).map(type => ({
    from: { element: { type } },
    allow: {
      to: {
        element: {
          type,
          captured: { slice: '{{from.element.captured.slice}}' },
        },
      },
    },
  })),
  // Test files may use the shared test helpers.
  {
    from: { file: { categories: 'test' } },
    allow: { to: { element: { type: 'test-support' } } },
  },
  {
    from: { element: { type: 'test-support' } },
    allow: { to: { element: { types: ['shared', 'test-support'] } } },
  },
];

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'android/',
      'ios/',
      'vendor/',
      'coverage/',
      'internal_docs/',
      '.yarn/',
      '**/build/',
    ],
  },

  js.configs.recommended,

  // Tool configs written in CommonJS (babel, metro, jest, react-native CLI).
  {
    files: ['*.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  // Native entry point (ES module, bundled by Metro).
  { files: ['index.js'], languageOptions: { sourceType: 'module' } },
  {
    files: ['*.mjs', 'scripts/**'],
    languageOptions: { globals: globals.node },
  },

  // TypeScript: strict, type-aware (ADR-0004).
  ...tseslint.configs.strictTypeChecked.map(c => ({ ...c, files: TS_FILES })),
  ...tseslint.configs.stylisticTypeChecked.map(c => ({
    ...c,
    files: TS_FILES,
  })),
  {
    files: TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `as const` stays allowed; every other assertion is banned.
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
    },
  },
  // node:test's describe/it return promises the test runner tracks itself.
  {
    files: ['scripts/**/*.test.mts'],
    rules: {
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            {
              from: 'package',
              name: ['describe', 'it', 'test'],
              package: 'node:test',
            },
          ],
        },
      ],
    },
  },

  // React + React Native + hooks (incl. React Compiler rules).
  {
    files: APP_FILES,
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    plugins: { react, 'react-native': reactNative },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'error',
      // `react-native/no-unused-styles` is deliberately off: styles live in a
      // sibling X.styles.ts, so the rule would report every style as unused.
    },
  },
  { files: APP_FILES, ...reactHooks.configs.flat['recommended-latest'] },

  // Imports: cycles + ordering, resolved through tsconfig paths.
  {
    files: TS_FILES,
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
      'import-x/internal-regex': '^@/',
    },
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Architecture boundaries (ADR-0005): layer direction, no same-layer slice
  // imports, other slices only through index.ts.
  {
    files: APP_FILES,
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'screen', pattern: 'src/screens/*', capture: ['slice'] },
        { type: 'feature', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'entity', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['slice'] },
        { type: 'test-support', pattern: 'src/test' },
      ],
      'boundaries/files': [{ category: 'test', pattern: '**/*.test.{ts,tsx}' }],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '{{from.element.types.[0]}} "{{from.element.captured.slice}}" may not import this ' +
            '{{to.element.types.[0]}} file. Layers import downward only ' +
            '(app → screens → features → entities → shared), never another slice ' +
            'of the same layer, and other slices only through their index.ts (ADR-0005).',
          policies: boundaryPolicies,
        },
      ],
      'boundaries/no-unknown-files': 'error',
    },
  },

  // Naming (ADR-0024): kebab-case folders, PascalCase components/styles,
  // camelCase modules and hooks.
  {
    files: APP_FILES,
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/': 'KEBAB_CASE' },
      ],
      'check-file/filename-naming-convention': [
        'error',
        {
          'src/**/*.tsx': 'PASCAL_CASE',
          'src/**/*.styles.ts': 'PASCAL_CASE',
          'src/**/!(*.styles).ts': 'CAMEL_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
    },
  },

  // Project rules: restricted imports, syntax and globals.
  {
    files: APP_FILES,
    rules: {
      'no-restricted-imports': noRestrictedImports(),
      'no-restricted-syntax': noRestrictedSyntax(),
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Network access goes through @/shared/api (ADR-0008).',
        },
      ],
      'no-console': 'error',
    },
  },
  {
    files: STYLE_FILES,
    rules: { 'no-restricted-syntax': noRestrictedSyntax('styles') },
  },
  {
    files: ['src/shared/ui/**'],
    rules: {
      'no-restricted-imports': noRestrictedImports(
        'text',
        'image',
        '@react-native-vector-icons/*',
      ),
    },
  },
  {
    files: ['src/shared/storage/**'],
    rules: { 'no-restricted-imports': noRestrictedImports('mmkv') },
  },
  { files: ['src/shared/api/**'], rules: { 'no-restricted-globals': 'off' } },
  { files: ['src/shared/monitoring/**'], rules: { 'no-console': 'off' } },
  {
    files: ['src/shared/i18n/**'],
    rules: { 'no-restricted-syntax': noRestrictedSyntax('jsxText') },
  },

  // eslint-disable comments must name the rule and say why (ADR-0022).
  eslintComments.recommended,
  {
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
    },
  },

  // Tests.
  {
    files: TEST_FILES,
    ...jest.configs['flat/recommended'],
    languageOptions: { globals: globals.jest },
  },
  { files: TEST_FILES, ...testingLibrary.configs['flat/react-native'] },
  {
    files: TEST_FILES,
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': noRestrictedSyntax('jsxText'),
    },
  },

  // Formatting is Prettier's job; keep it last.
  prettier,
);
