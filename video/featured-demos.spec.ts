/**
 * Demo screen recordings (~35s) for the three demos built into the service pages:
 *
 *   keywords     /services/sales-marketing/  AI Content & Keyword Generator
 *   training     /services/training/         5-minute AI Skills Taster
 *   consultancy  /services/ai-consultancy/   AI Opportunity Score
 *
 * Each take starts on the demo section: 0-5s overview, then the main step from 5s
 * (typing "bakery" / the four parts of a prompt / question 1), then the result,
 * held while the page is still.
 *
 * Formats (native, no scaling): 16x9 -> 1920x1080, 1x1 -> 1080x1080.
 *
 * keywords makes real calls (keyword-trends + content-generator, both rate limited):
 * one take per format. MOCK=1 fakes both for dry runs. The town and target customer
 * are filled in before the take starts, so only the business type is typed on camera.
 * The AI wait is recorded in full; marks.generate and marks.result let you cut it.
 *
 * Output: <OUT_DIR>/<demo>-<fmt>.webm plus <demo>-<fmt>.json with the logged offset
 * (check it against the 2px sync jump, see below), the marks (seconds from the take start) and the
 * on-screen rectangle of the result for zooming ({x, y, w, h} in video pixels).
 *
 * Run: npx playwright test featured-demos.spec.ts --workers=1 --retries=0
 * Filter: DEMOS=training FORMATS=1x1   Dry run: MOCK=1
 */
import { test, type Browser, type Page, type Locator } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SITE = process.env.SITE ?? 'https://aimsmartsolutions.tech';
const OUT_DIR = process.env.OUT_DIR ?? path.resolve('video-out');
const MOCK = process.env.MOCK === '1';
const SLOW_MO = 30;

const FORMATS = [
  { name: '16x9', width: 1920, height: 1080 },
  { name: '1x1', width: 1080, height: 1080 },
].filter((f) => !process.env.FORMATS || process.env.FORMATS.split(',').includes(f.name));

test.use({ launchOptions: { slowMo: SLOW_MO } });
test.describe.configure({ mode: 'serial', retries: 0 });

// Visible cursor, click ripple, hidden scrollbars and no floating "Back to top" button.
const INIT_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return;
    const style = document.createElement('style');
    style.textContent = \`
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      * { scrollbar-width: none !important; }
      html, body { scroll-behavior: auto !important; }
      .back-to-top { display: none !important; }
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

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // easeInOutQuad

/** Smooth, eased cursor movement (no instant jumps). */
class Cursor {
  constructor(private page: Page, public x: number, public y: number) {}
  async moveTo(x: number, y: number, steps = 22) {
    const sx = this.x, sy = this.y;
    for (let i = 1; i <= steps; i++) {
      const e = ease(i / steps);
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
  async click(loc: Locator, steps?: number, fx = 0.5, fy = 0.5) {
    await this.moveToLocator(loc, steps, fx, fy);
    await this.page.mouse.down();
    await this.page.waitForTimeout(80);
    await this.page.mouse.up();
  }
}

/** Animated window scroll using requestAnimationFrame. */
async function smoothScroll(page: Page, toY: number, ms: number) {
  await page.evaluate(
    ({ toY, ms }) =>
      new Promise<void>((resolve) => {
        const el = document.scrollingElement!;
        const start = el.scrollTop;
        const end = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, toY));
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          el.scrollTop = start + (end - start) * e;
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { toY, ms },
  );
}

/** Smoothly scroll so the element's top sits at `ratio` of the viewport height (ms = 0: jump). */
async function scrollTo(page: Page, loc: Locator, ratio: number, ms: number) {
  const box = await loc.boundingBox();
  if (!box) throw new Error('No bounding box to scroll to');
  const { scrollY, vh } = await page.evaluate(() => ({ scrollY: window.scrollY, vh: window.innerHeight }));
  const to = scrollY + box.y - vh * ratio;
  if (ms === 0) await page.evaluate((y) => window.scrollTo(0, y), to);
  else await smoothScroll(page, to, ms);
}

/** Bounding rectangle (viewport = video pixels) around one or more elements. */
async function rectOf(...locs: Locator[]) {
  const boxes = (await Promise.all(locs.map((l) => l.boundingBox()))).filter((b) => b !== null);
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.width)), btm = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: Math.round(x), y: Math.round(y), w: Math.round(r - x), h: Math.round(btm - y) };
}

type Ctx = {
  page: Page;
  cursor: Cursor;
  fmt: (typeof FORMATS)[number];
  root: Locator;
  holdUntil: (s: number) => Promise<void>;
  mark: (k: string) => number;
  marks: Record<string, unknown>;
};

type Demo = {
  key: string;
  path: string;
  root: string; // the demo app container
  prepare?: (page: Page, root: Locator) => Promise<void>; // runs before the take starts
  run: (c: Ctx) => Promise<void>;
};

// ---- keywords: mock responses for dry runs only ----
const MOCK_TRENDS = {
  ok: true, seed: 'bakery',
  top: [{ query: 'bakery near me', value: 100 }, { query: 'gluten free bakery', value: 32 }, { query: 'vegan bakery', value: 21 }, { query: 'bakery cakes', value: 15 }],
  rising: [],
};
const mockPost = (p: string) => ({ text: `Mock ${p} post for a Bolton bakery: fresh bread every morning from 7am, gluten free options and cakes made to order.`, hashtags: ['#Bolton', '#bakery'] });
const MOCK_AI = {
  ok: true,
  result: {
    posts: { linkedin: mockPost('LinkedIn'), facebook: mockPost('Facebook'), instagram: mockPost('Instagram') },
    plan: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, idea: 'Mock idea', format: 'Photo' })),
    keywords: { urgent: ['bakery near me'], research: ['gluten free bakery Bolton'], comparison: ['best bakery in Bolton'] },
  },
};
async function mockKeywords(page: Page) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  for (const [pattern, body, delay] of [['**/functions/v1/keyword-trends', MOCK_TRENDS, 1500], ['**/functions/v1/content-generator', MOCK_AI, 6000]] as const) {
    await page.route(pattern, async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      await new Promise((r) => setTimeout(r, delay));
      await route.fulfill({ status: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    });
  }
}

const DEMOS: Demo[] = [
  {
    key: 'keywords',
    path: '/services/sales-marketing/',
    root: '#content-generator',
    prepare: async (page, root) => {
      if (MOCK) await mockKeywords(page);
      await root.locator('input[name=town]').fill('Bolton');
      await root.locator('input[name=targetCustomer]').fill('Local families and office workers');
    },
    run: async ({ page, cursor, root, holdUntil, mark, marks }) => {
      const calls = { trends: 0, ai: 0 };
      page.on('request', (r) => {
        if (r.method() !== 'POST') return;
        if (r.url().includes('/keyword-trends')) calls.trends++;
        if (r.url().includes('/content-generator')) calls.ai++;
      });
      await holdUntil(5);
      mark('main');
      const business = root.locator('input[name=businessType]');
      await cursor.click(business, 18);
      await business.pressSequentially('bakery', { delay: 140 });
      await page.waitForTimeout(500);
      await cursor.click(root.locator('#gen-submit'), 18);
      mark('generate');
      await root.locator('.gen-results').waitFor({ timeout: 120_000 });
      const result = mark('result');
      marks.source = (await root.locator('[data-source]').first().getAttribute('data-source')) ?? 'none';
      await page.waitForTimeout(700);
      // Trends first (hold), then the posts (hold).
      const trends = root.locator('[data-source]').first();
      await scrollTo(page, root.locator('h4', { hasText: 'Real UK search trends' }), 0.12, 1300);
      await cursor.moveToLocator(trends, 18, 0.75, 0.6);
      mark('trendsStill');
      marks.trendsRect = await rectOf(trends);
      await holdUntil(result + 9);
      await scrollTo(page, root.locator('h4', { hasText: 'Social posts' }), 0.1, 1300);
      await cursor.moveToLocator(root.locator('.gen-posts'), 18, 0.85, 0.85);
      mark('postsStill');
      marks.postsRect = await rectOf(root.locator('.gen-posts'));
      await holdUntil(result + 19);
      marks.calls = JSON.stringify(calls);
    },
  },
  {
    key: 'training',
    path: '/services/training/',
    root: '.demo-app.taster',
    run: async ({ page, cursor, root, holdUntil, mark, marks }) => {
      await holdUntil(5);
      mark('main');
      const parts = root.locator('.prompt-parts > div');
      await scrollTo(page, root.locator('.lesson-step').first(), 0.1, 1600);
      for (let i = 0; i < 4; i++) {
        await cursor.moveToLocator(parts.nth(i), 20, 0.5, 0.4);
        await page.waitForTimeout(700);
      }
      await holdUntil(11);
      mark('beforeAfter');
      await scrollTo(page, root.locator('.lesson-step').nth(1), 0.1, 1300);
      await cursor.moveToLocator(root.locator('.before-after figure').first(), 20, 0.5, 0.4);
      await page.waitForTimeout(1500);
      await cursor.moveToLocator(root.locator('.before-after figure.is-after'), 24, 0.5, 0.4);
      await holdUntil(17);
      const quiz = root.locator('.quiz-list > li');
      await scrollTo(page, root.locator('.lesson-step').nth(2), 0.08, 1200);
      mark('quiz');
      const answers = [2, 3, 1];
      for (let i = 0; i < 3; i++) {
        if (i > 0) await scrollTo(page, quiz.nth(i), 0.18, 900);
        await page.waitForTimeout(500);
        await cursor.click(quiz.nth(i).locator('label').nth(answers[i]), 20, 0.15, 0.5);
        await quiz.nth(i).locator('.quiz-feedback').waitFor();
        await page.waitForTimeout(1200);
      }
      const result = root.locator('.taster-result');
      await result.waitFor();
      await scrollTo(page, quiz.nth(2), 0.12, 1000);
      await cursor.moveToLocator(result, 18, 0.9, 0.3);
      mark('resultStill');
      marks.resultRect = await rectOf(quiz.nth(2).locator('.quiz-feedback'), result);
      marks.resultText = (await result.innerText()).replace(/\s+/g, ' ').slice(0, 120);
      await holdUntil(+marks.resultStill! + 8);
    },
  },
  {
    key: 'consultancy',
    path: '/services/ai-consultancy/',
    root: '#demo .demo-app',
    run: async ({ page, cursor, root, holdUntil, mark, marks }) => {
      const picks = ['5 to 20', 'The next working day', 'By hand, after emails to get the details', 'Phone or email back-and-forth',
        '11 to 20', 'Spread across many spreadsheets and systems', 'Curious, but not really started'];
      const qs = root.locator('.quiz-list > li');
      await holdUntil(5);
      mark('main');
      for (let i = 0; i < picks.length; i++) {
        const box = (await qs.nth(i).boundingBox())!;
        const vh = page.viewportSize()!.height;
        if (box.y < 90 || box.y + box.height > vh - 40) await scrollTo(page, qs.nth(i), 0.22, 700);
        await page.waitForTimeout(250);
        await cursor.click(qs.nth(i).locator('label', { hasText: picks[i] }), 18, 0.2, 0.5);
        await page.waitForTimeout(650);
      }
      const submit = root.locator('button[type=submit]');
      await scrollTo(page, submit, 0.6, 700);
      await cursor.click(submit, 18);
      const result = root.locator('.score-result');
      await result.waitFor();
      mark('result');
      await page.waitForTimeout(300);
      await scrollTo(page, result, 0.1, 900);
      await cursor.moveToLocator(result.locator('.score-services'), 18, 0.95, 1.1);
      mark('resultStill');
      marks.resultRect = await rectOf(result);
      marks.score = (await result.locator('.score-number').innerText()).trim();
      await holdUntil(+marks.resultStill! + 11);
    },
  },
].filter((d) => !process.env.DEMOS || process.env.DEMOS.split(',').includes(d.key));

async function record(browser: Browser, demo: Demo, fmt: (typeof FORMATS)[number], videoDir: string) {
  const context = await browser.newContext({
    viewport: { width: fmt.width, height: fmt.height },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: fmt.width, height: fmt.height } },
  });
  await context.addInitScript(INIT_SCRIPT);
  const created = Date.now();
  const page = await context.newPage();
  const marks: Record<string, unknown> = {};
  try {
    await page.goto(SITE + demo.path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const root = page.locator(demo.root).first();
    await root.waitFor();
    if (demo.prepare) await demo.prepare(page, root);
    await scrollTo(page, root, 0.1, 0);
    const cursor = new Cursor(page, fmt.width * 0.62, fmt.height * 0.55);
    await page.mouse.move(cursor.x, cursor.y);
    await page.waitForTimeout(800);

    // Sync point: the page jumps 2px at t0 (invisible to viewers). The logged offset
    // can be wrong when the recorder starts late, so trim from the one frame where the
    // whole page shifts by exactly 2px (compare row profiles of consecutive frames).
    await page.evaluate(() => window.scrollBy(0, 2));
    const t0 = Date.now();
    const offset = (t0 - created) / 1000;
    const holdUntil = async (s: number) => {
      const ms = t0 + s * 1000 - Date.now();
      if (ms > 0) await page.waitForTimeout(ms);
    };
    const mark = (k: string) => (marks[k] = +((Date.now() - t0) / 1000).toFixed(2)) as number;

    // 0-5s: overview (the cursor drifts a little so the frame is not frozen).
    mark('overview');
    await page.waitForTimeout(1200);
    await cursor.moveTo(fmt.width * 0.55, fmt.height * 0.5, 40);
    await demo.run({ page, cursor, fmt, root, holdUntil, mark, marks });
    await page.waitForTimeout(300);
    mark('end');
    return { page, context, offset, marks };
  } catch (e) {
    await context.close().catch(() => {});
    throw e;
  }
}

for (const demo of DEMOS) {
  for (const fmt of FORMATS) {
    test(`${demo.key} ${fmt.name}`, async ({ browser }) => {
      test.setTimeout(4 * 60_000);
      fs.mkdirSync(OUT_DIR, { recursive: true });
      const { page, context, offset, marks } = await record(browser, demo, fmt, path.join(OUT_DIR, `raw-${demo.key}-${fmt.name}`));
      const video = page.video()!;
      await context.close();
      const out = path.join(OUT_DIR, `${demo.key}-${fmt.name}.webm`);
      await video.saveAs(out);
      fs.writeFileSync(path.join(OUT_DIR, `${demo.key}-${fmt.name}.json`), JSON.stringify({ offset, marks, mocked: MOCK }, null, 2));
      console.log(`[${demo.key} ${fmt.name}] ${MOCK ? 'MOCK ' : ''}saved ${out} offset=${offset.toFixed(2)}s marks=${JSON.stringify(marks)}`);
    });
  }
}
