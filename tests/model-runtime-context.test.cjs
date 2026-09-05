const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'models/qwen3-14b.html'), 'utf8');
const model = JSON.parse(page.match(/window\.LOCALCLAW_MODEL=(.*?);<\/script>/)[1]);
const apple = {id: 'saved-apple', name: 'Mac Studio', platform: 'macos', accelerator: 'apple-silicon', ramGb: 32};
const intel = {id: 'saved-intel', name: 'Intel Mac', platform: 'macos', accelerator: 'cpu', ramGb: 16};

function element(tagName) {
    return {tagName: tagName.toUpperCase(), hidden: false, style: {display: ''}, dataset: {}, children: [], textContent: '', append(...nodes) { this.children.push(...nodes); }};
}
async function harness(search = '', primary = apple, runtimeModel = model) {
    const links = [...page.matchAll(/<a[^>]*data-runtime="([^"]+)"[^>]*href="([^"]+)"[^>]*>/g)].map(match => ({...element('a'), dataset: {runtime: match[1]}, href: match[2]}));
    assert.ok(links.some(link => link.dataset.runtime === 'lmstudio'), 'the real model template has an LM Studio launcher');
    assert.ok(links.some(link => link.dataset.runtime === 'localclaw'), 'the real model template has a LocalClaw launcher');
    if (runtimeModel.custom_runtime) links.push({...element('a'), dataset: {runtime: 'official'}, href: runtimeModel.runtime_url});
    const description = {...element('p'), textContent: runtimeModel.custom_runtime
        ? 'This model needs a special runtime. Unsupported apps are clearly marked.'
        : 'Pick the app you already use. No terminal and no command to copy.'};
    const disclosure = {...element('p'), textContent: 'Desktop app links require the app to be installed.'};
    const picker = {...element('div'), querySelector: selector => selector === '.run-picker-head p' ? description : selector === '.runtime-launch-disclosure' ? disclosure : null, querySelectorAll: () => links};
    const installHeading = {...element('h2'), textContent: 'Install path'};
    const installSection = element('section');
    const installSteps = {...element('div'), previousElementSibling: installHeading, parentElement: installSection};
    installSection.append(installHeading, installSteps);
    const panel = {hidden: true, isConnected: true, innerHTML: '', dataset: {}, querySelector: () => null};
    const handlers = {};
    let state = {primaryMachine: primary, machines: [primary]};
    const location = new URL(`https://localclaw.io/models/qwen3-14b${search}`);
    const context = vm.createContext({
        URL, URLSearchParams, location, LOCALCLAW_MODEL: runtimeModel,
        history: {state: null, replaceState(_state, _unused, href) { location.href = new URL(href, location).href; }},
        document: {
            querySelector: selector => selector === '[data-localclaw-model-context]' ? panel : selector === '[data-model-run-options]' ? picker : null,
            querySelectorAll: selector => selector === '.install-steps' ? [installSteps] : [],
            createElement: element
        },
        LocalClawAccountContext: {getState: () => state, getFavorite: () => null, ready: Promise.resolve()},
        addEventListener: (name, callback) => { (handlers[name] ||= []).push(callback); },
        dispatchEvent: event => { for (const callback of handlers[event.type] || []) callback(event); },
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
    });
    context.window = context;
    for (const file of ['js/model-ranking.js', 'js/fit-context.js', 'js/model-account-context-20260802b.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
    await Promise.resolve();
    return {
        context, picker, panel, description, disclosure, installSteps, installHeading, installSection,
        link: runtime => links.find(link => link.dataset.runtime === runtime),
        note: () => picker.children.find(node => 'intelRuntimeNote' in node.dataset),
        account(machine) { state = {primaryMachine: machine, machines: [machine]}; context.dispatchEvent(new context.CustomEvent('localclaw:account-context', {detail: state})); }
    };
}

test('an explicit Intel configuration hides incompatible launchers despite late Apple account state, then restores them for Apple', async () => {
    const h = await harness('?fitRam=16&fitPlatform=macos&fitAccelerator=cpu');
    const lmstudio = h.link('lmstudio');
    const localclaw = h.link('localclaw');
    const originalHref = lmstudio.href;
    assert.equal(lmstudio.hidden, true);
    assert.equal(lmstudio.style.display, 'none');
    assert.equal(localclaw.hidden, true);
    assert.match(h.description.textContent, /manual CPU setup/);
    assert.equal(h.note().hidden, false);
    assert.equal(h.note().children[1].href, 'https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#cpu-build');
    assert.equal(h.link('huggingface').hidden, false);
    assert.equal(h.link('llamacpp').hidden, false);
    assert.equal(h.link('unsloth').hidden, true, 'the Intel route only offers verified CPU or model-file paths');
    assert.equal(h.installSteps.hidden, true);
    assert.equal(h.installSteps.style.display, 'none');
    assert.equal(h.installHeading.hidden, true);
    assert.equal(h.installSection.hidden, true, 'avoid an empty bordered install section');
    assert.equal(h.disclosure.hidden, true);
    assert.equal(h.disclosure.style.display, 'none');
    h.account(apple);
    assert.equal(lmstudio.hidden, true, 'the explicit Intel choice still wins over saved Apple hardware');
    h.context.LocalClawFitContext.select(apple);
    assert.equal(h.link('lmstudio'), lmstudio, 'restore the original node and its existing handlers');
    assert.equal(lmstudio.hidden, false);
    assert.equal(lmstudio.style.display, '');
    assert.equal(localclaw.hidden, false);
    assert.equal(h.link('unsloth').hidden, false);
    assert.equal(h.installSteps.hidden, false);
    assert.equal(h.installSteps.style.display, '');
    assert.equal(h.installHeading.hidden, false);
    assert.equal(h.installSection.hidden, false);
    assert.equal(h.disclosure.hidden, false);
    assert.equal(h.disclosure.style.display, '');
    assert.match(h.disclosure.textContent, /Desktop app links/);
    assert.equal(lmstudio.href, originalHref);
    assert.equal(h.note().hidden, true);
    assert.equal(h.note().style.display, 'none');
    assert.match(h.description.textContent, /No terminal/);
    h.context.LocalClawFitContext.select(intel);
    assert.equal(h.picker.children.length, 1, 'do not duplicate the CPU explanation on rerender');
});

test('a primary machine change from Intel to Apple restores the launcher without a query override', async () => {
    const h = await harness('', intel);
    assert.equal(h.link('lmstudio').hidden, true);
    h.account(apple);
    assert.equal(h.link('lmstudio').hidden, false);
    assert.equal(h.link('localclaw').hidden, false);
    assert.equal(h.note().hidden, true);
});

test('Intel keeps a custom model official runtime and never substitutes a stock llama.cpp guide', async () => {
    const customPage = fs.readFileSync(path.join(root, 'models/bonsai-27b.html'), 'utf8');
    const customModel = JSON.parse(customPage.match(/window\.LOCALCLAW_MODEL=(.*?);<\/script>/)[1]);
    assert.ok(customModel.custom_runtime);
    assert.ok(customModel.runtime_url);
    const h = await harness('?fitRam=64&fitPlatform=macos&fitAccelerator=cpu', apple, customModel);
    assert.equal(h.link('official').hidden, false);
    assert.equal(h.link('official').href, customModel.runtime_url);
    assert.equal(h.link('huggingface').hidden, false);
    assert.equal(h.link('llamacpp').hidden, true);
    assert.equal(h.link('lmstudio').hidden, true);
    assert.equal(h.link('localclaw').hidden, true);
    assert.match(h.description.textContent, /special runtime/);
    assert.equal(h.note(), undefined, 'the generic CPU-build note would replace the model-specific requirement');
});
