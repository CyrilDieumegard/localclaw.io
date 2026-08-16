const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';this.DATA=APP_DATA', context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-speech-20260814c.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-avatar-formats-20260814a.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-logos-20260814c.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/local-ai-catalog.js'), 'utf8'), context);

const unavailableLlmIds = new Set(Object.keys((context.DATA.hfRepoVerification && context.DATA.hfRepoVerification.unavailable) || {}));
const models = Array.from(new Map(context.DATA.models
  .filter((model) => !model.hosted_only && !unavailableLlmIds.has(model.id))
  .map((model) => [model.id, model])).values());
const speechModels = context.window.HOME_INDEX_SPEECH_MODELS;
const multimodalModels = context.window.LOCAL_AI_CATALOG.filter((model) => model.local_status === 'local');
const logos = context.window.HOME_INDEX_LOGOS;
const missing = [];
const homepageHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const homepageJs = fs.readFileSync(path.join(ROOT, 'js/home-index-20260814g.js'), 'utf8');
const homepageCss = fs.readFileSync(path.join(ROOT, 'css/home-index-20260814g.css'), 'utf8');

for (const family of new Set(models.map((model) => model.family))) {
  if (!logos.llm[family]) missing.push(`LLM family mapping: ${family}`);
}
for (const family of new Set(speechModels.map((model) => model.family))) {
  if (!logos.speech[family]) missing.push(`Speech family mapping: ${family}`);
}
for (const developer of new Set(multimodalModels.map((model) => model.developer))) {
  if (!logos.multimodal[developer]) missing.push(`Multimodal developer mapping: ${developer}`);
}
for (const asset of new Set([...Object.values(logos.llm), ...Object.values(logos.speech), ...Object.values(logos.multimodal)])) {
  const extension = context.window.HOME_INDEX_AVATAR_FORMATS[asset] || 'svg';
  const file = path.join(ROOT, 'images/model-logos', `${asset}.${extension}`);
  if (!fs.existsSync(file)) missing.push(`Logo asset: ${asset}.${extension}`);
}

if (!models.length) missing.push('Homepage LLM selection is empty');
if (!speechModels.length) missing.push('Homepage speech selection is empty');
if (!multimodalModels.length) missing.push('Homepage multimodal selection is empty');
for (const modelId of unavailableLlmIds) {
  if (models.some((model) => model.id === modelId)) missing.push(`Unverified LLM leaked onto homepage: ${modelId}`);
}
for (const model of models) {
  for (const metric of ['quality', 'coding', 'reasoning', 'speed']) {
    if (!Number.isFinite(Number(model.benchmarks && model.benchmarks[metric]))) missing.push(`Missing LLM score input: ${model.id}.${metric}`);
  }
}
for (const model of speechModels) {
  for (const metric of ['quality', 'speed']) {
    if (!Number.isFinite(Number(model[metric]))) missing.push(`Missing speech score input: ${model.id}.${metric}`);
  }
}
for (const forbiddenId of ['edge-tts', 'octave-2', 'xtts-v3']) {
  if (speechModels.some((model) => model.id === forbiddenId)) missing.push(`Non-local speech record leaked onto homepage: ${forbiddenId}`);
}
for (const marker of [
  'COMMUNITY_PRIOR_WEIGHT = 5',
  'data-compare-id',
  'localclaw_home_machine_ram',
  "fetch('/api/machines'",
  "logoMarkup('multimodal', model.developer, model.developer)"
]) {
  if (!homepageJs.includes(marker)) missing.push(`Homepage feature marker: ${marker}`);
}
for (const marker of ['lc-index-compare-dialog', 'lc-index-fit.is-tight', 'lc-index-multimodal-card__developer']) {
  if (!homepageCss.includes(marker)) missing.push(`Homepage style marker: ${marker}`);
}
for (const marker of ['css/home-index-20260814g.css?v=20260816e', 'js/home-index-avatar-formats-20260814a.js?v=20260816e', 'js/home-index-logos-20260814c.js?v=20260816g', 'js/local-ai-catalog.js?v=20260816g', 'js/home-index-20260814g.js?v=20260816e']) {
  if (!homepageHtml.includes(marker)) missing.push(`Homepage version marker: ${marker}`);
}
const confidenceScore = (average, count) => ((average * count) + (3.5 * 5)) / (count + 5);
if (confidenceScore(4.5, 2) <= confidenceScore(5, 1)) {
  missing.push('Community confidence must reward the stronger two-vote signal over a single perfect vote');
}

if (missing.length) {
  console.error(`Homepage logo coverage failed:\n- ${missing.join('\n- ')}`);
  process.exit(1);
}
console.log(`Homepage logo coverage OK: ${models.length} LLM entries, ${new Set(models.map((model) => model.family)).size} LLM families, ${speechModels.length} speech entries, ${new Set(speechModels.map((model) => model.family)).size} speech families and ${multimodalModels.length} multimodal entries across ${new Set(multimodalModels.map((model) => model.developer)).size} developers.`);
