const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const TODAY = '2026-05-14';
const CACHE = '20260514d';

function loadAppData() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';this.APP_DATA=APP_DATA;', ctx);
  return ctx.APP_DATA;
}
function loadModelDetails() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/model-details.js'), 'utf8') + ';this.MODEL_DETAILS=MODEL_DETAILS;', ctx);
  return ctx.MODEL_DETAILS || {};
}
const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
const tracking = `
  <!-- TRACKING: DataFast Analytics -->
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <!-- Microsoft Clarity - session recordings & heatmaps (bounce diagnosis) -->
  <script src="/js/clarity.js" defer></script>`;
const fmt = n => n ? Number(n).toLocaleString('en-US') : 'Unknown';
function hardware(m) {
  if (m.min_ram <= 8) return 'entry-level laptops and desktops';
  if (m.min_ram <= 16) return 'mainstream Macs and PCs with 16 GB RAM';
  if (m.min_ram <= 32) return 'power-user machines with 32 GB RAM';
  if (m.min_ram <= 64) return 'high-end workstations with 64 GB RAM';
  if (m.min_ram <= 128) return 'large-memory workstations';
  return 'server-grade or multi-GPU systems';
}
function modelPage(m, d) {
  const url = `${BASE}/models/${encodeURIComponent(m.id)}.html`;
  const title = `${m.name} local AI model specs, RAM & LM Studio setup | LocalClaw`;
  const desc = `${m.name}: ${m.params} open-weight AI model. RAM requirement, quantization, benchmarks, use cases and LM Studio setup guidance for local inference.`.slice(0, 158);
  const tags = (m.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const strengths = (d.strengths || []).slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('') || `<li>${esc(m.description)}</li>`;
  const weaknesses = (d.weaknesses || []).slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('') || `<li>Performance depends heavily on quantization, RAM bandwidth and runtime support.</li>`;
  const uses = (d.use_cases || m.tags || []).slice(0, 8).map(x => `<li>${esc(x)}</li>`).join('');
  const similar = (d.similar_models || []).slice(0, 8).map(id => `<a href="/models/${esc(id)}.html">${esc(id)}</a>`).join('');
  const schema = {
    '@context':'https://schema.org', '@type':'SoftwareApplication', name:m.name, applicationCategory:'AIApplication', operatingSystem:'macOS, Windows, Linux', url,
    description: desc, softwareVersion: m.released || undefined, memoryRequirements: `${m.min_ram} GB RAM minimum`, license: d.license_url || d.license || undefined,
    creator: d.developer ? {'@type':'Organization', name:d.developer, url:d.developer_url} : undefined
  };
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(m.name)} local model specs | LocalClaw">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${BASE}/images/twitter-card.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(m.name)} local model specs | LocalClaw">
  <meta name="twitter:description" content="${esc(desc)}">
  <link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>${tracking}
  <style>
    :root{--bg:#050505;--surface:#0f0f11;--surface2:#18181b;--border:#27272a;--primary:#ff453a;--text:#fff;--muted:#a1a1aa;--green:#34d399;--blue:#60a5fa}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6}a{text-decoration:none}.wrap{max-width:1120px;margin:0 auto;padding:24px}.site-nav{border-bottom:1px solid rgba(255,255,255,.2);background:#000;position:sticky;top:0;z-index:50}.nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;height:80px;display:flex;align-items:center;justify-content:space-between;gap:24px}.logo{display:flex;align-items:center;gap:12px;color:#fff}.logo-box{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--primary),#ea580c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(255,69,58,.4)}.logo-box img{width:28px;height:28px;border-radius:6px}.logo-text{font-family:'Space Grotesk',Inter,sans-serif;font-size:24px;font-weight:800;letter-spacing:-.03em;text-transform:uppercase}.logo-text span{color:var(--primary)}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a,.nav-links button{background:none;border:0;color:var(--muted);font:500 14px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.04em;cursor:pointer}.nav-links a:hover,.nav-links button:hover{color:#fff}.nav-links .pricing{color:var(--primary)}.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--primary);color:var(--primary);padding:2px 8px;font:800 11px ui-monospace,monospace;text-transform:uppercase}.badge:before{content:'';width:6px;height:6px;background:var(--primary)}.beta{border-color:#60a5fa;color:#60a5fa}.beta:before{background:#60a5fa;border-radius:50%;animation:pulse 1.5s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.mobile-links{display:none;border-top:1px solid var(--border);padding:12px 24px;background:#0f0f11}.mobile-links a{display:block;color:#d4d4d8;padding:10px 0}.hamb{display:none;background:none;border:1px solid transparent;color:var(--muted);font-size:24px}.hero{padding:48px 0 28px;border-bottom:1px solid var(--border)}.eyebrow{color:var(--primary);font:700 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.title{font-size:clamp(38px,7vw,76px);line-height:.95;margin:16px 0;font-weight:900;letter-spacing:-.05em}.desc{max-width:800px;color:#d4d4d8;font-size:19px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0}.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px}.k{font:700 11px ui-monospace,monospace;color:var(--muted);text-transform:uppercase}.v{font-size:22px;font-weight:800;margin-top:4px}.section{padding:34px 0;border-bottom:1px solid var(--border)}h2{font-size:28px;margin:0 0 16px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}.tag{display:inline-block;border:1px solid #3f3f46;background:#18181b;border-radius:999px;padding:5px 10px;margin:4px;color:#d4d4d8;font-size:13px}.bench{height:9px;background:#27272a;border-radius:99px;overflow:hidden;margin-top:8px}.bar{height:100%;background:linear-gradient(90deg,var(--primary),#ff8a64)}.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.btn{display:inline-block;background:var(--primary);color:#000;font-weight:800;padding:12px 16px;border-radius:12px;text-decoration:none}.btn.secondary{background:#18181b;color:#fff;border:1px solid var(--border)}li{margin:8px 0;color:#d4d4d8}.muted{color:var(--muted)}code{background:#18181b;border:1px solid #27272a;padding:2px 6px;border-radius:6px}.similar a{display:inline-block;color:#fff;border:1px solid var(--border);border-radius:999px;padding:6px 10px;margin:4px;text-decoration:none}@media(max-width:900px){.nav-inner{height:64px}.nav-links{display:none}.hamb{display:block}.mobile-links.open{display:block}.grid,.cols{grid-template-columns:1fr}.hero{padding-top:28px}}
  </style>
</head>
<body>
  <nav class="site-nav" role="navigation" aria-label="Main navigation"><div class="nav-inner"><a href="/" class="logo"><span class="logo-box"><img src="/images/crab-logo.png" alt="LocalClaw logo" width="28" height="28"></span><span class="logo-text">Local<span>Claw</span></span></a><button class="hamb" onclick="document.getElementById('mobile-menu').classList.toggle('open')" aria-label="Open menu">☰</button><div class="nav-links"><a href="/">Home</a><a href="/llm-list.html">LLM</a><a href="/tts-list.html">TTS</a><a href="/computers.html">Computers</a><a href="/blog/">Blog</a><a href="/pricing.html" class="pricing">Pricing</a></div></div><div id="mobile-menu" class="mobile-links"><a href="/">Home</a><a href="/llm-list.html">LLM</a><a href="/tts-list.html">TTS</a><a href="/computers.html">Computers</a><a href="/blog/">Blog</a><a href="/pricing.html">Pricing</a></div></nav>
  <main class="wrap">
    <header class="hero">
      <div class="eyebrow">Local LLM model page</div>
      <h1 class="title">${esc(m.name)}</h1>
      <p class="desc">${esc(m.description)}</p>
      <div class="cta"><a class="btn" href="/">Find the best model for my hardware</a><a class="btn secondary" href="/llm-list.html">Browse all ${APP_DATA.models.length} LLMs</a></div>
    </header>
    <section class="grid" aria-label="Key specs">
      <div class="card"><div class="k">Parameters</div><div class="v">${esc(m.params)}</div></div>
      <div class="card"><div class="k">Minimum RAM</div><div class="v">${esc(m.min_ram)} GB</div></div>
      <div class="card"><div class="k">Model size</div><div class="v">${esc(m.size_gb)} GB</div></div>
      <div class="card"><div class="k">Quantization</div><div class="v">${esc(m.recommended_quant)}</div></div>
    </section>
    <section class="section">
      <h2>Can ${esc(m.name)} run locally?</h2>
      <p>${esc(m.name)} is best suited for ${esc(hardware(m))}. LocalClaw recommends <strong>${esc(m.recommended_quant)}</strong> as the default quantization, with at least <strong>${esc(m.min_ram)} GB RAM</strong>.</p>
      <p class="muted">Search term for LM Studio or compatible runtimes: <code>${esc(m.search_term)}</code></p>
      ${m.hf_repo ? `<p class="muted">Hugging Face repository: <code>${esc(m.hf_repo)}</code></p>` : ''}
      <div>${tags}</div>
    </section>
    <section class="section cols">
      <div><h2>Strengths</h2><ul>${strengths}</ul></div>
      <div><h2>Limitations</h2><ul>${weaknesses}</ul></div>
    </section>
    <section class="section cols">
      <div><h2>Best use cases</h2><ul>${uses}</ul></div>
      <div><h2>Benchmarks</h2>${['speed','quality','coding','reasoning'].map(k=>`<p><strong>${k[0].toUpperCase()+k.slice(1)}</strong>: ${m.benchmarks?.[k]||'?'}/10</p><div class="bench"><div class="bar" style="width:${(m.benchmarks?.[k]||0)*10}%"></div></div>`).join('')}</div>
    </section>
    <section class="section">
      <h2>Technical details</h2>
      <p><strong>Developer:</strong> ${esc(d.developer || m.family || 'Unknown')}</p>
      <p><strong>License:</strong> ${esc(d.license || 'See model repository')}</p>
      <p><strong>Context window:</strong> ${fmt(d.context_window)} tokens</p>
      <p><strong>Architecture:</strong> ${esc(d.architecture || 'See model card')}</p>
      <p><strong>Released:</strong> ${esc(m.released || 'Unknown')}</p>
      ${similar ? `<div class="similar"><h2>Similar models</h2>${similar}</div>` : ''}
    </section>
  </main>
</body>
</html>`;
}

const APP_DATA = loadAppData();
const MODEL_DETAILS = loadModelDetails();
const outDir = path.join(ROOT, 'models');
fs.rmSync(outDir, {recursive:true, force:true});
fs.mkdirSync(outDir, {recursive:true});
for (const m of APP_DATA.models) {
  fs.writeFileSync(path.join(outDir, `${slug(m.id)}.html`), modelPage(m, MODEL_DETAILS[m.id] || {}));
}

// Model directory index for crawlers and users
const cards = APP_DATA.models.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).map(m => `<li><a href="/models/${esc(m.id)}.html"><strong>${esc(m.name)}</strong></a> <span>${esc(m.params)} · ${esc(m.min_ram)} GB RAM · ${esc(m.recommended_quant)}</span></li>`).join('\n');
fs.writeFileSync(path.join(outDir, 'index.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>All Local AI Model Pages | LocalClaw</title><meta name="description" content="Index of all static LocalClaw model pages: local LLM specs, RAM requirements, quantization and LM Studio setup."><meta name="robots" content="index, follow"><link rel="canonical" href="${BASE}/models/">${tracking}<style>body{background:#050505;color:#fff;font-family:Inter,system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:32px;line-height:1.6}a{color:#ff453a}li{margin:10px 0;padding:12px;border:1px solid #27272a;border-radius:12px;list-style:none;background:#0f0f11}span{color:#a1a1aa}</style></head><body><p><a href="/">← LocalClaw</a></p><h1>All Local AI Model Pages</h1><p>Static, indexable pages for LocalClaw's local LLM catalogue.</p><ul>${cards}</ul></body></html>`);

console.log(`Generated ${APP_DATA.models.length} model records / ${new Set(APP_DATA.models.map(m=>m.id)).size} unique static model pages in models/`);
