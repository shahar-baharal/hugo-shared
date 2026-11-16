// node --test   (from this folder)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, display } from '../../assets/inquiry/email.js';

const f = (o) => ({ label: 'L', type: 'text', value: 'v', width: 'full', ...o });

test('escapes HTML in labels and values', () => {
  const { html } = render({ title: 't', fields: [f({ label: '<b>', value: '<script>' })] });
  assert.ok(!html.includes('<script>') && html.includes('&lt;script&gt;') && html.includes('&lt;b&gt;'));
});

test('right-to-left: dir on the document and RLM in the text part', () => {
  const { html, text } = render({ title: 't', dir: 'rtl', fields: [f({})] });
  assert.match(html, /<html lang="en" dir="rtl">/);
  assert.ok(text.includes('‏L:'));
});

test('half and third widths become narrower cells', () => {
  const { html } = render({ title: 't', fields: [f({ width: 'half' }), f({ width: 'third' })] });
  assert.match(html, /max-width:284px/);
  assert.match(html, /max-width:189px/);
});

test('dates follow the locale', () => {
  assert.equal(display(f({ type: 'date', value: '2027-02-10' }), 'he-IL'), '10.02.2027');
  assert.equal(display(f({ type: 'date', value: '2027-02-10' }), 'en-US'), '02/10/2027');
});

test('phone: call link always, WhatsApp only with a country code or +', () => {
  const tel = f({ type: 'tel', value: '050-123 4567' });
  assert.ok(!render({ title: 't', fields: [tel] }).html.includes('wa.me'));
  assert.ok(render({ title: 't', countryCode: '972', fields: [tel] }).html.includes('wa.me/972501234567'));
  assert.ok(render({ title: 't', fields: [f({ type: 'tel', value: '+1 555 0100' })] }).html.includes('wa.me/15550100'));
});
