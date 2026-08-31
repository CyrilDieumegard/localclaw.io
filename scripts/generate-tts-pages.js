const fs = require('fs');
const path = require('path');
const { normalizeDirectory } = require('./normalize-public-urls');
const { siteNavigation, siteNavAssets } = require('./site-navigation');
const { installChoiceStyles, runtimeLaunchAssistStyles, speechInstallPicker } = require('./install-choice-ui');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://localclaw.io';
const CHECK_ONLY = process.argv.includes('--check');
const externalMediaContext = {};
vm.createContext(externalMediaContext);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/external-media-catalog.js'), 'utf8'), externalMediaContext);
const externalMedia = externalMediaContext.LOCAL_AI_EXTERNAL_MEDIA || {};
function isLocalSpeechModel(model) {
  return !model.delivery;
}

function isUnverifiedSpeechRecord(model) {
  return model.delivery === 'unverified';
}

function isRemoteSpeechService(model) {
  return model.delivery === 'online' || model.delivery === 'api';
}

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

function cleanGeneratedHtml(html) {
  return `${String(html).replace(/[ \t]+$/gm, '').replace(/\n+$/, '')}\n`;
}

const pct = n => Math.max(0, Math.min(100, Number(n || 0) * 10));
const fmtNum = n => Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-US') : esc(n || 'Unknown');
const niceList = items => (items || []).filter(Boolean).join(', ') || 'Not specified';

const tracking = `
  <!-- TRACKING: DataFast Analytics -->
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <!-- Microsoft Clarity - session recordings & heatmaps (bounce diagnosis) -->
  <script src="/js/clarity.js" defer></script>
  ${siteNavAssets()}`;

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
  if (isUnverifiedSpeechRecord(model)) return 'Unverified speech reference';
  if (!isLocalSpeechModel(model)) return model.id === 'edge-tts' ? 'Online TTS interface' : 'Vendor API speech reference';
  if (model.isAsr) return 'Local ASR model';
  if (model.isOrchestrator) return 'Local speech app';
  return 'Local TTS model';
}

function modelTask(model) {
  if (isUnverifiedSpeechRecord(model)) return 'preserved catalogue route without a verified checkpoint';
  if (!isLocalSpeechModel(model)) return model.id === 'edge-tts' ? 'online text-to-speech access' : 'vendor-hosted speech generation';
  if (model.isAsr) return 'speech-to-text transcription';
  if (model.isOrchestrator) return 'local voice workflow orchestration';
  return 'text-to-speech generation';
}

function audioCatalogueScore(model) {
  if (isUnverifiedSpeechRecord(model)) return null;
  const quality = Number(model.quality) || 0;
  const speed = Number(model.speed) || 0;
  return Math.max(0, Math.min(10, quality * 0.68 + speed * 0.32)).toFixed(1);
}

function hardwareTier(model) {
  if (isUnverifiedSpeechRecord(model)) return 'Checkpoint not verified';
  if (!isLocalSpeechModel(model)) return model.id === 'edge-tts' ? 'Internet required' : 'Vendor API required';
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
  const setup = 'Use the verified setup options on this page; no terminal command is required to choose the right path.';
  if (model.id === 'edge-tts') {
    return `${name} does not run speech inference locally. The Python package calls Microsoft Edge's online speech service, so an internet connection and the upstream service are required. ${setup}`;
  }
  if (model.id === 'octave-2') {
    return `${name} does not currently have a verified local checkpoint or runtime in the LocalClaw catalogue. The listed Python package is a client for Hume AI's vendor-hosted API. ${setup}`;
  }
  if (isUnverifiedSpeechRecord(model)) {
    return `${name} does not have an exact public checkpoint or upstream release verified by LocalClaw. This route is preserved for transparency and is not installation guidance; similarly named releases must not be substituted. `;
  }
  if (model.isAsr) {
    return `${name} can run locally for offline speech-to-text. ${setup}`;
  }
  if (model.isOrchestrator) {
    return `${name} is a local app layer that coordinates installed speech backends. ${setup}`;
  }
  return `${name} can generate speech locally for private voice workflows. ${setup}`;
}

function bestForSentence(model) {
  const features = model.features || [];
  if (isUnverifiedSpeechRecord(model)) return `${esc(model.name)} is retained only as an unverified catalogue reference, not as a ranked local speech model.`;
  if (model.id === 'edge-tts') return `${esc(model.name)} is useful for quick access to Microsoft Edge's online multilingual voices when cloud delivery is acceptable.`;
  if (model.id === 'octave-2') return `${esc(model.name)} is useful for evaluating Hume AI's hosted expressive speech controls when vendor API use is acceptable.`;
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
  if (isUnverifiedSpeechRecord(model)) return 'No licence is published because no exact model release was verified.';
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
    .filter(item => item.id !== model.id && !isUnverifiedSpeechRecord(item))
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

function unverifiedCard(model) {
  return `<a class="similar-card" href="/tts/${esc(model.id)}.html" style="--model-color:#71717a">
    <span class="similar-family">Preserved route</span>
    <strong>${esc(model.name)}</strong>
    <small>Unverified reference · excluded from local counts and rankings</small>
  </a>`;
}

function schemaFor(model, url, desc) {
  const kind = modelKind(model);
  const isLocal = isLocalSpeechModel(model);
  if (isUnverifiedSpeechRecord(model)) {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: model.name,
          url,
          description: desc,
          about: 'Unverified speech catalogue reference'
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
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: model.name,
        applicationCategory: kind,
        operatingSystem: isLocal ? 'macOS, Windows, Linux' : 'Web service; API client',
        url,
        description: desc,
        softwareVersion: model.releaseDate || undefined,
        softwareRequirements: isLocal ? `${model.sizeGB || 'Unknown'} GB model size; ${niceList(model.hardware)}` : 'Internet connection and upstream vendor service',
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
              text: isLocal
                ? `${model.name} is listed by LocalClaw as a local ${model.isAsr ? 'ASR' : model.isOrchestrator ? 'speech app' : 'TTS'} option. Hardware fit depends on runtime, model size and backend support.`
                : `${model.name} is an online or vendor API reference, not a verified local speech model. An internet connection and the upstream service are required.`
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

const ttsLightStyles = `
  html.light{--bg:#faf9f6;--panel:#fff;--card:#fff;--card2:#f7f5f1;--border:#d7dce4;--border2:#b9c1cd;--primary:#c92f28;--orange:#c2410c;--text:#111827;--muted:#64748b;--soft:#334155;--green:#166534;--blue:#1d4ed8;background:#faf9f6;color-scheme:light}
  html.light body{background:radial-gradient(circle at 18% 10%,rgba(201,47,40,.07),transparent 26rem),radial-gradient(circle at 78% 18%,color-mix(in srgb,var(--model-color) 7%,transparent),transparent 24rem),linear-gradient(180deg,#fff,#faf9f6 42%,#faf9f6);color:#111827}html.light body:before{background-image:linear-gradient(rgba(15,23,42,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,.045) 1px,transparent 1px);mask-image:linear-gradient(to bottom,rgba(0,0,0,.45),transparent 85%)}
  html.light .site-nav{border-color:#d7dce4;background:rgba(255,255,255,.94);box-shadow:0 8px 24px rgba(15,23,42,.05)}html.light .logo{color:#111827}html.light .nav-links a{color:#64748b}html.light .nav-links a:hover,html.light .nav-links .active{color:#c92f28}html.light .mobile-links{border-color:#d7dce4;background:#fff}html.light .mobile-links a{color:#334155}html.light .hamb{color:#334155}
  html.light .breadcrumb{color:#64748b}html.light .breadcrumb a{color:#334155}html.light .breadcrumb a:hover{color:#c92f28}
  html.light .hero-copy,html.light .hero-panel,html.light .section,html.light .spec-card{border-color:#d7dce4;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.07)}html.light .hero-copy:before{background:radial-gradient(circle at 0 0,rgba(201,47,40,.1),transparent 42%)}html.light .desc,html.light .section p,html.light .list li{color:#334155}html.light .chip{border-color:#d7dce4;background:#f7f5f1;color:#334155}html.light .chip.hot{border-color:rgba(201,47,40,.34);background:#fff0ed;color:#c92f28}
  html.light .btn{border-color:#c92f28;background:#c92f28;color:#fff;box-shadow:5px 5px 0 rgba(127,29,29,.16)}html.light .btn.secondary{border-color:#d7dce4;background:#fff;color:#111827;box-shadow:none}html.light .btn:focus-visible{outline:3px solid rgba(201,47,40,.28);outline-offset:3px}
  html.light .score-card{background:radial-gradient(circle at 0 0,color-mix(in srgb,var(--model-color) 9%,transparent),transparent 45%),#f7f5f1}html.light .score-label{color:#64748b}html.light .score-caption{color:#334155}html.light .mini,html.light .detail,html.light .step,html.light .similar-card,html.light .next a{border-color:#d7dce4;background:#f7f5f1;color:#111827}html.light .mini .v,html.light .detail .v,html.light .similar-card,html.light .next a{color:#111827}html.light .mini .v[style]{color:#111827!important}html.light .similar-family{color:#6d28d9}html.light .track{background:#e2e8f0}html.light .tag{border-color:#d7dce4;background:#f7f5f1;color:#334155}html.light .source-links a,html.light .source-links code,html.light code{border-color:#d7dce4;background:#f7f5f1;color:#111827}html.light .source-links a:focus-visible,html.light .similar-card:focus-visible,html.light .next a:focus-visible{outline:3px solid rgba(201,47,40,.25);outline-offset:2px}html.light .command{border-color:#334155;background:#111827;color:#f8fafc;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
`;

function scopeLightCss(styles) {
  const closeBrace = (source, open) => {
    let depth = 1;
    for (let index = open + 1; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1;
      if (source[index] === '}' && --depth === 0) return index;
    }
    return source.length - 1;
  };
  const scopeRules = (source) => {
    let result = '';
    let cursor = 0;
    while (cursor < source.length) {
      const open = source.indexOf('{', cursor);
      if (open === -1) return result + source.slice(cursor);
      const selector = source.slice(cursor, open);
      const close = closeBrace(source, open);
      const body = source.slice(open + 1, close);
      const trimmed = selector.trim();
      if (trimmed.startsWith('@')) result += `${selector}{${scopeRules(body)}}`;
      else result += `${selector.split(',').map(part => `html.light ${part.trim()}`).join(',')}{${body}}`;
      cursor = close + 1;
    }
    return result;
  };
  return scopeRules(styles);
}

const ttsInstallChoiceDarkStyles = `
  .install-choice{margin-top:26px;padding:18px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:#0d0d0d;box-shadow:0 16px 40px rgba(0,0,0,.3)}.install-choice-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:13px}.install-choice-head span{display:block;color:#fff;font:950 12px "JetBrains Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.install-choice-head p{margin:4px 0 0;color:#a1a1aa;font-size:12px}.install-choice-head>a{flex-shrink:0;color:#ff6d64;font:850 10px "JetBrains Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid rgba(255,109,100,.45)}.install-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.install-choice-card{min-width:0;min-height:66px;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:11px;padding:11px;border:1px solid rgba(255,255,255,.14);border-radius:13px;background:#171717;color:#fff;text-decoration:none;transition:border-color .16s ease,background .16s ease,transform .16s ease}.install-choice-card:hover,.install-choice-card:focus-visible{border-color:rgba(255,255,255,.38);background:#222;transform:translateY(-1px);outline:2px solid rgba(255,109,100,.32);outline-offset:2px}.install-choice-card.featured{border-color:rgba(255,109,100,.58);background:linear-gradient(135deg,rgba(255,69,58,.16),#171717 58%)}.install-choice-logo{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:#f4f4f5;overflow:hidden}.install-choice-logo img{width:34px;height:34px;object-fit:contain}.install-choice-card strong{display:block;color:#fff;font-size:13px;line-height:1.2}.install-choice-card small{display:block;margin-top:4px;color:#a1a1aa;font-size:10px;line-height:1.3}.install-choice-arrow{color:#a1a1aa;font:850 10px ui-monospace,monospace}@media(max-width:700px){.install-choice-head{align-items:stretch;flex-direction:column}.install-choice-head>a{align-self:flex-start}.install-choice-grid{grid-template-columns:1fr}.install-choice-card{min-height:64px}}
`;
const runtimeLaunchAssistDarkStyles = `
  .runtime-launch-assist{margin-top:12px;padding:14px;border:1px solid rgba(96,165,250,.36);border-radius:13px;background:linear-gradient(135deg,rgba(30,58,138,.32),rgba(13,13,13,.96) 62%);color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.24)}.runtime-launch-assist[hidden]{display:none!important}.runtime-launch-assist[data-state="confirmed"]{border-color:rgba(74,222,128,.34);background:linear-gradient(135deg,rgba(20,83,45,.34),rgba(13,13,13,.96) 62%)}.runtime-launch-assist-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.runtime-launch-assist-kicker{display:block;color:#93c5fd;font:900 9px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.runtime-launch-assist[data-state="confirmed"] .runtime-launch-assist-kicker{color:#86efac}.runtime-launch-assist strong{display:block;margin-top:4px;font-size:13px}.runtime-launch-assist p{margin:6px 0 0!important;color:#cbd5e1!important;font-size:11px!important;line-height:1.45}.runtime-launch-assist-close{border:0;background:transparent;color:#cbd5e1;cursor:pointer;font-size:18px;line-height:1;padding:1px 3px}.runtime-launch-assist-close:hover,.runtime-launch-assist-close:focus-visible{color:#fff;outline:2px solid rgba(255,109,100,.48);outline-offset:3px}.runtime-launch-assist-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.runtime-launch-assist-actions button,.runtime-launch-assist-actions a{min-height:36px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:#171717;color:#fff;padding:8px 11px;font:850 10px ui-monospace,monospace;text-decoration:none;cursor:pointer}.runtime-launch-assist-actions button:first-child{border-color:rgba(74,222,128,.38);background:rgba(22,101,52,.25);color:#86efac}.runtime-launch-assist-actions button:disabled{cursor:default;color:#86efac;border-color:rgba(74,222,128,.34);background:rgba(22,101,52,.38)}.runtime-launch-assist-actions button:not(:disabled):hover,.runtime-launch-assist-actions button:not(:disabled):focus-visible,.runtime-launch-assist-actions a:hover,.runtime-launch-assist-actions a:focus-visible{border-color:rgba(255,255,255,.4);background:#262626;outline:2px solid rgba(255,109,100,.32);outline-offset:2px}@media(max-width:560px){.runtime-launch-assist-actions{display:grid;grid-template-columns:1fr}.runtime-launch-assist-actions button,.runtime-launch-assist-actions a{width:100%}}
`;
const ttsInstallChoiceThemeStyles = `${ttsInstallChoiceDarkStyles}${scopeLightCss(installChoiceStyles)}`;
const runtimeLaunchAssistThemeStyles = `${runtimeLaunchAssistDarkStyles}${scopeLightCss(runtimeLaunchAssistStyles)}`;

function nav() {
  return siteNavigation('voice');
}

function page(model, all) {
  const color = voiceColor(model);
  const isLocal = isLocalSpeechModel(model);
  const isUnverified = isUnverifiedSpeechRecord(model);
  const hasAudioExample = Boolean(externalMedia.voice && externalMedia.voice[model.id]);
  const url = `${BASE}/tts/${encodeURIComponent(model.id)}.html`;
  const title = isUnverified
    ? `${model.name}: preserved unverified speech reference | LocalClaw`
    : isLocal
    ? `${model.name} local ${model.isAsr ? 'ASR' : model.isOrchestrator ? 'speech app' : 'TTS'}: quality, speed and setup | LocalClaw`
    : `${model.name} online speech reference: quality, speed and access | LocalClaw`;
  const desc = isUnverified
    ? `${model.name}: preserved catalogue route. No exact public checkpoint, release, score or installation path was verified on August 14, 2026.`.slice(0, 158)
    : isLocal
    ? `${model.name}: local ${modelTask(model)} guide with quality ${model.quality}/10, speed ${model.speed}/10, ${model.languageCount || (model.languages || []).length || '?'} languages, hardware and install notes.`.slice(0, 158)
    : `${model.name}: online/vendor API speech reference with quality ${model.quality}/10, speed ${model.speed}/10, access requirements, licence and upstream link.`.slice(0, 158);
  const schema = schemaFor(model, url, desc);
  const related = relatedModels(all, model);
  const features = tagsMarkup(model.features);
  const hardware = pillMarkup(model.hardware);
  const formats = pillMarkup(model.supportedFormats);
  const sourceLink = model.hfLink ? `<a href="${esc(model.hfLink)}" target="_blank" rel="noopener nofollow">Upstream source</a>` : '';
  const audioScore = audioCatalogueScore(model);
  const sourceAction = model.hfLink
    ? `<a class="btn secondary" href="${esc(model.hfLink)}" target="_blank" rel="noopener nofollow">Open upstream source</a>`
    : isUnverified
      ? '<span class="btn secondary" aria-disabled="true">No verified source</span>'
      : '<a class="btn secondary" href="/pricing.html">Get LocalClaw</a>';
  const scorePanel = isUnverified
    ? '<div class="score-label">Verification status</div><div class="score">Unverified</div><p class="score-caption">No Audio, quality or speed score is published because no exact model release or checkpoint was verified.</p>'
    : `<div class="score-label">${isLocal ? 'Audio catalogue score' : 'Audio profile score'}</div><div class="score">${audioScore}<small>/10</small></div><p class="score-caption">Editorial repository fields: 68% quality and 32% speed, capped at 10. This is not a standardized third-party benchmark; community stars and hardware fit remain separate.</p>`;
  const communityPanel = isUnverified
    ? '<p class="muted">Community model ratings are disabled for this unverified reference.</p>'
    : `<div data-community-rating data-model-id="tts-${esc(model.id)}" data-rating-mode="full" data-rating-theme="voice" data-rating-label="Community voice rating" data-rating-subject="voice model"></div>`;
  const statusChips = isUnverified
    ? '<span class="chip hot">Excluded from local index</span><span class="chip">No verified checkpoint</span><span class="chip">No verified release</span>'
    : `<span class="chip hot">${esc(hardwareTier(model))}</span><span class="chip">${esc(modelTask(model))}</span><span class="chip">${fmtNum(model.languageCount || (model.languages || []).length)} languages</span><span class="chip">${esc(model.license || 'License varies')}</span>`;
  const installPicker = isLocal && !isUnverified ? speechInstallPicker(model) : '';
  const installPickerStyles = installPicker.includes('runtime-launch-assist-20260821a.js') ? runtimeLaunchAssistThemeStyles : '';
  const specsSection = isUnverified ? '' : `
    <section class="specs" aria-label="Model specs">
      <div class="spec-card"><div class="k">Catalogue quality</div><div class="v">${esc(model.quality)}/10</div></div>
      <div class="spec-card"><div class="k">Catalogue speed</div><div class="v">${esc(model.speed)}/10</div></div>
      <div class="spec-card"><div class="k">Model size</div><div class="v">${esc(model.sizeLabel || (Number.isFinite(Number(model.sizeGB)) ? `${model.sizeGB} GB` : 'Not verified'))}</div></div>
      <div class="spec-card"><div class="k">Voices</div><div class="v">${esc(model.voices || 'Varies')}</div></div>
    </section>`;
  const verificationSection = isUnverified ? `
    <section class="section">
      <h2>Why this route is preserved</h2>
      <p>${localSentence(model)}</p>
      <p>${commercialNote(model)}</p>
      <p class="muted">It is excluded from local counts, rankings, comparison and community ratings.</p>
      <div class="source-links"><a href="/tts/coqui-tts.html">Open the verified XTTS v2 catalogue page</a></div>
    </section>` : `
    <section class="section">
      <h2>Can ${esc(model.name)} run locally?</h2>
      <p>${localSentence(model)}</p>
      <p>${commercialNote(model)}</p>
      <div class="source-links">${sourceLink}</div>
      <div style="margin-top:18px">${features}</div>
    </section>`;
  const profileSection = isUnverified ? '' : `
    <section class="section cols">
      <div>
        <h2>Audio profile</h2>
        <div class="bars">
          <div class="bar-row"><span>Cat. quality</span><div class="track"><div class="fill" style="width:${pct(model.quality)}%"></div></div><span>${esc(model.quality)}</span></div>
          <div class="bar-row"><span>Cat. speed</span><div class="track"><div class="fill" style="width:${pct(model.speed)}%"></div></div><span>${esc(model.speed)}</span></div>
          <div class="bar-row"><span>${isLocal ? 'Audio' : 'Profile'}</span><div class="track"><div class="fill" style="width:${Math.min(100, Number(audioScore) * 10)}%"></div></div><span>${audioScore}</span></div>
        </div>
      </div>
      <div><h2>Best fit</h2><p>${bestForSentence(model)}</p><p class="muted">Hardware: ${hardware || 'Not specified'}</p></div>
    </section>`;
  const detailsSection = isUnverified ? `
    <section class="section">
      <h2>Verification details</h2>
      <div class="detail-grid">
        <div class="detail"><div class="k">Type</div><div class="v">Unverified speech reference</div></div>
        <div class="detail"><div class="k">Public checkpoint</div><div class="v">Not verified</div></div>
        <div class="detail"><div class="k">Release</div><div class="v">Not verified</div></div>
        <div class="detail"><div class="k">Local index</div><div class="v">Excluded</div></div>
      </div>
    </section>` : `
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
    </section>`;
  const installSection = isUnverified ? '' : `
    <section class="section">
      <h2>${isLocal ? 'Install locally' : 'Access the online service'}</h2>
      <div class="install-steps">
        <div class="step"><div class="step-num">01</div><strong>${isLocal ? 'Check runtime' : 'Check service terms'}</strong><span>${isLocal ? `Confirm the backend supports ${esc(niceList(model.supportedFormats || ['the upstream format']))} on your machine.` : 'Review the upstream service, privacy and usage terms before sending any text.'}</span></div>
        <div class="step"><div class="step-num">02</div><strong>${isLocal ? 'Open recommended setup' : 'Install client'}</strong><span>${isLocal ? 'Use the app and model links above. LocalClaw does not expose a terminal command.' : 'Install the client package; this does not download a local inference model.'}</span></div>
        <div class="step"><div class="step-num">03</div><strong>${isLocal ? 'Test locally' : 'Test online'}</strong><span>${isLocal ? 'Run a short private audio prompt before moving into production workflows.' : 'Confirm network delivery, data handling, latency and vendor availability.'}</span></div>
      </div>
    </section>`;
  const shippingSection = isUnverified ? '' : `
    <section class="section cols">
      <div><h2>Good for</h2><ul class="list"><li>${esc(modelTask(model))}</li><li>${isLocal ? `${esc(hardwareTier(model))} local workflows` : esc(hardwareTier(model))}</li><li>${esc((model.features || []).slice(0, 3).join(', ') || 'Private local speech experiments')}</li></ul></div>
      <div><h2>Watch before shipping</h2><ul class="list"><li>Validate pronunciation, latency and artifacts with your own voice samples.</li><li>Review the upstream license and acceptable-use notes.</li><li>Benchmark on your target CPU, Apple Silicon or GPU setup.</li></ul></div>
    </section>`;
  const audioExampleSection = hasAudioExample ? `
    <section class="section">
      <h2>Official audio example</h2>
      <p>Play the official source sample directly below. The file remains on the project server and is not hosted by LocalClaw.</p>
      <div class="lc-external-media" data-external-media data-media-category="voice" data-media-id="${esc(model.id)}"></div>
    </section>` : '';

  return `<!DOCTYPE html>
<html class="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#faf9f6">
  <meta name="color-scheme" content="light dark">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="${isUnverified ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large'}">
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
  <link rel="stylesheet" href="/css/community-ratings-20260802a.css?v=20260822a">
  ${hasAudioExample ? '<link rel="stylesheet" href="/css/external-media.css?v=20260822a">' : ''}
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${tracking}
  <style>${style(color)}${ttsInstallChoiceThemeStyles}${installPickerStyles}${ttsLightStyles}</style>
</head>
<body>
  ${nav()}
  <main class="wrap">
    <div class="breadcrumb"><a href="/">LocalClaw</a><span>/</span><a href="/tts-list.html">TTS</a><span>/</span><span>${esc(model.name)}</span></div>
    <header class="hero">
      <section class="hero-copy">
        <div class="eyebrow">${esc(modelKind(model))}</div>
        <h1 class="title">${titleMarkup(model.name)}</h1>
        <p class="desc"><strong>Catalogue summary:</strong> ${esc(model.description)}</p>
        <p class="muted">Repository editorial metadata; verify comparative claims in the linked upstream material.</p>
        <div class="chips">${statusChips}</div>
        ${installPicker || `<div class="cta"><a class="btn" href="/tts-list.html">Compare TTS models</a>${sourceAction}</div>`}
      </section>
      <aside class="hero-panel">
        <div class="score-card">
          <div>${scorePanel}</div>
        </div>
        ${communityPanel}
        <div class="panel-grid">
          <div class="mini"><div class="k">Developer</div><div class="v">${esc(model.developer || model.family || 'Open model')}</div></div>
          <div class="mini"><div class="k">Released</div><div class="v">${esc(model.releaseDate || 'Unknown')}</div></div>
        </div>
      </aside>
    </header>

    ${specsSection}
    ${audioExampleSection}
    ${verificationSection}
    ${profileSection}
    ${detailsSection}
    ${installSection}
    ${shippingSection}

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
  ${isUnverified ? '' : '<script src="/js/community-ratings-20260802a.js?v=20260803a"></script>'}
  ${hasAudioExample ? '<script src="/js/external-media-catalog.js?v=20260816b"></script><script src="/js/external-media.js?v=20260816c"></script>' : ''}
</body>
</html>`;
}

function indexPage(models) {
  const localModels = models.filter(isLocalSpeechModel);
  const onlineReferences = models.filter(isRemoteSpeechService);
  const unverifiedRecords = models.filter(isUnverifiedSpeechRecord);
  const picks = localModels.filter(m => m.isPick || m.isNew).slice(0, 12);
  const bestQuality = [...localModels].sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
  const fastest = [...localModels].sort((a, b) => (b.speed || 0) - (a.speed || 0))[0];
  const desc = `Static pages for ${localModels.length} verified-local text-to-speech, ASR and speech AI records, plus ${onlineReferences.length} online/API references and ${unverifiedRecords.length} preserved unverified route.`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Local TTS model pages',
    url: `${BASE}/tts/`,
    description: desc,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: localModels.length,
      itemListElement: localModels.slice(0, 20).map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: m.name,
        url: `${BASE}/tts/${m.id}.html`
      }))
    }
  };

  return `<!DOCTYPE html>
<html class="light" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#faf9f6">
  <meta name="color-scheme" content="light dark">
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
  <style>${style('#ff453a')}${ttsLightStyles}</style>
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
          <span class="chip hot">${localModels.length} local records</span>
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
            <div class="score">${localModels.length}<small> local pages</small></div>
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
      <div class="similar">${[...localModels].sort((a, b) => a.name.localeCompare(b.name)).map(relatedCard).join('')}</div>
    </section>

    <section class="section">
      <h2>Online and API references</h2>
      <p>These routes are preserved for comparison but are not counted as local models.</p>
      <div class="similar">${onlineReferences.map(relatedCard).join('')}</div>
    </section>

    <section class="section">
      <h2>Unverified preserved route</h2>
      <p>This route remains available for transparency, but is noindexed and excluded from local counts, rankings, comparison and installation guidance.</p>
      <div class="similar">${unverifiedRecords.map(unverifiedCard).join('')}</div>
    </section>
  </main>
</body>
</html>`;
}

const models = extractTTS();
const localModels = models.filter(isLocalSpeechModel);
const remoteModels = models.filter(isRemoteSpeechService);
const unverifiedModels = models.filter(isUnverifiedSpeechRecord);
const renderedPages = new Map(models.map(model => [model.id, cleanGeneratedHtml(page(model, models))]));
const renderedIndex = cleanGeneratedHtml(indexPage(models));

if (models.length !== 80 || localModels.length !== 77 || remoteModels.length !== 2 || unverifiedModels.length !== 1 || unverifiedModels[0]?.id !== 'xtts-v3') {
  throw new Error(`Unexpected speech classification: ${models.length} total, ${localModels.length} local, ${remoteModels.length} remote, ${unverifiedModels.length} unverified`);
}

const tombstone = renderedPages.get('xtts-v3') || '';
for (const marker of [
  '<meta name="robots" content="noindex, follow">',
  'Verification status',
  'No Audio, quality or speed score is published',
  'href="/tts/coqui-tts.html"'
]) {
  if (!tombstone.includes(marker)) throw new Error(`XTTS v3 tombstone missing marker: ${marker}`);
}
for (const forbidden of [
  'Audio catalogue score',
  'Audio profile score',
  'data-community-rating',
  'class="install-steps"',
  'class="command"',
  'SoftwareApplication',
  'FAQPage'
]) {
  if (tombstone.includes(forbidden)) throw new Error(`XTTS v3 tombstone exposes forbidden content: ${forbidden}`);
}
if (!renderedIndex.includes('77<small> local pages</small>') || !renderedIndex.includes('Unverified preserved route')) {
  throw new Error('Speech index does not expose the verified-local and unverified route counts');
}

if (CHECK_ONLY) {
  console.log(`Verified ${renderedPages.size} speech routes in memory: ${localModels.length} local, ${remoteModels.length} remote, ${unverifiedModels.length} unverified.`);
} else {
  const out = path.join(ROOT, 'tts');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const [id, html] of renderedPages) {
    fs.writeFileSync(path.join(out, `${id}.html`), html);
  }
  fs.writeFileSync(path.join(out, 'index.html'), renderedIndex);
  normalizeDirectory(out);
  console.log(`Generated ${models.length} TTS pages.`);
}
