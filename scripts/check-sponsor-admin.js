const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const errors = [];
const files = {
  account: read('account.html'),
  workspaceClient: read('js/account-sponsor-20260814b.js'),
  adminClient: read('js/account-sponsor-admin-20260814a.js'),
  adminCss: read('css/account-sponsor-admin-20260814a.css'),
  adminLib: read('functions/_lib/sponsor-admin.js'),
  overview: read('functions/api/sponsor/admin/overview.js'),
  action: read('functions/api/sponsor/admin/campaigns/[id].js'),
  campaignLib: read('functions/_lib/sponsor-campaigns.js'),
  migration: read('migrations/0007_sponsor_admin.sql'),
  routes: read('_routes.json'),
  middleware: read('functions/_middleware.js'),
  wrangler: read('wrangler.toml')
};

requireText(files.account, 'id="sponsor-admin-tab"', 'Account is missing the owner-only admin tab');
requireText(files.account, 'data-account-panel="campaign-admin"', 'Account is missing the admin panel');
requireText(files.account, 'Visible</span>', 'Admin summary must expose visible impressions');
requireText(files.account, 'Visitors</span>', 'Admin summary must expose unique visitors separately');
requireText(files.account, 'Clicks</span>', 'Admin summary must expose clicks separately');
requireText(files.account, 'CTR</span>', 'Admin summary must expose CTR separately');
requireText(files.account, 'Stopping a campaign never creates a refund', 'Admin UI must disclose that stopping does not refund');
requireText(files.account, 'Manual extensions never create a Stripe charge', 'Admin UI must disclose free manual extensions');
requireText(files.workspaceClient, "'campaign-admin'", 'Account view router does not support the admin panel');
requireText(files.adminClient, "'/api/sponsor/admin/overview'", 'Admin client does not probe the protected overview');
requireText(files.adminClient, 'data-admin-action="stop_now"', 'Admin client is missing stop-now control');
requireText(files.adminClient, 'data-admin-action="cancel_renewal"', 'Admin client is missing renewal cancellation');
requireText(files.adminClient, 'data-admin-action="extend_week"', 'Admin client is missing weekly extension');
requireText(files.adminClient, 'data-admin-action="extend_month"', 'Admin client is missing monthly extension');
requireText(files.adminCss, '.lc-sponsor-admin-summary', 'Admin dashboard styling is missing');

requireText(files.adminLib, 'SPONSOR_ADMIN_EMAILS', 'Admin authorization must use a server-side allowlist secret');
requireText(files.adminLib, 'getRequiredSession', 'Admin authorization must require a verified account session');
requireText(files.adminLib, 'allowed.includes(email)', 'Admin authorization must compare the normalized session email');
requireText(files.overview, 'getRequiredSponsorAdmin', 'Admin overview is not server-authorized');
requireText(files.action, 'getRequiredSponsorAdmin', 'Admin mutations are not server-authorized');
requireText(files.action, 'requireSameOrigin', 'Admin mutations lack same-origin CSRF protection');
requireText(files.action, 'admin_confirmation_required', 'Admin mutations lack a campaign confirmation token');
requireText(files.action, 'subscriptions.cancel', 'Stop-now must cancel an attached Stripe subscription');
requireText(files.action, 'cancel_at_period_end: true', 'Renewal cancellation must be delegated to Stripe');
requireText(files.action, 'checkout.sessions.expire', 'Stop-now must expire an open Stripe checkout');
requireText(files.action, 'idempotencyKey', 'Stripe admin writes need idempotency keys');
requireText(files.action, 'sponsorBookingUnavailable', 'Manual extensions must surface inventory overlap conflicts');
requireText(files.action, "status = 'released'", 'Stop-now must release fixed inventory');
if (/refunds\.(?:create|cancel)|charges\.refund/.test(files.action)) errors.push('Admin actions must not issue automatic refunds');

requireText(files.migration, 'sponsor_admin_actions', 'Admin action audit table is missing');
for (const action of ['stop_now', 'cancel_renewal', 'extend_week', 'extend_month']) {
  requireText(files.migration, `'${action}'`, `Admin audit migration is missing ${action}`);
}
requireText(files.campaignLib, 'row.status !== "cancelled"', 'Cancelled paid campaigns must remain visibly cancelled');
if (/cdieumegard@gmail\.com/i.test(Object.values(files).join('\n'))) errors.push('Owner email must remain in a Cloudflare secret, not committed source');
if (/SPONSOR_ADMIN_EMAILS\s*=/.test(files.wrangler)) errors.push('Admin email allowlist must not be committed in wrangler.toml');

for (const route of [
  '/migrations/0007_sponsor_admin.sql',
  '/scripts/check-sponsor-admin.js',
  '/functions/_lib/sponsor-admin.js',
  '/functions/api/sponsor/admin/overview.js',
  '/functions/api/sponsor/admin/campaigns/[id].js'
]) {
  requireText(files.routes, JSON.stringify(route), `_routes.json lacks private guard for ${route}`);
  requireText(files.middleware, JSON.stringify(route), `Middleware lacks private guard for ${route}`);
}

const credentialPattern = /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}/;
if (credentialPattern.test(Object.values(files).join('\n'))) errors.push('Stripe credential-like value committed in admin implementation');

if (errors.length) {
  console.error(`Sponsor admin check failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sponsor admin check passed: exact-email server authorization, all-campaign metrics, audited cancellation and overlap-safe manual extensions.');

function requireText(source, needle, message) {
  if (!source.includes(needle)) errors.push(message);
}
