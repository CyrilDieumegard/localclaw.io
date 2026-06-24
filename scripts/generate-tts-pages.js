const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';

function extractTTS() {
  const html = fs.readFileSync(path.join(ROOT, 'tts-list.html'), 'utf8');
  const match = html.match(/const TTS_MODELS = (\[[\s\S]*?\n\s*\]);/);
  if (!match) throw new Error('TTS_MODELS not found in tts-list.html');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`this.TTS_MODELS=${match[1]}`, ctx);
  return ctx.TTS_MODELS;
}

const esc = (s = '') => String(s).replace(/[\u2014\u2013]/g, '-').replace(/[&<>'"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[c]));

const pct = n => Math.max(0, Math.min(100, Number(n || 0) * 10));
const fmtNum = n => Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-US') : esc(n || 'Unknown');
const niceList = items => (items || []).filter(Boolean).join(', ') || 'Not specified';

const tracking = `
  <!-- TRACKING: DataFast Analytics -->
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <!-- Microsoft Clarity - session recordings & heatmaps (bounce diagnosis) -->
  <script src="/js/clarity.js" defer></script>`;

const familyColors = {
  kokoro: '#ff453a',
  qwen: '#ff453a',
  voxcp: '#ff453a',
  f5: '#f97316',
  fish: '#f97316',
  higgs: '#fb7185',
  miso: '#a78bfa',
  wavtts: '#38bdf8',
  index: '#fb7185',
  whisper: '#3b82f6',
  parakeet: '#38bdf8',
  kyutai: '#38bdf8',
  canary: '#38bdf8',
  piper: '#22c55e',
  kitten: '#22c55e',
  app: '#ea580c'
};

function voiceColor(model) {
  if (model.isAsr) return '#3b82f6';
  if (model.isOrchestrator) return '#ea580c';
  return familyColors[model.family] || '#ff453a';
}

function modelKind(model) {
  if (model.isAsr) return 'Local ASR model';
  if (model.isOrchestrator) return 'Local speech app';
  return 'Local TTS model';
}

function modelTask(model) {
  if (model.isAsr) return 'speech-to-text transcription';
  if (model.isOrchestrator) return 'local voice workflow orchestration';
  return 'text-to-speech generation';
}

function audioFitScore(model) {
  const quality = Number(model.quality) || 0;
  const speed = Number(model.speed) || 0;
  const size = Number(model.sizeGB) || 0;
  const sizePenalty = size > 10 ? 0.7 : size > 5 ? 0.45 : size > 2 ? 0.2 : 0;
  const localBonus = (model.hardware || []).includes('cpu') ? 0.2 : 0;
  return Math.max(4.8, Math.min(9.8, quality * 0.68 + speed * 0.32 - sizePenalty + localBonus)).toFixed(1);
}

function hardwareTier(model) {
  const hardware = model.hardware || [];
  const size = Number(model.sizeGB) || 0;
  if (hardware.includes('edge')) return 'Edge ready';
  if (hardware.includes('cpu') && size <= 1) return 'CPU friendly';
  if (hardware.includes('apple') && size <= 3) return 'Apple Silicon ready';
  if (hardware.includes('gpu')) return 'GPU recommended';
  return 'Local capable';
}

function localSentence(model) {
  const name = esc(model.name);
  const command = model.installCommand ? `Start with <code>${esc(model.installCommand)}</code>.` : 'Use the upstream install notes before deployment.';
  if (model.isAsr) {
    return `${name} can run locally for offline speech-to-text. ${command}`;
  }
  if (model.isOrchestrator) {
    return `${name} is a local app layer that coordinates installed speech backends. ${command}`;
  }
  return `${name} can generate speech locally for private voice workflows. ${command}`;
}

function bestForSentence(model) {
  const features = model.features || [];
  if (model.isAsr) {
    return `${esc(model.name)} is best for offline transcription, speech indexing and local voice pipelines.`;
  }
  if (model.isOrchestrator) {
    return `${esc(model.name)} is best when you want a local UI or API layer over multiple speech engines.`;
  }
  if (features.includes('cloning')) return `${esc(model.name)} is best for local voice cloning and expressive speech generation.`;
  if (features.includes('realtime') || features.includes('low-latency')) return `${esc(model.name)} is best for fast on-device voice responses and local assistants.`;
  if (features.includes('multilingual')) return `${esc(model.name)} is best for multilingual local speech generation.`;
  return `${esc(model.name)} is best for private local text-to-speech experiments and production prototypes.`;
}

function commercialNote(model) {
  if (!model.license) return 'Check the upstream license before commercial use.';
  if (/non.?commercial|\bNC\b|by-nc|research|custom|terms|cpml/i.test(model.license)) return `${esc(model.license)} license. Review upstream restrictions before commercial use.`;
  if (/apache|mit|bsd/i.test(model.license)) return `${esc(model.license)} license. Still verify upstream usage notes before shipping.`;
  return `${esc(model.license)} license. Review upstream restrictions before commercial use.`;
}

function titleMarkup(name) {
  return esc(name).replace(/\s*\(([^)]+)\)$/, ' <span>($1)</span>');
}

function tagsMarkup(items) {
  return (items || []).slice(0, 10).map(item => `<span class="tag">${esc(item)}</span>`).join('');
}

function pillMarkup(items) {
  return (items || []).filter(Boolean).slice(0, 8).map(item => `<span class="chip">${esc(item)}</span>`).join('');
}

function relatedModels(all, model) {
  return all
    .filter(item => item.id !== model.id)
    .map(item => {
      const sharedFeatures = (item.features || []).filter(feature => (model.features || []).includes(feature)).length;
      const family = item.family === model.family ? 4 : 0;
      const type = (Boolean(item.isAsr) === Boolean(model.isAsr) ? 2 : 0) + (Boolean(item.isOrchestrator) === Boolean(model.isOrchestrator) ? 1 : 0);
      const score = family + sharedFeatures + type + (Number(item.quality) || 0) / 10 + (Number(item.speed) || 0) / 20;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.item);
}

function relatedCard(model) {
  const color = voiceColor(model);
  return `<a class="similar-card" href="/tts/${esc(model.id)}.html" style="--model-color:${color}">
    <span class="similar-family">${esc(model.developer || model.family || modelKind(model))}</span>
    <strong>${esc(model.name)}</strong>
    <small>${esc(modelKind(model))} · Q ${esc(model.quality)} · Speed ${esc(model.speed)}</small>
  </a>`;
}

function schemaFor(model, url, desc) {
  const kind = modelKind(model);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: model.name,
        applicationCategory: kind,
        operatingSystem: 'macOS, Windows, Linux',
        url,
        description: desc,
        softwareVersion: model.releaseDate || undefined,
        softwareRequirements: `${model.sizeGB || 'Unknown'} GB model size; ${niceList(model.hardware)}`,
        license: model.license || undefined,
        creator: model.developer ? { '@type': 'Organization', name: model.developer } : undefined
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Can ${model.name} run locally?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${model.name} is listed by LocalClaw as a local ${model.isAsr ? 'ASR' : model.isOrchestrator ? 'speech app' : 'TTS'} option. Hardware fit depends on runtime, model size and backend support.`
            }
          },
          {
            '@type': 'Question',
            name: `What is ${model.name} best for?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: bestForSentence(model).replace(/<[^>]+>/g, '')
            }
          },
          {
            '@type': 'Question',
            name: `What license does ${model.name} use?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: model.license || 'Check the upstream project license before use.'
            }
          }
        ]
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'TTS', item: `${BASE}/tts-list.html` },
          { '@type': 'ListItem', position: 3, name: model.name, item: url }
        ]
      }
    ]
  };
}

function style(color) {
  return `
    :root{--bg:#050505;--panel:#0d0d0d;--card:#111;--card2:#171717;--border:#262626;--border2:#3a3a3a;--primary:#ff453a;--orange:#ea580c;--text:#fff;--muted:#a1a1aa;--soft:#d4d4d8;--green:#22c55e;--blue:#3b82f6;--model-color:${color}}*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 18% 10%,rgba(255,69,58,.12),transparent 26rem),radial-gradient(circle at 78% 18%,color-mix(in srgb,var(--model-color) 14%,transparent),transparent 24rem),linear-gradient(180deg,#050505,#070707 42%,#050505);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.55}body:before{content:"";position:fixed;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:80px 80px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 85%)}a{text-decoration:none}.site-nav{border-bottom:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.82);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}.nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;height:80px;display:flex;align-items:center;justify-content:space-between;gap:24px}.logo{display:flex;align-items:center;gap:12px;color:#fff}.logo-box{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--primary),var(--orange));display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(255,69,58,.45)}.logo-box img{width:28px;height:28px;border-radius:6px}.logo-text{font-family:'Space Grotesk',Inter,sans-serif;font-size:25px;font-weight:900;letter-spacing:-.04em;text-transform:uppercase}.logo-text span{color:var(--primary)}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{color:var(--muted);font:700 14px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.nav-links a:hover,.nav-links .active{color:#fff}.nav-links .pricing{color:var(--primary)}.mobile-links{display:none;border-top:1px solid var(--border);padding:12px 24px;background:#0f0f11}.mobile-links a{display:block;color:#d4d4d8;padding:10px 0}.hamb{display:none;background:none;border:1px solid transparent;color:var(--muted);font-size:24px}.wrap{max-width:1180px;margin:0 auto;padding:34px 24px 64px}.breadcrumb{display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:var(--muted);font:700 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:22px}.breadcrumb a{color:#d4d4d8}.breadcrumb a:hover{color:#fff}.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:24px;align-items:stretch;margin-bottom:24px}.hero-copy,.hero-panel,.section,.spec-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border:1px solid var(--border);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.38)}.hero-copy{padding:34px;position:relative;overflow:hidden}.hero-copy:before{content:"";position:absolute;inset:-1px;background:radial-gradient(circle at 0 0,rgba(255,69,58,.22),transparent 42%);pointer-events:none}.eyebrow{position:relative;color:var(--primary);font:900 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.18em;display:flex;gap:10px;align-items:center}.eyebrow:before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 14px currentColor}.title{position:relative;font-size:clamp(44px,7vw,86px);line-height:.92;margin:18px 0 16px;font-weight:950;letter-spacing:-.055em}.title span{color:var(--primary)}.desc{position:relative;max-width:760px;color:#d6d6dd;font-size:19px;margin:0}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.chip{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);border-radius:999px;color:#d7d7dd;padding:7px 11px;font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}.chip.hot{border-color:rgba(255,69,58,.45);color:var(--primary);background:rgba(255,69,58,.09)}.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid rgba(255,69,58,.5);background:var(--primary);color:#050505;font:950 13px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.05em;padding:14px 18px;border-radius:12px;box-shadow:6px 6px 0 rgba(154,25,18,.5)}.btn:hover{transform:translateY(-1px);filter:brightness(1.06)}.btn.secondary{background:#111;color:#fff;border-color:rgba(255,255,255,.18);box-shadow:none}.hero-panel{padding:22px;display:flex;flex-direction:column;gap:16px}.score-card{flex:1;display:flex;flex-direction:column;justify-content:space-between;border:1px solid color-mix(in srgb,var(--model-color) 55%,transparent);border-radius:20px;padding:22px;background:radial-gradient(circle at 0 0,color-mix(in srgb,var(--model-color) 16%,transparent),transparent 45%),#0b0b0b}.score-label{font:900 12px ui-monospace,monospace;color:#b8b8c1;text-transform:uppercase;letter-spacing:.12em}.score{font-size:58px;line-height:1;font-weight:950;letter-spacing:-.05em}.score small{font-size:16px;color:var(--muted);letter-spacing:0}.score-caption{color:#d4d4d8;margin-top:10px}.panel-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mini{border:1px solid var(--border);background:#101010;border-radius:16px;padding:14px}.mini .k{font:800 10px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.mini .v{font-weight:900;font-size:18px;margin-top:4px}.specs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.spec-card{border-radius:18px;padding:18px}.spec-card .k{font:900 11px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.spec-card .v{font-size:24px;font-weight:950;margin-top:4px;letter-spacing:-.03em}.section{padding:26px;margin-top:18px}h2{font-size:28px;line-height:1.1;margin:0 0 16px;letter-spacing:-.03em}.section p{color:#d4d4d8;margin:10px 0}.muted{color:var(--muted)!important}.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}.detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.detail{border:1px solid var(--border);border-radius:16px;background:#0d0d0d;padding:16px}.detail .k{font:900 10px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.detail .v{color:#fff;font-weight:850;margin-top:6px;word-break:break-word}.list{margin:0;padding-left:18px}.list li{color:#d4d4d8;margin:8px 0}.install-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.step{border:1px solid var(--border);background:#0d0d0d;border-radius:16px;padding:16px}.step-num{color:var(--primary);font:950 12px ui-monospace,monospace;letter-spacing:.14em}.step strong{display:block;margin-top:6px}.step span{display:block;color:var(--muted);font-size:14px;margin-top:5px}.bars{display:grid;gap:12px}.bar-row{display:grid;grid-template-columns:92px 1fr 32px;gap:12px;align-items:center}.bar-row span{font:800 12px ui-monospace,monospace;color:var(--muted);text-transform:uppercase}.track{height:8px;background:#242424;border-radius:99px;overflow:hidden}.fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--primary),var(--model-color))}.tag{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.1);background:#161616;border-radius:999px;padding:6px 10px;margin:4px;color:#d4d4d8;font:800 12px ui-monospace,monospace}.tag:before{content:"#";color:var(--primary);margin-right:4px}code{background:#18181b;border:1px solid #27272a;padding:2px 6px;border-radius:6px;color:#fff}.command{display:block;overflow:auto;white-space:pre-wrap;font:850 14px ui-monospace,monospace;padding:14px;border-radius:12px;background:#090909;border:1px solid var(--border2)}.source-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.source-links a,.source-links code{color:#fff;border:1px solid var(--border);background:#111;padding:8px 10px;border-radius:10px;font:800 12px ui-monospace,monospace}.similar{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.similar-card{display:flex;flex-direction:column;gap:4px;border:1px solid var(--border);background:#0d0d0d;color:#fff;border-radius:14px;padding:12px;font-weight:800}.similar-card:hover{border-color:color-mix(in srgb,var(--model-color) 55%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--model-color) 14%,transparent)}.similar-family{color:var(--model-color);font:900 10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.similar-card small{color:var(--muted);font:800 11px ui-monospace,monospace}.next{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.next a{border:1px solid var(--border);border-radius:16px;background:#0d0d0d;color:#fff;padding:16px;font-weight:900}.next small{display:block;color:var(--muted);font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}@media(max-width:940px){.nav-inner{height:64px}.nav-links{display:none}.hamb{display:block}.mobile-links.open{display:block}.hero,.cols,.specs,.install-steps,.next{grid-template-columns:1fr}.panel-grid,.detail-grid,.similar{grid-template-columns:1fr 1fr}.wrap{padding:24px 16px 48px}.hero-copy{padding:24px}.title{font-size:clamp(42px,12vw,72px)}}@media(max-width:560px){.panel-grid,.detail-grid,.similar{grid-template-columns:1fr}.btn{width:100%}.score{font-size:48px}.bar-row{grid-template-columns:76px 1fr 28px}}
  `;
}

function nav() {
  return `<nav class="site-nav" role="navigation" aria-label="Main navigation">
    <div class="nav-inner">
      <a href="/" class="logo"><span class="logo-box"><img src="/images/crab-logo.png" alt="LocalClaw logo" width="28" height="28"></span><span class="logo-text">Local<span>Claw</span></span></a>
      <button class="hamb" onclick="document.getElementById('mobile-menu').classList.toggle('open')" aria-label="Open menu">Menu</button>
      <div class="nav-links"><a href="/">Home</a><a href="/llm-list.html">LLM</a><a href="/tts-list.html" class="active">TTS</a><a href="/computers.html">Computers</a><a href="/ram-gpu-for-local-ai.html">RAM/GPU</a><a href="/blog/">Blog</a><a href="/pricing.html" class="pricing">Pricing</a></div>
    </div>
    <div id="mobile-menu" class="mobile-links"><a href="/">Home</a><a href="/llm-list.html">LLM</a><a href="/tts-list.html">TTS</a><a href="/computers.html">Computers</a><a href="/ram-gpu-for-local-ai.html">RAM/GPU</a><a href="/blog/">Blog</a><a href="/pricing.html">Pricing</a></div>
  </nav>`;
}

function page(model, all) {
  const color = voiceColor(model);
  const url = `${BASE}/tts/${encodeURIComponent(model.id)}.html`;
  const title = `${model.name} local ${model.isAsr ? 'ASR' : model.isOrchestrator ? 'speech app' : 'TTS'}: quality, speed and setup | LocalClaw`;
  const desc = `${model.name}: local ${modelTask(model)} guide with quality ${model.quality}/10, speed ${model.speed}/10, ${model.languageCount || (model.languages || []).length || '?'} languages, hardware and install notes.`.slice(0, 158);
  const schema = schemaFor(model, url, desc);
  const related = relatedModels(all, model);
  const features = tagsMarkup(model.features);
  const hardware = pillMarkup(model.hardware);
  const formats = pillMarkup(model.supportedFormats);
  const sourceLink = model.hfLink ? `<a href="${esc(model.hfLink)}" target="_blank" rel="noopener nofollow">Upstream source</a>` : '';
  const command = esc(model.installCommand || 'Check upstream installation instructions');

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
  <meta property="og:title" content="${esc(model.name)} ${esc(modelKind(model))} | LocalClaw">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(model.name)} ${esc(modelKind(model))} | LocalClaw">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}
  <style>${style(color)}</style>
</head>
<body>
  ${nav()}
  <main class="wrap">
    <div class="breadcrumb"><a href="/">LocalClaw</a><span>/</span><a href="/tts-list.html">TTS</a><span>/</span><span>${esc(model.name)}</span></div>
    <header class="hero">
      <section class="hero-copy">
        <div class="eyebrow">${esc(modelKind(model))}</div>
        <h1 class="title">${titleMarkup(model.name)}</h1>
        <p class="desc">${esc(model.description)}</p>
        <div class="chips">
          <span class="chip hot">${esc(hardwareTier(model))}</span>
          <span class="chip">${esc(modelTask(model))}</span>
          <span class="chip">${fmtNum(model.languageCount || (model.languages || []).length)} languages</span>
          <span class="chip">${esc(model.license || 'License varies')}</span>
        </div>
        <div class="cta">
          <a class="btn" href="/tts-list.html">Compare TTS models</a>
          ${model.hfLink ? `<a class="btn secondary" href="${esc(model.hfLink)}" target="_blank" rel="noopener nofollow">Open source page</a>` : '<a class="btn secondary" href="/pricing.html">Get LocalClaw</a>'}
        </div>
      </section>
      <aside class="hero-panel">
        <div class="score-card">
          <div>
            <div class="score-label">Local voice fit score</div>
            <div class="score">${audioFitScore(model)}<small>/10</small></div>
            <p class="score-caption">${bestForSentence(model)}</p>
          </div>
        </div>
        <div class="panel-grid">
          <div class="mini"><div class="k">Developer</div><div class="v">${esc(model.developer || model.family || 'Open model')}</div></div>
          <div class="mini"><div class="k">Released</div><div class="v">${esc(model.releaseDate || 'Unknown')}</div></div>
        </div>
      </aside>
    </header>

    <section class="specs" aria-label="Model specs">
      <div class="spec-card"><div class="k">Quality</div><div class="v">${esc(model.quality)}/10</div></div>
      <div class="spec-card"><div class="k">Speed</div><div class="v">${esc(model.speed)}/10</div></div>
      <div class="spec-card"><div class="k">Model size</div><div class="v">${esc(model.sizeGB)} GB</div></div>
      <div class="spec-card"><div class="k">Voices</div><div class="v">${esc(model.voices || 'Varies')}</div></div>
    </section>

    <section class="section">
      <h2>Can ${esc(model.name)} run locally?</h2>
      <p>${localSentence(model)}</p>
      <p>${commercialNote(model)}</p>
      <div class="source-links">
        <code>${command}</code>
        ${sourceLink}
      </div>
      <div style="margin-top:18px">${features}</div>
    </section>

    <section class="section cols">
      <div>
        <h2>Audio profile</h2>
        <div class="bars">
          <div class="bar-row"><span>Quality</span><div class="track"><div class="fill" style="width:${pct(model.quality)}%"></div></div><span>${esc(model.quality)}</span></div>
          <div class="bar-row"><span>Speed</span><div class="track"><div class="fill" style="width:${pct(model.speed)}%"></div></div><span>${esc(model.speed)}</span></div>
          <div class="bar-row"><span>Local</span><div class="track"><div class="fill" style="width:${Math.min(100, Number(audioFitScore(model)) * 10)}%"></div></div><span>${audioFitScore(model)}</span></div>
        </div>
      </div>
      <div>
        <h2>Best fit</h2>
        <p>${bestForSentence(model)}</p>
        <p class="muted">Hardware: ${hardware || 'Not specified'}</p>
      </div>
    </section>

    <section class="section">
      <h2>Model details</h2>
      <div class="detail-grid">
        <div class="detail"><div class="k">Type</div><div class="v">${esc(modelKind(model))}</div></div>
        <div class="detail"><div class="k">Family</div><div class="v">${esc(model.family || 'Unknown')}</div></div>
        <div class="detail"><div class="k">Latency</div><div class="v">${esc(model.latency || 'Not specified')}</div></div>
        <div class="detail"><div class="k">Formats</div><div class="v">${formats || 'Not specified'}</div></div>
        <div class="detail"><div class="k">Languages</div><div class="v">${esc(niceList(model.languages))}</div></div>
        <div class="detail"><div class="k">Context</div><div class="v">${esc(model.context || 'Not specified')}</div></div>
      </div>
    </section>

    <section class="section">
      <h2>Install locally</h2>
      <div class="install-steps">
        <div class="step"><div class="step-num">01</div><strong>Check runtime</strong><span>Confirm the backend supports ${esc(niceList(model.supportedFormats || ['the upstream format']))} on your machine.</span></div>
        <div class="step"><div class="step-num">02</div><strong>Install model</strong><span>Use the upstream command or repository instructions.</span></div>
        <div class="step"><div class="step-num">03</div><strong>Test locally</strong><span>Run a short private audio prompt before moving into production workflows.</span></div>
      </div>
      <pre class="command">${command}</pre>
    </section>

    <section class="section cols">
      <div>
        <h2>Good for</h2>
        <ul class="list">
          <li>${esc(modelTask(model))}</li>
          <li>${esc(hardwareTier(model))} local workflows</li>
          <li>${esc((model.features || []).slice(0, 3).join(', ') || 'Private local speech experiments')}</li>
        </ul>
      </div>
      <div>
        <h2>Watch before shipping</h2>
        <ul class="list">
          <li>Validate pronunciation, latency and artifacts with your own voice samples.</li>
          <li>Review the upstream license and acceptable-use notes.</li>
          <li>Benchmark on your target CPU, Apple Silicon or GPU setup.</li>
        </ul>
      </div>
    </section>

    <section class="section">
      <h2>Related TTS and speech models</h2>
      <div class="similar">${related.map(relatedCard).join('')}</div>
    </section>

    <section class="section next">
      <a href="/tts-list.html"><small>Compare</small>Browse all TTS models</a>
      <a href="/llm-list.html"><small>Local AI</small>Browse LLM models</a>
      <a href="/pricing.html"><small>macOS app</small>Get LocalClaw</a>
    </section>
  </main>
</body>
</html>`;
}

function indexPage(models) {
  const picks = models.filter(m => m.isPick || m.isNew).slice(0, 12);
  const bestQuality = [...models].sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
  const fastest = [...models].sort((a, b) => (b.speed || 0) - (a.speed || 0))[0];
  const desc = 'Static pages for local text-to-speech, ASR and speech AI models. Compare quality, speed, languages, hardware, install commands and licenses.';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Local TTS model pages',
    url: `${BASE}/tts/`,
    description: desc,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: models.length,
      itemListElement: models.slice(0, 20).map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: m.name,
        url: `${BASE}/tts/${m.id}.html`
      }))
    }
  };

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local TTS model pages | LocalClaw</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="${BASE}/tts/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/tts/">
  <meta property="og:title" content="Local TTS model pages | LocalClaw">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}
  <style>${style('#ff453a')}</style>
</head>
<body>
  ${nav()}
  <main class="wrap">
    <div class="breadcrumb"><a href="/">LocalClaw</a><span>/</span><a href="/tts-list.html">TTS</a><span>/</span><span>Model pages</span></div>
    <header class="hero">
      <section class="hero-copy">
        <div class="eyebrow">Speech model pages</div>
        <h1 class="title">Local TTS <span>models</span></h1>
        <p class="desc">${esc(desc)}</p>
        <div class="chips">
          <span class="chip hot">${models.length} records</span>
          <span class="chip">TTS</span>
          <span class="chip">ASR</span>
          <span class="chip">Voice apps</span>
        </div>
        <div class="cta">
          <a class="btn" href="/tts-list.html">Open interactive TTS list</a>
          <a class="btn secondary" href="/">Run recommender</a>
        </div>
      </section>
      <aside class="hero-panel">
        <div class="score-card">
          <div>
            <div class="score-label">Speech catalogue</div>
            <div class="score">${models.length}<small> pages</small></div>
            <p class="score-caption">Indexable, model-by-model guides for local voice generation, transcription and speech tooling.</p>
          </div>
        </div>
        <div class="panel-grid">
          <div class="mini"><div class="k">Best quality</div><div class="v">${esc(bestQuality && bestQuality.name)}</div></div>
          <div class="mini"><div class="k">Fastest</div><div class="v">${esc(fastest && fastest.name)}</div></div>
        </div>
      </aside>
    </header>

    <section class="section">
      <h2>Featured local speech models</h2>
      <div class="similar">${picks.map(relatedCard).join('')}</div>
    </section>

    <section class="section">
      <h2>All TTS model pages</h2>
      <div class="similar">${[...models].sort((a, b) => a.name.localeCompare(b.name)).map(relatedCard).join('')}</div>
    </section>
  </main>
</body>
</html>`;
}

const models = extractTTS();
const out = path.join(ROOT, 'tts');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const model of models) {
  fs.writeFileSync(path.join(out, `${model.id}.html`), page(model, models));
}
fs.writeFileSync(path.join(out, 'index.html'), indexPage(models));
console.log(`Generated ${models.length} TTS pages.`);
