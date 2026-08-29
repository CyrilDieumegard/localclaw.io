const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'data', 'admin2');
const US_OUTPUT = path.join(OUTPUT_ROOT, 'usa');
const CHINA_OUTPUT = path.join(OUTPUT_ROOT, 'chn');
const MANIFEST_PATH = path.join(OUTPUT_ROOT, 'manifest.json');
const US_STATES_PATH = path.join(ROOT, 'data', 'us-states-2024-20m.geojson');
const CHINA_ADMIN1_PATH = path.join(ROOT, 'data', 'admin1', 'chn.geojson');

const usKmlPath = process.argv[2] || process.env.LOCALCLAW_ADMIN2_US_KML;
const chinaShpPath = process.argv[3] || process.env.LOCALCLAW_ADMIN2_CHINA_SHP;
const chinaDbfPath = process.argv[4] || process.env.LOCALCLAW_ADMIN2_CHINA_DBF;
const generatedAt = process.env.LOCALCLAW_ADMIN2_GENERATED_AT || '2026-08-29T21:45:00.000Z';

const EXPECTED_US_KML_SHA256 = '70a64577c9f41bd9281c19458a6c5d39918292ad91e7850057d3ee752f7408dd';
const EXPECTED_US_ARCHIVE_SHA256 = '19f80cd87ad2e51146b8a7de496428c950e57f725b4eb74674efcb5059fa4678';
const EXPECTED_CHINA_SHP_SHA256 = 'acb0881183eea5db5cf19597367eefd188b948d3d38962b3cc041656dbdb7dcd';
const EXPECTED_CHINA_DBF_SHA256 = '6fda17135a6b5651d8321b30f867ca8643ddd2b8024eae15d23f24c7ab27ad33';
const EXPECTED_US_SOURCE_FEATURES = 3235;
const EXPECTED_US_FEATURES = 3144;
const EXPECTED_US_PARENTS = 51;
const EXPECTED_CHINA_SOURCE_FEATURES = 361;
const EXPECTED_CHINA_FEATURES = 358;
const EXPECTED_CHINA_PARENTS = 31;

const chinaParentCodes = new Map(Object.entries({
  CN011: 'CN-BJ',
  CN012: 'CN-TJ',
  CN013: 'CN-HE',
  CN014: 'CN-SX',
  CN015: 'CN-NM',
  CN021: 'CN-LN',
  CN022: 'CN-JL',
  CN023: 'CN-HL',
  CN031: 'CN-SH',
  CN032: 'CN-JS',
  CN033: 'CN-ZJ',
  CN034: 'CN-AH',
  CN035: 'CN-FJ',
  CN036: 'CN-JX',
  CN037: 'CN-SD',
  CN041: 'CN-HA',
  CN042: 'CN-HB',
  CN043: 'CN-HN',
  CN044: 'CN-GD',
  CN045: 'CN-GX',
  CN046: 'CN-HI',
  CN050: 'CN-CQ',
  CN051: 'CN-SC',
  CN052: 'CN-GZ',
  CN053: 'CN-YN',
  CN054: 'CN-XZ',
  CN061: 'CN-SN',
  CN062: 'CN-GS',
  CN063: 'CN-QH',
  CN064: 'CN-NX',
  CN065: 'CN-XJ'
}));
const excludedChinaParents = new Set(['CN071', 'CN081', 'CN082']);

if (!usKmlPath || !chinaShpPath || !chinaDbfPath) {
  throw new Error([
    'Usage: node scripts/generate-admin2-boundaries.js <US counties KML> <China Admin-2 SHP> <China Admin-2 DBF>',
    'Environment alternatives: LOCALCLAW_ADMIN2_US_KML, LOCALCLAW_ADMIN2_CHINA_SHP, LOCALCLAW_ADMIN2_CHINA_DBF'
  ].join('\n'));
}
if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(generatedAt)) {
  throw new Error('LOCALCLAW_ADMIN2_GENERATED_AT must be an ISO-8601 UTC timestamp.');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readPinnedSource(sourcePath, expectedSha256, label) {
  const absolutePath = path.resolve(sourcePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new Error(`${label} is missing: ${absolutePath}`);
  }
  const value = fs.readFileSync(absolutePath);
  const digest = sha256(value);
  if (digest !== expectedSha256) {
    throw new Error(`${label} SHA-256 mismatch: expected ${expectedSha256}, found ${digest}`);
  }
  return value;
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function closeRing(ring) {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return ring;
}

function parseKmlCoordinates(value) {
  const ring = String(value || '')
    .trim()
    .split(/\s+/)
    .map(position => position.split(',').slice(0, 2).map(Number))
    .filter(position => position.length === 2 && position.every(Number.isFinite));
  return closeRing(ring);
}

function firstTagContent(value, tagName) {
  const match = String(value || '').match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? match[1] : '';
}

function parseKmlPolygon(value) {
  const outerBlock = firstTagContent(value, 'outerBoundaryIs');
  const outer = parseKmlCoordinates(firstTagContent(outerBlock, 'coordinates'));
  if (outer.length < 4) throw new Error('KML polygon has no valid outer ring.');
  const holes = [];
  for (const match of value.matchAll(/<innerBoundaryIs\b[^>]*>([\s\S]*?)<\/innerBoundaryIs>/gi)) {
    const ring = parseKmlCoordinates(firstTagContent(match[1], 'coordinates'));
    if (ring.length >= 4) holes.push(ring);
  }
  return [outer, ...holes];
}

function parseUsKml(buffer) {
  const kml = buffer.toString('utf8');
  const features = [];
  for (const placemarkMatch of kml.matchAll(/<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi)) {
    const placemark = placemarkMatch[1];
    const attributes = {};
    for (const dataMatch of placemark.matchAll(/<SimpleData\s+name="([^"]+)">([\s\S]*?)<\/SimpleData>/gi)) {
      attributes[dataMatch[1]] = decodeXml(dataMatch[2]).trim();
    }
    const polygons = [...placemark.matchAll(/<Polygon\b[^>]*>([\s\S]*?)<\/Polygon>/gi)]
      .map(match => parseKmlPolygon(match[1]));
    if (!attributes.GEOID || polygons.length === 0) {
      throw new Error(`Invalid U.S. county KML placemark ${features.length + 1}.`);
    }
    features.push({
      attributes,
      geometry: polygons.length === 1
        ? { type: 'Polygon', coordinates: polygons[0] }
        : { type: 'MultiPolygon', coordinates: polygons }
    });
  }
  return features;
}

function readDbf(buffer) {
  if (buffer.length < 33) throw new Error('China Admin-2 DBF is truncated.');
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];
  let offset = 32;
  while (offset + 32 <= headerLength && buffer[offset] !== 0x0d) {
    const name = buffer.subarray(offset, offset + 11).toString('ascii').replace(/\0.*$/, '').trim();
    const type = String.fromCharCode(buffer[offset + 11]);
    const length = buffer[offset + 16];
    if (!name || length < 1) throw new Error('China Admin-2 DBF contains an invalid field descriptor.');
    fields.push({ name, type, length });
    offset += 32;
  }
  const records = [];
  for (let index = 0; index < recordCount; index += 1) {
    let cursor = headerLength + index * recordLength;
    if (cursor + recordLength > buffer.length) throw new Error(`China Admin-2 DBF record ${index + 1} is truncated.`);
    const deleted = buffer[cursor] === 0x2a;
    cursor += 1;
    const record = {};
    for (const field of fields) {
      const raw = buffer.subarray(cursor, cursor + field.length).toString('utf8').replace(/\0/g, '').trim();
      record[field.name] = field.type === 'N' && raw ? Number(raw) : raw;
      cursor += field.length;
    }
    if (!deleted) records.push(record);
  }
  return records;
}

function ringArea(ring) {
  let area = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    area += ring[previous][0] * ring[index][1] - ring[index][0] * ring[previous][1];
  }
  return area / 2;
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function ringsToGeometry(sourceRings) {
  const rings = sourceRings
    .map(ring => closeRing(ring))
    .filter(ring => ring.length >= 4)
    .map(ring => ({ ring, area: Math.abs(ringArea(ring)), parent: null, depth: 0, polygon: null }))
    .sort((left, right) => right.area - left.area);
  for (let index = 0; index < rings.length; index += 1) {
    const candidate = rings[index];
    let parent = null;
    for (let parentIndex = 0; parentIndex < index; parentIndex += 1) {
      const possibleParent = rings[parentIndex];
      if (!pointInRing(candidate.ring[0], possibleParent.ring)) continue;
      if (!parent || possibleParent.area < parent.area) parent = possibleParent;
    }
    candidate.parent = parent;
    candidate.depth = parent ? parent.depth + 1 : 0;
  }
  const polygons = [];
  for (const candidate of rings) {
    if (candidate.depth % 2 !== 0) continue;
    candidate.polygon = [candidate.ring];
    polygons.push(candidate.polygon);
  }
  for (const candidate of rings) {
    if (candidate.depth % 2 === 0) continue;
    let outer = candidate.parent;
    while (outer && outer.depth % 2 !== 0) outer = outer.parent;
    if (!outer?.polygon) throw new Error('China Admin-2 shapefile contains an unassigned interior ring.');
    outer.polygon.push(candidate.ring);
  }
  if (polygons.length === 0) throw new Error('China Admin-2 shapefile record has no valid polygon.');
  return polygons.length === 1
    ? { type: 'Polygon', coordinates: polygons[0] }
    : { type: 'MultiPolygon', coordinates: polygons };
}

function readShapefile(buffer) {
  if (buffer.length < 100 || buffer.readInt32BE(0) !== 9994) {
    throw new Error('China Admin-2 SHP has an invalid header.');
  }
  const headerShapeType = buffer.readInt32LE(32);
  if (headerShapeType !== 5) throw new Error(`China Admin-2 SHP must contain Polygon records, found type ${headerShapeType}.`);
  const geometries = [];
  let offset = 100;
  while (offset + 8 <= buffer.length) {
    const recordNumber = buffer.readInt32BE(offset);
    const contentBytes = buffer.readInt32BE(offset + 4) * 2;
    const contentOffset = offset + 8;
    const nextOffset = contentOffset + contentBytes;
    if (contentBytes < 4 || nextOffset > buffer.length) throw new Error(`China Admin-2 SHP record ${recordNumber} is truncated.`);
    const shapeType = buffer.readInt32LE(contentOffset);
    if (shapeType === 0) {
      geometries.push(null);
      offset = nextOffset;
      continue;
    }
    if (shapeType !== 5) throw new Error(`China Admin-2 SHP record ${recordNumber} has unsupported type ${shapeType}.`);
    const partCount = buffer.readInt32LE(contentOffset + 36);
    const pointCount = buffer.readInt32LE(contentOffset + 40);
    if (partCount < 1 || pointCount < 4) throw new Error(`China Admin-2 SHP record ${recordNumber} has invalid polygon counts.`);
    const partsOffset = contentOffset + 44;
    const pointsOffset = partsOffset + partCount * 4;
    if (pointsOffset + pointCount * 16 > nextOffset) throw new Error(`China Admin-2 SHP record ${recordNumber} has invalid offsets.`);
    const partStarts = [];
    for (let index = 0; index < partCount; index += 1) partStarts.push(buffer.readInt32LE(partsOffset + index * 4));
    const points = [];
    for (let index = 0; index < pointCount; index += 1) {
      const pointOffset = pointsOffset + index * 16;
      const point = [buffer.readDoubleLE(pointOffset), buffer.readDoubleLE(pointOffset + 8)];
      if (!point.every(Number.isFinite)) throw new Error(`China Admin-2 SHP record ${recordNumber} has a non-finite coordinate.`);
      points.push(point);
    }
    const rings = partStarts.map((start, index) => points.slice(start, partStarts[index + 1] ?? points.length));
    geometries.push(ringsToGeometry(rings));
    offset = nextOffset;
  }
  if (offset !== buffer.length) throw new Error('China Admin-2 SHP has trailing truncated bytes.');
  return geometries;
}

function geometryPositions(geometry) {
  if (geometry?.type === 'Polygon') return geometry.coordinates.flat(1);
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates.flat(2);
  return [];
}

function featureBounds(feature) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const point of geometryPositions(feature.geometry)) {
    bounds[0] = Math.min(bounds[0], point[0]);
    bounds[1] = Math.min(bounds[1], point[1]);
    bounds[2] = Math.max(bounds[2], point[0]);
    bounds[3] = Math.max(bounds[3], point[1]);
  }
  return bounds.every(Number.isFinite) ? bounds : null;
}

function minimalLongitudeSpan(features) {
  const longitudes = features
    .flatMap(feature => geometryPositions(feature.geometry))
    .map(point => ((point[0] % 360) + 360) % 360)
    .sort((left, right) => left - right);
  if (longitudes.length < 2) return null;
  let largestGap = 0;
  for (let index = 1; index < longitudes.length; index += 1) {
    largestGap = Math.max(largestGap, longitudes[index] - longitudes[index - 1]);
  }
  largestGap = Math.max(largestGap, longitudes[0] + 360 - longitudes[longitudes.length - 1]);
  return Number((360 - largestGap).toFixed(6));
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

function validateFeature(feature, label) {
  if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) throw new Error(`${label} has invalid geometry.`);
  const positions = geometryPositions(feature.geometry);
  if (positions.length < 4 || positions.some(point => !Array.isArray(point)
    || point.length < 2
    || !Number.isFinite(point[0])
    || !Number.isFinite(point[1])
    || point[0] < -180
    || point[0] > 180
    || point[1] < -90
    || point[1] > 90)) {
    throw new Error(`${label} has invalid coordinate positions.`);
  }
  for (const polygon of feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates) {
    for (const ring of polygon) {
      if (ring.length < 4 || ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
        throw new Error(`${label} has an open or undersized ring.`);
      }
    }
  }
}

function groupByParent(features) {
  const grouped = new Map();
  for (const feature of features) {
    const parentCode = feature.properties.parentCode;
    if (!grouped.has(parentCode)) grouped.set(parentCode, []);
    grouped.get(parentCode).push(feature);
  }
  return grouped;
}

function typeSummary(features) {
  const counts = new Map();
  for (const feature of features) {
    const type = feature.properties.type || 'Administrative division';
    counts.set(type, (counts.get(type) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([type, count]) => ({ type, count }));
}

function cleanOutputDirectory(directory, expectedFiles) {
  fs.mkdirSync(directory, { recursive: true });
  for (const filename of fs.readdirSync(directory)) {
    if (/^[a-z]{2}-[a-z0-9-]+\.geojson$/.test(filename) && !expectedFiles.has(filename)) {
      fs.unlinkSync(path.join(directory, filename));
    }
  }
}

function writeCountryShards({ countryCode, countryName, directoryName, features, parentNames, metadata }) {
  const directory = path.join(OUTPUT_ROOT, directoryName);
  const grouped = groupByParent(features);
  const expectedFiles = new Set([...grouped.keys()].map(code => `${code.toLowerCase()}.geojson`));
  cleanOutputDirectory(directory, expectedFiles);
  const parents = {};
  let coordinatePositionCount = 0;
  for (const [parentCode, parentFeatures] of [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    parentFeatures.sort((left, right) => left.properties.code.localeCompare(right.properties.code)
      || left.properties.name.localeCompare(right.properties.name));
    let bbox = null;
    let parentPositionCount = 0;
    for (const feature of parentFeatures) {
      validateFeature(feature, `${countryCode}/${parentCode}/${feature.properties.code}`);
      bbox = mergeBounds(bbox, featureBounds(feature));
      parentPositionCount += geometryPositions(feature.geometry).length;
    }
    const filename = `${parentCode.toLowerCase()}.geojson`;
    const longitudeSpan = minimalLongitudeSpan(parentFeatures);
    const relativePath = `/data/admin2/${directoryName}/${filename}`;
    const payload = {
      type: 'FeatureCollection',
      name: `admin2_${countryCode.toLowerCase()}_${parentCode.toLowerCase()}`,
      adm0A3: countryCode,
      parentCode,
      parentName: parentNames.get(parentCode),
      bbox,
      features: parentFeatures
    };
    const content = `${JSON.stringify(payload)}\n`;
    fs.writeFileSync(path.join(directory, filename), content);
    parents[parentCode] = {
      parentCode,
      parentName: parentNames.get(parentCode),
      path: relativePath,
      sha256: sha256(content),
      bbox,
      longitudeSpan,
      featureCount: parentFeatures.length,
      coordinatePositionCount: parentPositionCount,
      childLabel: metadata.childLabel,
      childrenLabel: metadata.childrenLabel,
      viewLabel: metadata.viewLabel,
      source: metadata.provider,
      sourceName: metadata.sourceName,
      sourceYear: metadata.sourceYear,
      license: metadata.license,
      official: metadata.official,
      types: typeSummary(parentFeatures)
    };
    coordinatePositionCount += parentPositionCount;
  }
  return {
    code: countryCode,
    name: countryName,
    parentLevel: metadata.parentLevel,
    childLevel: metadata.childLevel,
    source: metadata,
    totals: {
      parents: Object.keys(parents).length,
      subdivisions: features.length,
      coordinatePositionCount
    },
    parents
  };
}

const usKmlBuffer = readPinnedSource(usKmlPath, EXPECTED_US_KML_SHA256, 'U.S. Census county KML');
const chinaShpBuffer = readPinnedSource(chinaShpPath, EXPECTED_CHINA_SHP_SHA256, 'China OCHA Admin-2 SHP');
const chinaDbfBuffer = readPinnedSource(chinaDbfPath, EXPECTED_CHINA_DBF_SHA256, 'China OCHA Admin-2 DBF');

const usStates = JSON.parse(fs.readFileSync(US_STATES_PATH, 'utf8'));
const usStateByPostal = new Map((usStates.features || []).map(feature => [feature.properties?.STUSPS, feature.properties]));
if (usStateByPostal.size !== EXPECTED_US_PARENTS) throw new Error('The approved U.S. parent boundary file must contain 50 states plus DC.');

const usSourceFeatures = parseUsKml(usKmlBuffer);
if (usSourceFeatures.length !== EXPECTED_US_SOURCE_FEATURES) {
  throw new Error(`U.S. county KML contains ${usSourceFeatures.length} features; expected ${EXPECTED_US_SOURCE_FEATURES}.`);
}
const usFeatures = usSourceFeatures
  .filter(feature => usStateByPostal.has(feature.attributes.STUSPS))
  .map(sourceFeature => {
    const source = sourceFeature.attributes;
    const parent = usStateByPostal.get(source.STUSPS);
    if (source.STATEFP !== parent.GEOID || source.GEOID !== `${source.STATEFP}${source.COUNTYFP}`) {
      throw new Error(`U.S. county ${source.GEOID} does not match parent ${source.STUSPS}.`);
    }
    const parentCode = `US-${source.STUSPS}`;
    const inferredType = source.NAMELSAD === source.NAME
      ? (source.STUSPS === 'DC' ? 'Federal district' : 'County equivalent')
      : source.NAMELSAD.startsWith(`${source.NAME} `)
        ? source.NAMELSAD.slice(source.NAME.length + 1)
        : source.NAMELSAD.endsWith(` ${source.NAME}`)
          ? source.NAMELSAD.slice(0, -(source.NAME.length + 1))
          : 'County equivalent';
    return {
      type: 'Feature',
      properties: {
        code: `US-${source.GEOID}`,
        name: source.NAME,
        label: source.NAMELSAD,
        type: inferredType,
        parentCode
      },
      geometry: sourceFeature.geometry
    };
  });
if (usFeatures.length !== EXPECTED_US_FEATURES) {
  throw new Error(`Filtered U.S. county dataset contains ${usFeatures.length} features; expected ${EXPECTED_US_FEATURES}.`);
}
if (new Set(usFeatures.map(feature => feature.properties.code)).size !== usFeatures.length) {
  throw new Error('Filtered U.S. county dataset contains duplicate GEOIDs.');
}
const usParentNames = new Map([...usStateByPostal.entries()].map(([postal, properties]) => [`US-${postal}`, properties.NAME]));

const chinaRecords = readDbf(chinaDbfBuffer);
const chinaGeometries = readShapefile(chinaShpBuffer);
if (chinaRecords.length !== EXPECTED_CHINA_SOURCE_FEATURES || chinaGeometries.length !== EXPECTED_CHINA_SOURCE_FEATURES) {
  throw new Error(`China source must contain ${EXPECTED_CHINA_SOURCE_FEATURES} matching SHP and DBF records.`);
}
const chinaAdmin1 = JSON.parse(fs.readFileSync(CHINA_ADMIN1_PATH, 'utf8'));
const chinaParentNames = new Map((chinaAdmin1.features || []).map(feature => [feature.properties?.iso_3166_2, feature.properties?.name_en]));
if (chinaParentNames.size !== EXPECTED_CHINA_PARENTS) throw new Error('The approved China Admin-1 shard must contain 31 mainland parents.');
const chinaFeatures = [];
const observedChinaParentCodes = new Set();
for (let index = 0; index < chinaRecords.length; index += 1) {
  const record = chinaRecords[index];
  const sourceParentCode = String(record.ADM1_PCODE || '').trim().toUpperCase();
  observedChinaParentCodes.add(sourceParentCode);
  if (excludedChinaParents.has(sourceParentCode)) continue;
  const parentCode = chinaParentCodes.get(sourceParentCode);
  if (!parentCode || !chinaParentNames.has(parentCode)) {
    throw new Error(`China Admin-2 record ${record.ADM2_PCODE || index + 1} has unknown parent ${sourceParentCode}.`);
  }
  const code = String(record.ADM2_PCODE || '').trim().toUpperCase();
  const name = String(record.ADM2_EN || '').trim();
  const localName = String(record.ADM2_ZH || '').trim();
  const type = String(record.Admin_type || '').trim() || 'Prefecture-level division';
  if (!/^CN\d{6}$/.test(code) || !name || !chinaGeometries[index]) {
    throw new Error(`China Admin-2 record ${index + 1} has incomplete identifiers or geometry.`);
  }
  chinaFeatures.push({
    type: 'Feature',
    properties: {
      code,
      name,
      label: localName ? `${name} · ${localName}` : name,
      type,
      parentCode
    },
    geometry: chinaGeometries[index]
  });
}
const allowedChinaSourceParents = new Set([...chinaParentCodes.keys(), ...excludedChinaParents]);
for (const sourceParentCode of observedChinaParentCodes) {
  if (!allowedChinaSourceParents.has(sourceParentCode)) throw new Error(`Unexpected China source parent ${sourceParentCode}.`);
}
if (chinaFeatures.length !== EXPECTED_CHINA_FEATURES) {
  throw new Error(`Filtered China Admin-2 dataset contains ${chinaFeatures.length} features; expected ${EXPECTED_CHINA_FEATURES}.`);
}
if (new Set(chinaFeatures.map(feature => feature.properties.code)).size !== chinaFeatures.length) {
  throw new Error('Filtered China Admin-2 dataset contains duplicate P-codes.');
}
const generatedChinaParents = new Set(chinaFeatures.map(feature => feature.properties.parentCode));
if (generatedChinaParents.size !== EXPECTED_CHINA_PARENTS
  || [...chinaParentNames.keys()].some(parentCode => !generatedChinaParents.has(parentCode))) {
  throw new Error('Filtered China Admin-2 dataset does not cover all 31 approved mainland parents.');
}

fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
const usa = writeCountryShards({
  countryCode: 'USA',
  countryName: 'United States',
  directoryName: 'usa',
  features: usFeatures,
  parentNames: usParentNames,
  metadata: {
    provider: 'U.S. Census Bureau',
    sourceName: '2025 Cartographic Boundary File — Counties, 1:5m',
    sourceYear: 2025,
    sourcePage: 'https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html',
    downloadUrl: 'https://www2.census.gov/geo/tiger/GENZ2025/kml/cb_2025_us_county_5m.zip',
    sourceFiles: {
      archiveName: 'cb_2025_us_county_5m.zip',
      archiveSha256: EXPECTED_US_ARCHIVE_SHA256,
      extractedMember: 'cb_2025_us_county_5m.kml',
      kmlSha256: EXPECTED_US_KML_SHA256
    },
    license: 'Public domain',
    official: true,
    parentLevel: 'state',
    childLevel: 'county or county-equivalent',
    childLabel: 'county or county-equivalent',
    childrenLabel: 'counties and county-equivalents',
    viewLabel: 'County view',
    filter: '50 states and District of Columbia only; territories excluded; source KML geometry retained without additional simplification'
  }
});
const chn = writeCountryShards({
  countryCode: 'CHN',
  countryName: 'China',
  directoryName: 'chn',
  features: chinaFeatures,
  parentNames: chinaParentNames,
  metadata: {
    provider: 'United Nations Office for the Coordination of Humanitarian Affairs (OCHA) / HDX',
    sourceName: 'China administrative boundaries COD-AB — Admin-2',
    sourceYear: 2020,
    sourcePage: 'https://data.humdata.org/dataset/cod-ab-chn',
    sourceFiles: {
      shpSha256: EXPECTED_CHINA_SHP_SHA256,
      dbfSha256: EXPECTED_CHINA_DBF_SHA256
    },
    license: 'Creative Commons Attribution 3.0 IGO (CC BY 3.0 IGO)',
    official: false,
    reviewed: '2024-10',
    status: 'Unofficial boundary reference; establishment date unknown',
    parentLevel: 'province-level region',
    childLevel: 'prefecture-level division',
    childLabel: 'prefecture-level division',
    childrenLabel: 'prefecture-level divisions',
    viewLabel: 'Prefecture-level view',
    filter: '31 mainland province-level parents matching the existing Atlas China view; Taiwan, Hong Kong and Macao source records excluded; SHP geometry retained without additional simplification'
  }
});

if (Object.keys(usa.parents).length !== EXPECTED_US_PARENTS || Object.keys(chn.parents).length !== EXPECTED_CHINA_PARENTS) {
  throw new Error('Generated Admin-2 parent counts do not match the approved coverage.');
}

const allFeatures = [...usFeatures, ...chinaFeatures].sort((left, right) => left.properties.code.localeCompare(right.properties.code));
const geometryFingerprint = sha256(allFeatures.map(feature => (
  `${feature.properties.parentCode}|${feature.properties.code}|${JSON.stringify(feature.geometry)}`
)).join('\n'));
const recordFingerprint = sha256(allFeatures.map(feature => (
  [feature.properties.parentCode, feature.properties.code, feature.properties.name, feature.properties.label, feature.properties.type]
    .join('|')
)).join('\n'));
const manifest = {
  schemaVersion: 1,
  generatedAt,
  scope: 'Lazy parent-sharded cartographic Admin-2 references for the United States and China',
  dataNotice: 'These boundaries do not contain or imply DataFast county or prefecture totals. Neutral subdivisions do not mean zero activity; published city beacons remain a separate breakdown.',
  totals: {
    countries: 2,
    parents: usa.totals.parents + chn.totals.parents,
    subdivisions: usa.totals.subdivisions + chn.totals.subdivisions,
    coordinatePositionCount: usa.totals.coordinatePositionCount + chn.totals.coordinatePositionCount,
    geometryFingerprint,
    recordFingerprint
  },
  countries: { USA: usa, CHN: chn }
};
fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

console.log([
  `Generated Admin-2 manifest with ${manifest.totals.subdivisions} subdivisions across ${manifest.totals.parents} lazy parent shards.`,
  `United States: ${usa.totals.subdivisions} counties/county-equivalents in ${usa.totals.parents} state shards.`,
  `China: ${chn.totals.subdivisions} prefecture-level references in ${chn.totals.parents} province-level shards.`
].join('\n'));
