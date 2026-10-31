// Capture guide screenshots from a running Bifract with the lab loaded.
//
// Every `<!-- shot: id | caption | opts -->` marker in guide/<lab>/**.md that
// follows a ```bql fence is captured by running that exact query through a
// deep link. Markers without a fence are UI steps defined in ui-steps.mjs.
//
//   BIFRACT_URL=http://localhost:8080 BIFRACT_USER=admin BIFRACT_PASSWORD=... \
//   node scripts/screenshots/capture.mjs --lab 001 --out /tmp/shots [--only id,id]
//
// Then: python3 scripts/screenshots/optimize.py /tmp/shots guide/001/shots
//
// Fail-closed: a page whose text matches the blocklist is never saved.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { uiSteps } from './ui-steps.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const LAB = args.lab || '001';
const OUT = args.out || 'shots-out';
const ONLY = args.only ? new Set(args.only.split(',')) : null;
const BASE = (process.env.BIFRACT_URL || 'http://localhost:8080').replace(/\/+$/, '');
const USER = process.env.BIFRACT_USER || 'admin';
const PASS = process.env.BIFRACT_PASSWORD;
if (!PASS) throw new Error('set BIFRACT_PASSWORD');

const LABS = {
  '001': { fractal: 'bifract-labs-001', from: '2026-10-27T00:00:00Z', to: '2026-11-01T00:00:00Z' },
};
const cfg = LABS[LAB];

// Never publish these. Lowercase substrings or regexes, checked against visible text.
const BLOCK = [
  /ludus/i, /mirrorkin/i, /bell[\s_-]?jar/i, /47\.144\.42\.197/, /\/home\//i, /\bzane\b/i,
  /bifract_ingest_path/i, /proxmox/i, /\bqemu\b/i, /seabios/i, /ansible/i,
];

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const GUIDE = path.join(ROOT, 'guide', LAB);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith('.md') ? [path.join(dir, d.name)] : []);
}

function parseShots() {
  const shots = [];
  const marker = /^[ \t]*<!--\s*shot:\s*([a-z0-9-]+)\s*\|\s*(.*?)\s*(?:\|\s*([^|]*?))?\s*-->/gm;
  // The fence directly above a marker, closed at the same indent as it opened.
  const fenceBefore = /(^|\n)([ \t]*)```bql\n((?:(?!```)[\s\S])*?)\n\2```[ \t]*\n$/;
  for (const file of walk(GUIDE)) {
    const md = fs.readFileSync(file, 'utf8');
    for (const m of md.matchAll(marker)) {
      const f = md.slice(0, m.index).match(fenceBefore);
      const query = f ? f[3].split('\n').map(l => l.startsWith(f[2]) ? l.slice(f[2].length) : l).join('\n') : null;
      const opts = Object.fromEntries((m[3] || '').split(/\s+/).filter(Boolean).map(kv => {
        const [k, v] = kv.split('=');
        return [k, v === undefined ? true : (isNaN(+v) ? v : +v)];
      }));
      shots.push({ id: m[1], query, caption: m[2], opts, file: path.relative(ROOT, file) });
    }
  }
  return shots;
}

async function assertClean(page, id) {
  const text = await page.evaluate(() => document.body.innerText);
  for (const b of BLOCK) {
    if (b.test(text)) throw new Error(`blocked term ${b} visible in shot ${id}; not saving`);
  }
}

async function login(ctx) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login.html`);
  await page.fill('#loginUsername', USER);
  await page.fill('#loginPassword', PASS);
  await page.keyboard.press('Enter');
  await page.waitForURL(u => !String(u).includes('login'), { timeout: 15000 });
  return page;
}

function deepLink(query) {
  const p = new URLSearchParams({ q: query, fractal: cfg.fractal, from: cfg.from, to: cfg.to });
  return `${BASE}/go/search?${p}`;
}

// Hide chrome that adds nothing to a screenshot.
const CLEAN_CSS = `
  .status-bar, #statusBar, footer, .app-footer { display: none !important; }
  * { caret-color: transparent !important; }
`;

// Query results read better a little narrower; graphs and UI pages keep the full width.
const WIDE = { width: 1360, height: 860 };
const NARROW = { width: 1100, height: 860 };

async function captureQuery(page, shot) {
  await page.setViewportSize(shot.opts.graph ? WIDE : NARROW);
  await page.goto(deepLink(shot.query));
  await page.addStyleTag({ content: CLEAN_CSS });
  const graph = shot.opts.graph;
  if (graph) {
    await page.waitForSelector('canvas, svg.pgraph, .pgraph, #graphContainer', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(shot.opts.wait || 6000);
  } else {
    await page.waitForFunction(() => {
      const t = document.querySelector('#resultsTable');
      return t && (t.querySelector('tbody tr') || /no results|error/i.test(t.innerText));
    }, null, { timeout: 90000 });
    await page.waitForTimeout(shot.opts.wait || 800);
    const empty = await page.evaluate(() => {
      const t = document.querySelector('#resultsTable');
      return t.querySelector('tbody tr') ? null : t.innerText.slice(0, 200);
    });
    if (empty !== null) throw new Error(`query returned no rows: ${empty.replace(/\s+/g, ' ')}`);
  }
  if (shot.opts.click) {
    // click=N opens row N's detail drawer
    await page.click(`#resultsTable tbody tr:nth-child(${shot.opts.click})`);
    await page.waitForTimeout(1200);
  }
  await page.mouse.move(0, 0);
  await assertClean(page, shot.id);

  const view = await page.locator('#searchView').boundingBox();
  let bottom = view.y + view.height;
  if (!graph && !shot.opts.click) {
    const maxRows = shot.opts.rows || 14;
    const rows = page.locator('#resultsTable tbody tr');
    const n = await rows.count();
    if (n) {
      const last = await rows.nth(Math.min(n, maxRows) - 1).boundingBox();
      bottom = Math.min(bottom, last.y + last.height + 14);
    } else {
      const t = await page.locator('#resultsTable').boundingBox();
      bottom = Math.min(bottom, t.y + 80);
    }
  }
  return { x: view.x, y: view.y, width: view.width, height: Math.max(120, bottom - view.y) };
}

const shots = parseShots().filter(s => !ONLY || ONLY.has(s.id));
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 }, deviceScaleFactor: 2, colorScheme: 'dark' });
const page = await login(ctx);
const env = { BASE, cfg, page, ctx, assertClean, CLEAN_CSS };
let failed = 0;

for (const shot of shots) {
  try {
    let clip;
    if (shot.query) {
      clip = await captureQuery(page, shot);
    } else if (uiSteps[shot.id]) {
      await page.setViewportSize(shot.opts.narrow ? NARROW : WIDE);
      clip = await uiSteps[shot.id](env, shot);
      await assertClean(page, shot.id);
    } else {
      throw new Error(`no query fence and no UI step for ${shot.id}`);
    }
    await page.screenshot({ path: path.join(OUT, `${shot.id}.png`), clip });
    console.log(`ok   ${shot.id}  (${shot.file})`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${shot.id}: ${e.message.split('\n')[0]}`);
    // Debug view of the failure; never copied into the guide (optimize.py skips *.fail.png).
    await page.screenshot({ path: path.join(OUT, `${shot.id}.fail.png`) }).catch(() => {});
  }
}

await browser.close();
if (failed) {
  console.error(`${failed} shot(s) failed`);
  process.exit(1);
}
