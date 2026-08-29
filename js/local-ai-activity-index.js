import * as THREE from './vendor/three.module.min.js';

const DATA_URL = '/data/local-ai-activity-index.json?v=20260829a';
const WORLD_URL = '/data/ne_110m_admin_0_countries.geojson?v=20260829a';
const PUBLISH_THRESHOLD = 5;
const GLOBE_RADIUS = 3.65;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const stage = document.querySelector('[data-atlas-stage]');
const canvas = document.querySelector('#atlas-globe');
const tooltip = document.querySelector('[data-atlas-tooltip]');
const spotlight = document.querySelector('[data-atlas-spotlight]');
const toast = document.querySelector('[data-atlas-toast]');
const fallbackNote = document.querySelector('[data-atlas-fallback-note]');

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
  countries: [],
  countryByName: new Map(),
  centers: new Map(),
  scene: null,
  camera: null,
  renderer: null,
  globe: null,
  globeGroup: null,
  texture: null,
  pulseSprites: [],
  targetRotation: new THREE.Vector2(0.38, -0.1),
  rotationVelocity: new THREE.Vector2(0, 0),
  dragging: false,
  dragStart: new THREE.Vector2(),
  dragLast: new THREE.Vector2(),
  rotationStart: new THREE.Vector2(),
  pointer: new THREE.Vector2(10, 10),
  raycaster: new THREE.Raycaster(),
  zoom: null,
  mobileLayout: null,
  hovered: null,
  locked: null,
  lastInteractionAt: performance.now(),
  running: true,
  inViewport: true,
  contextLost: false,
  initialized: false,
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
  return [properties.ADMIN, properties.NAME, properties.NAME_EN, properties.SOVEREIGNT]
    .filter(Boolean)
    .map(value => String(value));
}

function featureForCountry(countryName) {
  const expected = aliases.get(countryName) || [countryName];
  return state.world.features.find(feature => {
    const names = featureNames(feature);
    return expected.some(name => names.includes(name));
  });
}

function featureCenter(feature) {
  if (!feature) return null;
  const properties = feature.properties || {};
  const lon = Number(properties.LABEL_X ?? properties.LABEL_LON ?? properties.CENTROID_X);
  const lat = Number(properties.LABEL_Y ?? properties.LABEL_LAT ?? properties.CENTROID_Y);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];

  const geometry = feature.geometry;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const ring = polygons?.[0]?.[0] || [];
  if (ring.length === 0) return null;
  const sum = ring.reduce((accumulator, point) => [accumulator[0] + point[1], accumulator[1] + point[0]], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}

function centerForCountry(country) {
  const hubs = countryHubs[country.name];
  if (hubs?.length) return hubs[0];
  return featureCenter(featureForCountry(country.name));
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
    drawFeature(context, feature, textureCanvas.width, textureCanvas.height);
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
}

function createParticles() {
  const points = [];
  const colors = [];
  const maximum = state.countries[0].signals;
  const mobile = window.innerWidth < 760;

  for (const country of state.countries) {
    const hubs = countryHubs[country.name] || [state.centers.get(country.name)].filter(Boolean);
    if (!hubs.length) continue;
    const count = mobile
      ? Math.max(4, Math.min(120, Math.round(Math.sqrt(country.signals) * 4.1)))
      : Math.max(6, Math.min(240, Math.round(Math.sqrt(country.signals) * 6.2)));
    const random = randomFactory(hashString(country.name));
    const spread = hubs.length > 1 ? 1.55 : Math.max(0.35, Math.min(1.2, 1.8 / Math.sqrt(country.signals)));
    const intensity = Math.log1p(country.signals) / Math.log1p(maximum);
    for (let index = 0; index < count; index += 1) {
      const hub = hubs[Math.floor(random() * hubs.length)];
      const lat = hub[0] + normalRandom(random) * spread;
      const lonSpread = spread / Math.max(0.35, Math.cos(THREE.MathUtils.degToRad(lat)));
      const lon = hub[1] + normalRandom(random) * lonSpread;
      const altitude = 0.014 + random() * (0.035 + intensity * 0.045);
      points.push(latLonToVector(lat, lon, GLOBE_RADIUS + altitude));
      colors.push(new THREE.Color().setHSL(0.018 + random() * 0.025, 1, 0.42 + random() * 0.1));
    }
  }

  const geometry = new THREE.IcosahedronGeometry(0.014, mobile ? 0 : 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: state.theme === 'light' ? 0.62 : 0.82,
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
  state.globeGroup.add(mesh);

  const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
  glowGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors.flatMap(color => color.toArray()), 3));
  const glowMaterial = new THREE.PointsMaterial({
    map: glowTexture(),
    size: window.innerWidth < 760 ? 0.058 : 0.072,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: state.theme === 'light' ? 0.16 : 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    alphaTest: 0.01
  });
  const glows = new THREE.Points(glowGeometry, glowMaterial);
  glows.userData.activityGlows = true;
  state.globeGroup.add(glows);
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
    const baseScale = 0.13 + Math.min(0.26, Math.sqrt(country.signals) * 0.007);
    sprite.scale.setScalar(baseScale);
    sprite.userData = {
      country,
      baseScale,
      phase: (hashString(country.name) % 628) / 100
    };
    state.pulseSprites.push(sprite);
    state.globeGroup.add(sprite);
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
  createBackgroundField();
  resize();
}

function resize() {
  if (!state.renderer || !state.camera) return;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const mobile = width < 760;
  state.renderer.setSize(width, height, false);
  state.camera.aspect = width / Math.max(height, 1);
  state.camera.fov = mobile ? 42 : 34;
  if (state.zoom === null || state.mobileLayout !== mobile) state.zoom = mobile ? 10.4 : 9.25;
  state.mobileLayout = mobile;
  state.camera.position.z = state.zoom;
  state.camera.position.y = mobile ? 0.48 : 0.18;
  state.globeGroup.position.y = mobile ? -1.48 : -1.18;
  state.camera.updateProjectionMatrix();
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
      object.material.uniforms.strength.value = state.theme === 'light' ? 0.4 : 0.82;
    }
    if (object.userData.activityParticles) object.material.opacity = state.theme === 'light' ? 0.62 : 0.82;
    if (object.userData.activityGlows) object.material.opacity = state.theme === 'light' ? 0.16 : 0.24;
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
}

function countryNearestTo(lat, lon) {
  const point = latLonToVector(lat, lon, 1);
  let nearest = null;
  let smallest = Infinity;
  for (const country of state.countries) {
    const locations = countryHubs[country.name] || [state.centers.get(country.name)].filter(Boolean);
    for (const location of locations) {
      const angle = point.angleTo(latLonToVector(location[0], location[1], 1));
      if (angle < smallest) {
        nearest = country;
        smallest = angle;
      }
    }
  }
  return smallest < THREE.MathUtils.degToRad(window.innerWidth < 760 ? 10 : 7) ? nearest : null;
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function countryAtPointer() {
  if (!state.globe || !state.camera) return null;
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const intersection = state.raycaster.intersectObject(state.globe, false)[0];
  if (!intersection) return null;
  const local = state.globeGroup.worldToLocal(intersection.point.clone());
  const { lat, lon } = vectorToLatLon(local);
  return countryNearestTo(lat, lon);
}

function showTooltip(country, event) {
  if (!tooltip || !country || window.innerWidth < 760) return;
  tooltip.hidden = false;
  tooltip.querySelector('[data-tooltip-rank]').textContent = `#${country.rank} observed interest`;
  tooltip.querySelector('[data-tooltip-country]').textContent = country.name;
  tooltip.querySelector('[data-tooltip-signals]').textContent = `${number(country.signals)} interest signals`;
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

function showSpotlight(country) {
  if (!spotlight || !country) return;
  const share = ((country.signals / state.data.totals.signals) * 100).toFixed(1);
  spotlight.hidden = false;
  spotlight.querySelector('[data-spotlight-rank]').textContent = `World rank #${country.rank}`;
  spotlight.querySelector('[data-spotlight-country]').textContent = country.name;
  spotlight.querySelector('[data-spotlight-signals]').textContent = `${number(country.signals)} signals · ${share}% of observed interest`;
}

function focusCountry(country) {
  const center = state.centers.get(country.name);
  if (!center) return;
  state.locked = country;
  state.targetRotation.x = THREE.MathUtils.degToRad(center[0] - 7);
  state.targetRotation.y = -THREE.MathUtils.degToRad(center[1]);
  state.lastInteractionAt = performance.now();
  showSpotlight(country);
  stage.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
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

function bindInteractions() {
  canvas.addEventListener('pointerdown', event => {
    state.dragging = true;
    state.dragStart.set(event.clientX, event.clientY);
    state.dragLast.copy(state.dragStart);
    state.rotationStart.copy(state.targetRotation);
    state.lastInteractionAt = performance.now();
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
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
    const country = countryAtPointer();
    if (country) {
      state.hovered = country;
      canvas.style.cursor = 'pointer';
      showTooltip(country, event);
    } else {
      canvas.style.cursor = 'grab';
      hideTooltip();
    }
  });

  canvas.addEventListener('pointerup', event => {
    const moved = Math.hypot(event.clientX - state.dragStart.x, event.clientY - state.dragStart.y);
    state.dragging = false;
    canvas.releasePointerCapture(event.pointerId);
    if (moved < 7) {
      updatePointer(event);
      const country = countryAtPointer();
      if (country) focusCountry(country);
    }
  });

  canvas.addEventListener('pointercancel', () => {
    state.dragging = false;
  });

  canvas.addEventListener('pointerleave', () => {
    if (!state.dragging) hideTooltip();
  });

  canvas.addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    state.zoom = THREE.MathUtils.clamp(state.camera.position.z + event.deltaY * 0.003, 7.7, 11.3);
    state.camera.position.z = state.zoom;
    state.lastInteractionAt = performance.now();
  }, { passive: false });

  canvas.addEventListener('keydown', event => {
    const step = event.shiftKey ? 0.2 : 0.08;
    if (event.key === 'ArrowLeft') state.targetRotation.y -= step;
    else if (event.key === 'ArrowRight') state.targetRotation.y += step;
    else if (event.key === 'ArrowUp') state.targetRotation.x = Math.max(-1.15, state.targetRotation.x - step);
    else if (event.key === 'ArrowDown') state.targetRotation.x = Math.min(1.15, state.targetRotation.x + step);
    else if (event.key === '+' || event.key === '=') state.zoom = Math.max(7.7, state.camera.position.z - 0.35);
    else if (event.key === '-') state.zoom = Math.min(11.3, state.camera.position.z + 0.35);
    else return;
    state.camera.position.z = state.zoom;
    event.preventDefault();
    state.lastInteractionAt = performance.now();
  });

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
}

async function initialize() {
  try {
    const [dataResponse, worldResponse] = await Promise.all([fetch(DATA_URL), fetch(WORLD_URL)]);
    if (!dataResponse.ok || !worldResponse.ok) throw new Error('Atlas data could not be loaded.');
    state.data = await dataResponse.json();
    state.world = await worldResponse.json();
    state.countries = state.data.countries.filter(country => country.signals >= PUBLISH_THRESHOLD);
    state.countryByName = new Map(state.countries.map(country => [country.name, country]));
    for (const country of state.countries) {
      const center = centerForCountry(country);
      if (center) state.centers.set(country.name, center);
    }
    setupScene();
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
