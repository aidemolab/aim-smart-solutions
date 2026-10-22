/**
 * Pilot demo screen recording for the AIM Pharmaceutical app.
 *
 * Records the same ~40s sequence twice:
 *   16x9 -> 1920x1080 (website)
 *   1x1  -> 1080x1080 (LinkedIn)
 *
 * Output: <OUT_DIR>/pharma-demo-<fmt>.webm plus <fmt>.json with the
 * trim offset (time before the app was ready) and actual segment times.
 * Convert to MP4 afterwards, e.g.:
 *   ffmpeg -ss <offset> -i pharma-demo-16x9.webm -c:v libx264 -crf 18 \
 *          -r 30 -pix_fmt yuv420p -an pharma-demo-16x9.mp4
 *
 * Run: npx playwright test pharma-demo.spec.ts --workers=1
 * Filter one format with: FORMATS=1x1
 */
import { test, type Browser, type Page, type Locator } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const APP_URL = 'https://aidemolab.github.io/aim-pharmaceutical-ai-demo/';
const OUT_DIR = process.env.OUT_DIR ?? path.resolve('video-out');
const QUESTION = 'Which product should we pilot first and why?';
const SLOW_MO = 30; // ms added to every browser interaction
const TYPE_DELAY = 5; // + SLOW_MO ~= 35ms per character

const FORMATS = [
  { name: '16x9', width: 1920, height: 1080 },
  { name: '1x1', width: 1080, height: 1080 },
].filter((f) => !process.env.FORMATS || process.env.FORMATS.split(',').includes(f.name));

test.use({ launchOptions: { slowMo: SLOW_MO } });
test.describe.configure({ mode: 'serial' });

// Visible cursor, click highlight, hidden scrollbars.
const INIT_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return;
    const style = document.createElement('style');
    style.textContent = \`
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      * { scrollbar-width: none !important; }
      #__demo_cursor { position: fixed; left: 0; top: 0; width: 28px; height: 28px; z-index: 2147483647;
        pointer-events: none; transform: translate(-100px, -100px); filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
      .__demo_click { position: fixed; z-index: 2147483646; pointer-events: none; width: 44px; height: 44px;
        margin: -22px 0 0 -22px; border-radius: 50%; background: rgba(59,130,246,.35);
        border: 2px solid rgba(59,130,246,.7); animation: __demo_ripple .6s ease-out forwards; }
      @keyframes __demo_ripple { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
    \`;
    document.head.appendChild(style);
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 2l7.5 19 2.6-7.6L21 10.8z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    document.addEventListener('mousemove', (e) => {
      c.style.transform = 'translate(' + (e.clientX - 3) + 'px,' + (e.clientY - 2) + 'px)';
    }, true);
    document.addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.className = '__demo_click';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 700);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
`;

class AssistantFailed extends Error {}

/** Smooth, eased cursor movement (no instant jumps). */
class Cursor {
  x: number;
  y: number;
  constructor(private page: Page, x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  async moveTo(x: number, y: number, steps = 22) {
    const sx = this.x, sy = this.y;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      await this.page.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e);
    }
    this.x = x;
    this.y = y;
  }
  async moveToLocator(loc: Locator, steps?: number, fx = 0.5, fy = 0.5) {
    const box = await loc.boundingBox();
    if (!box) throw new Error('No bounding box for target');
    await this.moveTo(box.x + box.width * fx, box.y + box.height * fy, steps);
  }
  async click(loc: Locator) {
    await this.moveToLocator(loc);
    await this.page.mouse.down();
    await this.page.waitForTimeout(80);
    await this.page.mouse.up();
  }
}

/** Animated window scroll using requestAnimationFrame. */
async function smoothScroll(page: Page, toY: number | 'bottom', ms: number) {
  await page.evaluate(
    ({ toY, ms }) =>
      new Promise<void>((resolve) => {
        const start = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const end = toY === 'bottom' ? max : Math.max(0, Math.min(max, toY as number));
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          window.scrollTo(0, start + (end - start) * e);
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { toY, ms },
  );
}

/** Smoothly scroll so the element sits at `ratio` of the viewport height. */
async function scrollElementTo(page: Page, loc: Locator, ratio: number, ms: number) {
  const box = await loc.boundingBox();
  if (!box) return;
  const { scrollY, vh } = await page.evaluate(() => ({ scrollY: window.scrollY, vh: window.innerHeight }));
  await smoothScroll(page, scrollY + box.y - vh * ratio, ms);
}

async function dismissOverlays(page: Page) {
  const btn = page.getByRole('button', { name: /^(accept|accept all|got it|ok|dismiss|close|agree)$/i });
  for (const b of await btn.all()) {
    if (await b.isVisible().catch(() => false)) await b.click({ timeout: 1000 }).catch(() => {});
  }
}

const nav = (page: Page, label: string) =>
  page.locator('button').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) });

/** Wait for the assistant's reply to the question to appear and settle. */
async function waitForAnswer(page: Page, timeoutMs = 60_000): Promise<string> {
  const read = () =>
    page.evaluate((q) => {
      const t = document.body.innerText;
      const i = t.lastIndexOf(q);
      if (i < 0) return '';
      return t
        .slice(i + q.length)
        .replace(/\s*Overview\s*Opportunity\s*Import\s*Pricing\s*Assistant\s*$/, '')
        .trim();
    }, QUESTION);
  const deadline = Date.now() + timeoutMs;
  let last = '';
  let stableSince = 0;
  while (Date.now() < deadline) {
    const now = await read();
    if (now.length > 80 && now === last) {
      if (!stableSince) stableSince = Date.now();
      if (Date.now() - stableSince > 600) break;
    } else {
      stableSince = 0;
    }
    last = now;
    await page.waitForTimeout(250);
  }
  if (last.length <= 80 || /rate.?limit|too many requests|\b429\b|error|unavailable|failed|try again later/i.test(last.slice(0, 300))) {
    throw new AssistantFailed(`Assistant did not answer properly: ${JSON.stringify(last.slice(0, 200))}`);
  }
  return last;
}

async function recordOnce(browser: Browser, fmt: (typeof FORMATS)[number], videoDir: string) {
  const context = await browser.newContext({
    viewport: { width: fmt.width, height: fmt.height },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: fmt.width, height: fmt.height } },
  });
  const created = Date.now();
  await context.addInitScript(INIT_SCRIPT);
  const page = await context.newPage();
  const marks: Record<string, number> = {};
  let ok = false;

  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.getByText('Market Overview').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await dismissOverlays(page);
    const cursor = new Cursor(page, fmt.width * 0.62, fmt.height * 0.45);
    await page.mouse.move(cursor.x, cursor.y);
    await page.waitForTimeout(300);

    const t0 = Date.now();
    const offset = (t0 - created) / 1000;
    const at = (s: number) => t0 + s * 1000;
    const holdUntil = async (s: number) => {
      const ms = at(s) - Date.now();
      if (ms > 0) await page.waitForTimeout(ms);
    };
    const mark = (k: string) => (marks[k] = +((Date.now() - t0) / 1000).toFixed(2));

    // 0-6s: Market Overview, hold still.
    mark('overview');
    await holdUntil(6);

    // 6-14s: slow scroll through the overview, then back to top.
    mark('scroll');
    await cursor.moveTo(fmt.width * 0.55, fmt.height * 0.55, 12);
    await smoothScroll(page, 'bottom', 3800);
    await page.waitForTimeout(600);
    await smoothScroll(page, 0, 2400);
    await holdUntil(14);

    // 14-22s: Product Opportunity, hover the top-ranked product.
    mark('opportunity');
    await cursor.click(nav(page, 'Opportunity'));
    await page.getByText('Product Opportunity').first().waitFor();
    await page.waitForTimeout(900);
    const topProduct = page.getByText('Paracetamol 500mg', { exact: true }).last(); // #1 in the ranked list
    await scrollElementTo(page, topProduct, 0.4, 1400);
    await page.waitForTimeout(300);
    await cursor.moveToLocator(topProduct, 26, 0.35, 0.5);
    await holdUntil(22);

    // 22-32s: Pricing Simulator, raise the price in small steps.
    mark('pricing');
    await smoothScroll(page, 0, 500);
    await cursor.click(nav(page, 'Pricing'));
    await page.getByText('Pricing and Margin Simulator').first().waitFor();
    await page.waitForTimeout(700);
    const priceBlock = page
      .locator('div')
      .filter({ has: page.getByText('Proposed Selling Price') })
      .filter({ has: page.locator('input[type=range]') })
      .last();
    const slider = priceBlock.locator('input[type=range]').last();
    await scrollElementTo(page, priceBlock, 0.25, 900);
    await page.waitForTimeout(200);
    const box = (await slider.boundingBox())!;
    const { value, min, max } = await slider.evaluate((el: HTMLInputElement) => ({
      value: +el.value, min: +el.min, max: +el.max,
    }));
    const pxPer = box.width / (max - min);
    let x = box.x + (value - min) * pxPer;
    const y = box.y + box.height / 2;
    await cursor.moveTo(x, y, 20);
    await page.mouse.down();
    const stepPx = 0.2 * pxPer; // ~£0.20 per step
    for (let i = 0; i < 12 && Date.now() < at(31.2); i++) {
      x += stepPx;
      await cursor.moveTo(x, y, 4);
      await page.waitForTimeout(380);
    }
    await page.mouse.up();
    await holdUntil(32);

    // 32-40s: AI assistant, type the question, wait for the answer, hold 2s.
    mark('assistant');
    await smoothScroll(page, 0, 400);
    await cursor.click(nav(page, 'Assistant'));
    const input = page.getByPlaceholder('Ask a strategic advisory question...');
    await input.waitFor();
    await page.waitForTimeout(300);
    await cursor.click(input);
    await input.pressSequentially(QUESTION, { delay: TYPE_DELAY });
    await page.waitForTimeout(200);
    mark('sent');
    await page.keyboard.press('Enter');
    await cursor.moveTo(fmt.width * 0.85, fmt.height * 0.6, 18); // move cursor off the answer
    await waitForAnswer(page);
    mark('answer');
    await page.waitForTimeout(2000);
    mark('end');

    ok = true;
    return { page, context, offset, marks };
  } finally {
    if (!ok) await context.close().catch(() => {});
  }
}

for (const fmt of FORMATS) {
  test(`pharma demo ${fmt.name}`, async ({ browser }) => {
    test.setTimeout(5 * 60_000);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const tmpDir = path.join(OUT_DIR, `raw-${fmt.name}`);

    let result;
    try {
      result = await recordOnce(browser, fmt, tmpDir);
    } catch (e) {
      if (!(e instanceof AssistantFailed)) throw e;
      console.log(`[${fmt.name}] ${e.message} - retrying once in 60s`);
      await new Promise((r) => setTimeout(r, 60_000));
      result = await recordOnce(browser, fmt, tmpDir); // a second failure fails the test
    }

    const { page, context, offset, marks } = result;
    const video = page.video()!;
    await context.close();
    const out = path.join(OUT_DIR, `pharma-demo-${fmt.name}.webm`);
    await video.saveAs(out);
    fs.writeFileSync(path.join(OUT_DIR, `${fmt.name}.json`), JSON.stringify({ offset, marks }, null, 2));
    console.log(`[${fmt.name}] saved ${out} offset=${offset.toFixed(2)}s marks=${JSON.stringify(marks)}`);
  });
}
