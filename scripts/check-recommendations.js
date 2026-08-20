const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ranking = require('../js/model-ranking');

const ROOT = path.resolve(__dirname, '..');

function loadModels() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8')};this.APP_DATA=APP_DATA;`, context);
  return Array.from(new Map(context.APP_DATA.models.map(model => [model.id, model])).values());
}

const models = loadModels();
const profiles = [
  { name: '8GB CPU', ramGb: 8, platform: 'windows', accelerator: 'cpu', useCase: 'general', priority: 'balanced', context: '8k' },
  { name: '16GB Apple', ramGb: 16, platform: 'mac', accelerator: 'apple-silicon', useCase: 'general', priority: 'balanced', context: '8k' },
  { name: '32GB Apple coding', ramGb: 32, platform: 'mac', accelerator: 'apple-silicon', useCase: 'coding', priority: 'quality', context: '16k' },
  { name: '64GB reasoning', ramGb: 64, platform: 'mac', accelerator: 'apple-silicon', useCase: 'reasoning', priority: 'quality', context: '32k' },
  { name: '128GB workstation', ramGb: 128, platform: 'windows', accelerator: 'nvidia', vramGb: 24, useCase: 'general', priority: 'quality', context: '8k' },
  { name: '12GB NVIDIA', ramGb: 32, platform: 'windows', accelerator: 'nvidia', vramGb: 12, useCase: 'coding', priority: 'speed', context: '16k' }
];

assert(ranking.isFresh('2026-08-01', new Date('2026-08-20T00:00:00Z')));
assert(!ranking.isFresh('2026-05-01', new Date('2026-08-20T00:00:00Z')));

for (const profile of profiles) {
  const result = ranking.rankModels(profile, {}, models, { includeTight: true, limit: 12 });
  assert(result.compatible.length > 0, `${profile.name}: no recommendation`);
  for (const model of result.compatible) {
    assert(ranking.isLocallyEligible(model), `${profile.name}: ineligible ${model.id}`);
    assert.notStrictEqual(model.fitState, 'too-large', `${profile.name}: oversized ${model.id}`);
    assert(model.compatibilityLabel, `${profile.name}: missing fit label for ${model.id}`);
  }
}

const requiredSharedSurfaces = [
  'index.html',
  'account.html',
  'llm-list.html',
  'computers.html'
];
for (const relative of requiredSharedSurfaces) {
  const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  assert(source.includes('model-ranking.js'), `${relative}: shared ranking script missing`);
}

const activeSources = [
  'js/app-20260816a.js',
  'js/machine-compat-20260802a.js',
  'scripts/generate-ram-pages.js',
  'scripts/generate-hardware-pages.js',
  'scripts/generate-use-case-pages.js',
  'scripts/generate-retention-guides.js'
];
for (const relative of activeSources) {
  const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  assert(!source.includes("new Date('2026-06-04')"), `${relative}: frozen recommendation date`);
  assert(source.includes('model-ranking') || source.includes('LocalClawModelRanking'), `${relative}: shared engine not used`);
}

console.log(`Recommendation checks passed for ${profiles.length} hardware profiles and ${models.length} catalogue records.`);
