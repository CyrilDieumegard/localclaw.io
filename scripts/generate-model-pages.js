const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';

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

const esc = (s = '') => String(s).replace(/[&<>'"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[c]));

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
const fmt = n => n ? Number(n).toLocaleString('en-US') : 'Unknown';
const pct = n => Math.max(0, Math.min(100, (Number(n) || 0) * 10));

const tracking = `
  <!-- TRACKING: DataFast Analytics -->
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <!-- Microsoft Clarity - session recordings & heatmaps (bounce diagnosis) -->
  <script src="/js/clarity.js" defer></script>`;

const familyColors = {
  qwen: '#a855f7',
  llama: '#3b82f6',
  gemma: '#f59e0b',
  deepseek: '#22c55e',
  'deepseek-v3': '#22c55e',
  mistral: '#ff453a',
  phi: '#22d3ee',
  glm: '#ec4899',
  granite: '#94a3b8',
  cohere: '#fb923c',
  nemotron: '#94a3b8',
  llava: '#2dd4bf',
  'qwen-coder': '#a855f7',
  kimi: '#9ca3af',
  hermes: '#fb7185',
  exaone: '#a3e635',
  lfm: '#38bdf8'
};

function familyColor(m) {
  return familyColors[m.family] || '#ff453a';
}

function averageBenchmark(m) {
  const b = m.benchmarks || {};
  const values = ['speed', 'quality', 'coding', 'reasoning'].map(k => Number(b[k]) || 0).filter(Boolean);
  return values.length ? values.reduce((a, n) => a + n, 0) / values.length : 0;
}

function localFitScore(m) {
  if (m.hosted_only) return null;
  const base = averageBenchmark(m);
  const ramPenalty = m.min_ram > 256 ? 2.3 : m.min_ram > 128 ? 1.8 : m.min_ram > 64 ? 1.1 : m.min_ram > 32 ? 0.6 : m.min_ram > 16 ? 0.25 : 0;
  return Math.max(3.2, Math.min(9.8, base - ramPenalty)).toFixed(1);
}

function hardwareTier(m) {
  if (m.hosted_only) return 'API only';
  if (m.min_ram <= 8) return 'Laptop ready';
  if (m.min_ram <= 16) return '16 GB sweet spot';
  if (m.min_ram <= 32) return '32 GB power user';
  if (m.min_ram <= 64) return '64 GB workstation';
  if (m.min_ram <= 128) return 'Large-memory workstation';
  return 'Server-grade';
}

function hardwareSentence(m) {
  if (m.hosted_only) return `${esc(m.name)} is listed for comparison, but it is a hosted/API model rather than a downloadable local release.`;
  if (m.min_ram <= 8) return `${esc(m.name)} is a good fit for normal laptops and compact desktops with 8 GB RAM or more.`;
  if (m.min_ram <= 16) return `${esc(m.name)} is a practical pick for 16 GB machines, especially with ${esc(m.recommended_quant)} quantization.`;
  if (m.min_ram <= 32) return `${esc(m.name)} belongs on 32 GB machines when you want stronger quality without jumping to server hardware.`;
  if (m.min_ram <= 64) return `${esc(m.name)} is best for 64 GB workstations and larger Apple Silicon or NVIDIA setups.`;
  if (m.min_ram <= 128) return `${esc(m.name)} needs a serious workstation with large unified memory or high VRAM.`;
  return `${esc(m.name)} is server-grade locally. Keep it for comparison unless you have very large unified memory, multiple GPUs or remote inference.`;
}

function ramGuide(m) {
  if (m.hosted_only) return '/llm-list.html';
  if (m.min_ram <= 8) return '/ram/8gb.html';
  if (m.min_ram <= 16) return '/ram/16gb.html';
  if (m.min_ram <= 32) return '/ram/32gb.html';
  if (m.min_ram <= 64) return '/ram/64gb.html';
  return '/ram/128gb.html';
}

function hardwareMatches(m) {
  if (m.hosted_only) {
    return [
      ['Compare local alternatives', '/llm-list.html', 'Hosted/API reference'],
      ['Find a local machine', '/computers.html', 'Apple + NVIDIA options'],
      ['Use LocalClaw', '/pricing.html', 'Native OpenClaw dashboard']
    ];
  }
  if (m.min_ram <= 8) {
    return [
      ['MacBook Air 8GB', '/hardware/macbook-air-m3-8gb.html', 'Entry laptop fit'],
      ['Mac mini M4 16GB', '/hardware/mac-mini-m4-16gb.html', 'More headroom'],
      ['8GB RAM guide', '/ram/8gb.html', 'All compatible picks']
    ];
  }
  if (m.min_ram <= 16) {
    return [
      ['Mac mini M4 16GB', '/hardware/mac-mini-m4-16gb.html', 'Starter desktop'],
      ['MacBook Air M4 16GB', '/hardware/macbook-air-m4-16gb.html', 'Portable fit'],
      ['16GB RAM guide', '/ram/16gb.html', 'Best 16GB models']
    ];
  }
  if (m.min_ram <= 32) {
    return [
      ['Mac mini M4 Pro 48GB', '/hardware/mac-mini-m4-pro-48gb.html', 'Comfortable headroom'],
      ['MacBook Pro M4 Max 36GB', '/hardware/macbook-pro-m4-max-36gb.html', 'Mobile workstation'],
      ['32GB RAM guide', '/ram/32gb.html', 'Power-user picks']
    ];
  }
  if (m.min_ram <= 64) {
    return [
      ['Mac Studio M4 Max 64GB', '/hardware/mac-studio-m4-max-64gb.html', 'Workstation fit'],
      ['NVIDIA GB10 / DGX Spark', '/computers.html', 'CUDA workstation class'],
      ['64GB RAM guide', '/ram/64gb.html', 'Large local models']
    ];
  }
  if (m.min_ram <= 128) {
    return [
      ['Mac Studio M4 Max 128GB', '/hardware/mac-studio-m4-max-128gb.html', 'Large unified memory'],
      ['NVIDIA GB10 / DGX Spark', '/computers.html', '128GB AI PC class'],
      ['128GB RAM guide', '/ram/128gb.html', 'High-memory picks']
    ];
  }
  return [
    ['Mac Studio Ultra class', '/hardware/mac-studio-m3-ultra-256gb.html', 'Very large memory'],
    ['NVIDIA GB10 / server options', '/computers.html', 'Check model size first'],
    ['Compare smaller models', '/llm-list.html', 'More practical alternatives']
  ];
}

function primaryUse(m, d) {
  const uses = d.use_cases || [];
  if (uses.length) return uses[0];
  const tags = m.tags || [];
  if (tags.includes('code')) return 'Coding assistant';
  if (tags.includes('reasoning')) return 'Reasoning';
  if (tags.includes('vision')) return 'Vision tasks';
  if (tags.includes('speed')) return 'Fast chat';
  return 'General local assistant';
}

function modelType(m) {
  if (m.hosted_only) return 'Hosted/API reference';
  if ((m.params || '').toLowerCase().includes('moe')) return 'Open-weight MoE';
  return 'Open-weight local LLM';
}

function lmStudioLine(m) {
  if (m.hosted_only) return 'No local LM Studio install is available for this model today.';
  return `Search for <code>${esc(m.search_term)}</code> in LM Studio or another GGUF-compatible runtime.`;
}

function similarLinks(ids, allModels) {
  return (ids || []).map(id => {
    const model = allModels.find(m => m.id === id);
    if (!model) return '';
    const name = model ? model.name : id;
    const params = model ? ` <span>${esc(model.params)}</span>` : '';
    return `<a href="/models/${esc(id)}.html">${esc(name)}${params}</a>`;
  }).filter(Boolean).slice(0, 8).join('');
}

function list(items, fallback) {
  const values = (items || []).slice(0, 6);
  if (!values.length) return `<li>${fallback}</li>`;
  return values.map(x => `<li>${esc(x)}</li>`).join('');
}

function tagsMarkup(m) {
  return (m.tags || []).slice(0, 8).map(t => `<span class="tag">${esc(t)}</span>`).join('');
}

function modelPage(m, d, allModels) {
  const url = `${BASE}/models/${encodeURIComponent(m.id)}.html`;
  const title = m.hosted_only
    ? `${m.name} API model specs, benchmarks and availability | LocalClaw`
    : `${m.name} local AI model: RAM, quantization and LM Studio setup | LocalClaw`;
  const desc = m.hosted_only
    ? `${m.name}: hosted/API LLM. Specs, benchmarks, use cases and current availability notes for local AI comparison.`.slice(0, 158)
    : `${m.name}: ${m.params} local AI model guide with RAM requirements, ${m.recommended_quant} quantization, benchmarks, use cases and LM Studio setup.`.slice(0, 158);
  const color = familyColor(m);
  const score = localFitScore(m);
  const strengths = list(d.strengths, esc(m.description));
  const weaknesses = list(d.weaknesses, 'Performance depends on quantization, RAM bandwidth and runtime support.');
  const uses = list(d.use_cases || m.tags, 'General local AI assistant.');
  const similar = similarLinks(d.similar_models, allModels);
  const tags = tagsMarkup(m);
  const ramLabel = m.hosted_only ? 'API only' : `${esc(m.min_ram)} GB`;
  const sizeLabel = m.hosted_only ? 'Hosted' : `${esc(m.size_gb)} GB`;
  const sourceLine = m.source_url
    ? `<a href="${esc(m.source_url)}" target="_blank" rel="noopener">Model source</a>`
    : '';
  const hfLine = m.hf_repo ? `<code>${esc(m.hf_repo)}</code>` : '';
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: m.name,
        applicationCategory: 'AIApplication',
        operatingSystem: 'macOS, Windows, Linux',
        url,
        description: desc,
        softwareVersion: m.released || undefined,
        memoryRequirements: m.hosted_only ? 'Hosted API only' : `${m.min_ram} GB RAM minimum`,
        license: d.license_url || d.license || undefined,
        creator: d.developer ? {'@type': 'Organization', name: d.developer, url: d.developer_url} : undefined
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Can ${m.name} run locally?`,
            acceptedAnswer: {'@type': 'Answer', text: m.hosted_only ? `${m.name} is hosted/API only in the LocalClaw database.` : `${m.name} can run locally with at least ${m.min_ram} GB RAM. LocalClaw recommends ${m.recommended_quant} quantization.`}
          },
          {
            '@type': 'Question',
            name: `What is ${m.name} best for?`,
            acceptedAnswer: {'@type': 'Answer', text: `${m.name} is best used for ${primaryUse(m, d)}.`}
          }
        ]
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: 'Home', item: BASE},
          {'@type': 'ListItem', position: 2, name: 'LLM', item: `${BASE}/llm-list.html`},
          {'@type': 'ListItem', position: 3, name: m.name, item: url}
        ]
      }
    ]
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
  <meta property="og:title" content="${esc(m.name)} ${m.hosted_only ? 'API model' : 'local AI model'} | LocalClaw">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(m.name)} ${m.hosted_only ? 'API model' : 'local AI model'} | LocalClaw">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}
  <style>
    :root{--bg:#050505;--panel:#0d0d0d;--card:#111;--card2:#171717;--border:#262626;--border2:#3a3a3a;--primary:#ff453a;--orange:#ea580c;--text:#fff;--muted:#a1a1aa;--soft:#d4d4d8;--green:#22c55e;--blue:#3b82f6}*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 18% 10%,rgba(255,69,58,.12),transparent 26rem),linear-gradient(180deg,#050505,#070707 42%,#050505);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.55}body:before{content:"";position:fixed;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:80px 80px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 85%)}a{text-decoration:none}.site-nav{border-bottom:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.82);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}.nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;height:80px;display:flex;align-items:center;justify-content:space-between;gap:24px}.logo{display:flex;align-items:center;gap:12px;color:#fff}.logo-box{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--primary),var(--orange));display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(255,69,58,.45)}.logo-box img{width:28px;height:28px;border-radius:6px}.logo-text{font-family:'Space Grotesk',Inter,sans-serif;font-size:25px;font-weight:900;letter-spacing:-.04em;text-transform:uppercase}.logo-text span{color:var(--primary)}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{color:var(--muted);font:700 14px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.nav-links a:hover,.nav-links .active{color:#fff}.nav-links .pricing{color:var(--primary)}.mobile-links{display:none;border-top:1px solid var(--border);padding:12px 24px;background:#0f0f11}.mobile-links a{display:block;color:#d4d4d8;padding:10px 0}.hamb{display:none;background:none;border:1px solid transparent;color:var(--muted);font-size:24px}.wrap{max-width:1180px;margin:0 auto;padding:34px 24px 64px}.breadcrumb{display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:var(--muted);font:700 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:22px}.breadcrumb a{color:#d4d4d8}.breadcrumb a:hover{color:#fff}.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:24px;align-items:stretch;margin-bottom:24px}.hero-copy,.hero-panel,.section,.spec-card,.model-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border:1px solid var(--border);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.38)}.hero-copy{padding:34px;position:relative;overflow:hidden}.hero-copy:before{content:"";position:absolute;inset:-1px;background:radial-gradient(circle at 0 0,rgba(255,69,58,.22),transparent 42%);pointer-events:none}.eyebrow{position:relative;color:var(--primary);font:900 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.18em;display:flex;gap:10px;align-items:center}.eyebrow:before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 14px currentColor}.title{position:relative;font-size:clamp(44px,7vw,86px);line-height:.92;margin:18px 0 16px;font-weight:950;letter-spacing:-.055em}.title span{color:var(--primary)}.desc{position:relative;max-width:760px;color:#d6d6dd;font-size:19px;margin:0}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.chip{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);border-radius:999px;color:#d7d7dd;padding:7px 11px;font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}.chip.hot{border-color:rgba(255,69,58,.45);color:var(--primary);background:rgba(255,69,58,.09)}.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid rgba(255,69,58,.5);background:var(--primary);color:#050505;font:950 13px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.05em;padding:14px 18px;border-radius:12px;box-shadow:6px 6px 0 rgba(154,25,18,.5)}.btn:hover{transform:translateY(-1px);filter:brightness(1.06)}.btn.secondary{background:#111;color:#fff;border-color:rgba(255,255,255,.18);box-shadow:none}.hero-panel{padding:22px;display:flex;flex-direction:column;gap:16px}.score-card{flex:1;display:flex;flex-direction:column;justify-content:space-between;border:1px solid ${color}66;border-radius:20px;padding:22px;background:radial-gradient(circle at 0 0,${color}26,transparent 45%),#0b0b0b}.score-label{font:900 12px ui-monospace,monospace;color:#b8b8c1;text-transform:uppercase;letter-spacing:.12em}.score{font-size:58px;line-height:1;font-weight:950;letter-spacing:-.05em}.score small{font-size:16px;color:var(--muted);letter-spacing:0}.score-caption{color:#d4d4d8;margin-top:10px}.panel-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mini{border:1px solid var(--border);background:#101010;border-radius:16px;padding:14px}.mini .k{font:800 10px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.mini .v{font-weight:900;font-size:18px;margin-top:4px}.specs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.spec-card{border-radius:18px;padding:18px}.spec-card .k{font:900 11px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.spec-card .v{font-size:24px;font-weight:950;margin-top:4px;letter-spacing:-.03em}.section{padding:26px;margin-top:18px}h2{font-size:28px;line-height:1.1;margin:0 0 16px;letter-spacing:-.03em}.section p{color:#d4d4d8;margin:10px 0}.muted{color:var(--muted)!important}.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}.list{margin:0;padding-left:18px}.list li{color:#d4d4d8;margin:8px 0}.install-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.step{border:1px solid var(--border);background:#0d0d0d;border-radius:16px;padding:16px}.step-num{color:var(--primary);font:950 12px ui-monospace,monospace;letter-spacing:.14em}.step strong{display:block;margin-top:6px}.step span{display:block;color:var(--muted);font-size:14px;margin-top:5px}.bars{display:grid;gap:12px}.bar-row{display:grid;grid-template-columns:92px 1fr 32px;gap:12px;align-items:center}.bar-row span{font:800 12px ui-monospace,monospace;color:var(--muted);text-transform:uppercase}.track{height:8px;background:#242424;border-radius:99px;overflow:hidden}.fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--primary),#ff8a64)}.tag{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.1);background:#161616;border-radius:999px;padding:6px 10px;margin:4px;color:#d4d4d8;font:800 12px ui-monospace,monospace}.tag:before{content:"#";color:var(--primary);margin-right:4px}.meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.meta{border:1px solid var(--border);border-radius:14px;background:#0e0e0e;padding:14px}.meta .k{font:900 10px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.meta .v{color:#fff;font-weight:800;margin-top:4px;word-break:break-word}.similar{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.similar a{display:flex;justify-content:space-between;gap:8px;border:1px solid var(--border);background:#0d0d0d;color:#fff;border-radius:14px;padding:12px;font-weight:800}.similar a:hover{border-color:rgba(255,69,58,.5);box-shadow:0 0 24px rgba(255,69,58,.1)}.similar span{color:var(--muted);font:800 11px ui-monospace,monospace}.next{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.next a{border:1px solid var(--border);border-radius:16px;background:#0d0d0d;color:#fff;padding:16px;font-weight:900}.next small{display:block;color:var(--muted);font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}.hardware-fit{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.hardware-fit a{border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));color:#fff;padding:16px;font-weight:900}.hardware-fit a:hover{border-color:rgba(255,69,58,.48);box-shadow:0 0 28px rgba(255,69,58,.09)}.hardware-fit small{display:block;color:var(--muted);font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}code{background:#18181b;border:1px solid #27272a;padding:2px 6px;border-radius:6px;color:#fff}.source-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.source-links a,.source-links code{color:#fff;border:1px solid var(--border);background:#111;padding:8px 10px;border-radius:10px;font:800 12px ui-monospace,monospace}@media(max-width:940px){.nav-inner{height:64px}.nav-links{display:none}.hamb{display:block}.mobile-links.open{display:block}.hero,.cols,.specs,.install-steps,.next,.hardware-fit{grid-template-columns:1fr}.panel-grid,.meta-grid,.similar{grid-template-columns:1fr 1fr}.wrap{padding:24px 16px 48px}.hero-copy{padding:24px}.title{font-size:clamp(42px,12vw,72px)}}@media(max-width:560px){.panel-grid,.meta-grid,.similar{grid-template-columns:1fr}.btn{width:100%}.score{font-size:48px}.bar-row{grid-template-columns:76px 1fr 28px}}
  </style>
</head>
<body>
  <nav class="site-nav" role="navigation" aria-label="Main navigation">
    <div class="nav-inner">
      <a href="/" class="logo"><span class="logo-box"><img src="/images/crab-logo.png" alt="LocalClaw logo" width="28" height="28"></span><span class="logo-text">Local<span>Claw</span></span></a>
      <button class="hamb" onclick="document.getElementById('mobile-menu').classList.toggle('open')" aria-label="Open menu">Menu</button>
      <div class="nav-links"><a href="/">Home</a><a href="/llm-list.html" class="active">LLM</a><a href="/tts-list.html">TTS</a><a href="/computers.html">Computers</a><a href="/blog/">Blog</a><a href="/pricing.html" class="pricing">Pricing</a></div>
    </div>
    <div id="mobile-menu" class="mobile-links"><a href="/">Home</a><a href="/llm-list.html">LLM</a><a href="/tts-list.html">TTS</a><a href="/computers.html">Computers</a><a href="/blog/">Blog</a><a href="/pricing.html">Pricing</a></div>
  </nav>
  <main class="wrap">
    <div class="breadcrumb"><a href="/">LocalClaw</a><span>/</span><a href="/llm-list.html">LLM</a><span>/</span><span>${esc(m.name)}</span></div>
    <header class="hero">
      <section class="hero-copy">
        <div class="eyebrow">${esc(modelType(m))}</div>
        <h1 class="title">${esc(m.name).replace(/\s*\(([^)]+)\)$/, ' <span>($1)</span>')}</h1>
        <p class="desc">${esc(m.description)}</p>
        <div class="chips">
          <span class="chip hot">${esc(hardwareTier(m))}</span>
          <span class="chip">${ramLabel} RAM</span>
          <span class="chip">${esc(m.recommended_quant)}</span>
          <span class="chip">${esc(primaryUse(m, d))}</span>
        </div>
        <div class="cta">
          <a class="btn" href="/pricing.html">Run with LocalClaw</a>
          <a class="btn secondary" href="/llm-list.html">Compare all models</a>
        </div>
      </section>
      <aside class="hero-panel">
        <div class="score-card">
          <div>
            <div class="score-label">${m.hosted_only ? 'Local status' : 'Local fit score'}</div>
            <div class="score">${m.hosted_only ? 'API' : `${score}<small>/10</small>`}</div>
            <p class="score-caption">${hardwareSentence(m)}</p>
          </div>
        </div>
        <div class="panel-grid">
          <div class="mini"><div class="k">Family</div><div class="v" style="color:${color}">${esc(m.family || 'Unknown')}</div></div>
          <div class="mini"><div class="k">Released</div><div class="v">${esc(m.released || 'Unknown')}</div></div>
        </div>
      </aside>
    </header>
    <section class="specs" aria-label="Key local AI model specs">
      <div class="spec-card"><div class="k">Parameters</div><div class="v">${esc(m.params)}</div></div>
      <div class="spec-card"><div class="k">Minimum RAM</div><div class="v">${ramLabel}</div></div>
      <div class="spec-card"><div class="k">Model size</div><div class="v">${sizeLabel}</div></div>
      <div class="spec-card"><div class="k">Quantization</div><div class="v">${esc(m.recommended_quant)}</div></div>
    </section>
    <section class="section">
      <h2>Can ${esc(m.name)} run locally?</h2>
      <p>${hardwareSentence(m)}</p>
      <p>${lmStudioLine(m)}</p>
      <div class="source-links">${sourceLine}${hfLine}</div>
      <div style="margin-top:16px">${tags}</div>
    </section>
    <section class="section">
      <h2>Install path</h2>
      <div class="install-steps">
        <div class="step"><div class="step-num">01</div><strong>Check RAM fit</strong><span>${m.hosted_only ? 'API only today.' : `Minimum ${esc(m.min_ram)} GB RAM. Start with the ${esc(m.recommended_quant)} quant.`}</span></div>
        <div class="step"><div class="step-num">02</div><strong>Load the model</strong><span>${m.hosted_only ? 'Use the API provider instead of local GGUF.' : `Search ${esc(m.search_term)} in LM Studio.`}</span></div>
        <div class="step"><div class="step-num">03</div><strong>Control locally</strong><span>Use LocalClaw to manage models, agents, chat, channels and scheduled OpenClaw work.</span></div>
      </div>
    </section>
    <section class="section cols">
      <div><h2>Strengths</h2><ul class="list">${strengths}</ul></div>
      <div><h2>Limitations</h2><ul class="list">${weaknesses}</ul></div>
    </section>
    <section class="section cols">
      <div><h2>Best use cases</h2><ul class="list">${uses}</ul></div>
      <div>
        <h2>Capability profile</h2>
        <div class="bars">
          ${['speed', 'quality', 'coding', 'reasoning'].map(k => `<div class="bar-row"><span>${k}</span><div class="track"><div class="fill" style="width:${pct(m.benchmarks?.[k])}%"></div></div><strong>${m.benchmarks?.[k] || '?'}</strong></div>`).join('')}
        </div>
      </div>
    </section>
    <section class="section">
      <h2>Technical notes</h2>
      <div class="meta-grid">
        <div class="meta"><div class="k">Developer</div><div class="v">${esc(d.developer || m.family || 'Unknown')}</div></div>
        <div class="meta"><div class="k">License</div><div class="v">${esc(d.license || 'See model repository')}</div></div>
        <div class="meta"><div class="k">Context window</div><div class="v">${fmt(d.context_window)} tokens</div></div>
        <div class="meta"><div class="k">Architecture</div><div class="v">${esc(d.architecture || 'See model card')}</div></div>
      </div>
    </section>
    <section class="section">
      <h2>This model fits these next steps</h2>
      <p class="muted">Hardware fit is based on LocalClaw's RAM tier, model size and quantization metadata. Always leave memory headroom for your OS and runtime.</p>
      <div class="hardware-fit">
        ${hardwareMatches(m).map(([label, href, note]) => `<a href="${esc(href)}"><small>${esc(note)}</small>${esc(label)}</a>`).join('')}
      </div>
    </section>
${similar ? `    <section class="section"><h2>Similar models to compare</h2><div class="similar">${similar}</div></section>` : ''}
    <section class="section">
      <h2>Where to go next</h2>
      <div class="next">
        <a href="${ramGuide(m)}"><small>RAM guide</small>Find models for this memory tier</a>
        <a href="/computers.html"><small>Hardware</small>See computers for local AI</a>
        <a href="/pricing.html"><small>LocalClaw</small>Control OpenClaw from one native app</a>
      </div>
    </section>
  </main>
</body>
</html>`;
}

const APP_DATA = loadAppData();
const MODEL_DETAILS = loadModelDetails();
const uniqueModels = APP_DATA.models.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
const outDir = path.join(ROOT, 'models');

fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});

for (const m of uniqueModels) {
  fs.writeFileSync(path.join(outDir, `${slug(m.id)}.html`), modelPage(m, MODEL_DETAILS[m.id] || {}, uniqueModels));
}

const cards = uniqueModels.map(m => `<li><a href="/models/${esc(m.id)}.html"><strong>${esc(m.name)}</strong></a> <span>${esc(m.params)} · ${m.hosted_only ? 'API only' : `${esc(m.min_ram)} GB RAM`} · ${esc(m.recommended_quant)}</span></li>`).join('\n');

fs.writeFileSync(path.join(outDir, 'index.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>All Local AI Model Pages | LocalClaw</title><meta name="description" content="Index of all static LocalClaw model pages: local LLM specs, RAM requirements, quantization and LM Studio setup."><meta name="robots" content="index, follow"><link rel="canonical" href="${BASE}/models/">${tracking}<style>body{background:#050505;color:#fff;font-family:Inter,system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:32px;line-height:1.6}a{color:#ff453a}li{margin:10px 0;padding:12px;border:1px solid #27272a;border-radius:12px;list-style:none;background:#0f0f11}span{color:#a1a1aa}</style></head><body><p><a href="/">Back to LocalClaw</a></p><h1>All Local AI Model Pages</h1><p>Static, indexable pages for LocalClaw's local LLM catalogue.</p><ul>${cards}</ul></body></html>`);

console.log(`Generated ${uniqueModels.length} unique static model pages in models/`);
