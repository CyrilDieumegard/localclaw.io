const fs = require('fs');
const path = require('path');
const { OUTPUT_DIRECTORY, collectPublicAssets } = require('./pages-output-config');
const { validatePagesOutput } = require('./check-pages-output');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, OUTPUT_DIRECTORY);
if (OUTPUT === ROOT || !OUTPUT.endsWith(`${path.sep}${OUTPUT_DIRECTORY}`)) {
  throw new Error(`Refusing to replace unsafe Pages output path: ${OUTPUT}`);
}

const assets = collectPublicAssets(ROOT);
fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });

let bytes = 0;
for (const relativePath of assets) {
  const source = path.join(ROOT, relativePath);
  const destination = path.join(OUTPUT, relativePath);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Missing public asset: ${relativePath}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  bytes += fs.statSync(source).size;
}

validatePagesOutput();
console.log(`Built ${OUTPUT_DIRECTORY}: ${assets.length} allowlisted files, ${bytes} bytes.`);
