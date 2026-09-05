const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function harness(href = 'https://localclaw.io/') {
    const scheduled = [];
    const events = [];
    const listeners = {};
    const location = new URL(href);
    location.assign = (url) => { throw new Error(`Unexpected navigation instead of an in-page result: ${url}`); };
    const storage = new Map();
    const document = {
        readyState: 'loading',
        title: 'LocalClaw',
        addEventListener() {},
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        head: {appendChild() {}},
        body: {classList: {contains: () => false}, querySelector: () => null},
        createElement: () => ({})
    };
    const context = vm.createContext({
        document, location, URL, URLSearchParams, console,
        navigator: {platform: '', userAgent: ''},
        setTimeout: (fn) => { scheduled.push(fn); },
        clearTimeout() {}, requestAnimationFrame: (fn) => { scheduled.push(fn); },
        addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
        removeEventListener: (name, fn) => { listeners[name] = (listeners[name] || []).filter(item => item !== fn); },
        dispatchEvent: (event) => { for (const fn of listeners[event.type] || []) fn(event); },
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        history: {state: null, replaceState(_state, _unused, href) { const url = new URL(href, location); location.href = url.href; }},
        localStorage: {getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value)},
        sessionStorage: {getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value)},
    });
    context.window = context;
    for (const file of ['js/data.js', 'js/model-ranking.js', 'js/fit-context.js', 'js/app-20260816a.js']) vm.runInContext(source(file), context, {filename: file});
    const app = vm.runInContext('App', context);
    const rankingInputs = [];
    const rankModels = context.LocalClawModelRanking.rankModels;
    context.LocalClawModelRanking.rankModels = (machine, ...args) => { rankingInputs.push({...machine}); return rankModels(machine, ...args); };
    const views = [];
    app.trackGoal = (name, properties) => events.push({name, properties});
    app.render = () => {
        const container = {innerHTML: ''};
        if (app.state.view === 'flow') app.renderFlowStep(container);
        views.push({view: app.state.view, index: app.state.currentStepIndex, html: container.innerHTML});
    };
    const flush = () => {
        let count = 0;
        while (scheduled.length) {
            assert.ok(count++ < 150, 'animation/timer callbacks should terminate');
            scheduled.shift()();
        }
    };
    const loadGrowth = () => {
        document.readyState = 'complete';
        vm.runInContext(source('js/growth-paths-20260727a.js'), context, {filename: 'growth-paths'});
        flush();
    };
    return {context, app, views, document, flush, loadGrowth, events, rankingInputs};
}

for (const ram of [24, 128]) test(`a ${ram} GB guide keeps exact RAM through skipped memory, recommendation, saved plan and model link`, () => {
    const h = harness(`https://localclaw.io/?from=ram-guide&ram=${ram}#model-finder`);
    h.loadGrowth();
    assert.equal(h.app.state.answers.ramGb, ram);
    assert.equal(h.app.state.currentStepIndex, 0);
    assert.match(h.views.at(-1).html, new RegExp(`${ram} GB`));
    assert.match(h.views.at(-1).html, /Step 1\/2/);
    h.app.handleOptionSelect('os', 'mac');
    assert.equal(h.app.state.currentStepIndex, 2, 'the known memory step is skipped');
    assert.match(h.views.at(-1).html, /Step 2\/2/);
    h.app.handleOptionSelect('usage', 'code');
    assert.equal(h.app.state.view, 'results');
    assert.equal(h.app.buildCurrentMachineProfile().ramGb, ram);
    assert.equal(h.app.buildCurrentPlanPayload().machine.ramGb, ram);
    const model = h.app.state.recommendations[0];
    const link = new URL(h.app.modelLink(model).replaceAll('&amp;', '&'), 'https://localclaw.io');
    assert.equal(link.searchParams.get('fitRam'), String(ram));
    assert.equal(link.searchParams.get('fitAccelerator'), 'apple-silicon');
    assert.equal(link.searchParams.get('fitGoal'), 'coding');
    assert.equal(link.searchParams.get('fitContext'), '8k');
    assert.equal(link.pathname, `/models/${model.id}`);
});

test('known Windows and usage from a guide skip all answered steps', () => {
    const h = harness('https://localclaw.io/?from=ram-guide&ram=24&os=windows&usage=code#model-finder');
    h.loadGrowth();
    assert.equal(h.app.state.view, 'results');
    assert.equal(h.app.buildCurrentMachineProfile().platform, 'windows');
    assert.equal(h.app.buildCurrentMachineProfile().ramGb, 24);
});

test('Change memory replaces the exact guide RAM and keeps an unanswered OS in the flow', () => {
    const h = harness('https://localclaw.io/?from=ram-guide&ram=128#model-finder');
    h.loadGrowth();
    h.app.editPrefilledMemory();
    assert.equal(h.app.state.currentStepIndex, 1);
    assert.equal(h.app.state.answers.ramGb, undefined);
    h.app.handleOptionSelect('level', 'standard');
    assert.equal(h.app.state.currentStepIndex, 0, 'OS must still be asked after editing RAM from the first step');
    h.app.handleOptionSelect('os', 'mac');
    assert.equal(h.app.state.currentStepIndex, 2, 'the edited memory answer must not be asked twice');
    h.app.handleOptionSelect('usage', 'chat');
    assert.equal(h.app.state.view, 'results');
    assert.equal(h.app.buildCurrentMachineProfile().ramGb, 16);
    assert.equal(h.app.buildCurrentMachineProfile().platform, 'macos');
});

test('Change memory after choosing the OS retains it and Back restores the guide value', () => {
    const h = harness('https://localclaw.io/?from=ram-guide&ram=24#model-finder');
    h.loadGrowth();
    h.app.handleOptionSelect('os', 'win');
    h.app.editPrefilledMemory();
    h.app.goBack();
    assert.equal(h.app.state.currentStepIndex, 2);
    assert.equal(h.app.state.answers.ramGb, 24);
    h.app.editPrefilledMemory();
    h.app.handleOptionSelect('level', 'power');
    assert.equal(h.app.state.currentStepIndex, 2);
    h.app.handleOptionSelect('usage', 'code');
    assert.equal(h.app.buildCurrentMachineProfile().ramGb, 32);
    assert.equal(h.app.buildCurrentMachineProfile().platform, 'windows');
});

function installQuickForm(h) {
    let form = null;
    const hero = {
        querySelector: (selector) => selector === '.lc-quick-fit' ? form : null,
        appendChild(node) { form = node; },
    };
    h.document.body.classList.contains = name => name === 'lc-home-index';
    h.document.querySelector = (selector) => selector === '.lc-index-hero__copy' ? hero : selector === '.lc-quick-fit' ? form : null;
    h.document.createElement = (tag) => {
        if (tag !== 'form') return {};
        const node = {elements: {}, dataset: {}, isConnected: true, listeners: {}, setAttribute() {}, addEventListener(name, fn) { this.listeners[name] = fn; }};
        Object.defineProperty(node, 'innerHTML', {set(html) {
            for (const select of html.matchAll(/<select name="([^"]+)"([^>]*)>([\s\S]*?)<\/select>/g)) {
                const options = [...select[3].matchAll(/<option value="([^"]*)"([^>]*)>/g)].map(match => ({value: match[1], selected: match[2].includes('selected')}));
                const control = {options, required: /\brequired\b/.test(select[2]), append(option) { this.options.push(option); }, _value: options.find(option => option.selected)?.value || options[0].value};
                Object.defineProperty(control, 'value', {get() { return this._value; }, set(value) { this._value = this.options.some(option => option.value === String(value)) ? String(value) : ''; }});
                node.elements[select[1]] = control;
            }
        }});
        return node;
    };
    h.document.readyState = 'complete';
    vm.runInContext(source('js/conversion-paths-20260827a.js'), h.context, {filename: 'conversion-paths'});
    h.flush();
    return form;
}

test('quick submission uses global const App when window.App is absent', () => {
    const h = harness();
    assert.equal(h.context.App, undefined);
    const form = installQuickForm(h);
    form.elements.system.value = 'mac';
    form.elements.ram.value = '16';
    form.elements.goal.value = 'code';
    form.listeners.submit({preventDefault() {}});
    assert.equal(h.app.state.view, 'results');
    assert.equal(h.app.state.flowSource, 'home_quick_fit');
    assert.ok(h.app.state.recommendations.length > 0);
    assert.equal(h.app.buildCurrentMachineProfile().ramGb, 16);
    assert.equal(h.app.buildCurrentMachineProfile().accelerator, 'apple-silicon');
    assert.equal(h.context.location.search.includes('fitRam=16'), true);
});

test('a RAM-only catalogue link asks for the unknown system explicitly before submission', () => {
    const h = harness('https://localclaw.io/?fitRam=16#llm-index');
    const form = installQuickForm(h);
    assert.equal(form.elements.system.value, '');
    assert.equal(form.elements.system.required, true);
    assert.equal(form.elements.ram.value, '16');
});

for (const accelerator of ['nvidia', 'amd']) test(`quick submission preserves the saved ${accelerator} GPU, VRAM and context`, () => {
    const h = harness();
    h.context.localStorage.setItem('localclaw_primary_machine', JSON.stringify({id: 'saved-gpu', ramGb: 64, platform: 'linux', accelerator, vramGb: 24, context: '32k', useCase: 'coding'}));
    const form = installQuickForm(h);
    assert.equal(form.elements.system.value, 'linux');
    assert.equal(form.elements.ram.value, '64');
    form.listeners.submit({preventDefault() {}});
    assert.equal(h.app.state.view, 'results');
    const profile = h.app.buildCurrentMachineProfile();
    assert.equal(profile.accelerator, accelerator);
    assert.equal(profile.vramGb, 24);
    assert.equal(h.rankingInputs.at(-1).accelerator, accelerator);
    assert.equal(h.rankingInputs.at(-1).vramGb, 24);
    assert.equal(h.app.state.answers.context, '32k');
    const link = new URL(h.app.modelLink(h.app.state.recommendations[0]).replaceAll('&amp;', '&'), 'https://localclaw.io');
    assert.equal(link.searchParams.get('fitAccelerator'), accelerator);
    assert.equal(link.searchParams.get('fitVram'), '24');
    assert.equal(link.searchParams.get('fitContext'), '32k');
});

test('late initial saved-machine hydration synchronizes the quick form to 32 GB', () => {
    const h = harness();
    const form = installQuickForm(h);
    assert.equal(form.elements.ram.value, '16');
    const machine = {id: 'saved-mac32', name: 'Mac Studio', ramGb: 32, platform: 'macos', accelerator: 'apple-silicon', useCase: 'coding', context: '8k'};
    h.context.dispatchEvent(new h.context.CustomEvent('localclaw:home-machine-selection', {detail: {machine, explicit: false}}));
    assert.equal(form.elements.system.value, 'mac');
    assert.equal(form.elements.ram.value, '32');
    assert.equal(form.elements.goal.value, 'code');
    form.listeners.submit({preventDefault() {}});
    assert.equal(h.app.buildCurrentMachineProfile().ramGb, 32);
    assert.equal(h.app.buildCurrentMachineProfile().accelerator, 'apple-silicon');
});

test('typing wins over automatic hydration, while an explicit saved 64 GB selection updates the quick form', () => {
    const h = harness();
    const form = installQuickForm(h);
    form.elements.system.value = 'mac';
    form.elements.ram.value = '16';
    form.listeners.change();
    const automatic = {id: 'saved-mac32', ramGb: 32, platform: 'macos', accelerator: 'apple-silicon', useCase: 'chat'};
    h.context.dispatchEvent(new h.context.CustomEvent('localclaw:home-machine-selection', {detail: {machine: automatic, explicit: false}}));
    assert.equal(form.elements.ram.value, '16', 'account hydration must preserve an in-progress choice');
    assert.equal(form.elements.goal.value, 'code');
    const selected = {id: 'saved-pc64', ramGb: 64, platform: 'windows', accelerator: 'nvidia', vramGb: 24, useCase: 'reasoning', context: '16k'};
    h.context.dispatchEvent(new h.context.CustomEvent('localclaw:home-machine-selection', {detail: {machine: selected, explicit: true}}));
    assert.equal(form.elements.system.value, 'windows');
    assert.equal(form.elements.ram.value, '64');
    assert.equal(form.elements.goal.value, 'reasoning');
    form.listeners.submit({preventDefault() {}});
    assert.equal(h.app.buildCurrentMachineProfile().ramGb, 64);
    assert.equal(h.app.buildCurrentMachineProfile().accelerator, 'nvidia');
    assert.equal(h.app.buildCurrentMachineProfile().vramGb, 24);
    assert.equal(h.app.state.answers.context, '16k');
});

for (const platform of ['windows', 'linux']) test(`a quick ${platform} recommendation keeps the matching free setup path`, () => {
    const h = harness();
    h.app.state.activeFlow = 'pro';
    h.app.state.answers = {parsedRam: 32, parsedOS: platform, gpu: 'cpu'};
    assert.match(h.app.buildOneClickSetupBlock({name: 'Test model'}), new RegExp(`free ${platform === 'windows' ? 'Windows' : 'Linux'} setup guide`));
    assert.doesNotMatch(h.app.buildOneClickSetupBlock({name: 'Test model'}), /pricing.html/);
});
