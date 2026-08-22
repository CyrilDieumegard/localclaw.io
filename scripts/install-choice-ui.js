const LOGOS = {
  comfyui: 'https://raw.githubusercontent.com/Comfy-Org/docs/main/logo.svg',
  drawthings: 'https://avatars.githubusercontent.com/u/133620361?v=4',
  github: 'https://github.githubassets.com/favicons/favicon.svg',
  gradio: 'https://avatars.githubusercontent.com/u/51063788?v=4',
  huggingface: '/images/model-logos/huggingface-avatar.webp',
  localclaw: '/images/crab-logo.png',
  mlx: 'https://avatars.githubusercontent.com/u/102832242?v=4',
  python: 'https://www.python.org/static/favicon.ico',
  pytorch: 'https://avatars.githubusercontent.com/u/21003710?v=4',
  unsloth: 'https://raw.githubusercontent.com/unslothai/unsloth/main/studio/frontend/public/rounded.png'
};

const runtimeLaunchAssistAsset = '<script src="/js/runtime-launch-assist-20260821a.js?v=20260821a" defer></script>';

const runtimeLaunchAssistStyles = `
.runtime-launch-disclosure{margin:11px 0 0!important;color:#64748b!important;font-size:10px!important;line-height:1.45}
.runtime-launch-assist{margin-top:12px;padding:14px;border:1px solid rgba(37,99,235,.28);border-radius:13px;background:linear-gradient(135deg,#eff6ff,#fff 62%);color:#111827;box-shadow:0 12px 30px rgba(15,23,42,.06)}.runtime-launch-assist[hidden]{display:none!important}.runtime-launch-assist[data-state="confirmed"]{border-color:rgba(22,101,52,.3);background:linear-gradient(135deg,#ecfdf5,#fff 62%)}.runtime-launch-assist-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.runtime-launch-assist-kicker{display:block;color:#1d4ed8;font:900 9px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.runtime-launch-assist[data-state="confirmed"] .runtime-launch-assist-kicker{color:#166534}.runtime-launch-assist strong{display:block;margin-top:4px;font-size:13px}.runtime-launch-assist p{margin:6px 0 0!important;color:#64748b!important;font-size:11px!important;line-height:1.45}.runtime-launch-assist-close{border:0;background:transparent;color:#64748b;cursor:pointer;font-size:18px;line-height:1;padding:1px 3px}.runtime-launch-assist-close:hover,.runtime-launch-assist-close:focus-visible{color:#111827;outline:2px solid rgba(201,47,40,.38);outline-offset:3px}.runtime-launch-assist-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.runtime-launch-assist-actions button,.runtime-launch-assist-actions a{min-height:36px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #d7dce4;border-radius:9px;background:#fff;color:#111827;padding:8px 11px;font:850 10px ui-monospace,monospace;text-decoration:none;cursor:pointer}.runtime-launch-assist-actions button:first-child{border-color:rgba(22,101,52,.32);background:#ecfdf5;color:#166534}.runtime-launch-assist-actions button:disabled{cursor:default;color:#166534;border-color:rgba(22,101,52,.3);background:#dcfce7}.runtime-launch-assist-actions button:not(:disabled):hover,.runtime-launch-assist-actions button:not(:disabled):focus-visible,.runtime-launch-assist-actions a:hover,.runtime-launch-assist-actions a:focus-visible{border-color:#9aa5b5;background:#f7f5f1;outline:2px solid rgba(201,47,40,.26);outline-offset:2px}@media(max-width:560px){.runtime-launch-assist-actions{display:grid;grid-template-columns:1fr}.runtime-launch-assist-actions button,.runtime-launch-assist-actions a{width:100%}}
`;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const includesRuntime = (model, pattern) => (model.runtime || []).some(runtime => pattern.test(String(runtime)));
const huggingFaceUrl = model => [model.install_url, model.source_url].find(url => /^https:\/\/huggingface\.co\//.test(url || '')) || '';

function goalAttributes(goal, model, category) {
  return `data-fast-goal="model_install_${escapeHtml(goal)}" data-fast-goal-source="${category === 'voice' ? 'voice_detail' : 'multimodal_detail'}" data-fast-goal-category="${escapeHtml(category)}" data-fast-goal-model="${escapeHtml(model.id)}"`;
}

function installCard({platform, label, note, href, model, category, featured = false, external = true, appLink = false}) {
  return `<a class="install-choice-card${featured ? ' featured' : ''}" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener"' : ''} ${goalAttributes(platform, model, category)}><span class="install-choice-logo" aria-hidden="true"><img src="${escapeHtml(LOGOS[platform] || LOGOS.github)}" alt="" width="42" height="42" loading="lazy"></span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(note)}</small></span><span class="install-choice-arrow" aria-hidden="true">${appLink ? 'Open' : external ? '&#8599;' : '&#8594;'}</span></a>`;
}

function huggingFaceTarget(model) {
  const candidates = [model.install_url, model.source_url, model.hfLink];
  for (const candidate of candidates) {
    if (!/^https:\/\/huggingface\.co\//.test(candidate || '')) continue;
    let url;
    try {
      url = new URL(candidate);
    } catch {
      continue;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2 || ['datasets', 'docs', 'spaces'].includes(parts[0].toLowerCase())) continue;
    const [owner, repo] = parts;
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(owner) || !/^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(repo)) continue;
    if (owner.includes('--') || owner.includes('..') || repo.includes('--') || repo.includes('..') || repo.endsWith('.git')) continue;
    const result = {repo: `${owner}/${repo}`};
    if (['blob', 'resolve'].includes(parts[2]) && parts.length > 4) {
      const file = parts.slice(4).join('/');
      if (/\.gguf$/i.test(file)) result.file = file;
    }
    return result;
  }
  return null;
}

function unslothDeepLink(model) {
  const target = huggingFaceTarget(model);
  if (!target) return '';
  const params = new URLSearchParams({model: target.repo});
  if (target.file) params.set('file', target.file);
  return `unsloth://open_from_hf?${params.toString()}`;
}

function supportsUnsloth(model) {
  if (!unslothDeepLink(model)) return false;
  if (['image', 'video', 'music'].includes(model.category)) return true;
  if (model.category !== 'vision') return false;
  const unsupportedVisionTasks = /object-detection|segmentation|depth-estimation|pose-estimation/;
  return includesRuntime(model, /Transformers|MLX-VLM|llama\.cpp/i)
    && !(model.tasks || []).some(task => unsupportedVisionTasks.test(String(task)));
}

function recommendedRuntime(model) {
  const named = [
    [/LTX Desktop/i, 'LTX Desktop'], [/FramePack desktop/i, 'FramePack'], [/Wan2GP/i, 'Wan2GP'],
    [/Hunyuan3D-2GP/i, 'Hunyuan3D-2GP'], [/Modelr/i, 'Modelr'], [/YuE UI/i, 'YuE UI']
  ].find(([pattern]) => includesRuntime(model, pattern));
  if (named) return named[1];
  if (/comfy/i.test(model.install_url || '') && includesRuntime(model, /ComfyUI/i)) return 'ComfyUI';
  if (/drawthings/i.test(model.install_url || '') && includesRuntime(model, /Draw Things/i)) return 'Draw Things';
  return '';
}

function recommendedPlatform(model) {
  const runtime = recommendedRuntime(model);
  if (runtime === 'ComfyUI') return 'comfyui';
  if (runtime === 'Draw Things') return 'drawthings';
  if (/^https:\/\/huggingface\.co\//.test(model.install_url || '')) return 'huggingface';
  if (includesRuntime(model, /MLX/i)) return 'mlx';
  return 'github';
}

function recommendedLabel(model) {
  const runtime = recommendedRuntime(model);
  if (runtime) return `Open ${runtime} setup`;
  if (/^https:\/\/huggingface\.co\//.test(model.install_url || '')) return 'Open model files';
  return 'Open recommended setup';
}

function advancedRuntime(model) {
  if (includesRuntime(model, /Diffusers/i)) return {platform: 'huggingface', label: 'Open Diffusers setup', note: 'Advanced Python runtime', href: 'https://huggingface.co/docs/diffusers/installation'};
  if (includesRuntime(model, /MLX|MLX-VLM/i)) return {platform: 'mlx', label: 'Open MLX setup', note: 'Apple Silicon runtime', href: model.install_url || model.source_url};
  if (includesRuntime(model, /Gradio/i)) return {platform: 'gradio', label: 'Open Gradio setup', note: 'Local browser interface', href: model.install_url || model.source_url};
  if (includesRuntime(model, /PyTorch|Transformers|AudioCraft|PaddlePaddle/i)) return {platform: 'pytorch', label: 'Open advanced setup', note: 'Python runtime for experienced users', href: model.install_url || model.source_url};
  return null;
}

function pickerMarkup({model, category, cards, compareHref, compareLabel}) {
  const hasDesktopAppLink = cards.some(card => /href="(?:lmstudio|unsloth):\/\//.test(card));
  const runtimeLaunchAssist = hasDesktopAppLink
    ? `\n    <p class="runtime-launch-disclosure">Desktop app links require the app to be installed. If nothing opens, LocalClaw will show app-download and model-file fallbacks.</p>\n  </section>${runtimeLaunchAssistAsset}`
    : '\n  </section>';
  return `<section class="install-choice" data-install-choice data-install-category="${escapeHtml(category)}">
    <div class="install-choice-head"><div><span>Choose an app</span><p>Start with Recommended. No terminal commands are shown.</p></div><a href="${escapeHtml(compareHref)}">${escapeHtml(compareLabel)}</a></div>
    <div class="install-choice-grid">${cards.join('')}</div>${runtimeLaunchAssist}`;
}

function multimodalInstallPicker(model, config) {
  const cards = [];
  const primaryPlatform = recommendedPlatform(model);
  cards.push(installCard({
    platform: primaryPlatform,
    label: recommendedLabel(model),
    note: 'Recommended verified starting point',
    href: model.install_url,
    model,
    category: model.category,
    featured: true
  }));

  if (supportsUnsloth(model)) {
    cards.push(installCard({
      platform: 'unsloth',
      label: 'Open in Unsloth',
      note: 'Launches Unsloth Desktop on this model',
      href: unslothDeepLink(model),
      model,
      category: model.category,
      external: false,
      appLink: true
    }));
  }

  if (includesRuntime(model, /ComfyUI/i) && primaryPlatform !== 'comfyui') {
    cards.push(installCard({platform: 'comfyui', label: 'Get ComfyUI Desktop', note: 'Official desktop app for this compatible model', href: 'https://www.comfy.org/download', model, category: model.category}));
  }
  if (includesRuntime(model, /Draw Things/i) && primaryPlatform !== 'drawthings') {
    cards.push(installCard({platform: 'drawthings', label: 'Get Draw Things', note: 'Native macOS and iOS app', href: 'https://apps.apple.com/app/draw-things-ai-generation/id6444050820', model, category: model.category}));
  }
  const hfUrl = huggingFaceUrl(model);
  if (hfUrl && !(primaryPlatform === 'huggingface' && hfUrl === model.install_url)) {
    cards.push(installCard({platform: 'huggingface', label: 'Open on Hugging Face', note: 'Model files, licence and model card', href: hfUrl, model, category: model.category}));
  }
  const advanced = advancedRuntime(model);
  if (advanced && cards.length < 4) cards.push(installCard({...advanced, model, category: model.category}));
  if (cards.length >= 3) cards.push(installCard({platform: 'localclaw', label: 'Check my machine', note: 'See whether this model fits your saved hardware', href: '/account', model, category: model.category, external: false}));
  if (model.source_url !== model.install_url && cards.length < 5) {
    cards.push(installCard({platform: /^https:\/\/huggingface\.co\//.test(model.source_url) ? 'huggingface' : 'github', label: 'Open official source', note: 'Publisher repository and primary evidence', href: model.source_url, model, category: model.category}));
  }

  return pickerMarkup({model, category: model.category, cards: cards.slice(0, 5), compareHref: config.route, compareLabel: `Compare ${config.plural}`});
}

function packageName(command = '') {
  const match = String(command).match(/^pip install(?:\s+-[A-Za-z]+(?:\s+\S+)*)?\s+([A-Za-z0-9_.-]+)/i);
  return match ? match[1] : '';
}

function githubUrl(command = '') {
  const match = String(command).match(/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i);
  return match ? match[0].replace(/\.git$/i, '') : '';
}

function speechInstallPicker(model) {
  if (!model.hfLink) return '';
  const category = 'voice';
  const isGithub = /^https:\/\/github\.com\//.test(model.hfLink);
  const cards = [installCard({
    platform: isGithub ? 'github' : 'huggingface',
    label: model.isOrchestrator ? `Open ${model.name}` : isGithub ? 'Open official setup' : 'Open model files',
    note: model.isOrchestrator ? 'Native application and release instructions' : 'Recommended verified starting point',
    href: model.hfLink,
    model,
    category,
    featured: true
  })];
  const unslothHref = unslothDeepLink(model);
  if (!isGithub && unslothHref) cards.push(installCard({platform: 'unsloth', label: 'Open in Unsloth', note: 'Launches Unsloth Desktop on this model', href: unslothHref, model, category, external: false, appLink: true}));
  const pkg = packageName(model.installCommand);
  if (pkg) cards.push(installCard({platform: 'python', label: 'Open Python package', note: 'Verified package page without exposing a command', href: `https://pypi.org/project/${encodeURIComponent(pkg)}/`, model, category}));
  const gitUrl = githubUrl(model.installCommand);
  if (gitUrl && gitUrl !== model.hfLink) cards.push(installCard({platform: 'github', label: 'Open official project', note: 'Application source and guided setup', href: gitUrl, model, category}));
  if (!isGithub) cards.push(installCard({platform: 'huggingface', label: 'Open on Hugging Face', note: 'Files, licence and model card', href: model.hfLink, model, category}));
  cards.push(installCard({platform: 'localclaw', label: 'Check my machine', note: 'Optional: verify the fit with your saved hardware', href: '/account', model, category, external: false}));
  return pickerMarkup({model, category, cards: cards.slice(0, 5), compareHref: '/tts-list', compareLabel: 'Compare speech models'});
}

const installChoiceStyles = `
.install-choice{margin-top:26px;padding:18px;border:1px solid #d7dce4;border-radius:18px;background:#fff;box-shadow:0 16px 40px rgba(15,23,42,.07)}
.install-choice-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:13px}.install-choice-head span{display:block;color:#111827;font:950 12px "JetBrains Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.install-choice-head p{margin:4px 0 0;color:#64748b;font-size:12px}.install-choice-head>a{flex-shrink:0;color:#c92f28;font:850 10px "JetBrains Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid rgba(201,47,40,.34)}
.install-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.install-choice-card{min-width:0;min-height:66px;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:11px;padding:11px;border:1px solid #d7dce4;border-radius:13px;background:#f7f5f1;color:#111827;text-decoration:none;transition:border-color .16s ease,background .16s ease,transform .16s ease}.install-choice-card:hover,.install-choice-card:focus-visible{border-color:#9aa5b5;background:#fff;transform:translateY(-1px);outline:2px solid rgba(201,47,40,.25);outline-offset:2px}.install-choice-card.featured{border-color:rgba(201,47,40,.55);background:linear-gradient(135deg,#fff0ed,#fff 58%)}.install-choice-logo{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border:1px solid #d7dce4;border-radius:11px;background:#fff;overflow:hidden}.install-choice-logo img{width:34px;height:34px;object-fit:contain}.install-choice-card strong{display:block;color:#111827;font-size:13px;line-height:1.2}.install-choice-card small{display:block;margin-top:4px;color:#64748b;font-size:10px;line-height:1.3}.install-choice-arrow{color:#64748b;font:850 10px ui-monospace,monospace}
@media(max-width:700px){.install-choice-head{align-items:stretch;flex-direction:column}.install-choice-head>a{align-self:flex-start}.install-choice-grid{grid-template-columns:1fr}.install-choice-card{min-height:64px}}
`;

module.exports = {
  installChoiceStyles,
  multimodalInstallPicker,
  runtimeLaunchAssistAsset,
  runtimeLaunchAssistStyles,
  speechInstallPicker
};
