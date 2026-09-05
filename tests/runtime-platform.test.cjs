const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function appFor(flow, answers) {
    const sandbox = {
        document: {addEventListener() {}, querySelector() { return null; }, getElementById() { return null; }},
        console, URL, URLSearchParams, navigator: {},
        localStorage: {getItem() { return null; }},
        setTimeout() {}, clearTimeout() {},
    };
    sandbox.window = sandbox;
    const context = vm.createContext(sandbox);
    for (const file of ['js/data.js', 'js/model-ranking.js', 'js/fit-context.js', 'js/app-20260816a.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
    }
    const app = vm.runInContext('App', context);
    app.render = () => {};
    app.state.activeFlow = flow;
    app.state.answers = answers;
    app.calculateResults();
    assert.ok(app.state.recommendations.length > 0);
    const container = {innerHTML: ''};
    app.renderResults(container);
    return {app, html: container.innerHTML};
}

for (const flow of ['guided', 'pro']) test(`${flow} Intel Mac keeps the entire result on a CPU installation path`, () => {
    const answers = flow === 'guided' ? {os:'mac-intel', level:'standard', usage:'code'}
        : {parsedOS:'mac-intel', parsedRam:16, gpu:'cpu', usage:'code'};
    const {app, html} = appFor(flow, answers);
    assert.match(html, /manual setup required/);
    assert.match(html, /CPU build of llama.cpp/);
    assert.match(html, /Open model files and requirements/);
    assert.match(html, /docs\/build.md#cpu-build/);
    assert.doesNotMatch(html, /Download LM Studio|Search in LM Studio|in LM Studio\.|href="pricing.html/);
    assert.doesNotMatch(html, /Apple Silicon or Intel|Ready now · no signup required/);
    assert.equal(app.buildCurrentPlanPayload().machine.accelerator, 'cpu');
    assert.equal(app.buildCurrentPlanPayload().machine.ramGb, 16);
});

test('Apple Silicon keeps the normal setup and displays the distinct app and runtime requirements', () => {
    const {html} = appFor('pro', {parsedOS:'mac', parsedRam:16, gpu:'apple', usage:'chat'});
    assert.match(html, /Download LM Studio/);
    assert.match(html, /Apple Silicon and macOS 14 or later are required/);
    assert.match(html, /Requires macOS 13 Ventura or later/);
    assert.match(html, /Apple Silicon only/);
    assert.match(html, /href="pricing.html\?from=recommender/);
    assert.doesNotMatch(html, /Apple Silicon or Intel|Set up llama.cpp for Intel Mac/);
});

for (const platform of ['windows', 'linux']) test(`${platform} retains its free desktop setup without an incompatible Mac purchase`, () => {
    const {html} = appFor('pro', {parsedOS:platform, parsedRam:32, gpu:'cpu', usage:'code'});
    assert.match(html, /Download LM Studio/);
    assert.doesNotMatch(html, /href="pricing.html|Apple Silicon and macOS 14 or later are required/);
});
