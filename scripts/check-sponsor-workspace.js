const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const errors = [];
const files = {
  account: read('account.html'),
  client: read('js/account-sponsor-20260814b.js'),
  home: read('js/home-index-20260814g.js'),
  homeCss: read('css/home-index-20260814g.css'),
  styles: read('css/account-sponsor-20260814a.css'),
  migration: read('migrations/0006_sponsor_commerce.sql'),
  baseMigration: read('migrations/0005_sponsor_workspace.sql'),
  campaigns: read('functions/_lib/sponsor-campaigns.js'),
  commerce: read('functions/_lib/sponsor-commerce.js'),
  stripe: read('functions/_lib/stripe.js'),
  logo: read('functions/_lib/sponsor-logo.js'),
  analytics: read('functions/_lib/sponsor-analytics.js'),
  checkout: read('functions/api/sponsor/campaigns/[id]/checkout.js'),
  cancelCheckout: read('functions/api/sponsor/campaigns/[id]/checkout/cancel.js'),
  webhook: read('functions/api/stripe/webhook.js'),
  placements: read('functions/api/sponsor/placements.js'),
  impressions: read('functions/api/sponsor/impressions.js'),
  click: read('functions/sponsor/click/[campaignId].js'),
  logoUpload: read('functions/api/sponsor/campaigns/[id]/logo.js'),
  logoPublic: read('functions/sponsor/logo/[campaignId].js'),
  portal: read('functions/api/sponsor/billing-portal.js'),
  routes: read('_routes.json'),
  wrangler: read('wrangler.toml'),
  terms: read('sponsor-terms.html'),
  privacy: read('privacy.html'),
  architecture: read('SPONSOR_ACCOUNT_ARCHITECTURE.md'),
  package: read('package.json')
};

const placementKeys = [
  'home-left-1', 'home-left-2', 'home-left-3',
  'home-right-1', 'home-right-2', 'home-right-3'
];
for (const key of placementKeys) {
  requireText(files.account, `data-sponsor-placement="${key}"`, `Account page missing fixed placement ${key}`);
  requireText(files.campaigns, `placement("${key}"`, `Server catalog missing fixed placement ${key}`);
  requireText(files.migration, `'${key}'`, `Commerce migration missing fixed placement ${key}`);
}
if ((files.account.match(/data-sponsor-placement=/g) || []).length !== 6) errors.push('Account must contain exactly six fixed placement cards');
if ((files.campaigns.match(/placement\("home-/g) || []).length !== 6) errors.push('Server catalog must contain exactly six fixed placements');
requireText(files.home, 'data-sponsor-placement="home-${side.toLowerCase()}-${slot}"', 'Homepage must map each rail card to its exact fixed placement key');

[
  ['2900', 'Weekly launch price must be server controlled at $29'],
  ['9900', 'Monthly launch price must be server controlled at $99'],
  ['sponsor_pricing_settings', 'Missing dynamic pricing settings'],
  ['sponsor_inventory_reservations', 'Missing inventory reservation table'],
  ['sponsor_inventory_overlap_insert_guard', 'Missing insert overlap guard'],
  ['sponsor_inventory_overlap_update_guard', 'Missing update overlap guard'],
  ['sponsor_stripe_events', 'Missing Stripe event idempotency table'],
  ['sponsor_metric_events', 'Missing sponsor metric events'],
  ['sponsor_campaign_metric_uniques', 'Missing campaign-level unique visitors']
].forEach(([needle, message]) => requireText(files.migration, needle, message));

requireText(files.account, 'Fixed inventory · no rotation', 'Account must disclose fixed positions and no rotation');
requireText(files.account, '$29 for 7 days · $99 for one month', 'Account pricing copy is missing');
requireText(files.terms, 'does not rotate', 'Terms must contractually prohibit rotation');
requireText(files.architecture, 'There is no rotation or randomization.', 'Architecture must preserve no-rotation rule');

requireText(files.package, '"stripe": "22.5.0"', 'Stripe SDK must be pinned to reviewed version 22.5.0');
requireText(files.stripe, '2026-06-24.dahlia', 'Stripe API version must be current and pinned');
requireText(files.stripe, 'createFetchHttpClient', 'Stripe must use the Fetch client on Cloudflare');
requireText(files.stripe, 'createSubtleCryptoProvider', 'Stripe webhooks must use Web Crypto on Cloudflare');
requireText(files.stripe, 'SPONSOR_CHECKOUT_MODE', 'Checkout rollout gate is missing');
requireText(files.wrangler, 'SPONSOR_CHECKOUT_MODE = "pilot"', 'Production configuration must remain pilot gated');
requireText(files.wrangler, 'binding = "SPONSOR_LOGOS"', 'Private R2 logo binding is missing');

requireText(files.checkout, 'integration_identifier', 'Checkout integration identifier is missing');
requireText(files.checkout, 'idempotencyKey', 'Checkout idempotency key is missing');
requireText(files.checkout, 'expires_at: checkoutExpiresAt', 'Checkout expiry is missing');
requireText(files.checkout, 'mode: schedule.autoRenew ? "subscription" : "payment"', 'One-time and subscription Checkout modes are not separated');
requireText(files.checkout, 'trial_end: schedule.endsAt', 'Auto-renewal must begin only after the paid first period');
requireText(files.checkout, "billing_status = 'pending'", 'Owner checkout may only write pending billing state');
requireText(files.checkout, 'sponsorBookingUnavailable', 'Checkout must surface inventory conflicts');
requireText(files.cancelCheckout, 'checkout.sessions.expire', 'Checkout cancellation must expire Stripe before releasing dates');
requireText(files.portal, 'billingPortal.sessions.create', 'Stripe customer portal is missing');

if (/payment_method_types/.test(files.checkout)) errors.push('Checkout must omit payment_method_types so Stripe dynamic payment methods remain enabled');
if (/automatic_tax/.test(files.checkout)) errors.push('Stripe Tax must stay off until active registrations are confirmed');

requireText(files.webhook, 'context.request.text()', 'Webhook signature verification must use the raw request body');
requireText(files.webhook, 'constructEventAsync', 'Webhook signature verification is missing');
requireText(files.webhook, 'stripeWebhookSecret', 'Webhook signing secret is missing');
requireText(files.webhook, 'expectedStripeLivemode', 'Webhook test/live mismatch guard is missing');
requireText(files.webhook, '"checkout.session.completed"', 'Checkout completion event is missing');
requireText(files.webhook, '"invoice.paid"', 'Renewal payment event is missing');
requireText(files.webhook, '"customer.subscription.deleted"', 'Subscription cancellation event is missing');
requireText(files.webhook, '"charge.refunded"', 'Full refund event is missing');
requireText(files.webhook, '"charge.dispute.created"', 'Dispute event is missing');
requireText(files.webhook, "billing_status = 'paid'", 'Only the verified webhook should advance paid state');
requireText(files.baseMigration, 'sponsor_campaign_activation_guard', 'Database activation guard is missing');

const nonWebhookActivationSources = [files.checkout, files.cancelCheckout, files.logoUpload, files.client].join('\n');
if (/SET[\s\S]{0,160}billing_status\s*=\s*['"]paid['"]/i.test(nonWebhookActivationSources)) {
  errors.push('A browser-facing owner route can mark a campaign paid');
}

requireText(files.logo, "image/png", 'PNG logo validation is missing');
requireText(files.logo, "image/webp", 'WebP logo validation is missing');
requireText(files.logo, 'SPONSOR_LOGO_MAX_BYTES = 512 * 1024', 'Logo size limit is missing');
requireText(files.logo, 'validPngChunks', 'PNG structure validation is missing');
requireText(files.logoUpload, 'requireSameOrigin', 'Logo upload must require same origin');
requireText(files.logoUpload, 'getRequiredSession', 'Logo upload must require authentication');
requireText(files.logoPublic, '"Content-Security-Policy": "default-src \'none\'; sandbox"', 'Public logo response lacks restrictive CSP');

requireText(files.home, 'intersectionRatio >= 0.5', 'Visible impression threshold must require at least 50%');
requireText(files.home, '}, 1000)', 'Visible impression timer must require approximately one second');
requireText(files.analytics, 'HttpOnly', 'Sponsor visitor cookie must be HttpOnly');
requireText(files.analytics, 'likelyAutomatedMetricRequest', 'Bot filtering is missing');
requireText(files.analytics, '5 * 60', 'Impression burst deduplication is missing');
requireText(files.click, 'activeSponsorClickTarget', 'Click redirect must resolve a server-owned active destination');
requireText(files.click, '"Referrer-Policy": "no-referrer"', 'Sponsor click redirect must suppress referrer leakage');
requireText(files.account, 'Visible impressions, estimated unique visitors, clicks and CTR', 'Account must display all four independent sponsor metrics');
requireText(files.styles, '.lc-sponsor-creative-preview > [hidden]', 'Creative preview must not render both the fallback mark and logo');
requireText(files.styles, 'display: none !important;', 'Creative preview hidden media must override component display rules');
requireText(files.client, "elements.previewLogo?.addEventListener('error', renderCreativePreviewFallback)", 'Creative preview needs an image-error fallback');
requireText(files.client, 'elements.previewLogo.removeAttribute(\'src\')', 'Creative preview fallback must remove a failed image source');

requireText(files.routes, '"/api/stripe/*"', 'Stripe webhook route is missing from Pages Functions routes');
requireText(files.routes, '"/sponsor/*"', 'Public sponsor click/logo routes are missing');
requireText(files.terms, 'No performance guarantee', 'Sponsor terms must disclaim performance guarantees');
requireText(files.privacy, 'Sponsorship campaigns and payment', 'Privacy policy lacks sponsorship and Stripe disclosure');
requireText(files.privacy, 'random first-party, HttpOnly cookie', 'Privacy policy lacks sponsor unique-visitor disclosure');

const runtime = Object.values(files).join('\n');
const credentialPattern = /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}/;
if (credentialPattern.test(runtime)) errors.push('A Stripe credential-like value is committed in the sponsorship implementation');

if (errors.length) {
  console.error(`Sponsor commerce check failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sponsor commerce check passed: 6 fixed positions, $29/$99 server pricing, atomic date locks, safe logo storage, signed Stripe webhooks and four independent metrics.');

function requireText(source, needle, message) {
  if (!source.includes(needle)) errors.push(message);
}
