#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const THRESHOLD = 5;
const WINDOWS = ['30d', '90d', '180d'];
const GENERIC_LOGO_BRANDS = new Set(['github', 'huggingface']);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function brandLabel(brand) {
  const overrides = {
    ai2: 'AI2', alibaba: 'Alibaba', deepseek: 'DeepSeek', ibm: 'IBM', internlm: 'InternLM',
    liquid: 'Liquid AI', minimax: 'MiniMax', miromind: 'MiroMind', nvidia: 'NVIDIA',
    openai: 'OpenAI', qwen: 'Qwen', 'swiss-ai': 'Swiss AI', xiaomimimo: 'Xiaomi MiMo',
    zhipu: 'Zhipu AI'
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
  const rowsById = new Map();
  for (const model of context.APP_DATA.models || []) {
    if (!model?.id || model.hosted_only || unavailable.has(model.id)) continue;
    const rows = rowsById.get(model.id) || [];
    rows.push(model);
    rowsById.set(model.id, rows);
  }
  const logos = context.window.HOME_INDEX_LOGOS?.llm || {};
  const formats = context.window.HOME_INDEX_AVATAR_FORMATS || {};
  const models = new Map();
  for (const [id, rows] of rowsById) {
    const families = new Set(rows.map(row => String(row.family || '').trim()).filter(Boolean));
    if (families.size !== 1) continue;
    const model = rows.at(-1);
    const family = [...families][0];
    const asset = logos[family];
    if (!asset) continue;
    const extension = formats[asset] || 'svg';
    const brand = asset.replace(/-official-color$/, '').replace(/-inverted$/, '').replace(/-avatar$/, '');
    if (GENERIC_LOGO_BRANDS.has(brand)) continue;
    models.set(id, {
      id,
      label: String(model.name || id),
      family,
      brand,
      brandLabel: brandLabel(brand),
      logo: `/images/model-logos/${asset}.${extension}`,
      path: `/models/${id}`
    });
  }
  return models;
}

function admin1Names(filename) {
  const names = new Map();
  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    if (!line) continue;
    const [code, name, asciiName] = line.split('\t');
    names.set(code, asciiName || name);
  }
  return names;
}

function loadBoundaries(manifest) {
  const parents = new Map();
  const parentByName = new Map();
  for (const country of Object.values(manifest.countries || {})) {
    for (const [parentCode, entry] of Object.entries(country.parents || {})) {
      const relativePath = String(entry.path || '').replace(/^\//, '');
      const shard = JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
      const parent = { code: parentCode, entry, shard, features: shard.features || [] };
      parents.set(parentCode, parent);
      parentByName.set(`${parentCode.slice(0, 2)}|${normalize(entry.parentName)}`, parentCode);
    }
  }
  return { parents, parentByName };
}

async function loadPlaces(files, admin1NameMap, boundaries) {
  const places = new Map();
  for (const filename of files) {
    const stream = readline.createInterface({
      input: fs.createReadStream(filename),
      crlfDelay: Infinity
    });
    for await (const line of stream) {
      if (!line) continue;
      const columns = line.split('\t');
      const country = columns[8];
      const rawAdmin1 = columns[10];
      if (!country || !rawAdmin1 || columns[6] !== 'P') continue;
      let parentCode = `${country}-${rawAdmin1}`;
      if (!boundaries.parents.has(parentCode)) {
        const admin1Name = admin1NameMap.get(`${country}.${rawAdmin1}`);
        parentCode = boundaries.parentByName.get(`${country}|${normalize(admin1Name)}`) || '';
      }
      if (!boundaries.parents.has(parentCode)) continue;
      const parent = boundaries.parents.get(parentCode);
      const usStateFips = country === 'US'
        ? String(parent.features.find(feature => /^US-\d{5}$/.test(feature.properties?.code || ''))?.properties?.code || '').slice(3, 5)
        : '';
      const record = {
        parentCode,
        name: columns[1],
        latitude: Number(columns[4]),
        longitude: Number(columns[5]),
        countyCode: country === 'US' && usStateFips && columns[11]
          ? `US-${usStateFips}${String(columns[11]).padStart(3, '0')}`
          : '',
        population: Number(columns[14]) || 0
      };
      if (!Number.isFinite(record.latitude) || !Number.isFinite(record.longitude)) continue;
      for (const candidate of [columns[1], columns[2]]) {
        const city = normalize(candidate);
        if (!city) continue;
        const key = `${parentCode}|${city}`;
        const current = places.get(key);
        if (!current || record.population > current.population) places.set(key, record);
      }
    }
  }
  return places;
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
  if (!polygon?.length || !pointInRing(longitude, latitude, polygon[0])) return false;
  return !polygon.slice(1).some(ring => pointInRing(longitude, latitude, ring));
}

function pointInFeature(longitude, latitude, feature) {
  const geometry = feature?.geometry;
  if (geometry?.type === 'Polygon') return pointInPolygon(longitude, latitude, geometry.coordinates);
  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates.some(polygon => pointInPolygon(longitude, latitude, polygon));
  }
  return false;
}

function emptyAggregate(feature) {
  return {
    code: feature.properties.code,
    name: feature.properties.name,
    label: feature.properties.label,
    modelVisitors: new Set(),
    modelBrands: new Map(),
    models: new Map(),
    installVisitors: new Set(),
    installBrands: new Map(),
    installModels: new Map()
  };
}

function addToSetMap(map, key, visitor) {
  const values = map.get(key) || new Set();
  values.add(visitor);
  map.set(key, values);
}

function rankedBrands(brandMap, modelMap, catalogue) {
  const rows = [...brandMap.entries()].map(([brandId, visitors]) => {
    const model = [...catalogue.values()].find(candidate => candidate.brand === brandId);
    const models = [...modelMap.entries()]
      .filter(([modelId]) => catalogue.get(modelId)?.brand === brandId)
      .map(([modelId, modelVisitors]) => ({ model: catalogue.get(modelId), visitors: modelVisitors.size }))
      .filter(row => row.model && row.visitors >= THRESHOLD)
      .sort((left, right) => right.visitors - left.visitors || left.model.label.localeCompare(right.model.label))
      .map((row, index) => ({
        id: row.model.id,
        label: row.model.label,
        family: row.model.family,
        path: row.model.path,
        visitors: row.visitors,
        rank: index + 1
      }));
    return model ? {
      id: brandId,
      label: model.brandLabel,
      logo: model.logo,
      visitors: visitors.size,
      models,
      modelsStatus: models.length ? 'published' : 'withheld_below_threshold'
    } : null;
  }).filter(Boolean).sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label));
  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}

function publicScope(aggregate, prefix, catalogue) {
  const visitors = aggregate[`${prefix}Visitors`];
  const modelMap = prefix === 'model' ? aggregate.models : aggregate.installModels;
  const brands = rankedBrands(aggregate[`${prefix}Brands`], modelMap, catalogue);
  if (!visitors.size || !brands.length) return null;
  const leaderCount = brands[0].visitors;
  return {
    observed: true,
    visitors: visitors.size >= THRESHOLD ? visitors.size : null,
    visitorsStatus: visitors.size >= THRESHOLD ? 'published' : 'withheld_below_threshold',
    brands: brands.filter(brand => brand.visitors >= THRESHOLD),
    mapLeaders: brands.filter(brand => brand.visitors === leaderCount)
      .map(brand => ({ id: brand.id, label: brand.label, logo: brand.logo }))
  };
}

function dateInPeriod(timestamp, period) {
  const time = Date.parse(timestamp || '');
  if (!Number.isFinite(time)) return false;
  return time >= Date.parse(`${period.start}T00:00:00Z`)
    && time <= Date.parse(`${period.end}T23:59:59.999Z`);
}

function locationForRecord(record, places, boundaries, cache) {
  const parentCode = String(record.region || '').toUpperCase();
  const key = `${parentCode}|${normalize(record.city)}`;
  if (cache.has(key)) return cache.get(key);
  const place = places.get(key);
  const parent = boundaries.parents.get(parentCode);
  if (!place || !parent) {
    cache.set(key, null);
    return null;
  }
  let feature = null;
  if (place.countyCode) {
    feature = parent.features.find(candidate => candidate.properties?.code === place.countyCode) || null;
  }
  if (!feature) {
    feature = parent.features.find(candidate => pointInFeature(place.longitude, place.latitude, candidate)) || null;
  }
  const result = feature ? { parent, feature } : null;
  cache.set(key, result);
  return result;
}

function buildWindow(raw, places, catalogue, boundaries, period, preservedCalifornia) {
  const aggregates = new Map();
  const locationCache = new Map();
  const unresolved = new Map();
  let eligibleModelVisitorRows = 0;
  let mappedModelVisitorRows = 0;
  const aggregateFor = location => {
    const key = location.feature.properties.code;
    if (!aggregates.has(key)) aggregates.set(key, emptyAggregate(location.feature));
    return aggregates.get(key);
  };
  let visitorNumber = 0;
  for (const record of raw.model?.records || []) {
    const visits = (record.visits || []).filter(visit => dateInPeriod(visit.timestamp, period) && catalogue.has(visit.modelId));
    if (!visits.length) continue;
    eligibleModelVisitorRows += 1;
    const location = locationForRecord(record, places, boundaries, locationCache);
    if (!location) {
      const key = `${record.region || '(region)'}|${record.city || '(city)'}`;
      unresolved.set(key, (unresolved.get(key) || 0) + 1);
      continue;
    }
    mappedModelVisitorRows += 1;
    const visitor = `model-${visitorNumber++}`;
    const aggregate = aggregateFor(location);
    aggregate.parentCode = location.parent.code;
    aggregate.modelVisitors.add(visitor);
    const latestVisit = visits.sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)).at(-1);
    const model = catalogue.get(latestVisit.modelId);
    addToSetMap(aggregate.models, latestVisit.modelId, visitor);
    addToSetMap(aggregate.modelBrands, model.brand, visitor);
  }
  visitorNumber = 0;
  for (const record of raw.install?.records || []) {
    const events = (record.events || []).filter(event => dateInPeriod(event.timestamp, period) && catalogue.has(event.modelId));
    if (!events.length) continue;
    const location = locationForRecord(record, places, boundaries, locationCache);
    if (!location) continue;
    const visitor = `install-${visitorNumber++}`;
    const aggregate = aggregateFor(location);
    aggregate.parentCode = location.parent.code;
    aggregate.installVisitors.add(visitor);
    for (const modelId of new Set(events.map(event => event.modelId))) {
      const model = catalogue.get(modelId);
      addToSetMap(aggregate.installModels, modelId, visitor);
      addToSetMap(aggregate.installBrands, model.brand, visitor);
    }
  }
  const parents = {};
  for (const parent of boundaries.parents.values()) {
    const subdivisions = [...aggregates.values()]
      .filter(aggregate => aggregate.parentCode === parent.code)
      .map(aggregate => ({
        code: aggregate.code,
        name: aggregate.name,
        label: aggregate.label,
        modelInterest: publicScope(aggregate, 'model', catalogue),
        installIntent: publicScope(aggregate, 'install', catalogue)
      }))
      .filter(row => row.modelInterest || row.installIntent)
      .sort((left, right) => left.name.localeCompare(right.name));
    if (!subdivisions.length) continue;
    parents[parent.code] = {
      parentCode: parent.code,
      parentName: parent.entry.parentName,
      subdivisionLabel: parent.entry.childLabel,
      totals: {
        subdivisions: parent.entry.featureCount,
        withModelSignal: subdivisions.filter(row => row.modelInterest).length,
        withInstallModelAttribution: subdivisions.filter(row => row.installIntent).length
      },
      subdivisions
    };
  }
  if (preservedCalifornia) parents['US-CA'] = preservedCalifornia;
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    period,
    publishThreshold: THRESHOLD,
    identityThreshold: 1,
    source: 'DataFast deduplicated model-page visitors joined to GeoNames network-city centroids and the published Atlas subdivision boundaries',
    methodology: {
      modelInterest: 'Each visitor contributes the most recently observed eligible LocalClaw model page returned by the selected DataFast model-page visitor window. The visitor network city is mapped to one published lower-level administrative boundary.',
      installIntent: 'Only an eligible install-path goal attributable to a preceding canonical LocalClaw model page contributes a lower-level model identity.',
      privacy: 'Exact visitor, brand and model counts are public only at five unique visitors. A leading brand logo may appear from one visitor without publishing its count. No visitor identifier, IP address, device or city row is public.',
      claimBoundary: 'Model interest measures LocalClaw page exploration. Install paths measures a path selection, not a verified download, installation, launch or local inference.'
    },
    coverage: {
      boundaryParents: boundaries.parents.size,
      parentsWithObservedModelSignal: Object.keys(parents).length,
      eligibleModelVisitorRows,
      mappedModelVisitorRows,
      unresolvedVisitorRows: [...unresolved.values()].reduce((sum, value) => sum + value, 0)
    },
    parents
  };
}

async function main() {
  const inputPath = argument('--input');
  const admin1CodesPath = argument('--admin1codes');
  const geonamesPaths = [argument('--geonames-us'), argument('--geonames-cn'), argument('--geonames-au')].filter(Boolean);
  if (!inputPath || !admin1CodesPath || geonamesPaths.length !== 3) {
    throw new Error('Usage: node scripts/generate-global-admin2-model-activity.js --input /private/raw.json --admin1codes /private/admin1CodesASCII.txt --geonames-us /private/US.txt --geonames-cn /private/CN.txt --geonames-au /private/AU.txt');
  }
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const catalogue = loadCatalogue();
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/admin2/manifest.json'), 'utf8'));
  const boundaries = loadBoundaries(manifest);
  const places = await loadPlaces(geonamesPaths, admin1Names(admin1CodesPath), boundaries);
  console.log(`Loaded ${places.size} normalized GeoNames city keys across ${boundaries.parents.size} lower-level parent boundaries.`);
  for (const windowKey of WINDOWS) {
    const suffix = windowKey === '30d' ? '' : `-${windowKey}`;
    const outputPath = path.join(ROOT, 'data', `local-ai-admin2-model-activity${suffix}.json`);
    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const reference = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `local-ai-model-page-interest${suffix}.json`), 'utf8'));
    const payload = buildWindow(raw, places, catalogue, boundaries, reference.period, existing.parents?.['US-CA'] || null);
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
    const subdivisions = Object.values(payload.parents).reduce((sum, parent) => sum + parent.totals.withModelSignal, 0);
    console.log(`${windowKey}: ${Object.keys(payload.parents).length} parents and ${subdivisions} lower-level boundaries with observed model signals.`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
