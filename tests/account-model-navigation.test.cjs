const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const primary = {id: 'primary-32', name: 'Primary Mac 32 GB', ramGb: 32, platform: 'macos', accelerator: 'apple-silicon', vramGb: null, isPrimary: true};
const secondary = {id: 'secondary-16', name: 'Secondary Mac 16 GB', ramGb: 16, platform: 'macos', accelerator: 'apple-silicon', vramGb: null, isPrimary: false};
const decodeHref = href => href.replace(/&amp;/g, '&');
const modelHrefs = html => [...html.matchAll(/href="(\/models\/[^\"]+)"/g)].map(match => decodeHref(match[1]));

function accountHarness(href = 'https://localclaw.io/account') {
    const location = new URL(href);
    const storage = new Map();
    const context = vm.createContext({
        URL, URLSearchParams, location, document: {addEventListener() {}},
        history: {state: null, replaceState(_state, _unused, next) { location.href = new URL(next, location).href; }},
        localStorage: {setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); }}
    });
    context.window = context;
    for (const file of ['js/data.js', 'js/model-ranking.js', 'js/fit-context.js', 'js/machine-compat-20260802a.js']) vm.runInContext(read(file), context, {filename: file});
    const source = read('js/account-20260802a.js');
    const close = source.lastIndexOf('})();');
    vm.runInContext(source.slice(0, close) + `
        window.audit = {state, elements, chooseSelectedMachineId, rememberSelectedMachine, cachePrimaryMachine,
            modelHref, renderPlanOverview, renderMachineFamilySummary, renderModelCard, renderUpgradePlanner,
            openCompareDialog, indexableLocalModels};
    ` + source.slice(close), context, {filename: 'account-20260802a.js'});
    context.audit.state.machines = [{...primary}, {...secondary}];
    return {
        context, storage, location, api: context.audit,
        restore() {
            const id = context.audit.chooseSelectedMachineId();
            context.audit.state.selectedMachineId = id;
            const machine = context.audit.state.machines.find(item => item.id === id);
            context.audit.rememberSelectedMachine(machine);
            context.audit.cachePrimaryMachine();
            return machine;
        }
    };
}

async function detailHarness(href) {
    const model = JSON.parse(read('models/qwen3-14b.html').match(/window\.LOCALCLAW_MODEL=(.*?);<\/script>/)[1]);
    const location = new URL(href, 'https://localclaw.io');
    let html = '', button = null;
    const panel = {isConnected: true, dataset: {}, hidden: true};
    Object.defineProperty(panel, 'innerHTML', {
        get: () => html,
        set(value) {
            if (button) button.isConnected = false;
            html = value;
            const match = value.match(/<button([^>]*data-context-favorite[^>]*)>([^<]*)<\/button>/);
            button = match ? {
                isConnected: true, disabled: /\bdisabled\b/.test(match[1]), textContent: match[2],
                setAttribute() {}, removeAttribute() {}, addEventListener(name, callback) { this[name] = callback; }
            } : null;
        }
    });
    panel.querySelector = selector => selector === '[data-context-favorite]' ? button : null;
    let favorites = [];
    const mutations = [];
    const handlers = {};
    const documentHandlers = {};
    const anchor = href => ({href, getAttribute() { return this.href; }, setAttribute(_name, value) { this.href = value; }});
    const navLinks = [anchor('/account'), anchor('/account?view=saved#machines'), anchor('https://example.com/account')];
    const response = data => ({ok: true, status: 200, json: async () => data});
    const context = vm.createContext({
        URL, URLSearchParams, location, LOCALCLAW_MODEL: model,
        document: {
            querySelector: selector => selector === '[data-localclaw-model-context]' ? panel : null,
            querySelectorAll: selector => selector === 'a[href]' ? navLinks : [],
            addEventListener(name, callback) { (documentHandlers[name] ||= []).push(callback); }
        },
        localStorage: {getItem: () => JSON.stringify(primary), setItem() {}, removeItem() {}},
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        addEventListener(name, callback) { (handlers[name] ||= []).push(callback); },
        dispatchEvent(event) { for (const callback of handlers[event.type] || []) callback(event); },
        fetch: async (url, options = {}) => {
            const method = options.method || 'GET';
            if (method === 'GET' && url === '/api/machines') return response({machines: [primary, secondary]});
            if (method === 'GET' && url === '/api/favorites') return response({favorites});
            assert.equal(url.split('?')[0], `/api/favorites/${model.id}`);
            mutations.push({url, method, body: options.body ? JSON.parse(options.body) : null});
            if (method === 'PUT') {
                const favorite = {...JSON.parse(options.body), modelId: model.id};
                favorites = [favorite];
                return response({favorite});
            }
            assert.equal(method, 'DELETE');
            favorites = [];
            return response({});
        }
    });
    context.window = context;
    for (const file of ['js/model-ranking.js', 'js/fit-context.js', 'js/account-context-20260802b.js', 'js/model-account-context-20260802b.js']) vm.runInContext(read(file), context, {filename: file});
    await context.LocalClawAccountContext.ready;
    await Promise.resolve();
    return {
        context, panel, mutations, navLinks, anchor,
        button: () => button, click: () => button.click({currentTarget: button}),
        activate(link, name = 'click') { for (const callback of documentHandlers[name] || []) callback({target: {closest: () => link}}); }
    };
}

test('all account LLM entry points retain the selected secondary machine', () => {
    const h = accountHarness();
    h.api.state.selectedMachineId = secondary.id;
    const ranked = h.context.LocalClawCompatibility.rankModels(secondary, h.api.indexableLocalModels()).compatible;
    assert.ok(ranked.length >= 2);
    const model = ranked[0];
    const byId = new Map(ranked.map(item => [item.id, item]));
    const surfaces = {
        plan: h.api.renderPlanOverview(secondary, model, 0),
        overview: h.api.renderMachineFamilySummary(secondary, ranked),
        card: h.api.renderModelCard(model, secondary, null, false, true),
        saved: h.api.renderModelCard(model, secondary, {status: 'saved'}, false, true),
        upgrade: h.api.renderUpgradePlanner(secondary, byId)
    };
    h.api.state.compareModelIds = ranked.slice(0, 2).map(item => item.id);
    h.api.elements.compareDialogBody = {innerHTML: ''};
    h.api.elements.compareDialog = {showModal() {}};
    h.api.openCompareDialog(secondary, byId);
    surfaces.comparison = h.api.elements.compareDialogBody.innerHTML;
    for (const [name, html] of Object.entries(surfaces)) {
        const hrefs = modelHrefs(html);
        assert.ok(hrefs.length, `${name} must have a model link`);
        for (const href of hrefs) {
            const params = new URL(href, h.location).searchParams;
            assert.equal(params.get('fitMachine'), secondary.id, name);
            assert.equal(params.get('fitRam'), '16', name);
        }
    }
});

test('secondary detail, save/remove, matching models and account return keep the same owned machine', async () => {
    const account = accountHarness();
    const href = account.api.modelHref('qwen3-14b', secondary);
    const detail = await detailHarness(href);
    assert.match(detail.panel.innerHTML, /Secondary Mac 16 GB/);
    assert.doesNotMatch(detail.panel.innerHTML, /Primary Mac 32 GB/);
    await detail.click();
    assert.equal(detail.mutations[0].method, 'PUT');
    assert.equal(detail.mutations[0].body.machineId, secondary.id);
    await detail.click();
    assert.equal(detail.mutations[1].method, 'DELETE');
    assert.equal(new URL(detail.mutations[1].url, account.location).searchParams.get('machineId'), secondary.id);
    const matching = decodeHref(detail.panel.innerHTML.match(/href="([^"]+)">Matching models/)[1]);
    const matchingUrl = new URL(matching, account.location);
    assert.equal(matchingUrl.hash, '#llm-index');
    assert.equal(matchingUrl.searchParams.get('fitRam'), '16');
    assert.equal(matchingUrl.searchParams.get('fitMachine'), secondary.id);
    const back = decodeHref(detail.panel.innerHTML.match(/href="([^"]+)">My Machines/)[1]);
    const returned = accountHarness(new URL(back, account.location).href);
    assert.equal(returned.restore().id, secondary.id);
    const reloaded = accountHarness(returned.location.href);
    assert.equal(reloaded.restore().id, secondary.id);
    assert.equal(JSON.parse(reloaded.storage.get('localclaw_primary_machine')).id, primary.id);
});

test('account selection persists in the URL while the cached primary remains unchanged', () => {
    const h = accountHarness('https://localclaw.io/account?view=saved#machines');
    h.api.rememberSelectedMachine(secondary);
    h.api.cachePrimaryMachine();
    assert.equal(h.location.searchParams.get('fitMachine'), secondary.id);
    assert.equal(h.location.searchParams.get('view'), 'saved');
    assert.equal(h.location.hash, '#machines');
    assert.equal(JSON.parse(h.storage.get('localclaw_primary_machine')).id, primary.id);
    assert.equal(accountHarness(h.location.href).restore().id, secondary.id);
});

test('header, mobile and late account links preserve selection plus existing view and hash', async () => {
    const account = accountHarness();
    const detail = await detailHarness(account.api.modelHref('qwen3-14b', secondary));
    for (const link of detail.navLinks.slice(0, 2)) {
        const url = new URL(link.href, account.location);
        assert.equal(url.searchParams.get('fitMachine'), secondary.id);
        assert.equal(url.searchParams.get('fitRam'), '16');
    }
    const savedUrl = new URL(detail.navLinks[1].href, account.location);
    assert.equal(savedUrl.searchParams.get('view'), 'saved');
    assert.equal(savedUrl.hash, '#machines');
    assert.equal(detail.navLinks[2].href, 'https://example.com/account', 'do not change an external account URL');
    for (const event of ['click', 'auxclick', 'contextmenu']) {
        const lateLink = detail.anchor('/account?view=new');
        detail.activate(lateLink, event);
        const url = new URL(lateLink.href, account.location);
        assert.equal(url.searchParams.get('fitMachine'), secondary.id, event);
        assert.equal(url.searchParams.get('view'), 'new', event);
    }
});

test('unknown and malformed IDs fall back to an owned primary; stale specs are replaced by stored hardware', () => {
    for (const id of ['deleted-machine', '<invalid>']) {
        const h = accountHarness(`https://localclaw.io/account?fitMachine=${encodeURIComponent(id)}&fitRam=999`);
        assert.equal(h.restore().id, primary.id);
        assert.equal(h.location.searchParams.get('fitMachine'), primary.id);
        assert.equal(h.location.searchParams.get('fitRam'), '32');
    }
    const h = accountHarness(`https://localclaw.io/account?fitMachine=${secondary.id}&fitRam=999&fitPlatform=linux&fitAccelerator=nvidia&fitVram=96`);
    assert.equal(h.restore().id, secondary.id);
    assert.equal(h.location.searchParams.get('fitRam'), '16');
    assert.equal(h.location.searchParams.get('fitPlatform'), 'macos');
    assert.equal(h.location.searchParams.get('fitAccelerator'), 'apple-silicon');
    assert.equal(h.location.searchParams.has('fitVram'), false);
});

test('unowned or stale hardware on a model page cannot save a favorite for a different machine', async () => {
    for (const [id, ram] of [['deleted-machine', 16], [secondary.id, 64]]) {
        const detail = await detailHarness(`/models/qwen3-14b?fitMachine=${id}&fitRam=${ram}&fitPlatform=macos&fitAccelerator=apple-silicon`);
        assert.equal(detail.button(), null);
        assert.equal(detail.mutations.length, 0);
        assert.doesNotMatch(detail.panel.innerHTML, /Your primary machine/);
    }
});
