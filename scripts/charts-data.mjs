import { createHash } from 'node:crypto';

export const SOURCE = 'https://vercel.com/ai-gateway/leaderboards/models';
export const DAY = 86400000;
export const MAX_AGE_DAYS = 3;
export const isoDay = value => new Date(value).toISOString().slice(0, 10);
const rounded = value => Number(value.toFixed(1));

function dayNumber(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isoDay(date) !== date) throw new Error('Invalid source date.');
  return Date.parse(date) / DAY;
}

// Read only JSON from the publisher's public chart payload. Never execute it.
// The documented model export omits the open/closed aggregate; do not infer it
// by summing the top models or classifying their names ourselves.
export function parseVercel(html) {
  if (typeof html !== 'string' || html.length > 12e6) throw new Error('Invalid Vercel response.');
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)]
    .map(match => JSON.parse(match[1])).join('');
  const rows = [];
  // Fail closed if the public data shape changes instead of inventing values.
  const pattern = /\{"day":"[^"]+","metric":"[^"]+","chef_values":\[[^\n{}]*?\]\}/g;
  for (const [text] of chunks.matchAll(pattern)) {
    const row = JSON.parse(text);
    if (row.metric !== 'tokens') continue;
    if (!row.chef_values.some(pair => ['Open Weights', 'Closed Weights'].includes(pair[0]))) continue;
    if (row.chef_values.length !== 2 || row.chef_values[0][0] !== 'Open Weights' || row.chef_values[1][0] !== 'Closed Weights') throw new Error('Unexpected open/closed categories.');
    if (!/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(row.day)) throw new Error('Invalid daily timestamp.');
    rows.push({ date: row.day.slice(0, 10), openWeights: row.chef_values[0][1], closedWeights: row.chef_values[1][1] });
  }
  if (!rows.length) throw new Error('Vercel open/closed token series missing. No data changed.');
  return rows;
}

export function validateSeries(series) {
  if (!Array.isArray(series) || series.length !== 90) throw new Error('Expected 90 observed daily values.');
  let previous;
  for (const row of series) {
    const day = dayNumber(row.date);
    if (previous !== undefined && day !== previous + 1) throw new Error('Missing, duplicated or unordered date.');
    previous = day;
    for (const key of ['openWeights', 'closedWeights']) {
      if (!Number.isFinite(row[key]) || row[key] < 0 || row[key] > 100) throw new Error('Invalid share.');
    }
    if (Math.abs(row.openWeights + row.closedWeights - 100) > 0.001) throw new Error('Shares must sum to 100.');
  }
}

export function selectWindow(rows, now = new Date()) {
  const today = isoDay(now);
  const dates = new Map();
  for (const row of rows) {
    dayNumber(row.date);
    if (row.date > today) throw new Error('Future source date.');
    if (row.date === today) continue; // An in-progress UTC day is not a daily result.
    if (dates.has(row.date)) throw new Error('Duplicate source date.');
    dates.set(row.date, row);
  }
  const series = [...dates.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
  validateSeries(series);
  if (dayNumber(today) - dayNumber(series.at(-1).date) > MAX_AGE_DAYS) throw new Error('Vercel data is stale. Last good snapshot preserved.');
  return series;
}

export function refreshSnapshot(snapshot, rows, now = new Date()) {
  const series = selectWindow(rows, now);
  const prior = snapshot.charts[0];
  if (prior.id !== 'open-weight-token-share-over-time') throw new Error('Unexpected adoption chart.');
  if (series.at(-1).date < prior.series.at(-1).date) throw new Error('Refusing to roll the snapshot backwards.');
  if (JSON.stringify(series) === JSON.stringify(prior.series) && prior.source.retrievedAt) return null;
  const next = structuredClone(snapshot);
  const chart = next.charts[0];
  const latest = series.at(-1);
  const peak = series.reduce((best, row) => row.openWeights > best.openWeights ? row : best);
  Object.assign(chart, {
    series,
    dateRange: { from: series[0].date, to: latest.date },
    latest: { date: latest.date, openWeights: rounded(latest.openWeights), closedWeights: rounded(latest.closedWeights) },
    peak: { date: peak.date, openWeights: rounded(peak.openWeights) },
    freshness: { cadence: 'daily', maxAgeDays: MAX_AGE_DAYS, excludesCurrentUtcDay: true },
  });
  Object.assign(chart.source, {
    retrievedAt: now.toISOString(),
    extraction: 'Public leaderboard embedded open/closed token aggregate; last 90 completed UTC days; no interpolation.',
    seriesSha256: createHash('sha256').update(JSON.stringify(series)).digest('hex'),
  });
  next.dateModified = isoDay(now);
  return next;
}

function replaceOnce(html, pattern, value) {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'));
  if (matches?.length !== 1) throw new Error(`Charts template drift: ${pattern}`);
  return html.replace(pattern, () => value);
}

export function renderCharts(html, snapshot) {
  const chart = snapshot.charts[0];
  validateSeries(chart.series);
  dayNumber(snapshot.dateModified);
  const first = chart.series[0], latest = chart.series.at(-1);
  const peak = chart.series.reduce((best, row) => row.openWeights > best.openWeights ? row : best);
  if (chart.latest.date !== latest.date || chart.latest.openWeights !== rounded(latest.openWeights) || chart.latest.closedWeights !== rounded(latest.closedWeights) || chart.peak.date !== peak.date || chart.peak.openWeights !== rounded(peak.openWeights) || chart.dateRange.from !== first.date || chart.dateRange.to !== latest.date) throw new Error('Chart summaries do not match observations.');
  const format = date => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
  const pct = value => value.toFixed(1);
  html = replaceOnce(html, /<main class="charts-main"[^>]*>/, `<main class="charts-main" data-charts-snapshot="${snapshot.dateModified}">`);
  html = replaceOnce(html, /<p class="charts-updated">[\s\S]*?<\/p>/, `<p class="charts-updated"><time datetime="${snapshot.dateModified}">Snapshot updated ${format(snapshot.dateModified)}</time><span aria-hidden="true">•</span>Daily series + dated research reports</p>`);
  html = replaceOnce(html, /<h2 id="hero-chart-title">[\s\S]*?<\/h2>\s*<p>[\s\S]*?<\/p>/,
    `<h2 id="hero-chart-title">Open weights carry ${pct(latest.openWeights)}% of Vercel tokens</h2>\n          <p>${chart.series.length} daily observations, ${format(first.date)}–${format(latest.date)}: ${pct(first.openWeights)}% at the start, ${pct(latest.openWeights)}% on the latest day. Period peak: ${pct(peak.openWeights)}%.</p>`);
  const bars = chart.series.map((row, index) => `<span class="charts-adoption-day" style="--open: ${row.openWeights}%" data-date="${row.date}" data-open="${pct(row.openWeights)}" data-closed="${pct(row.closedWeights)}" data-delta="${index ? pct(row.openWeights - chart.series[index - 1].openWeights) : ''}"></span>`).join('\n          ');
  html = replaceOnce(html, /<div class="charts-adoption-bars">[\s\S]*?<\/div>/, `<div class="charts-adoption-bars">\n          ${bars}\n          </div>`);
  html = replaceOnce(html, /<div class="charts-adoption-axis"[^>]*>[\s\S]*?<\/div>/, `<div class="charts-adoption-axis" aria-hidden="true"><span>${format(first.date)}</span><span>${format(latest.date)}</span></div>`);
  html = replaceOnce(html, /<div class="charts-adoption-meta">[\s\S]*?<\/p>\s*<\/div>/, `<div class="charts-adoption-meta"><div class="charts-legend" aria-hidden="true"><span><i class="charts-swatch charts-swatch--accent"></i>Open weights <strong>${pct(latest.openWeights)}%</strong></span><span><i class="charts-swatch"></i>Closed weights <strong>${pct(latest.closedWeights)}%</strong></span></div><p><strong>${pct(peak.openWeights)}%</strong> peak · ${format(peak.date)}</p></div>`);
  html = replaceOnce(html, /<p class="charts-scope" id="hero-chart-note">[\s\S]*?<\/p>/, `<p class="charts-scope" id="hero-chart-note">Daily Vercel AI Gateway token volume <span aria-hidden="true">•</span> Not global AI usage<br><span data-chart-freshness data-as-of="${latest.date}" data-max-age="${MAX_AGE_DAYS}">Data through ${format(latest.date)} (UTC). Checked daily; last retrieved ${format(chart.source.retrievedAt || snapshot.dateModified)}.</span></p>`);
  const table = chart.series.map(row => `<tr><td>${row.date}</td><td>${pct(row.openWeights)}%</td><td>${pct(row.closedWeights)}%</td></tr>`).join('');
  html = replaceOnce(html, /<table class="charts-sr-only"><caption>Daily open-weight[\s\S]*?<\/table>/, `<table class="charts-sr-only"><caption>Daily open-weight and closed-weight share of Vercel AI Gateway token volume</caption><thead><tr><th>Date</th><th>Open weights</th><th>Closed weights</th></tr></thead><tbody>${table}</tbody></table>`);
  html = replaceOnce(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, (() => {
    const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const schema = JSON.parse(block[1]);
    for (const item of schema['@graph']) if (item.dateModified) item.dateModified = snapshot.dateModified;
    const dataset = schema['@graph'].find(item => item['@type'] === 'Dataset');
    dataset.description = 'Daily Vercel token-share series and separately dated research-report snapshots; each indicator has its own period.';
    for (const question of schema['@graph'].find(item => item['@type'] === 'FAQPage').mainEntity) {
      if (question.name.includes('global AI usage')) question.name = 'Does the Vercel token share represent global AI usage?';
    }
    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2).replace(/</g, '\\u003c')}\n  </script>`;
  })());
  return html;
}
