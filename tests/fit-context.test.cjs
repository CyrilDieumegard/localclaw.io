const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const fitContext = require('../js/fit-context.js');
const ranking = require('../js/model-ranking.js');
const qwen = JSON.parse(fs.readFileSync(require.resolve('../models/qwen3-14b.html'), 'utf8').match(/window\.LOCALCLAW_MODEL=(.*?);<\/script>/)[1]);

test('an explicit 16 GB choice survives a model link and ignores unrelated URL values', () => {
    const machine = fitContext.fromSearch('?fitRam=16&fitPlatform=macos&fitAccelerator=apple-silicon&fitGoal=code');
    const href = fitContext.withMachine('/models/qwen3-14b?source=home#run', machine);
    assert.equal(machine.ramGb, 16);
    assert.equal(machine.useCase, 'coding');
    assert.deepEqual(fitContext.fromSearch(new URL(href, 'https://localclaw.io').search), machine);
    assert.match(href, /source=home/);
    assert.match(href, /#run$/);
});

test('legacy RAM-only links are estimates without an invented Mac or dedicated GPU', () => {
    const machine = fitContext.fromSearch('?ram=16');
    assert.equal(machine.platform, 'other');
    assert.equal(machine.accelerator, 'cpu');
    assert.equal(machine.vramGb, null);
    assert.equal(machine.context, '8k');
});

test('invalid URL hardware is rejected or normalized, never promoted to an oversized configuration', () => {
    for (const value of ['', '-16', '16oops', '1e99', '2049', '16.5', 'NaN']) {
        assert.equal(fitContext.fromSearch(`?fitRam=${value}`), null);
    }
    const machine = fitContext.fromSearch('?fitRam=16&fitPlatform=<script>&fitAccelerator=unknown&fitGoal=<img>&fitVram=8192&fitMachine=<script>');
    assert.equal(machine.platform, 'other');
    assert.equal(machine.accelerator, 'cpu');
    assert.equal(machine.useCase, 'general');
    assert.equal(machine.vramGb, null);
    assert.equal(machine.id, '');
});

test('a known NVIDIA memory split and selected saved-machine ID survive navigation', () => {
    const machine = fitContext.normalize({id: 'machine-2', ramGb: 64, vramGb: 24, platform: 'linux', accelerator: 'nvidia', useCase: 'coding', context: '32k'});
    assert.deepEqual(fitContext.fromSearch(new URL(fitContext.withMachine('/models/test', machine), 'https://localclaw.io').search), machine);
});

test('the same selected configuration yields the same estimate in the catalogue and model details', () => {
    const machine = fitContext.fromSearch('?fitRam=16&fitPlatform=macos&fitAccelerator=apple-silicon');
    const fit = fitContext.assess(machine, qwen, ranking);
    assert.equal(fit.label, 'Estimated fit');
    assert.equal(fit.fitState, ranking.calculateHardwareFit(machine, qwen).fitState);
    assert.match(fit.note, /8K context estimate/);
    assert.match(fit.note, /Longer context and other apps/);
    assert.equal(fitContext.assess({...machine, ramGb: 32}, qwen, ranking).label, 'Comfortable');
    assert.equal(fitContext.assess({...machine, context: '32k'}, qwen, ranking).label, 'Tight fit');
    assert.equal(fitContext.assess({...machine, ramGb: 8}, qwen, ranking).label, 'Too large');
});

test('late account hydration never replaces an explicit anonymous setup on the model page', () => {
    const handlers = {};
    const panel = {hidden: true, dataset: {}, innerHTML: '', querySelector: () => null};
    const primary = {id: 'saved-32', name: 'My Mac Studio 32 GB', platform: 'macos', accelerator: 'apple-silicon', ramGb: 32};
    const accountState = {primaryMachine: primary, machines: [primary]};
    let writes = 0;
    const window = {
        LOCALCLAW_MODEL: qwen,
        LocalClawFitContext: {...fitContext, fromSearch: () => fitContext.fromSearch('?fitRam=16&fitPlatform=macos&fitAccelerator=apple-silicon')},
        LocalClawModelRanking: ranking,
        LocalClawAccountContext: {getState: () => accountState, ready: {then: () => {}}, getFavorite: () => null, toggleFavorite: () => { writes++; }},
        addEventListener: (name, callback) => { handlers[name] = callback; }
    };
    const document = {querySelector: () => panel, querySelectorAll: () => []};
    vm.runInNewContext(fs.readFileSync(require.resolve('../js/model-account-context-20260802b.js'), 'utf8'), {window, document});
    handlers['localclaw:account-context']({detail: accountState});
    assert.equal(panel.hidden, false);
    assert.match(panel.innerHTML, /Estimated fit on Apple Silicon · 16 GB/);
    assert.doesNotMatch(panel.innerHTML, /Mac Studio|data-context-favorite/);
    assert.equal(accountState.primaryMachine.ramGb, 32);
    assert.equal(writes, 0);
});
