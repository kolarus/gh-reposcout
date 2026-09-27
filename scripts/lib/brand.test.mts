import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  readPalette,
  restoreManifestComments,
  withDarkVariant,
} from './brand.mts';

describe('brand assets', () => {
  it('reads palette colours from the tokens source', () => {
    const color = readPalette(
      "export const palette = {\n  white: '#FFFFFF',\n  green500: '#1F7A55',\n} as const;",
    );
    assert.equal(color('green500'), '#1F7A55');
    assert.equal(color('white'), '#FFFFFF');
  });

  it('fails loudly when a token is missing', () => {
    const color = readPalette("white: '#FFFFFF'");
    assert.throws(() => color('green500'), /green500/);
  });

  it('adds a dark variant to a colour set, replacing an earlier one', () => {
    const light = {
      idiom: 'universal',
      color: { 'color-space': 'srgb', components: { red: '1.000' } },
    };
    const staleDark = {
      appearances: [{ appearance: 'luminosity', value: 'dark' }],
    };
    const result = withDarkVariant(
      { colors: [light, staleDark], info: { version: 1 } },
      '#0D100E',
    );

    assert.deepEqual(result, {
      colors: [
        light,
        {
          appearances: [{ appearance: 'luminosity', value: 'dark' }],
          color: {
            'color-space': 'srgb',
            components: {
              red: '0.051',
              green: '0.063',
              blue: '0.055',
              alpha: '1.000',
            },
          },
          idiom: 'universal',
        },
      ],
      info: { version: 1 },
    });
  });

  it('puts the deep-link comment back into the manifest, once', () => {
    const manifest =
      '<activity>\n  <intent-filter>\n    <action android:name="android.intent.action.MAIN" />\n  </intent-filter>\n  <intent-filter>\n    <action android:name="android.intent.action.VIEW" />\n  </intent-filter>\n</activity>\n';
    const restored = restoreManifestComments(manifest);

    assert.ok(
      restored.includes(
        '\n  <!-- Deep links: reposcout://repo/{owner}/{name} (ADR-0006) -->\n  <intent-filter>\n    <action android:name="android.intent.action.VIEW"',
      ),
    );
    assert.equal(restoreManifestComments(restored), restored);
  });
});
