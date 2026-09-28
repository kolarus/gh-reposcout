/**
 * `node scripts/build-media.mts <frames dir> <screenshots dir> <docs/media dir>`
 * (`yarn media:android`, ADR-0021): joins the tour's frames into the README's
 * looping demo GIF, and sizes its screenshots for the README. `sharp` is
 * already a dev dependency (the brand assets), so nothing new is installed.
 */
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import sharp from 'sharp';

/** Frames are sampled at 10 fps and played back faster, keeping the GIF short. */
const FRAME_DELAY_MS = 60;
/** README screenshots: sharp on a phone-sized column, small in the repo. */
const SCREENSHOT_WIDTH = 540;
const SCREENSHOTS = ['search', 'details', 'saved', 'dark'] as const;

const [framesDir, screenshotsDir, mediaDir] = process.argv.slice(2);
if (
  framesDir === undefined ||
  screenshotsDir === undefined ||
  mediaDir === undefined
) {
  console.error(
    'usage: build-media.mts <frames dir> <screenshots dir> <docs/media dir>',
  );
  process.exit(2);
}

const frames = readdirSync(framesDir)
  .filter(name => name.endsWith('.png'))
  .sort()
  .map(name => join(framesDir, name));

const gif = await sharp(frames, { join: { animated: true } })
  .gif({
    delay: FRAME_DELAY_MS,
    loop: 0,
    effort: 10,
    // A flat UI looks best without dithering, and with a palette per frame
    // and no blending between frames: other settings saved ~0.5 MB but left
    // grain on light backgrounds and ghosts of the previous frame.
    dither: 0,
    interFrameMaxError: 0,
    reuse: false,
  })
  .toFile(join(mediaDir, 'demo.gif'));
console.log(
  `demo.gif: ${String(frames.length)} frames, ${(gif.size / 1024 / 1024).toFixed(1)} MB`,
);

mkdirSync(join(mediaDir, 'screens'), { recursive: true });
for (const name of SCREENSHOTS) {
  const out = await sharp(join(screenshotsDir, `${name}.png`))
    .resize({ width: SCREENSHOT_WIDTH })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(mediaDir, 'screens', `${name}.png`));
  console.log(`screens/${name}.png: ${String(Math.round(out.size / 1024))} KB`);
}
