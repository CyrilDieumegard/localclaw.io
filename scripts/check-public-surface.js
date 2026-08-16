const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const { OUTPUT_DIRECTORY, PRIVATE_PROBES, collectPublicAssets } = require('./pages-output-config');

const wrangler = fs.readFileSync(path.join(ROOT, 'wrangler.toml'), 'utf8');
if (!new RegExp(`^pages_build_output_dir\\s*=\\s*"${OUTPUT_DIRECTORY.replace('.', '\\.')}"$`, 'm').test(wrangler)) {
  errors.push(`wrangler.toml must publish ${OUTPUT_DIRECTORY}, never the repository root`);
}
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
if (!packageJson.scripts?.['pages:build']?.includes('build-pages-output.js')) errors.push('package.json is missing the allowlisted Pages build');

let publicAssetCount = 0;
let publicAssets = new Set();
try {
  publicAssets = new Set(collectPublicAssets(ROOT));
  publicAssetCount = publicAssets.size;
} catch (error) {
  errors.push(error.message);
}
for (const privatePath of PRIVATE_PROBES) {
  if (publicAssets.has(privatePath)) errors.push(`Private path appears in Pages allowlist: ${privatePath}`);
}

for (const declaredFile of ['llms.txt', 'llms-full.txt', 'sitemap.xml', 'new-models.xml']) {
  if (!fs.existsSync(path.join(ROOT, declaredFile))) errors.push(`Missing declared public file: ${declaredFile}`);
}

const routes = JSON.parse(fs.readFileSync(path.join(ROOT, '_routes.json'), 'utf8'));
function routePatternMatches(pattern, route) {
  const expression = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${expression}$`).test(route);
}
for (const route of ['/llms.txt', '/llms-full.txt', '/sitemap.xml', '/new-models.xml']) {
  if (!routes.include.includes(route)) errors.push(`_routes.json missing ${route}`);
}
const middleware = fs.readFileSync(path.join(ROOT, 'functions/_middleware.js'), 'utf8');
for (const privatePath of PRIVATE_PROBES) {
  const route = `/${privatePath}`;
  if (!routes.include.includes(route)) errors.push(`_routes.json does not send private path through the 404 guard: ${route}`);
  if (!middleware.includes(JSON.stringify(route))) errors.push(`Functions middleware does not deny private path: ${route}`);
  const conflictingExclude = routes.exclude.find(pattern => routePatternMatches(pattern, route));
  if (conflictingExclude) errors.push(`_routes.json exclude ${conflictingExclude} bypasses private-path guard ${route}`);
}
for (const marker of ['status: 404', '"Cache-Control": "no-store"', '"Cloudflare-CDN-Cache-Control": "no-store"', '"X-Robots-Tag": "noindex, nofollow, noarchive"']) {
  if (!middleware.includes(marker)) errors.push(`Functions private-path guard is missing marker: ${marker}`);
}

const headers = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
for (const route of ['/', '/llm-list', '/tts-list', '/image-models', '/video-models', '/3d-models', '/music-models', '/vision-models', '/new']) {
  if (!new RegExp(`^${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm').test(headers)) {
    errors.push(`_headers missing canonical cache rule for ${route}`);
  }
}
const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
for (const legacyRoute of ['/local-ai-index.html', '/local-ai-index']) {
  if (!new RegExp(`^${legacyRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+/#local-ai-index\\s+301$`, 'm').test(redirects)) {
    errors.push(`_redirects must send ${legacyRoute} to the homepage index anchor`);
  }
}

const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
if (/localclaw\.io\/[A-Za-z0-9/_-]+\.html\b/.test(llms)) errors.push('llms.txt contains non-canonical .html URLs');
if (!llms.includes('/llms-full.txt')) errors.push('llms.txt does not link to llms-full.txt');

const homepage = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (homepage.includes('cdn.tailwindcss.com')) errors.push('Homepage still compiles Tailwind in the browser');
if (!homepage.includes('css/home-tailwind-20260814a.css?v=20260814a')) errors.push('Homepage local Tailwind asset is missing');
if (!fs.existsSync(path.join(ROOT, 'css/home-tailwind-20260814a.css'))) errors.push('Generated homepage Tailwind CSS file is missing');

if (errors.length) {
  console.error(`Public surface validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public surface validation passed: ${publicAssetCount} allowlisted assets, ${PRIVATE_PROBES.length} private probes excluded, canonical cache routes and GEO files present.`);
