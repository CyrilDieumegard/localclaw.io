(function localAiCatalogueApp() {
  const body = document.body;
  const requestedCategory = body.dataset.localAiCategory || 'all';
  const allModels = requestedCategory === 'all'
    ? (window.LOCAL_AI_SEARCH_INDEX || [])
    : (window.LOCAL_AI_CATALOG || []).filter((model) => model.category === requestedCategory).map((model) => ({
      ...model,
      path: `/${model.category === '3d' ? '3d' : model.category}/${model.id}`,
      resource_basis: 'source-backed floor'
    }));

  const elements = {
    grid: document.getElementById('lc-ai-grid'),
    count: document.getElementById('lc-ai-result-count'),
    search: document.getElementById('lc-ai-search'),
    category: document.getElementById('lc-ai-category'),
    platform: document.getElementById('lc-ai-platform'),
    accelerator: document.getElementById('lc-ai-accelerator'),
    ram: document.getElementById('lc-ai-ram'),
    vram: document.getElementById('lc-ai-vram'),
    machineStatus: document.getElementById('lc-ai-machine-status')
  };

  if (!elements.grid) return;

  const labels = {
    llm: 'LLM', voice: 'Voice', image: 'Image', video: 'Video', '3d': '3D', music: 'Music', vision: 'Vision'
  };

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function titleCase(value) {
    return String(value || '').split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
  }

  function prettyTerm(value) {
    return {
      macos: 'macOS', nvidia: 'NVIDIA', amd: 'AMD', cpu: 'CPU', mlx: 'MLX', onnx: 'ONNX',
      gguf: 'GGUF', api: 'API', tts: 'TTS', asr: 'ASR', '3d': '3D', pytorch: 'PyTorch'
    }[String(value || '').toLowerCase()] || titleCase(value);
  }

  function readSavedMachine() {
    try {
      const machine = JSON.parse(localStorage.getItem('localclaw_primary_machine') || 'null');
      return machine && machine.id ? machine : null;
    } catch {
      return null;
    }
  }

  function applySavedMachine() {
    const machine = readSavedMachine();
    if (!machine) return;
    if (elements.platform) elements.platform.value = machine.platform || 'all';
    if (elements.accelerator) elements.accelerator.value = machine.accelerator || 'all';
    if (elements.ram) selectAtMost(elements.ram, Number(machine.ramGb) || 0);
    if (elements.vram) selectAtMost(elements.vram, Number(machine.vramGb) || 0);
    if (elements.machineStatus) {
      const compute = prettyTerm(machine.accelerator || 'local compute');
      const memory = `${Number(machine.ramGb) || 0} GB RAM${machine.vramGb ? ` · ${Number(machine.vramGb)} GB VRAM` : ''}`;
      elements.machineStatus.innerHTML = `<strong>${escapeHtml(machine.name || 'Primary machine')}</strong><br>${escapeHtml(compute)} · ${escapeHtml(memory)}. Compatible models are ranked first.`;
    }
  }

  function selectAtMost(select, value) {
    if (!select || !value) return;
    const options = [...select.options].map((option) => Number(option.value)).filter((number) => number <= value);
    if (options.length) select.value = String(Math.max(...options));
  }

  function selectedMachine() {
    return {
      platform: elements.platform?.value || 'all',
      accelerator: elements.accelerator?.value || 'all',
      ram: Number(elements.ram?.value) || 0,
      vram: Number(elements.vram?.value) || 0
    };
  }

  function fitFor(model, machine) {
    if (model.local_status !== 'local') return { fits: false, reason: 'API or hosted reference' };
    if (machine.platform !== 'all' && array(model.platforms).length && !array(model.platforms).includes(machine.platform)) {
      return { fits: false, reason: `No verified ${prettyTerm(machine.platform)} path` };
    }
    if (machine.accelerator !== 'all' && array(model.accelerators).length && !array(model.accelerators).includes(machine.accelerator)) {
      return { fits: false, reason: `No verified ${prettyTerm(machine.accelerator)} path` };
    }
    if (machine.ram && Number(model.min_ram_gb) > machine.ram) {
      return { fits: false, reason: `Needs about ${model.min_ram_gb} GB RAM` };
    }
    if (machine.accelerator === 'nvidia' && machine.vram && Number(model.min_vram_gb) > machine.vram) {
      return { fits: false, reason: `Needs about ${model.min_vram_gb} GB VRAM` };
    }
    if (!machine.ram && machine.platform === 'all' && machine.accelerator === 'all') {
      return { fits: null, reason: 'Choose hardware to check fit' };
    }
    return { fits: true, reason: 'Fits selected hardware floor' };
  }

  function matches(model, machine) {
    const query = (elements.search?.value || '').trim().toLowerCase();
    const category = elements.category?.value || requestedCategory;
    if (category !== 'all' && model.category !== category) return false;
    if (query) {
      const haystack = [model.name, model.summary, model.category, model.license, ...array(model.tasks), ...array(model.runtime), ...array(model.platforms), ...array(model.accelerators)].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (machine.platform !== 'all' && array(model.platforms).length && !array(model.platforms).includes(machine.platform)) return false;
    if (machine.accelerator !== 'all' && array(model.accelerators).length && !array(model.accelerators).includes(machine.accelerator)) return false;
    const hardwareFilterActive = machine.platform !== 'all' || machine.accelerator !== 'all' || machine.ram || machine.vram;
    if (hardwareFilterActive && model.local_status !== 'local') return false;
    if (machine.ram && Number(model.min_ram_gb) > machine.ram) return false;
    if (machine.accelerator === 'nvidia' && machine.vram && Number(model.min_vram_gb) > machine.vram) return false;
    return true;
  }

  function badge(model) {
    const status = model.local_status || 'local';
    const modifier = status === 'hybrid' ? ' lc-ai-badge-hybrid' : status === 'api' ? ' lc-ai-badge-api' : '';
    const label = status === 'local' ? 'Local weights' : status === 'hybrid' ? 'Hybrid' : 'API only';
    return `<span class="lc-ai-badge${modifier}">${label}</span>`;
  }

  function modelCard(model, fit) {
    const tasks = array(model.tasks).slice(0, 4).map((task) => `<span class="lc-ai-task">${escapeHtml(prettyTerm(task))}</span>`).join('');
    const fitClass = fit.fits === false ? ' lc-ai-fit-no' : '';
    const vram = Number(model.min_vram_gb) ? `${Number(model.min_vram_gb)} GB` : 'None';
    const preview = ['video', '3d'].includes(model.category)
      ? `<div class="lc-external-media lc-external-media-compact" data-external-media data-media-category="${escapeHtml(model.category)}" data-media-id="${escapeHtml(model.id)}"></div>`
      : '';
    return `<article class="lc-ai-card">
      <div class="lc-ai-card-top"><span class="lc-ai-card-category">${escapeHtml(labels[model.category] || titleCase(model.category))}</span>${badge(model)}</div>
      <h3><a href="${escapeHtml(model.path)}">${escapeHtml(model.name)}</a></h3>
      <p class="lc-ai-card-summary">${escapeHtml(model.summary)}</p>
      ${preview}
      <div class="lc-ai-task-list">${tasks}</div>
      <div class="lc-ai-specs"><div class="lc-ai-spec"><span>RAM floor</span><strong>${Number(model.min_ram_gb) ? `${Number(model.min_ram_gb)} GB` : 'Hosted'}</strong></div><div class="lc-ai-spec"><span>VRAM floor</span><strong>${escapeHtml(vram)}</strong></div><div class="lc-ai-spec"><span>Runtime</span><strong>${escapeHtml(array(model.runtime).slice(0, 2).join(' · ') || 'See guide')}</strong></div><div class="lc-ai-spec"><span>License</span><strong>${escapeHtml(model.license || 'See source')}</strong></div></div>
      <div class="lc-ai-card-actions"><span class="lc-ai-fit${fitClass}">${escapeHtml(fit.reason)}</span><a class="lc-ai-button" href="${escapeHtml(model.path)}">Open guide</a></div>
    </article>`;
  }

  function render() {
    const machine = selectedMachine();
    const results = allModels
      .filter((model) => matches(model, machine))
      .map((model) => ({ model, fit: fitFor(model, machine) }))
      .sort((a, b) => {
        const fitA = a.fit.fits === true ? 0 : a.fit.fits === null ? 1 : 2;
        const fitB = b.fit.fits === true ? 0 : b.fit.fits === null ? 1 : 2;
        return fitA - fitB || Number(a.model.min_ram_gb) - Number(b.model.min_ram_gb) || a.model.name.localeCompare(b.model.name);
      });

    elements.count.textContent = `${results.length} of ${allModels.length} records`;
    elements.grid.innerHTML = results.length
      ? results.map(({ model, fit }) => modelCard(model, fit)).join('')
      : '<div class="lc-ai-empty"><strong>No verified model matches these filters.</strong><br>Try more memory, another compute path or a broader search.</div>';

    const machineChosen = machine.platform !== 'all' || machine.accelerator !== 'all' || machine.ram || machine.vram;
    if (machineChosen && elements.machineStatus && !readSavedMachine()) {
      elements.machineStatus.textContent = `${prettyTerm(machine.platform === 'all' ? 'any system' : machine.platform)} · ${prettyTerm(machine.accelerator === 'all' ? 'any compute' : machine.accelerator)} · ${machine.ram || 'Any'} GB RAM${machine.vram ? ` · ${machine.vram} GB VRAM` : ''}.`;
    }
  }

  [elements.search, elements.category, elements.platform, elements.accelerator, elements.ram, elements.vram].filter(Boolean).forEach((element) => {
    element.addEventListener(element === elements.search ? 'input' : 'change', render);
  });

  applySavedMachine();
  render();
})();
