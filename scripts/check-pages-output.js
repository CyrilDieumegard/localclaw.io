const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { OUTPUT_DIRECTORY, PRIVATE_PROBES, collectPublicAssets } = require('./pages-output-config');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, OUTPUT_DIRECTORY);

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function validatePagesOutput() {
  const errors = [];
  const routesPath = path.join(ROOT, '_routes.json');
  try {
    const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
    const rules = [...(routes.include || []), ...(routes.exclude || [])];
    if (rules.length > 100) errors.push(`_routes.json exceeds Cloudflare's 100 rule limit: ${rules.length}`);
    if (new Set(rules).size !== rules.length) errors.push('_routes.json contains duplicate rules');
  } catch (error) {
    errors.push(`Invalid _routes.json: ${error.message}`);
  }
  if (!fs.existsSync(OUTPUT) || !fs.statSync(OUTPUT).isDirectory()) {
    errors.push(`Missing Pages output directory: ${OUTPUT_DIRECTORY}`);
  } else {
    for (const relativePath of collectPublicAssets(ROOT)) {
      const source = path.join(ROOT, relativePath);
      const destination = path.join(OUTPUT, relativePath);
      if (!fs.existsSync(destination)) {
        errors.push(`Pages output missing allowlisted asset: ${relativePath}`);
      } else if (digest(source) !== digest(destination)) {
        errors.push(`Pages output asset differs from source: ${relativePath}`);
      }
    }
    for (const relativePath of PRIVATE_PROBES) {
      if (fs.existsSync(path.join(OUTPUT, relativePath))) errors.push(`Private file leaked into Pages output: ${relativePath}`);
    }
  }

  if (errors.length) {
    const error = new Error(`Pages output validation failed with ${errors.length} issue(s):\n${errors.map(item => `- ${item}`).join('\n')}`);
    error.validationErrors = errors;
    throw error;
  }
  return collectPublicAssets(ROOT).length;
}

if (require.main === module) {
  try {
    const count = validatePagesOutput();
    console.log(`Pages output validation passed: ${count} allowlisted files and ${PRIVATE_PROBES.length} private probes absent.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { validatePagesOutput };
