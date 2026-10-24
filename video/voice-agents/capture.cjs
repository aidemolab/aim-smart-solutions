/**
 * Capture video/voice-agents/scenes.html frame by frame with Playwright (exact 30fps timing,
 * no real-time recording drift) and encode each format with ffmpeg.
 *
 *   node video/voice-agents/capture.cjs [outDir] [seconds]
 *
 * Writes <outDir>/voice-agents-16x9.mp4 (1920x1080) and voice-agents-1x1.mp4 (1080x1080),
 * silent, ready for video/finish.py. Needs the `playwright` (or `@playwright/test`) package
 * resolvable (e.g. NODE_PATH) and ffmpeg on PATH. FORMATS=1x1 limits the run.
 */
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');

let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('@playwright/test')); }

const OUT = path.resolve(process.argv[2] || 'video-out');
const SECONDS = Number(process.argv[3] || 47);
const FPS = 30;
const SCENES = pathToFileURL(path.join(__dirname, 'scenes.html')).href;
const FORMATS = [
  { name: '16x9', width: 1920, height: 1080 },
  { name: '1x1', width: 1080, height: 1080 },
].filter((f) => !process.env.FORMATS || process.env.FORMATS.split(',').includes(f.name));

(async () => {
  require('node:fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const fmt of FORMATS) {
    const page = await browser.newPage({ viewport: { width: fmt.width, height: fmt.height }, deviceScaleFactor: 1 });
    await page.goto(`${SCENES}?f=${fmt.name}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    const out = path.join(OUT, `voice-agents-${fmt.name}.mp4`);
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.round(SECONDS * FPS);
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.render(t), i / FPS);
      const buf = await page.screenshot({ type: 'png', animations: 'disabled' });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`[${fmt.name}] ${(i / FPS).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg exited ${c}`)))));
    await page.close();
    console.log(`Saved ${out}`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
