const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const TODAY = '2026-05-14';
function loadModels(){const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'js/data.js'),'utf8')+';this.APP_DATA=APP_DATA;',ctx);return ctx.APP_DATA.models;}
function url(loc,lastmod=TODAY,changefreq='monthly',priority='0.8'){return `    <url>\n        <loc>${BASE}${loc}</loc>\n        <lastmod>${lastmod}</lastmod>\n        <changefreq>${changefreq}</changefreq>\n        <priority>${priority}</priority>\n    </url>`}
const urls=[];
urls.push(url('/', TODAY, 'weekly', '1.0'));
urls.push(url('/pricing.html', TODAY, 'monthly', '0.9'));
urls.push(url('/download.html', TODAY, 'monthly', '0.8'));
urls.push(url('/llm-list.html', TODAY, 'weekly', '0.9'));
urls.push(url('/tts-list.html', TODAY, 'weekly', '0.9'));
urls.push(url('/computers.html', TODAY, 'monthly', '0.8'));
urls.push(url('/new.html', TODAY, 'weekly', '0.9'));
urls.push(url('/models/', TODAY, 'weekly', '0.9'));
urls.push(url('/ram/', TODAY, 'weekly', '0.9'));
urls.push(url('/hardware/', TODAY, 'weekly', '0.9'));
urls.push(url('/use-case/', TODAY, 'weekly', '0.9'));
for (const tier of [8,16,32,64,128]) urls.push(url(`/ram/${tier}gb.html`, TODAY, 'monthly', '0.85'));
if (fs.existsSync(path.join(ROOT,'hardware'))) for (const f of fs.readdirSync(path.join(ROOT,'hardware')).filter(f=>f.endsWith('.html')&&f!=='index.html').sort()) urls.push(url(`/hardware/${f}`, TODAY, 'monthly', '0.85'));
if (fs.existsSync(path.join(ROOT,'use-case'))) for (const f of fs.readdirSync(path.join(ROOT,'use-case')).filter(f=>f.endsWith('.html')&&f!=='index.html').sort()) urls.push(url(`/use-case/${f}`, TODAY, 'monthly', '0.85'));
urls.push(url('/blog/', TODAY, 'weekly', '0.9'));
for (const f of fs.readdirSync(path.join(ROOT,'blog')).filter(f=>f.endsWith('.html')).sort()) urls.push(url(`/blog/${f}`, TODAY, 'monthly', f.includes('best-local-ai')?'0.9':'0.8'));
const seen = new Set();
for (const m of loadModels()) {
  if (seen.has(m.id)) continue;
  seen.add(m.id);
  urls.push(url(`/models/${encodeURIComponent(m.id)}.html`, TODAY, 'monthly', m.isNew?'0.85':'0.75'));
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), xml);
console.log(`Generated sitemap.xml with ${urls.length} URLs (${seen.size} model pages).`);
