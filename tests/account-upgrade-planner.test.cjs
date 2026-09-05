const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const mac32 = { id: 'qa-mac32', name: 'QA Mac 32 GB', platform: 'macos', accelerator: 'apple-silicon', ramGb: 32, vramGb: null, useCase: 'general', priority: 'balanced' };
const model = (id, size, extra = {}) => ({
    id, name: id, size_gb: size, min_ram: Math.ceil(size + 2.5),
    recommended_quant: 'Q4_K_M', hf_repo: `qa/${id}-GGUF`, tags: ['general'],
    benchmarks: { quality: 8, speed: 6 }, ...extra
});

function harness(models, verification = {}) {
    const context = vm.createContext({ document: { addEventListener() {} } });
    context.window = context;
    vm.runInContext(read('js/data.js') + '\nthis.data = APP_DATA;', context);
    if (models) {
        context.data.models = models;
        context.data.hfRepoVerification = {
            publicGguf: Object.fromEntries(models.map((item) => [item.id, item.hf_repo])),
            gated: {}, unavailable: {}, ...verification
        };
    }
    vm.runInContext(read('js/model-ranking.js'), context);
    vm.runInContext(read('js/machine-compat-20260802a.js'), context);
    const account = read('js/account-20260802a.js');
    const close = account.lastIndexOf('})();');
    assert(close > 0);
    vm.runInContext(account.slice(0, close) + `
        window.audit = { upgradeCandidates, renderUpgradePlanner, indexableLocalModels };
    ` + account.slice(close), context);
    return context;
}

function compatibleMap(context, machine) {
    const ranked = context.LocalClawCompatibility.rankModels(machine, context.audit.indexableLocalModels());
    return new Map(ranked.compatible.map((item) => [item.id, item]));
}

test('the real 32 GB Mac catalogue proposes a genuine larger memory tier with a passing 8K fit', () => {
    const context = harness();
    const compatible = compatibleMap(context, mac32);
    const candidates = context.audit.upgradeCandidates(mac32, compatible);
    assert(candidates.length > 0);
    const ids = new Set();
    for (const item of candidates) {
        assert(!ids.has(item.id), 'Upgrade candidates must be deduplicated');
        ids.add(item.id);
        assert(!context.data.hfRepoVerification.unavailable[item.id]);
        assert(!context.data.hfRepoVerification.gated[item.id]);
        assert(!item.custom_runtime);
        assert(item.upgradePlan.ramGb > 32 && item.upgradePlan.ramGb <= 512);
        const target = { ...mac32, ramGb: item.upgradePlan.ramGb, context: '8k' };
        assert(context.LocalClawModelRanking.scoreModel(target, {}, item, { includeTight: false }).compatible);
    }
    const html = context.audit.renderUpgradePlanner(mac32, compatible);
    assert(!html.includes('value="qwen3-coder-8b"'));
    assert(!html.includes('8 GB unified memory'));
    assert(html.includes(`${candidates[0].upgradePlan.ramGb} GB unified memory`));
    assert(html.includes('8K context'));
});

test('NVIDIA system RAM and optional GPU memory are separate targets, with 8K overhead', () => {
    const large = model('large-40gb', 40);
    const context = harness([large]);
    const machine = { ...mac32, platform: 'windows', accelerator: 'nvidia', vramGb: 8 };
    const [candidate] = context.audit.upgradeCandidates(machine, new Map());
    assert.equal(candidate.upgradePlan.ramGb, 64);
    assert.equal(candidate.upgradePlan.fullOffloadVramGb, 64);
    const html = context.audit.renderUpgradePlanner(machine, new Map());
    assert(html.includes('keeping your 8 GB GPU'));
    assert(html.includes('optional full-offload estimate, not a requirement'));
    assert(html.includes('System RAM target'));
    const highVram = { ...machine, vramGb: 96 };
    const [highVramCandidate] = context.audit.upgradeCandidates(highVram, new Map());
    assert.equal(highVramCandidate.upgradePlan.ramGb, 64, 'VRAM cannot be added to system RAM');
    assert.equal(highVramCandidate.upgradePlan.fullOffloadVramGb, 96, 'Never recommend less GPU memory than already installed');
    assert(!context.audit.renderUpgradePlanner(highVram, new Map()).includes('Optional GPU upgrade'));
});

test('unavailable, hosted, API-only, duplicate and unverified models are excluded', () => {
    const context = harness([
        model('available', 40), model('available', 40),
        model('missing', 40), model('hosted', 40, { hosted_only: true }),
        model('api-only', 40, { recommended_quant: 'API' }), model('unverified', 40)
    ], { unavailable: { missing: 'qa/missing' }, publicGguf: { available: 'qa/available-GGUF', missing: 'qa/missing-GGUF', hosted: 'qa/hosted', 'api-only': 'qa/api-only' } });
    assert.deepEqual(Array.from(context.audit.upgradeCandidates(mac32, new Map()), (item) => item.id), ['available']);
});

test('access gates, special runtimes and incompatible platform or accelerator cannot become RAM advice', () => {
    const context = harness([
        model('gated', 40), model('custom', 40, { custom_runtime: 'Research CUDA fork' }),
        model('explicit-gate', 40, { gated: true }),
        model('windows-only', 40, { platforms: ['windows'] }),
        model('nvidia-only', 40, { accelerators: ['nvidia'] }),
        model('already-fits-but-filtered', 4, { tags: ['coding'] })
    ], { gated: { gated: 'qa/gated' } });
    assert.equal(context.audit.upgradeCandidates(mac32, new Map()).length, 0);
    assert.equal(context.audit.renderUpgradePlanner(mac32, new Map()), '');
});

test('a tight memory fit can only be proposed when the next tier resolves the real headroom constraint', () => {
    const context = harness([model('tight-22gb', 22)]);
    const current = context.LocalClawModelRanking.calculateHardwareFit(mac32, context.data.models[0]);
    assert.equal(current.fitState, 'tight');
    const [candidate] = context.audit.upgradeCandidates(mac32, compatibleMap(context, mac32));
    assert.equal(candidate.upgradePlan.ramGb, 36);
    const improved = context.LocalClawModelRanking.calculateHardwareFit({ ...mac32, ramGb: 36 }, candidate);
    assert.equal(improved.fitState, 'good');
});

test('no qualifying upgrade means no purchasing section, including beyond supported planning tiers', () => {
    const context = harness([model('small', 4), model('server-only-size', 900)]);
    assert.equal(context.audit.renderUpgradePlanner(mac32, compatibleMap(context, mac32)), '');
    const unknownNvidia = { ...mac32, platform: 'windows', accelerator: 'nvidia', vramGb: null };
    assert.equal(context.audit.upgradeCandidates(unknownNvidia, new Map()).length, 0);
    context.LocalClawModelRanking = null;
    assert.equal(context.audit.upgradeCandidates(mac32, new Map()).length, 0, 'Do not fall back to a separate guess if the shared engine is unavailable');
});
