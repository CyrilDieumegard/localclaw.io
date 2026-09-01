#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const WINDOWS = ['30d', '90d', '180d'];
const PUBLISH_THRESHOLD = 1;
const GENERIC_LOGO_BRANDS = new Set(['github', 'huggingface']);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function suffixFor(key) {
  return key === '30d' ? '' : `-${key}`;
}

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function brandLabel(brand) {
  const overrides = {
    ai2: 'AI2', alibaba: 'Alibaba', bespokelabs: 'Bespoke Labs', bigcode: 'BigCode',
    codegeex: 'CodeGeeX', dbrx: 'DBRX', deepcogito: 'Deep Cogito', deepseek: 'DeepSeek',
    huggingfaceh4: 'Hugging Face H4', huggingfacetb: 'Hugging Face TB', ibm: 'IBM',
    inclusionai: 'InclusionAI', internlm: 'InternLM', internscience: 'InternScience',
    lg: 'LG', liquid: 'Liquid AI', llava: 'LLaVA', longcat: 'LongCat', minimax: 'MiniMax',
    miromind: 'MiroMind', nousresearch: 'Nous Research', numind: 'NuMind', nvidia: 'NVIDIA',
    odaxai: 'OdaxAI', 'open-thoughts': 'Open Thoughts', openai: 'OpenAI', openbmb: 'OpenBMB',
    openchat: 'OpenChat', opengvlab: 'OpenGVLab', prismml: 'PrismML', qwen: 'Qwen',
    smallthinker: 'SmallThinker', stepfun: 'StepFun', 'swiss-ai': 'Swiss AI', tinyllama: 'TinyLlama',
    xiaomimimo: 'Xiaomi MiMo', zeroone: 'ZeroOne', zhipu: 'Zhipu AI'
  };
  return overrides[brand] || String(brand).split('-').filter(Boolean)
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
  const models = new Map();
  for (const [id, rows] of grouped) {
    const families = new Set(rows.map(row => String(row.family || '').trim()).filter(Boolean));
    if (families.size !== 1) continue;
    const source = rows.at(-1);
    const family = [...families][0];
    const asset = logos[family];
    if (!asset) continue;
    const extension = formats[asset] || 'svg';
    const brand = asset.replace(/-official-color$/, '').replace(/-inverted$/, '').replace(/-avatar$/, '');
    if (GENERIC_LOGO_BRANDS.has(brand)) continue;
    models.set(id, {
      id,
      label: String(source.name || id),
      family,
      brand,
      brandLabel: brandLabel(brand),
      logo: `/images/model-logos/${asset}.${extension}`,
      path: `/models/${id}`
    });
  }
  return models;
}

function loadCountries(manifest) {
  const world = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ne_50m_admin_0_countries.geojson'), 'utf8'));
  const byA3 = new Map();
  const byA2 = new Map();
  const canonicalNames = {
    CHN: 'China', CZE: 'Czechia', HKG: 'Hong Kong', KOR: 'South Korea',
    RUS: 'Russia', TUR: 'Turkey', USA: 'United States', VNM: 'Viet Nam'
  };
  for (const [adm0A3, entry] of Object.entries(manifest.countries || {})) {
    const shard = JSON.parse(fs.readFileSync(path.join(ROOT, String(entry.path).replace(/^\//, '')), 'utf8'));
    const features = shard.features || [];
    const alpha2Candidates = features.map(feature => String(feature.properties?.iso_3166_2 || '').split('-')[0])
      .filter(value => /^[A-Z]{2}$/.test(value));
    const worldFeature = world.features.find(feature => String(feature.properties?.ADM0_A3 || '') === adm0A3);
    const fallbackA2 = ['ISO_A2', 'ISO_A2_EH', 'WB_A2'].map(key => String(worldFeature?.properties?.[key] || ''))
      .find(value => /^[A-Z]{2}$/.test(value) && value !== '-99');
    const alpha2 = alpha2Candidates[0] || fallbackA2 || '';
    const country = { alpha2, adm0A3, name: canonicalNames[adm0A3] || entry.name, entry, features };
    byA3.set(adm0A3, country);
    if (alpha2 && !byA2.has(alpha2)) byA2.set(alpha2, country);
  }
  const overrides = { AU: 'AUS', FR: 'FRA', GB: 'GBR', HK: 'HKG', US: 'USA' };
  for (const [alpha2, adm0A3] of Object.entries(overrides)) {
    if (byA3.has(adm0A3)) byA2.set(alpha2, byA3.get(adm0A3));
  }
  return byA2;
}

function loadCities(filename) {
  const cities = new Map();
  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    if (!line) continue;
    const columns = line.split('\t');
    const country = columns[8];
    const latitude = Number(columns[4]);
    const longitude = Number(columns[5]);
    const population = Number(columns[14]) || 0;
    if (!country || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    const record = { latitude, longitude, population };
    const names = new Set([columns[1], columns[2], ...String(columns[3] || '').split(',')].map(normalize).filter(Boolean));
    for (const city of names) {
      const key = `${country}|${city}`;
      const current = cities.get(key);
      if (!current || population > current.population) cities.set(key, record);
    }
  }
  return cities;
}

function pointInRing(longitude, latitude, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i]?.[0]);
    const yi = Number(ring[i]?.[1]);
    const xj = Number(ring[j]?.[0]);
    const yj = Number(ring[j]?.[1]);
    if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
    const intersects = ((yi > latitude) !== (yj > latitude))
      && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(longitude, latitude, polygon) {
  return Boolean(polygon?.length && pointInRing(longitude, latitude, polygon[0])
    && !polygon.slice(1).some(ring => pointInRing(longitude, latitude, ring)));
}

function pointInFeature(longitude, latitude, feature) {
  const geometry = feature?.geometry;
  if (geometry?.type === 'Polygon') return pointInPolygon(longitude, latitude, geometry.coordinates);
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates.some(polygon => pointInPolygon(longitude, latitude, polygon));
  return false;
}

function emptyAggregate() {
  return { visitors: new Set(), brands: new Map(), models: new Map() };
}

function addToSetMap(map, key, visitor) {
  const values = map.get(key) || new Set();
  values.add(visitor);
  map.set(key, values);
}

function addObservation(aggregate, visitor, model) {
  aggregate.visitors.add(visitor);
  addToSetMap(aggregate.brands, model.brand, visitor);
  addToSetMap(aggregate.models, model.id, visitor);
}

function publicInterest(aggregate, catalogue) {
  const brands = [...aggregate.brands.entries()].map(([brandId, visitors]) => {
    const representative = [...catalogue.values()].find(model => model.brand === brandId);
    if (!representative) return null;
    const models = [...aggregate.models.entries()]
      .filter(([modelId]) => catalogue.get(modelId)?.brand === brandId)
      .map(([modelId, modelVisitors]) => ({ source: catalogue.get(modelId), visitors: modelVisitors.size }))
      .filter(row => row.source && row.visitors >= PUBLISH_THRESHOLD)
      .sort((left, right) => right.visitors - left.visitors || left.source.label.localeCompare(right.source.label))
      .map((row, index) => ({
        id: row.source.id, label: row.source.label, family: row.source.family,
        path: row.source.path, visitors: row.visitors, rank: index + 1
      }));
    return {
      id: brandId,
      label: representative.brandLabel,
      logo: representative.logo,
      visitors: visitors.size,
      models,
      modelsStatus: 'published'
    };
  }).filter(Boolean).sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label));
  brands.forEach((brand, index) => { brand.rank = index + 1; });
  const leader = brands[0]?.visitors;
  return {
    brands,
    dominantBrands: leader === undefined ? [] : brands.filter(brand => brand.visitors === leader).map(brand => brand.id),
    mapLeaders: leader === undefined ? [] : brands.filter(brand => brand.visitors === leader)
      .map(brand => ({ id: brand.id, label: brand.label, logo: brand.logo }))
  };
}

function inPeriod(timestamp, period) {
  const time = Date.parse(timestamp || '');
  return Number.isFinite(time) && time >= Date.parse(`${period.start}T00:00:00Z`)
    && time <= Date.parse(`${period.end}T23:59:59.999Z`);
}

function featureForRecord(record, country, cities, cache) {
  const key = `${country.alpha2}|${normalize(record.city)}|${String(record.region || '').toUpperCase()}`;
  if (cache.has(key)) return cache.get(key);
  let feature = null;
  const city = cities.get(`${country.alpha2}|${normalize(record.city)}`);
  if (city) feature = country.features.find(candidate => pointInFeature(city.longitude, city.latitude, candidate)) || null;
  if (!feature) {
    const region = String(record.region || '').toUpperCase();
    feature = country.features.find(candidate => String(candidate.properties?.iso_3166_2 || '').toUpperCase() === region) || null;
  }
  cache.set(key, feature);
  return feature;
}

function buildWindow(raw, period, catalogue, countries, cities) {
  const global = emptyAggregate();
  const countryAggregates = new Map();
  const regionAggregates = new Map();
  const countryObserved = new Set();
  const locationCache = new Map();
  let eligibleRows = 0;
  let mappedRows = 0;
  let unmappedRows = 0;
  const unresolvedByCountry = new Map();
  const unresolvedExamples = new Map();
  for (const [index, record] of (raw.model?.records || []).entries()) {
    const visits = (record.visits || []).filter(visit => inPeriod(visit.timestamp, period) && catalogue.has(visit.modelId));
    if (!visits.length) continue;
    const latest = visits.sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)).at(-1);
    const model = catalogue.get(latest.modelId);
    const country = countries.get(String(record.country || '').toUpperCase());
    if (!country) continue;
    eligibleRows += 1;
    countryObserved.add(country.alpha2);
    const visitor = `visitor-${index}`;
    addObservation(global, visitor, model);
    const countryAggregate = countryAggregates.get(country.alpha2) || emptyAggregate();
    addObservation(countryAggregate, visitor, model);
    countryAggregates.set(country.alpha2, countryAggregate);
    const feature = featureForRecord(record, country, cities, locationCache);
    if (!feature) {
      unmappedRows += 1;
      unresolvedByCountry.set(country.alpha2, (unresolvedByCountry.get(country.alpha2) || 0) + 1);
      const examples = unresolvedExamples.get(country.alpha2) || [];
      if (examples.length < 5) examples.push(`${record.region || '(none)'}|${record.city || '(none)'}`);
      unresolvedExamples.set(country.alpha2, examples);
      continue;
    }
    mappedRows += 1;
    const regionKey = `${country.alpha2}|${feature.properties.adm1_code}`;
    const regionAggregate = regionAggregates.get(regionKey) || { ...emptyAggregate(), country, feature };
    addObservation(regionAggregate, visitor, model);
    regionAggregates.set(regionKey, regionAggregate);
  }

  const publicCountries = [...countryAggregates.entries()].map(([alpha2, aggregate]) => {
    const country = countries.get(alpha2);
    const modelInterest = publicInterest(aggregate, catalogue);
    delete modelInterest.mapLeaders;
    return {
      name: country.name,
      signals: aggregate.visitors.size,
      modelVisitors: aggregate.visitors.size,
      modelInterest
    };
  }).filter(country => country.modelInterest.brands.length)
    .sort((left, right) => right.modelVisitors - left.modelVisitors || left.name.localeCompare(right.name));
  publicCountries.forEach((country, index) => { country.rank = index + 1; });

  const admin1Countries = {};
  for (const countryScope of publicCountries) {
    const country = [...countries.values()].find(candidate => candidate.name === countryScope.name);
    const regions = [...regionAggregates.values()].filter(region => region.country.alpha2 === country.alpha2)
      .map(region => {
        const modelInterest = publicInterest(region, catalogue);
        return {
          regionId: `${country.adm0A3}:${region.feature.properties.adm1_code}`,
          sourceName: region.feature.properties.name_en || region.feature.properties.name,
          canonicalName: region.feature.properties.name_en || region.feature.properties.name,
          signals: region.visitors.size,
          modelVisitors: region.visitors.size,
          boundaryMatch: 'network-city-point',
          boundaryFeatureIds: [region.feature.properties.adm1_code],
          modelInterest
        };
      }).filter(region => region.modelInterest.brands.length)
      .sort((left, right) => right.modelVisitors - left.modelVisitors || left.canonicalName.localeCompare(right.canonicalName));
    regions.forEach((region, index) => { region.rank = index + 1; });
    admin1Countries[country.name] = {
      countryCode: country.alpha2,
      adm0A3: country.adm0A3,
      collectionStatus: 'collected',
      publicationStatus: regions.length ? 'published' : 'country_only',
      snapshotGeneratedAt: raw.generatedAt,
      countrySignals: countryScope.modelVisitors,
      countryModelVisitors: countryScope.modelVisitors,
      publishedRegions: regions.length,
      regions
    };
  }

  const globalInterest = publicInterest(global, catalogue);
  const publishedBrandCells = publicCountries.reduce((sum, country) => sum + country.modelInterest.brands.length, 0);
  const publishedModelCells = publicCountries.reduce((sum, country) => sum + country.modelInterest.brands
    .reduce((brandSum, brand) => brandSum + brand.models.length, 0), 0);
  const countryPayload = {
    schemaVersion: 1,
    indexName: 'Local AI Activity Index',
    view: 'model-page-interest',
    status: 'beta',
    source: 'Aggregated anonymous LocalClaw model-page traffic measured by DataFast',
    sourceUrl: 'https://localclaw.io/local-ai-activity-index#methodology',
    metric: 'unique visitors whose current canonical LocalClaw /models/ page was observed',
    publishThreshold: PUBLISH_THRESHOLD,
    claimBoundary: 'Model-page interest only. A page visit is not verified model use and does not prove a download, installation, launch, or inference.',
    timezone: 'Europe/Zurich',
    period,
    generatedAt: raw.generatedAt,
    methodology: {
      provider: 'DataFast',
      dimension: 'hostname + country + current exact canonical model path',
      hostnameFilter: 'localclaw.io',
      modelPathRule: 'Exact allow-list match to an eligible canonical /models/${APP_DATA.models[].id} page.',
      modelVisitorAggregation: 'Each de-duplicated DataFast visitor contributes once, to the most recently observed eligible model page in the selected window.',
      brandAggregation: 'The visitor is grouped under the canonical LocalClaw model logo attached to that page.',
      publicationRule: 'Every observed aggregate cell is published from one visitor. Zero-observation cells remain empty.',
      genericLogoRule: 'Generic hosting-platform logo groups github and huggingface remain excluded as model brands.',
      rankingRule: 'Countries rank by observed all-model visitors. Co-leading brands are preserved.',
      geographyNote: 'Country and region are approximate network locations, not verified residence or nationality.',
      privacyNote: 'Only aggregate counts are public. Visitor identifiers, IP addresses, devices, cities and raw rows are excluded.',
      caveat: 'Results measure LocalClaw page interest and can be affected by search demand, page age, referrals and catalogue availability.'
    },
    totals: {
      signals: global.visitors.size,
      modelVisitors: global.visitors.size,
      regions: publicCountries.length,
      countriesWithPublishedBrands: publicCountries.length,
      observedCountries: countryObserved.size,
      collectedCountries: countryObserved.size,
      publishedBrandCells,
      publishedModelCells
    },
    diagnostics: { omittedProviderInconsistentBrandScopes: 0 },
    modelInterest: { global: { signals: global.visitors.size, modelVisitors: global.visitors.size, ...globalInterest } },
    countries: publicCountries
  };
  const admin1Payload = {
    schemaVersion: 1,
    view: 'model-page-interest',
    displayName: 'Models by region',
    generatedAt: raw.generatedAt,
    period: { ...period, timezone: 'Europe/Zurich' },
    source: {
      provider: 'DataFast',
      dimension: 'country + network city + exact canonical model path',
      method: 'De-duplicated model-page visitors mapped from an approximate network-city centroid to the published Atlas administrative boundary',
      snapshotNote: 'Each visitor contributes once to one eligible page and at most one mapped boundary.',
      regionalSnapshotGeneratedAt: raw.generatedAt,
      countrySnapshotGeneratedAt: raw.generatedAt,
      snapshotLinkage: 'Country and regional aggregates are generated from the same sanitized visitor snapshot.'
    },
    publishThreshold: PUBLISH_THRESHOLD,
    claimBoundary: countryPayload.claimBoundary,
    privacy: {
      rule: 'Every observed regional model aggregate is published from one visitor.',
      withheldDetail: 'Only cells with zero observed visitors remain absent.',
      overlapNote: 'Counts are aggregate page-interest observations and must not be interpreted as downloads or verified usage.'
    },
    diagnostics: {
      eligibleVisitorRows: eligibleRows,
      mappedVisitorRows: mappedRows,
      omittedUnresolvedBoundaryRows: unmappedRows,
      mappingRate: eligibleRows ? Number((mappedRows / eligibleRows).toFixed(4)) : 0,
      unresolvedByCountry: Object.fromEntries([...unresolvedByCountry].sort((left, right) => right[1] - left[1])),
      omittedUnresolvedBoundaryRegions: unmappedRows,
      omittedParentInconsistentBrandCells: 0,
      omittedParentInconsistentModelCells: 0
    },
    countries: admin1Countries
  };
  return { countryPayload, admin1Payload, unresolvedExamples };
}

function main() {
  const inputPath = argument('--input');
  const citiesPath = argument('--cities');
  if (!inputPath || !citiesPath) {
    throw new Error('Usage: node scripts/generate-model-interest-from-visitors.js --input /private/sanitized-visitors.json --cities /private/cities5000.txt');
  }
  const raw = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  const catalogue = loadCatalogue();
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/admin1/manifest.json'), 'utf8'));
  const countries = loadCountries(manifest);
  const cities = loadCities(path.resolve(citiesPath));
  console.log(`Loaded ${catalogue.size} eligible model pages, ${countries.size} country boundaries and ${cities.size} normalized city keys.`);
  for (const key of WINDOWS) {
    const reference = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `local-ai-model-page-interest${suffixFor(key)}.json`), 'utf8'));
    const { countryPayload, admin1Payload, unresolvedExamples } = buildWindow(raw, reference.period, catalogue, countries, cities);
    fs.writeFileSync(path.join(ROOT, 'data', `local-ai-model-page-interest${suffixFor(key)}.json`), `${JSON.stringify(countryPayload, null, 2)}\n`);
    fs.writeFileSync(path.join(ROOT, 'data', `local-ai-model-page-interest-admin1${suffixFor(key)}.json`), `${JSON.stringify(admin1Payload, null, 2)}\n`);
    console.log(`${key}: ${countryPayload.totals.modelVisitors} visitors, ${countryPayload.countries.length} countries, ${Object.values(admin1Payload.countries).reduce((sum, country) => sum + country.publishedRegions, 0)} mapped regions (${(admin1Payload.diagnostics.mappingRate * 100).toFixed(1)}%).`);
    if (process.argv.includes('--debug-unresolved')) {
      console.log([...unresolvedExamples].map(([country, examples]) => `${country}: ${examples.join(', ')}`).join('\n'));
    }
  }
}

main();
