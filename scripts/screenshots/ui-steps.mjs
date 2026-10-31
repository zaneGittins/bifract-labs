// Scripted UI screenshots for markers that have no BQL fence above them.
// Each step navigates, waits, and returns the clip rectangle. Steps never
// change anything in Bifract: they only open pages and select items.

async function fractalId(env) {
  return env.page.evaluate(async (name) => {
    const r = await fetch('/api/v1/fractals', { credentials: 'include' });
    const d = await r.json();
    const list = d.data?.fractals || d.data || d.fractals || [];
    const f = (Array.isArray(list) ? list : []).find(x => x.name === name);
    return f && f.id;
  }, env.cfg.fractal);
}

async function open(env, hash, settle = 2500) {
  await env.page.goto(`${env.BASE}/${hash}`);
  await env.page.addStyleTag({ content: env.CLEAN_CSS });
  await env.page.waitForTimeout(settle);
  await env.page.mouse.move(0, 0);
}

// The content area to the right of the sidebar.
async function mainBox(env) {
  return env.page.evaluate(() => {
    const side = document.querySelector('aside, nav.sidebar, #sidebar, .sidebar');
    const x = side ? Math.ceil(side.getBoundingClientRect().right) : 228;
    // Stop above the status bar along the bottom edge.
    const bar = [...document.querySelectorAll('body *')].find(el => {
      const r = el.getBoundingClientRect();
      return r.bottom >= window.innerHeight - 1 && r.height < 40 && r.width > window.innerWidth * 0.9;
    });
    const bottom = bar ? Math.floor(bar.getBoundingClientRect().top) : window.innerHeight;
    return { x, y: 0, width: window.innerWidth - x, height: bottom };
  });
}

function below(box, el, pad = 16) {
  return { ...box, height: Math.min(box.height, Math.ceil(el.y + el.height + pad - box.y)) };
}

async function openModel(env, name) {
  const fid = await fractalId(env);
  await open(env, `#f/${fid}/models`);
  await env.page.getByText(name, { exact: true }).first().click();
  await env.page.waitForTimeout(4000);
  await env.page.mouse.move(0, 0);
  return mainBox(env);
}

// A model's stored rows: the All rows tab, so findings older than 7 days still show.
async function modelRows(env, name) {
  const box = await openModel(env, name);
  const all = env.page.getByText(/^All rows/).first();
  if (await all.count()) { await all.click(); await env.page.waitForTimeout(2500); }
  await env.page.mouse.move(0, 0);
  await env.page.waitForSelector('table:visible tbody tr', { timeout: 30000 });
  const rows = env.page.locator('table:visible tbody tr');
  const n = await rows.count();
  if (!n) throw new Error(`${name}: no rows`);
  return below(box, await rows.nth(Math.min(n, 12) - 1).boundingBox(), 20);
}

// Network models score on demand: Edit, Scores tab, a window that covers the lab.
async function modelScores(env, name) {
  const box = await openModel(env, name);
  await env.page.getByRole('button', { name: 'Edit', exact: true }).click();
  await env.page.waitForTimeout(2500);
  await env.page.getByText('Scores', { exact: true }).first().click();
  await env.page.waitForFunction(() => /pairs scored/i.test(document.body.innerText), null, { timeout: 120000 });
  // Pick the window after the editor settles, then wait for the rescore.
  await env.page.locator('select:visible').filter({ has: env.page.locator('option[value="30d"]') }).first()
    .selectOption(env.cfg.networkWindow || '30d');
  await env.page.waitForTimeout(6000);
  await env.page.waitForTimeout(1500);
  await env.page.mouse.move(0, 0);
  return box;
}

export const uiSteps = {
  'model-remote-tools': (env) => modelRows(env, 'remote_tools_first_seen'),
  'model-rmm-users': (env) => modelRows(env, 'rmm_users'),
  'model-beacons': (env) => modelScores(env, 'outbound_beacons'),
  'model-long-conn': (env) => modelScores(env, 'outbound_long_connections'),
};
