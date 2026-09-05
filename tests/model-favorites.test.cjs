const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const model = JSON.parse(fs.readFileSync(path.join(root, 'models/qwen3-14b.html'), 'utf8').match(/window\.LOCALCLAW_MODEL=(.*?);<\/script>/)[1]);
const machine = {id: 'saved-mac32', name: 'Mac Studio', platform: 'macos', accelerator: 'apple-silicon', ramGb: 32, isPrimary: true};
const storedFavorite = {machineId: machine.id, modelId: model.id, status: 'saved', quantization: 'Q4_K_M'};
const response = (status, data) => ({status, ok: status >= 200 && status < 300, json: async () => data});
function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return {promise, resolve, reject};
}

async function harness({saved = false} = {}) {
    const calls = [];
    const mutationReplies = [];
    const handlers = {};
    const detachedWrites = [];
    let serverFavorites = saved ? [{...storedFavorite}] : [];
    let button = null;
    let notice = null;
    let html = '';
    const panel = {hidden: true, dataset: {}, isConnected: true};
    Object.defineProperty(panel, 'innerHTML', {
        get: () => html,
        set(value) {
            if (button) button.isConnected = false;
            if (notice) notice.isConnected = false;
            html = value;
            const markup = value.match(/<button([^>]*data-context-favorite[^>]*)>([^<]*)<\/button>/);
            button = markup ? {
                isConnected: true,
                listeners: {},
                attributes: new Map(/aria-busy="true"/.test(markup[1]) ? [['aria-busy', 'true']] : []),
                _disabled: /\bdisabled\b/.test(markup[1]),
                textContent: markup[2],
                setAttribute(key, value) { if (!this.isConnected) detachedWrites.push(key); this.attributes.set(key, value); },
                removeAttribute(key) { if (!this.isConnected) detachedWrites.push(key); this.attributes.delete(key); },
                addEventListener(name, callback) { this.listeners[name] = callback; }
            } : null;
            if (button) Object.defineProperty(button, 'disabled', {
                get() { return this._disabled; },
                set(value) { if (!this.isConnected) detachedWrites.push('disabled'); this._disabled = value; }
            });
            const errorMarkup = value.match(/<p([^>]*data-context-favorite-error[^>]*)>([^<]*)<\/p>/);
            notice = errorMarkup ? {isConnected: true, hidden: /\bhidden\b/.test(errorMarkup[1]), textContent: errorMarkup[2]} : null;
        }
    });
    panel.querySelector = selector => selector === '[data-context-favorite]' ? button : selector === '[data-context-favorite-error]' ? notice : null;
    const context = vm.createContext({
        URL, URLSearchParams, console,
        LOCALCLAW_MODEL: model,
        location: new URL('https://localclaw.io/models/qwen3-14b'),
        document: {querySelector: () => panel, querySelectorAll: () => []},
        localStorage: {getItem: key => key === 'localclaw_primary_machine' ? JSON.stringify(machine) : null, setItem() {}, removeItem() {}},
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        addEventListener: (name, callback) => { (handlers[name] ||= []).push(callback); },
        dispatchEvent: event => { (handlers[event.type] || []).forEach(callback => callback(event)); },
        fetch: async (url, options = {}) => {
            const method = options.method || 'GET';
            calls.push({url, method, body: options.body});
            if (method === 'GET') {
                if (url === '/api/machines') return response(200, {machines: [machine]});
                if (url === '/api/favorites') return response(200, {favorites: serverFavorites});
                throw new Error(`Unexpected GET ${url}`);
            }
            assert.equal(url.split('?')[0], `/api/favorites/${model.id}`);
            const reply = mutationReplies.shift();
            assert.ok(reply, `Unexpected mutation ${method}`);
            const result = await reply(method);
            if (result.ok) serverFavorites = method === 'DELETE' ? [] : [{...storedFavorite}];
            return result;
        }
    });
    context.window = context;
    for (const file of ['js/model-ranking.js', 'js/fit-context.js', 'js/account-context-20260802b.js', 'js/model-account-context-20260802b.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
    }
    await context.LocalClawAccountContext.ready;
    await Promise.resolve();
    return {
        context, panel, calls, detachedWrites,
        button: () => button,
        notice: () => notice,
        queue: callback => mutationReplies.push(callback),
        mutations: () => calls.filter(call => call.method !== 'GET'),
        click(target = button) {
            const event = {currentTarget: target};
            const promise = target.listeners.click(event);
            // Browsers clear currentTarget when the synchronous dispatch returns.
            event.currentTarget = null;
            return promise;
        },
        disconnect() { panel.isConnected = false; if (button) button.isConnected = false; if (notice) notice.isConnected = false; }
    };
}

for (const failure of ['network', 'http']) test(`a ${failure} save failure shows an error and allows a successful retry`, async () => {
    const h = await harness();
    h.queue(async () => {
        if (failure === 'network') throw new TypeError('Network connection lost');
        return response(503, {message: 'Favorites are temporarily unavailable'});
    });
    await h.click();
    assert.equal(h.mutations().length, 1);
    assert.equal(h.mutations()[0].method, 'PUT');
    assert.equal(h.button().disabled, false);
    assert.equal(h.notice().hidden, false);
    assert.match(h.notice().textContent, failure === 'network' ? /connection lost/ : /temporarily unavailable/);
    assert.equal(h.context.LocalClawAccountContext.getFavorite(model.id, machine.id), null);

    const waiting = deferred();
    h.queue(() => waiting.promise);
    const retry = h.click();
    assert.equal(h.button().disabled, true);
    assert.equal(h.button().textContent, 'Saving…');
    assert.equal(h.notice().hidden, true);
    assert.equal(h.notice().textContent, '');
    waiting.resolve(response(200, {favorite: storedFavorite}));
    await retry;
    assert.equal(h.button().disabled, false);
    assert.equal(h.button().textContent, '★ Saved');
    assert.equal(h.notice().hidden, true);
    assert.equal(h.mutations().length, 2);
    await h.context.LocalClawAccountContext.refresh();
    assert.equal(h.context.LocalClawAccountContext.getFavorite(model.id, machine.id).modelId, model.id);
    assert.equal(h.button().textContent, '★ Saved');
    assert.deepEqual(h.detachedWrites, []);
});

test('a pending save blocks duplicate requests even when account GET refreshes replace the button', async () => {
    const h = await harness();
    const waiting = deferred();
    h.queue(() => waiting.promise);
    const firstButton = h.button();
    const first = h.click();
    await h.click(firstButton);
    assert.equal(h.mutations().length, 1);
    await h.context.LocalClawAccountContext.refresh();
    assert.notEqual(h.button(), firstButton);
    assert.equal(firstButton.isConnected, false);
    assert.equal(h.button().disabled, true);
    assert.equal(h.button().textContent, 'Saving…');
    await h.click();
    assert.equal(h.mutations().length, 1);
    waiting.resolve(response(200, {favorite: storedFavorite}));
    await first;
    assert.equal(h.button().textContent, '★ Saved');
    assert.equal(h.button().disabled, false);
    assert.equal(h.button().attributes.has('aria-busy'), false);
    assert.deepEqual(h.detachedWrites, []);
});

test('a failed removal keeps the saved state and a retry removes it through DELETE', async () => {
    const h = await harness({saved: true});
    assert.equal(h.button().textContent, '★ Saved');
    h.queue(async () => response(503, {message: 'Removal temporarily unavailable'}));
    await h.click();
    assert.equal(h.button().textContent, '★ Saved');
    assert.equal(h.button().disabled, false);
    assert.equal(h.notice().hidden, false);
    assert.ok(h.context.LocalClawAccountContext.getFavorite(model.id, machine.id));
    h.queue(async () => response(200, {}));
    await h.click();
    assert.equal(h.button().textContent, '☆ Save for this machine');
    assert.equal(h.notice().hidden, true);
    assert.equal(h.context.LocalClawAccountContext.getFavorite(model.id, machine.id), null);
    assert.deepEqual(h.mutations().map(call => call.method), ['DELETE', 'DELETE']);
    await h.context.LocalClawAccountContext.refresh();
    assert.equal(h.button().textContent, '☆ Save for this machine');
    assert.deepEqual(h.detachedWrites, []);
});

test('a rejected request after leaving the panel does not update detached controls or reject the handler', async () => {
    const h = await harness();
    const waiting = deferred();
    h.queue(() => waiting.promise);
    const pending = h.click();
    h.disconnect();
    waiting.reject(new TypeError('Network connection lost'));
    await assert.doesNotReject(pending);
    assert.deepEqual(h.detachedWrites, []);
});
