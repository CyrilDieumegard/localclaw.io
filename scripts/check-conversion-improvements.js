const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('js/app-20260816a.js');
const account = read('account.html');
const accountCss = read('css/account-20260802a.css');
const index = read('index.html');

for (const marker of [
  "'recommender_step_view'",
  "'recommender_step_complete'",
  "'recommender_error'",
  'finderStepGoal(flow, index, state)',
  "this.finderStepGoal(this.state.activeFlow, this.state.currentStepIndex + 1, 'view')",
  "this.finderStepGoal(this.state.activeFlow, this.state.currentStepIndex + 1, 'done')",
  "'machine_save_started'",
  "'account_open'",
  "localStorage.setItem('localclaw_pending_machine'",
  "localStorage.setItem('localclaw_pending_plan'",
  'Keep this plan updated'
]) {
  assert(app.includes(marker), `Missing recommender conversion marker: ${marker}`);
}

const diagnosticBlocks = [...app.matchAll(/this\.trackGoal\('(recommender_step_view|recommender_step_complete|recommender_error)'[\s\S]*?\n\s*\}\);/g)]
  .map((match) => match[0])
  .join('\n');
assert(diagnosticBlocks, 'No recommender diagnostic blocks found');
for (const forbidden of ['answers:', 'value:', 'text:', 'cpu:', 'gpu:', 'email:', 'machine_name:']) {
  assert(!diagnosticBlocks.includes(forbidden), `Sensitive finder field found in diagnostics: ${forbidden}`);
}

for (const copy of [
  'Your machine. Your goal. One living Local AI Plan.',
  'Plans, machines and model notes are free.',
  'Sponsorship is a separate workspace after sign-in',
  'does not collect prompts, local files, serial numbers or operating-system identifiers'
]) {
  assert(account.includes(copy), `Missing account conversion copy: ${copy}`);
}

assert(account.includes('/css/account-20260802a.css?v=20260823a&amp;summary=20260823a'), 'Account CSS cache key is stale');
assert(index.includes('js/app-20260816a.js?v=20260902b'), 'Homepage app cache key is stale');
assert(accountCss.includes('.lc-account-benefits'), 'Account benefit-list styles are missing');
assert(accountCss.includes('.lc-auth-trust'), 'Account privacy reassurance styles are missing');

console.log('Conversion improvement checks passed: account promise, recommendation handoff and privacy-safe finder diagnostics.');
