const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { siteNavigation, siteNavAssets } = require('./site-navigation');
const { normalizeDirectory } = require('./normalize-public-urls');
const { installChoiceStyles, multimodalInstallPicker } = require('./install-choice-ui');

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
const externalMedia = loadScript('js/external-media-catalog.js', 'LOCAL_AI_EXTERNAL_MEDIA', '');
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
const ratingModelId = (model) => `${model.category}-${model.id}`;
const ratingCategoryLabel = (model) => model.category === '3d' ? '3D' : categoryConfig[model.category].label.toLowerCase();
const ratingLabel = (model) => `Community ${ratingCategoryLabel(model)} rating`;
const ratingSubject = (model) => `${ratingCategoryLabel(model)} AI model`;

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
  return `<footer class="lc-ai-footer"><div class="lc-ai-shell lc-ai-footer-inner"><span>© 2026 LocalClaw · The Local AI Index</span><div class="lc-ai-footer-links"><a href="/#local-ai-index">All local AI</a><a href="/computers">Computers</a><a href="/ram-gpu-for-local-ai">RAM/GPU</a><a href="/blog/">Blog</a><a href="/software">Software</a><a href="/privacy">Privacy</a></div></div></footer>`;
}

function externalMediaEntry(model) {
  return externalMedia[model.category] && externalMedia[model.category][model.id]
    ? externalMedia[model.category][model.id]
    : null;
}

function renderStaticVideoExample(entry) {
  const items = array(entry.items).length ? entry.items : [entry];
  const media = items.map((item) => {
    if (item.kind === 'video') {
      const poster = item.poster || entry.poster || '';
      return `<video class="lc-external-media-object" controls preload="metadata" playsinline${poster ? ` poster="${esc(poster)}"` : ''}><source src="${esc(item.url)}" type="video/mp4">Your browser cannot play this external video. <a href="${esc(item.url)}">Open the video</a>.</video>`;
    }
    return `<img class="lc-external-media-object" src="${esc(item.url)}" alt="${esc(item.alt || entry.alt || 'Official model example')}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  }).join('');
  const galleryClass = items.length > 1 ? ' lc-external-media-gallery' : '';
  return `<div class="lc-external-media lc-external-media-${esc(items[0].kind || entry.kind)}${galleryClass}" data-media-ready="true"><div class="lc-external-media-stage">${media}</div><div class="lc-external-media-meta"><span>Streamed from the official source</span><a href="${esc(entry.sourceUrl)}" target="_blank" rel="noopener nofollow">${esc(entry.sourceLabel)}</a></div></div>`;
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
  const hasVisualExamples = ['image', 'video', '3d'].includes(key);
  const externalMediaScripts = !hasVisualExamples ? '' : key === 'video'
    ? '<script src="/js/external-media-catalog.js?v=20260818a"></script><script src="/js/external-media.js?v=20260818a"></script>'
    : '<script src="/js/external-media-catalog.js?v=20260816g"></script><script src="/js/external-media.js?v=20260816d"></script>';
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
  ${siteNavAssets()}<link rel="stylesheet" href="/css/local-ai-catalog.css?v=20260816c"><link rel="stylesheet" href="/css/community-ratings-20260802a.css?v=20260803a">${hasVisualExamples ? '<link rel="stylesheet" href="/css/external-media.css?v=20260816c">' : ''}${tracking()}<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body class="local-ai-page" data-local-ai-category="${key}">${siteNavigation(config.nav)}
<main class="lc-ai-main"><div class="lc-ai-shell">
  <section class="lc-ai-hero"><div class="lc-ai-hero-copy"><p class="lc-ai-kicker">The Local AI Index · ${esc(config.label)}</p><h1 class="lc-ai-title">${esc(config.heading.replace(/ locally$/i, ''))} <span>locally</span></h1><p class="lc-ai-copy">${esc(config.description)}</p><div class="lc-ai-hero-actions"><a class="lc-ai-button lc-ai-button-primary" href="/#local-ai-index">Search on the homepage</a><a class="lc-ai-button" href="#catalogue">Browse ${count} verified entries</a></div></div>${machinePanel()}</section>
  <nav class="lc-ai-category-grid" aria-label="Local AI categories">${categoryLinks(key)}</nav>
  ${filters(false)}
  <div class="lc-ai-results-head" id="catalogue"><h2>${esc(config.label)} catalogue</h2><span class="lc-ai-result-count" id="lc-ai-result-count"></span></div>
  <section class="lc-ai-grid" id="lc-ai-grid" aria-live="polite"></section>
</div></main>${footer()}
${externalMediaScripts}<script src="/js/local-ai-catalog.js?v=20260820b"></script><script src="/js/local-ai-catalog-app.js?v=20260816f"></script><script src="/js/community-ratings-20260802a.js?v=20260803a"></script></body></html>`;
}

function detailPage(model) {
  const config = categoryConfig[model.category];
  const mediaEntry = externalMediaEntry(model);
  const hasVisualExample = model.category === 'video' ? Boolean(mediaEntry) : ['image', '3d'].includes(model.category);
  const staticVideoExample = model.category === 'video' && mediaEntry ? renderStaticVideoExample(mediaEntry) : '';
  const previewImage = model.category === 'video' && mediaEntry
    ? ((mediaEntry.kind === 'video' && mediaEntry.poster) || (mediaEntry.kind === 'image' && mediaEntry.url))
    : '';
  const previewCopy = model.category !== 'video' || (mediaEntry && mediaEntry.kind === 'video')
    ? 'Play the official source preview directly below. The media stays on the official publisher server and is never hosted by LocalClaw.'
    : 'View the official source preview directly below. The media stays on the official publisher server and is never hosted by LocalClaw.';
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
          { '@type': 'ListItem', position: 1, name: 'Local AI Index', item: `${BASE}/` },
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
  const installPicker = multimodalInstallPicker(model, config);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(model.name)} local ${esc(config.label.toLowerCase())} AI guide | LocalClaw</title><meta name="description" content="${esc(`${model.name}: local ${config.label.toLowerCase()} model hardware, RAM, VRAM, runtime, output, license and installation guidance.`)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${url}">
  <meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(model.name)} local ${esc(config.label)} guide"><meta property="og:description" content="${esc(model.summary)}">${previewImage ? `<meta property="og:image" content="${esc(previewImage.startsWith('/') ? `${BASE}${previewImage}` : previewImage)}">` : ''}<link rel="icon" href="/images/crab-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">${siteNavAssets()}<link rel="stylesheet" href="/css/local-ai-catalog.css?v=20260816c"><link rel="stylesheet" href="/css/community-ratings-20260802a.css?v=20260803a">${hasVisualExample ? '<link rel="stylesheet" href="/css/external-media.css?v=20260816c">' : ''}${tracking()}<style>${installChoiceStyles}</style><script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body class="local-ai-page">${siteNavigation(config.nav)}<main class="lc-ai-main"><div class="lc-ai-shell">
  <header class="lc-ai-detail-head"><p class="lc-ai-kicker"><a href="${config.route}">${esc(config.label)} catalogue</a> · Verified local path</p><h1 class="lc-ai-title">${esc(model.name)} <span>local guide</span></h1><p class="lc-ai-copy">${esc(model.summary)}</p>${installPicker}</header>
  <div class="lc-ai-detail-grid"><div>${hasVisualExample ? `<section class="lc-ai-detail-panel"><h2>${model.category === 'image' ? 'Official examples' : 'Official example'}</h2><p>${model.category === 'image' ? 'Browse several official outputs directly below. Each image stays on the official publisher server and is never hosted by LocalClaw.' : esc(previewCopy)}</p>${staticVideoExample || `<div class="lc-external-media" data-external-media data-media-category="${esc(model.category)}" data-media-id="${esc(model.id)}"></div>`}</section>` : ''}<section class="lc-ai-detail-panel"><h2>What it does</h2><div class="lc-ai-task-list">${model.tasks.map((task) => `<span class="lc-ai-task">${esc(prettyTerm(task))}</span>`).join('')}</div><p>${esc(model.hardware_note)}</p><div class="lc-ai-source-note">Hardware figures are practical entry floors, not performance guarantees. Resolution, duration, precision, offloading and runtime versions can materially change memory use.</div></section>
  <section class="lc-ai-detail-panel"><h2>Strengths</h2><ul>${list(model.strengths)}</ul></section><section class="lc-ai-detail-panel"><h2>Limits to know</h2><ul>${list(model.caveats)}</ul></section></div>
  <aside><div class="lc-ai-detail-rating" data-community-rating data-model-id="${esc(ratingModelId(model))}" data-rating-mode="full" data-rating-label="${esc(ratingLabel(model))}" data-rating-subject="${esc(ratingSubject(model))}"></div><section class="lc-ai-detail-panel"><h2>Local requirements</h2><div class="lc-ai-detail-specs">${specs}</div></section><section class="lc-ai-detail-panel"><h2>Primary evidence</h2><p>LocalClaw links to the official project or model repository used to verify the downloadable local path.</p><a class="lc-ai-button" href="${esc(model.source_url)}" target="_blank" rel="noopener">Official source</a></section></aside></div>
</div></main>${footer()}${hasVisualExample && model.category !== 'video' ? '<script src="/js/external-media-catalog.js?v=20260816g"></script><script src="/js/external-media.js?v=20260816d"></script>' : ''}<script src="/js/community-ratings-20260802a.js?v=20260803a"></script></body></html>`;
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

console.log(`Generated ${Object.keys(categoryConfig).length} catalogues and ${multimodal.length} detail pages. The universal index lives on the homepage.`);
