const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function harness(answers = {parsedOS: 'mac', parsedRam: 8, gpu: 'apple', usage: 'code', context: '32k'}) {
    const nodes = new Map();
    const stored = new Map();
    const events = [];
    const timers = [];
    const context = vm.createContext({
        console, URL, URLSearchParams, navigator: {}, innerWidth: 1200,
        location: new URL('https://localclaw.io/'),
        document: {
            addEventListener() {}, getElementById: id => nodes.get(id) || null,
            querySelector: () => null, querySelectorAll: () => []
        },
        localStorage: {getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value)},
        setTimeout: fn => timers.push(fn), clearTimeout() {}
    });
    context.window = context;
    for (const file of ['js/data.js', 'js/model-ranking.js', 'js/fit-context.js', 'js/app-20260816a.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
    }
    const app = vm.runInContext('App', context);
    const catalog = vm.runInContext('APP_DATA.models', context);
    app.showToast = () => {};
    app.trackGoal = (name, properties) => events.push({name, properties});
    app.render = () => {};
    app.state.activeFlow = 'pro';
    app.state.flowSource = 'home_quick_fit';
    app.state.answers = answers;
    app.calculateResults();
    const render = () => {
        const output = {innerHTML: ''};
        app.renderResults(output);
        nodes.set('results-plan-summary', {innerHTML: output.innerHTML.match(/<section[^>]*id="results-plan-summary"[^>]*>([\s\S]*?)<\/section>/)[1]});
        nodes.set('results-left-panel', {innerHTML: app.buildLeftPanel(app.state.recommendations[app.state.selectedModelIndex], app.state.selectedModelIndex), scrollIntoView() {}});
        return output.innerHTML;
    };
    return {app, catalog, nodes, stored, events, render};
}

test('8 GB Apple coding at 32K: selecting Nanbeige updates the guide, plan link and saved model', () => {
    const h = harness();
    const initialModel = h.app.state.recommendations[0];
    const index = h.app.state.recommendations.findIndex(model => model.id === 'nanbeige4.2-3b');
    assert.ok(index > 0, 'Nanbeige must be offered as an alternative for this real ranking scenario');
    h.render();
    assert.match(h.nodes.get('results-plan-summary').innerHTML, new RegExp(initialModel.name));
    h.app.selectModel(index);
    const summary = h.nodes.get('results-plan-summary').innerHTML;
    const guide = h.nodes.get('results-left-panel').innerHTML;
    assert.match(summary, /Nanbeige4\.2 3B is your selected model/);
    assert.doesNotMatch(summary, new RegExp(initialModel.name));
    assert.match(summary, /Custom runtime · manual setup required/);
    assert.match(guide, /Nanbeige llama\.cpp \/ Ollama fork/);
    assert.match(guide, /href="https:\/\/huggingface.co\/Nanbeige\/Nanbeige4.2-3B#llamacpp"/);
    assert.doesNotMatch(summary + guide, /Ready now|Download LM Studio|Search in LM Studio|href="pricing.html|Start Chatting!/);
    const setupHref = summary.match(/href="([^"]+)" onclick="App.trackPlanAction/)[1];
    const setupUrl = new URL(setupHref.replaceAll('&amp;', '&'), 'https://localclaw.io');
    assert.equal(setupUrl.pathname, '/models/nanbeige4.2-3b');
    assert.equal(setupUrl.searchParams.get('fitRam'), '8');
    assert.equal(setupUrl.searchParams.get('fitContext'), '32k');
    assert.equal(setupUrl.searchParams.get('fitGoal'), 'coding');
    h.app.saveCurrentMachine();
    const pending = JSON.parse(h.stored.get('localclaw_pending_plan'));
    assert.equal(pending.topModelId, 'nanbeige4.2-3b');
    assert.equal(pending.machine.ramGb, 8);
    assert.equal(pending.context, '32k');
    assert.equal(h.events.find(event => event.name === 'plan_save_started').properties.top_model, 'nanbeige4.2-3b');
});

for (const platform of ['mac', 'mac-intel', 'windows', 'linux']) {
    test(`every catalog custom runtime, including Bonsai, takes precedence over the ${platform} installer`, () => {
        const h = harness({parsedOS: platform, parsedRam: 32, gpu: platform === 'mac' ? 'apple' : 'cpu', usage: 'code'});
        const customModels = h.catalog.filter(model => model.custom_runtime);
        assert.ok(customModels.some(model => model.id === 'bonsai-27b'));
        assert.ok(customModels.some(model => model.id === 'nanbeige4.2-3b'));
        // This covers any future BitNet entries through the same catalog flag.
        for (const model of customModels) {
            h.app.state.recommendations = [model];
            h.app.state.selectedModelIndex = 0;
            const html = h.render();
            assert.match(html, /Custom runtime required/, model.id);
            assert.match(html, /Model identifier · custom runtime/, model.id);
            assert.match(html, /Custom runtime · manual setup required/, model.id);
            assert.ok(html.includes(h.app.escapeHtml(model.runtime_url)), model.id);
            assert.doesNotMatch(html, /Download LM Studio|Search in LM Studio|href="pricing.html|Set up llama.cpp for Intel Mac|Ready now|Start Chatting!/, model.id);
            assert.equal(h.app.buildOneClickSetupBlock(model), '', model.id);
            const why = h.app._buildWhyThisPick(model, 32, 24, '8k', 32, () => 0);
            assert.ok(why.some(reason => reason.includes(model.custom_runtime)), model.id);
            assert.doesNotMatch(why.join(' '), /tok\/s|full GPU acceleration/, model.id);
        }
    });
}

test('switching from a custom runtime back to a standard model restores its plan and installer', () => {
    const h = harness();
    const first = h.app.state.recommendations[0];
    const custom = h.app.state.recommendations.findIndex(model => model.custom_runtime);
    h.render();
    h.app.selectModel(custom);
    h.app.selectModel(0);
    const summary = h.nodes.get('results-plan-summary').innerHTML;
    const guide = h.nodes.get('results-left-panel').innerHTML;
    assert.match(summary, new RegExp(first.name));
    assert.match(summary, /Ready now/);
    assert.match(guide, /Download LM Studio/);
    assert.match(guide, /href="pricing.html/);
    assert.doesNotMatch(summary + guide, /Custom runtime|Set up the required runtime/);
    assert.equal(h.app.buildCurrentPlanPayload().topModelId, first.id);
});

test('a fresh calculation resets an earlier alternative selection to the new top recommendation', () => {
    const h = harness();
    h.render();
    h.app.selectModel(3);
    h.app.state.answers.parsedRam = 32;
    h.app.calculateResults();
    assert.equal(h.app.state.selectedModelIndex, 0);
    assert.equal(h.app.buildCurrentPlanPayload().topModelId, h.app.state.recommendations[0].id);
});

test('missing or invalid custom instructions keep the user on model requirements instead of a generic installer', () => {
    const h = harness();
    const model = h.catalog.find(model => model.id === 'nanbeige4.2-3b');
    for (const runtime_url of [undefined, '', 'javascript:alert(1)']) {
        const html = h.app.buildRuntimeSetupSteps({...model, runtime_url});
        assert.match(html, /href="\/models\/nanbeige4.2-3b\?/);
        assert.doesNotMatch(html, /javascript:|Download LM Studio|docs\/build.md#cpu-build/);
    }
});
