const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const TODAY = process.env.SITEMAP_DATE || new Date().toISOString().slice(0, 10);
function loadModels(){const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'js/data.js'),'utf8')+';this.APP_DATA=APP_DATA;',ctx);return ctx.APP_DATA.models;}
function url(loc,lastmod=TODAY,changefreq='monthly',priority='0.8'){return `    <url>\n        <loc>${BASE}${loc}</loc>\n        <lastmod>${lastmod}</lastmod>\n        <changefreq>${changefreq}</changefreq>\n        <priority>${priority}</priority>\n    </url>`}
function shouldIndexHtml(filePath){
  const html = fs.readFileSync(filePath, 'utf8').slice(0, 2500);
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || '';
  return !/\bnoindex\b/i.test(robots);
}
function addHtmlDir(dir, basePath, changefreq='monthly', priority='0.8') {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return;
  for (const f of fs.readdirSync(fullDir).filter(f => f.endsWith('.html') && f !== 'index.html').sort()) {
    const filePath = path.join(fullDir, f);
    if (shouldIndexHtml(filePath)) urls.push(url(`${basePath}/${f}`, TODAY, changefreq, priority));
  }
}
const urls=[];
urls.push(url('/', TODAY, 'weekly', '1.0'));
urls.push(url('/pricing.html', TODAY, 'monthly', '0.9'));
urls.push(url('/download.html', TODAY, 'monthly', '0.8'));
urls.push(url('/llm-list.html', TODAY, 'weekly', '0.9'));
urls.push(url('/tts-list.html', TODAY, 'weekly', '0.9'));
urls.push(url('/computers.html', TODAY, 'monthly', '0.8'));
urls.push(url('/ram-gpu-for-local-ai.html', TODAY, 'monthly', '0.85'));
urls.push(url('/new.html', TODAY, 'weekly', '0.9'));
urls.push(url('/models/', TODAY, 'weekly', '0.9'));
urls.push(url('/ram/', TODAY, 'weekly', '0.9'));
urls.push(url('/hardware/', TODAY, 'weekly', '0.9'));
urls.push(url('/use-case/', TODAY, 'weekly', '0.9'));
urls.push(url('/tts/', TODAY, 'weekly', '0.9'));
urls.push(url('/guides/', TODAY, 'weekly', '0.9'));
for (const tier of [8,16,32,64,128]) urls.push(url(`/ram/${tier}gb.html`, TODAY, 'monthly', '0.85'));
addHtmlDir('hardware', '/hardware', 'monthly', '0.85');
addHtmlDir('use-case', '/use-case', 'monthly', '0.85');
addHtmlDir('tts', '/tts', 'monthly', '0.8');
addHtmlDir('guides', '/guides', 'monthly', '0.88');
urls.push(url('/blog/', TODAY, 'weekly', '0.9'));
addHtmlDir('blog', '/blog', 'monthly', '0.8');
const seen = new Set();
for (const m of loadModels()) {
  if (seen.has(m.id)) continue;
  seen.add(m.id);
  urls.push(url(`/models/${encodeURIComponent(m.id)}.html`, TODAY, 'monthly', m.isNew?'0.85':'0.75'));
}
addHtmlDir('models', '/models', 'monthly', '0.75');
const deduped = [];
const seenUrls = new Set();
for (const item of urls) {
  const loc = item.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!loc || seenUrls.has(loc)) continue;
  seenUrls.add(loc);
  deduped.push(item);
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${deduped.join('\n\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), xml);
console.log(`Generated sitemap.xml with ${deduped.length} URLs (${seen.size} data model pages).`);
