/**
 * Pilot demo screen recording for the AIM Pharmaceutical app (~50s).
 *
 *   0-5s    Market Overview, hold
 *   5-11s   Product Opportunity, hover the top-ranked product
 *   11-18s  Pricing Simulator, raise the price slowly so the margin updates
 *   18-45s  AI assistant: type the question (~40ms/char), send, wait for the
 *           full answer, scroll slowly through it, hold 3s on its end
 *   45-50s  hold on the app (end card added later)
 *
 * Formats:
 *   16x9 -> 1920x1080 (website)
 *   1x1  -> 1080x1080 (LinkedIn), laid out at 720x720 and scaled x1.5 so the
 *           answer text is readable
 *
 * Each take asks the live AI exactly one question. A failed take stops the run
 * (no retry). MOCK_AI=1 replaces the AI call with a canned local reply for dry
 * runs only; never publish a mocked take.
 *
 * Output: <OUT_DIR>/pharma-demo-<fmt>.webm plus <fmt>.json with the trim
 * offset (time before the app was ready) and actual segment times. Convert:
 *   ffmpeg -ss <offset> -i pharma-demo-16x9.webm -t <end> -c:v libx264 -crf 18 \
 *          -r 30 -pix_fmt yuv420p -an pharma-demo-16x9.mp4
 * The 1x1 recording draws the 720px page in the top-left of the 1080 frame;
 * add -vf "crop=720:720:0:0,scale=1080:1080:flags=lanczos" for that format.
 * If the 16x9 MP4 comes out short, the offset is too large: find the first
 * page switch (5s mark) with ffmpeg scene detection and trim from there.
 *
 * Run: npx playwright test pharma-demo.spec.ts --workers=1 --retries=0
 * One format only: FORMATS=1x1
 */
import { test, type Browser, type Page, type Locator } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const APP_URL = 'https://aidemolab.github.io/aim-pharmaceutical-ai-demo/';
const AI_ENDPOINT = '**/functions/v1/pharma-openrouter-chat';
const OUT_DIR = process.env.OUT_DIR ?? path.resolve('video-out');
const MOCK_AI = process.env.MOCK_AI === '1';
const QUESTION = 'Which product should we pilot first and why?';
const SLOW_MO = 30; // ms added to every browser interaction
const TYPE_DELAY = 10; // + SLOW_MO ~= 40ms per character

const FORMATS = [
  { name: '16x9', width: 1920, height: 1080, scale: 1 },
  { name: '1x1', width: 720, height: 720, scale: 1.5 },
].filter((f) => !process.env.FORMATS || process.env.FORMATS.split(',').includes(f.name));

test.use({ launchOptions: { slowMo: SLOW_MO } });
test.describe.configure({ mode: 'serial', retries: 0 });

// Visible cursor, click highlight, hidden scrollbars.
const INIT_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return;
    const style = document.createElement('style');
    style.textContent = \`
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      * { scrollbar-width: none !important; }
      #__demo_cursor { position: fixed; left: 0 !important; top: 0 !important; width: 28px; height: 28px; z-index: 2147483647;
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

// Dry runs only (MOCK_AI=1).
const MOCK_ANSWER =
  'Based on the demo metrics, pilot **Paracetamol 500mg** first: it has the highest opportunity score (**63**) and sits in the Pain Relief category, where field interest is strongest.\n\n' +
  '- **Paracetamol 500mg** leads the ranking with a score of 63.\n' +
  '- **Ibuprofen 400mg** is the next candidate at 56, also in Pain Relief.\n' +
  '- **Metformin 850mg** ranks third at 50 and could follow later.\n\n' +
  'Suggested next step: run a small Paracetamol 500mg pilot and track quote and sample requests against the field benchmarks.';

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

/** Animated scroll of the window, or of a scroll container, using requestAnimationFrame. */
async function smoothScroll(page: Page, toY: number | 'bottom', ms: number, container?: Locator) {
  const handle = container ? await container.elementHandle() : null;
  await page.evaluate(
    ({ el, toY, ms }) =>
      new Promise<void>((resolve) => {
        const target = (el as HTMLElement | null) ?? document.scrollingElement!;
        // The app sets scroll-behavior: smooth; turn it off so our frames land exactly.
        target.style.scrollBehavior = 'auto';
        document.documentElement.style.scrollBehavior = 'auto';
        const start = target.scrollTop;
        const max = target.scrollHeight - target.clientHeight;
        const end = toY === 'bottom' ? max : Math.max(0, Math.min(max, toY as number));
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          target.scrollTop = start + (end - start) * e;
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { el: handle, toY, ms },
  );
}

/** Smoothly scroll the window so the element sits at `ratio` of the viewport height. */
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

async function record(browser: Browser, fmt: (typeof FORMATS)[number], videoDir: string) {
  const context = await browser.newContext({
    viewport: { width: fmt.width, height: fmt.height },
    deviceScaleFactor: fmt.scale,
    recordVideo: { dir: videoDir, size: { width: fmt.width * fmt.scale, height: fmt.height * fmt.scale } },
  });
  const created = Date.now();
  await context.addInitScript(INIT_SCRIPT);
  if (MOCK_AI) {
    await context.route(AI_ENDPOINT, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await new Promise((r) => setTimeout(r, 5000));
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': 'https://aidemolab.github.io', 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: MOCK_ANSWER }),
      });
    });
  }
  const page = await context.newPage();
  const marks: Record<string, number> = {};
  let aiCalls = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('pharma-openrouter-chat')) aiCalls++;
  });

  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.getByText('Market Overview').first().waitFor();
    await page.locator('#aim-demo-bar').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await dismissOverlays(page);
    const cursor = new Cursor(page, fmt.width * 0.62, fmt.height * 0.5);
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

    // 0-5s: Market Overview, hold.
    mark('overview');
    await holdUntil(5);

    // 5-11s: Product Opportunity, hover the top-ranked product.
    mark('opportunity');
    await cursor.click(nav(page, 'Opportunity'));
    await page.getByText('Product Opportunity').first().waitFor();
    await page.waitForTimeout(600);
    const topProduct = page.getByText('Paracetamol 500mg', { exact: true }).last(); // #1 in the ranked list
    await scrollElementTo(page, topProduct, 0.4, 1200);
    await page.waitForTimeout(200);
    await cursor.moveToLocator(topProduct, 24, 0.35, 0.5);
    await holdUntil(11);

    // 11-18s: Pricing Simulator, raise the price in small steps.
    mark('pricing');
    await smoothScroll(page, 0, 400);
    await cursor.click(nav(page, 'Pricing'));
    await page.getByText('Pricing and Margin Simulator').first().waitFor();
    await page.waitForTimeout(500);
    const priceBlock = page
      .locator('div')
      .filter({ has: page.getByText('Proposed Selling Price') })
      .filter({ has: page.locator('input[type=range]') })
      .last();
    const slider = priceBlock.locator('input[type=range]').last();
    await scrollElementTo(page, priceBlock, fmt.width < 1000 ? 0.12 : 0.25, 700);
    await page.waitForTimeout(150);
    const box = (await slider.boundingBox())!;
    const { value, min, max } = await slider.evaluate((el: HTMLInputElement) => ({
      value: +el.value, min: +el.min, max: +el.max,
    }));
    const pxPer = box.width / (max - min);
    let x = box.x + (value - min) * pxPer;
    const y = box.y + box.height / 2;
    await cursor.moveTo(x, y, 16);
    await page.mouse.down();
    const stepPx = 0.2 * pxPer; // ~£0.20 per step
    const narrow = fmt.width < 1000; // slider and Gross Margin card don't fit on one screen
    for (let i = 0; i < 12 && Date.now() < at(narrow ? 15.2 : 17.3); i++) {
      x += stepPx;
      await cursor.moveTo(x, y, 4);
      await page.waitForTimeout(330);
    }
    await page.mouse.up();
    marks.priceAfterDrag = +(await slider.inputValue());
    if (narrow) {
      // Bring the Gross Margin card into view and keep nudging the (focused) price slider.
      await scrollElementTo(page, page.getByText('GROSS MARGIN', { exact: true }).first(), 0.45, 700);
      await cursor.moveToLocator(page.getByText('GROSS MARGIN', { exact: true }).first(), 14, 0.5, 4);
      while (Date.now() < at(17.6)) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(300);
      }
    }
    marks.priceStart = value;
    marks.priceEnd = +(await slider.inputValue());
    await holdUntil(18);

    // 18-45s: AI assistant.
    mark('assistant');
    await smoothScroll(page, 0, 400);
    await cursor.click(nav(page, 'Assistant'));
    const input = page.getByPlaceholder('Ask a strategic advisory question...');
    await input.waitFor();
    await page.waitForTimeout(300);
    await cursor.click(input);
    await input.pressSequentially(QUESTION, { delay: TYPE_DELAY });
    await page.waitForTimeout(250);
    const bubbles = page.locator('div.rounded-tl-none');
    const before = await bubbles.count();
    mark('sent');
    await page.keyboard.press('Enter');
    await cursor.moveTo(fmt.width * 0.9, fmt.height * 0.55, 18); // cursor out of the way

    // Wait for the full answer, or stop on an error / limit message.
    const answer = bubbles.nth(before);
    const failure = page.locator('.bg-rose-50, [role=status]');
    const outcome = await Promise.race([
      answer.waitFor({ timeout: 60_000 }).then(() => 'answer' as const),
      failure.first().waitFor({ timeout: 60_000 }).then(() => 'failure' as const),
    ]).catch(() => 'timeout' as const);
    if (outcome !== 'answer') {
      const msg = outcome === 'failure' ? await failure.first().innerText() : 'no answer within 60s';
      throw new Error(`Assistant take failed: ${msg}`);
    }
    // Let the answer settle (the app smooth-scrolls to the bottom on a new message).
    let last = '';
    for (let i = 0; i < 20; i++) {
      const now = await answer.innerText();
      if (now === last && now.length > 40) break;
      last = now;
      await page.waitForTimeout(250);
    }
    mark('answer');
    await page.waitForTimeout(500);

    // Scroll slowly through the whole answer: start at its top, end at its bottom.
    const chat = answer.locator('xpath=ancestor::div[contains(@class,"overflow-y-auto")][1]');
    const answerTop = await answer.evaluate((el) => {
      const c = el.closest('.overflow-y-auto') as HTMLElement;
      return c.scrollTop + el.getBoundingClientRect().top - c.getBoundingClientRect().top - 12;
    });
    await smoothScroll(page, answerTop, 900, chat);
    await page.waitForTimeout(1200);
    const readMs = Math.min(14_000, Math.max(4_000, at(42) - Date.now() - 600));
    await smoothScroll(page, 'bottom', readMs, chat);
    mark('answer-end');
    await page.waitForTimeout(3000);

    // 45-50s: hold on the app.
    mark('hold');
    await holdUntil(50);
    await page.waitForTimeout(200);
    mark('end');

    if (aiCalls !== 1) throw new Error(`Expected exactly 1 AI request, saw ${aiCalls}`);
    return { page, context, offset, marks, answerText: last };
  } catch (e) {
    await context.close().catch(() => {});
    throw e;
  }
}

for (const fmt of FORMATS) {
  test(`pharma demo ${fmt.name}`, async ({ browser }) => {
    test.setTimeout(3 * 60_000);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const { page, context, offset, marks, answerText } = await record(browser, fmt, path.join(OUT_DIR, `raw-${fmt.name}`));
    const video = page.video()!;
    await context.close();
    const out = path.join(OUT_DIR, `pharma-demo-${fmt.name}.webm`);
    await video.saveAs(out);
    fs.writeFileSync(
      path.join(OUT_DIR, `${fmt.name}.json`),
      JSON.stringify({ offset, marks, mocked: MOCK_AI, answerText }, null, 2),
    );
    console.log(`[${fmt.name}] ${MOCK_AI ? 'MOCK ' : ''}saved ${out} offset=${offset.toFixed(2)}s marks=${JSON.stringify(marks)}`);
  });
}
