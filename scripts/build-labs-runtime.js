const fs = require('node:fs');
const path = require('node:path');

// Host the pinned inference runtime ourselves. No runtime CDN or API keys.
const root = path.resolve(__dirname, '..');
const version = '3.6.1';
const destination = path.join(root, 'js/labs/vendor', version);
const runtime = path.join(root, 'node_modules/@wllama/wllama');
const compat = path.join(root, 'node_modules/@wllama/wllama-compat');
for (const directory of [runtime, compat]) {
  if (JSON.parse(fs.readFileSync(path.join(directory, 'package.json'))).version !== version) {
    throw new Error('Labs runtime version mismatch; update the runtime and compatibility build together.');
  }
}
fs.mkdirSync(destination, { recursive: true });
for (const [source, name] of [
  [path.join(runtime, 'esm/index.js'), 'index.js'],
  [path.join(runtime, 'esm/wasm/wllama.wasm'), 'wllama.wasm'],
  [path.join(runtime, 'LICENCE'), 'LICENSE.txt'],
  [path.join(compat, 'wasm/wllama.js'), 'compat.js'],
  [path.join(compat, 'wasm/wllama.wasm'), 'compat.wasm'],
]) {
  fs.copyFileSync(source, path.join(destination, name));
}
console.log(`Labs: prepared self-hosted wllama ${version} and browser compatibility assets.`);
