const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const computers = fs.readFileSync(path.join(ROOT, 'computers.html'), 'utf8');
const hardwareGenerator = fs.readFileSync(path.join(ROOT, 'scripts/generate-hardware-pages.js'), 'utf8');
const dataSource = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const context = {};

vm.createContext(context);
vm.runInContext(`${dataSource}\nglobalThis.__APP_DATA__ = APP_DATA;`, context);

const models = new Map(context.__APP_DATA__.models.map(model => [model.id, model]));
const curatedMatch = computers.match(/const CURATED_PICKS = (\{[\s\S]*?\n\s*\});/);

if (!curatedMatch) throw new Error('Unable to parse CURATED_PICKS from computers.html');

const curated = vm.runInNewContext(`(${curatedMatch[1]})`);
const hardwareCuratedMatch = hardwareGenerator.match(/const\s+curated\s*=\s*(\{[\s\S]*?\n\s*\});/);
if (!hardwareCuratedMatch) throw new Error('Unable to parse curated hardware picks');
const hardwareCurated = vm.runInNewContext(`(${hardwareCuratedMatch[1]})`);
const excluded = new Set(['qwen3.6-6.7b', 'qwen3-coder-8b', 'glm4.6-air', 'llama4-scout']);
const failures = [];

for (const [tierText, ids] of Object.entries(curated)) {
  const tier = Number(tierText);
  for (const id of ids) {
    const model = models.get(id);
    if (!model) {
      failures.push(`${tier}GB pick ${id} is missing from APP_DATA.models`);
      continue;
    }
    if (excluded.has(id)) failures.push(`${tier}GB pick ${id} is explicitly excluded`);
    if (Number(model.min_ram || 0) > tier) {
      failures.push(`${tier}GB pick ${id} requires ${model.min_ram}GB RAM`);
    }
    if (Number(model.size_gb || 0) > tier * 0.75) {
      failures.push(`${tier}GB pick ${id} has a ${model.size_gb}GB artifact, above the ${tier * 0.75}GB fit ceiling`);
    }
  }
}

for (const [tierText, ids] of Object.entries(hardwareCurated)) {
  const tier = Number(tierText);
  for (const id of ids) {
    const model = models.get(id);
    if (!model) {
      failures.push(`Hardware ${tier}GB pick ${id} is missing from APP_DATA.models`);
      continue;
    }
    if (excluded.has(id)) failures.push(`Hardware ${tier}GB pick ${id} is explicitly excluded`);
    if (Number(model.min_ram || 0) > tier || Number(model.size_gb || 0) > tier * 0.78) {
      failures.push(`Hardware ${tier}GB pick ${id} does not fit its generated guide tier`);
    }
  }
}

const criticalFacts = {
  'deepseek-v3.2': { size_gb: 358.3, min_ram: 448, recommended_quant: 'IQ4_XS' },
  'trinity-large': { size_gb: 241.6, min_ram: 320, recommended_quant: 'Q4_K_M' },
  'kimi-k2.5-32b': { size_gb: 621.2, min_ram: 1024, recommended_quant: 'Q4_K_M' },
  'qwen3-235b-a22b': { size_gb: 142.6, min_ram: 192, recommended_quant: 'Q4_K_M' }
};

for (const [id, expected] of Object.entries(criticalFacts)) {
  const model = models.get(id);
  if (!model) {
    failures.push(`Critical model ${id} is missing`);
    continue;
  }
  for (const [key, value] of Object.entries(expected)) {
    if (model[key] !== value) failures.push(`${id}.${key} is ${model[key]}, expected ${value}`);
  }
}

for (const id of excluded) {
  if (!computers.includes(`'${id}'`)) failures.push(`Excluded model ${id} is not guarded in computers.html`);
  if (!hardwareGenerator.includes(`'${id}'`)) failures.push(`Excluded model ${id} is not guarded in the hardware generator`);
}

if (!computers.includes('js/data.js?v=20260819b')) failures.push('computers.html uses a stale js/data.js cache key');
if (!computers.includes('Active MoE parameters affect compute speed, not model download size')) {
  failures.push('computers.html is missing the MoE memory explanation');
}

if (failures.length) {
  console.error(`Computers model-fit check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Computers model-fit check passed: ${Object.values(curated).flat().length} curated entries across ${Object.keys(curated).length} RAM tiers.`);
