import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DAY, isoDay, parseVercel, selectWindow, validateSeries, refreshSnapshot, renderCharts } from '../scripts/charts-data.mjs';

// Synthetic fixtures, never published. Use a fixed clock so tests do not rot.
const now = new Date('2026-09-21T07:00:00Z');
const rows = () => Array.from({ length: 100 }, (_, i) => ({
  date: isoDay(now.getTime() - (100 - i) * DAY), openWeights: 20 + i / 2, closedWeights: 80 - i / 2,
}));
const fixture = () => ({ dateModified: '2026-08-27', charts: [{
  id: 'open-weight-token-share-over-time', series: [{ date: '2026-08-26' }], source: { publisher: 'Vercel' },
}, { id: 'report', values: [41, 59], period: 'Spring 2026' }], evidence: [{ value: 151448, asOf: '2026-08-14' }] });
const payload = (data, metric = 'tokens') => data.map(row => ({ day: row.date + 'T00:00:00.000Z', metric, chef_values: [['Open Weights', row.openWeights], ['Closed Weights', row.closedWeights]] }));
const flight = value => `<script>self.__next_f.push([1,${JSON.stringify(JSON.stringify(value))}])</script>`;

test('reads only published token aggregates from JSON-encoded flight chunks', () => {
  const input = rows();
  const html = flight(payload(input, 'requests')) + flight(payload(input)) + flight(payload(input, 'cost'));
  assert.deepEqual(parseVercel(html), input);
  assert.throws(() => parseVercel('<script>throw new Error("not executed")</script>'), /missing/);
  assert.throws(() => parseVercel(flight([{ chef_values: [['Unknown', 50]] }])));
  assert.throws(() => parseVercel('x'.repeat(12000001)), /Invalid/);
  const invalid = rows();
  invalid.at(-1).openWeights = null;
  assert.throws(() => selectWindow(parseVercel(flight(payload(invalid))), now), /Invalid share/);
  const missingCategory = payload(rows());
  missingCategory.at(-1).chef_values.pop();
  assert.throws(() => parseVercel(flight(missingCategory)), /categories/);
});

test('takes the last 90 consecutive completed UTC days without interpolating', () => {
  const input = [...rows().reverse(), { date: '2026-09-21', openWeights: 1, closedWeights: 99 }];
  const series = selectWindow(input, now);
  assert.equal(series.length, 90);
  assert.equal(series[0].date, '2026-06-23');
  assert.equal(series.at(-1).date, '2026-09-20');
  assert.equal(series.at(-1).openWeights, 69.5);
});

test('rejects missing, duplicate, stale, future and invalid dates', () => {
  assert.throws(() => selectWindow(rows().filter((_, i) => i !== 50), now), /Missing/);
  assert.throws(() => selectWindow([...rows(), rows()[50]], now), /Duplicate/);
  assert.throws(() => selectWindow(rows(), new Date('2026-09-24T00:00:00Z')), /stale/);
  assert.throws(() => selectWindow([...rows(), { date: '2026-09-22' }], now), /Future/);
  assert.throws(() => selectWindow([...rows(), { date: '2026-02-30' }], now), /Invalid/);
  assert.throws(() => selectWindow(rows().slice(20), now), /90/);
});

test('rejects invalid shares; zero and 100 are valid observed values', () => {
  for (const patch of [{ openWeights: NaN }, { closedWeights: Infinity }, { openWeights: -1 }, { openWeights: 101 }, { openWeights: '50' }, { closedWeights: 1 }]) {
    const data = rows();
    Object.assign(data[50], patch);
    assert.throws(() => selectWindow(data, now));
  }
  const data = rows().slice(-90);
  data[0].openWeights = 0; data[0].closedWeights = 100;
  validateSeries(data);
});

test('refresh derives summary and provenance but preserves historical reports', () => {
  const before = fixture();
  const unchanged = structuredClone(before);
  const next = refreshSnapshot(before, rows(), now);
  assert.deepEqual(before, unchanged);
  assert.deepEqual(next.charts.slice(1), before.charts.slice(1));
  assert.deepEqual(next.evidence, before.evidence);
  assert.equal(next.dateModified, '2026-09-21');
  assert.deepEqual(next.charts[0].latest, { date: '2026-09-20', openWeights: 69.5, closedWeights: 30.5 });
  assert.deepEqual(next.charts[0].peak, { date: '2026-09-20', openWeights: 69.5 });
  assert.equal(next.charts[0].source.retrievedAt, now.toISOString());
  assert.match(next.charts[0].source.seriesSha256, /^[a-f0-9]{64}$/);
});

test('an unchanged source is a no-op, but corrections to a past day are retained', () => {
  const next = refreshSnapshot(fixture(), rows(), now);
  assert.equal(refreshSnapshot(next, rows(), new Date(now.getTime() + 3600000)), null);
  const corrected = rows();
  corrected[40].openWeights += 0.1; corrected[40].closedWeights -= 0.1;
  const result = refreshSnapshot(next, corrected, now);
  assert.notEqual(result.charts[0].source.seriesSha256, next.charts[0].source.seriesSha256);
});

test('rejects source rollback and does not mutate the last good snapshot', () => {
  const next = refreshSnapshot(fixture(), rows(), now);
  const before = JSON.stringify(next);
  assert.throws(() => refreshSnapshot(next, rows().slice(0, -1), now), /backwards/);
  assert.throws(() => refreshSnapshot(next, [], now));
  assert.equal(JSON.stringify(next), before);
});

test('renders all daily surfaces together, idempotently, and fails on template drift', () => {
  const html = fs.readFileSync(new URL('../charts.html', import.meta.url), 'utf8');
  const next = refreshSnapshot(fixture(), rows(), now);
  const rendered = renderCharts(html, next);
  assert.equal(renderCharts(rendered, next), rendered);
  assert.ok(rendered.includes('Open weights carry 69.5% of Vercel tokens'));
  assert.ok(rendered.includes('data-charts-snapshot="2026-09-21"'));
  assert.ok(rendered.includes('data-as-of="2026-09-20"'));
  assert.equal((rendered.match(/class="charts-adoption-day"/g) || []).length, 90);
  assert.ok(rendered.includes('151,448'));
  assert.throws(() => renderCharts(html.replace('id="hero-chart-title"', 'id="renamed"'), next), /template drift/);
  next.charts[0].latest.openWeights = 99;
  assert.throws(() => renderCharts(html, next), /summaries/);
});

function runBrowserScript(asOf, clock = now) {
  const attributes = new Map([['data-as-of', asOf], ['data-max-age', '3']]);
  const node = { textContent: 'Verified source label', getAttribute: key => attributes.get(key), hasAttribute: key => attributes.has(key), setAttribute: (key, value) => attributes.set(key, value) };
  const events = [], listeners = {};
  const context = { Date: class extends Date { static now() { return clock.getTime(); } }, window: { datafast: (...args) => events.push(args) }, document: {
    querySelector: selector => selector === '[data-charts-snapshot]' ? { getAttribute: () => '2026-09-21' } : null,
    querySelectorAll: selector => selector === '[data-chart-freshness]' ? [node] : [],
    addEventListener: (event, listener) => { listeners[event] = listener; },
  } };
  vm.runInNewContext(fs.readFileSync(new URL('../js/charts-20260827c.js', import.meta.url), 'utf8'), context);
  return { node, attributes, events, listeners };
}

test('browser uses real snapshot date and warns after three days, including return to tab', () => {
  const clock = new Date(now);
  const live = runBrowserScript('2026-09-20', clock);
  assert.equal(live.attributes.get('data-stale'), 'false');
  assert.equal(live.node.textContent, 'Verified source label');
  assert.equal(live.events[0][1].snapshot, '2026-09-21');
  clock.setUTCDate(24);
  live.listeners.visibilitychange();
  assert.equal(live.attributes.get('data-stale'), 'true');
  assert.match(live.node.textContent, /Update delayed/);
  for (const invalid of ['2026-09-21', 'invalid', '2026-09-22', '2026-08-27']) {
    assert.equal(runBrowserScript(invalid).attributes.get('data-stale'), 'true');
  }
});
