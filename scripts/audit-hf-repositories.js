const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CONCURRENCY = 6;

function loadAppData() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8')};this.APP_DATA_EXPORT=APP_DATA;`, context);
  return context.APP_DATA_EXPORT;
}

function expectedEntries(verification) {
  return ['publicGguf', 'publicModelCard', 'gated', 'unavailable'].flatMap(expected =>
    Object.entries(verification[expected] || {}).map(([id, repo]) => ({ id, repo, expected }))
  );
}

async function inspect(entry) {
  const encodedRepo = String(entry.repo).split('/').map(encodeURIComponent).join('/');
  const endpoint = `https://huggingface.co/api/models/${encodedRepo}?blobs=true`;
  try {
    const response = await fetch(endpoint, {
      redirect: 'follow',
      headers: { Accept: 'application/json', 'User-Agent': 'LocalClaw-catalogue-audit/1.0' }
    });
    if (!response.ok) {
      return { ...entry, status: response.status, actual: 'unavailable', hasGguf: false, gated: false };
    }
    const data = await response.json();
    const siblings = Array.isArray(data.siblings) ? data.siblings : [];
    const hasGguf = siblings.some(file => /\.gguf$/i.test(String(file && file.rfilename || '')));
    const gated = Boolean(data.gated);
    return {
      ...entry,
      status: response.status,
      actual: gated ? 'gated' : hasGguf ? 'publicGguf' : 'publicModelCard',
      hasGguf,
      gated,
      resolvedId: data.id || ''
    };
  } catch (error) {
    return { ...entry, status: 0, actual: 'networkError', hasGguf: false, gated: false, error: error.message };
  }
}

async function mapLimited(entries, limit, worker) {
  const results = new Array(entries.length);
  let cursor = 0;
  async function run() {
    while (cursor < entries.length) {
      const index = cursor++;
      results[index] = await worker(entries[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, entries.length) }, run));
  return results;
}

function equivalent(expected, actual) {
  if (expected === actual) return true;
  // A gated repository can still enumerate GGUF files; access terms remain the stronger class.
  return false;
}

async function main() {
  const appData = loadAppData();
  const verification = appData.hfRepoVerification || {};
  const entries = expectedEntries(verification);
  const uniqueLocalIds = new Set((appData.models || []).filter(model => !model.hosted_only).map(model => model.id));
  if (entries.length !== uniqueLocalIds.size) {
    throw new Error(`Snapshot coverage mismatch: ${entries.length} entries for ${uniqueLocalIds.size} unique local model IDs.`);
  }

  const results = await mapLimited(entries, CONCURRENCY, inspect);
  const networkErrors = results.filter(result => result.actual === 'networkError');
  const drift = results.filter(result => result.actual !== 'networkError' && !equivalent(result.expected, result.actual));
  const counts = results.reduce((summary, result) => {
    summary[result.actual] = (summary[result.actual] || 0) + 1;
    return summary;
  }, {});

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ checkedAt: new Date().toISOString(), counts, networkErrorCount: networkErrors.length, drift, results }, null, 2)}\n`);
  } else {
    console.log(`Hugging Face audit: ${results.length} exact id/repo pairs checked anonymously.`);
    console.log(`Observed: ${Object.entries(counts).map(([state, count]) => `${count} ${state}`).join(', ')}.`);
    if (networkErrors.length) {
      console.error(`Network audit incomplete: ${networkErrors.length}/${results.length} requests failed before an HTTP response. No classification was inferred from those failures.`);
    }
    if (drift.length) {
      console.error(`Classification drift (${drift.length}):`);
      for (const result of drift) {
        console.error(`- ${result.id}: ${result.expected} -> ${result.actual} (${result.repo}; HTTP ${result.status || 'network error'})`);
      }
    }
  }

  if (networkErrors.length) process.exitCode = 2;
  else if (drift.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
