// Capture server: holds emulated tabs in the signed-in Chromium (CDP :9222).
// GET /open?v=he-phone&url=...  /shot?v=&name=  /snap?v=  /click?v=&role=&name=|&text=
//     /fill?v=&role=&name=&value=  /eval?v=&js=  /key?v=&key=  /goto?v=&url=
import http from 'node:http';
import { chromium } from 'playwright-core';

const OUT = process.argv[2];
const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];
const tabs = {};
const UA_PHONE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36';
const UA_DESK = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';

async function open(v, url) {
  const [lang, dev] = v.split('-');
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const phone = dev === 'phone';
  await cdp.send('Emulation.setDeviceMetricsOverride', phone
    ? { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }
    : { width: 1366, height: 800, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Emulation.setUserAgentOverride', {
    userAgent: phone ? UA_PHONE : UA_DESK,
    acceptLanguage: lang === 'he' ? 'he-IL,he' : 'en-US,en',
    platform: phone ? 'Android' : 'Linux',
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', phone ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await cdp.send('Emulation.setLocaleOverride', { locale: lang === 'he' ? 'he-IL' : 'en-US' });
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  tabs[v] = { page, cdp };
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  return `opened ${v}: ${page.url()}`;
}

// f=<substring>: act inside the first frame whose URL contains it (dialogs are iframes)
const tgt = (p, q) => q.get('f') ? p.frames().find((fr) => fr.url().includes(q.get('f'))) : p;

function loc(page, q) {
  page = tgt(page, q);
  if (q.get('role')) return page.getByRole(q.get('role'), { name: q.get('name'), exact: q.get('exact') === '1' });
  if (q.get('text')) return page.getByText(q.get('text'), { exact: q.get('exact') === '1' });
  return page.locator(q.get('sel'));
}

const handlers = {
  open: (q) => open(q.get('v'), q.get('url')),
  goto: async (q, p) => { await p.goto(q.get('url'), { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); return p.url(); },
  shot: async (q, p) => {
    await p.bringToFront(); await p.waitForTimeout(800);
    const f = `${OUT}/${q.get('name')}.${q.get('v').replace('-', '.')}.png`;
    await p.screenshot({ path: f, fullPage: q.get('full') === '1' });
    return f;
  },
  snap: async (q, p) => `${tgt(p, q).url()}\n` + await tgt(p, q).locator('body').ariaSnapshot(),
  frames: async (q, p) => p.frames().map((fr) => fr.url().slice(0, 120)).join('\n'),
  click: async (q, p) => { const l = loc(p, q); await l.nth(Number(q.get('n') || 0)).click({ timeout: 8000 }); await p.waitForTimeout(Number(q.get('wait') || 2500)); return p.url(); },
  fill: async (q, p) => { await loc(p, q).nth(Number(q.get('n') || 0)).fill(q.get('value'), { timeout: 8000 }); await p.waitForTimeout(1500); return 'ok'; },
  select: async (q, p) => { await loc(p, q).nth(0).selectOption({ label: q.get('value') }); await p.waitForTimeout(1500); return 'ok'; },
  type: async (q, p) => { await p.keyboard.type(q.get('value'), { delay: 60 }); await p.waitForTimeout(2000); return 'ok'; },
  key: async (q, p) => { await p.keyboard.press(q.get('key')); await p.waitForTimeout(2000); return 'ok'; },
  eval: async (q, p) => JSON.stringify(await tgt(p, q).evaluate(q.get('js'))),
  box: async (q, p) => JSON.stringify(await loc(p, q).nth(Number(q.get('n') || 0)).boundingBox()),
  close: async (q, p) => { await p.close(); delete tabs[q.get('v')]; return 'closed'; },
};

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const cmd = u.pathname.slice(1);
  try {
    const p = tabs[u.searchParams.get('v')]?.page;
    if (cmd !== 'open' && !p) throw new Error(`no tab ${u.searchParams.get('v')}`);
    res.end(String(await handlers[cmd](u.searchParams, p)) + '\n');
  } catch (e) { res.statusCode = 500; res.end(`ERR ${e.message.split('\n').slice(0, 6).join('\n')}\n`); }
}).listen(9333, '127.0.0.1', () => console.log('ready :9333'));
