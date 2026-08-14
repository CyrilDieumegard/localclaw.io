# LocalClaw Sponsor Account Architecture

Status: the fixed-position sponsor commerce implementation is complete in code. Production checkout remains pilot-gated by account email and cannot operate until the D1 migration, R2 buckets, Stripe product, restricted API key and signed webhook secret are configured and verified.

## Commercial contract

- Six desktop homepage rail positions exist and never rotate: `home-left-1..3` and `home-right-1..3`.
- Launch pricing is server-controlled in D1: USD 29 for seven days and USD 99 for one calendar month.
- Pricing may change for future campaigns. Every checkout snapshots its price, period and terms version.
- Start mode is either immediate after verified payment or a selected UTC date.
- No impressions, visitors, clicks, conversions, revenue, SEO effect or editorial effect are guaranteed.
- Sponsorship never changes model order, LocalClaw scores, community stars or editorial recommendations.

## Account journey

1. A Google-authenticated account opens **Account → Sponsorship**.
2. The sponsor creates a draft with advertiser, HTTPS destination, factual copy, CTA and one exact fixed position.
3. The sponsor uploads a genuine PNG or WebP logo. The API validates bytes, dimensions, aspect ratio and size before storing it in private R2.
4. The sponsor chooses seven days or one calendar month, immediate or future start, and optional Stripe automatic renewal.
5. The server reads the current price and atomically creates a short inventory hold. Overlapping dates for the same position are rejected by D1 triggers.
6. Stripe-hosted Checkout collects payment. Browser redirects never mark a campaign paid.
7. A verified, idempotent Stripe webhook changes the reservation from `held` to `sold`, approves the stored creative and schedules or activates the campaign.
8. The homepage resolves each exact position independently. There is no rotation or randomization.
9. The account reports visible impressions, estimated unique visitors, clicks and CTR separately.

## Reservation model

`sponsor_inventory_reservations` stores the selected position, exact start, first-period end, blocking end and state. A Checkout Session lasts 30 minutes and its D1 hold lasts slightly longer to cover webhook latency.

One-time purchases block only their paid period. An auto-renewing campaign blocks future inventory until Stripe reports `cancel_at_period_end` or subscription deletion. In that case the block is shortened to the last paid-through timestamp, making later dates bookable without overlap.

The overlap rule is database-enforced on both insert and update. Client-side availability is advisory; the D1 trigger is authoritative.

## Stripe design

The integration uses Stripe Checkout Sessions and Billing with Stripe API `2026-06-24.dahlia` through the official Stripe Node SDK and Fetch/Web Crypto providers.

- One-time campaign: Checkout `mode=payment`.
- Automatic renewal: Checkout `mode=subscription` with a recurring line and a one-time first-period line. The recurring line is trialled through the end of the already-paid first campaign period, then Stripe Billing handles renewals, retries and cancellation.
- Dynamic payment methods remain enabled by omitting `payment_method_types`.
- Every Checkout Session has an integration identifier, server metadata, a 30-minute expiry and an idempotency key.
- The Stripe customer portal is the only owner-facing renewal-management surface.
- Webhook signatures are verified against the untouched raw request body.
- Processed Stripe event IDs are stored in `sponsor_stripe_events` for replay safety.

Handled events include paid/expired Checkout Sessions, renewal invoice success/failure, subscription changes/deletion, full refunds and disputes. Public serving always requires `billing_status=paid`, a paid-through timestamp in the future and a verified active date range.

Stripe Tax is deliberately not enabled in code. It must only be enabled after the account owner confirms the required active tax registrations and product tax treatment with an adviser.

## Secrets and runtime controls

The code expects Cloudflare secrets or variables, never committed values:

- `STRIPE_SECRET_KEY` — preferably a least-privilege restricted key;
- `STRIPE_WEBHOOK_SECRET` — signing secret for `/api/stripe/webhook`;
- `STRIPE_SPONSOR_PRODUCT_ID` — the single Stripe sponsor product;
- `SPONSOR_PILOT_EMAILS` — authenticated accounts allowed through the pilot gate;
- `SPONSOR_CHECKOUT_MODE` — `off`, `pilot` or `live`;
- `SPONSOR_SERVING_ENABLED` — public placement kill switch; and
- `STRIPE_EXPECTED_LIVEMODE` — rejects test/live webhook mismatches.

The existing Better Auth and Google secrets remain required. Production and preview must use separate Stripe keys, webhook secrets and R2 buckets.

## Logo safety

Only PNG and WebP are accepted, up to 512 KB, from 64×64 to 1024×1024 and with a near-square aspect ratio. File signatures and PNG chunk CRCs are checked; SVG and remote logo URLs are rejected. Public delivery uses a campaign-scoped route with `nosniff`, a restrictive image CSP and same-origin resource policy.

## Measurement

A visible impression requires at least 50% of a sponsor card to remain in the viewport for approximately one second. The server filters common bots and rapid duplicates. A random first-party HttpOnly cookie is hashed before storage; raw cookie values, IP addresses and account identities are not exposed to sponsors.

Daily rollups retain impressions and clicks. Campaign-level unique hashes support the distinct visitor count. The dashboard labels these as operational, non-audited measurements.

## Production gates

Before public self-service is opened:

1. apply migrations `0005` and `0006` to the production D1 database;
2. create and bind the production and preview R2 logo buckets;
3. create one active Stripe product for LocalClaw homepage sponsorship;
4. configure a least-privilege production key and the webhook signing secret in Cloudflare;
5. configure the Stripe customer portal to allow cancellation at period end;
6. keep Checkout in `pilot` and allow only the owner's account;
7. complete one one-time and one recurring purchase in Stripe test mode or an isolated preview;
8. complete the owner's explicitly authorized real-money production test;
9. verify payment, reservation, public creative, visible impression, unique visitor, click redirect, CTR, portal cancellation and future-date release; and
10. only then change `SPONSOR_CHECKOUT_MODE` from `pilot` to `live`.

Until the full production proof is complete, repository implementation, deployed code, configured Stripe state and a verified customer purchase must be reported as separate states.
