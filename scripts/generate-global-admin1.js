const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const inputPath = process.argv[2] || process.env.LOCALCLAW_ADMIN1_SOURCE;
const outputDirectory = path.join(ROOT, 'data', 'admin1');
const manifestPath = path.join(outputDirectory, 'manifest.json');
const generatedAt = process.env.LOCALCLAW_ADMIN1_GENERATED_AT || '2026-08-29T19:00:00.000Z';
const worldPath = path.join(ROOT, 'data', 'ne_50m_admin_0_countries.geojson');

if (!inputPath) {
  throw new Error('Usage: node scripts/generate-global-admin1.js /absolute/path/to/ne_10m_admin_1.geojson');
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function geometryPositions(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return array(geometry.coordinates).flat(1);
  if (geometry.type === 'MultiPolygon') return array(geometry.coordinates).flat(2);
  return [];
}

function featureBounds(feature) {
  const positions = geometryPositions(feature.geometry);
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const point of positions) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const lon = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    bounds[0] = Math.min(bounds[0], lon);
    bounds[1] = Math.min(bounds[1], lat);
    bounds[2] = Math.max(bounds[2], lon);
    bounds[3] = Math.max(bounds[3], lat);
  }
  return bounds.every(Number.isFinite) ? bounds : null;
}

function mergeBounds(current, next) {
  if (!next) return current;
  if (!current) return [...next];
  return [
    Math.min(current[0], next[0]),
    Math.min(current[1], next[1]),
    Math.max(current[2], next[2]),
    Math.max(current[3], next[3])
  ];
}

function countPositions(feature) {
  return geometryPositions(feature.geometry).length;
}

function canonicalProperties(feature) {
  const properties = feature.properties || {};
  return {
    adm0_a3: String(properties.adm0_a3 || properties.ADM0_A3 || '').trim().toUpperCase(),
    admin: String(properties.admin || properties.ADMIN || '').trim(),
    adm1_code: String(properties.adm1_code || properties.ADM1_CODE || '').trim(),
    iso_3166_2: String(properties.iso_3166_2 || properties.ISO_3166_2 || '').trim(),
    geonunit: String(properties.geonunit || properties.GEONUNIT || '').trim(),
    name: String(properties.name || properties.NAME || properties.name_en || properties.NAME_EN || '').trim(),
    name_en: String(properties.name_en || properties.NAME_EN || properties.name || properties.NAME || '').trim(),
    name_local: String(properties.name_local || properties.NAME_LOCAL || '').trim(),
    type: String(properties.type || properties.TYPE || properties.type_en || properties.TYPE_EN || '').trim(),
    type_en: String(properties.type_en || properties.TYPE_EN || properties.type || properties.TYPE || '').trim(),
    ne_id: Number(properties.ne_id || properties.NE_ID)
  };
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const source = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
if (source.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
  throw new Error('Admin-1 source must be a GeoJSON FeatureCollection.');
}
const world = JSON.parse(fs.readFileSync(worldPath, 'utf8'));
const worldCountryCodes = new Set(array(world.features)
  .map(feature => String(feature.properties?.ADM0_A3 || '').trim().toUpperCase())
  .filter(Boolean));
const worldCountryNames = new Map(array(world.features).map(feature => {
  const properties = feature.properties || {};
  const code = String(properties.ADM0_A3 || '').trim().toUpperCase();
  const name = String(properties.NAME_EN || properties.ADMIN || properties.NAME || code).trim();
  return [code, name];
}));

const byCountry = new Map();
for (const rawFeature of source.features) {
  if (!String(rawFeature.properties?.name || '').trim()) continue;
  const properties = canonicalProperties(rawFeature);
  if (!properties.adm0_a3 || !worldCountryCodes.has(properties.adm0_a3) || !properties.name) continue;
  if (!['Polygon', 'MultiPolygon'].includes(rawFeature.geometry?.type)) continue;
  if (!Number.isInteger(properties.ne_id) || properties.ne_id < 1) {
    throw new Error(`Invalid Natural Earth ID for ${properties.adm0_a3}/${properties.name}`);
  }
  const feature = {
    type: 'Feature',
    properties,
    geometry: rawFeature.geometry
  };
  if (!byCountry.has(properties.adm0_a3)) byCountry.set(properties.adm0_a3, []);
  byCountry.get(properties.adm0_a3).push(feature);
}

if (byCountry.size !== worldCountryCodes.size) {
  throw new Error(`Found ${byCountry.size} Admin-0 groups for ${worldCountryCodes.size} world countries.`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const manifestCountries = {};
const expectedShardNames = new Set([...byCountry.keys()].map(code => `${code.toLowerCase()}.geojson`));
let totalFeatures = 0;
let totalPositions = 0;
const selectedFeatures = [];

for (const [code, countryFeatures] of [...byCountry.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  const typedFeatures = countryFeatures.filter(feature => feature.properties.type_en);
  let features = typedFeatures.length ? typedFeatures : countryFeatures;
  const prefixCounts = new Map();
  for (const feature of features) {
    const isoCode = feature.properties.iso_3166_2.trim().toUpperCase();
    const prefix = isoCode.match(/^([A-Z]{2})-/)?.[1] || '';
    if (prefix) prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
  }
  if (prefixCounts.size > 0) {
    const dominantPrefix = [...prefixCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0][0];
    features = features.filter(feature => feature.properties.iso_3166_2.trim().toUpperCase().startsWith(`${dominantPrefix}-`));
  }
  features.sort((left, right) => {
    const leftCode = left.properties.iso_3166_2 || left.properties.adm1_code;
    const rightCode = right.properties.iso_3166_2 || right.properties.adm1_code;
    return leftCode.localeCompare(rightCode) || left.properties.name_en.localeCompare(right.properties.name_en);
  });
  let bbox = null;
  let coordinatePositionCount = 0;
  const typeCounts = new Map();
  for (const feature of features) {
    bbox = mergeBounds(bbox, featureBounds(feature));
    coordinatePositionCount += countPositions(feature);
    const type = feature.properties.type_en || feature.properties.type || 'Region';
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  }
  const filename = `${code.toLowerCase()}.geojson`;
  const payload = {
    type: 'FeatureCollection',
    name: `ne_10m_admin_1_${code.toLowerCase()}`,
    adm0A3: code,
    bbox,
    features
  };
  const content = `${JSON.stringify(payload)}\n`;
  fs.writeFileSync(path.join(outputDirectory, filename), content);
  const countryName = worldCountryNames.get(code) || features.map(feature => feature.properties.admin).find(Boolean) || code;
  manifestCountries[code] = {
    code,
    name: countryName,
    path: `/data/admin1/${filename}`,
    featureCount: features.length,
    coordinatePositionCount,
    bbox,
    types: [...typeCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([type, count]) => ({ type, count })),
    sha256: sha256(content)
  };
  totalFeatures += features.length;
  totalPositions += coordinatePositionCount;
  selectedFeatures.push(...features);
}

for (const filename of fs.readdirSync(outputDirectory)) {
  if (/^[a-z0-9]{3}\.geojson$/.test(filename) && !expectedShardNames.has(filename)) {
    fs.unlinkSync(path.join(outputDirectory, filename));
  }
}

const fingerprintFeatures = [...selectedFeatures].sort((left, right) => {
  const leftKey = `${left.properties.adm0_a3}|${left.properties.adm1_code}`;
  const rightKey = `${right.properties.adm0_a3}|${right.properties.adm1_code}`;
  return leftKey.localeCompare(rightKey);
});
const geometryFingerprint = sha256(fingerprintFeatures.map(feature => (
  `${feature.properties.adm0_a3}|${feature.properties.adm1_code}|${JSON.stringify(feature.geometry)}`
)).join('\n'));
const recordFingerprint = sha256(fingerprintFeatures.map(feature => {
  const properties = feature.properties;
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

const manifest = {
  schemaVersion: 1,
  generatedAt,
  source: {
    provider: 'Natural Earth',
    dataset: 'Admin 1 - States, Provinces',
    sourceLayer: 'ne_10m_admin_1_states_provinces',
    scale: '1:10m',
    version: '5.1.1',
    sourcePage: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/',
    downloadUrl: 'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip',
    archiveSha256: 'efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05',
    license: 'Public domain',
    attribution: 'Made with Natural Earth',
    worldview: 'Natural Earth default de facto boundaries',
    filter: 'Named polygons; typed features preferred per country, named fallback where Natural Earth omits type; dominant ISO prefix; no geometry simplification'
  },
  totals: {
    countries: Object.keys(manifestCountries).length,
    subdivisions: totalFeatures,
    coordinatePositionCount: totalPositions,
    singleFeatureCountries: Object.values(manifestCountries).filter(country => country.featureCount === 1).length,
    multiFeatureCountries: Object.values(manifestCountries).filter(country => country.featureCount > 1).length,
    geometryFingerprint,
    recordFingerprint
  },
  countries: manifestCountries
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
console.log(`Generated ${manifest.totals.subdivisions} Admin-1 subdivisions in ${manifest.totals.countries} lazy country shards.`);
