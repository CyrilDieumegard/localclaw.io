import * as THREE from './vendor/three.module.min.js';

const DATA_URL = '/data/local-ai-activity-index.json?v=20260829g';
const WORLD_URL = '/data/ne_50m_admin_0_countries.geojson?v=20260829f';
const US_STATES_URL = '/data/us-states-2024-20m.geojson?v=20260829b';
const ADMIN1_MANIFEST_URL = '/data/admin1/manifest.json?v=20260829h';
const ADMIN1_ACTIVITY_URL = '/data/local-ai-admin1-activity.json?v=20260829h';
const PUBLISH_THRESHOLD = 5;
const ADMIN1_CACHE_LIMIT = 4;
const GLOBE_RADIUS = 3.65;
const MOBILE_BREAKPOINT = 760;
const DESKTOP_TEXTURE_WIDTH = 4096;
const MOBILE_TEXTURE_WIDTH = 2048;
const DESKTOP_DPR_MIN = 2;
const DESKTOP_DPR_MAX = 2.5;
const MOBILE_DPR_MAX = 1.75;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const stage = document.querySelector('[data-atlas-stage]');
const canvas = document.querySelector('#atlas-globe');
const tooltip = document.querySelector('[data-atlas-tooltip]');
const spotlight = document.querySelector('[data-atlas-spotlight]');
const toast = document.querySelector('[data-atlas-toast]');
const fallbackNote = document.querySelector('[data-atlas-fallback-note]');
const regionPanel = document.querySelector('[data-atlas-region-panel]');
const regionList = document.querySelector('[data-atlas-region-list]');
const title = document.querySelector('[data-atlas-title]');
const summary = document.querySelector('[data-atlas-summary]');
const liveLabel = document.querySelector('[data-atlas-live]');
const zoomLevel = document.querySelector('[data-atlas-zoom-level]');
const tourButton = document.querySelector('[data-atlas-tour]');
const tourLabel = document.querySelector('[data-atlas-tour-label]');
const labelLayer = document.querySelector('.atlas-label-layer');

if (!stage || !canvas) {
  throw new Error('Local AI Activity Index stage is missing.');
}

const aliases = new Map([
  ['United States', ['United States of America', 'United States']],
  ['Russia', ['Russia', 'Russian Federation']],
  ['South Korea', ['South Korea', 'Republic of Korea']],
  ['Viet Nam', ['Vietnam', 'Viet Nam']],
  ['Taiwan', ['Taiwan']],
  ['Hong Kong', ['Hong Kong S.A.R.', 'Hong Kong']],
  ['Czechia', ['Czechia', 'Czech Republic']],
  ['Turkey', ['Turkey', 'Türkiye']],
  ['Bolivia', ['Bolivia']],
  ['Tanzania', ['United Republic of Tanzania', 'Tanzania']],
  ['Syrian Arab Republic', ['Syria', 'Syrian Arab Republic']],
  ['Moldova', ['Moldova', 'Republic of Moldova']],
  ['Réunion', ['Reunion', 'Réunion']]
]);

const countryDetailOverrides = new Map([
  ['China', {
    viewLabel: 'Province-level view',
    liveLabel: 'Province-level exploration',
    regionLabel: 'province-level region',
    regionsLabel: 'province-level regions',
    titleEmphasis: 'across China’s province-level regions.'
  }],
  ['Russia', {
    viewLabel: 'Federal-subject view',
    liveLabel: 'Federal-subject exploration',
    regionLabel: 'federal subject',
    regionsLabel: 'federal subjects',
    titleEmphasis: 'across Russia’s federal subjects.'
  }]
]);

const admin1NameOverrides = new Map([
  ['RUS-2399', 'Altai Krai'],
  ['RUS-2400', 'Altai Republic'],
  ['RUS-2364', 'Moscow Oblast'],
  ['RUS-2365', 'Moscow']
]);

const admin1CodeOverrides = new Map([
  ['RUS-2399', ['RU-ALT']],
  ['RUS-2400', ['RU-AL']],
  ['RUS-2364', ['RU-MOS']],
  ['RUS-2365', ['RU-MOW']]
]);

const countryHubs = {
  'United States': [[40.71, -74.01], [37.77, -122.42], [34.05, -118.24], [47.61, -122.33], [41.88, -87.63], [30.27, -97.74], [42.36, -71.06]],
  'Germany': [[52.52, 13.41], [48.14, 11.58], [50.11, 8.68], [53.55, 9.99]],
  'China': [[39.90, 116.40], [31.23, 121.47], [22.54, 114.06], [30.57, 104.07]],
  'United Kingdom': [[51.51, -0.13], [53.48, -2.24], [55.95, -3.19]],
  'India': [[19.08, 72.88], [12.97, 77.59], [28.61, 77.21], [17.39, 78.49]],
  'Netherlands': [[52.37, 4.90], [51.92, 4.48]],
  'France': [[48.86, 2.35], [45.76, 4.84], [43.30, 5.37]],
  'Canada': [[43.65, -79.38], [49.28, -123.12], [45.50, -73.57]],
  'Hong Kong': [[22.32, 114.17]],
  'Australia': [[-33.87, 151.21], [-37.81, 144.96], [-27.47, 153.03]],
  'Switzerland': [[47.38, 8.54], [46.20, 6.14]],
  'Italy': [[45.46, 9.19], [41.90, 12.50], [44.49, 11.34]],
  'Spain': [[40.42, -3.70], [41.39, 2.17]],
  'Japan': [[35.68, 139.65], [34.69, 135.50]],
  'Brazil': [[-23.55, -46.63], [-22.91, -43.17], [-15.79, -47.88]],
  'Poland': [[52.23, 21.01], [50.06, 19.94]],
  'Sweden': [[59.33, 18.07], [57.71, 11.97]],
  'South Korea': [[37.57, 126.98], [35.18, 129.08]],
  'Finland': [[60.17, 24.94]],
  'Russia': [[55.76, 37.62], [59.93, 30.34], [55.03, 82.92]],
  'Austria': [[48.21, 16.37]],
  'Turkey': [[41.01, 28.98], [39.93, 32.86]],
  'Indonesia': [[-6.21, 106.85], [-7.25, 112.75]],
  'Czechia': [[50.08, 14.44]],
  'Thailand': [[13.76, 100.50]],
  'Denmark': [[55.68, 12.57]],
  'Belgium': [[50.85, 4.35]],
  'Norway': [[59.91, 10.75]],
  'Ukraine': [[50.45, 30.52]],
  'Romania': [[44.43, 26.10]],
  'Portugal': [[38.72, -9.14], [41.16, -8.63]],
  'Ireland': [[53.35, -6.26]],
  'Malaysia': [[3.14, 101.69]],
  'Viet Nam': [[21.03, 105.85], [10.82, 106.63]],
  'Taiwan': [[25.03, 121.57]],
  'Mexico': [[19.43, -99.13], [20.67, -103.35]],
  'South Africa': [[-26.20, 28.04], [-33.92, 18.42]],
  'New Zealand': [[-36.85, 174.76]],
  'Pakistan': [[24.86, 67.01], [31.55, 74.34]],
  'Chile': [[-33.45, -70.67]],
  'Israel': [[32.09, 34.78]],
  'Hungary': [[47.50, 19.04]],
  'Bulgaria': [[42.70, 23.32]],
  'United Arab Emirates': [[25.20, 55.27]],
  'Philippines': [[14.60, 120.98]],
  'Colombia': [[4.71, -74.07]],
  'Slovakia': [[48.15, 17.11]],
  'Argentina': [[-34.60, -58.38]],
  'Egypt': [[30.04, 31.24]],
  'Azerbaijan': [[40.41, 49.87]],
  'Greece': [[37.98, 23.73]],
  'Kazakhstan': [[43.24, 76.89], [51.17, 71.45]],
  'Cambodia': [[11.56, 104.93]],
  'Latvia': [[56.95, 24.11]],
  'Belarus': [[53.90, 27.57]],
  'Estonia': [[59.44, 24.75]],
  'Uzbekistan': [[41.30, 69.24]],
  'Nepal': [[27.72, 85.32]],
  'Peru': [[-12.05, -77.04]],
  'Bangladesh': [[23.81, 90.41]],
  'Croatia': [[45.81, 15.98]],
  'Saudi Arabia': [[24.71, 46.68]]
};

const state = {
  data: null,
  world: null,
  usBoundaries: null,
  admin1Manifest: null,
  admin1Activity: null,
  admin1Boundaries: null,
  admin1ActivityByA3: new Map(),
  admin1Cache: new Map(),
  admin1LoadToken: 0,
  admin1Loading: false,
  usData: null,
  countries: [],
  worldCountries: [],
  usRegions: [],
  countryByName: new Map(),
  usRegionByName: new Map(),
  countryFeatures: new Map(),
  countryByFeature: new Map(),
  stateFeatures: new Map(),
  centers: new Map(),
  usCenters: new Map(),
  scene: null,
  camera: null,
  renderer: null,
  globe: null,
  globeGroup: null,
  texture: null,
  textureWidth: null,
  pixelRatio: null,
  glowTexture: null,
  worldBoundaryLine: null,
  worldHeatTexture: null,
  usHeatTexture: null,
  worldHeatMesh: null,
  usHeatMesh: null,
  selectionCanvas: null,
  selectionContext: null,
  selectionTexture: null,
  selectionMesh: null,
  selectionBoundaryLine: null,
  pulseSprites: [],
  pulseRings: [],
  backgroundField: null,
  worldActivity: [],
  usGroup: null,
  stateLineGroups: new Map(),
  selectedStateLine: null,
  detailCountry: null,
  detailConfig: null,
  detailManifest: null,
  detailActivity: null,
  detailDataStatus: 'not_collected',
  detailFeatures: [],
  detailRegions: [],
  detailRankedRegions: [],
  detailTotals: {
    signals: null,
    regions: null,
    observedSignals: null,
    observedRegions: null,
    countrySignals: null,
    publishThreshold: PUBLISH_THRESHOLD,
    clusters: 0,
    unassignedClusters: 0,
    unresolvedRows: 0
  },
  detailGroup: null,
  detailHeatTexture: null,
  detailHeatMesh: null,
  detailBoundaryLine: null,
  admin1AssignmentByCluster: new Map(),
  cityClusters: [],
  clusterGroup: null,
  clusterEntries: [],
  clusterHitMeshes: [],
  clusterLabels: [],
  countryByCode: new Map(),
  scope: 'world',
  targetRotation: new THREE.Vector2(0.38, -0.1),
  rotationVelocity: new THREE.Vector2(0, 0),
  dragging: false,
  dragStart: new THREE.Vector2(),
  dragLast: new THREE.Vector2(),
  rotationStart: new THREE.Vector2(),
  pointer: new THREE.Vector2(10, 10),
  raycaster: new THREE.Raycaster(),
  interactionSphere: new THREE.Sphere(),
  interactionPoint: new THREE.Vector3(),
  interactionScale: new THREE.Vector3(),
  zoom: null,
  pinchStartZoom: null,
  pinchStartDistance: null,
  activePointers: new Map(),
  pinching: false,
  tourTimer: null,
  tourIndex: 0,
  tourAdvancing: false,
  focusTransition: null,
  revealStartedAt: null,
  revealFromZoom: null,
  lastLabelUpdate: 0,
  mobileLayout: null,
  hovered: null,
  locked: null,
  lastInteractionAt: performance.now(),
  running: true,
  inViewport: true,
  contextLost: false,
  initialized: false,
  placementStats: {
    world: { points: 0, outside: 0, missingGeometry: 0 },
    us: { points: 0, outside: 0, missingGeometry: 0 }
  },
  theme: document.documentElement.classList.contains('light') ? 'light' : 'dark'
};

function number(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function isMobileViewport(width = window.innerWidth) {
  return width < MOBILE_BREAKPOINT;
}

function atlasTextureWidth() {
  return isMobileViewport() ? MOBILE_TEXTURE_WIDTH : DESKTOP_TEXTURE_WIDTH;
}

function atlasPixelRatio(width = stage.clientWidth, height = stage.clientHeight) {
  const deviceRatio = Math.max(1, Number(window.devicePixelRatio) || 1);
  if (isMobileViewport(width)) return Math.min(deviceRatio, MOBILE_DPR_MAX);
  const cssPixels = Math.max(1, width * height);
  const smartCap = cssPixels > 2300000 ? DESKTOP_DPR_MIN : cssPixels > 1300000 ? 2.25 : DESKTOP_DPR_MAX;
  return Math.min(Math.max(deviceRatio, DESKTOP_DPR_MIN), smartCap);
}

function globeGeometry(radius) {
  const mobile = isMobileViewport();
  return new THREE.SphereGeometry(radius, mobile ? 128 : 256, mobile ? 80 : 160);
}

function configureAtlasTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.offset.x = 0.25;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(16, state.renderer?.capabilities.getMaxAnisotropy?.() || 4);
  return texture;
}

function normalizeCityClusters(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(cluster => ({
      ...cluster,
      kind: 'cityCluster',
      city: String(cluster?.city || '').trim(),
      country: String(cluster?.country || '').trim(),
      countryCode: String(cluster?.countryCode || '').trim().toUpperCase(),
      region: cluster?.region ? String(cluster.region).trim() : '',
      regionCode: cluster?.regionCode ? String(cluster.regionCode).trim().toUpperCase() : '',
      signals: Number(cluster?.signals),
      lat: Number(cluster?.lat),
      lon: Number(cluster?.lon),
      qualityFlags: Array.isArray(cluster?.qualityFlags) ? cluster.qualityFlags : []
    }))
    .filter(cluster => cluster.city
      && cluster.countryCode
      && Number.isFinite(cluster.signals)
      && cluster.signals >= PUBLISH_THRESHOLD
      && Number.isFinite(cluster.lat)
      && Number.isFinite(cluster.lon)
      && cluster.lat >= -90
      && cluster.lat <= 90
      && cluster.lon >= -180
      && cluster.lon <= 180)
    .sort((a, b) => b.signals - a.signals || a.city.localeCompare(b.city));
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFactory(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function latLonToVector(lat, lon, radius = GLOBE_RADIUS) {
  const latitude = THREE.MathUtils.degToRad(lat);
  const longitude = THREE.MathUtils.degToRad(lon);
  const cos = Math.cos(latitude);
  return new THREE.Vector3(
    radius * cos * Math.sin(longitude),
    radius * Math.sin(latitude),
    radius * cos * Math.cos(longitude)
  );
}

function vectorToLatLon(vector) {
  const normalized = vector.clone().normalize();
  return {
    lat: THREE.MathUtils.radToDeg(Math.asin(normalized.y)),
    lon: THREE.MathUtils.radToDeg(Math.atan2(normalized.x, normalized.z))
  };
}

function featureNames(feature) {
  const properties = feature.properties || {};
  return [properties.ADMIN, properties.NAME, properties.NAME_EN]
    .filter(Boolean)
    .map(value => String(value));
}

function admin0A3ForFeature(feature) {
  const properties = feature?.properties || {};
  return [properties.ADM0_A3, properties.ISO_A3_EH, properties.ISO_A3, properties.WB_A3]
    .map(value => String(value || '').trim().toUpperCase())
    .find(value => value && value !== '-99') || '';
}

function alpha2ForFeature(feature) {
  const properties = feature?.properties || {};
  return [properties.ISO_A2_EH, properties.ISO_A2, properties.WB_A2]
    .map(value => String(value || '').trim().toUpperCase())
    .find(value => value && value !== '-99') || '';
}

function manifestEntryForCountry(country) {
  const adm0A3 = country?.adm0A3 || admin0A3ForFeature(country?.feature || featureForCountry(country?.name));
  return state.admin1Manifest?.countries?.[adm0A3] || null;
}

function activityRecordForCountry(country) {
  const adm0A3 = country?.adm0A3 || admin0A3ForFeature(country?.feature || featureForCountry(country?.name));
  return state.admin1ActivityByA3.get(adm0A3) || null;
}

function featureForCountry(countryName) {
  if (state.countryFeatures.has(countryName)) return state.countryFeatures.get(countryName);
  const expected = aliases.get(countryName) || [countryName];
  return state.world?.features.find(feature => {
    const names = featureNames(feature);
    return expected.some(name => names.includes(name));
  }) || null;
}

function buildWorldCountryEntities() {
  const publishedByFeature = new Map(state.countries
    .map(country => [featureForCountry(country.name), country])
    .filter(([feature]) => Boolean(feature)));
  const countries = [];
  state.countryByFeature = new Map();
  for (const feature of state.world?.features || []) {
    const adm0A3 = admin0A3ForFeature(feature);
    const manifest = state.admin1Manifest?.countries?.[adm0A3];
    if (!manifest) continue;
    const published = publishedByFeature.get(feature) || null;
    const names = featureNames(feature);
    const entity = published || {
      rank: null,
      name: manifest.name || names[0] || adm0A3,
      signals: null
    };
    entity.kind = 'country';
    entity.feature = feature;
    entity.adm0A3 = adm0A3;
    entity.countryCode = alpha2ForFeature(feature);
    entity.manifest = manifest;
    entity.published = Boolean(published);
    countries.push(entity);
    state.countryByFeature.set(feature, entity);
  }
  state.worldCountries = countries;
}

function featureForCountryCode(countryCode) {
  const expected = String(countryCode || '').trim().toUpperCase();
  if (!expected) return null;
  const features = state.world?.features || [];
  const isoMatch = features.find(feature => {
    const properties = feature.properties || {};
    return [properties.ISO_A2, properties.ISO_A2_EH, properties.WB_A2]
      .some(value => String(value || '').toUpperCase() === expected);
  });
  if (isoMatch) return isoMatch;
  return features.find(feature => String(feature.properties?.POSTAL || '').toUpperCase() === expected) || null;
}

function polygonsForGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function normalizeLongitude(longitude) {
  let normalized = longitude;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function longitudeNear(longitude, reference) {
  let adjusted = longitude;
  while (adjusted - reference > 180) adjusted -= 360;
  while (reference - adjusted > 180) adjusted += 360;
  return adjusted;
}

function pointInRing(lat, lon, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const xi = longitudeNear(ring[index][0], lon);
    const yi = ring[index][1];
    const xj = longitudeNear(ring[previous][0], lon);
    const yj = ring[previous][1];
    const intersects = ((yi > lat) !== (yj > lat))
      && (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lat, lon, polygon) {
  if (!polygon?.length || !pointInRing(lat, lon, polygon[0])) return false;
  for (let index = 1; index < polygon.length; index += 1) {
    if (pointInRing(lat, lon, polygon[index])) return false;
  }
  return true;
}

function pointInFeature(lat, lon, feature) {
  return polygonsForGeometry(feature?.geometry).some(polygon => pointInPolygon(lat, lon, polygon));
}

function pointNearFeature(lat, lon, feature, tolerance = 0.35) {
  if (pointInFeature(lat, lon, feature)) return true;
  for (const latOffset of [-tolerance, -tolerance / 2, 0, tolerance / 2, tolerance]) {
    for (const lonOffset of [-tolerance, -tolerance / 2, 0, tolerance / 2, tolerance]) {
      if (latOffset === 0 && lonOffset === 0) continue;
      if (pointInFeature(lat + latOffset, normalizeLongitude(lon + lonOffset), feature)) return true;
    }
  }
  return false;
}

function ringArea(ring) {
  if (ring == null || ring.length === 0) return 0;
  let area = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    area += ring[previous][0] * ring[index][1] - ring[index][0] * ring[previous][1];
  }
  return area / 2;
}

function ringCentroid(ring) {
  const area = ringArea(ring);
  if (ring == null || ring.length === 0 || Math.abs(area) < 1e-8) return null;
  let lon = 0;
  let lat = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const cross = ring[previous][0] * ring[index][1] - ring[index][0] * ring[previous][1];
    lon += (ring[previous][0] + ring[index][0]) * cross;
    lat += (ring[previous][1] + ring[index][1]) * cross;
  }
  return [lat / (6 * area), normalizeLongitude(lon / (6 * area))];
}

function representativePoint(feature, seed = 1) {
  const polygons = polygonsForGeometry(feature?.geometry)
    .filter(polygon => polygon?.[0]?.length)
    .sort((a, b) => Math.abs(ringArea(b[0])) - Math.abs(ringArea(a[0])));
  const polygon = polygons[0];
  if (!polygon) return null;
  const centroid = ringCentroid(polygon[0]);
  if (centroid && pointInPolygon(centroid[0], centroid[1], polygon)) return centroid;

  const longitudes = polygon[0].map(point => point[0]);
  const latitudes = polygon[0].map(point => point[1]);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const random = randomFactory(seed);
  for (let attempt = 0; attempt < 512; attempt += 1) {
    const lat = minLat + random() * (maxLat - minLat);
    const lon = minLon + random() * (maxLon - minLon);
    if (pointInPolygon(lat, lon, polygon)) return [lat, normalizeLongitude(lon)];
  }
  const fallback = polygon[0][Math.floor(polygon[0].length / 2)];
  return fallback ? [fallback[1], normalizeLongitude(fallback[0])] : null;
}

function featureCenter(feature) {
  if (!feature) return null;
  const properties = feature.properties || {};
  const lon = Number(properties.LABEL_X ?? properties.LABEL_LON ?? properties.CENTROID_X);
  const lat = Number(properties.LABEL_Y ?? properties.LABEL_LAT ?? properties.CENTROID_Y);
  if (Number.isFinite(lat) && Number.isFinite(lon) && pointInFeature(lat, lon, feature)) return [lat, lon];

  return representativePoint(feature, hashString(feature.properties?.NAME || 'feature'));
}

function centerForCountry(country) {
  const hubs = countryHubs[country.name];
  const feature = country.feature || featureForCountry(country.name);
  const interior = featureCenter(feature);
  if (interior) return interior;
  return hubs?.[0] || null;
}

function countryForCode(countryCode) {
  const expected = String(countryCode || '').trim().toUpperCase();
  if (!expected) return null;
  if (state.countryByCode.has(expected)) return state.countryByCode.get(expected);
  const feature = featureForCountryCode(expected);
  return state.countries.find(country => featureForCountry(country.name) === feature) || null;
}

function featureForState(stateName) {
  return state.stateFeatures.get(stateName)
    || state.usBoundaries?.features.find(feature => feature.properties?.NAME === stateName)
    || null;
}

function centerForState(region) {
  return featureCenter(featureForState(region.name));
}

function regionForCode(regionCode) {
  const expected = String(regionCode || '').trim().toUpperCase();
  return state.usRegions.find(region => String(region.code || '').toUpperCase() === expected) || null;
}

function featureBounds(feature) {
  const bounds = {
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity,
    unboundedLongitude: false
  };
  const visit = value => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      bounds.minLon = Math.min(bounds.minLon, value[0]);
      bounds.minLat = Math.min(bounds.minLat, value[1]);
      bounds.maxLon = Math.max(bounds.maxLon, value[0]);
      bounds.maxLat = Math.max(bounds.maxLat, value[1]);
      return;
    }
    value.forEach(visit);
  };
  visit(feature?.geometry?.coordinates);
  if (!Number.isFinite(bounds.minLon)) return null;
  bounds.unboundedLongitude = bounds.maxLon - bounds.minLon > 180;
  return bounds;
}

function pointInBounds(lat, lon, bounds) {
  if (!bounds || lat < bounds.minLat || lat > bounds.maxLat) return false;
  return bounds.unboundedLongitude || (lon >= bounds.minLon && lon <= bounds.maxLon);
}

function admin1ZoomForBbox(bbox, mobile = isMobileViewport()) {
  if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite)) {
    return mobile ? 9 : 7;
  }
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const middleLatitude = THREE.MathUtils.degToRad((minLat + maxLat) / 2);
  const longitudeSpan = THREE.MathUtils.degToRad(
    Math.min(180, Math.max(0.05, maxLon - minLon)) * Math.max(0.2, Math.cos(middleLatitude))
  );
  const latitudeSpan = THREE.MathUtils.degToRad(Math.min(170, Math.max(0.05, maxLat - minLat)));
  const width = Math.max(1, stage.clientWidth || window.innerWidth);
  const height = Math.max(1, stage.clientHeight || window.innerHeight);
  const aspect = width / height;
  const verticalFov = THREE.MathUtils.degToRad(mobile ? 42 : 34);
  const verticalTangent = Math.tan(verticalFov / 2);
  const horizontalTangent = verticalTangent * aspect;
  const targetFill = mobile ? 0.74 : 0.68;
  const distanceForSpan = (span, tangent) => {
    const halfSpan = THREE.MathUtils.clamp(span / 2, 0.0005, Math.PI * 0.47);
    return GLOBE_RADIUS * Math.cos(halfSpan)
      + (GLOBE_RADIUS * Math.sin(halfSpan)) / Math.max(0.04, tangent * targetFill);
  };
  const fittedDistance = Math.max(
    distanceForSpan(latitudeSpan, verticalTangent),
    distanceForSpan(longitudeSpan, horizontalTangent)
  );
  // Keep the camera safely outside the globe while allowing small countries to
  // become the subject of the regional view instead of remaining map-sized dots.
  return THREE.MathUtils.clamp(fittedDistance, GLOBE_RADIUS + 0.28, mobile ? 11.2 : 10.8);
}

function detailConfigForCountry(country) {
  const manifest = manifestEntryForCountry(country);
  if (!manifest) return null;
  const activity = activityRecordForCountry(country);
  const override = countryDetailOverrides.get(country.name) || {};
  const dominantType = manifest.types?.[0]?.type;
  const genericLabel = dominantType && manifest.types.length === 1
    ? String(dominantType).toLowerCase()
    : 'administrative region';
  const regionLabel = override.regionLabel || genericLabel;
  const regionsLabel = override.regionsLabel || pluralizeRegionLabel(regionLabel);
  return {
    countryName: country.name,
    alpha2: activity?.countryCode || country.countryCode || alpha2ForFeature(country.feature),
    adm0A3: country.adm0A3,
    viewLabel: override.viewLabel || 'Administrative view',
    liveLabel: override.liveLabel || 'Regional exploration',
    regionLabel,
    regionsLabel,
    titleEmphasis: override.titleEmphasis || `across ${country.name}’s administrative regions.`,
    desktopZoom: admin1ZoomForBbox(manifest.bbox, false),
    mobileZoom: admin1ZoomForBbox(manifest.bbox, true),
    manifest,
    activity
  };
}

function pluralizeRegionLabel(label) {
  if (label.endsWith('s')) return label;
  if (/[^aeiou]y$/i.test(label)) return `${label.slice(0, -1)}ies`;
  if (/(?:ch|sh|x|z)$/i.test(label)) return `${label}es`;
  return `${label}s`;
}

function admin1DataStatus(activity) {
  const status = String(activity?.publicationStatus || '').trim();
  if (['unavailable', 'none_above_threshold', 'boundary_unresolved'].includes(status)) return status;
  if (status === 'published') return 'published';
  return 'not_collected';
}

function admin1StatusMessage(status = state.detailDataStatus) {
  const threshold = state.detailTotals.publishThreshold || PUBLISH_THRESHOLD;
  if (status === 'unavailable') {
    return 'The provider regional breakdown was unavailable for this snapshot. Administrative boundaries are shown without regional totals.';
  }
  if (status === 'none_above_threshold') {
    return `A regional breakdown was collected, but no row reaches the ${threshold}-signal publication threshold.`;
  }
  if (status === 'boundary_unresolved') {
    return 'A regional breakdown was collected, but it could not be mapped safely to these boundaries. No regional total is shown.';
  }
  if (status === 'not_collected') {
    return 'No country-filtered regional snapshot was collected. Administrative boundaries are shown without regional totals.';
  }
  return `Published regional totals independently meet the ${threshold}-signal privacy threshold.`;
}

function admin1EntityStatusMessage(entity) {
  if (state.detailDataStatus === 'published' && !entity?.published) {
    return 'No regional total is published for this administrative boundary.';
  }
  return admin1StatusMessage();
}

function setAdmin1Busy(busy, country = null) {
  state.admin1Loading = Boolean(busy);
  if (busy) {
    stage.setAttribute('aria-busy', 'true');
    stage.dataset.admin1Loading = country?.adm0A3 || '';
    regionPanel?.setAttribute('aria-busy', 'true');
  } else {
    stage.removeAttribute('aria-busy');
    delete stage.dataset.admin1Loading;
    regionPanel?.removeAttribute('aria-busy');
  }
}

async function loadAdmin1Shard(manifest) {
  const key = manifest?.code;
  if (!key || !manifest.path) throw new Error('Administrative boundary manifest entry is incomplete.');
  if (state.admin1Cache.has(key)) {
    const cached = state.admin1Cache.get(key);
    state.admin1Cache.delete(key);
    state.admin1Cache.set(key, cached);
    return cached;
  }
  const separator = manifest.path.includes('?') ? '&' : '?';
  const response = await fetch(`${manifest.path}${separator}v=${String(manifest.sha256 || state.admin1Manifest?.generatedAt || '').slice(0, 16)}`);
  if (!response.ok) throw new Error(`Administrative boundaries could not be loaded (${response.status}).`);
  const shard = await response.json();
  if (shard?.type !== 'FeatureCollection' || !Array.isArray(shard.features) || shard.adm0A3 !== key) {
    throw new Error('Administrative boundary shard is invalid.');
  }
  state.admin1Cache.set(key, shard);
  while (state.admin1Cache.size > ADMIN1_CACHE_LIMIT) {
    state.admin1Cache.delete(state.admin1Cache.keys().next().value);
  }
  return shard;
}

function isAdmin1Scope() {
  return state.scope === 'admin1' && Boolean(state.detailCountry && state.detailConfig);
}

function admin1CountryMatches(feature, config) {
  const properties = feature?.properties || {};
  const adm0A3 = String(properties.adm0_a3 ?? properties.ADM0_A3 ?? properties.sov_a3 ?? properties.SOV_A3 ?? '').toUpperCase();
  return adm0A3 === config.adm0A3;
}

function admin1FeatureName(feature, index = 0) {
  const properties = feature?.properties || {};
  const override = admin1FeatureCodes(feature).map(code => admin1NameOverrides.get(code)).find(Boolean);
  if (override) return override;
  return String(properties.name_en ?? properties.NAME_EN ?? properties.name ?? properties.NAME ?? `Region ${index + 1}`).trim();
}

function admin1FeatureType(feature) {
  const properties = feature?.properties || {};
  const rawType = String(properties.type_en ?? properties.TYPE_EN ?? properties.type ?? properties.TYPE ?? '').trim();
  const adm0A3 = String(properties.adm0_a3 ?? properties.ADM0_A3 ?? '').toUpperCase();
  if (adm0A3 !== 'RUS') return rawType;
  return new Map([
    ['Region', 'Oblast'],
    ['Territory', 'Krai'],
    ['Autonomous Province', 'Autonomous Okrug'],
    ['Autonomous Region', 'Autonomous Oblast']
  ]).get(rawType) || rawType;
}

function normalizeAdmin1Key(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(province|provinsi|sheng|shi|autonomous region|autonomous oblast|republic|republic of|oblast|krai|federal city|city)\b/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function admin1FeatureCodes(feature) {
  const properties = feature?.properties || {};
  const adm1Code = String(properties.adm1_code ?? properties.ADM1_CODE ?? '').trim().toUpperCase();
  const canonicalOverrides = admin1CodeOverrides.get(adm1Code);
  if (canonicalOverrides) return [...canonicalOverrides, adm1Code];
  return [
    properties.iso_3166_2,
    properties.ISO_3166_2,
    properties.adm1_code,
    properties.ADM1_CODE,
    properties.code_hasc,
    properties.CODE_HASC,
    properties.postal,
    properties.POSTAL
  ].filter(Boolean).map(value => String(value).trim().toUpperCase());
}

function combinedAdmin1Feature(features, name) {
  if (features.length === 1) return features[0];
  return {
    type: 'Feature',
    properties: { name, name_en: name, composite: true },
    geometry: {
      type: 'MultiPolygon',
      coordinates: features.flatMap(feature => polygonsForGeometry(feature.geometry))
    }
  };
}

function buildAdmin1Aggregation(country, config) {
  const sourceFeatures = Array.isArray(state.admin1Boundaries?.features) ? state.admin1Boundaries.features : [];
  const features = sourceFeatures.filter(feature => admin1CountryMatches(feature, config));
  const regions = features.map((feature, index) => ({
    kind: 'admin1',
    name: admin1FeatureName(feature, index),
    type: admin1FeatureType(feature),
    country: country.name,
    countryCode: config.alpha2,
    feature,
    bounds: featureBounds(feature),
    center: featureCenter(feature),
    signals: null,
    clusters: [],
    rank: null,
    published: false,
    activityEntity: null,
    qualityFlag: false,
    qualityFlags: [],
    qualityNote: '',
    codes: admin1FeatureCodes(feature)
  }));
  const activity = config.activity || null;
  const sourceRegions = Array.isArray(activity?.regions) ? activity.regions : [];
  const publishThreshold = Number(state.admin1Activity?.publishThreshold) || PUBLISH_THRESHOLD;
  const regionByFeature = new Map(regions.map(region => [region.feature, region]));
  const featureById = new Map();
  for (const feature of features) {
    for (const code of admin1FeatureCodes(feature)) featureById.set(code, feature);
  }
  const ranked = [];
  let unresolvedRows = 0;
  for (const sourceRegion of sourceRegions) {
    const boundaryIds = [...new Set((sourceRegion.boundaryFeatureIds || [])
      .map(value => String(value || '').trim().toUpperCase())
      .filter(Boolean))];
    const mappedFeatures = [...new Set(boundaryIds.map(id => featureById.get(id)).filter(Boolean))];
    if (!mappedFeatures.length || mappedFeatures.length !== boundaryIds.length) {
      unresolvedRows += 1;
      continue;
    }
    const signals = Number(sourceRegion.signals);
    if (!Number.isFinite(signals) || signals < publishThreshold) continue;
    const name = String(sourceRegion.canonicalName || sourceRegion.sourceName || 'Published region').trim();
    const feature = combinedAdmin1Feature(mappedFeatures, name);
    const entity = {
      kind: 'admin1',
      name,
      sourceName: String(sourceRegion.sourceName || ''),
      type: mappedFeatures.length > 1 ? config.regionLabel : admin1FeatureType(mappedFeatures[0]),
      country: country.name,
      countryCode: config.alpha2,
      feature,
      features: mappedFeatures,
      bounds: featureBounds(feature),
      center: featureCenter(feature),
      signals,
      clusters: [],
      rank: Number(sourceRegion.rank) || null,
      published: true,
      boundaryMatch: String(sourceRegion.boundaryMatch || ''),
      boundaryFeatureIds: boundaryIds,
      qualityFlag: Boolean(sourceRegion.qualityFlag),
      qualityFlags: Array.isArray(sourceRegion.qualityFlags) ? sourceRegion.qualityFlags : [],
      qualityNote: String(sourceRegion.qualityNote || '')
    };
    ranked.push(entity);
    for (const mappedFeature of mappedFeatures) {
      const baseRegion = regionByFeature.get(mappedFeature);
      if (baseRegion) baseRegion.activityEntity = entity;
    }
  }
  ranked.sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity) || b.signals - a.signals || a.name.localeCompare(b.name));
  ranked.forEach((region, index) => { region.rank = index + 1; });

  let dataStatus = admin1DataStatus(activity);
  if (unresolvedRows > 0 && ranked.length === 0) dataStatus = 'boundary_unresolved';
  const assignments = new Map();
  let unassignedClusters = 0;
  const clusters = state.cityClusters.filter(cluster => cluster.countryCode === config.alpha2);
  for (const cluster of clusters) {
    const baseRegion = regions.find(candidate => pointInBounds(cluster.lat, cluster.lon, candidate.bounds)
      && pointInFeature(cluster.lat, cluster.lon, candidate.feature));
    if (!baseRegion) {
      unassignedClusters += 1;
      continue;
    }
    const assignedRegion = baseRegion.activityEntity || baseRegion;
    assignedRegion.clusters.push(cluster);
    assignments.set(cluster, assignedRegion);
  }
  state.detailFeatures = features;
  state.detailRegions = regions;
  state.detailRankedRegions = ranked;
  state.admin1AssignmentByCluster = assignments;
  state.detailDataStatus = dataStatus;
  const published = dataStatus === 'published';
  state.detailTotals = {
    signals: published && Number.isFinite(Number(activity?.publishedSignals)) ? Number(activity.publishedSignals) : null,
    regions: published && Number.isFinite(Number(activity?.publishedRegions)) ? Number(activity.publishedRegions) : null,
    observedSignals: null,
    observedRegions: null,
    countrySignals: Number.isFinite(Number(activity?.countrySignals)) ? Number(activity.countrySignals) : null,
    publishThreshold,
    clusters: assignments.size,
    unassignedClusters,
    unresolvedRows
  };
  return features.length > 0;
}

function admin1RegionAt(lat, lon) {
  const region = state.detailRegions.find(candidate => pointInBounds(lat, lon, candidate.bounds)
    && pointInFeature(lat, lon, candidate.feature));
  return region?.activityEntity || region || null;
}

function featureForEntity(entity) {
  if (!entity) return null;
  if (entity.kind === 'cityCluster') {
    if (state.scope === 'us' && String(entity.countryCode || '').toUpperCase() === 'US') {
      return featureForState(regionForCode(entity.regionCode)?.name);
    }
    if (isAdmin1Scope()) {
      return state.admin1AssignmentByCluster.get(entity)?.feature
        || featureForCountry(state.detailCountry.name);
    }
    return featureForCountry(countryForCode(entity.countryCode)?.name)
      || featureForCountryCode(entity.countryCode);
  }
  if (entity.kind === 'admin1') return entity.feature;
  if (state.scope === 'us') return featureForState(entity.name);
  return entity.feature || featureForCountry(entity.name);
}

function geometryRings(geometry) {
  return polygonsForGeometry(geometry).flatMap(polygon => polygon || []);
}

function boundaryPositions(feature, radius) {
  const positions = [];
  for (const ring of geometryRings(feature?.geometry)) {
    if (!Array.isArray(ring) || ring.length < 2) continue;
    for (let index = 1; index < ring.length; index += 1) {
      const [previousLon, previousLat] = ring[index - 1];
      const [lon, lat] = ring[index];
      if (![previousLon, previousLat, lon, lat].every(Number.isFinite)) continue;
      const start = latLonToVector(previousLat, previousLon, radius);
      const end = latLonToVector(lat, lon, radius);
      positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    }
  }
  return positions;
}

function unwrappedFillRing(ring, referenceLongitude = null) {
  if (!Array.isArray(ring)) return [];
  const points = [];
  let previousLongitude = null;
  for (const coordinate of ring) {
    const rawLongitude = Number(coordinate?.[0]);
    const latitude = Number(coordinate?.[1]);
    if (!Number.isFinite(rawLongitude) || !Number.isFinite(latitude)) continue;
    const longitude = previousLongitude === null
      ? (referenceLongitude === null ? rawLongitude : longitudeNear(rawLongitude, referenceLongitude))
      : longitudeNear(rawLongitude, previousLongitude);
    const previous = points[points.length - 1];
    if (previous && Math.abs(previous.x - longitude) < 1e-10 && Math.abs(previous.y - latitude) < 1e-10) continue;
    points.push(new THREE.Vector2(longitude, latitude));
    previousLongitude = longitude;
  }
  if (points.length > 1) {
    const first = points[0];
    const last = points[points.length - 1];
    if (Math.abs(first.y - last.y) < 1e-10
      && Math.abs(longitudeNear(last.x, first.x) - first.x) < 1e-10) points.pop();
  }
  if (referenceLongitude !== null && points.length > 0) {
    const meanLongitude = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const shift = Math.round((referenceLongitude - meanLongitude) / 360) * 360;
    if (shift !== 0) points.forEach(point => { point.x += shift; });
  }
  return points.length >= 3 ? points : [];
}

function appendSphericalFillTriangle(positions, a, b, c, radius, depth = 0) {
  const maximumChord = 2 * radius * Math.sin(THREE.MathUtils.degToRad(1));
  const maximumChordSquared = maximumChord * maximumChord;
  const ab = a.distanceToSquared(b);
  const bc = b.distanceToSquared(c);
  const ca = c.distanceToSquared(a);
  const longest = Math.max(ab, bc, ca);
  if (depth < 8 && longest > maximumChordSquared) {
    if (longest === ab) {
      const midpoint = a.clone().add(b).normalize().multiplyScalar(radius);
      appendSphericalFillTriangle(positions, a, midpoint, c, radius, depth + 1);
      appendSphericalFillTriangle(positions, midpoint, b, c, radius, depth + 1);
      return;
    }
    if (longest === bc) {
      const midpoint = b.clone().add(c).normalize().multiplyScalar(radius);
      appendSphericalFillTriangle(positions, a, b, midpoint, radius, depth + 1);
      appendSphericalFillTriangle(positions, a, midpoint, c, radius, depth + 1);
      return;
    }
    const midpoint = c.clone().add(a).normalize().multiplyScalar(radius);
    appendSphericalFillTriangle(positions, a, b, midpoint, radius, depth + 1);
    appendSphericalFillTriangle(positions, midpoint, b, c, radius, depth + 1);
    return;
  }

  const normal = b.clone().sub(a).cross(c.clone().sub(a));
  if (normal.lengthSq() < 1e-14) return;
  const outward = a.clone().add(b).add(c);
  const vertices = normal.dot(outward) >= 0 ? [a, b, c] : [a, c, b];
  for (const vertex of vertices) positions.push(vertex.x, vertex.y, vertex.z);
}

function sphericalFillGeometry(feature, radius) {
  const positions = [];
  for (const polygon of polygonsForGeometry(feature?.geometry)) {
    const contour = unwrappedFillRing(polygon?.[0]);
    if (contour.length < 3) continue;
    const referenceLongitude = contour.reduce((sum, point) => sum + point.x, 0) / contour.length;
    const holes = (polygon || []).slice(1)
      .map(ring => unwrappedFillRing(ring, referenceLongitude))
      .filter(ring => ring.length >= 3);
    const sphericalContour = contour.map(point => latLonToVector(point.y, point.x, 1));
    const sphericalHoles = holes.map(ring => ring.map(point => latLonToVector(point.y, point.x, 1)));
    const vertices = [...sphericalContour, ...sphericalHoles.flat()]
      .map(point => point.clone().multiplyScalar(radius));
    const validTriangulation = triangles => Array.isArray(triangles)
      && triangles.length > 0
      && triangles.every(triangle => Array.isArray(triangle)
        && triangle.length === 3
        && triangle.every(index => Number.isInteger(index) && index >= 0 && index < vertices.length));
    let triangles = [];
    try {
      triangles = THREE.ShapeUtils.triangulateShape(
        contour.map(point => point.clone()),
        holes.map(ring => ring.map(point => point.clone()))
      );
    } catch {
      triangles = [];
    }
    if (!validTriangulation(triangles)) {
      const tangentCenter = sphericalContour
        .reduce((sum, point) => sum.add(point), new THREE.Vector3());
      if (tangentCenter.lengthSq() < 1e-12) tangentCenter.copy(sphericalContour[0]);
      tangentCenter.normalize();
      const referenceAxis = Math.abs(tangentCenter.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(0, 0, 1);
      const tangentEast = new THREE.Vector3().crossVectors(referenceAxis, tangentCenter).normalize();
      const tangentNorth = new THREE.Vector3().crossVectors(tangentCenter, tangentEast).normalize();
      const projectToTangent = point => new THREE.Vector2(point.dot(tangentEast), point.dot(tangentNorth));
      try {
        triangles = THREE.ShapeUtils.triangulateShape(
          sphericalContour.map(projectToTangent),
          sphericalHoles.map(ring => ring.map(projectToTangent))
        );
      } catch {
        triangles = [];
      }
    }
    if (!validTriangulation(triangles)) continue;
    for (const triangle of triangles) {
      const points = triangle.map(index => vertices[index]);
      if (points.length !== 3 || points.some(point => !point)) continue;
      appendSphericalFillTriangle(
        positions,
        points[0],
        points[1],
        points[2],
        radius
      );
    }
  }
  if (positions.length === 0) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function admin1FillAppearance(entity, maximum) {
  const intensity = Math.log1p(entity.signals) / Math.log1p(Math.max(maximum, 1));
  const heat = Math.pow(intensity, 1.35);
  const light = state.theme === 'light';
  const red = Math.round((light ? 205 : 88) + heat * (light ? 42 : 167));
  const green = Math.round((light ? 82 : 22) + heat * (light ? 55 : 76));
  const blue = Math.round((light ? 48 : 13) + heat * (light ? -18 : 34));
  const sourceOpacity = 0.18 + heat * (light ? 0.48 : 0.56);
  return {
    color: (red << 16) | (green << 8) | blue,
    opacity: sourceOpacity * (light ? 0.66 : 0.9)
  };
}

function updateAdmin1FillTheme() {
  if (!state.detailHeatMesh) return;
  const maximum = Math.max(1, ...state.detailRankedRegions.map(region => Number(region.signals) || 0));
  state.detailHeatMesh.traverse(object => {
    const entity = object.userData.admin1FillEntity;
    if (!entity || !object.material) return;
    const appearance = admin1FillAppearance(entity, maximum);
    object.material.color.setHex(appearance.color);
    object.material.opacity = appearance.opacity;
  });
}

function createWorldBoundaries() {
  const positions = [];
  for (const feature of state.world.features) {
    const featurePositions = boundaryPositions(feature, GLOBE_RADIUS + 0.029);
    for (const value of featurePositions) positions.push(value);
  }
  if (positions.length === 0) return;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  const material = new THREE.LineBasicMaterial({
    color: state.theme === 'light' ? 0x405666 : 0xc0d2df,
    transparent: true,
    opacity: worldBoundaryOpacity(),
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  });
  state.worldBoundaryLine = new THREE.LineSegments(geometry, material);
  state.worldBoundaryLine.userData = { worldBoundary: true, activityScope: 'world' };
  state.worldBoundaryLine.renderOrder = 4;
  state.globeGroup.add(state.worldBoundaryLine);
  state.worldActivity.push(state.worldBoundaryLine);
}

function updateSelectionBoundary(feature, qualityFlagged = false) {
  if (state.selectionBoundaryLine) {
    state.globeGroup.remove(state.selectionBoundaryLine);
    state.selectionBoundaryLine.geometry.dispose();
    state.selectionBoundaryLine.material.dispose();
    state.selectionBoundaryLine = null;
  }
  if (!feature) return;
  const positions = boundaryPositions(feature, GLOBE_RADIUS + 0.046);
  if (positions.length === 0) return;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  const material = new THREE.LineBasicMaterial({
    color: qualityFlagged ? 0xffe1a4 : 0xffd0ad,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  });
  state.selectionBoundaryLine = new THREE.LineSegments(geometry, material);
  state.selectionBoundaryLine.userData = { selectionBoundary: true };
  state.selectionBoundaryLine.renderOrder = 6;
  state.globeGroup.add(state.selectionBoundaryLine);
}

function drawRing(context, ring, width, height) {
  if (ring == null || ring.length === 0) return;
  const unwrapped = [];
  let previousX = null;
  for (const point of ring) {
    let x = ((point[0] + 180) / 360) * width;
    const y = ((90 - point[1]) / 180) * height;
    if (previousX !== null) {
      while (x - previousX > width / 2) x -= width;
      while (previousX - x > width / 2) x += width;
    }
    unwrapped.push([x, y]);
    previousX = x;
  }
  for (const offset of [-width, 0, width]) {
    context.moveTo(unwrapped[0][0] + offset, unwrapped[0][1]);
    for (let index = 1; index < unwrapped.length; index += 1) {
      context.lineTo(unwrapped[index][0] + offset, unwrapped[index][1]);
    }
    context.closePath();
  }
}

function drawFeature(context, feature, width, height, { fill = true, stroke = true } = {}) {
  const geometry = feature.geometry;
  if (!geometry) return;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  context.beginPath();
  for (const polygon of polygons) {
    for (const ring of polygon) drawRing(context, ring, width, height);
  }
  if (fill) context.fill('evenodd');
  if (stroke) context.stroke();
}

function makeWorldTexture() {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = atlasTextureWidth();
  textureCanvas.height = textureCanvas.width / 2;
  state.textureWidth = textureCanvas.width;
  const context = textureCanvas.getContext('2d', { alpha: false });
  const light = state.theme === 'light';
  context.lineCap = 'round';
  context.lineJoin = 'round';

  context.fillStyle = light ? '#dfe4e7' : '#020407';
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  const ocean = context.createLinearGradient(0, 0, textureCanvas.width, textureCanvas.height);
  if (light) {
    ocean.addColorStop(0, '#f4f6f7');
    ocean.addColorStop(0.52, '#dfe5e8');
    ocean.addColorStop(1, '#cbd4d9');
  } else {
    ocean.addColorStop(0, '#07101a');
    ocean.addColorStop(0.52, '#02050a');
    ocean.addColorStop(1, '#09131f');
  }
  context.fillStyle = ocean;
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const y = ((90 - latitude) / 180) * textureCanvas.height;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(textureCanvas.width, y);
    context.strokeStyle = light ? 'rgba(44, 67, 82, 0.08)' : 'rgba(119, 151, 177, 0.032)';
    context.lineWidth = textureCanvas.width >= DESKTOP_TEXTURE_WIDTH ? 1.25 : 1;
    context.stroke();
  }
  for (let longitude = -150; longitude <= 150; longitude += 30) {
    const x = ((longitude + 180) / 360) * textureCanvas.width;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, textureCanvas.height);
    context.strokeStyle = light ? 'rgba(44, 67, 82, 0.07)' : 'rgba(119, 151, 177, 0.027)';
    context.stroke();
  }

  const maximum = state.countries[0]?.signals || 1;
  for (const feature of state.world.features) {
    const matched = state.countries.find(country => featureForCountry(country.name) === feature);
    const intensity = matched ? Math.log1p(matched.signals) / Math.log1p(maximum) : 0;
    if (light) {
      context.fillStyle = matched
        ? `rgba(${Math.round(87 + intensity * 22)}, ${Math.round(98 + intensity * 2)}, ${Math.round(105 - intensity * 8)}, 0.98)`
        : 'rgba(116, 128, 135, 0.84)';
    } else {
      context.fillStyle = matched
        ? `rgba(${Math.round(18 + intensity * 12)}, ${Math.round(25 + intensity * 4)}, ${Math.round(33 + intensity * 2)}, 0.99)`
        : 'rgba(14, 20, 27, 0.98)';
    }
    // Country edges stay vector-only. Raster strokes turn into wide blurry bands
    // when a small country is magnified from the global equirectangular texture.
    drawFeature(context, feature, textureCanvas.width, textureCanvas.height, { stroke: false });
  }

  const random = randomFactory(40829);
  context.globalCompositeOperation = light ? 'multiply' : 'screen';
  for (let index = 0; index < 9000; index += 1) {
    const alpha = random() * (light ? 0.012 : 0.011);
    context.fillStyle = light ? `rgba(36, 56, 68, ${alpha})` : `rgba(151, 184, 210, ${alpha})`;
    context.fillRect(random() * textureCanvas.width, random() * textureCanvas.height, 1, 1);
  }
  context.globalCompositeOperation = 'source-over';

  return configureAtlasTexture(new THREE.CanvasTexture(textureCanvas));
}

function makeActivityTexture(scope = 'world') {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = atlasTextureWidth();
  textureCanvas.height = textureCanvas.width / 2;
  const context = textureCanvas.getContext('2d');
  const light = state.theme === 'light';
  const entities = scope === 'us'
    ? state.usRegions
    : scope === 'admin1'
      ? state.detailRankedRegions
      : state.countries;
  const maximum = entities[0]?.signals || 1;

  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  for (const entity of entities) {
    const feature = scope === 'us'
      ? featureForState(entity.name)
      : scope === 'admin1'
        ? entity.feature
        : featureForCountry(entity.name);
    if (!feature) continue;
    const intensity = Math.log1p(entity.signals) / Math.log1p(maximum);
    const heat = Math.pow(intensity, 1.35);
    if (light) {
      context.fillStyle = `rgba(${Math.round(205 + heat * 42)}, ${Math.round(82 + heat * 55)}, ${Math.round(48 - heat * 18)}, ${0.18 + heat * 0.48})`;
    } else {
      context.fillStyle = `rgba(${Math.round(88 + heat * 167)}, ${Math.round(22 + heat * 76)}, ${Math.round(13 + heat * 34)}, ${0.18 + heat * 0.56})`;
    }
    // Heat is an area signal, never a border. The dedicated 3D line layers keep
    // country, state and Admin-1 boundaries crisp at every zoom level.
    drawFeature(context, feature, textureCanvas.width, textureCanvas.height, { stroke: false });
  }

  return configureAtlasTexture(new THREE.CanvasTexture(textureCanvas));
}

function createSelectionOverlay() {
  const size = atlasTextureWidth();
  state.selectionCanvas = document.createElement('canvas');
  state.selectionCanvas.width = size;
  state.selectionCanvas.height = size / 2;
  state.selectionContext = state.selectionCanvas.getContext('2d');
  state.selectionTexture = configureAtlasTexture(new THREE.CanvasTexture(state.selectionCanvas));
  state.selectionMesh = new THREE.Mesh(
    globeGeometry(GLOBE_RADIUS + 0.036),
    new THREE.MeshBasicMaterial({
      map: state.selectionTexture,
      transparent: true,
      opacity: state.theme === 'light' ? 0.48 : 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  state.selectionMesh.renderOrder = 5;
  state.selectionMesh.visible = false;
  state.globeGroup.add(state.selectionMesh);
}

function updateSelectionOverlay(entity = null) {
  if (!state.selectionContext || !state.selectionTexture || !state.selectionMesh) return;
  const context = state.selectionContext;
  const { width, height } = state.selectionCanvas;
  context.clearRect(0, 0, width, height);
  const feature = featureForEntity(entity);
  if (!feature) {
    state.selectionMesh.visible = false;
    state.selectionTexture.needsUpdate = true;
    updateSelectionBoundary(null);
    return;
  }

  const qualityFlagged = Boolean(entity?.qualityFlag || entity?.qualityFlags?.length);
  if (isAdmin1Scope()) {
    // The global selection canvas is intentionally not magnified in Admin-1.
    // The published fill underneath is already vectorial; selection uses its
    // exact vector boundary instead of reintroducing a blurry raster overlay.
    state.selectionMesh.visible = false;
    state.selectionTexture.needsUpdate = true;
    updateSelectionBoundary(feature, qualityFlagged);
    return;
  }
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.fillStyle = qualityFlagged ? 'rgba(255, 170, 50, 0.34)' : 'rgba(255, 94, 39, 0.3)';
  context.shadowBlur = 0;
  context.shadowColor = 'transparent';
  drawFeature(context, feature, width, height, { stroke: false });
  state.selectionTexture.needsUpdate = true;
  state.selectionMesh.visible = true;
  updateSelectionBoundary(feature, qualityFlagged);
}

function glowTexture() {
  if (state.glowTexture) return state.glowTexture;
  const glowCanvas = document.createElement('canvas');
  const size = 256;
  const center = size / 2;
  glowCanvas.width = size;
  glowCanvas.height = size;
  const context = glowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255, 191, 137, 0.96)');
  gradient.addColorStop(0.08, 'rgba(255, 91, 48, 0.94)');
  gradient.addColorStop(0.24, 'rgba(255, 46, 24, 0.34)');
  gradient.addColorStop(0.52, 'rgba(255, 30, 12, 0.055)');
  gradient.addColorStop(1, 'rgba(255, 30, 12, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(8, state.renderer?.capabilities.getMaxAnisotropy?.() || 4);
  state.glowTexture = texture;
  return state.glowTexture;
}

function createAtmosphere() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(state.theme === 'light' ? 0x7894a6 : 0x5f83a7) },
      strength: { value: state.theme === 'light' ? 0.28 : 0.54 }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float strength;
      varying vec3 vNormal;
      void main() {
        float rim = pow(max(0.0, 0.88 - abs(vNormal.z)), 3.2);
        gl_FragColor = vec4(glowColor, rim * strength);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false
  });
  const mobile = window.innerWidth < 760;
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS * 1.045, mobile ? 72 : 128, mobile ? 48 : 96), material);
  atmosphere.userData.atmosphere = true;
  state.globeGroup.add(atmosphere);

  const outerMaterial = material.clone();
  outerMaterial.uniforms = THREE.UniformsUtils.clone(material.uniforms);
  outerMaterial.uniforms.strength.value = state.theme === 'light' ? 0.1 : 0.18;
  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 1.105, mobile ? 64 : 112, mobile ? 40 : 72),
    outerMaterial
  );
  outerAtmosphere.userData.atmosphere = true;
  outerAtmosphere.userData.outerAtmosphere = true;
  state.globeGroup.add(outerAtmosphere);
}

function orientToSurface(object, position) {
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
}

function orientYAxisToSurface(object, position) {
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize());
}

function createBeaconAccent(entity, center, parent, scope, color = 0xff4a32) {
  if (!center || entity?.kind !== 'cityCluster') return null;
  const scopeClusters = state.cityClusters.filter(cluster => scope !== 'us' || String(cluster.countryCode).toUpperCase() === 'US');
  const maximum = scopeClusters[0]?.signals || entity.signals || 1;
  const intensity = Math.log1p(entity.signals) / Math.log1p(maximum);
  const surface = latLonToVector(center[0], center[1], GLOBE_RADIUS + 0.042);
  const clusterGroup = new THREE.Group();
  clusterGroup.userData = { cityCluster: entity, activityScope: scope };
  parent.add(clusterGroup);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: state.theme === 'light' ? 0.28 : 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ringRadius = 0.03 + Math.sqrt(intensity) * 0.025;
  const ring = new THREE.Mesh(new THREE.RingGeometry(ringRadius * 0.78, ringRadius, isMobileViewport() ? 32 : 48), ringMaterial);
  ring.position.copy(surface);
  orientToSurface(ring, ring.position);
  ring.userData = {
    activityAccent: true,
    activityScope: scope,
    baseScale: 0.9 + Math.sqrt(intensity) * 0.34,
    baseOpacity: state.theme === 'light' ? 0.28 : 0.58,
    phase: (hashString(`${scope}-ring-${entity.geonameId || entity.city}`) % 1000) / 1000
  };
  state.pulseRings.push(ring);
  clusterGroup.add(ring);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity: state.theme === 'light' ? 0.5 : 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  }));
  halo.position.copy(surface.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.064));
  const haloScale = 0.11 + Math.sqrt(intensity) * 0.15;
  halo.scale.setScalar(haloScale);
  halo.userData = {
    cityCluster: entity,
    activityScope: scope,
    baseScale: haloScale,
    phase: (hashString(`cluster-${entity.geonameId || entity.city}`) % 628) / 100
  };
  state.pulseSprites.push(halo);
  clusterGroup.add(halo);

  const spireHeight = 0.045 + Math.sqrt(intensity) * 0.105;
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.008 + intensity * 0.009, spireHeight, isMobileViewport() ? 12 : 16, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: state.theme === 'light' ? 0.62 : 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    })
  );
  spire.position.copy(surface.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.045 + spireHeight / 2));
  orientYAxisToSurface(spire, spire.position);
  spire.userData = { activityAccent: true, cityCluster: entity, activityScope: scope };
  clusterGroup.add(spire);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.065 + Math.sqrt(intensity) * 0.035, 12, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.copy(surface.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.075));
  hit.userData = { cityCluster: entity, activityScope: scope };
  state.clusterHitMeshes.push(hit);
  clusterGroup.add(hit);

  return {
    cluster: entity,
    group: clusterGroup,
    halo,
    ring,
    spire,
    hit,
    position: surface.clone(),
    intensity,
    ringRadius,
    haloScale,
    spireHeight,
    spireBaseRadius: GLOBE_RADIUS + 0.045,
    spireNormal: surface.clone().normalize(),
    hitRadius: 0.065 + Math.sqrt(intensity) * 0.035
  };
}

function createAggregateHeatLayer(scope, parent) {
  const texture = makeActivityTexture(scope);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: state.theme === 'light' ? 0.66 : 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(
    globeGeometry(GLOBE_RADIUS + (scope === 'us' ? 0.022 : 0.016)),
    material
  );
  mesh.userData = { aggregateHeat: true, activityScope: scope };
  mesh.renderOrder = scope === 'us' ? 3 : 2;
  parent.add(mesh);
  if (scope === 'world') {
    state.worldHeatTexture = texture;
    state.worldHeatMesh = mesh;
    state.worldActivity.push(mesh);
  } else {
    state.usHeatTexture = texture;
    state.usHeatMesh = mesh;
  }
}

function createCityClusters() {
  state.clusterGroup = new THREE.Group();
  state.clusterGroup.userData.activityScope = 'clusters';
  state.globeGroup.add(state.clusterGroup);
  const maximumVisible = window.innerWidth < 760 ? 56 : state.cityClusters.length;
  const clusters = state.cityClusters
    .filter(cluster => {
      // Natural Earth 110m absorbs Hong Kong into China and simplifies a few border cities.
      // The beacon remains at the exact GeoNames centroid; tolerance is validation-only.
      const boundaryCode = cluster.countryCode === 'HK' ? 'CN' : cluster.countryCode;
      const countryFeature = featureForCountryCode(boundaryCode);
      if (!countryFeature || !pointNearFeature(cluster.lat, cluster.lon, countryFeature)) return false;
      if (cluster.countryCode !== 'US' || !cluster.regionCode) return true;
      const region = regionForCode(cluster.regionCode);
      const regionFeature = featureForState(region?.name);
      return Boolean(regionFeature && pointNearFeature(cluster.lat, cluster.lon, regionFeature, 0.12));
    })
    .slice(0, maximumVisible);
  for (const cluster of clusters) {
    const scope = String(cluster.countryCode).toUpperCase() === 'US' ? 'us' : 'world';
    const qualityFlagged = Array.isArray(cluster.qualityFlags) && cluster.qualityFlags.length > 0;
    const color = qualityFlagged ? 0xffb34f : 0xff6335;
    const entry = createBeaconAccent(cluster, [cluster.lat, cluster.lon], state.clusterGroup, scope, color);
    if (entry) {
      state.clusterEntries.push(entry);
      createClusterLabel(entry);
    }
  }
  state.placementStats.world.points = state.clusterEntries.length;
  state.placementStats.us.points = state.clusterEntries.filter(entry => entry.cluster.countryCode === 'US').length;
  updateClusterVisibility();
}

function createClusterLabel(entry) {
  if (!labelLayer || !entry) return;
  const item = document.createElement('li');
  item.className = 'atlas-map-label';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'atlas-map-label__button';
  button.setAttribute('aria-label', `${entry.cluster.city}, ${entry.cluster.country}: ${number(entry.cluster.signals)} published city-cluster signals`);
  const city = document.createElement('strong');
  city.textContent = entry.cluster.city;
  const detail = document.createElement('small');
  detail.textContent = `${number(entry.cluster.signals)} signals`;
  button.append(city, detail);
  button.addEventListener('click', () => focusCluster(entry.cluster));
  item.append(button);
  labelLayer.append(item);
  entry.label = item;
  state.clusterLabels.push(entry);
}

function clusterVisibleInScope(cluster) {
  if (state.scope === 'world') return true;
  if (state.scope === 'us') return String(cluster.countryCode || '').toUpperCase() === 'US';
  if (isAdmin1Scope()) return String(cluster.countryCode || '').toUpperCase() === state.detailConfig.alpha2;
  return false;
}

function updateClusterVisibility() {
  for (const entry of state.clusterEntries) {
    const visible = clusterVisibleInScope(entry.cluster);
    entry.group.visible = visible;
    if (entry.label && visible === false) entry.label.hidden = true;
  }
}

function updateBeaconVisualScale(seconds) {
  const reducedMotion = prefersReducedMotion.matches;
  const admin1View = isAdmin1Scope();
  const viewportHeight = Math.max(stage.clientHeight, 1);
  const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2);
  const worldPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const globeScale = new THREE.Vector3(1, 1, 1);

  if (admin1View) {
    state.camera.updateMatrixWorld(true);
    state.globeGroup.updateMatrixWorld(true);
    state.globeGroup.getWorldScale(globeScale);
  }

  for (const entry of state.clusterEntries) {
    const ringProgress = (seconds * 0.24 + entry.ring.userData.phase) % 1;
    const haloWave = Math.sin(seconds * 1.75 + entry.halo.userData.phase);
    entry.ring.material.opacity = reducedMotion
      ? entry.ring.userData.baseOpacity
      : entry.ring.userData.baseOpacity * Math.pow(1 - ringProgress, 1.65);
    entry.halo.material.opacity = reducedMotion
      ? (state.theme === 'light' ? 0.5 : 0.92)
      : (state.theme === 'light' ? 0.46 : 0.8) + haloWave * 0.12;

    if (!admin1View || !entry.group.visible) {
      const ringScale = reducedMotion
        ? 1
        : entry.ring.userData.baseScale * (0.84 + ringProgress * 0.86);
      const haloScale = reducedMotion
        ? entry.halo.userData.baseScale
        : entry.halo.userData.baseScale * (1 + haloWave * 0.16);
      entry.ring.scale.setScalar(ringScale);
      entry.halo.scale.setScalar(haloScale);
      entry.spire.scale.setScalar(1);
      entry.spire.position.copy(entry.spireNormal).multiplyScalar(entry.spireBaseRadius + entry.spireHeight / 2);
      entry.hit.scale.setScalar(1);
      continue;
    }

    worldPosition.copy(entry.position).applyMatrix4(entry.group.matrixWorld);
    cameraPosition.copy(worldPosition).applyMatrix4(state.camera.matrixWorldInverse);
    const cameraDepth = Math.max(0.08, -cameraPosition.z);
    const pixelsPerLocalUnit = viewportHeight * Math.max(globeScale.x, 0.001)
      / (2 * Math.max(halfFovTangent, 0.001) * cameraDepth);
    const strength = Math.sqrt(THREE.MathUtils.clamp(entry.intensity, 0, 1));
    const baseRingPixels = 28 + strength * 5;
    const ringPulse = reducedMotion
      ? 1
      : Math.min(0.92 + ringProgress * 0.7, 45 / baseRingPixels);
    const ringScale = (baseRingPixels * ringPulse) / (2 * entry.ringRadius * pixelsPerLocalUnit);
    entry.ring.scale.setScalar(THREE.MathUtils.clamp(ringScale, 0.015, 2.5));

    const haloPixels = Math.min(40, baseRingPixels * 1.18)
      * (reducedMotion ? 1 : 1 + haloWave * 0.1);
    const haloScale = haloPixels / pixelsPerLocalUnit;
    entry.halo.scale.setScalar(THREE.MathUtils.clamp(haloScale, 0.003, 2.5));

    const spirePixels = 14 + strength * 10;
    const spireScale = spirePixels / (entry.spireHeight * pixelsPerLocalUnit);
    const clampedSpireScale = THREE.MathUtils.clamp(spireScale, 0.015, 2.5);
    entry.spire.scale.setScalar(clampedSpireScale);
    entry.spire.position.copy(entry.spireNormal)
      .multiplyScalar(entry.spireBaseRadius + entry.spireHeight * clampedSpireScale / 2);

    const hitPixels = isMobileViewport() ? 48 : 44;
    const hitScale = hitPixels / (2 * entry.hitRadius * pixelsPerLocalUnit);
    entry.hit.scale.setScalar(THREE.MathUtils.clamp(hitScale, 0.015, 2.5));
  }
}

function projectedLabelLimit() {
  const ratio = defaultZoom() / Math.max(state.camera?.position.z || defaultZoom(), 0.1);
  const mobile = window.innerWidth < 760;
  stage.classList.toggle('atlas-is-detail', ratio > 1.28);
  if (mobile) return ratio > 1.5 ? 7 : ratio > 1.14 ? 4 : 2;
  return ratio > 1.6 ? 16 : ratio > 1.18 ? 9 : 4;
}

function updateProjectedLabels(time) {
  if (!labelLayer || !state.camera || !state.globeGroup || time - state.lastLabelUpdate < 48) return;
  state.lastLabelUpdate = time;
  const limit = projectedLabelLimit();
  const globeCenter = state.globeGroup.getWorldPosition(new THREE.Vector3());
  const scopedCandidates = state.clusterEntries
    .filter(entry => clusterVisibleInScope(entry.cluster))
    .sort((a, b) => b.cluster.signals - a.cluster.signals);
  const projectionByEntry = new Map();
  for (const entry of scopedCandidates) {
    const worldPosition = state.globeGroup.localToWorld(entry.position.clone());
    const surfaceNormal = worldPosition.clone().sub(globeCenter).normalize();
    const towardCamera = state.camera.position.clone().sub(worldPosition).normalize();
    const projected = worldPosition.clone().project(state.camera);
    const frontFacing = surfaceNormal.dot(towardCamera) > 0.075;
    const onScreen = Math.abs(projected.x) < 0.96 && Math.abs(projected.y) < 0.92 && projected.z > -1 && projected.z < 1;
    if (frontFacing && onScreen) {
      projectionByEntry.set(entry, {
        projected,
        x: (projected.x * 0.5 + 0.5) * stage.clientWidth,
        y: (-projected.y * 0.5 + 0.5) * stage.clientHeight
      });
    }
  }
  let contextualCandidates = [];
  if (state.locked?.kind === 'cityCluster') {
    if (isAdmin1Scope()) {
      const lockedRegion = state.admin1AssignmentByCluster.get(state.locked);
      contextualCandidates = scopedCandidates.filter(entry => state.admin1AssignmentByCluster.get(entry.cluster) === lockedRegion);
    } else {
      contextualCandidates = scopedCandidates.filter(entry => state.scope === 'us'
        ? entry.cluster.regionCode === state.locked.regionCode
        : entry.cluster.countryCode === state.locked.countryCode);
    }
  } else if (state.scope === 'us' && state.locked?.code) {
    contextualCandidates = scopedCandidates.filter(entry => entry.cluster.regionCode === state.locked.code);
  } else if (isAdmin1Scope() && state.locked?.kind === 'admin1') {
    contextualCandidates = scopedCandidates.filter(entry => state.admin1AssignmentByCluster.get(entry.cluster) === state.locked);
  } else if (state.scope === 'world' && state.locked?.name) {
    contextualCandidates = scopedCandidates.filter(entry => entry.cluster.country === state.locked.name);
  }
  const candidates = (contextualCandidates.length ? contextualCandidates : scopedCandidates)
    .filter(entry => projectionByEntry.has(entry));
  const displayLimit = Math.max(limit, Math.min(contextualCandidates.length, 16));
  const allowed = new Set();
  const occupied = [];
  const mobile = window.innerWidth < 760;
  for (const candidate of candidates) {
    const position = projectionByEntry.get(candidate);
    const labelWidth = mobile ? 104 : 132;
    const labelHeight = mobile ? 28 : 38;
    const box = {
      left: position.x + (mobile ? 8 : 12),
      right: position.x + (mobile ? 8 : 12) + labelWidth,
      top: position.y - labelHeight,
      bottom: position.y + 4
    };
    const blockedByCopy = box.left < (mobile ? stage.clientWidth - 18 : Math.min(500, stage.clientWidth * 0.43))
      && box.top < (mobile ? 235 : 318);
    const blockedByControls = !mobile && box.right > stage.clientWidth - 360 && box.top < 340;
    const blockedByStatus = box.bottom > stage.clientHeight - (mobile ? 74 : 68);
    const outside = box.left < 8 || box.right > stage.clientWidth - 8 || box.top < 8;
    const collides = occupied.some(other => !(box.right + 8 < other.left
      || box.left > other.right + 8
      || box.bottom + 6 < other.top
      || box.top > other.bottom + 6));
    if (blockedByCopy || blockedByControls || blockedByStatus || outside || collides) continue;
    allowed.add(candidate);
    occupied.push(box);
    if (allowed.size >= displayLimit) break;
  }
  const lockedCluster = state.locked?.kind === 'cityCluster'
    ? state.clusterEntries.find(entry => entry.cluster === state.locked)
    : null;
  if (lockedCluster && projectionByEntry.has(lockedCluster)) allowed.add(lockedCluster);

  for (const entry of state.clusterEntries) {
    const position = projectionByEntry.get(entry);
    if (!entry.label || !allowed.has(entry) || !position || !clusterVisibleInScope(entry.cluster)) {
      if (entry.label) entry.label.hidden = true;
      continue;
    }
    entry.label.hidden = false;
    const pixelRatio = state.pixelRatio || window.devicePixelRatio || 1;
    const x = Math.round(position.x * pixelRatio) / pixelRatio;
    const y = Math.round(position.y * pixelRatio) / pixelRatio;
    entry.label.style.transform = `translate(${x}px, ${y}px)`;
    entry.label.classList.toggle('is-selected', entry.cluster === state.locked);
    entry.label.classList.toggle('is-contextual', contextualCandidates.includes(entry));
    entry.label.classList.toggle('is-quality-flagged', Boolean(entry.cluster.qualityFlags?.length));
  }
}

function createStateBoundaries() {
  state.usGroup = new THREE.Group();
  state.usGroup.visible = false;
  state.usGroup.userData.activityScope = 'us';

  for (const feature of state.usBoundaries.features) {
    const name = feature.properties?.NAME;
    if (!name) continue;
    const stateGroup = new THREE.Group();
    stateGroup.userData.stateName = name;
    for (const ring of geometryRings(feature.geometry)) {
      if (!Array.isArray(ring) || ring.length < 2) continue;
      const points = ring.map(([lon, lat]) => latLonToVector(lat, lon, GLOBE_RADIUS + 0.025));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: state.theme === 'light' ? 0x627786 : 0x7891a6,
        transparent: true,
        opacity: state.usRegionByName.has(name) ? 0.48 : 0.15,
        depthWrite: false
      });
      stateGroup.add(new THREE.Line(geometry, material));
    }
    state.stateLineGroups.set(name, stateGroup);
    state.usGroup.add(stateGroup);
  }

  state.globeGroup.add(state.usGroup);
}

function createUSActivity() {
  createAggregateHeatLayer('us', state.usGroup);
}

function clearAdmin1Layer({ resetAggregation = false } = {}) {
  if (state.detailGroup) {
    state.detailGroup.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
      else if (object.material) object.material.dispose();
    });
    state.globeGroup?.remove(state.detailGroup);
  }
  state.detailHeatTexture?.dispose();
  state.detailGroup = null;
  state.detailHeatTexture = null;
  state.detailHeatMesh = null;
  state.detailBoundaryLine = null;
  stage.dataset.admin1FillMeshes = '0';
  stage.dataset.admin1FillTriangles = '0';
  if (resetAggregation) {
    state.detailCountry = null;
    state.detailConfig = null;
    state.detailManifest = null;
    state.detailActivity = null;
    state.detailDataStatus = 'not_collected';
    state.detailFeatures = [];
    state.detailRegions = [];
    state.detailRankedRegions = [];
    state.detailTotals = {
      signals: null,
      regions: null,
      observedSignals: null,
      observedRegions: null,
      countrySignals: null,
      publishThreshold: PUBLISH_THRESHOLD,
      clusters: 0,
      unassignedClusters: 0,
      unresolvedRows: 0
    };
    state.admin1AssignmentByCluster = new Map();
  }
}

function createAdmin1Layer() {
  clearAdmin1Layer();
  state.detailGroup = new THREE.Group();
  state.detailGroup.userData.activityScope = 'admin1';
  let fillMeshCount = 0;
  let fillTriangleCount = 0;

  if (state.detailRankedRegions.length > 0) {
    const maximum = Math.max(1, ...state.detailRankedRegions.map(region => Number(region.signals) || 0));
    state.detailHeatMesh = new THREE.Group();
    state.detailHeatMesh.userData = { aggregateHeat: true, activityScope: 'admin1' };
    for (const entity of state.detailRankedRegions) {
      const geometry = sphericalFillGeometry(entity.feature, GLOBE_RADIUS + 0.024);
      if (!geometry) continue;
      const appearance = admin1FillAppearance(entity, maximum);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: appearance.color,
        transparent: true,
        opacity: appearance.opacity,
        blending: THREE.NormalBlending,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        toneMapped: false
      }));
      mesh.userData = { admin1Fill: true, admin1FillEntity: entity, activityScope: 'admin1' };
      mesh.renderOrder = 3;
      state.detailHeatMesh.add(mesh);
      fillMeshCount += 1;
      fillTriangleCount += geometry.getAttribute('position').count / 3;
    }
    state.detailGroup.add(state.detailHeatMesh);
  }
  stage.dataset.admin1FillMeshes = String(fillMeshCount);
  stage.dataset.admin1FillTriangles = String(fillTriangleCount);

  const positions = [];
  for (const feature of state.detailFeatures) {
    const featurePositions = boundaryPositions(feature, GLOBE_RADIUS + 0.031);
    for (const value of featurePositions) positions.push(value);
  }
  if (positions.length > 0) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.LineBasicMaterial({
      color: state.theme === 'light' ? 0x516979 : 0xb5cad9,
      transparent: true,
      opacity: state.theme === 'light' ? 0.42 : 0.5,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
    state.detailBoundaryLine = new THREE.LineSegments(geometry, material);
    state.detailBoundaryLine.userData = { admin1Boundary: true, activityScope: 'admin1' };
    state.detailBoundaryLine.renderOrder = 4;
    state.detailGroup.add(state.detailBoundaryLine);
  }

  state.detailGroup.visible = false;
  state.globeGroup.add(state.detailGroup);
}

function createBackgroundField() {
  const random = randomFactory(29082026);
  const positions = [];
  const fieldCount = window.innerWidth < 760 ? 420 : 900;
  for (let index = 0; index < fieldCount; index += 1) {
    positions.push((random() - 0.5) * 20, (random() - 0.5) * 12, -2 - random() * 7);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: state.theme === 'light' ? 0x6e8290 : 0x8ca9bf,
    size: 0.012,
    transparent: true,
    opacity: state.theme === 'light' ? 0.07 : 0.14,
    depthWrite: false
  });
  const field = new THREE.Points(geometry, material);
  field.userData.backgroundField = true;
  state.backgroundField = field;
  state.scene.add(field);

  const grid = new THREE.GridHelper(22, 42, 0x233748, 0x142330);
  grid.position.set(0, -5.6, -1.7);
  grid.rotation.x = THREE.MathUtils.degToRad(7);
  grid.material.transparent = true;
  grid.material.opacity = state.theme === 'light' ? 0.035 : 0.055;
  grid.userData.backgroundGrid = true;
  state.scene.add(grid);
}

function setupScene() {
  state.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobileViewport(),
    alpha: true,
    powerPreference: 'high-performance'
  });
  state.pixelRatio = atlasPixelRatio();
  state.renderer.setPixelRatio(state.pixelRatio);
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = state.theme === 'light' ? 0.94 : 1.06;

  state.scene = new THREE.Scene();
  state.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  state.camera.position.set(0, 0.18, 9.25);
  state.camera.lookAt(0, -0.75, 0);

  const ambient = new THREE.HemisphereLight(
    state.theme === 'light' ? 0xf7fbfd : 0xb8d4e8,
    state.theme === 'light' ? 0x52616a : 0x02060c,
    state.theme === 'light' ? 1.35 : 0.48
  );
  ambient.userData.ambient = true;
  state.scene.add(ambient);

  const key = new THREE.DirectionalLight(state.theme === 'light' ? 0xffffff : 0xd8e8f4, state.theme === 'light' ? 2.2 : 1.62);
  key.position.set(-4.5, 6.5, 7.5);
  key.userData.keyLight = true;
  state.scene.add(key);

  const ember = new THREE.PointLight(0xff5a2b, state.theme === 'light' ? 4.5 : 7.2, 11, 1.8);
  ember.position.set(4.8, 1.5, 4.4);
  ember.userData.emberLight = true;
  state.scene.add(ember);

  state.globeGroup = new THREE.Group();
  state.globeGroup.position.y = -1.18;
  state.globeGroup.rotation.order = 'XYZ';
  state.globeGroup.rotation.x = state.targetRotation.x;
  state.globeGroup.rotation.y = state.targetRotation.y;
  state.scene.add(state.globeGroup);

  state.texture = makeWorldTexture();
  const material = new THREE.MeshPhysicalMaterial({
    map: state.texture,
    roughness: state.theme === 'light' ? 0.72 : 0.68,
    metalness: state.theme === 'light' ? 0.06 : 0.1,
    clearcoat: state.theme === 'light' ? 0.12 : 0.28,
    clearcoatRoughness: 0.58,
    emissive: new THREE.Color(state.theme === 'light' ? 0x202b31 : 0x030811),
    emissiveIntensity: state.theme === 'light' ? 0.015 : 0.22
  });
  const mobile = isMobileViewport();
  state.globe = new THREE.Mesh(globeGeometry(GLOBE_RADIUS), material);
  state.globe.userData.globeSurface = true;
  state.globeGroup.add(state.globe);

  createAtmosphere();
  createAggregateHeatLayer('world', state.globeGroup);
  createWorldBoundaries();
  createStateBoundaries();
  createUSActivity();
  createCityClusters();
  createSelectionOverlay();
  createBackgroundField();
  resize();
  if (!prefersReducedMotion.matches) {
    state.revealStartedAt = performance.now();
    state.revealFromZoom = (state.zoom || defaultZoom()) + (window.innerWidth < 760 ? 0.95 : 1.35);
    state.camera.position.z = state.revealFromZoom;
    state.globeGroup.scale.setScalar(0.82);
    stage.classList.add('atlas-is-revealing');
  }
}

function defaultZoom(scope = state.scope, mobile = window.innerWidth < 760) {
  if (scope === 'us') return mobile ? 11.15 : 7.85;
  if (scope === 'admin1' && state.detailConfig) {
    return mobile ? state.detailConfig.mobileZoom : state.detailConfig.desktopZoom;
  }
  return mobile ? 11.6 : 9.25;
}

function worldZoomClarity() {
  const overviewZoom = defaultZoom('world', isMobileViewport());
  const cameraZoom = state.camera?.position.z || state.zoom || overviewZoom;
  const ratio = overviewZoom / Math.max(cameraZoom, 0.1);
  return THREE.MathUtils.clamp((ratio - 1.05) / 0.78, 0, 1);
}

function worldBoundaryOpacity() {
  const clarity = worldZoomClarity();
  const overview = state.theme === 'light' ? 0.46 : 0.5;
  const closeUp = state.theme === 'light' ? 0.78 : 0.84;
  return THREE.MathUtils.lerp(overview, closeUp, clarity);
}

function updateWorldMapClarity() {
  const clarity = worldZoomClarity();
  if (state.worldBoundaryLine) {
    state.worldBoundaryLine.material.opacity = worldBoundaryOpacity();
  }
  if (state.worldHeatMesh) {
    const overview = state.theme === 'light' ? 0.66 : 0.9;
    const closeUp = state.theme === 'light' ? 0.56 : 0.7;
    state.worldHeatMesh.material.opacity = THREE.MathUtils.lerp(overview, closeUp, clarity);
  }
}

function zoomLimits(scope = state.scope, mobile = window.innerWidth < 760) {
  if (scope === 'admin1') {
    return { minimum: GLOBE_RADIUS + 0.28, maximum: mobile ? 12.2 : 11.8 };
  }
  if (scope === 'us') return { minimum: mobile ? 5.35 : 4.95, maximum: mobile ? 12.2 : 11.8 };
  return { minimum: mobile ? 5.25 : 4.7, maximum: 13.5 };
}

function updateZoomLevel() {
  if (!zoomLevel || state.zoom === null) return;
  const ratio = defaultZoom() / state.zoom;
  const label = `${ratio.toFixed(1)}×`;
  zoomLevel.textContent = label;
  zoomLevel.setAttribute('aria-label', `Current zoom ${label}`);
  stage.classList.toggle('atlas-is-zoomed', ratio > 1.08);
}

function easingCubic(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

function closestAngle(target, current) {
  let adjusted = target;
  while (adjusted - current > Math.PI) adjusted -= Math.PI * 2;
  while (current - adjusted > Math.PI) adjusted += Math.PI * 2;
  return adjusted;
}

function cancelFocusTransition() {
  state.focusTransition = null;
  stage.classList.remove('atlas-is-focusing');
}

function finishReveal() {
  if (state.globeGroup) state.globeGroup.scale.setScalar(1);
  state.revealStartedAt = null;
  state.revealFromZoom = null;
  stage.classList.remove('atlas-is-revealing');
}

function beginFocusTransition(center, settleZoom) {
  if (!center || !state.globeGroup || !state.camera) return;
  finishReveal();
  const targetX = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(center[0] - 22), -1.15, 1.15);
  const targetY = closestAngle(-THREE.MathUtils.degToRad(center[1]), state.globeGroup.rotation.y);
  const limits = zoomLimits();
  const targetZoom = THREE.MathUtils.clamp(settleZoom, limits.minimum, limits.maximum);
  state.targetRotation.set(targetX, targetY);
  state.zoom = targetZoom;
  updateZoomLevel();
  if (prefersReducedMotion.matches) {
    state.globeGroup.rotation.x = targetX;
    state.globeGroup.rotation.y = targetY;
    state.camera.position.z = targetZoom;
    cancelFocusTransition();
    return;
  }
  state.focusTransition = {
    startedAt: performance.now(),
    duration: 1500,
    fromX: state.globeGroup.rotation.x,
    fromY: state.globeGroup.rotation.y,
    toX: targetX,
    toY: targetY,
    fromZoom: state.camera.position.z,
    pullbackZoom: Math.min(limits.maximum, Math.max(state.camera.position.z + 0.42, defaultZoom() + 0.68)),
    toZoom: targetZoom
  };
  stage.classList.add('atlas-is-focusing');
}

function setZoom(nextZoom, immediate = false) {
  finishReveal();
  cancelFocusTransition();
  const { minimum, maximum } = zoomLimits();
  state.zoom = THREE.MathUtils.clamp(nextZoom, minimum, maximum);
  if (immediate && state.camera) state.camera.position.z = state.zoom;
  state.lastInteractionAt = performance.now();
  updateZoomLevel();
}

function zoomBy(direction) {
  if (!state.tourAdvancing) stopTour();
  const current = state.zoom ?? defaultZoom();
  const step = Math.max(0.42, current * 0.085);
  setZoom(current + direction * step);
  canvas.focus({ preventScroll: true });
}

function resetCurrentView() {
  if (!state.tourAdvancing) stopTour();
  state.rotationVelocity.set(0, 0);
  if (state.scope === 'us') {
    state.locked = { name: 'United States state view' };
    state.targetRotation.x = THREE.MathUtils.degToRad(31);
    state.targetRotation.y = THREE.MathUtils.degToRad(98);
    setStateLineSelection(null);
  } else if (isAdmin1Scope()) {
    state.locked = { kind: 'admin1View', name: `${state.detailCountry.name} regional view` };
    const center = state.centers.get(state.detailCountry.name);
    if (center) {
      state.targetRotation.x = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(center[0] - 22), -1.15, 1.15);
      state.targetRotation.y = closestAngle(-THREE.MathUtils.degToRad(center[1]), state.globeGroup.rotation.y);
    }
  } else {
    state.locked = null;
    state.targetRotation.set(0.38, -0.1);
  }
  spotlight.hidden = true;
  hideTooltip();
  setZoom(defaultZoom());
  updateSelectionOverlay(null);
}

function resize() {
  if (!state.renderer || !state.camera) return;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const mobile = isMobileViewport(width);
  const nextPixelRatio = atlasPixelRatio(width, height);
  if (Math.abs((state.pixelRatio || 0) - nextPixelRatio) > 0.01) {
    state.pixelRatio = nextPixelRatio;
    state.renderer.setPixelRatio(nextPixelRatio);
  }
  state.renderer.setSize(width, height, false);
  stage.dataset.renderDpr = state.pixelRatio.toFixed(2);
  stage.dataset.textureWidth = String(state.textureWidth || atlasTextureWidth());
  state.camera.aspect = width / Math.max(height, 1);
  state.camera.fov = mobile ? 42 : 34;
  const scopeZoom = defaultZoom(state.scope, mobile);
  if (state.zoom === null || state.mobileLayout !== mobile) state.zoom = scopeZoom;
  state.mobileLayout = mobile;
  state.camera.position.z = state.zoom;
  state.camera.position.y = mobile ? 0.48 : 0.18;
  state.globeGroup.position.y = mobile ? -1.48 : -1.18;
  state.camera.updateProjectionMatrix();
  updateZoomLevel();
}

function updateTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  if (!state.initialized) return;
  const nextTexture = makeWorldTexture();
  state.texture.dispose();
  state.texture = nextTexture;
  state.globe.material.map = nextTexture;
  state.globe.material.roughness = state.theme === 'light' ? 0.72 : 0.68;
  state.globe.material.metalness = state.theme === 'light' ? 0.06 : 0.1;
  state.globe.material.emissive.set(state.theme === 'light' ? 0x202b31 : 0x030811);
  state.globe.material.emissiveIntensity = state.theme === 'light' ? 0.015 : 0.22;
  state.globe.material.needsUpdate = true;
  const nextWorldHeatTexture = makeActivityTexture('world');
  state.worldHeatTexture?.dispose();
  state.worldHeatTexture = nextWorldHeatTexture;
  if (state.worldHeatMesh) {
    state.worldHeatMesh.material.map = nextWorldHeatTexture;
    state.worldHeatMesh.material.opacity = state.theme === 'light' ? 0.66 : 0.9;
    state.worldHeatMesh.material.needsUpdate = true;
  }
  const nextUsHeatTexture = makeActivityTexture('us');
  state.usHeatTexture?.dispose();
  state.usHeatTexture = nextUsHeatTexture;
  if (state.usHeatMesh) {
    state.usHeatMesh.material.map = nextUsHeatTexture;
    state.usHeatMesh.material.opacity = state.theme === 'light' ? 0.66 : 0.9;
    state.usHeatMesh.material.needsUpdate = true;
  }
  updateAdmin1FillTheme();
  if (state.selectionMesh) state.selectionMesh.material.opacity = state.theme === 'light' ? 0.48 : 0.62;
  state.renderer.toneMappingExposure = state.theme === 'light' ? 0.94 : 1.06;
  state.scene.traverse(object => {
    if (object.userData.atmosphere) {
      object.material.uniforms.glowColor.value.set(state.theme === 'light' ? 0x7894a6 : 0x5f83a7);
      object.material.uniforms.strength.value = object.userData.outerAtmosphere
        ? (state.theme === 'light' ? 0.1 : 0.18)
        : (state.theme === 'light' ? 0.28 : 0.54);
    }
    if (object.userData.activityAccent) {
      object.userData.baseOpacity = state.theme === 'light' ? 0.28 : 0.58;
    }
    if (object.userData.worldBoundary) {
      object.material.color.set(state.theme === 'light' ? 0x405666 : 0xc0d2df);
      object.material.opacity = worldBoundaryOpacity();
    }
    if (object.userData.admin1Boundary) {
      object.material.color.set(state.theme === 'light' ? 0x516979 : 0xb5cad9);
      object.material.opacity = state.theme === 'light' ? 0.42 : 0.5;
    }
    if (object.type === 'Line' && object.parent?.userData.stateName) {
      object.material.color.set(state.theme === 'light' ? 0x627786 : 0x7891a6);
    }
    if (object.userData.backgroundField) {
      object.material.color.set(state.theme === 'light' ? 0x6e8290 : 0x8ca9bf);
      object.material.opacity = state.theme === 'light' ? 0.07 : 0.14;
    }
    if (object.userData.backgroundGrid) object.material.opacity = state.theme === 'light' ? 0.035 : 0.055;
    if (object.userData.ambient) object.intensity = state.theme === 'light' ? 1.35 : 0.48;
    if (object.userData.keyLight) object.intensity = state.theme === 'light' ? 2.2 : 1.62;
    if (object.userData.emberLight) object.intensity = state.theme === 'light' ? 4.5 : 7.2;
  });
  state.pulseSprites.forEach(sprite => {
    sprite.material.opacity = state.theme === 'light' ? 0.5 : 0.92;
  });
  updateWorldMapClarity();
  const selectedEntity = state.locked && (state.locked.name || state.locked.kind === 'cityCluster') ? state.locked : null;
  updateSelectionOverlay(selectedEntity);
  if (state.scope === 'us' && state.locked?.code) setStateLineSelection(state.locked);
}

function countryAt(lat, lon) {
  for (const country of state.worldCountries) {
    const feature = country.feature || featureForCountry(country.name);
    if (feature && pointInFeature(lat, lon, feature)) return country;
  }
  const point = latLonToVector(lat, lon, 1);
  const tinyCountry = state.worldCountries.find(country => !country.feature && !featureForCountry(country.name)
    && (countryHubs[country.name] || []).some(location => point.angleTo(latLonToVector(location[0], location[1], 1)) < THREE.MathUtils.degToRad(0.65)));
  return tinyCountry || null;
}

function stateAt(lat, lon) {
  for (const region of state.usRegions) {
    const feature = featureForState(region.name);
    if (feature && pointInFeature(lat, lon, feature)) return region;
  }
  return null;
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function entityAtPointer() {
  if (!state.globe || !state.camera) return null;
  state.raycaster.setFromCamera(state.pointer, state.camera);
  state.globeGroup.getWorldPosition(state.interactionSphere.center);
  state.globeGroup.getWorldScale(state.interactionScale);
  state.interactionSphere.radius = GLOBE_RADIUS * state.interactionScale.x;
  const globeHit = state.raycaster.ray.intersectSphere(
    state.interactionSphere,
    state.interactionPoint
  );
  const intersection = globeHit
    ? { point: globeHit, distance: state.raycaster.ray.origin.distanceTo(globeHit) }
    : null;
  const clusterHits = state.raycaster.intersectObjects(
    state.clusterEntries.filter(entry => entry.group.visible).map(entry => entry.hit),
    false
  );
  if (clusterHits[0] && (!intersection || clusterHits[0].distance <= intersection.distance + 0.12)) {
    return clusterHits[0].object.userData.cityCluster || null;
  }
  if (!intersection) return null;
  const local = state.globeGroup.worldToLocal(intersection.point.clone());
  const { lat, lon } = vectorToLatLon(local);
  if (state.scope === 'us') return stateAt(lat, lon);
  if (isAdmin1Scope()) return admin1RegionAt(lat, lon);
  return countryAt(lat, lon);
}

function showTooltip(entity, event) {
  if (!tooltip || !entity || window.innerWidth < 760) return;
  if (entity.kind === 'cityCluster') {
    tooltip.hidden = false;
    tooltip.querySelector('[data-tooltip-rank]').textContent = 'Published DataFast city cluster';
    tooltip.querySelector('[data-tooltip-country]').textContent = entity.city;
    const place = [entity.region, entity.country].filter(Boolean).join(', ');
    tooltip.querySelector('[data-tooltip-signals]').textContent = `${number(entity.signals)} signals · ${place}`;
    const rect = stage.getBoundingClientRect();
    const left = Math.min(event.clientX - rect.left, rect.width - 220);
    const top = Math.min(event.clientY - rect.top, rect.height - 140);
    tooltip.style.left = `${Math.max(4, left)}px`;
    tooltip.style.top = `${Math.max(4, top)}px`;
    return;
  }
  if (entity.kind === 'admin1') {
    tooltip.hidden = false;
    tooltip.querySelector('[data-tooltip-rank]').textContent = entity.published && entity.rank
      ? `#${entity.rank} ${state.detailConfig.regionLabel} rank`
      : (entity.type || state.detailConfig.regionLabel);
    tooltip.querySelector('[data-tooltip-country]').textContent = entity.name;
    tooltip.querySelector('[data-tooltip-signals]').textContent = entity.published && Number.isFinite(entity.signals)
      ? `${number(entity.signals)} published regional signals`
      : admin1EntityStatusMessage(entity);
    const rect = stage.getBoundingClientRect();
    const left = Math.min(event.clientX - rect.left, rect.width - 220);
    const top = Math.min(event.clientY - rect.top, rect.height - 140);
    tooltip.style.left = `${Math.max(4, left)}px`;
    tooltip.style.top = `${Math.max(4, top)}px`;
    return;
  }
  const stateView = state.scope === 'us';
  tooltip.hidden = false;
  tooltip.querySelector('[data-tooltip-rank]').textContent = Number.isInteger(entity.rank)
    ? `#${entity.rank} ${stateView ? 'U.S. state' : 'world'} rank`
    : 'Administrative map';
  tooltip.querySelector('[data-tooltip-country]').textContent = entity.name;
  const detailConfig = !stateView ? detailConfigForCountry(entity) : null;
  const action = !stateView && entity.adm0A3 === 'USA'
    ? ' · select for state detail'
    : detailConfig
      ? ` · select for ${detailConfig.regionLabel} detail`
      : '';
  tooltip.querySelector('[data-tooltip-signals]').textContent = Number.isFinite(entity.signals)
    ? `${number(entity.signals)} interest signals${action}`
    : `No country total published${action}`;
  const rect = stage.getBoundingClientRect();
  const left = Math.min(event.clientX - rect.left, rect.width - 220);
  const top = Math.min(event.clientY - rect.top, rect.height - 140);
  tooltip.style.left = `${Math.max(4, left)}px`;
  tooltip.style.top = `${Math.max(4, top)}px`;
}

function hideTooltip() {
  if (tooltip) tooltip.hidden = true;
  state.hovered = null;
}

function scrollAtlasIntoView() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
  });
}

function showSpotlight(entity) {
  if (!spotlight || !entity) return;
  if (entity.kind === 'cityCluster') {
    spotlight.hidden = false;
    spotlight.querySelector('[data-spotlight-rank]').textContent = 'Published city cluster';
    spotlight.querySelector('[data-spotlight-label]').textContent = entity.qualityFlags?.length
      ? 'Location quality flag'
      : (String(entity.coordinateKind).includes('city-centroid') ? 'GeoNames city centroid' : 'Published cluster coordinate');
    spotlight.querySelector('[data-spotlight-country]').textContent = entity.city;
    const place = [entity.region, entity.country].filter(Boolean).join(', ');
    spotlight.querySelector('[data-spotlight-signals]').textContent = `${number(entity.signals)} signals · ${place} · 5+ privacy threshold`;
    return;
  }
  if (entity.kind === 'admin1') {
    spotlight.hidden = false;
    spotlight.querySelector('[data-spotlight-rank]').textContent = entity.published && entity.rank
      ? `${state.detailConfig.viewLabel} rank #${entity.rank}`
      : state.detailConfig.viewLabel;
    spotlight.querySelector('[data-spotlight-label]').textContent = entity.type || state.detailConfig.regionLabel;
    spotlight.querySelector('[data-spotlight-country]').textContent = entity.name;
    if (!entity.published || !Number.isFinite(entity.signals)) {
      spotlight.querySelector('[data-spotlight-signals]').textContent = admin1EntityStatusMessage(entity);
      return;
    }
    spotlight.querySelector('[data-spotlight-signals]').textContent = entity.qualityNote
      ? `${number(entity.signals)} signals · ${entity.qualityNote}`
      : `${number(entity.signals)} published regional signals · independently privacy-thresholded`;
    return;
  }
  const stateView = state.scope === 'us';
  const denominator = stateView ? state.usData.totals.countrySignals : state.data.totals.signals;
  const share = Number.isFinite(entity.signals) ? ((entity.signals / denominator) * 100).toFixed(1) : null;
  spotlight.hidden = false;
  spotlight.querySelector('[data-spotlight-rank]').textContent = Number.isInteger(entity.rank)
    ? `${stateView ? 'U.S. state' : 'World'} rank #${entity.rank}`
    : 'Administrative map';
  spotlight.querySelector('[data-spotlight-label]').textContent = entity.qualityFlag ? 'Network-location flag' : 'Observed interest';
  spotlight.querySelector('[data-spotlight-country]').textContent = entity.name;
  spotlight.querySelector('[data-spotlight-signals]').textContent = !Number.isFinite(entity.signals)
    ? 'No country total is published for this geography. Select it to explore administrative boundaries.'
    : entity.qualityNote
    ? `${number(entity.signals)} signals · ${entity.qualityNote}`
    : `${number(entity.signals)} signals · ${share}% of observed interest`;
}

function focusCountrySurface(country) {
  const center = state.centers.get(country.name);
  if (!center) return;
  state.locked = country;
  beginFocusTransition(center, window.innerWidth < 760 ? 9.05 : 7.35);
  updateSelectionOverlay(country);
  state.lastInteractionAt = performance.now();
  showSpotlight(country);
  scrollAtlasIntoView();
}

async function enterCountryDetail(country) {
  const config = detailConfigForCountry(country);
  if (!country || !config) return false;
  const requestToken = ++state.admin1LoadToken;
  if (!state.tourAdvancing) stopTour();
  focusCountrySurface(country);
  setAdmin1Busy(true, country);
  showToast(`Loading ${country.name} administrative boundaries…`);
  try {
    const shard = await loadAdmin1Shard(config.manifest);
    if (requestToken !== state.admin1LoadToken) return false;
    clearAdmin1Layer({ resetAggregation: true });
    state.admin1Boundaries = shard;
    state.detailCountry = country;
    state.detailConfig = config;
    state.detailManifest = config.manifest;
    state.detailActivity = config.activity;
    if (!buildAdmin1Aggregation(country, config)) throw new Error('No administrative polygons are available.');
    createAdmin1Layer();
    state.scope = 'admin1';
    state.locked = { kind: 'admin1View', name: `${country.name} regional view` };
    state.rotationVelocity.set(0, 0);
    state.lastInteractionAt = performance.now();
    setStateLineSelection(null);
    updateSelectionOverlay(null);
    hideTooltip();
    spotlight.hidden = true;
    updateScopeInterface();
    const center = state.centers.get(country.name);
    if (center) beginFocusTransition(center, defaultZoom('admin1'));
    showToast(`${country.name} · ${number(state.detailRegions.length)} administrative subdivisions loaded`);
    scrollAtlasIntoView();
    return true;
  } catch (error) {
    if (requestToken !== state.admin1LoadToken) return false;
    console.error(error);
    clearAdmin1Layer({ resetAggregation: true });
    state.admin1Boundaries = null;
    focusCountrySurface(country);
    showToast(`${country.name} regional boundaries are temporarily unavailable.`);
    return false;
  } finally {
    if (requestToken === state.admin1LoadToken) setAdmin1Busy(false);
  }
}

function focusCluster(cluster) {
  if (!cluster) return;
  if (!state.tourAdvancing) stopTour();
  state.locked = cluster;
  beginFocusTransition([cluster.lat, cluster.lon], window.innerWidth < 760 ? 8.95 : 6.85);
  if (state.scope === 'us') {
    const region = regionForCode(cluster.regionCode);
    setStateLineSelection(region);
  }
  updateSelectionOverlay(cluster);
  showSpotlight(cluster);
  scrollAtlasIntoView();
}

function focusCountry(country) {
  if (!state.tourAdvancing) stopTour();
  if (state.scope !== 'world') exitToWorld();
  if (country.adm0A3 === 'USA' && state.usRegions.length) {
    enterUnitedStates();
    return;
  }
  if (manifestEntryForCountry(country)) {
    void enterCountryDetail(country);
    return;
  }
  focusCountrySurface(country);
}

function focusAdmin1Region(region) {
  if (!region || !isAdmin1Scope()) return;
  if (!state.tourAdvancing) stopTour();
  state.locked = region;
  const center = region.center || state.centers.get(state.detailCountry.name);
  const bounds = region.bounds;
  const bbox = bounds ? [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat] : state.detailManifest?.bbox;
  if (center) beginFocusTransition(center, admin1ZoomForBbox(bbox, isMobileViewport()));
  state.lastInteractionAt = performance.now();
  updateSelectionOverlay(region);
  showSpotlight(region);
  scrollAtlasIntoView();
}

function setStateLineSelection(region) {
  if (state.selectedStateLine) {
    state.selectedStateLine.traverse(object => {
      if (object.type === 'Line') {
        object.material.color.set(state.theme === 'light' ? 0x627786 : 0x7891a6);
        object.material.opacity = 0.48;
      }
    });
  }
  state.selectedStateLine = region ? state.stateLineGroups.get(region.name) : null;
  if (state.selectedStateLine) {
    state.selectedStateLine.traverse(object => {
      if (object.type === 'Line') {
        object.material.color.set(0xffd19a);
        object.material.opacity = 1;
      }
    });
  }
}

function setAtlasTitle(lead, emphasis) {
  if (!title) return;
  const emphasized = document.createElement('em');
  emphasized.textContent = emphasis;
  title.replaceChildren(document.createTextNode(`${lead} `), emphasized);
}

function metric(value) {
  return Number.isFinite(value) ? number(value) : '—';
}

function updateScopeInterface() {
  const stateView = state.scope === 'us';
  const admin1View = isAdmin1Scope();
  const regionalView = stateView || admin1View;
  stage.classList.toggle('atlas-scope-us', regionalView);
  stage.classList.toggle('atlas-scope-admin1', admin1View);
  if (regionPanel) regionPanel.hidden = !regionalView;
  state.worldActivity.forEach(object => { object.visible = !regionalView; });
  if (state.usGroup) state.usGroup.visible = stateView;
  if (state.detailGroup) state.detailGroup.visible = admin1View;
  updateClusterVisibility();
  if (stateView) setAtlasTitle('See local AI interest', 'state by state.');
  else if (admin1View) setAtlasTitle('See local AI interest', state.detailConfig.titleEmphasis);
  else setAtlasTitle('See where', 'local AI is taking off.');
  if (summary) {
    summary.textContent = stateView
      ? 'United States · Approximate network regions · 31 Jul–29 Aug 2026'
      : admin1View
        ? `${state.detailCountry.name} · Approximate network regions · 31 Jul–29 Aug 2026`
        : 'Anonymous interest signals · Last 30 days · Updated 29 August 2026';
  }
  if (liveLabel) liveLabel.textContent = stateView
    ? 'State-level exploration'
    : admin1View
      ? state.detailConfig.liveLabel
      : 'Live exploration';
  const scopeSignals = stateView
    ? state.usData.totals.publishedSignals
    : admin1View
      ? state.detailTotals.signals
      : (state.data.totals.publishedSignals ?? state.data.totals.signals);
  const scopeRegions = stateView
    ? state.usData.totals.publishedRegions
    : admin1View
      ? state.detailTotals.regions
      : (state.data.totals.publishedRegions ?? state.data.totals.regions);
  document.querySelector('[data-scope-signals]').textContent = metric(scopeSignals);
  document.querySelector('[data-scope-regions]').textContent = admin1View && !Number.isFinite(scopeRegions)
    ? number(state.detailRegions.length)
    : metric(scopeRegions);
  document.querySelector('[data-scope-signal-label]').textContent = stateView
    ? 'visible state signals'
    : admin1View
      ? state.detailDataStatus === 'published'
        ? 'published regional signals'
        : state.detailDataStatus === 'unavailable'
          ? 'regional data unavailable'
          : state.detailDataStatus === 'not_collected'
            ? 'regional data not collected'
            : state.detailDataStatus === 'boundary_unresolved'
              ? 'boundary mapping unresolved'
              : 'no total above threshold'
      : 'published signals';
  document.querySelector('[data-scope-region-label]').textContent = stateView
    ? 'states published'
    : admin1View
      ? Number.isFinite(state.detailTotals.regions)
        ? `${state.detailConfig.regionsLabel} published`
        : `${state.detailConfig.regionsLabel} shown`
      : 'countries published';
  document.querySelector('[data-scope-window]').textContent = regionalView
    ? `${admin1View ? state.detailTotals.publishThreshold : 5}-signal threshold`
    : '30-day window';
  document.querySelector('[data-scope-disclosure]').textContent = stateView
    ? 'State color is the aggregate. Beacons mark published DataFast city clusters at approximate GeoNames city centroids.'
    : admin1View
      ? state.detailDataStatus === 'published'
        ? 'Region color shows an independently published subnational aggregate. Neutral boundaries have no published regional total. Beacons are a separate city-cluster breakdown.'
        : `${admin1StatusMessage()} Beacons are a separate published city-cluster breakdown.`
      : 'Country color is the aggregate. Beacons mark published DataFast city clusters at approximate GeoNames city centroids.';
  canvas.setAttribute('aria-label', stateView
    ? 'Interactive globe showing anonymous LocalClaw interest signals by U.S. state. Drag to rotate, select the map and scroll or use the visible controls to zoom, select a state, or return to the world view.'
    : admin1View
      ? `Interactive globe showing published LocalClaw interest aggregates by ${state.detailConfig.regionsLabel} in ${state.detailCountry.name}. Published regions and city beacons can be selected; neutral boundaries are orientation references only. Use World to return.`
      : 'Interactive globe showing anonymous local AI interest signals by country. Drag to rotate, select the map and scroll or use the visible controls to zoom, or use the country ranking below.');

  if (regionPanel && regionalView) {
    const panelTitle = regionPanel.querySelector('.atlas-region-panel__head span');
    const metricItems = regionPanel.querySelectorAll('.atlas-region-panel__metrics span');
    const note = regionPanel.querySelector('.atlas-region-panel__note');
    regionPanel.setAttribute('aria-label', stateView
      ? 'United States state activity'
      : `${state.detailCountry.name} ${state.detailConfig.regionsLabel} activity`);
    if (panelTitle) panelTitle.textContent = stateView
      ? 'United States · State view'
      : `${state.detailCountry.name} · ${state.detailConfig.viewLabel}`;
    if (metricItems[0]) {
      metricItems[0].querySelector('strong').textContent = metric(stateView ? state.usData.totals.publishedSignals : state.detailTotals.signals);
      metricItems[0].lastChild.textContent = stateView
        ? ' visible signals'
        : state.detailDataStatus === 'published'
          ? ' published regional signals'
          : ` ${state.detailDataStatus.replaceAll('_', ' ')}`;
    }
    if (metricItems[1]) {
      const panelRegionMetric = stateView
        ? state.usData.totals.publishedRegions
        : Number.isFinite(state.detailTotals.regions)
          ? state.detailTotals.regions
          : state.detailRegions.length;
      metricItems[1].querySelector('strong').textContent = metric(panelRegionMetric);
      metricItems[1].lastChild.textContent = stateView
        ? ' states published'
        : Number.isFinite(state.detailTotals.regions)
          ? ` ${state.detailConfig.regionsLabel} published`
          : ` ${state.detailConfig.regionsLabel} shown`;
    }
    if (note) {
      const strong = document.createElement('strong');
      if (stateView) {
        strong.textContent = 'Quality flag: ';
        note.replaceChildren(strong, document.createTextNode('Oregon is dominated by a published DataFast city cluster for The Dalles. Its beacon uses an approximate GeoNames network-city centroid, not a residence or exact visitor location.'));
      } else {
        strong.textContent = state.detailDataStatus === 'published' ? 'Method: ' : 'Data status: ';
        const method = state.detailDataStatus === 'published'
          ? `Regional aggregates independently meet the ${state.detailTotals.publishThreshold}-signal threshold; composite totals are drawn across their mapped boundary features only once. Natural Earth boundaries are cartographic references.`
          : `${admin1StatusMessage()} Natural Earth boundaries are cartographic references.`;
        note.replaceChildren(strong, document.createTextNode(method));
      }
    }
    renderStatePanel();
  }
  updateZoomLevel();
}

function renderStatePanel() {
  if (!regionList) return;
  regionList.replaceChildren();
  const admin1View = isAdmin1Scope();
  const publishedFeatures = new Set(state.detailRankedRegions
    .flatMap(region => region.features || []));
  const rows = admin1View
    ? [
        ...state.detailRankedRegions.map(region => ({ region, published: true })),
        ...state.detailRegions
          .filter(region => !publishedFeatures.has(region.feature))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(region => ({ region, published: false }))
      ]
    : state.usRegions.map(region => ({ region, published: true }));
  for (const row of rows) {
    const { region, published } = row;
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-region-name', region.name);
    button.dataset.published = String(published);
    if (published && region.boundaryMatch) button.dataset.boundaryMatch = region.boundaryMatch;
    const label = document.createElement('span');
    const rank = document.createElement('b');
    rank.textContent = published && Number.isInteger(region.rank) ? String(region.rank).padStart(2, '0') : '—';
    label.append(rank, document.createTextNode(region.name));
    if (region.qualityFlag) {
      const flag = document.createElement('em');
      flag.textContent = 'flag';
      label.append(flag);
    }
    const value = document.createElement('strong');
    value.textContent = published && Number.isFinite(region.signals) ? number(region.signals) : '—';
    button.append(label, value);
    button.setAttribute('aria-label', published && Number.isFinite(region.signals)
      ? `${region.name}: ${number(region.signals)} published regional signals`
      : `${region.name}: no regional total published`);
    button.addEventListener('click', () => admin1View ? focusAdmin1Region(region) : focusRegion(region));
    item.append(button);
    regionList.append(item);
  }
}

function enterUnitedStates(region = null) {
  if (!state.tourAdvancing) stopTour();
  state.admin1LoadToken += 1;
  setAdmin1Busy(false);
  clearAdmin1Layer({ resetAggregation: true });
  state.scope = 'us';
  state.locked = region || { name: 'United States state view' };
  state.rotationVelocity.set(0, 0);
  state.targetRotation.x = THREE.MathUtils.degToRad(31);
  state.targetRotation.y = THREE.MathUtils.degToRad(98);
  setZoom(defaultZoom('us'));
  state.lastInteractionAt = performance.now();
  spotlight.hidden = true;
  setStateLineSelection(null);
  updateSelectionOverlay(null);
  updateScopeInterface();
  if (region) focusRegion(region);
  scrollAtlasIntoView();
}

function exitToWorld() {
  if (!state.tourAdvancing) stopTour();
  state.admin1LoadToken += 1;
  setAdmin1Busy(false);
  const leavingAdmin1 = isAdmin1Scope();
  state.scope = 'world';
  if (leavingAdmin1) clearAdmin1Layer({ resetAggregation: true });
  state.locked = null;
  state.rotationVelocity.set(0, 0);
  state.targetRotation.set(0.38, -0.1);
  setZoom(defaultZoom('world'));
  state.lastInteractionAt = performance.now();
  spotlight.hidden = true;
  setStateLineSelection(null);
  updateSelectionOverlay(null);
  hideTooltip();
  updateScopeInterface();
}

function exitUnitedStates() {
  exitToWorld();
}

function focusRegion(region) {
  if (!region) return;
  if (!state.tourAdvancing) stopTour();
  if (state.scope !== 'us') enterUnitedStates();
  const center = state.usCenters.get(region.name);
  if (!center) return;
  state.locked = region;
  beginFocusTransition(center, window.innerWidth < 760 ? 9.05 : 7.15);
  state.lastInteractionAt = performance.now();
  setStateLineSelection(region);
  updateSelectionOverlay(region);
  showSpotlight(region);
  scrollAtlasIntoView();
}

function stopTour() {
  if (state.tourTimer) window.clearInterval(state.tourTimer);
  state.tourTimer = null;
  state.tourIndex = 0;
  state.tourAdvancing = false;
  stage.classList.remove('atlas-is-touring');
  if (tourButton) tourButton.setAttribute('aria-pressed', 'false');
  if (tourLabel) tourLabel.textContent = 'Tour the top 10';
}

function advanceTour() {
  const entities = (state.scope === 'us'
    ? state.usRegions
    : isAdmin1Scope()
      ? state.detailRankedRegions
      : state.countries).slice(0, 10);
  if (!entities.length) {
    if (isAdmin1Scope()) {
      stopTour();
      if (tourLabel) tourLabel.textContent = 'No published regional ranking';
      showToast(`No ${state.detailConfig.regionLabel} reaches the ${state.detailTotals.publishThreshold}-signal publication threshold.`);
    }
    return false;
  }
  const entity = entities[state.tourIndex % entities.length];
  state.tourIndex = (state.tourIndex + 1) % entities.length;
  state.tourAdvancing = true;
  if (state.scope === 'us') focusRegion(entity);
  else if (isAdmin1Scope()) focusAdmin1Region(entity);
  else focusCountrySurface(entity);
  state.tourAdvancing = false;
  if (tourLabel) tourLabel.textContent = `${String(state.tourIndex || entities.length).padStart(2, '0')}/10 · ${entity.name}`;
  return true;
}

function toggleTour() {
  if (state.tourTimer) {
    stopTour();
    return;
  }
  state.tourIndex = 0;
  if (tourButton) tourButton.setAttribute('aria-pressed', 'true');
  stage.classList.add('atlas-is-touring');
  if (!advanceTour()) return;
  state.tourTimer = window.setInterval(advanceTour, 4200);
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4200);
}

function activePointerDistance() {
  const pointers = [...state.activePointers.values()];
  if (pointers.length < 2) return null;
  return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
}

function bindInteractions() {
  canvas.addEventListener('pointerdown', event => {
    stopTour();
    cancelFocusTransition();
    canvas.focus({ preventScroll: true });
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    if (state.activePointers.size > 1) {
      state.pinching = true;
      state.dragging = false;
      state.pinchStartDistance = activePointerDistance();
      state.pinchStartZoom = state.zoom ?? state.camera.position.z;
      hideTooltip();
      return;
    }
    state.dragging = true;
    state.dragStart.set(event.clientX, event.clientY);
    state.dragLast.copy(state.dragStart);
    state.rotationStart.copy(state.targetRotation);
    state.lastInteractionAt = performance.now();
  });

  canvas.addEventListener('pointermove', event => {
    if (state.activePointers.has(event.pointerId)) {
      state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (state.pinching && state.activePointers.size > 1) {
      const distance = activePointerDistance();
      if (distance && state.pinchStartDistance && state.pinchStartZoom) {
        if (event.cancelable) event.preventDefault();
        setZoom(state.pinchStartZoom * (state.pinchStartDistance / distance));
      }
      hideTooltip();
      return;
    }
    updatePointer(event);
    if (state.dragging) {
      const deltaX = event.clientX - state.dragStart.x;
      const deltaY = event.clientY - state.dragStart.y;
      const moveX = event.clientX - state.dragLast.x;
      const moveY = event.clientY - state.dragLast.y;
      state.targetRotation.y = state.rotationStart.y + deltaX * 0.005;
      state.targetRotation.x = THREE.MathUtils.clamp(state.rotationStart.x + deltaY * 0.0035, -1.15, 1.15);
      state.rotationVelocity.set(moveY * 0.00065, moveX * 0.0009);
      state.dragLast.set(event.clientX, event.clientY);
      state.lastInteractionAt = performance.now();
      hideTooltip();
      return;
    }
    const entity = entityAtPointer();
    if (entity) {
      state.hovered = entity;
      canvas.style.cursor = 'pointer';
      showTooltip(entity, event);
    } else {
      canvas.style.cursor = 'grab';
      hideTooltip();
    }
  });

  canvas.addEventListener('pointerup', event => {
    const moved = Math.hypot(event.clientX - state.dragStart.x, event.clientY - state.dragStart.y);
    const wasPinching = state.pinching;
    state.activePointers.delete(event.pointerId);
    state.dragging = false;
    canvas.releasePointerCapture(event.pointerId);
    if (wasPinching) {
      if (state.activePointers.size < 2) {
        state.pinching = false;
        state.pinchStartDistance = null;
        state.pinchStartZoom = null;
      }
      return;
    }
    if (moved < 7) {
      updatePointer(event);
      const entity = entityAtPointer();
      if (entity) {
        if (entity.kind === 'cityCluster') focusCluster(entity);
        else if (state.scope === 'us') focusRegion(entity);
        else if (isAdmin1Scope() && entity.kind === 'admin1') focusAdmin1Region(entity);
        else focusCountry(entity);
      }
    }
  });

  canvas.addEventListener('pointercancel', () => {
    state.dragging = false;
    state.pinching = false;
    state.activePointers.clear();
    state.pinchStartDistance = null;
    state.pinchStartZoom = null;
  });

  canvas.addEventListener('pointerleave', () => {
    if (!state.dragging) hideTooltip();
  });

  canvas.addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey && document.activeElement !== canvas) return;
    stopTour();
    event.preventDefault();
    setZoom((state.zoom ?? state.camera.position.z) + event.deltaY * 0.0045);
  }, { passive: false });

  canvas.addEventListener('dblclick', event => {
    event.preventDefault();
    zoomBy(-1);
  });

  canvas.addEventListener('keydown', event => {
    const step = event.shiftKey ? 0.2 : 0.08;
    cancelFocusTransition();
    if (event.key === 'ArrowLeft') state.targetRotation.y -= step;
    else if (event.key === 'ArrowRight') state.targetRotation.y += step;
    else if (event.key === 'ArrowUp') state.targetRotation.x = Math.max(-1.15, state.targetRotation.x - step);
    else if (event.key === 'ArrowDown') state.targetRotation.x = Math.min(1.15, state.targetRotation.x + step);
    else if (event.key === '+' || event.key === '=') zoomBy(-1);
    else if (event.key === '-') zoomBy(1);
    else if (event.key === '0') resetCurrentView();
    else return;
    event.preventDefault();
    state.lastInteractionAt = performance.now();
  });

  document.querySelectorAll('[data-atlas-zoom]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-atlas-zoom');
      if (action === 'in') zoomBy(-1);
      else if (action === 'out') zoomBy(1);
      else resetCurrentView();
    });
  });

  if (tourButton) tourButton.addEventListener('click', toggleTour);

  document.querySelectorAll('[data-atlas-view]').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-atlas-view');
      if (view === 'interest') return;
      showToast(view === 'installed'
        ? 'Install data will appear only after anonymous, opt-in LocalClaw telemetry is available.'
        : 'Verified activity requires real local model launches. LocalClaw will never infer it from website visits.');
    });
  });

  document.querySelectorAll('[data-country-focus]').forEach(button => {
    button.addEventListener('click', () => {
      const country = state.countryByName.get(button.getAttribute('data-country-focus'));
      if (country) focusCountry(country);
    });
  });

  document.querySelectorAll('[data-state-focus]').forEach(button => {
    button.addEventListener('click', () => {
      const region = state.usRegionByName.get(button.getAttribute('data-state-focus'));
      if (region) enterUnitedStates(region);
    });
  });

  document.querySelectorAll('[data-atlas-world-reset]').forEach(button => {
    button.addEventListener('click', exitUnitedStates);
  });

  document.querySelectorAll('[data-atlas-us-open]').forEach(button => {
    button.addEventListener('click', () => enterUnitedStates());
  });

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    state.running = !document.hidden && state.inViewport && !state.contextLost;
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      state.inViewport = Boolean(entries[0]?.isIntersecting);
      state.running = !document.hidden && state.inViewport && !state.contextLost;
    }, { threshold: 0.01 });
    observer.observe(stage);
  }
  document.addEventListener('localclaw:themechange', event => updateTheme(event.detail?.theme));
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    state.contextLost = true;
    state.running = false;
    stage.classList.remove('atlas-ready');
    if (fallbackNote) {
      fallbackNote.hidden = false;
      fallbackNote.textContent = 'Interactive globe paused · static view active';
    }
  });
  canvas.addEventListener('webglcontextrestored', () => {
    state.contextLost = false;
    state.running = !document.hidden && state.inViewport;
    stage.classList.add('atlas-ready');
    if (fallbackNote) fallbackNote.hidden = true;
  });
}

function animate(time) {
  if (!state.running || !state.initialized) return;
  const seconds = time * 0.001;
  const idle = performance.now() - state.lastInteractionAt > 2800;
  let cinematicMotion = false;

  if (state.revealStartedAt !== null && state.revealFromZoom !== null) {
    const progress = THREE.MathUtils.clamp((time - state.revealStartedAt) / 1650, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    state.camera.position.z = THREE.MathUtils.lerp(state.revealFromZoom, state.zoom ?? defaultZoom(), eased);
    state.globeGroup.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, eased));
    cinematicMotion = progress < 1;
    if (progress >= 1) finishReveal();
  }

  if (!cinematicMotion && state.focusTransition) {
    const transition = state.focusTransition;
    const progress = THREE.MathUtils.clamp((time - transition.startedAt) / transition.duration, 0, 1);
    const pullbackEnd = 0.22;
    const rotationEnd = 0.74;
    if (progress <= pullbackEnd) {
      const phase = easingCubic(progress / pullbackEnd);
      state.camera.position.z = THREE.MathUtils.lerp(transition.fromZoom, transition.pullbackZoom, phase);
      state.globeGroup.rotation.x = transition.fromX;
      state.globeGroup.rotation.y = transition.fromY;
    } else if (progress <= rotationEnd) {
      const phase = easingCubic((progress - pullbackEnd) / (rotationEnd - pullbackEnd));
      state.camera.position.z = transition.pullbackZoom;
      state.globeGroup.rotation.x = THREE.MathUtils.lerp(transition.fromX, transition.toX, phase);
      state.globeGroup.rotation.y = THREE.MathUtils.lerp(transition.fromY, transition.toY, phase);
    } else {
      const phase = easingCubic((progress - rotationEnd) / (1 - rotationEnd));
      state.camera.position.z = THREE.MathUtils.lerp(transition.pullbackZoom, transition.toZoom, phase);
      state.globeGroup.rotation.x = transition.toX;
      state.globeGroup.rotation.y = transition.toY;
    }
    cinematicMotion = progress < 1;
    if (progress >= 1) {
      state.globeGroup.rotation.x = transition.toX;
      state.globeGroup.rotation.y = transition.toY;
      state.camera.position.z = transition.toZoom;
      cancelFocusTransition();
    }
  }

  if (!cinematicMotion && !state.focusTransition) {
    if (state.zoom !== null) {
      state.camera.position.z += (state.zoom - state.camera.position.z) * (prefersReducedMotion.matches ? 1 : 0.12);
    }
    if (!prefersReducedMotion.matches && idle && !state.dragging && !state.locked) {
      state.targetRotation.y += 0.00042;
    }

    if (!state.dragging) {
      state.targetRotation.x += state.rotationVelocity.x;
      state.targetRotation.y += state.rotationVelocity.y;
      state.rotationVelocity.multiplyScalar(0.92);
    }
    state.globeGroup.rotation.x += (state.targetRotation.x - state.globeGroup.rotation.x) * 0.075;
    state.globeGroup.rotation.y += (state.targetRotation.y - state.globeGroup.rotation.y) * 0.075;
  }

  updateBeaconVisualScale(seconds);

  if (!prefersReducedMotion.matches) {
    if (state.backgroundField) {
      state.backgroundField.rotation.y = seconds * 0.0025;
      state.backgroundField.rotation.x = Math.sin(seconds * 0.08) * 0.012;
    }
  }

  updateProjectedLabels(time);
  updateWorldMapClarity();
  state.renderer.render(state.scene, state.camera);
}

function renderDataSummary() {
  document.querySelectorAll('[data-total-signals]').forEach(element => {
    element.textContent = number(state.data.totals.signals);
  });
  document.querySelectorAll('[data-total-regions]').forEach(element => {
    element.textContent = number(state.data.totals.regions);
  });
  document.querySelectorAll('[data-us-visible-signals]').forEach(element => {
    element.textContent = number(state.usData.totals.publishedSignals);
  });
  document.querySelectorAll('[data-us-visible-regions]').forEach(element => {
    element.textContent = number(state.usData.totals.publishedRegions);
  });
  updateScopeInterface();
}

async function initialize() {
  try {
    const [dataResponse, worldResponse, statesResponse, manifestResponse, activityResponse] = await Promise.all([
      fetch(DATA_URL),
      fetch(WORLD_URL),
      fetch(US_STATES_URL),
      fetch(ADMIN1_MANIFEST_URL),
      fetch(ADMIN1_ACTIVITY_URL)
    ]);
    if (!dataResponse.ok || !worldResponse.ok || !statesResponse.ok || !manifestResponse.ok || !activityResponse.ok) {
      throw new Error('Atlas data could not be loaded.');
    }
    state.data = await dataResponse.json();
    state.world = await worldResponse.json();
    state.usBoundaries = await statesResponse.json();
    state.admin1Manifest = await manifestResponse.json();
    state.admin1Activity = await activityResponse.json();
    state.admin1ActivityByA3 = new Map(Object.values(state.admin1Activity?.countries || {})
      .map(record => [String(record.adm0A3 || '').toUpperCase(), record])
      .filter(([code]) => Boolean(code)));
    state.usData = state.data.subnational?.['United States'];
    if (!state.usData) throw new Error('United States state data is missing.');
    state.countries = state.data.countries.filter(country => country.signals >= PUBLISH_THRESHOLD);
    state.usRegions = state.usData.regions.filter(region => region.signals >= state.usData.publishThreshold);
    state.cityClusters = normalizeCityClusters(state.data.cityClusters);
    state.countryByName = new Map(state.countries.map(country => [country.name, country]));
    state.usRegionByName = new Map(state.usRegions.map(region => [region.name, region]));
    state.countryFeatures = new Map(state.countries.map(country => [country.name, featureForCountry(country.name)]));
    buildWorldCountryEntities();
    state.stateFeatures = new Map(state.usBoundaries.features.map(feature => [feature.properties?.NAME, feature]));
    for (const country of state.worldCountries) {
      const center = centerForCountry(country);
      if (center) state.centers.set(country.name, center);
      const feature = country.feature || featureForCountry(country.name);
      if (!country.published) continue;
      for (const code of [feature?.properties?.ISO_A2, feature?.properties?.ISO_A2_EH, feature?.properties?.WB_A2]) {
        if (code && code !== '-99') state.countryByCode.set(String(code).toUpperCase(), country);
      }
    }
    for (const region of state.usRegions) {
      const center = centerForState(region);
      if (center) state.usCenters.set(region.name, center);
    }
    setupScene();
    stage.dataset.worldPoints = String(state.placementStats.world.points);
    stage.dataset.worldPointsOutside = String(state.placementStats.world.outside);
    stage.dataset.worldPointsMissingGeometry = String(state.placementStats.world.missingGeometry);
    stage.dataset.usPoints = String(state.placementStats.us.points);
    stage.dataset.usPointsOutside = String(state.placementStats.us.outside);
    stage.dataset.usPointsMissingGeometry = String(state.placementStats.us.missingGeometry);
    stage.dataset.cityClusters = String(state.cityClusters.length);
    stage.dataset.cityClustersRendered = String(state.clusterEntries.length);
    stage.dataset.admin1Countries = String(Object.keys(state.admin1Manifest?.countries || {}).length);
    stage.classList.toggle('atlas-has-city-clusters', state.cityClusters.length > 0);
    renderStatePanel();
    bindInteractions();
    renderDataSummary();
    state.initialized = true;
    state.renderer.setAnimationLoop(animate);
    requestAnimationFrame(() => stage.classList.add('atlas-ready'));
  } catch (error) {
    console.error(error);
    stage.classList.remove('atlas-ready');
    if (fallbackNote) {
      fallbackNote.hidden = false;
      fallbackNote.textContent = 'Static globe active · rankings remain available below';
    }
  }
}

initialize();
