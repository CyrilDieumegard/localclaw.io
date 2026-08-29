const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE_PATH = 'local-ai-activity-index.html';
const DATA_PATH = 'data/local-ai-activity-index.json';
const SCRIPT_PATH = 'js/local-ai-activity-index.js';
const STYLE_PATH = 'css/local-ai-activity-index.css';
const VENDOR_PATH = 'js/vendor/three.module.min.js';
const VENDOR_LICENSE_PATH = 'js/vendor/THREE-LICENSE.txt';
const GEOJSON_PATH = 'data/ne_110m_admin_0_countries.geojson';
const US_GEOJSON_PATH = 'data/us-states-2024-20m.geojson';
const CANONICAL_URL = 'https://localclaw.io/local-ai-activity-index';
const DATA_URL = 'https://localclaw.io/data/local-ai-activity-index.json';
const EXPECTED_TITLE = 'Local AI Activity Index: Global Interest Map | LocalClaw';
const EXPECTED_H1 = 'See where local AI is taking off.';
const EXPECTED_SIGNALS = 3337;
const EXPECTED_REGIONS = 113;
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
  if (data.totals?.regions !== EXPECTED_REGIONS) issue(`Expected ${EXPECTED_REGIONS} total regions`);

  const countries = Array.isArray(data.countries) ? data.countries : [];
  if (countries.length !== EXPECTED_REGIONS) issue(`Expected ${EXPECTED_REGIONS} country records, found ${countries.length}`);
  const signalSum = countries.reduce((sum, country) => sum + Number(country.signals || 0), 0);
  if (signalSum !== EXPECTED_SIGNALS) issue(`Country signals sum to ${signalSum}, expected ${EXPECTED_SIGNALS}`);
  if (new Set(countries.map(country => country.name)).size !== countries.length) issue('Country names must be unique');

  countries.forEach((country, index) => {
    if (country.rank !== index + 1) issue(`Country ranking is not contiguous at position ${index + 1}`);
    if (!country.name || !Number.isInteger(country.signals) || country.signals < 1) {
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
    if (regions[0]?.name !== 'Oregon' || regions[0]?.qualityFlag !== 'network-location-cluster') {
      issue('Oregon must retain its network-location quality flag');
    }
  }
}

if (app !== null) {
  if (!/import\s+\*\s+as\s+THREE\s+from\s+["']\.\/vendor\/three\.module\.min\.js["']/.test(app)) {
    issue('Activity-index JavaScript must import the vendored Three.js module');
  }
  if (!app.includes("const DATA_URL = '/data/local-ai-activity-index.json?")) {
    issue('Activity-index JavaScript does not load the versioned JSON dataset');
  }
  if (!app.includes("const WORLD_URL = '/data/ne_110m_admin_0_countries.geojson?")) {
    issue('Activity-index JavaScript does not load the versioned country GeoJSON');
  }
  if (!app.includes("const US_STATES_URL = '/data/us-states-2024-20m.geojson?")) {
    issue('Activity-index JavaScript does not load the versioned U.S. state GeoJSON');
  }
  if (!app.includes('function enterUnitedStates(') || !app.includes('function focusRegion(')) {
    issue('Activity-index JavaScript is missing the U.S. state drill-down interactions');
  }
}

if (css !== null) {
  if (!css.includes('.atlas-page')) issue('Activity-index stylesheet is missing the page scope');
  if (!css.includes('.atlas-stage')) issue('Activity-index stylesheet is missing the full-screen stage styles');
  if (!css.includes('.atlas-region-panel')) issue('Activity-index stylesheet is missing the U.S. state panel');
}
if (vendor !== null && vendor.length < 100000) issue('Vendored Three.js module is unexpectedly small');
if (vendorLicense !== null && !/three\.js|MIT/i.test(vendorLicense)) issue('Three.js vendor license is not recognizable');
if (geojson) {
  if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features) || geojson.features.length < 100) {
    issue('Country GeoJSON must be a non-trivial FeatureCollection');
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

console.log('Local AI Activity Index validation passed: canonical page, honest interest boundary, 3,337 global signals, 30 published U.S. states, official boundaries, structured data, controls, assets and sitemap verified.');
