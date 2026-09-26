import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkVersions,
  readMarketingVersions,
  renderVersionModule,
  setMarketingVersion,
} from './version.mts';

const pbx = 'A\nMARKETING_VERSION = 1.0;\nB\nMARKETING_VERSION = 1.0;\n';

describe('version sync', () => {
  it('rewrites every MARKETING_VERSION', () => {
    assert.deepEqual(readMarketingVersions(setMarketingVersion(pbx, '2.3.4')), [
      '2.3.4',
      '2.3.4',
    ]);
  });

  it('accepts matching versions', () => {
    const synced = setMarketingVersion(pbx, '1.2.3');
    assert.deepEqual(
      checkVersions({
        packageVersion: '1.2.3',
        pbxproj: synced,
        generatedModule: renderVersionModule('1.2.3'),
      }),
      [],
    );
  });

  it('reports iOS and generated-module drift', () => {
    const violations = checkVersions({
      packageVersion: '1.2.3',
      pbxproj: pbx,
      generatedModule: undefined,
    });
    assert.match(violations.join('\n'), /MARKETING_VERSION/);
    assert.match(violations.join('\n'), /APP_VERSION \(missing\)/);
  });

  it('rejects a non-semver package version', () => {
    const violations = checkVersions({
      packageVersion: 'one',
      pbxproj: setMarketingVersion(pbx, 'one'),
      generatedModule: renderVersionModule('one'),
    });
    assert.match(violations.join('\n'), /not a semantic version/);
  });
});
