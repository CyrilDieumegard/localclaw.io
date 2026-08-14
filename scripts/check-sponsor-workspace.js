const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const errors = [];

const files = {
  account: read('account.html'),
  accountRuntime: read('js/account-20260802a.js'),
  client: read('js/account-sponsor-20260814a.js'),
  ratingsClient: read('js/community-ratings-20260802a.js'),
  styles: read('css/account-sponsor-20260814a.css'),
  migration: read('migrations/0005_sponsor_workspace.sql'),
  library: read('functions/_lib/sponsor-campaigns.js'),
  campaigns: read('functions/api/sponsor/campaigns/index.js'),
  campaign: read('functions/api/sponsor/campaigns/[id].js'),
  catalog: read('functions/api/sponsor/catalog.js'),
  routes: read('_routes.json'),
  architecture: read('SPONSOR_ACCOUNT_ARCHITECTURE.md')
};

const placementKeys = [
  'home-left-1', 'home-left-2', 'home-left-3',
  'home-right-1', 'home-right-2', 'home-right-3'
];

for (const key of placementKeys) {
  requireText(files.account, `data-sponsor-placement="${key}"`, `Account page missing placement ${key}`);
  requireText(files.library, `placement("${key}"`, `Server catalog missing placement ${key}`);
  requireText(files.migration, `'${key}'`, `Migration missing placement ${key}`);
}

const accountPlacementCount = (files.account.match(/data-sponsor-placement=/g) || []).length;
if (accountPlacementCount !== 6) errors.push(`Expected 6 account placement cards, found ${accountPlacementCount}`);
const libraryPlacementCount = (files.library.match(/placement\("home-/g) || []).length;
if (libraryPlacementCount !== 6) errors.push(`Expected 6 server placements, found ${libraryPlacementCount}`);

[
  'sponsor_campaigns', 'sponsor_campaign_creatives', 'sponsor_daily_metrics', 'sponsor_campaign_events',
  'sponsor_campaign_insert_draft_guard', 'sponsor_campaign_activation_guard'
].forEach((name) => requireText(files.migration, name, `Migration missing ${name}`));

requireText(files.migration, "NEW.\"billing_status\" <> 'paid'", 'Activation guard must require trusted paid billing state');
requireText(files.migration, "DEFAULT 'not_configured'", 'Billing must default to not_configured');
requireText(files.routes, '"/api/sponsor/*"', 'Sponsor APIs are absent from the Pages Functions routes');
requireText(files.account, 'Billing offline · no campaigns live', 'Account must disclose the inactive commercial state');
requireText(files.account, 'Editorial model order, LocalClaw scores and community ratings always remain independent.', 'Account must disclose editorial independence');
requireText(files.account, 'no Stripe SDK, checkout, webhook, secret or payment call', 'Account must disclose the Stripe boundary');
requireText(files.client, "credentials: 'same-origin'", 'Sponsor client requests must include same-origin credentials');
requireText(files.client, "hostname.endsWith('.pages.dev')", 'Visual preview must be restricted to Cloudflare Pages preview hosts');
requireText(files.client, "params.get('preview') === 'sponsorship'", 'Visual preview must require an explicit sponsorship query');
requireText(files.client, 'Read-only preview: this form cannot save', 'Visual preview must block campaign mutations');
requireText(files.accountRuntime, "hostname.endsWith('.pages.dev')", 'Account auth bypass must be restricted to Cloudflare Pages preview hosts');
requireText(files.accountRuntime, "get('preview') === 'sponsorship'", 'Account auth bypass must require an explicit sponsorship query');
requireText(files.ratingsClient, "hostname.endsWith('.pages.dev')", 'Ratings auth bypass must be restricted to Cloudflare Pages preview hosts');
requireText(files.ratingsClient, "get('preview') === 'sponsorship'", 'Ratings auth bypass must require an explicit sponsorship query');
requireText(files.styles, 'body[data-account-preview="sponsorship"] #sign-out', 'Visual preview must hide the real account sign-out action');
requireText(files.campaigns, 'getRequiredSession', 'Campaign collection API must require authentication');
requireText(files.campaign, 'getRequiredSession', 'Campaign mutation API must require authentication');
requireText(files.campaigns, 'WHERE c.user_id = ?', 'Campaign list must be owner-scoped');
requireText(files.campaign, 'WHERE c.id = ? AND c.user_id = ?', 'Campaign mutation must be owner-scoped');
requireText(files.campaigns, 'requireSameOrigin', 'Campaign creation must require same origin');
requireText(files.campaign, 'requireSameOrigin', 'Campaign mutation must require same origin');

const runtimeSources = [files.client, files.library, files.campaigns, files.campaign, files.catalog].join('\n');
const forbiddenRuntimePatterns = [
  /@stripe\//i,
  /js\.stripe\.com/i,
  /api\.stripe\.com/i,
  /STRIPE_[A-Z_]+/,
  /checkout\.sessions/i,
  /paymentIntents\.create/i,
  /constructEvent\s*\(/i,
  /webhook-signature/i
];
for (const pattern of forbiddenRuntimePatterns) {
  if (pattern.test(runtimeSources)) errors.push(`Stripe runtime integration found before authorization: ${pattern}`);
}

const activationWrites = runtimeSources.match(/(?:status|billing_status)\s*=\s*['"](?:paid|scheduled|active)['"]/gi) || [];
if (activationWrites.length) errors.push(`Owner runtime contains activation write(s): ${activationWrites.join(', ')}`);

const priceClaims = files.account.match(/(?:CHF|USD|EUR|\$\d|€\d|£\d)/g) || [];
if (priceClaims.length) errors.push(`Account contains unapproved price claim(s): ${priceClaims.join(', ')}`);

if (errors.length) {
  console.error(`Sponsor workspace check failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sponsor workspace check passed: 6 preview placements, owner-scoped drafts, fail-closed activation and no Stripe runtime.');

function requireText(source, needle, message) {
  if (!source.includes(needle)) errors.push(message);
}
