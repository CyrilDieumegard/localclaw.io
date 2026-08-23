const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const dataSource = read('js/data.js');
const catalogueUpdateMatch = dataSource.match(/^\/\/ Updated ([A-Za-z]+ \d{1,2}, \d{4})/m);
const catalogueUpdatedIso = catalogueUpdateMatch
  ? new Date(`${catalogueUpdateMatch[1]} 12:00:00 UTC`).toISOString().slice(0, 10)
  : '';
const dataContext = {};
vm.createContext(dataContext);
vm.runInContext(`${dataSource};this.DATA=APP_DATA;`, dataContext);
const speechContext = { window: {} };
vm.createContext(speechContext);
vm.runInContext(read('js/home-index-speech-20260814c.js'), speechContext);
const multimodalContext = { window: {} };
vm.createContext(multimodalContext);
vm.runInContext(read('js/local-ai-catalog.js'), multimodalContext);
const detailsContext = {};
vm.createContext(detailsContext);
vm.runInContext(`${read('js/model-details.js')};this.DETAILS=MODEL_DETAILS;`, detailsContext);

const uniqueLocalModels = Array.from(new Map(
  dataContext.DATA.models.filter(model => !model.hosted_only).map(model => [model.id, model])
).values());
const hfRepoVerification = dataContext.DATA.hfRepoVerification || {};
const publicGgufHfRepos = hfRepoVerification.publicGguf || {};
const publicModelCardHfRepos = hfRepoVerification.publicModelCard || {};
const gatedHfRepos = hfRepoVerification.gated || {};
const unavailableHfRepos = hfRepoVerification.unavailable || {};
const hfVerificationDate = String(hfRepoVerification.checkedAt || '').slice(0, 10);
const unavailableLlmIds = new Set(Object.keys(unavailableHfRepos));
const indexableLocalModels = uniqueLocalModels.filter(model => !unavailableLlmIds.has(model.id));
const speechModels = speechContext.window.HOME_INDEX_SPEECH_MODELS || [];
const multimodalModels = multimodalContext.window.LOCAL_AI_CATALOG || [];
const modelDetails = detailsContext.DETAILS || {};
const ttsList = read('tts-list.html');
const ttsMatch = ttsList.match(/const TTS_MODELS = (\[[\s\S]*?\n\s*\]);/);
const ttsContext = {};
if (ttsMatch) {
  vm.createContext(ttsContext);
  vm.runInContext(`this.MODELS=${ttsMatch[1]}`, ttsContext);
}
const allSpeechRecords = ttsContext.MODELS || [];
const localSpeechRecords = allSpeechRecords.filter(model => !model.delivery);
const remoteSpeechRecords = allSpeechRecords.filter(model => model.delivery === 'online' || model.delivery === 'api');
const unverifiedSpeechRecords = allSpeechRecords.filter(model => model.delivery === 'unverified');
const speechById = new Map(allSpeechRecords.map(model => [model.id, model]));
const localSpeechIds = new Set(speechModels.map(model => model.id));
const index = read('index.html');
const indexText = index.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const llms = read('llms.txt');
const llmsFull = read('llms-full.txt');
const newModelSort = require(path.join(ROOT, 'js/new-model-sort-20260814a.js'));

if (uniqueLocalModels.length !== 225) errors.push(`Local LLM route count is ${uniqueLocalModels.length}, expected 225 preserved routes`);
if (indexableLocalModels.length !== 219) errors.push(`Indexable local LLM count is ${indexableLocalModels.length}, expected 219`);
if (unavailableLlmIds.size !== 6) errors.push(`Unavailable LLM tombstone count is ${unavailableLlmIds.size}, expected 6`);
if (multimodalModels.length !== 65) errors.push(`Multimodal model count is ${multimodalModels.length}, expected 65`);

const localModelsById = new Map(uniqueLocalModels.map(model => [model.id, model]));
const correctedModelFacts = {
  'gemma4-e2b': {size_gb: 3.4, recommended_quant: 'Q5_K_M', hf_repo: 'unsloth/gemma-4-E2B-it-GGUF'},
  'gemma4-e4b': {size_gb: 5, recommended_quant: 'Q4_K_M', hf_repo: 'unsloth/gemma-4-E4B-it-GGUF'},
  'phi4-14b': {recommended_quant: 'Q6_K'},
  'ling-flash-base-2.0': {recommended_quant: 'Q3_K_S'},
  'phi3-3.8b': {recommended_quant: 'Q4'},
  'phi4-mini-reasoning': {recommended_quant: 'Q4_K_M'},
  'nuextract-3.8b': {recommended_quant: 'Q4_K_M'},
  'dbrx-132b': {recommended_quant: 'Q6_K'},
  'step3.5-flash': {params: '196.81B (11B active, MoE)', size_gb: 118.7, min_ram: 192, recommended_quant: 'Q4_K'},
  'glm4-9b': {recommended_quant: 'Q6_K'},
  'r1-1776-14b': {name: 'R1-1776 (671B MoE)', params: '671B (37B active, MoE)', size_gb: 404.4, min_ram: 512, recommended_quant: 'Q4_K_M'},
  'kimi-k2.5-32b': {name: 'Kimi K2.5 (1T MoE)', params: '1T (32B active, MoE)', size_gb: 621.2, min_ram: 1024, recommended_quant: 'Q4_K_M'},
  'glm4.5-air': {params: '106B (12B active, MoE)', size_gb: 73, min_ram: 96, recommended_quant: 'Q4_K_M'},
  'glm4.7': {params: '355B (32B active, MoE)', size_gb: 216.5, min_ram: 256, recommended_quant: 'Q4_K_M'},
  'minimax-m2.1': {params: '230B (10B active, MoE)', size_gb: 138.3, min_ram: 192, recommended_quant: 'Q4_K_M'}
};
for (const [modelId, expected] of Object.entries(correctedModelFacts)) {
  const model = localModelsById.get(modelId);
  if (!model) {
    errors.push(`Corrected LLM record is missing: ${modelId}`);
    continue;
  }
  for (const [field, value] of Object.entries(expected)) {
    if (!Object.is(model[field], value)) errors.push(`${modelId}.${field} is ${JSON.stringify(model[field])}, expected ${JSON.stringify(value)}`);
  }
}

for (const marker of [
  `${indexableLocalModels.length} local LLM pages`,
  `${speechModels.length} local speech records`
]) {
  if (!indexText.includes(marker)) errors.push(`Homepage missing visible truth marker: ${marker}`);
}
for (const marker of [
  `numberOfItems": ${indexableLocalModels.length}`,
  `numberOfItems": ${speechModels.length}`,
  'Four signals, never blended',
  'Independent benchmark reality check',
  'does not scrape, copy or blend their rankings',
  'It is not a standardized third-party benchmark.'
]) {
  if (!index.includes(marker)) errors.push(`Homepage missing truth marker: ${marker}`);
}
const fallbackLlmSection = (index.match(/<section id="llm-index"[\s\S]*?<\/section>/) || [''])[0];
const fallbackSpeechSection = (index.match(/<section id="tts-index"[\s\S]*?<\/section>/) || [''])[0];
const fallbackLlmLinks = (fallbackLlmSection.match(/href="\/models\//g) || []).length;
const fallbackSpeechLinks = (fallbackSpeechSection.match(/href="\/tts\//g) || []).length;
const fallbackLlmSampleSize = 24;
const fallbackSpeechSampleSize = 12;
const fallbackMultimodalSampleSize = 4;
if (fallbackLlmLinks !== Math.min(fallbackLlmSampleSize, indexableLocalModels.length)) errors.push(`Homepage crawlable LLM snapshot has ${fallbackLlmLinks} links, expected ${Math.min(fallbackLlmSampleSize, indexableLocalModels.length)}`);
if (fallbackSpeechLinks !== Math.min(fallbackSpeechSampleSize, speechModels.length)) errors.push(`Homepage crawlable speech snapshot has ${fallbackSpeechLinks} links, expected ${Math.min(fallbackSpeechSampleSize, speechModels.length)}`);
for (const [anchor, directory, catalogue] of [
  ['image-index', 'image', '/image-models'],
  ['video-index', 'video', '/video-models'],
  ['three-d-index', '3d', '/3d-models'],
  ['music-index', 'music', '/music-models'],
  ['vision-index', 'vision', '/vision-models']
]) {
  const section = (index.match(new RegExp(`<section id="${anchor}"[\\s\\S]*?<\\/section>`)) || [''])[0];
  const links = (section.match(new RegExp(`href="\\/${directory}\\/`, 'g')) || []).length;
  const expected = Math.min(fallbackMultimodalSampleSize, multimodalModels.filter(model => model.category === directory).length);
  if (links !== expected) errors.push(`Homepage crawlable ${directory} snapshot has ${links} links, expected ${expected}`);
  if (!section.includes(`href="${catalogue}"`)) errors.push(`Homepage crawlable ${directory} snapshot is missing its dedicated catalogue link`);
}
if (!fallbackLlmSection.includes('Representative crawlable snapshot') || !fallbackSpeechSection.includes('Representative crawlable snapshot')) errors.push('Homepage fallback must clearly identify its LLM and speech content as a representative snapshot');
if (fallbackLlmSection.includes(`All ${indexableLocalModels.length} current local records`) || fallbackSpeechSection.includes(`All ${speechModels.length} records`)) errors.push('Homepage fallback must not claim to list every catalogue record');
for (const marker of [
  `Local LLM pages: ${indexableLocalModels.length}`,
  `Local speech records: ${speechModels.length}`,
  'Community ratings never change or blend',
  '/llms-full.txt'
]) {
  if (!llms.includes(marker)) errors.push(`llms.txt missing truth marker: ${marker}`);
}
if (!llmsFull.includes(`## Local LLMs (${indexableLocalModels.length})`)) errors.push('llms-full.txt LLM count is stale');
if (!llmsFull.includes(`## Local Speech Models (${speechModels.length})`)) errors.push('llms-full.txt speech count is stale');

let upstreamOnlyDetails = 0;
const modelGenerator = read('scripts/generate-model-pages.js');
const legacyModelDetail = read('llm-detail.html');
const modelsIndex = read('models/index.html');
const modelSitemap = read('sitemap-models.xml');
for (const forbidden of ['d.strengths', 'd.weaknesses', 'd.use_cases', 'd.similar_models', 'generateDefaultDetails(']) {
  if (modelGenerator.includes(forbidden)) errors.push(`Model page generator still consumes unverified narrative data: ${forbidden}`);
}
for (const marker of [
  "Number(m.min_ram || 0) >= 128",
  "const sourceOnly = hfState === 'publicModelCard' || hfState === 'gated'",
  'data-source-only-status=',
  'does not claim an LM Studio, GGUF or one-click installation path'
]) {
  if (!modelGenerator.includes(marker)) errors.push(`Model page generator missing source/install truth guard: ${marker}`);
}
for (const marker of [
  "Number(model.min_ram||0)>=128",
  "var sourceOnly=hfState==='publicModelCard'||hfState==='gated'",
  "if(hasPublicGguf&&!serverGrade)",
  'does not publish a hardware-fit recommendation, quantization download table or one-click installation path'
]) {
  if (!legacyModelDetail.includes(marker)) errors.push(`Legacy model detail missing source/install truth guard: ${marker}`);
}
for (const model of uniqueLocalModels) {
  const html = read(`models/${model.id}.html`);
  const hfStates = [
    ['public-gguf', publicGgufHfRepos],
    ['public-model-card', publicModelCardHfRepos],
    ['gated', gatedHfRepos],
    ['unavailable', unavailableHfRepos]
  ].filter(([, records]) => records[model.id] === model.hf_repo).map(([state]) => state);
  if (hfStates.length !== 1) {
    errors.push(`${model.id} must have exactly one current Hugging Face public-link classification`);
  }
  const hfState = hfStates[0];

  if (hfState === 'unavailable') {
    for (const marker of [
      '<meta name="robots" content="noindex, follow, noarchive">',
      `<link rel="canonical" href="https://localclaw.io/models/${model.id}">`,
      `data-preserved-model-route="${model.id}"`,
      'data-hf-repo-status="unavailable"',
      `anonymous catalogue audit on ${hfVerificationDate}`,
      'This is a tombstone, not an active local-model recommendation.',
      `<code>${model.hf_repo}</code>`,
      'No downloadable local checkpoint or install path is asserted.',
      'No RAM fit, quantization availability, capability rating or LocalClaw score is shown.',
      'excluded from the homepage index, score leaders, AI-readable model lists and sitemaps.',
      'href="https://huggingface.co/models?search=',
      'Search Hugging Face'
    ]) {
      if (!html.includes(marker)) errors.push(`${model.id} tombstone missing marker: ${marker}`);
    }
    for (const forbidden of [
      `href="https://huggingface.co/${model.hf_repo}"`,
      'SoftwareApplication',
      'FAQPage',
      'class="score-card"',
      '<div class="score">',
      '<small>/10</small>',
      '38% quality, 24% coding, 24% reasoning and 14% speed',
      'data-community-rating',
      'data-localclaw-model-context',
      '<h2>Install path</h2>',
      'class="install-steps"',
      'class="bars"',
      '<div class="k">Minimum RAM</div>',
      'window.LOCALCLAW_MODEL='
    ]) {
      if (html.includes(forbidden)) errors.push(`${model.id} tombstone still exposes forbidden content: ${forbidden}`);
    }
    const tombstoneSchemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const tombstoneGraph = tombstoneSchemaMatch ? JSON.parse(tombstoneSchemaMatch[1])['@graph'] : [];
    if (!tombstoneGraph.some(item => item['@type'] === 'WebPage') || !tombstoneGraph.some(item => item['@type'] === 'BreadcrumbList')) {
      errors.push(`${model.id} tombstone schema must contain only its WebPage status and breadcrumb context`);
    }
    for (const [surface, content] of [
      ['homepage', index],
      ['llms.txt', llms],
      ['llms-full.txt', llmsFull],
      ['models/index.html', modelsIndex],
      ['sitemap-models.xml', modelSitemap]
    ]) {
      if (content.includes(`/models/${model.id}`)) errors.push(`${surface} must exclude unavailable LLM tombstone ${model.id}`);
    }
    continue;
  }

  const ratings = model.benchmarks || {};
  const expectedScore = Math.max(0, Math.min(10,
    (Number(ratings.quality) || 0) * 0.38
    + (Number(ratings.coding) || 0) * 0.24
    + (Number(ratings.reasoning) || 0) * 0.24
    + (Number(ratings.speed) || 0) * 0.14
  )).toFixed(1);
  if (!html.includes('LocalClaw catalogue score') || !html.includes(`<div class="score">${expectedScore}<small>/10</small>`)) {
    errors.push(`${model.id} does not use the canonical LocalClaw catalogue score ${expectedScore}`);
  }
  if (!html.includes('38% quality, 24% coding, 24% reasoning and 14% speed')) {
    errors.push(`${model.id} is missing the crawlable LocalClaw score method`);
  }
  if (!html.includes('They are not a standardized third-party benchmark.')) {
    errors.push(`${model.id} does not disclose the editorial catalogue-rating limit`);
  }
  const sourceOnlyState = hfState === 'public-model-card' || hfState === 'gated';
  if (hfState === 'public-gguf') {
    if (!html.includes(`href="https://huggingface.co/${model.hf_repo}"`) || !html.includes('data-hf-repo-status="public-gguf"') || !html.includes('Public GGUF repository')) {
      errors.push(`${model.id} is missing its verified public GGUF repository link`);
    }
  } else if (hfState === 'public-model-card') {
    if (!html.includes(`href="https://huggingface.co/${model.hf_repo}"`) || !html.includes('data-hf-repo-status="public-model-card"') || !html.includes('no GGUF file verified')) {
      errors.push(`${model.id} is missing its public model-card-only disclosure`);
    }
  } else if (hfState === 'gated') {
    if (!html.includes(`href="https://huggingface.co/${model.hf_repo}"`) || !html.includes('data-hf-repo-status="gated"') || !html.includes('access terms apply')) {
      errors.push(`${model.id} is missing its gated model-card disclosure`);
    }
  }
  if (sourceOnlyState) {
    const sourceState = hfState === 'public-model-card' ? 'publicModelCard' : 'gated';
    for (const marker of [
      `data-source-only-status="${sourceState}"`,
      'No public GGUF',
      'Does LocalClaw provide a one-click install',
      'does not claim an LM Studio, GGUF or one-click installation path'
    ]) {
      if (!html.includes(marker)) errors.push(`${model.id} source-only page missing marker: ${marker}`);
    }
    if (hfState === 'gated') {
      for (const marker of ['Approval required', 'Request access', 'account approval or licence acceptance']) {
        if (!html.includes(marker)) errors.push(`${model.id} gated page missing access marker: ${marker}`);
      }
    }
    for (const forbidden of [
      'Run with LocalClaw',
      'lmstudio://',
      '<h2>Install path</h2>',
      '<h2>Deployment path</h2>',
      'This model fits these next steps',
      'data-localclaw-model-context',
      '"@type":"SoftwareApplication"'
    ]) {
      if (html.includes(forbidden)) errors.push(`${model.id} source-only page still exposes forbidden install claim: ${forbidden}`);
    }
  }
  const serverGrade = Number(model.min_ram || 0) >= 128 || (model.tags || []).includes('server-grade');
  if (hfState === 'public-gguf' && serverGrade) {
    for (const marker of ['server-grade catalogue target', '<h2>Deployment path</h2>']) {
      if (!html.includes(marker)) errors.push(`${model.id} server-grade page missing marker: ${marker}`);
    }
    for (const forbidden of ['Run with LocalClaw', 'lmstudio://', '<h2>Install path</h2>']) {
      if (html.includes(forbidden)) errors.push(`${model.id} server-grade page still exposes desktop install claim: ${forbidden}`);
    }
  }
  if (!html.includes('<strong>Catalogue summary:</strong>') || html.includes('<h2>Strengths</h2>') || html.includes('<h2>Best use cases</h2>')) {
    errors.push(`${model.id} still presents unverified narrative details as factual sections`);
  }
  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const schemaGraph = schemaMatch ? JSON.parse(schemaMatch[1])['@graph'] : [];
  const software = schemaGraph.find(item => item['@type'] === 'SoftwareApplication') || {};
  const webPage = schemaGraph.find(item => item['@type'] === 'WebPage');
  if (sourceOnlyState && (!webPage || Object.keys(software).length)) {
    errors.push(`${model.id} source-only schema must use WebPage and must not claim SoftwareApplication`);
  }
  const details = modelDetails[model.id] || {};
  if (software.license && !details.license_url) errors.push(`${model.id} publishes a schema licence without a licence URL`);
  if (software.creator && !(model.source_url || details.official_blog || details.paper_url)) {
    errors.push(`${model.id} publishes a schema creator without model-specific upstream material`);
  }
  for (const href of [details.official_blog, details.paper_url, details.license_url].filter(Boolean)) {
    if (!html.includes(`href="${href}"`)) errors.push(`${model.id} does not expose its available detail source ${href}`);
  }
  if (!modelDetails[model.id]) {
    upstreamOnlyDetails += 1;
    if (software.license || software.creator) errors.push(`${model.id} publishes an unverified schema license or creator`);
    if (!html.includes('See upstream repository')) errors.push(`${model.id} must label unverified developer/license fields as upstream-only`);
  }
}

for (const model of allSpeechRecords) {
  const html = read(`tts/${model.id}.html`);
  if (model.delivery === 'unverified') {
    for (const marker of [
      '<meta name="robots" content="noindex, follow">',
      'Verification status',
      'No Audio, quality or speed score is published',
      'excluded from local counts, rankings, comparison and community ratings',
      'href="/tts/coqui-tts"'
    ]) {
      if (!html.includes(marker)) errors.push(`${model.id} tombstone missing marker: ${marker}`);
    }
    for (const forbidden of [
      'Audio catalogue score',
      'Audio profile score',
      'data-community-rating',
      'class="install-steps"',
      'class="command"',
      'SoftwareApplication',
      'FAQPage'
    ]) {
      if (html.includes(forbidden)) errors.push(`${model.id} tombstone still exposes forbidden content: ${forbidden}`);
    }
    continue;
  }
  const expectedScore = Math.max(0, Math.min(10,
    (Number(model.quality) || 0) * 0.68 + (Number(model.speed) || 0) * 0.32
  )).toFixed(1);
  const expectedLabel = localSpeechIds.has(model.id) ? 'Audio catalogue score' : 'Audio profile score';
  if (!html.includes(expectedLabel) || !html.includes(`<div class="score">${expectedScore}<small>/10</small>`)) {
    errors.push(`${model.id} does not use the canonical Audio catalogue score ${expectedScore}`);
  }
  if (!html.includes('68% quality and 32% speed, capped at 10') || !html.includes('not a standardized third-party benchmark')) {
    errors.push(`${model.id} is missing the crawlable Audio score method`);
  }
  if (!html.includes('<strong>Catalogue summary:</strong>')) errors.push(`${model.id} does not label its speech description as catalogue metadata`);
}
if (allSpeechRecords.length !== 71) errors.push(`Speech source count is ${allSpeechRecords.length}, expected 71 preserved routes`);

const multimodalRatingIds = new Set();
for (const model of multimodalModels) {
  const directory = model.category === '3d' ? '3d' : model.category;
  const ratingId = `${model.category}-${model.id}`;
  const ratingCategoryLabel = model.category === '3d' ? '3D' : String(model.category).toLowerCase();
  const html = read(`${directory}/${model.id}.html`);
  if (multimodalRatingIds.has(ratingId)) errors.push(`Duplicate multimodal rating ID: ${ratingId}`);
  multimodalRatingIds.add(ratingId);
  for (const marker of [
    'css/community-ratings-20260802a.css?v=20260822a',
    'js/community-ratings-20260802a.js?v=20260803a',
    `data-model-id="${ratingId}"`,
    'data-rating-mode="full"',
    `data-rating-label="Community ${ratingCategoryLabel} rating"`
  ]) {
    if (!html.includes(marker)) errors.push(`${ratingId} detail page missing rating marker: ${marker}`);
  }
}
for (const category of ['image', 'video', '3d', 'music', 'vision']) {
  const landing = read(`${category}-models.html`);
  for (const marker of [
    'css/community-ratings-20260802a.css?v=20260822a',
    'js/community-ratings-20260802a.js?v=20260803a',
    'js/local-ai-catalog-app.js?v=20260816f'
  ]) {
    if (!landing.includes(marker)) errors.push(`${category} catalogue missing rating marker: ${marker}`);
  }
}
if (!read('js/local-ai-catalog-app.js').includes('data-community-rating') || !read('js/local-ai-catalog-app.js').includes('LocalClawRatings?.refresh')) {
  errors.push('Multimodal catalogue app is missing compact rating rendering or refresh');
}
if (!read('functions/_lib/model-ratings.js').includes('MAX_RATINGS_PER_ACCOUNT = 1000')) {
  errors.push('Account rating limit must cover the complete LocalClaw catalogue');
}
if (localSpeechRecords.length !== 68) errors.push(`Local speech source count is ${localSpeechRecords.length}, expected 68`);
if (remoteSpeechRecords.length !== 2) errors.push(`Remote speech source count is ${remoteSpeechRecords.length}, expected 2 online/API references`);
if (unverifiedSpeechRecords.length !== 1 || unverifiedSpeechRecords[0]?.id !== 'xtts-v3') {
  errors.push(`Unverified speech classification must contain only xtts-v3, found ${unverifiedSpeechRecords.map(model => model.id).join(', ') || 'none'}`);
}
if (speechModels.length !== 68 || speechModels.some(model => !localSpeechRecords.some(source => source.id === model.id))) {
  errors.push('Homepage speech export must contain exactly the 68 verified-local source records');
}
for (const forbiddenId of ['edge-tts', 'octave-2', 'xtts-v3']) {
  if (localSpeechIds.has(forbiddenId)) errors.push(`Non-local speech record leaked onto homepage export: ${forbiddenId}`);
}

const qwenSpeech = speechById.get('qwen3-tts') || {};
if (qwenSpeech.hfLink !== 'https://github.com/QwenLM/Qwen3-TTS'
  || qwenSpeech.releaseDate !== '2026-01-22'
  || qwenSpeech.languageCount !== 10
  || qwenSpeech.languages?.join(',') !== 'en,zh,fr,de,es,it,pt,ru,ja,ko'
  || qwenSpeech.installCommand !== 'pip install -U qwen-tts'
  || qwenSpeech.supportedFormats?.join(',') !== 'pytorch,safetensors') {
  errors.push('Qwen3-TTS metadata does not match the verified official release');
}
const kittenSpeech = speechById.get('kitten-tts') || {};
if (kittenSpeech.developer !== 'KittenML'
  || kittenSpeech.hfLink !== 'https://github.com/KittenML/KittenTTS'
  || kittenSpeech.releaseDate !== '2026-02-24'
  || kittenSpeech.languageCount !== 1
  || kittenSpeech.sizeLabel !== '25–80 MB'
  || kittenSpeech.supportedFormats?.join(',') !== 'onnx'
  || !kittenSpeech.installCommand?.includes('/0.8.1/kittentts-0.8.1-py3-none-any.whl')) {
  errors.push('Kitten TTS metadata does not match the verified KittenML v0.8.1 release');
}
for (const f5Id of ['f5-tts', 'f5-tts-v1.1']) {
  const f5 = speechById.get(f5Id) || {};
  if (!String(f5.license || '').includes('CC-BY-NC-4.0 weights') || !String(f5.license || '').includes('MIT code')) {
    errors.push(`${f5Id} must distinguish the CC-BY-NC-4.0 weights from MIT code`);
  }
}
const f5v1 = speechById.get('f5-tts-v1.1') || {};
if (f5v1.name !== 'F5-TTS v1 Base'
  || f5v1.releaseDate !== '2025-03-12'
  || f5v1.languageCount !== 2
  || f5v1.sizeGB !== 1.35
  || f5v1.hfLink !== 'https://huggingface.co/SWivid/F5-TTS/tree/main/F5TTS_v1_Base') {
  errors.push('The preserved f5-tts-v1.1 route must describe the verified F5-TTS v1 Base checkpoint');
}
const kyutaiSpeech = speechById.get('kyutai-stt-2.6b') || {};
if (kyutaiSpeech.hfLink !== 'https://huggingface.co/kyutai/stt-2.6b-en'
  || kyutaiSpeech.languageCount !== 1
  || kyutaiSpeech.languages?.join(',') !== 'en'
  || kyutaiSpeech.sizeGB !== 5.62
  || kyutaiSpeech.latency !== 'medium'
  || !String(kyutaiSpeech.context || '').includes('2.5-second delay')) {
  errors.push('Kyutai STT 2.6B metadata must remain English-only with its documented 2.5-second delay');
}
const xtts = speechById.get('xtts-v3') || {};
if (xtts.delivery !== 'unverified' || xtts.quality !== null || xtts.speed !== null || xtts.sizeGB !== null || xtts.installCommand || xtts.hfLink) {
  errors.push('XTTS v3 must remain an unscored, source-free, non-installable unverified preserved route');
}
if (fs.readdirSync(path.join(ROOT, 'models')).filter(file => file.endsWith('.html')).length !== 227) errors.push('models/ must contain 226 model pages plus one index');
if (fs.readdirSync(path.join(ROOT, 'tts')).filter(file => file.endsWith('.html')).length !== 72) errors.push('tts/ must contain 71 speech pages plus one index');

for (const directory of ['ram', 'hardware', 'use-case']) {
  for (const file of fs.readdirSync(path.join(ROOT, directory)).filter(name => name.endsWith('.html'))) {
    const html = read(`${directory}/${file}`);
    const cardIds = [...html.matchAll(/<h3><a href="\/models\/([^"#?]+)"/g)].map(match => match[1]);
    if (new Set(cardIds).size !== cardIds.length) errors.push(`${directory}/${file} contains duplicate model cards`);
  }
}
for (const file of fs.readdirSync(path.join(ROOT, 'ram')).filter(name => /^\d+gb\.html$/.test(name))) {
  if (!read(`ram/${file}`).includes('not a standardized third-party benchmark')) errors.push(`ram/${file} is missing contextual ranking limits`);
}
for (const file of fs.readdirSync(path.join(ROOT, 'hardware')).filter(name => /^mac-(?!studio-m4-ultra).*\.html$/.test(name))) {
  if (!read(`hardware/${file}`).includes('not a standardized third-party benchmark')) errors.push(`hardware/${file} is missing contextual ranking limits`);
}
for (const file of fs.readdirSync(path.join(ROOT, 'use-case')).filter(name => name !== 'index.html' && name.endsWith('.html'))) {
  if (!read(`use-case/${file}`).includes('not a standardized third-party benchmark')) errors.push(`use-case/${file} is missing contextual ranking limits`);
}

const newPage = read('new.html');
for (const marker of [
  'href="/models/ornith-1-5-9b"',
  'href="/models/ornith-1-5-35b-a3b"',
  'href="/models/llm-jp-4-33b-thinking"',
  '16 GB RAM · Q4_K_M · 262K context',
  '48 GB RAM · Q4_K_M · 262K context',
  '64 GB RAM · Q4_K_M · 65K context',
  'LocalClawNewModels.latestLocalModels(sourceModels, 12, APP_DATA.hfRepoVerification)',
  'js/data.js?v=20260823a',
  'js/new-model-sort-20260814a.js?v=20260814a',
  `${indexableLocalModels.length} indexable local LLM pages`,
  `${uniqueLocalModels.length} preserved route URLs`,
  `${unavailableLlmIds.size} transparent noindex tombstones`,
  `${speechModels.length} local speech records`,
  'Two online/API entries and one unverified reference are excluded.'
]) {
  if (!newPage.includes(marker)) errors.push(`/new missing or stale marker: ${marker}`);
}
for (const staleMarker of ['218-page LocalClaw index', '218 local pages', '56 local speech records']) {
  if (newPage.includes(staleMarker)) errors.push(`/new still exposes stale index copy: ${staleMarker}`);
}
const latestModels = newModelSort.latestLocalModels(dataContext.DATA.models, 12, hfRepoVerification);
const latestIds = latestModels.map(model => model.id);
const expectedLatestIds = ['ornith-1-5-9b', 'ornith-1-5-35b-a3b', 'llm-jp-4-33b-thinking', 'lfm2-5-vl-3b', 'ling-3.0-tiny', 'muse-glimmer-30b', 'qwen3.8-27b'];
if (latestIds.slice(0, expectedLatestIds.length).join(',') !== expectedLatestIds.join(',')) {
  errors.push(`/new selection is stale or mis-sorted: ${latestIds.join(', ')}`);
}
for (const model of latestModels.slice(0, 3)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(model.released || ''))) {
    errors.push(`${model.id}.released needs YYYY-MM-DD precision while it appears in the newest-three surfaces`);
  }
}
for (const [modelId, released] of Object.entries({
  'ornith-1-5-9b': '2026-08-18',
  'ornith-1-5-35b-a3b': '2026-08-18',
  'llm-jp-4-33b-thinking': '2026-08-14',
  'lfm2-5-vl-3b': '2026-08-11',
  'ling-3.0-tiny': '2026-08-10',
  'muse-glimmer-30b': '2026-08-09',
  'qwen3.8-27b': '2026-08-05'
})) {
  if (localModelsById.get(modelId)?.released !== released) {
    errors.push(`${modelId}.released must retain its exact YYYY-MM-DD publication date`);
  }
}
const newJsonLdBlocks = [...newPage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (newJsonLdBlocks.length !== 1) errors.push(`/new must expose exactly one JSON-LD graph, found ${newJsonLdBlocks.length}`);
let newJsonLd = null;
if (newJsonLdBlocks[0]) {
  try {
    newJsonLd = JSON.parse(newJsonLdBlocks[0][1]);
  } catch (error) {
    errors.push(`/new JSON-LD is invalid: ${error.message}`);
  }
}
if (newJsonLd) {
  const graph = Array.isArray(newJsonLd['@graph']) ? newJsonLd['@graph'] : [];
  const collection = graph.find(node => node && node['@type'] === 'CollectionPage');
  const breadcrumb = graph.find(node => node && node['@type'] === 'BreadcrumbList');
  const itemList = graph.find(node => node && node['@type'] === 'ItemList');
  if (!collection || collection.url !== 'https://localclaw.io/new'
    || collection.dateModified !== catalogueUpdatedIso
    || !String(collection.description || '').includes(`${indexableLocalModels.length} indexable local LLM pages`)
    || !String(collection.description || '').includes(`${speechModels.length} local speech records`)) {
    errors.push('/new CollectionPage schema is missing current canonical, freshness or catalogue counts');
  }
  const breadcrumbItems = breadcrumb && Array.isArray(breadcrumb.itemListElement) ? breadcrumb.itemListElement : [];
  if (breadcrumbItems.length !== 2
    || breadcrumbItems[0]?.item !== 'https://localclaw.io/'
    || breadcrumbItems[1]?.item !== 'https://localclaw.io/new') {
    errors.push('/new BreadcrumbList schema is missing the canonical Home > New path');
  }
  const schemaItems = itemList && Array.isArray(itemList.itemListElement) ? itemList.itemListElement : [];
  const schemaIds = schemaItems.map(item => String(item.item || '').replace('https://localclaw.io/models/', ''));
  const schemaNames = schemaItems.map(item => item.name);
  const schemaPositions = schemaItems.map(item => item.position);
  if (!itemList || itemList.numberOfItems !== latestModels.length
    || schemaIds.join(',') !== latestIds.join(',')
    || schemaNames.join(',') !== latestModels.map(model => model.name).join(',')
    || schemaPositions.some((position, index) => position !== index + 1)) {
    errors.push('/new ItemList schema does not match the canonical 12-model freshness selection');
  }
}
if (!(newModelSort.releaseTimestamp('2026-07-31') > newModelSort.releaseTimestamp('2026-07'))) {
  errors.push('/new release parser does not correctly compare YYYY-MM-DD with YYYY-MM');
}
if ((newPage.match(/LocalClawNewModels\.releaseTimestamp\(dateStr\)/g) || []).length < 3) {
  errors.push('/new date formatting, age and NEW badge helpers must all use the shared release parser');
}
if (newPage.includes("new Date(dateStr + '-")) errors.push('/new renderer still corrupts complete release dates by appending a day');
const fallbackOrder = ['ornith-1-5-9b', 'ornith-1-5-35b-a3b', 'llm-jp-4-33b-thinking'].map(id => newPage.indexOf(`href="/models/${id}"`));
if (fallbackOrder.some(index => index < 0) || !(fallbackOrder[0] < fallbackOrder[1] && fallbackOrder[1] < fallbackOrder[2])) {
  errors.push('/new static fallback order does not match the canonical freshness sort');
}

const expectedFreshIds = expectedLatestIds.slice(0, 3);
const currentApp = read('js/app.js');
const versionedApp = read('js/app-20260816a.js');
function freshCardIds(source) {
  const section = source.match(/<section id="fresh-local-ai"[\s\S]*?<\/section>/)?.[0] || '';
  return [...section.matchAll(/data-fast-goal-source="home_recent" data-fast-goal-model="([^"]+)"/g)].map(match => match[1]);
}
for (const [name, source] of [['js/app.js', currentApp], ['js/app-20260816a.js', versionedApp]]) {
  const ids = freshCardIds(source);
  if (ids.join(',') !== expectedFreshIds.join(',')) {
    errors.push(`${name} Fresh cards are stale or mis-sorted: ${ids.join(', ')}`);
  }
}
const currentFreshSection = currentApp.match(/<section id="fresh-local-ai"[\s\S]*?<\/section>/)?.[0] || '';
const versionedFreshSection = versionedApp.match(/<section id="fresh-local-ai"[\s\S]*?<\/section>/)?.[0] || '';
if (currentFreshSection !== versionedFreshSection) errors.push('js/app.js and js/app-20260816a.js must keep identical current Fresh-card markup');
if (!index.includes('js/data.js?v=20260823a') || !index.includes('js/app-20260816a.js?v=20260823a')) {
  errors.push('Homepage cache-busters do not point to the corrected newest-model data and app bundle');
}

const expectedBuildDate = catalogueUpdateMatch ? new Date(`${catalogueUpdateMatch[1]} 12:00:00 UTC`).toUTCString() : '';
const feed = read('new-models.xml');
if (!expectedBuildDate || !feed.includes(`<lastBuildDate>${expectedBuildDate}</lastBuildDate>`)) {
  errors.push(`new-models.xml lastBuildDate does not match the catalogue update date (${expectedBuildDate || 'unknown'})`);
}

const edge = read('tts/edge-tts.html');
const octave = read('tts/octave-2.html');
for (const [name, html, markers] of [
  ['Edge TTS', edge, ['Online TTS interface', 'does not run speech inference locally', 'Internet required']],
  ['OCTAVE 2', octave, ['Vendor API speech reference', 'does not currently have a verified local checkpoint', 'Vendor API required']]
]) {
  for (const marker of markers) if (!html.includes(marker)) errors.push(`${name} page missing remote-delivery marker: ${marker}`);
  if (/listed by LocalClaw as a local|"applicationCategory":"Local|<div class="eyebrow">Local TTS model/.test(html)) errors.push(`${name} page still claims the remote record is local`);
}
for (const [file, content] of [['tts-list.html', ttsList], ['tts/edge-tts.html', edge]]) {
  if (/works offline with cached voices/i.test(content)) errors.push(`${file} still makes the false Edge TTS offline claim`);
  if (!content.includes('Internet access is required for synthesis')) errors.push(`${file} is missing the explicit Edge TTS Internet requirement`);
}
const ttsIndex = read('tts/index.html');
if (!ttsIndex.includes(`${speechModels.length}<small> local pages</small>`)) errors.push('tts/index.html local count is stale');
if (!ttsIndex.includes('Online and API references')) errors.push('tts/index.html does not separate online/API references');
if (!ttsIndex.includes('Unverified preserved route')) errors.push('tts/index.html does not separate the unverified preserved route');
if (read('sitemap-tts.xml').includes('/tts/xtts-v3')) errors.push('sitemap-tts.xml must exclude the noindex XTTS v3 tombstone');
if (read('guides/best-local-tts-for-voice-cloning.html').includes('/tts/xtts-v3')) errors.push('Local TTS guide must exclude the unverified XTTS v3 route');

const manifest = JSON.parse(read('downloads/localclaw-installer-latest.json'));
for (const file of ['download.html', 'software.html', 'pricing.html']) {
  if (!read(file).includes(manifest.latestVersion)) errors.push(`${file} does not show manifest version ${manifest.latestVersion}`);
}
if (!manifest.dmgUrl.includes(`localclaw-${manifest.latestVersion}.dmg`)) errors.push('Installer manifest DMG URL does not match latestVersion');
const dmgHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'downloads/localclaw.dmg'))).digest('hex');
if (dmgHash !== manifest.sha256) errors.push(`localclaw.dmg SHA-256 ${dmgHash} does not match manifest ${manifest.sha256}`);
const notesPath = new URL(manifest.notesUrl).pathname;
const notesFile = path.join(ROOT, `${notesPath.replace(/^\//, '')}.html`);
const redirects = read('_redirects');
if (!fs.existsSync(notesFile) && !redirects.split(/\r?\n/).some(line => line.trim().startsWith(`${notesPath} `))) {
  errors.push(`Installer notes URL has neither a file nor a redirect: ${notesPath}`);
}

const classifiedHfIds = new Set([
  ...Object.keys(publicGgufHfRepos),
  ...Object.keys(publicModelCardHfRepos),
  ...Object.keys(gatedHfRepos),
  ...Object.keys(unavailableHfRepos)
]);
if (!/^\d{4}-\d{2}-\d{2}$/.test(hfVerificationDate)) errors.push('Hugging Face public-link snapshot has no valid checkedAt date');
if (classifiedHfIds.size !== uniqueLocalModels.length) {
  errors.push(`Hugging Face public-link snapshot classifies ${classifiedHfIds.size} IDs; expected ${uniqueLocalModels.length}`);
}
const hfStateMaps = {
  publicGguf: publicGgufHfRepos,
  publicModelCard: publicModelCardHfRepos,
  gated: gatedHfRepos,
  unavailable: unavailableHfRepos
};
const expectedHfStateCounts = {publicGguf: 179, publicModelCard: 38, gated: 4, unavailable: 6};
for (const [state, expectedCount] of Object.entries(expectedHfStateCounts)) {
  const actualCount = Object.keys(hfStateMaps[state]).length;
  if (actualCount !== expectedCount) errors.push(`Hugging Face ${state} count is ${actualCount}, expected ${expectedCount}`);
}
const hfClassificationLines = Object.entries(hfStateMaps).flatMap(([state, records]) =>
  Object.entries(records).map(([id, repo]) => `${state}|${id}|${repo}`)
).sort();
const hfClassificationHash = crypto.createHash('sha256').update(hfClassificationLines.join('\n')).digest('hex');
if (hfRepoVerification.catalogueHash !== hfClassificationHash) {
  errors.push(`Hugging Face classification hash ${hfRepoVerification.catalogueHash || 'missing'} does not match state|id|repo snapshot ${hfClassificationHash}`);
}
const hfCheckedAt = Date.parse(hfRepoVerification.checkedAt || '');
const hfSnapshotAge = Date.now() - hfCheckedAt;
if (!Number.isFinite(hfCheckedAt) || hfSnapshotAge < -300000 || hfSnapshotAge > 7 * 24 * 60 * 60 * 1000) {
  errors.push('Hugging Face public-link snapshot must be a valid check no more than seven days old');
}

if (errors.length) {
  console.error(`Content truth validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content truth validation passed: ${uniqueLocalModels.length} preserved local LLM routes (${indexableLocalModels.length} indexable; ${Object.keys(publicGgufHfRepos).length} public GGUF repos, ${Object.keys(publicModelCardHfRepos).length} public model cards without GGUF, ${Object.keys(gatedHfRepos).length} gated, ${Object.keys(unavailableHfRepos).length} noindex tombstones, ${upstreamOnlyDetails} with upstream-only unverified details), ${speechModels.length} local speech records, remote speech labels, RSS freshness and installer ${manifest.latestVersion}.`);
