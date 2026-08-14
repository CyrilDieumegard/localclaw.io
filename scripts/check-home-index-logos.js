const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';this.DATA=APP_DATA', context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-speech-20260814c.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-avatar-formats-20260814a.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/home-index-logos-20260814b.js'), 'utf8'), context);

const models = Array.from(new Map(context.DATA.models.filter((model) => !model.hosted_only).map((model) => [model.id, model])).values());
const speechModels = context.window.HOME_INDEX_SPEECH_MODELS;
const logos = context.window.HOME_INDEX_LOGOS;
const missing = [];

for (const family of new Set(models.map((model) => model.family))) {
  if (!logos.llm[family]) missing.push(`LLM family mapping: ${family}`);
}
for (const family of new Set(speechModels.map((model) => model.family))) {
  if (!logos.speech[family]) missing.push(`Speech family mapping: ${family}`);
}
for (const asset of new Set([...Object.values(logos.llm), ...Object.values(logos.speech)])) {
  const extension = context.window.HOME_INDEX_AVATAR_FORMATS[asset] || 'svg';
  const file = path.join(ROOT, 'images/model-logos', `${asset}.${extension}`);
  if (!fs.existsSync(file)) missing.push(`Logo asset: ${asset}.${extension}`);
}

if (models.length !== 218) missing.push(`Expected 218 homepage LLM entries, found ${models.length}`);
if (speechModels.length !== 56) missing.push(`Expected 56 local homepage speech entries, found ${speechModels.length}`);
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
for (const forbiddenId of ['edge-tts', 'octave-2']) {
  if (speechModels.some((model) => model.id === forbiddenId)) missing.push(`Non-local speech record leaked onto homepage: ${forbiddenId}`);
}

if (missing.length) {
  console.error(`Homepage logo coverage failed:\n- ${missing.join('\n- ')}`);
  process.exit(1);
}
console.log(`Homepage logo coverage OK: ${models.length} LLM entries, ${new Set(models.map((model) => model.family)).size} LLM families, ${speechModels.length} speech entries and ${new Set(speechModels.map((model) => model.family)).size} speech families.`);
