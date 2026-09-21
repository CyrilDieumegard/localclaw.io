import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, modelURL, makeMessages, verdictFor } from '../js/labs/config.mjs';

test('downloadable artifacts are pinned, HTTPS and small enough for browser file limits', () => {
  assert.equal(MODELS.length, 2);
  for (const model of MODELS) {
    assert.match(model.revision, /^[a-f0-9]{40}$/);
    assert.match(model.sha256, /^[a-f0-9]{64}$/);
    assert.ok(model.bytes > 0 && model.bytes < 2_000_000_000);
    const url = new URL(modelURL(model));
    assert.equal(url.origin, 'https://huggingface.co');
    assert.ok(url.pathname.includes(`/resolve/${model.revision}/`));
  }
});

test('interviews keep each suspect facts separate and cap history', () => {
  const history = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'a'.repeat(2000) }));
  const messages = makeMessages({ mode: 'mystery', suspect: 'mara', history, input: 'Where were you?' });
  assert.equal(messages.length, 8);
  assert.match(messages[0].content, /You are innocent/);
  assert.doesNotMatch(messages[0].content, /You are the thief/);
  assert.ok(messages.slice(1, -1).every(message => message.content.length <= 500));
  assert.equal(messages.at(-1).content, 'Where were you?');
  assert.match(makeMessages({ mode: 'mystery', suspect: 'leo', input: 'Hi' })[0].content, /You are the thief/);
});

test('remixes do not mix previous conversations into the source text', () => {
  const messages = makeMessages({ mode: 'remix', tone: 'pirate', history: [{ role: 'user', content: 'private previous text' }], input: '<script>alert(1)</script>' });
  assert.equal(messages.length, 2);
  assert.match(messages[0].content, /creative writer/);
  assert.match(messages[1].content, /playful pirate/);
  assert.ok(messages[1].content.includes('<script>alert(1)</script>'));
  assert.throws(() => makeMessages({ mode: 'remix', tone: 'unknown', input: '' }));
});

test('case resolution uses authored evidence instead of model-generated judgments', () => {
  assert.equal(verdictFor('leo').correct, true);
  assert.equal(verdictFor('mara').correct, false);
  assert.equal(verdictFor('iris').correct, false);
  assert.throws(() => verdictFor('unknown'));
});
