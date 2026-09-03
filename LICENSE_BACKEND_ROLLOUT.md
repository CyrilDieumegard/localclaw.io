# LocalClaw licence backend rollout

Status: implemented on 2026-09-01; Stripe account routing corrected and locally retested on 2026-09-03. This file is an operational handoff, not proof of a production deployment.

## What changes, and what remains untouched

The app-licence flow is isolated under `/api/license/*`. It does **not** replace or reuse the existing sponsor webhook, sponsor product, sponsor Payment Link, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET`.

The active purchase source must belong to the dedicated Stripe account `acct_1SzfBZAXaNRwBAW1` (`LocalClaw`):

- Stripe product: `prod_U1LRtFz1PdO0Ix`
- one-time USD price: `price_1T3IkfAXaNRwBAW1XeiKJ1zA` (`4900` cents)
- Payment Link: `plink_1T3ImGAXaNRwBAW19ocAoU9I`
- Payment URL: `https://buy.stripe.com/cNi6oG71m8ns1X51Js1oI04`
- dedicated webhook endpoint: `we_1UBfGwAXaNRwBAW1vGcVuGbj`
- webhook URL: `https://localclaw.io/api/license/stripe-webhook`
- webhook events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`

The previous ProfileAudit-account IDs remain second in the server allowlists only to preserve already-completed purchases during migration. No public LocalClaw page may link to that checkout. Already-issued keys remain valid. Do not delete the legacy route, change the sponsor secrets, or revoke existing app caches during this rollout.

## Endpoints

### `POST /api/license/stripe-webhook`

This endpoint verifies the raw request with `LOCALCLAW_STRIPE_WEBHOOK_SECRET`. During a Stripe account migration it can also accept `LOCALCLAW_STRIPE_WEBHOOK_SECRET_SECONDARY`, so an already-paid customer is never invalidated while new checkouts move accounts. It accepts a paid licence only when all of the following match:

- live/test mode equals `STRIPE_EXPECTED_LIVEMODE`;
- Checkout mode is `payment` and status is `complete`;
- Payment Link is in `LICENSE_STRIPE_PAYMENT_LINK_IDS`;
- total is exactly `LICENSE_STRIPE_AMOUNT_CENTS` (`4900`);
- currency is `LICENSE_STRIPE_CURRENCY` (`usd`);
- Stripe supplies a valid checkout email;
- `payment_status` is `paid`.

A signed `checkout.session.completed` event with `payment_status=unpaid` is stored as pending and returns HTTP 200. It cannot authorize a claim. The later signed `checkout.session.async_payment_succeeded` event stores the paid session. Unsupported events and other Payment Links return HTTP 200 ignored so Stripe does not retry unrelated purchases.

### `POST /api/license/claim`

Request:

```json
{"sessionId":"cs_live_..."}
```

The endpoint never queries or depends on the historical Stripe API key. It only accepts a session previously stored by the dedicated signature-verified webhook. A webhook/redirect race returns HTTP 202 with `pending: true` and `Retry-After: 2`.

Success is idempotent by Checkout Session ID:

```json
{
  "ok": true,
  "mode": "secure",
  "licenseKey": "LOCALCLAW-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
  "emailMasked": "b***@example.com",
  "license": {
    "id": "uuid",
    "status": "active",
    "entitlement": "lifetime",
    "machineLimit": 3
  },
  "message": "License ready"
}
```

The 120-bit key is deterministically derived from the Checkout Session by a server-only HMAC secret. The browser contains no salt or key derivation logic. D1 stores only SHA-256 identity hashes, not the raw licence key or raw email.

### `POST /api/license/v2/activate`

Request:

```json
{
  "email": "buyer@example.com",
  "licenseKey": "LOCALCLAW-...",
  "machineId": "stable-device-id",
  "appVersion": "1.0.202",
  "currentReceipt": "optional-current-jws"
}
```

Secure success returns the same compact JWS in `token` (compatibility alias) and `receipt`:

```json
{
  "ok": true,
  "mode": "secure",
  "token": "header.payload.signature",
  "receipt": "header.payload.signature",
  "receiptFormat": "JWS-Compact",
  "expiresAt": "ISO-8601",
  "license": {
    "id": "uuid",
    "status": "active",
    "entitlement": "lifetime",
    "machineLimit": 3
  },
  "message": "Activated"
}
```

Machine slots are pre-created and claimed with a conditional D1 update. Concurrent requests cannot exceed the three-machine limit. Reusing the same machine refreshes its receipt without consuming another slot.

### `GET /api/license/keys`

Returns current and retiring public Ed25519 keys. This is useful for diagnostics and rotation, but the app's embedded keyring remains the trust root; it must never trust an arbitrary key fetched at runtime.

## Compact JWS contract

Header, in issuer insertion order:

```json
{"alg":"EdDSA","typ":"localclaw-license+jwt","kid":"localclaw-license-2026-09-01"}
```

Payload, in issuer insertion order:

```text
iss, aud, schema, jti, sub, iat, nbf, exp,
license_id, license_version, product, entitlement,
entitlement_expires_at, status, source, machine_hash,
email_hash, key_hash, app_version, min_app_version
```

Normative values:

- `iss`: `https://localclaw.io`
- `aud`: `io.localclaw.installer`
- `schema`: `lc-license-receipt/v1`
- `product`: `localclaw`
- `entitlement`: `lifetime`
- `entitlement_expires_at`: `null`
- `status`: `active`
- `source`: `stripe` or `legacy_migration`
- `nbf`: `iat - 60`
- `exp`: `iat + 15552000` seconds (180 days)
- `app_version`: informational issuance audit only
- `min_app_version`: normative; compare against the running app version

Serialization is UTF-8 JSON without whitespace, then unpadded base64url. The signature is the raw 64-byte Ed25519 signature over the two exact encoded segments. A verifier must verify those original segments and then validate claims; it must not reserialize JSON before verification.

Hash claims use unpadded base64url SHA-256 of `domain + NUL + normalized value`:

- email domain `localclaw:email:v1`, trim + NFC + lowercase;
- key domain `localclaw:key:v1`, trim + uppercase ASCII;
- machine domain `localclaw:machine:v1`, trim + NFC.

Production trust root:

- kid: `localclaw-license-2026-09-01`
- public `x`: `4gCEftrjJWeD6O8323OchqxmrzXoZvkJDFMFyuDd-3A`

The private JWK must never be added to source, logs, artifacts, test fixtures, or app resources.

## Secrets and non-secret configuration

Cloudflare secrets:

- `LOCALCLAW_STRIPE_WEBHOOK_SECRET` — dedicated app-purchase webhook secret, already provisioned; do not replace the sponsor webhook secret.
- `LOCALCLAW_STRIPE_WEBHOOK_SECRET_SECONDARY` — optional second app-purchase webhook secret used only for a zero-downtime Stripe account migration.
- `LICENSE_SIGNING_PRIVATE_JWK` — current Ed25519 private JWK.
- `LICENSE_KEY_DERIVATION_SECRET` — independent random HMAC secret, at least 32 bytes.

Non-secret vars are declared in `wrangler.toml`, including the active kid, exact Payment Link/price/product IDs, amount/currency, machine limit and receipt TTL.

`scripts/provision-license-signing-key.mjs` is sync-only by default. It stores the signing JWK and independent derivation secret in macOS Keychain, provisions both Cloudflare secrets over stdin, and prints public key material only. If either local item is missing, it fails closed and requires recovery from backup; it never rotates production keys implicitly. First-time `--bootstrap-new-keyset` is accepted only when both local items are absent and Cloudflare proves that neither licence secret exists. The production `kid` is also pinned to the public key embedded by the app.

## Legacy compatibility and rollback

`LICENSE_ACTIVATION_MODE` has three values:

- `parallel`: reserved compatibility label. Only secure D1 licences activate; no legacy material is upgraded automatically.
- `enforce`: production mode. Only secure D1 licences activate.
- `legacy`: emergency rollback label. With signing configured, only D1 licences receive signed JWS receipts.

An unsigned Base64 response exists only when all three conditions are explicit: mode is `legacy`, `LICENSE_ALLOW_UNSIGNED_ROLLBACK=true`, and no signer is configured. It responds with `mode=legacy_rollback`, `receipt=null`, and `receiptFormat=legacy-base64`. Never enable this during the normal signed rollout.

The old app's already-active local cache is not deleted or rewritten. An old cache cannot be remotely revoked; new signed receipts limit revocation exposure to their 180-day refresh window.

The historical plaintext licence appeared in public Git history and is
permanently compromised. Support recovery must never import that email/key
hash pair into D1. After purchase proof, issue a new confidential
`LOCALCLAW-*` key and entitlement instead.

## Safe rollout order

1. Export the remote D1 database or confirm Time Travel recovery before mutation.
2. Apply `migrations/0008_license_activation.sql` remotely.
3. Confirm the three Cloudflare secrets exist without printing them.
4. Confirm the app build embeds the exact production kid and public `x` above and rejects every fixture key.
5. Deploy the Pages Functions and the isolated `license-success.html`; keep the historical `success.html` unchanged, then confirm the dedicated webhook returns 200 for a signed fixture and D1 records it.
6. Make a Stripe test-mode purchase against a test Payment Link/secret and prove: pending event cannot claim, paid event can claim once, refresh returns the same key, three machines pass, fourth returns 409.
7. Keep `LICENSE_ACTIVATION_MODE=enforce`. Existing same-Mac legacy caches remain grandfathered locally. Recovery on another Mac requires purchase proof and a newly issued confidential `LOCALCLAW-*` key; never import the compromised legacy hashes.
8. Add the new Payment URL to a new-purchase CTA only after the webhook and claim path are production-proven. Do not delete or rewrite the legacy Payment Link.

Rollback: set mode to `legacy` only if required. Preserve D1 and secrets. Do not delete licences, machine slots, Stripe events, old Payment Links, or app caches.

## Revocation and key rotation

Revoke a licence atomically by changing status, setting `revoked_at`/reason, and incrementing `license_version`. The D1 trigger rejects revocation without a version increment and rejects reverting a revoked row to active.

Signing-key rotation is deliberately split into preparation and provisioning so
generating the next signer can never overwrite the active Cloudflare secret or
the stable licence-key derivation secret.

1. Choose a new unique `kid` and prepare its signing key locally:

   ```bash
   LICENSE_SIGNING_KID=localclaw-license-YYYY-MM-DD-next \
     node scripts/provision-license-signing-key.mjs --prepare-signing-rotation
   ```

   This mode requires the existing derivation secret in Keychain, reuses it
   unchanged, stores only the new signing key, performs no Cloudflare call and
   prints public material only. Repeating it for the same `kid` returns the same
   public `x`.
2. Add the current public JWK to `LICENSE_VERIFYING_PUBLIC_JWKS` with status
   `retiring`, add the prepared JWK to the app keyring, then ship and verify an
   app build that trusts both old and new public keys.
3. Provision only the prepared signing secret, copying the exact public `x`
   printed in step 1 as an explicit proof:

   ```bash
   LICENSE_SIGNING_KID=localclaw-license-YYYY-MM-DD-next \
   LICENSE_EXPECTED_SIGNING_PUBLIC_X=copy-the-prepared-x-exactly \
     node scripts/provision-license-signing-key.mjs --provision-prepared-rotation
   ```

   Missing, malformed or mismatched proof fails before Wrangler is called. The
   derivation secret is neither regenerated nor provisioned during rotation.
4. Deploy `LICENSE_SIGNING_KID` with the new `kid` only after the dual-key app is
   available. Cloudflare Pages secret changes apply to subsequent deployments;
   verify that the first new receipt carries the new `kid` and validates against
   the prepared `x`.
5. Retain the old public key until every receipt it signed has expired.

## Local verification

```bash
npm run license:test
node --check functions/_lib/license.js
node --check functions/api/license/activate.js
node --check functions/api/license/v2/activate.js
node --check functions/api/license/claim.js
node --check functions/api/license/keys.js
node --check functions/api/license/stripe-webhook.js
node --check scripts/provision-license-signing-key.mjs
swiftc -module-cache-path /private/tmp/localclaw-swift-module-cache -typecheck scripts/keychain-secret-bridge.swift
```

The Node test suite covers the JWS contract, strict rejection of all public-history legacy material in v2, historical-route compatibility, HMAC key derivation, Stripe signature verification, async-payment pending behavior, claim race response, explicit rollback gate, D1 migration idempotence, revocation guard, route isolation and removal of browser-side key derivation.
