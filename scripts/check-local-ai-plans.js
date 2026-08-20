const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('js/app-20260816a.js');
const account = read('js/account-20260802a.js');
const accountHtml = read('account.html');
const accountCss = read('css/account-20260802a.css');
const growth = read('js/growth-paths-20260727a.js');
const index = read('index.html');

const dataContext = {};
vm.createContext(dataContext);
vm.runInContext(`${read('js/data.js')};this.APP_DATA=APP_DATA;`, dataContext);
const guidedSteps = Array.from(dataContext.APP_DATA.flows.guided, (step) => step.id);
assert.deepStrictEqual(guidedSteps, ['os', 'level', 'usage'], 'Guided plan flow must remain three decisions');
const guidedOsValues = Array.from(dataContext.APP_DATA.flows.guided[0].options, (option) => option.value);
assert(guidedOsValues.includes('mac') && guidedOsValues.includes('mac-intel'), 'Guided flow must distinguish Apple Silicon from Intel Mac without another step');

for (const marker of [
  'buildCurrentPlanPayload()',
  "'plan_result_viewed'",
  "'plan_save_started'",
  "'plan_action_clicked'",
  "localStorage.setItem('localclaw_pending_plan'",
  'Keep this plan updated',
  'Ready now · no signup required',
  "rawPlatform === 'mac-intel'",
  "lower.includes('apple m5')",
  "os === 'mac' && /intel/.test(lower)"
]) {
  assert(app.includes(marker), `Missing public plan marker: ${marker}`);
}

for (const marker of [
  'resumePendingPlanIfNeeded()',
  'samePlanMachine(left, right)',
  "'plan_saved'",
  "'plan_save_failed'",
  "'plan_update_viewed'",
  'Automatic save was unavailable. Review the details and save once.',
  'My Local AI Plan'
]) {
  assert(account.includes(marker), `Missing account plan marker: ${marker}`);
}

const resumeStart = account.indexOf('async function resumePendingPlanIfNeeded()');
const resumeEnd = account.indexOf('\n    function showSignedOut', resumeStart);
const resumeSource = account.slice(resumeStart, resumeEnd);
assert(resumeStart >= 0 && resumeEnd > resumeStart, 'Pending plan resume function is missing');
assert(resumeSource.indexOf('samePlanMachine(machine, pending.machine)') < resumeSource.indexOf("fetch('/api/machines'"), 'Duplicate protection must run before automatic creation');
assert(account.includes("source: 'finder'"), 'Finder plans must retain their source');
assert(accountHtml.includes('My Local AI Plans'), 'Account does not expose the plans workspace');
assert(accountHtml.includes('/js/account-20260802a.js?v=20260820b'), 'Account plan script cache key is stale');
assert(accountHtml.includes('/js/account-analytics-20260820a.js?v=20260820b'), 'Account plan analytics cache key is stale');
assert(accountHtml.includes('/css/account-20260802a.css?v=20260820b'), 'Account plan CSS cache key is stale');
assert(accountCss.includes('.lc-plan-overview'), 'Account plan overview styles are missing');
assert(index.includes('js/data.js?v=20260820c'), 'Homepage flow data cache key is stale');
assert(index.includes('js/app-20260816a.js?v=20260820c'), 'Homepage plan app cache key is stale');
assert(index.includes('js/growth-paths-20260727a.js?v=20260820a'), 'Homepage growth path cache key is stale');
assert(growth.includes('Build my Local AI Plan'), 'Article acquisition CTA is not plan-led');
assert(growth.includes('no signup before value'), 'Article CTA must explain the no-signup result');

for (const forbidden of ['prompt:', 'terminal_output:', 'machine_name:', 'email:']) {
  const trackedPlanBlocks = [...app.matchAll(/this\.trackGoal\('(plan_result_viewed|plan_save_started|plan_action_clicked)'[\s\S]*?\n\s*\}\);/g)]
    .map((match) => match[0])
    .join('\n');
  assert(!trackedPlanBlocks.includes(forbidden), `Plan analytics include sensitive field: ${forbidden}`);
}

console.log('Local AI Plan checks passed: three-step result, automatic deduplicated save, plan updates and privacy-safe analytics.');
