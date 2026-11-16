// Inquiry form -> email, as a Cloudflare Worker. Used as a site's
// wrangler.jsonc `main` (from its _vendor/ copy of this module); setup and the
// request contract: hugo-shared README, "Inquiry form".
//
// POST /api/inquiry  {subject, lang, dir, botcheck, fields: [{label, type, value, width}]}
//   -> {success: true, ref}: ref is a short reference number, also in the email subject
// Sends one email to env.INQUIRY_TO through the EMAIL send_email binding
// (Cloudflare Email Routing: free to a verified destination address).

import { render } from './email.js';

const PATH = '/api/inquiry';
const MAX_FIELDS = 40;
const MAX_LEN = 4000;
const WIDTHS = ['full', 'half', 'third'];

// Only the default export: the Workers runtime treats named exports as entry points.
export default { fetch: handle };

async function handle(request, env) {
  if (new URL(request.url).pathname !== PATH) return json({ success: false }, 404);
  if (request.method !== 'POST') return json({ success: false }, 405);
  // Same origin only: the form posts to its own site (production and PR previews alike).
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({ success: false }, 403);
  for (const k of ['INQUIRY_TO', 'INQUIRY_FROM']) {
    if (!env[k]) return json({ success: false, error: `${k} not set in wrangler.jsonc vars` }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'bad json' }, 400);
  }
  const ref = reference();
  if (body.botcheck) return json({ success: true, ref }); // honeypot: tell the bot it worked

  const fields = (Array.isArray(body.fields) ? body.fields : [])
    .slice(0, MAX_FIELDS)
    .map((f) => ({
      label: str(f?.label),
      type: str(f?.type),
      value: str(f?.value).trim(),
      width: WIDTHS.includes(f?.width) ? f.width : 'full',
    }))
    .filter((f) => f.label && f.value);
  if (!fields.length) return json({ success: false, error: 'no fields' }, 400);

  const title = str(body.subject) || 'New inquiry';
  const { html, text } = render({
    title,
    lang: /^[a-zA-Z-]{2,20}$/.test(body.lang) ? body.lang : 'en',
    // dir from the form; a form that doesn't send it gets rtl from Hebrew/Arabic labels
    dir: ['rtl', 'ltr'].includes(body.dir) ? body.dir : /[\u0590-\u08FF]/.test(fields.map((f) => f.label).join('')) ? 'rtl' : 'ltr',
    accent: /^#[0-9a-fA-F]{3,8}$/.test(env.INQUIRY_ACCENT) ? env.INQUIRY_ACCENT : undefined,
    countryCode: /^\d{1,4}$/.test(env.INQUIRY_COUNTRY_CODE) ? env.INQUIRY_COUNTRY_CODE : '',
    fields,
  });
  const replyTo = fields.find((f) => f.type === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value))?.value;

  try {
    await env.EMAIL.send({
      to: env.INQUIRY_TO,
      from: { email: env.INQUIRY_FROM, name: env.INQUIRY_FROM_NAME || title },
      subject: `${title} - ${fields[0].value} #${ref}`, // the first field: the visitor's name
      replyTo,
      html,
      text,
    });
  } catch (e) {
    console.error('inquiry send failed', e.code, e.message);
    return json({ success: false, code: e.code, error: e.message }, 502);
  }
  return json({ success: true, ref });
}

// Six digits: easy to read out on the phone; not unique, only a handle for one conversation.
const reference = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000);
const str = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).slice(0, MAX_LEN) : '');
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
