const fs = require('fs');
const path = require('path');
const { NAV_VERSION, siteNavigation, siteNavAssets } = require('./site-navigation');

const ROOT = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');
const excludedDirectories = new Set(['.git', '.pages-dist', '.wrangler', 'node_modules', '_check']);
const protectedFiles = new Set();

const navigationContract = siteNavigation();
for (const marker of [
  'href="/local-ai-activity-index"',
  'data-nav-key="atlas"',
  '>Atlas</a>',
  'href="/computers"',
  'data-nav-key="computers"',
  '>Computers</a>',
  'href="/ram-gpu-for-local-ai"',
  'data-nav-key="ram-gpu"',
  '>RAM/GPU</a>',
  'href="/charts"',
  'data-nav-key="charts"',
  '>Charts</a>',
  'href="/diy/"',
  'data-nav-key="diy"',
  '>DIY</a>',
  'data-theme-option="light"',
  'data-theme-option="dark"',
  'lc-theme-switcher--mobile',
  'lc-global-nav__actions',
  '>My Machines</a>'
]) {
  if (!navigationContract.includes(marker)) throw new Error(`Required navigation entry missing: ${marker}`);
}

const desktopActions = navigationContract.match(/<div class="lc-global-nav__actions">([\s\S]*?)<\/div>\s*<button class="lc-global-nav__menu-button"/);
if (!desktopActions || !desktopActions[1].includes('data-theme-switcher') || !desktopActions[1].includes('data-nav-key="account"')) {
  throw new Error('Desktop Account action must follow the theme switcher in the right-side action group.');
}

const assetContract = siteNavAssets();
for (const marker of [
  `/js/theme-toggle.js?v=${NAV_VERSION}`,
  `/css/site-nav.css?v=${NAV_VERSION}`,
  `/js/site-nav.js?v=${NAV_VERSION}`
]) {
  if (!assetContract.includes(marker)) throw new Error(`Required navigation asset missing: ${marker}`);
}

function htmlFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) htmlFiles(file, files);
    else if (entry.name.endsWith('.html')) files.push(file);
  }
  return files;
}

function activeSection(relativePath) {
  const clean = relativePath.replace(/\\/g, '/').replace(/\.html$/, '');
  if (clean === 'index') return 'index';
  if (clean === 'local-ai-activity-index') return 'atlas';
  if (clean === 'llm-list' || clean === 'llm-detail' || clean.startsWith('models/') || clean.startsWith('use-case/') || clean.startsWith('guides/best-local-llms')) return 'llm';
  if (clean === 'tts-list' || clean.startsWith('tts/') || clean.startsWith('guides/best-local-tts')) return 'voice';
  if (clean === 'image-models' || clean.startsWith('image/')) return 'image';
  if (clean === 'video-models' || clean.startsWith('video/')) return 'video';
  if (clean === '3d-models' || clean.startsWith('3d/')) return '3d';
  if (clean === 'music-models' || clean.startsWith('music/')) return 'music';
  if (clean === 'vision-models' || clean.startsWith('vision/')) return 'vision';
  if (clean === 'new') return 'new';
  if (clean === 'computers' || clean.startsWith('hardware/')) return 'computers';
  if (clean === 'ram-gpu-for-local-ai' || clean.startsWith('ram/')) return 'ram-gpu';
  if (clean === 'charts') return 'charts';
  if (clean === 'diy/index' || clean.startsWith('diy/')) return 'diy';
  if (clean === 'blog/index' || clean.startsWith('blog/') || clean.startsWith('case-study/')) return 'blog';
  if (clean === 'software' || clean === 'pricing' || clean === 'download' || clean.startsWith('changelog/')) return 'software';
  if (clean === 'account' || clean.startsWith('account/')) return 'account';
  return '';
}

function addAssets(html) {
  html = html.replace(
    /<meta name="color-scheme" content="light">/g,
    '<meta name="color-scheme" content="light dark">'
  );
  if (html.includes('/css/site-nav.css') || html.includes('href="css/site-nav.css')) {
    const versioned = html
      .replace(/(href="\/?css\/site-nav\.css)(?:\?v=[^"]*)?("\s*\/?>)/g, `$1?v=${NAV_VERSION}$2`)
      .replace(/(src="\/?js\/site-nav\.js)(?:\?v=[^"]*)?("[^>]*>)/g, `$1?v=${NAV_VERSION}$2`);
    if (/src="\/?js\/theme-toggle\.js(?:\?v=[^"]*)?"/.test(versioned)) {
      return versioned.replace(
        /(src="\/?js\/theme-toggle\.js)(?:\?v=[^"]*)?("[^>]*>)/g,
        `$1?v=${NAV_VERSION}$2`
      );
    }
    return versioned.replace('</head>', `  <script src="/js/theme-toggle.js?v=${NAV_VERSION}"></script>\n</head>`);
  }
  return html.replace('</head>', `  ${siteNavAssets()}\n</head>`);
}

function synchronize(html, relativePath) {
  if (relativePath === 'google7a49ecaded8c2575.html' || protectedFiles.has(relativePath.replace(/\\/g, '/'))) return html;

  const active = activeSection(relativePath);
  const navigation = siteNavigation(active);

  const accountHeader = html.match(/<header class="lc-site-header">[\s\S]*?<\/header>/i);
  if (accountHeader) return addAssets(html.replace(accountHeader[0], navigation));

  const buyerIntentHeader = html.match(/<header class="bi-nav">[\s\S]*?<\/header>/i);
  if (buyerIntentHeader) return addAssets(html.replace(buyerIntentHeader[0], navigation));

  if (relativePath.startsWith('changelog/')) {
    const legacyHeader = html.match(/<header class="(?:nav|site-nav)">[\s\S]*?<\/header>/i);
    if (legacyHeader) return addAssets(html.replace(legacyHeader[0], navigation));
  }

  const firstNav = html.match(/<nav\b[\s\S]*?<\/nav>/i);

  if (firstNav) {
    return addAssets(html.replace(firstNav[0], navigation));
  }

  if (relativePath.startsWith('changelog/')) {
    return addAssets(html.replace(/<body([^>]*)>/i, `<body$1>${navigation}`));
  }

  if (relativePath === 'models/index.html') {
    const indexed = html
      .replace(
        'body{background:#050505;color:#fff;font-family:Inter,system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:32px;line-height:1.6}',
        'body{background:#050505;color:#fff;font-family:Inter,system-ui,sans-serif;margin:0;line-height:1.6}.models-index{max-width:1000px;margin:0 auto;padding:32px}'
      )
      .replace(/<body([^>]*)>/i, `<body$1>${navigation}<main class="models-index">`)
      .replace('</body>', '</main></body>');
    return addAssets(indexed);
  }

  return html;
}

const changed = [];
for (const file of htmlFiles(ROOT)) {
  const relativePath = path.relative(ROOT, file);
  const before = fs.readFileSync(file, 'utf8');
  const after = synchronize(before, relativePath);
  const normalizedPath = relativePath.replace(/\\/g, '/');
  if (normalizedPath.startsWith('changelog/') && (
    !after.includes('class="lc-global-nav"')
    || !after.includes(`/js/theme-toggle.js?v=${NAV_VERSION}`)
  )) {
    throw new Error(`Changelog theme/navigation contract missing: ${normalizedPath}`);
  }
  if (after === before) continue;
  changed.push(relativePath);
  if (!checkOnly) fs.writeFileSync(file, after);
}

if (checkOnly && changed.length) {
  console.error(`Navigation drift detected in ${changed.length} file(s):`);
  changed.slice(0, 30).forEach(file => console.error(`- ${file}`));
  if (changed.length > 30) console.error(`- ... and ${changed.length - 30} more`);
  process.exit(1);
}

console.log(checkOnly
  ? 'Navigation is synchronized across public pages.'
  : `Synchronized navigation across ${changed.length} file(s).`);
