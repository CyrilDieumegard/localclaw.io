const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { normalizeDirectory } = require('./normalize-public-urls');
const { siteNavigation, siteNavAssets } = require('./site-navigation');

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
const metaDescription = (value, max = 158) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,:;\s]+$/, '');
  return `${clipped}.`;
};

const tracking = `
  <!-- TRACKING: DataFast Analytics -->
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <!-- Microsoft Clarity - session recordings & heatmaps (bounce diagnosis) -->
  <script src="/js/clarity.js" defer></script>
  ${siteNavAssets()}`;

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
  lfm: '#38bdf8',
  apertus: '#0f766e',
  internscience: '#14b8a6',
  deepreinforce: '#ff453a'
};

function familyColor(m) {
  return familyColors[m.family] || '#ff453a';
}

function localClawCatalogueScore(m) {
  if (m.hosted_only) return null;
  const b = m.benchmarks || {};
  const score = (Number(b.quality) || 0) * 0.38
    + (Number(b.coding) || 0) * 0.24
    + (Number(b.reasoning) || 0) * 0.24
    + (Number(b.speed) || 0) * 0.14;
  return Math.max(0, Math.min(10, score)).toFixed(1);
}

function hardwareTier(m) {
  if (m.hosted_only) return 'API only';
  return `${m.min_ram} GB catalogue minimum`;
}

function hardwareSentence(m) {
  if (m.hosted_only) return `${esc(m.name)} is listed for comparison, but it is a hosted/API model rather than a downloadable local release.`;
  const state = hfRepoState(m);
  if (state === 'publicModelCard') return `LocalClaw verified a public model card for ${esc(m.name)} on ${esc(hfVerificationDate())}, but no public GGUF file in that repository. The catalogue RAM and quantization fields are estimates, not a verified install path.`;
  if (state === 'gated') return `LocalClaw verified a gated model card for ${esc(m.name)} on ${esc(hfVerificationDate())}. Access approval or licence acceptance is required, and no public GGUF install path is claimed.`;
  return `${esc(m.name)} has a catalogue minimum of ${esc(m.min_ram)} GB RAM with ${esc(m.recommended_quant)}. Actual memory use and speed vary by context length, runtime, backend and system headroom.`;
}

function hfRepoState(m) {
  const verification = APP_DATA.hfRepoVerification || {};
  if (!m.hf_repo) return 'missing';
  for (const state of ['publicGguf', 'publicModelCard', 'gated', 'unavailable']) {
    if (verification[state] && verification[state][m.id] === m.hf_repo) return state;
  }
  return 'unclassified';
}

function hfVerificationDate() {
  const value = APP_DATA.hfRepoVerification && APP_DATA.hfRepoVerification.checkedAt;
  return value ? String(value).slice(0, 10) : 'the latest catalogue check';
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
  const tags = m.tags || [];
  if (tags.includes('code')) return 'Coding assistant';
  if (tags.includes('reasoning')) return 'Reasoning';
  if (tags.includes('vision')) return 'Vision tasks';
  if (tags.includes('speed')) return 'Fast chat';
  return 'General local assistant';
}

function modelType(m) {
  if (m.hosted_only) return 'Hosted/API reference';
  if (hfRepoState(m) === 'publicModelCard') return 'Public model card reference';
  if (hfRepoState(m) === 'gated') return 'Gated model card reference';
  if ((m.params || '').toLowerCase().includes('moe')) return 'Open-weight MoE';
  return 'Open-weight local LLM';
}

function isServerServingModel(m) {
  return !m.hosted_only && (
    /serving/i.test(m.recommended_quant || '')
    || (m.tags || []).includes('server-grade')
    || Number(m.min_ram || 0) >= 128
  );
}

function requiresCustomRuntime(m) {
  return !m.hosted_only && Boolean(m.custom_runtime);
}

function runtimeGoalAttrs(platform, m) {
  return `data-fast-goal="model_runtime_${esc(platform)}" data-fast-goal-source="model_detail" data-fast-goal-model="${esc(m.id)}" data-fast-goal-quant="${esc(m.recommended_quant || '')}"`;
}

function runOptionLink({platform, label, note, href, m, external = true, tone = ''}) {
  return `<a class="run-option ${tone}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ''} ${runtimeGoalAttrs(platform, m)}><span class="run-option-mark" aria-hidden="true">${esc(label.slice(0, 2))}</span><span><strong>${esc(label)}</strong><small>${esc(note)}</small></span><span class="run-option-arrow" aria-hidden="true">${external ? '&#8599;' : '&#8594;'}</span></a>`;
}

function runOptionCommand({platform, label, note, command, m, tone = ''}) {
  return `<button class="run-option ${tone}" type="button" data-copy-command="${esc(command)}" ${runtimeGoalAttrs(platform, m)}><span class="run-option-mark" aria-hidden="true">${esc(label.slice(0, 2))}</span><span><strong>${esc(label)}</strong><small>${esc(note)}</small></span><span class="run-option-copy" aria-hidden="true">Copy</span></button>`;
}

function runOptionsMarkup(m, hfState) {
  const cards = [];
  const hfUrl = m.hf_repo ? `https://huggingface.co/${m.hf_repo}` : '';
  const publicGguf = hfState === 'publicGguf';
  const desktopReady = publicGguf && !m.hosted_only && !isServerServingModel(m) && !requiresCustomRuntime(m);

  if (desktopReady) {
    cards.push(runOptionCommand({
      platform: 'lmstudio',
      label: 'LM Studio',
      note: `Copy download command, then choose ${m.recommended_quant}`,
      command: `lms get ${hfUrl}`,
      m,
      tone: 'featured'
    }));
    if (m.ollama_model) {
      cards.push(runOptionCommand({
        platform: 'ollama',
        label: 'Ollama',
        note: 'Copy the verified upstream run command',
        command: `ollama run ${m.ollama_model}`,
        m
      }));
    } else if (/^https:\/\/ollama\.com\/library\//.test(m.runtime_url || '')) {
      cards.push(runOptionLink({
        platform: 'ollama',
        label: 'Ollama',
        note: 'Open the verified Ollama library page',
        href: m.runtime_url,
        m
      }));
    }
    cards.push(runOptionCommand({
      platform: 'llamacpp',
      label: 'llama.cpp',
      note: `Copy the ${m.recommended_quant} launch command`,
      command: `llama-cli -hf ${m.hf_repo}:${m.recommended_quant}`,
      m
    }));
    cards.push(runOptionLink({
      platform: 'huggingface',
      label: 'Hugging Face',
      note: 'Inspect files and download another quant',
      href: hfUrl,
      m
    }));
    cards.push(runOptionLink({
      platform: 'localclaw',
      label: 'LocalClaw',
      note: 'Optional: connect it to your local AI workspace',
      href: '/pricing.html',
      m,
      external: false,
      tone: 'localclaw'
    }));
  } else if (requiresCustomRuntime(m)) {
    cards.push(runOptionLink({
      platform: 'official',
      label: 'Official runtime',
      note: m.custom_runtime,
      href: m.runtime_url,
      m,
      tone: 'featured'
    }));
    if (publicGguf && hfUrl) {
      cards.push(runOptionLink({
        platform: 'huggingface',
        label: 'Hugging Face',
        note: 'Inspect the verified artefacts',
        href: hfUrl,
        m
      }));
    }
    cards.push(runOptionLink({
      platform: 'localclaw',
      label: 'LocalClaw',
      note: 'Optional: connect the endpoint after setup',
      href: '/pricing.html',
      m,
      external: false,
      tone: 'localclaw'
    }));
  } else if (hfUrl) {
    cards.push(runOptionLink({
      platform: 'huggingface',
      label: hfState === 'gated' ? 'Gated model card' : 'Hugging Face',
      note: publicGguf ? 'Open the verified repository' : 'Check access and current artefacts',
      href: hfUrl,
      m,
      tone: 'featured'
    }));
  } else if (m.source_url) {
    cards.push(runOptionLink({
      platform: 'official',
      label: 'Model source',
      note: 'Open the upstream model page',
      href: m.source_url,
      m,
      tone: 'featured'
    }));
  }

  return `<div class="run-picker" data-model-run-options>
          <div class="run-picker-head"><div><span class="run-picker-label">Choose how to run it</span><p>${desktopReady ? 'Use your preferred runtime. LocalClaw is optional.' : requiresCustomRuntime(m) ? 'This model needs its documented runtime. No desktop compatibility is implied.' : 'Only verified paths are shown for this model.'}</p></div><a href="/llm-list.html" data-fast-goal="model_runtime_compare" data-fast-goal-source="model_detail" data-fast-goal-model="${esc(m.id)}">Compare models</a></div>
          <div class="run-grid">${cards.join('')}</div>
          <p class="run-copy-status" role="status" aria-live="polite"></p>
        </div>`;
}

function lmStudioLine(m) {
  if (m.hosted_only) return 'No local LM Studio install is available for this model today.';
  const state = hfRepoState(m);
  if (state === 'publicModelCard') return `Only the public model card was verified; no public GGUF file was verified in that repository. Open the model card to confirm current artefacts and supported runtimes. LocalClaw does not claim a one-click LM Studio install.`;
  if (state === 'gated') return `The model card is gated and may require account approval or licence acceptance. No public GGUF file was verified, so LocalClaw does not publish an LM Studio or one-click installation path.`;
  if (isServerServingModel(m)) return `Treat <code>${esc(m.search_term)}</code> as a server-grade catalogue target. Use the verified artefact with a compatible multi-GPU or distributed runtime and follow its upstream instructions; this is not a one-click desktop LM Studio recommendation.`;
  if (requiresCustomRuntime(m)) return `Use the official <a href="${esc(m.runtime_url)}" target="_blank" rel="noopener">${esc(m.custom_runtime)}</a> setup. The current low-bit files are not a stock LM Studio install.`;
  return `Use <code>${esc(m.search_term)}</code> as the catalogue search term in a compatible runtime, and confirm the available format on the upstream repository before download.`;
}

function similarLinks(current, allModels) {
  const currentTags = new Set(current.tags || []);
  return allModels
    .filter(model => model.id !== current.id && !model.hosted_only && hfRepoState(model) !== 'unavailable')
    .map(model => ({
      model,
      score: (model.family === current.family ? 100 : 0)
        + (model.tags || []).filter(tag => currentTags.has(tag)).length * 5
        - Math.abs((Number(model.min_ram) || 0) - (Number(current.min_ram) || 0)) / 8
    }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.model.name).localeCompare(String(right.model.name)))
    .slice(0, 8)
    .map(({ model }) => `<a href="/models/${esc(model.id)}.html">${esc(model.name)} <span>${esc(model.params)}</span></a>`)
    .join('');
}

function list(items, fallback) {
  const values = (items || []).slice(0, 6);
  if (!values.length) return `<li>${fallback}</li>`;
  return values.map(x => `<li>${esc(x)}</li>`).join('');
}

function tagsMarkup(m) {
  return (m.tags || []).slice(0, 8).map(t => `<span class="tag">${esc(t)}</span>`).join('');
}

function unavailableModelPage(m) {
  const url = `${BASE}/models/${encodeURIComponent(m.id)}.html`;
  const verificationDate = hfVerificationDate();
  const expectedRepository = m.hf_repo || 'No exact repository recorded';
  const searchQuery = `${m.search_term || m.name} GGUF`;
  const searchUrl = `https://huggingface.co/models?search=${encodeURIComponent(searchQuery)}&sort=downloads`;
  const title = `${m.name} repository status | LocalClaw`;
  const desc = metaDescription(`${m.name} is a preserved LocalClaw catalogue route. Its exact recorded repository was not publicly verified on ${verificationDate}, so no local install, RAM fit or score is claimed.`);
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${m.name} repository status`,
        url,
        description: desc,
        isPartOf: {'@type': 'WebSite', name: 'LocalClaw', url: BASE}
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
  <meta name="robots" content="noindex, follow, noarchive">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}
  <style>
    :root{--bg:#050505;--panel:#0d0d0d;--border:#2b2b2b;--primary:#ff453a;--text:#fff;--muted:#a1a1aa}*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 20% 12%,rgba(255,69,58,.13),transparent 28rem),#050505;color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6}body:before{content:"";position:fixed;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:80px 80px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.82),transparent 88%)}a{text-decoration:none}.site-nav{border-bottom:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.86);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}.nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;height:80px;display:flex;align-items:center;justify-content:space-between;gap:24px}.logo{display:flex;align-items:center;gap:12px;color:#fff}.logo-box{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--primary),#ea580c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(255,69,58,.45)}.logo-box img{width:28px;height:28px;border-radius:6px}.logo-text{font-family:'Space Grotesk',Inter,sans-serif;font-size:25px;font-weight:900;letter-spacing:-.04em;text-transform:uppercase}.logo-text span{color:var(--primary)}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{color:var(--muted);font:700 14px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.nav-links a:hover,.nav-links .active{color:#fff}.nav-links .pricing{color:var(--primary)}.mobile-links{display:none;border-top:1px solid var(--border);padding:12px 24px;background:#0f0f11}.mobile-links a{display:block;color:#d4d4d8;padding:10px 0}.hamb{display:none;background:none;border:1px solid transparent;color:var(--muted);font-size:24px}.wrap{max-width:980px;margin:0 auto;padding:38px 24px 80px}.breadcrumb{display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:var(--muted);font:700 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:22px}.breadcrumb a{color:#d4d4d8}.status{border:1px solid var(--border);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));box-shadow:0 28px 90px rgba(0,0,0,.42);overflow:hidden}.status-head{padding:36px;border-bottom:1px solid var(--border);background:radial-gradient(circle at 0 0,rgba(255,69,58,.2),transparent 42%)}.eyebrow{color:var(--primary);font:900 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.16em}.status h1{font-size:clamp(42px,8vw,76px);line-height:.96;letter-spacing:-.05em;margin:18px 0}.status h1 span{color:var(--primary)}.lead{max-width:760px;color:#dedee4;font-size:19px;margin:0}.status-body{padding:30px 36px}.notice{border-left:3px solid var(--primary);background:rgba(255,69,58,.08);padding:16px 18px;color:#f4f4f5}.facts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0}.fact{border:1px solid var(--border);border-radius:14px;background:#0b0b0b;padding:15px}.fact span{display:block;color:var(--muted);font:900 10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em}.fact strong,.fact code{display:block;margin-top:6px;color:#fff;font-weight:800;word-break:break-word}.status h2{font-size:24px;margin:28px 0 10px}.status ul{padding-left:20px;color:#d4d4d8}.status li{margin:7px 0}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,69,58,.5);border-radius:11px;background:var(--primary);color:#080808;padding:13px 17px;font:950 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.05em}.btn.secondary{background:#111;color:#fff;border-color:rgba(255,255,255,.18)}@media(max-width:940px){.nav-inner{height:64px}.nav-links{display:none}.hamb{display:block}.mobile-links.open{display:block}}@media(max-width:620px){.wrap{padding:24px 16px 54px}.status-head,.status-body{padding:24px}.facts{grid-template-columns:1fr}.btn{width:100%}}
  </style>
</head>
<body data-preserved-model-route="${esc(m.id)}">
  ${siteNavigation('llm')}
  <main class="wrap">
    <div class="breadcrumb"><a href="/">LocalClaw</a><span>/</span><a href="/llm-list.html">LLM</a><span>/</span><span>${esc(m.name)}</span></div>
    <article class="status" data-hf-repo-status="unavailable">
      <header class="status-head">
        <div class="eyebrow">Preserved catalogue route · verification pending</div>
        <h1>${esc(m.name)}</h1>
        <p class="lead">LocalClaw could not verify the exact recorded Hugging Face repository as publicly reachable during the anonymous catalogue audit on ${esc(verificationDate)}.</p>
      </header>
      <div class="status-body">
        <p class="notice"><strong>This is a tombstone, not an active local-model recommendation.</strong> The URL is retained so existing links do not break while the upstream record is investigated.</p>
        <div class="facts">
          <div class="fact"><span>Preserved LocalClaw ID</span><strong>${esc(m.id)}</strong></div>
          <div class="fact"><span>Exact repository not verified</span><code>${esc(expectedRepository)}</code></div>
        </div>
        <h2>What LocalClaw intentionally does not claim</h2>
        <ul>
          <li>No downloadable local checkpoint or install path is asserted.</li>
          <li>No RAM fit, quantization availability, capability rating or LocalClaw score is shown.</li>
          <li>This route is excluded from the homepage index, score leaders, AI-readable model lists and sitemaps.</li>
        </ul>
        <h2>Look for a current upstream release</h2>
        <p>Search Hugging Face and verify the publisher, licence, files and runtime support before downloading anything.</p>
        <div class="actions">
          <a class="btn" href="${esc(searchUrl)}" target="_blank" rel="noopener">Search Hugging Face</a>
          <a class="btn secondary" href="/">Browse verified local models</a>
        </div>
      </div>
    </article>
  </main>
</body>
</html>`;
}

function modelPage(m, d, allModels) {
  const hfState = hfRepoState(m);
  if (hfState === 'unavailable') return unavailableModelPage(m);
  const hasPublicGguf = hfState === 'publicGguf';
  const sourceOnly = hfState === 'publicModelCard' || hfState === 'gated';
  const sourceStatusLabel = hfState === 'gated' ? 'Gated model card' : 'Public model card';
  const url = `${BASE}/models/${encodeURIComponent(m.id)}.html`;
  const localTitle = requiresCustomRuntime(m)
    ? `${m.name} local AI: custom runtime | LocalClaw`
    : `${m.name} local AI: RAM + LM Studio | LocalClaw`;
  const compactLocalTitle = `${m.name} local AI | LocalClaw`;
  const shortTitle = `${m.name} | LocalClaw`;
  const titleCandidate = m.hosted_only
    ? `${m.name} API model specs | LocalClaw`
    : sourceOnly
      ? `${m.name} ${hfState === 'gated' ? 'gated' : 'public'} model card status | LocalClaw`
    : isServerServingModel(m)
      ? `${m.name} server-grade local AI | LocalClaw`
    : localTitle;
  const title = titleCandidate.length > 60
    ? (compactLocalTitle.length > 60 ? shortTitle : compactLocalTitle)
    : titleCandidate;
  const desc = metaDescription(m.hosted_only
    ? `${m.name}: hosted/API LLM. Specs, catalogue capability ratings, use cases and current availability notes for local AI comparison.`
    : hfState === 'publicModelCard'
      ? `${m.name}: public upstream model card verified, but no public GGUF file or one-click local install was verified in that repository.`
      : hfState === 'gated'
        ? `${m.name}: gated upstream model card. Access approval may be required; no public GGUF or one-click local install is claimed.`
    : isServerServingModel(m)
      ? `${m.name}: ${m.params} server-grade open model guide with RAM requirements, runtime notes, catalogue ratings and local serving caveats.`
      : requiresCustomRuntime(m)
        ? `${m.name}: ${m.params} local AI guide with RAM requirements, ${m.recommended_quant}, catalogue ratings and its required ${m.custom_runtime} runtime.`
    : `${m.name}: ${m.params} local AI model guide with RAM requirements, ${m.recommended_quant} quantization, catalogue ratings, use cases and LM Studio setup.`);
  const color = familyColor(m);
  const score = localClawCatalogueScore(m);
  const catalogueFacts = list([
    `Family: ${m.family || 'Unknown'}`,
    `Parameters: ${m.params || 'Unknown'}`,
    `Recommended quantization: ${m.recommended_quant || 'See upstream'}`,
    `Catalogue minimum RAM: ${m.hosted_only ? 'API only' : `${m.min_ram} GB`}`,
    `Catalogue model size: ${m.hosted_only ? 'Hosted' : `${m.size_gb} GB`}`,
    `Tags: ${(m.tags || []).join(', ') || 'None listed'}`
  ], 'See the upstream repository for model details.');
  const limitations = list([
    'Catalogue RAM is a minimum estimate, not a guarantee for every context length or runtime.',
    'Speed and memory use vary by quantization, backend, context length and system headroom.',
    'Verify architecture, licence and usage restrictions in the linked upstream material before deployment.'
  ], 'Verify the upstream model card before use.');
  const similar = similarLinks(m, allModels);
  const tags = tagsMarkup(m);
  const ramLabel = m.hosted_only ? 'API only' : `${esc(m.min_ram)} GB`;
  const sizeLabel = m.hosted_only ? 'Hosted' : `${esc(m.size_gb)} GB`;
  const sourceLine = m.source_url
    ? `<a href="${esc(m.source_url)}" target="_blank" rel="noopener">Model source</a>`
    : '';
  const hfDirectUrl = `https://huggingface.co/${esc(m.hf_repo)}`;
  const hfLine = hfState === 'publicGguf'
    ? `<a href="${hfDirectUrl}" target="_blank" rel="noopener" data-hf-repo-status="public-gguf">Public GGUF repository (verified ${esc(hfVerificationDate())}): ${esc(m.hf_repo)}</a>`
    : hfState === 'publicModelCard'
      ? `<a href="${hfDirectUrl}" target="_blank" rel="noopener" data-hf-repo-status="public-model-card">Public model card (no GGUF file verified ${esc(hfVerificationDate())}): ${esc(m.hf_repo)}</a>`
      : hfState === 'gated'
        ? `<a href="${hfDirectUrl}" target="_blank" rel="noopener" data-hf-repo-status="gated">Gated model card (access terms apply; no public GGUF verified ${esc(hfVerificationDate())}): ${esc(m.hf_repo)}</a>`
        : m.hf_repo
          ? `<span data-hf-repo-status="unavailable">Hugging Face repository not publicly verified on ${esc(hfVerificationDate())}; verify the current publisher. <a href="https://huggingface.co/models?search=${encodeURIComponent(`${m.search_term || m.name} GGUF`)}&amp;sort=downloads" target="_blank" rel="noopener">Search Hugging Face for current quantizations</a>.</span>`
          : '';
  const detailSourceLine = [
    ['Upstream release', d.official_blog],
    ['Paper or model card', d.paper_url],
    ['Licence text', d.license_url]
  ].filter(([, href]) => href).map(([label, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`).join('');
  const hasModelDetailSource = Boolean(m.source_url || d.official_blog || d.paper_url);
  const verifiedDeveloper = hasModelDetailSource ? d.developer : '';
  const verifiedLicense = d.license_url ? d.license : '';
  const verifiedTechnicalDetails = Boolean(d.official_blog || d.paper_url);
  const runOptions = runOptionsMarkup(m, hfState);
  const schemaMainEntity = sourceOnly
    ? {
        '@type': 'WebPage',
        name: `${m.name} source and local availability status`,
        url,
        description: desc,
        about: {'@type': 'Thing', name: m.name},
        isPartOf: {'@type': 'WebSite', name: 'LocalClaw', url: BASE}
      }
    : {
        '@type': 'SoftwareApplication',
        name: m.name,
        applicationCategory: 'AIApplication',
        operatingSystem: 'macOS, Windows, Linux',
        url,
        description: desc,
        softwareVersion: m.released || undefined,
        memoryRequirements: m.hosted_only ? 'Hosted API only' : `${m.min_ram} GB RAM minimum`,
        license: d.license_url || undefined,
        creator: verifiedDeveloper ? {'@type': 'Organization', name: verifiedDeveloper, url: d.developer_url} : undefined
      };
  const faqEntities = sourceOnly
    ? [
        {
          '@type': 'Question',
          name: `What source was verified for ${m.name}?`,
          acceptedAnswer: {'@type': 'Answer', text: hfState === 'gated' ? `A gated Hugging Face model card was verified on ${hfVerificationDate()}. Access approval or licence acceptance may be required, and no public GGUF file was verified.` : `A public Hugging Face model card was verified on ${hfVerificationDate()}, but no public GGUF file was verified in that repository.`}
        },
        {
          '@type': 'Question',
          name: `Does LocalClaw provide a one-click install for ${m.name}?`,
          acceptedAnswer: {'@type': 'Answer', text: `No. LocalClaw links to the ${hfState === 'gated' ? 'gated' : 'public'} model card but does not claim an LM Studio, GGUF or one-click installation path for this record.`}
        }
      ]
    : [
        {
          '@type': 'Question',
          name: `Can ${m.name} run locally?`,
          acceptedAnswer: {'@type': 'Answer', text: m.hosted_only ? `${m.name} is hosted/API only in the LocalClaw database.` : isServerServingModel(m) ? `${m.name} can run locally only on server-grade multi-GPU hardware. LocalClaw lists it as a distributed serving target, not a desktop GGUF install.` : requiresCustomRuntime(m) ? `${m.name} can run locally with at least ${m.min_ram} GB RAM using the official ${m.custom_runtime} runtime. Its low-bit files are not a stock LM Studio install today.` : `${m.name} can run locally with at least ${m.min_ram} GB RAM. LocalClaw recommends ${m.recommended_quant} quantization.`}
        },
        {
          '@type': 'Question',
          name: `What is ${m.name} best for?`,
          acceptedAnswer: {'@type': 'Answer', text: `${m.name} is tagged in the LocalClaw catalogue for ${primaryUse(m, d)}. Verify task performance on your own workload.`}
        }
      ];
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      schemaMainEntity,
      {
        '@type': 'FAQPage',
        mainEntity: faqEntities
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
  const socialDescriptor = sourceOnly ? `${sourceStatusLabel.toLowerCase()} status` : m.hosted_only ? 'API model' : 'local AI model';
  const heroChips = sourceOnly
    ? `<span class="chip hot">${esc(sourceStatusLabel)}</span><span class="chip">No public GGUF verified</span><span class="chip">${esc(m.params)}</span><span class="chip">${esc(m.released || 'Release unknown')}</span>`
    : `<span class="chip hot">${esc(hardwareTier(m))}</span><span class="chip">${ramLabel} RAM</span><span class="chip">${esc(m.recommended_quant)}</span><span class="chip">${esc(primaryUse(m, d))}</span>`;
  const keySpecsSection = sourceOnly
    ? `<section class="specs" aria-label="Verified model source status">
      <div class="spec-card"><div class="k">Source status</div><div class="v">${esc(sourceStatusLabel)}</div></div>
      <div class="spec-card"><div class="k">Public GGUF</div><div class="v">Not verified</div></div>
      <div class="spec-card"><div class="k">Parameters</div><div class="v">${esc(m.params)}</div></div>
      <div class="spec-card"><div class="k">Access</div><div class="v">${hfState === 'gated' ? 'Approval required' : 'Public card'}</div></div>
    </section>`
    : `<section class="specs" aria-label="Key local AI model specs">
      <div class="spec-card"><div class="k">Parameters</div><div class="v">${esc(m.params)}</div></div>
      <div class="spec-card"><div class="k">Minimum RAM</div><div class="v">${ramLabel}</div></div>
      <div class="spec-card"><div class="k">Model size</div><div class="v">${sizeLabel}</div></div>
      <div class="spec-card"><div class="k">Quantization</div><div class="v">${esc(m.recommended_quant)}</div></div>
    </section>`;
  const personalFitSection = sourceOnly ? '' : `<section class="personal-fit" hidden data-localclaw-model-context data-model-id="${esc(m.id)}" aria-live="polite"></section>`;
  const deploymentSection = sourceOnly
    ? `<section class="section" data-source-only-status="${hfState}">
      <h2>${hfState === 'gated' ? 'Access and source status' : 'Source availability'}</h2>
      <div class="install-steps">
        <div class="step"><div class="step-num">01</div><strong>Open the model card</strong><span>Use the verified upstream card as the source of truth for this record.</span></div>
        <div class="step"><div class="step-num">02</div><strong>${hfState === 'gated' ? 'Request access' : 'Inspect current files'}</strong><span>${hfState === 'gated' ? 'Account approval or licence acceptance may be required before the files can be inspected.' : 'No public GGUF file was verified in the repository during the catalogue audit.'}</span></div>
        <div class="step"><div class="step-num">03</div><strong>Confirm a supported runtime</strong><span>Choose a local runtime only after verifying the exact artefact, licence and hardware requirements upstream.</span></div>
      </div>
    </section>`
    : `<section class="section">
      <h2>${isServerServingModel(m) ? 'Deployment path' : 'Install path'}</h2>
      <div class="install-steps">
        <div class="step"><div class="step-num">01</div><strong>Check RAM fit</strong><span>${m.hosted_only ? 'API only today.' : isServerServingModel(m) ? `Server-grade target. Plan for ${esc(m.min_ram)} GB class multi-GPU memory.` : `Minimum ${esc(m.min_ram)} GB RAM. Start with the ${esc(m.recommended_quant)} quant.`}</span></div>
        <div class="step"><div class="step-num">02</div><strong>Load the model</strong><span>${m.hosted_only ? 'Use the API provider instead of local GGUF.' : isServerServingModel(m) ? `Use ${esc(m.search_term)} only with a compatible server-grade or distributed runtime; confirm the exact artefact and upstream instructions first.` : requiresCustomRuntime(m) ? `Follow the official ${esc(m.custom_runtime)} instructions. Stock LM Studio support is not confirmed.` : `Search ${esc(m.search_term)} in LM Studio.`}</span></div>
        <div class="step"><div class="step-num">03</div><strong>Control locally</strong><span>Use LocalClaw to manage models, agents, chat, channels and scheduled OpenClaw work.</span></div>
      </div>
    </section>`;
  const hardwareFitSection = sourceOnly ? '' : `<section class="section">
      <h2>This model fits these next steps</h2>
      <p class="muted">Hardware fit is based on LocalClaw's RAM tier, model size and quantization metadata. Always leave memory headroom for your OS and runtime.</p>
      <div class="hardware-fit">
        ${hardwareMatches(m).map(([label, href, note]) => `<a href="${esc(href)}"><small>${esc(note)}</small>${esc(label)}</a>`).join('')}
      </div>
    </section>`;
  const nextStepsSection = sourceOnly
    ? `<section class="section"><h2>Where to go next</h2><div class="next">
        <a href="${hfDirectUrl}" target="_blank" rel="noopener"><small>Upstream</small>Open the ${hfState === 'gated' ? 'gated' : 'public'} model card</a>
        <a href="/llm-list.html"><small>Verified artefacts</small>Compare models with public GGUF files</a>
        <a href="/"><small>Directory</small>Browse The Local Model Index</a>
      </div></section>`
    : `<section class="section">
      <h2>Where to go next</h2>
      <div class="next">
        <a href="${ramGuide(m)}"><small>RAM guide</small>Find models for this memory tier</a>
        <a href="/computers.html"><small>Hardware</small>See computers for local AI</a>
        <a href="/pricing.html"><small>LocalClaw</small>Control OpenClaw from one native app</a>
      </div>
    </section>`;

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
  <meta property="og:title" content="${esc(m.name)} ${esc(socialDescriptor)} | LocalClaw">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(m.name)} ${esc(socialDescriptor)} | LocalClaw">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${BASE}/images/twitter-card.jpg?v=3">
  <link rel="icon" type="image/png" href="/images/favicon.png?v=20260211g">
  <link rel="stylesheet" href="/css/community-ratings-20260802a.css?v=20260802a">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}
  <style>
    :root{--bg:#050505;--panel:#0d0d0d;--card:#111;--card2:#171717;--border:#262626;--border2:#3a3a3a;--primary:#ff453a;--orange:#ea580c;--text:#fff;--muted:#a1a1aa;--soft:#d4d4d8;--green:#22c55e;--blue:#3b82f6}*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:radial-gradient(circle at 18% 10%,rgba(255,69,58,.12),transparent 26rem),linear-gradient(180deg,#050505,#070707 42%,#050505);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.55}body:before{content:"";position:fixed;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:80px 80px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 85%)}a{text-decoration:none}.site-nav{border-bottom:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.82);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}.nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;height:80px;display:flex;align-items:center;justify-content:space-between;gap:24px}.logo{display:flex;align-items:center;gap:12px;color:#fff}.logo-box{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--primary),var(--orange));display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(255,69,58,.45)}.logo-box img{width:28px;height:28px;border-radius:6px}.logo-text{font-family:'Space Grotesk',Inter,sans-serif;font-size:25px;font-weight:900;letter-spacing:-.04em;text-transform:uppercase}.logo-text span{color:var(--primary)}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{color:var(--muted);font:700 14px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.nav-links a:hover,.nav-links .active{color:#fff}.nav-links .pricing{color:var(--primary)}.mobile-links{display:none;border-top:1px solid var(--border);padding:12px 24px;background:#0f0f11}.mobile-links a{display:block;color:#d4d4d8;padding:10px 0}.hamb{display:none;background:none;border:1px solid transparent;color:var(--muted);font-size:24px}.wrap{max-width:1180px;margin:0 auto;padding:34px 24px 64px}.breadcrumb{display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:var(--muted);font:700 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:22px}.breadcrumb a{color:#d4d4d8}.breadcrumb a:hover{color:#fff}.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:24px;align-items:stretch;margin-bottom:24px}.hero-copy,.hero-panel,.section,.spec-card,.model-card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border:1px solid var(--border);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.38)}.hero-copy{padding:34px;position:relative;overflow:hidden}.hero-copy:before{content:"";position:absolute;inset:-1px;background:radial-gradient(circle at 0 0,rgba(255,69,58,.22),transparent 42%);pointer-events:none}.eyebrow{position:relative;color:var(--primary);font:900 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.18em;display:flex;gap:10px;align-items:center}.eyebrow:before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 14px currentColor}.title{position:relative;font-size:clamp(44px,7vw,86px);line-height:.92;margin:18px 0 16px;font-weight:950;letter-spacing:-.055em}.title span{color:var(--primary)}.desc{position:relative;max-width:760px;color:#d6d6dd;font-size:19px;margin:0}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.chip{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);border-radius:999px;color:#d7d7dd;padding:7px 11px;font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}.chip.hot{border-color:rgba(255,69,58,.45);color:var(--primary);background:rgba(255,69,58,.09)}.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid rgba(255,69,58,.5);background:var(--primary);color:#050505;font:950 13px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.05em;padding:14px 18px;border-radius:12px;box-shadow:6px 6px 0 rgba(154,25,18,.5)}.btn:hover{transform:translateY(-1px);filter:brightness(1.06)}.btn.secondary{background:#111;color:#fff;border-color:rgba(255,255,255,.18);box-shadow:none}.hero-panel{padding:22px;display:flex;flex-direction:column;gap:16px}.score-card{flex:1;display:flex;flex-direction:column;justify-content:space-between;border:1px solid ${color}66;border-radius:20px;padding:22px;background:radial-gradient(circle at 0 0,${color}26,transparent 45%),#0b0b0b}.score-label{font:900 12px ui-monospace,monospace;color:#b8b8c1;text-transform:uppercase;letter-spacing:.12em}.score{font-size:58px;line-height:1;font-weight:950;letter-spacing:-.05em}.score small{font-size:16px;color:var(--muted);letter-spacing:0}.score-caption{color:#d4d4d8;margin-top:10px}.panel-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mini{border:1px solid var(--border);background:#101010;border-radius:16px;padding:14px}.mini .k{font:800 10px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.mini .v{font-weight:900;font-size:18px;margin-top:4px}.specs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.spec-card{border-radius:18px;padding:18px}.spec-card .k{font:900 11px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.spec-card .v{font-size:24px;font-weight:950;margin-top:4px;letter-spacing:-.03em}.section{padding:26px;margin-top:18px}h2{font-size:28px;line-height:1.1;margin:0 0 16px;letter-spacing:-.03em}.section p{color:#d4d4d8;margin:10px 0}.muted{color:var(--muted)!important}.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}.list{margin:0;padding-left:18px}.list li{color:#d4d4d8;margin:8px 0}.install-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.step{border:1px solid var(--border);background:#0d0d0d;border-radius:16px;padding:16px}.step-num{color:var(--primary);font:950 12px ui-monospace,monospace;letter-spacing:.14em}.step strong{display:block;margin-top:6px}.step span{display:block;color:var(--muted);font-size:14px;margin-top:5px}.bars{display:grid;gap:12px}.bar-row{display:grid;grid-template-columns:92px 1fr 32px;gap:12px;align-items:center}.bar-row span{font:800 12px ui-monospace,monospace;color:var(--muted);text-transform:uppercase}.track{height:8px;background:#242424;border-radius:99px;overflow:hidden}.fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--primary),#ff8a64)}.tag{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.1);background:#161616;border-radius:999px;padding:6px 10px;margin:4px;color:#d4d4d8;font:800 12px ui-monospace,monospace}.tag:before{content:"#";color:var(--primary);margin-right:4px}.meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.meta{border:1px solid var(--border);border-radius:14px;background:#0e0e0e;padding:14px}.meta .k{font:900 10px ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.meta .v{color:#fff;font-weight:800;margin-top:4px;word-break:break-word}.similar{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.similar a{display:flex;justify-content:space-between;gap:8px;border:1px solid var(--border);background:#0d0d0d;color:#fff;border-radius:14px;padding:12px;font-weight:800}.similar a:hover{border-color:rgba(255,69,58,.5);box-shadow:0 0 24px rgba(255,69,58,.1)}.similar span{color:var(--muted);font:800 11px ui-monospace,monospace}.next{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.next a{border:1px solid var(--border);border-radius:16px;background:#0d0d0d;color:#fff;padding:16px;font-weight:900}.next small{display:block;color:var(--muted);font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}.hardware-fit{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.hardware-fit a{border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));color:#fff;padding:16px;font-weight:900}.hardware-fit a:hover{border-color:rgba(255,69,58,.48);box-shadow:0 0 28px rgba(255,69,58,.09)}.hardware-fit small{display:block;color:var(--muted);font:800 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}code{background:#18181b;border:1px solid #27272a;padding:2px 6px;border-radius:6px;color:#fff}.source-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.source-links a,.source-links code{color:#fff;border:1px solid var(--border);background:#111;padding:8px 10px;border-radius:10px;font:800 12px ui-monospace,monospace}@media(max-width:940px){.nav-inner{height:64px}.nav-links{display:none}.hamb{display:block}.mobile-links.open{display:block}.hero,.cols,.specs,.install-steps,.next,.hardware-fit{grid-template-columns:1fr}.panel-grid,.meta-grid,.similar{grid-template-columns:1fr 1fr}.wrap{padding:24px 16px 48px}.hero-copy{padding:24px}.title{font-size:clamp(42px,12vw,72px)}}@media(max-width:560px){.panel-grid,.meta-grid,.similar{grid-template-columns:1fr}.btn{width:100%}.score{font-size:48px}.bar-row{grid-template-columns:76px 1fr 28px}}
  </style>
  <style>
    .personal-fit{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:0 0 20px;padding:20px 22px;border:1px solid rgba(52,211,153,.32);border-radius:18px;background:linear-gradient(100deg,rgba(16,185,129,.11),rgba(13,13,13,.96) 46%);box-shadow:0 18px 50px rgba(0,0,0,.28)}.personal-fit[hidden]{display:none!important}.personal-fit[data-fit="limited"]{border-color:rgba(96,165,250,.34);background:linear-gradient(100deg,rgba(59,130,246,.1),rgba(13,13,13,.96) 46%)}.personal-fit[data-fit="too-large"]{border-color:rgba(255,69,58,.38);background:linear-gradient(100deg,rgba(255,69,58,.1),rgba(13,13,13,.96) 46%)}.personal-fit-kicker{margin:0 0 5px!important;color:#6ee7b7!important;font:900 10px ui-monospace,monospace!important;letter-spacing:.12em;text-transform:uppercase}.personal-fit[data-fit="too-large"] .personal-fit-kicker{color:var(--primary)!important}.personal-fit h2{margin:0 0 5px;font-size:21px}.personal-fit p{margin:0;color:var(--muted);font-size:13px}.personal-fit-actions{display:flex;align-items:center;gap:9px;flex-shrink:0}.personal-fit-actions button,.personal-fit-actions a{min-height:40px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.16);border-radius:9px;background:#111;color:#fff;padding:0 13px;font:900 10px ui-monospace,monospace;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}.personal-fit-actions button{border-color:rgba(255,69,58,.48);color:var(--primary)}.personal-fit-actions button:disabled{cursor:wait;opacity:.65}@media(max-width:700px){.personal-fit{align-items:stretch;flex-direction:column}.personal-fit-actions{align-items:stretch;flex-direction:column}.personal-fit-actions button,.personal-fit-actions a{width:100%}}
  </style>
  <style>
    .run-picker{position:relative;margin-top:26px;padding:18px;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:rgba(5,5,5,.72);box-shadow:0 18px 45px rgba(0,0,0,.24)}.run-picker-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:13px}.run-picker-label{display:block;color:#fff;font:950 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.run-picker-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.run-picker-head>a{flex-shrink:0;color:#d4d4d8;font:850 10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid rgba(255,255,255,.2)}.run-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.run-option{width:100%;min-width:0;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:10px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#111;color:#fff;padding:11px;box-shadow:none;cursor:pointer;font:inherit}.run-option:hover,.run-option:focus-visible{border-color:rgba(255,255,255,.32);background:#171717;transform:translateY(-1px);outline:none}.run-option.featured{border-color:rgba(255,69,58,.5);background:linear-gradient(135deg,rgba(255,69,58,.14),#111 55%)}.run-option.localclaw{border-style:dashed}.run-option-mark{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.15);border-radius:9px;background:#080808;color:var(--primary);font:950 10px ui-monospace,monospace;text-transform:uppercase}.run-option strong{display:block;color:#fff;font-size:13px;line-height:1.2}.run-option small{display:block;margin-top:3px;color:var(--muted);font-size:10px;line-height:1.3}.run-option-copy,.run-option-arrow{color:#a1a1aa;font:850 9px ui-monospace,monospace;text-transform:uppercase}.run-option.is-copied{border-color:rgba(52,211,153,.55)}.run-option.is-copied .run-option-copy{color:#6ee7b7}.run-copy-status{min-height:16px;margin:9px 0 -3px!important;color:#6ee7b7!important;font:750 10px ui-monospace,monospace;word-break:break-word}@media(max-width:700px){.run-picker-head{align-items:stretch;flex-direction:column}.run-picker-head>a{align-self:flex-start}.run-grid{grid-template-columns:1fr}.run-option{min-height:58px}}
  </style>
</head>
<body>
  ${siteNavigation('llm')}
  <main class="wrap">
    <div class="breadcrumb"><a href="/">LocalClaw</a><span>/</span><a href="/llm-list.html">LLM</a><span>/</span><span>${esc(m.name)}</span></div>
    <header class="hero">
      <section class="hero-copy">
        <div class="eyebrow">${esc(modelType(m))}</div>
        <h1 class="title">${esc(m.name).replace(/\s*\(([^)]+)\)$/, ' <span>($1)</span>')}</h1>
        <p class="desc"><strong>Catalogue summary:</strong> ${esc(m.description)}</p>
        <p class="muted">Repository editorial metadata; verify comparative claims in the linked upstream material.</p>
        <div class="chips">${heroChips}</div>
        ${runOptions}
      </section>
      <aside class="hero-panel">
        <div class="score-card">
          <div>
            <div class="score-label">${m.hosted_only ? 'Local status' : 'LocalClaw catalogue score'}</div>
            <div class="score">${m.hosted_only ? 'API' : `${score}<small>/10</small>`}</div>
            <p class="score-caption">${m.hosted_only ? hardwareSentence(m) : 'Editorial catalogue rubric: 38% quality, 24% coding, 24% reasoning and 14% speed. Community stars and hardware fit remain separate.'}</p>
          </div>
        </div>
        <div data-community-rating data-model-id="${esc(m.id)}" data-rating-mode="full"></div>
        <div class="panel-grid">
          <div class="mini"><div class="k">Family</div><div class="v" style="color:${color}">${esc(m.family || 'Unknown')}</div></div>
          <div class="mini"><div class="k">Released</div><div class="v">${esc(m.released || 'Unknown')}</div></div>
        </div>
      </aside>
    </header>
${keySpecsSection}
${personalFitSection}
    <section class="section">
      <h2>${sourceOnly ? 'Verified source status' : `Can ${esc(m.name)} run locally?`}</h2>
      <p>${hardwareSentence(m)}</p>
      <p>${lmStudioLine(m)}</p>
      <div class="source-links">${sourceLine}${hfLine}${detailSourceLine}</div>
      <div style="margin-top:16px">${tags}</div>
    </section>
    ${deploymentSection}
    <section class="section cols">
      <div><h2>Catalogue record</h2><ul class="list">${catalogueFacts}</ul></div>
      <div><h2>Practical limits</h2><ul class="list">${limitations}</ul></div>
    </section>
    <section class="section cols">
      <div><h2>Catalogue tags</h2><ul class="list">${list(m.tags, 'No task tags are listed; check the upstream model card.')}</ul></div>
      <div>
        <h2>Capability profile</h2>
        <p class="muted">Repository catalogue ratings used by LocalClaw's editorial rubric. They are not a standardized third-party benchmark.</p>
        <div class="bars">
          ${['speed', 'quality', 'coding', 'reasoning'].map(k => `<div class="bar-row"><span>${k}</span><div class="track"><div class="fill" style="width:${pct(m.benchmarks?.[k])}%"></div></div><strong>${m.benchmarks?.[k] || '?'}</strong></div>`).join('')}
        </div>
      </div>
    </section>
    <section class="section">
      <h2>Technical notes</h2>
      <div class="meta-grid">
        <div class="meta"><div class="k">Developer</div><div class="v">${esc(verifiedDeveloper || 'See upstream repository')}</div></div>
        <div class="meta"><div class="k">License</div><div class="v">${esc(verifiedLicense || 'See upstream repository')}</div></div>
        <div class="meta"><div class="k">Context window</div><div class="v">${verifiedTechnicalDetails && d.context_window ? `${fmt(d.context_window)} tokens` : 'See upstream repository'}</div></div>
        <div class="meta"><div class="k">Architecture</div><div class="v">${esc(verifiedTechnicalDetails && d.architecture ? d.architecture : 'See upstream repository')}</div></div>
      </div>
    </section>
${hardwareFitSection}
${similar ? `    <section class="section"><h2>Related catalogue entries</h2><p class="muted">Linked mechanically by family, shared tags and nearby RAM tier; this is not a quality ranking.</p><div class="similar">${similar}</div></section>` : ''}
${nextStepsSection}
  </main>
  <script>window.LOCALCLAW_MODEL=${JSON.stringify(m).replace(/</g, '\\u003c')};</script>
  <script src="/js/machine-compat-20260802a.js?v=20260802b"></script>
  <script src="/js/account-context-20260802b.js?v=20260802b"></script>
  <script src="/js/model-account-context-20260802b.js?v=20260802b"></script>
  <script src="/js/community-ratings-20260802a.js?v=20260802b"></script>
  <script src="/js/model-run-options-20260820a.js?v=20260820b"></script>
</body>
</html>`;
}

const APP_DATA = loadAppData();
const MODEL_DETAILS = loadModelDetails();
const uniqueModels = Array.from(new Map(APP_DATA.models.map(model => [model.id, model])).values());
const outDir = path.join(ROOT, 'models');

fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});

for (const m of uniqueModels) {
  fs.writeFileSync(path.join(outDir, `${slug(m.id)}.html`), modelPage(m, MODEL_DETAILS[m.id] || {}, uniqueModels));
}

const indexableModels = uniqueModels.filter(model => hfRepoState(model) !== 'unavailable');
const cards = indexableModels.map(m => `<li><a href="/models/${esc(m.id)}.html"><strong>${esc(m.name)}</strong></a> <span>${esc(m.params)} · ${m.hosted_only ? 'API only' : `${esc(m.min_ram)} GB RAM`} · ${esc(m.recommended_quant)}</span></li>`).join('\n');

fs.writeFileSync(path.join(outDir, 'index.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>All Local AI Model Pages | LocalClaw</title><meta name="description" content="Index of all static LocalClaw model pages: local LLM specs, RAM requirements, quantization and LM Studio setup."><meta name="robots" content="index, follow"><link rel="canonical" href="${BASE}/models/">${tracking}<style>body{background:#050505;color:#fff;font-family:Inter,system-ui,sans-serif;margin:0;line-height:1.6}.models-index{max-width:1000px;margin:0 auto;padding:32px}.models-index a{color:#ff453a}.models-index li{margin:10px 0;padding:12px;border:1px solid #27272a;border-radius:12px;list-style:none;background:#0f0f11}.models-index span{color:#a1a1aa}</style></head><body>${siteNavigation('llm')}<main class="models-index"><p><a href="/">Back to LocalClaw</a></p><h1>All Local AI Model Pages</h1><p>Static, indexable pages for LocalClaw's local LLM catalogue.</p><ul>${cards}</ul></main></body></html>`);

normalizeDirectory(outDir);
console.log(`Generated ${uniqueModels.length} unique static model pages in models/ (${uniqueModels.length - indexableModels.length} preserved noindex tombstones).`);
