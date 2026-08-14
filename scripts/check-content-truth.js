const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const dataSource = read('js/data.js');
const dataContext = {};
vm.createContext(dataContext);
vm.runInContext(`${dataSource};this.DATA=APP_DATA;`, dataContext);
const speechContext = { window: {} };
vm.createContext(speechContext);
vm.runInContext(read('js/home-index-speech-20260814c.js'), speechContext);
const detailsContext = {};
vm.createContext(detailsContext);
vm.runInContext(`${read('js/model-details.js')};this.DETAILS=MODEL_DETAILS;`, detailsContext);

const uniqueLocalModels = Array.from(new Map(
  dataContext.DATA.models.filter(model => !model.hosted_only).map(model => [model.id, model])
).values());
const speechModels = speechContext.window.HOME_INDEX_SPEECH_MODELS || [];
const modelDetails = detailsContext.DETAILS || {};
const ttsList = read('tts-list.html');
const ttsMatch = ttsList.match(/const TTS_MODELS = (\[[\s\S]*?\n\s*\]);/);
const ttsContext = {};
if (ttsMatch) {
  vm.createContext(ttsContext);
  vm.runInContext(`this.MODELS=${ttsMatch[1]}`, ttsContext);
}
const allSpeechRecords = ttsContext.MODELS || [];
const localSpeechIds = new Set(speechModels.map(model => model.id));
const index = read('index.html');
const llms = read('llms.txt');
const llmsFull = read('llms-full.txt');
const newModelSort = require(path.join(ROOT, 'js/new-model-sort-20260814a.js'));

for (const marker of [
  `${uniqueLocalModels.length} local LLM pages`,
  `${speechModels.length} local speech records`,
  `numberOfItems": ${uniqueLocalModels.length}`,
  `numberOfItems": ${speechModels.length}`,
  'Three signals, never blended',
  'It is not a standardized third-party benchmark.'
]) {
  if (!index.includes(marker)) errors.push(`Homepage missing truth marker: ${marker}`);
}
for (const marker of [
  `Local LLM pages: ${uniqueLocalModels.length}`,
  `Local speech records: ${speechModels.length}`,
  'Community ratings never change or blend',
  '/llms-full.txt'
]) {
  if (!llms.includes(marker)) errors.push(`llms.txt missing truth marker: ${marker}`);
}
if (!llmsFull.includes(`## Local LLMs (${uniqueLocalModels.length})`)) errors.push('llms-full.txt LLM count is stale');
if (!llmsFull.includes(`## Local Speech Models (${speechModels.length})`)) errors.push('llms-full.txt speech count is stale');

let upstreamOnlyDetails = 0;
const modelGenerator = read('scripts/generate-model-pages.js');
for (const forbidden of ['d.strengths', 'd.weaknesses', 'd.use_cases', 'd.similar_models', 'generateDefaultDetails(']) {
  if (modelGenerator.includes(forbidden)) errors.push(`Model page generator still consumes unverified narrative data: ${forbidden}`);
}
for (const model of uniqueLocalModels) {
  const html = read(`models/${model.id}.html`);
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
  if (model.hf_repo && !html.includes(`href="https://huggingface.co/${model.hf_repo}"`)) {
    errors.push(`${model.id} is missing a clickable Hugging Face repository`);
  }
  if (!html.includes('<strong>Catalogue summary:</strong>') || html.includes('<h2>Strengths</h2>') || html.includes('<h2>Best use cases</h2>')) {
    errors.push(`${model.id} still presents unverified narrative details as factual sections`);
  }
  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const schemaGraph = schemaMatch ? JSON.parse(schemaMatch[1])['@graph'] : [];
  const software = schemaGraph.find(item => item['@type'] === 'SoftwareApplication') || {};
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
if (allSpeechRecords.length !== 58) errors.push(`Speech source count is ${allSpeechRecords.length}, expected 58 records including two remote references`);
if (fs.readdirSync(path.join(ROOT, 'models')).filter(file => file.endsWith('.html')).length !== 220) errors.push('models/ must contain 219 model pages plus one index');
if (fs.readdirSync(path.join(ROOT, 'tts')).filter(file => file.endsWith('.html')).length !== 59) errors.push('tts/ must contain 58 speech pages plus one index');

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
  'href="/models/muse-glimmer-30b"',
  'href="/models/lfm2-5-2-6b"',
  '24 GB RAM · K-Quant 17GB Q4_K_M',
  '8 GB RAM · Q4_K_M · 128K context',
  'LocalClawNewModels.latestLocalModels(sourceModels, 12)',
  'js/new-model-sort-20260814a.js?v=20260814a',
  '218-page LocalClaw index'
]) {
  if (!newPage.includes(marker)) errors.push(`/new missing or stale marker: ${marker}`);
}
const latestModels = newModelSort.latestLocalModels(dataContext.DATA.models, 12);
const latestIds = latestModels.map(model => model.id);
if (latestIds[0] !== 'lfm2-5-2-6b' || latestIds[1] !== 'muse-glimmer-30b' || !latestIds.includes('deepseek-v4-flash-0731')) {
  errors.push(`/new selection is stale or mis-sorted: ${latestIds.join(', ')}`);
}
if (!(newModelSort.releaseTimestamp('2026-07-31') > newModelSort.releaseTimestamp('2026-07'))) {
  errors.push('/new release parser does not correctly compare YYYY-MM-DD with YYYY-MM');
}
const fallbackOrder = ['lfm2-5-2-6b', 'muse-glimmer-30b', 'deepseek-v4-flash-0731'].map(id => newPage.indexOf(`href="/models/${id}"`));
if (fallbackOrder.some(index => index < 0) || !(fallbackOrder[0] < fallbackOrder[1] && fallbackOrder[1] < fallbackOrder[2])) {
  errors.push('/new static fallback order does not match the canonical freshness sort');
}

const updateMatch = dataSource.match(/^\/\/ Updated ([A-Za-z]+ \d{1,2}, \d{4})/m);
const expectedBuildDate = updateMatch ? new Date(`${updateMatch[1]} 12:00:00 UTC`).toUTCString() : '';
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

if (errors.length) {
  console.error(`Content truth validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content truth validation passed: ${uniqueLocalModels.length} local LLMs (${upstreamOnlyDetails} with upstream-only unverified details), ${speechModels.length} local speech records, remote speech labels, RSS freshness and installer ${manifest.latestVersion}.`);
