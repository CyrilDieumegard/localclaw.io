const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rawPath = process.argv[2];
const threshold = 5;
const windows = ['30d', '90d', '180d'];
const referenceAdmin1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'local-ai-admin1-activity.json'), 'utf8'));
const destinationKinds = Object.freeze({
  huggingface: 'Model repository',
  github: 'Project repository',
  lmstudio: 'Desktop app',
  unsloth: 'Desktop app',
  ollama: 'Local runtime',
  llamacpp: 'Local runtime',
  python: 'Python package',
  comfyui: 'Desktop app',
  drawthings: 'Desktop app',
  gradio: 'Setup guide',
  mlx: 'Local runtime',
  pytorch: 'Python setup',
  official: 'Official project'
});

if (!rawPath) {
  throw new Error('Usage: node scripts/generate-install-intent-atlas.js /absolute/path/to/private-datafast-install-intent.json');
}

const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'));
const basePeriod = raw.periods?.['30d'];
const forbiddenGoals = new Set(['model_install_localclaw', 'model_runtime_localclaw']);

if (!basePeriod) throw new Error('Missing 30d install-intent snapshot');
if (raw.hostname !== 'localclaw.io') throw new Error(`Install-intent snapshot must be filtered to localclaw.io, received: ${raw.hostname || 'missing'}`);
if (!Array.isArray(raw.includedGoals) || raw.includedGoals.some(goal => forbiddenGoals.has(goal))) {
  throw new Error('Install-intent snapshot includes a hardware-check or pricing LocalClaw goal');
}
if (!basePeriod.observedStartAtInclusive || !basePeriod.observedEndAtExclusive) {
  throw new Error('Install-intent snapshot must declare the exact observed interval');
}

function number(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Invalid non-negative integer: ${value}`);
  return parsed;
}

function text(value, label) {
  const parsed = String(value || '').trim();
  if (!parsed) throw new Error(`Missing ${label}`);
  return parsed;
}

function suffixFor(key) {
  return key === '30d' ? '' : `-${key}`;
}

function publicRows(rows, label) {
  return (rows || [])
    .map(row => ({ ...row, id: text(row.id, `${label} id`), label: text(row.label, `${label} label`), visitors: number(row.visitors) }))
    .filter(row => row.visitors >= threshold)
    .sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label))
    .map((row, index) => ({ rank: index + 1, ...row }));
}

function verifyPublicAsset(assetPath, label) {
  if (!assetPath || !String(assetPath).startsWith('/')) throw new Error(`Invalid ${label}: ${assetPath}`);
  const filePath = path.join(ROOT, String(assetPath).replace(/^\//, ''));
  if (!fs.existsSync(filePath)) throw new Error(`Missing ${label}: ${assetPath}`);
}

function emptyUnitedStates(countrySignals, observedRegions = 0, geolocatedSignals = 0) {
  return {
    division: 'state',
    source: 'DataFast region breakdown filtered to the eligible install-path goal family',
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
      'Install intent means that a website visitor selected an eligible model setup, repository, or desktop-app path; it is not a verified installation.',
      'Region is an approximate network location reported by DataFast, not verified residence.',
      'No state independently reached the five-visitor publication threshold in this snapshot.'
    ],
    regions: []
  };
}

for (const key of windows) {
  const rawPeriod = raw.periods?.[key];
  if (!rawPeriod) throw new Error(`Missing ${key} install-intent snapshot`);
  const source = rawPeriod.inherits === '30d' ? { ...basePeriod, ...rawPeriod } : rawPeriod;
  const observedSignals = number(source.uniqueVisitors);
  const observedCountries = number(source.observedCountries);
  const globalModels = publicRows(source.modelAttribution?.models, 'model');
  const globalRuntimes = publicRows(source.runtimePaths, 'runtime');
  const globalModalities = publicRows(source.modalities, 'modality');

  for (const model of globalModels) {
    model.path = text(model.path, 'model path');
    model.logo = text(model.logo, 'model logo');
    model.kind = text(model.kind, 'model kind');
    model.family = text(model.family, 'model family');
    model.recommendedProfile = text(model.recommendedProfile, 'model recommended profile');
    model.profileMeaning = 'LocalClaw catalogue recommendation, not a measured download choice';
    verifyPublicAsset(model.logo, 'model logo');
    if (!fs.existsSync(path.join(ROOT, `${model.path.replace(/^\//, '')}.html`))) {
      throw new Error(`Missing model page: ${model.path}`);
    }
  }
  for (const runtime of globalRuntimes) {
    runtime.kind = destinationKinds[runtime.id] || 'Setup destination';
    verifyPublicAsset(runtime.logo, 'destination logo');
  }

  const publicCountries = (source.countries || [])
    .map(row => ({
      name: text(row.name, 'country name'),
      countryCode: String(row.countryCode || '').toUpperCase(),
      adm0A3: String(row.adm0A3 || '').toUpperCase(),
      signals: number(row.visitors)
    }))
    .filter(row => row.signals >= threshold)
    .sort((left, right) => right.signals - left.signals || left.name.localeCompare(right.name));
  const countryDetails = source.countryDetails || {};
  publicCountries.forEach((country, index) => {
    country.rank = index + 1;
    const detail = countryDetails[country.name] || {};
    const models = publicRows(detail.models, `${country.name} model`);
    const runtimes = publicRows(detail.runtimes, `${country.name} runtime`);
    const modalities = publicRows(detail.modalities, `${country.name} modality`);
    for (const model of models) verifyPublicAsset(model.logo, `${country.name} model logo`);
    for (const runtime of runtimes) {
      runtime.kind = destinationKinds[runtime.id] || 'Setup destination';
      verifyPublicAsset(runtime.logo, `${country.name} destination logo`);
    }
    country.installIntent = {
      modelStatus: models.length ? 'published' : 'withheld_below_threshold',
      runtimeStatus: runtimes.length ? 'published' : 'withheld_below_threshold',
      modalityStatus: modalities.length ? 'published' : 'withheld_below_threshold',
      models,
      runtimes,
      modalities
    };
  });

  const publishedSignals = publicCountries.reduce((sum, row) => sum + row.signals, 0);
  const us = publicCountries.find(country => country.name === 'United States');
  const periodDays = Math.round((Date.parse(`${source.end}T00:00:00Z`) - Date.parse(`${source.start}T00:00:00Z`)) / 86400000) + 1;
  const labels = { '30d': 'Last 30 days', '90d': 'Last 3 months', '180d': 'Last 6 months' };
  const publishedCountryModelCells = publicCountries.reduce((sum, country) => sum + country.installIntent.models.length, 0);
  const publishedCountryRuntimeCells = publicCountries.reduce((sum, country) => sum + country.installIntent.runtimes.length, 0);
  const publishedCountryModalityCells = publicCountries.reduce((sum, country) => sum + country.installIntent.modalities.length, 0);

  const payload = {
    schemaVersion: 2,
    indexName: 'Local AI Activity Index',
    view: 'installed',
    displayName: 'Install paths',
    status: 'beta',
    source: 'Aggregated anonymous LocalClaw install-path selections measured by DataFast',
    sourceUrl: 'https://localclaw.io/local-ai-activity-index#methodology',
    metric: 'unique visitors selecting at least one eligible model setup, repository, or desktop-app path',
    publishThreshold: threshold,
    claimBoundary: 'Click intent only. It does not verify a completed download, installation, model launch, inference, or active use.',
    timezone: source.timezone || 'Europe/Zurich',
    period: {
      start: source.start,
      end: source.end,
      startAtInclusive: source.startAtInclusive,
      endAtExclusive: source.endAtExclusive,
      label: labels[key],
      key,
      days: periodDays,
      trackingStartedAt: raw.historicalGoalFamilyStartedAt,
      effectiveCoverageDays: number(source.effectiveCoverageDays),
      partial: Boolean(source.partial),
      observedStartAtInclusive: source.observedStartAtInclusive || rawPeriod.observedStartAtInclusive || basePeriod.observedStartAtInclusive,
      observedEndAtExclusive: source.observedEndAtExclusive || rawPeriod.observedEndAtExclusive || basePeriod.observedEndAtExclusive
    },
    generatedAt: raw.generatedAt,
    privacy: {
      minimumUniqueVisitors: threshold,
      appliesIndependentlyTo: ['country', 'region', 'model', 'destination_path', 'modality', 'country_model', 'country_destination_path', 'country_modality'],
      note: 'Counts below threshold and all visitor-level journeys are absent from the public files.'
    },
    trackingCoverage: {
      canonicalGoal: 'model_install_intent',
      canonicalGoalStartedAt: raw.canonicalGoalStartedAt,
      historicalGoalFamilyStartedAt: raw.historicalGoalFamilyStartedAt,
      hostname: raw.hostname || 'localclaw.io',
      includedGoals: raw.includedGoals,
      partial: Boolean(source.partial),
      effectiveCoverageDays: number(source.effectiveCoverageDays),
      note: 'The snapshot de-duplicates visitors across eligible legacy and canonical goal names. Compare, hardware-check, pricing, help, and self-reported confirmation actions are excluded from the install-intent total.'
    },
    stages: {
      pathSelected: { available: true, publicMetric: true },
      modelJourneyAttributed: { available: true, publicMetric: true },
      desktopHandoffRequested: { available: true, publicMetric: false },
      appOpenSelfReported: { available: true, publicMetric: false },
      downloadCompleted: { available: false, publicMetric: false },
      installationVerified: { available: false, publicMetric: false },
      inferenceCompleted: { available: false, publicMetric: false }
    },
    totals: {
      signals: observedSignals,
      globalVisitors: observedSignals,
      regions: observedCountries,
      observedSignals,
      observedRegions: observedCountries,
      publishedSignals,
      publishedCountryCellVisitors: publishedSignals,
      countryCellVisitors: number(source.countryCellVisitors),
      withheldCountryCellVisitors: number(source.withheldCountryCellVisitors),
      publishedRegions: publicCountries.length,
      withheldRegions: observedCountries - publicCountries.length,
      countryCellCounting: 'Unique within each country row; a visitor can appear in more than one country during the period, so country rows and publishedSignals must not be subtracted from the global unique-visitor total.',
      attributedModelVisitors: number(source.modelAttribution?.uniqueVisitors),
      publishedModelPaths: globalModels.length,
      publishedRuntimePaths: globalRuntimes.length
    },
    countries: publicCountries,
    subnational: {
      'United States': emptyUnitedStates(us?.signals || 0, number(source.usObservedRegions || 0), number(source.usGeolocatedSignals || 0))
    },
    cityClusterMethodology: {
      source: 'No city-cluster layer is published for install intent in this snapshot',
      metric: 'unique visitors selecting at least one eligible install path',
      publishThreshold: threshold,
      generatedAt: raw.generatedAt,
      privacyNote: 'No person, device, IP address, exact event location, or below-threshold geography is exposed.',
      mappingNote: 'Country color is the only geographic layer until a country-filtered region independently reaches five unique visitors.',
      remainderTreatment: 'Below-threshold geographic detail remains included only in aggregate withheld totals.'
    },
    cityClusters: [],
    installIntentDetails: {
      attribution: {
        method: 'The immediately preceding eligible canonical LocalClaw model page in the same anonymous visitor journey is attributed to a supported path-selection event.',
        modelAttributionStartedAt: raw.modelAttributionStartedAt,
        publishThreshold: threshold,
        claimBoundary: 'Journey attribution identifies the model page that preceded the selection. It does not prove which file was downloaded or whether installation succeeded.'
      },
      totals: {
        attributedVisitors: number(source.modelAttribution?.uniqueVisitors),
        publishedModels: globalModels.length,
        publishedRuntimes: globalRuntimes.length,
        publishedModalities: globalModalities.length,
        publishedCountryModelCells,
        publishedCountryRuntimeCells,
        publishedCountryModalityCells
      },
      models: globalModels,
      runtimes: globalRuntimes,
      modalities: globalModalities,
      countNote: 'Each row is a unique-visitor count. One visitor can select multiple model, destination, or modality paths, so rows overlap and must not be summed.'
    }
  };

  const suffix = suffixFor(key);
  fs.writeFileSync(path.join(ROOT, 'data', `local-ai-install-intent${suffix}.json`), `${JSON.stringify(payload, null, 2)}\n`);

  const admin1Countries = Object.fromEntries(publicCountries.map(country => {
    const reference = referenceAdmin1.countries?.[country.name] || {};
    const coverage = source.regionalCoverage?.[country.name] || {};
    const collected = coverage.collectionStatus === 'collected';
    return [country.name, {
      countryCode: country.countryCode || reference.countryCode || '',
      adm0A3: country.adm0A3 || reference.adm0A3 || '',
      collectionStatus: collected ? 'collected' : 'not_collected',
      publicationStatus: collected ? 'none_above_threshold' : 'not_evaluated',
      snapshotGeneratedAt: raw.generatedAt,
      countrySignals: country.signals,
      observedRegions: collected ? number(coverage.observedRegions) : 0,
      geolocatedSignals: collected ? number(coverage.geolocatedSignals) : 0,
      unassignedSignals: collected ? Math.max(0, country.signals - number(coverage.geolocatedSignals)) : country.signals,
      publishedSignals: 0,
      publishedRegions: 0,
      regions: []
    }];
  }));
  const admin1 = {
    schemaVersion: 2,
    view: 'installed',
    displayName: 'Install paths',
    generatedAt: raw.generatedAt,
    period: payload.period,
    source: {
      provider: 'DataFast',
      dimension: 'region',
      method: 'Country-filtered regional analytics for the eligible install-path goal family',
      snapshotNote: 'Collected country breakdowns publish no regional row unless it independently reaches the five-visitor threshold. Countries without a collected breakdown are explicitly marked not_collected.'
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

console.log('Generated privacy-thresholded 30D, 3M and 6M install-path Atlas datasets.');
