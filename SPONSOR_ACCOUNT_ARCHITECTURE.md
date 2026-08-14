# LocalClaw Sponsor Account Architecture

Status: the authenticated campaign-management scaffold is implemented. Sponsorship billing, inventory reservation, creative upload, public serving, tracking and activation are deliberately disabled.

## Product boundary

LocalClaw uses the existing Google-authenticated account. The private `/account` workspace has two independent areas:

- **Machines** for hardware profiles, saved models, test logs and ratings.
- **Sponsorship** for campaign drafts, review requests, the six bounded homepage rail placements and future analytics.

Sponsorship never changes model catalogue order, LocalClaw catalogue scores, community ratings or editorial recommendations. The six placements are the existing desktop placeholders:

```text
home-left-1   home-right-1
home-left-2   home-right-2
home-left-3   home-right-3
```

They remain `not_for_sale` and are not rendered from campaign data in this phase.

## Current owner journey

1. A signed-in user opens **Account → Sponsorship**.
2. The owner can create and edit a private campaign draft.
3. A draft stores the advertiser, HTTPS destination, factual short message, CTA, preferred placement and requested dates.
4. A complete draft can be submitted for editorial review.
5. The campaign then becomes read-only to the owner until a future review action requests changes.
6. The owner can cancel a draft, submitted campaign or approved campaign that has not entered billing.

Submission does not reserve inventory, quote a price, charge a card or publish creative.

## Data model

Migration `0005_sponsor_workspace.sql` adds:

- `sponsor_campaigns` — owner-scoped campaign, review, schedule and billing state;
- `sponsor_campaign_creatives` — future moderated logo asset metadata;
- `sponsor_daily_metrics` — empty rollups reserved for genuine served events; and
- `sponsor_campaign_events` — campaign audit history.

All owner reads and mutations are authenticated and owner-scoped. Mutations enforce same-origin requests. Campaigns start as `draft` with `billing_status = not_configured`.

The database prevents a campaign from entering `scheduled` or `active` unless a future trusted server integration has first recorded `billing_status = paid`. The public owner API never writes billing state, so activation is impossible in the current release.

## Stripe-ready, without Stripe

Stripe is the planned billing provider, but this phase includes none of the following:

- Stripe packages or browser SDK;
- API keys, environment variables or secrets;
- Customer, Checkout Session or Payment Intent creation;
- webhook handlers or event signatures;
- pricing, currency or amount claims;
- checkout buttons or payment links; or
- any client-controlled activation state.

The later Stripe phase must introduce a separate trusted billing boundary. A browser redirect or client response must never mark a campaign paid. Only a verified, idempotent server-side webhook may advance billing, and campaign activation must remain a distinct operator-controlled transition.

## Deferred phases

Before commercial activation:

1. approve placement rules, pricing, duration, sponsor terms, refund/support policy and prohibited categories;
2. add admin review actions with an audit trail;
3. configure moderated creative storage and safe image delivery;
4. integrate Stripe Checkout and verified idempotent webhooks server-side;
5. implement inventory holds that prevent overlapping sold schedules;
6. serve only approved and paid campaign data in the six labelled slots;
7. record visibility-qualified impressions and redirect-tracked clicks with privacy review;
8. validate preview, migrations, Functions, account authorization and production fail-closed behavior; and
9. explicitly authorize commercial activation.

Until those gates are complete, the accurate product state is: **campaign workspace available, billing offline, zero campaigns live**.
