const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://localclaw.io';
const LIMIT = 20;

function loadModels() {
  const context = {};
  vm.createContext(context);
  const source = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
  vm.runInContext(`${source};this.APP_DATA=APP_DATA;`, context);
  const updatedMatch = source.match(/^\/\/ Updated ([A-Za-z]+ \d{1,2}, \d{4})/m);
  const updatedAt = updatedMatch ? new Date(`${updatedMatch[1]} 12:00:00 UTC`) : new Date();
  return { models: context.APP_DATA.models || [], updatedAt };
}

function escapeXml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }[character]));
}

function releaseDate(released) {
  const match = String(released || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!match) return new Date('2026-01-01T12:00:00Z');
  return new Date(`${match[1]}-${match[2]}-${match[3] || '01'}T12:00:00Z`);
}

function modelDescription(model) {
  const facts = [
    model.params,
    model.min_ram ? `${model.min_ram} GB minimum RAM` : '',
    model.recommended_quant,
    model.family
  ].filter(Boolean).join(' · ');
  return `${model.description || ''}${facts ? ` ${facts}.` : ''}`.trim();
}

function isPracticalLocalModel(model) {
  const description = String(model.description || '').toLowerCase();
  const tags = Array.isArray(model.tags) ? model.tags.map(tag => String(tag).toLowerCase()) : [];
  const excluded = /server-grade only|datacenter-grade only|not yet verified|api only/.test(description);
  const workstationFit = Number(model.min_ram || 0) > 0 && Number(model.min_ram) <= 256;
  const installReference = Boolean(model.hf_repo && model.recommended_quant);
  return !model.hosted_only && !excluded && !tags.includes('experimental') && workstationFit && installReference;
}

const catalogue = loadModels();
const models = Array.from(new Map(catalogue.models.map(model => [model.id, model])).values())
  .filter(model => model.id && model.name && model.released && isPracticalLocalModel(model))
  .sort((a, b) => {
    const releaseDifference = releaseDate(b.released) - releaseDate(a.released);
    if (releaseDifference) return releaseDifference;
    return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
  })
  .slice(0, LIMIT);

const lastBuildDate = catalogue.updatedAt;
const items = models.map(model => {
  const url = `${BASE_URL}/models/${encodeURIComponent(model.id)}`;
  return `    <item>
      <title>${escapeXml(model.name)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${releaseDate(model.released).toUTCString()}</pubDate>
      <category>${escapeXml(model.family || 'local-ai')}</category>
      <description>${escapeXml(modelDescription(model))}</description>
    </item>`;
}).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LocalClaw New Local AI Models</title>
    <link>${BASE_URL}/new</link>
    <atom:link href="${BASE_URL}/new-models.xml" rel="self" type="application/rss+xml" />
    <description>Recently released open-weight AI models verified for local use in the LocalClaw catalogue.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
    <ttl>1440</ttl>
${items}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(ROOT, 'new-models.xml'), rss);
console.log(`Generated new-models.xml with ${models.length} local model entries.`);
