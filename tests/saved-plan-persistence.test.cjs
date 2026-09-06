const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {DatabaseSync} = require('node:sqlite');
const {webcrypto} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const base = {name: 'My Mac', platform: 'macos', accelerator: 'apple-silicon', ramGb: 32, vramGb: null, useCase: 'coding', priority: 'balanced', source: 'finder'};

// Real validation, API handlers and SQLite statements; only authentication is
// supplied as a fixture. This adapter never contacts a production service.
function moduleExports(file, imports, names) {
    const source = read(file).replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\s*/g, '').replace(/\bexport\s+/g, '');
    return new Function(...Object.keys(imports), source + `\nreturn {${names.join(',')}};`)(...Object.values(imports));
}

function server({legacy = false} = {}) {
    const db = new DatabaseSync(':memory:');
    db.exec(read('migrations/0001_accounts_and_machines.sql'));
    db.exec(`INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES ('user-a','Test user','test@example.invalid',1,'now','now');`);
    if (legacy) db.exec(`INSERT INTO machines (id,user_id,name,platform,accelerator,ram_gb,use_case,priority,is_primary,source,created_at,updated_at) VALUES ('legacy','user-a','Old Mac','macos','apple-silicon',32,'coding','balanced',1,'manual','now','now');`);
    db.exec(read('migrations/0009_saved_plan_selection.sql'));
    const d1 = {
        prepare(sql) {
            const statement = db.prepare(sql);
            let args = [];
            return {
                bind(...values) { args = values; return this; },
                async all() { return {results: statement.all(...args)}; },
                async first() { return statement.get(...args) || null; },
                async run() { return statement.run(...args); }
            };
        },
        async batch(statements) {
            db.exec('BEGIN');
            try { for (const statement of statements) await statement.run(); db.exec('COMMIT'); }
            catch (error) { db.exec('ROLLBACK'); throw error; }
        }
    };
    const auth = {
        json: (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json'}}),
        getRequiredSession: async context => ({session: {user: {id: context.testUser || 'user-a'}}}),
        requireSameOrigin: request => request.headers.get('Origin') === new URL(request.url).origin
    };
    const identity = moduleExports('functions/_lib/model-identity.js', {}, ['canonicalModelId']);
    const machines = moduleExports('functions/_lib/machines.js', {...auth, ...identity}, ['MAX_MACHINES_PER_ACCOUNT', 'machineRowToJson', 'validateMachine', 'parseJsonBody']);
    const imports = {...auth, ...machines, crypto: webcrypto};
    const collection = moduleExports('functions/api/machines/index.js', imports, ['onRequestGet', 'onRequestPost']);
    const individual = moduleExports('functions/api/machines/[id].js', imports, ['onRequestPatch', 'onRequestDelete']);
    const requests = [];
    async function fetch(url, options = {}, user = 'user-a') {
        const method = options.method || 'GET';
        requests.push({url, method, body: options.body ? JSON.parse(options.body) : null});
        const request = new Request(new URL(url, 'https://localclaw.io'), {method, headers: {Origin: 'https://localclaw.io', 'Content-Type': 'application/json'}, body: options.body});
        const context = {request, params: {id: url.split('/')[3]}, env: {LOCALCLAW_DB: d1}, testUser: user};
        if (url === '/api/machines') return method === 'POST' ? collection.onRequestPost(context) : collection.onRequestGet(context);
        if (method === 'PATCH') return individual.onRequestPatch(context);
        throw new Error(`Unexpected test request: ${method} ${url}`);
    }
    return {db, requests, fetch, async list() { return (await (await fetch('/api/machines')).json()).machines; }};
}

function client(apiServer, machines = []) {
    const storage = new Map();
    const formFields = {};
    const node = () => ({value: '', checked: false, classList: {add() {}, remove() {}}, focus() {}});
    const location = new URL('https://localclaw.io/account');
    const context = vm.createContext({
        console, URL, URLSearchParams, location, navigator: {onLine: true},
        localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)},
        document: {addEventListener() {}, getElementById: id => formFields[id] ||= node()},
        setTimeout() {},
        history: {state: null, replaceState(_state, _unused, href) { location.href = new URL(href, location).href; }},
        FormData: class { constructor(form) { this.values = form.testValues; } get(key) { return this.values[key] ?? ''; } },
        fetch: apiServer.fetch,
        reloadMachines: () => apiServer.list()
    });
    context.window = context;
    for (const file of ['js/data.js', 'js/model-ranking.js', 'js/fit-context.js', 'js/machine-compat-20260802a.js']) vm.runInContext(read(file), context);
    const source = read('js/account-20260802a.js');
    const close = source.lastIndexOf('})();');
    vm.runInContext(source.slice(0, close) + `
        initializePresetPicker = function () {};
        renderMachineList = function () {};
        renderSelectedMachine = function () {};
        showToast = function () {};
        closeMachineMatchDialog = function () {};
        loadWorkspace = async function (id) { state.machines = await reloadMachines(); state.selectedMachineId = chooseSelectedMachineId(id); cachePrimaryMachine(); return true; };
        elements.formError = {textContent: ''};
        elements.form = {testValues: {}, reset() {}, classList: {add() {}, remove() {}}};
        elements.accelerator = {value: ''}; elements.vramField = {hidden: true}; elements.vramInput = {value: ''};
        elements.dialogTitle = {textContent: ''}; elements.dialog = {showModal() {}, close() {}};
        window.audit = {state, elements, readPendingPlan, resumePendingPlanIfNeeded, saveMachine,
            openMachineDialog, renderPlanOverview, modelHref, indexableLocalModels, upgradeCandidates, renderUpgradePlanner};
    ` + source.slice(close), context);
    context.audit.state.machines = machines;
    return {
        context, storage, api: context.audit,
        seed(extra = {}) { storage.set('localclaw_pending_plan', JSON.stringify({version: 1, machine: base, topModelId: 'qwen3-14b', context: '32k', ...extra})); }
    };
}

test('migration preserves old rows and legacy POST/PATCH clients keep saved plan fields', async t => {
    const api = server({legacy: true}); t.after(() => api.db.close());
    const [old] = await api.list();
    assert.equal(old.context, '8k'); assert.equal(old.selectedModelId, null);
    const response = await api.fetch('/api/machines', {method: 'POST', body: JSON.stringify({...base, context: '32k', selectedModelId: 'qwen3-14b'})});
    assert.equal(response.status, 201);
    const {machine} = await response.json();
    const patch = await api.fetch(`/api/machines/${machine.id}`, {method: 'PATCH', body: JSON.stringify({name: 'Renamed'})});
    assert.equal(patch.status, 200);
    const updated = (await patch.json()).machine;
    assert.equal(updated.context, '32k'); assert.equal(updated.selectedModelId, 'qwen3-14b');
    const legacy = await api.fetch('/api/machines', {method: 'POST', body: JSON.stringify(base)});
    const created = (await legacy.json()).machine;
    assert.equal(created.context, '8k'); assert.equal(created.selectedModelId, null);
});

test('API validates context and model IDs, normalizes retired aliases, and retains ownership boundaries', async t => {
    const api = server(); t.after(() => api.db.close());
    for (const values of [{context: '256k'}, {selectedModelId: '../private'}, {selectedModelId: 42}, {selectedModelId: 'x'.repeat(129)}]) {
        const response = await api.fetch('/api/machines', {method: 'POST', body: JSON.stringify({...base, ...values})});
        assert.equal(response.status, 422);
    }
    const result = await api.fetch('/api/machines', {method: 'POST', body: JSON.stringify({...base, selectedModelId: 'mistral-small3.2-24b', context: '32k'})});
    const {machine} = await result.json();
    assert.equal(machine.selectedModelId, 'mistral-small-3.2-24b');
    assert.equal(api.db.prepare('SELECT selected_model_id FROM machines WHERE id=?').get(machine.id).selected_model_id, machine.selectedModelId);
    const forbidden = await api.fetch(`/api/machines/${machine.id}`, {method: 'PATCH', body: JSON.stringify({context: '4k'})}, 'other-user');
    assert.equal(forbidden.status, 404);
    assert.equal((await api.list())[0].context, '32k');
});

test('finder choice and 32K context survive real API creation, GET reload, reuse with a new choice, and form editing', async t => {
    const api = server(); t.after(() => api.db.close());
    const first = client(api); first.seed();
    await first.api.resumePendingPlanIfNeeded();
    let [saved] = await api.list();
    assert.equal(saved.selectedModelId, 'qwen3-14b'); assert.equal(saved.context, '32k');
    assert.equal(first.storage.get('localclaw_pending_plan'), undefined);
    const reloaded = client(api, await api.list());
    const params = new URL(reloaded.api.modelHref(saved.selectedModelId, saved), 'https://localclaw.io').searchParams;
    assert.equal(params.get('fitContext'), '32k');
    reloaded.seed({topModelId: 'gemma3-12b'});
    await reloaded.api.resumePendingPlanIfNeeded();
    const rows = await api.list(); assert.equal(rows.length, 1, 'reuse must update the plan, not create a duplicate machine');
    saved = rows[0];
    assert.equal(saved.selectedModelId, 'gemma3-12b'); assert.equal(saved.context, '32k');
    const editing = client(api, rows);
    editing.api.openMachineDialog(saved);
    editing.api.elements.form.testValues = {...saved, name: 'Updated machine name', isPrimary: 'on'};
    await editing.api.saveMachine({preventDefault() {}});
    const [edited] = await api.list();
    assert.equal(edited.name, 'Updated machine name');
    assert.equal(edited.selectedModelId, 'gemma3-12b'); assert.equal(edited.context, '32k');
    assert.equal(api.requests.filter(item => item.method === 'POST').length, 1);
    assert.equal(api.requests.filter(item => item.method === 'PATCH').length, 2);
});

test('VRAM review after a failed automatic save preserves the choice and context through the form', async t => {
    const api = server(); t.after(() => api.db.close());
    const ui = client(api);
    const nvidia = {...base, platform: 'windows', accelerator: 'nvidia', vramGb: null};
    ui.seed({machine: nvidia});
    await ui.api.resumePendingPlanIfNeeded();
    assert.equal(api.requests.length, 0);
    ui.api.elements.form.testValues = {...nvidia, id: '', vramGb: 12};
    await ui.api.saveMachine({preventDefault() {}});
    const [saved] = await api.list();
    assert.equal(saved.selectedModelId, 'qwen3-14b'); assert.equal(saved.context, '32k'); assert.equal(saved.vramGb, 12);
});

test('saved choice stays distinct from current suggestion, including a removed model, and fit uses 32K', async t => {
    const api = server(); t.after(() => api.db.close());
    const ui = client(api);
    const machine = {...base, id: 'saved', selectedModelId: 'qwen3-14b', context: '32k'};
    const ranked = ui.context.LocalClawCompatibility.rankModels(machine, ui.api.indexableLocalModels()).compatible;
    const suggestion = ranked.find(model => model.id !== machine.selectedModelId);
    assert.ok(suggestion);
    const html = ui.api.renderPlanOverview(machine, suggestion, 0);
    assert.match(html, /Your saved choice/); assert.match(html, /Qwen 3 \(14B\)/);
    assert.ok(html.includes(`>${suggestion.name}</a>`)); assert.match(html, /Current suggestion:/);
    assert.match(html, /32K context/); assert.match(html, /fitContext=32k/);
    const missing = ui.api.renderPlanOverview({...machine, selectedModelId: 'retired-model'}, suggestion, 0);
    assert.match(missing, /retired-model/); assert.match(missing, /no longer available/);
    assert.ok(!missing.includes('data-plan-primary-model'), 'do not silently replace the saved choice with the current recommendation');
    const unavailable = ui.api.renderPlanOverview({...machine, selectedModelId: 'granite4-8b'}, suggestion, 0);
    assert.match(unavailable, /no longer available/);
    assert.doesNotMatch(unavailable, /Comfortable at/);
    assert.ok(!unavailable.includes('data-plan-primary-model'), 'a catalogue tombstone must not retain an install CTA');
    const constrained = {...machine, ramGb: 16};
    const small = {id: 'boundary', name: 'Boundary model', size_gb: 9, min_ram: 16, params: '14B', tags: ['coding'], benchmarks: {quality: 8}};
    const fit8 = ui.context.LocalClawModelRanking.calculateHardwareFit({...constrained, context: '8k'}, small);
    const fit32 = ui.context.LocalClawModelRanking.calculateHardwareFit(constrained, small);
    assert.ok(fit32.contextOverhead > fit8.contextOverhead);
    assert.equal(ui.context.LocalClawCompatibility.rankModels({...constrained, context: '8k'}, [small]).compatible.length, 1);
    assert.equal(ui.context.LocalClawCompatibility.rankModels(constrained, [small]).compatible.length, 0);
    const candidates = ui.api.upgradeCandidates(machine, new Map(ranked.map(model => [model.id, model])));
    if (candidates.length) assert.match(ui.api.renderUpgradePlanner(machine, new Map(ranked.map(model => [model.id, model]))), /32K context/);
});
