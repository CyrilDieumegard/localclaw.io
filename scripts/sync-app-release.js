const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'downloads/localclaw-installer-latest.json'), 'utf8'));
assert.match(release.latestVersion, /^\d+\.\d+\.\d+$/);
const check = process.argv.includes('--check');
for (const file of ['index.html', 'software.html']) {
    const target = path.join(root, file);
    const source = fs.readFileSync(target, 'utf8');
    assert.ok(source.includes('data-app-release-version'), `${file}: release marker missing`);
    const expected = source.replace(/(<span data-app-release-version>)[^<]*(<\/span>)/g, (_, open, close) => open + release.latestVersion + close);
    if (check) assert.equal(source, expected, `${file}: public app version differs from the release manifest`);
    else if (expected !== source) fs.writeFileSync(target, expected);
    assert.doesNotMatch(expected, /current public app remains|coming in the 1\.0\.209 beta/i);
}
console.log(`App release labels agree with manifest ${release.latestVersion}.`);
