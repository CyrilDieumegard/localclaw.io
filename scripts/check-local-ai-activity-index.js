const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PAGE_PATH = 'local-ai-activity-index.html';
const DATA_PATH = 'data/local-ai-activity-index.json';
const SCRIPT_PATH = 'js/local-ai-activity-index.js';
const THEME_SCRIPT_PATH = 'js/theme-toggle.js';
const STYLE_PATH = 'css/local-ai-activity-index.css';
const VENDOR_PATH = 'js/vendor/three.module.min.js';
const VENDOR_LICENSE_PATH = 'js/vendor/THREE-LICENSE.txt';
const GEOJSON_PATH = 'data/ne_50m_admin_0_countries.geojson';
const ADMIN1_MANIFEST_PATH = 'data/admin1/manifest.json';
const ADMIN1_ACTIVITY_PATH = 'data/local-ai-admin1-activity.json';
const ADMIN2_MANIFEST_PATH = 'data/admin2/manifest.json';
const US_GEOJSON_PATH = 'data/us-states-2024-20m.geojson';
const CANONICAL_URL = 'https://localclaw.io/local-ai-activity-index';
const DATA_URL = 'https://localclaw.io/data/local-ai-activity-index.json';
const ADMIN1_ACTIVITY_URL = 'https://localclaw.io/data/local-ai-admin1-activity.json';
const ADMIN1_MANIFEST_URL = 'https://localclaw.io/data/admin1/manifest.json';
const EXPECTED_TITLE = 'Local AI Activity Index by Country & Region | LocalClaw';
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
const EXPECTED_ADMIN1_COUNTRIES = 242;
const EXPECTED_ADMIN1_FEATURES = 4558;
const EXPECTED_ADMIN1_COORDINATE_POSITIONS = 1288506;
const EXPECTED_ADMIN1_SINGLE_FEATURE_COUNTRIES = 32;
const EXPECTED_ADMIN1_MULTI_FEATURE_COUNTRIES = 210;
const EXPECTED_ADMIN1_ARCHIVE_SHA256 = 'efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05';
const EXPECTED_ADMIN1_GEOMETRY_FINGERPRINT = '4b4cd08e7186c7f7109bf9880e15799cbf3c401900f8708cfaadaece09589dd4';
const EXPECTED_ADMIN1_RECORD_FINGERPRINT = '381faf9e0bddc4fdf8c74abafdd10ac0d569c2dac83d34e18b7ac8c2318678dc';
const EXPECTED_ADMIN1_ACTIVITY_COUNTRIES = 61;
const EXPECTED_ADMIN1_ACTIVITY_REGIONS = 94;
const EXPECTED_ADMIN1_ACTIVITY_SIGNALS = 1214;
const EXPECTED_ADMIN2_PARENTS = 90;
const EXPECTED_ADMIN2_SUBDIVISIONS = 4047;
const EXPECTED_ADMIN2_COORDINATE_POSITIONS = 584249;
const EXPECTED_ADMIN2_GEOMETRY_FINGERPRINT = '19b8c479bcf0589c138f6bec67a02bd54651dbf5baddbdd6070cb470c7298e4e';
const EXPECTED_ADMIN2_RECORD_FINGERPRINT = 'f6ccf025f72ceb475dfd275b520cd6f4bf169209a423c8c4ffbe2ababdc937a0';
const EXPECTED_ADMIN1_PUBLICATION_STATUSES = new Map([
  ['published', 46],
  ['none_above_threshold', 14],
  ['boundary_unresolved', 1]
]);
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

const expectedChinaRegions = [
  [1, 'Beijing', 'Beijing Shi', 'CN-BJ', 62],
  [2, 'Guangdong', 'Guangdong Sheng', 'CN-GD', 22],
  [3, 'Shanghai', 'Shanghai Shi', 'CN-SH', 7],
  [4, 'Jiangsu', 'Jiangsu Sheng', 'CN-JS', 6]
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

function inspectCoordinatePositions(value, stats = {
  positions: 0,
  invalid: 0,
  minLon: Infinity,
  minLat: Infinity,
  maxLon: -Infinity,
  maxLat: -Infinity
}) {
  if (!Array.isArray(value)) return stats;
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    stats.positions += 1;
    const [lon, lat] = value;
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      stats.invalid += 1;
      return stats;
    }
    stats.minLon = Math.min(stats.minLon, lon);
    stats.minLat = Math.min(stats.minLat, lat);
    stats.maxLon = Math.max(stats.maxLon, lon);
    stats.maxLat = Math.max(stats.maxLat, lat);
    return stats;
  }
  for (const child of value) inspectCoordinatePositions(child, stats);
  return stats;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validBbox(value) {
  return Array.isArray(value)
    && value.length === 4
    && value.every(Number.isFinite)
    && value[0] >= -180
    && value[2] <= 180
    && value[1] >= -90
    && value[3] <= 90
    && value[0] <= value[2]
    && value[1] <= value[3];
}

function coordinateStatsForFeatures(features) {
  return features.reduce(
    (stats, feature) => inspectCoordinatePositions(feature.geometry?.coordinates, stats),
    { positions: 0, invalid: 0, minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity }
  );
}

function bboxFromStats(stats) {
  return [stats.minLon, stats.minLat, stats.maxLon, stats.maxLat];
}

function isPlaceholder(value) {
  return /^(?:|unknown|unnamed|n\/?a|null|none|-99|placeholder|tbd)$/i.test(String(value ?? '').trim());
}

function unexpectedKeys(value, allowedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const allowed = new Set(allowedKeys);
  return Object.keys(value).filter(key => !allowed.has(key));
}

function isIsoTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function validateSubnationalSnapshot(countryName, record, expectedTotals, expectedRegions) {
  if (!record) {
    issue(`Dataset is missing the ${countryName} subnational breakdown`);
    return;
  }
  if (!String(record.source || '').includes('DataFast')) {
    issue(`${countryName} subnational source must identify DataFast`);
  }
  if (record.boundarySource !== 'Natural Earth Admin-1 states and provinces, 1:10m') {
    issue(`${countryName} subnational boundaries must identify Natural Earth Admin-1 at 1:10m`);
  }
  if (record.publishThreshold !== 5) issue(`${countryName} subnational publish threshold must be five signals`);
  for (const [field, expected] of Object.entries(expectedTotals)) {
    if (record.totals?.[field] !== expected) issue(`${countryName} subnational total ${field} must be ${expected}`);
  }
  if (record.totals?.publishedSignals + record.totals?.withheldSignals !== record.totals?.geolocatedSignals) {
    issue(`${countryName} published and withheld regional signals must reconcile to geolocated signals`);
  }
  if (record.totals?.geolocatedSignals + record.totals?.unassignedSignals !== record.totals?.countrySignals) {
    issue(`${countryName} geolocated and unassigned signals must reconcile to the country total`);
  }
  const regions = Array.isArray(record.regions) ? record.regions : [];
  if (regions.length !== expectedTotals.publishedRegions) {
    issue(`${countryName} must expose exactly ${expectedTotals.publishedRegions} published regions`);
  }
  if (regions.reduce((sum, region) => sum + Number(region.signals || 0), 0) !== expectedTotals.publishedSignals) {
    issue(`${countryName} published region rows must reconcile to publishedSignals`);
  }
  const actualRegions = regions.map(region => [region.rank, region.name, region.sourceName, region.code, region.signals]);
  if (JSON.stringify(actualRegions) !== JSON.stringify(expectedRegions)) {
    issue(`${countryName} published regions do not match the approved snapshot`);
  }
  if (regions.some(region => !Number.isInteger(region.signals) || region.signals < record.publishThreshold)) {
    issue(`${countryName} exposes a region below its public privacy threshold`);
  }
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
const themeScript = readFile(THEME_SCRIPT_PATH, 'theme controller JavaScript');
const css = readFile(STYLE_PATH, 'activity-index stylesheet');
const vendor = readFile(VENDOR_PATH, 'vendored Three.js module');
const vendorLicense = readFile(VENDOR_LICENSE_PATH, 'Three.js vendor license');
const geojsonText = readFile(GEOJSON_PATH, 'country GeoJSON');
const admin1ManifestText = readFile(ADMIN1_MANIFEST_PATH, 'worldwide Admin-1 manifest');
const admin1ActivityText = readFile(ADMIN1_ACTIVITY_PATH, 'worldwide Admin-1 activity dataset');
const admin2ManifestText = readFile(ADMIN2_MANIFEST_PATH, 'U.S., China, and Australia deeper-boundary manifest');
const usGeojsonText = readFile(US_GEOJSON_PATH, 'U.S. state GeoJSON');
const sitemapCore = readFile('sitemap-core.xml', 'core sitemap');
const sitemapIndex = readFile('sitemap.xml', 'sitemap index');
const sitemapGenerator = readFile('scripts/generate-sitemap.js', 'sitemap generator');

const data = parseJson(dataText, 'activity-index dataset');
const geojson = parseJson(geojsonText, 'country GeoJSON');
const admin1Manifest = parseJson(admin1ManifestText, 'worldwide Admin-1 manifest');
const admin1Activity = parseJson(admin1ActivityText, 'worldwide Admin-1 activity dataset');
const admin2Manifest = parseJson(admin2ManifestText, 'U.S. and China Admin-2 manifest');
const usGeojson = parseJson(usGeojsonText, 'U.S. state GeoJSON');

if (html !== null) {
  if (!/<html\b[^>]*data-theme-lock=["']dark["']/i.test(html)
    || !/<meta\b[^>]*name=["']color-scheme["'][^>]*content=["']dark["']/i.test(html)) {
    issue('Atlas must declare its page-scoped dark theme lock before first paint');
  }
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
  if (!visibleText.includes('select any mapped country')
    || !visibleText.includes('administrative subdivisions')) {
    issue('Visible copy must explain that every mapped country has an administrative-subdivision drill-down');
  }
  if (!visibleText.includes('4,558') || !visibleText.includes('worldwide')) {
    issue('Visible copy must disclose the worldwide 4,558-subdivision cartographic coverage');
  }
  if (!(visibleText.includes('country-filtered datafast') || visibleText.includes('datafast supplies a country-filtered region breakdown'))
    || !visibleText.includes('rows below five are omitted')) {
    issue('Visible copy must disclose the independent regional source and five-signal omission rule');
  }
  if (!(visibleText.includes('every other subdivision stays neutral')
    || visibleText.includes('county, prefecture, and lga boundaries stay neutral'))) {
    issue('Visible copy must say that subdivisions without a published regional value remain neutral');
  }
  if (!visibleText.includes('3,144') || !visibleText.includes('358') || !visibleText.includes('545')
    || !visibleText.includes('does not publish county, prefecture, or lga totals')) {
    issue('Visible copy must disclose the deeper U.S./China/Australia boundary coverage and absence of detailed activity totals');
  }
  if (!visibleText.includes('explicitly describes its china boundaries as unofficial')
    || !visibleText.includes('cc by 3.0 igo')) {
    issue('Visible copy must disclose the China boundary source status and license');
  }
  if (!visibleText.includes('abs asgs edition 3 local government areas 2025')
    || !visibleText.includes('statistical mesh block approximations')
    || !visibleText.includes('cc by 4.0')) {
    issue('Visible copy must disclose the official ABS Australia LGA source, approximation caveat, and license');
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
    for (const [contentUrl, label] of [
      [DATA_URL, 'country activity'],
      [ADMIN1_ACTIVITY_URL, 'regional activity'],
      [ADMIN1_MANIFEST_URL, 'worldwide boundary manifest']
    ]) {
      if (!distributions.some(distribution => distribution?.contentUrl === contentUrl && distribution?.encodingFormat === 'application/json')) {
        issue(`Dataset JSON-LD must expose the canonical ${label} JSON download`);
      }
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

  const chinaData = data.subnational?.China;
  validateSubnationalSnapshot('China', chinaData, {
    countrySignals: 209,
    geolocatedSignals: 105,
    observedRegions: 10,
    publishedSignals: 97,
    publishedRegions: 4,
    withheldSignals: 8,
    unassignedSignals: 104
  }, expectedChinaRegions);
  if (chinaData?.division !== 'province-level administrative region') {
    issue('China subnational division must remain province-level administrative region');
  }

  const russiaData = data.subnational?.Russia;
  validateSubnationalSnapshot('Russia', russiaData, {
    countrySignals: 27,
    geolocatedSignals: 25,
    observedRegions: 15,
    publishedSignals: 0,
    publishedRegions: 0,
    withheldSignals: 25,
    unassignedSignals: 2
  }, []);
  if (russiaData?.division !== 'federal subject') issue('Russia subnational division must remain federal subject');

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

if (themeScript !== null && (!themeScript.includes("html.getAttribute('data-theme-lock')")
  || !themeScript.includes('if (persist && !lockedTheme)'))) {
  issue('Global theme controller must honor a page-scoped lock without changing the saved site preference');
}

if (css !== null && !css.includes('.atlas-page .lc-theme-switcher')) {
  issue('Atlas must hide the unavailable theme switcher while its dark theme is locked');
}

if (app !== null) {
  if (!/import\s+\*\s+as\s+THREE\s+from\s+["']\.\/vendor\/three\.module\.min\.js["']/.test(app)) {
    issue('Activity-index JavaScript must import the vendored Three.js module');
  }
  if (!app.includes("dataUrl: '/data/local-ai-activity-index.json?")
    || !app.includes("dataUrl: '/data/local-ai-activity-index-90d.json?")
    || !app.includes("dataUrl: '/data/local-ai-activity-index-180d.json?")) {
    issue('Activity-index JavaScript does not load the versioned JSON dataset');
  }
  if (!app.includes("const WORLD_URL = '/data/ne_50m_admin_0_countries.geojson?")) {
    issue('Activity-index JavaScript must load the versioned Natural Earth 50m country GeoJSON');
  }
  if (app.includes('ne_110m_admin_0_countries')) {
    issue('Activity-index JavaScript must not reference the retired Natural Earth 110m country GeoJSON');
  }
  if (!app.includes("const ADMIN1_MANIFEST_URL = '/data/admin1/manifest.json?")) {
    issue('Activity-index JavaScript must load the versioned worldwide Admin-1 manifest');
  }
  if (!app.includes("admin1Url: '/data/local-ai-admin1-activity.json?")
    || !app.includes("admin1Url: '/data/local-ai-admin1-activity-90d.json?")
    || !app.includes("admin1Url: '/data/local-ai-admin1-activity-180d.json?")) {
    issue('Activity-index JavaScript must load the versioned worldwide regional activity dataset');
  }
  if (!app.includes("const ADMIN2_MANIFEST_URL = '/data/admin2/manifest.json?")) {
    issue('Activity-index JavaScript must load the versioned deeper-boundary manifest');
  }
  if (app.includes('ne_10m_admin_1_china_russia') || /const\s+ADMIN1_URL\s*=/.test(app)) {
    issue('Activity-index JavaScript must not load the retired China/Russia Admin-1 monolith');
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
  if (!app.includes('periodDays() > 30 ? 144 : state.cityClusters.length')) {
    issue('Desktop Atlas must preserve every 30-day city cluster while capping longer-period clutter');
  }
  if (!app.includes('function buildWorldCountryEntities(')
    || !app.includes('function manifestEntryForCountry(')
    || !app.includes('function detailConfigForCountry(')) {
    issue('Activity-index JavaScript must derive worldwide drill-down entities and labels from the Admin-1 manifest');
  }
  if (!app.includes('async function loadAdmin1Shard(')
    || !app.includes('manifest.path')
    || !app.includes('manifest.sha256')) {
    issue('Activity-index JavaScript must lazily fetch and version each country Admin-1 shard from its manifest entry');
  }
  const admin1CacheLimit = Number(app.match(/const\s+ADMIN1_CACHE_LIMIT\s*=\s*(\d+)\s*;/)?.[1]);
  if (!Number.isInteger(admin1CacheLimit) || admin1CacheLimit < 2 || admin1CacheLimit > 12
    || !app.includes('state.admin1Cache.delete(')) {
    issue('Worldwide Admin-1 shards must use a small bounded in-memory cache');
  }
  if (!app.includes('fetch(ADMIN1_MANIFEST_URL)') || !app.includes('fetch(ADMIN1_ACTIVITY_URL)')) {
    issue('Atlas initialization must fetch the worldwide Admin-1 manifest and regional activity snapshot');
  }
  if (!app.includes('fetch(ADMIN2_MANIFEST_URL)')) {
    issue('Atlas initialization must fetch the deeper-boundary manifest');
  }
  const initializeBody = topLevelFunctionBody(app, 'initialize');
  if (!initializeBody.includes('const admin2ManifestPromise = fetch(ADMIN2_MANIFEST_URL)')
    || !initializeBody.includes('the world and regional maps remain active')
    || initializeBody.includes('!admin2ManifestResponse.ok')) {
    issue('Admin-2 must remain an optional enhancement that cannot disable the core world and regional Atlas');
  }
  if (!app.includes('async function loadAdmin2Shard(')
    || !app.includes('function enterAdmin2Detail(')
    || !app.includes('function focusAdmin2Region(')
    || !app.includes('function exitAdmin2(')) {
    issue('Activity-index JavaScript is missing the lazy deeper-boundary drill-down flow');
  }
  const admin2CacheLimit = Number(app.match(/const\s+ADMIN2_CACHE_LIMIT\s*=\s*(\d+)\s*;/)?.[1]);
  if (!Number.isInteger(admin2CacheLimit) || admin2CacheLimit < 2 || admin2CacheLimit > 12
    || !app.includes('state.admin2Cache.delete(')) {
    issue('Admin-2 parent shards must use a small bounded in-memory cache');
  }
  const loadAdmin2Body = topLevelFunctionBody(app, 'loadAdmin2Shard');
  if (!app.includes('admin2Requests: new Map()')
    || !loadAdmin2Body.includes('state.admin2Requests.has(key)')
    || !loadAdmin2Body.includes('state.admin2Requests.set(key, request)')
    || !loadAdmin2Body.includes('state.admin2Requests.delete(key)')) {
    issue('Concurrent requests for the same Admin-2 shard must share one in-flight fetch');
  }
  if (app.includes('countryDetailConfigs')) {
    issue('Worldwide drill-down must not remain gated by the retired hard-coded countryDetailConfigs list');
  }
  if (!app.includes('function enterCountryDetail(') || !app.includes('function focusAdmin1Region(')) {
    issue('Activity-index JavaScript is missing generic country and Admin-1 drill-down interactions');
  }
  const pointerPickBody = topLevelFunctionBody(app, 'entityAtPointer');
  if (!app.includes('function entityAtPointer({ preferGeography = false } = {})')
    || !pointerPickBody.includes('geographicEntity = isAdmin2Scope()')
    || !pointerPickBody.includes('? admin2RegionAt(lat, lon)')
    || !pointerPickBody.includes('? stateAt(lat, lon)')
    || !pointerPickBody.includes('? admin1RegionAt(lat, lon)')
    || !pointerPickBody.includes(': countryAt(lat, lon)')
    || !pointerPickBody.includes('const frontSurfaceHit = Boolean(intersection')
    || !pointerPickBody.includes('const clusterHit = frontSurfaceHit && clusterHits[0]')
    || !pointerPickBody.includes('if (preferGeography) return frontSurfaceHit ? geographicEntity || geographyForCluster(clusterHit) : null')
    || !pointerPickBody.includes('return geographicEntity;')
    || pointerPickBody.indexOf('if (preferGeography)') > pointerPickBody.indexOf('if (clusterHit)')) {
    issue('Atlas map activation must prioritize the country, state, Admin-1 or Admin-2 geography beneath city beacon hit areas');
  }
  const clusterGeographyBody = topLevelFunctionBody(app, 'geographyForCluster');
  if (!clusterGeographyBody.includes("if (state.scope === 'us') return regionForCode(cluster.regionCode)")
    || !clusterGeographyBody.includes('state.admin1AssignmentByCluster.get(cluster)')
    || !clusterGeographyBody.includes('return countryForCode(cluster.countryCode)')) {
    issue('Coastal city beacons must fall back to their mapped geography when simplified boundaries leave the centroid offshore');
  }
  const interactionBody = topLevelFunctionBody(app, 'bindInteractions');
  if (!interactionBody.includes('entityAtPointer({ preferGeography: true })')
    || !interactionBody.includes('const entity = entityAtPointer();')) {
    issue('Atlas clicks must prefer geography while pointer hover retains city-cluster discovery');
  }
  if (!interactionBody.includes('if (state.activePointers.size === 0)')
    || interactionBody.includes('if (state.activePointers.size < 2)')) {
    issue('Atlas pinch gestures must stay consumed until every touch pointer is released');
  }
  const pointerDownStart = interactionBody.indexOf("canvas.addEventListener('pointerdown'");
  const pointerMoveStart = interactionBody.indexOf("canvas.addEventListener('pointermove'");
  const pointerDownBody = interactionBody.slice(pointerDownStart, pointerMoveStart);
  if (pointerDownStart < 0 || pointerMoveStart < 0 || !pointerDownBody.includes('hideTooltip();')) {
    issue('Atlas pointer activation must clear any stale city tooltip before opening geography detail');
  }
  const beaconBody = topLevelFunctionBody(app, 'createBeaconAccent');
  const beaconScaleBody = topLevelFunctionBody(app, 'updateBeaconVisualScale');
  const clusterLabelBody = topLevelFunctionBody(app, 'createClusterLabel');
  if (!beaconBody.includes('const hitRadius = 0.038 + Math.sqrt(intensity) * 0.018;')
    || !beaconBody.includes('new THREE.SphereGeometry(hitRadius, 12, 8)')
    || !beaconScaleBody.includes('const hitPixels = isMobileViewport() ? 32 : 24;')
    || !beaconScaleBody.includes('const hitScale = hitPixels / (2 * entry.hitRadius * pixelsPerLocalUnit)')
    || !beaconScaleBody.includes('entry.hit.scale.setScalar(')) {
    issue('City beacon hover targets must remain compact enough for dense small-country and regional maps');
  }
  if (!clusterLabelBody.includes("button.addEventListener('click', () => focusCluster(entry.cluster))")) {
    issue('City clusters must remain explicitly selectable through their accessible projected labels');
  }
  const admin1LayerBody = topLevelFunctionBody(app, 'createAdmin1Layer');
  if (admin1LayerBody.includes("makeActivityTexture('admin1')")) {
    issue('Admin-1 regional fills must not use a magnified global raster texture');
  }
  if (!admin1LayerBody.includes('sphericalFillGeometry(')
    || !admin1LayerBody.includes('THREE.NormalBlending')
    || !admin1LayerBody.includes('admin1FillEntity')
    || !admin1LayerBody.includes('stage.dataset.admin1FillMeshes')
    || !admin1LayerBody.includes('stage.dataset.admin1FillTriangles')) {
    issue('Admin-1 regional fills must remain exact vector meshes with normal blending and runtime QA counters');
  }
  const admin1FillGeometryBody = topLevelFunctionBody(app, 'sphericalFillGeometry');
  if (!admin1FillGeometryBody.includes('unwrappedFillRing(')
    || !admin1FillGeometryBody.includes('THREE.ShapeUtils.triangulateShape(')
    || !admin1FillGeometryBody.includes('appendSphericalFillTriangle(')) {
    issue('Admin-1 vector fills must triangulate unwrapped Polygon and MultiPolygon rings onto the sphere');
  }
  const primaryLonLatIndex = admin1FillGeometryBody.indexOf('contour.map(point => point.clone())');
  const fallbackGuardIndex = admin1FillGeometryBody.indexOf('if (!validTriangulation(triangles))');
  const tangentFallbackIndex = admin1FillGeometryBody.indexOf('const tangentCenter = sphericalContour');
  if (primaryLonLatIndex < 0
    || fallbackGuardIndex < 0
    || tangentFallbackIndex < 0
    || primaryLonLatIndex > fallbackGuardIndex
    || tangentFallbackIndex < fallbackGuardIndex) {
    issue('Admin-1 fills must use unwrapped longitude/latitude as the primary triangulation and tangent projection only as a guarded fallback');
  }
  const selectionOverlayBody = topLevelFunctionBody(app, 'updateSelectionOverlay');
  if (!selectionOverlayBody.includes('if (isAdmin1Scope() || isAdmin2Scope())')
    || !selectionOverlayBody.includes('state.selectionMesh.visible = false')
    || !selectionOverlayBody.includes('updateSelectionBoundary(feature, qualityFlagged)')) {
    issue('Admin-1 and Admin-2 selections must use exact vector boundaries without a raster selection halo');
  }
  const admin2LayerBody = topLevelFunctionBody(app, 'createAdmin2Layer');
  if (!admin2LayerBody.includes('new THREE.LineSegments(')
    || admin2LayerBody.includes('sphericalFillGeometry(')
    || admin2LayerBody.includes("makeActivityTexture('admin2')")) {
    issue('Admin-2 must remain a neutral vector-boundary layer with no inferred activity fill');
  }
  const spotlightBody = topLevelFunctionBody(app, 'showSpotlight');
  if (!spotlightBody.includes("entity.kind === 'admin2'")
    || !spotlightBody.includes('Boundary view · no activity total')
    || !spotlightBody.includes('not a subdivision total')) {
    issue('Admin-2 selections must disclose their boundary-only status instead of reusing country activity copy');
  }
  if (!css.includes('.atlas-navigation__tour[hidden]')
    || !css.includes('display: none !important;')) {
    issue('The ranked-region tour must stay visually hidden in unranked Admin-2 views');
  }
  const focusAdmin2Body = topLevelFunctionBody(app, 'focusAdmin2Region');
  if (!focusAdmin2Body.includes('syncRegionPanelSelection(region)')
    || !app.includes("button.setAttribute('aria-current', 'true')")
    || !css.includes('.atlas-scope-admin2 .atlas-region-panel__list button.is-active')) {
    issue('Admin-2 boundary selection must remain visible and expose aria-current in the long subdivision list');
  }
  const defaultZoomBody = topLevelFunctionBody(app, 'defaultZoom');
  if (!app.includes('function featureLongitudeSpan(')
    || !app.includes('function admin1ZoomForBbox(bbox, mobile = isMobileViewport(), longitudeSpanDegrees = null)')
    || !app.includes('Number.isFinite(longitudeSpanDegrees)')
    || !defaultZoomBody.includes('state.admin2Config.longitudeSpan')
    || !focusAdmin2Body.includes('region.longitudeSpan')) {
    issue('Admin-2 zoom fitting must use an antimeridian-aware longitude span for Alaska and crossing subdivisions');
  }
  const regionPanelBody = topLevelFunctionBody(app, 'renderStatePanel');
  if (!regionPanelBody.includes('.flatMap(region => region.features || [])')
    || !regionPanelBody.includes('!publishedFeatures.has(region.feature)')) {
    issue('Composite regional aggregates must suppress their component polygons from the neutral region list');
  }
  if (!app.includes('usAllRegions: []')
    || !app.includes('state.usAllRegions = state.usBoundaries.features.map(')
    || !regionPanelBody.includes('state.usAllRegions')
    || !topLevelFunctionBody(app, 'stateAt').includes('state.usAllRegions')) {
    issue('The U.S. state view must keep all 50 states and District of Columbia selectable for deeper boundary exploration');
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
  const worldTextureBody = topLevelFunctionBody(app, 'makeWorldTexture');
  const activityTextureBody = topLevelFunctionBody(app, 'makeActivityTexture');
  const fillOnlyDraw = 'drawFeature(context, feature, textureCanvas.width, textureCanvas.height, { stroke: false });';
  if (!worldTextureBody.includes(fillOnlyDraw)) {
    issue('World texture polygons must remain fill-only so country borders stay vector-sharp at close zoom');
  }
  if (!activityTextureBody.includes(fillOnlyDraw) || activityTextureBody.includes('{ fill: false }')) {
    issue('Activity heat textures must remain fill-only so raster strokes cannot blur country or region borders');
  }
  const worldBoundariesBody = topLevelFunctionBody(app, 'createWorldBoundaries');
  if (!worldBoundariesBody.includes('new THREE.LineSegments(')
    || !worldBoundariesBody.includes('depthTest: true')
    || !worldBoundariesBody.includes('toneMapped: false')) {
    issue('World country borders must remain a depth-tested, tone-map-free vector LineSegments layer');
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
  const mapLabelRule = css.match(/\.atlas-map-label\s*\{([^}]*)\}/)?.[1] || '';
  const mapLabelButtonRule = css.match(/\.atlas-map-label__button\s*\{([^}]*)\}/)?.[1] || '';
  const mapLabelButtonHeight = Number(mapLabelButtonRule.match(/min-height:\s*(\d+)px/)?.[1]);
  if (!mapLabelRule.includes('pointer-events: none')
    || !mapLabelButtonRule.includes('pointer-events: auto')
    || !Number.isFinite(mapLabelButtonHeight)
    || mapLabelButtonHeight < 24) {
    issue('Projected city labels must have no dead interception padding and a fully interactive button at least 24px tall');
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
const admin1ShardFeaturesByA3 = new Map();
if (admin1Manifest) {
  const source = admin1Manifest.source || {};
  if (admin1Manifest.schemaVersion !== 1 || !isIsoTimestamp(admin1Manifest.generatedAt)) {
    issue('Worldwide Admin-1 manifest must use schema version 1 and a valid generatedAt timestamp');
  }
  if (source.provider !== 'Natural Earth'
    || source.dataset !== 'Admin 1 - States, Provinces'
    || source.sourceLayer !== 'ne_10m_admin_1_states_provinces'
    || source.scale !== '1:10m'
    || source.version !== '5.1.1') {
    issue('Worldwide Admin-1 provenance must identify Natural Earth Admin 1 version 5.1.1 at 1:10m');
  }
  if (source.sourcePage !== 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/'
    || source.downloadUrl !== 'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip'
    || source.archiveSha256 !== EXPECTED_ADMIN1_ARCHIVE_SHA256) {
    issue('Worldwide Admin-1 source URL or official archive checksum is incorrect');
  }
  if (String(source.license || '').toLowerCase() !== 'public domain'
    || source.attribution !== 'Made with Natural Earth'
    || source.worldview !== 'Natural Earth default de facto boundaries') {
    issue('Worldwide Admin-1 data must retain the Natural Earth license, attribution, and worldview disclosure');
  }
  if (!String(source.filter || '').includes('dominant ISO prefix')
    || !String(source.filter || '').includes('no geometry simplification')) {
    issue('Worldwide Admin-1 metadata must disclose its selection rule and unsimplified geometry');
  }

  const countries = admin1Manifest.countries && typeof admin1Manifest.countries === 'object'
    && !Array.isArray(admin1Manifest.countries) ? admin1Manifest.countries : {};
  const countryEntries = Object.entries(countries).sort(([left], [right]) => left.localeCompare(right));
  if (countryEntries.length !== EXPECTED_ADMIN1_COUNTRIES) {
    issue(`Expected ${EXPECTED_ADMIN1_COUNTRIES} lazy Admin-1 country shards, found ${countryEntries.length}`);
  }
  const totals = admin1Manifest.totals || {};
  for (const [field, expected] of Object.entries({
    countries: EXPECTED_ADMIN1_COUNTRIES,
    subdivisions: EXPECTED_ADMIN1_FEATURES,
    coordinatePositionCount: EXPECTED_ADMIN1_COORDINATE_POSITIONS,
    singleFeatureCountries: EXPECTED_ADMIN1_SINGLE_FEATURE_COUNTRIES,
    multiFeatureCountries: EXPECTED_ADMIN1_MULTI_FEATURE_COUNTRIES
  })) {
    if (totals[field] !== expected) issue(`Worldwide Admin-1 manifest total ${field} must be ${expected}`);
  }
  if (totals.geometryFingerprint !== EXPECTED_ADMIN1_GEOMETRY_FINGERPRINT
    || totals.recordFingerprint !== EXPECTED_ADMIN1_RECORD_FINGERPRINT) {
    issue('Worldwide Admin-1 manifest fingerprints do not match the approved Natural Earth snapshot');
  }

  const worldCountryCodes = new Set((geojson?.features || [])
    .map(feature => String(feature.properties?.ADM0_A3 || '').trim().toUpperCase())
    .filter(code => /^[A-Z0-9]{3}$/.test(code)));
  const manifestCountryCodes = new Set(countryEntries.map(([code]) => code));
  for (const code of worldCountryCodes) {
    if (!manifestCountryCodes.has(code)) issue(`Worldwide Admin-1 manifest is missing mapped country ${code}`);
  }
  for (const code of manifestCountryCodes) {
    if (!worldCountryCodes.has(code)) issue(`Worldwide Admin-1 manifest contains unknown country ${code}`);
  }

  const expectedShardFiles = new Set(countryEntries.map(([code]) => `${code.toLowerCase()}.geojson`));
  const admin1Directory = path.join(ROOT, 'data', 'admin1');
  const actualShardFiles = fs.existsSync(admin1Directory)
    ? fs.readdirSync(admin1Directory).filter(filename => /^[a-z0-9]{3}\.geojson$/.test(filename))
    : [];
  for (const filename of actualShardFiles) {
    if (!expectedShardFiles.has(filename)) issue(`Unreferenced Admin-1 shard is public: data/admin1/${filename}`);
  }
  for (const filename of expectedShardFiles) {
    if (!actualShardFiles.includes(filename)) issue(`Admin-1 manifest references a missing shard: data/admin1/${filename}`);
  }

  const allAdmin1Features = [];
  const admin1Codes = new Set();
  const naturalEarthIds = new Set();
  let computedSubdivisions = 0;
  let computedCoordinatePositions = 0;
  let computedSingleFeatureCountries = 0;
  let computedMultiFeatureCountries = 0;

  for (const [code, entry] of countryEntries) {
    const label = `Admin-1 manifest entry ${code}`;
    if (!/^[A-Z0-9]{3}$/.test(code) || entry?.code !== code) issue(`${label} has an invalid country code`);
    if (isPlaceholder(entry?.name)) issue(`${label} has a missing country name`);
    const expectedPath = `/data/admin1/${code.toLowerCase()}.geojson`;
    if (entry?.path !== expectedPath) issue(`${label} path must be ${expectedPath}`);
    if (!Number.isInteger(entry?.featureCount) || entry.featureCount < 1) issue(`${label} has an invalid featureCount`);
    if (!Number.isInteger(entry?.coordinatePositionCount) || entry.coordinatePositionCount < 1) {
      issue(`${label} has an invalid coordinatePositionCount`);
    }
    if (!validBbox(entry?.bbox)) issue(`${label} has an invalid bounding box`);
    if (!/^[a-f0-9]{64}$/.test(entry?.sha256 || '')) issue(`${label} has an invalid SHA-256`);

    const shardRelativePath = entry?.path === expectedPath ? expectedPath.slice(1) : null;
    const shardText = shardRelativePath ? readFile(shardRelativePath, `${code} Admin-1 shard`) : null;
    const shard = parseJson(shardText, `${code} Admin-1 shard`);
    if (!shard) continue;
    if (sha256(shardText) !== entry.sha256) issue(`${code} Admin-1 shard SHA-256 does not match its manifest entry`);
    if (shard.type !== 'FeatureCollection'
      || shard.name !== `ne_10m_admin_1_${code.toLowerCase()}`
      || shard.adm0A3 !== code) {
      issue(`${code} Admin-1 shard has invalid collection metadata`);
    }
    const features = Array.isArray(shard.features) ? shard.features : [];
    admin1ShardFeaturesByA3.set(code, features);
    allAdmin1Features.push(...features);
    if (features.length !== entry.featureCount) issue(`${code} Admin-1 shard featureCount does not match its manifest entry`);
    if (features.length === 1) computedSingleFeatureCountries += 1;
    if (features.length > 1) computedMultiFeatureCountries += 1;
    computedSubdivisions += features.length;

    const coordinateStats = coordinateStatsForFeatures(features);
    computedCoordinatePositions += coordinateStats.positions;
    if (coordinateStats.invalid !== 0) issue(`${code} Admin-1 shard contains ${coordinateStats.invalid} invalid coordinate positions`);
    if (coordinateStats.positions !== entry.coordinatePositionCount) {
      issue(`${code} Admin-1 shard coordinate count does not match its manifest entry`);
    }
    const computedBbox = bboxFromStats(coordinateStats);
    if (!sameJson(shard.bbox, entry.bbox) || !sameJson(computedBbox, entry.bbox)) {
      issue(`${code} Admin-1 shard bounding box does not match its geometry and manifest entry`);
    }

    const typeCounts = new Map();
    for (const [index, feature] of features.entries()) {
      const properties = feature.properties || {};
      const featureLabel = properties.adm1_code || `${code} feature ${index + 1}`;
      if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) {
        issue(`Admin-1 ${featureLabel} must contain polygon geometry`);
      }
      for (const field of ['adm0_a3', 'admin', 'adm1_code', 'iso_3166_2', 'name', 'name_en', 'ne_id']) {
        if (isPlaceholder(properties[field])) issue(`Admin-1 ${featureLabel} has a missing or placeholder ${field}`);
      }
      if (properties.adm0_a3 !== code) issue(`Admin-1 ${featureLabel} is stored in the wrong country shard`);
      if (!Number.isInteger(properties.ne_id) || properties.ne_id < 1) {
        issue(`Admin-1 ${featureLabel} has an invalid Natural Earth ID`);
      }
      if (admin1Codes.has(properties.adm1_code)) issue(`Duplicate worldwide Admin-1 code: ${properties.adm1_code}`);
      if (naturalEarthIds.has(properties.ne_id)) issue(`Duplicate worldwide Natural Earth Admin-1 ID: ${properties.ne_id}`);
      admin1Codes.add(properties.adm1_code);
      naturalEarthIds.add(properties.ne_id);
      const type = properties.type_en || properties.type || 'Region';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }
    const expectedTypes = [...typeCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([type, count]) => ({ type, count }));
    if (!sameJson(entry.types, expectedTypes)) issue(`${code} Admin-1 type summary does not match its shard`);
  }

  if (computedSubdivisions !== EXPECTED_ADMIN1_FEATURES
    || computedCoordinatePositions !== EXPECTED_ADMIN1_COORDINATE_POSITIONS
    || computedSingleFeatureCountries !== EXPECTED_ADMIN1_SINGLE_FEATURE_COUNTRIES
    || computedMultiFeatureCountries !== EXPECTED_ADMIN1_MULTI_FEATURE_COUNTRIES) {
    issue('Worldwide Admin-1 shard totals do not reconcile to the approved manifest totals');
  }
  const fingerprintFeatures = [...allAdmin1Features].sort((left, right) => {
    const leftKey = `${left.properties?.adm0_a3}|${left.properties?.adm1_code}`;
    const rightKey = `${right.properties?.adm0_a3}|${right.properties?.adm1_code}`;
    return leftKey.localeCompare(rightKey);
  });
  const geometryFingerprint = sha256(fingerprintFeatures.map(feature => (
    `${feature.properties?.adm0_a3}|${feature.properties?.adm1_code}|${JSON.stringify(feature.geometry)}`
  )).join('\n'));
  const recordFingerprint = sha256(fingerprintFeatures.map(feature => {
    const properties = feature.properties || {};
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
  if (geometryFingerprint !== EXPECTED_ADMIN1_GEOMETRY_FINGERPRINT
    || recordFingerprint !== EXPECTED_ADMIN1_RECORD_FINGERPRINT) {
    issue('Worldwide Admin-1 shard records do not match the approved Natural Earth geometry and record fingerprints');
  }
}

if (admin1Activity) {
  if (admin1Activity.schemaVersion !== 1 || !isIsoTimestamp(admin1Activity.generatedAt)) {
    issue('Worldwide regional activity must use schema version 1 and a valid generatedAt timestamp');
  }
  if (admin1Activity.publishThreshold !== 5) issue('Worldwide regional activity publish threshold must be five signals');
  if (admin1Activity.source?.provider !== 'DataFast'
    || admin1Activity.source?.dimension !== 'region'
    || !String(admin1Activity.source?.method || '').includes('Country-filtered')) {
    issue('Worldwide regional activity must identify the country-filtered DataFast region source');
  }
  if (!String(admin1Activity.source?.snapshotNote || '').includes('not presented as an additive reconciliation')) {
    issue('Worldwide regional activity must disclose that separately captured dimensions are not additive');
  }
  if (!String(admin1Activity.privacy?.rule || '').toLowerCase().includes('at least five')
    || !String(admin1Activity.privacy?.withheldDetail || '').toLowerCase().includes('not included')) {
    issue('Worldwide regional activity must disclose that below-threshold rows are omitted from the public file');
  }
  if (admin1Activity.period?.start !== data?.period?.start
    || admin1Activity.period?.end !== data?.period?.end
    || admin1Activity.period?.timezone !== data?.timezone) {
    issue('Worldwide regional activity period must match the public country snapshot and timezone');
  }
  const unexpectedTopLevelKeys = unexpectedKeys(admin1Activity, [
    'schemaVersion', 'generatedAt', 'period', 'source', 'publishThreshold', 'privacy', 'countries'
  ]);
  if (unexpectedTopLevelKeys.length) {
    issue(`Worldwide regional activity contains unexpected public fields: ${unexpectedTopLevelKeys.join(', ')}`);
  }

  const activityCountries = admin1Activity.countries && typeof admin1Activity.countries === 'object'
    && !Array.isArray(admin1Activity.countries) ? admin1Activity.countries : {};
  const activityCountryEntries = Object.entries(activityCountries);
  if (activityCountryEntries.length !== EXPECTED_ADMIN1_ACTIVITY_COUNTRIES) {
    issue(`Expected ${EXPECTED_ADMIN1_ACTIVITY_COUNTRIES} worldwide regional activity countries outside the U.S., found ${activityCountryEntries.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(activityCountries, 'United States')) {
    issue('Worldwide regional activity must not duplicate the dedicated U.S. Census state dataset');
  }
  const expectedActivityCountries = new Map((data?.countries || [])
    .filter(country => country.name !== 'United States')
    .map(country => [country.name, country]));
  for (const countryName of expectedActivityCountries.keys()) {
    if (!Object.prototype.hasOwnProperty.call(activityCountries, countryName)) {
      issue(`Worldwide regional activity is missing published country ${countryName}`);
    }
  }
  for (const countryName of Object.keys(activityCountries)) {
    if (!expectedActivityCountries.has(countryName)) issue(`Worldwide regional activity contains unknown country ${countryName}`);
  }

  const statusCounts = new Map();
  const usedAdm0Codes = new Set();
  let publicRegionCount = 0;
  let publicSignalCount = 0;
  let compositeRegionCount = 0;
  for (const [countryName, country] of activityCountryEntries) {
    const unexpectedCountryKeys = unexpectedKeys(country, [
      'countryCode', 'adm0A3', 'collectionStatus', 'publicationStatus', 'snapshotGeneratedAt',
      'countrySignals', 'publishedSignals', 'publishedRegions', 'regions'
    ]);
    if (unexpectedCountryKeys.length) {
      issue(`${countryName} regional record contains unexpected public fields: ${unexpectedCountryKeys.join(', ')}`);
    }
    if (!/^[A-Z]{2}$/.test(country?.countryCode || '') || !/^[A-Z0-9]{3}$/.test(country?.adm0A3 || '')) {
      issue(`${countryName} regional record has an invalid country code`);
    }
    if (usedAdm0Codes.has(country.adm0A3)) issue(`Duplicate regional activity Admin-0 code: ${country.adm0A3}`);
    usedAdm0Codes.add(country.adm0A3);
    if (!admin1Manifest?.countries?.[country.adm0A3]) {
      issue(`${countryName} regional record has no worldwide Admin-1 manifest entry`);
    }
    if (country.collectionStatus !== 'collected') issue(`${countryName} regional data must have a collected status`);
    if (!isIsoTimestamp(country.snapshotGeneratedAt)) issue(`${countryName} regional snapshot timestamp is invalid`);
    if (country.countrySignals !== expectedActivityCountries.get(countryName)?.signals) {
      issue(`${countryName} regional record does not preserve its public country signal count`);
    }
    statusCounts.set(country.publicationStatus, (statusCounts.get(country.publicationStatus) || 0) + 1);

    const regions = Array.isArray(country.regions) ? country.regions : [];
    const regionSignalSum = regions.reduce((sum, region) => sum + Number(region.signals || 0), 0);
    if (country.publishedRegions !== regions.length || country.publishedSignals !== regionSignalSum) {
      issue(`${countryName} regional ranks and sums do not reconcile to publishedRegions and publishedSignals`);
    }
    if (country.publicationStatus === 'published' && regions.length === 0) {
      issue(`${countryName} is marked published without a public regional row`);
    }
    if (country.publicationStatus !== 'published'
      && (regions.length !== 0 || country.publishedRegions !== 0 || country.publishedSignals !== 0)) {
      issue(`${countryName} non-published status must not expose regional rows or non-zero published totals`);
    }
    if (!EXPECTED_ADMIN1_PUBLICATION_STATUSES.has(country.publicationStatus)) {
      issue(`${countryName} has an unexpected regional publication status: ${country.publicationStatus}`);
    }

    const shardFeatures = admin1ShardFeaturesByA3.get(country.adm0A3) || [];
    const boundaryById = new Map(shardFeatures.map(feature => [feature.properties?.adm1_code, feature]));
    const assignedBoundaryIds = new Set();
    regions.forEach((region, index) => {
      const unexpectedRegionKeys = unexpectedKeys(region, [
        'rank', 'sourceName', 'canonicalName', 'signals', 'boundaryMatch', 'boundaryFeatureIds'
      ]);
      if (unexpectedRegionKeys.length) {
        issue(`${countryName} region ${index + 1} contains unexpected public fields: ${unexpectedRegionKeys.join(', ')}`);
      }
      const label = `${countryName} / ${region.canonicalName || region.sourceName || `region ${index + 1}`}`;
      if (region.rank !== index + 1) issue(`${label} has a non-contiguous rank`);
      if (index > 0 && (regions[index - 1].signals < region.signals
        || (regions[index - 1].signals === region.signals
          && String(regions[index - 1].canonicalName).localeCompare(String(region.canonicalName)) > 0))) {
        issue(`${label} is not in the approved descending rank order`);
      }
      if (isPlaceholder(region.sourceName) || isPlaceholder(region.canonicalName)) issue(`${label} has a missing regional name`);
      if (!Number.isInteger(region.signals) || region.signals < admin1Activity.publishThreshold) {
        issue(`${label} exposes a value below the five-signal privacy threshold`);
      }
      if (!['exact', 'alias', 'composite', 'legacy-exact'].includes(region.boundaryMatch)) {
        issue(`${label} has an invalid boundary match type`);
      }
      const boundaryFeatureIds = Array.isArray(region.boundaryFeatureIds) ? region.boundaryFeatureIds : [];
      if (boundaryFeatureIds.length === 0 || new Set(boundaryFeatureIds).size !== boundaryFeatureIds.length) {
        issue(`${label} must reference at least one unique boundary feature`);
      }
      if (!sameJson(boundaryFeatureIds, [...boundaryFeatureIds].sort())) {
        issue(`${label} boundary feature IDs must use a stable sorted order`);
      }
      if (region.boundaryMatch === 'composite') {
        compositeRegionCount += 1;
        if (boundaryFeatureIds.length < 2) issue(`${label} composite must span multiple boundary features`);
      } else if (boundaryFeatureIds.length !== 1) {
        issue(`${label} non-composite match must reference exactly one boundary feature`);
      }
      for (const boundaryFeatureId of boundaryFeatureIds) {
        if (!boundaryById.has(boundaryFeatureId)) issue(`${label} references missing boundary ${boundaryFeatureId}`);
        if (assignedBoundaryIds.has(boundaryFeatureId)) issue(`${label} reuses boundary ${boundaryFeatureId} already assigned to another public region`);
        assignedBoundaryIds.add(boundaryFeatureId);
      }
    });
    publicRegionCount += regions.length;
    publicSignalCount += regionSignalSum;
  }

  for (const [status, expected] of EXPECTED_ADMIN1_PUBLICATION_STATUSES) {
    if ((statusCounts.get(status) || 0) !== expected) {
      issue(`Expected ${expected} regional country records with status ${status}, found ${statusCounts.get(status) || 0}`);
    }
  }
  for (const [status, count] of statusCounts) {
    if (!EXPECTED_ADMIN1_PUBLICATION_STATUSES.has(status)) issue(`Unexpected regional publication status ${status} appears ${count} time(s)`);
  }
  if (publicRegionCount !== EXPECTED_ADMIN1_ACTIVITY_REGIONS) {
    issue(`Expected ${EXPECTED_ADMIN1_ACTIVITY_REGIONS} public regional rows, found ${publicRegionCount}`);
  }
  if (publicSignalCount !== EXPECTED_ADMIN1_ACTIVITY_SIGNALS) {
    issue(`Expected ${EXPECTED_ADMIN1_ACTIVITY_SIGNALS} signals across public regional rows, found ${publicSignalCount}`);
  }
  if (compositeRegionCount !== 14) issue(`Expected 14 multi-feature regional composites, found ${compositeRegionCount}`);
  if (activityCountries.Uzbekistan?.publicationStatus !== 'boundary_unresolved'
    || (activityCountries.Uzbekistan?.regions || []).length !== 0) {
    issue('Uzbekistan must retain an honest boundary_unresolved status without publishing the ambiguous regional row');
  }
  if (activityCountries['Saudi Arabia']?.publicationStatus !== 'none_above_threshold'
    || (activityCountries['Saudi Arabia']?.regions || []).length !== 0) {
    issue('Saudi Arabia must retain a collected none_above_threshold status without a public regional row');
  }

  const chinaActivity = activityCountries.China;
  const chinaLegacy = data?.subnational?.China?.regions || [];
  if (!chinaActivity || chinaActivity.regions?.length !== chinaLegacy.length) {
    issue('Worldwide regional activity must retain the approved legacy China snapshot');
  } else {
    chinaLegacy.forEach((legacyRegion, index) => {
      const publicRegion = chinaActivity.regions[index];
      if (publicRegion.rank !== legacyRegion.rank
        || publicRegion.sourceName !== legacyRegion.sourceName
        || publicRegion.canonicalName !== legacyRegion.name
        || publicRegion.signals !== legacyRegion.signals
        || publicRegion.boundaryMatch !== 'legacy-exact') {
        issue(`China legacy regional row ${index + 1} does not match the approved snapshot`);
      }
    });
  }

  const serializedActivity = JSON.stringify(admin1Activity);
  for (const forbiddenKey of ['observedRegions', 'observedRows', 'withheldRegions', 'withheldRows', 'rawRegions', 'rawRows']) {
    if (new RegExp(`"${forbiddenKey}"\\s*:`).test(serializedActivity)) {
      issue(`Worldwide regional activity must not expose below-threshold raw detail via ${forbiddenKey}`);
    }
  }
  const suspiciousRegionalFiles = fs.readdirSync(path.join(ROOT, 'data'))
    .filter(filename => /(?:datafast|admin1).*(?:raw|private)|(?:raw|private).*(?:region|admin1)/i.test(filename));
  if (suspiciousRegionalFiles.length) {
    issue(`Potential private or raw regional files are public under data/: ${suspiciousRegionalFiles.join(', ')}`);
  }
}
if (admin2Manifest) {
  if (admin2Manifest.schemaVersion !== 1 || !isIsoTimestamp(admin2Manifest.generatedAt)) {
    issue('Admin-2 manifest must use schema version 1 and a valid generatedAt timestamp');
  }
  const totals = admin2Manifest.totals || {};
  for (const [field, expected] of Object.entries({
    countries: 3,
    parents: EXPECTED_ADMIN2_PARENTS,
    subdivisions: EXPECTED_ADMIN2_SUBDIVISIONS,
    coordinatePositionCount: EXPECTED_ADMIN2_COORDINATE_POSITIONS
  })) {
    if (totals[field] !== expected) issue(`Admin-2 manifest total ${field} must be ${expected}`);
  }
  if (totals.geometryFingerprint !== EXPECTED_ADMIN2_GEOMETRY_FINGERPRINT
    || totals.recordFingerprint !== EXPECTED_ADMIN2_RECORD_FINGERPRINT) {
    issue('Admin-2 manifest fingerprints do not match the approved U.S./China/Australia boundary snapshot');
  }
  const countries = admin2Manifest.countries || {};
  const usa = countries.USA || {};
  const china = countries.CHN || {};
  const australia = countries.AUS || {};
  if (usa.source?.provider !== 'U.S. Census Bureau'
    || usa.source?.sourceYear !== 2025
    || usa.source?.official !== true
    || usa.source?.license !== 'Public domain'
    || usa.source?.sourceFiles?.archiveName !== 'cb_2025_us_county_5m.zip'
    || usa.source?.sourceFiles?.archiveSha256 !== '19f80cd87ad2e51146b8a7de496428c950e57f725b4eb74674efcb5059fa4678'
    || usa.source?.sourceFiles?.extractedMember !== 'cb_2025_us_county_5m.kml'
    || usa.source?.sourceFiles?.kmlSha256 !== '70a64577c9f41bd9281c19458a6c5d39918292ad91e7850057d3ee752f7408dd') {
    issue('U.S. Admin-2 provenance must identify the official Census 2025 1:5m public-domain snapshot');
  }
  if (china.source?.sourceYear !== 2020
    || china.source?.official !== false
    || !String(china.source?.license || '').includes('CC BY 3.0 IGO')
    || china.source?.sourceFiles?.shpSha256 !== 'acb0881183eea5db5cf19597367eefd188b948d3d38962b3cc041656dbdb7dcd'
    || china.source?.sourceFiles?.dbfSha256 !== '6fda17135a6b5651d8321b30f867ca8643ddd2b8024eae15d23f24c7ab27ad33'
    || !String(china.source?.status || '').toLowerCase().includes('unofficial')) {
    issue('China Admin-2 provenance must retain the OCHA source hashes, CC BY 3.0 IGO license, and unofficial-source disclosure');
  }
  if (australia.source?.provider !== 'Australian Bureau of Statistics (ABS)'
    || australia.source?.sourceYear !== 2025
    || australia.source?.official !== true
    || !String(australia.source?.license || '').includes('CC BY 4.0')
    || australia.source?.sourceFiles?.serviceLayer !== 'ASGS2025/LGA/FeatureServer/1 — LGA_GEN'
    || australia.source?.sourceFiles?.geojsonSha256 !== '0a6f910d0190b52e38b3c7c90d9a2e1695cac231dcabc4395e6625a2be9aa339'
    || australia.source?.sourceFiles?.maxAllowableOffsetDegrees !== 0.001
    || australia.source?.sourceFiles?.geometryPrecisionDecimals !== 6
    || !String(australia.source?.filter || '').includes('545 spatial LGA')) {
    issue('Australia deeper-boundary provenance must identify the official ABS 2025 LGA_GEN snapshot, display generalization, CC BY 4.0 license, and spatial-record filter');
  }
  const countryExpectations = [
    ['USA', usa, 51, 3144, 'usa'],
    ['CHN', china, 31, 358, 'chn'],
    ['AUS', australia, 8, 545, 'aus']
  ];
  const referencedFiles = new Set();
  const codes = new Set();
  let computedParents = 0;
  let computedSubdivisions = 0;
  let computedCoordinatePositions = 0;
  for (const [countryCode, country, expectedParents, expectedSubdivisions, directory] of countryExpectations) {
    const parents = Object.entries(country.parents || {}).sort(([left], [right]) => left.localeCompare(right));
    if (parents.length !== expectedParents) issue(`${countryCode} Admin-2 parent count must be ${expectedParents}`);
    if (country.totals?.parents !== expectedParents || country.totals?.subdivisions !== expectedSubdivisions) {
      issue(`${countryCode} Admin-2 country totals are incorrect`);
    }
    let countrySubdivisions = 0;
    let countryCoordinatePositions = 0;
    for (const [parentCode, entry] of parents) {
      computedParents += 1;
      if (!Number.isFinite(entry.longitudeSpan) || entry.longitudeSpan <= 0 || entry.longitudeSpan > 180) {
        issue(`${parentCode} Admin-2 longitude span must be a finite antimeridian-aware value`);
      }
      if (parentCode === 'US-AK' && (entry.longitudeSpan < 50 || entry.longitudeSpan > 70)) {
        issue('US-AK Admin-2 longitude span must fit Alaska across the antimeridian without treating it as world-wide');
      }
      const relativePath = String(entry.path || '').replace(/^\//, '');
      if (!new RegExp(`^data/admin2/${directory}/[a-z0-9-]+\\.geojson$`).test(relativePath)) {
        issue(`${parentCode} Admin-2 shard path is invalid: ${entry.path}`);
        continue;
      }
      referencedFiles.add(relativePath);
      const shardText = readFile(relativePath, `${parentCode} Admin-2 shard`);
      const shard = parseJson(shardText, `${parentCode} Admin-2 shard`);
      if (!shard) continue;
      if (sha256(shardText) !== entry.sha256) issue(`${parentCode} Admin-2 shard checksum does not match its manifest entry`);
      const features = Array.isArray(shard.features) ? shard.features : [];
      if (shard.type !== 'FeatureCollection' || shard.adm0A3 !== countryCode || shard.parentCode !== parentCode) {
        issue(`${parentCode} Admin-2 shard metadata is invalid`);
      }
      if (features.length !== entry.featureCount) issue(`${parentCode} Admin-2 feature count does not match its manifest entry`);
      let shardCoordinatePositions = 0;
      for (const feature of features) {
        const properties = feature.properties || {};
        const code = String(properties.code || '');
        if (!code || codes.has(code)) issue(`Admin-2 feature code is missing or duplicated: ${code || '(empty)'}`);
        codes.add(code);
        if (properties.parentCode !== parentCode || !properties.name || !properties.label || !properties.type) {
          issue(`${parentCode} Admin-2 feature is missing canonical public metadata`);
        }
        for (const forbidden of ['signals', 'rank', 'share', 'activity', 'visitors']) {
          if (Object.hasOwn(properties, forbidden)) issue(`${parentCode} Admin-2 feature must not publish inferred ${forbidden}`);
        }
        shardCoordinatePositions += countCoordinatePositions(feature.geometry?.coordinates);
      }
      if (shardCoordinatePositions !== entry.coordinatePositionCount) {
        issue(`${parentCode} Admin-2 coordinate count does not match its manifest entry`);
      }
      countrySubdivisions += features.length;
      countryCoordinatePositions += shardCoordinatePositions;
    }
    if (countrySubdivisions !== expectedSubdivisions
      || countryCoordinatePositions !== country.totals?.coordinatePositionCount) {
      issue(`${countryCode} Admin-2 computed totals do not match the manifest`);
    }
    computedSubdivisions += countrySubdivisions;
    computedCoordinatePositions += countryCoordinatePositions;
  }
  if (computedParents !== EXPECTED_ADMIN2_PARENTS
    || computedSubdivisions !== EXPECTED_ADMIN2_SUBDIVISIONS
    || computedCoordinatePositions !== EXPECTED_ADMIN2_COORDINATE_POSITIONS) {
    issue('Computed Admin-2 totals do not match the approved snapshot');
  }
  const actualAdmin2Files = ['usa', 'chn', 'aus'].flatMap(directory => {
    const absoluteDirectory = path.join(ROOT, 'data', 'admin2', directory);
    return fs.existsSync(absoluteDirectory)
      ? fs.readdirSync(absoluteDirectory)
        .filter(filename => filename.endsWith('.geojson'))
        .map(filename => `data/admin2/${directory}/${filename}`)
      : [];
  });
  for (const filename of actualAdmin2Files) {
    if (!referencedFiles.has(filename)) issue(`Unreferenced Admin-2 shard is public: ${filename}`);
  }
  for (const filename of referencedFiles) {
    if (!actualAdmin2Files.includes(filename)) issue(`Admin-2 manifest references a missing shard: ${filename}`);
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

console.log('Local AI Activity Index validation passed: 242 lazy Natural Earth Admin-1 shards with 4,558 subdivisions, 90 lazy U.S./China/Australia deeper-boundary shards with 4,047 neutral subdivisions, exact provenance and fingerprints, 61 privacy-thresholded regional country records with 94 public rows, vector-only detail, 3,337 observed country signals, 90 exact GeoNames city clusters, and 4096×2048 base textures verified.');
