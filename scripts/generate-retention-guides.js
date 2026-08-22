const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { normalizeDirectory: normalizePublicUrls } = require('./normalize-public-urls');
const { siteNavigation, siteNavAssets } = require('./site-navigation');
const modelRanking = require('../js/model-ranking');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';

function loadModels() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';this.APP_DATA=APP_DATA;', ctx);
  const unavailable = ctx.APP_DATA.hfRepoVerification && ctx.APP_DATA.hfRepoVerification.unavailable || {};
  return Array.from(new Map(ctx.APP_DATA.models.map(model => [model.id, model])).values())
    .filter(model => unavailable[model.id] !== model.hf_repo);
}

function loadTts() {
  const html = fs.readFileSync(path.join(ROOT, 'tts-list.html'), 'utf8');
  const match = html.match(/const TTS_MODELS = (\[[\s\S]*?\n\s*\]);/);
  if (!match) throw new Error('TTS_MODELS not found in tts-list.html');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`this.TTS_MODELS=${match[1]}`, ctx);
  return ctx.TTS_MODELS;
}

const esc = (s = '') => String(s).replace(/[&<>'"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[c]));

const tracking = `
  <!-- TRACKING: DataFast Analytics -->
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <script src="/js/clarity.js" defer></script>
  ${siteNavAssets()}`;

const lightStyle = `
:root{color-scheme:light;--bg:#faf9f6;--surface:#fff;--card:#fff;--soft:#f7f5f1;--border:#d7dce4;--primary:#c92f28;--muted:#64748b;--purple:#7c3aed;--green:#166534}
body{background:radial-gradient(circle at 18% 8%,rgba(201,47,40,.07),transparent 28rem),linear-gradient(180deg,#faf9f6,#fff 44%,#faf9f6);color:#111827}
body:before{background-image:linear-gradient(rgba(100,116,139,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(100,116,139,.08) 1px,transparent 1px)}
.site-nav{border-color:var(--border);background:rgba(255,255,255,.94)}
.logo{color:#111827}.logo-box{box-shadow:0 8px 22px rgba(201,47,40,.18)}
.nav-links a{color:var(--muted)}.nav-links a:hover,.nav-links .active{color:#111827}.nav-links .pricing{color:var(--primary)}
.breadcrumb a{color:#475569}
.panel,.section,.card,.metric{border-color:var(--border);background:linear-gradient(180deg,#fff,var(--soft));box-shadow:0 18px 54px rgba(15,23,42,.07)}
.panel:before{background:radial-gradient(circle at 0 0,rgba(201,47,40,.11),transparent 44%)}
.desc,.card p,.section p,.section li{color:#475569}
.btn{border-color:rgba(201,47,40,.45);background:var(--primary);color:#fff;box-shadow:6px 6px 0 rgba(154,25,18,.16)}
.btn.secondary{background:#fff;color:#111827;border-color:var(--border)}
.card h3 a{color:#111827}
.pill{border-color:var(--border);background:var(--soft);color:#475569}
.source-list a{color:#475569}
.quick{border-color:rgba(201,47,40,.32);background:rgba(201,47,40,.05)}
.next-grid a{border-color:var(--border);background:#fff;color:#111827}
`;

function scopeLightCss(css) {
  return css.replace(/(^|})(\s*)([^@{}][^{}]*)\{/g, (match, boundary, whitespace, selectors) => {
    const scoped = selectors.split(',').map(rawSelector => {
      const selector = rawSelector.trim();
      if (selector === ':root' || selector === 'html') return 'html.light';
      if (selector.startsWith('html.light')) return selector;
      return `html.light ${selector}`;
    }).join(',');
    return `${boundary}${whitespace}${scoped}{`;
  });
}

function applyLightTheme(html) {
  return html
    .replace('<html lang="en">', '<html class="light" lang="en">')
    .replace('<head><meta charset="UTF-8">', '<head><meta charset="UTF-8"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#faf9f6">')
    .replace('</head>', `<style>${scopeLightCss(lightStyle)}</style></head>`);
}

function normalizeDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      normalizeDirectory(entryPath);
    } else if (entry.name.endsWith('.html')) {
      fs.writeFileSync(entryPath, applyLightTheme(fs.readFileSync(entryPath, 'utf8')));
    }
  }
  normalizePublicUrls(directory);
}

const style = `
:root{--bg:#050505;--surface:#0f0f11;--card:#151515;--border:#27272a;--primary:#ff453a;--muted:#a1a1aa;--purple:#a78bfa;--green:#22c55e}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 18% 8%,rgba(255,69,58,.14),transparent 28rem),linear-gradient(180deg,#050505,#080808 44%,#050505);color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6}body:before{content:"";position:fixed;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:84px 84px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.85),transparent 88%)}a{text-decoration:none}.site-nav{border-bottom:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.86);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}.nav-inner{max-width:1240px;margin:0 auto;padding:0 24px;height:76px;display:flex;align-items:center;justify-content:space-between;gap:24px}.logo{display:flex;align-items:center;gap:12px;color:#fff}.logo-box{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--primary),#ea580c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(255,69,58,.45)}.logo-box img{width:28px;height:28px;border-radius:6px}.logo-text{font-family:'Space Grotesk',Inter,sans-serif;font-size:25px;font-weight:950;letter-spacing:-.04em;text-transform:uppercase}.logo-text span{color:var(--primary)}.nav-links{display:flex;gap:24px}.nav-links a{color:var(--muted);font:800 13px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em}.nav-links a:hover,.nav-links .active{color:#fff}.nav-links .pricing{color:var(--primary)}.wrap{max-width:1180px;margin:0 auto;padding:30px 24px 70px}.breadcrumb{display:flex;flex-wrap:wrap;gap:10px;color:var(--muted);font:800 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:18px}.breadcrumb a{color:#d4d4d8}.hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:18px;margin-bottom:18px}.panel,.section,.card,.metric{border:1px solid var(--border);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.38)}.panel{padding:32px;position:relative;overflow:hidden}.panel:before{content:"";position:absolute;inset:-1px;background:radial-gradient(circle at 0 0,rgba(255,69,58,.22),transparent 44%);pointer-events:none}.eyebrow{position:relative;color:var(--primary);font:950 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.18em}.title{position:relative;font-size:clamp(44px,7vw,86px);line-height:.92;margin:16px 0;font-weight:950;letter-spacing:-.055em}.title span{color:var(--primary)}.desc{position:relative;color:#d4d4d8;font-size:19px;max-width:780px}.cta{position:relative;display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,69,58,.55);background:var(--primary);color:#050505;font:950 13px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.05em;padding:13px 16px;border-radius:12px;box-shadow:6px 6px 0 rgba(154,25,18,.5)}.btn.secondary{background:#111;color:#fff;border-color:rgba(255,255,255,.18);box-shadow:none}.side{display:grid;grid-template-columns:1fr 1fr;gap:12px}.metric{padding:18px}.metric .k{font:900 11px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.metric .v{font-size:28px;font-weight:950;margin-top:6px}.section{padding:26px;margin-top:18px}h2{font-size:30px;line-height:1.1;margin:0 0 16px;letter-spacing:-.03em}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{padding:18px}.rank{color:var(--primary);font:950 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}.card h3{font-size:21px;line-height:1.15;margin:10px 0}.card h3 a{color:#fff}.meta{color:var(--muted);font:800 12px ui-monospace,monospace}.card p,.section p,.section li{color:#d4d4d8}.pill{display:inline-block;border:1px solid #3f3f46;background:#18181b;border-radius:999px;color:#d4d4d8;padding:4px 8px;margin:3px;font:800 11px ui-monospace,monospace}.source-list a{display:block;color:#d4d4d8;margin:8px 0}.quick{border-color:rgba(255,69,58,.4);background:rgba(255,69,58,.07)}.next-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.next-grid a{border:1px solid var(--border);background:#0d0d0d;border-radius:16px;color:#fff;padding:16px;font-weight:900}.next-grid small{display:block;color:var(--muted);font:900 10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px}@media(max-width:900px){.nav-links{display:none}.nav-inner{height:64px}.hero,.side,.grid,.next-grid{grid-template-columns:1fr}.wrap{padding:24px 16px 56px}.panel{padding:24px}.btn{width:100%}}`;

function nav(active = '') {
  return siteNavigation(active);
}

function rankedModels(models, machine, options = {}) {
  return modelRanking.rankModels(machine, {}, models, { includeTight: true, ...options }).allCompatible;
}

function modelCard(m, i) {
  return `<article class="card"><div class="rank">#${i + 1}</div><h3><a href="/models/${esc(m.id)}.html">${esc(m.name)}</a></h3><div class="meta">${esc(m.params)} · ${esc(m.min_ram)}GB RAM · ${esc(m.recommended_quant)} · ${esc(m.size_gb)}GB</div><p><strong>Catalogue summary:</strong> ${esc(m.description)}</p><div>${(m.tags || []).slice(0, 6).map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div></article>`;
}

function ttsCard(m, i) {
  return `<article class="card"><div class="rank">#${i + 1}</div><h3><a href="/tts/${esc(m.id)}.html">${esc(m.name)}</a></h3><div class="meta">${esc(m.developer || m.family || 'Open model')} · catalogue quality ${esc(m.quality)}/10 · catalogue speed ${esc(m.speed)}/10</div><p><strong>Catalogue summary:</strong> ${esc(m.description || 'Local speech model tracked by LocalClaw.')}</p><div>${(m.features || []).slice(0, 6).map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div></article>`;
}

function page({ id, title, accent, description, active, metrics, quick, cards, cardRenderer, links, sources }) {
  const url = `${BASE}/guides/${id}.html`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url,
    description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: cards.length,
      itemListElement: cards.slice(0, 12).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: `${BASE}${active === 'tts' ? '/tts/' : '/models/'}${item.id}.html`
      }))
    }
  };
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} | LocalClaw</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)} | LocalClaw"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${BASE}/images/twitter-card.jpg?v=3"><link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}<style>${style}</style></head>
<body>${nav(active)}<main class="wrap"><div class="breadcrumb"><a href="/">LocalClaw</a><span>/</span><a href="/guides/">Guides</a><span>/</span><span>${esc(accent)}</span></div>
<header class="hero"><section class="panel"><div class="eyebrow">${esc(accent)}</div><h1 class="title">${esc(title).replace(accent, `<span>${esc(accent)}</span>`)}</h1><p class="desc">${esc(description)}</p><div class="cta"><a class="btn" href="/">Run recommender</a><a class="btn secondary" href="${active === 'tts' ? '/tts-list.html' : '/llm-list.html'}">Open full ${active === 'tts' ? 'TTS' : 'LLM'} list</a></div></section><aside class="side">${metrics.map(([k, v]) => `<div class="metric"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('')}</aside></header>
<section class="section quick"><h2>Quick answer</h2><p>${quick}</p></section>
<section class="section"><h2>Recommended starting points</h2><div class="grid">${cards.slice(0, 9).map(cardRenderer).join('')}</div></section>
<section class="section"><h2>Keep exploring</h2><div class="next-grid">${links.map(([k, label, href]) => `<a href="${esc(href)}"><small>${esc(k)}</small>${esc(label)}</a>`).join('')}</div></section>
<section class="section"><h2>Method and source checks</h2><p>These contextual lists use LocalClaw catalogue tags and editorial quality, coding, reasoning or speed fields. They are not the homepage LocalClaw score, not standardized third-party benchmarks and never include community stars. Catalogue summaries can repeat upstream claims; verify them in the linked material.</p><div class="source-list">${sources.map(([label, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener nofollow">${esc(label)} →</a>`).join('')}</div></section>
</main></body></html>`;
}

function indexPage(guides) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Local AI guides | LocalClaw</title><meta name="description" content="Practical LocalClaw guides for choosing local LLMs and TTS models by RAM, hardware and use case."><meta name="robots" content="index, follow"><link rel="canonical" href="${BASE}/guides/">${tracking}<style>${style}</style></head><body>${nav()}<main class="wrap"><header class="hero"><section class="panel"><div class="eyebrow">Local AI guides</div><h1 class="title">Choose the <span>right local AI path</span></h1><p class="desc">Short, practical SEO guides that connect hardware, RAM, models and LocalClaw workflows.</p></section><aside class="side"><div class="metric"><div class="k">Guides</div><div class="v">${guides.length}</div></div><div class="metric"><div class="k">Goal</div><div class="v">Next step</div></div></aside></header><section class="section"><div class="grid">${guides.map(g => `<a class="card" href="/guides/${esc(g.id)}.html"><div class="rank">${esc(g.accent)}</div><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p></a>`).join('')}</div></section></main></body></html>`;
}

const models = loadModels().filter(m => !m.hosted_only);
const ttsModels = loadTts().filter(model => !model.delivery);
const out = path.join(ROOT, 'guides');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const guideData = [
  {
    id: 'best-local-llms-for-mac-mini-m4',
    title: 'Best local LLMs for Mac mini M4',
    accent: 'Mac mini M4',
    description: 'Practical local AI picks for Mac mini M4 and M4 Pro machines, focused on unified memory, LM Studio fit and real desktop workflows.',
    active: 'llm',
    cards: rankedModels(models, { ramGb: 24, platform: 'mac', accelerator: 'apple-silicon', useCase: 'general', priority: 'balanced', context: '8k' }),
    metrics: [['Hardware', 'M4 / M4 Pro'], ['RAM tiers', '16-48GB'], ['Best fit', 'Q4/Q5'], ['Mode', 'Desktop']],
    quick: 'For a Mac mini M4 with 16GB, start with compact 8B-14B class models and keep enough memory headroom for macOS and LM Studio. For M4 Pro 24GB or 48GB, larger 24B-32B class models become more comfortable.',
    links: [['Hardware', 'Mac mini M4 guide', '/hardware/mac-mini-m4-16gb.html'], ['RAM', '16GB model guide', '/ram/16gb.html'], ['Compare', 'All local LLMs', '/llm-list.html'], ['App', 'Get LocalClaw', '/pricing.html']],
    sources: [['Apple Mac mini technical specifications', 'https://www.apple.com/mac-mini/specs/'], ['LM Studio model catalogue', 'https://lmstudio.ai/models']]
  },
  {
    id: 'best-local-llms-for-16gb-ram',
    title: 'Best local LLMs for 16GB RAM',
    accent: '16GB RAM',
    description: 'The cleanest starting points for local LLMs on 16GB machines: compact chat, coding and reasoning models that avoid painful memory pressure.',
    active: 'llm',
    cards: rankedModels(models, { ramGb: 16, platform: 'other', accelerator: 'cpu', useCase: 'general', priority: 'balanced', context: '8k' }),
    metrics: [['RAM', '16GB'], ['Target', 'Laptop safe'], ['Quant', 'Q4/Q5'], ['Use', 'Chat + code']],
    quick: 'On 16GB RAM, the best experience usually comes from 4B-14B models in Q4_K_M or Q5_K_M. Bigger models can look tempting, but memory pressure quickly hurts latency.',
    links: [['RAM', 'Full 16GB guide', '/ram/16gb.html'], ['Hardware', 'Mac mini M4', '/hardware/mac-mini-m4-16gb.html'], ['Compare', 'All local LLMs', '/llm-list.html'], ['App', 'Get LocalClaw', '/pricing.html']],
    sources: [['LM Studio local model catalogue', 'https://lmstudio.ai/models'], ['Qwen3.6-27B model page for larger comparison', 'https://huggingface.co/Qwen/Qwen3.6-27B']]
  },
  {
    id: 'best-local-llms-for-coding',
    title: 'Best local LLMs for coding',
    accent: 'coding',
    description: 'Local coding model picks for repository work, debugging, agents and private software engineering with LM Studio or a local runtime.',
    active: 'llm',
    cards: rankedModels(models, { ramGb: 64, platform: 'other', accelerator: 'cpu', useCase: 'coding', priority: 'quality', context: '16k' }, { filter: m => (m.tags || []).includes('code') }),
    metrics: [['Signal', 'Coding'], ['Also weighs', 'Reasoning'], ['Privacy', 'Local'], ['Workflow', 'Agents']],
    quick: 'For coding, prioritize coding score, reasoning score and runtime fit. A slightly smaller model that stays responsive is usually better than a larger model that starves memory.',
    links: [['Use case', 'Coding guide', '/use-case/coding.html'], ['Models', 'Qwen Coder family', '/llm-list.html'], ['Hardware', 'Computers for AI', '/computers.html'], ['App', 'Get LocalClaw', '/pricing.html']],
    sources: [['Qwen model releases', 'https://qwen.ai/blog'], ['LM Studio local model catalogue', 'https://lmstudio.ai/models']]
  },
  {
    id: 'best-local-tts-for-voice-cloning',
    title: 'Best local TTS for voice cloning',
    accent: 'voice cloning',
    description: 'A practical shortlist of local TTS and speech models for private voice cloning, expressive generation and offline voice pipelines.',
    active: 'tts',
    cards: ttsModels
      .filter(m => (m.features || []).includes('cloning') || /voice/i.test(m.bestFor || '') || /clone/i.test(m.description || ''))
      .sort((a, b) => ((b.quality || 0) * 2 + (b.speed || 0)) - ((a.quality || 0) * 2 + (a.speed || 0))),
    metrics: [['Category', 'TTS'], ['Priority', 'Quality'], ['Privacy', 'Offline'], ['Pipeline', 'Voice']],
    quick: 'For voice cloning, start with models that explicitly support cloning or expressive speaker control, then test pronunciation, consent requirements and license constraints before production use.',
    links: [['TTS', 'All speech models', '/tts-list.html'], ['Guide', 'Local TTS guide', '/blog/local-tts-guide-2026.html'], ['Model', 'MisoTTS', '/tts/miso-tts.html'], ['App', 'Get LocalClaw', '/pricing.html']],
    sources: [['MisoTTS GitHub repository', 'https://github.com/MisoLabsAI/MisoTTS'], ['WavTTS project page', 'https://wavtts.github.io/']]
  }
];

for (const guide of guideData) {
  fs.writeFileSync(path.join(out, `${guide.id}.html`), page({ ...guide, cardRenderer: guide.active === 'tts' ? ttsCard : modelCard }));
}
fs.writeFileSync(path.join(out, 'index.html'), indexPage(guideData));

normalizeDirectory(out);
console.log(`Generated ${guideData.length} retention guide pages.`);
