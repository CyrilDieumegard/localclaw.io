(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.LocalClawNewModels = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    function releaseTimestamp(value) {
        const match = String(value || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
        if (!match) return Number.NEGATIVE_INFINITY;

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3] || 15);
        if (month < 1 || month > 12 || day < 1 || day > 31) return Number.NEGATIVE_INFINITY;

        const timestamp = Date.UTC(year, month - 1, day);
        const parsed = new Date(timestamp);
        if (
            parsed.getUTCFullYear() !== year ||
            parsed.getUTCMonth() !== month - 1 ||
            parsed.getUTCDate() !== day
        ) return Number.NEGATIVE_INFINITY;
        return timestamp;
    }

    function isPracticalLocalModel(model, verification) {
        const description = String(model && model.description || '').toLowerCase();
        const tags = Array.isArray(model && model.tags) ? model.tags.map(tag => String(tag).toLowerCase()) : [];
        const publicGguf = verification && verification.publicGguf || {};
        const hasVerifiedGguf = Boolean(model && model.hf_repo && publicGguf[model.id] === model.hf_repo);
        const excluded = /server-grade only|datacenter-grade only|not yet verified|api only/.test(description);
        const workstationFit = Number(model && model.min_ram || 0) > 0 && Number(model.min_ram) <= 256;
        return Boolean(model && !model.hosted_only && !excluded && !tags.includes('experimental') && workstationFit && model.recommended_quant && hasVerifiedGguf);
    }

    function latestLocalModels(sourceModels, limit, verification) {
        const canonical = new Map();
        for (const [sourceIndex, model] of (Array.isArray(sourceModels) ? sourceModels : []).entries()) {
            if (!model || !model.id) continue;
            canonical.set(model.id, { model, sourceIndex });
        }

        const dated = [];
        for (const { model, sourceIndex } of canonical.values()) {
            if (!isPracticalLocalModel(model, verification)) continue;
            const timestamp = releaseTimestamp(model.released);
            if (!Number.isFinite(timestamp)) continue;
            dated.push({ model, sourceIndex, timestamp });
        }

        dated.sort((left, right) =>
            right.timestamp - left.timestamp || left.sourceIndex - right.sourceIndex
        );
        return dated.slice(0, Number.isFinite(limit) ? Math.max(0, limit) : 12).map(entry => entry.model);
    }

    return { isPracticalLocalModel, latestLocalModels, releaseTimestamp };
});
