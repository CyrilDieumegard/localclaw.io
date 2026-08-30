const fs = require('fs');
const path = require('path');
const { extensionlessPath, normalizeFiles } = require('./normalize-public-urls');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const SKIP = new Set(['.git', '.pages-dist', '_check', 'downloads', 'node_modules']);
const errors = [];
const internalTargets = new Map();

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function routeForFile(filePath) {
  const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');
  return extensionlessPath(`/${relative}`);
}

function targetForRoute(route) {
  const decoded = decodeURIComponent(route);
  if (decoded === '/') return path.join(ROOT, 'index.html');
  if (decoded.endsWith('/')) return path.join(ROOT, decoded, 'index.html');
  return path.join(ROOT, `${decoded}.html`);
}

const canonicalOwners = new Map();
const indexablePages = [];
for (const filePath of walk(ROOT).filter(file => file.endsWith('.html'))) {
  const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (/^google[a-z0-9]+\.html$/i.test(relative)) continue;
  if (/ \d+\.html$/i.test(relative)) errors.push(`${relative}: numbered duplicate file`);
  const html = fs.readFileSync(filePath, 'utf8');
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  const noindex = /\bnoindex\b/i.test(robots);
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i)?.[1];

  if (!noindex) {
    if (!canonical) {
      errors.push(`${relative}: missing canonical`);
    } else {
      const expected = `${BASE}${routeForFile(filePath)}`;
      if (canonical !== expected) errors.push(`${relative}: canonical ${canonical} != ${expected}`);
      if (canonicalOwners.has(canonical)) errors.push(`${relative}: duplicate canonical also used by ${canonicalOwners.get(canonical)}`);
      canonicalOwners.set(canonical, relative);
      indexablePages.push({ relative, canonical });
    }
  }

  const structuredData = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      structuredData.push(JSON.parse(match[1]));
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }

  const structuredItems = [];
  const collectStructuredItems = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(collectStructuredItems);
      return;
    }
    structuredItems.push(value);
    if (value['@graph']) collectStructuredItems(value['@graph']);
  };
  structuredData.forEach(collectStructuredItems);
  const videoObjects = structuredItems.filter(value => value['@type'] === 'VideoObject');
  for (const item of videoObjects) {
    for (const field of ['name', 'description', 'thumbnailUrl', 'uploadDate']) {
      if (!item[field]) errors.push(`${relative}: VideoObject missing ${field}`);
    }
    if (!item.embedUrl && !item.contentUrl) errors.push(`${relative}: VideoObject missing embedUrl or contentUrl`);
    if (item.uploadDate && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(item.uploadDate)) {
      errors.push(`${relative}: VideoObject uploadDate must include an ISO 8601 time and timezone`);
    }
    const thumbnails = Array.isArray(item.thumbnailUrl) ? item.thumbnailUrl : [item.thumbnailUrl];
    for (const thumbnail of thumbnails.filter(Boolean)) {
      if (!/^https:\/\//.test(thumbnail)) errors.push(`${relative}: VideoObject thumbnailUrl must be absolute HTTPS`);
      if (thumbnail.startsWith(`${BASE}/`)) {
        const thumbnailPath = path.join(ROOT, decodeURIComponent(new URL(thumbnail).pathname));
        if (!fs.existsSync(thumbnailPath)) errors.push(`${relative}: missing VideoObject thumbnail ${thumbnail}`);
      }
    }
  }

  const videos = [...html.matchAll(/<video\b([^>]*)>([\s\S]*?)<\/video>/gi)];
  if (relative.startsWith('video/') && videos.length !== videoObjects.length) {
    errors.push(`${relative}: expected one VideoObject per rendered video (${videos.length} videos, ${videoObjects.length} VideoObjects)`);
  }
  for (const [index, match] of videos.entries()) {
    const attributes = match[1];
    const body = match[2];
    const poster = attributes.match(/\bposter=["']([^"']+)["']/i)?.[1];
    if (!poster) {
      errors.push(`${relative}: video missing poster`);
      continue;
    }
    if (poster.startsWith('/')) {
      const posterPath = path.join(ROOT, decodeURIComponent(poster.split(/[?#]/, 1)[0]));
      if (!fs.existsSync(posterPath)) errors.push(`${relative}: missing video poster ${poster}`);
    }
    if (relative.startsWith('video/')) {
      const item = videoObjects[index];
      const source = body.match(/<source\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
      const absolutePoster = poster && poster.startsWith('/') ? `${BASE}${poster}` : poster;
      const thumbnails = item ? (Array.isArray(item.thumbnailUrl) ? item.thumbnailUrl : [item.thumbnailUrl]) : [];
      if (item && source && item.contentUrl !== source) errors.push(`${relative}: VideoObject contentUrl does not match video source`);
      if (item && absolutePoster && !thumbnails.includes(absolutePoster)) errors.push(`${relative}: VideoObject thumbnailUrl does not match video poster`);
    }
  }

  if (relative.startsWith('video/') && /data-media-category=["']video["']/i.test(html)) {
    errors.push(`${relative}: video example must be rendered as explicit image or video HTML`);
  }

  for (const match of html.matchAll(/href=["']([^"']+\.html(?:[?#][^"']*)?)["']/gi)) {
    if (match[1].startsWith('/') || match[1].startsWith('.') || !/^https?:/i.test(match[1]) || match[1].startsWith(`${BASE}/`)) {
      errors.push(`${relative}: internal .html link ${match[1]}`);
    }
  }

  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = match[1].trim();
    if (!href || href.includes('${') || href.startsWith('#') || /^(?:mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    try {
      const resolved = new URL(href, `${BASE}${routeForFile(filePath)}`);
      if (resolved.origin !== BASE) continue;
      internalTargets.set(resolved.pathname, internalTargets.get(resolved.pathname) || relative);
    } catch {
      errors.push(`${relative}: malformed href ${href}`);
    }
  }
}

for (const [route, owner] of internalTargets) {
  if (/^\/(?:api|cdn-cgi|css|downloads|go|images|js)\//.test(route)) continue;
  const decoded = decodeURIComponent(route);
  const direct = path.join(ROOT, decoded);
  const candidates = decoded === '/'
    ? [path.join(ROOT, 'index.html')]
    : decoded.endsWith('/')
      ? [path.join(direct, 'index.html')]
      : [direct, `${direct}.html`, path.join(direct, 'index.html')];
  if (!candidates.some(candidate => fs.existsSync(candidate))) errors.push(`${owner}: missing internal target ${route}`);
}

const policyChanges = normalizeFiles(ROOT, { check: true });
for (const file of policyChanges) errors.push(`${file}: URL normalization pending`);

const sitemapIndex = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapFiles = [...sitemapIndex.matchAll(/<loc>https:\/\/localclaw\.io\/(sitemap-[^<]+\.xml)<\/loc>/g)].map(match => match[1]);
if (!sitemapFiles.length) errors.push('sitemap.xml: no child sitemaps');

const sitemapUrls = new Set();
for (const sitemapFile of sitemapFiles) {
  const filePath = path.join(ROOT, sitemapFile);
  if (!fs.existsSync(filePath)) {
    errors.push(`sitemap.xml: missing ${sitemapFile}`);
    continue;
  }
  const xml = fs.readFileSync(filePath, 'utf8');
  for (const match of xml.matchAll(/<loc>(https:\/\/localclaw\.io[^<]+)<\/loc>/g)) {
    const loc = match[1].replace(/&amp;/g, '&');
    if (/\.html(?:[?#]|$)/i.test(loc)) errors.push(`${sitemapFile}: .html URL ${loc}`);
    if (sitemapUrls.has(loc)) errors.push(`${sitemapFile}: duplicate URL ${loc}`);
    sitemapUrls.add(loc);
    const route = new URL(loc).pathname;
    if (!fs.existsSync(targetForRoute(route))) errors.push(`${sitemapFile}: missing target for ${loc}`);
  }
}

for (const page of indexablePages) {
  if (/^(?:models|tts|image|video|3d|music|vision|software|ram|hardware|use-case|guides|blog|case-study|changelog|diy)\//.test(page.relative) && !sitemapUrls.has(page.canonical)) {
    errors.push(`${page.relative}: canonical missing from child sitemaps`);
  }
}

if (errors.length) {
  console.error(`SEO validation failed with ${errors.length} issue(s):`);
  for (const error of errors.slice(0, 120)) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SEO validation passed: ${indexablePages.length} indexable pages, ${sitemapUrls.size} sitemap URLs, valid JSON-LD and extensionless internal URLs.`);
