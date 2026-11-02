/* LocalClaw memory planner. Pure arithmetic is shared by the page and its checks. */
(function (root) {
  'use strict';
  const GIB = 1024 ** 3;
  // Architecture dimensions come from the linked original config.json files.
  // Parameter counts are rounded; use the file-size override for a real GGUF.
  const presets = {
    'qwen-7b': { name: 'Qwen2.5 7B', params: 7.61, layers: 28, heads: 4, dimension: 128, maxContext: 32768, source: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/blob/main/config.json' },
    'qwen-14b': { name: 'Qwen2.5 14B', params: 14.7, layers: 48, heads: 8, dimension: 128, maxContext: 32768, source: 'https://huggingface.co/Qwen/Qwen2.5-14B-Instruct/blob/main/config.json' },
    'qwen-32b': { name: 'Qwen2.5 32B', params: 32.5, layers: 64, heads: 8, dimension: 128, maxContext: 32768, source: 'https://huggingface.co/Qwen/Qwen2.5-32B-Instruct/blob/main/config.json' }
  };
  const defaults = { preset: 'qwen-7b', params: 7.61, bits: 4, context: 8192, layers: 28, heads: 4, dimension: 128, cache: 2, sequences: 1, overhead: 10, file: 0, runtime: 1, reserve: 3, capacity: 16, pool: 'unified' };
  const limits = {
    params: [0.1, 2000], bits: [2, 32], context: [128, 1048576], layers: [1, 256],
    heads: [1, 256], dimension: [1, 1024], cache: [2, 4], sequences: [1, 64],
    overhead: [0, 100], file: [0, 2000], runtime: [0, 128], reserve: [0, 256], capacity: [1, 4096]
  };
  function calculate(input) {
    const p = { ...defaults, ...input };
    for (const [key, [min, max]] of Object.entries(limits)) {
      if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key] < min || p[key] > max) throw new RangeError(`Invalid ${key}`);
    }
    for (const key of ['context', 'layers', 'heads', 'dimension', 'sequences']) {
      if (!Number.isInteger(p[key])) throw new RangeError(`Invalid ${key}`);
    }
    if (![2, 4].includes(p.cache)) throw new RangeError('Invalid cache');
    if (!['unified', 'cpu', 'gpu'].includes(p.pool)) throw new RangeError('Invalid pool');
    const weights = p.file > 0 ? p.file * 1e9 / GIB : p.params * 1e9 * p.bits / 8 * (1 + p.overhead / 100) / GIB;
    const kv = 2 * p.layers * p.heads * p.dimension * p.context * p.cache * p.sequences / GIB;
    const total = weights + kv + p.runtime + p.reserve;
    const remaining = p.capacity - total;
    return { weights, kv, runtime: p.runtime, reserve: p.reserve, total, remaining, status: remaining < 0 ? 'over' : remaining / p.capacity < 0.15 ? 'tight' : 'within' };
  }
  const api = { presets, defaults, limits, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LocalClawMemory = api;
  if (typeof document === 'undefined') return;
  const form = document.getElementById('memory-form');
  if (!form) return;
  const byId = id => document.getElementById(id);
  const fields = Object.keys(defaults);
  const format = value => value.toFixed(2);
  let current;
  const saved = new URLSearchParams(location.search);
  for (const key of fields) {
    if (!saved.has(key)) continue;
    const value = saved.get(key);
    const field = form.elements.namedItem(key);
    if (limits[key]) {
      const n = Number(value);
      const [min, max] = limits[key];
      if (value.trim() && Number.isFinite(n) && n >= min && n <= max) field.value = String(n);
    } else if ([...field.options].some(option => option.value === value)) field.value = value;
  }
  function read() {
    return Object.fromEntries(fields.map(key => [key, limits[key] ? Number(form.elements.namedItem(key).value) : form.elements.namedItem(key).value]));
  }
  function shareUrl(p) {
    const url = new URL(location.pathname, location.origin);
    for (const key of fields) url.searchParams.set(key, p[key]);
    return url.href;
  }
  function render() {
    current = null;
    byId('memory-share-url').hidden = true;
    const valid = form.checkValidity();
    byId('memory-error').hidden = valid;
    byId('memory-results').hidden = !valid;
    byId('memory-context-comparison').hidden = !valid;
    byId('memory-share').disabled = !valid;
    byId('memory-csv').disabled = !valid;
    if (!valid) return;
    const p = read();
    let result;
    try { result = calculate(p); } catch {
      byId('memory-error').hidden = false;
      byId('memory-results').hidden = true;
      byId('memory-context-comparison').hidden = true;
      byId('memory-share').disabled = true;
      byId('memory-csv').disabled = true;
      return;
    }
    current = { p, result };
    for (const key of ['weights', 'kv', 'runtime', 'reserve', 'total']) byId(`memory-${key}`).textContent = format(result[key]);
    byId('memory-remaining').textContent = `${format(Math.abs(result.remaining))} GiB ${result.remaining < 0 ? 'over budget' : 'left in your budget'}`;
    const status = byId('memory-status');
    status.dataset.state = result.status;
    status.textContent = { over: 'Exceeds your memory budget', tight: 'Tight planning budget', within: 'Within your planning budget' }[result.status];
    byId('memory-pool').textContent = { unified: 'Unified memory', cpu: 'System RAM', gpu: 'GPU VRAM' }[p.pool];
    byId('memory-budget').textContent = `${p.capacity} GiB`;
    const parts = ['weights', 'kv', 'runtime', 'reserve'];
    parts.forEach(key => { byId(`memory-bar-${key}`).style.width = `${result[key] / result.total * 100}%`; });
    const preset = presets[p.preset];
    byId('memory-source').hidden = !preset;
    if (preset) {
      byId('memory-source').href = preset.source;
      byId('memory-source').textContent = `${preset.name} architecture source ↗`;
    }
    byId('memory-context-warning').hidden = !(preset && p.context > preset.maxContext);
    byId('memory-gpu-note').hidden = p.pool !== 'gpu';
    byId('memory-file-note').textContent = p.file > 0 ? 'Using your actual file size. Quantization and weight overhead do not alter the weight estimate.' : 'Weight size is an approximation. Enter your actual GGUF size in Advanced for a better estimate.';
    const rows = [2048, 8192, 16384, 32768].map(context => {
      const r = calculate({ ...p, context });
      return `<tr><th scope="row">${context.toLocaleString('en-US')}</th><td>${format(r.kv)} GiB</td><td>${format(r.total)} GiB</td><td>${r.status === 'over' ? 'Over budget' : r.status === 'tight' ? 'Tight' : 'Within budget'}</td></tr>`;
    });
    byId('memory-context-rows').innerHTML = rows.join('');
  }
  form.addEventListener('input', event => {
    if (event.target.name === 'preset') return;
    if (['params', 'layers', 'heads', 'dimension'].includes(event.target.name)) form.elements.preset.value = 'custom';
    render();
  });
  form.elements.preset.addEventListener('change', () => {
    const preset = presets[form.elements.preset.value];
    if (preset) {
      for (const key of ['params', 'layers', 'heads', 'dimension']) form.elements.namedItem(key).value = preset[key];
      form.elements.file.value = '0';
    }
    render();
  });
  form.elements.pool.addEventListener('change', () => {
    form.elements.reserve.value = form.elements.pool.value === 'gpu' ? '0' : '3';
    render();
  });
  form.addEventListener('submit', event => event.preventDefault());
  byId('memory-reset').addEventListener('click', () => { form.reset(); render(); });
  byId('memory-share').addEventListener('click', async () => {
    if (!current) return;
    const url = shareUrl(current.p);
    try {
      await navigator.clipboard.writeText(url);
      byId('memory-feedback').textContent = 'Link copied. It includes all your settings.';
    } catch {
      const field = byId('memory-share-url');
      field.hidden = false;
      field.value = url;
      field.focus();
      field.select();
      byId('memory-feedback').textContent = 'Copy the selected link to share these settings.';
    }
  });
  byId('memory-csv').addEventListener('click', () => {
    if (!current) return;
    const { p, result } = current;
    const rows = [['LocalClaw memory planning estimate', 'Value'], ['Method version', '1.0'], ...Object.entries(p), ...Object.entries(result), ['Units for memory results', 'GiB'], ['Reproduce', shareUrl(p)], ['Method', 'https://localclaw.io/local-llm-memory-calculator#methodology'], ['Limit', 'Planning estimate, not a measured benchmark or runtime guarantee']];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localclaw-memory-estimate.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId('memory-feedback').textContent = 'CSV downloaded with inputs, result and a reproducible link.';
  });
  render();
})(typeof globalThis !== 'undefined' ? globalThis : this);
