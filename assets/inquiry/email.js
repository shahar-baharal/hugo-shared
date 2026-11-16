// Inquiry email template: form fields in, { html, text } out. Pure, no I/O,
// so it runs in the Worker and in Node (tools/inquiry/preview.js).
//
// Layout: "fluid-hybrid" cells (inline-block + max-width): a field's `width`
// (full | half | third, the same value the form uses) sets its cell, so short
// fields share a row on wide screens and stack on phones without any CSS
// support. One media query (progressive enhancement; Gmail keeps it) then
// widens stacked cells to the full width.
// Direction follows `dir`, so right-to-left forms read right-to-left.

const WIDTH = 600; // email body, px
const PAD = 16;
const INNER = WIDTH - 2 * PAD;
const CELL = { full: INNER, half: INNER / 2, third: INNER / 3 };

/**
 * @param {object} m
 * @param {string} m.title    heading (the subject, without the name)
 * @param {string} [m.lang]   e.g. "he-IL": date format
 * @param {"rtl"|"ltr"} [m.dir]
 * @param {string} [m.accent] hex color for the heading and links
 * @param {string} [m.countryCode] digits, e.g. "972": local phone numbers -> WhatsApp links
 * @param {{label:string,type?:string,value:string,width?:string}[]} m.fields  filled-in fields, in order
 */
export function render({ title, lang = 'en', dir = 'ltr', accent = '#1f2937', countryCode = '', fields }) {
  const align = dir === 'rtl' ? 'right' : 'left';
  const cells = fields.map((f) => cell(f, { lang, accent, countryCode, align })).join('');
  const html =
    `<!doctype html><html lang="${esc(lang)}" dir="${dir}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<style>@media (max-width:${WIDTH}px){.cell{max-width:100%!important}}</style></head>` +
    `<body dir="${dir}" style="margin:0;padding:0;background:#f3f4f6">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td align="center" style="padding:16px 8px">` +
    `<table role="presentation" dir="${dir}" width="100%" cellpadding="0" cellspacing="0" style="max-width:${WIDTH}px;border-collapse:collapse;background:#ffffff;border-radius:12px">` +
    `<tr><td dir="${dir}" style="padding:${PAD}px ${PAD}px 4px;text-align:${align};font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:${accent}">${esc(title)}</td></tr>` +
    // font-size:0 removes the gaps whitespace would leave between inline-block cells
    `<tr><td dir="${dir}" style="padding:0 ${PAD - 8}px ${PAD}px;text-align:${align};font-size:0">${cells}</td></tr>` +
    `</table></td></tr></table></body></html>`;
  const mark = dir === 'rtl' ? '‏' : ''; // keeps each plain-text line right-to-left
  const text = [title, ...fields.map((f) => `${mark}${f.label}:\n${mark}${display(f, lang)}`)].join('\n\n');
  return { html, text };
}

function cell(f, { lang, accent, countryCode, align }) {
  const max = Math.floor(CELL[f.width] || CELL.full);
  return `<div class="cell" style="display:inline-block;vertical-align:top;width:100%;max-width:${max}px;text-align:${align}">` +
    `<div style="margin:0 8px;padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif">` +
    `<div style="font-size:13px;line-height:18px;color:#6b7280">${esc(f.label)}</div>` +
    `<div style="font-size:17px;line-height:24px;color:#111827">${value(f, { lang, accent, countryCode })}</div>` +
    `</div></div>`;
}

function value(f, { lang, accent, countryCode }) {
  const v = esc(display(f, lang));
  const link = (href, text, color = accent) => `<a href="${esc(href)}" dir="ltr" style="color:${color}">${text}</a>`;
  if (f.type === 'tel') {
    const wa = waNumber(f.value, countryCode);
    return link(`tel:${f.value.replace(/[^\d+]/g, '')}`, v) +
      (wa ? ` <span style="color:#9ca3af">·</span> ${link(`https://wa.me/${wa}`, 'WhatsApp', '#128c7e')}` : '');
  }
  if (f.type === 'email') return link(`mailto:${f.value}`, v);
  return v.replace(/\n/g, '<br>');
}

/** The value as shown: dates in the form's locale (he-IL: 10.02.2027). */
export function display(f, lang) {
  if (f.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(f.value)) {
    const [y, m, d] = f.value.split('-').map(Number);
    try {
      return new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(y, m - 1, d)));
    } catch {
      return f.value;
    }
  }
  return f.value;
}

/** wa.me wants digits with the country code: "+972 50…" or, with countryCode "972", "050…". */
function waNumber(phone, countryCode) {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) return digits;
  if (countryCode && digits.startsWith('0')) return countryCode + digits.slice(1);
  return '';
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
