const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const PLAN_KEY = 'localclaw_pending_plan';
const MACHINE_KEY = 'localclaw_pending_machine';
const baseMachine = {
    name: 'My Mac', platform: 'macos', accelerator: 'apple-silicon',
    ramGb: 32, vramGb: null, useCase: 'coding', priority: 'balanced', source: 'finder'
};

function storage() {
    const values = new Map();
    return {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key)
    };
}

// Exercise the real account handoff and analytics in a VM. Only rendering and
// the subsequent workspace refresh are replaced; no production API is used.
function harness({ machines = [], respond } = {}) {
    const requests = [];
    const events = [];
    const ui = { reviews: [], choices: [], toasts: [], refreshes: [] };
    const localStorage = storage();
    const sessionStorage = storage();
    const context = vm.createContext({
        console, URL, URLSearchParams, localStorage, sessionStorage,
        FormData: class {
            constructor(form) { this.values = form.testValues; }
            get(key) { return this.values[key] ?? ''; }
        },
        navigator: { onLine: true },
        document: { addEventListener() {} },
        window: {
            sessionStorage,
            location: { pathname: '/account', search: '', hostname: 'localhost' },
            datafast(name, properties) { events.push({ name, properties }); }
        },
        async fetch(url, options) {
            const request = { url, ...options, body: JSON.parse(options.body) };
            requests.push(request);
            const answer = respond ? await respond(request) : {
                status: 201,
                data: { machine: { ...request.body, id: 'created-machine' } }
            };
            return {
                ok: answer.status >= 200 && answer.status < 300,
                status: answer.status,
                json: async () => answer.data
            };
        },
        testUi: ui
    });
    vm.runInContext(read('js/account-analytics-20260820a.js'), context);
    const account = read('js/account-20260802a.js');
    const close = account.lastIndexOf('})();');
    assert(close > 0, 'The account IIFE must be available for VM instrumentation');
    const expose = `
        loadWorkspace = async function (id) { testUi.refreshes.push(id); return true; };
        renderMachineList = function () {};
        renderSelectedMachine = function () {};
        cachePrimaryMachine = function () {};
        closeMachineMatchDialog = function () {};
        closeMachineDialog = function () {};
        openMachineDialog = function (machine) { testUi.reviews.push(machine); };
        openMachineMatchDialog = function (pending, matches) {
            state.pendingPlanSelection = { pending, matches };
            testUi.choices.push({ pending, matches });
        };
        showToast = function (message, kind) { testUi.toasts.push({ message, kind }); };
        elements.formError = { textContent: '' };
        elements.form = { testValues: {}, classList: { add() {}, remove() {} } };
        elements.accelerator = { value: '' };
        elements.vramField = { hidden: true };
        elements.vramInput = { required: false };
        window.testHandoff = {
            state, elements, readPendingPlan, resumePendingPlanIfNeeded, saveMachine,
            updateVramField,
            setWorkspaceLoader: function (loader) { loadWorkspace = loader; }
        };
    `;
    vm.runInContext(account.slice(0, close) + expose + account.slice(close), context);
    const api = context.window.testHandoff;
    api.state.machines = machines;
    const seed = (machine = baseMachine, extra = {}) => {
        const plan = { version: 1, topModelId: 'test-model', machine, ...extra };
        localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
        localStorage.setItem(MACHINE_KEY, JSON.stringify(machine));
    };
    return { context, api, seed, localStorage, requests, events, ui };
}

const names = (run) => run.events.map((event) => event.name);

test('a new plan is saved once, emits success, and clears the handoff', async () => {
    const run = harness();
    run.seed();
    await run.api.resumePendingPlanIfNeeded();
    assert.equal(run.requests.length, 1);
    assert.equal(run.requests[0].url, '/api/machines');
    assert.equal(run.requests[0].method, 'POST');
    assert.equal(run.requests[0].body.ramGb, 32);
    assert.equal(run.requests[0].body.isPrimary, true);
    assert(names(run).includes('machine_create_succeeded'));
    assert(names(run).includes('plan_saved'));
    assert(!names(run).includes('plan_save_failed'));
    assert.equal(run.localStorage.getItem(PLAN_KEY), null);
    assert.equal(run.localStorage.getItem(MACHINE_KEY), null);
    assert.equal(run.api.state.saving, false);
    await run.api.resumePendingPlanIfNeeded();
    assert.equal(run.requests.length, 1, 'A second resume must not create a duplicate');
});

test('an API failure retains the pending plan and offers a review without success events', async () => {
    const run = harness({ respond: async () => ({ status: 503, data: { message: 'Try again' } }) });
    run.seed();
    await run.api.resumePendingPlanIfNeeded();
    assert.equal(run.requests.length, 1);
    assert.notEqual(run.localStorage.getItem(PLAN_KEY), null);
    assert.notEqual(run.localStorage.getItem(MACHINE_KEY), null);
    assert.equal(run.ui.reviews.length, 1);
    assert(names(run).includes('plan_save_failed'));
    assert(!names(run).includes('machine_create_succeeded'));
    assert(!names(run).includes('plan_saved'));
    assert.equal(run.api.state.saving, false);
});

test('an existing matching plan is reused without creating another machine', async () => {
    const run = harness({ machines: [{ ...baseMachine, id: 'existing' }] });
    run.seed();
    await run.api.resumePendingPlanIfNeeded();
    assert.equal(run.requests.length, 0);
    assert.equal(run.api.state.selectedMachineId, 'existing');
    assert(names(run).includes('existing_machine_reused'));
    assert(names(run).includes('duplicate_machine_avoided'));
    assert(names(run).includes('plan_saved'));
    assert(!names(run).includes('machine_create_succeeded'));
    assert.equal(run.localStorage.getItem(PLAN_KEY), null);
});

test('reusing hardware with new preferences patches only those preferences', async () => {
    const oldMachine = { ...baseMachine, id: 'existing', useCase: 'chat', priority: 'speed' };
    const run = harness({
        machines: [oldMachine],
        respond: async (request) => ({ status: 200, data: { machine: { ...oldMachine, ...request.body } } })
    });
    run.seed();
    await run.api.resumePendingPlanIfNeeded();
    assert.equal(run.requests.length, 1);
    assert.equal(run.requests[0].method, 'PATCH');
    assert.equal(run.requests[0].url, '/api/machines/existing');
    assert.deepEqual(run.requests[0].body, { useCase: 'coding', priority: 'balanced' });
    assert(names(run).includes('machine_update_succeeded'));
    assert(names(run).includes('plan_saved'));
    assert(!names(run).includes('machine_create_succeeded'));
    assert.equal(run.localStorage.getItem(PLAN_KEY), null);
});

test('ambiguous saved hardware requires a choice and preserves the pending plan', async () => {
    const run = harness({ machines: [
        { ...baseMachine, id: 'first', useCase: 'chat' },
        { ...baseMachine, id: 'second', useCase: 'vision' }
    ] });
    run.seed();
    await run.api.resumePendingPlanIfNeeded();
    assert.equal(run.requests.length, 0);
    assert.equal(run.ui.choices.length, 1);
    assert.equal(run.ui.choices[0].matches.length, 2);
    assert.notEqual(run.localStorage.getItem(PLAN_KEY), null);
    assert(!names(run).includes('plan_saved'));
});

test('quick NVIDIA plans with the optional VRAM question skipped survive account validation', async () => {
    for (const gpu of ['nvidia_low', 'nvidia_high']) {
        const run = harness();
        vm.runInContext(read('js/app-20260816a.js') + '\nwindow.testApp = App;', run.context);
        const app = run.context.window.testApp;
        app.state.activeFlow = 'quick';
        app.state.answers = { os: 'windows', ram: '32', gpu, usage: 'code', vram: '', priority: 'balanced' };
        const machine = app.buildCurrentMachineProfile();
        run.seed(machine);
        const pending = run.api.readPendingPlan();
        assert(pending, `${gpu} must not be silently discarded after Save because VRAM was optional`);
        assert.equal(pending.machine.accelerator, 'nvidia');
        assert.equal(pending.machine.vramGb, null, 'Unknown GPU memory must not be invented');
        await run.api.resumePendingPlanIfNeeded();
        assert.equal(run.requests.length, 0, 'Incomplete GPU memory must be reviewed before POST');
        assert.equal(run.ui.reviews.length, 1);
        assert.match(run.api.elements.formError.textContent, /VRAM/);
        assert.notEqual(run.localStorage.getItem(PLAN_KEY), null);
        assert.notEqual(run.localStorage.getItem(MACHINE_KEY), null);
        run.api.elements.accelerator.value = 'nvidia';
        run.api.updateVramField();
        assert.equal(run.api.elements.vramInput.required, true);
        assert.equal(run.api.elements.vramField.hidden, false);
        assert(!names(run).includes('plan_saved'));
    }
});

test('a saved plan remains successful if its workspace refresh fails, without offering another creation', async () => {
    for (const failureMode of ['throw', 'false']) {
        const run = harness();
        run.seed();
        run.api.setWorkspaceLoader(async () => {
            if (failureMode === 'throw') throw new Error('Offline');
            return false;
        });
        await run.api.resumePendingPlanIfNeeded();
        assert.equal(run.requests.length, 1);
        assert(names(run).includes('machine_create_succeeded'));
        assert(names(run).includes('plan_saved'));
        assert(!names(run).includes('plan_save_failed'));
        assert.equal(run.ui.reviews.length, 0, 'A persisted machine must not reopen as an unsaved new machine');
        assert.equal(run.localStorage.getItem(PLAN_KEY), null);
        assert.match(run.ui.toasts.at(-1).message, /plan is saved.*Reload/i);
        await run.api.resumePendingPlanIfNeeded();
        assert.equal(run.requests.length, 1, 'Retrying the handoff must not repeat the successful POST');
    }
});

test('manual completion of NVIDIA VRAM stays saved when the workspace refresh is offline', async () => {
    const run = harness();
    run.seed({ ...baseMachine, platform: 'windows', accelerator: 'nvidia', vramGb: null });
    run.api.elements.form.testValues = {
        ...baseMachine, id: '', platform: 'windows', accelerator: 'nvidia', vramGb: '8', source: 'finder'
    };
    run.api.setWorkspaceLoader(async () => { throw new Error('Offline'); });
    await run.api.saveMachine({ preventDefault() {} });
    assert.equal(run.requests.length, 1);
    assert.equal(run.requests[0].body.vramGb, 8);
    assert(names(run).includes('machine_create_succeeded'));
    assert(names(run).includes('plan_saved'));
    assert(!names(run).includes('machine_create_failed'));
    assert(!names(run).includes('plan_save_failed'));
    assert.equal(run.localStorage.getItem(PLAN_KEY), null);
    assert.equal(run.api.elements.formError.textContent, '');
    assert.match(run.ui.toasts.at(-1).message, /plan is saved.*Reload/i);
    assert.equal(run.api.state.saving, false);
});
