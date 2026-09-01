import * as THREE from './vendor/three.module.min.js';

const PERIOD_CONFIG = Object.freeze({
  '30d': {
    dataUrl: '/data/local-ai-activity-index.json?v=20260829g',
    admin1Url: '/data/local-ai-admin1-activity.json?v=20260829h',
    installedDataUrl: '/data/local-ai-install-intent.json?v=20260901b',
    installedAdmin1Url: '/data/local-ai-install-intent-admin1.json?v=20260901b',
    modelDataUrl: '/data/local-ai-model-page-interest.json?v=20260901a',
    modelAdmin1Url: '/data/local-ai-model-page-interest-admin1.json?v=20260901a'
  },
  '90d': {
    dataUrl: '/data/local-ai-activity-index-90d.json?v=20260829a',
    admin1Url: '/data/local-ai-admin1-activity-90d.json?v=20260829a',
    installedDataUrl: '/data/local-ai-install-intent-90d.json?v=20260901b',
    installedAdmin1Url: '/data/local-ai-install-intent-admin1-90d.json?v=20260901b',
    modelDataUrl: '/data/local-ai-model-page-interest-90d.json?v=20260901a',
    modelAdmin1Url: '/data/local-ai-model-page-interest-admin1-90d.json?v=20260901a'
  },
  '180d': {
    dataUrl: '/data/local-ai-activity-index-180d.json?v=20260829a',
    admin1Url: '/data/local-ai-admin1-activity-180d.json?v=20260829a',
    installedDataUrl: '/data/local-ai-install-intent-180d.json?v=20260901b',
    installedAdmin1Url: '/data/local-ai-install-intent-admin1-180d.json?v=20260901b',
    modelDataUrl: '/data/local-ai-model-page-interest-180d.json?v=20260901a',
    modelAdmin1Url: '/data/local-ai-model-page-interest-admin1-180d.json?v=20260901a'
  }
});
const requestParams = new URLSearchParams(window.location.search);
const requestedPeriod = requestParams.get('range');
const requestedMetricView = requestParams.get('view');
const requestedView = Object.freeze({
  country: requestParams.get('country') || '',
  region: requestParams.get('region') || '',
  regions: ['1', 'true'].includes(String(requestParams.get('regions') || '').toLowerCase()),
  area: requestParams.get('area') || '',
  brand: requestParams.get('brand') || requestParams.get('family') || '',
  model: requestParams.get('model') || ''
});
const ACTIVE_PERIOD = Object.hasOwn(PERIOD_CONFIG, requestedPeriod) ? requestedPeriod : '30d';
const ACTIVE_VIEW = requestedMetricView === 'installed'
  ? 'installed'
  : requestedMetricView === 'models'
    ? 'models'
    : 'interest';
const DATA_URL = ACTIVE_VIEW === 'installed'
  ? PERIOD_CONFIG[ACTIVE_PERIOD].installedDataUrl
  : ACTIVE_VIEW === 'models'
    ? PERIOD_CONFIG[ACTIVE_PERIOD].modelDataUrl
    : PERIOD_CONFIG[ACTIVE_PERIOD].dataUrl;
const WORLD_URL = '/data/ne_50m_admin_0_countries.geojson?v=20260829f';
const US_STATES_URL = '/data/us-states-2024-20m.geojson?v=20260829b';
const ADMIN1_MANIFEST_URL = '/data/admin1/manifest.json?v=20260829h';
const ADMIN1_ACTIVITY_URL = ACTIVE_VIEW === 'installed'
  ? PERIOD_CONFIG[ACTIVE_PERIOD].installedAdmin1Url
  : PERIOD_CONFIG[ACTIVE_PERIOD].admin1Url;
const MODEL_ADMIN1_ACTIVITY_URL = PERIOD_CONFIG[ACTIVE_PERIOD].modelAdmin1Url;
const ADMIN2_MANIFEST_URL = '/data/admin2/manifest.json?v=20260829c';
const PUBLISH_THRESHOLD = 5;
const ADMIN1_CACHE_LIMIT = 4;
const ADMIN2_CACHE_LIMIT = 4;
const GLOBE_RADIUS = 3.65;
const MOBILE_BREAKPOINT = 760;
const DESKTOP_TEXTURE_WIDTH = 4096;
const MOBILE_TEXTURE_WIDTH = 1024;
const DESKTOP_DPR_MIN = 2;
const DESKTOP_DPR_MAX = 2.5;
const MOBILE_DPR_MAX = 1.5;
const MOBILE_ACTIVE_FPS = 45;
const MOBILE_IDLE_FPS = 30;
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
const shareOverlay = document.querySelector('[data-atlas-share-overlay]');
const shareTitle = document.querySelector('[data-atlas-share-title]');
const shareSummary = document.querySelector('[data-atlas-share-summary]');
const shareEyebrow = document.querySelector('[data-atlas-share-eyebrow]');
const sharePrimary = document.querySelector('[data-atlas-share-primary]');
const sharePrimaryLabel = document.querySelector('[data-atlas-share-primary-label]');
const shareSecondary = document.querySelector('[data-atlas-share-secondary]');
const shareSecondaryLabel = document.querySelector('[data-atlas-share-secondary-label]');
const shareCopyButton = document.querySelector('[data-atlas-share-copy]');
const shareDownloadButton = document.querySelector('[data-atlas-share-download]');
const shareNativeButton = document.querySelector('[data-atlas-share-native]');
const modelPanel = document.querySelector('[data-atlas-model-panel]');
const installPanel = document.querySelector('[data-atlas-install-panel]');
const modelLogoLayer = document.querySelector('[data-atlas-model-logo-layer]');
const modelLegend = document.querySelector('[data-atlas-model-legend]');
let installPanelReturnFocus = null;

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
  ['United States', {
    viewLabel: 'State-level view',
    liveLabel: 'State-level exploration',
    regionLabel: 'state or federal district',
    regionsLabel: 'states and federal district',
    titleEmphasis: 'across the United States, state by state.'
  }],
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
  }],
  ['Australia', {
    viewLabel: 'State and territory view',
    liveLabel: 'State and territory exploration',
    regionLabel: 'state or territory',
    regionsLabel: 'states and territories',
    titleEmphasis: 'across Australia’s states and territories.'
  }]
]);

const admin1NameOverrides = new Map([
  ['US-DC', 'District of Columbia'],
  ['RUS-2399', 'Altai Krai'],
  ['RUS-2400', 'Altai Republic'],
  ['RUS-2364', 'Moscow Oblast'],
  ['RUS-2365', 'Moscow']
]);

const admin1CodeOverrides = new Map([
  ['RUS-2399', ['RU-ALT']],
  ['RUS-2400', ['RU-AL']],
  ['RUS-2364', ['RU-MOS']],
  ['RUS-2365', ['RU-MOW']],
  ['AUS-1932', ['AU-NSW']]
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
  modelAdmin1Activity: null,
  admin1Boundaries: null,
  admin1ActivityByA3: new Map(),
  admin1Cache: new Map(),
  admin1LoadToken: 0,
  admin1Loading: false,
  admin2Manifest: null,
  admin2Boundaries: null,
  admin2Cache: new Map(),
  admin2Requests: new Map(),
  admin2LoadToken: 0,
  admin2Loading: false,
  usData: null,
  countries: [],
  worldCountries: [],
  usRegions: [],
  usAllRegions: [],
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
  admin2Parent: null,
  admin2ParentScope: null,
  admin2Config: null,
  admin2Features: [],
  admin2Regions: [],
  admin2Group: null,
  admin2BoundaryLine: null,
  admin2ParentLine: null,
  admin2AssignmentByCluster: new Map(),
  cityClusters: [],
  clusterGroup: null,
  clusterEntries: [],
  clusterHitMeshes: [],
  clusterLabels: [],
  modelMarkerGroup: null,
  modelMarkerEntries: [],
  modelMarkerHitMeshes: [],
  modelRegionMarkerGroup: null,
  modelRegionMarkerEntries: [],
  modelRegionMarkerHitMeshes: [],
  modelTextureCache: new Map(),
  selectedModelCountry: null,
  selectedModelRegion: null,
  selectedModelBrand: null,
  modelPanelOpen: false,
  selectedInstallCountry: null,
  selectedInstallModel: null,
  installPanelOpen: false,
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
  lastRenderAt: 0,
  renderWidth: 0,
  renderHeight: 0,
  resizeObserver: null,
  running: true,
  inViewport: true,
  contextLost: false,
  initialized: false,
  shareMode: false,
  placementStats: {
    world: { points: 0, outside: 0, missingGeometry: 0 },
    us: { points: 0, outside: 0, missingGeometry: 0 }
  },
  theme: document.documentElement.classList.contains('light') ? 'light' : 'dark'
};

const modelMarkerScratch = {
  globeCenter: new THREE.Vector3(),
  worldPosition: new THREE.Vector3(),
  surfaceNormal: new THREE.Vector3(),
  towardCamera: new THREE.Vector3(),
  projected: new THREE.Vector3(),
  cameraPosition: new THREE.Vector3(),
  globeScale: new THREE.Vector3(1, 1, 1)
};

function number(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function periodDays() {
  return Number(state.data?.period?.days) || (ACTIVE_PERIOD === '180d' ? 180 : ACTIVE_PERIOD === '90d' ? 90 : 30);
}

function periodLabel() {
  return state.data?.period?.label || (ACTIVE_PERIOD === '180d' ? 'Last 6 months' : ACTIVE_PERIOD === '90d' ? 'Last 3 months' : 'Last 30 days');
}

function formattedDate(value, includeYear = false) {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {})
  }).format(date);
}

function periodDateRange() {
  const start = state.data?.period?.start;
  const end = state.data?.period?.end;
  if (!start || !end) return '';
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formattedDate(start, !sameYear)}–${formattedDate(end, true)}`;
}

function isInstallIntentView() {
  return ACTIVE_VIEW === 'installed';
}

function isModelInterestView() {
  return ACTIVE_VIEW === 'models';
}

function signalLabel(value, singular = false) {
  if (isInstallIntentView()) return singular ? 'install-intent visitor' : 'install-intent visitors';
  if (isModelInterestView()) return singular ? 'model-page visitor' : 'model-page visitors';
  return singular ? 'interest signal' : 'interest signals';
}

function publishedSignalLabel() {
  if (isModelInterestView()) return 'published model-page visitors';
  return isInstallIntentView() ? 'visitors in published country rows' : 'published signals';
}

function sharePeriodLabel() {
  if (ACTIVE_PERIOD === '180d') return '6-MONTH VIEW';
  if (ACTIVE_PERIOD === '90d') return '3-MONTH VIEW';
  return '30-DAY VIEW';
}

function installCoverageCopy() {
  if (!isInstallIntentView() || !state.data?.period?.partial) return '';
  const days = number(state.data.period.effectiveCoverageDays || 0);
  const startedAt = state.data.period.trackingStartedAt;
  return `Coverage: ${days} observed day${days === 1 ? '' : 's'}${startedAt ? ` since ${formattedDate(startedAt, true)}` : ''}.`;
}

function atlasTrack(eventName, properties = {}) {
  if (typeof window.datafast !== 'function') return;
  try {
    window.datafast(eventName, {
      period: ACTIVE_PERIOD,
      view: ACTIVE_VIEW,
      scope: state.scope,
      ...properties
    });
  } catch (_) {}
}

function shareSnapshot() {
  const dateRange = periodDateRange();
  const locked = state.locked;
  const worldCountry = state.scope === 'world'
    ? locked?.kind === 'cityCluster'
      ? countryForCode(locked.countryCode)
      : locked?.adm0A3
        ? locked
        : null
    : null;

  if (isModelInterestView()) {
    const country = state.selectedModelCountry || worldCountry;
    const region = state.selectedModelRegion;
    const scopeEntity = region || country;
    const brands = scopeEntity ? modelBrandsForCountry(scopeEntity) : globalModelBrands();
    const brand = state.selectedModelBrand
      ? brands.find(row => brandIdentifier(row) === state.selectedModelBrand) || null
      : null;
    if (country && region && brand) {
      const leaders = coLeadingModelBrands(region);
      const isLeader = leaders.includes(brand);
      const isCoLeader = isLeader && leaders.length > 1;
      const brandRank = isLeader ? 1 : brands.indexOf(brand) + 1;
      return {
        scope: 'regional-model',
        entity: region.name,
        title: isLeader
          ? `${brand.label}${isCoLeader ? ' co-leads' : ' leads'} model-page interest in ${region.name}.`
          : `${brand.label} model-page interest in ${region.name}.`,
        summary: `${number(modelBrandSignals(brand))} anonymous visitors explored its eligible model pages in ${region.name}, ${country.name} · ${dateRange}.`,
        primary: number(modelBrandSignals(brand)),
        primaryLabel: 'Regional brand visitors',
        secondary: brandRank > 0 ? `#${brandRank}` : number(modelRowsForBrand(brand).length),
        secondaryLabel: isCoLeader ? 'Co-leading region rank' : 'Region brand rank'
      };
    }
    if (country && region) {
      const visitors = publishedRegionalModelVisitors(region);
      return {
        scope: 'region',
        entity: region.name,
        title: `Local AI model interest in ${region.name}.`,
        summary: visitors !== null
          ? `${number(visitors)} anonymous visitors explored a LocalClaw LLM page in ${region.name}, ${country.name} · ${dateRange}.`
          : `No independently published regional model-page total is available for ${region.name} · ${dateRange}.`,
        primary: visitors !== null ? number(visitors) : '—',
        primaryLabel: 'Regional model-page visitors',
        secondary: number(brands.length),
        secondaryLabel: 'Regional brands published'
      };
    }
    if (country && isAdmin1Scope()) {
      const countryVisitors = state.detailTotals.countrySignals ?? publishedModelCountryVisitors(country);
      const publishedRegions = Number.isFinite(state.detailTotals.regions) ? state.detailTotals.regions : null;
      return {
        scope: 'country-regions',
        entity: country.name,
        title: `Local AI model interest across ${country.name}.`,
        summary: countryVisitors !== null
          ? `${number(countryVisitors)} anonymous country-level model-page visitors; regional rows are independently privacy-thresholded · ${dateRange}.`
          : `Regional model-page interest is shown only where an administrative row independently reaches ${PUBLISH_THRESHOLD} visitors · ${dateRange}.`,
        primary: countryVisitors !== null ? number(countryVisitors) : '—',
        primaryLabel: 'Country model-page visitors',
        secondary: publishedRegions !== null ? number(publishedRegions) : number(state.detailRegions.length),
        secondaryLabel: publishedRegions !== null ? 'Regions published' : 'Boundaries shown'
      };
    }
    if (country && brand) {
      const leaders = coLeadingModelBrands(country);
      const isLeader = leaders.includes(brand);
      const isCoLeader = isLeader && leaders.length > 1;
      const brandRank = isLeader ? 1 : brands.indexOf(brand) + 1;
      return {
        scope: 'model',
        entity: country.name,
        title: isLeader
          ? brand.label + (isCoLeader ? ' is a co-leading' : ' is the most explored') + ' local AI brand in ' + country.name + '.'
          : brand.label + ' model-page interest in ' + country.name + '.',
        summary: number(modelBrandSignals(brand)) + ' anonymous visitors explored its eligible model pages · ' + dateRange + '.',
        primary: number(modelBrandSignals(brand)),
        primaryLabel: 'Brand visitors',
        secondary: brandRank > 0 ? '#' + brandRank : number(modelRowsForBrand(brand).length),
        secondaryLabel: isCoLeader
          ? 'Co-leading country rank'
          : brandRank > 0
            ? 'Country brand rank'
            : 'Models published'
      };
    }
    if (country) {
      const countryVisitors = publishedModelCountryVisitors(country);
      return {
        scope: 'country',
        entity: country.name,
        title: 'Local AI model interest in ' + country.name + '.',
        summary: countryVisitors !== null
          ? number(countryVisitors) + ' anonymous visitors explored a LocalClaw LLM page · ' + dateRange + '.'
          : `No independently published country model-page total is available for ${country.name} · ${dateRange}.`,
        primary: countryVisitors !== null ? number(countryVisitors) : '—',
        primaryLabel: 'Model-page visitors',
        secondary: number(brands.length),
        secondaryLabel: 'Brands published'
      };
    }
    if (brand && state.selectedModelBrand) {
      const publishedCountryCount = state.countries.filter(candidate => modelBrandsForCountry(candidate)
        .some(candidateBrand => brandIdentifier(candidateBrand) === brandIdentifier(brand))).length;
      return {
        scope: 'brand',
        entity: brand.label,
        title: brand.label + ' model-page interest around the world.',
        summary: number(modelBrandSignals(brand)) + ' unique visitors explored its eligible LocalClaw model pages; '
          + (publishedCountryCount
            ? `${number(publishedCountryCount)} countr${publishedCountryCount === 1 ? 'y' : 'ies'} independently reached ${PUBLISH_THRESHOLD}+ visitors`
            : `no individual country independently reached ${PUBLISH_THRESHOLD} visitors`)
          + ' · ' + dateRange + '.',
        primary: number(modelBrandSignals(brand)),
        primaryLabel: 'Brand visitors',
        secondary: number(publishedCountryCount),
        secondaryLabel: 'Countries published'
      };
    }
    return {
      scope: 'world',
      entity: 'World',
      title: 'See which local AI brands each country is exploring.',
      summary: number(state.data.totals.modelVisitors ?? state.data.totals.signals) + ' anonymous model-page visitors · ' + dateRange + '.',
      primary: number(state.data.totals.modelVisitors ?? state.data.totals.signals),
      primaryLabel: 'Model-page visitors',
      secondary: number(state.data.totals.countriesWithPublishedBrands ?? state.data.totals.regions),
      secondaryLabel: 'Countries with brands'
    };
  }

  if (isInstallIntentView() && state.scope === 'world') {
    const country = state.selectedInstallCountry || worldCountry;
    const models = installModelsForCountry(country);
    const runtimes = installRuntimesForCountry(country);
    const selectedModel = state.selectedInstallModel
      ? models.find(model => installModelIdentifier(model) === state.selectedInstallModel) || null
      : null;
    const model = selectedModel || (country ? models[0] : null) || null;
    const runtime = runtimes[0] || null;
    const coverage = installCoverageCopy();
    if (country) {
      const modelRank = model ? models.indexOf(model) + 1 : 0;
      return {
        scope: model ? 'install-model' : 'country',
        entity: country.name,
        title: model
          ? modelRank === 1
            ? `${model.label} is the leading published model path in ${country.name}.`
            : `${model.label} is the #${modelRank} published model path in ${country.name}.`
          : runtime
            ? `${runtime.label} is the leading published path in ${country.name}.`
            : `${country.name} has install intent, with stack detail still private.`,
        summary: `${number(country.signals)} visitors selected an eligible setup, repository or desktop-app path · ${dateRange}. ${coverage} Click intent, not verified installations.`,
        primary: number(country.signals),
        primaryLabel: 'Install-intent visitors',
        secondary: model ? number(model.visitors) : runtime ? number(runtime.visitors) : '—',
        secondaryLabel: model ? 'Model-path visitors' : runtime ? 'Destination visitors' : 'Detail below 5'
      };
    }
    if (model) {
      return {
        scope: 'install-model',
        entity: model.label,
        title: `${model.label} is the first published model path in LocalClaw install intent.`,
        summary: `${number(model.visitors)} visitors selected an eligible path after this model page · ${dateRange}. ${coverage} Click intent, not verified installations.`,
        primary: number(model.visitors),
        primaryLabel: 'Model-path visitors',
        secondary: model.recommendedProfile || '—',
        secondaryLabel: 'Catalogue profile'
      };
    }
    return {
      scope: 'world',
      entity: 'World',
      title: 'See which local AI install paths visitors choose.',
      summary: `${number(state.data.totals.observedSignals)} unique visitors selected an eligible path · ${dateRange}. ${coverage} Click intent, not verified installations.`,
      primary: number(state.data.totals.observedSignals),
      primaryLabel: 'Install-intent visitors',
      secondary: number(state.data.installIntentDetails?.totals?.publishedRuntimes || 0),
      secondaryLabel: 'Setup destinations published'
    };
  }

  if (state.scope === 'us') {
    const region = locked?.code ? locked : null;
    if (region) {
      return {
        scope: 'state',
        entity: region.name,
        title: `${region.name} in the U.S. local AI map.`,
        summary: Number.isFinite(region.signals)
          ? `${number(region.signals)} published state-level ${signalLabel(region.signals)} · ${dateRange}.`
          : `State boundaries are visible even when no state-level total is published · ${dateRange}.`,
        primary: metric(region.signals),
        primaryLabel: 'Published state signals',
        secondary: Number.isInteger(region.rank) ? `#${region.rank}` : '—',
        secondaryLabel: 'U.S. state rank'
      };
    }
    return {
      scope: 'country',
      entity: 'United States',
      title: isInstallIntentView() ? 'Local AI install intent, state by state.' : 'Local AI interest, state by state.',
      summary: `${number(state.usData.totals.publishedRegions)} states publish an independent total · ${dateRange}.`,
      primary: number(state.usData.totals.publishedSignals),
      primaryLabel: 'Published state signals',
      secondary: number(state.usData.totals.publishedRegions),
      secondaryLabel: 'States published'
    };
  }

  if (isAdmin2Scope()) {
    const area = locked?.kind === 'admin2' ? locked : null;
    return {
      scope: 'area',
      entity: area?.label || area?.name || state.admin2Config.parentName,
      title: area
        ? `${area.label || area.name}, inside ${state.admin2Config.parentName}.`
        : `${state.admin2Config.parentName}, mapped in finer detail.`,
      summary: `${number(state.admin2Regions.length)} ${state.admin2Config.childrenLabel} shown as neutral cartographic references · ${dateRange}.`,
      primary: metric(state.admin2Config.parentSignals),
      primaryLabel: state.admin2Config.parentSignalLabel,
      secondary: number(state.admin2Regions.length),
      secondaryLabel: `${state.admin2Config.childrenLabel} shown`
    };
  }

  if (isAdmin1Scope()) {
    const region = locked?.kind === 'admin1' ? locked : null;
    if (region) {
      return {
        scope: 'region',
        entity: region.name,
        title: `${region.name} in ${state.detailCountry.name}’s local AI map.`,
        summary: Number.isFinite(region.signals)
          ? `${number(region.signals)} independently published regional ${signalLabel(region.signals)} · ${dateRange}.`
          : `Administrative boundary shown without a published regional total · ${dateRange}.`,
        primary: metric(region.signals),
        primaryLabel: 'Published regional signals',
        secondary: Number.isInteger(region.rank) ? `#${region.rank}` : '—',
        secondaryLabel: `${state.detailConfig.regionLabel} rank`
      };
    }
    return {
      scope: 'country',
      entity: state.detailCountry.name,
      title: `Local AI ${isInstallIntentView() ? 'install intent' : 'interest'} across ${state.detailCountry.name}.`,
      summary: `${metric(state.detailTotals.regions)} ${state.detailConfig.regionsLabel} publish an independent total · ${dateRange}.`,
      primary: metric(state.detailTotals.signals),
      primaryLabel: 'Published regional signals',
      secondary: metric(state.detailTotals.regions),
      secondaryLabel: `${state.detailConfig.regionsLabel} published`
    };
  }

  if (worldCountry) {
    return {
      scope: 'country',
      entity: worldCountry.name,
      title: `${worldCountry.name} in the global local AI index.`,
      summary: `${number(worldCountry.signals)} published ${signalLabel(worldCountry.signals)} · ${dateRange}.`,
      primary: number(worldCountry.signals),
      primaryLabel: isInstallIntentView() ? 'Install-intent visitors' : 'Published signals',
      secondary: Number.isInteger(worldCountry.rank) ? `#${worldCountry.rank}` : '—',
      secondaryLabel: 'World rank'
    };
  }

  return {
    scope: 'world',
    entity: 'World',
    title: isInstallIntentView() ? 'See where local AI install intent is strongest.' : 'See where local AI is taking off.',
    summary: `${number(state.data.totals.publishedRegions)} countries publish at least five anonymous ${signalLabel()} · ${dateRange}.`,
    primary: number(state.data.totals.publishedSignals ?? state.data.totals.signals),
    primaryLabel: isInstallIntentView() ? 'Install-intent visitors' : 'Published signals',
    secondary: number(state.data.totals.publishedRegions ?? state.data.totals.regions),
    secondaryLabel: 'Countries published'
  };
}

function currentShareUrl() {
  const url = new URL('/local-ai-activity-index', window.location.origin);
  if (ACTIVE_VIEW === 'installed') url.searchParams.set('view', 'installed');
  if (ACTIVE_VIEW === 'models') url.searchParams.set('view', 'models');
  if (ACTIVE_PERIOD !== '30d') url.searchParams.set('range', ACTIVE_PERIOD);
  const locked = state.locked;
  if (isModelInterestView()) {
    if (state.selectedModelCountry) url.searchParams.set('country', state.selectedModelCountry.name);
    if (state.selectedModelRegion) url.searchParams.set('region', state.selectedModelRegion.sourceName || state.selectedModelRegion.name);
    else if (state.selectedModelCountry && isAdmin1Scope()) url.searchParams.set('regions', '1');
    if (state.selectedModelBrand) url.searchParams.set('brand', state.selectedModelBrand);
  } else if (isInstallIntentView() && (state.selectedInstallCountry || state.selectedInstallModel)) {
    if (state.selectedInstallCountry) url.searchParams.set('country', state.selectedInstallCountry.name);
    if (state.selectedInstallCountry && isAdmin2Scope() && state.admin2Config) {
      url.searchParams.set('region', state.admin2Config.parentName);
      if (locked?.kind === 'admin2') url.searchParams.set('area', locked.name);
    } else if (state.selectedInstallCountry && isAdmin1Scope()) {
      if (locked?.kind === 'admin1') url.searchParams.set('region', locked.sourceName || locked.name);
      else url.searchParams.set('regions', '1');
    }
    if (state.selectedInstallModel) url.searchParams.set('model', state.selectedInstallModel);
  } else if (state.scope === 'us') {
    url.searchParams.set('country', 'United States');
    if (locked?.code) url.searchParams.set('region', locked.name);
  } else if (isAdmin2Scope()) {
    url.searchParams.set('country', state.admin2Config.countryName);
    url.searchParams.set('region', state.admin2Config.parentName);
    if (locked?.kind === 'admin2') url.searchParams.set('area', locked.name);
  } else if (isAdmin1Scope()) {
    url.searchParams.set('country', state.detailCountry.name);
    if (locked?.kind === 'admin1') url.searchParams.set('region', locked.name);
  } else if (locked?.kind === 'cityCluster') {
    const country = countryForCode(locked.countryCode);
    if (country) url.searchParams.set('country', country.name);
  } else if (locked?.adm0A3) {
    url.searchParams.set('country', locked.name);
  }
  return url.toString();
}

function updateSharePresentation() {
  const snapshot = shareSnapshot();
  const coverageCopy = installCoverageCopy();
  if (coverageCopy && !snapshot.summary.includes(coverageCopy)) snapshot.summary = `${snapshot.summary} ${coverageCopy}`;
  if (shareEyebrow) {
    const coverage = isInstallIntentView() && state.data?.period?.partial
      ? ` · ${number(state.data.period.effectiveCoverageDays)} DAYS OBSERVED`
      : '';
    shareEyebrow.textContent = `LOCAL AI ${isModelInterestView() ? 'MODEL INTEREST' : isInstallIntentView() ? 'INSTALL INTENT' : 'INTEREST'} · ${sharePeriodLabel()}${coverage}`;
  }
  if (shareTitle) shareTitle.textContent = snapshot.title;
  if (shareSummary) shareSummary.textContent = snapshot.summary;
  if (sharePrimary) sharePrimary.textContent = snapshot.primary;
  if (sharePrimaryLabel) sharePrimaryLabel.textContent = snapshot.primaryLabel;
  if (shareSecondary) shareSecondary.textContent = snapshot.secondary;
  if (shareSecondaryLabel) shareSecondaryLabel.textContent = snapshot.secondaryLabel;
  const boundary = document.querySelector('[data-atlas-share-boundary]');
  if (boundary) {
    const mark = document.createElement('b');
    const selectedRegionalBrand = state.selectedModelRegion && state.selectedModelBrand
      ? modelBrandsForCountry(state.selectedModelRegion)
        .find(brand => brandIdentifier(brand) === state.selectedModelBrand)
      : null;
    const modelLogoMeaning = isAdmin1Scope()
      ? selectedRegionalBrand
        ? `${selectedRegionalBrand.label} logos in regions where it independently reaches ${PUBLISH_THRESHOLD}+`
        : 'leading published regional brand logos'
      : state.selectedModelBrand && !state.selectedModelCountry
      ? `${globalModelBrands().find(brand => brandIdentifier(brand) === state.selectedModelBrand)?.label || 'Selected brand'} logos where a country reaches ${PUBLISH_THRESHOLD}+`
      : state.selectedModelBrand
        ? 'selected country brand logo'
        : 'leading local brand logos';
    boundary.replaceChildren(mark, document.createTextNode(isModelInterestView()
      ? ` Color = all-model ${isAdmin1Scope() ? 'regional' : 'country'} visitors; ${modelLogoMeaning}. Page interest, not downloads, installations or verified use.`
      : isInstallIntentView()
        ? ' Click intent, not verified installations or model runs.'
        : ' Interest signals, not installations or model runs.'));
  }
  return snapshot;
}

function setShareMode(active) {
  if (!shareOverlay || state.shareMode === active) return;
  state.shareMode = active;
  if (active) {
    stopTour();
    finishReveal();
    updateSharePresentation();
    shareOverlay.hidden = false;
    stage.classList.add('atlas-is-sharing');
    document.body.classList.add('atlas-share-active');
    resize();
    atlasTrack('atlas_share_mode_open', { entity: shareSnapshot().entity });
    window.requestAnimationFrame(() => shareDownloadButton?.focus({ preventScroll: true }));
  } else {
    shareOverlay.hidden = true;
    stage.classList.remove('atlas-is-sharing');
    document.body.classList.remove('atlas-share-active');
    resize();
    document.querySelector('[data-atlas-share-open]')?.focus({ preventScroll: true });
  }
}

async function copyShareLink() {
  const url = currentShareUrl();
  try {
    await navigator.clipboard.writeText(url);
  } catch (_) {
    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
  atlasTrack('atlas_share_link_copy', { entity: shareSnapshot().entity });
  if (shareCopyButton) {
    const original = shareCopyButton.textContent;
    shareCopyButton.textContent = 'Link copied';
    window.setTimeout(() => { shareCopyButton.textContent = original; }, 1800);
  }
}

function roundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawImageCover(context, source, width, height) {
  const sourceWidth = source.width || width;
  const sourceHeight = source.height || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapCanvasText(context, text, maxWidth, maxLines = Infinity) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.length && context.measureText(lines.at(-1)).width > maxWidth) {
    let last = lines.at(-1);
    while (last.length > 1 && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function loadShareLogo() {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = '/images/crab-logo.png';
  });
}

async function buildShareImage() {
  const snapshot = updateSharePresentation();
  await document.fonts?.ready;
  if (state.renderer && state.scene && state.camera) state.renderer.render(state.scene, state.camera);

  const width = 1600;
  const height = 900;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const context = exportCanvas.getContext('2d');
  context.fillStyle = '#020407';
  context.fillRect(0, 0, width, height);
  try {
    drawImageCover(context, canvas, width, height);
  } catch (_) {}

  const leftShade = context.createLinearGradient(0, 0, 980, 0);
  leftShade.addColorStop(0, 'rgba(2,4,7,0.98)');
  leftShade.addColorStop(0.42, 'rgba(2,4,7,0.82)');
  leftShade.addColorStop(0.78, 'rgba(2,4,7,0.14)');
  leftShade.addColorStop(1, 'rgba(2,4,7,0)');
  context.fillStyle = leftShade;
  context.fillRect(0, 0, width, height);

  const bottomShade = context.createLinearGradient(0, height, 0, 520);
  bottomShade.addColorStop(0, 'rgba(2,4,7,0.88)');
  bottomShade.addColorStop(1, 'rgba(2,4,7,0)');
  context.fillStyle = bottomShade;
  context.fillRect(0, 500, width, 400);

  const vignette = context.createRadialGradient(940, 420, 120, 940, 420, 970);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  const accent = context.createLinearGradient(0, 76, 0, 825);
  accent.addColorStop(0, 'rgba(255,69,58,0)');
  accent.addColorStop(0.18, '#ff453a');
  accent.addColorStop(0.82, '#ff6a2a');
  accent.addColorStop(1, 'rgba(255,106,42,0)');
  context.fillStyle = accent;
  context.shadowColor = 'rgba(255,69,58,0.7)';
  context.shadowBlur = 20;
  context.fillRect(72, 62, 3, 776);
  context.shadowBlur = 0;

  const logo = await loadShareLogo();
  roundedRectPath(context, 94, 70, 52, 52, 14);
  const logoGradient = context.createLinearGradient(94, 70, 146, 122);
  logoGradient.addColorStop(0, '#ff6a22');
  logoGradient.addColorStop(1, '#f43b31');
  context.fillStyle = logoGradient;
  context.fill();
  if (logo) context.drawImage(logo, 101, 77, 38, 38);

  context.textBaseline = 'alphabetic';
  context.fillStyle = '#ffffff';
  context.font = '700 29px "Space Grotesk", Inter, sans-serif';
  context.fillText('LOCAL', 162, 106);
  const localWidth = context.measureText('LOCAL').width;
  context.fillStyle = '#ff5147';
  context.fillText('CLAW', 162 + localWidth, 106);
  const brandWidth = context.measureText('CLAW').width;
  context.fillStyle = 'rgba(255,255,255,0.25)';
  context.fillRect(180 + localWidth + brandWidth, 84, 1, 25);
  context.fillStyle = 'rgba(255,255,255,0.48)';
  context.font = '700 12px "JetBrains Mono", monospace';
  context.letterSpacing = '2px';
  context.fillText('ATLAS', 197 + localWidth + brandWidth, 104);

  context.fillStyle = '#ff5b50';
  context.font = '700 14px "JetBrains Mono", monospace';
  context.fillText(`LOCAL AI ${isModelInterestView() ? 'MODEL INTEREST' : isInstallIntentView() ? 'INSTALL INTENT' : 'INTEREST'}  ·  ${sharePeriodLabel()}`, 96, 216);

  const titleSize = snapshot.title.length > 58 ? 61 : snapshot.title.length > 40 ? 68 : 76;
  context.fillStyle = '#ffffff';
  context.font = `650 ${titleSize}px "Space Grotesk", Inter, sans-serif`;
  const titleLines = wrapCanvasText(context, snapshot.title, 680, 4);
  let titleY = 300;
  for (const line of titleLines) {
    context.fillText(line, 94, titleY);
    titleY += titleSize * 0.98;
  }

  context.fillStyle = 'rgba(230,239,245,0.7)';
  context.font = '500 20px Inter, system-ui, sans-serif';
  const summaryLines = wrapCanvasText(context, snapshot.summary, 620, 3);
  let summaryY = titleY + 18;
  for (const line of summaryLines) {
    context.fillText(line, 96, summaryY);
    summaryY += 31;
  }

  const metricY = Math.min(674, Math.max(570, summaryY + 26));
  const metrics = [
    { value: snapshot.primary, label: snapshot.primaryLabel, x: 94, width: 260 },
    { value: snapshot.secondary, label: snapshot.secondaryLabel, x: 370, width: 260 }
  ];
  for (const item of metrics) {
    roundedRectPath(context, item.x, metricY, item.width, 110, 15);
    context.fillStyle = 'rgba(3,8,14,0.8)';
    context.fill();
    context.strokeStyle = 'rgba(152,182,204,0.2)';
    context.lineWidth = 1;
    context.stroke();
    context.fillStyle = 'rgba(255,92,66,0.75)';
    context.fillRect(item.x + 1, metricY, item.width - 2, 2);
    context.fillStyle = '#ffffff';
    context.font = '650 42px "Space Grotesk", Inter, sans-serif';
    context.fillText(String(item.value), item.x + 20, metricY + 53);
    context.fillStyle = 'rgba(210,225,236,0.54)';
    context.font = '700 11px "JetBrains Mono", monospace';
    context.fillText(String(item.label).toUpperCase().slice(0, 34), item.x + 20, metricY + 82);
  }

  if (isModelInterestView()) {
    const logoMeaning = isAdmin1Scope()
      ? state.selectedModelBrand
        ? 'LOGOS = SELECTED BRAND IN REGIONS AT 5+'
        : 'LOGOS = LEADING PUBLISHED REGIONAL BRAND'
      : state.selectedModelBrand && !state.selectedModelCountry
      ? 'LOGOS = SELECTED BRAND IN COUNTRIES AT 5+'
      : state.selectedModelBrand
        ? 'LOGO = SELECTED COUNTRY BRAND'
        : 'LOGOS = MOST EXPLORED LOCAL BRAND';
    context.fillStyle = 'rgba(218,231,239,0.52)';
    context.font = '700 10px "JetBrains Mono", monospace';
    context.fillText(`${logoMeaning}  ·  COLOR = ALL-MODEL ${isAdmin1Scope() ? 'REGIONAL' : 'COUNTRY'} VISITORS`, 96, 804);
  }

  context.fillStyle = '#ff453a';
  context.shadowColor = 'rgba(255,69,58,0.8)';
  context.shadowBlur = 12;
  context.beginPath();
  context.arc(98, 824, 4, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = 'rgba(218,231,239,0.52)';
  context.font = '700 11px "JetBrains Mono", monospace';
  context.fillText(isModelInterestView()
    ? 'MODEL-PAGE INTEREST, NOT VERIFIED MODEL USE.'
    : isInstallIntentView()
      ? 'CLICK INTENT, NOT VERIFIED INSTALLATIONS OR MODEL RUNS.'
      : 'INTEREST SIGNALS, NOT INSTALLATIONS OR MODEL RUNS.', 114, 828);
  context.textAlign = 'right';
  context.fillStyle = 'rgba(255,255,255,0.82)';
  context.font = '700 14px "JetBrains Mono", monospace';
  context.fillText('LOCALCLAW.IO/ATLAS', 1510, 828);
  context.textAlign = 'left';

  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(blob => blob ? resolve({ blob, snapshot }) : reject(new Error('Share image could not be created.')), 'image/png');
  });
}

function shareFilename(snapshot) {
  const slug = String(snapshot.entity || 'world')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'world';
  return `localclaw-atlas-${slug}-${ACTIVE_PERIOD}.png`;
}

async function downloadShareImage() {
  if (!shareDownloadButton || shareDownloadButton.disabled) return;
  const original = shareDownloadButton.textContent;
  shareDownloadButton.disabled = true;
  shareDownloadButton.textContent = 'Rendering…';
  try {
    const { blob, snapshot } = await buildShareImage();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = shareFilename(snapshot);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    atlasTrack('atlas_share_image_download', { entity: snapshot.entity });
    shareDownloadButton.textContent = 'PNG downloaded';
  } catch (error) {
    console.error(error);
    shareDownloadButton.textContent = 'Try again';
  } finally {
    shareDownloadButton.disabled = false;
    window.setTimeout(() => { shareDownloadButton.textContent = original; }, 1800);
  }
}

async function nativeShareView() {
  if (typeof navigator.share !== 'function') return;
  const snapshot = shareSnapshot();
  try {
    await navigator.share({
      title: `${snapshot.entity} · LocalClaw Atlas`,
      text: snapshot.title,
      url: currentShareUrl()
    });
    atlasTrack('atlas_share_native', { entity: snapshot.entity });
  } catch (error) {
    if (error?.name !== 'AbortError') console.error(error);
  }
}

function updatePeriodControls() {
  document.querySelectorAll('[data-atlas-period]').forEach(button => {
    const key = button.getAttribute('data-atlas-period');
    button.setAttribute('aria-pressed', String(key === ACTIVE_PERIOD));
    if (key === ACTIVE_PERIOD) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-atlas-view]').forEach(button => {
    const view = button.getAttribute('data-atlas-view');
    button.setAttribute('aria-pressed', String(view === ACTIVE_VIEW));
    if (view === ACTIVE_VIEW) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
}

function isMobileViewport(width = window.innerWidth) {
  return width <= MOBILE_BREAKPOINT;
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
  const anisotropyLimit = isMobileViewport() ? 4 : 16;
  texture.anisotropy = Math.min(anisotropyLimit, state.renderer?.capabilities.getMaxAnisotropy?.() || 4);
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
  if (isModelInterestView()) {
    const records = state.modelAdmin1Activity?.countries || {};
    const direct = records[country?.name];
    if (direct) return direct;
    const adm0A3 = String(country?.adm0A3 || admin0A3ForFeature(country?.feature || featureForCountry(country?.name))).toUpperCase();
    const countryCode = String(country?.countryCode || alpha2ForFeature(country?.feature || featureForCountry(country?.name))).toUpperCase();
    return Object.values(records).find(record => String(record?.adm0A3 || '').toUpperCase() === adm0A3
      || String(record?.countryCode || '').toUpperCase() === countryCode) || null;
  }
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
    const published = publishedByFeature.get(feature) || null;
    if (!manifest && !(isModelInterestView() && published)) continue;
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
  return state.usAllRegions.find(region => String(region.code || '').toUpperCase() === expected) || null;
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

function admin1ZoomForBbox(bbox, mobile = isMobileViewport(), longitudeSpanDegrees = null) {
  if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite)) {
    return mobile ? 9 : 7;
  }
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const middleLatitude = THREE.MathUtils.degToRad((minLat + maxLat) / 2);
  const fittedLongitudeSpan = Number.isFinite(longitudeSpanDegrees)
    ? longitudeSpanDegrees
    : maxLon - minLon;
  const longitudeSpan = THREE.MathUtils.degToRad(
    Math.min(180, Math.max(0.05, fittedLongitudeSpan)) * Math.max(0.2, Math.cos(middleLatitude))
  );
  const latitudeSpan = THREE.MathUtils.degToRad(Math.min(170, Math.max(0.05, maxLat - minLat)));
  const width = Math.max(1, stage.clientWidth || window.innerWidth);
  const height = Math.max(1, stage.clientHeight || window.innerHeight);
  const aspect = width / height;
  const verticalFov = THREE.MathUtils.degToRad(mobile ? 42 : 34);
  const verticalTangent = Math.tan(verticalFov / 2);
  const horizontalTangent = verticalTangent * aspect;
  const targetFill = mobile ? 0.85 : 0.68;
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
  return THREE.MathUtils.clamp(fittedDistance, mobile ? 4.7 : GLOBE_RADIUS + 0.28, mobile ? 11.2 : 10.8);
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
  if (status === 'published' || status === 'partially_published') return 'published';
  if (isModelInterestView()) {
    const regions = Array.isArray(activity?.regions) ? activity.regions : [];
    const publishedRegions = Number(activity?.publishedRegions);
    if ((Number.isFinite(publishedRegions) && publishedRegions > 0)
      || regions.some(region => Number(region?.modelVisitors ?? region?.signals) >= PUBLISH_THRESHOLD)) {
      return 'published';
    }
    if (activity && (Number.isFinite(publishedRegions) || regions.length)) return 'none_above_threshold';
  }
  return 'not_collected';
}

function admin1StatusMessage(status = state.detailDataStatus) {
  const threshold = state.detailTotals.publishThreshold || PUBLISH_THRESHOLD;
  const unit = isModelInterestView() || isInstallIntentView() ? 'visitor' : 'signal';
  if (status === 'unavailable') {
    return 'The provider regional breakdown was unavailable for this snapshot. Administrative boundaries are shown without regional totals.';
  }
  if (status === 'none_above_threshold') {
    return `A regional breakdown was collected, but no row reaches the ${threshold}-${unit} publication threshold.`;
  }
  if (status === 'boundary_unresolved') {
    return 'A regional breakdown was collected, but it could not be mapped safely to these boundaries. No regional total is shown.';
  }
  if (status === 'not_collected') {
    return 'No country-filtered regional snapshot was collected. Administrative boundaries are shown without regional totals.';
  }
  return `Published regional totals independently meet the ${threshold}-${unit} privacy threshold.`;
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

function admin2ParentCode(parent, parentScope = state.scope) {
  if (!parent) return '';
  if (parentScope === 'us') {
    const code = String(parent.code || '').trim().toUpperCase();
    return code ? `US-${code}` : '';
  }
  return (parent.codes || [])
    .map(code => String(code || '').trim().toUpperCase())
    .find(code => /^(?:US|CN|AU)-[A-Z0-9]{2,3}$/.test(code)) || '';
}

function admin2ConfigForParent(parent, parentScope = state.scope) {
  const adm0A3 = parentScope === 'us' ? 'USA' : state.detailConfig?.adm0A3;
  const parentCode = admin2ParentCode(parent, parentScope);
  const countryEntry = state.admin2Manifest?.countries?.[adm0A3];
  const manifest = countryEntry?.parents?.[parentCode];
  if (!parentCode || !manifest) return null;
  const childLabel = manifest.childLabel || countryEntry.childLabel || 'administrative subdivision';
  const childrenLabel = manifest.childrenLabel || countryEntry.childrenLabel || 'administrative subdivisions';
  const parentType = parentScope === 'us' ? 'state' : (parent.type || state.detailConfig?.regionLabel || 'parent region');
  return {
    ...manifest,
    adm0A3,
    countryName: countryEntry.name || state.detailCountry?.name || 'Country',
    parentCode,
    parentName: manifest.parentName || parent.name,
    parentType,
    parentScope,
    childLabel,
    childrenLabel,
    viewLabel: manifest.viewLabel || 'Detailed boundary view',
    liveLabel: manifest.liveLabel || 'Detailed boundary exploration',
    parentViewLabel: manifest.parentViewLabel || (parentScope === 'us' ? 'state view' : state.detailConfig?.viewLabel?.toLowerCase() || 'regional view'),
    parentSignals: Number.isFinite(parent.signals) ? parent.signals : null,
    parentSignalLabel: manifest.parentSignalLabel || (parentScope === 'us' ? 'state-level signals' : `${parentType}-level signals`),
    source: countryEntry.source || manifest.source || null
  };
}

function setAdmin2Busy(busy, config = null) {
  state.admin2Loading = Boolean(busy);
  if (busy) {
    stage.setAttribute('aria-busy', 'true');
    stage.dataset.admin2Loading = config?.parentCode || '';
    regionPanel?.setAttribute('aria-busy', 'true');
  } else {
    if (!state.admin1Loading) stage.removeAttribute('aria-busy');
    delete stage.dataset.admin2Loading;
    regionPanel?.removeAttribute('aria-busy');
  }
}

async function loadAdmin2Shard(config) {
  const key = `${config?.adm0A3 || ''}:${config?.parentCode || ''}`;
  if (!config?.path || !config?.parentCode) throw new Error('Detailed boundary manifest entry is incomplete.');
  if (state.admin2Cache.has(key)) {
    const cached = state.admin2Cache.get(key);
    state.admin2Cache.delete(key);
    state.admin2Cache.set(key, cached);
    return cached;
  }
  if (state.admin2Requests.has(key)) return state.admin2Requests.get(key);
  const request = (async () => {
    const separator = config.path.includes('?') ? '&' : '?';
    const response = await fetch(`${config.path}${separator}v=${String(config.sha256 || state.admin2Manifest?.generatedAt || '').slice(0, 16)}`);
    if (!response.ok) throw new Error(`Detailed boundaries could not be loaded (${response.status}).`);
    const shard = await response.json();
    if (shard?.type !== 'FeatureCollection'
      || !Array.isArray(shard.features)
      || String(shard.parentCode || '').toUpperCase() !== config.parentCode) {
      throw new Error('Detailed boundary shard is invalid.');
    }
    state.admin2Cache.set(key, shard);
    while (state.admin2Cache.size > ADMIN2_CACHE_LIMIT) {
      state.admin2Cache.delete(state.admin2Cache.keys().next().value);
    }
    return shard;
  })();
  state.admin2Requests.set(key, request);
  try {
    return await request;
  } finally {
    if (state.admin2Requests.get(key) === request) state.admin2Requests.delete(key);
  }
}

function isAdmin2Scope() {
  return state.scope === 'admin2' && Boolean(state.admin2Parent && state.admin2Config);
}

function buildAdmin2Regions(shard, parent, config) {
  const features = Array.isArray(shard?.features) ? shard.features : [];
  const regions = features.map((feature, index) => {
    const properties = feature.properties || {};
    const name = String(properties.name || properties.NAME || properties.label || `Subdivision ${index + 1}`).trim();
    return {
      kind: 'admin2',
      name,
      label: String(properties.label || name).trim(),
      type: String(properties.type || config.childLabel).trim(),
      code: String(properties.code || properties.GEOID || properties.id || '').trim(),
      country: config.countryName,
      countryCode: config.adm0A3 === 'USA' ? 'US' : 'CN',
      parentName: config.parentName,
      parentCode: config.parentCode,
      feature,
      bounds: featureBounds(feature),
      longitudeSpan: featureLongitudeSpan(feature),
      center: featureCenter(feature),
      signals: null,
      rank: null,
      published: false,
      clusters: []
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const assignments = new Map();
  const clusters = state.cityClusters.filter(cluster => {
    if (config.adm0A3 === 'USA') return cluster.countryCode === 'US' && cluster.regionCode === parent.code;
    return cluster.countryCode === 'CN';
  });
  for (const cluster of clusters) {
    const region = regions.find(candidate => pointInBounds(cluster.lat, cluster.lon, candidate.bounds)
      && pointInFeature(cluster.lat, cluster.lon, candidate.feature));
    if (!region) continue;
    region.clusters.push(cluster);
    assignments.set(cluster, region);
  }
  state.admin2Boundaries = shard;
  state.admin2Features = features;
  state.admin2Regions = regions;
  state.admin2AssignmentByCluster = assignments;
  return regions.length > 0;
}

function admin2RegionAt(lat, lon) {
  return state.admin2Regions.find(candidate => pointInBounds(lat, lon, candidate.bounds)
    && pointInFeature(lat, lon, candidate.feature)) || null;
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
  const activityDataset = isModelInterestView() ? state.modelAdmin1Activity : state.admin1Activity;
  const publishThreshold = Number(activityDataset?.publishThreshold) || PUBLISH_THRESHOLD;
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
    const signals = Number(sourceRegion.modelVisitors ?? sourceRegion.signals);
    if (!Number.isFinite(signals) || signals < publishThreshold) continue;
    const name = String(sourceRegion.canonicalName || sourceRegion.sourceName || 'Published region').trim();
    const feature = combinedAdmin1Feature(mappedFeatures, name);
    const entity = {
      kind: 'admin1',
      regionId: String(sourceRegion.regionId || ''),
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
      modelVisitors: isModelInterestView() ? signals : null,
      modelInterest: isModelInterestView() && sourceRegion.modelInterest && typeof sourceRegion.modelInterest === 'object'
        ? sourceRegion.modelInterest
        : null,
      clusters: [],
      rank: Number(sourceRegion.rank) || null,
      published: true,
      boundaryMatch: String(sourceRegion.boundaryMatch || ''),
      boundaryFeatureIds: boundaryIds,
      qualityFlag: Boolean(sourceRegion.qualityFlag),
      qualityFlags: Array.isArray(sourceRegion.qualityFlags) ? sourceRegion.qualityFlags : [],
      qualityNote: String(sourceRegion.qualityNote || ''),
      codes: [...new Set(mappedFeatures.flatMap(admin1FeatureCodes))]
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
    signals: published && Number.isFinite(Number(activity?.publishedSignals ?? activity?.countryModelVisitors))
      ? Number(activity.publishedSignals ?? activity.countryModelVisitors)
      : null,
    regions: published && Number.isFinite(Number(activity?.publishedRegions)) ? Number(activity.publishedRegions) : null,
    observedSignals: null,
    observedRegions: null,
    countrySignals: Number.isFinite(Number(activity?.countrySignals ?? activity?.countryModelVisitors))
      ? Number(activity.countrySignals ?? activity.countryModelVisitors)
      : null,
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
    if (isAdmin2Scope()) {
      return state.admin2AssignmentByCluster.get(entity)?.feature
        || state.admin2Parent?.feature
        || featureForCountry(state.admin2Config.countryName);
    }
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
  if (entity.kind === 'admin2') return entity.feature;
  if (entity.kind === 'admin1') return entity.feature;
  if (state.scope === 'us') return featureForState(entity.name);
  return entity.feature || featureForCountry(entity.name);
}

function geometryRings(geometry) {
  return polygonsForGeometry(geometry).flatMap(polygon => polygon || []);
}

function featureLongitudeSpan(feature) {
  const longitudes = geometryRings(feature?.geometry)
    .flatMap(ring => ring || [])
    .map(point => Number(point?.[0]))
    .filter(Number.isFinite)
    .map(longitude => ((longitude % 360) + 360) % 360)
    .sort((left, right) => left - right);
  if (longitudes.length < 2) return null;
  let largestGap = 0;
  for (let index = 1; index < longitudes.length; index += 1) {
    largestGap = Math.max(largestGap, longitudes[index] - longitudes[index - 1]);
  }
  largestGap = Math.max(largestGap, longitudes[0] + 360 - longitudes[longitudes.length - 1]);
  return 360 - largestGap;
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
  if (isAdmin1Scope() || isAdmin2Scope()) {
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

  const hitRadius = 0.038 + Math.sqrt(intensity) * 0.018;
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(hitRadius, 12, 8),
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
    hitRadius
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
  const maximumVisible = window.innerWidth < 760 ? 56 : periodDays() > 30 ? 144 : state.cityClusters.length;
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

function modelBrandsForCountry(country) {
  const brands = country?.modelInterest?.brands || country?.brands || [];
  return Array.isArray(brands) ? brands : [];
}

function modelBrandSignals(brand) {
  return Number(brand?.visitors ?? brand?.signals ?? brand?.score) || 0;
}

function modelCountryVisitors(country) {
  return Number(country?.modelVisitors ?? country?.visitors ?? country?.signals) || 0;
}

function publishedModelCountryVisitors(country) {
  const rawValue = country?.modelVisitors ?? country?.visitors ?? country?.signals;
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const visitors = Number(rawValue);
  return Number.isFinite(visitors) && visitors >= PUBLISH_THRESHOLD ? visitors : null;
}

function publishedRegionalModelVisitors(region) {
  const rawValue = region?.modelVisitors ?? region?.signals;
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const visitors = Number(rawValue);
  return Number.isFinite(visitors) && visitors >= PUBLISH_THRESHOLD ? visitors : null;
}

function coLeadingModelBrands(country) {
  const brands = modelBrandsForCountry(country);
  const dominant = country?.modelInterest?.dominantBrands || country?.dominantBrands || [];
  if (Array.isArray(dominant) && dominant.length) {
    const declared = dominant
      .map(id => brands.find(brand => String(id) === String(brand.id || brand.brandId || brand.family)))
      .filter(Boolean);
    if (declared.length) return declared;
  }
  const maximum = modelBrandSignals(brands[0]);
  return brands.filter(brand => modelBrandSignals(brand) === maximum);
}

function dominantModelBrand(country) {
  return coLeadingModelBrands(country)[0] || null;
}

function leadingInstallPath(country) {
  return installModelsForCountry(country)[0] || installRuntimesForCountry(country)[0] || null;
}

function mapLogoIdentity(country) {
  return isInstallIntentView() ? leadingInstallPath(country) : dominantModelBrand(country);
}

function mapLogoCoLeaderCount(country) {
  return isModelInterestView() ? Math.max(1, coLeadingModelBrands(country).length) : 1;
}

function paintModelBadge(canvas, brand, image = null, coLeaderCount = 1) {
  const context = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  context.clearRect(0, 0, size, size);
  const aura = context.createRadialGradient(center, center, size * 0.15, center, center, size * 0.48);
  aura.addColorStop(0, 'rgba(255, 103, 67, 0.38)');
  aura.addColorStop(0.55, 'rgba(255, 65, 58, 0.18)');
  aura.addColorStop(1, 'rgba(255, 48, 38, 0)');
  context.fillStyle = aura;
  context.fillRect(0, 0, size, size);
  context.shadowColor = 'rgba(255, 73, 52, 0.72)';
  context.shadowBlur = size * 0.055;
  context.beginPath();
  context.arc(center, center, size * 0.345, 0, Math.PI * 2);
  context.fillStyle = '#050a10';
  context.fill();
  context.shadowBlur = 0;
  context.lineWidth = size * 0.018;
  context.strokeStyle = '#ff493b';
  context.stroke();
  context.beginPath();
  context.arc(center, center, size * 0.273, 0, Math.PI * 2);
  context.fillStyle = 'rgba(255,255,255,0.97)';
  context.fill();
  if (image && image.naturalWidth && image.naturalHeight) {
    const maximum = size * 0.36;
    const ratio = Math.min(maximum / image.naturalWidth, maximum / image.naturalHeight);
    const width = image.naturalWidth * ratio;
    const height = image.naturalHeight * ratio;
    context.drawImage(image, center - width / 2, center - height / 2, width, height);
  } else {
    const initials = String(brand?.label || brand?.id || '?')
      .split(/\s+/)
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    context.fillStyle = '#111821';
    context.font = '800 ' + Math.round(size * 0.16) + 'px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(initials, center, center + size * 0.01);
  }
  if (coLeaderCount > 1) {
    const badgeX = size * 0.73;
    const badgeY = size * 0.27;
    context.beginPath();
    context.arc(badgeX, badgeY, size * 0.095, 0, Math.PI * 2);
    context.fillStyle = '#ff493b';
    context.fill();
    context.lineWidth = size * 0.012;
    context.strokeStyle = '#050a10';
    context.stroke();
    context.fillStyle = '#fff';
    context.font = '800 ' + Math.round(size * 0.075) + 'px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('+' + (coLeaderCount - 1), badgeX, badgeY + size * 0.004);
  }
}

function textureForModelBrand(brand, coLeaderCount = 1) {
  const key = String(brand?.logo || brand?.id || '') + '|' + coLeaderCount;
  if (state.modelTextureCache.has(key)) return state.modelTextureCache.get(key);
  const badge = document.createElement('canvas');
  const textureSize = isMobileViewport() ? 256 : 512;
  badge.width = textureSize;
  badge.height = textureSize;
  paintModelBadge(badge, brand, null, coLeaderCount);
  const texture = new THREE.CanvasTexture(badge);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(8, state.renderer?.capabilities.getMaxAnisotropy?.() || 4);
  state.modelTextureCache.set(key, texture);
  if (brand?.logo) {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => {
      paintModelBadge(badge, brand, image, coLeaderCount);
      texture.needsUpdate = true;
    }, { once: true });
    image.addEventListener('error', () => {
      texture.needsUpdate = true;
    }, { once: true });
    image.src = brand.logo;
  }
  return texture;
}

function createModelBrandMarkers() {
  state.modelMarkerGroup = new THREE.Group();
  state.modelMarkerGroup.userData.activityScope = 'models';
  state.globeGroup.add(state.modelMarkerGroup);
  if (!isModelInterestView() && !isInstallIntentView()) {
    state.modelMarkerGroup.visible = false;
    return;
  }
  for (const country of state.countries) {
    const brand = mapLogoIdentity(country);
    const coLeaderCount = mapLogoCoLeaderCount(country);
    const center = centerForCountry(country);
    if (!brand || !center || modelBrandSignals(brand) < PUBLISH_THRESHOLD) continue;
    const position = latLonToVector(center[0], center[1], GLOBE_RADIUS + 0.13);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: textureForModelBrand(brand, coLeaderCount),
      transparent: true,
      opacity: 0.96,
      depthTest: true,
      depthWrite: false,
      toneMapped: false
    }));
    sprite.position.copy(position);
    sprite.center.set(0.5, 0.5);
    sprite.renderOrder = 7;
    const marker = {
      kind: isInstallIntentView() ? 'installStack' : 'modelBrand',
      country,
      brand,
      coLeaderCount,
      isLeader: true,
      brandRank: 1,
      name: country.name,
      position: position.clone(),
      sprite,
      hit: null,
      element: null,
      projectedVisible: false
    };
    sprite.userData = { modelBrandMarker: marker };
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 10),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.copy(position);
    hit.userData = { modelBrandMarker: marker };
    marker.hit = hit;
    if (modelLogoLayer) {
      const element = document.createElement('span');
      element.className = 'atlas-model-logo is-hidden';
      element.setAttribute('aria-hidden', 'true');
      const mark = document.createElement('span');
      mark.className = 'atlas-model-logo__mark';
      const image = document.createElement('img');
      image.src = brand.logo;
      image.alt = '';
      image.width = 27;
      image.height = 27;
      mark.append(image);
      element.append(mark);
      modelLogoLayer.append(element);
      marker.element = element;
    }
    state.modelMarkerGroup.add(sprite, hit);
    state.modelMarkerEntries.push(marker);
    state.modelMarkerHitMeshes.push(hit);
  }
  stage.dataset.modelMarkers = String(state.modelMarkerEntries.length);
}

function syncModelMarkerBrands(selectedCountry = null, selectedBrand = null) {
  const globalBrandFilter = !selectedCountry && selectedBrand
    ? brandIdentifier(selectedBrand)
    : '';
  for (const entry of state.modelMarkerEntries) {
    const brands = modelBrandsForCountry(entry.country);
    const target = globalBrandFilter
      ? brands.find(brand => brandIdentifier(brand) === globalBrandFilter) || null
      : entry.country === selectedCountry && selectedBrand
        ? selectedBrand
        : dominantModelBrand(entry.country);
    entry.filteredOut = Boolean(globalBrandFilter && !target);
    if (!target) {
      entry.projectedVisible = false;
      entry.sprite.visible = false;
      entry.hit.visible = false;
      entry.element?.classList.add('is-hidden');
      continue;
    }
    const leaders = coLeadingModelBrands(entry.country);
    const isLeader = leaders.includes(target);
    const coLeaderCount = isLeader ? leaders.length : 1;
    if (entry.brand !== target || entry.coLeaderCount !== coLeaderCount) {
      entry.sprite.material.map = textureForModelBrand(target, coLeaderCount);
      entry.sprite.material.needsUpdate = true;
    }
    entry.brand = target;
    entry.coLeaderCount = coLeaderCount;
    entry.isLeader = isLeader;
    entry.brandRank = Math.max(1, brands.indexOf(target) + 1);
    const fallbackImage = entry.element?.querySelector('img');
    if (fallbackImage) fallbackImage.src = target.logo;
  }
}

function updateModelDomFallback() {
  const fallbackActive = Boolean(state.contextLost && (isModelInterestView() || isInstallIntentView()));
  modelLogoLayer?.classList.toggle('is-fallback', fallbackActive);
  for (const entry of state.modelMarkerEntries) {
    if (!entry.element) continue;
    const activeScope = state.scope === 'world' || (isInstallIntentView() && isAdmin1Scope());
    entry.element.classList.toggle('is-hidden', !(fallbackActive && activeScope && entry.projectedVisible));
  }
  for (const entry of state.modelRegionMarkerEntries) {
    if (!entry.element) continue;
    entry.element.classList.toggle('is-hidden', !(fallbackActive && isAdmin1Scope() && entry.projectedVisible));
  }
}

function updateModelMarkerVisibility() {
  if (!state.modelMarkerGroup || !state.camera || !state.globeGroup) return;
  const worldActive = (isModelInterestView() || isInstallIntentView()) && state.scope === 'world';
  const installCountryActive = isInstallIntentView() && isAdmin1Scope() && Boolean(state.selectedInstallCountry);
  const active = worldActive || installCountryActive;
  state.modelMarkerGroup.visible = active;
  if (!active) {
    for (const entry of state.modelMarkerEntries) {
      entry.projectedVisible = false;
      entry.sprite.visible = false;
      entry.hit.visible = false;
      entry.element?.classList.add('is-hidden');
    }
    return;
  }
  const mobile = isMobileViewport();
  const limit = mobile ? 7 : 18;
  const minimumDistance = mobile ? 43 : 52;
  state.camera.updateMatrixWorld(true);
  state.globeGroup.updateMatrixWorld(true);
  const globeCenter = state.globeGroup.getWorldPosition(modelMarkerScratch.globeCenter);
  const candidates = [];
  for (const entry of state.modelMarkerEntries) {
    if (installCountryActive && entry.country !== state.selectedInstallCountry) continue;
    if (entry.filteredOut) continue;
    const worldPosition = state.globeGroup.localToWorld(modelMarkerScratch.worldPosition.copy(entry.position));
    const surfaceNormal = modelMarkerScratch.surfaceNormal.copy(worldPosition).sub(globeCenter).normalize();
    const towardCamera = modelMarkerScratch.towardCamera.copy(state.camera.position).sub(worldPosition).normalize();
    const projected = modelMarkerScratch.projected.copy(worldPosition).project(state.camera);
    const frontFacing = surfaceNormal.dot(towardCamera) > 0.075;
    const onScreen = Math.abs(projected.x) < 0.96 && Math.abs(projected.y) < 0.92 && projected.z > -1 && projected.z < 1;
    if (!frontFacing || !onScreen) continue;
    candidates.push({
      entry,
      x: (projected.x * 0.5 + 0.5) * stage.clientWidth,
      y: (-projected.y * 0.5 + 0.5) * stage.clientHeight
    });
  }
  candidates.sort((left, right) => {
    const selectedCountry = isInstallIntentView() ? state.selectedInstallCountry : state.selectedModelCountry;
    const selectedLeft = left.entry.country === selectedCountry ? 1 : 0;
    const selectedRight = right.entry.country === selectedCountry ? 1 : 0;
    return selectedRight - selectedLeft
      || modelCountryVisitors(right.entry.country) - modelCountryVisitors(left.entry.country)
      || left.entry.country.name.localeCompare(right.entry.country.name);
  });
  const visible = new Set();
  const occupied = [];
  for (const candidate of candidates) {
    const selectedCountry = isInstallIntentView() ? state.selectedInstallCountry : state.selectedModelCountry;
    const selected = candidate.entry.country === selectedCountry;
    const blockedByCopy = !selected && candidate.x < (mobile ? stage.clientWidth - 16 : Math.min(490, stage.clientWidth * 0.42))
      && candidate.y < (mobile ? 225 : 315);
    const blockedByPanel = !selected && !mobile && candidate.x > stage.clientWidth - 390 && candidate.y < stage.clientHeight - 70;
    const collides = !selected && occupied.some(point => Math.hypot(candidate.x - point.x, candidate.y - point.y) < minimumDistance);
    if (blockedByCopy || blockedByPanel || collides) continue;
    visible.add(candidate.entry);
    occupied.push(candidate);
    if (visible.size >= limit && !selected) break;
  }
  const viewportHeight = Math.max(stage.clientHeight, 1);
  const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2);
  const globeScale = state.globeGroup.getWorldScale(modelMarkerScratch.globeScale);
  for (const entry of state.modelMarkerEntries) {
    const show = visible.has(entry);
    entry.projectedVisible = show;
    entry.sprite.visible = show;
    entry.hit.visible = show;
    if (!show) {
      if (entry.element) entry.element.classList.add('is-hidden');
      continue;
    }
    const worldPosition = state.globeGroup.localToWorld(modelMarkerScratch.worldPosition.copy(entry.position));
    const cameraPosition = modelMarkerScratch.cameraPosition.copy(worldPosition).applyMatrix4(state.camera.matrixWorldInverse);
    const cameraDepth = Math.max(0.08, -cameraPosition.z);
    const pixelsPerLocalUnit = viewportHeight * Math.max(globeScale.x, 0.001)
      / (2 * Math.max(halfFovTangent, 0.001) * cameraDepth);
    const selectedCountry = isInstallIntentView() ? state.selectedInstallCountry : state.selectedModelCountry;
    const selected = entry.country === selectedCountry;
    const pixels = (mobile ? 42 : 50) + (selected ? 8 : 0);
    const localScale = THREE.MathUtils.clamp(pixels / pixelsPerLocalUnit, 0.18, 0.9);
    entry.sprite.scale.setScalar(localScale);
    const hitPixels = mobile ? 48 : 42;
    entry.hit.scale.setScalar(THREE.MathUtils.clamp(hitPixels / (0.36 * pixelsPerLocalUnit), 0.3, 4));
    entry.sprite.material.opacity = selected ? 1 : 0.93;
    if (entry.element) {
      const projected = occupied.find(candidate => candidate.entry === entry);
      if (projected) {
        entry.element.style.setProperty('--atlas-model-x', projected.x + 'px');
        entry.element.style.setProperty('--atlas-model-y', projected.y + 'px');
      }
      entry.element.classList.toggle('is-selected', selected);
      entry.element.classList.toggle('is-hidden', !state.contextLost);
    }
  }
}

function clearModelRegionMarkers() {
  if (state.modelRegionMarkerGroup) {
    state.modelRegionMarkerGroup.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
    });
    state.globeGroup?.remove(state.modelRegionMarkerGroup);
  }
  for (const entry of state.modelRegionMarkerEntries) entry.element?.remove();
  state.modelRegionMarkerGroup = null;
  state.modelRegionMarkerEntries = [];
  state.modelRegionMarkerHitMeshes = [];
  stage.dataset.modelRegionMarkers = '0';
}

function createModelRegionMarkers() {
  clearModelRegionMarkers();
  if (!isModelInterestView() || !state.globeGroup) return;
  state.modelRegionMarkerGroup = new THREE.Group();
  state.modelRegionMarkerGroup.userData.activityScope = 'model-admin1';
  for (const region of state.detailRankedRegions) {
    const brand = dominantModelBrand(region);
    if (!brand || !region.center || modelBrandSignals(brand) < PUBLISH_THRESHOLD) continue;
    const coLeaderCount = coLeadingModelBrands(region).length;
    const position = latLonToVector(region.center[0], region.center[1], GLOBE_RADIUS + 0.13);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: textureForModelBrand(brand, coLeaderCount),
      transparent: true,
      opacity: 0.96,
      depthTest: true,
      depthWrite: false,
      toneMapped: false
    }));
    sprite.position.copy(position);
    sprite.center.set(0.5, 0.5);
    sprite.renderOrder = 7;
    const marker = {
      kind: 'modelRegionBrand',
      country: state.detailCountry,
      region,
      brand,
      coLeaderCount,
      isLeader: true,
      brandRank: 1,
      position: position.clone(),
      sprite,
      hit: null,
      element: null,
      filteredOut: false,
      projectedVisible: false
    };
    sprite.userData = { modelBrandMarker: marker };
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 10),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.copy(position);
    hit.userData = { modelBrandMarker: marker };
    marker.hit = hit;
    if (modelLogoLayer) {
      const element = document.createElement('span');
      element.className = 'atlas-model-logo is-hidden';
      element.setAttribute('aria-hidden', 'true');
      const mark = document.createElement('span');
      mark.className = 'atlas-model-logo__mark';
      const image = document.createElement('img');
      image.src = brand.logo;
      image.alt = '';
      image.width = 27;
      image.height = 27;
      mark.append(image);
      element.append(mark);
      modelLogoLayer.append(element);
      marker.element = element;
    }
    state.modelRegionMarkerGroup.add(sprite, hit);
    state.modelRegionMarkerEntries.push(marker);
    state.modelRegionMarkerHitMeshes.push(hit);
  }
  state.modelRegionMarkerGroup.visible = false;
  state.globeGroup.add(state.modelRegionMarkerGroup);
  stage.dataset.modelRegionMarkers = String(state.modelRegionMarkerEntries.length);
}

function syncModelRegionMarkerBrands(selectedBrand = null) {
  const selectedId = selectedBrand ? brandIdentifier(selectedBrand) : '';
  for (const entry of state.modelRegionMarkerEntries) {
    const brands = modelBrandsForCountry(entry.region);
    const target = selectedId
      ? brands.find(brand => brandIdentifier(brand) === selectedId) || null
      : dominantModelBrand(entry.region);
    entry.filteredOut = Boolean(selectedId && !target);
    if (!target) {
      entry.projectedVisible = false;
      entry.sprite.visible = false;
      entry.hit.visible = false;
      entry.element?.classList.add('is-hidden');
      continue;
    }
    const leaders = coLeadingModelBrands(entry.region);
    const isLeader = leaders.includes(target);
    const coLeaderCount = isLeader ? leaders.length : 1;
    if (entry.brand !== target || entry.coLeaderCount !== coLeaderCount) {
      entry.sprite.material.map = textureForModelBrand(target, coLeaderCount);
      entry.sprite.material.needsUpdate = true;
    }
    entry.brand = target;
    entry.coLeaderCount = coLeaderCount;
    entry.isLeader = isLeader;
    entry.brandRank = Math.max(1, brands.indexOf(target) + 1);
    const fallbackImage = entry.element?.querySelector('img');
    if (fallbackImage) fallbackImage.src = target.logo;
  }
}

function sameModelRegion(left, right) {
  if (!left || !right) return false;
  if (left === right) return true;
  const leftRegionId = String(left.regionId || '');
  const rightRegionId = String(right.regionId || '');
  if (leftRegionId || rightRegionId) return Boolean(leftRegionId && rightRegionId && leftRegionId === rightRegionId);
  const leftIds = Array.isArray(left.boundaryFeatureIds) ? left.boundaryFeatureIds : [];
  const rightIds = Array.isArray(right.boundaryFeatureIds) ? right.boundaryFeatureIds : [];
  if (leftIds.length || rightIds.length) return leftIds.some(id => rightIds.includes(id));
  return left.name === right.name;
}

function updateModelRegionMarkerVisibility() {
  if (!state.modelRegionMarkerGroup || !state.camera || !state.globeGroup) return;
  const active = isModelInterestView() && isAdmin1Scope();
  state.modelRegionMarkerGroup.visible = active;
  if (!active) {
    for (const entry of state.modelRegionMarkerEntries) {
      entry.projectedVisible = false;
      entry.sprite.visible = false;
      entry.hit.visible = false;
      entry.element?.classList.add('is-hidden');
    }
    return;
  }
  const mobile = isMobileViewport();
  const limit = mobile ? 7 : 18;
  const minimumDistance = mobile ? 41 : 48;
  state.camera.updateMatrixWorld(true);
  state.globeGroup.updateMatrixWorld(true);
  const globeCenter = state.globeGroup.getWorldPosition(modelMarkerScratch.globeCenter);
  const candidates = [];
  for (const entry of state.modelRegionMarkerEntries) {
    if (entry.filteredOut) continue;
    const worldPosition = state.globeGroup.localToWorld(modelMarkerScratch.worldPosition.copy(entry.position));
    const surfaceNormal = modelMarkerScratch.surfaceNormal.copy(worldPosition).sub(globeCenter).normalize();
    const towardCamera = modelMarkerScratch.towardCamera.copy(state.camera.position).sub(worldPosition).normalize();
    const projected = modelMarkerScratch.projected.copy(worldPosition).project(state.camera);
    const frontFacing = surfaceNormal.dot(towardCamera) > 0.075;
    const onScreen = Math.abs(projected.x) < 0.96 && Math.abs(projected.y) < 0.92 && projected.z > -1 && projected.z < 1;
    if (!frontFacing || !onScreen) continue;
    candidates.push({
      entry,
      x: (projected.x * 0.5 + 0.5) * stage.clientWidth,
      y: (-projected.y * 0.5 + 0.5) * stage.clientHeight
    });
  }
  candidates.sort((left, right) => {
    const selectedLeft = sameModelRegion(left.entry.region, state.selectedModelRegion) ? 1 : 0;
    const selectedRight = sameModelRegion(right.entry.region, state.selectedModelRegion) ? 1 : 0;
    return selectedRight - selectedLeft
      || modelCountryVisitors(right.entry.region) - modelCountryVisitors(left.entry.region)
      || left.entry.region.name.localeCompare(right.entry.region.name);
  });
  const visible = new Set();
  const occupied = [];
  for (const candidate of candidates) {
    const selected = sameModelRegion(candidate.entry.region, state.selectedModelRegion);
    const blockedByPanel = !selected && !mobile && candidate.x > stage.clientWidth - 390;
    const collides = !selected && occupied.some(point => Math.hypot(candidate.x - point.x, candidate.y - point.y) < minimumDistance);
    if (blockedByPanel || collides) continue;
    visible.add(candidate.entry);
    occupied.push(candidate);
    if (visible.size >= limit && !selected) break;
  }
  const viewportHeight = Math.max(stage.clientHeight, 1);
  const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2);
  const globeScale = state.globeGroup.getWorldScale(modelMarkerScratch.globeScale);
  for (const entry of state.modelRegionMarkerEntries) {
    const show = visible.has(entry);
    entry.projectedVisible = show;
    entry.sprite.visible = show;
    entry.hit.visible = show;
    if (!show) {
      entry.element?.classList.add('is-hidden');
      continue;
    }
    const worldPosition = state.globeGroup.localToWorld(modelMarkerScratch.worldPosition.copy(entry.position));
    const cameraPosition = modelMarkerScratch.cameraPosition.copy(worldPosition).applyMatrix4(state.camera.matrixWorldInverse);
    const cameraDepth = Math.max(0.08, -cameraPosition.z);
    const pixelsPerLocalUnit = viewportHeight * Math.max(globeScale.x, 0.001)
      / (2 * Math.max(halfFovTangent, 0.001) * cameraDepth);
    const selected = sameModelRegion(entry.region, state.selectedModelRegion);
    const pixels = (mobile ? 40 : 48) + (selected ? 8 : 0);
    entry.sprite.scale.setScalar(THREE.MathUtils.clamp(pixels / pixelsPerLocalUnit, 0.16, 0.82));
    const hitPixels = mobile ? 48 : 42;
    entry.hit.scale.setScalar(THREE.MathUtils.clamp(hitPixels / (0.36 * pixelsPerLocalUnit), 0.3, 4));
    entry.sprite.material.opacity = selected ? 1 : 0.92;
    if (entry.element) {
      const projected = occupied.find(candidate => candidate.entry === entry);
      if (projected) {
        entry.element.style.setProperty('--atlas-model-x', projected.x + 'px');
        entry.element.style.setProperty('--atlas-model-y', projected.y + 'px');
      }
      entry.element.classList.toggle('is-selected', selected);
      entry.element.classList.toggle('is-hidden', !state.contextLost);
    }
  }
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
  if (isModelInterestView()) return false;
  if (state.scope === 'world') return true;
  if (state.scope === 'us') return String(cluster.countryCode || '').toUpperCase() === 'US';
  if (isAdmin1Scope()) return String(cluster.countryCode || '').toUpperCase() === state.detailConfig.alpha2;
  if (isAdmin2Scope()) return state.admin2AssignmentByCluster.has(cluster);
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
  const detailedView = isAdmin1Scope() || isAdmin2Scope();
  const viewportHeight = Math.max(stage.clientHeight, 1);
  const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2);
  const worldPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const globeScale = new THREE.Vector3(1, 1, 1);

  if (detailedView) {
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

    if (!detailedView || !entry.group.visible) {
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

    const hitPixels = isMobileViewport() ? 32 : 24;
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
    if (isAdmin2Scope()) {
      const lockedRegion = state.admin2AssignmentByCluster.get(state.locked);
      contextualCandidates = scopedCandidates.filter(entry => state.admin2AssignmentByCluster.get(entry.cluster) === lockedRegion);
    } else if (isAdmin1Scope()) {
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
  } else if (isAdmin2Scope() && state.locked?.kind === 'admin2') {
    contextualCandidates = scopedCandidates.filter(entry => state.admin2AssignmentByCluster.get(entry.cluster) === state.locked);
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
  clearModelRegionMarkers();
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
  if (isModelInterestView()) createModelRegionMarkers();
}

function clearAdmin2Layer({ reset = true } = {}) {
  if (state.admin2Group) {
    state.admin2Group.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
      else if (object.material) object.material.dispose();
    });
    state.globeGroup?.remove(state.admin2Group);
  }
  state.admin2Group = null;
  state.admin2BoundaryLine = null;
  state.admin2ParentLine = null;
  stage.dataset.admin2Features = '0';
  stage.dataset.admin2BoundaryPositions = '0';
  if (!reset) return;
  state.admin2Boundaries = null;
  state.admin2Parent = null;
  state.admin2ParentScope = null;
  state.admin2Config = null;
  state.admin2Features = [];
  state.admin2Regions = [];
  state.admin2AssignmentByCluster = new Map();
}

function createAdmin2Layer() {
  clearAdmin2Layer({ reset: false });
  state.admin2Group = new THREE.Group();
  state.admin2Group.userData.activityScope = 'admin2';
  const positions = [];
  for (const feature of state.admin2Features) {
    positions.push(...boundaryPositions(feature, GLOBE_RADIUS + 0.038));
  }
  if (positions.length > 0) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.LineBasicMaterial({
      color: state.theme === 'light' ? 0x38566c : 0xcce0ed,
      transparent: true,
      opacity: state.theme === 'light' ? 0.62 : 0.72,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
    state.admin2BoundaryLine = new THREE.LineSegments(geometry, material);
    state.admin2BoundaryLine.userData = { admin2Boundary: true, activityScope: 'admin2' };
    state.admin2BoundaryLine.renderOrder = 5;
    state.admin2Group.add(state.admin2BoundaryLine);
  }
  const parentFeature = state.admin2ParentScope === 'us'
    ? featureForState(state.admin2Parent?.name)
    : state.admin2Parent?.feature;
  const parentPositions = boundaryPositions(parentFeature, GLOBE_RADIUS + 0.043);
  if (parentPositions.length > 0) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(parentPositions, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.LineBasicMaterial({
      color: 0xffb58a,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
    state.admin2ParentLine = new THREE.LineSegments(geometry, material);
    state.admin2ParentLine.userData = { admin2ParentBoundary: true, activityScope: 'admin2' };
    state.admin2ParentLine.renderOrder = 5;
    state.admin2Group.add(state.admin2ParentLine);
  }
  state.admin2Group.visible = false;
  state.globeGroup.add(state.admin2Group);
  stage.dataset.admin2Features = String(state.admin2Features.length);
  stage.dataset.admin2BoundaryPositions = String(positions.length / 3);
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
    preserveDrawingBuffer: false,
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
  if (!isModelInterestView()) {
    createStateBoundaries();
    createUSActivity();
  }
  createCityClusters();
  createModelBrandMarkers();
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
  if (scope === 'admin2' && state.admin2Config) {
    return admin1ZoomForBbox(state.admin2Config.bbox, mobile, state.admin2Config.longitudeSpan);
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
  if (scope === 'admin2') {
    return { minimum: GLOBE_RADIUS + 0.2, maximum: mobile ? 12.2 : 11.8 };
  }
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
    if (isModelInterestView()) {
      state.selectedModelRegion = null;
      state.selectedModelBrand = null;
      setModelPanelOpen(true);
      renderModelPanel(state.selectedModelCountry, '', null);
      syncModelUrl();
    }
    const center = state.centers.get(state.detailCountry.name);
    if (center) {
      state.targetRotation.x = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(center[0] - 22), -1.15, 1.15);
      state.targetRotation.y = closestAngle(-THREE.MathUtils.degToRad(center[1]), state.globeGroup.rotation.y);
    }
  } else if (isAdmin2Scope()) {
    state.locked = { kind: 'admin2View', name: `${state.admin2Config.parentName} detailed boundary view` };
    const center = state.admin2Parent?.center
      || (state.admin2ParentScope === 'us' ? state.usCenters.get(state.admin2Parent?.name) : null);
    if (center) {
      state.targetRotation.x = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(center[0] - 22), -1.15, 1.15);
      state.targetRotation.y = closestAngle(-THREE.MathUtils.degToRad(center[1]), state.globeGroup.rotation.y);
    }
  } else {
    state.locked = null;
    state.targetRotation.set(0.38, -0.1);
    if (isModelInterestView()) {
      state.selectedModelCountry = null;
      state.selectedModelRegion = null;
      state.selectedModelBrand = null;
      setModelPanelOpen(false);
      renderModelPanel(null, '');
      syncModelUrl();
    } else if (isInstallIntentView()) {
      state.selectedInstallCountry = null;
      state.selectedInstallModel = null;
      setInstallPanelOpen(false);
      renderInstallPanel(null, '');
    }
  }
  spotlight.hidden = true;
  hideTooltip();
  setZoom(defaultZoom());
  updateSelectionOverlay(null);
  updateScopeInterface();
  if (isInstallIntentView()) syncInstallUrl();
}

function resize() {
  if (!state.renderer || !state.camera) return;
  const width = Math.max(1, Math.round(stage.clientWidth));
  const height = Math.max(1, Math.round(stage.clientHeight));
  const mobile = isMobileViewport(width);
  const regionalMobile = mobile && state.scope !== 'world';
  const nextPixelRatio = atlasPixelRatio(width, height);
  const pixelRatioChanged = Math.abs((state.pixelRatio || 0) - nextPixelRatio) > 0.01;
  const sizeChanged = state.renderWidth !== width || state.renderHeight !== height;
  if (pixelRatioChanged) {
    state.pixelRatio = nextPixelRatio;
    state.renderer.setPixelRatio(nextPixelRatio);
  }
  if (sizeChanged || pixelRatioChanged) {
    state.renderer.setSize(width, height, false);
    state.renderWidth = width;
    state.renderHeight = height;
  }
  stage.dataset.renderDpr = state.pixelRatio.toFixed(2);
  stage.dataset.textureWidth = String(state.textureWidth || atlasTextureWidth());
  state.camera.aspect = width / Math.max(height, 1);
  state.camera.fov = mobile ? 42 : 34;
  const scopeZoom = defaultZoom(state.scope, mobile);
  if (state.zoom === null || state.mobileLayout !== mobile) state.zoom = scopeZoom;
  state.mobileLayout = mobile;
  state.camera.position.z = state.zoom;
  state.camera.position.y = mobile ? (regionalMobile ? 0.28 : 0.48) : 0.18;
  state.globeGroup.position.y = mobile ? (regionalMobile ? -1.12 : -1.48) : -1.18;
  state.camera.lookAt(0, regionalMobile ? 0 : -0.75, 0);
  state.camera.updateProjectionMatrix();
  updateZoomLevel();
}

let resizeFrame = 0;
function scheduleResize() {
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0;
    resize();
  });
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
    if (object.userData.admin2Boundary) {
      object.material.color.set(state.theme === 'light' ? 0x38566c : 0xcce0ed);
      object.material.opacity = state.theme === 'light' ? 0.62 : 0.72;
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
  for (const region of state.usAllRegions) {
    const feature = featureForState(region.name);
    if (feature && pointInFeature(lat, lon, feature)) return region;
  }
  return null;
}

function geographyForCluster(cluster) {
  if (!cluster) return null;
  if (isAdmin2Scope()) return state.admin2AssignmentByCluster.get(cluster) || null;
  if (state.scope === 'us') return regionForCode(cluster.regionCode);
  if (isAdmin1Scope()) {
    const assignedRegion = state.admin1AssignmentByCluster.get(cluster);
    return assignedRegion?.activityEntity || assignedRegion || null;
  }
  return countryForCode(cluster.countryCode);
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function entityAtPointer({ preferGeography = false } = {}) {
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
  const frontSurfaceHit = Boolean(intersection && intersection.point.clone()
    .sub(state.interactionSphere.center)
    .normalize()
    .dot(state.raycaster.ray.direction) < 0);
  let geographicEntity = null;
  if (frontSurfaceHit) {
    const local = state.globeGroup.worldToLocal(intersection.point.clone());
    const { lat, lon } = vectorToLatLon(local);
    geographicEntity = isAdmin2Scope()
      ? admin2RegionAt(lat, lon)
      : state.scope === 'us'
        ? stateAt(lat, lon)
        : isAdmin1Scope()
          ? admin1RegionAt(lat, lon)
          : countryAt(lat, lon);
  }
  const clusterHits = state.raycaster.intersectObjects(
    state.clusterEntries.filter(entry => entry.group.visible).map(entry => entry.hit),
    false
  );
  const clusterHit = frontSurfaceHit && clusterHits[0] && clusterHits[0].distance <= intersection.distance + 0.12
    ? clusterHits[0].object.userData.cityCluster || null
    : null;
  const activeModelHitMeshes = state.scope === 'world'
    ? state.modelMarkerHitMeshes
    : isAdmin1Scope()
      ? isInstallIntentView()
        ? state.modelMarkerHitMeshes
        : state.modelRegionMarkerHitMeshes
      : [];
  const modelHits = isModelInterestView() || isInstallIntentView()
    ? state.raycaster.intersectObjects(activeModelHitMeshes.filter(hit => hit.visible), false)
    : [];
  const modelHit = frontSurfaceHit && modelHits[0] && modelHits[0].distance <= intersection.distance + 0.24
    ? modelHits[0].object.userData.modelBrandMarker || null
    : null;
  if (modelHit) return modelHit;
  // Map activation always drills into the geography under the pointer. If a
  // coastal city centroid lands just outside a simplified boundary, its mapped
  // country, state or Admin-1 assignment is the geographic fallback. Beacons
  // remain hoverable and their projected labels are explicit city buttons.
  if (preferGeography) return frontSurfaceHit ? geographicEntity || geographyForCluster(clusterHit) : null;
  if (clusterHit) {
    return clusterHit;
  }
  return geographicEntity;
}

function showTooltip(entity, event) {
  if (!tooltip || !entity || window.innerWidth < 760) return;
  if (entity.kind === 'installStack') {
    tooltip.hidden = false;
    tooltip.querySelector('[data-tooltip-rank]').textContent = `Leading published path in ${entity.country.name}`;
    tooltip.querySelector('[data-tooltip-country]').textContent = entity.brand.label;
    tooltip.querySelector('[data-tooltip-signals]').textContent = `${number(modelBrandSignals(entity.brand))} country-level path visitors · select for details`;
    const rect = stage.getBoundingClientRect();
    const left = Math.min(event.clientX - rect.left, rect.width - 250);
    const top = Math.min(event.clientY - rect.top, rect.height - 140);
    tooltip.style.left = Math.max(4, left) + 'px';
    tooltip.style.top = Math.max(4, top) + 'px';
    return;
  }
  if (entity.kind === 'modelRegionBrand') {
    tooltip.hidden = false;
    tooltip.querySelector('[data-tooltip-rank]').textContent = entity.isLeader
      ? (entity.coLeaderCount > 1 ? 'Co-leading' : 'Most explored') + ' brand in ' + entity.region.name
      : '#' + entity.brandRank + ' published brand in ' + entity.region.name;
    tooltip.querySelector('[data-tooltip-country]').textContent = entity.brand.label;
    tooltip.querySelector('[data-tooltip-signals]').textContent = number(modelBrandSignals(entity.brand)) + ' regional brand visitors · select for model detail';
    const rect = stage.getBoundingClientRect();
    const left = Math.min(event.clientX - rect.left, rect.width - 250);
    const top = Math.min(event.clientY - rect.top, rect.height - 140);
    tooltip.style.left = Math.max(4, left) + 'px';
    tooltip.style.top = Math.max(4, top) + 'px';
    return;
  }
  if (entity.kind === 'modelBrand') {
    tooltip.hidden = false;
    tooltip.querySelector('[data-tooltip-rank]').textContent = entity.isLeader
      ? (entity.coLeaderCount > 1 ? 'Co-leading' : 'Most explored') + ' brand in ' + entity.country.name
      : '#' + entity.brandRank + ' published brand in ' + entity.country.name;
    tooltip.querySelector('[data-tooltip-country]').textContent = entity.brand.label;
    tooltip.querySelector('[data-tooltip-signals]').textContent = number(modelBrandSignals(entity.brand)) + ' unique brand visitors · select for model detail';
    const rect = stage.getBoundingClientRect();
    const left = Math.min(event.clientX - rect.left, rect.width - 250);
    const top = Math.min(event.clientY - rect.top, rect.height - 140);
    tooltip.style.left = Math.max(4, left) + 'px';
    tooltip.style.top = Math.max(4, top) + 'px';
    return;
  }
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
      ? `#${entity.rank} ${isModelInterestView() ? 'regional model-interest' : state.detailConfig.regionLabel} rank`
      : (entity.type || state.detailConfig.regionLabel);
    tooltip.querySelector('[data-tooltip-country]').textContent = entity.name;
    if (isModelInterestView()) {
      const visitors = publishedRegionalModelVisitors(entity);
      const publishedBrands = modelBrandsForCountry(entity).length;
      tooltip.querySelector('[data-tooltip-signals]').textContent = visitors !== null
        ? `${number(visitors)} regional model-page visitors · ${number(publishedBrands)} published brand${publishedBrands === 1 ? '' : 's'} · select for detail`
        : `${admin1EntityStatusMessage(entity)} Select to inspect this boundary.`;
      const rect = stage.getBoundingClientRect();
      const left = Math.min(event.clientX - rect.left, rect.width - 220);
      const top = Math.min(event.clientY - rect.top, rect.height - 140);
      tooltip.style.left = `${Math.max(4, left)}px`;
      tooltip.style.top = `${Math.max(4, top)}px`;
      return;
    }
    const drillConfig = admin2ConfigForParent(entity, 'admin1');
    const drillAction = drillConfig && Number(drillConfig.featureCount) > 1
      ? ` · select for ${drillConfig.childrenLabel}`
      : '';
    tooltip.querySelector('[data-tooltip-signals]').textContent = entity.published && Number.isFinite(entity.signals)
      ? `${number(entity.signals)} published regional ${isInstallIntentView() ? 'install-intent visitors' : 'signals'}${drillAction}`
      : `${admin1EntityStatusMessage(entity)}${drillAction}`;
    const rect = stage.getBoundingClientRect();
    const left = Math.min(event.clientX - rect.left, rect.width - 220);
    const top = Math.min(event.clientY - rect.top, rect.height - 140);
    tooltip.style.left = `${Math.max(4, left)}px`;
    tooltip.style.top = `${Math.max(4, top)}px`;
    return;
  }
  if (entity.kind === 'admin2') {
    tooltip.hidden = false;
    tooltip.querySelector('[data-tooltip-rank]').textContent = entity.type || state.admin2Config.childLabel;
    tooltip.querySelector('[data-tooltip-country]').textContent = entity.label || entity.name;
    tooltip.querySelector('[data-tooltip-signals]').textContent = 'No subdivision-level activity total published · select to focus';
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
  const stateDetailConfig = stateView ? admin2ConfigForParent(entity, 'us') : null;
  const action = isModelInterestView()
    ? ' · select for regional brand and model detail'
    : isInstallIntentView() && !stateView
      ? ' · select for regional boundaries and stack detail'
    : stateDetailConfig && Number(stateDetailConfig.featureCount) > 1
    ? ` · select for ${stateDetailConfig.childrenLabel}`
    : !stateView && entity.adm0A3 === 'USA'
    ? ' · select for state detail'
    : detailConfig
      ? ` · select for ${detailConfig.regionLabel} detail`
      : '';
  tooltip.querySelector('[data-tooltip-signals]').textContent = Number.isFinite(entity.signals)
    ? `${number(entity.signals)} ${signalLabel(entity.signals)}${action}`
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
    if (isModelInterestView()) {
      spotlight.querySelector('[data-spotlight-rank]').textContent = entity.published && entity.rank
        ? `Regional model-interest rank #${entity.rank}`
        : 'Regional model interest';
      spotlight.querySelector('[data-spotlight-label]').textContent = entity.type || state.detailConfig.regionLabel;
      spotlight.querySelector('[data-spotlight-country]').textContent = entity.name;
      const visitors = publishedRegionalModelVisitors(entity);
      spotlight.querySelector('[data-spotlight-signals]').textContent = visitors === null
        ? admin1EntityStatusMessage(entity)
        : `${number(visitors)} regional model-page visitors · approximate network location${entity.qualityFlag || entity.qualityFlags?.length ? '; known routing cluster' : ''}`;
      return;
    }
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
      ? `${number(entity.signals)} ${isInstallIntentView() ? 'install-intent visitors' : 'signals'} · ${entity.qualityNote}`
      : `${number(entity.signals)} published regional ${isInstallIntentView() ? 'install-intent visitors' : 'signals'} · independently privacy-thresholded`;
    return;
  }
  if (entity.kind === 'admin2') {
    spotlight.hidden = false;
    spotlight.querySelector('[data-spotlight-rank]').textContent = 'Boundary view · no activity total';
    spotlight.querySelector('[data-spotlight-label]').textContent = entity.type || state.admin2Config.childLabel;
    spotlight.querySelector('[data-spotlight-country]').textContent = entity.label || entity.name;
    const beaconCount = entity.clusters.length;
    spotlight.querySelector('[data-spotlight-signals]').textContent = beaconCount
      ? `${number(beaconCount)} separate published city ${beaconCount === 1 ? 'cluster falls' : 'clusters fall'} inside this cartographic boundary · not a subdivision total`
      : 'DataFast does not publish activity totals at this level. Neutral does not mean zero.';
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
    ? stateView
      ? 'No state-level activity total is published for this geography. Select it to explore county boundaries.'
      : 'No country total is published for this geography. Select it to explore administrative boundaries.'
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
  state.admin2LoadToken += 1;
  setAdmin2Busy(false);
  if (isAdmin2Scope()) clearAdmin2Layer();
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

function installModelIdentifier(model) {
  return String(model?.id || '');
}

function installDetails() {
  return state.data?.installIntentDetails || {};
}

function installModelsForCountry(country = null) {
  const rows = country ? country.installIntent?.models : installDetails().models;
  return Array.isArray(rows) ? rows : [];
}

function installRuntimesForCountry(country = null) {
  const rows = country ? country.installIntent?.runtimes : installDetails().runtimes;
  return Array.isArray(rows) ? rows : [];
}

function installModalitiesForCountry(country = null) {
  const rows = country ? country.installIntent?.modalities : installDetails().modalities;
  return Array.isArray(rows) ? rows : [];
}

function syncInstallMarkerPaths(selectedCountry = null, selectedPath = null) {
  for (const entry of state.modelMarkerEntries) {
    if (entry.kind !== 'installStack') continue;
    const target = entry.country === selectedCountry && selectedPath
      ? selectedPath
      : leadingInstallPath(entry.country);
    entry.filteredOut = false;
    if (!target) {
      entry.projectedVisible = false;
      entry.sprite.visible = false;
      entry.hit.visible = false;
      entry.element?.classList.add('is-hidden');
      continue;
    }
    if (entry.brand !== target) {
      entry.sprite.material.map = textureForModelBrand(target, 1);
      entry.sprite.material.needsUpdate = true;
    }
    entry.brand = target;
    entry.coLeaderCount = 1;
    entry.isLeader = true;
    entry.brandRank = 1;
    const fallbackImage = entry.element?.querySelector('img');
    if (fallbackImage) fallbackImage.src = target.logo;
  }
}

function setInstallPanelOpen(open, options = {}) {
  const wasOpen = state.installPanelOpen;
  const shouldOpen = Boolean(open);
  if (shouldOpen && !wasOpen && options.focus) {
    const active = document.activeElement;
    installPanelReturnFocus = active instanceof HTMLElement && active !== document.body && !installPanel?.contains(active)
      ? active
      : canvas;
  }
  state.installPanelOpen = shouldOpen;
  stage.classList.toggle('atlas-install-panel-open', state.installPanelOpen);
  if (installPanel && isInstallIntentView()) installPanel.hidden = !state.installPanelOpen;
  if (shouldOpen && options.focus) {
    window.requestAnimationFrame(() => installPanel?.querySelector('[data-atlas-install-close]')?.focus({ preventScroll: true }));
  } else if (!shouldOpen && options.restoreFocus) {
    const target = installPanelReturnFocus?.isConnected ? installPanelReturnFocus : canvas;
    installPanelReturnFocus = null;
    window.requestAnimationFrame(() => target?.focus?.({ preventScroll: true }));
  }
}

function installListRow(row, type, selected = false) {
  const item = document.createElement('li');
  const interactive = type === 'model';
  const content = document.createElement(interactive ? 'button' : 'div');
  if (interactive) {
    content.type = 'button';
    content.setAttribute('aria-pressed', String(selected));
    content.addEventListener('click', () => {
      state.selectedInstallModel = installModelIdentifier(row);
      renderInstallPanel(state.selectedInstallCountry, state.selectedInstallModel);
      window.requestAnimationFrame(() => installPanel?.querySelector('[data-atlas-install-back]')?.focus({ preventScroll: true }));
    });
  }
  const logo = document.createElement('img');
  logo.src = row.logo;
  logo.alt = '';
  logo.width = 28;
  logo.height = 28;
  logo.loading = 'lazy';
  const identity = document.createElement('span');
  identity.className = 'atlas-install-row__identity';
  const label = document.createElement('strong');
  label.textContent = row.label;
  const detail = document.createElement('small');
  detail.textContent = type === 'model'
    ? [String(row.kind || '').toUpperCase(), row.recommendedProfile ? `${row.recommendedProfile} catalogue profile` : ''].filter(Boolean).join(' · ')
    : row.kind || 'Selected destination';
  identity.append(label, detail);
  const value = document.createElement('b');
  value.textContent = number(row.visitors);
  content.append(logo, identity, value);
  item.append(content);
  return item;
}

function renderInstallRows(container, rows, type) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  if (!rows.length) {
    const item = document.createElement('li');
    const placeholder = document.createElement('div');
    const spacer = document.createElement('span');
    spacer.setAttribute('aria-hidden', 'true');
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    const identity = document.createElement('span');
    identity.className = 'atlas-install-row__identity';
    const label = document.createElement('strong');
    label.textContent = 'Collecting enough signals';
    const detail = document.createElement('small');
    detail.textContent = `No ${type === 'model' ? 'model' : 'setup destination'} independently reaches ${PUBLISH_THRESHOLD} visitors`;
    identity.append(label, detail);
    const value = document.createElement('b');
    value.textContent = '—';
    placeholder.append(spacer, icon, identity, value);
    item.append(placeholder);
    fragment.append(item);
  } else {
    rows.forEach(row => fragment.append(installListRow(row, type, type === 'model' && installModelIdentifier(row) === state.selectedInstallModel)));
  }
  container.replaceChildren(fragment);
}

function renderInstallModalities(container, rows) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  if (!rows.length) {
    const item = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = 'Detail below threshold';
    item.append(label);
    fragment.append(item);
  } else {
    rows.forEach(row => {
      const item = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = row.label;
      const value = document.createElement('small');
      value.textContent = `${number(row.visitors)} visitors`;
      item.append(label, value);
      fragment.append(item);
    });
  }
  container.replaceChildren(fragment);
}

function renderInstallPanel(country = state.selectedInstallCountry, requestedModelId = state.selectedInstallModel) {
  if (!installPanel || !isInstallIntentView()) return;
  installPanel.hidden = !state.installPanelOpen;
  const models = installModelsForCountry(country);
  const runtimes = installRuntimesForCountry(country);
  const modalities = installModalitiesForCountry(country);
  const selectedModel = models.find(model => installModelIdentifier(model) === String(requestedModelId || '')) || null;
  if (requestedModelId && !selectedModel) state.selectedInstallModel = null;
  const dominant = selectedModel || models[0] || runtimes[0] || null;
  syncInstallMarkerPaths(country, dominant);
  const countryLabel = installPanel.querySelector('[data-atlas-install-country]');
  const title = installPanel.querySelector('h2');
  const dominantLogo = installPanel.querySelector('[data-atlas-install-dominant-logo]');
  const dominantType = installPanel.querySelector('[data-atlas-install-dominant-type]');
  const dominantLabel = installPanel.querySelector('[data-atlas-install-dominant-label]');
  const dominantSummary = installPanel.querySelector('[data-atlas-install-dominant-summary]');
  const metrics = installPanel.querySelector('[data-atlas-install-metrics]');
  const total = installPanel.querySelector('[data-atlas-install-total]');
  const totalLabel = installPanel.querySelector('[data-atlas-install-total-label]');
  const attributed = installPanel.querySelector('[data-atlas-install-attributed]');
  const modelList = installPanel.querySelector('[data-atlas-install-model-list]');
  const runtimeList = installPanel.querySelector('[data-atlas-install-runtime-list]');
  const modalityList = installPanel.querySelector('[data-atlas-install-modality-list]');
  const empty = installPanel.querySelector('[data-atlas-install-empty]');
  const overview = installPanel.querySelector('.atlas-install-overview');
  const scopeDetails = installPanel.querySelectorAll('[data-atlas-install-scope-detail]');
  const back = installPanel.querySelector('[data-atlas-install-back]');
  const regions = installPanel.querySelector('[data-atlas-install-regions]');
  if (countryLabel) countryLabel.textContent = country ? country.name : 'Worldwide install intent';
  if (title) title.textContent = selectedModel ? selectedModel.label : country ? 'Country install paths' : 'Install-path leaders';
  if (dominantLogo) {
    if (dominant?.logo) dominantLogo.src = dominant.logo;
    else dominantLogo.removeAttribute('src');
    dominantLogo.alt = '';
    dominantLogo.hidden = !dominant;
  }
  const selectedModelRank = selectedModel ? models.indexOf(selectedModel) + 1 : 0;
  if (dominantType) dominantType.textContent = selectedModel
    ? selectedModelRank === 1 ? 'Top model path selected' : 'Selected model path'
    : models[0]
      ? 'Top model path selected'
    : runtimes[0]
      ? 'Top setup destination selected'
      : 'Published path detail';
  if (dominantLabel) dominantLabel.textContent = dominant?.label || 'Collecting enough signals';
  if (dominantSummary) dominantSummary.textContent = selectedModel
    ? `${number(selectedModel.visitors)} unique visitors selected an eligible path after this model page. ${selectedModel.recommendedProfile || 'Its profile'} is a LocalClaw catalogue recommendation, not measured telemetry.`
    : models[0]
      ? `${number(models[0].visitors)} unique visitors selected an eligible path after this model page.`
      : runtimes[0]
        ? `${number(runtimes[0].visitors)} unique visitors selected this published destination path. No model path reaches five visitors in this scope yet.`
        : `No model or setup destination independently reaches ${PUBLISH_THRESHOLD} unique visitors in this scope yet.`;
  const scopeTotal = country?.signals ?? state.data.totals.observedSignals;
  if (total) total.textContent = selectedModel ? number(selectedModel.visitors) : number(scopeTotal);
  if (totalLabel) totalLabel.textContent = selectedModel
    ? 'model-path visitors'
    : country
      ? 'country install-intent visitors'
      : 'observed install-intent visitors';
  if (metrics) metrics.setAttribute('aria-label', selectedModel
    ? 'Selected model-path detail'
    : country
      ? 'Country install-intent totals'
      : 'Observed install-intent totals');
  const secondaryValue = selectedModel
    ? selectedModel.recommendedProfile || null
    : country
      ? models[0]?.visitors ?? runtimes[0]?.visitors ?? null
      : state.data.totals.attributedModelVisitors;
  if (attributed) {
    attributed.textContent = secondaryValue === null ? '—' : selectedModel ? secondaryValue : number(secondaryValue);
    const label = attributed.nextElementSibling;
    if (label) label.textContent = selectedModel
      ? 'catalogue profile · not telemetry'
      : country
        ? secondaryValue === null ? 'detail below threshold' : models[0] ? 'top model-path visitors' : 'top destination visitors'
        : 'model-attributed visitors';
  }
  renderInstallRows(modelList, models, 'model');
  renderInstallRows(runtimeList, runtimes, 'runtime');
  renderInstallModalities(modalityList, modalities);
  const showEmpty = !selectedModel && !models.length && !runtimes.length && !modalities.length;
  if (overview) overview.hidden = showEmpty;
  if (empty) empty.hidden = !showEmpty;
  scopeDetails.forEach(element => { element.hidden = Boolean(selectedModel); });
  if (back) {
    back.hidden = !country && !selectedModel;
    back.setAttribute('aria-label', selectedModel
      ? country ? 'Return to country install paths' : 'Return to worldwide install paths'
      : 'Return to the worldwide install-path overview');
  }
  if (regions) {
    regions.hidden = Boolean(selectedModel) || !country || (!manifestEntryForCountry(country) && country.adm0A3 !== 'USA');
    const heading = regions.querySelector('strong');
    const detail = regions.querySelector('small');
    if (heading) heading.textContent = `Explore ${country?.name || ''} boundaries`;
    if (detail) detail.textContent = 'Regional totals appear only when they independently reach 5+';
  }
  installPanel.dataset.scope = selectedModel ? 'model' : country ? 'country' : 'world';
}

function openInstallCountryPanel(country, requestedModelId = '') {
  if (!country || !isInstallIntentView()) return;
  const selectedModel = installModelsForCountry(country)
    .find(model => installModelIdentifier(model) === String(requestedModelId || '')) || null;
  state.selectedInstallCountry = country;
  state.selectedInstallModel = selectedModel ? installModelIdentifier(selectedModel) : null;
  setInstallPanelOpen(true, { focus: true });
  renderInstallPanel(country, state.selectedInstallModel);
  syncInstallUrl();
  scrollAtlasIntoView();
}

async function enterInstallRegionExplorer(country = state.selectedInstallCountry, requestedModelId = state.selectedInstallModel) {
  if (!country || !isInstallIntentView() || !manifestEntryForCountry(country)) return false;
  const selectedModel = installModelsForCountry(country)
    .find(model => installModelIdentifier(model) === String(requestedModelId || '')) || null;
  state.selectedInstallCountry = country;
  state.selectedInstallModel = selectedModel ? installModelIdentifier(selectedModel) : null;
  setInstallPanelOpen(false);
  renderInstallPanel(country, state.selectedInstallModel);
  const entered = await enterCountryDetail(country);
  if (!entered) {
    openInstallCountryPanel(country, state.selectedInstallModel);
    return false;
  }
  state.locked = { kind: 'admin1View', name: `${country.name} regional install-path view` };
  updateScopeInterface();
  syncInstallUrl();
  scrollAtlasIntoView();
  return true;
}

function focusInstallCountry(country, requestedModelId = '', options = {}) {
  if (!country || !isInstallIntentView()) return;
  if (!state.tourAdvancing) stopTour();
  state.admin1LoadToken += 1;
  setAdmin1Busy(false);
  if (state.scope !== 'world') exitToWorld();
  const selectedModel = installModelsForCountry(country)
    .find(model => installModelIdentifier(model) === String(requestedModelId || '')) || null;
  state.selectedInstallCountry = country;
  state.selectedInstallModel = selectedModel ? installModelIdentifier(selectedModel) : null;
  state.locked = country;
  const center = state.centers.get(country.name);
  if (center) beginFocusTransition(center, isMobileViewport() ? 9.35 : 7.65);
  state.lastInteractionAt = performance.now();
  updateSelectionOverlay(country);
  hideTooltip();
  if (spotlight) spotlight.hidden = true;
  renderInstallPanel(country, state.selectedInstallModel);
  if (options.exploreRegions !== false && manifestEntryForCountry(country)) {
    void enterInstallRegionExplorer(country, state.selectedInstallModel);
    return;
  }
  setInstallPanelOpen(true, { focus: true });
  syncInstallUrl();
  scrollAtlasIntoView();
}

function showGlobalInstallPanel(requestedModelId = '') {
  state.selectedInstallCountry = null;
  const selectedModel = installModelsForCountry(null)
    .find(model => installModelIdentifier(model) === String(requestedModelId || '')) || null;
  state.selectedInstallModel = selectedModel ? installModelIdentifier(selectedModel) : null;
  if (state.scope !== 'world') exitToWorld();
  state.locked = null;
  updateSelectionOverlay(null);
  setInstallPanelOpen(true, { focus: state.initialized });
  renderInstallPanel(null, state.selectedInstallModel);
  syncInstallUrl();
  scrollAtlasIntoView();
}

function resetInstallPanel() {
  state.selectedInstallCountry = null;
  state.selectedInstallModel = null;
  state.locked = null;
  setInstallPanelOpen(false);
  updateSelectionOverlay(null);
  renderInstallPanel(null, '');
  syncInstallUrl();
}

function openInstallRegionExplorer() {
  const country = state.selectedInstallCountry;
  if (!country) return;
  void enterInstallRegionExplorer(country, state.selectedInstallModel);
}

function brandIdentifier(brand) {
  return String(brand?.id || brand?.brandId || brand?.family || '');
}

function modelRowsForBrand(brand) {
  const models = brand?.models;
  return Array.isArray(models) ? models : [];
}

function modelRowSignals(model) {
  return Number(model?.visitors ?? model?.signals ?? model?.score) || 0;
}

function globalModelBrands() {
  const brands = state.data?.modelInterest?.global?.brands || state.data?.brands || [];
  return Array.isArray(brands) ? brands : [];
}

function setModelPanelOpen(open) {
  state.modelPanelOpen = Boolean(open);
  stage.classList.toggle('atlas-model-panel-open', state.modelPanelOpen);
  if (modelPanel && isModelInterestView()) {
    modelPanel.hidden = !state.modelPanelOpen;
  }
}

function focusModelPanelNavigation() {
  window.requestAnimationFrame(() => {
    if (!modelPanel || modelPanel.hidden) return;
    const back = modelPanel.querySelector('[data-atlas-model-back]');
    const close = modelPanel.querySelector('[data-atlas-model-close]');
    const target = back && !back.hidden ? back : close;
    target?.focus({ preventScroll: true });
  });
}

function syncModelUrl() {
  if (!isModelInterestView() || !state.initialized) return;
  const canonical = new URL(currentShareUrl());
  const url = new URL(window.location.href);
  ['view', 'range', 'country', 'region', 'regions', 'brand', 'family', 'model', 'area']
    .forEach(key => url.searchParams.delete(key));
  canonical.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.delete('v');
  window.history.replaceState({}, '', url);
}

function syncInstallUrl() {
  if (!isInstallIntentView() || !state.initialized) return;
  const canonical = new URL(currentShareUrl());
  const url = new URL(window.location.href);
  ['view', 'range', 'country', 'region', 'regions', 'brand', 'family', 'model', 'area']
    .forEach(key => url.searchParams.delete(key));
  canonical.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.delete('v');
  window.history.replaceState({}, '', url);
}

function humanModelFamily(value) {
  return String(value || 'LLM family')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function renderModelBrandButtons(container, brands, country, region = null) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  for (const brand of brands) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'atlas-model-family-button';
    const logo = document.createElement('img');
    logo.src = brand.logo;
    logo.alt = '';
    logo.width = 34;
    logo.height = 34;
    logo.loading = 'lazy';
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = brand.label;
    const detail = document.createElement('small');
    const publicModelCount = modelRowsForBrand(brand).length;
    detail.textContent = number(modelBrandSignals(brand)) + ' visitors · '
      + (publicModelCount
        ? number(publicModelCount) + ' ' + (publicModelCount === 1 ? 'model' : 'models') + ' published'
        : 'model detail below threshold');
    copy.append(name, detail);
    const arrow = document.createElement('b');
    arrow.textContent = '→';
    button.append(logo, copy, arrow);
    button.setAttribute('aria-label', 'Open ' + brand.label + ' model detail'
      + (region ? ' in ' + region.name : country ? ' in ' + country.name : ' worldwide'));
    button.addEventListener('click', () => {
      stopTour();
      state.selectedModelBrand = brandIdentifier(brand);
      setModelPanelOpen(true);
      renderModelPanel(country, state.selectedModelBrand, region);
      syncModelUrl();
      focusModelPanelNavigation();
    });
    item.append(button);
    fragment.append(item);
  }
  container.replaceChildren(fragment);
}

function publishedModelRegionForBoundary(region) {
  return region?.activityEntity || region || null;
}

function renderModelRegionButtons(container) {
  if (!container) return;
  const published = state.detailRankedRegions.slice();
  const publishedFeatures = new Set(published.flatMap(region => region.features || [region.feature]).filter(Boolean));
  const neutral = state.detailRegions
    .filter(region => !publishedFeatures.has(region.feature) && !region.activityEntity)
    .sort((left, right) => left.name.localeCompare(right.name));
  const fragment = document.createDocumentFragment();
  for (const sourceRegion of published) {
    const region = publishedModelRegionForBoundary(sourceRegion);
    const brand = dominantModelBrand(region);
    const visitors = Number(region?.modelVisitors ?? region?.signals);
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'atlas-model-region-button';
    button.classList.toggle('has-no-brand', !brand?.logo);
    if (sameModelRegion(region, state.selectedModelRegion)) button.classList.add('is-selected');
    if (brand?.logo) {
      const logo = document.createElement('img');
      logo.src = brand.logo;
      logo.alt = '';
      logo.width = 28;
      logo.height = 28;
      logo.loading = 'lazy';
      button.append(logo);
    }
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = region.name;
    const detail = document.createElement('small');
    detail.textContent = Number.isFinite(visitors) && visitors >= PUBLISH_THRESHOLD
      ? `${brand ? brand.label + (coLeadingModelBrands(region).length > 1 ? ' co-leads' : ' leads') + ' · ' : ''}${number(visitors)} visitors`
      : 'No regional brand detail published';
    copy.append(name, detail);
    const arrow = document.createElement('b');
    arrow.textContent = '→';
    button.append(copy, arrow);
    button.setAttribute('aria-label', Number.isFinite(visitors) && visitors >= PUBLISH_THRESHOLD
      ? `Open ${region.name} model interest${brand ? `, ${brand.label} ${coLeadingModelBrands(region).length > 1 ? 'co-leads' : 'leads'}` : ''}`
      : `Open ${region.name} boundary; no regional brand detail is published`);
    button.addEventListener('click', () => {
      focusModelRegion(region);
      focusModelPanelNavigation();
    });
    item.append(button);
    fragment.append(item);
  }
  if (neutral.length) {
    const remainder = document.createElement('li');
    remainder.className = 'atlas-model-region-list__remainder';
    const disclosure = document.createElement('details');
    const summary = document.createElement('summary');
    const label = document.createElement('strong');
    label.textContent = `${number(neutral.length)} other region${neutral.length === 1 ? '' : 's'} remain neutral`;
    const detail = document.createElement('small');
    detail.textContent = 'Open the list to select one. Neutral does not mean zero.';
    const arrow = document.createElement('b');
    arrow.textContent = '⌄';
    summary.append(label, detail, arrow);
    const neutralList = document.createElement('ul');
    neutralList.setAttribute('aria-label', 'Regions without a published model-brand total');
    for (const region of neutral) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = region.name;
      button.setAttribute('aria-label', `Open ${region.name}; no regional model-brand detail is published`);
      button.addEventListener('click', () => {
        focusModelRegion(region);
        focusModelPanelNavigation();
      });
      item.append(button);
      neutralList.append(item);
    }
    disclosure.append(summary, neutralList);
    remainder.append(disclosure);
    fragment.append(remainder);
  }
  container.replaceChildren(fragment);
}

function renderModelRows(container, brand) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  const models = modelRowsForBrand(brand)
    .slice()
    .sort((left, right) => modelRowSignals(right) - modelRowSignals(left)
      || String(left.label || left.name || left.id).localeCompare(String(right.label || right.name || right.id)));
  if (!models.length) {
    const empty = document.createElement('li');
    empty.className = 'atlas-model-list__empty';
    empty.textContent = `This brand reaches the public visitor threshold, but no individual model page independently reaches ${PUBLISH_THRESHOLD} visitors in this scope.`;
    fragment.append(empty);
  }
  models.forEach((model, index) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const modelId = String(model.id || model.modelId || '');
    link.href = model.path || ('/models/' + encodeURIComponent(modelId));
    const rank = document.createElement('b');
    rank.textContent = String(index + 1).padStart(2, '0');
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = model.label || model.name || modelId;
    const family = document.createElement('small');
    family.textContent = humanModelFamily(model.family) + ' · ' + number(modelRowSignals(model)) + ' visitors';
    copy.append(name, family);
    const value = document.createElement('em');
    value.textContent = number(modelRowSignals(model));
    link.append(rank, copy, value);
    item.append(link);
    fragment.append(item);
  });
  container.replaceChildren(fragment);
}

function renderModelPanel(country = state.selectedModelCountry, selectedBrandId = state.selectedModelBrand, region = state.selectedModelRegion) {
  if (!modelPanel || !isModelInterestView()) return;
  modelPanel.hidden = !state.modelPanelOpen;
  const regionalListView = Boolean(country && isAdmin1Scope() && !region);
  const scopeEntity = region || country;
  const brands = region ? modelBrandsForCountry(region) : country ? modelBrandsForCountry(country) : globalModelBrands();
  const dominant = scopeEntity ? dominantModelBrand(scopeEntity) : brands[0] || null;
  const dominantCount = scopeEntity
    ? coLeadingModelBrands(scopeEntity).length
    : dominant
      ? brands.filter(brand => modelBrandSignals(brand) === modelBrandSignals(dominant)).length
      : 0;
  const selected = brands.find(brand => brandIdentifier(brand) === selectedBrandId) || null;
  const selectedCountryCount = !country && selected
    ? state.countries.filter(candidate => modelBrandsForCountry(candidate)
      .some(brand => brandIdentifier(brand) === brandIdentifier(selected))).length
    : 0;
  syncModelMarkerBrands(country, selected);
  syncModelRegionMarkerBrands(selected);
  const modelLegendCopy = modelLegend?.querySelector('small');
  if (modelLegendCopy) {
    const selectedIsLeader = scopeEntity && selected ? coLeadingModelBrands(scopeEntity).includes(selected) : true;
    modelLegendCopy.textContent = !country && selected
      ? selectedCountryCount
        ? `${selected.label} · ${number(selectedCountryCount)} countr${selectedCountryCount === 1 ? 'y' : 'ies'} published`
        : `${selected.label} · no country independently reaches ${PUBLISH_THRESHOLD}`
      : region && selected
        ? `${selected.label} across published ${state.detailConfig?.regionsLabel || 'regions'}`
        : isAdmin1Scope()
          ? 'Most explored published model brand in each region'
          : selectedIsLeader
            ? 'Most explored local model brand'
            : 'Selected brand in focus · other logos show leaders';
  }
  const countryLabel = modelPanel.querySelector('[data-atlas-model-country]');
  const panelTitle = modelPanel.querySelector('[data-atlas-model-title]');
  const dominantLogo = modelPanel.querySelector('[data-atlas-model-dominant-logo]');
  const dominantFamily = modelPanel.querySelector('[data-atlas-model-dominant-family]');
  const dominantSummary = modelPanel.querySelector('[data-atlas-model-dominant-summary]');
  const familyCount = modelPanel.querySelector('[data-atlas-model-family-count]');
  const requestCount = modelPanel.querySelector('[data-atlas-model-request-count]');
  const familyList = modelPanel.querySelector('[data-atlas-model-family-list]');
  const regionsButton = modelPanel.querySelector('[data-atlas-model-regions]');
  const regionView = modelPanel.querySelector('[data-atlas-model-region-view]');
  const regionStatus = modelPanel.querySelector('[data-atlas-model-region-status]');
  const regionTotal = modelPanel.querySelector('[data-atlas-model-region-total]');
  const regionCount = modelPanel.querySelector('[data-atlas-model-region-count]');
  const regionList = modelPanel.querySelector('[data-atlas-model-region-list]');
  const brandLogo = modelPanel.querySelector('[data-atlas-model-brand-logo]');
  const brandName = modelPanel.querySelector('[data-atlas-model-brand-name]');
  const brandSummary = modelPanel.querySelector('[data-atlas-model-brand-summary]');
  const modelList = modelPanel.querySelector('[data-atlas-model-list]');
  const overview = modelPanel.querySelector('[data-atlas-model-overview]');
  const brandView = modelPanel.querySelector('[data-atlas-model-brand-view]');
  const empty = modelPanel.querySelector('[data-atlas-model-empty]');
  const emptyTitle = modelPanel.querySelector('[data-atlas-model-empty-title]');
  const emptyCopy = modelPanel.querySelector('[data-atlas-model-empty-copy]');
  const back = modelPanel.querySelector('[data-atlas-model-back]');
  if (countryLabel) countryLabel.textContent = region
    ? `${region.name} · ${country.name}`
    : regionalListView
      ? `${country.name} · ${state.detailConfig?.viewLabel || 'Regional view'}`
      : country ? country.name : 'Worldwide model interest';
  if (panelTitle) panelTitle.textContent = regionalListView ? 'Model interest by region' : 'Most explored models';
  if (dominantLogo) {
    dominantLogo.src = dominant?.logo || '';
    dominantLogo.alt = '';
    dominantLogo.hidden = !dominant;
  }
  if (dominantFamily) dominantFamily.textContent = dominant
    ? dominant.label + (dominantCount > 1 ? ` · ${dominantCount}-way tie` : '')
    : 'Collecting enough signals';
  if (dominantSummary) dominantSummary.textContent = dominant
    ? number(modelBrandSignals(dominant)) + ' unique visitors explored this brand across its eligible LocalClaw model pages.'
      + (dominantCount > 1 ? ' It shares the lead in this scope.' : '')
    : 'No individual LLM page reaches five anonymous visitors in this scope yet.';
  if (familyCount) familyCount.textContent = number(brands.length);
  const visitorTotal = region
    ? publishedRegionalModelVisitors(region)
    : country ? publishedModelCountryVisitors(country)
    : Number(state.data?.totals?.modelVisitors ?? state.data?.totals?.signals) || 0;
  if (requestCount) requestCount.textContent = visitorTotal === null ? '—' : number(visitorTotal);
  renderModelBrandButtons(familyList, brands, country, region);
  if (regionsButton) {
    regionsButton.hidden = !country || Boolean(region) || isAdmin1Scope() || !manifestEntryForCountry(country);
    const heading = regionsButton.querySelector('strong');
    if (heading) heading.textContent = `Explore ${country?.name || ''} regions`;
  }
  if (regionStatus) regionStatus.textContent = state.detailDataStatus === 'published'
    ? `Published regional model-page totals and brand rows independently meet the ${state.detailTotals.publishThreshold || PUBLISH_THRESHOLD}-visitor threshold.`
    : admin1StatusMessage();
  if (regionTotal) {
    const countryVisitors = state.detailTotals.countrySignals ?? publishedModelCountryVisitors(country);
    regionTotal.textContent = countryVisitors === null ? '—' : number(countryVisitors);
  }
  if (regionCount) regionCount.textContent = Number.isFinite(state.detailTotals.regions)
    ? number(state.detailTotals.regions)
    : number(state.detailRankedRegions.length);
  if (regionalListView) renderModelRegionButtons(regionList);
  else if (regionList) regionList.replaceChildren();
  if (brandLogo) {
    brandLogo.src = selected?.logo || '';
    brandLogo.alt = '';
    brandLogo.hidden = !selected;
  }
  if (brandName) brandName.textContent = selected?.label || '';
  if (brandSummary) brandSummary.textContent = selected
    ? region
      ? number(modelBrandSignals(selected)) + ' unique visitors explored at least one eligible ' + selected.label + ' model page in ' + region.name + '.'
      : country
        ? number(modelBrandSignals(selected)) + ' unique visitors explored at least one eligible ' + selected.label + ' model page here.'
      : number(modelBrandSignals(selected)) + ' unique visitors explored at least one eligible ' + selected.label + ' model page worldwide. '
        + (selectedCountryCount
          ? `The globe shows the ${number(selectedCountryCount)} countr${selectedCountryCount === 1 ? 'y' : 'ies'} where this brand independently reaches the public threshold.`
          : `No individual country independently reaches the ${PUBLISH_THRESHOLD}-visitor threshold for this brand, so the globe is intentionally clear.`)
    : '';
  if (selected) renderModelRows(modelList, selected);
  else if (modelList) modelList.replaceChildren();
  if (overview) overview.hidden = regionalListView || Boolean(selected) || !brands.length;
  if (regionView) regionView.hidden = !regionalListView;
  if (brandView) brandView.hidden = !selected;
  const showEmpty = !regionalListView && !selected && !brands.length;
  if (empty) empty.hidden = !showEmpty;
  if (emptyTitle) emptyTitle.textContent = region ? 'No regional brand detail published' : 'No publishable model detail yet';
  if (emptyCopy) emptyCopy.textContent = region
    ? publishedRegionalModelVisitors(region) !== null
      ? `This region has a published all-model total, but no individual brand independently reaches ${PUBLISH_THRESHOLD} visitors for this period.`
      : admin1EntityStatusMessage(region)
    : 'This place has no model brand above the public threshold for the selected period.';
  if (back) {
    back.hidden = !selected && !country;
    back.textContent = selected
      ? region ? '← Region' : '← All brands'
      : region ? '← Regions'
        : regionalListView ? '← Country' : '← World';
    back.setAttribute('aria-label', selected
      ? region ? `Return to ${region.name} brand overview` : 'Return to the model-brand overview'
      : region ? `Return to ${country.name} regional overview`
        : regionalListView ? `Return to ${country.name} country model overview` : 'Return to the world model view');
  }
  modelPanel.dataset.scope = selected ? 'brand' : region ? 'region' : regionalListView ? 'regions' : country ? 'country' : 'world';
}

function focusModelCountry(country, requestedBrandId = '', options = {}) {
  if (!country || !isModelInterestView()) return;
  if (!state.tourAdvancing) stopTour();
  // A country selection supersedes any Admin-1 shard still loading for a
  // previous country, even while both interactions happened in world scope.
  state.admin1LoadToken += 1;
  setAdmin1Busy(false);
  state.selectedModelRegion = null;
  if (state.scope !== 'world') exitToWorld();
  const requestedBrand = modelBrandsForCountry(country)
    .find(brand => brandIdentifier(brand) === String(requestedBrandId || '')) || null;
  state.selectedModelCountry = country;
  state.selectedModelBrand = requestedBrand ? brandIdentifier(requestedBrand) : null;
  state.locked = country;
  const center = state.centers.get(country.name);
  if (center) beginFocusTransition(center, isMobileViewport() ? 9.35 : 7.65);
  state.lastInteractionAt = performance.now();
  updateSelectionOverlay(country);
  hideTooltip();
  if (spotlight) spotlight.hidden = true;
  setModelPanelOpen(true);
  renderModelPanel(country, state.selectedModelBrand, null);
  syncModelUrl();
  if (options.exploreRegions !== false && !requestedBrandId && manifestEntryForCountry(country)) {
    void enterModelRegionExplorer(country);
    return;
  }
  scrollAtlasIntoView();
}

async function enterModelRegionExplorer(country = state.selectedModelCountry) {
  if (!country || !isModelInterestView() || !manifestEntryForCountry(country)) return false;
  state.selectedModelCountry = country;
  state.selectedModelRegion = null;
  state.selectedModelBrand = null;
  setModelPanelOpen(true);
  const entered = await enterCountryDetail(country);
  if (!entered) {
    renderModelPanel(country, '', null);
    return false;
  }
  renderModelPanel(country, '', null);
  syncModelUrl();
  return true;
}

function focusModelRegion(region, requestedBrandId = '') {
  if (!region || !isModelInterestView() || !isAdmin1Scope()) return;
  if (!state.tourAdvancing) stopTour();
  const resolvedRegion = publishedModelRegionForBoundary(region);
  const requestedBrand = modelBrandsForCountry(resolvedRegion)
    .find(brand => brandIdentifier(brand) === String(requestedBrandId || '')) || null;
  state.selectedModelRegion = resolvedRegion;
  state.selectedModelBrand = requestedBrand ? brandIdentifier(requestedBrand) : null;
  state.locked = resolvedRegion;
  const center = resolvedRegion.center || state.centers.get(state.detailCountry.name);
  const bounds = resolvedRegion.bounds;
  const bbox = bounds ? [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat] : state.detailManifest?.bbox;
  if (center) beginFocusTransition(center, admin1ZoomForBbox(bbox, isMobileViewport()));
  state.lastInteractionAt = performance.now();
  updateSelectionOverlay(resolvedRegion);
  hideTooltip();
  if (spotlight) spotlight.hidden = true;
  setModelPanelOpen(true);
  renderModelPanel(state.selectedModelCountry, state.selectedModelBrand, resolvedRegion);
  updateScopeInterface();
  syncModelUrl();
  scrollAtlasIntoView();
}

function showModelRegionOverview() {
  if (!isModelInterestView() || !isAdmin1Scope() || !state.selectedModelCountry) return;
  state.selectedModelRegion = null;
  state.selectedModelBrand = null;
  state.locked = { kind: 'admin1View', name: `${state.selectedModelCountry.name} regional model view` };
  updateSelectionOverlay(null);
  const center = state.centers.get(state.selectedModelCountry.name);
  if (center) beginFocusTransition(center, defaultZoom('admin1'));
  setModelPanelOpen(true);
  renderModelPanel(state.selectedModelCountry, '', null);
  updateScopeInterface();
  syncModelUrl();
}

function resetModelPanel() {
  stopTour();
  state.selectedModelCountry = null;
  state.selectedModelRegion = null;
  state.selectedModelBrand = null;
  if (state.scope !== 'world') exitToWorld();
  state.locked = null;
  setModelPanelOpen(false);
  updateSelectionOverlay(null);
  renderModelPanel(null, '');
  syncModelUrl();
}

function showGlobalModelPanel() {
  state.selectedModelCountry = null;
  state.selectedModelRegion = null;
  state.selectedModelBrand = null;
  exitToWorld();
  setModelPanelOpen(true);
  renderModelPanel(null, '');
  syncModelUrl();
  scrollAtlasIntoView();
}

function focusCountry(country) {
  if (!state.tourAdvancing) stopTour();
  if (isModelInterestView()) {
    focusModelCountry(country);
    return;
  }
  if (isInstallIntentView()) {
    focusInstallCountry(country);
    return;
  }
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
  if (isInstallIntentView()) syncInstallUrl();
  scrollAtlasIntoView();
}

async function enterAdmin2Detail(parent, parentScope = state.scope) {
  const config = admin2ConfigForParent(parent, parentScope);
  if (!parent || !config) {
    showToast('No finer licensed boundary layer is available for this region yet.');
    return false;
  }
  if (Number(config.featureCount) <= 1) {
    if (parentScope === 'us') focusRegion(parent);
    else focusAdmin1Region(parent);
    showToast(`${config.parentName} has no finer ${config.childrenLabel} in the current licensed source.`);
    return false;
  }
  const requestToken = ++state.admin2LoadToken;
  if (!state.tourAdvancing) stopTour();
  if (parentScope === 'us') focusRegion(parent);
  else focusAdmin1Region(parent);
  setAdmin2Busy(true, config);
  showToast(`Loading ${config.parentName} ${config.childrenLabel}…`);
  try {
    const shard = await loadAdmin2Shard(config);
    if (requestToken !== state.admin2LoadToken) return false;
    clearAdmin2Layer();
    state.admin2Parent = parent;
    state.admin2ParentScope = parentScope;
    state.admin2Config = config;
    if (!buildAdmin2Regions(shard, parent, config)) throw new Error('No detailed polygons are available.');
    createAdmin2Layer();
    state.scope = 'admin2';
    state.locked = { kind: 'admin2View', name: `${config.parentName} detailed boundary view` };
    state.rotationVelocity.set(0, 0);
    state.lastInteractionAt = performance.now();
    setStateLineSelection(null);
    updateSelectionOverlay(null);
    hideTooltip();
    spotlight.hidden = true;
    updateScopeInterface();
    if (isInstallIntentView()) syncInstallUrl();
    const center = parent.center || (parentScope === 'us' ? state.usCenters.get(parent.name) : null);
    if (center) beginFocusTransition(center, defaultZoom('admin2'));
    showToast(`${config.parentName} · ${number(state.admin2Regions.length)} ${config.childrenLabel} loaded`);
    scrollAtlasIntoView();
    return true;
  } catch (error) {
    if (requestToken !== state.admin2LoadToken) return false;
    console.error(error);
    clearAdmin2Layer();
    showToast(`${config.parentName} detailed boundaries are temporarily unavailable.`);
    return false;
  } finally {
    if (requestToken === state.admin2LoadToken) setAdmin2Busy(false);
  }
}

function focusAdmin2Region(region) {
  if (!region || !isAdmin2Scope()) return;
  if (!state.tourAdvancing) stopTour();
  state.locked = region;
  syncRegionPanelSelection(region);
  const bbox = region.bounds
    ? [region.bounds.minLon, region.bounds.minLat, region.bounds.maxLon, region.bounds.maxLat]
    : state.admin2Config.bbox;
  if (region.center) beginFocusTransition(region.center, admin1ZoomForBbox(bbox, isMobileViewport(), region.longitudeSpan));
  state.lastInteractionAt = performance.now();
  updateSelectionOverlay(region);
  showSpotlight(region);
  if (isInstallIntentView()) syncInstallUrl();
  scrollAtlasIntoView();
}

function activateUsRegion(region) {
  const config = admin2ConfigForParent(region, 'us');
  if (config) void enterAdmin2Detail(region, 'us');
  else focusRegion(region);
}

function activateAdmin1Region(region) {
  if (isModelInterestView()) {
    focusModelRegion(region);
    return;
  }
  const config = admin2ConfigForParent(region, 'admin1');
  if (config) void enterAdmin2Detail(region, 'admin1');
  else focusAdmin1Region(region);
}

function exitAdmin2() {
  if (!isAdmin2Scope()) return;
  const parent = state.admin2Parent;
  const parentScope = state.admin2ParentScope;
  state.admin2LoadToken += 1;
  setAdmin2Busy(false);
  state.scope = parentScope;
  clearAdmin2Layer();
  state.locked = null;
  updateSelectionOverlay(null);
  hideTooltip();
  spotlight.hidden = true;
  updateScopeInterface();
  if (parentScope === 'us') focusRegion(parent);
  else focusAdmin1Region(parent);
}

function findEntityByName(entities, value) {
  const normalize = candidate => String(candidate || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, '');
  const expected = normalize(value);
  if (!expected) return null;
  return entities.find(entity => [entity.name, entity.sourceName, entity.label, entity.code]
    .some(candidate => normalize(candidate) === expected)) || null;
}

async function applyRequestedView() {
  if (isModelInterestView() && !requestedView.country) {
    if (requestedView.brand && globalModelBrands().some(brand => brandIdentifier(brand) === requestedView.brand)) {
      state.selectedModelBrand = requestedView.brand;
      setModelPanelOpen(true);
      renderModelPanel(null, requestedView.brand);
      syncModelUrl();
    } else if (requestedView.brand || requestedView.region || requestedView.regions) {
      syncModelUrl();
    }
    return;
  }
  if (isInstallIntentView() && !requestedView.country) {
    if (requestedView.model && installModelsForCountry(null)
      .some(model => installModelIdentifier(model) === requestedView.model)) {
      showGlobalInstallPanel(requestedView.model);
    }
    return;
  }
  if (!requestedView.country) return;
  const country = findEntityByName(isModelInterestView() ? state.worldCountries : state.countries, requestedView.country);
  if (!country) {
    if (isModelInterestView()) syncModelUrl();
    return;
  }

  if (isModelInterestView()) {
    if (!requestedView.region) {
      if (requestedView.brand && !requestedView.regions) {
        focusModelCountry(country, requestedView.brand, { exploreRegions: false });
      } else {
        focusModelCountry(country, '', { exploreRegions: false });
        await enterModelRegionExplorer(country);
      }
      return;
    }
    focusModelCountry(country, '', { exploreRegions: false });
    const entered = await enterModelRegionExplorer(country);
    if (!entered) return;
    const matchedBoundary = findEntityByName(state.detailRegions, requestedView.region);
    const region = findEntityByName(state.detailRankedRegions, requestedView.region)
      || matchedBoundary?.activityEntity
      || matchedBoundary;
    if (region) focusModelRegion(region, requestedView.brand);
    return;
  }

  if (isInstallIntentView()) {
    if (requestedView.model && !requestedView.region && !requestedView.regions) {
      focusInstallCountry(country, requestedView.model, { exploreRegions: false });
      return;
    }
    const entered = await enterInstallRegionExplorer(country, requestedView.model);
    if (!entered || !requestedView.region) return;
    const matchedBoundary = findEntityByName(state.detailRegions, requestedView.region);
    const region = findEntityByName(state.detailRankedRegions, requestedView.region)
      || matchedBoundary?.activityEntity
      || matchedBoundary;
    if (!region) return;
    if (requestedView.area && admin2ConfigForParent(region, 'admin1')) {
      const enteredArea = await enterAdmin2Detail(region, 'admin1');
      if (enteredArea) {
        const area = findEntityByName(state.admin2Regions, requestedView.area);
        if (area) focusAdmin2Region(area);
      }
    } else {
      focusAdmin1Region(region);
    }
    return;
  }

  if (country.adm0A3 === 'USA') {
    enterUnitedStates();
    const region = findEntityByName(state.usAllRegions, requestedView.region);
    if (!region) return;
    if (requestedView.area && admin2ConfigForParent(region, 'us')) {
      const entered = await enterAdmin2Detail(region, 'us');
      if (entered) {
        const area = findEntityByName(state.admin2Regions, requestedView.area);
        if (area) focusAdmin2Region(area);
      }
    } else {
      focusRegion(region);
    }
    return;
  }

  if (!manifestEntryForCountry(country)) {
    focusCountrySurface(country);
    return;
  }

  const entered = await enterCountryDetail(country);
  if (!entered || !requestedView.region) return;
  const matchedBoundary = findEntityByName(state.detailRegions, requestedView.region);
  const region = findEntityByName(state.detailRankedRegions, requestedView.region)
    || matchedBoundary?.activityEntity
    || matchedBoundary;
  if (!region) return;
  if (requestedView.area && admin2ConfigForParent(region, 'admin1')) {
    const enteredArea = await enterAdmin2Detail(region, 'admin1');
    if (enteredArea) {
      const area = findEntityByName(state.admin2Regions, requestedView.area);
      if (area) focusAdmin2Region(area);
    }
  } else {
    focusAdmin1Region(region);
  }
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
  const installIntentView = isInstallIntentView();
  const modelInterestView = isModelInterestView();
  const stateView = state.scope === 'us';
  const admin1View = isAdmin1Scope();
  const admin2View = isAdmin2Scope();
  const modelRegionalView = modelInterestView && admin1View;
  const modelRegion = modelRegionalView ? state.selectedModelRegion : null;
  const modelCountry = modelRegionalView ? (state.selectedModelCountry || state.detailCountry) : null;
  const modelRegionVisitors = publishedRegionalModelVisitors(modelRegion);
  const regionalView = stateView || admin1View || admin2View;
  stage.classList.toggle('atlas-scope-us', regionalView);
  stage.classList.toggle('atlas-scope-admin1', admin1View || admin2View);
  stage.classList.toggle('atlas-scope-admin2', admin2View);
  stage.classList.toggle('atlas-view-models', modelInterestView);
  stage.classList.toggle('atlas-view-installed', installIntentView);
  if (state.camera && state.renderer) resize();
  if (regionPanel) regionPanel.hidden = modelInterestView || !regionalView;
  if (modelPanel) modelPanel.hidden = !modelInterestView || !state.modelPanelOpen;
  if (installPanel) installPanel.hidden = !installIntentView || !state.installPanelOpen;
  if (modelLegend) {
    modelLegend.hidden = !modelInterestView && !installIntentView;
    if (installIntentView) {
      const legendCopy = modelLegend.querySelector('small');
      if (legendCopy) legendCopy.textContent = admin1View
        ? 'Leading published country setup path · country-level'
        : 'Leading published setup path by country';
    }
  }
  if (modelLogoLayer) modelLogoLayer.hidden = !modelInterestView && !installIntentView;
  if (modelInterestView) {
    const colorLegendCopy = document.querySelector('[data-atlas-color-legend] small');
    if (colorLegendCopy) colorLegendCopy.textContent = modelRegionalView
      ? 'All-model regional visitors'
      : 'All-model country visitors';
  } else if (installIntentView) {
    const colorLegendCopy = document.querySelector('[data-atlas-color-legend] small');
    if (colorLegendCopy) colorLegendCopy.textContent = admin1View
      ? 'Published regional install-intent visitors'
      : 'Country install-intent visitors';
  }
  state.worldActivity.forEach(object => { object.visible = !regionalView; });
  if (state.usGroup) state.usGroup.visible = stateView || (admin2View && state.admin2ParentScope === 'us');
  if (state.detailGroup) state.detailGroup.visible = admin1View || (admin2View && state.admin2ParentScope === 'admin1');
  if (state.admin2Group) state.admin2Group.visible = admin2View;
  if (tourButton) tourButton.hidden = admin2View;
  updateClusterVisibility();
  if (modelRegionalView && modelRegion) setAtlasTitle('See model interest in', `${modelRegion.name}.`);
  else if (modelRegionalView) setAtlasTitle('See which local AI brands', `lead across ${modelCountry?.name || 'this country'}.`);
  else if (modelInterestView) setAtlasTitle('See which local AI brands', 'each country is exploring.');
  else if (stateView) setAtlasTitle(`See local AI ${installIntentView ? 'install intent' : 'interest'}`, 'state by state.');
  else if (admin1View) setAtlasTitle(`See local AI ${installIntentView ? 'install intent' : 'interest'}`, state.detailConfig.titleEmphasis);
  else if (admin2View) setAtlasTitle(`Explore ${state.admin2Config.parentName}`, `${state.admin2Config.childrenLabel}.`);
  else if (installIntentView) setAtlasTitle('See which local AI stacks', 'people choose.');
  else setAtlasTitle('See where', 'local AI is taking off.');
  if (summary) {
    summary.textContent = modelRegionalView
      ? modelRegion
        ? `${modelRegion.name}, ${modelCountry?.name || state.detailCountry?.name || ''} · Approximate network region · ${periodDateRange()}`
        : `${modelCountry?.name || state.detailCountry?.name || ''} · Privacy-thresholded regional model-page interest · ${periodDateRange()}`
      : modelInterestView
        ? `Anonymous LLM model-page visitors · ${number(state.data.totals.countriesWithPublishedBrands ?? state.data.totals.regions)} countries show a privacy-thresholded brand · ${periodLabel()}`
        : stateView
      ? `United States · Approximate network regions · ${periodDateRange()}`
      : admin1View
        ? `${state.detailCountry.name} · Approximate network regions · ${periodDateRange()}`
        : admin2View
          ? `${state.admin2Config.countryName} · ${state.admin2Config.parentName} · Cartographic boundaries · No subdivision-level activity totals`
        : installIntentView
          ? `Model paths and setup destinations selected by anonymous visitors · ${number(state.data.totals.publishedRegions)} countries published at 5+ · ${periodLabel()} · Tracking since 21 August 2026`
          : `Anonymous interest aggregates · ${number(state.data.totals.publishedRegions)} countries published at 5+ signals · ${periodLabel()} · Updated 29 August 2026`;
  }
  if (liveLabel) liveLabel.textContent = modelRegionalView
    ? modelRegion ? 'Regional model detail' : 'Regional model interest exploration'
    : modelInterestView
      ? 'Model interest exploration'
    : stateView
    ? 'State-level exploration'
    : admin1View
      ? state.detailConfig.liveLabel
      : admin2View
        ? state.admin2Config.liveLabel
      : installIntentView ? 'Install-path exploration' : 'Live exploration';
  const scopeSignals = modelRegionalView
    ? modelRegion
      ? modelRegionVisitors
      : (state.detailTotals.countrySignals ?? publishedModelCountryVisitors(modelCountry))
    : modelInterestView
      ? (state.data.totals.modelVisitors ?? state.data.totals.signals)
    : stateView
    ? state.usData.totals.publishedSignals
    : admin1View
      ? state.detailTotals.signals
      : admin2View
        ? state.admin2Config.parentSignals
      : (state.data.totals.publishedSignals ?? state.data.totals.signals);
  const scopeRegions = modelRegionalView
    ? modelRegion
      ? modelBrandsForCountry(modelRegion).length
      : state.detailTotals.regions
    : modelInterestView
      ? (state.data.totals.countriesWithPublishedBrands ?? state.data.totals.regions)
    : stateView
    ? state.usData.totals.publishedRegions
    : admin1View
      ? state.detailTotals.regions
      : admin2View
        ? state.admin2Regions.length
      : (state.data.totals.publishedRegions ?? state.data.totals.regions);
  document.querySelector('[data-scope-signals]').textContent = metric(scopeSignals);
  document.querySelector('[data-scope-regions]').textContent = admin1View && !Number.isFinite(scopeRegions)
    ? number(state.detailRegions.length)
    : metric(scopeRegions);
  document.querySelector('[data-scope-signal-label]').textContent = modelRegionalView
    ? modelRegion
      ? modelRegionVisitors !== null ? 'regional model-page visitors' : 'regional total not published'
      : 'country model-page visitors'
    : modelInterestView
      ? 'anonymous model-page visitors'
    : stateView
    ? installIntentView ? 'visible state install-intent visitors' : 'visible state signals'
    : admin1View
      ? installIntentView
        ? state.detailDataStatus === 'published'
          ? 'published regional install-intent visitors'
          : state.detailDataStatus === 'unavailable'
            ? 'regional data unavailable'
            : state.detailDataStatus === 'not_collected'
              ? 'regional data not collected'
              : 'no regional total above threshold'
        : state.detailDataStatus === 'published'
          ? 'published regional signals'
        : state.detailDataStatus === 'unavailable'
          ? 'regional data unavailable'
          : state.detailDataStatus === 'not_collected'
            ? 'regional data not collected'
            : state.detailDataStatus === 'boundary_unresolved'
              ? 'boundary mapping unresolved'
              : 'no total above threshold'
      : admin2View
        ? Number.isFinite(scopeSignals)
          ? state.admin2Config.parentSignalLabel
          : 'parent aggregate not published'
      : publishedSignalLabel();
  document.querySelector('[data-scope-region-label]').textContent = modelRegionalView
    ? modelRegion
      ? 'regional brands published'
      : Number.isFinite(state.detailTotals.regions)
        ? `${state.detailConfig.regionsLabel} published`
        : `${state.detailConfig.regionsLabel} shown`
    : modelInterestView
      ? 'countries with published brands'
    : stateView
    ? 'states published'
    : admin1View
      ? Number.isFinite(state.detailTotals.regions)
        ? `${state.detailConfig.regionsLabel} published`
        : `${state.detailConfig.regionsLabel} shown`
      : admin2View
        ? `${state.admin2Config.childrenLabel} shown`
      : 'countries published';
  document.querySelector('[data-scope-window]').textContent = admin2View
    ? 'boundary view · no subdivision totals'
    : modelRegionalView
      ? `${state.detailTotals.publishThreshold || PUBLISH_THRESHOLD}-visitor threshold`
    : regionalView
      ? `${admin1View ? state.detailTotals.publishThreshold : 5}-${installIntentView ? 'visitor' : 'signal'} threshold`
    : `${periodDays()}-day window`;
  document.querySelector('[data-scope-disclosure]').textContent = modelRegionalView
    ? 'Region color shows independently published all-model visitors. Each logo is the leading published brand in that region; a selected brand appears only where it independently reaches five visitors. Neutral boundaries and absent logos do not mean zero. This measures LocalClaw page interest, not downloads, installations, launches, inference or verified usage.'
    : modelInterestView
      ? 'Each logo is the brand with the most unique visitors across its eligible LLM pages in that country. Every displayed model page reached at least five visitors. This measures exploration on LocalClaw, not downloads, installations, launches, inference or verified usage.'
    : installIntentView
    ? regionalView
      ? 'Regional boundaries remain visible for exploration. No regional install-intent total reached the five-visitor publication threshold in this snapshot; neutral does not mean zero. A click does not verify a completed installation or local run.'
      : 'Country color shows unique visitors who selected an eligible setup, repository, or desktop-app path. The panel publishes model paths and setup destinations only at five unique visitors. No completed installation or local model run is verified.'
    : stateView
    ? 'State color is the aggregate. Beacons mark published DataFast city clusters at approximate GeoNames city centroids.'
    : admin1View
      ? state.detailDataStatus === 'published'
        ? 'Region color shows an independently published subnational aggregate. Neutral boundaries have no published regional total. Beacons are a separate city-cluster breakdown.'
        : `${admin1StatusMessage()} Beacons are a separate published city-cluster breakdown.`
      : admin2View
        ? `${state.admin2Config.childrenLabel} are neutral cartographic references. DataFast does not provide totals at this level; neutral does not mean zero. Beacons are separate published city clusters, not subdivision totals.`
      : 'Country color is the aggregate. Beacons mark published DataFast city clusters at approximate GeoNames city centroids.';
  canvas.setAttribute('aria-label', modelRegionalView
    ? `Interactive globe showing privacy-thresholded model-page interest across ${state.detailConfig.regionsLabel} in ${modelCountry?.name || state.detailCountry?.name}. Region color represents all-model visitors and logos represent the leading published brand. Select a region or logo for regional brand and model detail. Neutral boundaries and absent logos do not mean zero. Use the panel back control to return.`
    : modelInterestView
      ? 'Interactive globe showing the most explored local LLM brand in each eligible country. Select a brand logo or country to open its privacy-thresholded model ranking. Drag to rotate and scroll or use the controls to zoom.'
    : installIntentView
    ? regionalView
      ? `Interactive globe showing ${stateView ? 'U.S. states' : admin1View ? state.detailConfig.regionsLabel : state.admin2Config.childrenLabel} as neutral boundaries because no regional install-intent aggregate reached five visitors. Use the back control to return.`
      : 'Interactive globe showing anonymous LocalClaw install-intent visitors by country. Select a country to inspect its privacy-thresholded model, setup-destination, and modality paths. Color appears only at five or more unique visitors; no completed installation or local run is verified.'
    : stateView
    ? 'Interactive globe showing anonymous LocalClaw interest signals by U.S. state. Select a state to open its counties and equivalents; select a visible city label to inspect its separate cluster. Drag to rotate, select the map and scroll or use the visible controls to zoom, or return to the world view.'
    : admin1View
      ? `Interactive globe showing published LocalClaw interest aggregates by ${state.detailConfig.regionsLabel} in ${state.detailCountry.name}. Where a licensed finer boundary layer is available, select a region again to open it. Select a visible city label to inspect its separate cluster. Neutral boundaries are orientation references only. Use World to return.`
      : admin2View
        ? `Interactive globe showing neutral ${state.admin2Config.childrenLabel} inside ${state.admin2Config.parentName}. Select a boundary to focus it; select a visible city label to inspect its separate published cluster. No activity total is published for these subdivisions. Use Back to return to the parent view.`
      : 'Interactive globe showing anonymous local AI interest signals by country. Select the map to open the country under the pointer; select a visible city label to inspect its cluster. Drag to rotate, select the map and scroll or use the visible controls to zoom, or use the country ranking below.');

  if (regionPanel && regionalView) {
    const panelTitle = regionPanel.querySelector('.atlas-region-panel__head span');
    const backButton = regionPanel.querySelector('[data-atlas-world-reset]');
    const metricItems = regionPanel.querySelectorAll('.atlas-region-panel__metrics span');
    const note = regionPanel.querySelector('.atlas-region-panel__note');
    regionPanel.setAttribute('aria-label', stateView
      ? 'United States state activity'
      : admin2View
        ? `${state.admin2Config.parentName} ${state.admin2Config.childrenLabel} boundary explorer`
      : `${state.detailCountry.name} ${state.detailConfig.regionsLabel} activity`);
    if (backButton) {
      backButton.textContent = admin2View
        ? `← ${state.admin2ParentScope === 'us' ? 'United States' : state.admin2Config.countryName}`
        : '← World';
      backButton.setAttribute('aria-label', admin2View
        ? `Return to ${state.admin2Config.countryName} ${state.admin2Config.parentViewLabel}`
        : 'Return to world view');
    }
    if (panelTitle) panelTitle.textContent = stateView
      ? 'United States · State view'
      : admin2View
        ? `${state.admin2Config.parentName} · ${state.admin2Config.viewLabel}`
      : `${state.detailCountry.name} · ${state.detailConfig.viewLabel}`;
    if (metricItems[0]) {
      metricItems[0].querySelector('strong').textContent = metric(stateView
        ? state.usData.totals.publishedSignals
        : admin2View
          ? state.admin2Config.parentSignals
          : state.detailTotals.signals);
      metricItems[0].lastChild.textContent = stateView
        ? installIntentView ? ' install-intent visitors' : ' visible signals'
        : admin2View
          ? ` ${Number.isFinite(state.admin2Config.parentSignals) ? state.admin2Config.parentSignalLabel : 'parent aggregate not published'}`
        : state.detailDataStatus === 'published'
          ? installIntentView ? ' published regional install-intent visitors' : ' published regional signals'
          : ` ${state.detailDataStatus.replaceAll('_', ' ')}`;
    }
    if (metricItems[1]) {
      const panelRegionMetric = stateView
        ? state.usData.totals.publishedRegions
        : admin2View
          ? state.admin2Regions.length
        : Number.isFinite(state.detailTotals.regions)
          ? state.detailTotals.regions
          : state.detailRegions.length;
      metricItems[1].querySelector('strong').textContent = metric(panelRegionMetric);
      metricItems[1].lastChild.textContent = stateView
        ? ' states published'
        : admin2View
          ? ` ${state.admin2Config.childrenLabel} shown`
        : Number.isFinite(state.detailTotals.regions)
          ? ` ${state.detailConfig.regionsLabel} published`
          : ` ${state.detailConfig.regionsLabel} shown`;
    }
    if (note) {
      const strong = document.createElement('strong');
      if (installIntentView) {
        strong.textContent = 'Install-intent boundary: ';
        const installBoundaryCopy = state.detailDataStatus === 'published'
          ? `${number(state.detailTotals.regions)} ${state.detailConfig.regionsLabel} independently reached ${state.detailTotals.publishThreshold}+ install-intent visitors. Neutral regions are withheld or below threshold.`
          : 'No subdivision reached five unique visitors in this snapshot. Neutral regions are not zero; they are withheld or below the publication threshold.';
        note.replaceChildren(strong, document.createTextNode(`${installBoundaryCopy} Clicks do not prove completed installations.`));
      } else if (stateView) {
        strong.textContent = 'Quality flag: ';
        note.replaceChildren(strong, document.createTextNode('Oregon is dominated by a published DataFast city cluster for The Dalles. Its beacon uses an approximate GeoNames network-city centroid, not a residence or exact visitor location.'));
      } else if (admin2View) {
        const sourceName = state.admin2Config.source?.name || state.admin2Config.sourceName || 'the cited boundary source';
        strong.textContent = 'Boundary view · no subdivision totals: ';
        note.replaceChildren(strong, document.createTextNode(`DataFast does not provide totals at this level; neutral does not mean zero. Beacons are separate 5+ city aggregates at approximate network-city centroids, not ${state.admin2Config.childLabel} totals or residence. Boundaries: ${sourceName}.`));
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
  const admin2View = isAdmin2Scope();
  const publishedFeatures = new Set(state.detailRankedRegions
    .flatMap(region => region.features || []));
  const rows = admin2View
    ? state.admin2Regions.map(region => ({ region, published: false }))
    : admin1View
    ? [
        ...state.detailRankedRegions.map(region => ({ region, published: true })),
        ...state.detailRegions
          .filter(region => !publishedFeatures.has(region.feature))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(region => ({ region, published: false }))
      ]
    : [
        ...state.usRegions.map(region => ({ region, published: true })),
        ...state.usAllRegions
          .filter(region => !region.published)
          .sort((left, right) => left.name.localeCompare(right.name))
          .map(region => ({ region, published: false }))
      ];
  for (const row of rows) {
    const { region, published } = row;
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-region-name', region.name);
    if (region.code) button.setAttribute('data-region-code', region.code);
    button.dataset.published = String(published);
    if (published && region.boundaryMatch) button.dataset.boundaryMatch = region.boundaryMatch;
    const label = document.createElement('span');
    const rank = document.createElement('b');
    rank.textContent = published && Number.isInteger(region.rank) ? String(region.rank).padStart(2, '0') : '—';
    label.append(rank, document.createTextNode(admin2View ? (region.label || region.name) : region.name));
    if (region.qualityFlag) {
      const flag = document.createElement('em');
      flag.textContent = 'flag';
      label.append(flag);
    }
    const drillConfig = !admin2View
      ? admin2ConfigForParent(region, admin1View ? 'admin1' : 'us')
      : null;
    if (drillConfig && Number(drillConfig.featureCount) > 1) {
      const detail = document.createElement('em');
      detail.textContent = 'detail';
      label.append(detail);
    }
    const value = document.createElement('strong');
    value.textContent = published && Number.isFinite(region.signals) ? number(region.signals) : '—';
    button.append(label, value);
    const accessibleName = admin2View
      ? `${region.label || region.name}, ${state.admin2Config.parentName}`
      : region.name;
    button.setAttribute('aria-label', admin2View
      ? `${accessibleName}: no subdivision-level activity total published; select to focus the boundary`
      : published && Number.isFinite(region.signals)
        ? `${accessibleName}: ${number(region.signals)} published regional ${isInstallIntentView() ? 'install-intent visitors' : 'signals'}${drillConfig && Number(drillConfig.featureCount) > 1 ? `; select for ${drillConfig.childrenLabel}` : ''}`
        : `${accessibleName}: no regional total published${drillConfig && Number(drillConfig.featureCount) > 1 ? `; select for ${drillConfig.childrenLabel}` : ''}`);
    button.addEventListener('click', () => {
      if (admin2View) focusAdmin2Region(region);
      else if (admin1View) activateAdmin1Region(region);
      else activateUsRegion(region);
    });
    item.append(button);
    regionList.append(item);
  }
}

function syncRegionPanelSelection(region = null) {
  if (!regionList) return;
  const selectedCode = String(region?.code || '');
  const selectedName = String(region?.name || '');
  for (const button of regionList.querySelectorAll('button[data-region-name]')) {
    const matches = Boolean(region) && (selectedCode
      ? button.dataset.regionCode === selectedCode
      : button.dataset.regionName === selectedName);
    button.classList.toggle('is-active', matches);
    if (matches) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
}

function enterUnitedStates(region = null) {
  if (!state.tourAdvancing) stopTour();
  state.admin2LoadToken += 1;
  setAdmin2Busy(false);
  if (isAdmin2Scope()) clearAdmin2Layer();
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
  if (region) activateUsRegion(region);
  scrollAtlasIntoView();
}

function exitToWorld() {
  if (!state.tourAdvancing) stopTour();
  state.admin2LoadToken += 1;
  setAdmin2Busy(false);
  const leavingAdmin2 = isAdmin2Scope();
  const leavingAdmin2FromAdmin1 = leavingAdmin2 && state.admin2ParentScope === 'admin1';
  state.admin1LoadToken += 1;
  setAdmin1Busy(false);
  const leavingAdmin1 = isAdmin1Scope() || leavingAdmin2FromAdmin1;
  state.scope = 'world';
  if (leavingAdmin2) clearAdmin2Layer();
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
  if (isInstallIntentView()) {
    state.selectedInstallCountry = null;
    state.selectedInstallModel = null;
    syncInstallMarkerPaths(null, null);
  }
  updateScopeInterface();
  if (isInstallIntentView()) syncInstallUrl();
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
  if (isAdmin2Scope()) {
    stopTour();
    showToast('This boundary view has no subdivision ranking to tour.');
    return false;
  }
  const entities = (state.scope === 'us'
    ? state.usRegions
    : isAdmin1Scope()
      ? state.detailRankedRegions
      : state.countries).slice(0, 10);
  if (!entities.length) {
    if (isAdmin1Scope()) {
      stopTour();
      if (tourLabel) tourLabel.textContent = 'No published regional ranking';
      showToast(`No ${state.detailConfig.regionLabel} reaches the ${state.detailTotals.publishThreshold}-${isModelInterestView() ? 'visitor' : 'signal'} publication threshold.`);
    }
    return false;
  }
  const entity = entities[state.tourIndex % entities.length];
  state.tourIndex = (state.tourIndex + 1) % entities.length;
  state.tourAdvancing = true;
  if (state.scope === 'us') focusRegion(entity);
  else if (isAdmin1Scope() && isModelInterestView()) focusModelRegion(entity);
  else if (isAdmin1Scope()) focusAdmin1Region(entity);
  else if (isModelInterestView()) focusModelCountry(entity, '', { exploreRegions: false });
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

function consumeTouchPointer(event) {
  if (event.pointerType === 'touch' && event.cancelable) event.preventDefault();
}

function captureCanvasPointer(pointerId) {
  try {
    canvas.setPointerCapture(pointerId);
  } catch (_) {}
}

function releaseCanvasPointer(pointerId) {
  try {
    if (!canvas.hasPointerCapture || canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  } catch (_) {}
}

function resetPointerGesture() {
  state.dragging = false;
  state.pinching = false;
  state.activePointers.clear();
  state.pinchStartDistance = null;
  state.pinchStartZoom = null;
}

function bindInteractions() {
  document.querySelectorAll('[data-atlas-share-open]').forEach(button => {
    button.addEventListener('click', () => setShareMode(true));
  });
  document.querySelectorAll('[data-atlas-share-close]').forEach(button => {
    button.addEventListener('click', () => setShareMode(false));
  });
  if (shareCopyButton) shareCopyButton.addEventListener('click', copyShareLink);
  if (shareDownloadButton) shareDownloadButton.addEventListener('click', downloadShareImage);
  if (shareNativeButton) {
    shareNativeButton.hidden = typeof navigator.share !== 'function';
    shareNativeButton.addEventListener('click', nativeShareView);
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.shareMode) {
      event.preventDefault();
      setShareMode(false);
    } else if (event.key === 'Escape' && state.installPanelOpen) {
      event.preventDefault();
      setInstallPanelOpen(false, { restoreFocus: true });
    }
  });

  canvas.addEventListener('pointerdown', event => {
    consumeTouchPointer(event);
    stopTour();
    cancelFocusTransition();
    canvas.focus({ preventScroll: true });
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    captureCanvasPointer(event.pointerId);
    hideTooltip();
    if (state.activePointers.size > 1) {
      state.pinching = true;
      state.dragging = false;
      state.pinchStartDistance = activePointerDistance();
      state.pinchStartZoom = state.zoom ?? state.camera.position.z;
      return;
    }
    state.dragging = true;
    state.dragStart.set(event.clientX, event.clientY);
    state.dragLast.copy(state.dragStart);
    state.rotationStart.copy(state.targetRotation);
    state.lastInteractionAt = performance.now();
  });

  canvas.addEventListener('pointermove', event => {
    if (state.activePointers.has(event.pointerId)) consumeTouchPointer(event);
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
    consumeTouchPointer(event);
    const moved = Math.hypot(event.clientX - state.dragStart.x, event.clientY - state.dragStart.y);
    const wasPinching = state.pinching;
    state.activePointers.delete(event.pointerId);
    state.dragging = false;
    releaseCanvasPointer(event.pointerId);
    if (wasPinching) {
      // Keep the whole two-finger gesture consumed until the last pointer is
      // released; otherwise that final release can be mistaken for a tap.
      if (state.activePointers.size === 0) {
        state.pinching = false;
        state.pinchStartDistance = null;
        state.pinchStartZoom = null;
      }
      return;
    }
    if (moved < 7) {
      updatePointer(event);
      const entity = entityAtPointer({ preferGeography: true });
      if (entity) {
        if (entity.kind === 'modelRegionBrand') focusModelRegion(entity.region, brandIdentifier(entity.brand));
        else if (entity.kind === 'modelBrand') focusModelCountry(entity.country);
        else if (entity.kind === 'installStack') {
          if (isAdmin1Scope()) openInstallCountryPanel(entity.country);
          else focusInstallCountry(entity.country);
        }
        else if (entity.kind === 'cityCluster') focusCluster(entity);
        else if (isAdmin2Scope() && entity.kind === 'admin2') focusAdmin2Region(entity);
        else if (state.scope === 'us') activateUsRegion(entity);
        else if (isAdmin1Scope() && entity.kind === 'admin1') activateAdmin1Region(entity);
        else focusCountry(entity);
      }
    }
  });

  canvas.addEventListener('pointercancel', event => {
    releaseCanvasPointer(event.pointerId);
    resetPointerGesture();
  });

  canvas.addEventListener('lostpointercapture', event => {
    if (!state.activePointers.has(event.pointerId)) return;
    resetPointerGesture();
  });

  canvas.addEventListener('contextmenu', event => {
    if (isMobileViewport()) event.preventDefault();
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

  document.querySelectorAll('[data-atlas-period]').forEach(button => {
    button.addEventListener('click', () => {
      const period = button.getAttribute('data-atlas-period');
      if (button.disabled || period === ACTIVE_PERIOD || !Object.hasOwn(PERIOD_CONFIG, period)) return;
      document.documentElement.classList.add('atlas-period-loading');
      button.setAttribute('aria-busy', 'true');
      const url = isModelInterestView() || isInstallIntentView()
        ? new URL(currentShareUrl())
        : new URL(window.location.href);
      if (period === '30d') url.searchParams.delete('range');
      else url.searchParams.set('range', period);
      url.searchParams.delete('v');
      window.location.assign(url);
    });
  });

  document.querySelectorAll('[data-atlas-view]').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-atlas-view');
      if (view === ACTIVE_VIEW) {
        if (view === 'models') {
          if (state.selectedModelCountry || state.selectedModelRegion || state.selectedModelBrand) {
            setModelPanelOpen(true);
            renderModelPanel(state.selectedModelCountry, state.selectedModelBrand, state.selectedModelRegion);
          } else {
            showGlobalModelPanel();
          }
        } else if (view === 'installed') {
          if (state.selectedInstallCountry || state.selectedInstallModel) {
            setInstallPanelOpen(true, { focus: true });
            renderInstallPanel(state.selectedInstallCountry, state.selectedInstallModel);
          } else {
            showGlobalInstallPanel();
          }
        }
        return;
      }
      if (view === 'active') {
        showToast('Verified activity requires real local model launches. LocalClaw will never infer it from website visits.');
        return;
      }
      const url = new URL(window.location.href);
      if (view === 'installed') url.searchParams.set('view', 'installed');
      else if (view === 'models') url.searchParams.set('view', 'models');
      else url.searchParams.delete('view');
      url.searchParams.delete('country');
      url.searchParams.delete('region');
      url.searchParams.delete('regions');
      url.searchParams.delete('subregion');
      url.searchParams.delete('area');
      url.searchParams.delete('family');
      url.searchParams.delete('brand');
      url.searchParams.delete('model');
      url.searchParams.delete('v');
      window.location.assign(url);
    });
  });

  const installClose = document.querySelector('[data-atlas-install-close]');
  const installBack = document.querySelector('[data-atlas-install-back]');
  const installRegions = document.querySelector('[data-atlas-install-regions]');
  if (installClose) installClose.addEventListener('click', () => {
    setInstallPanelOpen(false, { restoreFocus: true });
  });
  if (installBack) installBack.addEventListener('click', () => {
    stopTour();
    if (state.selectedInstallModel) {
      const keepsCountryBack = Boolean(state.selectedInstallCountry);
      state.selectedInstallModel = null;
      renderInstallPanel(state.selectedInstallCountry, '');
      syncInstallUrl();
      if (!keepsCountryBack) window.requestAnimationFrame(() => installClose?.focus({ preventScroll: true }));
    } else {
      showGlobalInstallPanel();
    }
  });
  if (installRegions) installRegions.addEventListener('click', openInstallRegionExplorer);

  const modelClose = document.querySelector('[data-atlas-model-close]');
  const modelBack = document.querySelector('[data-atlas-model-back]');
  const modelRegions = document.querySelector('[data-atlas-model-regions]');
  if (modelClose) modelClose.addEventListener('click', () => {
    setModelPanelOpen(false);
    canvas.focus({ preventScroll: true });
  });
  if (modelBack) {
    modelBack.addEventListener('click', () => {
      stopTour();
      if (state.selectedModelBrand) {
        state.selectedModelBrand = null;
        renderModelPanel(state.selectedModelCountry, '', state.selectedModelRegion);
        syncModelUrl();
      } else if (state.selectedModelRegion) {
        showModelRegionOverview();
      } else if (isAdmin1Scope() && state.selectedModelCountry) {
        focusModelCountry(state.selectedModelCountry, '', { exploreRegions: false });
      } else {
        showGlobalModelPanel();
      }
    });
  }
  if (modelRegions) modelRegions.addEventListener('click', () => {
    void enterModelRegionExplorer().then(entered => {
      if (entered) focusModelPanelNavigation();
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
    button.addEventListener('click', () => isAdmin2Scope() ? exitAdmin2() : exitUnitedStates());
  });

  document.querySelectorAll('[data-atlas-us-open]').forEach(button => {
    button.addEventListener('click', () => enterUnitedStates());
  });

  window.addEventListener('resize', scheduleResize, { passive: true });
  window.addEventListener('orientationchange', scheduleResize, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleResize, { passive: true });
  if ('ResizeObserver' in window) {
    state.resizeObserver = new ResizeObserver(scheduleResize);
    state.resizeObserver.observe(stage);
  }
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
    updateModelDomFallback();
    if (fallbackNote) {
      fallbackNote.hidden = false;
      fallbackNote.textContent = isModelInterestView()
        ? 'Interactive globe paused · model logos and rankings remain available'
        : 'Interactive globe paused · static view active';
    }
  });
  canvas.addEventListener('webglcontextrestored', () => {
    state.contextLost = false;
    state.running = !document.hidden && state.inViewport;
    stage.classList.add('atlas-ready');
    updateModelDomFallback();
    if (fallbackNote) fallbackNote.hidden = true;
  });
}

function animate(time) {
  if (!state.running || !state.initialized) return;
  if (isMobileViewport()) {
    const activeMotion = state.dragging || state.pinching || state.focusTransition || state.revealStartedAt !== null;
    const frameInterval = 1000 / (activeMotion ? MOBILE_ACTIVE_FPS : MOBILE_IDLE_FPS);
    if (time - state.lastRenderAt < frameInterval) return;
  }
  state.lastRenderAt = time;
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
    if (!prefersReducedMotion.matches && idle && !state.dragging && !state.locked && !state.shareMode) {
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
  updateModelMarkerVisibility();
  updateModelRegionMarkerVisibility();
  updateWorldMapClarity();
  state.renderer.render(state.scene, state.camera);
}

function appendRankingCell(row, value, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = value;
  row.append(cell);
  return cell;
}

function renderRankingRows(selector, rows, denominator, kind, limit) {
  const body = document.querySelector(selector);
  if (!body) return;
  const visibleRows = rows.slice(0, limit);
  const maximum = visibleRows[0]?.signals || 1;
  const fragment = document.createDocumentFragment();
  visibleRows.forEach((entity, index) => {
    const row = document.createElement('tr');
    if (entity.qualityFlag) row.className = 'atlas-ranking__flagged';
    appendRankingCell(row, String(index + 1).padStart(2, '0'), 'atlas-ranking__rank');
    const nameCell = appendRankingCell(row, '', 'atlas-ranking__country');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute(kind === 'country' ? 'data-country-focus' : 'data-state-focus', entity.name);
    button.append(document.createTextNode(entity.name));
    if (entity.qualityFlag) {
      const flag = document.createElement('span');
      flag.textContent = 'quality flag';
      button.append(' ', flag);
    }
    nameCell.append(button);
    appendRankingCell(row, number(entity.signals));
    appendRankingCell(row, `${((entity.signals / denominator) * 100).toFixed(1)}%`);
    const barCell = appendRankingCell(row, '', 'atlas-ranking__bar');
    const track = document.createElement('div');
    track.className = 'atlas-ranking__track';
    const fill = document.createElement('span');
    fill.style.setProperty('--atlas-share', `${((entity.signals / maximum) * 100).toFixed(1)}%`);
    track.append(fill);
    barCell.append(track);
    fragment.append(row);
  });
  body.replaceChildren(fragment);
}

function renderModelRequestRows() {
  const body = document.querySelector('[data-model-ranking-body]');
  const details = state.data.installIntentDetails;
  if (!body || !details) return;
  const rows = [
    ...(details.models || []).map(row => ({ ...row, type: 'Model path' })),
    ...(details.runtimes || []).map(row => ({ ...row, type: row.kind || 'Setup destination' }))
  ].sort((left, right) => right.visitors - left.visitors || left.label.localeCompare(right.label));
  const maximum = rows[0]?.visitors || 1;
  const fragment = document.createDocumentFragment();
  rows.forEach((entity, index) => {
    const row = document.createElement('tr');
    appendRankingCell(row, String(index + 1).padStart(2, '0'), 'atlas-ranking__rank');
    appendRankingCell(row, entity.label, 'atlas-ranking__country');
    appendRankingCell(row, number(entity.visitors));
    appendRankingCell(row, entity.type);
    const barCell = appendRankingCell(row, '', 'atlas-ranking__bar');
    const track = document.createElement('div');
    track.className = 'atlas-ranking__track';
    const fill = document.createElement('span');
    fill.style.setProperty('--atlas-share', `${((entity.visitors / maximum) * 100).toFixed(1)}%`);
    track.append(fill);
    barCell.append(track);
    fragment.append(row);
  });
  body.replaceChildren(fragment);
}

function renderDataSummary() {
  const installIntentView = isInstallIntentView();
  const modelInterestView = isModelInterestView();
  const leader = state.countries[0];
  const oregon = state.usRegions.find(region => region.name === 'Oregon');
  document.querySelectorAll('[data-interest-only]').forEach(element => { element.hidden = installIntentView || modelInterestView; });
  document.querySelectorAll('[data-install-only]').forEach(element => { element.hidden = !installIntentView; });
  document.querySelectorAll('[data-model-only]').forEach(element => { element.hidden = !modelInterestView; });
  const colorLegend = document.querySelector('[data-atlas-color-legend]');
  const beaconLegend = document.querySelector('[data-atlas-beacon-legend]');
  if (colorLegend) colorLegend.hidden = false;
  if (beaconLegend) beaconLegend.hidden = installIntentView || modelInterestView;
  if (installIntentView && colorLegend) {
    const colorLegendTitle = colorLegend.querySelector('strong');
    const colorLegendCopy = colorLegend.querySelector('small');
    if (colorLegendTitle) colorLegendTitle.textContent = 'Color';
    if (colorLegendCopy) colorLegendCopy.textContent = 'Install-intent visitors by country';
  }
  if (modelInterestView) {
    const colorLegendTitle = colorLegend?.querySelector('strong');
    const colorLegendCopy = colorLegend?.querySelector('small');
    if (colorLegendTitle) colorLegendTitle.textContent = 'Color';
    if (colorLegendCopy) colorLegendCopy.textContent = 'All-model country visitors';
    document.title = 'Most Explored Local AI Models by Country | LocalClaw Atlas';
    const leadingBrand = dominantModelBrand(leader);
    const leadingBrands = coLeadingModelBrands(leader);
    const hasLeadingTie = leadingBrands.length > 1;
    const totalVisitors = Number(state.data.totals.modelVisitors ?? state.data.totals.signals) || 0;
    const publishedCountries = Number(state.data.totals.countriesWithPublishedBrands ?? state.data.totals.regions) || 0;
    document.querySelectorAll('[data-total-signals]').forEach(element => {
      element.textContent = number(totalVisitors);
    });
    document.querySelectorAll('[data-total-regions]').forEach(element => {
      element.textContent = number(publishedCountries);
    });
    document.querySelectorAll('[data-period-date-range]').forEach(element => {
      element.textContent = periodDateRange();
    });
    const snapshotEyebrow = document.querySelector('[data-snapshot-eyebrow]');
    if (snapshotEyebrow) snapshotEyebrow.textContent = 'Model interest by country';
    const snapshotTitle = document.querySelector('[data-snapshot-title]');
    if (snapshotTitle) snapshotTitle.textContent = 'Which local AI brands is each country exploring?';
    const snapshotLead = document.querySelector('[data-snapshot-lead]');
    if (snapshotLead) snapshotLead.textContent = leader && leadingBrand
      ? `${leader.name} leads this published model-page snapshot with ${number(modelCountryVisitors(leader))} unique visitors; ${leadingBrand.label} ${hasLeadingTie ? `shares the local lead with ${number(leadingBrands.length - 1)} other brand${leadingBrands.length > 2 ? 's' : ''}` : 'is its most explored local AI brand'}. This measures LocalClaw page exploration, not verified model usage.`
      : `Atlas publishes only country and brand totals that independently reach ${PUBLISH_THRESHOLD} unique model-page visitors. This measures LocalClaw page exploration, not verified model usage.`;
    const leadingCountry = document.querySelector('[data-leading-country]');
    if (leadingCountry) leadingCountry.textContent = leader?.name || 'Collecting signals';
    const leadingDetail = document.querySelector('[data-leading-detail]');
    if (leadingDetail) leadingDetail.textContent = leader && leadingBrand
      ? `${number(modelCountryVisitors(leader))} model-page visitors · ${leadingBrand.label} ${hasLeadingTie ? 'co-leads locally' : 'leads locally'}`
      : 'No country reaches the public threshold yet';
    const observedMetricLabel = document.querySelector('[data-observed-metric-label]');
    if (observedMetricLabel) observedMetricLabel.textContent = 'Model-page visitors';
    const observedWindow = document.querySelector('[data-observed-window]');
    if (observedWindow) observedWindow.textContent = `Unique visitors across eligible LLM pages · ${periodDateRange()}`;
    const coverageLabel = document.querySelector('[data-global-coverage-label]');
    const coverageValue = document.querySelector('[data-global-coverage-value]');
    const coverageDetail = document.querySelector('[data-global-coverage-detail]');
    if (coverageLabel) coverageLabel.textContent = 'Published coverage';
    if (coverageValue) coverageValue.textContent = `${number(publishedCountries)} countries`;
    if (coverageDetail) coverageDetail.textContent = `${number(globalModelBrands().length)} brands published globally at ${PUBLISH_THRESHOLD}+ visitors`;
    const rankingEyebrow = document.querySelector('[data-country-ranking-eyebrow]');
    if (rankingEyebrow) rankingEyebrow.textContent = 'Model interest country ranking';
    const rankingTitle = document.querySelector('[data-country-ranking-title]');
    if (rankingTitle) rankingTitle.textContent = 'Where people explore local AI models.';
    const rankingLead = document.querySelector('[data-country-ranking-lead]');
    if (rankingLead) rankingLead.textContent = 'Countries are ranked by unique visitors across eligible LocalClaw LLM pages. Select a country for its leading brands or open Explore regions for independently published regional detail. Country, region, brand and individual model rows must each reach five visitors.';
    const countryCaption = document.querySelector('[data-country-ranking-caption]');
    if (countryCaption) countryCaption.textContent = `Countries with at least ${PUBLISH_THRESHOLD} unique visitors across eligible LocalClaw LLM pages, ${periodDateRange()}`;
    const countrySignalHeading = document.querySelector('[data-country-signal-heading]');
    if (countrySignalHeading) countrySignalHeading.textContent = 'Visitors';
    const methodologyEyebrow = document.querySelector('[data-methodology-eyebrow]');
    if (methodologyEyebrow) methodologyEyebrow.textContent = 'Methodology · Model interest beta';
    const methodologyTitle = document.querySelector('[data-methodology-title]');
    if (methodologyTitle) methodologyTitle.textContent = 'Model discovery, measured without pretending it is usage.';
    const methodologyLead = document.querySelector('[data-methodology-lead]');
    if (methodologyLead) methodologyLead.textContent = 'The Models view uses anonymous DataFast visitors to canonical LocalClaw LLM pages. Country, region and brand totals are queried as deduplicated visitor groups; individual model rows are published only when that exact geographic page cell independently reaches the privacy threshold.';
    const methodCount = document.querySelector('[data-method-count]');
    if (methodCount) methodCount.textContent = `A unique visitor to at least one eligible LocalClaw /models/ page during the ${periodDays()}-day window. A brand total is deduplicated across that brand’s exact model-page allow-list; individual pages are never summed to invent a unique brand total.`;
    const methodExclude = document.querySelector('[data-method-exclude]');
    if (methodExclude) methodExclude.textContent = 'No download completion, installation, launch, prompt, inference, active-use event, device identity, or claim about worldwide model usage is included.';
    const methodGeography = document.querySelector('[data-method-geography]');
    if (methodGeography) methodGeography.textContent = 'Countries and administrative regions are approximate network locations reported by DataFast. A regional all-model total, brand, or model appears only when that exact regional visitor group is independently queried and published; Atlas never derives a regional preference from a country total.';
    const methodPrivacy = document.querySelector('[data-method-privacy]');
    if (methodPrivacy) methodPrivacy.textContent = `Country, region, brand and individual model cells must independently reach ${PUBLISH_THRESHOLD} unique visitors before publication. Rows below threshold and all visitor-level data remain absent from the public JSON.`;
    const sourceCoverage = document.querySelector('[data-source-coverage]');
    if (sourceCoverage) {
      const sourceLabel = document.createElement('strong');
      sourceLabel.textContent = 'Source and coverage:';
      const countryBoundaryLink = document.createElement('a');
      countryBoundaryLink.href = 'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/';
      countryBoundaryLink.rel = 'external noopener';
      countryBoundaryLink.textContent = 'Natural Earth 1:50m';
      const regionalBoundaryLink = document.createElement('a');
      regionalBoundaryLink.href = 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/';
      regionalBoundaryLink.rel = 'external noopener';
      regionalBoundaryLink.textContent = 'Natural Earth 1:10m Admin-1';
      sourceCoverage.replaceChildren(
        sourceLabel,
        document.createTextNode(` aggregated anonymous LocalClaw website traffic measured by DataFast, ${periodDateRange()}, Europe/Zurich. Country outlines use `),
        countryBoundaryLink,
        document.createTextNode('; regional exploration uses '),
        regionalBoundaryLink,
        document.createTextNode('. Every public geographic model-interest cell is independently thresholded. Source coverage is biased toward people and network routes that reach LocalClaw.')
      );
    }
    const leaderFaq = document.querySelector('[data-current-leader-faq]');
    if (leaderFaq) leaderFaq.textContent = leader && leadingBrand
      ? `${leader.name} leads this ${periodDays()}-day model-page snapshot, and ${leadingBrand.label} ${hasLeadingTie ? `is one of ${number(leadingBrands.length)} co-leading published brands` : 'is its most explored published brand'}. The result reflects LocalClaw page interest, not verified use worldwide.`
      : 'The Models view publishes only privacy-thresholded LocalClaw page interest, not verified use worldwide.';
    const regionalFaqTitle = document.querySelector('[data-regional-faq-title]');
    const regionalFaq = document.querySelector('[data-regional-faq]');
    if (regionalFaqTitle) regionalFaqTitle.textContent = 'Does the Models view go below country level?';
    if (regionalFaq) regionalFaq.textContent = `Yes, where a country has a supported administrative boundary layer. Select a country, then Explore regions to compare only the regional totals, brands and model pages that independently reach ${PUBLISH_THRESHOLD} visitors. Neutral regions and absent logos do not mean zero, and Atlas does not infer city-level model preference.`;
    renderRankingRows('[data-country-ranking-body]', state.countries, totalVisitors || 1, 'country', state.countries.length);
    const countryDownload = document.querySelector('[data-country-download]');
    if (countryDownload) {
      countryDownload.href = DATA_URL.split('?')[0];
      countryDownload.textContent = 'Download model-interest JSON';
    }
    const regionalDownload = document.querySelector('[data-admin1-download]');
    const deeperBoundaryDownload = document.querySelector('[data-admin2-download]');
    if (regionalDownload) {
      regionalDownload.hidden = false;
      regionalDownload.href = MODEL_ADMIN1_ACTIVITY_URL.split('?')[0];
      regionalDownload.textContent = 'Download regional model-interest JSON';
    }
    if (deeperBoundaryDownload) deeperBoundaryDownload.hidden = true;
    updatePeriodControls();
    updateScopeInterface();
    return;
  }
  if (installIntentView) document.title = `Local AI Model & Setup Paths by Country | LocalClaw Atlas`;
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
  document.querySelectorAll('[data-period-date-range]').forEach(element => {
    element.textContent = periodDateRange();
  });
  const snapshotLead = document.querySelector('[data-snapshot-lead]');
  if (snapshotLead && leader) {
    snapshotLead.textContent = installIntentView
      ? `${leader.name} leads the published ${periodLabel().toLowerCase()} install-intent snapshot with ${number(leader.signals)} unique visitors. Atlas observed ${number(state.data.totals.observedSignals)} visitors across ${number(state.data.totals.observedRegions)} countries; model, destination and country cells must each independently reach five visitors. Tracking began 21 August 2026, so longer windows are partial.`
      : `As of 29 August 2026, ${leader.name} ranks first for observed local AI interest in the LocalClaw dataset, with ${number(leader.signals)} of ${number(state.data.totals.signals)} anonymous signals recorded during the ${periodLabel().toLowerCase()}. This is a directional view of interest, not a census of local AI users.`;
  }
  const snapshotEyebrow = document.querySelector('[data-snapshot-eyebrow]');
  if (snapshotEyebrow) snapshotEyebrow.textContent = installIntentView ? 'Latest install-intent snapshot' : 'Latest global snapshot';
  const snapshotTitle = document.querySelector('[data-snapshot-title]');
  if (snapshotTitle) snapshotTitle.textContent = installIntentView ? 'From interest to the model paths and setup destinations people choose.' : 'The clearest picture we can publish today.';
  const observedMetricLabel = document.querySelector('[data-observed-metric-label]');
  if (observedMetricLabel) observedMetricLabel.textContent = installIntentView ? 'Install-intent visitors' : 'Observed interest';
  const leadingCountry = document.querySelector('[data-leading-country]');
  if (leadingCountry && leader) leadingCountry.textContent = leader.name;
  const leadingDetail = document.querySelector('[data-leading-detail]');
  if (leadingDetail && leader) leadingDetail.textContent = `${number(leader.signals)} ${signalLabel(leader.signals)} · ${((leader.signals / state.data.totals.signals) * 100).toFixed(1)}% of the snapshot`;
  const leaderFaq = document.querySelector('[data-current-leader-faq]');
  if (leaderFaq && leader) leaderFaq.textContent = installIntentView
    ? `${leader.name} leads this published ${periodDays()}-day install-intent snapshot with ${number(leader.signals)} unique visitors. The result reflects LocalClaw path selections since 21 August 2026, not verified installations worldwide.`
    : `${leader.name} leads this ${periodDays()}-day LocalClaw interest snapshot with ${number(leader.signals)} signals. That result reflects this dataset, not all local AI activity worldwide.`;
  const observedWindow = document.querySelector('[data-observed-window]');
  if (observedWindow) observedWindow.textContent = installIntentView
    ? `Unique goal visitors · ${periodDateRange()} · tracking since 21 Aug`
    : `Anonymous country-level signals · ${periodDateRange()}`;
  const publishedStates = document.querySelector('[data-us-published-states]');
  if (publishedStates) publishedStates.textContent = number(state.usData.totals.publishedRegions);
  const publishedStateSignals = document.querySelector('[data-us-published-signals]');
  if (publishedStateSignals) publishedStateSignals.textContent = number(state.usData.totals.publishedSignals);
  const publishedStateDetail = document.querySelector('[data-us-published-signal-detail]');
  if (publishedStateDetail) publishedStateDetail.textContent = `Of ${number(state.usData.totals.countrySignals)} U.S. country-level signals`;
  const oregonQuality = document.querySelector('[data-oregon-quality]');
  if (oregonQuality && oregon) {
    const dalles = state.cityClusters.find(cluster => cluster.countryCode === 'US' && cluster.city === 'The Dalles');
    oregonQuality.textContent = `${number(dalles?.signals || 0)} of ${number(oregon.signals)} signals resolve to The Dalles`;
  }
  const usCaption = document.querySelector('[data-us-ranking-caption]');
  if (usCaption) usCaption.textContent = `Top U.S. states by observed LocalClaw network-region signals, ${periodDateRange()}`;
  const countryCaption = document.querySelector('[data-country-ranking-caption]');
  if (countryCaption) countryCaption.textContent = installIntentView
    ? `Countries with at least five unique LocalClaw install-intent visitors, ${periodDateRange()}`
    : `Top 20 countries by observed LocalClaw interest signals, ${periodDateRange()}`;
  const rankingEyebrow = document.querySelector('[data-country-ranking-eyebrow]');
  if (rankingEyebrow) rankingEyebrow.textContent = installIntentView ? 'Install-intent country ranking' : 'Country ranking';
  const rankingTitle = document.querySelector('[data-country-ranking-title]');
  if (rankingTitle) rankingTitle.textContent = installIntentView ? 'Where visitors moved beyond browsing.' : 'Where interest in local AI is concentrated.';
  const rankingLead = document.querySelector('[data-country-ranking-lead]');
  if (rankingLead) rankingLead.textContent = installIntentView
    ? 'A visitor counts once after selecting at least one eligible setup, repository or desktop-app path, even if several related goals fired. Countries below five unique visitors are withheld. Select a country to inspect its published model, setup-destination and modality paths; use the panel’s boundary action for regional exploration.'
    : 'The ranking below uses raw observed interest signals. Select a country to bring it into focus on the globe. Country rows below five signals are withheld before public JSON publication to avoid over-reading tiny samples. Within a published country, signals outside a five-or-more-signal DataFast city cluster remain visible only through the country color.';
  const countrySignalHeading = document.querySelector('[data-country-signal-heading]');
  if (countrySignalHeading) countrySignalHeading.textContent = installIntentView ? 'Visitors' : 'Signals';
  const usOpenLabel = document.querySelector('[data-us-open-label]');
  if (usOpenLabel) usOpenLabel.textContent = `Explore all ${number(state.usData.totals.publishedRegions)} states`;
  const methodWindow = document.querySelector('[data-method-window]');
  if (methodWindow) methodWindow.textContent = `${periodDays()}-day window`;
  if (installIntentView) {
    const methodologyEyebrow = document.querySelector('[data-methodology-eyebrow]');
    const methodologyTitle = document.querySelector('[data-methodology-title]');
    const methodologyLead = document.querySelector('[data-methodology-lead]');
    const methodCount = document.querySelector('[data-method-count]');
    const methodExclude = document.querySelector('[data-method-exclude]');
    const methodGeography = document.querySelector('[data-method-geography]');
    const methodPrivacy = document.querySelector('[data-method-privacy]');
    if (methodologyEyebrow) methodologyEyebrow.textContent = 'Methodology · Install intent beta';
    if (methodologyTitle) methodologyTitle.textContent = 'A stronger signal, without overstating it.';
    if (methodologyLead) methodologyLead.textContent = 'Install paths is an install-intent view built from anonymous DataFast goals emitted when a visitor chooses an eligible setup, repository or desktop-app path. The immediately preceding eligible model page can supply a model attribution, but neither signal proves installation or use.';
    if (methodCount) methodCount.textContent = `One unique visitor who completed at least one included install-intent goal during the ${periodDays()}-day window. Visitors are de-duplicated across the complete goal family, so multiple paths still count as one person in the country total.`;
    if (methodExclude) methodExclude.textContent = 'No completed download, installed model, successful runtime launch, prompt, inference, machine identity, or active-use claim is included. A click can fail or be abandoned after leaving LocalClaw.';
    if (methodGeography) methodGeography.textContent = 'Countries are ranked from DataFast’s goal-filtered country breakdown. Regional boundaries remain visible, but are colored only when that same goal-filtered region independently reaches five unique visitors. No location is inferred from model demand or a parent total.';
    if (methodPrivacy) methodPrivacy.textContent = 'The five-visitor threshold is applied independently to every public country, region, model, setup destination, modality and geographic cross-section. Below-threshold detail and all individual event trails are omitted. Every table row is a unique-visitor count and rows are never added together.';
    const adoptionFaq = document.querySelector('[data-adoption-faq]');
    const nextFaq = document.querySelector('[data-next-faq]');
    if (adoptionFaq) adoptionFaq.textContent = 'Not yet. Install intent is stronger than a page view, but a click does not prove that a download finished, a model was installed, or an inference ran. This beta labels that boundary directly.';
    if (nextFaq) nextFaq.textContent = 'A future Active view requires explicit, privacy-preserving opt-in telemetry from LocalClaw itself. Until then, Atlas will keep click intent and verified local activity separate.';
  }
  const countryDownload = document.querySelector('[data-country-download]');
  if (countryDownload) countryDownload.href = DATA_URL.split('?')[0];
  const admin1Download = document.querySelector('[data-admin1-download]');
  if (admin1Download) admin1Download.href = ADMIN1_ACTIVITY_URL.split('?')[0];
  const installTotal = document.querySelector('[data-install-total]');
  if (installTotal) installTotal.textContent = number(state.data.totals.observedSignals);
  const modelRequestTotal = document.querySelector('[data-model-request-total]');
  if (modelRequestTotal) modelRequestTotal.textContent = number(state.data.totals.attributedModelVisitors || 0);
  renderRankingRows('[data-country-ranking-body]', state.countries, state.data.totals.signals, 'country', 20);
  if (!installIntentView) renderRankingRows('[data-us-ranking-body]', state.usRegions, state.usData.totals.countrySignals, 'state', 10);
  renderModelRequestRows();
  updatePeriodControls();
  updateScopeInterface();
}

async function initialize() {
  try {
    const modelsView = isModelInterestView();
    const emptyJsonResponse = value => Promise.resolve({
      ok: true,
      json: async () => value
    });
    const admin2ManifestPromise = modelsView ? Promise.resolve(null) : fetch(ADMIN2_MANIFEST_URL)
      .then(async response => {
        if (!response.ok) throw new Error(`Deeper boundary manifest could not be loaded (${response.status}).`);
        return response.json();
      })
      .catch(error => {
        console.warn('Atlas deeper boundary views are unavailable; the world and regional maps remain active.', error);
        return null;
      });
    const admin1ManifestResponsePromise = modelsView ? fetch(ADMIN1_MANIFEST_URL)
      .then(response => {
        if (!response.ok) throw new Error(`Regional boundary manifest could not be loaded (${response.status}).`);
        return response;
      })
      .catch(error => {
        console.warn('Atlas regional boundaries are unavailable; country model interest remains active.', error);
        return emptyJsonResponse({ countries: {} });
      }) : fetch(ADMIN1_MANIFEST_URL);
    const modelAdmin1ActivityPromise = modelsView ? fetch(MODEL_ADMIN1_ACTIVITY_URL)
      .then(async response => {
        if (!response.ok) throw new Error(`Regional model-interest data could not be loaded (${response.status}).`);
        return response.json();
      })
      .catch(error => {
        console.warn('Atlas regional model-interest totals are unavailable; country model interest remains active.', error);
        return { publishThreshold: PUBLISH_THRESHOLD, countries: {} };
      }) : Promise.resolve(null);
    const [
      dataResponse,
      worldResponse,
      statesResponse,
      manifestResponse,
      activityResponse,
      admin2Manifest,
      modelAdmin1Activity
    ] = await Promise.all([
      fetch(DATA_URL),
      fetch(WORLD_URL),
      modelsView ? emptyJsonResponse({ type: 'FeatureCollection', features: [] }) : fetch(US_STATES_URL),
      admin1ManifestResponsePromise,
      modelsView ? emptyJsonResponse({ countries: {} }) : fetch(ADMIN1_ACTIVITY_URL),
      admin2ManifestPromise,
      modelAdmin1ActivityPromise
    ]);
    if (!dataResponse.ok || !worldResponse.ok || !statesResponse.ok || !manifestResponse.ok || !activityResponse.ok) {
      throw new Error('Atlas data could not be loaded.');
    }
    state.data = await dataResponse.json();
    state.world = await worldResponse.json();
    state.usBoundaries = await statesResponse.json();
    state.admin1Manifest = await manifestResponse.json();
    state.admin1Activity = await activityResponse.json();
    state.admin2Manifest = admin2Manifest;
    state.modelAdmin1Activity = modelAdmin1Activity;
    if (isModelInterestView()) {
      if (Number(state.data.publishThreshold) !== PUBLISH_THRESHOLD
        || !String(state.data.claimBoundary || '').toLowerCase().includes('not')
        || !state.data.modelInterest) {
        throw new Error('Model-interest data contract is invalid.');
      }
      if (!state.modelAdmin1Activity
        || Number(state.modelAdmin1Activity.publishThreshold || PUBLISH_THRESHOLD) !== PUBLISH_THRESHOLD
        || typeof state.modelAdmin1Activity.countries !== 'object') {
        console.warn('Atlas regional model-interest data contract is invalid; country model interest remains active.');
        state.modelAdmin1Activity = { publishThreshold: PUBLISH_THRESHOLD, countries: {} };
      }
    } else if (isInstallIntentView()) {
      if (Number(state.data.schemaVersion) < 2
        || Number(state.data.publishThreshold) !== PUBLISH_THRESHOLD
        || !String(state.data.claimBoundary || '').toLowerCase().includes('does not verify')
        || !state.data.installIntentDetails) {
        throw new Error('Install-intent data contract is invalid.');
      }
    }
    state.admin1ActivityByA3 = new Map(Object.values(state.admin1Activity?.countries || {})
      .map(record => [String(record.adm0A3 || '').toUpperCase(), record])
      .filter(([code]) => Boolean(code)));
    const publishedUsData = state.data.subnational?.['United States'];
    if (!publishedUsData && !isModelInterestView()) throw new Error('United States state data is missing.');
    state.usData = publishedUsData || {
      publishThreshold: PUBLISH_THRESHOLD,
      totals: {
        countrySignals: 0,
        publishedSignals: 0,
        publishedRegions: 0
      },
      regions: []
    };
    state.countries = state.data.countries.filter(country => country.signals >= PUBLISH_THRESHOLD);
    state.usRegions = state.usData.regions.filter(region => region.signals >= state.usData.publishThreshold);
    state.cityClusters = normalizeCityClusters(state.data.cityClusters);
    state.countryByName = new Map(state.countries.map(country => [country.name, country]));
    const publishedUsRegionByName = new Map(state.usRegions.map(region => [region.name, region]));
    state.countryFeatures = new Map(state.countries.map(country => [country.name, featureForCountry(country.name)]));
    buildWorldCountryEntities();
    state.stateFeatures = new Map(state.usBoundaries.features.map(feature => [feature.properties?.NAME, feature]));
    state.usAllRegions = state.usBoundaries.features.map(feature => {
      const name = String(feature.properties?.NAME || '').trim();
      const published = publishedUsRegionByName.get(name);
      if (published) {
        published.kind = 'state';
        published.published = true;
        published.feature = feature;
        return published;
      }
      return {
        kind: 'state',
        name,
        code: String(feature.properties?.STUSPS || '').trim(),
        signals: null,
        rank: null,
        published: false,
        feature
      };
    });
    state.usRegionByName = new Map(state.usAllRegions.map(region => [region.name, region]));
    for (const country of state.worldCountries) {
      const center = centerForCountry(country);
      if (center) state.centers.set(country.name, center);
      const feature = country.feature || featureForCountry(country.name);
      if (!country.published) continue;
      for (const code of [feature?.properties?.ISO_A2, feature?.properties?.ISO_A2_EH, feature?.properties?.WB_A2]) {
        if (code && code !== '-99') state.countryByCode.set(String(code).toUpperCase(), country);
      }
    }
    for (const region of state.usAllRegions) {
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
    stage.dataset.admin2Parents = String(state.admin2Manifest?.totals?.parents || 0);
    stage.dataset.admin2Subdivisions = String(state.admin2Manifest?.totals?.subdivisions || 0);
    stage.classList.toggle('atlas-has-city-clusters', state.cityClusters.length > 0);
    if (isModelInterestView()) setModelPanelOpen(!isMobileViewport());
    if (isInstallIntentView()) setInstallPanelOpen(!isMobileViewport());
    renderStatePanel();
    renderDataSummary();
    if (isModelInterestView()) renderModelPanel(null, '');
    if (isInstallIntentView()) renderInstallPanel(null, '');
    bindInteractions();
    state.initialized = true;
    await applyRequestedView();
    state.renderer.setAnimationLoop(animate);
    requestAnimationFrame(() => stage.classList.add('atlas-ready'));
  } catch (error) {
    console.error(error);
    stage.classList.remove('atlas-ready');
    if (fallbackNote) {
      fallbackNote.hidden = false;
      fallbackNote.textContent = isModelInterestView()
        ? 'Interactive model globe unavailable · country and brand rankings remain available below'
        : 'Static globe active · rankings remain available below';
    }
  }
}

initialize();
