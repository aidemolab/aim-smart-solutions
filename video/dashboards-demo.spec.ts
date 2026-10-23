/**
 * Demo screen recordings (~40s) for the three live dashboard apps:
 * supplier risk, sales lead scoring and property investment.
 *
 *   0-5s    dashboard overview, hold
 *   5-12s   hover the ranking table, highlight the top item
 *   12-22s  click Add, type a realistic record (~40ms/char), save, show the
 *           new row with its score and rank
 *   22-35s  what-if panel: drag 2 sliders slowly (numbers count, rows re-rank,
 *           colours change), show the table, then click one scenario preset
 *   35-40s  hold on the result
 *
 * Formats (native, no scaling): 16x9 -> 1920x1080, 1x1 -> 1080x1080.
 *
 * Each take saves ONE record through the live demo-data function (the app
 * deletes visitor rows after 24h). A failed or rate-limited write stops the
 * run (no retry). MOCK_WRITE=1 fakes the write for dry runs only.
 *
 * Output: <OUT_DIR>/<app>-<fmt>.webm plus <app>-<fmt>.json with the trim
 * offset (time before the app was ready) and segment marks. Convert:
 *   ffmpeg -ss <offset> -i <app>-16x9.webm -t 40 -c:v libx264 -crf 18 \
 *          -r 30 -pix_fmt yuv420p -an <app>-16x9.mp4
 * The logged offset can be too large when the recorder starts late. Check it:
 * the page starts scrolling at exactly 5s, so the first scene change after ~3s
 * in the .webm, minus 5, is the true offset. Then MP4 times equal the marks.
 *
 * Run: npx playwright test dashboards-demo.spec.ts --workers=1 --retries=0
 * Filter: APPS=property FORMATS=1x1
 */
import { test, type Browser, type Page, type Locator } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT_DIR = process.env.OUT_DIR ?? path.resolve('video-out');
const MOCK_WRITE = process.env.MOCK_WRITE === '1';
const WRITE_ENDPOINT = '**/functions/v1/demo-data';
const SLOW_MO = 30;
const TYPE_DELAY = 10; // + SLOW_MO ~= 40ms per character

type Field = [key: string, value: string];
type AppCfg = {
  key: string;
  url: string;
  fields: Field[]; // typed in this order; selects are chosen, not typed
  newName: string; // text that identifies the new row
  sliders: { id: string; to: number }[];
  preset: string;
};

const APPS: AppCfg[] = [
  {
    key: 'supplier-risk',
    url: 'https://aidemolab.github.io/aim-supplier-risk-demo/',
    fields: [
      ['name', 'Northgate Components'],
      ['category', 'Electronics'],
      ['country', 'Taiwan'],
      ['spend', '420000'],
      ['delivery', '86.5'],
    ],
    newName: 'Northgate Components',
    sliders: [{ id: 'fx', to: 12 }, { id: 'delay', to: 18 }],
    preset: 'tariff-war',
  },
  {
    key: 'sales-leads',
    url: 'https://aidemolab.github.io/aim-sales-lead-scoring-demo/',
    fields: [
      ['company', 'Brightwater Logistics'],
      ['industry', 'Logistics'],
      ['contact', 'Sam Okafor'],
      ['budget_gbp', '85000'],
      ['fit_score', '88'],
    ],
    newName: 'Brightwater Logistics',
    sliders: [{ id: 'w-3', to: 50 }, { id: 'hot', to: 62 }],
    preset: 'quality-first',
  },
  {
    key: 'property',
    url: 'https://aidemolab.github.io/aim-property-investment-demo/',
    fields: [
      ['address', '14 Juniper Mews, Salford'],
      ['asking_price', '142000'],
      ['estimated_market_value', '156000'],
      ['monthly_rent', '1050'],
    ],
    newName: 'Juniper Mews', // the table shows the address without the house number
    sliders: [{ id: 'rate', to: 8 }, { id: 'empty', to: 3 }],
    preset: 'rent-downturn',
  },
].filter((a) => !process.env.APPS || process.env.APPS.split(',').some((k) => a.key.includes(k)));

const FORMATS = [
  { name: '16x9', width: 1920, height: 1080 },
  { name: '1x1', width: 1080, height: 1080 },
].filter((f) => !process.env.FORMATS || process.env.FORMATS.split(',').includes(f.name));

test.use({ launchOptions: { slowMo: SLOW_MO } });
test.describe.configure({ mode: 'serial', retries: 0 });

// Visible cursor, click highlight, hidden scrollbars, and a row highlight helper.
const INIT_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return;
    const style = document.createElement('style');
    style.textContent = \`
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      * { scrollbar-width: none !important; }
      html, body { scroll-behavior: auto !important; }
      #__demo_cursor { position: fixed; left: 0 !important; top: 0 !important; width: 28px; height: 28px; z-index: 2147483647;
        pointer-events: none; transform: translate(-100px, -100px); filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
      .__demo_click { position: fixed; z-index: 2147483646; pointer-events: none; width: 44px; height: 44px;
        margin: -22px 0 0 -22px; border-radius: 50%; background: rgba(59,130,246,.35);
        border: 2px solid rgba(59,130,246,.7); animation: __demo_ripple .6s ease-out forwards; }
      @keyframes __demo_ripple { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
      .__demo_hl { position: absolute; z-index: 40; pointer-events: none; border: 3px solid #F59E0B; border-radius: 10px;
        box-shadow: 0 0 0 6px rgba(245,158,11,.18); opacity: 0; transition: opacity .35s ease; }
      .__demo_hl.on { opacity: 1; }
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
  async click(loc: Locator, steps?: number) {
    await this.moveToLocator(loc, steps);
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

/** Smoothly scroll so the element's top sits at `ratio` of the viewport height. */
async function scrollTo(page: Page, loc: Locator, ratio: number, ms: number) {
  const box = await loc.boundingBox();
  if (!box) return;
  const { scrollY, vh } = await page.evaluate(() => ({ scrollY: window.scrollY, vh: window.innerHeight }));
  await smoothScroll(page, scrollY + box.y - vh * ratio, ms);
}

/** Amber outline around an element (document-positioned, fades in). */
async function highlight(loc: Locator) {
  await loc.evaluate((el) => {
    document.querySelectorAll('.__demo_hl').forEach((h) => h.remove());
    const b = el.getBoundingClientRect();
    // Clip to the visible part (wide tables scroll sideways on 1x1).
    const left = Math.max(b.left, 6), right = Math.min(b.right, document.documentElement.clientWidth - 6);
    const h = document.createElement('div');
    h.className = '__demo_hl';
    Object.assign(h.style, { left: left + scrollX - 4 + 'px', top: b.top + scrollY - 4 + 'px', width: right - left + 8 + 'px', height: b.height + 8 + 'px' });
    document.body.appendChild(h);
    requestAnimationFrame(() => h.classList.add('on'));
  });
}
const clearHighlight = (page: Page) =>
  page.evaluate(() => document.querySelectorAll('.__demo_hl').forEach((h) => h.classList.remove('on')));

/** Drag a range input's thumb slowly to `to` over roughly `ms`. */
async function dragSlider(page: Page, cursor: Cursor, slider: Locator, to: number, ms: number) {
  const box = (await slider.boundingBox())!;
  const { value, min, max } = await slider.evaluate((el: HTMLInputElement) => ({ value: +el.value, min: +el.min, max: +el.max }));
  const thumb = 10; // half the thumb width: the thumb centre travels inside the track by this much
  const xOf = (v: number) => box.x + thumb + ((v - min) / (max - min)) * (box.width - 2 * thumb);
  const y = box.y + box.height / 2;
  await cursor.moveTo(xOf(value), y, 16);
  await page.mouse.down();
  const steps = Math.max(10, Math.round(ms / 110));
  const t0 = Date.now();
  for (let i = 1; i <= steps; i++) {
    const x = xOf(value) + (xOf(to) - xOf(value)) * ease(i / steps);
    await page.mouse.move(x, y);
    cursor.x = x;
    const wait = t0 + (ms * i) / steps - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
  }
  await page.mouse.up();
  return { from: value, to: +(await slider.inputValue()) };
}

async function record(browser: Browser, app: AppCfg, fmt: (typeof FORMATS)[number], videoDir: string) {
  const context = await browser.newContext({
    viewport: { width: fmt.width, height: fmt.height },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: fmt.width, height: fmt.height } },
  });
  const created = Date.now();
  await context.addInitScript(INIT_SCRIPT);
  if (MOCK_WRITE) {
    await context.route(WRITE_ENDPOINT, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      const body = route.request().postDataJSON();
      await new Promise((r) => setTimeout(r, 600));
      const row = { ...body.record, id: crypto.randomUUID(), session_id: body.session, seed_key: null, created_at: new Date().toISOString() };
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ row }),
      });
    });
  }
  const page = await context.newPage();
  const marks: Record<string, number | string> = {};
  let writes = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('/functions/v1/demo-data')) writes++;
  });

  try {
    await page.goto(app.url, { waitUntil: 'networkidle' });
    await page.locator('#aim-demo-bar').waitFor();
    await page.locator('#btn-add:not([disabled])').waitFor({ timeout: 20_000 }); // live data loaded
    await page.evaluate(() => document.fonts.ready);
    const cursor = new Cursor(page, fmt.width * 0.62, fmt.height * 0.55);
    await page.mouse.move(cursor.x, cursor.y);
    await page.waitForTimeout(400);

    const t0 = Date.now();
    const offset = (t0 - created) / 1000;
    const at = (s: number) => t0 + s * 1000;
    const holdUntil = async (s: number) => {
      const ms = at(s) - Date.now();
      if (ms > 0) await page.waitForTimeout(ms);
    };
    const mark = (k: string) => (marks[k] = +((Date.now() - t0) / 1000).toFixed(2));

    // 0-5s: overview, hold (cursor drifts a little so the frame isn't frozen).
    mark('overview');
    await page.waitForTimeout(1500);
    await cursor.moveTo(fmt.width * 0.5, fmt.height * 0.45, 40);
    await holdUntil(5);

    // 5-12s: ranking table, hover rows, highlight the top item.
    mark('table');
    const table = page.locator('table').first();
    const rows = table.locator('tbody > tr').filter({ hasNot: page.locator('td[colspan]') }); // data rows only
    await scrollTo(page, table, 0.1, 1300);
    await page.waitForTimeout(200);
    await cursor.moveToLocator(rows.nth(2), 20, 0.3, 0.5);
    await page.waitForTimeout(500);
    await cursor.moveToLocator(rows.nth(1), 14, 0.3, 0.5);
    await page.waitForTimeout(400);
    await cursor.moveToLocator(rows.first(), 14, 0.3, 0.5);
    await highlight(rows.first());
    mark('topItem');
    await holdUntil(11.5);

    // 12-22s: add a record.
    mark('add');
    await clearHighlight(page);
    const addBtn = page.locator('#btn-add');
    await scrollTo(page, addBtn, 0.18, 600);
    await cursor.click(addBtn, 14);
    await page.locator('[role=dialog]').waitFor();
    await page.waitForTimeout(300);
    for (const [key, value] of app.fields) {
      const el = page.locator(`#field-${key}`);
      if ((await el.evaluate((e) => e.tagName)) === 'SELECT') {
        await cursor.moveToLocator(el, 8);
        await el.selectOption(value);
        await page.waitForTimeout(150);
        continue;
      }
      await cursor.click(el, 8);
      await page.keyboard.press('Control+A');
      await el.pressSequentially(value, { delay: TYPE_DELAY });
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(250);
    mark('save');
    await cursor.click(page.locator('#btn-save'), 14);
    const outcome = await Promise.race([
      page.locator('[role=dialog]').waitFor({ state: 'detached', timeout: 20_000 }).then(() => 'saved' as const),
      page.locator('[role=dialog] [role=alert]').waitFor({ timeout: 20_000 }).then(() => 'error' as const),
    ]).catch(() => 'timeout' as const);
    if (outcome !== 'saved') {
      const msg = outcome === 'error' ? await page.locator('[role=dialog] [role=alert]').innerText() : 'no response within 20s';
      throw new Error(`Write failed (stopping, no retry): ${msg}`);
    }
    const newRow = rows.filter({ hasText: app.newName }).first();
    await newRow.waitFor();
    mark('recordSaved');
    await scrollTo(page, newRow, 0.3, 800);
    await page.waitForTimeout(150);
    await highlight(newRow);
    await cursor.moveToLocator(newRow, 16, 0.3, 0.5);
    mark('recordAppears');
    marks.newRowText = (await newRow.innerText()).replace(/\s+/g, ' ').slice(0, 200);
    await holdUntil(22);

    // 22-35s: what-if panel.
    mark('whatif');
    await clearHighlight(page);
    // Collapse the new row's auto-opened details so the re-ranking stays in view.
    await cursor.click(newRow.locator('td').first(), 8);
    await page.waitForTimeout(350);
    const s1 = page.locator(`#${app.sliders[0].id}`);
    const s2 = page.locator(`#${app.sliders[1].id}`);
    const group = s1.locator('xpath=ancestor::div[contains(@class,"scn-body")][1]');
    await scrollTo(page, group, 0.08, 800);
    await page.waitForTimeout(200);
    mark('slider1');
    marks.slider1Range = JSON.stringify(await dragSlider(page, cursor, s1, app.sliders[0].to, 2000));
    await page.waitForTimeout(300);
    const b2 = (await s2.boundingBox())!;
    if (b2.y < 60 || b2.y > fmt.height - 80) await scrollTo(page, s2, 0.3, 500);
    mark('slider2');
    marks.slider2Range = JSON.stringify(await dragSlider(page, cursor, s2, app.sliders[1].to, 2000));
    await page.waitForTimeout(500);
    // Show the re-ranked table.
    await scrollTo(page, table, 0.08, 900);
    mark('reranked');
    await page.waitForTimeout(1000);
    const preset = page.locator(`[data-preset="${app.preset}"]`);
    await scrollTo(page, page.locator('#scenario-panel'), 0.07, 800);
    await cursor.click(preset, 16);
    mark('preset');
    await page.waitForTimeout(1100);
    // Result: scroll to the results strip and the table under it.
    await scrollTo(page, page.locator('.scn-results'), 0.12, 1000);
    await cursor.moveTo(fmt.width * 0.93, fmt.height * 0.6, 18);
    await holdUntil(35);

    // 35-40s: hold.
    mark('hold');
    await holdUntil(40.3);
    mark('end');

    if (writes !== 1) throw new Error(`Expected exactly 1 write, saw ${writes}`);
    return { page, context, offset, marks };
  } catch (e) {
    await context.close().catch(() => {});
    throw e;
  }
}

for (const app of APPS) {
  for (const fmt of FORMATS) {
    test(`${app.key} ${fmt.name}`, async ({ browser }) => {
      test.setTimeout(3 * 60_000);
      fs.mkdirSync(OUT_DIR, { recursive: true });
      const { page, context, offset, marks } = await record(browser, app, fmt, path.join(OUT_DIR, `raw-${app.key}-${fmt.name}`));
      const video = page.video()!;
      await context.close();
      const out = path.join(OUT_DIR, `${app.key}-${fmt.name}.webm`);
      await video.saveAs(out);
      fs.writeFileSync(path.join(OUT_DIR, `${app.key}-${fmt.name}.json`), JSON.stringify({ offset, marks, mocked: MOCK_WRITE }, null, 2));
      console.log(`[${app.key} ${fmt.name}] ${MOCK_WRITE ? 'MOCK ' : ''}saved ${out} offset=${offset.toFixed(2)}s marks=${JSON.stringify(marks)}`);
    });
  }
}
