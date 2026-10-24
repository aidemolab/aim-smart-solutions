/**
 * Business Process Automation video, scene S3: screen recording of the enquiry journey
 * (/business-enquiry/), 24s per format.
 *
 *   node video/automation/record.cjs [outDir]       (SITE=http://localhost:3002 by default)
 *
 * Why a local build and a stubbed submission: the live form is behind Cloudflare Turnstile,
 * which an automated browser must not get past. So the take runs on a local static build made
 * with Cloudflare's invisible always-pass TEST site key (1x00000000000000000000BB):
 *
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000BB npx next build
 *   npx serve@14.2.4 out -l 3002
 *
 * and the submit-enquiry call is answered with the exact success response the live function
 * returns for a Normal enquiry. No enquiry is saved and no email is sent. The steps panel shows
 * the three things the live function does (supabase/functions/submit-enquiry): save the enquiry,
 * email the customer, email the owner, with its real subjects and wording.
 *
 * Sync: the page starts under a black cover that is removed at take start (t=0). Find that cut
 * with ffmpeg blackdetect and trim there. Output: <outDir>/automation-<fmt>.webm.
 * Needs @playwright/test resolvable (e.g. NODE_PATH). FORMATS=1x1 limits the run.
 */
const path = require('node:path');
const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('@playwright/test')); }

const SITE = process.env.SITE || 'http://localhost:3002';
const OUT = path.resolve(process.argv[2] || 'video-out');
const FORMATS = [
  { name: '16x9', width: 1920, height: 1080, zoom: 0.9 },
  { name: '1x1', width: 1080, height: 1080, zoom: 0.85 },
].filter((f) => !process.env.FORMATS || process.env.FORMATS.split(',').includes(f.name));

// What the visitor types. Fictional person; example.com and the Ofcom drama range are reserved.
const FORM = { firstName: 'Sarah', businessName: 'Bright Smile Dental', email: 'sarah@example.com', mobile: '07700 900123' };
const ENQUIRY = 'Hi, could you set up online booking and reminder emails for our practice?';
// The live function's response for a Normal enquiry (callsEnabled is true on the live site).
const RESPONSE = { ok: true, emailSent: true, callStarted: false, ownerNotified: true, callsEnabled: true };

const STYLE = `
  ::-webkit-scrollbar { display:none !important; } * { scrollbar-width:none !important; }
  html { scroll-behavior:auto !important; zoom:var(--z); } .back-to-top { display:none !important; }
  #__cover { position:fixed; inset:0; background:#000; z-index:2147483647; }
  #__cursor { position:fixed; left:0; top:0; width:28px; height:28px; z-index:2147483646; pointer-events:none;
    transform:translate(-100px,-100px); filter:drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
  .__click { position:fixed; z-index:2147483645; pointer-events:none; width:44px; height:44px; margin:-22px 0 0 -22px;
    border-radius:50%; background:rgba(59,130,246,.35); border:2px solid rgba(59,130,246,.7); animation:__rip .6s ease-out forwards; }
  @keyframes __rip { from { transform:scale(.3); opacity:1 } to { transform:scale(1.4); opacity:0 } }
  #__steps { position:fixed; z-index:2147483600; background:#fff; color:#0B1F33; border-radius:22px; padding:26px 28px;
    box-shadow:0 30px 70px rgba(11,31,51,.28); border-top:5px solid #2563EB; font-family:Arial,Helvetica,sans-serif;
    opacity:0; transform:translateY(24px); transition:opacity .5s ease, transform .5s ease; }
  #__steps.in { opacity:1; transform:none; }
  #__steps h3 { margin:0 0 18px; font-size:30px; display:flex; align-items:center; gap:12px; }
  #__steps h3 span { font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#16A34A; background:#DCFCE7; padding:5px 10px; border-radius:999px; }
  .__st { display:flex; gap:16px; align-items:flex-start; padding:12px 0; border-top:1px solid #E2E8F0; opacity:.35; transition:opacity .35s; }
  .__st.done { opacity:1; }
  .__st i { flex:none; width:42px; height:42px; border-radius:50%; background:#E2E8F0; display:grid; place-items:center; transition:background .35s, transform .35s; transform:scale(.8); }
  .__st.done i { background:#16A34A; transform:scale(1); }
  .__st i svg { width:22px; height:22px; opacity:0; transition:opacity .2s; } .__st.done i svg { opacity:1; }
  .__st b { display:block; font-size:25px; } .__st small { display:block; margin-top:4px; font-size:19px; color:#64748B; }
  .__mail { margin-top:10px; padding:12px 14px; border-radius:12px; background:#F8FAFC; border:1px solid #E2E8F0; font-size:18px; line-height:1.4; color:#1E293B;
    max-height:0; overflow:hidden; padding-top:0; padding-bottom:0; border-width:0; transition:max-height .5s ease, padding .5s ease; }
  .__st.done .__mail { max-height:220px; padding-top:12px; padding-bottom:12px; border-width:1px; }
  .__mail em { font-style:normal; color:#64748B; }
`;
const TICK = '<svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const steps = (f) => `
  <h3>What happened automatically <span>In seconds</span></h3>
  <div class="__st" data-s="1"><i>${TICK}</i><div><b>Enquiry saved</b><small>${f.firstName}, ${f.businessName} · status: new</small></div></div>
  <div class="__st" data-s="2"><i>${TICK}</i><div><b>Confirmation emailed to ${f.firstName}</b>
    <div class="__mail"><em>Subject:</em> We have received your enquiry - AIM Smart Solutions<br>Hello ${f.firstName},<br>Thank you for contacting AIM Smart Solutions. We have received your enquiry and will get back to you within 24 hours.</div></div></div>
  <div class="__st" data-s="3"><i>${TICK}</i><div><b>Owner alerted with the full details</b>
    <div class="__mail"><em>Subject:</em> New enquiry - ${f.businessName} (${f.firstName})<br><em>Mobile</em> +447700900123 · <em>Urgency</em> Normal · <em>Acknowledgement email sent</em> Yes</div></div></div>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const fmt of FORMATS) {
    const ctx = await browser.newContext({ viewport: { width: fmt.width, height: fmt.height }, deviceScaleFactor: 1,
      recordVideo: { dir: OUT, size: { width: fmt.width, height: fmt.height } } });
    const page = await ctx.newPage();
    await page.route('**/functions/v1/submit-enquiry', async (route) => {
      const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({ status: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(RESPONSE) });
    });
    await page.addInitScript(({ style, zoom }) => {
      const install = () => {
        if (document.getElementById('__cursor')) return;
        document.documentElement.style.setProperty('--z', zoom);
        const s = document.createElement('style'); s.textContent = style; document.head.appendChild(s);
        const cover = document.createElement('div'); cover.id = '__cover'; document.body.appendChild(cover);
        const c = document.createElement('div'); c.id = '__cursor';
        c.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 2l7.5 19 2.6-7.6L21 10.8z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
        document.body.appendChild(c);
        document.addEventListener('mousemove', (e) => { c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`; }, true);
        document.addEventListener('mousedown', (e) => {
          const r = document.createElement('div'); r.className = '__click'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
          document.body.appendChild(r); setTimeout(() => r.remove(), 700);
        }, true);
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
    }, { style: STYLE, zoom: String(fmt.zoom) });

    await page.goto(`${SITE}/business-enquiry/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Coordinates below are viewport pixels (getBoundingClientRect already includes the zoom).
    const rect = (sel) => page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }, sel);
    const scrollBy = (dy, ms) => page.evaluate(([dy, ms]) => new Promise((done) => {
      const y0 = scrollY, t0 = performance.now(), ease = (p) => (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
      const step = (t) => { const p = Math.min(1, (t - t0) / ms); scrollTo(0, y0 + dy * ease(p)); p < 1 ? requestAnimationFrame(step) : done(); };
      requestAnimationFrame(step);
    }), [dy, ms]);
    const move = async (x, y, steps = 24) => page.mouse.move(x, y, { steps });

    // Before the take: fields 1-4 filled, form framed near the top.
    await page.fill('#first-name', FORM.firstName);
    await page.fill('#business-name', FORM.businessName);
    await page.fill('#email-address', FORM.email);
    await page.fill('#mobile-number', FORM.mobile);
    const form = await rect('form.enquiry-form');
    await page.evaluate((y) => scrollTo(0, y), Math.max(0, form.y - (fmt.name === '16x9' ? 90 : 80)));
    await move(fmt.width * 0.7, fmt.height * 0.55, 1);
    await page.waitForTimeout(600);

    // Take start (t=0): remove the cover.
    const T0 = Date.now();
    const at = async (s) => { const d = T0 + s * 1000 - Date.now(); if (d > 0) await page.waitForTimeout(d); };
    await page.evaluate(() => document.getElementById('__cover').remove());

    // 1.4s: click into the enquiry box and type.
    await at(1.2);
    const ta = await rect('#enquiry');
    await move(ta.x + ta.w * 0.45, ta.y + 40);
    await page.mouse.down(); await page.mouse.up();
    await page.keyboard.type(ENQUIRY, { delay: 32 });

    // ~5.5s: bring the button into view, then submit at 7.3s.
    await at(5.4);
    const btn0 = await rect('form.enquiry-form button[type=submit]');
    const targetBtnY = fmt.name === '16x9' ? 700 : 690;
    await scrollBy(btn0.y - targetBtnY, 900);
    const btn = await rect('form.enquiry-form button[type=submit]');
    await at(6.4);
    await move(btn.x + btn.w * 0.5, btn.y + btn.h * 0.5);
    await at(7.3);
    await page.mouse.down(); await page.mouse.up();
    await page.waitForSelector('.submission-message.success', { timeout: 15000 });
    console.log(`[${fmt.name}] success at ${((Date.now() - T0) / 1000).toFixed(2)}s`);
    await move(btn.x + btn.w * 0.5, btn.y + btn.h + 220, 18);

    // 9.0s: the steps panel. 16x9: over the left column. 1x1: over the form fields.
    await at(9.0);
    const box = fmt.name === '16x9' ? { left: 130, top: 110, width: 800 } : { left: 50, top: 96, width: 980 };
    await page.evaluate(([html, b]) => {
      const p = document.createElement('div'); p.id = '__steps'; p.innerHTML = html;
      Object.assign(p.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', zoom: String(1 / parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z'))) });
      document.body.appendChild(p); requestAnimationFrame(() => p.classList.add('in'));
    }, [steps(FORM), box]);
    const tick = (n) => page.evaluate((n) => document.querySelector(`#__steps [data-s="${n}"]`).classList.add('done'), n);
    await at(9.7); await tick(1);
    await at(11.2); await tick(2);
    await at(16.2); await tick(3);
    await at(24.6);

    const video = page.video();
    await ctx.close();
    const dest = path.join(OUT, `automation-${fmt.name}.webm`);
    fs.renameSync(await video.path(), dest);
    console.log(`Saved ${dest}`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
