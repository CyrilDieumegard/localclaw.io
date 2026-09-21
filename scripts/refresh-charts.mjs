import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE, parseVercel, refreshSnapshot, renderCharts } from './charts-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'charts-data.json');
const htmlPath = path.join(root, 'charts.html');
const snapshot = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const before = fs.readFileSync(htmlPath, 'utf8');
const check = process.argv.includes('--check');

try {
  if (check || process.argv.includes('--render')) {
    const rendered = renderCharts(before, snapshot);
    if (check && rendered !== before) throw new Error('Charts HTML is stale. Run npm run charts:generate.');
    if (!check && rendered !== before) fs.writeFileSync(htmlPath, rendered);
    console.log('Charts rendering matches the saved dataset.');
  } else {
    const response = await fetch(SOURCE, { signal: AbortSignal.timeout(30000), headers: { Accept: 'text/html' } });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Vercel source unavailable: HTTP ${response.status}`);
    if (new URL(response.url).hostname !== 'vercel.com') throw new Error('Unexpected source redirect.');
    const next = refreshSnapshot(snapshot, parseVercel(await response.text()));
    if (!next) {
      console.log(`No source change. Data through ${snapshot.charts[0].dateRange.to}; files and dates untouched.`);
    } else {
      // Validate and render everything before writing either public file.
      const rendered = renderCharts(before, next);
      if (process.argv.includes('--dry-run')) console.log('Dry run: no files written.');
      else {
        fs.writeFileSync(dataPath, JSON.stringify(next, null, 2) + '\n');
        fs.writeFileSync(htmlPath, rendered);
      }
      console.log(`Vercel: ${next.charts[0].dateRange.from}–${next.charts[0].dateRange.to}; latest ${next.charts[0].latest.openWeights}%; report figures unchanged.`);
    }
  }
} catch (error) {
  console.error(`Charts refresh failed: ${error.message}`);
  process.exitCode = 1;
}
