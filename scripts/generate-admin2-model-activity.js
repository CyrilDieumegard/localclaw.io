#!/usr/bin/env node
'use strict';

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

function loadCaliforniaCities(geonamesPath) {
  const cities = new Map();
  for (const line of fs.readFileSync(geonamesPath, 'utf8').split('\n')) {
    if (!line) continue;
    const columns = line.split('\t');
    if (columns[8] !== 'US' || columns[10] !== 'CA' || columns[6] !== 'P' || !columns[11]) continue;
    const record = {
      name: columns[1],
      countyCode: `US-06${columns[11].padStart(3, '0')}`,
      population: Number(columns[14]) || 0,
      geonameId: Number(columns[0]) || null
    };
    for (const candidate of [columns[1], ...(columns[3] || '').split(',')]) {
      const key = normalize(candidate);
      if (!key) continue;
      const current = cities.get(key);
      if (!current || record.population > current.population) cities.set(key, record);
    }
  }
  return cities;
}

function dateInPeriod(timestamp, period) {
  const time = Date.parse(timestamp || '');
  if (!Number.isFinite(time)) return false;
  return time >= Date.parse(`${period.start}T00:00:00Z`) && time < Date.parse(`${period.end}T23:59:59.999Z`) + 1;
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

function rankedBrands(brandMap, modelMap, catalogue, exactCountThreshold = THRESHOLD) {
  const rows = [...brandMap.entries()].map(([brandId, visitors]) => {
    const model = [...catalogue.values()].find(candidate => candidate.brand === brandId);
    const models = [...modelMap.entries()]
      .filter(([modelId]) => catalogue.get(modelId)?.brand === brandId)
      .map(([modelId, modelVisitors]) => ({ model: catalogue.get(modelId), visitors: modelVisitors.size }))
      .filter(row => row.model && row.visitors >= exactCountThreshold)
      .sort((left, right) => right.visitors - left.visitors || left.model.label.localeCompare(right.model.label))
      .map((row, index) => ({
        id: row.model.id, label: row.model.label, family: row.model.family, path: row.model.path,
        visitors: row.visitors, rank: index + 1
      }));
    return model ? {
      id: brandId, label: model.brandLabel, logo: model.logo, visitors: visitors.size,
      models, modelsStatus: models.length ? 'published' : 'withheld_below_threshold'
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
  const leaders = brands.filter(brand => brand.visitors === leaderCount)
    .map(brand => ({ id: brand.id, label: brand.label, logo: brand.logo }));
  return {
    observed: true,
    visitors: visitors.size >= THRESHOLD ? visitors.size : null,
    visitorsStatus: visitors.size >= THRESHOLD ? 'published' : 'withheld_below_threshold',
    brands: brands.filter(brand => brand.visitors >= THRESHOLD),
    mapLeaders: leaders
  };
}

function buildWindow(windowKey, raw, geonames, catalogue, shard, period) {
  const byCode = new Map(shard.features.map(feature => [feature.properties.code, emptyAggregate(feature)]));
  const unresolved = new Map();
  let visitorNumber = 0;
  for (const record of raw.model?.records || []) {
    const place = geonames.get(normalize(record.city));
    if (!place || !byCode.has(place.countyCode)) {
      unresolved.set(record.city || '(missing)', (unresolved.get(record.city || '(missing)') || 0) + 1);
      continue;
    }
    const visits = (record.visits || []).filter(visit => dateInPeriod(visit.timestamp, period) && catalogue.has(visit.modelId));
    if (!visits.length) continue;
    const visitor = `model-${visitorNumber++}`;
    const aggregate = byCode.get(place.countyCode);
    aggregate.modelVisitors.add(visitor);
    for (const modelId of new Set(visits.map(visit => visit.modelId))) {
      const model = catalogue.get(modelId);
      addToSetMap(aggregate.models, modelId, visitor);
      addToSetMap(aggregate.modelBrands, model.brand, visitor);
    }
  }
  visitorNumber = 0;
  for (const record of raw.install?.records || []) {
    const place = geonames.get(normalize(record.city));
    if (!place || !byCode.has(place.countyCode)) continue;
    const events = (record.events || []).filter(event => dateInPeriod(event.timestamp, period) && catalogue.has(event.modelId));
    if (!events.length) continue;
    const visitor = `install-${visitorNumber++}`;
    const aggregate = byCode.get(place.countyCode);
    aggregate.installVisitors.add(visitor);
    for (const modelId of new Set(events.map(event => event.modelId))) {
      const model = catalogue.get(modelId);
      addToSetMap(aggregate.installModels, modelId, visitor);
      addToSetMap(aggregate.installBrands, model.brand, visitor);
    }
  }
  const subdivisions = [...byCode.values()].map(aggregate => ({
    code: aggregate.code,
    name: aggregate.name,
    label: aggregate.label,
    modelInterest: publicScope(aggregate, 'model', catalogue),
    installIntent: publicScope(aggregate, 'install', catalogue)
  })).filter(row => row.modelInterest || row.installIntent);
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    period,
    publishThreshold: THRESHOLD,
    identityThreshold: 1,
    source: 'DataFast anonymous visitor journeys joined to GeoNames city-to-county codes',
    methodology: {
      modelInterest: 'A visitor is assigned to an approximate network city and de-duplicated inside its mapped county. Every eligible canonical model page in the selected period contributes to that visitor\'s county-level brand set.',
      installIntent: 'Only an eligible install-path goal whose immediately preceding canonical LocalClaw model page is available contributes a county-level model identity.',
      privacy: 'Exact visitor, brand and model counts are public only at five unique visitors. A leading brand logo may appear from one visitor without publishing its count. No visitor identifier, IP address, device or city row is public.',
      claimBoundary: 'Model interest measures LocalClaw page exploration. Install paths measures a path selection, not a verified download, installation, launch or local inference.'
    },
    parents: {
      'US-CA': {
        parentCode: 'US-CA', parentName: 'California', subdivisionLabel: 'county',
        totals: {
          subdivisions: shard.features.length,
          withModelSignal: subdivisions.filter(row => row.modelInterest).length,
          withInstallModelAttribution: subdivisions.filter(row => row.installIntent).length
        },
        subdivisions
      }
    }
  };
  console.log(`${windowKey}: ${subdivisions.filter(row => row.modelInterest).length} counties with model signals; ${subdivisions.filter(row => row.installIntent).length} with attributed install paths; ${[...unresolved.values()].reduce((a, b) => a + b, 0)} unresolved visitor rows`);
  return result;
}

const inputPath = argument('--input');
const geonamesPath = argument('--geonames');
if (!inputPath || !geonamesPath) throw new Error('Usage: node scripts/generate-admin2-model-activity.js --input /private/raw.json --geonames /private/US.txt');
const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const catalogue = loadCatalogue();
const geonames = loadCaliforniaCities(geonamesPath);
const shard = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/admin2/usa/us-ca.geojson'), 'utf8'));

for (const windowKey of WINDOWS) {
  const suffix = windowKey === '30d' ? '' : `-${windowKey}`;
  const reference = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `local-ai-model-page-interest${suffix}.json`), 'utf8'));
  const payload = buildWindow(windowKey, raw, geonames, catalogue, shard, reference.period);
  fs.writeFileSync(path.join(ROOT, 'data', `local-ai-admin2-model-activity${suffix}.json`), `${JSON.stringify(payload, null, 2)}\n`);
}
