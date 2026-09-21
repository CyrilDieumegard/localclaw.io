import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MODELS, modelURL, makeMessages, verdictFor } from '../js/labs/config.mjs';
import { DECISION_PRESETS, DECISION_EXAMPLES, createDecisionDeck, validateDecision, decisionMessages, scoresFromLogprobs, validateDecisionJSON } from '../js/labs/decisions.mjs';
import { LABS_FAQ } from '../js/labs/content.mjs';

test('visual explanations are accessible, scoped to Labs and never pretend to be model results', () => {
  const html = fs.readFileSync(new URL('../labs.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../css/labs-visual-20260922.css', import.meta.url), 'utf8');
  const guide = fs.readFileSync(new URL('../guides/run-llm-in-browser.html', import.meta.url), 'utf8');
  const flow = html.match(/<ol class="labs-flow"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(flow);
  assert.equal((flow.match(/<li>/g) || []).length, 3);
  assert.match(flow, /Once, after you click Load/);
  assert.match(flow, /using GPU or CPU/);
  assert.match(html, /class="labs-method-map" aria-labelledby="labs-method-map-title"/);
  const diagram = html.match(/<figure class="labs-method-map"[\s\S]*?<\/figure>/)[0];
  assert.match(diagram, /Neither proves calibrated confidence/);
  assert.doesNotMatch(diagram, /\d+%|\d+\s*ms|\d+\s*tokens\/s/);
  assert.equal((html.match(/class="labs-tab"[^>]*>[\s\S]*?<svg[^>]*aria-hidden="true"/g) || []).length, 4);
  assert.match(html, /<body class="lc-labs-page lc-labs-playground">/);
  assert.match(css, /html\.light \.lc-labs-playground/);
  assert.doesNotMatch(guide, /labs-visual-20260922|lc-labs-playground/);
});

test('warm theme text and action colors retain accessible contrast', () => {
  const luminance = hex => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  for (const [text, background] of [['#ff874f', '#211812'], ['#ac431c', '#fff2e8'], ['#281307', '#ff874f'], ['#a1a1aa', '#211812'], ['#52525b', '#fff2e8']]) {
    assert.ok(ratio(text, background) >= 4.5, `${text} on ${background}`);
  }
});

test('18 complete authored situations are unique and fit the decision input limits', () => {
  assert.equal(DECISION_EXAMPLES.length, 18);
  assert.equal(new Set(DECISION_EXAMPLES.map(item => item.id)).size, 18);
  assert.equal(new Set(DECISION_EXAMPLES.map(item => item.state)).size, 18);
  for (const example of DECISION_EXAMPLES) {
    assert.ok(example.title);
    const { state, question, options } = example;
    assert.deepEqual(validateDecision(example), { state, question, options });
  }
});

test('shuffle exhausts all situations before reuse and never immediately repeats', () => {
  for (const random of [() => 0, () => 0.999999, Math.random]) {
    const next = createDecisionDeck(random);
    let previous;
    for (let cycle = 0; cycle < 10; cycle++) {
      const seen = new Set();
      for (let index = 0; index < 18; index++) {
        const example = next();
        assert.notEqual(example.id, previous);
        seen.add(example.id);
        previous = example.id;
      }
      assert.equal(seen.size, 18);
    }
  }
});

test('category shuffles contain six matching situations and protect authored data', () => {
  const next = createDecisionDeck(() => 0.2);
  for (const category of ['support', 'email', 'crab']) {
    const items = Array.from({ length: 6 }, () => next(category));
    assert.equal(new Set(items.map(item => item.id)).size, 6);
    assert.ok(items.every(item => item.category === category));
    items[0].options[0] = 'Custom user edit';
    assert.notEqual(DECISION_EXAMPLES.find(item => item.id === items[0].id).options[0], 'Custom user edit');
  }
  let previous;
  for (let index = 0; index < 500; index++) {
    const example = next(['all', 'support', 'email', 'crab'][index % 4]);
    assert.notEqual(example.id, previous);
    previous = example.id;
  }
  assert.throws(() => next('unknown'));
});

test('Labs exposes crawlable facts and truthful schema matching every visible FAQ', () => {
  const html = fs.readFileSync(new URL('../labs.html', import.meta.url), 'utf8');
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const graph = data.flatMap(item => item['@graph'] || [item]);
  const faq = graph.find(item => item['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, LABS_FAQ.length);
  const decode = value => value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const visible = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(match => ({ question: decode(match[1]), answer: decode(match[2]) }));
  assert.deepEqual(visible, LABS_FAQ);
  assert.deepEqual(faq.mainEntity.map(item => ({ question: item.name, answer: item.acceptedAnswer.text })), LABS_FAQ);
  assert.match(html, /rel="canonical" href="https:\/\/localclaw.io\/labs"/);
  assert.equal((html.match(/<th scope="row">/g) || []).length, MODELS.length);
  assert.doesNotMatch(JSON.stringify(data), /aggregateRating|ratingValue|reviewCount/);
  assert.match(html, /href="\/guides\/run-llm-in-browser"/);
  assert.match(html, /No account\. No API key\./);
  const preview = fs.readFileSync(new URL('../images/labs-browser-playground.jpg', import.meta.url));
  assert.equal(preview.toString('hex', 0, 2), 'ffd8');
  let dimensions;
  for (let offset = 2; offset + 9 < preview.length;) {
    const marker = preview.readUInt16BE(offset);
    if ([0xffc0, 0xffc1, 0xffc2].includes(marker)) { dimensions = { height: preview.readUInt16BE(offset + 5), width: preview.readUInt16BE(offset + 7) }; break; }
    const length = preview.readUInt16BE(offset + 2);
    assert.ok(length >= 2);
    offset += length + 2;
  }
  assert.ok(dimensions);
  assert.equal(dimensions.width, Number(html.match(/property="og:image:width" content="(\d+)"/)[1]));
  assert.equal(dimensions.height, Number(html.match(/property="og:image:height" content="(\d+)"/)[1]));
});

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
