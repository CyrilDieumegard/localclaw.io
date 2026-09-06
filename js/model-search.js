// Shared catalogue search: spelling separators do not change model identity.
(function (root) {
    'use strict';

    function compact(value) {
        return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
            .toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    }

    function createMatcher(query) {
        const terms = String(query ?? '').trim().split(/\s+/u).map(compact).filter(Boolean);
        return function matchesModel(model) {
            if (!terms.length) return true;
            const fields = [model.id, model.name, model.family, model.params,
                model.search_term, model.description, ...(model.tags || []), ...(model.aliases || [])].map(compact);
            return terms.every(term => fields.some(field => field.includes(term)));
        };
    }

    const api = Object.freeze({ createMatcher });
    root.LocalClawModelSearch = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
