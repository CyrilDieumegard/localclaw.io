import * as THREE from './vendor/three.module.min.js';

const DATA_URL = '/data/local-ai-activity-index.json?v=20260829b';
const WORLD_URL = '/data/ne_110m_admin_0_countries.geojson?v=20260829a';
const US_STATES_URL = '/data/us-states-2024-20m.geojson?v=20260829b';
const PUBLISH_THRESHOLD = 5;
const GLOBE_RADIUS = 3.65;
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
  usData: null,
  countries: [],
  usRegions: [],
  countryByName: new Map(),
  usRegionByName: new Map(),
  countryFeatures: new Map(),
  stateFeatures: new Map(),
  centers: new Map(),
  usCenters: new Map(),
  scene: null,
  camera: null,
  renderer: null,
  globe: null,
  globeGroup: null,
  texture: null,
  pulseSprites: [],
  pulseRings: [],
  beacons: [],
  backgroundField: null,
  worldActivity: [],
  usGroup: null,
  stateLineGroups: new Map(),
  selectedStateLine: null,
  scope: 'world',
  targetRotation: new THREE.Vector2(0.38, -0.1),
  rotationVelocity: new THREE.Vector2(0, 0),
  dragging: false,
  dragStart: new THREE.Vector2(),
  dragLast: new THREE.Vector2(),
  rotationStart: new THREE.Vector2(),
  pointer: new THREE.Vector2(10, 10),
  raycaster: new THREE.Raycaster(),
  zoom: null,
  pinchStartZoom: null,
  pinchStartDistance: null,
  activePointers: new Map(),
  pinching: false,
  tourTimer: null,
  tourIndex: 0,
  tourAdvancing: false,
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

function normalRandom(random) {
  const first = Math.max(random(), 1e-7);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
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

function featureForCountry(countryName) {
  if (state.countryFeatures.has(countryName)) return state.countryFeatures.get(countryName);
  const expected = aliases.get(countryName) || [countryName];
  return state.world?.features.find(feature => {
    const names = featureNames(feature);
    return expected.some(name => names.includes(name));
  }) || null;
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

function containedPoint(feature, origin, spread, random, fallback) {
  if (!feature) return origin || fallback;
  const safeOrigin = origin && pointInFeature(origin[0], origin[1], feature) ? origin : fallback;
  for (let attempt = 0; attempt < 96; attempt += 1) {
    const anchor = safeOrigin || origin || fallback;
    if (!anchor) break;
    const lat = THREE.MathUtils.clamp(anchor[0] + normalRandom(random) * spread, -89.8, 89.8);
    const lonSpread = spread / Math.max(0.38, Math.cos(THREE.MathUtils.degToRad(lat)));
    const lon = normalizeLongitude(anchor[1] + normalRandom(random) * lonSpread);
    if (pointInFeature(lat, lon, feature)) return [lat, lon];
  }
  for (const candidate of [safeOrigin, fallback, origin]) {
    if (candidate && pointInFeature(candidate[0], candidate[1], feature)) return candidate;
  }
  return null;
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
  const feature = featureForCountry(country.name);
  const interior = featureCenter(feature);
  if (interior) return interior;
  return hubs?.[0] || null;
}

function featureForState(stateName) {
  return state.stateFeatures.get(stateName)
    || state.usBoundaries?.features.find(feature => feature.properties?.NAME === stateName)
    || null;
}

function centerForState(region) {
  return featureCenter(featureForState(region.name));
}

function geometryRings(geometry) {
  return polygonsForGeometry(geometry).flatMap(polygon => polygon || []);
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

function drawFeature(context, feature, width, height) {
  const geometry = feature.geometry;
  if (!geometry) return;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  context.beginPath();
  for (const polygon of polygons) {
    for (const ring of polygon) drawRing(context, ring, width, height);
  }
  context.fill('evenodd');
  context.stroke();
}

function makeWorldTexture() {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = window.innerWidth < 760 ? 1280 : 2048;
  textureCanvas.height = textureCanvas.width / 2;
  const context = textureCanvas.getContext('2d');
  const light = state.theme === 'light';

  context.fillStyle = light ? '#dcd5cb' : '#070708';
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  const ocean = context.createLinearGradient(0, 0, textureCanvas.width, textureCanvas.height);
  if (light) {
    ocean.addColorStop(0, '#ede9e2');
    ocean.addColorStop(0.52, '#d9d2c8');
    ocean.addColorStop(1, '#c6beb4');
  } else {
    ocean.addColorStop(0, '#0d0d0e');
    ocean.addColorStop(0.5, '#050506');
    ocean.addColorStop(1, '#111112');
  }
  context.fillStyle = ocean;
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const y = ((90 - latitude) / 180) * textureCanvas.height;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(textureCanvas.width, y);
    context.strokeStyle = light ? 'rgba(70, 61, 55, 0.09)' : 'rgba(255, 255, 255, 0.025)';
    context.lineWidth = 1;
    context.stroke();
  }
  for (let longitude = -150; longitude <= 150; longitude += 30) {
    const x = ((longitude + 180) / 360) * textureCanvas.width;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, textureCanvas.height);
    context.strokeStyle = light ? 'rgba(70, 61, 55, 0.08)' : 'rgba(255, 255, 255, 0.021)';
    context.stroke();
  }

  const maximum = state.countries[0]?.signals || 1;
  for (const feature of state.world.features) {
    const matched = state.countries.find(country => featureForCountry(country.name) === feature);
    const intensity = matched ? Math.log1p(matched.signals) / Math.log1p(maximum) : 0;
    if (light) {
      context.fillStyle = matched
        ? `rgba(${Math.round(72 + intensity * 48)}, ${Math.round(67 - intensity * 12)}, ${Math.round(62 - intensity * 18)}, 0.98)`
        : 'rgba(99, 95, 90, 0.82)';
      context.strokeStyle = matched ? 'rgba(177, 48, 39, 0.52)' : 'rgba(61, 57, 53, 0.35)';
    } else {
      context.fillStyle = matched
        ? `rgba(${Math.round(31 + intensity * 35)}, ${Math.round(29 - intensity * 6)}, ${Math.round(28 - intensity * 8)}, 0.99)`
        : 'rgba(25, 25, 26, 0.98)';
      context.strokeStyle = matched ? 'rgba(255, 73, 54, 0.38)' : 'rgba(146, 137, 128, 0.19)';
    }
    context.lineWidth = matched ? 1.2 : 0.65;
    context.shadowBlur = matched && !light ? 4 + intensity * 10 : 0;
    context.shadowColor = matched ? `rgba(255, 64, 40, ${0.16 + intensity * 0.24})` : 'transparent';
    drawFeature(context, feature, textureCanvas.width, textureCanvas.height);
    context.shadowBlur = 0;
  }

  const random = randomFactory(40829);
  context.globalCompositeOperation = light ? 'multiply' : 'screen';
  for (let index = 0; index < 18000; index += 1) {
    const alpha = random() * (light ? 0.018 : 0.016);
    context.fillStyle = light ? `rgba(42, 36, 31, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    context.fillRect(random() * textureCanvas.width, random() * textureCanvas.height, 1, 1);
  }
  context.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.offset.x = 0.25;
  texture.anisotropy = Math.min(8, state.renderer?.capabilities.getMaxAnisotropy?.() || 4);
  return texture;
}

function glowTexture() {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const context = glowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 191, 137, 0.96)');
  gradient.addColorStop(0.12, 'rgba(255, 91, 48, 0.92)');
  gradient.addColorStop(0.38, 'rgba(255, 46, 24, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 30, 12, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createAtmosphere() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(state.theme === 'light' ? 0xc92f28 : 0xff4a32) },
      strength: { value: state.theme === 'light' ? 0.4 : 0.82 }
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
  outerMaterial.uniforms.strength.value = state.theme === 'light' ? 0.16 : 0.34;
  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 1.105, mobile ? 64 : 112, mobile ? 40 : 72),
    outerMaterial
  );
  outerAtmosphere.userData.atmosphere = true;
  outerAtmosphere.userData.outerAtmosphere = true;
  state.globeGroup.add(outerAtmosphere);
}

function createParticles() {
  const points = [];
  const colors = [];
  const maximum = state.countries[0].signals;
  const mobile = window.innerWidth < 760;

  for (const country of state.countries) {
    const feature = featureForCountry(country.name);
    const center = state.centers.get(country.name);
    const hubs = (countryHubs[country.name] || [center].filter(Boolean))
      .filter(hub => !feature || pointInFeature(hub[0], hub[1], feature));
    if (!hubs.length) continue;
    const count = feature
      ? (mobile
        ? Math.max(3, Math.min(78, Math.round(Math.sqrt(country.signals) * 2.7)))
        : Math.max(4, Math.min(145, Math.round(Math.sqrt(country.signals) * 3.8))))
      : Math.min(9, Math.max(3, Math.round(Math.sqrt(country.signals))));
    const random = randomFactory(hashString(country.name));
    const spread = hubs.length > 1 ? 1.25 : Math.max(0.24, Math.min(0.92, 1.45 / Math.sqrt(country.signals)));
    const intensity = Math.log1p(country.signals) / Math.log1p(maximum);
    if (!feature) state.placementStats.world.missingGeometry += count;
    for (let index = 0; index < count; index += 1) {
      const hub = hubs[Math.floor(random() * hubs.length)];
      const location = feature ? containedPoint(feature, hub, spread, random, center) : hub;
      if (!location) continue;
      const [lat, lon] = location;
      const altitude = 0.014 + random() * (0.035 + intensity * 0.045);
      points.push(latLonToVector(lat, lon, GLOBE_RADIUS + altitude));
      colors.push(new THREE.Color().setHSL(0.012 + random() * 0.024, 1, 0.46 + random() * 0.12));
      state.placementStats.world.points += 1;
      if (feature && !pointInFeature(lat, lon, feature)) state.placementStats.world.outside += 1;
    }
  }

  const geometry = new THREE.IcosahedronGeometry(0.0115, mobile ? 0 : 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: state.theme === 'light' ? 0.68 : 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const mesh = new THREE.InstancedMesh(geometry, material, points.length);
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3();
  for (let index = 0; index < points.length; index += 1) {
    const pulseScale = 0.72 + (index % 9) * 0.055;
    scale.setScalar(pulseScale);
    matrix.compose(points[index], new THREE.Quaternion(), scale);
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(index, colors[index]);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.userData.activityParticles = true;
  mesh.userData.activityScope = 'world';
  state.worldActivity.push(mesh);
  state.globeGroup.add(mesh);

  const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
  glowGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors.flatMap(color => color.toArray()), 3));
  const glowMaterial = new THREE.PointsMaterial({
    map: glowTexture(),
    size: window.innerWidth < 760 ? 0.035 : 0.041,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: state.theme === 'light' ? 0.15 : 0.27,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    alphaTest: 0.01
  });
  const glows = new THREE.Points(glowGeometry, glowMaterial);
  glows.userData.activityGlows = true;
  glows.userData.activityScope = 'world';
  state.worldActivity.push(glows);
  state.globeGroup.add(glows);
}

function orientToSurface(object, position) {
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
}

function createBeaconAccent(entity, center, parent, scope, color = 0xff4a32) {
  if (!center) return;
  const maximum = scope === 'us' ? (state.usRegions[0]?.signals || 1) : (state.countries[0]?.signals || 1);
  const intensity = Math.log1p(entity.signals) / Math.log1p(maximum);
  const surface = latLonToVector(center[0], center[1], GLOBE_RADIUS + 0.032);
  const tip = latLonToVector(center[0], center[1], GLOBE_RADIUS + 0.11 + intensity * 0.28);
  const beaconMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: state.theme === 'light' ? 0.34 : 0.68,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const beacon = new THREE.Line(new THREE.BufferGeometry().setFromPoints([surface, tip]), beaconMaterial);
  beacon.userData = {
    activityAccent: true,
    activityScope: scope,
    baseOpacity: state.theme === 'light' ? 0.34 : 0.68,
    phase: (hashString(`${scope}-beacon-${entity.name}`) % 628) / 100
  };
  state.beacons.push(beacon);
  parent.add(beacon);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: state.theme === 'light' ? 0.22 : 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 48), ringMaterial);
  ring.position.copy(surface.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.038));
  orientToSurface(ring, ring.position);
  ring.userData = {
    activityAccent: true,
    activityScope: scope,
    baseScale: 0.88 + intensity * 0.42,
    baseOpacity: state.theme === 'light' ? 0.22 : 0.42,
    phase: (hashString(`${scope}-ring-${entity.name}`) % 1000) / 1000
  };
  state.pulseRings.push(ring);
  parent.add(ring);

  if (scope === 'world') {
    state.worldActivity.push(beacon, ring);
  }
}

function createPulseHubs() {
  const texture = glowTexture();
  for (const country of state.countries.slice(0, 30)) {
    const center = state.centers.get(country.name);
    if (!center) continue;
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xff3f27,
      transparent: true,
      opacity: state.theme === 'light' ? 0.4 : 0.76,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(latLonToVector(center[0], center[1], GLOBE_RADIUS + 0.055));
    const baseScale = 0.1 + Math.min(0.14, Math.sqrt(country.signals) * 0.0045);
    sprite.scale.setScalar(baseScale);
    sprite.userData = {
      country,
      activityScope: 'world',
      baseScale,
      phase: (hashString(country.name) % 628) / 100
    };
    state.pulseSprites.push(sprite);
    state.worldActivity.push(sprite);
    state.globeGroup.add(sprite);
    if (country.rank <= 12) createBeaconAccent(country, center, state.globeGroup, 'world');
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
        color: state.theme === 'light' ? 0x9f322b : 0xff5b43,
        transparent: true,
        opacity: state.usRegionByName.has(name) ? 0.72 : 0.2,
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
  const points = [];
  const colors = [];
  const mobile = window.innerWidth < 760;
  const maximum = state.usRegions[0]?.signals || 1;

  for (const region of state.usRegions) {
    const feature = featureForState(region.name);
    const center = state.usCenters.get(region.name);
    if (!center) continue;
    const count = mobile
      ? Math.max(3, Math.min(58, Math.round(Math.sqrt(region.signals) * 2.2)))
      : Math.max(4, Math.min(96, Math.round(Math.sqrt(region.signals) * 3.1)));
    const random = randomFactory(hashString(`us-${region.name}`));
    const spread = Math.max(0.18, Math.min(0.76, 1.35 / Math.sqrt(region.signals)));
    const intensity = Math.log1p(region.signals) / Math.log1p(maximum);
    if (!feature) state.placementStats.us.missingGeometry += count;
    for (let index = 0; index < count; index += 1) {
      const location = feature ? containedPoint(feature, center, spread, random, center) : center;
      if (!location) continue;
      const [lat, lon] = location;
      const altitude = 0.035 + random() * (0.035 + intensity * 0.045);
      points.push(latLonToVector(lat, lon, GLOBE_RADIUS + altitude));
      colors.push(new THREE.Color().setHSL(region.qualityFlag ? 0.105 : 0.018 + random() * 0.025, 1, 0.46 + random() * 0.1));
      state.placementStats.us.points += 1;
      if (feature && !pointInFeature(lat, lon, feature)) state.placementStats.us.outside += 1;
    }
  }

  const particleGeometry = new THREE.IcosahedronGeometry(0.0125, mobile ? 0 : 1);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: state.theme === 'light' ? 0.7 : 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const particles = new THREE.InstancedMesh(particleGeometry, particleMaterial, points.length);
  const matrix = new THREE.Matrix4();
  for (let index = 0; index < points.length; index += 1) {
    matrix.setPosition(points[index]);
    particles.setMatrixAt(index, matrix);
    particles.setColorAt(index, colors[index]);
  }
  particles.instanceMatrix.needsUpdate = true;
  if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
  particles.userData.activityParticles = true;
  particles.userData.activityScope = 'us';
  state.usGroup.add(particles);

  const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
  glowGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors.flatMap(color => color.toArray()), 3));
  const glows = new THREE.Points(glowGeometry, new THREE.PointsMaterial({
    map: glowTexture(),
    size: mobile ? 0.037 : 0.044,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: state.theme === 'light' ? 0.18 : 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    alphaTest: 0.01
  }));
  glows.userData.activityGlows = true;
  glows.userData.activityScope = 'us';
  state.usGroup.add(glows);

  const texture = glowTexture();
  for (const region of state.usRegions) {
    const center = state.usCenters.get(region.name);
    if (!center) continue;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      color: region.qualityFlag ? 0xffb020 : 0xff3f27,
      transparent: true,
      opacity: state.theme === 'light' ? 0.46 : 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    }));
    sprite.position.copy(latLonToVector(center[0], center[1], GLOBE_RADIUS + 0.07));
    const baseScale = 0.1 + Math.min(0.15, Math.sqrt(region.signals) * 0.005);
    sprite.scale.setScalar(baseScale);
    sprite.userData = {
      region,
      activityScope: 'us',
      baseScale,
      phase: (hashString(`us-${region.name}`) % 628) / 100
    };
    state.pulseSprites.push(sprite);
    state.usGroup.add(sprite);
    if (region.rank <= 8) createBeaconAccent(region, center, state.usGroup, 'us', region.qualityFlag ? 0xffb020 : 0xff4a32);
  }
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
    color: state.theme === 'light' ? 0x8c5f53 : 0xff6d4e,
    size: 0.012,
    transparent: true,
    opacity: state.theme === 'light' ? 0.08 : 0.2,
    depthWrite: false
  });
  const field = new THREE.Points(geometry, material);
  field.userData.backgroundField = true;
  state.backgroundField = field;
  state.scene.add(field);

  const grid = new THREE.GridHelper(22, 42, 0x5a1f18, 0x2f1614);
  grid.position.set(0, -5.6, -1.7);
  grid.rotation.x = THREE.MathUtils.degToRad(7);
  grid.material.transparent = true;
  grid.material.opacity = state.theme === 'light' ? 0.045 : 0.09;
  grid.userData.backgroundGrid = true;
  state.scene.add(grid);
}

function setupScene() {
  state.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: window.innerWidth > 760,
    alpha: true,
    powerPreference: 'high-performance'
  });
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.35 : 1.65));
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = state.theme === 'light' ? 0.94 : 1.16;

  state.scene = new THREE.Scene();
  state.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  state.camera.position.set(0, 0.18, 9.25);
  state.camera.lookAt(0, -0.75, 0);

  const ambient = new THREE.HemisphereLight(
    state.theme === 'light' ? 0xfff7ed : 0xffe5d8,
    state.theme === 'light' ? 0x4b3f37 : 0x09090b,
    state.theme === 'light' ? 1.45 : 0.58
  );
  ambient.userData.ambient = true;
  state.scene.add(ambient);

  const key = new THREE.DirectionalLight(state.theme === 'light' ? 0xfff5e8 : 0xffd4bd, state.theme === 'light' ? 2.4 : 2.1);
  key.position.set(-4.5, 6.5, 7.5);
  key.userData.keyLight = true;
  state.scene.add(key);

  const ember = new THREE.PointLight(0xff2d1b, state.theme === 'light' ? 10 : 22, 13, 1.8);
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
    roughness: state.theme === 'light' ? 0.76 : 0.9,
    metalness: state.theme === 'light' ? 0.08 : 0.18,
    clearcoat: state.theme === 'light' ? 0.15 : 0.23,
    clearcoatRoughness: 0.76,
    emissive: new THREE.Color(state.theme === 'light' ? 0x2c211d : 0x080403),
    emissiveIntensity: state.theme === 'light' ? 0.02 : 0.34
  });
  const mobile = window.innerWidth < 760;
  state.globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, mobile ? 96 : 160, mobile ? 64 : 112), material);
  state.globe.userData.globeSurface = true;
  state.globeGroup.add(state.globe);

  createAtmosphere();
  createParticles();
  createPulseHubs();
  createStateBoundaries();
  createUSActivity();
  createBackgroundField();
  resize();
}

function defaultZoom(scope = state.scope, mobile = window.innerWidth < 760) {
  if (scope === 'us') return mobile ? 8.75 : 7.85;
  return mobile ? 10.4 : 9.25;
}

function zoomLimits(scope = state.scope, mobile = window.innerWidth < 760) {
  return scope === 'us'
    ? { minimum: mobile ? 5.35 : 4.95, maximum: mobile ? 12.2 : 11.8 }
    : { minimum: mobile ? 5.25 : 4.7, maximum: 13.5 };
}

function updateZoomLevel() {
  if (!zoomLevel || state.zoom === null) return;
  const ratio = defaultZoom() / state.zoom;
  const label = `${ratio.toFixed(1)}×`;
  zoomLevel.textContent = label;
  zoomLevel.setAttribute('aria-label', `Current zoom ${label}`);
  stage.classList.toggle('atlas-is-zoomed', ratio > 1.08);
}

function setZoom(nextZoom, immediate = false) {
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
  } else {
    state.locked = null;
    state.targetRotation.set(0.38, -0.1);
  }
  spotlight.hidden = true;
  hideTooltip();
  setZoom(defaultZoom());
}

function resize() {
  if (!state.renderer || !state.camera) return;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const mobile = width < 760;
  state.renderer.setSize(width, height, false);
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
  state.globe.material.roughness = state.theme === 'light' ? 0.76 : 0.9;
  state.globe.material.metalness = state.theme === 'light' ? 0.08 : 0.18;
  state.globe.material.emissive.set(state.theme === 'light' ? 0x2c211d : 0x080403);
  state.globe.material.emissiveIntensity = state.theme === 'light' ? 0.02 : 0.34;
  state.globe.material.needsUpdate = true;
  state.renderer.toneMappingExposure = state.theme === 'light' ? 0.94 : 1.16;
  state.scene.traverse(object => {
    if (object.userData.atmosphere) {
      object.material.uniforms.glowColor.value.set(state.theme === 'light' ? 0xc92f28 : 0xff4a32);
      object.material.uniforms.strength.value = object.userData.outerAtmosphere
        ? (state.theme === 'light' ? 0.16 : 0.34)
        : (state.theme === 'light' ? 0.4 : 0.82);
    }
    if (object.userData.activityParticles) object.material.opacity = state.theme === 'light' ? 0.62 : 0.82;
    if (object.userData.activityGlows) object.material.opacity = state.theme === 'light' ? 0.16 : 0.24;
    if (object.userData.activityAccent) {
      object.userData.baseOpacity = state.theme === 'light'
        ? (object.type === 'Line' ? 0.34 : 0.22)
        : (object.type === 'Line' ? 0.68 : 0.42);
    }
    if (object.type === 'Line' && object.parent?.userData.stateName) {
      object.material.color.set(state.theme === 'light' ? 0x9f322b : 0xff5b43);
    }
    if (object.userData.backgroundField) {
      object.material.color.set(state.theme === 'light' ? 0x8c5f53 : 0xff6d4e);
      object.material.opacity = state.theme === 'light' ? 0.08 : 0.2;
    }
    if (object.userData.backgroundGrid) object.material.opacity = state.theme === 'light' ? 0.045 : 0.09;
    if (object.userData.ambient) object.intensity = state.theme === 'light' ? 1.45 : 0.58;
    if (object.userData.keyLight) object.intensity = state.theme === 'light' ? 2.4 : 2.1;
    if (object.userData.emberLight) object.intensity = state.theme === 'light' ? 10 : 22;
  });
  state.pulseSprites.forEach(sprite => {
    sprite.material.opacity = state.theme === 'light' ? 0.4 : 0.76;
  });
  if (state.scope === 'us' && state.locked?.code) setStateLineSelection(state.locked);
}

function countryAt(lat, lon) {
  for (const country of state.countries) {
    const feature = featureForCountry(country.name);
    if (feature && pointInFeature(lat, lon, feature)) return country;
  }
  const point = latLonToVector(lat, lon, 1);
  const tinyCountry = state.countries.find(country => !featureForCountry(country.name)
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
  const intersection = state.raycaster.intersectObject(state.globe, false)[0];
  if (!intersection) return null;
  const local = state.globeGroup.worldToLocal(intersection.point.clone());
  const { lat, lon } = vectorToLatLon(local);
  return state.scope === 'us' ? stateAt(lat, lon) : countryAt(lat, lon);
}

function showTooltip(entity, event) {
  if (!tooltip || !entity || window.innerWidth < 760) return;
  const stateView = state.scope === 'us';
  tooltip.hidden = false;
  tooltip.querySelector('[data-tooltip-rank]').textContent = `#${entity.rank} ${stateView ? 'U.S. state' : 'world'} rank`;
  tooltip.querySelector('[data-tooltip-country]').textContent = entity.name;
  const action = !stateView && entity.name === 'United States' ? ' · select for state detail' : '';
  tooltip.querySelector('[data-tooltip-signals]').textContent = `${number(entity.signals)} interest signals${action}`;
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

function showSpotlight(entity) {
  if (!spotlight || !entity) return;
  const stateView = state.scope === 'us';
  const denominator = stateView ? state.usData.totals.countrySignals : state.data.totals.signals;
  const share = ((entity.signals / denominator) * 100).toFixed(1);
  spotlight.hidden = false;
  spotlight.querySelector('[data-spotlight-rank]').textContent = `${stateView ? 'U.S. state' : 'World'} rank #${entity.rank}`;
  spotlight.querySelector('[data-spotlight-label]').textContent = entity.qualityFlag ? 'Network-location flag' : 'Observed interest';
  spotlight.querySelector('[data-spotlight-country]').textContent = entity.name;
  spotlight.querySelector('[data-spotlight-signals]').textContent = entity.qualityNote
    ? `${number(entity.signals)} signals · ${entity.qualityNote}`
    : `${number(entity.signals)} signals · ${share}% of observed interest`;
}

function focusCountrySurface(country) {
  const center = state.centers.get(country.name);
  if (!center) return;
  state.locked = country;
  state.targetRotation.x = THREE.MathUtils.degToRad(center[0] - 7);
  state.targetRotation.y = -THREE.MathUtils.degToRad(center[1]);
  state.lastInteractionAt = performance.now();
  showSpotlight(country);
  stage.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
}

function focusCountry(country) {
  if (!state.tourAdvancing) stopTour();
  if (country.name === 'United States' && state.usRegions.length) {
    enterUnitedStates();
    return;
  }
  focusCountrySurface(country);
}

function setStateLineSelection(region) {
  if (state.selectedStateLine) {
    state.selectedStateLine.traverse(object => {
      if (object.type === 'Line') {
        object.material.color.set(state.theme === 'light' ? 0x9f322b : 0xff5b43);
        object.material.opacity = 0.72;
      }
    });
  }
  state.selectedStateLine = region ? state.stateLineGroups.get(region.name) : null;
  if (state.selectedStateLine) {
    state.selectedStateLine.traverse(object => {
      if (object.type === 'Line') {
        object.material.color.set(0xffc15a);
        object.material.opacity = 1;
      }
    });
  }
}

function updateScopeInterface() {
  const stateView = state.scope === 'us';
  stage.classList.toggle('atlas-scope-us', stateView);
  if (regionPanel) regionPanel.hidden = !stateView;
  state.worldActivity.forEach(object => { object.visible = !stateView; });
  if (state.usGroup) state.usGroup.visible = stateView;
  if (title) {
    title.innerHTML = stateView
      ? 'See local AI interest <em>state by state.</em>'
      : 'See where <em>local AI</em> is taking off.';
  }
  if (summary) {
    summary.textContent = stateView
      ? 'United States · Approximate network regions · 31 Jul–29 Aug 2026'
      : 'Anonymous interest signals · Last 30 days · Updated 29 August 2026';
  }
  if (liveLabel) liveLabel.textContent = stateView ? 'State-level exploration' : 'Live exploration';
  document.querySelector('[data-scope-signals]').textContent = number(stateView ? state.usData.totals.publishedSignals : state.data.totals.signals);
  document.querySelector('[data-scope-regions]').textContent = number(stateView ? state.usData.totals.publishedRegions : state.data.totals.regions);
  document.querySelector('[data-scope-signal-label]').textContent = stateView ? 'visible state signals' : 'signals';
  document.querySelector('[data-scope-region-label]').textContent = stateView ? 'states published' : 'regions observed';
  document.querySelector('[data-scope-window]').textContent = stateView ? '5-signal threshold' : '30-day window';
  document.querySelector('[data-scope-disclosure]').textContent = stateView
    ? 'Dots stay inside each state; exact positions are illustrative, not residence.'
    : 'Dots stay inside each country; exact positions are illustrative, not verified installations or model runs.';
  canvas.setAttribute('aria-label', stateView
    ? 'Interactive globe showing anonymous LocalClaw interest signals by U.S. state. Drag to rotate, select the map and scroll or use the visible controls to zoom, select a state, or return to the world view.'
    : 'Interactive globe showing anonymous local AI interest signals by country. Drag to rotate, select the map and scroll or use the visible controls to zoom, or use the country ranking below.');
  updateZoomLevel();
}

function renderStatePanel() {
  if (!regionList) return;
  regionList.replaceChildren();
  for (const region of state.usRegions) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-region-name', region.name);
    button.innerHTML = `<span><b>${String(region.rank).padStart(2, '0')}</b>${region.name}${region.qualityFlag ? '<em>flag</em>' : ''}</span><strong>${number(region.signals)}</strong>`;
    button.addEventListener('click', () => focusRegion(region));
    item.append(button);
    regionList.append(item);
  }
}

function enterUnitedStates(region = null) {
  if (!state.tourAdvancing) stopTour();
  state.scope = 'us';
  state.locked = region || { name: 'United States state view' };
  state.rotationVelocity.set(0, 0);
  state.targetRotation.x = THREE.MathUtils.degToRad(31);
  state.targetRotation.y = THREE.MathUtils.degToRad(98);
  setZoom(defaultZoom('us'));
  state.lastInteractionAt = performance.now();
  spotlight.hidden = true;
  setStateLineSelection(null);
  updateScopeInterface();
  if (region) focusRegion(region);
  stage.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
}

function exitUnitedStates() {
  if (!state.tourAdvancing) stopTour();
  state.scope = 'world';
  state.locked = null;
  state.rotationVelocity.set(0, 0);
  state.targetRotation.set(0.38, -0.1);
  setZoom(defaultZoom('world'));
  state.lastInteractionAt = performance.now();
  spotlight.hidden = true;
  setStateLineSelection(null);
  hideTooltip();
  updateScopeInterface();
}

function focusRegion(region) {
  if (!region) return;
  if (!state.tourAdvancing) stopTour();
  if (state.scope !== 'us') enterUnitedStates();
  const center = state.usCenters.get(region.name);
  if (!center) return;
  state.locked = region;
  state.targetRotation.x = THREE.MathUtils.degToRad(center[0] - 7);
  state.targetRotation.y = -THREE.MathUtils.degToRad(center[1]);
  setZoom(window.innerWidth < 760 ? 7.85 : 7.15);
  state.lastInteractionAt = performance.now();
  setStateLineSelection(region);
  showSpotlight(region);
}

function stopTour() {
  if (state.tourTimer) window.clearInterval(state.tourTimer);
  state.tourTimer = null;
  state.tourIndex = 0;
  state.tourAdvancing = false;
  if (tourButton) tourButton.setAttribute('aria-pressed', 'false');
  if (tourLabel) tourLabel.textContent = 'Tour the top 10';
}

function advanceTour() {
  const entities = (state.scope === 'us' ? state.usRegions : state.countries).slice(0, 10);
  if (!entities.length) return;
  const entity = entities[state.tourIndex % entities.length];
  state.tourIndex = (state.tourIndex + 1) % entities.length;
  state.tourAdvancing = true;
  if (state.scope === 'us') focusRegion(entity);
  else focusCountrySurface(entity);
  state.tourAdvancing = false;
  if (tourLabel) tourLabel.textContent = `${String(state.tourIndex || entities.length).padStart(2, '0')}/10 · ${entity.name}`;
}

function toggleTour() {
  if (state.tourTimer) {
    stopTour();
    return;
  }
  state.tourIndex = 0;
  if (tourButton) tourButton.setAttribute('aria-pressed', 'true');
  advanceTour();
  state.tourTimer = window.setInterval(advanceTour, 2800);
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
        if (state.scope === 'us') focusRegion(entity);
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
  if (state.zoom !== null) {
    state.camera.position.z += (state.zoom - state.camera.position.z) * (prefersReducedMotion.matches ? 1 : 0.12);
  }
  if (!prefersReducedMotion.matches && idle && !state.dragging && !state.locked) {
    state.targetRotation.y += 0.00055;
  }

  if (!state.dragging) {
    state.targetRotation.x += state.rotationVelocity.x;
    state.targetRotation.y += state.rotationVelocity.y;
    state.rotationVelocity.multiplyScalar(0.92);
  }
  state.globeGroup.rotation.x += (state.targetRotation.x - state.globeGroup.rotation.x) * 0.075;
  state.globeGroup.rotation.y += (state.targetRotation.y - state.globeGroup.rotation.y) * 0.075;

  if (!prefersReducedMotion.matches) {
    state.pulseSprites.forEach(sprite => {
      const wave = 1 + Math.sin(seconds * 2.2 + sprite.userData.phase) * 0.22;
      sprite.scale.setScalar(sprite.userData.baseScale * wave);
      sprite.material.opacity = (state.theme === 'light' ? 0.34 : 0.65) + Math.sin(seconds * 2.2 + sprite.userData.phase) * 0.16;
    });
    state.pulseRings.forEach(ring => {
      const progress = (seconds * 0.32 + ring.userData.phase) % 1;
      const scale = ring.userData.baseScale * (0.8 + progress * 1.1);
      ring.scale.setScalar(scale);
      ring.material.opacity = ring.userData.baseOpacity * Math.pow(1 - progress, 1.65);
    });
    state.beacons.forEach(beacon => {
      const wave = 0.72 + Math.sin(seconds * 1.8 + beacon.userData.phase) * 0.28;
      beacon.material.opacity = beacon.userData.baseOpacity * wave;
    });
    if (state.backgroundField) {
      state.backgroundField.rotation.y = seconds * 0.0025;
      state.backgroundField.rotation.x = Math.sin(seconds * 0.08) * 0.012;
    }
  }

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
    const [dataResponse, worldResponse, statesResponse] = await Promise.all([fetch(DATA_URL), fetch(WORLD_URL), fetch(US_STATES_URL)]);
    if (!dataResponse.ok || !worldResponse.ok || !statesResponse.ok) throw new Error('Atlas data could not be loaded.');
    state.data = await dataResponse.json();
    state.world = await worldResponse.json();
    state.usBoundaries = await statesResponse.json();
    state.usData = state.data.subnational?.['United States'];
    if (!state.usData) throw new Error('United States state data is missing.');
    state.countries = state.data.countries.filter(country => country.signals >= PUBLISH_THRESHOLD);
    state.usRegions = state.usData.regions.filter(region => region.signals >= state.usData.publishThreshold);
    state.countryByName = new Map(state.countries.map(country => [country.name, country]));
    state.usRegionByName = new Map(state.usRegions.map(region => [region.name, region]));
    state.countryFeatures = new Map(state.countries.map(country => [country.name, featureForCountry(country.name)]));
    state.stateFeatures = new Map(state.usBoundaries.features.map(feature => [feature.properties?.NAME, feature]));
    for (const country of state.countries) {
      const center = centerForCountry(country);
      if (center) state.centers.set(country.name, center);
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
