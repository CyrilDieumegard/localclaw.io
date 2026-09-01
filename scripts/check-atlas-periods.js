const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
const modelExpected = [
  { key: '30d', days: 30, start: '2026-07-31', end: '2026-08-29', suffix: '', visitors: 791, countries: 14, brandCells: 31, modelCells: 29, globalBrands: 22, omittedScopes: 0 },
  { key: '90d', days: 90, start: '2026-06-01', end: '2026-08-29', suffix: '-90d', visitors: 2015, countries: 28, brandCells: 79, modelCells: 79, globalBrands: 31, omittedScopes: 4 },
  { key: '180d', days: 180, start: '2026-03-03', end: '2026-08-29', suffix: '-180d', visitors: 2193, countries: 28, brandCells: 86, modelCells: 97, globalBrands: 27, omittedScopes: 10 }
];

function read(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
  } catch (error) {
    issue(`${relativePath} could not be read: ${error.message}`);
    return null;
  }
}

function unexpectedKeys(value, allowedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const allowed = new Set(allowedKeys);
  return Object.keys(value).filter(key => !allowed.has(key));
}

function forbiddenModelDataKeys(value, trail = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => forbiddenModelDataKeys(entry, `${trail}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== 'object') return findings;
  for (const [key, child] of Object.entries(value)) {
    if (['requests', 'completions', 'modeldemand'].includes(key.toLowerCase())) findings.push(`${trail}.${key}`);
    forbiddenModelDataKeys(child, `${trail}.${key}`, findings);
  }
  return findings;
}

function canonicalBrandId(asset) {
  return String(asset || '')
    .replace(/-official-color$/, '')
    .replace(/-inverted$/, '')
    .replace(/-avatar$/, '');
}

function canonicalBrandLabel(brandId) {
  const overrides = {
    ai2: 'AI2',
    alibaba: 'Alibaba',
    bespokelabs: 'Bespoke Labs',
    bigcode: 'BigCode',
    codegeex: 'CodeGeeX',
    dbrx: 'DBRX',
    deepcogito: 'Deep Cogito',
    deepseek: 'DeepSeek',
    huggingfaceh4: 'Hugging Face H4',
    huggingfacetb: 'Hugging Face TB',
    ibm: 'IBM',
    inclusionai: 'InclusionAI',
    internlm: 'InternLM',
    internscience: 'InternScience',
    lg: 'LG',
    liquid: 'Liquid AI',
    llava: 'LLaVA',
    longcat: 'LongCat',
    minimax: 'MiniMax',
    miromind: 'MiroMind',
    nousresearch: 'Nous Research',
    numind: 'NuMind',
    nvidia: 'NVIDIA',
    odaxai: 'OdaxAI',
    'open-thoughts': 'Open Thoughts',
    openai: 'OpenAI',
    openbmb: 'OpenBMB',
    openchat: 'OpenChat',
    opengvlab: 'OpenGVLab',
    prismml: 'PrismML',
    qwen: 'Qwen',
    smallthinker: 'SmallThinker',
    stepfun: 'StepFun',
    'swiss-ai': 'Swiss AI',
    tinyllama: 'TinyLlama',
    xiaomimimo: 'Xiaomi MiMo',
    zeroone: 'ZeroOne',
    zhipu: 'Zhipu AI'
  };
  if (overrides[brandId]) return overrides[brandId];
  return String(brandId || '').split('-').filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function loadCanonicalModelCatalogue() {
  const models = new Map();
  const brands = new Map();
  const ambiguousIds = new Set();
  try {
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8')};this.APP_DATA=APP_DATA;`, context);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-avatar-formats-20260814a.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-logos-20260814c.js'), 'utf8'), context);
    const unavailable = new Set(Object.keys(context.APP_DATA?.hfRepoVerification?.unavailable || {}));
    const rowsById = new Map();
    for (const model of context.APP_DATA?.models || []) {
      if (!model?.id || model.hosted_only || unavailable.has(model.id)) continue;
      const rows = rowsById.get(model.id) || [];
      rows.push(model);
      rowsById.set(model.id, rows);
    }
    const logos = context.window.HOME_INDEX_LOGOS?.llm || {};
    const formats = context.window.HOME_INDEX_AVATAR_FORMATS || {};
    for (const [id, rows] of rowsById) {
      const families = new Set(rows.map(row => String(row.family || '').trim()).filter(Boolean));
      if (families.size !== 1) {
        ambiguousIds.add(id);
        continue;
      }
      const family = [...families][0];
      const asset = logos[family];
      if (!asset) continue;
      const logo = `/images/model-logos/${asset}.${formats[asset] || 'svg'}`;
      const brandId = canonicalBrandId(asset);
      const model = rows.at(-1);
      models.set(id, { id, label: String(model.name || id), family, path: `/models/${id}`, brandId, logo });
      const existing = brands.get(brandId);
      if (existing && existing.logo !== logo) issue(`Canonical model brand ${brandId} maps to conflicting logos`);
      else brands.set(brandId, { id: brandId, label: canonicalBrandLabel(brandId), logo });
    }
  } catch (error) {
    issue(`Canonical model catalogue could not be loaded: ${error.message}`);
  }
  return { models, brands, ambiguousIds };
}

function validateDominantBrands(dominantBrands, brands, label) {
  if (!Array.isArray(dominantBrands)) {
    issue(`${label} dominantBrands must be an array`);
    return;
  }
  const maximum = brands[0]?.visitors;
  const expectedIds = maximum === undefined
    ? []
    : brands.filter(brand => brand.visitors === maximum).map(brand => brand.id).sort();
  const actualIds = [...dominantBrands].sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    issue(`${label} dominantBrands do not match all tied visitor leaders`);
  }
}

function validateModelBrands(brands, label, catalogue) {
  if (!Array.isArray(brands)) {
    issue(`${label} brands must be an array`);
    return [];
  }
  const seenBrands = new Set();
  let previousVisitors = Infinity;
  brands.forEach((brand, brandIndex) => {
    const brandLabel = `${label} brand ${brandIndex + 1}`;
    const extraBrandKeys = unexpectedKeys(brand, ['rank', 'id', 'label', 'logo', 'visitors', 'models', 'modelsStatus']);
    if (extraBrandKeys.length) issue(`${brandLabel} has unexpected fields: ${extraBrandKeys.join(', ')}`);
    if (brand.rank !== brandIndex + 1 || !brand.id || seenBrands.has(brand.id)) {
      issue(`${brandLabel} has a non-contiguous rank or duplicate id`);
    }
    seenBrands.add(brand.id);
    if (!brand.label || !Number.isInteger(brand.visitors) || brand.visitors < 5 || brand.visitors > previousVisitors) {
      issue(`${brandLabel} violates ranking or the five-visitor brand threshold`);
    }
    previousVisitors = brand.visitors;
    const canonicalBrand = catalogue.brands.get(brand.id);
    if (!canonicalBrand || brand.label !== canonicalBrand.label || brand.logo !== canonicalBrand.logo) {
      issue(`${brandLabel} does not use its canonical LocalClaw label and logo`);
    }
    if (!/^\/images\/model-logos\/[a-z0-9][a-z0-9._-]*\.(?:svg|png|webp)$/i.test(String(brand.logo || ''))
      || !fs.existsSync(path.join(ROOT, String(brand.logo || '').replace(/^\//, '')))) {
      issue(`${brandLabel} logo must be an existing local model-logo asset`);
    }
    const models = Array.isArray(brand.models) ? brand.models : null;
    if (!models) {
      issue(`${brandLabel} models must be an array`);
      return;
    }
    if (brand.modelsStatus !== (models.length ? 'published' : 'withheld_below_threshold')) {
      issue(`${brandLabel} modelsStatus does not match its published model rows`);
    }
    const seenModels = new Set();
    let previousModelVisitors = Infinity;
    models.forEach((model, modelIndex) => {
      const modelLabel = `${brandLabel} model ${modelIndex + 1}`;
      const extraModelKeys = unexpectedKeys(model, ['rank', 'id', 'label', 'family', 'path', 'visitors']);
      if (extraModelKeys.length) issue(`${modelLabel} has unexpected fields: ${extraModelKeys.join(', ')}`);
      if (model.rank !== modelIndex + 1 || !model.id || seenModels.has(model.id)) {
        issue(`${modelLabel} has a non-contiguous rank or duplicate id`);
      }
      seenModels.add(model.id);
      if (!model.label || !model.family || !Number.isInteger(model.visitors) || model.visitors < 5
        || model.visitors > brand.visitors || model.visitors > previousModelVisitors) {
        issue(`${modelLabel} violates ranking, parent bounds, or the five-visitor model threshold`);
      }
      previousModelVisitors = model.visitors;
      if (model.path !== `/models/${model.id}` || /(?:\.html|[?#]|\/$)/i.test(String(model.path || ''))
        || !fs.existsSync(path.join(ROOT, 'models', `${model.id}.html`))) {
        issue(`${modelLabel} must resolve through the canonical /models/<id> route`);
      }
      if (catalogue.ambiguousIds.has(model.id)) {
        issue(`${modelLabel} references an APP_DATA id with divergent families`);
        return;
      }
      const canonicalModel = catalogue.models.get(model.id);
      if (!canonicalModel || model.label !== canonicalModel.label || model.family !== canonicalModel.family
        || model.path !== canonicalModel.path || canonicalModel.brandId !== brand.id) {
        issue(`${modelLabel} does not match its canonical APP_DATA record and brand`);
      }
    });
  });
  return brands;
}

function modelBrandMap(scope) {
  return new Map((scope?.brands || []).map(brand => [brand.id, brand]));
}

function modelRowMap(brand) {
  return new Map((brand?.models || []).map(model => [model.id, model]));
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
  if (data.schemaVersion !== 2 || data.view !== 'installed' || data.displayName !== 'Install paths'
    || data.period?.key !== window.key || data.period?.days !== window.days
    || data.period?.start !== window.start || data.period?.end !== window.end || data.publishThreshold !== 5) {
    issue(`${window.key} install-intent period metadata is invalid`);
  }
  if (data.totals?.observedSignals !== 58 || data.totals?.globalVisitors !== 58
    || data.totals?.observedRegions !== 29 || data.totals?.publishedSignals !== 24
    || data.totals?.publishedCountryCellVisitors !== 24 || data.totals?.countryCellVisitors !== 60
    || data.totals?.withheldCountryCellVisitors !== 36 || data.totals?.publishedRegions !== 3
    || data.totals?.withheldRegions !== 26 || data.totals?.attributedModelVisitors !== 55
    || 'withheldSignals' in data.totals) {
    issue(`${window.key} install-intent totals do not match the approved goal-filtered snapshot`);
  }
  if ((data.countries || []).some(country => !Number.isInteger(country.signals) || country.signals < 5)
    || (data.countries || []).reduce((sum, country) => sum + country.signals, 0) !== data.totals?.publishedSignals) {
    issue(`${window.key} install-intent country rows violate the five-visitor threshold or do not reconcile`);
  }
  if (!String(data.totals?.countryCellCounting || '').includes('more than one country')
    || data.trackingCoverage?.hostname !== 'localclaw.io'
    || (data.trackingCoverage?.includedGoals || []).some(goal => ['model_install_localclaw', 'model_runtime_localclaw'].includes(goal))) {
    issue(`${window.key} install-intent snapshot must disclose overlapping country cells and exclude non-install LocalClaw goals`);
  }
  if (!Array.isArray(data.cityClusters) || data.cityClusters.length !== 0) {
    issue(`${window.key} install-intent snapshot must not invent city clusters`);
  }
  if (admin1.view !== 'installed' || admin1.publishThreshold !== 5
    || admin1.period?.start !== window.start || admin1.period?.end !== window.end
    || Object.keys(admin1.countries || {}).length !== 3
    || Object.values(admin1.countries || {}).some(country => country.collectionStatus !== 'collected' || country.publicationStatus !== 'none_above_threshold' || country.regions?.length !== 0)
    || admin1.countries?.['United States']?.countryCode !== 'US'
    || admin1.countries?.['United States']?.observedRegions !== 8
    || admin1.countries?.Germany?.observedRegions !== 4
    || admin1.countries?.India?.observedRegions !== 4) {
    issue(`${window.key} install-intent regional snapshot must publish no below-threshold region`);
  }
  if (!String(data.claimBoundary || '').toLowerCase().includes('does not verify')) {
    issue(`${window.key} install-intent snapshot must retain the click-versus-installation claim boundary`);
  }
  const details = data.installIntentDetails;
  if (!details || details.attribution?.publishThreshold !== 5
    || JSON.stringify((details.models || []).map(row => [row.id, row.visitors])) !== JSON.stringify([['qwen3.8-27b', 6]])
    || JSON.stringify((details.runtimes || []).map(row => [row.id, row.visitors])) !== JSON.stringify([
      ['huggingface', 23], ['lmstudio', 16], ['unsloth', 16]
    ])
    || JSON.stringify((details.modalities || []).map(row => [row.id, row.visitors])) !== JSON.stringify([
      ['llm', 33], ['voice', 22]
    ])
    || forbiddenModelDataKeys(details).length) {
    issue(`${window.key} install-intent model/destination detail must contain only privacy-thresholded unique-visitor rows`);
  }
  const installCountries = new Map((data.countries || []).map(country => [country.name, country]));
  if (JSON.stringify((data.countries || []).map(country => [country.name, country.signals])) !== JSON.stringify([
    ['United States', 11], ['Germany', 7], ['India', 6]
  ])
    || installCountries.get('United States')?.installIntent?.runtimes?.[0]?.visitors !== 7
    || installCountries.get('Germany')?.installIntent?.runtimes?.[0]?.visitors !== 5
    || (data.countries || []).some(country => (country.installIntent?.models || []).length !== 0)) {
    issue(`${window.key} install-intent country stack cells violate their independent threshold`);
  }
  if (data.period?.partial !== true || data.period?.effectiveCoverageDays !== 9
    || data.period?.observedStartAtInclusive !== '2026-08-21T00:00:00+02:00'
    || data.period?.observedEndAtExclusive !== '2026-08-30T00:00:00+02:00'
    || data.privacy?.minimumUniqueVisitors !== 5
    || data.stages?.installationVerified?.available !== false
    || data.stages?.inferenceCompleted?.available !== false) {
    issue(`${window.key} install-intent snapshot must disclose partial coverage and unavailable verified stages`);
  }
}

const canonicalModels = loadCanonicalModelCatalogue();
const modelSnapshots = new Map();
for (const window of modelExpected) {
  const dataPath = `data/local-ai-model-page-interest${window.suffix}.json`;
  const data = read(dataPath);
  if (!data) continue;
  modelSnapshots.set(window.key, data);
  const label = `${window.key} model-page-interest`;
  if (data.schemaVersion !== 1 || data.view !== 'model-page-interest' || data.status !== 'beta'
    || data.publishThreshold !== 5 || data.period?.key !== window.key || data.period?.days !== window.days
    || data.period?.start !== window.start || data.period?.end !== window.end) {
    issue(`${label} schema, threshold or period metadata is invalid`);
  }
  if (!/DataFast/i.test(JSON.stringify(data.source || data.methodology?.provider || ''))) {
    issue(`${label} must identify DataFast as its source`);
  }
  if (data.methodology?.provider !== 'DataFast'
    || data.methodology?.dimension !== 'hostname + country + exact canonical model paths'
    || data.methodology?.hostnameFilter !== 'localclaw.io'
    || !String(data.methodology?.modelPathRule || '').includes('/models/${APP_DATA.models[].id}')
    || /www\.localclaw\.io/i.test(JSON.stringify(data.methodology || {}))) {
    issue(`${label} methodology must use exact DataFast host, country and canonical APP_DATA model paths for localclaw.io, never www`);
  }
  if (!/unique visitors?/i.test(String(data.metric || '')) || !/canonical LocalClaw/i.test(String(data.metric || ''))
    || !/(?:LLM detail pages|\/models\/)/i.test(String(data.metric || ''))) {
    issue(`${label} metric must be unique visitors to canonical LocalClaw LLM detail pages`);
  }
  const claimBoundary = String(data.claimBoundary || '').toLowerCase();
  if (!claimBoundary.includes('model-page interest') || !/(?:not|does not|no )/.test(claimBoundary)
    || !claimBoundary.includes('download') || !claimBoundary.includes('install') || !claimBoundary.includes('launch')
    || !claimBoundary.includes('inference') || !claimBoundary.includes('verified') || !/(?:use|usage)/.test(claimBoundary)) {
    issue(`${label} must explicitly deny verified download, installation, launch, inference and use claims`);
  }
  if (/\bmost used\b|\bmodel usage by country\b|\bactive users?\b/i.test(JSON.stringify(data))) {
    issue(`${label} must not contain a positive most-used, model-usage-by-country or active-user claim`);
  }
  const forbiddenKeys = forbiddenModelDataKeys(data);
  if (forbiddenKeys.length) issue(`${label} contains retired fields: ${forbiddenKeys.join(', ')}`);

  const global = data.modelInterest?.global;
  if (!global || typeof global !== 'object' || Array.isArray(global)) {
    issue(`${label} is missing modelInterest.global`);
    continue;
  }
  const extraGlobalKeys = unexpectedKeys(global, ['signals', 'modelVisitors', 'brands', 'dominantBrands']);
  if (extraGlobalKeys.length) issue(`${label} global modelInterest has unexpected fields: ${extraGlobalKeys.join(', ')}`);
  if (!Number.isInteger(global.signals) || global.signals < 5
    || !Number.isInteger(global.modelVisitors) || global.modelVisitors < 5) {
    issue(`${label} global signals and modelVisitors must be publishable integer totals`);
  }
  const globalBrands = validateModelBrands(global.brands, `${label} global`, canonicalModels);
  if (globalBrands.length !== window.globalBrands) {
    issue(`${label} must retain ${window.globalBrands} approved global brand rows`);
  }
  validateDominantBrands(global.dominantBrands, globalBrands, `${label} global`);
  if (globalBrands.some(brand => brand.visitors > global.modelVisitors)) {
    issue(`${label} has a global brand total above the de-duplicated global model visitor total`);
  }
  const globalById = modelBrandMap(global);

  const countries = Array.isArray(data.countries) ? data.countries : [];
  if (!Array.isArray(data.countries)) issue(`${label} countries must be an array`);
  const seenCountries = new Set();
  let countryBrandsMissingFromGlobal = 0;
  let previousVisitors = Infinity;
  countries.forEach((country, countryIndex) => {
    const countryLabel = `${label} country ${countryIndex + 1}`;
    const extraCountryKeys = unexpectedKeys(country, ['rank', 'name', 'signals', 'modelVisitors', 'modelInterest']);
    if (extraCountryKeys.length) issue(`${countryLabel} has unexpected fields: ${extraCountryKeys.join(', ')}`);
    if (country.rank !== countryIndex + 1 || !country.name || seenCountries.has(country.name)) {
      issue(`${countryLabel} has a non-contiguous rank or duplicate name`);
    }
    seenCountries.add(country.name);
    if (!Number.isInteger(country.signals) || country.signals < 5
      || !Number.isInteger(country.modelVisitors) || country.modelVisitors < 5
      || country.modelVisitors > previousVisitors) {
      issue(`${countryLabel} violates ranking or the five-visitor country threshold`);
    }
    if (country.signals !== country.modelVisitors) {
      issue(`${countryLabel} signals must equal modelVisitors for runtime compatibility`);
    }
    previousVisitors = country.modelVisitors;
    const modelInterest = country.modelInterest;
    if (!modelInterest || typeof modelInterest !== 'object' || Array.isArray(modelInterest)) {
      issue(`${countryLabel} is missing modelInterest`);
      return;
    }
    const extraInterestKeys = unexpectedKeys(modelInterest, ['brands', 'dominantBrands']);
    if (extraInterestKeys.length) issue(`${countryLabel} modelInterest has unexpected fields: ${extraInterestKeys.join(', ')}`);
    const brands = validateModelBrands(modelInterest.brands, countryLabel, canonicalModels);
    validateDominantBrands(modelInterest.dominantBrands, brands, countryLabel);
    if (brands.some(brand => brand.visitors > country.modelVisitors)) {
      issue(`${countryLabel} has a brand total above the de-duplicated country model visitor total`);
    }
    for (const brand of brands) {
      const globalBrand = globalById.get(brand.id);
      if (!globalBrand) {
        countryBrandsMissingFromGlobal += 1;
        continue;
      }
      if (globalBrand.visitors < brand.visitors
        || globalBrand.label !== brand.label || globalBrand.logo !== brand.logo) {
        issue(`${countryLabel} brand ${brand.id} does not match or exceeds its global aggregate`);
        continue;
      }
      const globalModels = modelRowMap(globalBrand);
      for (const model of brand.models || []) {
        const globalModel = globalModels.get(model.id);
        if (!globalModel || globalModel.visitors < model.visitors) {
          issue(`${countryLabel} model ${model.id} does not match or exceeds its global aggregate`);
        }
      }
    }
  });

  const publishedBrandCells = countries.reduce((sum, country) => sum + (country.modelInterest?.brands?.length || 0), 0);
  const publishedModelCells = countries.reduce((sum, country) => sum + (country.modelInterest?.brands || [])
    .reduce((brandSum, brand) => brandSum + (brand.models?.length || 0), 0), 0);
  const countriesWithPublishedBrands = countries.filter(country => country.modelInterest?.brands?.length).length;
  const omittedProviderScopes = data.diagnostics?.omittedProviderInconsistentBrandScopes;
  if (!Number.isInteger(omittedProviderScopes) || omittedProviderScopes < 0
    || countryBrandsMissingFromGlobal > omittedProviderScopes) {
    issue(`${label} does not account for every country brand omitted from its fail-closed global provider scope`);
  }
  if (data.totals?.modelVisitors !== window.visitors
    || countries.length !== window.countries
    || publishedBrandCells !== window.brandCells
    || publishedModelCells !== window.modelCells
    || omittedProviderScopes !== window.omittedScopes) {
    issue(`${label} does not match the approved DataFast model-page-interest snapshot`);
  }
  if (data.totals?.publishedBrandCells !== publishedBrandCells
    || data.totals?.publishedModelCells !== publishedModelCells
    || data.totals?.countriesWithPublishedBrands !== countriesWithPublishedBrands
    || data.totals?.regions !== countries.length
    || data.totals?.regions !== data.totals?.countriesWithPublishedBrands) {
    issue(`${label} country, brand and model publication totals do not reconcile`);
  }
  if (data.totals?.signals !== data.totals?.modelVisitors
    || global.signals !== global.modelVisitors
    || data.totals?.signals !== global.signals
    || data.totals?.modelVisitors !== global.modelVisitors) {
    issue(`${label} root and global visitor totals do not reconcile`);
  }
}

for (const [shortKey, longKey] of [['30d', '90d'], ['90d', '180d']]) {
  const shorter = modelSnapshots.get(shortKey);
  const longer = modelSnapshots.get(longKey);
  if (!shorter || !longer) continue;
  for (const field of ['signals', 'modelVisitors', 'regions', 'countriesWithPublishedBrands', 'publishedBrandCells', 'publishedModelCells']) {
    if (!Number.isInteger(shorter.totals?.[field]) || !Number.isInteger(longer.totals?.[field])
      || longer.totals[field] < shorter.totals[field]) {
      issue(`Model-page-interest total ${field} must be monotone from ${shortKey} to ${longKey}`);
    }
  }
  if (longer.modelInterest?.global?.signals < shorter.modelInterest?.global?.signals
    || longer.modelInterest?.global?.modelVisitors < shorter.modelInterest?.global?.modelVisitors) {
    issue(`Global model-page visitors must be monotone from ${shortKey} to ${longKey}`);
  }
  const longerGlobalBrands = modelBrandMap(longer.modelInterest?.global);
  let missingLongerGlobalBrands = 0;
  for (const shortBrand of shorter.modelInterest?.global?.brands || []) {
    const longBrand = longerGlobalBrands.get(shortBrand.id);
    if (!longBrand) {
      missingLongerGlobalBrands += 1;
      continue;
    }
    if (longBrand.visitors < shortBrand.visitors) {
      issue(`Global brand ${shortBrand.id} must persist monotonically from ${shortKey} to ${longKey}`);
      continue;
    }
    const longerModels = modelRowMap(longBrand);
    for (const shortModel of shortBrand.models || []) {
      const longModel = longerModels.get(shortModel.id);
      if (!longModel || longModel.visitors < shortModel.visitors) {
        issue(`Global model ${shortModel.id} must persist monotonically from ${shortKey} to ${longKey}`);
      }
    }
  }
  if (missingLongerGlobalBrands > Number(longer.diagnostics?.omittedProviderInconsistentBrandScopes || 0)) {
    issue(`Global brands missing from ${longKey} exceed its disclosed fail-closed provider-inconsistent scopes`);
  }
  const longerCountries = new Map((longer.countries || []).map(country => [country.name, country]));
  for (const shortCountry of shorter.countries || []) {
    const longCountry = longerCountries.get(shortCountry.name);
    if (!longCountry || longCountry.signals < shortCountry.signals || longCountry.modelVisitors < shortCountry.modelVisitors) {
      issue(`${shortCountry.name} model-page visitors must persist monotonically from ${shortKey} to ${longKey}`);
      continue;
    }
    const longerBrands = modelBrandMap(longCountry.modelInterest);
    for (const shortBrand of shortCountry.modelInterest?.brands || []) {
      const longBrand = longerBrands.get(shortBrand.id);
      if (!longBrand || longBrand.visitors < shortBrand.visitors) {
        issue(`${shortCountry.name}/${shortBrand.id} must persist monotonically from ${shortKey} to ${longKey}`);
        continue;
      }
      const longerModels = modelRowMap(longBrand);
      for (const shortModel of shortBrand.models || []) {
        const longModel = longerModels.get(shortModel.id);
        if (!longModel || longModel.visitors < shortModel.visitors) {
          issue(`${shortCountry.name}/${shortBrand.id}/${shortModel.id} must persist monotonically from ${shortKey} to ${longKey}`);
        }
      }
    }
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
if (!/data-atlas-view=["']models["'][^>]*aria-pressed=["']false["']/i.test(page)
  || /data-atlas-view=["']models["'][^>]*data-coming-soon/i.test(page)) {
  issue('Atlas Models selector must be present and active');
}
if (!app.includes("modelDataUrl: '/data/local-ai-model-page-interest.json?")
  || !app.includes("modelDataUrl: '/data/local-ai-model-page-interest-90d.json?")
  || !app.includes("modelDataUrl: '/data/local-ai-model-page-interest-180d.json?")
  || !app.includes("requestedMetricView === 'models'")
  || !app.includes('PERIOD_CONFIG[ACTIVE_PERIOD].modelDataUrl')) {
  issue('Atlas Models selection is not wired to its 30D, 3M and 6M datasets');
}
if (!app.includes("url.searchParams.set('view', 'models')")
  || !app.includes("url.searchParams.set('range', ACTIVE_PERIOD)")
  || !app.includes("url.searchParams.set('country', state.selectedModelCountry.name)")
  || !app.includes("url.searchParams.set('brand', state.selectedModelBrand)")
  || !app.includes("brand: requestParams.get('brand')")
  || !app.includes('focusModelCountry(country, requestedView.brand)')) {
  issue('Models Share Mode must round-trip view, range, country and canonical brand');
}
if (!app.includes("url.searchParams.set('view', 'installed')")
  || !app.includes("url.searchParams.set('country', state.selectedInstallCountry.name)")
  || !app.includes("url.searchParams.set('model', state.selectedInstallModel)")
  || !app.includes("model: requestParams.get('model')")
  || !app.includes('focusInstallCountry(country, requestedView.model)')) {
  issue('Install paths Share Mode must round-trip view, range, country and canonical model');
}
if (!app.includes("status === 'published' || status === 'partially_published'")) {
  issue('Partially published regional periods must remain visible as published aggregates');
}

if (errors.length) {
  console.error(`Atlas period validation failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Atlas period validation passed: independent 30D, 3M and 6M activity, install-intent and model-page-interest views, privacy thresholds, monotone model cells, regional coverage, share state, city-parent reconciliation, and locked 12M coverage verified.');
