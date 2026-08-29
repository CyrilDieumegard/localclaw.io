const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PAGE_PATH = 'local-ai-activity-index.html';
const DATA_PATH = 'data/local-ai-activity-index.json';
const SCRIPT_PATH = 'js/local-ai-activity-index.js';
const STYLE_PATH = 'css/local-ai-activity-index.css';
const VENDOR_PATH = 'js/vendor/three.module.min.js';
const VENDOR_LICENSE_PATH = 'js/vendor/THREE-LICENSE.txt';
const GEOJSON_PATH = 'data/ne_50m_admin_0_countries.geojson';
const US_GEOJSON_PATH = 'data/us-states-2024-20m.geojson';
const CANONICAL_URL = 'https://localclaw.io/local-ai-activity-index';
const DATA_URL = 'https://localclaw.io/data/local-ai-activity-index.json';
const EXPECTED_TITLE = 'Local AI Activity Index: Global Interest Map | LocalClaw';
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
const css = readFile(STYLE_PATH, 'activity-index stylesheet');
const vendor = readFile(VENDOR_PATH, 'vendored Three.js module');
const vendorLicense = readFile(VENDOR_LICENSE_PATH, 'Three.js vendor license');
const geojsonText = readFile(GEOJSON_PATH, 'country GeoJSON');
const usGeojsonText = readFile(US_GEOJSON_PATH, 'U.S. state GeoJSON');
const sitemapCore = readFile('sitemap-core.xml', 'core sitemap');
const sitemapIndex = readFile('sitemap.xml', 'sitemap index');
const sitemapGenerator = readFile('scripts/generate-sitemap.js', 'sitemap generator');

const data = parseJson(dataText, 'activity-index dataset');
const geojson = parseJson(geojsonText, 'country GeoJSON');
const usGeojson = parseJson(usGeojsonText, 'U.S. state GeoJSON');

if (html !== null) {
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

  const buttonTags = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)].map(match => match[0]);
  for (const action of ['in', 'out', 'reset']) {
    if (!buttonTags.some(tag => attribute(tag, 'data-atlas-zoom') === action)) {
      issue(`Missing visible Atlas zoom control: ${action}`);
    }
  }
  if (!buttonTags.some(tag => /\bdata-atlas-tour\b/i.test(tag))) issue('Missing top-10 guided tour control');
  for (const view of ['installed', 'active']) {
    const control = buttonTags.find(tag => attribute(tag, 'data-atlas-view') === view);
    const label = view[0].toUpperCase() + view.slice(1);
    if (!control) {
      issue(`Missing ${label} activity control`);
      continue;
    }
    if (!/\bdata-coming-soon\b/i.test(control)) issue(`${label} control must be marked data-coming-soon`);
    if (attribute(control, 'aria-pressed') !== 'false') issue(`${label} control must not be presented as active`);
    if (!(attribute(control, 'aria-label') || '').toLowerCase().includes('coming soon')) {
      issue(`${label} control must announce that it is coming soon`);
    }
    if (textContent(control) !== label) issue(`${label} control has unexpected visible text`);
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
    if (!String(datasetNode.description || '').toLowerCase().includes('does not measure verified')) {
      issue('Dataset JSON-LD must retain the verified-use limitation');
    }
    if (!String(datasetNode.measurementTechnique || '').includes('DataFast')) {
      issue('Dataset JSON-LD must disclose the DataFast measurement technique');
    }
    if (datasetNode.spatialCoverage !== 'Worldwide') issue('Dataset JSON-LD must declare worldwide coverage');
    const distributions = Array.isArray(datasetNode.distribution) ? datasetNode.distribution : [datasetNode.distribution];
    if (!distributions.some(distribution => distribution?.contentUrl === DATA_URL && distribution?.encodingFormat === 'application/json')) {
      issue('Dataset JSON-LD must expose the canonical JSON download');
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

if (app !== null) {
  if (!/import\s+\*\s+as\s+THREE\s+from\s+["']\.\/vendor\/three\.module\.min\.js["']/.test(app)) {
    issue('Activity-index JavaScript must import the vendored Three.js module');
  }
  if (!app.includes("const DATA_URL = '/data/local-ai-activity-index.json?")) {
    issue('Activity-index JavaScript does not load the versioned JSON dataset');
  }
  if (!app.includes("const WORLD_URL = '/data/ne_50m_admin_0_countries.geojson?")) {
    issue('Activity-index JavaScript must load the versioned Natural Earth 50m country GeoJSON');
  }
  if (app.includes('ne_110m_admin_0_countries')) {
    issue('Activity-index JavaScript must not reference the retired Natural Earth 110m country GeoJSON');
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
  if (!app.includes('const maximumVisible = window.innerWidth < 760 ? 56 : state.cityClusters.length')) {
    issue('Desktop Atlas must render every validated published city cluster');
  }
  const desktopTextureWidth = Number(app.match(/const\s+DESKTOP_TEXTURE_WIDTH\s*=\s*(\d+)\s*;/)?.[1]);
  const mobileTextureWidth = Number(app.match(/const\s+MOBILE_TEXTURE_WIDTH\s*=\s*(\d+)\s*;/)?.[1]);
  if (!Number.isFinite(desktopTextureWidth) || desktopTextureWidth < 4096) {
    issue('Desktop Atlas textures must be at least 4096 pixels wide');
  }
  if (!Number.isFinite(mobileTextureWidth) || mobileTextureWidth < 2048) {
    issue('Mobile Atlas textures must be at least 2048 pixels wide');
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

if (errors.length) {
  console.error(`Local AI Activity Index validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Local AI Activity Index validation passed: Natural Earth 50m boundaries, 4096×2048 desktop textures, 3,337 observed signals, 62 privacy-thresholded countries, 30 published U.S. states, and 90 exact GeoNames city clusters (1,591 signals) verified.');
