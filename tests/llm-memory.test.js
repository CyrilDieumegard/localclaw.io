const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../js/llm-memory');

test('a 32-layer, 8-KV-head, 128-dimension FP16 cache at 8192 tokens is exactly 1 GiB', () => {
  assert.equal(calculate({ layers: 32, heads: 8, dimension: 128, context: 8192, cache: 2 }).kv, 1);
});
test('sequences multiply KV allocations but share weights', () => {
  const one = calculate({ sequences: 1 });
  const four = calculate({ sequences: 4 });
  assert.equal(four.kv, one.kv * 4);
  assert.equal(four.weights, one.weights);
  assert.equal(four.total - one.total, one.kv * 3);
});
test('real file size overrides precision and overhead, with decimal GB converted to GiB', () => {
  const actual = calculate({ file: 8.589934592, bits: 4, overhead: 10 });
  assert.equal(actual.weights, 8);
  assert.equal(calculate({ file: 8.589934592, bits: 16, overhead: 99 }).weights, 8);
});
test('FP32 doubles cache, and extra context does not change weight size', () => {
  assert.equal(calculate({ cache: 4 }).kv, calculate({ cache: 2 }).kv * 2);
  assert.equal(calculate({ context: 32768 }).weights, calculate({ context: 2048 }).weights);
});
test('weight precision, decimal billions and binary GiB are kept separate', () => {
  assert.equal(calculate({ params: 8, bits: 4, overhead: 0 }).weights, 4e9 / 1024 ** 3);
});
test('capacity boundaries produce an over-budget or tight state without combining pools', () => {
  const total = calculate().total;
  assert.equal(calculate({ capacity: total - .01 }).status, 'over');
  assert.equal(calculate({ capacity: total }).status, 'tight');
  assert.equal(calculate({ capacity: total * 2 }).status, 'within');
  assert.equal(calculate({ pool: 'gpu', reserve: 0 }).total, total - 3);
});
test('invalid values cannot silently produce a fit result', () => {
  for (const input of [{ params: NaN }, { context: -1 }, { heads: 4.5 }, { sequences: 0 }, { cache: 3 }, { pool: 'combined' }, { capacity: Infinity }]) {
    assert.throws(() => calculate(input), RangeError);
  }
});
