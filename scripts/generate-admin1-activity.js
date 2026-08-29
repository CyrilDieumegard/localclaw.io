const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rawPath = process.argv[2] || process.env.LOCALCLAW_DATAFAST_REGIONS_SOURCE;
const threshold = 5;

if (!rawPath) {
  throw new Error('Usage: node scripts/generate-admin1-activity.js /absolute/path/to/private-datafast-regions.json');
}

const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'local-ai-activity-index.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'));
const world = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ne_50m_admin_0_countries.geojson'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'admin1', 'manifest.json'), 'utf8'));

const countryAliases = new Map([
  ['United States', ['United States of America', 'United States']],
  ['Russia', ['Russia', 'Russian Federation']],
  ['South Korea', ['South Korea', 'Republic of Korea']],
  ['Viet Nam', ['Vietnam', 'Viet Nam']],
  ['Hong Kong', ['Hong Kong S.A.R.', 'Hong Kong']],
  ['Czechia', ['Czechia', 'Czech Republic']],
  ['Turkey', ['Turkey', 'Türkiye']]
]);

const aliases = new Map(Object.entries({
  'United States|Washington': 'USA-3519',
  'China|Beijing Shi': 'CHN-1155',
  'China|Guangdong Sheng': 'CHN-1180',
  'China|Shanghai Shi': 'CHN-1819',
  'China|Jiangsu Sheng': 'CHN-1818',
  'India|IN-TS': 'IND-20011',
  'Spain|Madrid, Comunidad de': 'ESP-5833',
  'Poland|Mazowieckie': 'POL-3148',
  'Poland|Śląskie': 'POL-3146',
  'Sweden|Stockholms län': 'SWE-194',
  'Sweden|Västra Götalands län': 'SWE-3428',
  'Czechia|Praha, Hlavní město': 'CZE-1595',
  'Thailand|Krung Thep Maha Nakhon': 'THA-416',
  'Denmark|Region Hovedstaden': 'DNK-3419',
  'Denmark|Region Midjylland': 'DNK-3416',
  'Romania|București': 'ROU-128',
  'Malaysia|Wilayah Persekutuan Kuala Lumpur': 'MYS-4831',
  'South Africa|Kapa-Vupeladyambu': 'ZAF-1188',
  'Bulgaria|Sofia (stolitsa)': 'BGR-2243',
  'Colombia|Distrito Capital de Bogotá': 'COL-1399',
  'Estonia|Harjumaa': 'EST-1654',
  'Ukraine|Kyiv': 'UKR-4826'
}));

const composites = new Map(Object.entries({
  'United Kingdom|England': { field: 'geonunit', values: ['England'], expectedFeatureCount: 152 },
  'France|Île-de-France': { field: 'iso_3166_2', values: ['FR-75', 'FR-77', 'FR-78', 'FR-91', 'FR-92', 'FR-93', 'FR-94', 'FR-95'], expectedFeatureCount: 8 },
  'France|Occitanie': { field: 'iso_3166_2', values: ['FR-09', 'FR-11', 'FR-12', 'FR-30', 'FR-31', 'FR-32', 'FR-34', 'FR-46', 'FR-48', 'FR-65', 'FR-66', 'FR-81', 'FR-82'], expectedFeatureCount: 13 },
  'France|Auvergne-Rhône-Alpes': { field: 'iso_3166_2', values: ['FR-01', 'FR-03', 'FR-07', 'FR-15', 'FR-26', 'FR-38', 'FR-42', 'FR-43', 'FR-63', 'FR-69', 'FR-73', 'FR-74'], expectedFeatureCount: 12 },
  'Italy|Lombardia': { field: 'iso_3166_2', values: ['IT-BG', 'IT-BS', 'IT-CO', 'IT-CR', 'IT-LC', 'IT-LO', 'IT-MN', 'IT-MI', 'IT-MB', 'IT-PV', 'IT-SO', 'IT-VA'], expectedFeatureCount: 12 },
  'Italy|Emilia-Romagna': { field: 'iso_3166_2', values: ['IT-BO', 'IT-FE', 'IT-FC', 'IT-MO', 'IT-PC', 'IT-PR', 'IT-RA', 'IT-RE', 'IT-RN'], expectedFeatureCount: 9 },
  'Italy|Veneto': { field: 'iso_3166_2', values: ['IT-BL', 'IT-PD', 'IT-RO', 'IT-TV', 'IT-VE', 'IT-VR', 'IT-VI'], expectedFeatureCount: 7 },
  'Spain|Catalunya': { field: 'iso_3166_2', values: ['ES-B', 'ES-GI', 'ES-L', 'ES-T'], expectedFeatureCount: 4 },
  'Spain|Castilla y León': { field: 'iso_3166_2', values: ['ES-AV', 'ES-BU', 'ES-LE', 'ES-P', 'ES-SA', 'ES-SG', 'ES-SO', 'ES-VA', 'ES-ZA'], expectedFeatureCount: 9 },
  'Spain|Valenciana, Comunidad': { field: 'iso_3166_2', values: ['ES-A', 'ES-CS', 'ES-V'], expectedFeatureCount: 3 },
  'Belgium|Vlaams Gewest': { field: 'iso_3166_2', values: ['BE-VAN', 'BE-VOV', 'BE-VBR', 'BE-VLI', 'BE-VWV'], expectedFeatureCount: 5 },
  'Belgium|Waals Gewest': { field: 'iso_3166_2', values: ['BE-WHT', 'BE-WLG', 'BE-WLX', 'BE-WNA', 'BE-WBR'], expectedFeatureCount: 5 },
  'Ireland|Leinster': { field: 'iso_3166_2', values: ['IE-CW', 'IE-D', 'IE-KE', 'IE-KK', 'IE-LS', 'IE-LD', 'IE-LH', 'IE-MH', 'IE-OY', 'IE-WH', 'IE-WX', 'IE-WW'], expectedFeatureCount: 15 },
  'Philippines|National Capital Region': { field: 'iso_3166_2', values: ['PH-MNL'], expectedFeatureCount: 17 }
}));

const blocked = new Set(['Uzbekistan|Toshkent']);
const shardCache = new Map();

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

function worldFeature(countryName) {
  const expected = countryAliases.get(countryName) || [countryName];
  return world.features.find(feature => expected.some(name => [
    feature.properties?.ADMIN,
    feature.properties?.NAME,
    feature.properties?.NAME_EN,
    feature.properties?.NAME_LONG
  ].includes(name)));
}

function alpha2(feature) {
  return [feature.properties?.ISO_A2, feature.properties?.ISO_A2_EH, feature.properties?.WB_A2, feature.properties?.POSTAL]
    .map(value => String(value || '').trim().toUpperCase())
    .find(value => /^[A-Z]{2}$/.test(value)) || '';
}

function featuresForCountry(adm0A3) {
  if (shardCache.has(adm0A3)) return shardCache.get(adm0A3);
  const entry = manifest.countries[adm0A3];
  if (!entry) throw new Error(`Missing Admin-1 manifest entry for ${adm0A3}`);
  const shardPath = path.join(ROOT, entry.path.replace(/^\//, ''));
  const features = JSON.parse(fs.readFileSync(shardPath, 'utf8')).features;
  shardCache.set(adm0A3, features);
  return features;
}

function namesForFeature(feature) {
  const properties = feature.properties || {};
  return [properties.name, properties.name_en, ...String(properties.name_local || '').split('|')]
    .map(normalize)
    .filter(Boolean);
}

function mapPublishedRegion(countryName, adm0A3, row) {
  const key = `${countryName}|${row.region}`;
  if (blocked.has(key)) return { status: 'blocked' };
  const features = featuresForCountry(adm0A3);
  const composite = composites.get(key);
  if (composite) {
    const expectedValues = new Set(composite.values);
    const matches = features.filter(feature => expectedValues.has(String(feature.properties?.[composite.field] || '')));
    if (matches.length !== composite.expectedFeatureCount) {
      throw new Error(`${key} composite matched ${matches.length}; expected ${composite.expectedFeatureCount}`);
    }
    return {
      status: 'mapped',
      match: 'composite',
      canonicalName: row.region,
      boundaryFeatureIds: matches.map(feature => feature.properties.adm1_code).sort()
    };
  }
  const aliasId = aliases.get(key);
  if (aliasId) {
    const feature = features.find(candidate => candidate.properties?.adm1_code === aliasId);
    if (!feature) throw new Error(`${key} alias target ${aliasId} is missing`);
    return {
      status: 'mapped',
      match: 'alias',
      canonicalName: feature.properties.name_en || feature.properties.name,
      boundaryFeatureIds: [aliasId]
    };
  }
  const expectedName = normalize(row.region);
  const matches = features.filter(feature => namesForFeature(feature).includes(expectedName));
  if (matches.length !== 1) {
    throw new Error(`${key} matched ${matches.length} boundaries`);
  }
  return {
    status: 'mapped',
    match: 'exact',
    canonicalName: matches[0].properties.name_en || matches[0].properties.name,
    boundaryFeatureIds: [matches[0].properties.adm1_code]
  };
}

function legacyCountry(countryName, country, feature) {
  const source = base.subnational?.[countryName];
  if (!source) throw new Error(`Missing legacy ${countryName} subnational record`);
  const adm0A3 = String(feature.properties?.ADM0_A3 || '').trim().toUpperCase();
  const features = featuresForCountry(adm0A3);
  const regions = source.regions.map(region => {
    const match = features.find(candidate => String(candidate.properties?.iso_3166_2 || '').toUpperCase() === String(region.code || '').toUpperCase());
    if (!match) throw new Error(`Legacy ${countryName}/${region.name} has no exact boundary`);
    return {
      rank: region.rank,
      sourceName: region.sourceName || region.name,
      canonicalName: region.name,
      signals: region.signals,
      boundaryMatch: 'legacy-exact',
      boundaryFeatureIds: [match.properties.adm1_code]
    };
  });
  return {
    countryCode: alpha2(feature),
    adm0A3,
    collectionStatus: 'collected',
    publicationStatus: regions.length ? 'published' : 'none_above_threshold',
    snapshotGeneratedAt: source.generatedAt || base.generatedAt,
    countrySignals: country.signals,
    publishedSignals: regions.reduce((total, region) => total + region.signals, 0),
    publishedRegions: regions.length,
    regions
  };
}

const countries = {};
const audit = { exact: 0, alias: 0, composite: 0, blocked: 0 };
for (const country of base.countries) {
  if (country.name === 'United States') continue;
  const feature = worldFeature(country.name);
  if (!feature) throw new Error(`No world boundary for ${country.name}`);
  const adm0A3 = String(feature.properties?.ADM0_A3 || '').trim().toUpperCase();
  if (country.name === 'China' || country.name === 'Russia') {
    countries[country.name] = legacyCountry(country.name, country, feature);
    continue;
  }
  const payload = raw.countries?.[country.name];
  if (!payload || payload.status !== 'success' || !Array.isArray(payload.data)) {
    countries[country.name] = {
      countryCode: alpha2(feature),
      adm0A3,
      collectionStatus: 'unavailable',
      publicationStatus: 'unavailable',
      snapshotGeneratedAt: raw.generatedAt,
      countrySignals: country.signals,
      regions: []
    };
    continue;
  }
  const publicRows = payload.data.filter(row => Number(row.visitors) >= threshold);
  const mapped = [];
  let hasBlockedBoundary = false;
  for (const row of publicRows) {
    const mapping = mapPublishedRegion(country.name, adm0A3, row);
    if (mapping.status === 'blocked') {
      audit.blocked += 1;
      hasBlockedBoundary = true;
      continue;
    }
    audit[mapping.match] += 1;
    mapped.push({
      sourceName: row.region,
      canonicalName: mapping.canonicalName,
      signals: Number(row.visitors),
      boundaryMatch: mapping.match,
      boundaryFeatureIds: mapping.boundaryFeatureIds
    });
  }
  mapped.sort((left, right) => right.signals - left.signals || left.canonicalName.localeCompare(right.canonicalName));
  mapped.forEach((region, index) => { region.rank = index + 1; });
  countries[country.name] = {
    countryCode: alpha2(feature),
    adm0A3,
    collectionStatus: 'collected',
    publicationStatus: hasBlockedBoundary && mapped.length === 0
      ? 'boundary_unresolved'
      : mapped.length ? (hasBlockedBoundary ? 'partially_published' : 'published') : 'none_above_threshold',
    snapshotGeneratedAt: raw.generatedAt,
    countrySignals: country.signals,
    publishedSignals: mapped.reduce((total, region) => total + region.signals, 0),
    publishedRegions: mapped.length,
    regions: mapped
  };
}

const output = {
  schemaVersion: 1,
  generatedAt: raw.generatedAt,
  period: raw.period,
  source: {
    provider: 'DataFast',
    dimension: 'region',
    method: 'Country-filtered regional analytics snapshot',
    snapshotNote: 'Country and regional dimensions may be captured at different times and are not presented as an additive reconciliation.'
  },
  publishThreshold: threshold,
  privacy: {
    rule: 'Only regional rows with at least five signals are included.',
    withheldDetail: 'Counts and identities below the threshold are not included in this public file.'
  },
  countries
};

const outputPath = path.join(ROOT, 'data', 'local-ai-admin1-activity.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated public Admin-1 activity for ${Object.keys(countries).length} countries (${audit.exact} exact, ${audit.alias} aliases, ${audit.composite} composites, ${audit.blocked} blocked).`);
