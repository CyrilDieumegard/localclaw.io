const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/home-voting.js'), 'utf8');
const key = 'localclaw_pending_rating';

function harness(fetch = async () => ({ok: true, json: async () => null})) {
    const storage = new Map();
    const context = vm.createContext({
        APP_DATA: {models: [{id: 'local-model'}, {id: 'cloud-model', hosted_only: true}, {id: 'withdrawn-model'}], hfRepoVerification: {unavailable: {'withdrawn-model': {}}}},
        window: {}, document: {readyState: 'loading', addEventListener() {}},
        sessionStorage: {getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k)},
        fetch, Date
    });
    vm.runInContext(source.replace('    window.LocalClawHomeVoting =', '    window.audit = {pending, session, models};\n    window.LocalClawHomeVoting ='), context);
    return {api: context.window.audit, storage};
}

test('a fresh rating choice in this tab can survive sign-in, including an explicit removal', () => {
    const {api} = harness();
    api.pending({modelId: 'local-model', rating: 4, createdAt: Date.now()});
    assert.equal(api.pending().rating, 4);
    api.pending({modelId: 'local-model', rating: null, action: 'remove', createdAt: Date.now()});
    assert.equal(api.pending().action, 'remove');
    api.pending(null);
    assert.equal(api.pending(), null);
});

test('expired, future, malformed, missing-time and out-of-range choices cannot resume a vote', () => {
    const {api, storage} = harness();
    const valid = {modelId: 'local-model', rating: 4, createdAt: Date.now()};
    for (const item of [
        {...valid, createdAt: Date.now() - 31 * 60000}, {...valid, createdAt: Date.now() + 60000},
        {...valid, createdAt: null}, {...valid, rating: 0}, {...valid, rating: 6},
        {...valid, rating: 2.5}, {...valid, rating: '4'}, {...valid, rating: null}, {...valid, rating: null, action: 'save'}
    ]) {
        api.pending(item);
        assert.equal(api.pending(), null);
        assert.equal(storage.has(key), false);
    }
    storage.set(key, '{broken-json');
    assert.equal(api.pending(), null);
});

test('a callback cannot resume a vote for an unknown, hosted or withdrawn model', () => {
    const {api} = harness();
    for (const modelId of ['missing-model', 'cloud-model', 'withdrawn-model']) {
        api.pending({modelId, rating: 5, createdAt: Date.now()});
        assert.equal(api.pending(), null);
    }
});

test('a failed session check can be retried and anonymous members do not load private ratings', async () => {
    let attempts = 0;
    const {api} = harness(async url => {
        assert.equal(url, '/api/auth/get-session');
        return {ok: ++attempts > 1, json: async () => null};
    });
    await assert.rejects(api.session(), /Unable to check your account/);
    await api.session();
    assert.equal(attempts, 2);
});

test('authenticated session loading fetches member ratings once and shares concurrent checks', async () => {
    const calls = [];
    const {api} = harness(async url => {
        calls.push(url);
        return {ok: true, json: async () => url.endsWith('get-session') ? {user: {id: 'member'}} : {ratings: [{modelId: 'local-model', rating: 3}]}};
    });
    await Promise.all([api.session(), api.session()]);
    assert.deepEqual(calls, ['/api/auth/get-session', '/api/ratings/mine']);
});
