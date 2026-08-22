const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { normalizeDirectory: normalizePublicUrls } = require('./normalize-public-urls');
const { siteNavigation, siteNavAssets } = require('./site-navigation');
const modelRanking = require('../js/model-ranking');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const UPDATED = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date());
const tracking = `<!-- TRACKING: DataFast Analytics --><script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script><!-- Microsoft Clarity - session recordings & heatmaps (bounce diagnosis) --><script src="/js/clarity.js" defer></script>${siteNavAssets()}`;

const lightStyle = `
:root{color-scheme:light;--bg:#faf9f6;--surface:#fff;--soft:#f7f5f1;--border:#d7dce4;--primary:#c92f28;--text:#111827;--muted:#64748b}
body{background:radial-gradient(circle at 18% 4%,rgba(201,47,40,.06),transparent 30rem),var(--bg);color:var(--text)}
.site-nav{border-color:var(--border);background:rgba(255,255,255,.94);backdrop-filter:blur(16px)}
.logo{color:var(--text)}.logo-box{box-shadow:0 8px 22px rgba(201,47,40,.18)}
.nav-links a{color:var(--muted)}.nav-links a:hover{color:var(--text)}.nav-links .pricing{color:var(--primary)}
.desc,.section-copy,.model p{color:#475569}
.btn{background:var(--primary);color:#fff}.btn:hover{background:#a92520}
.btn.secondary{background:#fff;color:var(--text);border-color:var(--border)}.btn.secondary:hover{border-color:#94a3b8}
.hero-media{border-color:#303640;background:#090909;box-shadow:0 24px 70px rgba(15,23,42,.16)}
.hero-media figcaption{color:#e2e8f0;border-color:#303640}
.card,.index-list a{background:var(--surface);border-color:var(--border);color:var(--text);box-shadow:0 10px 28px rgba(15,23,42,.04)}
.model:hover,.index-list a:hover{border-color:#94a3b8}
.model h3 a,.model-data strong{color:var(--text)!important}
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

function loadModels() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';this.APP_DATA=APP_DATA;', ctx);
  return Array.from(new Map(ctx.APP_DATA.models.map(model => [model.id, model])).values());
}

const esc = (s = '') => String(s).replace(/—/g, ',').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

const familyMedia = {
  'MacBook Air': { image: '/images/hardware/macbook-air-dark.jpg', alt: 'Silver MacBook Air displaying a dark local AI interface' },
  'MacBook Pro': { image: '/images/hardware/macbook-pro-dark.jpg', alt: 'MacBook Pro displaying a local AI workflow' },
  'Mac mini': { image: '/images/hardware/mac-mini-dark.jpg', alt: 'Silver Mac mini in a dark studio setting' },
  'Mac Studio': { image: '/images/hardware/mac-studio-dark.jpg', alt: 'Silver Mac Studio in a dark studio setting' }
};

const macs = [
  { id: 'macbook-air-m5-24gb', name: 'MacBook Air M5 24GB', family: 'MacBook Air', chip: 'M5', ram: 24, storage: '512GB SSD', badge: 'Portable Value', appleUrl: 'https://www.apple.com/macbook-air/', intent: 'portable everyday local AI' },
  { id: 'macbook-air-m5-32gb', name: 'MacBook Air M5 32GB', family: 'MacBook Air', chip: 'M5', ram: 32, storage: '1TB SSD', badge: 'Best AI Air', appleUrl: 'https://www.apple.com/macbook-air/', intent: 'larger local models in a silent laptop' },
  { id: 'macbook-pro-m5-32gb', name: 'MacBook Pro M5 32GB', family: 'MacBook Pro', chip: 'M5', ram: 32, storage: '1TB SSD', badge: 'Balanced Pro', appleUrl: 'https://www.apple.com/macbook-pro/', intent: 'sustained local inference on the go' },
  { id: 'macbook-pro-m5-pro-48gb', name: 'MacBook Pro M5 Pro 48GB', family: 'MacBook Pro', chip: 'M5 Pro', ram: 48, storage: '1TB SSD', badge: 'Portable Sweet Spot', appleUrl: 'https://www.apple.com/macbook-pro/', intent: 'serious local coding and reasoning workloads' },
  { id: 'macbook-pro-m5-max-128gb', name: 'MacBook Pro M5 Max 128GB', family: 'MacBook Pro', chip: 'M5 Max', ram: 128, storage: '2TB SSD', badge: 'Maximum Portable', appleUrl: 'https://www.apple.com/macbook-pro/', intent: 'large local models in a portable workstation' },
  { id: 'macbook-air-m2-8gb', name: 'MacBook Air M2 8GB', family: 'MacBook Air', chip: 'M2', ram: 8, storage: '256GB SSD', badge: 'Entry Mac', appleUrl: 'https://www.apple.com/macbook-air/', intent: 'entry-level local AI experiments' },
  { id: 'macbook-air-m3-8gb', name: 'MacBook Air M3 8GB', family: 'MacBook Air', chip: 'M3', ram: 8, storage: '256GB SSD', badge: 'Portable Starter', appleUrl: 'https://www.apple.com/macbook-air/', intent: 'portable local LLM experiments' },
  { id: 'macbook-air-m3-16gb', name: 'MacBook Air M3 16GB', family: 'MacBook Air', chip: 'M3', ram: 16, storage: '512GB SSD', badge: 'Portable Sweet Spot', appleUrl: 'https://www.apple.com/macbook-air/', intent: 'mainstream local AI on a silent laptop' },
  { id: 'macbook-air-m4-16gb', name: 'MacBook Air M4 16GB', family: 'MacBook Air', chip: 'M4', ram: 16, storage: '256GB SSD', badge: 'Everyday Air', appleUrl: 'https://www.apple.com/macbook-air/', intent: 'everyday local LLM use' },
  { id: 'macbook-pro-m4-16gb', name: 'MacBook Pro M4 16GB', family: 'MacBook Pro', chip: 'M4', ram: 16, storage: '512GB SSD', badge: 'Balanced Pro', appleUrl: 'https://www.apple.com/macbook-pro/', intent: 'quiet sustained local inference' },
  { id: 'macbook-pro-m4-pro-24gb', name: 'MacBook Pro M4 Pro 24GB', family: 'MacBook Pro', chip: 'M4 Pro', ram: 24, storage: '512GB SSD', badge: 'Creator Sweet Spot', appleUrl: 'https://www.apple.com/macbook-pro/', intent: 'coding and reasoning models on the go' },
  { id: 'macbook-pro-m4-max-36gb', name: 'MacBook Pro M4 Max 36GB', family: 'MacBook Pro', chip: 'M4 Max', ram: 36, storage: '1TB SSD', badge: 'Mobile Workstation', appleUrl: 'https://www.apple.com/macbook-pro/', intent: 'larger local coding and reasoning models' },
  { id: 'mac-mini-m4-16gb', name: 'Mac mini M4 16GB', family: 'Mac mini', chip: 'M4', ram: 16, storage: '256GB SSD', badge: 'Best Starter Mac', amazonQuery: 'Apple Mac mini M4 16GB 256GB', intent: 'best-value local AI desktop' },
  { id: 'mac-mini-m4-pro-24gb', name: 'Mac mini M4 Pro 24GB', family: 'Mac mini', chip: 'M4 Pro', ram: 24, storage: '512GB SSD', badge: 'Desktop Sweet Spot', amazonQuery: 'Apple Mac mini M4 Pro 24GB 512GB', intent: 'compact local AI workstation' },
  { id: 'mac-mini-m4-pro-48gb', name: 'Mac mini M4 Pro 48GB', family: 'Mac mini', chip: 'M4 Pro', ram: 48, storage: '512GB SSD', badge: 'Power User', amazonQuery: 'Apple Mac mini M4 Pro 48GB 512GB', intent: 'serious local LLM desktop' },
  { id: 'mac-studio-m4-max-64gb', name: 'Mac Studio M4 Max 64GB', family: 'Mac Studio', chip: 'M4 Max', ram: 64, storage: '1TB SSD', badge: 'Workstation', appleUrl: 'https://www.apple.com/mac-studio/', intent: 'high-end local LLM workstation' },
  { id: 'mac-studio-m4-max-128gb', name: 'Mac Studio M4 Max 128GB', family: 'Mac Studio', chip: 'M4 Max', ram: 128, storage: '2TB SSD', badge: 'Max Power', appleUrl: 'https://www.apple.com/mac-studio/', intent: 'large local models without datacenter hardware' },
  { id: 'mac-studio-m3-ultra-128gb', name: 'Mac Studio M3 Ultra 128GB', family: 'Mac Studio', chip: 'M3 Ultra', ram: 128, storage: '1TB SSD', badge: 'Large-Model Mac', appleUrl: 'https://www.apple.com/mac-studio/', intent: 'large model local inference' },
  { id: 'mac-studio-m3-ultra-256gb', name: 'Mac Studio M3 Ultra 256GB', family: 'Mac Studio', chip: 'M3 Ultra', ram: 256, storage: '2TB SSD', badge: 'Frontier Workstation', appleUrl: 'https://www.apple.com/mac-studio/', intent: 'frontier open-weight model experiments' },
  { id: 'mac-studio-m3-ultra-512gb', name: 'Mac Studio M3 Ultra 512GB', family: 'Mac Studio', chip: 'M3 Ultra', ram: 512, storage: '4TB SSD', badge: 'Maximum Memory', appleUrl: 'https://www.apple.com/mac-studio/', intent: 'server-scale local AI on Apple silicon' }
];

function compatible(models, mac) {
  return modelRanking.rankModels({
    ramGb: mac.ram,
    platform: 'mac',
    accelerator: 'apple-silicon',
    useCase: 'general',
    priority: 'balanced',
    context: '8k'
  }, {}, models, { includeTight: true }).allCompatible;
}

function fit(mac, model) {
  return model.compatibilityLabel || modelRanking.tierLabel('limited', modelRanking.calculateHardwareFit({ ramGb: mac.ram, platform: 'mac', accelerator: 'apple-silicon' }, model).fitState);
}

function buy(mac) {
  const query = mac.amazonQuery || `Apple ${mac.name} ${mac.storage}`;
  return `/go/amazon?q=${encodeURIComponent(query)}`;
}

function ramGuide(mac) {
  return mac.ram >= 128 ? 128 : mac.ram >= 64 ? 64 : mac.ram >= 32 ? 32 : mac.ram >= 16 ? 16 : 8;
}

const style = `:root{--bg:#050505;--surface:#0f0f11;--border:#29292d;--primary:#ff453a;--text:#fff;--muted:#a1a1aa}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6}a{text-decoration:none}.site-nav{border-bottom:1px solid rgba(255,255,255,.2);background:#000;position:sticky;top:0;z-index:50}.nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;height:80px;display:flex;align-items:center;justify-content:space-between;gap:24px}.logo{display:flex;align-items:center;gap:12px;color:#fff}.logo-box{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--primary),#ea580c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(255,69,58,.4)}.logo-box img{width:28px;height:28px;border-radius:6px}.logo-text{font-family:'Space Grotesk',Inter,sans-serif;font-size:24px;font-weight:800;letter-spacing:-.03em;text-transform:uppercase}.logo-text span{color:var(--primary)}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{color:var(--muted);font:500 14px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.04em}.nav-links a:hover,.nav-links .pricing{color:#fff}.nav-links .pricing{color:var(--primary)}.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--primary);color:var(--primary);padding:2px 8px;font:800 11px ui-monospace,monospace;text-transform:uppercase}.badge:before{content:'';width:6px;height:6px;background:var(--primary)}.beta{border-color:#60a5fa;color:#60a5fa}.beta:before{background:#60a5fa;border-radius:50%}.wrap{max-width:1180px;margin:0 auto;padding:0 24px 40px}.hero{display:grid;grid-template-columns:minmax(0,1.03fr) minmax(380px,.97fr);gap:46px;align-items:center;padding:64px 0 42px;border-bottom:1px solid var(--border)}.title{font-size:clamp(42px,5.7vw,72px);line-height:.98;margin:0 0 20px;font-weight:950;letter-spacing:-.055em}.desc{max-width:720px;color:#d4d4d8;font-size:19px;line-height:1.65;margin:0}.updated{color:var(--muted);font:700 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.09em;margin:18px 0 0}.cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;background:var(--primary);color:#050505;font-weight:900;padding:11px 16px;border-radius:12px;transition:transform .18s ease,background .18s ease}.btn:hover{transform:translateY(-2px);background:#ff6259}.btn.secondary{background:#171719;color:#fff;border:1px solid #343438}.btn.secondary:hover{border-color:#57575e}.hero-media{margin:0;border:1px solid var(--border);border-radius:18px;overflow:hidden;background:#090909;box-shadow:0 24px 70px rgba(0,0,0,.42)}.hero-media img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.hero-media figcaption{padding:10px 14px;color:var(--muted);font:700 10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.07em;border-top:1px solid var(--border)}.stats{display:grid;grid-template-columns:repeat(4,1fr);margin:0;border-bottom:1px solid var(--border)}.stat{padding:24px 20px 22px;border-right:1px solid var(--border)}.stat:first-child{padding-left:0}.stat:last-child{border-right:0}.k{font:800 10px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.09em}.v{font-size:23px;font-weight:900;line-height:1.2;margin-top:5px}.section{padding:38px 0;border-bottom:1px solid var(--border)}h2{font-size:30px;line-height:1.15;margin:0 0 16px;letter-spacing:-.025em}.section-copy{max-width:920px;color:#d4d4d8;font-size:17px}.meta{color:var(--muted);font:600 12px ui-monospace,monospace}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{background:var(--surface);border:1px solid var(--border);border-radius:15px;padding:19px}.model{display:flex;flex-direction:column;min-height:255px;gap:10px;transition:border-color .18s ease,transform .18s ease}.model:hover{border-color:#4a4a50;transform:translateY(-2px)}.model h3{margin:0;font-size:20px;line-height:1.2}.model h3 a{color:#fff}.model p{margin:0;color:#c8c8ce;font-size:14px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.rank{display:flex;justify-content:space-between;align-items:center;gap:12px;color:var(--primary);font:900 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.04em}.model-data{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;margin-top:auto;padding-top:10px;border-top:1px solid var(--border)}.model-data span{font:650 11px ui-monospace,monospace;color:var(--muted)}.model-data strong{display:block;color:#fff;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.model-link{color:var(--primary);font-weight:850;font-size:13px}.method{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:28px;align-items:center}.index-list{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.index-list a{display:grid;grid-template-columns:150px 1fr;align-items:center;gap:16px;color:#fff;border:1px solid var(--border);border-radius:15px;padding:10px;background:var(--surface);transition:border-color .18s ease,transform .18s ease}.index-list a:hover{border-color:#4a4a50;transform:translateY(-2px)}.index-list img{width:150px;aspect-ratio:16/9;object-fit:cover;border-radius:10px}.index-list strong{font-size:17px}@media(max-width:960px){.hero{grid-template-columns:1fr;padding-top:46px;gap:28px}.hero-media{max-width:720px}.stats{grid-template-columns:1fr 1fr}.stat{border-bottom:1px solid var(--border)}.stat:nth-child(2){border-right:0}.stat:nth-child(3){padding-left:0}.grid{grid-template-columns:1fr 1fr}.method{grid-template-columns:1fr}.index-list{grid-template-columns:1fr}}@media(max-width:640px){.nav-links{display:none}.nav-inner{height:64px}.wrap{padding:0 18px 32px}.hero{padding:38px 0 28px}.title{font-size:clamp(38px,12vw,52px)}.desc{font-size:17px}.hero-media{border-radius:14px}.cta{display:grid}.btn{width:100%}.stats,.grid{grid-template-columns:1fr}.stat,.stat:first-child,.stat:nth-child(3){padding:18px 0;border-right:0}.model{min-height:0}.index-list a{grid-template-columns:108px 1fr}.index-list img{width:108px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.model,.index-list a{transition:none}}`;

function nav() {
  return siteNavigation('computers');
}

function modelCard(mac, model, index) {
  return `<article class="card model"><div class="rank"><span>#${index + 1}</span><span>${esc(fit(mac, model))}</span></div><h3><a href="/models/${esc(model.id)}">${esc(model.name)}</a></h3><p>${esc(model.description)}</p><div class="model-data"><span>Parameters<strong>${esc(model.params)}</strong></span><span>Minimum RAM<strong>${esc(model.min_ram)}GB</strong></span><span>Quantization<strong>${esc(model.recommended_quant)}</strong></span><span>Model size<strong>${esc(model.size_gb)}GB</strong></span></div><a class="model-link" href="/models/${esc(model.id)}">View model details →</a></article>`;
}

function page(mac, models) {
  const list = compatible(models, mac);
  const top = list.slice(0, 9);
  const best = top[0];
  const media = familyMedia[mac.family];
  const guide = ramGuide(mac);
  const url = `${BASE}/hardware/${mac.id}`;
  const title = `Best local LLMs for ${mac.name} | LocalClaw`;
  const desc = `Current local AI models for ${mac.name}: realistic RAM fit, quantization, model size and LM Studio guidance.`;
  const schema = { '@context': 'https://schema.org', '@type': 'TechArticle', headline: title, url, description: desc, dateModified: '2026-08-18', image: `${BASE}${media.image}`, about: [mac.name, 'local LLM', 'Apple silicon'] };
  const isAmazon = true;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${BASE}${media.image}"><link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}<style>${style}</style></head><body>${nav()}<main class="wrap"><header class="hero"><div><h1 class="title">Best local LLMs for ${esc(mac.name)}</h1><p class="desc">${esc(mac.name)} has <strong>${mac.ram}GB of unified memory</strong> and is suited to ${esc(mac.intent)}. These recommendations are generated from the current LocalClaw catalogue and filtered for realistic memory headroom.</p><p class="updated">Recommendations updated ${UPDATED}</p><div class="cta"><a class="btn" href="${esc(buy(mac))}" target="_blank" rel="sponsored nofollow noopener" data-fast-goal="${isAmazon ? 'amazon_click' : 'hardware_store_click'}" data-fast-goal-source="hardware_guide" data-fast-goal-product="${esc(mac.id)}">${isAmazon ? 'View current offers' : 'View at Apple'}</a><a class="btn secondary" href="/?from=hardware_guide&amp;machine=${esc(mac.id)}#model-finder" data-fast-goal="hardware_finder_click" data-fast-goal-source="hardware_${esc(mac.id)}" data-fast-goal-target="model_finder">Find models for this Mac</a><a class="btn secondary" href="/ram/${guide}gb" data-fast-goal="guide_open" data-fast-goal-source="hardware_${esc(mac.id)}" data-fast-goal-target="ram_${guide}gb">See ${guide}GB RAM guide</a></div></div><figure class="hero-media"><img src="${media.image}" alt="${esc(media.alt)}" width="1600" height="900" loading="eager" fetchpriority="high"><figcaption>${esc(mac.family)} · ${esc(mac.chip)} · ${mac.ram}GB unified memory</figcaption></figure></header><section class="stats" aria-label="Hardware and model summary"><div class="stat"><div class="k">Chip</div><div class="v">${esc(mac.chip)}</div></div><div class="stat"><div class="k">Unified memory</div><div class="v">${mac.ram}GB</div></div><div class="stat"><div class="k">Compatible catalogue models</div><div class="v">${list.length}</div></div><div class="stat"><div class="k">Best match</div><div class="v" style="font-size:18px">${esc(best?.name || 'N/A')}</div></div></section><section class="section"><h2>Quick answer</h2><p class="section-copy">Start with <strong>${esc(best?.name || 'a model under the RAM limit')}</strong> on this Mac. A comfortable or good fit leaves useful memory for macOS and your local runtime. A tight fit can still work, but close other apps, reduce context length when needed, and prefer the listed quantization.</p><p class="meta">${esc(mac.family)} · ${esc(mac.chip)} · ${mac.ram}GB unified memory · ${esc(mac.storage)} · ${esc(mac.badge)}</p></section><section class="section" id="rankings"><h2>Top compatible local LLMs</h2><div class="grid">${top.map((model, index) => modelCard(mac, model, index)).join('')}</div></section><section class="section method"><div><h2>How this order works</h2><p class="section-copy">The shared LocalClaw engine first rejects hosted-only, excluded and oversized records. It reserves system and 8k-context headroom, labels comfortable, good and tight fits, then ranks the remaining models by hardware fit, use case, catalogue capability ratings, runtime and freshness. Community stars are never included. This is practical guidance, not a standardized hardware benchmark.</p></div><a class="btn secondary" href="/models">Browse the full model index</a></section><section class="section"><h2>Buying note</h2><p class="section-copy">This guide is about local AI fit, not live pricing. Prices and availability change. An Amazon link may be an affiliate link that supports LocalClaw at no extra cost.</p></section></main></body></html>`;
}

function redirectPage(to, label) {
  const target = `${BASE}/hardware/${to}`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=${target}"><meta name="robots" content="noindex, follow"><link rel="canonical" href="${target}"><title>${esc(label)} moved | LocalClaw</title></head><body><p>${esc(label)} moved to <a href="${target}">${target}</a>.</p></body></html>`;
}

const legacyRedirects = [
  { from: 'mac-studio-m4-ultra-128gb', to: 'mac-studio-m3-ultra-128gb', label: 'Mac Studio M4 Ultra 128GB' },
  { from: 'mac-studio-m4-ultra-256gb', to: 'mac-studio-m3-ultra-256gb', label: 'Mac Studio M4 Ultra 256GB' },
  { from: 'mac-studio-m4-ultra-512gb', to: 'mac-studio-m3-ultra-512gb', label: 'Mac Studio M4 Ultra 512GB' }
];

const models = loadModels();
const out = path.join(ROOT, 'hardware');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const mac of macs) fs.writeFileSync(path.join(out, `${mac.id}.html`), page(mac, models));
for (const item of legacyRedirects) fs.writeFileSync(path.join(out, `${item.from}.html`), redirectPage(item.to, item.label));

const groups = ['MacBook Air', 'MacBook Pro', 'Mac mini', 'Mac Studio'];
const guideLinks = groups.map(group => `<section class="section"><h2>${esc(group)}</h2><div class="index-list">${macs.filter(mac => mac.family === group).map(mac => { const media = familyMedia[mac.family]; return `<a href="/hardware/${mac.id}"><img src="${media.image}" alt="" width="150" height="84" loading="lazy"><span><strong>${esc(mac.name)}</strong><br><span class="meta">${esc(mac.chip)} · ${mac.ram}GB · ${esc(mac.badge)}</span></span></a>`; }).join('')}</div></section>`).join('');
fs.writeFileSync(path.join(out, 'index.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Mac hardware guides for local AI | LocalClaw</title><meta name="description" content="Current Mac hardware guides for local AI, with realistic RAM fit and compatible local LLM picks."><meta name="robots" content="index, follow"><link rel="canonical" href="${BASE}/hardware/">${tracking}<style>${style}</style></head><body>${nav()}<main class="wrap"><header class="hero" style="grid-template-columns:1fr;padding-bottom:36px"><div><h1 class="title">Mac hardware guides for local AI</h1><p class="desc">Choose a Mac and see current local LLM recommendations filtered for its unified memory.</p><p class="updated">All recommendations updated ${UPDATED}</p></div></header>${guideLinks}</main></body></html>`);

// Intrinsic HTML dimensions reserve layout space. The explicit CSS height
// keeps the responsive image ratio from inheriting that desktop pixel height.
for (const file of fs.readdirSync(out).filter(file => file.endsWith('.html'))) {
  const filePath = path.join(out, file);
  const html = fs.readFileSync(filePath, 'utf8')
    .replace('.hero-media img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}', '.hero-media img{display:block;width:100%;height:auto;object-fit:cover}')
    .replace(' and is suited to ', ' and is a strong fit for ')
    .replace('not a standardized hardware benchmark', 'not a standardized third-party benchmark')
    .replace(/View current offers|View at Apple/g, 'View on Amazon');
  fs.writeFileSync(filePath, html);
}

normalizeDirectory(out);
console.log(`Generated ${macs.length} Mac hardware pages and ${legacyRedirects.length} legacy redirects from ${models.length} catalogue records.`);
