const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rawPath = process.argv[2];
const outputPath = process.argv[3];
const geoNamesPath = process.argv[4] || '/private/tmp/geonames-cities15000/cities15000.txt';
const threshold = 5;

if (!rawPath || !outputPath) {
  throw new Error('Usage: node scripts/generate-atlas-period-dataset.js RAW_JSON OUTPUT_JSON [GEONAMES_CITIES15000]');
}

const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'));
const world = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ne_50m_admin_0_countries.geojson'), 'utf8'));
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'us-states-2024-20m.geojson'), 'utf8'));
const current = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'local-ai-activity-index.json'), 'utf8'));
const china = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'admin1', 'chn.geojson'), 'utf8'));
const russia = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'admin1', 'rus.geojson'), 'utf8'));

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

const countryAliases = new Map([
  ['United States', ['United States of America', 'United States']],
  ['Russia', ['Russia', 'Russian Federation']],
  ['South Korea', ['South Korea', 'Republic of Korea']],
  ['Viet Nam', ['Vietnam', 'Viet Nam']],
  ['Hong Kong', ['Hong Kong S.A.R.', 'Hong Kong']],
  ['Czechia', ['Czechia', 'Czech Republic']],
  ['Turkey', ['Turkey', 'Türkiye']],
  ['Bolivia', ['Bolivia']],
  ['Tanzania', ['United Republic of Tanzania', 'Tanzania']],
  ['Syrian Arab Republic', ['Syria', 'Syrian Arab Republic']],
  ['Moldova', ['Moldova', 'Republic of Moldova']],
  ['Réunion', ['Reunion', 'Réunion']]
]);

function worldFeature(countryName) {
  const expected = countryAliases.get(countryName) || [countryName];
  return world.features.find(feature => expected.some(name => [
    feature.properties?.ADMIN,
    feature.properties?.NAME,
    feature.properties?.NAME_EN,
    feature.properties?.NAME_LONG
  ].includes(name)));
}

function alpha2(countryName) {
  const feature = worldFeature(countryName);
  return [feature?.properties?.ISO_A2, feature?.properties?.ISO_A2_EH, feature?.properties?.WB_A2, feature?.properties?.POSTAL]
    .map(value => String(value || '').trim().toUpperCase())
    .find(value => /^[A-Z]{2}$/.test(value)) || '';
}

const countryRows = raw.countries.map(row => ({ name: row.country, signals: Number(row.visitors) || 0 }));
const publishedCountries = countryRows.filter(row => row.signals >= threshold && worldFeature(row.name));
publishedCountries.sort((a, b) => b.signals - a.signals || a.name.localeCompare(b.name));
publishedCountries.forEach((row, index) => { row.rank = index + 1; });

const statesByName = new Map(states.features.map(feature => [feature.properties.NAME, feature.properties.STUSPS]));
const countrySignals = new Map(countryRows.map(row => [row.name, row.signals]));

function regionTotals(countryName, rows) {
  const countryTotal = countrySignals.get(countryName) || 0;
  const geolocatedSignals = rows.reduce((sum, row) => sum + Number(row.visitors || 0), 0);
  const publicRows = rows.filter(row => Number(row.visitors) >= threshold);
  const publishedSignals = publicRows.reduce((sum, row) => sum + Number(row.visitors || 0), 0);
  return {
    countrySignals: countryTotal,
    geolocatedSignals,
    observedRegions: rows.length,
    publishedSignals,
    publishedRegions: publicRows.length,
    withheldSignals: geolocatedSignals - publishedSignals,
    unassignedSignals: Math.max(0, countryTotal - geolocatedSignals)
  };
}

const usRaw = raw.breakdowns['United States']?.regions || [];
const usCities = raw.breakdowns['United States']?.cities || [];
const theDallesSignals = Number(usCities.find(row => row.city === 'The Dalles')?.visitors || 0);
const usRegions = usRaw.filter(row => Number(row.visitors) >= threshold).map(row => {
  const code = statesByName.get(row.region);
  if (!code) throw new Error(`No U.S. state code for ${row.region}`);
  const region = { name: row.region, code, signals: Number(row.visitors) };
  if (row.region === 'Oregon' && theDallesSignals >= threshold) {
    region.qualityFlag = 'network-location-cluster';
    region.qualityNote = `${theDallesSignals} of ${region.signals} signals resolve to The Dalles; interpret as a network-location cluster, not a resident count.`;
  }
  return region;
}).sort((a, b) => b.signals - a.signals || a.name.localeCompare(b.name));
usRegions.forEach((region, index) => { region.rank = index + 1; });

function chinaFeature(sourceName) {
  const special = new Map([
    ['Xinjiang Uygur Zizhiqu', 'Xinjiang'],
    ['Guangxi Zhuangzu Zizhiqu', 'Guangxi'],
    ['Nei Mongol Zizhiqu', 'Inner Mongolia']
  ]);
  const simplified = special.get(sourceName) || sourceName.replace(/\s+(Sheng|Shi|Zizhiqu)$/i, '');
  const key = normalize(simplified);
  return china.features.find(feature => [feature.properties?.name, feature.properties?.name_en].some(name => normalize(name) === key));
}

const russianRegionMap = new Map([
  ['Moskva', 'RUS-2365'],
  ["Moskovskaya oblast'", 'RUS-2364'],
  ['Sankt-Peterburg', 'RUS-2337'],
  ["Nizhegorodskaya oblast'", 'RUS-2357'],
  ["Yaroslavskaya oblast'", 'RUS-2360']
]);

function russianFeature(sourceName) {
  const direct = russianRegionMap.get(sourceName);
  if (direct) return russia.features.find(feature => feature.properties?.adm1_code === direct);
  const simplified = sourceName
    .replace(/,\s*Respublika$/i, '')
    .replace(/skaya oblast'$/i, '')
    .replace(/skiy kray$/i, '')
    .replace(/ya$/i, '')
    .trim();
  const key = normalize(simplified);
  return russia.features.find(feature => [feature.properties?.name, feature.properties?.name_en].some(name => normalize(name).startsWith(key)));
}

function nationalDetail(countryName, division, boundarySource, featureResolver) {
  const rows = raw.breakdowns[countryName]?.regions || [];
  const regions = rows.filter(row => Number(row.visitors) >= threshold).map(row => {
    const feature = featureResolver(row.region);
    if (!feature) throw new Error(`No ${countryName} boundary for ${row.region}`);
    return {
      name: feature.properties.name_en || feature.properties.name,
      sourceName: row.region,
      code: feature.properties.iso_3166_2,
      signals: Number(row.visitors)
    };
  }).sort((a, b) => b.signals - a.signals || a.name.localeCompare(b.name));
  regions.forEach((region, index) => { region.rank = index + 1; });
  return {
    division,
    source: `DataFast region breakdown filtered to ${countryName}`,
    boundarySource,
    generatedAt: raw.generatedAt,
    publishThreshold: threshold,
    totals: regionTotals(countryName, rows),
    qualityNotes: [
      'Region is an approximate network location derived by the analytics provider, not verified residence.',
      `Only ${division}s with at least five signals are published on the globe.`,
      'Administrative boundaries remain visible for orientation even when a region count is withheld.'
    ],
    regions
  };
}

const subnational = {
  'United States': {
    division: 'state',
    source: 'DataFast region breakdown filtered to United States',
    boundarySource: 'U.S. Census Bureau 2024 Cartographic Boundary Files, 1:20m',
    publishThreshold: threshold,
    totals: regionTotals('United States', usRaw),
    qualityNotes: [
      'Region and city are approximate network locations derived by the analytics provider, not verified residence.',
      `Oregon is flagged because ${theDallesSignals} of its ${usRegions.find(region => region.name === 'Oregon')?.signals || 0} signals resolve to The Dalles, a concentration that may reflect network or data-center routing rather than local residents.`,
      'Only states with at least five signals are published on the globe.'
    ],
    regions: usRegions
  },
  China: nationalDetail('China', 'province-level administrative region', 'Natural Earth Admin-1 states and provinces, 1:10m', chinaFeature),
  Russia: nationalDetail('Russia', 'federal subject', 'Natural Earth Admin-1 states and provinces, 1:10m', russianFeature)
};

const currentCityBySource = new Map();
for (const cluster of current.cityClusters || []) {
  const sources = Array.isArray(cluster.aggregatedFrom) ? cluster.aggregatedFrom.map(row => row.city) : [cluster.city];
  for (const sourceName of sources) currentCityBySource.set(`${cluster.countryCode}|${normalize(sourceName)}`, cluster);
  currentCityBySource.set(`${cluster.countryCode}|${normalize(cluster.city)}`, cluster);
}

const mergeGroups = new Map([
  ['US|new york', { target: 'New York City', aliases: ['new york', 'staten island', 'brooklyn', 'queens', 'the bronx'] }],
  ['GB|london', { target: 'London', aliases: ['london', 'canary wharf', 'city of london', 'lambeth'] }],
  ['CH|geneva', { target: 'Geneva', aliases: ['geneva', 'thonex', 'grand lancy'] }]
]);
const mergeAlias = new Map();
for (const [key, group] of mergeGroups) {
  const code = key.slice(0, 2);
  for (const alias of group.aliases) mergeAlias.set(`${code}|${normalize(alias)}`, group.target);
}
const canonicalAliases = new Map([
  ['DE|frankfurt am main', 'Frankfurt'],
  ['US|indpls', 'Indianapolis'],
  ['US|st louis', 'St. Louis'],
  ['RU|nizhniy novgorod', 'Nizhny Novgorod']
]);

const wantedByCountry = new Map();
for (const country of publishedCountries) {
  const code = alpha2(country.name);
  const wanted = new Set();
  for (const row of raw.breakdowns[country.name]?.cities || []) {
    if (Number(row.visitors) < threshold) continue;
    const rawKey = `${code}|${normalize(row.city)}`;
    wanted.add(normalize(mergeAlias.get(rawKey) || canonicalAliases.get(rawKey) || row.city));
  }
  wantedByCountry.set(code, wanted);
}

const geoCandidates = new Map();
const geoCandidatesByRegion = new Map();
for (const line of fs.readFileSync(path.resolve(geoNamesPath), 'utf8').split('\n')) {
  if (!line) continue;
  const fields = line.split('\t');
  const code = fields[8];
  const wanted = wantedByCountry.get(code);
  if (!wanted?.size) continue;
  const names = [fields[1], fields[2], ...String(fields[3] || '').split(',')];
  const matching = [...new Set(names.map(normalize).filter(name => wanted.has(name)))];
  if (!matching.length) continue;
  const candidate = {
    geonameId: Number(fields[0]),
    city: fields[1],
    lat: Number(fields[4]),
    lon: Number(fields[5]),
    countryCode: code,
    regionCode: fields[10] || '',
    population: Number(fields[14]) || 0
  };
  for (const name of matching) {
    const key = `${code}|${name}`;
    const previous = geoCandidates.get(key);
    if (!previous || candidate.population > previous.population) geoCandidates.set(key, candidate);
    if (candidate.regionCode) {
      const regionKey = `${code}|${candidate.regionCode}|${name}`;
      const previousRegion = geoCandidatesByRegion.get(regionKey);
      if (!previousRegion || candidate.population > previousRegion.population) geoCandidatesByRegion.set(regionKey, candidate);
    }
  }
}

function resolveCity(countryName, sourceName, regionName = '') {
  const code = alpha2(countryName);
  const expectedRegionCode = code === 'US' ? statesByName.get(regionName) || '' : '';
  const rawKey = `${code}|${normalize(sourceName)}`;
  const target = mergeAlias.get(rawKey) || canonicalAliases.get(rawKey) || sourceName;
  const currentMatch = currentCityBySource.get(rawKey) || currentCityBySource.get(`${code}|${normalize(target)}`);
  if (currentMatch && (!expectedRegionCode || currentMatch.regionCode === expectedRegionCode)) return {
    geonameId: currentMatch.geonameId,
    city: currentMatch.city,
    lat: currentMatch.lat,
    lon: currentMatch.lon,
    countryCode: code,
    regionCode: currentMatch.regionCode || ''
  };
  if (expectedRegionCode) {
    const regional = geoCandidatesByRegion.get(`${code}|${expectedRegionCode}|${normalize(target)}`);
    if (regional) return regional;
  }
  return geoCandidates.get(`${code}|${normalize(target)}`) || null;
}

const clustersByGeoName = new Map();
const unresolvedCities = [];
for (const country of publishedCountries) {
  const rows = raw.breakdowns[country.name]?.cities || [];
  for (const row of rows) {
    const signals = Number(row.visitors);
    if (signals < threshold) continue;
    const resolved = resolveCity(country.name, row.city, row.region);
    if (!resolved) {
      unresolvedCities.push(`${country.name}|${row.city}|${signals}`);
      continue;
    }
    const key = `${resolved.countryCode}|${resolved.geonameId}`;
    let cluster = clustersByGeoName.get(key);
    if (!cluster) {
      const stateFeature = resolved.countryCode === 'US'
        ? states.features.find(feature => feature.properties.STUSPS === resolved.regionCode)
        : null;
      cluster = {
        city: resolved.city,
        country: country.name,
        countryCode: resolved.countryCode,
        ...(stateFeature ? { region: stateFeature.properties.NAME, regionCode: resolved.regionCode } : {}),
        signals: 0,
        lat: resolved.lat,
        lon: resolved.lon,
        geonameId: resolved.geonameId,
        coordinateKind: 'city-centroid',
        locationKind: 'approximate-network-city',
        _sources: []
      };
      clustersByGeoName.set(key, cluster);
    }
    cluster.signals += signals;
    cluster._sources.push({ city: row.city, signals });
  }
}

const cityClusters = [...clustersByGeoName.values()].map(cluster => {
  if (cluster._sources.length > 1 || normalize(cluster._sources[0]?.city) !== normalize(cluster.city)) {
    cluster.aggregatedFrom = cluster._sources;
  }
  if (cluster.countryCode === 'US' && cluster.city === 'The Dalles') {
    cluster.qualityFlags = ['network-location-cluster'];
  }
  delete cluster._sources;
  return cluster;
}).sort((a, b) => b.signals - a.signals || a.country.localeCompare(b.country) || a.city.localeCompare(b.city));

const observedSignals = countryRows.reduce((sum, row) => sum + row.signals, 0);
const publishedSignals = publishedCountries.reduce((sum, row) => sum + row.signals, 0);
const periodDays = Math.round((Date.parse(`${raw.period.end}T00:00:00Z`) - Date.parse(`${raw.period.start}T00:00:00Z`)) / 86400000) + 1;
const labels = { '90d': 'Last 3 months', '180d': 'Last 6 months' };
const payload = {
  schemaVersion: 2,
  indexName: 'Local AI Activity Index',
  view: 'interest',
  status: 'beta',
  source: 'Aggregated anonymous LocalClaw website traffic measured by DataFast',
  sourceUrl: 'https://localclaw.io/local-ai-activity-index#methodology',
  metric: 'unique visitors',
  claimBoundary: 'Interest signals only; not verified installations, model launches, or inference events.',
  timezone: raw.period.timezone,
  period: {
    start: raw.period.start,
    end: raw.period.end,
    label: labels[raw.key] || `${periodDays} days`,
    key: raw.key,
    days: periodDays
  },
  generatedAt: raw.generatedAt,
  totals: {
    signals: observedSignals,
    regions: countryRows.length,
    observedSignals,
    observedRegions: countryRows.length,
    publishedSignals,
    publishedRegions: publishedCountries.length,
    withheldSignals: observedSignals - publishedSignals,
    withheldRegions: countryRows.length - publishedCountries.length
  },
  countries: publishedCountries,
  subnational,
  cityClusterMethodology: {
    source: 'DataFast city breakdowns filtered by country',
    metric: 'unique visitors',
    publishThreshold: threshold,
    generatedAt: raw.generatedAt,
    coordinateSource: 'GeoNames cities15000',
    coordinateAttribution: 'GeoNames geographical database (cities15000)',
    coordinateSourceUrl: 'https://download.geonames.org/export/dump/cities15000.zip',
    coordinateLicense: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
    coordinateLicenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    coordinateKind: 'city-centroid',
    locationKind: 'approximate-network-city',
    privacyNote: 'Only DataFast city aggregates with at least five signals are included; no person, device, IP address, or exact event location is exposed.',
    mappingNote: `${unresolvedCities.length} thresholded city rows without an unambiguous GeoNames cities15000 match are omitted from the beacon layer, while their signals remain in parent polygon aggregates.`,
    remainderTreatment: 'Signals outside published city clusters remain implicit and are represented only by their parent country or published regional polygon total.'
  },
  cityClusters
};

fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.resolve(outputPath),
  period: payload.period,
  countries: publishedCountries.length,
  signals: observedSignals,
  cityClusters: cityClusters.length,
  unresolvedCities: unresolvedCities.length,
  unresolvedCitySamples: unresolvedCities.slice(0, 20)
}, null, 2));
