const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PAGE_PATH = 'local-ai-activity-index.html';
const DATA_PATH = 'data/local-ai-activity-index.json';
const SCRIPT_PATH = 'js/local-ai-activity-index.js';
const THEME_SCRIPT_PATH = 'js/theme-toggle.js';
const STYLE_PATH = 'css/local-ai-activity-index.css';
const VENDOR_PATH = 'js/vendor/three.module.min.js';
const VENDOR_LICENSE_PATH = 'js/vendor/THREE-LICENSE.txt';
const GEOJSON_PATH = 'data/ne_50m_admin_0_countries.geojson';
const ADMIN1_MANIFEST_PATH = 'data/admin1/manifest.json';
const ADMIN1_ACTIVITY_PATH = 'data/local-ai-admin1-activity.json';
const INSTALL_INTENT_PATH = 'data/local-ai-install-intent.json';
const INSTALL_INTENT_ADMIN1_PATH = 'data/local-ai-install-intent-admin1.json';
const MODEL_PAGE_INTEREST_PATH = 'data/local-ai-model-page-interest.json';
const ADMIN2_MANIFEST_PATH = 'data/admin2/manifest.json';
const ADMIN2_MODEL_ACTIVITY_PATHS = [
  ['30d', 'data/local-ai-admin2-model-activity.json', 9, 1],
  ['90d', 'data/local-ai-admin2-model-activity-90d.json', 12, 1],
  ['180d', 'data/local-ai-admin2-model-activity-180d.json', 12, 1]
];
const US_GEOJSON_PATH = 'data/us-states-2024-20m.geojson';
const CANONICAL_URL = 'https://localclaw.io/local-ai-activity-index';
const DATA_URL = 'https://localclaw.io/data/local-ai-activity-index.json';
const ADMIN1_ACTIVITY_URL = 'https://localclaw.io/data/local-ai-admin1-activity.json';
const ADMIN1_MANIFEST_URL = 'https://localclaw.io/data/admin1/manifest.json';
const EXPECTED_TITLE = 'Local AI Activity & Model Interest Map | LocalClaw Atlas';
const EXPECTED_H1 = 'See where local AI is taking off.';
const EXPECTED_SIGNALS = 3337;
const EXPECTED_OBSERVED_REGIONS = 113;
const EXPECTED_PUBLISHED_COUNTRY_SIGNALS = 3243;
const EXPECTED_PUBLISHED_COUNTRIES = 62;
const EXPECTED_WITHHELD_COUNTRY_SIGNALS = 94;
const EXPECTED_WITHHELD_COUNTRIES = 51;
const EXPECTED_CITY_CLUSTERS = 90;
const EXPECTED_CITY_CLUSTER_SIGNALS = 1591;
const EXPECTED_CITY_CLUSTER_GENERATED_AT = '2026-08-29T12:55:25+02:00';
const EXPECTED_COUNTRY_FINGERPRINT = '5b08c7f06786ddd71080976fd119f13ab7fa3f4736920afc7fb30e0d6a3b3515';
const EXPECTED_US_STATE_FINGERPRINT = '06b9bd93878f215819abbd6d44eb5759e5034d46eb0f1fb5ba42823159c45be7';
const EXPECTED_CITY_CLUSTER_FINGERPRINT = '9cd8e98cea83b9d96312aeb9acad538e3ff6c654e8ba098ac8b7c7ddf449044d';
const EXPECTED_US_PUBLISHED_SIGNALS = 1259;
const EXPECTED_US_PUBLISHED_REGIONS = 30;
const EXPECTED_ADMIN1_COUNTRIES = 242;
const EXPECTED_ADMIN1_FEATURES = 4558;
const EXPECTED_ADMIN1_COORDINATE_POSITIONS = 1288506;
const EXPECTED_ADMIN1_SINGLE_FEATURE_COUNTRIES = 32;
const EXPECTED_ADMIN1_MULTI_FEATURE_COUNTRIES = 210;
const EXPECTED_ADMIN1_ARCHIVE_SHA256 = 'efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05';
const EXPECTED_ADMIN1_GEOMETRY_FINGERPRINT = '4b4cd08e7186c7f7109bf9880e15799cbf3c401900f8708cfaadaece09589dd4';
const EXPECTED_ADMIN1_RECORD_FINGERPRINT = '381faf9e0bddc4fdf8c74abafdd10ac0d569c2dac83d34e18b7ac8c2318678dc';
const EXPECTED_ADMIN1_ACTIVITY_COUNTRIES = 61;
const EXPECTED_ADMIN1_ACTIVITY_REGIONS = 94;
const EXPECTED_ADMIN1_ACTIVITY_SIGNALS = 1214;
const EXPECTED_ADMIN2_PARENTS = 90;
const EXPECTED_ADMIN2_SUBDIVISIONS = 4047;
const EXPECTED_ADMIN2_COORDINATE_POSITIONS = 584249;
const EXPECTED_ADMIN2_GEOMETRY_FINGERPRINT = '19b8c479bcf0589c138f6bec67a02bd54651dbf5baddbdd6070cb470c7298e4e';
const EXPECTED_ADMIN2_RECORD_FINGERPRINT = 'f6ccf025f72ceb475dfd275b520cd6f4bf169209a423c8c4ffbe2ababdc937a0';
const EXPECTED_ADMIN1_PUBLICATION_STATUSES = new Map([
  ['published', 46],
  ['none_above_threshold', 14],
  ['boundary_unresolved', 1]
]);
const errors = [];

const expectedTop20 = [
  ['United States', 1309],
  ['Germany', 224],
  ['China', 209],
  ['United Kingdom', 118],
  ['India', 117],
  ['Netherlands', 85],
  ['France', 66],
  ['Canada', 66],
  ['Hong Kong', 65],
  ['Australia', 62],
  ['Switzerland', 57],
  ['Italy', 57],
  ['Spain', 46],
  ['Japan', 44],
  ['Brazil', 41],
  ['Poland', 40],
  ['Sweden', 38],
  ['South Korea', 30],
  ['Finland', 27],
  ['Russia', 27]
];

const expectedTopStates = [
  ['Oregon', 516],
  ['California', 171],
  ['New York', 63],
  ['Texas', 58],
  ['Virginia', 58],
  ['Florida', 43],
  ['Washington', 43],
  ['Illinois', 29],
  ['New Jersey', 27],
  ['District of Columbia', 22]
];

const expectedChinaRegions = [
  [1, 'Beijing', 'Beijing Shi', 'CN-BJ', 62],
  [2, 'Guangdong', 'Guangdong Sheng', 'CN-GD', 22],
  [3, 'Shanghai', 'Shanghai Shi', 'CN-SH', 7],
  [4, 'Jiangsu', 'Jiangsu Sheng', 'CN-JS', 6]
];

function issue(message) {
  errors.push(message);
}

function readFile(relativePath, label = relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    issue(`Missing ${label}: ${relativePath}`);
    return null;
  }
  const content = fs.readFileSync(absolutePath, 'utf8');
  if (!content.trim()) issue(`${label} is empty: ${relativePath}`);
  return content;
}

function parseJson(content, label) {
  if (content === null) return null;
  try {
    return JSON.parse(content);
  } catch (error) {
    issue(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–');
}

function textContent(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function attribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[1] ?? match[2]) : null;
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function countCoordinatePositions(value) {
  if (!Array.isArray(value)) return 0;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) return 1;
  return value.reduce((sum, child) => sum + countCoordinatePositions(child), 0);
}

function inspectCoordinatePositions(value, stats = {
  positions: 0,
  invalid: 0,
  minLon: Infinity,
  minLat: Infinity,
  maxLon: -Infinity,
  maxLat: -Infinity
}) {
  if (!Array.isArray(value)) return stats;
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    stats.positions += 1;
    const [lon, lat] = value;
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      stats.invalid += 1;
      return stats;
    }
    stats.minLon = Math.min(stats.minLon, lon);
    stats.minLat = Math.min(stats.minLat, lat);
    stats.maxLon = Math.max(stats.maxLon, lon);
    stats.maxLat = Math.max(stats.maxLat, lat);
    return stats;
  }
  for (const child of value) inspectCoordinatePositions(child, stats);
  return stats;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validBbox(value) {
  return Array.isArray(value)
    && value.length === 4
    && value.every(Number.isFinite)
    && value[0] >= -180
    && value[2] <= 180
    && value[1] >= -90
    && value[3] <= 90
    && value[0] <= value[2]
    && value[1] <= value[3];
}

function coordinateStatsForFeatures(features) {
  return features.reduce(
    (stats, feature) => inspectCoordinatePositions(feature.geometry?.coordinates, stats),
    { positions: 0, invalid: 0, minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity }
  );
}

function bboxFromStats(stats) {
  return [stats.minLon, stats.minLat, stats.maxLon, stats.maxLat];
}

function isPlaceholder(value) {
  return /^(?:|unknown|unnamed|n\/?a|null|none|-99|placeholder|tbd)$/i.test(String(value ?? '').trim());
}

function unexpectedKeys(value, allowedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const allowed = new Set(allowedKeys);
  return Object.keys(value).filter(key => !allowed.has(key));
}

function isIsoTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
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

function canonicalModelBrandId(asset) {
  return String(asset || '')
    .replace(/-official-color$/, '')
    .replace(/-inverted$/, '')
    .replace(/-avatar$/, '');
}

function canonicalModelBrandLabel(brandId) {
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
  return String(brandId || '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
      const extension = formats[asset] || 'svg';
      const logo = `/images/model-logos/${asset}.${extension}`;
      const brandId = canonicalModelBrandId(asset);
      const model = rows.at(-1);
      models.set(id, {
        id,
        label: String(model.name || id),
        family,
        brandId,
        logo,
        path: `/models/${id}`
      });
      const currentBrand = brands.get(brandId);
      if (currentBrand && currentBrand.logo !== logo) {
        issue(`Canonical model catalogue maps brand ${brandId} to conflicting logo assets`);
      } else {
        brands.set(brandId, { id: brandId, label: canonicalModelBrandLabel(brandId), logo });
      }
    }
  } catch (error) {
    issue(`Canonical model catalogue could not be loaded: ${error.message}`);
  }
  return { models, brands, ambiguousIds };
}

function validateModelBrandRows(brands, label, catalogue) {
  if (!Array.isArray(brands)) {
    issue(`${label} brands must be an array`);
    return [];
  }
  const seenBrands = new Set();
  let previousVisitors = Infinity;
  brands.forEach((brand, brandIndex) => {
    const rowLabel = `${label} brand row ${brandIndex + 1}`;
    const extraBrandKeys = unexpectedKeys(brand, ['rank', 'id', 'label', 'logo', 'visitors', 'models', 'modelsStatus']);
    if (extraBrandKeys.length) issue(`${rowLabel} has unexpected fields: ${extraBrandKeys.join(', ')}`);
    if (brand.rank !== brandIndex + 1) issue(`${rowLabel} rank must be contiguous`);
    if (!brand.id || seenBrands.has(brand.id)) issue(`${rowLabel} has a missing or duplicate id`);
    seenBrands.add(brand.id);
    if (!brand.label || !Number.isInteger(brand.visitors) || brand.visitors < 5) {
      issue(`${rowLabel} must publish a label and at least five de-duplicated visitors`);
    }
    if (brand.visitors > previousVisitors) issue(`${label} brands must be ranked by descending visitors`);
    previousVisitors = brand.visitors;

    const canonicalBrand = catalogue.brands.get(brand.id);
    if (!canonicalBrand) {
      issue(`${rowLabel} does not match a canonical LocalClaw model brand`);
    } else {
      if (brand.label !== canonicalBrand.label) issue(`${rowLabel} label must be ${canonicalBrand.label}`);
      if (brand.logo !== canonicalBrand.logo) issue(`${rowLabel} logo must be the canonical local asset ${canonicalBrand.logo}`);
    }
    if (!/^\/images\/model-logos\/[a-z0-9][a-z0-9._-]*\.(?:svg|png|webp)$/i.test(String(brand.logo || ''))
      || !fs.existsSync(path.join(ROOT, String(brand.logo || '').replace(/^\//, '')))) {
      issue(`${rowLabel} logo must resolve to an existing local model-logo asset`);
    }

    const models = Array.isArray(brand.models) ? brand.models : null;
    if (!models) {
      issue(`${rowLabel} models must be an array`);
      return;
    }
    if (brand.modelsStatus !== (models.length ? 'published' : 'withheld_below_threshold')) {
      issue(`${rowLabel} modelsStatus must distinguish published models from no individual page above threshold`);
    }
    const seenModels = new Set();
    let previousModelVisitors = Infinity;
    models.forEach((model, modelIndex) => {
      const modelLabel = `${rowLabel} model row ${modelIndex + 1}`;
      const extraModelKeys = unexpectedKeys(model, ['rank', 'id', 'label', 'family', 'path', 'visitors']);
      if (extraModelKeys.length) issue(`${modelLabel} has unexpected fields: ${extraModelKeys.join(', ')}`);
      if (model.rank !== modelIndex + 1) issue(`${modelLabel} rank must be contiguous`);
      if (!model.id || seenModels.has(model.id)) issue(`${modelLabel} has a missing or duplicate id`);
      seenModels.add(model.id);
      if (!model.label || !model.family || !Number.isInteger(model.visitors) || model.visitors < 5) {
        issue(`${modelLabel} must independently reach the five-visitor threshold`);
      }
      if (model.visitors > brand.visitors) issue(`${modelLabel} cannot exceed its de-duplicated brand total`);
      if (model.visitors > previousModelVisitors) issue(`${rowLabel} models must be ranked by descending visitors`);
      previousModelVisitors = model.visitors;
      if (model.path !== `/models/${model.id}` || /(?:\.html|[?#]|\/$)/i.test(String(model.path || ''))) {
        issue(`${modelLabel} must use the exact canonical path /models/${model.id}`);
      }
      if (!fs.existsSync(path.join(ROOT, 'models', `${model.id}.html`))) {
        issue(`${modelLabel} points to a model detail page that does not exist`);
      }
      if (catalogue.ambiguousIds.has(model.id)) {
        issue(`${modelLabel} references an APP_DATA id with divergent families`);
        return;
      }
      const canonicalModel = catalogue.models.get(model.id);
      if (!canonicalModel) {
        issue(`${modelLabel} does not match a canonical, locally runnable APP_DATA model`);
      } else {
        if (model.label !== canonicalModel.label) issue(`${modelLabel} label must match APP_DATA`);
        if (model.family !== canonicalModel.family) issue(`${modelLabel} family must match APP_DATA`);
        if (model.path !== canonicalModel.path) issue(`${modelLabel} path must match APP_DATA`);
        if (canonicalModel.brandId !== brand.id) issue(`${modelLabel} belongs to canonical brand ${canonicalModel.brandId}, not ${brand.id}`);
      }
    });
  });
  return brands;
}

function validateDominantModelBrands(dominantBrands, brands, label) {
  if (!Array.isArray(dominantBrands)) {
    issue(`${label} dominantBrands must be an array`);
    return;
  }
  const maximum = brands[0]?.visitors;
  const expected = maximum === undefined
    ? []
    : brands.filter(brand => brand.visitors === maximum).map(brand => brand.id).sort();
  const actual = [...dominantBrands].sort();
  if (!sameJson(actual, expected)) issue(`${label} dominantBrands must contain every tied visitor leader and nothing else`);
}

function validateModelPageInterestSnapshot(snapshot, label, expectedPeriod) {
  if (!snapshot) return;
  if (snapshot.schemaVersion !== 1 || snapshot.view !== 'model-page-interest' || snapshot.status !== 'beta') {
    issue(`${label} must use schemaVersion 1 and identify the beta model-page-interest view`);
  }
  if (snapshot.publishThreshold !== 5) issue(`${label} publish threshold must remain five visitors`);
  if (snapshot.period?.key !== expectedPeriod.key || snapshot.period?.days !== expectedPeriod.days
    || snapshot.period?.start !== expectedPeriod.start || snapshot.period?.end !== expectedPeriod.end) {
    issue(`${label} period metadata is invalid`);
  }
  if (!isIsoTimestamp(snapshot.generatedAt)) issue(`${label} generatedAt must be an ISO timestamp`);
  if (!/DataFast/i.test(JSON.stringify(snapshot.source || snapshot.methodology?.provider || ''))) {
    issue(`${label} must identify DataFast as its source`);
  }
  if (snapshot.methodology?.provider !== 'DataFast'
    || snapshot.methodology?.dimension !== 'hostname + country + exact canonical model paths'
    || snapshot.methodology?.hostnameFilter !== 'localclaw.io'
    || !String(snapshot.methodology?.modelPathRule || '').includes('/models/${APP_DATA.models[].id}')
    || /www\.localclaw\.io/i.test(JSON.stringify(snapshot.methodology || {}))) {
    issue(`${label} methodology must use exact DataFast host, country and canonical APP_DATA model paths for localclaw.io, never www`);
  }
  if (!/unique visitors?/i.test(String(snapshot.metric || '')) || !/canonical LocalClaw/i.test(String(snapshot.metric || ''))
    || !/(?:LLM detail pages|\/models\/)/i.test(String(snapshot.metric || ''))) {
    issue(`${label} metric must be unique visitors to canonical LocalClaw LLM detail pages`);
  }
  const claimBoundary = String(snapshot.claimBoundary || '').toLowerCase();
  if (!claimBoundary.includes('model-page interest') || !/(?:not|does not|no )/.test(claimBoundary)
    || !claimBoundary.includes('download') || !claimBoundary.includes('install') || !claimBoundary.includes('launch')
    || !claimBoundary.includes('inference') || !claimBoundary.includes('verified') || !/(?:use|usage)/.test(claimBoundary)) {
    issue(`${label} must explicitly limit the claim to page interest, not verified download, installation, launch, inference or use`);
  }
  const forbiddenKeys = forbiddenModelDataKeys(snapshot);
  if (forbiddenKeys.length) issue(`${label} contains retired request/completion/modelDemand fields: ${forbiddenKeys.join(', ')}`);

  const catalogue = loadCanonicalModelCatalogue();
  const global = snapshot.modelInterest?.global;
  if (!global || typeof global !== 'object' || Array.isArray(global)) {
    issue(`${label} is missing modelInterest.global`);
    return;
  }
  const globalBrands = validateModelBrandRows(global.brands, `${label} global`, catalogue);
  validateDominantModelBrands(global.dominantBrands, globalBrands, `${label} global`);
  if (!Number.isInteger(global.signals) || global.signals < 5
    || !Number.isInteger(global.modelVisitors) || global.modelVisitors < 5) {
    issue(`${label} global signals and modelVisitors must be publishable integer visitor totals`);
  }
  if (globalBrands.some(brand => brand.visitors > global.modelVisitors)) {
    issue(`${label} global brand visitors cannot exceed the de-duplicated global model-page total`);
  }

  const countries = Array.isArray(snapshot.countries) ? snapshot.countries : [];
  if (!Array.isArray(snapshot.countries)) issue(`${label} countries must be an array`);
  const globalByBrand = new Map(globalBrands.map(brand => [brand.id, brand]));
  const seenCountries = new Set();
  let countryBrandsMissingFromGlobal = 0;
  let previousCountryVisitors = Infinity;
  countries.forEach((country, countryIndex) => {
    const countryLabel = `${label} country row ${countryIndex + 1}`;
    const extraCountryKeys = unexpectedKeys(country, ['rank', 'name', 'signals', 'modelVisitors', 'modelInterest']);
    if (extraCountryKeys.length) issue(`${countryLabel} has unexpected fields: ${extraCountryKeys.join(', ')}`);
    if (country.rank !== countryIndex + 1) issue(`${countryLabel} rank must be contiguous`);
    if (!country.name || seenCountries.has(country.name)) issue(`${countryLabel} has a missing or duplicate name`);
    seenCountries.add(country.name);
    if (!Number.isInteger(country.signals) || country.signals < 5
      || !Number.isInteger(country.modelVisitors) || country.modelVisitors < 5) {
      issue(`${countryLabel} signals and modelVisitors must be publishable integer visitor totals`);
    }
    if (country.signals !== country.modelVisitors) {
      issue(`${countryLabel} signals must be the exact compatibility alias of modelVisitors`);
    }
    if (country.modelVisitors > previousCountryVisitors) issue(`${label} countries must be ranked by descending modelVisitors`);
    previousCountryVisitors = country.modelVisitors;
    const modelInterest = country.modelInterest;
    const extraInterestKeys = unexpectedKeys(modelInterest, ['brands', 'dominantBrands']);
    if (!modelInterest || typeof modelInterest !== 'object' || Array.isArray(modelInterest)) {
      issue(`${countryLabel} is missing modelInterest`);
      return;
    }
    if (extraInterestKeys.length) issue(`${countryLabel} modelInterest has unexpected fields: ${extraInterestKeys.join(', ')}`);
    const brands = validateModelBrandRows(modelInterest.brands, countryLabel, catalogue);
    validateDominantModelBrands(modelInterest.dominantBrands, brands, countryLabel);
    if (brands.some(brand => brand.visitors > country.modelVisitors)) {
      issue(`${countryLabel} brand visitors cannot exceed the de-duplicated country model-page total`);
    }
    for (const brand of brands) {
      const globalBrand = globalByBrand.get(brand.id);
      if (!globalBrand) {
        countryBrandsMissingFromGlobal += 1;
        continue;
      }
      if (globalBrand.label !== brand.label || globalBrand.logo !== brand.logo
        || globalBrand.visitors < brand.visitors) {
        issue(`${countryLabel} brand ${brand.id} must match and not exceed its global brand aggregate`);
        continue;
      }
      const globalModels = new Map((globalBrand.models || []).map(model => [model.id, model]));
      for (const model of brand.models || []) {
        const globalModel = globalModels.get(model.id);
        if (!globalModel || globalModel.visitors < model.visitors) {
          issue(`${countryLabel} model ${model.id} must match and not exceed its global model aggregate`);
        }
      }
    }
  });

  const publishedBrandCells = countries.reduce((sum, country) => sum + (country.modelInterest?.brands?.length || 0), 0);
  const publishedModelCells = countries.reduce((sum, country) => sum + (country.modelInterest?.brands || [])
    .reduce((brandSum, brand) => brandSum + (brand.models?.length || 0), 0), 0);
  const countriesWithPublishedBrands = countries.filter(country => country.modelInterest?.brands?.length).length;
  const omittedProviderScopes = snapshot.diagnostics?.omittedProviderInconsistentBrandScopes;
  if (!Number.isInteger(omittedProviderScopes) || omittedProviderScopes < 0
    || countryBrandsMissingFromGlobal > omittedProviderScopes) {
    issue(`${label} must account for every country brand missing from the global view as a fail-closed provider-inconsistent scope`);
  }
  if (snapshot.totals?.publishedBrandCells !== publishedBrandCells
    || snapshot.totals?.publishedModelCells !== publishedModelCells
    || snapshot.totals?.countriesWithPublishedBrands !== countriesWithPublishedBrands
    || snapshot.totals?.regions !== countries.length
    || snapshot.totals?.regions !== snapshot.totals?.countriesWithPublishedBrands) {
    issue(`${label} published country, brand and model cell totals do not reconcile`);
  }
  if (snapshot.totals?.modelVisitors !== global.modelVisitors
    || snapshot.totals?.signals !== snapshot.totals?.modelVisitors
    || global.signals !== global.modelVisitors
    || snapshot.totals?.signals !== global.signals) {
    issue(`${label} global and root model visitor totals must reconcile`);
  }
}

function validateSubnationalSnapshot(countryName, record, expectedTotals, expectedRegions) {
  if (!record) {
    issue(`Dataset is missing the ${countryName} subnational breakdown`);
    return;
  }
  if (!String(record.source || '').includes('DataFast')) {
    issue(`${countryName} subnational source must identify DataFast`);
  }
  if (record.boundarySource !== 'Natural Earth Admin-1 states and provinces, 1:10m') {
    issue(`${countryName} subnational boundaries must identify Natural Earth Admin-1 at 1:10m`);
  }
  if (record.publishThreshold !== 5) issue(`${countryName} subnational publish threshold must be five signals`);
  for (const [field, expected] of Object.entries(expectedTotals)) {
    if (record.totals?.[field] !== expected) issue(`${countryName} subnational total ${field} must be ${expected}`);
  }
  if (record.totals?.publishedSignals + record.totals?.withheldSignals !== record.totals?.geolocatedSignals) {
    issue(`${countryName} published and withheld regional signals must reconcile to geolocated signals`);
  }
  if (record.totals?.geolocatedSignals + record.totals?.unassignedSignals !== record.totals?.countrySignals) {
    issue(`${countryName} geolocated and unassigned signals must reconcile to the country total`);
  }
  const regions = Array.isArray(record.regions) ? record.regions : [];
  if (regions.length !== expectedTotals.publishedRegions) {
    issue(`${countryName} must expose exactly ${expectedTotals.publishedRegions} published regions`);
  }
  if (regions.reduce((sum, region) => sum + Number(region.signals || 0), 0) !== expectedTotals.publishedSignals) {
    issue(`${countryName} published region rows must reconcile to publishedSignals`);
  }
  const actualRegions = regions.map(region => [region.rank, region.name, region.sourceName, region.code, region.signals]);
  if (JSON.stringify(actualRegions) !== JSON.stringify(expectedRegions)) {
    issue(`${countryName} published regions do not match the approved snapshot`);
  }
  if (regions.some(region => !Number.isInteger(region.signals) || region.signals < record.publishThreshold)) {
    issue(`${countryName} exposes a region below its public privacy threshold`);
  }
}

function topLevelFunctionBody(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`function\\s+${escapedName}\\([^)]*\\)\\s*{([\\s\\S]*?)\\n}`, 'm'))?.[1] || '';
}

function canvasUsesAtlasTextureWidth(body, canvasExpression) {
  const escapedCanvas = canvasExpression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`${escapedCanvas}\\.width\\s*=\\s*atlasTextureWidth\\(\\)`).test(body)) return true;
  const aliases = [...body.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*atlasTextureWidth\(\)/g)]
    .map(match => match[1]);
  return aliases.some(alias => new RegExp(`${escapedCanvas}\\.width\\s*=\\s*${alias}\\b`).test(body));
}

function canvasUsesTwoToOneTexture(body, canvasExpression) {
  const escapedCanvas = canvasExpression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`${escapedCanvas}\\.height\\s*=\\s*${escapedCanvas}\\.width\\s*\\/\\s*2\\b`).test(body)) return true;
  const widthAssignment = body.match(new RegExp(`${escapedCanvas}\\.width\\s*=\\s*([A-Za-z_$][\\w$]*)\\b`));
  return Boolean(widthAssignment && new RegExp(`${escapedCanvas}\\.height\\s*=\\s*${widthAssignment[1]}\\s*\\/\\s*2\\b`).test(body));
}

function hasVersionedReference(tags, attributeName, expectedPath) {
  return tags.some(tag => (attribute(tag, attributeName) || '').split('?')[0] === expectedPath);
}

const html = readFile(PAGE_PATH, 'activity-index page');
const dataText = readFile(DATA_PATH, 'activity-index dataset');
const app = readFile(SCRIPT_PATH, 'activity-index JavaScript');
const themeScript = readFile(THEME_SCRIPT_PATH, 'theme controller JavaScript');
const css = readFile(STYLE_PATH, 'activity-index stylesheet');
const vendor = readFile(VENDOR_PATH, 'vendored Three.js module');
const vendorLicense = readFile(VENDOR_LICENSE_PATH, 'Three.js vendor license');
const geojsonText = readFile(GEOJSON_PATH, 'country GeoJSON');
const admin1ManifestText = readFile(ADMIN1_MANIFEST_PATH, 'worldwide Admin-1 manifest');
const admin1ActivityText = readFile(ADMIN1_ACTIVITY_PATH, 'worldwide Admin-1 activity dataset');
const installIntentText = readFile(INSTALL_INTENT_PATH, 'install-intent country dataset');
const installIntentAdmin1Text = readFile(INSTALL_INTENT_ADMIN1_PATH, 'install-intent regional dataset');
const modelPageInterestText = readFile(MODEL_PAGE_INTEREST_PATH, 'model-page-interest dataset');
const admin2ManifestText = readFile(ADMIN2_MANIFEST_PATH, 'U.S., China, and Australia deeper-boundary manifest');
const admin2ModelActivitySnapshots = ADMIN2_MODEL_ACTIVITY_PATHS.map(([period, relativePath, modelCount, installCount]) => ({
  period,
  relativePath,
  modelCount,
  installCount,
  data: parseJson(readFile(relativePath, `${period} Admin-2 model activity`), `${period} Admin-2 model activity`)
}));
const usGeojsonText = readFile(US_GEOJSON_PATH, 'U.S. state GeoJSON');
const sitemapCore = readFile('sitemap-core.xml', 'core sitemap');
const sitemapIndex = readFile('sitemap.xml', 'sitemap index');
const sitemapGenerator = readFile('scripts/generate-sitemap.js', 'sitemap generator');

const data = parseJson(dataText, 'activity-index dataset');
const geojson = parseJson(geojsonText, 'country GeoJSON');
const admin1Manifest = parseJson(admin1ManifestText, 'worldwide Admin-1 manifest');
const admin1Activity = parseJson(admin1ActivityText, 'worldwide Admin-1 activity dataset');
const installIntent = parseJson(installIntentText, 'install-intent country dataset');
const installIntentAdmin1 = parseJson(installIntentAdmin1Text, 'install-intent regional dataset');
const modelPageInterest = parseJson(modelPageInterestText, 'model-page-interest dataset');
const admin2Manifest = parseJson(admin2ManifestText, 'U.S. and China Admin-2 manifest');
const usGeojson = parseJson(usGeojsonText, 'U.S. state GeoJSON');

if (html !== null) {
  if (!/<html\b[^>]*data-theme-lock=["']dark["']/i.test(html)
    || !/<meta\b[^>]*name=["']color-scheme["'][^>]*content=["']dark["']/i.test(html)) {
    issue('Atlas must declare its page-scoped dark theme lock before first paint');
  }
  const titleMatches = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titleMatches.length !== 1) {
    issue(`Expected exactly one title, found ${titleMatches.length}`);
  } else if (textContent(titleMatches[0][1]) !== EXPECTED_TITLE) {
    issue(`Unexpected title: ${textContent(titleMatches[0][1])}`);
  }

  const canonicalTags = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => (attribute(tag, 'rel') || '').split(/\s+/).includes('canonical'));
  if (canonicalTags.length !== 1) {
    issue(`Expected exactly one canonical link, found ${canonicalTags.length}`);
  } else if (attribute(canonicalTags[0], 'href') !== CANONICAL_URL) {
    issue(`Canonical must be ${CANONICAL_URL}`);
  }

  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length !== 1) {
    issue(`Expected exactly one H1, found ${h1Matches.length}`);
  } else if (textContent(h1Matches[0][1]) !== EXPECTED_H1) {
    issue(`Unexpected H1: ${textContent(h1Matches[0][1])}`);
  }

  const visibleText = textContent(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  ).toLowerCase();
  if (!visibleText.includes('interest signals')) {
    issue('Visible copy must describe the metric as interest signals');
  }
  if (!visibleText.includes('not verified installations or model runs')) {
    issue('Visible copy must say: not verified installations or model runs');
  }
  if (!visibleText.includes('approximate network locations')) {
    issue('Visible copy must disclose that state-level locations are approximate network locations');
  }
  if (!visibleText.includes('the dalles')) {
    issue('Visible copy must disclose the Oregon / The Dalles quality flag');
  }
  if (!visibleText.includes('select any mapped country')
    || !visibleText.includes('administrative subdivisions')) {
    issue('Visible copy must explain that every mapped country has an administrative-subdivision drill-down');
  }
  if (!visibleText.includes('4,558') || !visibleText.includes('worldwide')) {
    issue('Visible copy must disclose the worldwide 4,558-subdivision cartographic coverage');
  }
  if (!(visibleText.includes('country-filtered datafast') || visibleText.includes('datafast supplies a country-filtered region breakdown'))
    || !visibleText.includes('rows below five are omitted')) {
    issue('Visible copy must disclose the independent regional source and five-signal omission rule');
  }
  if (!(visibleText.includes('every other subdivision stays neutral')
    || visibleText.includes('county, prefecture, and lga boundaries stay neutral'))) {
    issue('Visible copy must say that subdivisions without a published regional value remain neutral');
  }
  if (!visibleText.includes('3,144') || !visibleText.includes('358') || !visibleText.includes('545')
    || !visibleText.includes('does not publish county, prefecture, or lga totals')) {
    issue('Visible copy must disclose the deeper U.S./China/Australia boundary coverage and absence of detailed activity totals');
  }
  if (!visibleText.includes('explicitly describes its china boundaries as unofficial')
    || !visibleText.includes('cc by 3.0 igo')) {
    issue('Visible copy must disclose the China boundary source status and license');
  }
  if (!visibleText.includes('abs asgs edition 3 local government areas 2025')
    || !visibleText.includes('statistical mesh block approximations')
    || !visibleText.includes('cc by 4.0')) {
    issue('Visible copy must disclose the official ABS Australia LGA source, approximation caveat, and license');
  }

  const modelPanelMarkup = html.match(/<aside\b[^>]*data-atlas-model-panel\b[^>]*>[\s\S]*?<\/aside>/i)?.[0] || '';
  const modelPanelText = textContent(modelPanelMarkup).toLowerCase();
  if (!modelPanelMarkup) {
    issue('Atlas is missing the visible Models detail panel');
  } else {
    if (!modelPanelText.includes('model-page interest') || !modelPanelText.includes('unique visitors')
      || !/not downloads?\b/.test(modelPanelText) || !/installs?\b/.test(modelPanelText)
      || !/launch(?:es)?\b/.test(modelPanelText) || !modelPanelText.includes('inference')
      || !/verified[- ]usage/.test(modelPanelText)) {
      issue('Models panel must visibly define model-page interest and deny download, install, launch, inference and verified-usage claims');
    }
    if (/\bmost used\b|\bmodel usage by country\b|\bactive users?\b/i.test(modelPanelText)) {
      issue('Models panel must not turn page interest into a positive model-usage or active-user claim');
    }
  }

  const installPanelMarkup = html.match(/<aside\b[^>]*data-atlas-install-panel\b[^>]*>[\s\S]*?<\/aside>/i)?.[0] || '';
  const installPanelText = textContent(installPanelMarkup).toLowerCase();
  if (!installPanelMarkup) {
    issue('Atlas is missing the visible Install paths detail panel');
  } else {
    for (const hook of [
      'data-atlas-install-country',
      'data-atlas-install-dominant-label',
      'data-atlas-install-model-list',
      'data-atlas-install-runtime-list',
      'data-atlas-install-modality-list',
      'data-atlas-install-regions'
    ]) {
      if (!installPanelMarkup.includes(hook)) issue(`Install paths panel is missing ${hook}`);
    }
    if (!installPanelText.includes('model paths selected') || !installPanelText.includes('setup destinations selected')
      || !installPanelText.includes('does not verify') || !installPanelText.includes('completed download')
      || !installPanelText.includes('inference') || !installPanelText.includes('model use')) {
      issue('Install paths panel must expose model/destination detail and visibly deny download, inference and usage claims');
    }
  }

  const buttonTags = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)].map(match => match[0]);
  for (const action of ['in', 'out', 'reset']) {
    if (!buttonTags.some(tag => attribute(tag, 'data-atlas-zoom') === action)) {
      issue(`Missing visible Atlas zoom control: ${action}`);
    }
  }
  if (!buttonTags.some(tag => /\bdata-atlas-tour\b/i.test(tag))) issue('Missing top-10 guided tour control');
  for (const view of ['installed', 'models', 'active']) {
    const control = buttonTags.find(tag => attribute(tag, 'data-atlas-view') === view);
    const label = view[0].toUpperCase() + view.slice(1);
    if (!control) {
      issue(`Missing ${label} activity control`);
      continue;
    }
    if ((view === 'installed' || view === 'models') && /\bdata-coming-soon\b/i.test(control)) {
      issue(`${label} control must be active, not marked coming soon`);
    }
    if (view === 'active' && !/\bdata-coming-soon\b/i.test(control)) issue('Active control must be marked data-coming-soon');
    if (attribute(control, 'aria-pressed') !== 'false') issue(`${label} control must not be presented as active`);
    if (view === 'active' && !(attribute(control, 'aria-label') || '').toLowerCase().includes('coming soon')) {
      issue(`${label} control must announce that it is coming soon`);
    }
    if (view === 'installed' && !(attribute(control, 'aria-label') || '').toLowerCase().includes('install-intent')) {
      issue('Installed control must identify the metric as install intent');
    }
    if (view === 'models' && !(attribute(control, 'aria-label') || '').toLowerCase().includes('model-interest')) {
      issue('Models control must identify the metric as model interest');
    }
    const expectedVisibleLabel = view === 'installed' ? 'Install paths' : label;
    if (textContent(control) !== expectedVisibleLabel) issue(`${label} control has unexpected visible text`);
  }

  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]);
  const scriptTags = [...html.matchAll(/<script\b[^>]*>/gi)].map(match => match[0]);
  if (!hasVersionedReference(linkTags, 'href', `/${STYLE_PATH}`)) {
    issue(`Page does not load /${STYLE_PATH}`);
  }
  const appScript = scriptTags.find(tag => (attribute(tag, 'src') || '').split('?')[0] === `/${SCRIPT_PATH}`);
  if (!appScript) issue(`Page does not load /${SCRIPT_PATH}`);
  else if (attribute(appScript, 'type') !== 'module') issue('Activity-index JavaScript must load as a module');

  const jsonLdBlocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const jsonLdDocuments = jsonLdBlocks
    .map((match, index) => parseJson(match[1], `JSON-LD block ${index + 1}`))
    .filter(Boolean);
  const graph = jsonLdDocuments.flatMap(document => {
    if (Array.isArray(document)) return document;
    return Array.isArray(document['@graph']) ? document['@graph'] : [document];
  });
  const hasType = (node, type) => {
    const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
    return types.includes(type);
  };
  const datasetNode = graph.find(node => hasType(node, 'Dataset'));
  const itemListNode = graph.find(node => hasType(node, 'ItemList') && node['@id'] === `${CANONICAL_URL}#ranking`);
  const stateItemListNode = graph.find(node => hasType(node, 'ItemList') && node['@id'] === `${CANONICAL_URL}#us-state-ranking`);

  if (!datasetNode) {
    issue('JSON-LD is missing a Dataset node');
  } else {
    if (datasetNode.url !== CANONICAL_URL) issue('Dataset JSON-LD URL must match the canonical page');
    if (!String(datasetNode.description || '').toLowerCase().includes('interest signals')) {
      issue('Dataset JSON-LD must identify the values as interest signals');
    }
    const datasetDescription = String(datasetNode.description || '').toLowerCase();
    if (!datasetDescription.includes('does not measure verified')
      && !/(?:not|does not)[^.]{0,100}verified (?:use|usage|installation|model run)/.test(datasetDescription)) {
      issue('Dataset JSON-LD must retain the verified-use limitation');
    }
    if (!String(datasetNode.measurementTechnique || '').includes('DataFast')) {
      issue('Dataset JSON-LD must disclose the DataFast measurement technique');
    }
    if (datasetNode.spatialCoverage !== 'Worldwide') issue('Dataset JSON-LD must declare worldwide coverage');
    const distributions = Array.isArray(datasetNode.distribution) ? datasetNode.distribution : [datasetNode.distribution];
    for (const [contentUrl, label] of [
      [DATA_URL, 'country activity'],
      [ADMIN1_ACTIVITY_URL, 'regional activity'],
      [ADMIN1_MANIFEST_URL, 'worldwide boundary manifest']
    ]) {
      if (!distributions.some(distribution => distribution?.contentUrl === contentUrl && distribution?.encodingFormat === 'application/json')) {
        issue(`Dataset JSON-LD must expose the canonical ${label} JSON download`);
      }
    }
  }

  if (!itemListNode) {
    issue('JSON-LD is missing an ItemList ranking node');
  } else {
    const elements = Array.isArray(itemListNode.itemListElement) ? itemListNode.itemListElement : [];
    if (elements.length < 10) issue(`ItemList must expose at least the top 10; found ${elements.length}`);
    if (itemListNode.numberOfItems !== elements.length) issue('ItemList numberOfItems does not match itemListElement length');
    elements.forEach((element, index) => {
      const expected = expectedTop20[index];
      if (!expected) {
        issue(`ItemList contains an unexpected rank ${index + 1}`);
        return;
      }
      if (element.position !== index + 1) issue(`ItemList rank ${index + 1} has a non-contiguous position`);
      const itemName = String(element.name || '');
      if (!itemName.includes(expected[0]) || !itemName.includes(expected[1].toLocaleString('en-US'))) {
        issue(`ItemList rank ${index + 1} does not match ${expected[0]} (${expected[1]})`);
      }
    });
  }


  if (!stateItemListNode) {
    issue('JSON-LD is missing the U.S. state ItemList ranking node');
  } else {
    const elements = Array.isArray(stateItemListNode.itemListElement) ? stateItemListNode.itemListElement : [];
    if (elements.length !== expectedTopStates.length) issue(`State ItemList must expose ${expectedTopStates.length} rows`);
    expectedTopStates.forEach(([name, signals], index) => {
      const itemName = String(elements[index]?.name || '');
      if (!itemName.includes(name) || !itemName.includes(signals.toLocaleString('en-US'))) {
        issue(`State ItemList rank ${index + 1} does not match ${name} (${signals})`);
      }
    });
  }

  const rankingTables = [...html.matchAll(/<table\b[^>]*class=["'][^"']*\batlas-ranking\b[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi)].map(match => match[1]);
  const rankingTable = rankingTables.find(table => table.includes('data-country-focus'));
  if (!rankingTable) {
    issue('Rendered top-20 ranking table is missing');
  } else {
    const tbody = rankingTable.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
    const rows = tbody ? [...tbody[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => match[1]) : [];
    if (rows.length !== 20) issue(`Expected 20 rendered ranking rows, found ${rows.length}`);
    expectedTop20.forEach(([name, signals], index) => {
      const row = rows[index];
      if (!row) return;
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => textContent(match[1]));
      const focusButton = row.match(/<button\b[^>]*data-country-focus=["'][^"']+["'][^>]*>/i)?.[0] || '';
      if (cells[0] !== String(index + 1).padStart(2, '0')) issue(`Rendered ranking row ${index + 1} has the wrong rank`);
      if (cells[1] !== name || attribute(focusButton, 'data-country-focus') !== name) {
        issue(`Rendered ranking row ${index + 1} must identify ${name}`);
      }
      if (cells[2] !== signals.toLocaleString('en-US')) issue(`Rendered ranking row ${index + 1} has the wrong signal total`);
    });
  }

  const stateRankingTable = rankingTables.find(table => table.includes('data-state-focus'));
  if (!stateRankingTable) {
    issue('Rendered U.S. state ranking table is missing');
  } else {
    const tbody = stateRankingTable.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
    const rows = tbody ? [...tbody[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => match[1]) : [];
    if (rows.length !== expectedTopStates.length) issue(`Expected ${expectedTopStates.length} rendered state ranking rows, found ${rows.length}`);
    expectedTopStates.forEach(([name, signals], index) => {
      const row = rows[index];
      if (!row) return;
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => textContent(match[1]));
      const focusButton = row.match(/<button\b[^>]*data-state-focus=["'][^"']+["'][^>]*>/i)?.[0] || '';
      if (!cells[1].startsWith(name) || attribute(focusButton, 'data-state-focus') !== name) {
        issue(`Rendered state ranking row ${index + 1} must identify ${name}`);
      }
      if (cells[2] !== signals.toLocaleString('en-US')) issue(`Rendered state ranking row ${index + 1} has the wrong signal total`);
    });
  }
}

if (installIntent) {
  if (installIntent.schemaVersion !== 2 || installIntent.view !== 'installed'
    || installIntent.displayName !== 'Install paths' || installIntent.publishThreshold !== 5) {
    issue('Install-intent dataset must identify the v2 Install paths view and five-visitor threshold');
  }
  if (installIntent.totals?.observedSignals !== 58 || installIntent.totals?.globalVisitors !== 58
    || installIntent.totals?.observedRegions !== 29 || installIntent.totals?.publishedSignals !== 24
    || installIntent.totals?.publishedCountryCellVisitors !== 24 || installIntent.totals?.countryCellVisitors !== 60
    || installIntent.totals?.withheldCountryCellVisitors !== 36 || installIntent.totals?.publishedRegions !== 3
    || installIntent.totals?.withheldRegions !== 26 || installIntent.totals?.attributedModelVisitors !== 55
    || 'withheldSignals' in installIntent.totals) {
    issue('Install-intent 30-day totals do not match the approved DataFast snapshot');
  }
  const expectedInstallCountries = [['United States', 11], ['Germany', 7], ['India', 6]];
  if (JSON.stringify((installIntent.countries || []).map(country => [country.name, country.signals])) !== JSON.stringify(expectedInstallCountries)) {
    issue('Install-intent published country ranking does not match the approved DataFast snapshot');
  }
  if (!String(installIntent.claimBoundary || '').toLowerCase().includes('does not verify')) {
    issue('Install-intent dataset must state that clicks do not verify installation or use');
  }
  const details = installIntent.installIntentDetails;
  if (!details || JSON.stringify((details.models || []).map(row => [row.id, row.visitors])) !== JSON.stringify([['qwen3.8-27b', 6]])
    || JSON.stringify((details.runtimes || []).map(row => [row.id, row.visitors])) !== JSON.stringify([
      ['huggingface', 23], ['lmstudio', 16], ['unsloth', 16]
    ])
    || JSON.stringify((details.modalities || []).map(row => [row.id, row.visitors])) !== JSON.stringify([
      ['llm', 33], ['voice', 22]
    ])) {
    issue('Install-intent model, destination and modality rows must match the privacy-thresholded unique-visitor snapshot');
  }
  const installCountries = new Map((installIntent.countries || []).map(country => [country.name, country]));
  if (installCountries.get('United States')?.installIntent?.runtimes?.[0]?.id !== 'huggingface'
    || installCountries.get('United States')?.installIntent?.runtimes?.[0]?.visitors !== 7
    || installCountries.get('Germany')?.installIntent?.runtimes?.[0]?.id !== 'lmstudio'
    || installCountries.get('Germany')?.installIntent?.runtimes?.[0]?.visitors !== 5
    || (installCountries.get('India')?.installIntent?.runtimes || []).length !== 0
    || (installIntent.countries || []).some(country => (country.installIntent?.models || []).length !== 0)) {
    issue('Install-intent country stack rows must apply the independent five-visitor cell threshold');
  }
  if (installIntent.privacy?.minimumUniqueVisitors !== 5 || installIntent.period?.partial !== true
    || installIntent.period?.effectiveCoverageDays !== 9
    || installIntent.period?.observedStartAtInclusive !== '2026-08-21T00:00:00+02:00'
    || installIntent.period?.observedEndAtExclusive !== '2026-08-30T00:00:00+02:00'
    || installIntent.trackingCoverage?.hostname !== 'localclaw.io'
    || (installIntent.trackingCoverage?.includedGoals || []).some(goal => ['model_install_localclaw', 'model_runtime_localclaw'].includes(goal))
    || !String(installIntent.totals?.countryCellCounting || '').includes('more than one country')
    || installIntent.stages?.installationVerified?.available !== false
    || installIntent.stages?.inferenceCompleted?.available !== false) {
    issue('Install-intent v2 must disclose partial history, privacy threshold and unavailable verified stages');
  }
}
if (installIntentAdmin1) {
  if (installIntentAdmin1.schemaVersion !== 2 || installIntentAdmin1.view !== 'installed' || installIntentAdmin1.publishThreshold !== 5
    || Object.keys(installIntentAdmin1.countries || {}).length !== 3
    || Object.values(installIntentAdmin1.countries || {}).some(country => country.collectionStatus !== 'collected' || country.publicationStatus !== 'none_above_threshold' || country.regions?.length !== 0)
    || installIntentAdmin1.countries?.['United States']?.countryCode !== 'US'
    || installIntentAdmin1.countries?.['United States']?.observedRegions !== 8
    || installIntentAdmin1.countries?.Germany?.observedRegions !== 4
    || installIntentAdmin1.countries?.India?.observedRegions !== 4) {
    issue('Install-intent regional dataset must retain a five-visitor threshold and publish no below-threshold region rows');
  }
}

validateModelPageInterestSnapshot(modelPageInterest, '30-day model-page-interest dataset', {
  key: '30d',
  days: 30,
  start: '2026-07-31',
  end: '2026-08-29'
});

if (data) {
  if (data.indexName !== 'Local AI Activity Index') issue('Dataset indexName is incorrect');
  if (data.view !== 'interest') issue('Dataset default view must remain interest');
  if (data.status !== 'beta') issue('Dataset status must remain beta while it contains interest signals');
  if (!String(data.claimBoundary || '').toLowerCase().includes('interest signals')) {
    issue('Dataset claimBoundary must identify interest signals');
  }
  if (data.totals?.signals !== EXPECTED_SIGNALS) issue(`Expected ${EXPECTED_SIGNALS} total signals`);
  if (data.totals?.regions !== EXPECTED_OBSERVED_REGIONS) issue(`Expected ${EXPECTED_OBSERVED_REGIONS} observed country regions`);
  if (data.totals?.observedSignals !== EXPECTED_SIGNALS) issue('Observed country signal metadata must preserve all 3,337 signals');
  if (data.totals?.observedRegions !== EXPECTED_OBSERVED_REGIONS) issue('Observed country metadata must preserve all 113 regions');
  if (data.totals?.publishedSignals !== EXPECTED_PUBLISHED_COUNTRY_SIGNALS) issue('Unexpected published country signal total');
  if (data.totals?.publishedRegions !== EXPECTED_PUBLISHED_COUNTRIES) issue('Unexpected published country count');
  if (data.totals?.withheldSignals !== EXPECTED_WITHHELD_COUNTRY_SIGNALS) issue('Unexpected withheld country signal total');
  if (data.totals?.withheldRegions !== EXPECTED_WITHHELD_COUNTRIES) issue('Unexpected withheld country count');
  if (data.totals?.publishedSignals + data.totals?.withheldSignals !== data.totals?.signals) {
    issue('Published and withheld country signals must reconcile to the observed total');
  }
  if (data.totals?.publishedRegions + data.totals?.withheldRegions !== data.totals?.regions) {
    issue('Published and withheld country counts must reconcile to the observed total');
  }

  const countries = Array.isArray(data.countries) ? data.countries : [];
  if (countries.length !== EXPECTED_PUBLISHED_COUNTRIES) issue(`Expected ${EXPECTED_PUBLISHED_COUNTRIES} published country records, found ${countries.length}`);
  const signalSum = countries.reduce((sum, country) => sum + Number(country.signals || 0), 0);
  if (signalSum !== EXPECTED_PUBLISHED_COUNTRY_SIGNALS) {
    issue(`Published country signals sum to ${signalSum}, expected ${EXPECTED_PUBLISHED_COUNTRY_SIGNALS}`);
  }
  if (new Set(countries.map(country => country.name)).size !== countries.length) issue('Country names must be unique');

  countries.forEach((country, index) => {
    if (country.rank !== index + 1) issue(`Country ranking is not contiguous at position ${index + 1}`);
    if (!country.name || !Number.isInteger(country.signals) || country.signals < 5) {
      issue(`Country record ${index + 1} has an invalid name or signal count`);
    }
    if (index > 0 && countries[index - 1].signals < country.signals) {
      issue(`Country ranking is not descending at position ${index + 1}`);
    }
  });

  const actualTop20 = countries.slice(0, 20).map(country => [country.name, country.signals]);
  if (JSON.stringify(actualTop20) !== JSON.stringify(expectedTop20)) {
    issue('Dataset top 20 does not match the approved 29 August 2026 snapshot');
  }
  const countryFingerprint = crypto.createHash('sha256')
    .update(countries.map(country => [country.rank, country.name, country.signals].join('|')).join('\n'))
    .digest('hex');
  if (countryFingerprint !== EXPECTED_COUNTRY_FINGERPRINT) {
    issue('Published country rows do not match the approved thresholded country snapshot');
  }

  const usData = data.subnational?.['United States'];
  if (!usData) {
    issue('Dataset is missing the United States subnational breakdown');
  } else {
    if (usData.publishThreshold !== 5) issue('U.S. state publish threshold must remain five signals');
    if (usData.totals?.publishedSignals !== EXPECTED_US_PUBLISHED_SIGNALS) issue('Unexpected published U.S. state signal total');
    if (usData.totals?.publishedRegions !== EXPECTED_US_PUBLISHED_REGIONS) issue('Unexpected published U.S. state count');
    if (usData.totals?.observedRegions !== 44) issue('Unexpected observed U.S. region count');
    const regions = Array.isArray(usData.regions) ? usData.regions : [];
    if (regions.length !== EXPECTED_US_PUBLISHED_REGIONS) issue(`Expected ${EXPECTED_US_PUBLISHED_REGIONS} published U.S. states, found ${regions.length}`);
    const stateSignalSum = regions.reduce((sum, region) => sum + Number(region.signals || 0), 0);
    if (stateSignalSum !== EXPECTED_US_PUBLISHED_SIGNALS) issue(`Published U.S. state signals sum to ${stateSignalSum}`);
    const stateFingerprint = crypto.createHash('sha256')
      .update(regions.map(region => [region.rank, region.name, region.code, region.signals, region.qualityFlag || ''].join('|')).join('\n'))
      .digest('hex');
    if (stateFingerprint !== EXPECTED_US_STATE_FINGERPRINT) {
      issue('Published U.S. state rows do not match the approved state snapshot');
    }
    if (regions[0]?.name !== 'Oregon' || regions[0]?.qualityFlag !== 'network-location-cluster') {
      issue('Oregon must retain its network-location quality flag');
    }
  }

  const chinaData = data.subnational?.China;
  validateSubnationalSnapshot('China', chinaData, {
    countrySignals: 209,
    geolocatedSignals: 105,
    observedRegions: 10,
    publishedSignals: 97,
    publishedRegions: 4,
    withheldSignals: 8,
    unassignedSignals: 104
  }, expectedChinaRegions);
  if (chinaData?.division !== 'province-level administrative region') {
    issue('China subnational division must remain province-level administrative region');
  }

  const russiaData = data.subnational?.Russia;
  validateSubnationalSnapshot('Russia', russiaData, {
    countrySignals: 27,
    geolocatedSignals: 25,
    observedRegions: 15,
    publishedSignals: 0,
    publishedRegions: 0,
    withheldSignals: 25,
    unassignedSignals: 2
  }, []);
  if (russiaData?.division !== 'federal subject') issue('Russia subnational division must remain federal subject');

  const cityMethodology = data.cityClusterMethodology;
  if (!cityMethodology || typeof cityMethodology !== 'object') {
    issue('Dataset is missing cityClusterMethodology');
  } else {
    if (!String(cityMethodology.source || '').includes('DataFast')) issue('City methodology must identify DataFast as the aggregate source');
    if (cityMethodology.metric !== 'unique visitors') issue('City cluster metric must remain unique visitors');
    if (cityMethodology.publishThreshold !== 5) issue('City cluster publish threshold must be five signals');
    if (cityMethodology.generatedAt !== EXPECTED_CITY_CLUSTER_GENERATED_AT) {
      issue(`City clusters must retain generatedAt ${EXPECTED_CITY_CLUSTER_GENERATED_AT}`);
    }
    const coordinateAttribution = `${cityMethodology.coordinateSource || ''} ${cityMethodology.coordinateAttribution || ''}`;
    if (!coordinateAttribution.includes('GeoNames') || !coordinateAttribution.includes('cities15000')) {
      issue('City coordinates must attribute the GeoNames cities15000 dataset');
    }
    if (cityMethodology.coordinateSourceUrl !== 'https://download.geonames.org/export/dump/cities15000.zip') {
      issue('City methodology must link to the GeoNames cities15000 source archive');
    }
    if (!String(cityMethodology.coordinateLicense || '').includes('CC BY 4.0')) {
      issue('City coordinate metadata must declare the GeoNames CC BY 4.0 license');
    }
    if (cityMethodology.coordinateLicenseUrl !== 'https://creativecommons.org/licenses/by/4.0/') {
      issue('City coordinate metadata must link to the CC BY 4.0 license');
    }
    if (cityMethodology.coordinateKind !== 'city-centroid') issue('City methodology coordinateKind must be city-centroid');
    if (cityMethodology.locationKind !== 'approximate-network-city') {
      issue('City methodology locationKind must be approximate-network-city');
    }
    const remainderTreatment = String(cityMethodology.remainderTreatment || '').toLowerCase();
    if (!remainderTreatment.includes('implicit') || !remainderTreatment.includes('polygon')) {
      issue('City methodology must state that non-city remainder is implicit and polygon-only');
    }
  }

  const cityClusters = Array.isArray(data.cityClusters) ? data.cityClusters : [];
  if (cityClusters.length !== EXPECTED_CITY_CLUSTERS) {
    issue(`Expected ${EXPECTED_CITY_CLUSTERS} published city clusters, found ${cityClusters.length}`);
  }
  const citySignalSum = cityClusters.reduce((sum, cluster) => sum + Number(cluster.signals || 0), 0);
  if (citySignalSum !== EXPECTED_CITY_CLUSTER_SIGNALS) {
    issue(`Published city clusters sum to ${citySignalSum}, expected ${EXPECTED_CITY_CLUSTER_SIGNALS}`);
  }

  const cityKeys = new Set();
  const geonameIds = new Set();
  const citySignalsByCountry = new Map();
  const usCitySignalsByRegion = new Map();
  const countriesByName = new Map(countries.map(country => [country.name, country]));
  const usRegionsByCode = new Map((usData?.regions || []).map(region => [region.code, region]));

  cityClusters.forEach((cluster, index) => {
    const label = `${cluster.countryCode || '?'} / ${cluster.regionCode || '-'} / ${cluster.city || `row ${index + 1}`}`;
    const key = [cluster.countryCode, cluster.regionCode || '', cluster.city].join('|');
    if (cityKeys.has(key)) issue(`Duplicate city cluster: ${label}`);
    cityKeys.add(key);

    if (!cluster.city || !cluster.country || !/^[A-Z]{2}$/.test(cluster.countryCode || '')) {
      issue(`City cluster ${label} has an invalid city, country, or countryCode`);
    }
    if (!Number.isInteger(cluster.signals) || cluster.signals < 5) {
      issue(`City cluster ${label} violates the five-signal privacy threshold`);
    }
    if (!Number.isFinite(cluster.lat) || cluster.lat < -90 || cluster.lat > 90) {
      issue(`City cluster ${label} has an invalid latitude`);
    }
    if (!Number.isFinite(cluster.lon) || cluster.lon < -180 || cluster.lon > 180) {
      issue(`City cluster ${label} has an invalid longitude`);
    }
    if (!Number.isInteger(cluster.geonameId) || cluster.geonameId < 1) {
      issue(`City cluster ${label} has an invalid GeoNames ID`);
    } else if (geonameIds.has(cluster.geonameId)) {
      issue(`Duplicate GeoNames ID ${cluster.geonameId} at ${label}`);
    }
    geonameIds.add(cluster.geonameId);
    if (cluster.coordinateKind !== 'city-centroid') issue(`City cluster ${label} must use a city centroid`);
    if (cluster.locationKind !== 'approximate-network-city') {
      issue(`City cluster ${label} must disclose an approximate network city`);
    }

    citySignalsByCountry.set(cluster.country, (citySignalsByCountry.get(cluster.country) || 0) + Number(cluster.signals || 0));
    if (cluster.countryCode === 'US') {
      const parentState = usRegionsByCode.get(cluster.regionCode);
      if (!parentState || parentState.name !== cluster.region) {
        issue(`U.S. city cluster ${label} does not match a published parent state`);
      }
      usCitySignalsByRegion.set(cluster.regionCode, (usCitySignalsByRegion.get(cluster.regionCode) || 0) + Number(cluster.signals || 0));
    }
  });

  const cityFingerprintRows = cityClusters
    .map(cluster => [cluster.countryCode, cluster.regionCode || '', cluster.city, cluster.signals, cluster.lat, cluster.lon, cluster.geonameId].join('|'))
    .sort();
  const cityFingerprint = crypto.createHash('sha256').update(cityFingerprintRows.join('\n')).digest('hex');
  if (cityFingerprint !== EXPECTED_CITY_CLUSTER_FINGERPRINT) {
    issue('City cluster names, counts, coordinates, or GeoNames IDs do not match the approved snapshot');
  }

  for (const [countryName, signals] of citySignalsByCountry) {
    const parentCountry = countriesByName.get(countryName);
    if (!parentCountry) {
      issue(`City clusters reference an unpublished or unknown parent country: ${countryName}`);
    } else if (signals > parentCountry.signals) {
      issue(`Published city clusters for ${countryName} exceed the parent country total`);
    }
  }
  for (const [regionCode, signals] of usCitySignalsByRegion) {
    const parentState = usRegionsByCode.get(regionCode);
    if (parentState && signals > parentState.signals) {
      issue(`Published city clusters for ${parentState.name} exceed the parent state total`);
    }
  }

  const expectedMergedClusters = new Map([
    ['US|NY|New York City', [['New York', 23], ['Staten Island', 13]]],
    ['GB||London', [['London', 12], ['Canary Wharf', 6], ['City of London', 6]]],
    ['CH||Geneva', [['Thônex', 7], ['Geneva', 5]]]
  ]);
  const mergedClusters = cityClusters.filter(cluster => Array.isArray(cluster.aggregatedFrom));
  if (mergedClusters.length !== expectedMergedClusters.size) {
    issue(`Expected ${expectedMergedClusters.size} disclosed merged city clusters, found ${mergedClusters.length}`);
  }
  for (const cluster of mergedClusters) {
    const key = [cluster.countryCode, cluster.regionCode || '', cluster.city].join('|');
    const expected = expectedMergedClusters.get(key);
    const actual = cluster.aggregatedFrom.map(source => [source.city, source.signals]);
    if (!expected || JSON.stringify(actual) !== JSON.stringify(expected)) {
      issue(`Unexpected aggregatedFrom disclosure for ${key}`);
    }
    const mergedSignalSum = cluster.aggregatedFrom.reduce((sum, source) => sum + Number(source.signals || 0), 0);
    if (mergedSignalSum !== cluster.signals) issue(`aggregatedFrom signals do not reconcile for ${key}`);
  }
  for (const expectedKey of expectedMergedClusters.keys()) {
    if (!mergedClusters.some(cluster => [cluster.countryCode, cluster.regionCode || '', cluster.city].join('|') === expectedKey)) {
      issue(`Missing aggregatedFrom disclosure for ${expectedKey}`);
    }
  }

  const theDalles = cityClusters.find(cluster => cluster.countryCode === 'US' && cluster.regionCode === 'OR' && cluster.city === 'The Dalles');
  if (theDalles?.signals !== 511 || !Array.isArray(theDalles?.qualityFlags) || !theDalles.qualityFlags.includes('network-location-cluster')) {
    issue('The Dalles must remain a 511-signal network-location-cluster quality flag');
  }
}

if (themeScript !== null && (!themeScript.includes("html.getAttribute('data-theme-lock')")
  || !themeScript.includes('if (persist && !lockedTheme)'))) {
  issue('Global theme controller must honor a page-scoped lock without changing the saved site preference');
}

if (css !== null && !css.includes('.atlas-page .lc-theme-switcher')) {
  issue('Atlas must hide the unavailable theme switcher while its dark theme is locked');
}

if (app !== null) {
  if (!/import\s+\*\s+as\s+THREE\s+from\s+["']\.\/vendor\/three\.module\.min\.js["']/.test(app)) {
    issue('Activity-index JavaScript must import the vendored Three.js module');
  }
  if (!app.includes("dataUrl: '/data/local-ai-activity-index.json?")
    || !app.includes("dataUrl: '/data/local-ai-activity-index-90d.json?")
    || !app.includes("dataUrl: '/data/local-ai-activity-index-180d.json?")) {
    issue('Activity-index JavaScript does not load the versioned JSON dataset');
  }
  if (!app.includes("modelDataUrl: '/data/local-ai-model-page-interest.json?")
    || !app.includes("modelDataUrl: '/data/local-ai-model-page-interest-90d.json?")
    || !app.includes("modelDataUrl: '/data/local-ai-model-page-interest-180d.json?")) {
    issue('Models view must load a versioned 30-day, 3-month and 6-month model-page-interest dataset');
  }
  if (!app.includes("requestedMetricView === 'models'")
    || !app.includes("ACTIVE_VIEW === 'models'")
    || !app.includes('PERIOD_CONFIG[ACTIVE_PERIOD].modelDataUrl')) {
    issue('Models view is not wired to the selected period dataset');
  }
  if (/\bmost used\b|\bmodel usage by country\b|\bactive users?\b/i.test(app)) {
    issue('Models JavaScript must not make a positive most-used, model-usage-by-country or active-user claim');
  }
  if (!app.includes("const WORLD_URL = '/data/ne_50m_admin_0_countries.geojson?")) {
    issue('Activity-index JavaScript must load the versioned Natural Earth 50m country GeoJSON');
  }
  if (app.includes('ne_110m_admin_0_countries')) {
    issue('Activity-index JavaScript must not reference the retired Natural Earth 110m country GeoJSON');
  }
  if (!app.includes("const ADMIN1_MANIFEST_URL = '/data/admin1/manifest.json?")) {
    issue('Activity-index JavaScript must load the versioned worldwide Admin-1 manifest');
  }
  if (!app.includes("admin1Url: '/data/local-ai-admin1-activity.json?")
    || !app.includes("admin1Url: '/data/local-ai-admin1-activity-90d.json?")
    || !app.includes("admin1Url: '/data/local-ai-admin1-activity-180d.json?")) {
    issue('Activity-index JavaScript must load the versioned worldwide regional activity dataset');
  }
  if (!app.includes("const ADMIN2_MANIFEST_URL = '/data/admin2/manifest.json?")) {
    issue('Activity-index JavaScript must load the versioned deeper-boundary manifest');
  }
  if (app.includes('ne_10m_admin_1_china_russia') || /const\s+ADMIN1_URL\s*=/.test(app)) {
    issue('Activity-index JavaScript must not load the retired China/Russia Admin-1 monolith');
  }
  if (!app.includes("const US_STATES_URL = '/data/us-states-2024-20m.geojson?")) {
    issue('Activity-index JavaScript does not load the versioned U.S. state GeoJSON');
  }
  if (!app.includes('function enterUnitedStates(') || !app.includes('function focusRegion(')) {
    issue('Activity-index JavaScript is missing the U.S. state drill-down interactions');
  }
  if (!app.includes('function zoomLimits(') || !app.includes('data-atlas-zoom') || !app.includes('pinchStartDistance')) {
    issue('Activity-index JavaScript is missing discoverable wheel, pinch or button zoom support');
  }
  if (!app.includes('function toggleTour(') || !app.includes('function createBeaconAccent(')) {
    issue('Activity-index JavaScript is missing the guided tour or data-driven visual accents');
  }
  if (app.includes('function createParticles(') || app.includes('new THREE.InstancedMesh(')) {
    issue('Activity-index JavaScript must not recreate synthetic activity point clouds');
  }
  if (!app.includes("entity?.kind !== 'cityCluster'") || !app.includes('pointNearFeature(cluster.lat, cluster.lon')) {
    issue('Activity accents must be restricted to validated published city clusters');
  }
  if (app.includes('setFromPoints([surface, tip])')) {
    issue('Activity-index JavaScript must not recreate decorative radial beacon lines');
  }
  if (!app.includes('periodDays() > 30 ? 144 : state.cityClusters.length')) {
    issue('Desktop Atlas must preserve every 30-day city cluster while capping longer-period clutter');
  }
  if (!app.includes('function buildWorldCountryEntities(')
    || !app.includes('function manifestEntryForCountry(')
    || !app.includes('function detailConfigForCountry(')) {
    issue('Activity-index JavaScript must derive worldwide drill-down entities and labels from the Admin-1 manifest');
  }
  if (!app.includes('async function loadAdmin1Shard(')
    || !app.includes('manifest.path')
    || !app.includes('manifest.sha256')) {
    issue('Activity-index JavaScript must lazily fetch and version each country Admin-1 shard from its manifest entry');
  }
  const admin1CacheLimit = Number(app.match(/const\s+ADMIN1_CACHE_LIMIT\s*=\s*(\d+)\s*;/)?.[1]);
  if (!Number.isInteger(admin1CacheLimit) || admin1CacheLimit < 2 || admin1CacheLimit > 12
    || !app.includes('state.admin1Cache.delete(')) {
    issue('Worldwide Admin-1 shards must use a small bounded in-memory cache');
  }
  if (!app.includes('fetch(ADMIN1_MANIFEST_URL)') || !app.includes('fetch(ADMIN1_ACTIVITY_URL)')) {
    issue('Atlas initialization must fetch the worldwide Admin-1 manifest and regional activity snapshot');
  }
  if (!app.includes('fetch(ADMIN2_MANIFEST_URL)')) {
    issue('Atlas initialization must fetch the deeper-boundary manifest');
  }
  const initializeBody = topLevelFunctionBody(app, 'initialize');
  const hasOptionalAdmin2Fetch = initializeBody.includes('const admin2ManifestPromise = fetch(ADMIN2_MANIFEST_URL)');
  if (!hasOptionalAdmin2Fetch
    || !initializeBody.includes('the world and regional maps remain active')
    || initializeBody.includes('!admin2ManifestResponse.ok')
    || initializeBody.includes('modelsView ? Promise.resolve(null) : fetch(ADMIN2_MANIFEST_URL)')) {
    issue('Admin-2 must remain an optional enhancement that cannot disable the core world and regional Atlas');
  }
  if (!app.includes('async function loadAdmin2Shard(')
    || !app.includes('function enterAdmin2Detail(')
    || !app.includes('function focusAdmin2Region(')
    || !app.includes('function exitAdmin2(')) {
    issue('Activity-index JavaScript is missing the lazy deeper-boundary drill-down flow');
  }
  const admin2CacheLimit = Number(app.match(/const\s+ADMIN2_CACHE_LIMIT\s*=\s*(\d+)\s*;/)?.[1]);
  if (!Number.isInteger(admin2CacheLimit) || admin2CacheLimit < 2 || admin2CacheLimit > 12
    || !app.includes('state.admin2Cache.delete(')) {
    issue('Admin-2 parent shards must use a small bounded in-memory cache');
  }
  const loadAdmin2Body = topLevelFunctionBody(app, 'loadAdmin2Shard');
  if (!app.includes('admin2Requests: new Map()')
    || !loadAdmin2Body.includes('state.admin2Requests.has(key)')
    || !loadAdmin2Body.includes('state.admin2Requests.set(key, request)')
    || !loadAdmin2Body.includes('state.admin2Requests.delete(key)')) {
    issue('Concurrent requests for the same Admin-2 shard must share one in-flight fetch');
  }
  if (app.includes('countryDetailConfigs')) {
    issue('Worldwide drill-down must not remain gated by the retired hard-coded countryDetailConfigs list');
  }
  if (!app.includes('function enterCountryDetail(') || !app.includes('function focusAdmin1Region(')) {
    issue('Activity-index JavaScript is missing generic country and Admin-1 drill-down interactions');
  }
  const pointerPickBody = topLevelFunctionBody(app, 'entityAtPointer');
  if (!app.includes('function entityAtPointer({ preferGeography = false } = {})')
    || !pointerPickBody.includes('geographicEntity = isAdmin2Scope()')
    || !pointerPickBody.includes('? admin2RegionAt(lat, lon)')
    || !pointerPickBody.includes('? stateAt(lat, lon)')
    || !pointerPickBody.includes('? admin1RegionAt(lat, lon)')
    || !pointerPickBody.includes(': countryAt(lat, lon)')
    || !pointerPickBody.includes('const frontSurfaceHit = Boolean(intersection')
    || !pointerPickBody.includes('const clusterHit = frontSurfaceHit && clusterHits[0]')
    || !pointerPickBody.includes('if (preferGeography) return frontSurfaceHit ? geographicEntity || geographyForCluster(clusterHit) : null')
    || !pointerPickBody.includes('return geographicEntity;')
    || pointerPickBody.indexOf('if (preferGeography)') > pointerPickBody.indexOf('if (clusterHit)')) {
    issue('Atlas map activation must prioritize the country, state, Admin-1 or Admin-2 geography beneath city beacon hit areas');
  }
  if (!pointerPickBody.includes('const modelHit = frontSurfaceHit && modelHits[0]')
    || !pointerPickBody.includes('modelHits[0].distance <= intersection.distance + 0.24')) {
    issue('Models view logo hits must be limited to the visible front surface so countries behind the globe cannot be selected');
  }
  const clusterGeographyBody = topLevelFunctionBody(app, 'geographyForCluster');
  if (!clusterGeographyBody.includes("if (state.scope === 'us') return regionForCode(cluster.regionCode)")
    || !clusterGeographyBody.includes('state.admin1AssignmentByCluster.get(cluster)')
    || !clusterGeographyBody.includes('return countryForCode(cluster.countryCode)')) {
    issue('Coastal city beacons must fall back to their mapped geography when simplified boundaries leave the centroid offshore');
  }
  const interactionBody = topLevelFunctionBody(app, 'bindInteractions');
  if (!interactionBody.includes('entityAtPointer({ preferGeography: true })')
    || !interactionBody.includes('const entity = entityAtPointer();')) {
    issue('Atlas clicks must prefer geography while pointer hover retains city-cluster discovery');
  }
  if (!interactionBody.includes('if (state.activePointers.size === 0)')
    || interactionBody.includes('if (state.activePointers.size < 2)')) {
    issue('Atlas pinch gestures must stay consumed until every touch pointer is released');
  }
  const pointerDownStart = interactionBody.indexOf("canvas.addEventListener('pointerdown'");
  const pointerMoveStart = interactionBody.indexOf("canvas.addEventListener('pointermove'");
  const pointerDownBody = interactionBody.slice(pointerDownStart, pointerMoveStart);
  if (pointerDownStart < 0 || pointerMoveStart < 0 || !pointerDownBody.includes('hideTooltip();')) {
    issue('Atlas pointer activation must clear any stale city tooltip before opening geography detail');
  }
  const beaconBody = topLevelFunctionBody(app, 'createBeaconAccent');
  const beaconScaleBody = topLevelFunctionBody(app, 'updateBeaconVisualScale');
  const clusterLabelBody = topLevelFunctionBody(app, 'createClusterLabel');
  if (!beaconBody.includes('const hitRadius = 0.038 + Math.sqrt(intensity) * 0.018;')
    || !beaconBody.includes('new THREE.SphereGeometry(hitRadius, 12, 8)')
    || !beaconScaleBody.includes('const hitPixels = isMobileViewport() ? 32 : 24;')
    || !beaconScaleBody.includes('const hitScale = hitPixels / (2 * entry.hitRadius * pixelsPerLocalUnit)')
    || !beaconScaleBody.includes('entry.hit.scale.setScalar(')) {
    issue('City beacon hover targets must remain compact enough for dense small-country and regional maps');
  }
  if (!clusterLabelBody.includes("button.addEventListener('click', () => focusCluster(entry.cluster))")) {
    issue('City clusters must remain explicitly selectable through their accessible projected labels');
  }
  const admin1LayerBody = topLevelFunctionBody(app, 'createAdmin1Layer');
  if (admin1LayerBody.includes("makeActivityTexture('admin1')")) {
    issue('Admin-1 regional fills must not use a magnified global raster texture');
  }
  if (!admin1LayerBody.includes('sphericalFillGeometry(')
    || !admin1LayerBody.includes('THREE.NormalBlending')
    || !admin1LayerBody.includes('admin1FillEntity')
    || !admin1LayerBody.includes('stage.dataset.admin1FillMeshes')
    || !admin1LayerBody.includes('stage.dataset.admin1FillTriangles')) {
    issue('Admin-1 regional fills must remain exact vector meshes with normal blending and runtime QA counters');
  }
  const admin1FillGeometryBody = topLevelFunctionBody(app, 'sphericalFillGeometry');
  if (!admin1FillGeometryBody.includes('unwrappedFillRing(')
    || !admin1FillGeometryBody.includes('THREE.ShapeUtils.triangulateShape(')
    || !admin1FillGeometryBody.includes('appendSphericalFillTriangle(')) {
    issue('Admin-1 vector fills must triangulate unwrapped Polygon and MultiPolygon rings onto the sphere');
  }
  const primaryLonLatIndex = admin1FillGeometryBody.indexOf('contour.map(point => point.clone())');
  const fallbackGuardIndex = admin1FillGeometryBody.indexOf('if (!validTriangulation(triangles))');
  const tangentFallbackIndex = admin1FillGeometryBody.indexOf('const tangentCenter = sphericalContour');
  if (primaryLonLatIndex < 0
    || fallbackGuardIndex < 0
    || tangentFallbackIndex < 0
    || primaryLonLatIndex > fallbackGuardIndex
    || tangentFallbackIndex < fallbackGuardIndex) {
    issue('Admin-1 fills must use unwrapped longitude/latitude as the primary triangulation and tangent projection only as a guarded fallback');
  }
  const selectionOverlayBody = topLevelFunctionBody(app, 'updateSelectionOverlay');
  if (!selectionOverlayBody.includes('if (isAdmin1Scope() || isAdmin2Scope())')
    || !selectionOverlayBody.includes('state.selectionMesh.visible = false')
    || !selectionOverlayBody.includes('updateSelectionBoundary(feature, qualityFlagged)')) {
    issue('Admin-1 and Admin-2 selections must use exact vector boundaries without a raster selection halo');
  }
  const admin2LayerBody = topLevelFunctionBody(app, 'createAdmin2Layer');
  if (!admin2LayerBody.includes('new THREE.LineSegments(')
    || !admin2LayerBody.includes('sphericalFillGeometry(region.feature')
    || !admin2LayerBody.includes('admin2ScopeData(region)?.observed')
    || admin2LayerBody.includes("makeActivityTexture('admin2')")) {
    issue('Admin-2 must keep exact vector boundaries and use only independently observed subdivision model data for fills');
  }
  const focusModelRegionBody = topLevelFunctionBody(app, 'focusModelRegion');
  const scopeInterfaceBody = topLevelFunctionBody(app, 'updateScopeInterface');
  const shareUrlBody = topLevelFunctionBody(app, 'currentShareUrl');
  if (!focusModelRegionBody.includes("admin2ConfigForParent(resolvedRegion, 'admin1')")
    || !focusModelRegionBody.includes("enterAdmin2Detail(resolvedRegion, 'admin1')")
    || !scopeInterfaceBody.includes('state.detailGroup.visible = admin1View;')
    || !scopeInterfaceBody.includes('state.usGroup.visible = stateView;')) {
    issue('Models and Install Paths must reuse Admin-2 subdivisions without leaving a flat parent aggregate visible underneath');
  }
  const spotlightBody = topLevelFunctionBody(app, 'showSpotlight');
  if (!spotlightBody.includes("entity.kind === 'admin2'")
    || !spotlightBody.includes('No observed model signal')
    || !spotlightBody.includes('path selection, not verified download')) {
    issue('Admin-2 selections must distinguish observed county model leaders from empty counties and unverified downloads');
  }
  if (!css.includes('.atlas-navigation__tour[hidden]')
    || !css.includes('display: none !important;')) {
    issue('The ranked-region tour must stay visually hidden in unranked Admin-2 views');
  }
  const focusAdmin2Body = topLevelFunctionBody(app, 'focusAdmin2Region');
  if (!focusAdmin2Body.includes('if (isModelInterestView()) syncModelUrl();')
    || !shareUrlBody.includes("url.searchParams.set('area', locked.name)")) {
    issue('Models Admin-2 selections must preserve the selected child area in shareable URLs');
  }
  if (!focusAdmin2Body.includes('syncRegionPanelSelection(region)')
    || !app.includes("button.setAttribute('aria-current', 'true')")
    || !css.includes('.atlas-scope-admin2 .atlas-region-panel__list button.is-active')) {
    issue('Admin-2 boundary selection must remain visible and expose aria-current in the long subdivision list');
  }
  const regionalMarkerOffset = Number(app.match(/const\s+REGIONAL_MODEL_MARKER_OFFSET\s*=\s*([0-9.]+)\s*;/)?.[1]);
  const createModelRegionMarkersBody = topLevelFunctionBody(app, 'createModelRegionMarkers');
  if (!Number.isFinite(regionalMarkerOffset)
    || regionalMarkerOffset <= 0.04
    || regionalMarkerOffset > 0.06
    || !createModelRegionMarkersBody.includes('GLOBE_RADIUS + REGIONAL_MODEL_MARKER_OFFSET')) {
    issue('Regional model logos must remain pinned just above the vector boundary surface without visible globe parallax');
  }
  const defaultZoomBody = topLevelFunctionBody(app, 'defaultZoom');
  if (!app.includes('function featureLongitudeSpan(')
    || !app.includes('function admin1ZoomForBbox(bbox, mobile = isMobileViewport(), longitudeSpanDegrees = null)')
    || !app.includes('Number.isFinite(longitudeSpanDegrees)')
    || !defaultZoomBody.includes('state.admin2Config.longitudeSpan')
    || !focusAdmin2Body.includes('region.longitudeSpan')) {
    issue('Admin-2 zoom fitting must use an antimeridian-aware longitude span for Alaska and crossing subdivisions');
  }
  const regionPanelBody = topLevelFunctionBody(app, 'renderStatePanel');
  if (!regionPanelBody.includes('.flatMap(region => region.features || [])')
    || !regionPanelBody.includes('!publishedFeatures.has(region.feature)')) {
    issue('Composite regional aggregates must suppress their component polygons from the neutral region list');
  }
  if (!app.includes('usAllRegions: []')
    || !app.includes('state.usAllRegions = state.usBoundaries.features.map(')
    || !regionPanelBody.includes('state.usAllRegions')
    || !topLevelFunctionBody(app, 'stateAt').includes('state.usAllRegions')) {
    issue('The U.S. state view must keep all 50 states and District of Columbia selectable for deeper boundary exploration');
  }
  const desktopTextureWidth = Number(app.match(/const\s+DESKTOP_TEXTURE_WIDTH\s*=\s*(\d+)\s*;/)?.[1]);
  const mobileTextureWidth = Number(app.match(/const\s+MOBILE_TEXTURE_WIDTH\s*=\s*(\d+)\s*;/)?.[1]);
  if (!Number.isFinite(desktopTextureWidth) || desktopTextureWidth < 4096) {
    issue('Desktop Atlas textures must be at least 4096 pixels wide');
  }
  if (!Number.isFinite(mobileTextureWidth) || mobileTextureWidth < 1024) {
    issue('Mobile Atlas textures must be at least 1024 pixels wide');
  }
  const textureWidthBody = topLevelFunctionBody(app, 'atlasTextureWidth');
  if (!textureWidthBody || !/return\s+[^;\n]+\?\s*MOBILE_TEXTURE_WIDTH\s*:\s*DESKTOP_TEXTURE_WIDTH\s*;/.test(textureWidthBody)) {
    issue('atlasTextureWidth must select the high-resolution mobile and desktop texture constants');
  }
  const textureBuilders = [
    ['world', 'makeWorldTexture', 'textureCanvas'],
    ['activity', 'makeActivityTexture', 'textureCanvas'],
    ['selection', 'createSelectionOverlay', 'state.selectionCanvas']
  ];
  for (const [label, functionName, canvasExpression] of textureBuilders) {
    const body = topLevelFunctionBody(app, functionName);
    if (!body) {
      issue(`Activity-index JavaScript is missing the ${label} texture builder: ${functionName}`);
      continue;
    }
    if (!canvasUsesAtlasTextureWidth(body, canvasExpression)) {
      issue(`${label[0].toUpperCase() + label.slice(1)} texture must use atlasTextureWidth(), preventing a low-resolution desktop fallback`);
    }
    if (!canvasUsesTwoToOneTexture(body, canvasExpression)) {
      issue(`${label[0].toUpperCase() + label.slice(1)} texture must preserve a 2:1 equirectangular canvas`);
    }
  }
  const worldTextureBody = topLevelFunctionBody(app, 'makeWorldTexture');
  const activityTextureBody = topLevelFunctionBody(app, 'makeActivityTexture');
  const fillOnlyDraw = 'drawFeature(context, feature, textureCanvas.width, textureCanvas.height, { stroke: false });';
  if (!worldTextureBody.includes(fillOnlyDraw)) {
    issue('World texture polygons must remain fill-only so country borders stay vector-sharp at close zoom');
  }
  if (!activityTextureBody.includes(fillOnlyDraw) || activityTextureBody.includes('{ fill: false }')) {
    issue('Activity heat textures must remain fill-only so raster strokes cannot blur country or region borders');
  }
  const worldBoundariesBody = topLevelFunctionBody(app, 'createWorldBoundaries');
  if (!worldBoundariesBody.includes('new THREE.LineSegments(')
    || !worldBoundariesBody.includes('depthTest: true')
    || !worldBoundariesBody.includes('toneMapped: false')) {
    issue('World country borders must remain a depth-tested, tone-map-free vector LineSegments layer');
  }
  const featureNamesBody = app.match(/function featureNames\([^)]*\)\s*{([\s\S]*?)\n}/)?.[1] || '';
  if (featureNamesBody.includes('SOVEREIGNT')) issue('Country matching must not fall through to sovereign territories');
}

if (css !== null) {
  if (!css.includes('.atlas-page')) issue('Activity-index stylesheet is missing the page scope');
  if (!css.includes('.atlas-stage')) issue('Activity-index stylesheet is missing the full-screen stage styles');
  if (!css.includes('.atlas-region-panel')) issue('Activity-index stylesheet is missing the U.S. state panel');
  if (!css.includes('.atlas-navigation__rail') || !css.includes('.atlas-navigation__tour')) {
    issue('Activity-index stylesheet is missing the zoom and guided-tour HUD');
  }
  if (!css.includes('.atlas-map-label') || !css.includes('.atlas-label-layer')) {
    issue('Activity-index stylesheet is missing projected city labels or the map legend layer');
  }
  const mapLabelRule = css.match(/\.atlas-map-label\s*\{([^}]*)\}/)?.[1] || '';
  const mapLabelButtonRule = css.match(/\.atlas-map-label__button\s*\{([^}]*)\}/)?.[1] || '';
  const mapLabelButtonHeight = Number(mapLabelButtonRule.match(/min-height:\s*(\d+)px/)?.[1]);
  if (!mapLabelRule.includes('pointer-events: none')
    || !mapLabelButtonRule.includes('pointer-events: auto')
    || !Number.isFinite(mapLabelButtonHeight)
    || mapLabelButtonHeight < 24) {
    issue('Projected city labels must have no dead interception padding and a fully interactive button at least 24px tall');
  }
}
if (vendor !== null && vendor.length < 100000) issue('Vendored Three.js module is unexpectedly small');
if (vendorLicense !== null && !/three\.js|MIT/i.test(vendorLicense)) issue('Three.js vendor license is not recognizable');
if (geojson) {
  const countryFeatures = Array.isArray(geojson.features) ? geojson.features : [];
  if (geojson.type !== 'FeatureCollection' || countryFeatures.length < 230) {
    issue('Natural Earth 50m country GeoJSON must be a detailed FeatureCollection with at least 230 features');
  }
  if (geojson.name !== 'ne_50m_admin_0_countries') {
    issue('Country GeoJSON must identify itself as ne_50m_admin_0_countries');
  }
  if (geojson.crs?.properties?.name !== 'urn:ogc:def:crs:OGC:1.3:CRS84') {
    issue('Natural Earth 50m country GeoJSON must retain its CRS84 coordinate reference');
  }
  const countryCoordinatePositions = countryFeatures.reduce(
    (sum, feature) => sum + countCoordinatePositions(feature.geometry?.coordinates),
    0
  );
  if (countryCoordinatePositions < 75000) {
    issue(`Natural Earth country geometry contains only ${countryCoordinatePositions} positions; expected unsimplified 50m detail`);
  }
  const naturalEarthFeatures = countryFeatures.filter(feature =>
    Number.isFinite(feature.properties?.NE_ID)
    && typeof feature.properties?.ADMIN === 'string'
    && typeof feature.properties?.ADM0_A3 === 'string');
  if (naturalEarthFeatures.length < 230) {
    issue('Country GeoJSON is missing official Natural Earth feature identifiers or admin fields');
  }
}
const admin1ShardFeaturesByA3 = new Map();
if (admin1Manifest) {
  const source = admin1Manifest.source || {};
  if (admin1Manifest.schemaVersion !== 1 || !isIsoTimestamp(admin1Manifest.generatedAt)) {
    issue('Worldwide Admin-1 manifest must use schema version 1 and a valid generatedAt timestamp');
  }
  if (source.provider !== 'Natural Earth'
    || source.dataset !== 'Admin 1 - States, Provinces'
    || source.sourceLayer !== 'ne_10m_admin_1_states_provinces'
    || source.scale !== '1:10m'
    || source.version !== '5.1.1') {
    issue('Worldwide Admin-1 provenance must identify Natural Earth Admin 1 version 5.1.1 at 1:10m');
  }
  if (source.sourcePage !== 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/'
    || source.downloadUrl !== 'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip'
    || source.archiveSha256 !== EXPECTED_ADMIN1_ARCHIVE_SHA256) {
    issue('Worldwide Admin-1 source URL or official archive checksum is incorrect');
  }
  if (String(source.license || '').toLowerCase() !== 'public domain'
    || source.attribution !== 'Made with Natural Earth'
    || source.worldview !== 'Natural Earth default de facto boundaries') {
    issue('Worldwide Admin-1 data must retain the Natural Earth license, attribution, and worldview disclosure');
  }
  if (!String(source.filter || '').includes('dominant ISO prefix')
    || !String(source.filter || '').includes('no geometry simplification')) {
    issue('Worldwide Admin-1 metadata must disclose its selection rule and unsimplified geometry');
  }

  const countries = admin1Manifest.countries && typeof admin1Manifest.countries === 'object'
    && !Array.isArray(admin1Manifest.countries) ? admin1Manifest.countries : {};
  const countryEntries = Object.entries(countries).sort(([left], [right]) => left.localeCompare(right));
  if (countryEntries.length !== EXPECTED_ADMIN1_COUNTRIES) {
    issue(`Expected ${EXPECTED_ADMIN1_COUNTRIES} lazy Admin-1 country shards, found ${countryEntries.length}`);
  }
  const totals = admin1Manifest.totals || {};
  for (const [field, expected] of Object.entries({
    countries: EXPECTED_ADMIN1_COUNTRIES,
    subdivisions: EXPECTED_ADMIN1_FEATURES,
    coordinatePositionCount: EXPECTED_ADMIN1_COORDINATE_POSITIONS,
    singleFeatureCountries: EXPECTED_ADMIN1_SINGLE_FEATURE_COUNTRIES,
    multiFeatureCountries: EXPECTED_ADMIN1_MULTI_FEATURE_COUNTRIES
  })) {
    if (totals[field] !== expected) issue(`Worldwide Admin-1 manifest total ${field} must be ${expected}`);
  }
  if (totals.geometryFingerprint !== EXPECTED_ADMIN1_GEOMETRY_FINGERPRINT
    || totals.recordFingerprint !== EXPECTED_ADMIN1_RECORD_FINGERPRINT) {
    issue('Worldwide Admin-1 manifest fingerprints do not match the approved Natural Earth snapshot');
  }

  const worldCountryCodes = new Set((geojson?.features || [])
    .map(feature => String(feature.properties?.ADM0_A3 || '').trim().toUpperCase())
    .filter(code => /^[A-Z0-9]{3}$/.test(code)));
  const manifestCountryCodes = new Set(countryEntries.map(([code]) => code));
  for (const code of worldCountryCodes) {
    if (!manifestCountryCodes.has(code)) issue(`Worldwide Admin-1 manifest is missing mapped country ${code}`);
  }
  for (const code of manifestCountryCodes) {
    if (!worldCountryCodes.has(code)) issue(`Worldwide Admin-1 manifest contains unknown country ${code}`);
  }

  const expectedShardFiles = new Set(countryEntries.map(([code]) => `${code.toLowerCase()}.geojson`));
  const admin1Directory = path.join(ROOT, 'data', 'admin1');
  const actualShardFiles = fs.existsSync(admin1Directory)
    ? fs.readdirSync(admin1Directory).filter(filename => /^[a-z0-9]{3}\.geojson$/.test(filename))
    : [];
  for (const filename of actualShardFiles) {
    if (!expectedShardFiles.has(filename)) issue(`Unreferenced Admin-1 shard is public: data/admin1/${filename}`);
  }
  for (const filename of expectedShardFiles) {
    if (!actualShardFiles.includes(filename)) issue(`Admin-1 manifest references a missing shard: data/admin1/${filename}`);
  }

  const allAdmin1Features = [];
  const admin1Codes = new Set();
  const naturalEarthIds = new Set();
  let computedSubdivisions = 0;
  let computedCoordinatePositions = 0;
  let computedSingleFeatureCountries = 0;
  let computedMultiFeatureCountries = 0;

  for (const [code, entry] of countryEntries) {
    const label = `Admin-1 manifest entry ${code}`;
    if (!/^[A-Z0-9]{3}$/.test(code) || entry?.code !== code) issue(`${label} has an invalid country code`);
    if (isPlaceholder(entry?.name)) issue(`${label} has a missing country name`);
    const expectedPath = `/data/admin1/${code.toLowerCase()}.geojson`;
    if (entry?.path !== expectedPath) issue(`${label} path must be ${expectedPath}`);
    if (!Number.isInteger(entry?.featureCount) || entry.featureCount < 1) issue(`${label} has an invalid featureCount`);
    if (!Number.isInteger(entry?.coordinatePositionCount) || entry.coordinatePositionCount < 1) {
      issue(`${label} has an invalid coordinatePositionCount`);
    }
    if (!validBbox(entry?.bbox)) issue(`${label} has an invalid bounding box`);
    if (!/^[a-f0-9]{64}$/.test(entry?.sha256 || '')) issue(`${label} has an invalid SHA-256`);

    const shardRelativePath = entry?.path === expectedPath ? expectedPath.slice(1) : null;
    const shardText = shardRelativePath ? readFile(shardRelativePath, `${code} Admin-1 shard`) : null;
    const shard = parseJson(shardText, `${code} Admin-1 shard`);
    if (!shard) continue;
    if (sha256(shardText) !== entry.sha256) issue(`${code} Admin-1 shard SHA-256 does not match its manifest entry`);
    if (shard.type !== 'FeatureCollection'
      || shard.name !== `ne_10m_admin_1_${code.toLowerCase()}`
      || shard.adm0A3 !== code) {
      issue(`${code} Admin-1 shard has invalid collection metadata`);
    }
    const features = Array.isArray(shard.features) ? shard.features : [];
    admin1ShardFeaturesByA3.set(code, features);
    allAdmin1Features.push(...features);
    if (features.length !== entry.featureCount) issue(`${code} Admin-1 shard featureCount does not match its manifest entry`);
    if (features.length === 1) computedSingleFeatureCountries += 1;
    if (features.length > 1) computedMultiFeatureCountries += 1;
    computedSubdivisions += features.length;

    const coordinateStats = coordinateStatsForFeatures(features);
    computedCoordinatePositions += coordinateStats.positions;
    if (coordinateStats.invalid !== 0) issue(`${code} Admin-1 shard contains ${coordinateStats.invalid} invalid coordinate positions`);
    if (coordinateStats.positions !== entry.coordinatePositionCount) {
      issue(`${code} Admin-1 shard coordinate count does not match its manifest entry`);
    }
    const computedBbox = bboxFromStats(coordinateStats);
    if (!sameJson(shard.bbox, entry.bbox) || !sameJson(computedBbox, entry.bbox)) {
      issue(`${code} Admin-1 shard bounding box does not match its geometry and manifest entry`);
    }

    const typeCounts = new Map();
    for (const [index, feature] of features.entries()) {
      const properties = feature.properties || {};
      const featureLabel = properties.adm1_code || `${code} feature ${index + 1}`;
      if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) {
        issue(`Admin-1 ${featureLabel} must contain polygon geometry`);
      }
      for (const field of ['adm0_a3', 'admin', 'adm1_code', 'iso_3166_2', 'name', 'name_en', 'ne_id']) {
        if (isPlaceholder(properties[field])) issue(`Admin-1 ${featureLabel} has a missing or placeholder ${field}`);
      }
      if (properties.adm0_a3 !== code) issue(`Admin-1 ${featureLabel} is stored in the wrong country shard`);
      if (!Number.isInteger(properties.ne_id) || properties.ne_id < 1) {
        issue(`Admin-1 ${featureLabel} has an invalid Natural Earth ID`);
      }
      if (admin1Codes.has(properties.adm1_code)) issue(`Duplicate worldwide Admin-1 code: ${properties.adm1_code}`);
      if (naturalEarthIds.has(properties.ne_id)) issue(`Duplicate worldwide Natural Earth Admin-1 ID: ${properties.ne_id}`);
      admin1Codes.add(properties.adm1_code);
      naturalEarthIds.add(properties.ne_id);
      const type = properties.type_en || properties.type || 'Region';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }
    const expectedTypes = [...typeCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([type, count]) => ({ type, count }));
    if (!sameJson(entry.types, expectedTypes)) issue(`${code} Admin-1 type summary does not match its shard`);
  }

  if (computedSubdivisions !== EXPECTED_ADMIN1_FEATURES
    || computedCoordinatePositions !== EXPECTED_ADMIN1_COORDINATE_POSITIONS
    || computedSingleFeatureCountries !== EXPECTED_ADMIN1_SINGLE_FEATURE_COUNTRIES
    || computedMultiFeatureCountries !== EXPECTED_ADMIN1_MULTI_FEATURE_COUNTRIES) {
    issue('Worldwide Admin-1 shard totals do not reconcile to the approved manifest totals');
  }
  const fingerprintFeatures = [...allAdmin1Features].sort((left, right) => {
    const leftKey = `${left.properties?.adm0_a3}|${left.properties?.adm1_code}`;
    const rightKey = `${right.properties?.adm0_a3}|${right.properties?.adm1_code}`;
    return leftKey.localeCompare(rightKey);
  });
  const geometryFingerprint = sha256(fingerprintFeatures.map(feature => (
    `${feature.properties?.adm0_a3}|${feature.properties?.adm1_code}|${JSON.stringify(feature.geometry)}`
  )).join('\n'));
  const recordFingerprint = sha256(fingerprintFeatures.map(feature => {
    const properties = feature.properties || {};
    return [
      properties.adm0_a3,
      properties.adm1_code,
      properties.iso_3166_2,
      properties.name,
      properties.name_en,
      properties.type,
      properties.type_en,
      properties.ne_id,
      JSON.stringify(feature.geometry)
    ].join('|');
  }).join('\n'));
  if (geometryFingerprint !== EXPECTED_ADMIN1_GEOMETRY_FINGERPRINT
    || recordFingerprint !== EXPECTED_ADMIN1_RECORD_FINGERPRINT) {
    issue('Worldwide Admin-1 shard records do not match the approved Natural Earth geometry and record fingerprints');
  }
}

if (admin1Activity) {
  if (admin1Activity.schemaVersion !== 1 || !isIsoTimestamp(admin1Activity.generatedAt)) {
    issue('Worldwide regional activity must use schema version 1 and a valid generatedAt timestamp');
  }
  if (admin1Activity.publishThreshold !== 5) issue('Worldwide regional activity publish threshold must be five signals');
  if (admin1Activity.source?.provider !== 'DataFast'
    || admin1Activity.source?.dimension !== 'region'
    || !String(admin1Activity.source?.method || '').includes('Country-filtered')) {
    issue('Worldwide regional activity must identify the country-filtered DataFast region source');
  }
  if (!String(admin1Activity.source?.snapshotNote || '').includes('not presented as an additive reconciliation')) {
    issue('Worldwide regional activity must disclose that separately captured dimensions are not additive');
  }
  if (!String(admin1Activity.privacy?.rule || '').toLowerCase().includes('at least five')
    || !String(admin1Activity.privacy?.withheldDetail || '').toLowerCase().includes('not included')) {
    issue('Worldwide regional activity must disclose that below-threshold rows are omitted from the public file');
  }
  if (admin1Activity.period?.start !== data?.period?.start
    || admin1Activity.period?.end !== data?.period?.end
    || admin1Activity.period?.timezone !== data?.timezone) {
    issue('Worldwide regional activity period must match the public country snapshot and timezone');
  }
  const unexpectedTopLevelKeys = unexpectedKeys(admin1Activity, [
    'schemaVersion', 'generatedAt', 'period', 'source', 'publishThreshold', 'privacy', 'countries'
  ]);
  if (unexpectedTopLevelKeys.length) {
    issue(`Worldwide regional activity contains unexpected public fields: ${unexpectedTopLevelKeys.join(', ')}`);
  }

  const activityCountries = admin1Activity.countries && typeof admin1Activity.countries === 'object'
    && !Array.isArray(admin1Activity.countries) ? admin1Activity.countries : {};
  const activityCountryEntries = Object.entries(activityCountries);
  if (activityCountryEntries.length !== EXPECTED_ADMIN1_ACTIVITY_COUNTRIES) {
    issue(`Expected ${EXPECTED_ADMIN1_ACTIVITY_COUNTRIES} worldwide regional activity countries outside the U.S., found ${activityCountryEntries.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(activityCountries, 'United States')) {
    issue('Worldwide regional activity must not duplicate the dedicated U.S. Census state dataset');
  }
  const expectedActivityCountries = new Map((data?.countries || [])
    .filter(country => country.name !== 'United States')
    .map(country => [country.name, country]));
  for (const countryName of expectedActivityCountries.keys()) {
    if (!Object.prototype.hasOwnProperty.call(activityCountries, countryName)) {
      issue(`Worldwide regional activity is missing published country ${countryName}`);
    }
  }
  for (const countryName of Object.keys(activityCountries)) {
    if (!expectedActivityCountries.has(countryName)) issue(`Worldwide regional activity contains unknown country ${countryName}`);
  }

  const statusCounts = new Map();
  const usedAdm0Codes = new Set();
  let publicRegionCount = 0;
  let publicSignalCount = 0;
  let compositeRegionCount = 0;
  for (const [countryName, country] of activityCountryEntries) {
    const unexpectedCountryKeys = unexpectedKeys(country, [
      'countryCode', 'adm0A3', 'collectionStatus', 'publicationStatus', 'snapshotGeneratedAt',
      'countrySignals', 'publishedSignals', 'publishedRegions', 'regions'
    ]);
    if (unexpectedCountryKeys.length) {
      issue(`${countryName} regional record contains unexpected public fields: ${unexpectedCountryKeys.join(', ')}`);
    }
    if (!/^[A-Z]{2}$/.test(country?.countryCode || '') || !/^[A-Z0-9]{3}$/.test(country?.adm0A3 || '')) {
      issue(`${countryName} regional record has an invalid country code`);
    }
    if (usedAdm0Codes.has(country.adm0A3)) issue(`Duplicate regional activity Admin-0 code: ${country.adm0A3}`);
    usedAdm0Codes.add(country.adm0A3);
    if (!admin1Manifest?.countries?.[country.adm0A3]) {
      issue(`${countryName} regional record has no worldwide Admin-1 manifest entry`);
    }
    if (country.collectionStatus !== 'collected') issue(`${countryName} regional data must have a collected status`);
    if (!isIsoTimestamp(country.snapshotGeneratedAt)) issue(`${countryName} regional snapshot timestamp is invalid`);
    if (country.countrySignals !== expectedActivityCountries.get(countryName)?.signals) {
      issue(`${countryName} regional record does not preserve its public country signal count`);
    }
    statusCounts.set(country.publicationStatus, (statusCounts.get(country.publicationStatus) || 0) + 1);

    const regions = Array.isArray(country.regions) ? country.regions : [];
    const regionSignalSum = regions.reduce((sum, region) => sum + Number(region.signals || 0), 0);
    if (country.publishedRegions !== regions.length || country.publishedSignals !== regionSignalSum) {
      issue(`${countryName} regional ranks and sums do not reconcile to publishedRegions and publishedSignals`);
    }
    if (country.publicationStatus === 'published' && regions.length === 0) {
      issue(`${countryName} is marked published without a public regional row`);
    }
    if (country.publicationStatus !== 'published'
      && (regions.length !== 0 || country.publishedRegions !== 0 || country.publishedSignals !== 0)) {
      issue(`${countryName} non-published status must not expose regional rows or non-zero published totals`);
    }
    if (!EXPECTED_ADMIN1_PUBLICATION_STATUSES.has(country.publicationStatus)) {
      issue(`${countryName} has an unexpected regional publication status: ${country.publicationStatus}`);
    }

    const shardFeatures = admin1ShardFeaturesByA3.get(country.adm0A3) || [];
    const boundaryById = new Map(shardFeatures.map(feature => [feature.properties?.adm1_code, feature]));
    const assignedBoundaryIds = new Set();
    regions.forEach((region, index) => {
      const unexpectedRegionKeys = unexpectedKeys(region, [
        'rank', 'sourceName', 'canonicalName', 'signals', 'boundaryMatch', 'boundaryFeatureIds'
      ]);
      if (unexpectedRegionKeys.length) {
        issue(`${countryName} region ${index + 1} contains unexpected public fields: ${unexpectedRegionKeys.join(', ')}`);
      }
      const label = `${countryName} / ${region.canonicalName || region.sourceName || `region ${index + 1}`}`;
      if (region.rank !== index + 1) issue(`${label} has a non-contiguous rank`);
      if (index > 0 && (regions[index - 1].signals < region.signals
        || (regions[index - 1].signals === region.signals
          && String(regions[index - 1].canonicalName).localeCompare(String(region.canonicalName)) > 0))) {
        issue(`${label} is not in the approved descending rank order`);
      }
      if (isPlaceholder(region.sourceName) || isPlaceholder(region.canonicalName)) issue(`${label} has a missing regional name`);
      if (!Number.isInteger(region.signals) || region.signals < admin1Activity.publishThreshold) {
        issue(`${label} exposes a value below the five-signal privacy threshold`);
      }
      if (!['exact', 'alias', 'composite', 'legacy-exact'].includes(region.boundaryMatch)) {
        issue(`${label} has an invalid boundary match type`);
      }
      const boundaryFeatureIds = Array.isArray(region.boundaryFeatureIds) ? region.boundaryFeatureIds : [];
      if (boundaryFeatureIds.length === 0 || new Set(boundaryFeatureIds).size !== boundaryFeatureIds.length) {
        issue(`${label} must reference at least one unique boundary feature`);
      }
      if (!sameJson(boundaryFeatureIds, [...boundaryFeatureIds].sort())) {
        issue(`${label} boundary feature IDs must use a stable sorted order`);
      }
      if (region.boundaryMatch === 'composite') {
        compositeRegionCount += 1;
        if (boundaryFeatureIds.length < 2) issue(`${label} composite must span multiple boundary features`);
      } else if (boundaryFeatureIds.length !== 1) {
        issue(`${label} non-composite match must reference exactly one boundary feature`);
      }
      for (const boundaryFeatureId of boundaryFeatureIds) {
        if (!boundaryById.has(boundaryFeatureId)) issue(`${label} references missing boundary ${boundaryFeatureId}`);
        if (assignedBoundaryIds.has(boundaryFeatureId)) issue(`${label} reuses boundary ${boundaryFeatureId} already assigned to another public region`);
        assignedBoundaryIds.add(boundaryFeatureId);
      }
    });
    publicRegionCount += regions.length;
    publicSignalCount += regionSignalSum;
  }

  for (const [status, expected] of EXPECTED_ADMIN1_PUBLICATION_STATUSES) {
    if ((statusCounts.get(status) || 0) !== expected) {
      issue(`Expected ${expected} regional country records with status ${status}, found ${statusCounts.get(status) || 0}`);
    }
  }
  for (const [status, count] of statusCounts) {
    if (!EXPECTED_ADMIN1_PUBLICATION_STATUSES.has(status)) issue(`Unexpected regional publication status ${status} appears ${count} time(s)`);
  }
  if (publicRegionCount !== EXPECTED_ADMIN1_ACTIVITY_REGIONS) {
    issue(`Expected ${EXPECTED_ADMIN1_ACTIVITY_REGIONS} public regional rows, found ${publicRegionCount}`);
  }
  if (publicSignalCount !== EXPECTED_ADMIN1_ACTIVITY_SIGNALS) {
    issue(`Expected ${EXPECTED_ADMIN1_ACTIVITY_SIGNALS} signals across public regional rows, found ${publicSignalCount}`);
  }
  if (compositeRegionCount !== 14) issue(`Expected 14 multi-feature regional composites, found ${compositeRegionCount}`);
  if (activityCountries.Uzbekistan?.publicationStatus !== 'boundary_unresolved'
    || (activityCountries.Uzbekistan?.regions || []).length !== 0) {
    issue('Uzbekistan must retain an honest boundary_unresolved status without publishing the ambiguous regional row');
  }
  if (activityCountries['Saudi Arabia']?.publicationStatus !== 'none_above_threshold'
    || (activityCountries['Saudi Arabia']?.regions || []).length !== 0) {
    issue('Saudi Arabia must retain a collected none_above_threshold status without a public regional row');
  }

  const chinaActivity = activityCountries.China;
  const chinaLegacy = data?.subnational?.China?.regions || [];
  if (!chinaActivity || chinaActivity.regions?.length !== chinaLegacy.length) {
    issue('Worldwide regional activity must retain the approved legacy China snapshot');
  } else {
    chinaLegacy.forEach((legacyRegion, index) => {
      const publicRegion = chinaActivity.regions[index];
      if (publicRegion.rank !== legacyRegion.rank
        || publicRegion.sourceName !== legacyRegion.sourceName
        || publicRegion.canonicalName !== legacyRegion.name
        || publicRegion.signals !== legacyRegion.signals
        || publicRegion.boundaryMatch !== 'legacy-exact') {
        issue(`China legacy regional row ${index + 1} does not match the approved snapshot`);
      }
    });
  }

  const serializedActivity = JSON.stringify(admin1Activity);
  for (const forbiddenKey of ['observedRegions', 'observedRows', 'withheldRegions', 'withheldRows', 'rawRegions', 'rawRows']) {
    if (new RegExp(`"${forbiddenKey}"\\s*:`).test(serializedActivity)) {
      issue(`Worldwide regional activity must not expose below-threshold raw detail via ${forbiddenKey}`);
    }
  }
  const suspiciousRegionalFiles = fs.readdirSync(path.join(ROOT, 'data'))
    .filter(filename => /(?:datafast|admin1).*(?:raw|private)|(?:raw|private).*(?:region|admin1)/i.test(filename));
  if (suspiciousRegionalFiles.length) {
    issue(`Potential private or raw regional files are public under data/: ${suspiciousRegionalFiles.join(', ')}`);
  }
}
if (admin2Manifest) {
  if (admin2Manifest.schemaVersion !== 1 || !isIsoTimestamp(admin2Manifest.generatedAt)) {
    issue('Admin-2 manifest must use schema version 1 and a valid generatedAt timestamp');
  }
  const totals = admin2Manifest.totals || {};
  for (const [field, expected] of Object.entries({
    countries: 3,
    parents: EXPECTED_ADMIN2_PARENTS,
    subdivisions: EXPECTED_ADMIN2_SUBDIVISIONS,
    coordinatePositionCount: EXPECTED_ADMIN2_COORDINATE_POSITIONS
  })) {
    if (totals[field] !== expected) issue(`Admin-2 manifest total ${field} must be ${expected}`);
  }
  if (totals.geometryFingerprint !== EXPECTED_ADMIN2_GEOMETRY_FINGERPRINT
    || totals.recordFingerprint !== EXPECTED_ADMIN2_RECORD_FINGERPRINT) {
    issue('Admin-2 manifest fingerprints do not match the approved U.S./China/Australia boundary snapshot');
  }
  const countries = admin2Manifest.countries || {};
  const usa = countries.USA || {};
  const china = countries.CHN || {};
  const australia = countries.AUS || {};
  if (usa.source?.provider !== 'U.S. Census Bureau'
    || usa.source?.sourceYear !== 2025
    || usa.source?.official !== true
    || usa.source?.license !== 'Public domain'
    || usa.source?.sourceFiles?.archiveName !== 'cb_2025_us_county_5m.zip'
    || usa.source?.sourceFiles?.archiveSha256 !== '19f80cd87ad2e51146b8a7de496428c950e57f725b4eb74674efcb5059fa4678'
    || usa.source?.sourceFiles?.extractedMember !== 'cb_2025_us_county_5m.kml'
    || usa.source?.sourceFiles?.kmlSha256 !== '70a64577c9f41bd9281c19458a6c5d39918292ad91e7850057d3ee752f7408dd') {
    issue('U.S. Admin-2 provenance must identify the official Census 2025 1:5m public-domain snapshot');
  }
  if (china.source?.sourceYear !== 2020
    || china.source?.official !== false
    || !String(china.source?.license || '').includes('CC BY 3.0 IGO')
    || china.source?.sourceFiles?.shpSha256 !== 'acb0881183eea5db5cf19597367eefd188b948d3d38962b3cc041656dbdb7dcd'
    || china.source?.sourceFiles?.dbfSha256 !== '6fda17135a6b5651d8321b30f867ca8643ddd2b8024eae15d23f24c7ab27ad33'
    || !String(china.source?.status || '').toLowerCase().includes('unofficial')) {
    issue('China Admin-2 provenance must retain the OCHA source hashes, CC BY 3.0 IGO license, and unofficial-source disclosure');
  }
  if (australia.source?.provider !== 'Australian Bureau of Statistics (ABS)'
    || australia.source?.sourceYear !== 2025
    || australia.source?.official !== true
    || !String(australia.source?.license || '').includes('CC BY 4.0')
    || australia.source?.sourceFiles?.serviceLayer !== 'ASGS2025/LGA/FeatureServer/1 — LGA_GEN'
    || australia.source?.sourceFiles?.geojsonSha256 !== '0a6f910d0190b52e38b3c7c90d9a2e1695cac231dcabc4395e6625a2be9aa339'
    || australia.source?.sourceFiles?.maxAllowableOffsetDegrees !== 0.001
    || australia.source?.sourceFiles?.geometryPrecisionDecimals !== 6
    || !String(australia.source?.filter || '').includes('545 spatial LGA')) {
    issue('Australia deeper-boundary provenance must identify the official ABS 2025 LGA_GEN snapshot, display generalization, CC BY 4.0 license, and spatial-record filter');
  }
  const countryExpectations = [
    ['USA', usa, 51, 3144, 'usa'],
    ['CHN', china, 31, 358, 'chn'],
    ['AUS', australia, 8, 545, 'aus']
  ];
  const referencedFiles = new Set();
  const codes = new Set();
  let computedParents = 0;
  let computedSubdivisions = 0;
  let computedCoordinatePositions = 0;
  for (const [countryCode, country, expectedParents, expectedSubdivisions, directory] of countryExpectations) {
    const parents = Object.entries(country.parents || {}).sort(([left], [right]) => left.localeCompare(right));
    if (parents.length !== expectedParents) issue(`${countryCode} Admin-2 parent count must be ${expectedParents}`);
    if (country.totals?.parents !== expectedParents || country.totals?.subdivisions !== expectedSubdivisions) {
      issue(`${countryCode} Admin-2 country totals are incorrect`);
    }
    let countrySubdivisions = 0;
    let countryCoordinatePositions = 0;
    for (const [parentCode, entry] of parents) {
      computedParents += 1;
      if (!Number.isFinite(entry.longitudeSpan) || entry.longitudeSpan <= 0 || entry.longitudeSpan > 180) {
        issue(`${parentCode} Admin-2 longitude span must be a finite antimeridian-aware value`);
      }
      if (parentCode === 'US-AK' && (entry.longitudeSpan < 50 || entry.longitudeSpan > 70)) {
        issue('US-AK Admin-2 longitude span must fit Alaska across the antimeridian without treating it as world-wide');
      }
      const relativePath = String(entry.path || '').replace(/^\//, '');
      if (!new RegExp(`^data/admin2/${directory}/[a-z0-9-]+\\.geojson$`).test(relativePath)) {
        issue(`${parentCode} Admin-2 shard path is invalid: ${entry.path}`);
        continue;
      }
      referencedFiles.add(relativePath);
      const shardText = readFile(relativePath, `${parentCode} Admin-2 shard`);
      const shard = parseJson(shardText, `${parentCode} Admin-2 shard`);
      if (!shard) continue;
      if (sha256(shardText) !== entry.sha256) issue(`${parentCode} Admin-2 shard checksum does not match its manifest entry`);
      const features = Array.isArray(shard.features) ? shard.features : [];
      if (shard.type !== 'FeatureCollection' || shard.adm0A3 !== countryCode || shard.parentCode !== parentCode) {
        issue(`${parentCode} Admin-2 shard metadata is invalid`);
      }
      if (features.length !== entry.featureCount) issue(`${parentCode} Admin-2 feature count does not match its manifest entry`);
      let shardCoordinatePositions = 0;
      for (const feature of features) {
        const properties = feature.properties || {};
        const code = String(properties.code || '');
        if (!code || codes.has(code)) issue(`Admin-2 feature code is missing or duplicated: ${code || '(empty)'}`);
        codes.add(code);
        if (properties.parentCode !== parentCode || !properties.name || !properties.label || !properties.type) {
          issue(`${parentCode} Admin-2 feature is missing canonical public metadata`);
        }
        for (const forbidden of ['signals', 'rank', 'share', 'activity', 'visitors']) {
          if (Object.hasOwn(properties, forbidden)) issue(`${parentCode} Admin-2 feature must not publish inferred ${forbidden}`);
        }
        shardCoordinatePositions += countCoordinatePositions(feature.geometry?.coordinates);
      }
      if (shardCoordinatePositions !== entry.coordinatePositionCount) {
        issue(`${parentCode} Admin-2 coordinate count does not match its manifest entry`);
      }
      countrySubdivisions += features.length;
      countryCoordinatePositions += shardCoordinatePositions;
    }
    if (countrySubdivisions !== expectedSubdivisions
      || countryCoordinatePositions !== country.totals?.coordinatePositionCount) {
      issue(`${countryCode} Admin-2 computed totals do not match the manifest`);
    }
    computedSubdivisions += countrySubdivisions;
    computedCoordinatePositions += countryCoordinatePositions;
  }
  if (computedParents !== EXPECTED_ADMIN2_PARENTS
    || computedSubdivisions !== EXPECTED_ADMIN2_SUBDIVISIONS
    || computedCoordinatePositions !== EXPECTED_ADMIN2_COORDINATE_POSITIONS) {
    issue('Computed Admin-2 totals do not match the approved snapshot');
  }
  const actualAdmin2Files = ['usa', 'chn', 'aus'].flatMap(directory => {
    const absoluteDirectory = path.join(ROOT, 'data', 'admin2', directory);
    return fs.existsSync(absoluteDirectory)
      ? fs.readdirSync(absoluteDirectory)
        .filter(filename => filename.endsWith('.geojson'))
        .map(filename => `data/admin2/${directory}/${filename}`)
      : [];
  });
  for (const filename of actualAdmin2Files) {
    if (!referencedFiles.has(filename)) issue(`Unreferenced Admin-2 shard is public: ${filename}`);
  }
  for (const filename of referencedFiles) {
    if (!actualAdmin2Files.includes(filename)) issue(`Admin-2 manifest references a missing shard: ${filename}`);
  }
}

if (admin2Manifest) {
  const californiaPath = String(admin2Manifest.countries?.USA?.parents?.['US-CA']?.path || '').replace(/^\//, '');
  const california = parseJson(readFile(californiaPath, 'California county boundaries'), 'California county boundaries');
  const californiaCodes = new Set((california?.features || []).map(feature => String(feature.properties?.code || '')));
  for (const snapshot of admin2ModelActivitySnapshots) {
    const activity = snapshot.data;
    if (!activity) continue;
    if (activity.schemaVersion !== 1 || activity.period?.key !== snapshot.period || activity.publishThreshold !== 5) {
      issue(`${snapshot.period} Admin-2 model activity has invalid schema, period, or privacy threshold`);
      continue;
    }
    const parent = activity.parents?.['US-CA'];
    const subdivisions = Array.isArray(parent?.subdivisions) ? parent.subdivisions : [];
    if (!parent || parent.totals?.subdivisions !== 58
      || parent.totals?.withModelSignal !== snapshot.modelCount
      || parent.totals?.withInstallModelAttribution !== snapshot.installCount
      || subdivisions.length !== snapshot.modelCount) {
      issue(`${snapshot.period} California county model totals do not match the approved snapshot`);
    }
    const seenCodes = new Set();
    for (const subdivision of subdivisions) {
      if (!californiaCodes.has(subdivision.code) || seenCodes.has(subdivision.code)) {
        issue(`${snapshot.period} Admin-2 model activity has an unknown or duplicate county code: ${subdivision.code}`);
      }
      seenCodes.add(subdivision.code);
      for (const scopeName of ['modelInterest', 'installIntent']) {
        const scope = subdivision[scopeName];
        if (!scope) continue;
        if (scope.observed !== true || !Array.isArray(scope.mapLeaders) || scope.mapLeaders.length < 1) {
          issue(`${snapshot.period} ${subdivision.code} ${scopeName} must expose its own observed map leader`);
        }
        if (scope.visitors !== null && (!Number.isInteger(scope.visitors) || scope.visitors < activity.publishThreshold)) {
          issue(`${snapshot.period} ${subdivision.code} ${scopeName} exposes an exact count below the privacy threshold`);
        }
        for (const brand of scope.brands || []) {
          if (!Number.isInteger(brand.visitors) || brand.visitors < activity.publishThreshold) {
            issue(`${snapshot.period} ${subdivision.code} exposes a brand below the privacy threshold`);
          }
          for (const model of brand.models || []) {
            if (!Number.isInteger(model.visitors) || model.visitors < activity.publishThreshold) {
              issue(`${snapshot.period} ${subdivision.code} exposes a model below the privacy threshold`);
            }
          }
        }
      }
    }
    const serialized = JSON.stringify(activity).toLowerCase();
    for (const forbidden of ['visitorid', 'visitor_id', 'ipaddress', 'ip_address', 'deviceid', 'device_id']) {
      if (serialized.includes(forbidden)) issue(`${snapshot.period} Admin-2 model activity must not expose ${forbidden}`);
    }
  }
}

if (usGeojson) {
  if (usGeojson.type !== 'FeatureCollection' || !Array.isArray(usGeojson.features) || usGeojson.features.length !== 51) {
    issue('U.S. state GeoJSON must contain the 50 states plus District of Columbia');
  }
  const stateNames = new Set(usGeojson.features.map(feature => feature.properties?.NAME));
  for (const name of ['California', 'Texas', 'New York', 'District of Columbia']) {
    if (!stateNames.has(name)) issue(`U.S. state GeoJSON is missing ${name}`);
  }
}

if (sitemapCore !== null && countOccurrences(sitemapCore, `<loc>${CANONICAL_URL}</loc>`) !== 1) {
  issue('Core sitemap must contain the canonical activity-index URL exactly once');
}
if (sitemapIndex !== null && !sitemapIndex.includes('<loc>https://localclaw.io/sitemap-core.xml</loc>')) {
  issue('Sitemap index must include sitemap-core.xml');
}
if (sitemapGenerator !== null) {
  if (!sitemapGenerator.includes("page('local-ai-activity-index.html'")) {
    issue('Sitemap generator is missing the activity-index page');
  }
  if (!sitemapGenerator.includes("'data/local-ai-activity-index.json'")) {
    issue('Sitemap generator does not track the activity-index dataset date');
  }
}

const redirects = readFile('_redirects', 'Cloudflare redirects');
if (html !== null) {
  for (const marker of [
    'data-atlas-share-open',
    'data-atlas-share-overlay',
    'data-atlas-share-copy',
    'data-atlas-share-download',
    'LOCALCLAW.IO/ATLAS'
  ]) {
    if (!html.includes(marker)) issue(`Atlas Share Mode markup is missing ${marker}`);
  }
}
if (app !== null) {
  for (const marker of [
    'function currentShareUrl()',
    'function buildShareImage()',
    'function applyRequestedView()',
    "atlas_share_mode_open",
    "atlas_share_link_copy",
    "atlas_share_image_download",
    'preserveDrawingBuffer: false'
  ]) {
    if (!app.includes(marker)) issue(`Atlas Share Mode behavior is missing ${marker}`);
  }
  const shareUrlBody = topLevelFunctionBody(app, 'currentShareUrl');
  if (!shareUrlBody.includes("ACTIVE_VIEW === 'models'")
    || !shareUrlBody.includes("url.searchParams.set('view', 'models')")
    || !shareUrlBody.includes("url.searchParams.set('range', ACTIVE_PERIOD)")
    || !shareUrlBody.includes("url.searchParams.set('country', state.selectedModelCountry.name)")
    || !shareUrlBody.includes("url.searchParams.set('brand', state.selectedModelBrand)")
    || shareUrlBody.includes("url.searchParams.set('family'")) {
    issue('Models Share Mode must preserve view=models, range, country and the canonical brand query parameter');
  }
  if (!shareUrlBody.includes("ACTIVE_VIEW === 'installed'")
    || !shareUrlBody.includes("url.searchParams.set('view', 'installed')")
    || !shareUrlBody.includes("isInstallIntentView() && (state.selectedInstallCountry || state.selectedInstallModel)")
    || !shareUrlBody.includes("url.searchParams.set('country', state.selectedInstallCountry.name)")
    || !shareUrlBody.includes("url.searchParams.set('model', state.selectedInstallModel)")
    || !shareUrlBody.includes("state.scope === 'us'")
    || !shareUrlBody.includes("url.searchParams.set('region', locked.name)")) {
    issue('Install paths Share Mode must preserve view=installed, range, model and regional state without overriding regional drill-downs');
  }
  const requestedViewBody = topLevelFunctionBody(app, 'applyRequestedView');
  if (!app.includes("brand: requestParams.get('brand')")
    || !requestedViewBody.includes('focusModelCountry(country, requestedView.brand, { exploreRegions: false })')
    || !requestedViewBody.includes('await enterModelRegionExplorer(country)')) {
    issue('Shared Models URLs must restore their selected country and brand');
  }
  if (!app.includes("model: requestParams.get('model')")
    || !requestedViewBody.includes('focusInstallCountry(country, requestedView.model, { exploreRegions: false })')
    || !requestedViewBody.includes('await enterInstallRegionExplorer(country, requestedView.model)')
    || !requestedViewBody.includes('showGlobalInstallPanel(requestedView.model)')
    || !requestedViewBody.includes('isInstallIntentView()')) {
    issue('Shared Install paths URLs must restore valid worldwide or country model state');
  }
  const focusInstallCountryBody = topLevelFunctionBody(app, 'focusInstallCountry');
  if (!focusInstallCountryBody.includes('installModelsForCountry(country)')
    || !focusInstallCountryBody.includes('installModelIdentifier(model) === String(requestedModelId')
    || !focusInstallCountryBody.includes('state.selectedInstallModel = selectedModel ? installModelIdentifier(selectedModel) : null')) {
    issue('Invalid or stale Install paths model deep links must fall back to the country overview');
  }
  const focusModelCountryBody = topLevelFunctionBody(app, 'focusModelCountry');
  if (!focusModelCountryBody.includes('modelBrandsForCountry(country)')
    || !focusModelCountryBody.includes('brandIdentifier(brand) === String(requestedBrandId')
    || !focusModelCountryBody.includes('state.selectedModelBrand = requestedBrand ? brandIdentifier(requestedBrand) : null')) {
    issue('Invalid or stale Models brand deep links must fall back to the country overview');
  }
  if (!focusModelCountryBody.includes('void enterModelRegionExplorer(country)')
    || !focusInstallCountryBody.includes('void enterInstallRegionExplorer(country, state.selectedInstallModel)')
    || !app.includes("entry.kind !== 'installStack'")
    || !app.includes('leadingInstallPath(country)')
    || !app.includes('function syncInstallUrl()')
    || !app.includes("if (isInstallIntentView()) syncInstallUrl()")
    || !app.includes('/^(?:US|CN|AU)-[A-Z0-9]{2,3}$/')) {
    issue('Models and Install paths country selections must automatically open regional detail and keep the leading install-path logo on the map');
  }
  const shareSnapshotBody = topLevelFunctionBody(app, 'shareSnapshot');
  if (!shareSnapshotBody.includes('const leaders = coLeadingModelBrands(country)')
    || !shareSnapshotBody.includes('const isLeader = leaders.includes(brand)')
    || !shareSnapshotBody.includes("brand.label + ' model-page interest in ' + country.name")) {
    issue('Models share cards must distinguish leaders, co-leaders and non-leading selected brands');
  }
  if (!shareSnapshotBody.includes("isInstallIntentView() && state.scope === 'world'")
    || !shareSnapshotBody.includes('selectedModel || (country ? models[0] : null)')
    || !shareSnapshotBody.includes('const coverage = installCoverageCopy()')) {
    issue('Install paths share cards must keep the unselected world total global and disclose partial tracking coverage');
  }
}
if (app !== null) {
  for (const marker of [
    'const MOBILE_DPR_MAX = 1.5',
    'function scheduleResize()',
    'function consumeTouchPointer(event)',
    'function captureCanvasPointer(pointerId)',
    'function resetPointerGesture()',
    'MOBILE_ACTIVE_FPS',
    'MOBILE_IDLE_FPS',
    'const regionalMobile = mobile && state.scope !== \'world\'',
    'regionalMobile ? 0.28 : 0.48',
    'regionalMobile ? -1.12 : -1.48'
  ]) {
    if (!app.includes(marker)) issue(`Atlas mobile stabilization is missing ${marker}`);
  }
}
if (css !== null && !/#atlas-globe\s*\{[^}]*touch-action:\s*none/s.test(css)) {
  issue('Atlas mobile canvas must reserve touch gestures for stable map interaction');
}
if (css !== null && !/@media\s*\(max-width:\s*760px\)[\s\S]*?\.atlas-map-label__button\s*\{[^}]*pointer-events:\s*none/s.test(css)) {
  issue('Atlas mobile city labels must not intercept globe drag gestures');
}
if (css !== null && !/@media\s*\(max-width:\s*760px\)[\s\S]*?\.atlas-scope-us \.atlas-copy\s*\{[^}]*visibility:\s*hidden/s.test(css)) {
  issue('Atlas mobile regional views must hide the large desktop copy so the globe remains visible');
}
if (css !== null && (!/@media\s*\(max-width:\s*760px\)[\s\S]*?\.atlas-model-panel\s*\{[^}]*bottom:\s*max\(10px,\s*env\(safe-area-inset-bottom\)\)[^}]*max-height:\s*min\(52svh,\s*480px\)[^}]*touch-action:\s*pan-y/s.test(css)
  || !css.includes('.atlas-stage.atlas-model-panel-open .atlas-controls')
  || !css.includes('.atlas-stage.atlas-model-panel-open .atlas-periods')
  || !css.includes('.atlas-stage.atlas-model-panel-open .atlas-navigation')
  || !css.includes('.atlas-stage.atlas-model-panel-open .atlas-status'))) {
  issue('Atlas mobile Models sheet must respect the iPhone safe area, remain scrollable, and hide overlapping controls while open');
}
if (css !== null && (!/@media\s*\(max-width:\s*760px\)[\s\S]*?\.atlas-install-panel\s*\{[^}]*bottom:\s*max\(10px,\s*env\(safe-area-inset-bottom\)\)[^}]*max-height:\s*min\(52svh,\s*480px\)[^}]*touch-action:\s*pan-y/s.test(css)
  || !css.includes('.atlas-stage.atlas-install-panel-open .atlas-controls')
  || !css.includes('.atlas-stage.atlas-install-panel-open .atlas-periods')
  || !css.includes('.atlas-stage.atlas-install-panel-open .atlas-navigation')
  || !css.includes('.atlas-stage.atlas-install-panel-open .atlas-status'))) {
  issue('Atlas mobile Install paths sheet must respect the iPhone safe area, remain scrollable, and hide overlapping controls while open');
}
if (css !== null) {
  for (const marker of ['.atlas-share-trigger', '.atlas-share-overlay', '.atlas-share-card', '.atlas-share-toolbar', '.atlas-is-sharing']) {
    if (!css.includes(marker)) issue(`Atlas Share Mode styling is missing ${marker}`);
  }
}
if (redirects !== null && !/^\/atlas\s+\/local-ai-activity-index\s+301$/m.test(redirects)) {
  issue('Atlas Share Mode short URL must redirect /atlas to the canonical Atlas route');
}

if (errors.length) {
  console.error(`Local AI Activity Index validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Local AI Activity Index validation passed: 242 lazy Natural Earth Admin-1 shards with 4,558 subdivisions, 90 lazy U.S./China/Australia deeper-boundary shards with 4,047 neutral subdivisions, exact provenance and fingerprints, 61 privacy-thresholded regional country records with 94 public rows, vector-only detail, 3,337 observed country signals, 90 exact GeoNames city clusters, and 4096×2048 base textures verified.');
