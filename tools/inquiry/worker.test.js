// node --test   (from this folder)
// Who gets each email: the owner, the copy, or (a test) the copy only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../assets/inquiry/worker.js';

const OWNER = 'owner@example.com', COPY = 'copy@example.com';

// fail: recipients whose send() throws
async function post({ name = 'Dana', host = 'site.example', copy = COPY, fail = [] } = {}) {
  const sent = [];
  const env = {
    INQUIRY_TO: OWNER, INQUIRY_FROM: 'inquiry@site.example', INQUIRY_COPY_TO: copy,
    EMAIL: { send: async (m) => { if (fail.includes(m.to)) throw Object.assign(new Error('nope'), { code: 'E' }); sent.push(m); } },
  };
  const origin = `https://${host}`;
  const res = await worker.fetch(new Request(`${origin}/api/inquiry`, {
    method: 'POST', headers: { Origin: origin },
    body: JSON.stringify({ fields: [{ label: 'Name', value: name }] }),
  }), env);
  return { status: res.status, body: await res.json(), to: sent.map((m) => m.to), subjects: sent.map((m) => m.subject) };
}

test('real inquiry: owner, then the copy', async () => {
  const r = await post();
  assert.deepEqual(r.to, [OWNER, COPY]);
  assert.equal(r.body.success, true);
  assert.ok(!r.subjects[0].startsWith('[TEST]'));
});

test('no INQUIRY_COPY_TO: owner only, TEST is an ordinary name', async () => {
  const r = await post({ copy: '', name: 'TEST' });
  assert.deepEqual(r.to, [OWNER]);
});

test('name TEST: copy only, marked [TEST]', async () => {
  const r = await post({ name: 'test' });
  assert.deepEqual(r.to, [COPY]);
  assert.match(r.subjects[0], /^\[TEST\] /);
});

test('preview URL (*.workers.dev): copy only', async () => {
  const r = await post({ host: 'abc-site.someone.workers.dev' });
  assert.deepEqual(r.to, [COPY]);
});

test('owner send fails: copy still sent, response is an error', async () => {
  const r = await post({ fail: [OWNER] });
  assert.deepEqual(r.to, [COPY]);
  assert.equal(r.status, 502);
});

test('copy send fails: the visitor still gets success', async () => {
  const r = await post({ fail: [COPY] });
  assert.deepEqual(r.to, [OWNER]);
  assert.equal(r.body.success, true);
});

test('test whose copy fails: error', async () => {
  const r = await post({ name: 'TEST', fail: [COPY] });
  assert.equal(r.status, 502);
});
