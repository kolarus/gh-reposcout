/**
 * `yarn brand:generate`: the app icons and the launch screen, all from the
 * emblem SVGs in assets/brand (ADR-0023, ADR-0010). The output is committed;
 * run it again after changing an SVG or a brand colour.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import {
  ADAPTIVE_EMBLEM_SHARE,
  ADAPTIVE_LAYER_DP,
  adaptiveIconXml,
  ANDROID_DENSITIES,
  appIconContents,
  colorResourceXml,
  IOS_EMBLEM_SHARE,
  LEGACY_ICON_DP,
  readPalette,
  restoreManifestComments,
  withDarkVariant,
} from './lib/brand.mts';
import { readRepoFile, ROOT } from './lib/repo.mts';

const EMBLEM = 'assets/brand/reposcout-emblem.svg';
const MONOCHROME = 'assets/brand/reposcout-emblem-monochrome.svg';
const ANDROID_RES = 'android/app/src/main/res';
const IOS_APP = 'ios/RepoScout';
/** The launch-screen logo, in dp / pt. The round badge fits Android 12+'s circular mask whole. */
const SPLASH_LOGO_WIDTH = 128;
/** The legacy icon's emblem share: a little margin, as launchers expect. */
const LEGACY_EMBLEM_SHARE = 0.92;

const color = readPalette(readRepoFile('src/shared/theme/tokens.ts'));
const BRAND_GREEN = color('green500');
// The app's own light and dark backgrounds, so the splash hands over to the
// first screen without a colour change (ADR-0010).
const SPLASH_LIGHT = color('neutral50');
const SPLASH_DARK = color('neutral950');
const BLACK = '#000000';

const file = (p: string) => path.join(ROOT, p);
const svg = (p: string) => readFileSync(file(p));

/** The SVG rasterised at `px`: density scales the vector itself, so every size is sharp. */
const rasterise = (source: Buffer, px: number) =>
  sharp(source, { density: (72 * px) / 512 })
    .resize(px, px)
    .png()
    .toBuffer();

/** A square PNG: the emblem centred at `share` of the size, on a colour or transparent. */
async function writeIcon(
  target: string,
  {
    source,
    size,
    share,
    background,
  }: { source: Buffer; size: number; share: number; background?: string },
): Promise<void> {
  const emblem = await rasterise(source, Math.round(size * share));
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: emblem, gravity: 'center' }]);
  mkdirSync(path.dirname(file(target)), { recursive: true });
  // App Store icons must be opaque; transparent layers keep their alpha.
  await (background === undefined ? canvas : canvas.flatten({ background }))
    .png()
    .toFile(file(target));
}

const writeText = (target: string, text: string) => {
  mkdirSync(path.dirname(file(target)), { recursive: true });
  writeFileSync(file(target), text);
};

async function androidIcons(): Promise<void> {
  const emblem = svg(EMBLEM);
  const monochrome = svg(MONOCHROME);
  for (const { name, scale } of ANDROID_DENSITIES) {
    const dir = `${ANDROID_RES}/mipmap-${name}`;
    const legacy = {
      source: emblem,
      size: LEGACY_ICON_DP * scale,
      share: LEGACY_EMBLEM_SHARE,
    };
    await writeIcon(`${dir}/ic_launcher.png`, legacy);
    await writeIcon(`${dir}/ic_launcher_round.png`, legacy);
    const layer = {
      size: ADAPTIVE_LAYER_DP * scale,
      share: ADAPTIVE_EMBLEM_SHARE,
    };
    await writeIcon(`${dir}/ic_launcher_foreground.png`, {
      ...layer,
      source: emblem,
    });
    await writeIcon(`${dir}/ic_launcher_monochrome.png`, {
      ...layer,
      source: monochrome,
    });
  }
  writeText(
    `${ANDROID_RES}/mipmap-anydpi-v26/ic_launcher.xml`,
    adaptiveIconXml,
  );
  writeText(
    `${ANDROID_RES}/mipmap-anydpi-v26/ic_launcher_round.xml`,
    adaptiveIconXml,
  );
  writeText(
    `${ANDROID_RES}/values/ic_launcher_background.xml`,
    colorResourceXml('ic_launcher_background', BRAND_GREEN),
  );
}

async function iosIcons(): Promise<void> {
  const dir = `${IOS_APP}/Images.xcassets/AppIcon.appiconset`;
  const icon = { size: 1024, share: IOS_EMBLEM_SHARE };
  await writeIcon(`${dir}/AppIcon.png`, {
    ...icon,
    source: svg(EMBLEM),
    background: BRAND_GREEN,
  });
  // Dark: transparent, so iOS draws its own dark backdrop behind the badge.
  await writeIcon(`${dir}/AppIcon-dark.png`, { ...icon, source: svg(EMBLEM) });
  // Tinted: iOS tints by brightness, so a white glyph on black.
  await writeIcon(`${dir}/AppIcon-tinted.png`, {
    ...icon,
    source: svg(MONOCHROME),
    background: BLACK,
  });
  writeText(
    `${dir}/Contents.json`,
    `${JSON.stringify(appIconContents, null, 2)}\n`,
  );
}

/**
 * The launch screen through bootsplash's generator (logo, BootTheme, the
 * storyboard), then the dark backgrounds it leaves to its paid licence.
 */
function splash(): void {
  const scratch = 'node_modules/.cache/bootsplash';
  execFileSync(
    'yarn',
    [
      'react-native-bootsplash',
      'generate',
      EMBLEM,
      '--platforms=android,ios',
      `--background=${SPLASH_LIGHT}`,
      `--logo-width=${String(SPLASH_LOGO_WIDTH)}`,
      // Its JS-side copies (for an animated hide) aren't used.
      `--assets-output=${scratch}`,
    ],
    { cwd: ROOT, stdio: 'inherit' },
  );
  rmSync(file(scratch), { recursive: true, force: true });

  const manifest = 'android/app/src/main/AndroidManifest.xml';
  writeText(manifest, restoreManifestComments(readRepoFile(manifest)));

  writeText(
    `${ANDROID_RES}/values-night/colors.xml`,
    colorResourceXml('bootsplash_background', SPLASH_DARK),
  );

  const colors = `${IOS_APP}/Colors.xcassets`;
  // bootsplash creates the catalog without the root file Xcode writes.
  writeText(
    `${colors}/Contents.json`,
    `${JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2)}\n`,
  );
  const colorSets = readdirSync(file(colors)).filter(name =>
    /^BootSplashBackground-.+\.colorset$/.test(name),
  );
  for (const colorSet of colorSets) {
    const contentsPath = `${colors}/${colorSet}/Contents.json`;
    const contents: unknown = JSON.parse(readRepoFile(contentsPath));
    if (typeof contents !== 'object' || contents === null) {
      throw new Error(`${contentsPath} isn't a JSON object.`);
    }
    writeText(
      contentsPath,
      `${JSON.stringify(withDarkVariant(contents, SPLASH_DARK), null, 2)}\n`,
    );
  }
}

await androidIcons();
await iosIcons();
splash();
console.log('✓ brand assets generated');
