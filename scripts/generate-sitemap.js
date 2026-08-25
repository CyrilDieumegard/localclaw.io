const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { extensionlessPath } = require('./normalize-public-urls');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const TODAY = process.env.SITEMAP_DATE || new Date().toISOString().slice(0, 10);
const DATE_STATE_FILE = path.join(__dirname, 'sitemap-dates.json');
const contentCache = new Map();

function fileContent(filePath) {
  if (!contentCache.has(filePath)) contentCache.set(filePath, fs.readFileSync(filePath));
  return contentCache.get(filePath);
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[character]));
}

function routeForFile(relativeFile) {
  return extensionlessPath(`/${relativeFile.replace(/\\/g, '/')}`);
}

function shouldIndex(filePath) {
  const html = fileContent(filePath).toString('utf8', 0, 5000);
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  return !/\bnoindex\b/i.test(robots);
}

function loadDateState() {
  try {
    return JSON.parse(fs.readFileSync(DATE_STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const previousDates = loadDateState();
const nextDates = {};

function lastModified(relativeFile, dependencies = []) {
  const hashBuilder = crypto.createHash('sha256');
  hashBuilder.update(fileContent(path.join(ROOT, relativeFile)));
  for (const file of dependencies) {
    hashBuilder.update('\0');
    hashBuilder.update(fileContent(path.join(ROOT, file)));
  }
  const hash = hashBuilder.digest('hex');
  const previous = previousDates[relativeFile];
  const lastmod = previous?.hash === hash && previous?.lastmod ? previous.lastmod : TODAY;
  nextDates[relativeFile] = { hash, lastmod };
  return lastmod;
}

function htmlFiles(directory) {
  const fullDirectory = path.join(ROOT, directory);
  if (!fs.existsSync(fullDirectory)) return [];
  return fs.readdirSync(fullDirectory)
    .filter(file => file.endsWith('.html') && !/ \d+\.html$/i.test(file))
    .sort()
    .map(file => `${directory}/${file}`)
    .filter(relativeFile => shouldIndex(path.join(ROOT, relativeFile)));
}

function page(relativeFile, changefreq = 'monthly', priority = '0.8', dependencies = []) {
  const filePath = path.join(ROOT, relativeFile);
  if (!fs.existsSync(filePath) || !shouldIndex(filePath)) return null;
  return {
    loc: `${BASE}${routeForFile(relativeFile)}`,
    lastmod: lastModified(relativeFile, dependencies),
    changefreq,
    priority
  };
}

function unique(items) {
  const seen = new Set();
  return items.filter(Boolean).filter(item => {
    if (seen.has(item.loc)) return false;
    seen.add(item.loc);
    return true;
  });
}

const groups = {
  core: unique([
    page('index.html', 'weekly', '1.0', ['js/data.js', 'js/home-index-speech-20260814c.js']),
    page('software.html', 'monthly', '0.9'),
    page('pricing.html', 'monthly', '0.8'),
    page('download.html', 'monthly', '0.8'),
    page('llm-list.html', 'weekly', '0.9', ['js/data.js']),
    page('tts-list.html', 'weekly', '0.9'),
    page('image-models.html', 'weekly', '0.9', ['js/local-ai-catalog.js']),
    page('video-models.html', 'weekly', '0.9', ['js/local-ai-catalog.js']),
    page('3d-models.html', 'weekly', '0.9', ['js/local-ai-catalog.js']),
    page('music-models.html', 'weekly', '0.9', ['js/local-ai-catalog.js']),
    page('vision-models.html', 'weekly', '0.9', ['js/local-ai-catalog.js']),
    page('computers.html', 'monthly', '0.8'),
    page('ram-gpu-for-local-ai.html', 'monthly', '0.85'),
    page('sponsor.html', 'monthly', '0.75'),
    page('new.html', 'weekly', '0.9', ['js/data.js', 'new-models.xml']),
    ...htmlFiles('software').map(file => page(file, 'monthly', '0.85')),
    ...htmlFiles('case-study').map(file => page(file, 'monthly', '0.9')),
    ...htmlFiles('changelog').map(file => page(file, 'monthly', '0.78'))
  ]),
  models: unique(htmlFiles('models').map(file => page(file, file.endsWith('/index.html') ? 'weekly' : 'monthly', file.endsWith('/index.html') ? '0.9' : '0.75'))),
  tts: unique(htmlFiles('tts').map(file => page(file, file.endsWith('/index.html') ? 'weekly' : 'monthly', file.endsWith('/index.html') ? '0.9' : '0.8'))),
  multimodal: unique([
    ...htmlFiles('image').map(file => page(file, 'monthly', '0.8')),
    ...htmlFiles('video').map(file => page(file, 'monthly', '0.8')),
    ...htmlFiles('3d').map(file => page(file, 'monthly', '0.8')),
    ...htmlFiles('music').map(file => page(file, 'monthly', '0.8')),
    ...htmlFiles('vision').map(file => page(file, 'monthly', '0.8'))
  ]),
  blog: unique(htmlFiles('blog').map(file => page(file, file.endsWith('/index.html') ? 'weekly' : 'monthly', file.endsWith('/index.html') ? '0.9' : '0.8'))),
  guides: unique([
    ...htmlFiles('ram').map(file => page(file, file.endsWith('/index.html') ? 'weekly' : 'monthly', '0.85')),
    ...htmlFiles('hardware').map(file => page(file, file.endsWith('/index.html') ? 'weekly' : 'monthly', '0.85')),
    ...htmlFiles('use-case').map(file => page(file, file.endsWith('/index.html') ? 'weekly' : 'monthly', '0.85')),
    ...htmlFiles('guides').map(file => page(file, file.endsWith('/index.html') ? 'weekly' : 'monthly', '0.88'))
  ])
};

function urlset(items) {
  const rows = items.map(item => `  <url>\n    <loc>${escapeXml(item.loc)}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

const sitemapEntries = [];
for (const [name, items] of Object.entries(groups)) {
  const filename = `sitemap-${name}.xml`;
  fs.writeFileSync(path.join(ROOT, filename), urlset(items));
  sitemapEntries.push({
    loc: `${BASE}/${filename}`,
    lastmod: items.map(item => item.lastmod).sort().at(-1) || TODAY
  });
}

const indexRows = sitemapEntries.map(item => `  <sitemap>\n    <loc>${escapeXml(item.loc)}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n  </sitemap>`).join('\n');
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexRows}\n</sitemapindex>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapIndex);
fs.writeFileSync(DATE_STATE_FILE, `${JSON.stringify(nextDates, null, 2)}\n`);

const total = Object.values(groups).reduce((sum, items) => sum + items.length, 0);
console.log(`Generated sitemap index with ${sitemapEntries.length} files and ${total} canonical URLs.`);
