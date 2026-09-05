(function (root, factory) {
    'use strict';
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.LocalClawFitContext = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const PARAMS = ['fitRam', 'fitPlatform', 'fitAccelerator', 'fitVram', 'fitGoal', 'fitContext', 'fitMachine'];
    const platforms = new Set(['macos', 'windows', 'linux', 'other']);
    const accelerators = new Set(['apple-silicon', 'nvidia', 'amd', 'cpu']);
    const goals = new Set(['general', 'chat', 'coding', 'reasoning', 'vision', 'creative', 'creative-writing', 'rag', 'multilingual', 'fast']);
    const contexts = new Set(['4k', '8k', '16k', '32k']);

    function memory(value, maximum = 2048, minimum = 4) {
        if (value === null || value === undefined || value === '') return null;
        const number = Number(value);
        return Number.isFinite(number) && Number.isInteger(number) && number >= minimum && number <= maximum ? number : null;
    }

    function normalize(machine) {
        if (!machine || !memory(machine.ramGb)) return null;
        const ramGb = memory(machine.ramGb);
        let platform = String(machine.platform || 'other').toLowerCase();
        let accelerator = String(machine.accelerator || 'cpu').toLowerCase();
        if (!platforms.has(platform)) platform = 'other';
        if (!accelerators.has(accelerator)) accelerator = 'cpu';
        if (accelerator === 'apple-silicon') platform = 'macos';
        const rawGoal = String(machine.useCase || 'general').toLowerCase();
        const goal = {code: 'coding', mix: 'general', speed: 'fast'}[rawGoal] || rawGoal;
        const vramGb = accelerator === 'nvidia' || accelerator === 'amd' ? memory(machine.vramGb, 2048, 0) : null;
        const id = /^[a-zA-Z0-9_-]{1,128}$/.test(String(machine.id || '')) ? String(machine.id) : '';
        const hardware = accelerator === 'apple-silicon' ? 'Apple Silicon' : accelerator === 'nvidia' ? 'NVIDIA PC' : accelerator === 'amd' ? 'AMD PC' : {macos: 'Mac', windows: 'Windows PC', linux: 'Linux PC', other: 'Machine'}[platform];
        return {
            id,
            name: `${hardware} · ${ramGb} GB${vramGb ? ` RAM · ${vramGb} GB VRAM` : ''}`,
            platform,
            accelerator,
            ramGb,
            vramGb,
            useCase: goals.has(goal) ? goal : 'general',
            priority: 'balanced',
            context: contexts.has(machine.context) ? machine.context : '8k'
        };
    }

    function fromSearch(search) {
        const params = new URLSearchParams(search === undefined ? root.location?.search || '' : search);
        return normalize({
            ramGb: params.get('fitRam') ?? params.get('ram'),
            platform: params.get('fitPlatform'),
            accelerator: params.get('fitAccelerator'),
            vramGb: params.get('fitVram'),
            useCase: params.get('fitGoal'),
            context: params.get('fitContext'),
            id: params.get('fitMachine')
        });
    }

    function withMachine(href, machine) {
        const url = new URL(href, root.location?.href || 'https://localclaw.io/');
        PARAMS.forEach((key) => url.searchParams.delete(key));
        url.searchParams.delete('ram');
        const selected = normalize(machine);
        if (selected) {
            url.searchParams.set('fitRam', String(selected.ramGb));
            url.searchParams.set('fitPlatform', selected.platform);
            url.searchParams.set('fitAccelerator', selected.accelerator);
            url.searchParams.set('fitGoal', selected.useCase);
            url.searchParams.set('fitContext', selected.context);
            if (selected.vramGb !== null) url.searchParams.set('fitVram', String(selected.vramGb));
            if (selected.id) url.searchParams.set('fitMachine', selected.id);
        }
        return `${url.pathname}${url.search}${url.hash}`;
    }

    function select(machine, options = {}) {
        const selected = normalize(machine);
        if (root.history?.replaceState && root.location) {
            root.history.replaceState(root.history.state, '', withMachine(root.location.href, selected));
        }
        if (options.notify !== false && root.dispatchEvent && root.CustomEvent) {
            root.dispatchEvent(new root.CustomEvent('localclaw:fit-context', {detail: selected}));
        }
        return selected;
    }

    function assess(machine, model, ranking = root.LocalClawModelRanking) {
        if (!ranking || !normalize(machine)) return null;
        const fit = ranking.calculateHardwareFit(machine, model);
        const eligible = ranking.isLocallyEligible(model);
        const key = !eligible || !fit.compatible ? 'too-large' : fit.fitState === 'tight' ? 'tight' : 'fits';
        const label = !eligible ? 'Unavailable' : key === 'too-large' ? 'Too large' : fit.fitState === 'comfortable' ? 'Comfortable' : fit.fitState === 'tight' ? 'Tight fit' : 'Estimated fit';
        const context = normalize(machine).context.toUpperCase();
        return {...fit, key, label, note: `${context} context estimate with system memory reserved. Longer context and other apps need more memory.`};
    }

    return {normalize, fromSearch, withMachine, select, assess};
});
