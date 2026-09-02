const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
for (const line of redirects.split(/\r?\n/)) {
  const match = line.trim().match(/^(\/\S+)\s+(\/\S+\.html)\s+200(?:\s|$)/);
  if (match && `${match[1]}.html` === match[2]) {
    errors.push(`_redirects creates a Pages pretty-URL loop: ${match[1]} -> ${match[2]} (200)`);
  }
}

const runtimeAssistAsset = '/js/runtime-launch-assist-20260821a.js?v=20260830a';
const runtimeAssistSource = fs.readFileSync(path.join(ROOT, 'js/runtime-launch-assist-20260821a.js'), 'utf8');
for (const marker of ['INSTALL_INTENT_GOALS', 'installIntentPlatform', 'model_install_intent', 'a[data-fast-goal]', 'model_runtime_launch_requested', 'model_runtime_help_opened', 'model_runtime_launch_confirmed', 'https://lmstudio.ai/download', 'https://unsloth.ai/']) {
  if (!runtimeAssistSource.includes(marker)) errors.push(`Runtime launch assistant is missing marker: ${marker}`);
}
if (/a\[data-fast-goal\^=["']model_runtime_["']\]/.test(runtimeAssistSource)
  || /a\[data-fast-goal\^=["']model_install_["']\][^\n]*a\[data-fast-goal\^=["']model_runtime_["']\]/.test(runtimeAssistSource)) {
  errors.push('Runtime launch assistant must not classify every model_runtime_* link as install intent');
}

const installIntentGoalCases = new Map([
  ['model_install_comfyui', 'comfyui'],
  ['model_install_drawthings', 'drawthings'],
  ['model_install_github', 'github'],
  ['model_install_gradio', 'gradio'],
  ['model_install_huggingface', 'huggingface'],
  ['model_install_mlx', 'mlx'],
  ['model_install_python', 'python'],
  ['model_install_pytorch', 'pytorch'],
  ['model_install_unsloth', 'unsloth'],
  ['model_runtime_huggingface', 'huggingface'],
  ['model_runtime_llamacpp', 'llamacpp'],
  ['model_runtime_lmstudio', 'lmstudio'],
  ['model_runtime_official', 'official'],
  ['model_runtime_ollama', 'ollama'],
  ['model_runtime_unsloth', 'unsloth']
]);

try {
  let clickHandler = null;
  const tracked = [];
  const sandbox = {
    document: {
      addEventListener(name, handler) {
        if (name === 'click') clickHandler = handler;
      }
    },
    window: {
      datafast(name, payload) {
        tracked.push({ name, payload });
      }
    }
  };
  vm.runInNewContext(runtimeAssistSource, sandbox, { filename: 'runtime-launch-assist-20260821a.js' });
  if (typeof clickHandler !== 'function') {
    errors.push('Runtime launch assistant did not register its click handler');
  } else {
    const runIntentClick = goal => {
      const link = {
        getAttribute(name) {
          if (name === 'data-fast-goal') return goal;
          if (name === 'data-fast-goal-model') return 'test-model';
          return '';
        }
      };
      const target = {
        closest(selector) {
          return selector === 'a[data-fast-goal]' ? link : null;
        }
      };
      const start = tracked.length;
      clickHandler({ target });
      return tracked.slice(start);
    };

    for (const [goal, platform] of installIntentGoalCases) {
      const events = runIntentClick(goal);
      const canonical = events.filter(event => event.name === 'model_install_intent');
      if (canonical.length !== 1) {
        errors.push(`${goal} must emit exactly one canonical model_install_intent event`);
        continue;
      }
      const payload = canonical[0].payload || {};
      if (payload.model !== 'test-model' || payload.platform !== platform || payload.target !== 'download_or_runtime') {
        errors.push(`${goal} must preserve model, platform and target in the canonical install-intent payload`);
      }
    }

    for (const excludedGoal of ['model_runtime_compare', 'model_runtime_help_opened', 'model_runtime_launch_confirmed', 'model_runtime_preview', 'model_install_localclaw', 'model_runtime_localclaw']) {
      const canonical = runIntentClick(excludedGoal).filter(event => event.name === 'model_install_intent');
      if (canonical.length) errors.push(`${excludedGoal} must not emit canonical model_install_intent`);
    }
  }
} catch (error) {
  errors.push(`Runtime launch assistant install-intent behavior could not be validated: ${error.message}`);
}

const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
if (/localclaw\.io\/[A-Za-z0-9/_-]+\.html\b/.test(llms)) errors.push('llms.txt contains non-canonical .html URLs');
if (!llms.includes('/llms-full.txt')) errors.push('llms.txt does not link to llms-full.txt');

const homepage = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (homepage.includes('cdn.tailwindcss.com')) errors.push('Homepage still compiles Tailwind in the browser');
if (!homepage.includes('css/home-tailwind-20260814a.css?v=20260814a')) errors.push('Homepage local Tailwind asset is missing');
if (!fs.existsSync(path.join(ROOT, 'css/home-tailwind-20260814a.css'))) errors.push('Generated homepage Tailwind CSS file is missing');

const modelPages = fs.readdirSync(path.join(ROOT, 'models'))
  .filter(file => file.endsWith('.html') && file !== 'index.html');
const expectedRuntimes = ['lmstudio', 'unsloth', 'ollama', 'huggingface', 'llamacpp', 'localclaw'];
for (const file of modelPages) {
  const html = fs.readFileSync(path.join(ROOT, 'models', file), 'utf8');
  if (/name="robots" content="noindex/.test(html)) continue;
  const cardCount = (html.match(/<(?:a|div) class="run-option\b/g) || []).length;
  const logoCount = (html.match(/class="run-option-logo"/g) || []).length;
  if (cardCount !== expectedRuntimes.length) errors.push(`${file} must expose exactly ${expectedRuntimes.length} runtime choices; found ${cardCount}`);
  if (logoCount !== expectedRuntimes.length) errors.push(`${file} must show a logo for every runtime choice; found ${logoCount}`);
  for (const runtime of expectedRuntimes) {
    if (!html.includes(`data-runtime="${runtime}"`)) errors.push(`${file} is missing the ${runtime} runtime choice`);
  }
  const unslothOption = (html.match(/<(?:a|div) class="run-option[^"]*"[^>]*data-runtime="unsloth"[^>]*>/) || [])[0] || '';
  if (unslothOption.startsWith('<a') && !unslothOption.includes('href="unsloth://open_from_hf?model=')) {
    errors.push(`${file} exposes Unsloth without a valid deep link`);
  }
  if (/(?:lmstudio|unsloth):\/\/open_from_hf/.test(html)) {
    if (!html.includes(runtimeAssistAsset)) errors.push(`${file} is missing the runtime launch assistant`);
    if (!html.includes('class="runtime-launch-disclosure"')) errors.push(`${file} is missing the desktop-app fallback disclosure`);
  }
  for (const forbidden of ['data-copy-command', 'run-copy-status', 'model-run-options-20260820a.js']) {
    if (html.includes(forbidden)) errors.push(`${file} still contains command-copy UI: ${forbidden}`);
  }
}

for (const directory of ['image', 'video', '3d', 'music', 'vision']) {
  for (const file of fs.readdirSync(path.join(ROOT, directory)).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(ROOT, directory, file), 'utf8');
    const cardCount = (html.match(/class="install-choice-card\b/g) || []).length;
    const logoCount = (html.match(/class="install-choice-logo"/g) || []).length;
    if (!html.includes('data-install-choice')) errors.push(`${directory}/${file} is missing the app chooser`);
    if (cardCount < 2 || logoCount !== cardCount) errors.push(`${directory}/${file} must expose at least two logo-backed setup choices; found ${cardCount} cards and ${logoCount} logos`);
    if (!html.includes('data-fast-goal="model_install_')) errors.push(`${directory}/${file} is missing install-choice analytics`);
    if (html.includes('model_install_unsloth') && !html.includes('unsloth://open_from_hf?model=')) errors.push(`${directory}/${file} exposes Unsloth without a valid deep link`);
    if (html.includes('unsloth://open_from_hf?model=') && !html.includes(runtimeAssistAsset)) errors.push(`${directory}/${file} is missing the runtime launch assistant`);
    if (html.includes('Open installation source')) errors.push(`${directory}/${file} still exposes the old generic installation button`);
  }
}

const speechDetailPages = fs.readdirSync(path.join(ROOT, 'tts')).filter(name => name.endsWith('.html') && name !== 'index.html');
const speechWithChooser = speechDetailPages.filter(file => fs.readFileSync(path.join(ROOT, 'tts', file), 'utf8').includes('data-install-choice'));
if (speechWithChooser.length !== 81) errors.push(`Expected 81 local speech pages with app choosers; found ${speechWithChooser.length}`);
for (const file of speechWithChooser) {
  const html = fs.readFileSync(path.join(ROOT, 'tts', file), 'utf8');
  const cardCount = (html.match(/class="install-choice-card\b/g) || []).length;
  const logoCount = (html.match(/class="install-choice-logo"/g) || []).length;
  if (cardCount < 2 || logoCount !== cardCount) errors.push(`tts/${file} must expose at least two logo-backed setup choices; found ${cardCount} cards and ${logoCount} logos`);
  for (const forbidden of ['class="command"', '<code>pip install', '<code>git clone']) {
    if (html.includes(forbidden)) errors.push(`tts/${file} still exposes terminal-first setup: ${forbidden}`);
  }
  if (html.includes('model_install_unsloth') && !html.includes('unsloth://open_from_hf?model=')) errors.push(`tts/${file} exposes Unsloth without a valid deep link`);
  if (html.includes('unsloth://open_from_hf?model=') && !html.includes(runtimeAssistAsset)) errors.push(`tts/${file} is missing the runtime launch assistant`);
}
const ttsList = fs.readFileSync(path.join(ROOT, 'tts-list.html'), 'utf8');
for (const forbidden of ['function copyInstall(', 'onclick="copyInstall', '<code>$ ${model.installCommand}</code>']) {
  if (ttsList.includes(forbidden)) errors.push(`tts-list.html still exposes command-copy UI: ${forbidden}`);
}
if (!ttsList.includes('data-fast-goal="tts_install_options_open"')) errors.push('tts-list.html is missing install-options analytics');

if (errors.length) {
  console.error(`Public surface validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public surface validation passed: ${publicAssetCount} allowlisted assets, ${PRIVATE_PROBES.length} private probes excluded, canonical cache routes and GEO files present.`);
