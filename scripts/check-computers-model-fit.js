const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ranking = require('../js/model-ranking');

const ROOT = path.resolve(__dirname, '..');
const computers = fs.readFileSync(path.join(ROOT, 'computers.html'), 'utf8');
const hardwareGenerator = fs.readFileSync(path.join(ROOT, 'scripts/generate-hardware-pages.js'), 'utf8');
const dataSource = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${dataSource}\nglobalThis.__APP_DATA__ = APP_DATA;`, context);

const models = context.__APP_DATA__.models;
const byId = new Map(models.map(model => [model.id, model]));
const failures = [];
const profiles = [8, 16, 24, 32, 48, 64, 128, 256, 512];

for (const ramGb of profiles) {
  const result = ranking.rankModels({ ramGb, platform: 'mac', accelerator: 'apple-silicon', useCase: 'general', priority: 'balanced', context: '8k' }, {}, models, { includeTight: true, limit: 12 });
  if (!result.compatible.length) failures.push(`${ramGb}GB profile has no compatible model`);
  for (const model of result.compatible) {
    if (!ranking.isLocallyEligible(model)) failures.push(`${ramGb}GB includes ineligible ${model.id}`);
    if (model.fitState === 'too-large') failures.push(`${ramGb}GB includes oversized ${model.id}`);
  }
}

const criticalFacts = {
  'deepseek-v3.2': { size_gb: 358.3, min_ram: 448, recommended_quant: 'IQ4_XS' },
  'trinity-large': { size_gb: 241.6, min_ram: 320, recommended_quant: 'Q4_K_M' },
  'kimi-k2.5-32b': { size_gb: 621.2, min_ram: 1024, recommended_quant: 'Q4_K_M' },
  'qwen3-235b-a22b': { size_gb: 142.6, min_ram: 192, recommended_quant: 'Q4_K_M' }
};

for (const [id, expected] of Object.entries(criticalFacts)) {
  const model = byId.get(id);
  if (!model) {
    failures.push(`Critical model ${id} is missing`);
    continue;
  }
  for (const [key, value] of Object.entries(expected)) {
    if (model[key] !== value) failures.push(`${id}.${key} is ${model[key]}, expected ${value}`);
  }
}

for (const marker of ['js/data.js?v=20260819b', 'js/model-ranking.js?v=20260820a', 'LocalClawModelRanking.rankModels']) {
  if (!computers.includes(marker)) failures.push(`computers.html missing ${marker}`);
}
if (!hardwareGenerator.includes("require('../js/model-ranking')")) failures.push('Hardware generator does not use the shared engine');
if (!computers.includes('Active MoE parameters affect compute speed, not model download size')) failures.push('Computers page is missing the MoE memory explanation');

if (failures.length) {
  console.error(`Computers model-fit check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Computers model-fit check passed for ${profiles.length} RAM profiles with the shared recommendation engine.`);
