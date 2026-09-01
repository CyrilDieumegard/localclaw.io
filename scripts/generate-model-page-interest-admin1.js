const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const THRESHOLD = 5;
const WINDOWS = ['30d', '90d', '180d'];
const GENERIC_LOGO_BRANDS = new Set(['github', 'huggingface']);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function suffixFor(key) {
  return key === '30d' ? '' : `-${key}`;
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

function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function assertUnique(rows, keyFor, label) {
  const seen = new Set();
  for (const row of rows) {
    const key = keyFor(row);
    if (seen.has(key)) throw new Error(`Duplicate ${label}: ${key}`);
    seen.add(key);
  }
}

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
  return String(brand).split('-').filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
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
  const ambiguousIds = new Set();
  for (const [id, rows] of grouped) {
    const families = new Set(rows.map(row => String(row.family || '').trim()).filter(Boolean));
    if (families.size !== 1) {
      ambiguousIds.add(id);
      continue;
    }
    const model = rows.at(-1);
    const family = [...families][0];
    const asset = logos[family];
    if (!asset) throw new Error(`Missing canonical LLM logo mapping for family: ${family}`);
    const extension = formats[asset] || 'svg';
    const logo = `/images/model-logos/${asset}.${extension}`;
    if (!fs.existsSync(path.join(ROOT, logo.slice(1)))) throw new Error(`Missing canonical LLM logo asset: ${logo}`);
    const brand = asset.replace(/-official-color$/, '').replace(/-inverted$/, '').replace(/-avatar$/, '');
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

function rawRows(source, preferred, aliases) {
  for (const key of [preferred, ...aliases]) {
    if (Array.isArray(source?.[key])) return source[key];
  }
  return [];
}

function rowRegion(row, label) {
  return text(row?.region ?? row?.sourceName ?? row?.name, `${label} region`);
}

function buildReference(key) {
  const suffix = suffixFor(key);
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `local-ai-activity-index${suffix}.json`), 'utf8'));
  const admin1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `local-ai-admin1-activity${suffix}.json`), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'admin1', 'manifest.json'), 'utf8'));
  const references = new Map();

  for (const [countryName, country] of Object.entries(admin1.countries || {})) {
    const regions = new Map();
    const canonicalCandidates = new Map();
    for (const region of country.regions || []) {
      const record = {
        sourceName: region.sourceName,
        canonicalName: region.canonicalName,
        boundaryMatch: region.boundaryMatch,
        boundaryFeatureIds: [...region.boundaryFeatureIds].sort()
      };
      const sourceKey = normalize(region.sourceName);
      if (regions.has(sourceKey)) throw new Error(`${key}/${countryName}: duplicate Interest Admin-1 source name ${region.sourceName}`);
      regions.set(sourceKey, record);
      const canonicalKey = normalize(region.canonicalName);
      const candidates = canonicalCandidates.get(canonicalKey) || [];
      candidates.push(record);
      canonicalCandidates.set(canonicalKey, candidates);
    }
    for (const [canonicalKey, candidates] of canonicalCandidates) {
      if (candidates.length === 1 && !regions.has(canonicalKey)) regions.set(canonicalKey, candidates[0]);
    }
    const manifestEntry = manifest.countries?.[country.adm0A3];
    if (!manifestEntry) throw new Error(`${key}/${countryName}: missing Admin-1 boundary manifest entry`);
    const boundaryFeatures = JSON.parse(fs.readFileSync(path.join(ROOT, manifestEntry.path.replace(/^\//, '')), 'utf8')).features || [];
    const exactCandidates = new Map();
    for (const feature of boundaryFeatures) {
      const properties = feature.properties || {};
      const record = {
        sourceName: properties.name || properties.name_en,
        canonicalName: properties.name_en || properties.name,
        boundaryMatch: 'exact',
        boundaryFeatureIds: [properties.adm1_code]
      };
      const names = [properties.name, properties.name_en, ...String(properties.name_local || '').split('|')];
      for (const name of names) {
        const normalizedName = normalize(name);
        if (!normalizedName) continue;
        const candidates = exactCandidates.get(normalizedName) || [];
        candidates.push(record);
        exactCandidates.set(normalizedName, candidates);
      }
    }
    for (const [nameKey, candidates] of exactCandidates) {
      if (candidates.length === 1 && !regions.has(nameKey)) regions.set(nameKey, candidates[0]);
    }
    references.set(countryName, {
      countryCode: country.countryCode,
      adm0A3: country.adm0A3,
      regions
    });
  }

  const usaManifest = manifest.countries?.USA;
  if (!usaManifest) throw new Error('Missing USA Admin-1 manifest entry');
  const usaFeatures = JSON.parse(fs.readFileSync(path.join(ROOT, usaManifest.path.replace(/^\//, '')), 'utf8')).features || [];
  const usaByIso = new Map(usaFeatures.map(feature => [String(feature.properties?.iso_3166_2 || '').toUpperCase(), feature]));
  const usaByName = new Map(usaFeatures.map(feature => [normalize(feature.properties?.name || feature.properties?.name_en), feature]));
  const usaRegions = new Map();
  for (const state of base.subnational?.['United States']?.regions || []) {
    const feature = usaByIso.get(`US-${String(state.code || '').toUpperCase()}`) || usaByName.get(normalize(state.name));
    if (!feature) throw new Error(`${key}/United States/${state.name}: missing Natural Earth Admin-1 boundary`);
    const record = {
      sourceName: state.name,
      canonicalName: state.name,
      boundaryMatch: 'exact',
      boundaryFeatureIds: [feature.properties.adm1_code],
      ...(state.qualityFlag ? { qualityFlag: state.qualityFlag } : {}),
      ...(state.qualityNote ? {
        qualityNote: 'Known network-routing cluster in the general Atlas interest dataset; interpret this regional model-page total as an approximate network location, not a resident count.'
      } : {})
    };
    usaRegions.set(normalize(state.name), record);
    usaRegions.set(normalize(state.code), record);
  }
  references.set('United States', { countryCode: 'US', adm0A3: 'USA', regions: usaRegions });
  return { base, admin1, references };
}

function buildInterest(brandRows, modelRows, label, catalogue, modelVisitors, countryInterest, diagnostics) {
  assertUnique(brandRows, row => text(row.brand ?? row.id, `${label} brand id`), `${label} brand`);
  assertUnique(modelRows, row => text(row.model ?? row.id, `${label} model id`), `${label} model`);
  const countryBrands = new Map((countryInterest?.brands || []).map(brand => [brand.id, brand]));
  const modelsByBrand = new Map();

  for (const row of modelRows) {
    const modelId = text(row.model ?? row.id, `${label} model id`);
    const model = catalogue.registry.get(modelId);
    if (!model) {
      const reason = catalogue.ambiguousIds.has(modelId) ? 'ambiguous duplicate catalogue id' : 'missing canonical catalogue record';
      throw new Error(`${label}/${modelId}: ${reason}`);
    }
    if (text(row.path, `${label}/${modelId} path`) !== model.path) {
      throw new Error(`${label}/${modelId}: path must be ${model.path}`);
    }
    if (row.brand !== undefined && text(row.brand, `${label}/${modelId} brand`) !== model.brand) {
      throw new Error(`${label}/${modelId}: brand must be ${model.brand}`);
    }
    const visitors = integer(row.visitors, `${label}/${modelId} visitors`);
    if (visitors > modelVisitors) throw new Error(`${label}/${modelId}: model visitors exceed the independently queried region total`);
    if (visitors < THRESHOLD || !model.brandPublishable) continue;
    const models = modelsByBrand.get(model.brand) || [];
    models.push({ id: model.id, label: model.name, family: model.family, path: model.path, visitors });
    modelsByBrand.set(model.brand, models);
  }

  const brands = [];
  const omittedParentInconsistentBrands = new Set();
  for (const row of brandRows) {
    const brandId = text(row.brand ?? row.id, `${label} brand id`);
    if (GENERIC_LOGO_BRANDS.has(brandId)) {
      throw new Error(`${label}/${brandId}: generic platform logo cannot be published as a model brand`);
    }
    const canonical = catalogue.brands.get(brandId);
    if (!canonical) throw new Error(`${label}/${brandId}: missing canonical brand/logo mapping`);
    const visitors = integer(row.visitors, `${label}/${brandId} visitors`);
    if (visitors > modelVisitors) throw new Error(`${label}/${brandId}: brand visitors exceed the independently queried region total`);
    if (visitors < THRESHOLD) continue;
    const countryBrand = countryBrands.get(brandId);
    if (!countryBrand || visitors > countryBrand.visitors) {
      diagnostics.omittedParentInconsistentBrandCells += 1;
      omittedParentInconsistentBrands.add(brandId);
      continue;
    }
    const countryModels = new Map((countryBrand.models || []).map(model => [model.id, model]));
    const models = (modelsByBrand.get(brandId) || []).filter(model => {
      const countryModel = countryModels.get(model.id);
      if (countryModel && model.visitors <= countryModel.visitors) return true;
      diagnostics.omittedParentInconsistentModelCells += 1;
      return false;
    });
    models.sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label));
    models.forEach((model, index) => { model.rank = index + 1; });
    if (models.some(model => model.visitors > visitors)) {
      throw new Error(`${label}/${brandId}: independently queried brand visitors cannot be lower than a child model`);
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

  const publishedBrandIds = new Set(brands.map(brand => brand.id));
  for (const brandId of modelsByBrand.keys()) {
    if (!publishedBrandIds.has(brandId) && !omittedParentInconsistentBrands.has(brandId)) {
      throw new Error(`${label}/${brandId}: public model row is missing its independently queried publishable brand total`);
    }
  }
  brands.sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label));
  brands.forEach((brand, index) => { brand.rank = index + 1; });
  const leaderVisitors = brands[0]?.visitors;
  return {
    brands,
    dominantBrands: leaderVisitors === undefined ? [] : brands.filter(brand => brand.visitors === leaderVisitors).map(brand => brand.id)
  };
}

function buildPeriod(raw, key, catalogue) {
  const source = raw.periods?.[key];
  if (!source) throw new Error(`Missing raw period: ${key}`);
  const reference = buildReference(key);
  const modelSnapshot = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `local-ai-model-page-interest${suffixFor(key)}.json`), 'utf8'));
  const start = text(source.start, `${key}.start`);
  const end = text(source.end, `${key}.end`);
  if (modelSnapshot.period?.start !== start || modelSnapshot.period?.end !== end) {
    throw new Error(`${key}: regional model-interest period must match the country model-interest snapshot`);
  }

  const rawCountries = Array.isArray(source.countries) ? source.countries : [];
  assertUnique(rawCountries, row => text(row.name ?? row.country, `${key} country`), `${key} country`);
  const rawByCountry = new Map(rawCountries.map(row => [text(row.name ?? row.country, `${key} country`), row]));
  const publicCountryNames = new Set((modelSnapshot.countries || []).map(country => country.name));
  for (const countryName of rawByCountry.keys()) {
    if (!publicCountryNames.has(countryName)) throw new Error(`${key}/${countryName}: raw regional scope is not a public model-interest country`);
  }

  const countries = {};
  const diagnostics = {
    omittedUnresolvedBoundaryRegions: 0,
    omittedParentInconsistentBrandCells: 0,
    omittedParentInconsistentModelCells: 0
  };
  for (const countryScope of modelSnapshot.countries || []) {
    const countryName = countryScope.name;
    const countrySource = rawByCountry.get(countryName);
    if (!countrySource) throw new Error(`${key}: missing regional collection for public model-interest country ${countryName}`);
    const geography = reference.references.get(countryName);
    if (!geography) throw new Error(`${key}/${countryName}: no corresponding Interest Admin-1 geography`);
    const declaredCountryVisitors = countrySource.modelVisitors ?? countrySource.countryModelVisitors ?? countrySource.countrySignals;
    if (declaredCountryVisitors !== undefined && integer(declaredCountryVisitors, `${key}/${countryName} country model visitors`) !== countryScope.modelVisitors) {
      throw new Error(`${key}/${countryName}: raw country model visitors do not match the independently queried public country scope`);
    }

    const regionRows = rawRows(countrySource, 'regions', ['regionTotals', 'totals']);
    const brandRows = rawRows(countrySource, 'brands', ['brandCells']);
    const modelRows = rawRows(countrySource, 'models', ['modelCells']);
    assertUnique(regionRows, row => normalize(rowRegion(row, `${key}/${countryName}`)), `${key}/${countryName} region total`);
    assertUnique(brandRows, row => `${normalize(rowRegion(row, `${key}/${countryName}`))}|${text(row.brand ?? row.id, `${key}/${countryName} brand`)}`, `${key}/${countryName} regional brand cell`);
    assertUnique(modelRows, row => `${normalize(rowRegion(row, `${key}/${countryName}`))}|${text(row.model ?? row.id, `${key}/${countryName} model`)}`, `${key}/${countryName} regional model cell`);
    const totalsByRegion = new Map(regionRows.map(row => [normalize(rowRegion(row, `${key}/${countryName}`)), row]));
    for (const row of [...brandRows, ...modelRows]) {
      const regionKey = normalize(rowRegion(row, `${key}/${countryName}`));
      if (!totalsByRegion.has(regionKey)) throw new Error(`${key}/${countryName}: child model-interest cell has no independently queried region total`);
    }

    const regions = [];
    for (const regionRow of regionRows) {
      const sourceName = rowRegion(regionRow, `${key}/${countryName}`);
      const regionKey = normalize(sourceName);
      const modelVisitors = integer(regionRow.visitors ?? regionRow.modelVisitors ?? regionRow.signals, `${key}/${countryName}/${sourceName} model visitors`);
      if (modelVisitors > countryScope.modelVisitors) {
        throw new Error(`${key}/${countryName}/${sourceName}: region visitors exceed the independently queried country scope`);
      }
      if (modelVisitors < THRESHOLD) continue;
      const boundary = geography.regions.get(regionKey);
      if (!boundary) {
        diagnostics.omittedUnresolvedBoundaryRegions += 1;
        continue;
      }
      const regionalBrands = brandRows.filter(row => normalize(rowRegion(row, `${key}/${countryName}`)) === regionKey);
      const regionalModels = modelRows.filter(row => normalize(rowRegion(row, `${key}/${countryName}`)) === regionKey);
      const modelInterest = buildInterest(
        regionalBrands,
        regionalModels,
        `${key}/${countryName}/${boundary.canonicalName}`,
        catalogue,
        modelVisitors,
        countryScope.modelInterest,
        diagnostics
      );
      regions.push({
        regionId: `${geography.adm0A3}:${boundary.boundaryFeatureIds.join('+')}`,
        sourceName,
        canonicalName: boundary.canonicalName,
        signals: modelVisitors,
        modelVisitors,
        boundaryMatch: boundary.boundaryMatch,
        boundaryFeatureIds: [...boundary.boundaryFeatureIds],
        ...(boundary.qualityFlag ? { qualityFlag: boundary.qualityFlag } : {}),
        ...(boundary.qualityNote ? { qualityNote: boundary.qualityNote } : {}),
        modelInterest
      });
    }
    assertUnique(regions, region => region.regionId, `${key}/${countryName} mapped boundary scope`);
    regions.sort((left, right) => right.modelVisitors - left.modelVisitors || left.canonicalName.localeCompare(right.canonicalName));
    regions.forEach((region, index) => { region.rank = index + 1; });
    countries[countryName] = {
      countryCode: geography.countryCode,
      adm0A3: geography.adm0A3,
      collectionStatus: 'collected',
      publicationStatus: regions.length ? 'published' : 'none_above_threshold',
      snapshotGeneratedAt: text(raw.generatedAt, 'generatedAt'),
      countrySignals: countryScope.modelVisitors,
      countryModelVisitors: countryScope.modelVisitors,
      publishedRegions: regions.length,
      regions
    };
  }

  return {
    schemaVersion: 1,
    view: 'model-page-interest',
    displayName: 'Models by region',
    generatedAt: text(raw.generatedAt, 'generatedAt'),
    period: {
      start,
      end,
      label: modelSnapshot.period.label,
      key,
      days: modelSnapshot.period.days,
      timezone: raw.timezone || modelSnapshot.timezone || 'Europe/Zurich'
    },
    source: {
      provider: 'DataFast',
      dimension: 'country + region + exact canonical model paths',
      method: 'Country-filtered regional analytics with independent all-model, brand and exact-model path scopes',
      snapshotNote: 'Region totals, brand cells and exact-model cells are queried independently. Child cells are never summed to derive a parent total.',
      regionalSnapshotGeneratedAt: text(raw.generatedAt, 'generatedAt'),
      countrySnapshotGeneratedAt: text(modelSnapshot.generatedAt, `${key} country snapshot generatedAt`),
      snapshotLinkage: 'Regional cells are checked fail-closed against the named public country snapshot; inconsistent cells are omitted, never capped or estimated.'
    },
    publishThreshold: THRESHOLD,
    claimBoundary: 'Regional model-page interest only. A page visit is not verified model use and does not prove a download, installation, launch, or inference.',
    privacy: {
      rule: 'A region, brand or exact model is published only when its independently queried scope has at least five unique visitors.',
      withheldDetail: 'Below-threshold region, brand and exact-model identities and counts are not included in this public file.',
      overlapNote: 'Brand and model scopes can overlap. They are not additive and are never reconciled by summing child rows.'
    },
    diagnostics,
    countries
  };
}

const rawPath = argument('--input') || process.argv.slice(2).find(value => !value.startsWith('--'));
if (!rawPath) {
  throw new Error('Usage: node scripts/generate-model-page-interest-admin1.js --input /absolute/path/to/private-regional-model-interest.json [--output-dir /path]');
}
const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'));
if (integer(raw.schemaVersion, 'raw schemaVersion') < 1) throw new Error('Raw regional model-interest schemaVersion must be at least 1');
if (raw.source?.provider !== 'DataFast' || raw.source?.hostname !== 'localclaw.io'
  || !String(raw.source?.collection || '').includes('analytics_regions')) {
  throw new Error('Raw regional model-interest source must identify DataFast analytics_regions for localclaw.io');
}
const outputDirectory = path.resolve(argument('--output-dir') || path.join(ROOT, 'data'));
fs.mkdirSync(outputDirectory, { recursive: true });
const catalogue = loadCatalogue();
for (const key of WINDOWS) {
  const payload = buildPeriod(raw, key, catalogue);
  fs.writeFileSync(path.join(outputDirectory, `local-ai-model-page-interest-admin1${suffixFor(key)}.json`), `${JSON.stringify(payload, null, 2)}\n`);
}
console.log('Generated 30D, 3M and 6M public regional model-page-interest Atlas datasets.');
