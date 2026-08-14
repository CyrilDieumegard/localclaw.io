const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const SKIP_DIRECTORIES = new Set(['.git', '.pages-dist', '_check', 'downloads', 'node_modules']);

function splitSuffix(value) {
  const match = String(value).match(/^([^?#]*)([?#].*)?$/);
  return { pathname: match?.[1] || '', suffix: match?.[2] || '' };
}

function extensionlessPath(pathname) {
  let clean = pathname.replace(/\\/g, '/').replace(/\/+/g, '/');
  clean = clean.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  if (clean === '/index') return '/';
  return clean || '/';
}

function pageDirectory(filePath) {
  const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const directory = path.posix.dirname(`/${relative}`);
  return directory === '/' ? '/' : `${directory}/`;
}

function normalizePublicUrl(value, filePath) {
  const original = String(value).trim();
  if (!original || original.startsWith('#') || /^(?:mailto:|tel:|javascript:|data:)/i.test(original)) {
    return value;
  }

  if (original.startsWith(`${BASE}/`) || original === BASE) {
    const parsed = new URL(original);
    parsed.pathname = extensionlessPath(parsed.pathname);
    return `${BASE}${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  // External absolute URLs are source references, not LocalClaw routes. In
  // particular, an upstream URL ending in `.html` must keep both its origin
  // and extension instead of being resolved relative to the current page.
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(original)) return value;

  const { pathname, suffix } = splitSuffix(original);
  if (pathname === '.html') return value;
  if (!/\.html$/i.test(pathname)) return value;

  let resolvedPath;
  if (pathname.startsWith('/')) {
    resolvedPath = pathname;
  } else {
    resolvedPath = path.posix.resolve(pageDirectory(filePath), pathname);
  }

  return `${extensionlessPath(resolvedPath)}${suffix}`;
}

function normalizeQuotedUrls(content, filePath) {
  return content.replace(/(["'`])((?:https:\/\/localclaw\.io\/|\/|\.\.?\/)?[^"'`\s<>]*?\.html(?:[?#][^"'`\s<>]*)?)\1/g, (match, quote, value) => {
    if (!value || /\$\{/.test(value)) return match;
    const normalized = normalizePublicUrl(value, filePath);
    return `${quote}${normalized}${quote}`;
  });
}

function normalizeTemplateUrls(content) {
  return content.replace(/(["'`])((?:\/|\.\.?\/)?[^"'`\s<>]*\$\{[^}]+\}[^"'`\s<>]*)\.html([?#][^"'`\s<>]*)?\1/g, (match, quote, value, suffix = '') => {
    const rooted = value.startsWith('/') ? value : `/${value.replace(/^\.\//, '')}`;
    return `${quote}${rooted}${suffix}${quote}`;
  });
}

function normalizeHtml(content, filePath) {
  let normalized = normalizeQuotedUrls(content, filePath);
  normalized = normalized.replace(/https:\/\/localclaw\.io\/[^"'`\s<>]*?\.html(?=[?#"'`\s<>]|$)/g, value => {
    return normalizePublicUrl(value, filePath);
  });
  normalized = normalized.replace(/(url=)([^"'\s<>]+\.html(?:[?#][^"'\s<>]*)?)/gi, (match, prefix, value) => {
    return `${prefix}${normalizePublicUrl(value, filePath)}`;
  });
  return normalizeTemplateUrls(normalized);
}

function normalizeJavaScript(content, filePath) {
  const rootContext = path.join(ROOT, 'index.html');
  return normalizeTemplateUrls(normalizeQuotedUrls(content, rootContext));
}

function filesIn(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const files = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...filesIn(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function normalizeFiles(target = ROOT, { check = false } = {}) {
  const changed = [];
  for (const filePath of filesIn(target)) {
    const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const isHtml = filePath.endsWith('.html');
    const isPublicJs = filePath.endsWith('.js') && relative.startsWith('js/');
    if (!isHtml && !isPublicJs) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const normalized = isHtml ? normalizeHtml(source, filePath) : normalizeJavaScript(source, filePath);
    if (normalized === source) continue;
    changed.push(relative);
    if (!check) fs.writeFileSync(filePath, normalized);
  }
  return changed;
}

function normalizeDirectory(directory) {
  return normalizeFiles(directory);
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const changed = normalizeFiles(ROOT, { check });
  if (check && changed.length) {
    console.error(`URL policy violations in ${changed.length} files:`);
    for (const file of changed.slice(0, 80)) console.error(`- ${file}`);
    process.exitCode = 1;
  } else {
    console.log(`${check ? 'Checked' : 'Normalized'} public URLs in ${changed.length} files.`);
  }
}

module.exports = {
  extensionlessPath,
  normalizeDirectory,
  normalizeFiles,
  normalizePublicUrl
};
