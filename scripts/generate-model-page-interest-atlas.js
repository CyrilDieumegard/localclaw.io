const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const THRESHOLD = 5;
const WINDOWS = ['30d', '90d', '180d'];
const GENERIC_LOGO_BRANDS = new Set(['github', 'huggingface']);
const LABELS = {
  '30d': 'Last 30 days',
  '90d': 'Last 3 months',
  '180d': 'Last 6 months'
};

function brandLabel(brand) {
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
  if (overrides[brand]) return overrides[brand];
  return String(brand)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function loadCatalogue() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8')};this.APP_DATA=APP_DATA;`, context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-avatar-formats-20260814a.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-logos-20260814c.js'), 'utf8'), context);

  const unavailable = new Set(Object.keys(context.APP_DATA.hfRepoVerification?.unavailable || {}));
  const grouped = new Map();
  for (const model of context.APP_DATA.models || []) {
    if (!model?.id || model.hosted_only || unavailable.has(model.id)) continue;
    const rows = grouped.get(model.id) || [];
    rows.push(model);
    grouped.set(model.id, rows);
  }

  const logos = context.window.HOME_INDEX_LOGOS?.llm || {};
  const formats = context.window.HOME_INDEX_AVATAR_FORMATS || {};
  const registry = new Map();
  const ambiguousIds = [];

  for (const [id, rows] of grouped) {
    const families = new Set(rows.map((row) => String(row.family || '').trim()).filter(Boolean));
    if (families.size !== 1) {
      ambiguousIds.push(id);
      continue;
    }
    const model = rows.at(-1);
    const family = [...families][0];
    const asset = logos[family];
    if (!asset) throw new Error(`Missing canonical LLM logo mapping for family: ${family}`);
    const extension = formats[asset] || 'svg';
    const logo = `/images/model-logos/${asset}.${extension}`;
    if (!fs.existsSync(path.join(ROOT, logo.slice(1)))) throw new Error(`Missing canonical LLM logo asset: ${logo}`);
    const brand = asset
      .replace(/-official-color$/, '')
      .replace(/-inverted$/, '')
      .replace(/-avatar$/, '');
    registry.set(id, {
      id,
      name: String(model.name || id),
      family,
      brand,
      brandLabel: brandLabel(brand),
      brandPublishable: !GENERIC_LOGO_BRANDS.has(brand),
      logo,
      path: `/models/${id}`
    });
  }

  const brands = new Map();
  for (const model of registry.values()) {
    if (!model.brandPublishable) continue;
    const existing = brands.get(model.brand);
    if (existing && (existing.logo !== model.logo || existing.label !== model.brandLabel)) {
      throw new Error(`Inconsistent canonical mapping for brand: ${model.brand}`);
    }
    brands.set(model.brand, { id: model.brand, label: model.brandLabel, logo: model.logo });
  }

  return { registry, brands, ambiguousIds };
}

function integer(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`Invalid ${label}: ${value}`);
  return parsed;
}

function text(value, label) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`Missing ${label}`);
  return normalized;
}

function assertUnique(rows, keyFor, label) {
  const seen = new Set();
  for (const row of rows) {
    const key = keyFor(row);
    if (seen.has(key)) throw new Error(`Duplicate ${label}: ${key}`);
    seen.add(key);
  }
}

function suffixFor(key) {
  return key === '30d' ? '' : `-${key}`;
}

function periodDays(start, end) {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    throw new Error(`Invalid period: ${start} to ${end}`);
  }
  return Math.round((endMs - startMs) / 86400000) + 1;
}

function assertAtlasWindow(key, start, end) {
  const atlasPath = path.join(ROOT, 'data', `local-ai-activity-index${suffixFor(key)}.json`);
  const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
  if (atlas.period?.start !== start || atlas.period?.end !== end) {
    throw new Error(`${key}: model-interest window must match ${path.basename(atlasPath)}`);
  }
}

function buildInterest(source, label, catalogue, modelVisitors) {
  const modelRows = Array.isArray(source?.models) ? source.models : [];
  const brandRows = Array.isArray(source?.brands) ? source.brands : [];
  assertUnique(modelRows, (row) => text(row.model, `${label} model id`), `${label} model`);
  assertUnique(brandRows, (row) => text(row.brand, `${label} brand id`), `${label} brand`);

  const modelsByBrand = new Map();
  for (const row of modelRows) {
    const modelId = text(row.model, `${label} model id`);
    const model = catalogue.registry.get(modelId);
    if (!model) {
      const reason = catalogue.ambiguousIds.includes(modelId)
        ? 'ambiguous duplicate catalogue id'
        : 'missing canonical catalogue record';
      throw new Error(`${label}/${modelId}: ${reason}`);
    }
    if (text(row.path, `${label}/${modelId} path`) !== model.path) {
      throw new Error(`${label}/${modelId}: path must be ${model.path}`);
    }
    const visitors = integer(row.visitors, `${label}/${modelId} visitors`);
    if (visitors < THRESHOLD || !model.brandPublishable) continue;
    const models = modelsByBrand.get(model.brand) || [];
    models.push({
      id: model.id,
      label: model.name,
      family: model.family,
      path: model.path,
      visitors
    });
    modelsByBrand.set(model.brand, models);
  }

  const brands = [];
  for (const row of brandRows) {
    const brandId = text(row.brand, `${label} brand id`);
    if (GENERIC_LOGO_BRANDS.has(brandId)) {
      throw new Error(`${label}/${brandId}: generic platform logo cannot be published as a model brand`);
    }
    const canonical = catalogue.brands.get(brandId);
    if (!canonical) throw new Error(`${label}/${brandId}: missing canonical brand/logo mapping`);
    const visitors = integer(row.visitors, `${label}/${brandId} visitors`);
    if (visitors < THRESHOLD) continue;
    if (visitors > modelVisitors) {
      throw new Error(`${label}/${brandId}: brand visitors exceed the all-model de-duplicated total`);
    }
    const models = modelsByBrand.get(brandId) || [];
    models.sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label));
    models.forEach((model, index) => { model.rank = index + 1; });
    if (models.some((model) => model.visitors > visitors)) {
      throw new Error(`${label}/${brandId}: brand visitors cannot be lower than a child model`);
    }
    brands.push({
      id: canonical.id,
      label: canonical.label,
      logo: canonical.logo,
      visitors,
      models,
      modelsStatus: models.length ? 'published' : 'withheld_below_threshold'
    });
  }

  const publishedBrandIds = new Set(brands.map((brand) => brand.id));
  for (const brandId of modelsByBrand.keys()) {
    if (!publishedBrandIds.has(brandId)) {
      throw new Error(`${label}/${brandId}: public model row is missing its independently de-duplicated brand total`);
    }
  }

  brands.sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label));
  brands.forEach((brand, index) => { brand.rank = index + 1; });
  const leaderVisitors = brands[0]?.visitors;
  const dominantBrands = brands
    .filter((brand) => brand.visitors === leaderVisitors)
    .map((brand) => brand.id);
  return { brands, dominantBrands };
}

function buildPeriod(raw, key, catalogue) {
  const source = raw.periods?.[key];
  if (!source) throw new Error(`Missing raw period: ${key}`);
  const start = text(source.start, `${key}.start`);
  const end = text(source.end, `${key}.end`);
  assertAtlasWindow(key, start, end);

  const countries = Array.isArray(source.countries) ? source.countries : [];
  assertUnique(countries, (row) => text(row.name, 'country name'), `${key} country`);
  const publishedCountries = [];
  let publishedBrandCells = 0;
  let publishedModelCells = 0;

  for (const countrySource of countries) {
    const countryName = text(countrySource.name, `${key} country name`);
    const modelVisitors = integer(countrySource.modelVisitors, `${key}/${countryName} modelVisitors`);
    const modelInterest = buildInterest(countrySource, `${key}/${countryName}`, catalogue, modelVisitors);
    if (!modelInterest.brands.length) continue;
    if (modelVisitors < THRESHOLD) throw new Error(`${key}/${countryName}: published country is below threshold`);
    publishedBrandCells += modelInterest.brands.length;
    publishedModelCells += modelInterest.brands.reduce((sum, brand) => sum + brand.models.length, 0);
    publishedCountries.push({
      name: countryName,
      signals: modelVisitors,
      modelVisitors,
      modelInterest
    });
  }

  publishedCountries.sort((left, right) => right.modelVisitors - left.modelVisitors || left.name.localeCompare(right.name));
  publishedCountries.forEach((country, index) => { country.rank = index + 1; });

  const globalModelVisitors = integer(source.global?.modelVisitors, `${key}.global.modelVisitors`);
  const globalInterest = buildInterest(source.global, `${key}/global`, catalogue, globalModelVisitors);
  if (!globalInterest.brands.length) throw new Error(`${key}: missing publishable global model brands`);

  return {
    schemaVersion: 1,
    indexName: 'Local AI Activity Index',
    view: 'model-page-interest',
    status: 'beta',
    source: 'Aggregated anonymous LocalClaw model-page traffic measured by DataFast',
    sourceUrl: 'https://localclaw.io/local-ai-activity-index#methodology',
    metric: 'unique visitors to canonical LocalClaw /models/ pages',
    publishThreshold: THRESHOLD,
    claimBoundary: 'Model-page interest only. A page visit is not verified model use and does not prove a download, installation, launch, or inference.',
    timezone: raw.timezone || 'Europe/Zurich',
    period: { start, end, label: LABELS[key], key, days: periodDays(start, end) },
    generatedAt: text(raw.generatedAt, 'generatedAt'),
    methodology: {
      provider: 'DataFast',
      dimension: 'hostname + country + exact canonical model paths',
      hostnameFilter: 'localclaw.io',
      countryFilter: 'DataFast country name',
      modelPathRule: 'Exact allow-list match to /models/${APP_DATA.models[].id} for non-hosted models whose Hugging Face repository is not marked unavailable.',
      modelVisitorAggregation: 'DataFast analytics overview filtered to the union of all eligible canonical LLM paths; page rows are never summed to derive modelVisitors.',
      brandAggregation: 'Models sharing the same canonical LocalClaw logo are grouped as one brand. Brand visitors come from DataFast analytics overview filtered to every eligible canonical path in that brand; child model rows are never summed.',
      publicationRule: 'A brand is published at five de-duplicated visitors even when no individual model page reaches five. Individual models are independently published only at five visitors.',
      genericLogoRule: 'Generic hosting-platform logo groups github and huggingface are fail-closed and never published as model brands. Dedicated organizations such as Hugging Face H4 and Hugging Face TB remain eligible when their canonical logo mapping is distinct.',
      sourceConsistencyRule: 'A global brand is omitted fail-closed for a window when a child page row exceeds its independently de-duplicated DataFast overview total. Country aggregates remain independently sourced and the diagnostic reports each omitted global scope. No value is altered, estimated, or backfilled.',
      rankingRule: 'Countries rank by all-model unique visitors. dominantBrands lists every co-leading most-explored published brand ID.',
      geographyNote: 'Country is an approximate network location reported by DataFast, not verified residence or nationality.',
      privacyNote: 'Only country-brand and country-model aggregates meeting the five-visitor threshold are published. No visitor, device, IP address, city, or below-threshold row is included.',
      caveat: 'Results measure LocalClaw page interest and can be affected by search demand, page age, referrals, and catalogue availability.'
    },
    totals: {
      signals: globalModelVisitors,
      modelVisitors: globalModelVisitors,
      regions: publishedCountries.length,
      countriesWithPublishedBrands: publishedCountries.length,
      observedCountries: integer(source.observedCountries, `${key}.observedCountries`),
      collectedCountries: integer(source.collectedCountries, `${key}.collectedCountries`),
      publishedBrandCells,
      publishedModelCells
    },
    diagnostics: {
      omittedProviderInconsistentBrandScopes: integer(
        source.omittedProviderInconsistentBrandScopes || 0,
        `${key}.omittedProviderInconsistentBrandScopes`
      )
    },
    modelInterest: {
      global: {
        signals: globalModelVisitors,
        modelVisitors: globalModelVisitors,
        ...globalInterest
      }
    },
    countries: publishedCountries
  };
}

const catalogue = loadCatalogue();
if (process.argv.includes('--dump-registry')) {
  process.stdout.write(`${JSON.stringify({
    models: [...catalogue.registry.values()],
    brands: [...catalogue.brands.values()],
    ambiguousIds: catalogue.ambiguousIds,
    excludedGenericLogoBrands: [...GENERIC_LOGO_BRANDS]
  }, null, 2)}\n`);
} else {
  const rawPath = process.argv[2];
  if (!rawPath) {
    throw new Error('Usage: node scripts/generate-model-page-interest-atlas.js /absolute/path/to/private-datafast-model-page-interest.json');
  }
  const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'));
  if (integer(raw.schemaVersion, 'raw schemaVersion') < 2) throw new Error('Raw model-page-interest schemaVersion must be at least 2');
  for (const key of WINDOWS) {
    const payload = buildPeriod(raw, key, catalogue);
    fs.writeFileSync(path.join(ROOT, 'data', `local-ai-model-page-interest${suffixFor(key)}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  }
  console.log('Generated 30D, 3M and 6M public model-page-interest Atlas datasets.');
}
