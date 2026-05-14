(function () {
  'use strict';

  const URL_RE = /^https?:\/\//i;
  const DATE_RE = /^\d{4}-\d{2}$/;

  function asArray(v) {
    return Array.isArray(v) ? v : [];
  }

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
  }

  function validateRequired(model, requiredFields, domain) {
    const errors = [];
    requiredFields.forEach((field) => {
      const val = model[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        errors.push(`[${domain}] Missing required field: ${field} (id=${model.id || 'unknown'})`);
      }
    });
    return errors;
  }

  function validateCommonModel(model, domain) {
    const errors = [];

    if (!isNonEmptyString(model.id)) errors.push(`[${domain}] Invalid id`);
    if (!isNonEmptyString(model.name)) errors.push(`[${domain}] Invalid name (id=${model.id || 'unknown'})`);

    if (!Array.isArray(model.languages)) {
      errors.push(`[${domain}] languages must be an array (id=${model.id || 'unknown'})`);
    }

    if (model.hfLink && !URL_RE.test(model.hfLink)) {
      errors.push(`[${domain}] hfLink must be absolute URL (id=${model.id || 'unknown'})`);
    }

    if (model.releaseDate && !DATE_RE.test(model.releaseDate)) {
      errors.push(`[${domain}] releaseDate must be YYYY-MM (id=${model.id || 'unknown'})`);
    }

    return errors;
  }

  function validateDuplicateIds(models, domain) {
    const errors = [];
    const seen = new Set();
    models.forEach((m) => {
      if (!m || !m.id) return;
      if (seen.has(m.id)) {
        errors.push(`[${domain}] Duplicate id: ${m.id}`);
      } else {
        seen.add(m.id);
      }
    });
    return errors;
  }

  function validateLLM(models) {
    const required = ['id', 'name', 'family', 'params', 'size_gb', 'min_ram', 'tags', 'description', 'benchmarks', 'released'];
    const errors = [];
    const warnings = [];

    asArray(models).forEach((m) => {
      errors.push(...validateRequired(m, required, 'LLM'));

      if (!isNonEmptyString(m.id)) errors.push('[LLM] Invalid id');
      if (!isNonEmptyString(m.name)) errors.push(`[LLM] Invalid name (id=${m.id || 'unknown'})`);
      if (!isNonEmptyString(m.family)) errors.push(`[LLM] Invalid family (id=${m.id || 'unknown'})`);

      if (!Array.isArray(m.tags)) {
        errors.push(`[LLM] tags must be an array (id=${m.id || 'unknown'})`);
      }
      if (typeof m.size_gb !== 'number' || m.size_gb <= 0) {
        errors.push(`[LLM] size_gb must be a positive number (id=${m.id || 'unknown'})`);
      }
      if (typeof m.min_ram !== 'number' || m.min_ram <= 0) {
        errors.push(`[LLM] min_ram must be a positive number (id=${m.id || 'unknown'})`);
      }
      if (!m.benchmarks || typeof m.benchmarks !== 'object') {
        errors.push(`[LLM] benchmarks object is required (id=${m.id || 'unknown'})`);
      } else {
        ['speed', 'quality', 'coding', 'reasoning'].forEach((k) => {
          const v = m.benchmarks[k];
          if (typeof v !== 'number' || v < 0 || v > 10) {
            errors.push(`[LLM] benchmarks.${k} must be number 0..10 (id=${m.id || 'unknown'})`);
          }
        });
      }
      if (m.released && !DATE_RE.test(m.released)) {
        errors.push(`[LLM] released must be YYYY-MM (id=${m.id || 'unknown'})`);
      }

      if (!m.hf_repo && !m.search_term) {
        warnings.push(`[LLM] No hf_repo/search_term source provided (id=${m.id || 'unknown'})`);
      }
    });

    errors.push(...validateDuplicateIds(asArray(models), 'LLM'));

    return {
      domain: 'LLM',
      total: asArray(models).length,
      errors,
      warnings,
      ok: errors.length === 0,
    };
  }

  function validateTTS(models) {
    const required = ['id', 'name', 'developer', 'family', 'description', 'languages', 'features', 'hardware', 'sizeGB', 'quality', 'speed', 'releaseDate', 'license'];
    const errors = [];
    const warnings = [];

    asArray(models).forEach((m) => {
      errors.push(...validateRequired(m, required, 'TTS'));
      errors.push(...validateCommonModel(m, 'TTS'));

      if (typeof m.sizeGB !== 'number' || m.sizeGB < 0) {
        errors.push(`[TTS] sizeGB must be a positive number (id=${m.id || 'unknown'})`);
      }
      if (typeof m.quality !== 'number' || m.quality < 0 || m.quality > 10) {
        errors.push(`[TTS] quality must be number 0..10 (id=${m.id || 'unknown'})`);
      }
      if (typeof m.speed !== 'number' || m.speed < 0 || m.speed > 10) {
        errors.push(`[TTS] speed must be number 0..10 (id=${m.id || 'unknown'})`);
      }
      if (!Array.isArray(m.features) || m.features.length === 0) {
        warnings.push(`[TTS] features is empty (id=${m.id || 'unknown'})`);
      }
      if (m.isAsr && /tts/i.test(m.name)) {
        warnings.push(`[TTS] Marked ASR but name suggests TTS (id=${m.id || 'unknown'})`);
      }
    });

    errors.push(...validateDuplicateIds(asArray(models), 'TTS'));

    return {
      domain: 'TTS',
      total: asArray(models).length,
      errors,
      warnings,
      ok: errors.length === 0,
    };
  }

  function summarize(report) {
    return {
      domain: report.domain,
      total: report.total,
      errorCount: report.errors.length,
      warningCount: report.warnings.length,
      ok: report.ok,
    };
  }

  window.LocalClawDataGovernance = {
    validateLLM,
    validateTTS,
    summarize,
  };
})();
