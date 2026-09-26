import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkArchitecture } from './architecture.mts';

const validTree = [
  'index.js',
  'babel.config.js',
  'src/app/App.tsx',
  'src/app/App.styles.ts',
  'src/test/server.ts',
  'src/entities/repo/index.ts',
  'src/entities/repo/model/types.ts',
  'src/entities/repo/ui/RepoCard.tsx',
  'src/entities/repo/ui/RepoCard.styles.ts',
  'src/features/save-repo/index.ts',
  'src/features/save-repo/store/savedRepos.ts',
  'src/screens/search/index.ts',
  'src/screens/search/SearchScreen.tsx',
  'src/screens/search/SearchScreen.styles.ts',
  'src/shared/api/index.ts',
  'src/shared/api/github/client.ts',
];

describe('checkArchitecture', () => {
  it('accepts a valid tree', () => {
    assert.deepEqual(checkArchitecture(validTree), []);
  });

  const cases: [string, string[], RegExp][] = [
    ['JS outside the allow-list', ['src/app/legacy.js'], /allow-list/],
    [
      'unknown layer',
      ['src/widgets/x/index.ts'],
      /may only contain the layers/,
    ],
    [
      'slice without index.ts',
      ['src/features/search-repos/model/params.ts'],
      /no index\.ts/,
    ],
    ['empty slice', ['src/entities/owner/index.ts'], /empty slice/],
    ['nested barrel', ['src/entities/repo/ui/index.ts'], /nested barrel/],
    [
      'unknown segment',
      ['src/features/save-repo/utils/x.ts'],
      /unknown segment "utils"/,
    ],
    [
      'code at a feature slice root',
      ['src/features/save-repo/helpers.ts'],
      /holds only index\.ts/,
    ],
    [
      'orphan styles file',
      ['src/entities/repo/ui/Orphan.styles.ts'],
      /without a sibling Orphan\.tsx/,
    ],
    [
      'unknown shared segment',
      ['src/shared/utils/index.ts', 'src/shared/utils/x.ts'],
      /unknown shared segment/,
    ],
    ['barrel outside a slice', ['src/app/index.ts'], /only at slice roots/],
  ];

  for (const [name, extra, expected] of cases) {
    it(`rejects: ${name}`, () => {
      const violations = checkArchitecture([...validTree, ...extra]);
      assert.ok(
        violations.some(v => expected.test(v)),
        `expected a violation matching ${String(expected)}, got:\n${violations.join('\n')}`,
      );
    });
  }
});
