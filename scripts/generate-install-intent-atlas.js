const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rawPath = process.argv[2];
const threshold = 5;

if (!rawPath) {
  throw new Error('Usage: node scripts/generate-install-intent-atlas.js /absolute/path/to/private-datafast-install-intent.json');
}

const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'));
const windows = ['30d', '90d', '180d'];
const suffixFor = key => key === '30d' ? '' : `-${key}`;

function number(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Invalid non-negative integer: ${value}`);
  return parsed;
}

function emptyUnitedStates(countrySignals, observedRegions = 0, geolocatedSignals = 0) {
  return {
    division: 'state',
    source: 'DataFast region breakdown filtered to the install-intent goal family',
    boundarySource: 'U.S. Census Bureau 2024 Cartographic Boundary Files, 1:20m',
    publishThreshold: threshold,
    totals: {
      countrySignals,
      geolocatedSignals,
      observedRegions,
      publishedSignals: 0,
      publishedRegions: 0,
      withheldSignals: geolocatedSignals,
      unassignedSignals: Math.max(0, countrySignals - geolocatedSignals)
    },
    qualityNotes: [
      'Install intent is a website visitor who selected at least one model download or local-runtime path; it is not a verified installation.',
      'Region is an approximate network location reported by DataFast, not verified residence.',
      'No state reached the five-visitor publication threshold in this snapshot.'
    ],
    regions: []
  };
}

for (const key of windows) {
  const source = raw.periods?.[key];
  if (!source) throw new Error(`Missing ${key} install-intent snapshot`);
  const observedSignals = number(source.uniqueVisitors);
  const observedCountries = number(source.observedCountries);
  const publicCountries = (source.countries || [])
    .map(row => ({ name: String(row.name), signals: number(row.visitors) }))
    .filter(row => row.signals >= threshold)
    .sort((left, right) => right.signals - left.signals || left.name.localeCompare(right.name));
  publicCountries.forEach((country, index) => { country.rank = index + 1; });
  const publishedSignals = publicCountries.reduce((sum, row) => sum + row.signals, 0);
  const us = publicCountries.find(country => country.name === 'United States');
  const periodDays = Math.round((Date.parse(`${source.end}T00:00:00Z`) - Date.parse(`${source.start}T00:00:00Z`)) / 86400000) + 1;
  const labels = { '30d': 'Last 30 days', '90d': 'Last 3 months', '180d': 'Last 6 months' };
  const modelRequests = {
    sourceGoal: String(source.modelRequests?.sourceGoal || 'model_runtime_launch_requested'),
    metric: 'download or desktop-runtime launch requests',
    completions: number(source.modelRequests?.completions || 0),
    uniqueVisitors: number(source.modelRequests?.uniqueVisitors || 0),
    publishThreshold: number(source.modelRequests?.publishThreshold || 2),
    models: (source.modelRequests?.models || [])
      .map(row => ({ model: String(row.model), requests: number(row.requests) }))
      .filter(row => row.requests >= number(source.modelRequests?.publishThreshold || 2))
      .sort((left, right) => right.requests - left.requests || left.model.localeCompare(right.model))
      .map((row, index) => ({ rank: index + 1, ...row }))
  };
  const payload = {
    schemaVersion: 1,
    indexName: 'Local AI Activity Index',
    view: 'installed',
    status: 'beta',
    source: 'Aggregated anonymous LocalClaw install-intent goals measured by DataFast',
    sourceUrl: 'https://localclaw.io/local-ai-activity-index#methodology',
    metric: 'unique visitors completing at least one install-intent goal',
    publishThreshold: threshold,
    claimBoundary: 'Install intent only; a website click or desktop-app handoff does not verify a completed model download, installation, launch, or inference event.',
    timezone: source.timezone || 'Europe/Zurich',
    period: {
      start: source.start,
      end: source.end,
      label: labels[key],
      key,
      days: periodDays
    },
    generatedAt: raw.generatedAt,
    trackingCoverage: {
      canonicalGoal: 'model_install_intent',
      canonicalGoalStartedAt: raw.canonicalGoalStartedAt,
      historicalGoalFamilyStartedAt: raw.historicalGoalFamilyStartedAt,
      includedGoals: raw.includedGoals,
      note: 'The historical snapshot is a de-duplicated visitor union across the listed legacy goal names. The canonical model_install_intent goal is used for future refreshes while the legacy family remains included for continuity.'
    },
    totals: {
      signals: observedSignals,
      regions: observedCountries,
      observedSignals,
      observedRegions: observedCountries,
      publishedSignals,
      publishedRegions: publicCountries.length,
      withheldSignals: observedSignals - publishedSignals,
      withheldRegions: observedCountries - publicCountries.length
    },
    countries: publicCountries,
    subnational: {
      'United States': emptyUnitedStates(us?.signals || 0, number(source.usObservedRegions || 0), number(source.usGeolocatedSignals || 0))
    },
    cityClusterMethodology: {
      source: 'No city-cluster layer is published for install intent in this snapshot',
      metric: 'unique visitors completing at least one install-intent goal',
      publishThreshold: threshold,
      generatedAt: raw.generatedAt,
      privacyNote: 'No person, device, IP address, exact event location, or below-threshold geography is exposed.',
      mappingNote: 'Country color is the only published geographic layer until a country-filtered region or city row independently reaches five unique visitors.',
      remainderTreatment: 'Below-threshold geographic detail remains included only in aggregate withheld totals.'
    },
    cityClusters: [],
    modelRequests
  };

  const suffix = suffixFor(key);
  fs.writeFileSync(path.join(ROOT, 'data', `local-ai-install-intent${suffix}.json`), `${JSON.stringify(payload, null, 2)}\n`);

  const admin1Countries = Object.fromEntries(publicCountries.map(country => [country.name, {
    countryCode: country.name === 'United States' ? 'US' : country.name === 'Germany' ? 'DE' : country.name === 'India' ? 'IN' : '',
    adm0A3: country.name === 'United States' ? 'USA' : country.name === 'Germany' ? 'DEU' : country.name === 'India' ? 'IND' : '',
    collectionStatus: 'collected',
    publicationStatus: 'none_above_threshold',
    snapshotGeneratedAt: raw.generatedAt,
    countrySignals: country.signals,
    publishedSignals: 0,
    publishedRegions: 0,
    regions: []
  }]));
  const admin1 = {
    schemaVersion: 1,
    view: 'installed',
    generatedAt: raw.generatedAt,
    period: payload.period,
    source: {
      provider: 'DataFast',
      dimension: 'region',
      method: 'Country-filtered regional analytics for the install-intent goal family',
      snapshotNote: 'No regional row independently reached the five-visitor threshold in this snapshot.'
    },
    publishThreshold: threshold,
    privacy: {
      rule: 'Only regional rows with at least five unique install-intent visitors are included.',
      withheldDetail: 'Counts and identities below the threshold are not included in this public file.'
    },
    countries: admin1Countries
  };
  fs.writeFileSync(path.join(ROOT, 'data', `local-ai-install-intent-admin1${suffix}.json`), `${JSON.stringify(admin1, null, 2)}\n`);
}

console.log('Generated 30D, 3M and 6M public install-intent Atlas datasets.');
