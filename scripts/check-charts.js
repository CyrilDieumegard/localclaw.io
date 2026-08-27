const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'charts.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/charts.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'js/charts-20260827a.js'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'charts-data.json'), 'utf8'));
const errors = [];

function requireText(haystack, needle, message) {
  if (!haystack.includes(needle)) errors.push(message);
}

requireText(html, '<title>Open-Weight AI Adoption Statistics &amp; Charts | LocalClaw</title>', 'Missing exact SEO title');
requireText(html, '<link rel="canonical" href="https://localclaw.io/charts">', 'Missing canonical /charts URL');
requireText(html, 'data-nav-key="charts" aria-current="page"', 'Charts navigation is not active');
requireText(html, 'https://localclaw.io/charts-data.json', 'Machine-readable dataset is not linked');
requireText(html, 'Downloads show activity inside one ecosystem.', 'Methodology boundary is missing');
requireText(html, 'Open-weight means the model weights are downloadable.', 'Open-weight definition is missing');
requireText(html, '/js/charts-20260827a.js', 'Charts analytics script is not embedded');
requireText(js, "track('charts_page_loaded'", 'Charts page-load tracking is missing');
requireText(js, "track('chart_view'", 'Chart view tracking is missing');
requireText(css, '@media (max-width: 720px)', 'Mobile chart layout is missing');
requireText(css, '@media (prefers-reduced-motion: reduce)', 'Reduced-motion treatment is missing');

const expected = new Map([
  ['notable-models-by-country', [['United States', 59], ['China', 35]]],
  ['open-model-downloads-by-origin', [['China', 41], ['Rest of world', 59]]],
  ['downloads-by-parameter-count', [['Under 1B', 83], ['1B to 100B', 16], ['Above 100B', 1]]],
  ['repository-growth-by-format', [['GGUF', 464], ['MLX', 148], ['Hub overall', 21.5], ['Transformers / PEFT', 16]]]
]);

for (const chart of data.charts || []) {
  const rows = expected.get(chart.id);
  if (!rows) continue;
  const actual = chart.values.map(item => [item.label, item.value]);
  if (JSON.stringify(actual) !== JSON.stringify(rows)) errors.push(`Unexpected values for ${chart.id}`);
  expected.delete(chart.id);
}
for (const missing of expected.keys()) errors.push(`Missing chart data: ${missing}`);

for (const marker of ['59', '35', '41%', '83%', '+464%', '+148%', '151,448', '3.3%']) {
  requireText(html, marker, `Rendered chart marker missing: ${marker}`);
}

if (data.dateModified !== '2026-08-27') errors.push('Unexpected charts snapshot date');
if (errors.length) {
  console.error(`Charts validation failed with ${errors.length} issue(s):\n${errors.map(item => `- ${item}`).join('\n')}`);
  process.exit(1);
}
console.log('Charts validation passed: 4 sourced charts, 2 evidence callouts and methodology boundaries verified.');
