const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const issue = message => errors.push(message);
const expected = [
  { key: '90d', days: 90, start: '2026-06-01', end: '2026-08-29', countries: 90 },
  { key: '180d', days: 180, start: '2026-03-03', end: '2026-08-29', countries: 97 }
];
const installExpected = [
  { key: '30d', days: 30, start: '2026-07-31', end: '2026-08-29', suffix: '' },
  { key: '90d', days: 90, start: '2026-06-01', end: '2026-08-29', suffix: '-90d' },
  { key: '180d', days: 180, start: '2026-03-03', end: '2026-08-29', suffix: '-180d' }
];

function read(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
  } catch (error) {
    issue(`${relativePath} could not be read: ${error.message}`);
    return null;
  }
}

for (const window of expected) {
  const dataPath = `data/local-ai-activity-index-${window.key}.json`;
  const admin1Path = `data/local-ai-admin1-activity-${window.key}.json`;
  const data = read(dataPath);
  const admin1 = read(admin1Path);
  if (!data || !admin1) continue;
  if (data.schemaVersion !== 2 || data.period?.key !== window.key || data.period?.days !== window.days
    || data.period?.start !== window.start || data.period?.end !== window.end) {
    issue(`${window.key} country period metadata is invalid`);
  }
  if (!Array.isArray(data.countries) || data.countries.length !== window.countries) {
    issue(`${window.key} must publish ${window.countries} thresholded countries`);
  }
  let previous = Infinity;
  for (const [index, country] of (data.countries || []).entries()) {
    if (country.rank !== index + 1 || !Number.isInteger(country.signals) || country.signals < 5 || country.signals > previous) {
      issue(`${window.key} has an invalid country ranking at row ${index + 1}`);
      break;
    }
    previous = country.signals;
  }
  const publishedSignals = (data.countries || []).reduce((sum, country) => sum + country.signals, 0);
  if (publishedSignals !== data.totals?.publishedSignals
    || data.totals?.publishedSignals + data.totals?.withheldSignals !== data.totals?.signals
    || data.totals?.publishedRegions + data.totals?.withheldRegions !== data.totals?.regions) {
    issue(`${window.key} country totals do not reconcile`);
  }
  const us = data.subnational?.['United States'];
  if (!us || us.publishThreshold !== 5 || !Array.isArray(us.regions)) issue(`${window.key} U.S. state data is missing`);
  else if (us.regions.reduce((sum, region) => sum + region.signals, 0) !== us.totals?.publishedSignals) {
    issue(`${window.key} U.S. state totals do not reconcile`);
  }
  for (const countryName of ['China', 'Russia']) {
    const detail = data.subnational?.[countryName];
    if (!detail || detail.publishThreshold !== 5 || !Array.isArray(detail.regions)) issue(`${window.key} ${countryName} detail is missing`);
  }
  if (admin1.publishThreshold !== 5 || admin1.period?.start !== window.start || admin1.period?.end !== window.end
    || admin1.period?.timezone !== data.timezone) {
    issue(`${window.key} worldwide regional period metadata does not match the country dataset`);
  }
  const expectedAdmin1Countries = new Set((data.countries || []).filter(country => country.name !== 'United States').map(country => country.name));
  const actualAdmin1Countries = new Set(Object.keys(admin1.countries || {}));
  if (expectedAdmin1Countries.size !== actualAdmin1Countries.size
    || [...expectedAdmin1Countries].some(name => !actualAdmin1Countries.has(name))) {
    issue(`${window.key} worldwide regional country coverage does not match the published countries`);
  }
  const countrySignals = new Map((data.countries || []).map(country => [country.name, country.signals]));
  const usSignals = new Map((us?.regions || []).map(region => [region.code, region.signals]));
  const seenGeoNames = new Set();
  const citySignalsByCountry = new Map();
  const usCitySignalsByState = new Map();
  for (const cluster of data.cityClusters || []) {
    if (!Number.isInteger(cluster.signals) || cluster.signals < 5 || !Number.isInteger(cluster.geonameId)
      || !Number.isFinite(cluster.lat) || !Number.isFinite(cluster.lon)) {
      issue(`${window.key} has an invalid city cluster`);
      break;
    }
    const geoKey = `${cluster.countryCode}|${cluster.geonameId}`;
    if (seenGeoNames.has(geoKey)) issue(`${window.key} duplicates city centroid ${geoKey}`);
    seenGeoNames.add(geoKey);
    citySignalsByCountry.set(cluster.country, (citySignalsByCountry.get(cluster.country) || 0) + cluster.signals);
    if (cluster.countryCode === 'US') {
      usCitySignalsByState.set(cluster.regionCode, (usCitySignalsByState.get(cluster.regionCode) || 0) + cluster.signals);
    }
  }
  for (const [country, signals] of citySignalsByCountry) {
    if (!countrySignals.has(country) || signals > countrySignals.get(country)) issue(`${window.key} city totals exceed ${country}`);
  }
  for (const [region, signals] of usCitySignalsByState) {
    if (!usSignals.has(region) || signals > usSignals.get(region)) issue(`${window.key} city totals exceed U.S. state ${region}`);
  }
  if (!String(data.cityClusterMethodology?.mappingNote || '').includes('GeoNames')) {
    issue(`${window.key} must disclose unmatched city rows`);
  }
}

for (const window of installExpected) {
  const data = read(`data/local-ai-install-intent${window.suffix}.json`);
  const admin1 = read(`data/local-ai-install-intent-admin1${window.suffix}.json`);
  if (!data || !admin1) continue;
  if (data.view !== 'installed' || data.period?.key !== window.key || data.period?.days !== window.days
    || data.period?.start !== window.start || data.period?.end !== window.end || data.publishThreshold !== 5) {
    issue(`${window.key} install-intent period metadata is invalid`);
  }
  if (data.totals?.observedSignals !== 48 || data.totals?.publishedSignals !== 19
    || data.totals?.withheldSignals !== 29 || data.totals?.publishedRegions !== 3) {
    issue(`${window.key} install-intent totals do not match the approved goal-filtered snapshot`);
  }
  if ((data.countries || []).some(country => !Number.isInteger(country.signals) || country.signals < 5)
    || (data.countries || []).reduce((sum, country) => sum + country.signals, 0) !== data.totals?.publishedSignals) {
    issue(`${window.key} install-intent country rows violate the five-visitor threshold or do not reconcile`);
  }
  if (!Array.isArray(data.cityClusters) || data.cityClusters.length !== 0) {
    issue(`${window.key} install-intent snapshot must not invent city clusters`);
  }
  if (admin1.view !== 'installed' || admin1.publishThreshold !== 5
    || admin1.period?.start !== window.start || admin1.period?.end !== window.end
    || Object.keys(admin1.countries || {}).length !== 3
    || Object.values(admin1.countries || {}).some(country => country.publicationStatus !== 'none_above_threshold' || country.regions?.length !== 0)) {
    issue(`${window.key} install-intent regional snapshot must publish no below-threshold region`);
  }
  if (!String(data.claimBoundary || '').toLowerCase().includes('does not verify')) {
    issue(`${window.key} install-intent snapshot must retain the click-versus-installation claim boundary`);
  }
}

const page = fs.readFileSync(path.join(ROOT, 'local-ai-activity-index.html'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'js', 'local-ai-activity-index.js'), 'utf8');
for (const key of ['30d', '90d', '180d', '365d']) {
  if (!page.includes(`data-atlas-period="${key}"`)) issue(`Period selector is missing ${key}`);
}
if (!page.includes('data-atlas-period="365d"') || !/data-atlas-period="365d"[^>]*disabled/.test(page)) {
  issue('12-month period must stay disabled until a complete history exists');
}
if (!app.includes("const ACTIVE_PERIOD") || !app.includes("url.searchParams.set('range', period)")) {
  issue('Atlas period selection is not wired to the versioned datasets');
}
if (!app.includes("requestedMetricView === 'installed'") || !app.includes("url.searchParams.set('view', 'installed')")) {
  issue('Atlas Installed selection is not wired to the goal-filtered datasets and share URLs');
}
if (!app.includes("status === 'published' || status === 'partially_published'")) {
  issue('Partially published regional periods must remain visible as published aggregates');
}

if (errors.length) {
  console.error(`Atlas period validation failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Atlas period validation passed: independent 30D, 3M and 6M views, privacy thresholds, regional coverage, city-parent reconciliation, and locked 12M coverage verified.');
