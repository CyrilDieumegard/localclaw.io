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
const machineCompatibility = read('js/machine-compat-20260802a.js');

const dataContext = {};
vm.createContext(dataContext);
vm.runInContext(`${read('js/data.js')};this.APP_DATA=APP_DATA;`, dataContext);
const guidedSteps = Array.from(dataContext.APP_DATA.flows.guided, (step) => step.id);
assert.deepStrictEqual(guidedSteps, ['os', 'level', 'usage'], 'Guided plan flow must remain three decisions');
const guidedOsValues = Array.from(dataContext.APP_DATA.flows.guided[0].options, (option) => option.value);
assert(guidedOsValues.includes('mac') && guidedOsValues.includes('mac-intel'), 'Guided flow must distinguish Apple Silicon from Intel Mac without another step');

const matcherContext = {
  window: { LocalClawAccountAnalytics: null },
  document: { addEventListener() {} }
};
vm.createContext(matcherContext);
vm.runInContext(account, matcherContext);
const matcher = matcherContext.window.LocalClawPlanMachineMatcher;
assert(matcher, 'Plan machine matcher did not initialize');

const pendingMachine = {
  platform: 'macos', accelerator: 'apple-silicon', ramGb: 32, vramGb: null, useCase: 'coding', priority: 'balanced'
};
const studio = {
  id: 'mac-studio', name: 'Mac Studio', platform: 'macos', accelerator: 'apple-silicon', ramGb: 32, vramGb: null, useCase: 'chat', priority: 'quality'
};
const mini = {
  id: 'mac-mini', name: 'Mac mini', platform: 'macos', accelerator: 'apple-silicon', ramGb: 32, vramGb: null, useCase: 'reasoning', priority: 'speed'
};
let resolution = matcher.resolvePendingPlanMachine([studio], { machine: pendingMachine, preferredMachineId: '' });
assert.strictEqual(resolution.mode, 'reuse', 'One matching hardware profile must be reused');
assert.strictEqual(resolution.matchSource, 'unique_hardware');
assert.strictEqual(resolution.machine.id, 'mac-studio');

resolution = matcher.resolvePendingPlanMachine([studio, mini], { machine: pendingMachine, preferredMachineId: 'mac-studio' });
assert.strictEqual(resolution.mode, 'reuse', 'A verified preferred machine must avoid the chooser');
assert.strictEqual(resolution.matchSource, 'preferred_machine');

resolution = matcher.resolvePendingPlanMachine([studio, mini], { machine: pendingMachine, preferredMachineId: '' });
assert.strictEqual(resolution.mode, 'choose', 'Multiple hardware matches without a preferred machine need a choice');
assert.strictEqual(resolution.matches.length, 2);

resolution = matcher.resolvePendingPlanMachine([{ ...studio, ramGb: 64 }], { machine: pendingMachine, preferredMachineId: '' });
assert.strictEqual(resolution.mode, 'create', 'Different installed memory must not be silently reused');

for (const marker of [
  'buildCurrentPlanPayload()',
  "'plan_result_viewed'",
  "'plan_save_started'",
  "'plan_action_clicked'",
  "localStorage.setItem('localclaw_pending_plan'",
  'Keep this plan updated',
  'data-plan-save-button',
  "localStorage.getItem('localclaw_primary_machine')",
  "localStorage.getItem('localclaw_saved_machines')",
  'preferredMachineId',
  "'existing_machine_match_shown'",
  'without creating a duplicate',
  "window.setTimeout(() => window.location.assign('/account?add=plan'), 180)",
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
  'sameHardwareProfile(left, right)',
  "localStorage.setItem('localclaw_saved_machines'",
  'reusePendingPlanMachine(machine, pending, matchSource)',
  "'existing_machine_reused'",
  "'duplicate_machine_avoided'",
  "'new_machine_requested'",
  "'plan_saved'",
  "'plan_save_failed'",
  "'plan_update_viewed'",
  'Automatic save was unavailable. Review the details and save once.',
  "source: 'account_plan_handoff'",
  'My Local AI Plan'
]) {
  assert(account.includes(marker), `Missing account plan marker: ${marker}`);
}

const resumeStart = account.indexOf('async function resumePendingPlanIfNeeded()');
const resumeEnd = account.indexOf('\n    function showSignedOut', resumeStart);
const resumeSource = account.slice(resumeStart, resumeEnd);
assert(resumeStart >= 0 && resumeEnd > resumeStart, 'Pending plan resume function is missing');
assert(resumeSource.indexOf('resolvePendingPlanMachine(state.machines, pending)') < resumeSource.indexOf('createPendingPlanMachine(pending)'), 'Hardware matching must run before automatic creation');
assert(resumeSource.indexOf('preferredMachineId') < resumeSource.indexOf('createPendingPlanMachine(pending)'), 'A cached preferred machine must be checked before automatic creation');
assert(account.includes("source: 'finder'"), 'Finder plans must retain their source');
assert(accountHtml.includes('My Local AI Plans'), 'Account does not expose the plans workspace');
assert(accountHtml.includes('machine-match-dialog'), 'Multiple saved hardware matches need an explicit low-friction choice');
assert(accountHtml.includes('/js/account-20260802a.js?v=20260825a'), 'Account plan script cache key is stale');
assert(account.includes("id: 'mac-mini-m6-2026'"), 'Account presets are missing Mac mini M6');
assert(account.includes("id: 'mac-mini-m5-pro-2026'"), 'Account presets are missing Mac mini M5 Pro');
assert(accountHtml.includes('/js/account-analytics-20260820a.js?v=20260823a'), 'Account plan analytics cache key is stale');
assert(accountHtml.includes('/css/account-20260802a.css?v=20260823a'), 'Account plan CSS cache key is stale');
assert(accountCss.includes('.lc-plan-overview'), 'Account plan overview styles are missing');
assert(accountCss.includes('.lc-machine-match'), 'Existing-machine choice styles are missing');
assert(machineCompatibility.includes('includeTight: false'), 'Account plans must exclude tight-fit LLMs');
assert(account.includes('indexableLocalModels()'), 'Account recommendations must use the same indexable local LLM scope as the homepage');
assert(account.includes('APP_DATA.hfRepoVerification?.unavailable'), 'Account recommendations must exclude exact-repository-unavailable LLM tombstones');
assert(accountHtml.includes('/js/machine-compat-20260802a.js?v=20260823a'), 'Account machine compatibility cache key is stale');
assert(index.includes('js/data.js?v=20260826b'), 'Homepage flow data cache key is stale');
assert(index.includes('js/app-20260816a.js?v=20260826b'), 'Homepage plan app cache key is stale');
assert(index.includes('js/growth-paths-20260727a.js?v=20260822a'), 'Homepage growth path cache key is stale');
assert(growth.includes('Build my Local AI Plan'), 'Article acquisition CTA is not plan-led');
assert(growth.includes('no signup before value'), 'Article CTA must explain the no-signup result');

for (const forbidden of ['prompt:', 'terminal_output:', 'machine_name:', 'email:']) {
  const trackedPlanBlocks = [...app.matchAll(/this\.trackGoal\('(plan_result_viewed|plan_save_started|plan_action_clicked)'[\s\S]*?\n\s*\}\);/g)]
    .map((match) => match[0])
    .join('\n');
  assert(!trackedPlanBlocks.includes(forbidden), `Plan analytics include sensitive field: ${forbidden}`);
}

console.log('Local AI Plan checks passed: three-step result, saved-hardware reuse, duplicate prevention, plan updates and privacy-safe analytics.');
