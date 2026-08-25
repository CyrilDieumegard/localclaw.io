const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const helperSource = fs.readFileSync(path.join(ROOT, 'js/account-analytics-20260820a.js'), 'utf8');
const accountSource = fs.readFileSync(path.join(ROOT, 'js/account-20260802a.js'), 'utf8');
const accountHtml = fs.readFileSync(path.join(ROOT, 'account.html'), 'utf8');
const calls = [];
const storage = new Map();
const context = {
  window: {
    datafast: (...args) => calls.push(args),
    innerWidth: 390,
    location: { search: '?view=machines', pathname: '/account' },
    sessionStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    }
  }
};
vm.createContext(context);
vm.runInContext(helperSource, context);
const analytics = context.window.LocalClawAccountAnalytics;

assert(analytics, 'Account analytics helper did not initialize');
assert.strictEqual(analytics.ramBucket(8), 'up_to_8');
assert.strictEqual(analytics.ramBucket(16), '9_to_16');
assert.strictEqual(analytics.ramBucket(32), '17_to_32');
assert.strictEqual(analytics.ramBucket(64), '33_to_64');
assert.strictEqual(analytics.ramBucket(128), '65_to_128');
assert.strictEqual(analytics.ramBucket(256), 'over_128');
assert.strictEqual(analytics.accountAgeBucket({ createdAt: '2026-08-20T10:00:00Z' }, new Date('2026-08-20T10:10:00Z')), 'new');
assert.strictEqual(analytics.accountAgeBucket({}, new Date('2026-08-20T10:10:00Z')), 'unknown');

const sanitized = analytics.sanitize({
  source: 'account_page',
  platform: 'macos',
  ram_bucket: '9_to_16',
  email: 'private@example.com',
  user_id: 'user-123',
  machine_id: 'machine-123',
  notes: 'private note',
  model_id: 'qwen3-8b',
  status: 'saved',
  error_code: 'invalid_machine',
  match_source: 'unique_hardware',
  match_count: 1,
  preferences_updated: true
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(sanitized)), {
  source: 'account_page',
  platform: 'macos',
  ram_bucket: '9_to_16',
  model_id: 'qwen3-8b',
  status: 'saved',
  error_code: 'invalid_machine',
  match_source: 'unique_hardware',
  match_count: 1,
  preferences_updated: true
});

assert(analytics.track('auth_started', { provider: 'google' }, { onceKey: 'auth-start' }));
assert(!analytics.track('auth_started', { provider: 'google' }, { onceKey: 'auth-start' }));
assert(!analytics.track('not_allowed', { provider: 'google' }));
assert.strictEqual(calls.length, 1, 'Goal allowlist or once-only deduplication failed');
assert.deepStrictEqual(JSON.parse(JSON.stringify(analytics.funnelContext())), {
  device_type: 'mobile',
  landing_page: '/account',
  entry_source: 'direct'
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(calls[0][1])), {
  device_type: 'mobile',
  landing_page: '/account',
  entry_source: 'direct',
  provider: 'google'
});

const requiredEvents = [
  'account_page_loaded',
  'auth_started',
  'auth_success',
  'auth_error',
  'account_created',
  'workspace_loaded',
  'machine_create_started',
  'machine_create_succeeded',
  'machine_create_failed',
  'account_recommendation_viewed',
  'account_compare_open',
  'account_model_open',
  'plan_saved',
  'plan_save_failed',
  'plan_update_viewed',
  'plan_action_clicked',
  'existing_machine_match_shown',
  'existing_machine_reused',
  'duplicate_machine_avoided',
  'new_machine_requested',
  'model_saved',
  'model_status_updated',
  'test_log_saved',
  'account_api_error'
];
for (const event of requiredEvents) {
  assert(accountSource.includes(`'${event}'`), `Missing account funnel event: ${event}`);
}

const trackingBlocks = [...accountSource.matchAll(/trackAccountGoal\([\s\S]*?\);/g)].map(match => match[0]).join('\n');
for (const forbidden of ['email:', 'user_id:', 'machine_id:', 'machine_name:', 'cpuModel:', 'gpuModel:', 'notes:']) {
  assert(!trackingBlocks.includes(forbidden), `Sensitive tracking property found: ${forbidden}`);
}

const helperIndex = accountHtml.indexOf('/js/account-analytics-20260820a.js?v=20260823a');
const accountIndex = accountHtml.indexOf('/js/account-20260802a.js?v=20260825a');
assert(helperIndex >= 0 && accountIndex > helperIndex, 'Account analytics helper must load before the account client');

console.log(`Account analytics checks passed: ${requiredEvents.length} funnel events, safe-property allowlist and once-only deduplication.`);
