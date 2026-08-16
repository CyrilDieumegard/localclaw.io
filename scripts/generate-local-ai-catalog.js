const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { siteNavigation, siteNavAssets } = require('./site-navigation');
const { normalizeDirectory } = require('./normalize-public-urls');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';

const categoryConfig = {
  video: {
    label: 'Video', plural: 'video models', route: '/video-models', directory: 'video', nav: 'video',
    title: 'Local video AI models | LocalClaw',
    heading: 'Generate video on your machine',
    description: 'Compare open local video models by task, platform, RAM, VRAM, runtime and license. Every entry needs a practical downloadable inference path.'
  },
  '3d': {
    label: '3D', plural: '3D models', route: '/3d-models', directory: '3d', nav: '3d',
    title: 'Local 3D AI models | LocalClaw',
    heading: 'Build 3D assets locally',
    description: 'Compare image-to-3D, text-to-3D, reconstruction, texturing and Gaussian workflows that can run on local hardware.'
  },
  image: {
    label: 'Image', plural: 'image models', route: '/image-models', directory: 'image', nav: 'image',
    title: 'Local image AI models | LocalClaw',
    heading: 'Generate and edit images locally',
    description: 'Compare open image models for generation and editing across local GPU and Apple Silicon runtimes.'
  },
  music: {
    label: 'Music', plural: 'music models', route: '/music-models', directory: 'music', nav: 'music',
    title: 'Local music AI models | LocalClaw',
    heading: 'Create music and audio locally',
    description: 'Compare local song, music, sound-effect and audio generation models by memory, runtime, output and license.'
  },
  vision: {
    label: 'Vision', plural: 'vision models', route: '/vision-models', directory: 'vision', nav: 'vision',
    title: 'Local vision AI models | LocalClaw',
    heading: 'Understand images and documents locally',
    description: 'Compare local OCR, document understanding, captioning, detection and multimodal vision models.'
  }
};

function loadScript(relativePath, globalName, suffix = '') {
  const context = {};
  vm.createContext(context);
  const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  vm.runInContext(`${source}\n${suffix || `this.${globalName}=${globalName};`}`, context);
  return context[globalName];
}

function loadTtsModels() {
  const html = fs.readFileSync(path.join(ROOT, 'tts-list.html'), 'utf8');
  const match = html.match(/const TTS_MODELS = (\[[\s\S]*?\n\s*\]);/);
  if (!match) throw new Error('TTS_MODELS not found in tts-list.html');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`this.TTS_MODELS=${match[1]}`, context);
  return context.TTS_MODELS;
}

const multimodal = loadScript('js/local-ai-catalog.js', 'LOCAL_AI_CATALOG', '');
const appData = loadScript('js/data.js', 'APP_DATA');
const ttsModels = loadTtsModels();

const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const array = (value) => Array.isArray(value) ? value : [];
const titleCase = (value) => String(value).split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
const prettyTerm = (value) => ({
  macos: 'macOS', nvidia: 'NVIDIA', amd: 'AMD', cpu: 'CPU', mlx: 'MLX', onnx: 'ONNX',
  gguf: 'GGUF', api: 'API', tts: 'TTS', asr: 'ASR', '3d': '3D'
}[String(value).toLowerCase()] || titleCase(value));

function normalizeMultimodal(model) {
  return {
    id: model.id,
    name: model.name,
    category: model.category,
    summary: model.summary,
    tasks: model.tasks,
    platforms: model.platforms,
    accelerators: model.accelerators,
    min_ram_gb: model.min_ram_gb,
    min_vram_gb: model.min_vram_gb,
    runtime: model.runtime,
    license: model.license,
    local_status: model.local_status,
    released: model.released,
    path: `/${categoryConfig[model.category].directory}/${model.id}`,
    resource_basis: 'source-backed floor'
  };
}

function normalizeLlm(model) {
  const hosted = Boolean(model.hosted_only);
  return {
    id: model.id,
    name: model.name,
    category: 'llm',
    summary: String(model.description || `${model.params || 'Open'} local language model.`).replace(/—/g, '-'),
    tasks: array(model.tags),
    platforms: hosted ? [] : ['macos', 'windows', 'linux'],
    accelerators: hosted ? [] : ['apple-silicon', 'nvidia', 'cpu'],
    min_ram_gb: hosted ? 0 : Number(model.min_ram) || 8,
    min_vram_gb: hosted ? 0 : Math.max(0, Math.ceil((Number(model.size_gb) || 0) / 0.88)),
    runtime: hosted ? ['API'] : [model.custom_runtime || 'GGUF / local runtime'],
    license: model.license || 'See model card',
    local_status: hosted ? 'api' : 'local',
    released: model.released || '',
    path: `/models/${model.id}`,
    resource_basis: hosted ? 'API only' : 'catalogue RAM floor'
  };
}

function normalizeTts(model) {
  const hardware = array(model.hardware);
  const formats = array(model.supportedFormats);
  const clearlyOnline = /\bonline\b|not fully local|api[- ]only|cloud[- ]only/i.test(model.description || '');
  const isApi = clearlyOnline || (formats.includes('api') && !formats.some((format) => ['gguf', 'onnx', 'pytorch', 'safetensors', 'mlx', 'native-app'].includes(format)));
  const size = Number(model.sizeGB) || 0;
  return {
    id: model.id,
    name: model.name,
    category: 'voice',
    summary: String(model.description || 'Local speech model.').replace(/—/g, '-'),
    tasks: array(model.features).concat(model.type ? [model.type] : ['tts']),
    platforms: isApi ? [] : ['macos', 'windows', 'linux'],
    accelerators: isApi ? [] : [
      ...(hardware.includes('apple') ? ['apple-silicon'] : []),
      ...(hardware.includes('gpu') ? ['nvidia'] : []),
      ...(hardware.includes('cpu') ? ['cpu'] : [])
    ],
    min_ram_gb: isApi ? 0 : Math.max(4, Math.ceil(size * 2.5)),
    min_vram_gb: isApi || !hardware.includes('gpu') ? 0 : Math.max(4, Math.ceil(size * 1.4)),
    runtime: formats.length ? formats.map(titleCase) : ['See model card'],
    license: model.license || 'See model card',
    local_status: isApi ? 'api' : 'local',
    released: model.releaseDate || '',
    path: `/tts/${model.id}`,
    resource_basis: isApi ? 'API only' : 'estimated from catalogue size'
  };
}

const searchIndex = [
  ...appData.models.map(normalizeLlm),
  ...ttsModels.map(normalizeTts),
  ...multimodal.map(normalizeMultimodal)
];

const searchIndexSource = `(function exposeLocalAiSearchIndex(root) {\n  root.LOCAL_AI_SEARCH_INDEX = ${JSON.stringify(searchIndex, null, 2)};\n})(typeof window !== 'undefined' ? window : globalThis);\n`;
fs.writeFileSync(path.join(ROOT, 'js/local-ai-search-index.js'), searchIndexSource);

function tracking() {
  return `<!-- TRACKING: DataFast Analytics -->
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <script src="/js/clarity.js" defer></script>`;
}

function categoryLinks(active = '') {
  const legacy = [
    { key: 'llm', label: 'LLM', route: '/llm-list', count: appData.models.length, copy: 'language and agent models' },
    { key: 'voice', label: 'Voice', route: '/tts-list', count: ttsModels.length, copy: 'TTS, ASR and speech records' }
  ];
  const legacyLinks = legacy.map((item) => `<a class="lc-ai-category-card" href="${item.route}"${active === item.key ? ' aria-current="page"' : ''}><strong>${item.label}</strong><span>${item.count} ${item.copy}.</span></a>`).join('');
  const newLinks = ['image', 'video', '3d', 'music', 'vision'].map((key) => {
    const config = categoryConfig[key];
    const count = multimodal.filter((model) => model.category === key).length;
    return `<a class="lc-ai-category-card" href="${config.route}"${active === key ? ' aria-current="page"' : ''}><strong>${esc(config.label)}</strong><span>${count} verified ${esc(config.plural)} with local hardware guidance.</span></a>`;
  }).join('');
  return `${legacyLinks}${newLinks}`;
}

function footer() {
  return `<footer class="lc-ai-footer"><div class="lc-ai-shell lc-ai-footer-inner"><span>© 2026 LocalClaw · The Local AI Index</span><div class="lc-ai-footer-links"><a href="/local-ai-index">All local AI</a><a href="/computers">Computers</a><a href="/ram-gpu-for-local-ai">RAM/GPU</a><a href="/blog/">Blog</a><a href="/software">Software</a><a href="/privacy">Privacy</a></div></div></footer>`;
}

function filters(includeCategory = false) {
  return `<section class="lc-ai-toolbar" aria-label="Catalogue filters">
    <div class="lc-ai-filters">
      <div class="lc-ai-field"><label for="lc-ai-search">Search models and tasks</label><input class="lc-ai-input" id="lc-ai-search" type="search" placeholder="video, OCR, Mac, Blender, music..." autocomplete="off"></div>${includeCategory ? `
      <div class="lc-ai-field"><label for="lc-ai-category">Category</label><select class="lc-ai-select" id="lc-ai-category"><option value="all">All categories</option><option value="llm">LLM</option><option value="voice">Voice</option>${['image', 'video', '3d', 'music', 'vision'].map((key) => `<option value="${key}">${categoryConfig[key].label}</option>`).join('')}</select></div>` : ''}
      <div class="lc-ai-field"><label for="lc-ai-platform">System</label><select class="lc-ai-select" id="lc-ai-platform"><option value="all">Any system</option><option value="macos">macOS</option><option value="windows">Windows</option><option value="linux">Linux</option></select></div>
      <div class="lc-ai-field"><label for="lc-ai-accelerator">Compute</label><select class="lc-ai-select" id="lc-ai-accelerator"><option value="all">Any compute</option><option value="apple-silicon">Apple Silicon</option><option value="nvidia">NVIDIA</option><option value="amd">AMD</option><option value="cpu">CPU</option></select></div>
      <div class="lc-ai-field"><label for="lc-ai-ram">Available RAM</label><select class="lc-ai-select" id="lc-ai-ram"><option value="0">Any RAM</option>${[8, 16, 24, 32, 48, 64, 96, 128, 192, 256].map((value) => `<option value="${value}">${value} GB</option>`).join('')}</select></div>
      <div class="lc-ai-field"><label for="lc-ai-vram">Available VRAM</label><select class="lc-ai-select" id="lc-ai-vram"><option value="0">Any VRAM</option>${[4, 6, 8, 12, 16, 24, 32, 48, 64, 80].map((value) => `<option value="${value}">${value} GB</option>`).join('')}</select></div>
    </div>
  </section>`;
}

function machinePanel() {
  return `<aside class="lc-ai-machine-panel"><div><p class="lc-ai-kicker">Machine-aware</p><h2>Your hardware changes the answer.</h2><p>Use your saved primary machine or choose RAM, VRAM and compute below. Compatible local models rise to the top.</p></div><div id="lc-ai-machine-status" class="lc-ai-machine-status">Choose your machine specifications to calculate local fit.</div><a class="lc-ai-button" href="/account">Manage My Machines</a></aside>`;
}

function landingPage(key, config) {
  const count = multimodal.filter((model) => model.category === key).length;
  const schema = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: config.title,
    url: `${BASE}${config.route}`, description: config.description,
    numberOfItems: count, isPartOf: { '@type': 'WebSite', name: 'LocalClaw', url: BASE }
  };
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(config.title)}</title><meta name="description" content="${esc(config.description)}"><meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE}${config.route}"><meta property="og:type" content="website"><meta property="og:url" content="${BASE}${config.route}"><meta property="og:title" content="${esc(config.title)}"><meta property="og:description" content="${esc(config.description)}">
  <link rel="icon" href="/images/crab-logo.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  ${siteNavAssets()}<link rel="stylesheet" href="/css/local-ai-catalog.css?v=20260816b">${tracking()}<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body class="local-ai-page" data-local-ai-category="${key}">${siteNavigation(config.nav)}
<main class="lc-ai-main"><div class="lc-ai-shell">
  <section class="lc-ai-hero"><div class="lc-ai-hero-copy"><p class="lc-ai-kicker">The Local AI Index · ${esc(config.label)}</p><h1 class="lc-ai-title">${esc(config.heading.replace(/ locally$/i, ''))} <span>locally</span></h1><p class="lc-ai-copy">${esc(config.description)}</p><div class="lc-ai-hero-actions"><a class="lc-ai-button lc-ai-button-primary" href="/local-ai-index">Search by machine</a><a class="lc-ai-button" href="#catalogue">Browse ${count} verified entries</a></div></div>${machinePanel()}</section>
  <nav class="lc-ai-category-grid" aria-label="Local AI categories">${categoryLinks(key)}</nav>
  ${filters(false)}
  <div class="lc-ai-results-head" id="catalogue"><h2>${esc(config.label)} catalogue</h2><span class="lc-ai-result-count" id="lc-ai-result-count"></span></div>
  <section class="lc-ai-grid" id="lc-ai-grid" aria-live="polite"></section>
</div></main>${footer()}
<script src="/js/local-ai-catalog.js?v=20260816b"></script><script src="/js/local-ai-catalog-app.js?v=20260816b"></script></body></html>`;
}

function indexPage() {
  const total = searchIndex.filter((model) => model.local_status === 'local').length;
  const schema = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The Local AI Index',
    url: `${BASE}/local-ai-index`, description: 'Search local LLM, voice, image, video, 3D, music and vision models by the hardware you own.',
    numberOfItems: total, isPartOf: { '@type': 'WebSite', name: 'LocalClaw', url: BASE }
  };
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Local AI Index: search by machine | LocalClaw</title><meta name="description" content="Search local LLM, voice, image, video, 3D, music and vision models by RAM, VRAM, operating system and accelerator."><meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE}/local-ai-index"><meta property="og:type" content="website"><meta property="og:url" content="${BASE}/local-ai-index"><meta property="og:title" content="The Local AI Index"><meta property="og:description" content="Find every kind of AI you can actually run on your machine.">
  <link rel="icon" href="/images/crab-logo.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  ${siteNavAssets()}<link rel="stylesheet" href="/css/local-ai-catalog.css?v=20260816b">${tracking()}<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body class="local-ai-page" data-local-ai-category="all">${siteNavigation('index')}
<main class="lc-ai-main"><div class="lc-ai-shell">
  <section class="lc-ai-hero"><div class="lc-ai-hero-copy"><p class="lc-ai-kicker">The Local AI Index</p><h1 class="lc-ai-title">Everything local AI. <span>Matched to your machine.</span></h1><p class="lc-ai-copy">Search language, voice, image, video, 3D, music and vision models in one hardware-aware index. Local means downloadable weights and a practical inference path, not an API that only saves its output locally.</p><div class="lc-ai-hero-actions"><a class="lc-ai-button lc-ai-button-primary" href="#catalogue">Match my machine</a><a class="lc-ai-button" href="/account">Add a machine</a></div></div>${machinePanel()}</section>
  <nav class="lc-ai-category-grid" aria-label="Local AI categories">${categoryLinks()}</nav>
  ${filters(true)}
  <div class="lc-ai-results-head" id="catalogue"><h2>Local AI results</h2><span class="lc-ai-result-count" id="lc-ai-result-count"></span></div>
  <section class="lc-ai-grid" id="lc-ai-grid" aria-live="polite"></section>
</div></main>${footer()}
<script src="/js/local-ai-search-index.js?v=20260816b"></script><script src="/js/local-ai-catalog-app.js?v=20260816b"></script></body></html>`;
}

function detailPage(model) {
  const config = categoryConfig[model.category];
  const url = `${BASE}/${config.directory}/${model.id}`;
  const schema = {
    '@context': 'https://schema.org', '@graph': [
      {
        '@type': 'SoftwareApplication', name: model.name, applicationCategory: `${config.label}AIApplication`,
    operatingSystem: model.platforms.map(prettyTerm).join(', '), url, description: model.summary,
        memoryRequirements: `${model.min_ram_gb} GB RAM; ${model.min_vram_gb} GB VRAM for the listed entry path`,
        license: model.license, creator: { '@type': 'Organization', name: model.developer }
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Local AI Index', item: `${BASE}/local-ai-index` },
          { '@type': 'ListItem', position: 2, name: config.label, item: `${BASE}${config.route}` },
          { '@type': 'ListItem', position: 3, name: model.name, item: url }
        ]
      }
    ]
  };
  const list = (items) => array(items).map((item) => `<li>${esc(item)}</li>`).join('');
  const specs = [
    ['Category', config.label], ['Developer', model.developer], ['Local status', model.local_status],
    ['RAM floor', `${model.min_ram_gb} GB`], ['VRAM floor', model.min_vram_gb ? `${model.min_vram_gb} GB` : 'Not required'],
    ['Platforms', model.platforms.map(prettyTerm).join(', ')], ['Compute', model.accelerators.map(prettyTerm).join(', ')],
    ['Runtimes', model.runtime.join(', ')], ['Outputs', model.output.join(', ')], ['License', model.license]
  ].map(([label, value]) => `<div class="lc-ai-detail-spec"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(model.name)} local ${esc(config.label.toLowerCase())} AI guide | LocalClaw</title><meta name="description" content="${esc(`${model.name}: local ${config.label.toLowerCase()} model hardware, RAM, VRAM, runtime, output, license and installation guidance.`)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${url}">
  <meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(model.name)} local ${esc(config.label)} guide"><meta property="og:description" content="${esc(model.summary)}"><link rel="icon" href="/images/crab-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">${siteNavAssets()}<link rel="stylesheet" href="/css/local-ai-catalog.css?v=20260816b">${tracking()}<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body class="local-ai-page">${siteNavigation(config.nav)}<main class="lc-ai-main"><div class="lc-ai-shell">
  <header class="lc-ai-detail-head"><p class="lc-ai-kicker"><a href="${config.route}">${esc(config.label)} catalogue</a> · Verified local path</p><h1 class="lc-ai-title">${esc(model.name)} <span>local guide</span></h1><p class="lc-ai-copy">${esc(model.summary)}</p><div class="lc-ai-hero-actions"><a class="lc-ai-button lc-ai-button-primary" href="${esc(model.install_url)}" target="_blank" rel="noopener">Open installation source</a><a class="lc-ai-button" href="${config.route}">Compare ${esc(config.plural)}</a></div></header>
  <div class="lc-ai-detail-grid"><div><section class="lc-ai-detail-panel"><h2>What it does</h2><div class="lc-ai-task-list">${model.tasks.map((task) => `<span class="lc-ai-task">${esc(prettyTerm(task))}</span>`).join('')}</div><p>${esc(model.hardware_note)}</p><div class="lc-ai-source-note">Hardware figures are practical entry floors, not performance guarantees. Resolution, duration, precision, offloading and runtime versions can materially change memory use.</div></section>
  <section class="lc-ai-detail-panel"><h2>Strengths</h2><ul>${list(model.strengths)}</ul></section><section class="lc-ai-detail-panel"><h2>Limits to know</h2><ul>${list(model.caveats)}</ul></section></div>
  <aside><section class="lc-ai-detail-panel"><h2>Local requirements</h2><div class="lc-ai-detail-specs">${specs}</div></section><section class="lc-ai-detail-panel"><h2>Primary evidence</h2><p>LocalClaw links to the official project or model repository used to verify the downloadable local path.</p><a class="lc-ai-button" href="${esc(model.source_url)}" target="_blank" rel="noopener">Official source</a></section></aside></div>
</div></main>${footer()}</body></html>`;
}

for (const [key, config] of Object.entries(categoryConfig)) {
  const landingPath = path.join(ROOT, `${key === '3d' ? '3d' : key}-models.html`);
  fs.writeFileSync(landingPath, landingPage(key, config));
  normalizeDirectory(landingPath);
  const directory = path.join(ROOT, config.directory);
  fs.mkdirSync(directory, { recursive: true });
  for (const model of multimodal.filter((entry) => entry.category === key)) {
    fs.writeFileSync(path.join(directory, `${model.id}.html`), detailPage(model));
  }
  normalizeDirectory(directory);
}

fs.writeFileSync(path.join(ROOT, 'local-ai-index.html'), indexPage());
normalizeDirectory(path.join(ROOT, 'local-ai-index.html'));
console.log(`Generated ${Object.keys(categoryConfig).length} catalogues, ${multimodal.length} detail pages and ${searchIndex.length} universal search records.`);
