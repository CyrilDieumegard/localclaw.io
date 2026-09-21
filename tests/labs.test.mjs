import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, modelURL, makeMessages, verdictFor } from '../js/labs/config.mjs';
import { DECISION_PRESETS, validateDecision, decisionMessages, scoresFromLogprobs, validateDecisionJSON } from '../js/labs/decisions.mjs';

test('downloadable artifacts are pinned, HTTPS, and high-memory builds require WebGPU', () => {
  assert.equal(MODELS.length, 5);
  assert.deepEqual(MODELS.filter(model => model.group === 'semif').map(model => model.id), ['qwen3-06b-q8', 'minicpm5-2b', 'qwen35-4b']);
  for (const model of MODELS) {
    assert.match(model.revision, /^[a-f0-9]{40}$/);
    assert.match(model.sha256, /^[a-f0-9]{64}$/);
    assert.ok(model.bytes > 0 && model.bytes < 4_000_000_000);
    if (model.bytes > 2_000_000_000) assert.equal(model.gpuRequired, true);
    assert.ok([32, 54].includes(model.labelTokenBase));
    const url = new URL(modelURL(model));
    assert.equal(url.origin, 'https://huggingface.co');
    assert.ok(url.pathname.includes(`/resolve/${model.revision}/`));
  }
});

test('decision inputs are bounded and options must be distinct', () => {
  for (const preset of Object.values(DECISION_PRESETS)) assert.deepEqual(validateDecision(preset), preset);
  const input = DECISION_PRESETS.support;
  for (const invalid of [{ state: '' }, { state: 'a'.repeat(1201) }, { question: '' }, { question: 'a'.repeat(241) }, { options: ['Only one'] }, { options: Array(7).fill('Too many') }, { options: ['A', ' a '] }, { options: ['', 'B'] }, { options: [null, 'B'] }, { options: ['a'.repeat(121), 'B'] }]) {
    assert.throws(() => validateDecision({ ...input, ...invalid }));
  }
  assert.deepEqual(validateDecision({ ...input, options: [' A ', 'B '] }).options, ['A', 'B']);
});

test('both methods use the same supplied situation and options with explicit output formats', () => {
  const score = decisionMessages(DECISION_PRESETS.support, 'score');
  const json = decisionMessages(DECISION_PRESETS.support, 'json');
  assert.deepEqual(score[0], json[0]);
  for (const messages of [score, json]) {
    assert.equal(messages.length, 2);
    assert.ok(messages[1].content.includes(DECISION_PRESETS.support.state));
    assert.match(messages[1].content, /A\. Billing\nB\. Account access\nC\. Technical support/);
  }
  assert.match(score[1].content, /one letter only/);
  assert.match(json[1].content, /JSON object/);
});

test('option scores use stable conditional softmax and fail closed on missing scores', () => {
  const options = ['First', 'Second'];
  const scores = scoresFromLogprobs([{ token: 'A', logprob: -1000 }, { bytes: [66], logprob: -1001 }], options);
  assert.ok(Math.abs(scores[0].probability - 0.7310585786) < 1e-8);
  assert.equal(scores[0].option, 'First');
  assert.ok(Math.abs(scores.reduce((sum, score) => sum + score.probability, 0) - 1) < 1e-12);
  for (const entries of [undefined, [], [{ token: 'A', logprob: 0 }], [{ token: 'A', logprob: 0 }, { token: 'B', logprob: null }], [{ token: 'A', logprob: 0 }, { token: 'B', logprob: -Infinity }]]) {
    assert.throws(() => scoresFromLogprobs(entries, options));
  }
});

test('generated distributions must be complete, numeric and sum to one; raw output is not repaired', () => {
  const options = ['First', 'Second'];
  assert.equal(validateDecisionJSON('{"A":0.7,"B":0.3}', options).valid, true);
  for (const output of ['', '```json\n{"A":0.7,"B":0.3}\n```', '{"A":1}', '{"A":"0.7","B":0.3}', '{"A":0.5,"B":0.2}', '{"A":-1,"B":2}', '{"A":0.7,"B":0.3,"C":0}', '{"A":0.1,"A":0.7,"B":0.3}', '[]', 'null']) {
    const result = validateDecisionJSON(output, options);
    assert.equal(result.valid, false, output);
    assert.match(result.message, /raw model output is shown unchanged/);
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
