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
  async 'setup-analytics'(env) {
    await open(env, '#settings/platform');
    const head = env.page.getByText('Endpoint analytics', { exact: true }).first();
    await head.scrollIntoViewIfNeeded();
    await env.page.waitForTimeout(400);
    const h = await head.boundingBox();
    const sens = await env.page.getByText('Process graph sensitivity').first().boundingBox();
    return { x: h.x - 20, y: h.y - 18, width: 1112 + 40, height: sens.y + 60 - (h.y - 18) };
  },

  async 'setup-dataset'(env) {
    const fid = await fractalId(env);
    await open(env, `#f/${fid}/exchange`);
    await env.page.getByText('Lab 001: Meridian workstation intrusion').first().click();
    await env.page.waitForTimeout(1500);
    const box = await mainBox(env);
    // Stop above the definition block: a test mirror names its own fractal there.
    const def = await env.page.getByText('Definition', { exact: true }).first().boundingBox();
    const panel = { x: box.x + 8, y: 8, width: 772, height: box.height };
    return { ...panel, height: Math.ceil(def.y - 14 - panel.y) };
  },

  async 'setup-exchange'(env) {
    const fid = await fractalId(env);
    await open(env, `#f/${fid}/exchange/rmm-hunting`);
    const last = await env.page.getByText('Remote Management Tools', { exact: true }).first().boundingBox();
    const box = await mainBox(env);
    return below({ x: box.x + 8, y: 8, width: 772, height: box.height }, last, 40);
  },

  async 'setup-models'(env) {
    const fid = await fractalId(env);
    await open(env, `#f/${fid}/models`, 4000);
    const rows = env.page.locator('table:visible tbody tr');
    const n = await rows.count();
    const last = await rows.nth(Math.max(0, n - 1)).boundingBox();
    return below(await mainBox(env), last);
  },

  'model-remote-tools': (env) => modelRows(env, 'remote_tools_first_seen'),
  'model-rmm-users': (env) => modelRows(env, 'rmm_users'),
  'model-beacons': (env) => modelScores(env, 'outbound_beacons'),
  'model-long-conn': (env) => modelScores(env, 'outbound_long_connections'),
};
