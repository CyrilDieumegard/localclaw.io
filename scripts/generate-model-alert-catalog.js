const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function generate() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + ';this.data=APP_DATA;', context);
  const unavailable = new Set(Object.keys(context.data.hfRepoVerification?.unavailable || {}));
  const models = [...new Map(context.data.models.filter(model => model?.id && !model.hosted_only && Number(model.size_gb) > 0 && !unavailable.has(model.id)).map(model => [model.id, model])).values()];
  // Deterministic: deployments without catalogue changes do not create releases.
  const data = { version: 1, models };
  const target = path.join(root, 'data/model-alert-catalog.json');
  fs.writeFileSync(target, JSON.stringify(data) + '\n');
  return data;
}
module.exports = { generate };
if (require.main === module) console.log(`Prepared ${generate().models.length} local models for opt-in alerts.`);
