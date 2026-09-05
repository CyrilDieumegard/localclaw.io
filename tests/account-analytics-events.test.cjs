const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const machine = {
    id: 'qa-machine', name: 'QA machine', platform: 'macos', accelerator: 'apple-silicon',
    ramGb: 32, vramGb: null, useCase: 'coding', priority: 'balanced', source: 'finder'
};
const model = { id: 'qa-model', name: 'QA model', recommended_quant: 'Q4_K_M', compatibilityTier: 'best' };

function storage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key)
    };
}

function harness() {
    const accepted = [];
    const rejected = [];
    const node = () => ({
        innerHTML: '', textContent: '', testValues: {},
        classList: { add() {}, remove() {} },
        querySelector() { return null; }, querySelectorAll() { return []; }
    });
    const panel = node();
    const context = vm.createContext({
        console, URLSearchParams,
        document: { addEventListener() {} },
        navigator: { onLine: true },
        localStorage: storage(), sessionStorage: storage(),
        innerWidth: 1440, location: { pathname: '/account', search: '' },
        setTimeout() {}, clearTimeout() {},
        APP_DATA: { models: [model] },
        LocalClawCompatibility: { rankModels() { return { compatible: [model] }; } },
        FormData: class {
            constructor(form) { this.values = form.testValues; }
            get(key) { return this.values[key] ?? ''; }
        },
        async fetch(url, options) {
            const payload = JSON.parse(options.body);
            return {
                ok: true, status: 200,
                json: async () => url.startsWith('/api/favorites/')
                    ? { favorite: { ...payload, modelId: 'qa-model' } }
                    : { machine: { ...payload, id: 'saved-machine' } }
            };
        }
    });
    context.window = context;
    // Match the browser SDK's validation failure behavior: reject the event
    // without throwing or returning a delivery acknowledgement.
    const sdk = (name, properties) => {
        const keys = Object.keys(properties);
        if (keys.length > 10 || keys.some((key) => key.length > 32 || !/^[a-z0-9_-]+$/.test(key))) {
            rejected.push({ name, properties });
            return;
        }
        accepted.push({ name, properties: JSON.parse(JSON.stringify(properties)) });
    };
    context.datafast = sdk;
    vm.runInContext(read('js/account-analytics-20260820a.js'), context);
    const account = read('js/account-20260802a.js');
    const close = account.lastIndexOf('})();');
    assert(close > 0);
    context.qaPanel = panel;
    context.qaForm = node();
    context.qaMachine = machine;
    vm.runInContext(account.slice(0, close) + `
        state.machines = [qaMachine];
        state.selectedMachineId = qaMachine.id;
        elements.recommendationPanel = qaPanel;
        elements.testForm = qaForm;
        elements.testFormError = { textContent: '' };
        renderPlanOverview = function () { return ''; };
        renderMachineFamilySummary = function () { return ''; };
        renderModelCard = function () { return ''; };
        renderUpgradePlanner = function () { return ''; };
        renderMachineList = function () {};
        loadWorkspace = async function () { return true; };
        closeTestDialog = function () {};
        showToast = function () {};
        window.qa = { state, elements, renderSelectedMachine, createPendingPlanMachine, saveTestLog };
    ` + account.slice(close), context);
    return { context, accepted, rejected, sdk, analytics: context.LocalClawAccountAnalytics, api: context.qa };
}

function event(run, name) {
    const found = run.accepted.find((item) => item.name === name);
    assert(found, `${name} must pass the strict SDK validator`);
    assert(Object.keys(found.properties).length <= 10);
    return found.properties;
}

test('the real recommendation renderer keeps all event and machine data within the SDK limit', () => {
    const run = harness();
    run.api.renderSelectedMachine();
    assert.deepEqual(event(run, 'account_recommendation_viewed'), {
        source: 'account_workspace', view: 'compatible', shown_count: 1,
        best_match_count: 1, saved_count: 0,
        platform: 'macos', accelerator: 'apple-silicon', ram_bucket: '17_to_32', use_case: 'coding', priority: 'balanced'
    });
    assert.equal(run.rejected.length, 0);
    run.api.state.viewMode = 'new';
    run.api.renderSelectedMachine();
    const update = event(run, 'plan_update_viewed');
    assert.equal(update.plan_state, 'current');
    assert.equal(update.update_count, 0);
    assert.equal(run.rejected.length, 0);
});

test('real automatic machine and plan success events reach the strict SDK, retaining business properties', async () => {
    const run = harness();
    run.api.state.machines = [];
    await run.api.createPendingPlanMachine({ machine, topModelId: model.id });
    const created = event(run, 'machine_create_succeeded');
    assert.equal(created.source, 'account_plan_handoff');
    assert.equal(created.machine_action, 'create');
    assert.equal(created.is_first_machine, true);
    assert.equal(created.entry_source, 'direct');
    const saved = event(run, 'plan_saved');
    assert.equal(saved.save_mode, 'automatic');
    assert.equal(saved.top_model, model.id);
    assert.equal(saved.is_first_machine, true);
    assert.equal(saved.ram_bucket, '17_to_32');
    assert.equal(saved.entry_source, 'direct');
    assert.equal(run.rejected.length, 0);
});

test('the real private test-log action keeps its outcome without exposing notes or overflowing metadata', async () => {
    const run = harness();
    run.api.elements.testForm.testValues = {
        machineId: machine.id, modelId: model.id, status: 'installed', testVerdict: 'works',
        quantization: 'Q4_K_M', measuredTps: '24', notes: 'Private test note'
    };
    await run.api.saveTestLog({ preventDefault() {} });
    const saved = event(run, 'test_log_saved');
    assert.equal(saved.source, 'account_recommendations');
    assert.equal(saved.model_id, model.id);
    assert.equal(saved.status, 'installed');
    assert.equal(saved.verdict, 'works');
    assert.equal(saved.entry_source, 'direct');
    assert(!JSON.stringify(saved).includes('Private test note'));
    assert.equal(run.rejected.length, 0);
});

test('error outcome fields take priority even when hardware and acquisition properties arrive first', () => {
    const run = harness();
    assert(run.analytics.track('machine_create_failed', {
        device_type: 'desktop', landing_page: '/blog/example', entry_source: 'article',
        priority: 'balanced', use_case: 'coding', ram_bucket: '17_to_32', accelerator: 'apple-silicon', platform: 'macos',
        source: 'account_workspace', machine_action: 'create', error_stage: 'machine_save',
        error_code: 'network_error', http_status: 503, online: false
    }));
    const failed = event(run, 'machine_create_failed');
    for (const key of ['source', 'machine_action', 'error_stage', 'error_code', 'http_status', 'online']) {
        assert(Object.prototype.hasOwnProperty.call(failed, key), `Critical event property ${key} was dropped`);
    }
    assert.equal(failed.online, false);
    assert.equal(failed.http_status, 503);
    assert.equal(Object.keys(failed).length, 10);
    assert.equal(failed.priority, undefined);
    assert.equal(failed.device_type, undefined);
    assert.equal(run.rejected.length, 0);
});

test('sanitization happens before budgeting and safe explicit context overrides are preserved', () => {
    const run = harness();
    run.analytics.track('auth_started', {
        provider: 'google', email: 'private@example.com', notes: 'private', unknown: 'ignored',
        error_code: '', http_status: NaN, source: 'private@example.com',
        entry_source: 'catalogue', landing_page: '/llm-list', device_type: 'mobile'
    });
    assert.deepEqual(event(run, 'auth_started'), {
        provider: 'google', entry_source: 'catalogue', landing_page: '/llm-list', device_type: 'mobile'
    });
    assert.equal(run.rejected.length, 0);
});

test('the mock rejects oversized events without throwing, and real tracking only deduplicates a valid invocation', () => {
    const run = harness();
    run.sdk('oversized-control', Object.fromEntries(Array.from({ length: 11 }, (_, index) => [`p${index}`, index])));
    assert.equal(run.rejected.length, 1, 'The mock must reproduce the SDK validation failure');
    assert.equal(run.accepted.length, 0);

    const options = { onceKey: 'auth-once' };
    run.context.datafast = () => { throw new Error('SDK unavailable'); };
    assert.equal(run.analytics.track('auth_started', { provider: 'google' }, options), false);
    assert.equal(run.context.sessionStorage.getItem('localclaw_account_goal:auth-once'), null);
    run.context.datafast = undefined;
    assert.equal(run.analytics.track('auth_started', { provider: 'google' }, options), false);
    run.context.datafast = run.sdk;
    assert.equal(run.analytics.track('auth_started', { provider: 'google' }, options), true);
    assert.equal(run.analytics.track('auth_started', { provider: 'google' }, options), false);
    assert.equal(run.analytics.track('not_allowed', {}, { onceKey: 'invalid' }), false);
    assert.equal(run.context.sessionStorage.getItem('localclaw_account_goal:invalid'), null);
    assert.equal(run.accepted.length, 1);
    assert.equal(run.rejected.length, 1, 'Only the intentionally oversized control should be rejected');
});
