/**
 * Structural rules from ADR-0005 / ADR-0022 that ESLint can't express.
 * Pure: takes a list of repo-relative file paths, returns violations.
 */

/** The only JavaScript files allowed in a TypeScript-only codebase (ADR-0004). */
const JS_ALLOW_LIST: readonly string[] = [
  'index.js', // native entry point; Gradle plugin and Xcode bundle phase default to it
  'babel.config.js',
  'metro.config.js',
  'jest.config.js',
  'react-native.config.js',
  'eslint.config.mjs',
  'commitlint.config.mjs',
];

const LAYERS = ['app', 'screens', 'features', 'entities', 'shared', 'test'];
const SLICED_LAYERS = ['screens', 'features', 'entities'];
const SLICE_SEGMENTS = [
  'api',
  'model',
  'queries',
  'store',
  'hooks',
  'lib',
  'ui',
];
const SHARED_SEGMENTS = [
  'api',
  'ui',
  'theme',
  'lib',
  'storage',
  'config',
  'i18n',
  'monitoring',
];

const JS_FILE = /\.(c|m)?jsx?$/;

export function checkArchitecture(files: readonly string[]): string[] {
  const violations: string[] = [];
  const fileSet = new Set(files);

  for (const file of files) {
    if (JS_FILE.test(file) && !JS_ALLOW_LIST.includes(file)) {
      violations.push(
        `${file}: JavaScript file outside the allow-list; write TypeScript (ADR-0004).`,
      );
    }
  }

  const srcFiles = files.filter(f => f.startsWith('src/'));
  const slices = new Map<string, string[]>(); // "layer/slice" -> files inside

  for (const file of srcFiles) {
    const [, layer, slice, ...rest] = file.split('/');

    if (layer === undefined || slice === undefined || !LAYERS.includes(layer)) {
      violations.push(
        `${file}: src/ may only contain the layers ${LAYERS.join(', ')} (ADR-0005).`,
      );
      continue;
    }

    if (file.endsWith('.styles.ts')) {
      const component = file.replace(/\.styles\.ts$/, '.tsx');
      if (!fileSet.has(component)) {
        violations.push(
          `${file}: styles file without a sibling ${component.split('/').pop() ?? ''} (ADR-0005).`,
        );
      }
    }

    if (!SLICED_LAYERS.includes(layer) && layer !== 'shared') {
      if (file.endsWith('/index.ts')) {
        violations.push(
          `${file}: barrels exist only at slice roots (ADR-0005).`,
        );
      }
      continue;
    }

    if (rest.length === 0) {
      violations.push(
        `${file}: files belong inside a slice folder, not directly in src/${layer} (ADR-0005).`,
      );
      continue;
    }

    const key = `${layer}/${slice}`;
    slices.set(key, [...(slices.get(key) ?? []), rest.join('/')]);

    if (layer === 'shared' && !SHARED_SEGMENTS.includes(slice)) {
      violations.push(
        `${file}: unknown shared segment "${slice}"; allowed: ${SHARED_SEGMENTS.join(', ')} (ADR-0005).`,
      );
    }

    const inner = rest.join('/');
    if (inner !== 'index.ts' && inner.endsWith('index.ts')) {
      violations.push(
        `${file}: nested barrel; only the slice root has an index.ts (ADR-0005).`,
      );
    }

    if (SLICED_LAYERS.includes(layer) && rest.length > 1) {
      const segment = rest[0] ?? '';
      if (!SLICE_SEGMENTS.includes(segment)) {
        violations.push(
          `${file}: unknown segment "${segment}"; allowed: ${SLICE_SEGMENTS.join(', ')} (ADR-0005).`,
        );
      }
    }

    if ((layer === 'features' || layer === 'entities') && rest.length === 1) {
      const name = rest[0] ?? '';
      if (name !== 'index.ts' && !/\.test\.tsx?$/.test(name)) {
        violations.push(
          `${file}: a ${layer} slice root holds only index.ts; put code in a segment (${SLICE_SEGMENTS.join(', ')}) (ADR-0005).`,
        );
      }
    }
  }

  for (const [key, inner] of slices) {
    if (!inner.includes('index.ts')) {
      violations.push(
        `src/${key}: slice has no index.ts public API (ADR-0005).`,
      );
    }
    if (inner.every(f => f === 'index.ts')) {
      violations.push(`src/${key}: empty slice (only an index.ts) (ADR-0005).`);
    }
  }

  return violations;
}
