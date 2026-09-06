const fs = require('fs');
const path = require('path');
const vm = require('vm');

function assertCatalogueIntegrity(data) {
  const ids = new Set();
  const repositories = new Map();
  for (const model of data.models || []) {
    if (!model.id || ids.has(model.id)) throw new Error(`Duplicate or missing catalogue model ID: ${model.id}`);
    ids.add(model.id);
    for (const identity of [model.source_url, model.hf_repo].filter(Boolean).map(value => String(value).toLowerCase().replace(/\/$/, ''))) {
      if (repositories.has(identity)) {
        throw new Error(`Duplicate catalogue model identity: ${repositories.get(identity)} / ${model.id} (${identity})`);
      }
      repositories.set(identity, model.id);
    }
  }
  for (const [alias, canonical] of Object.entries(data.modelAliases || {})) {
    if (ids.has(alias) || !ids.has(canonical) || !/^[a-z0-9._-]+$/.test(alias)) {
      throw new Error(`Invalid catalogue model alias: ${alias} -> ${canonical}`);
    }
  }
}

module.exports = { assertCatalogueIntegrity };

if (require.main === module) {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8') + ';this.data=APP_DATA;', context);
  assertCatalogueIntegrity(context.data);
  console.log(`Catalogue identity check passed (${context.data.models.length} unique models).`);
}
