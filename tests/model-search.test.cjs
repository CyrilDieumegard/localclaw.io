const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {createMatcher} = require('../js/model-search.js');
const sandbox = vm.createContext({console});
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), sandbox);
const models = vm.runInContext('APP_DATA.models', sandbox);

test('common Qwen 3 14B spellings all find the actual catalogue record', () => {
    const model = models.find(m => m.id === 'qwen3-14b');
    for (const query of ['qwen3 14b', 'Qwen 3 (14B)', 'qwen3-14b', 'QWEN3_14B', '  14b   qwen3  ', 'qwen 3 14b']) {
        assert.ok(createMatcher(query)(model), query);
    }
    assert.equal(createMatcher('qwen3 14b')(models.find(m => m.id === 'qwen3-32b')), false);
    assert.equal(createMatcher('qwen3.5')(model), false, 'a different version must not become Qwen 3');
});

test('separator-free family searches include both spaced and unspaced Qwen names', () => {
    const matches = models.filter(createMatcher('qwen3')).map(m => m.id);
    for (const id of ['qwen3-14b', 'qwen3-8b', 'qwen3.8-27b']) assert.ok(matches.includes(id), id);
});

test('terms can be combined across metadata while unrelated terms still return no result', () => {
    const model = models.find(m => m.id === 'nanbeige4.2-3b');
    assert.ok(createMatcher('Nanbeige 4.2')(model));
    assert.equal(createMatcher('nanbeige unrelatedmissingterm')(model), false);
    assert.ok(createMatcher('')({}));
    assert.ok(createMatcher('apertus francais')({name: 'Apértus', tags: ['français']}));
    assert.equal(models.filter(createMatcher('zz-nonexistent-999999')).length, 0);
});

test('both rendered LLM surfaces load and use the same search engine', () => {
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const index = fs.readFileSync(path.join(root, 'js/home-index-20260814g.js'), 'utf8');
    const catalogue = fs.readFileSync(path.join(root, 'llm-list.html'), 'utf8');
    assert.ok(home.indexOf('js/model-search.js?') < home.indexOf('js/home-index-20260814g.js?'));
    assert.match(index, /LocalClawModelSearch\.createMatcher\(query\)/);
    assert.ok(catalogue.indexOf('js/model-search.js?') < catalogue.indexOf('LocalClawModelSearch.createMatcher(search)'));
});
