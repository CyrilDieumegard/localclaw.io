PRAGMA foreign_keys = ON;

-- LocalClaw paid-app licences. Only hashes are persisted for the email,
-- licence key, and machine identifier. Stripe object IDs are retained for
-- purchase reconciliation and revocation support.
CREATE TABLE IF NOT EXISTS "license_entitlements" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key_hash" TEXT NOT NULL UNIQUE,
  "email_hash" TEXT NOT NULL,
  "stripe_checkout_session_id" TEXT UNIQUE,
  "stripe_payment_intent_id" TEXT,
  "stripe_customer_id" TEXT,
  "stripe_payment_link_id" TEXT,
  "stripe_price_id" TEXT,
  "stripe_product_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active'
    CHECK ("status" IN ('active', 'revoked')),
  "entitlement" TEXT NOT NULL DEFAULT 'lifetime'
    CHECK ("entitlement" = 'lifetime'),
  "source" TEXT NOT NULL
    CHECK ("source" = 'stripe'),
  "machine_limit" INTEGER NOT NULL DEFAULT 3
    CHECK ("machine_limit" BETWEEN 1 AND 10),
  "license_version" INTEGER NOT NULL DEFAULT 1
    CHECK ("license_version" >= 1),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  "migrated_at" TEXT,
  "revoked_at" TEXT,
  "revocation_reason" TEXT,
  CHECK (
    ("status" = 'active' AND "revoked_at" IS NULL) OR
    ("status" = 'revoked' AND "revoked_at" IS NOT NULL)
  ),
  CHECK ("revocation_reason" IS NULL OR length("revocation_reason") BETWEEN 3 AND 240)
);

CREATE INDEX IF NOT EXISTS "license_entitlements_email_idx"
  ON "license_entitlements" ("email_hash", "status");
CREATE INDEX IF NOT EXISTS "license_entitlements_status_idx"
  ON "license_entitlements" ("status", "updated_at");

-- Slots are created up-front with each licence. Claiming an empty slot uses a
-- conditional UPDATE, so concurrent activations cannot exceed machine_limit.
CREATE TABLE IF NOT EXISTS "license_machine_slots" (
  "license_id" TEXT NOT NULL REFERENCES "license_entitlements" ("id") ON DELETE CASCADE,
  "slot_index" INTEGER NOT NULL CHECK ("slot_index" BETWEEN 1 AND 10),
  "machine_hash" TEXT,
  "first_activated_at" TEXT,
  "last_activated_at" TEXT,
  "last_app_version" TEXT,
  PRIMARY KEY ("license_id", "slot_index"),
  UNIQUE ("license_id", "machine_hash"),
  CHECK (
    ("machine_hash" IS NULL AND "first_activated_at" IS NULL AND "last_activated_at" IS NULL) OR
    ("machine_hash" IS NOT NULL AND "first_activated_at" IS NOT NULL AND "last_activated_at" IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS "license_machine_slots_machine_idx"
  ON "license_machine_slots" ("machine_hash")
  WHERE "machine_hash" IS NOT NULL;

-- Security-relevant state transitions only. Raw email, licence key, machine
-- identifiers, Stripe secrets, and signing material must never be logged here.
CREATE TABLE IF NOT EXISTS "license_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "license_id" TEXT REFERENCES "license_entitlements" ("id") ON DELETE SET NULL,
  "event_type" TEXT NOT NULL CHECK (length("event_type") BETWEEN 3 AND 60),
  "outcome" TEXT NOT NULL CHECK ("outcome" IN ('accepted', 'rejected', 'error')),
  "email_hash" TEXT,
  "key_hash" TEXT,
  "machine_hash" TEXT,
  "request_id" TEXT,
  "details_json" TEXT NOT NULL DEFAULT '{}'
    CHECK (length("details_json") BETWEEN 2 AND 4096),
  "created_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "license_events_license_idx"
  ON "license_events" ("license_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "license_events_type_idx"
  ON "license_events" ("event_type", "created_at" DESC);

-- Dedicated Stripe webhook inbox for LocalClaw app purchases. It is isolated
-- from the existing sponsor webhook and its Stripe account/secrets.
CREATE TABLE IF NOT EXISTS "license_stripe_events" (
  "event_id" TEXT NOT NULL PRIMARY KEY,
  "event_type" TEXT NOT NULL,
  "session_id" TEXT,
  "livemode" INTEGER NOT NULL CHECK ("livemode" IN (0, 1)),
  "status" TEXT NOT NULL CHECK ("status" IN ('processed', 'pending', 'ignored')),
  "received_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "license_stripe_events_session_idx"
  ON "license_stripe_events" ("session_id", "received_at" DESC);

-- A claim is authorized exclusively by a paid session captured through the
-- dedicated, signature-verified webhook. The raw buyer email is not retained.
CREATE TABLE IF NOT EXISTS "license_paid_sessions" (
  "session_id" TEXT NOT NULL PRIMARY KEY,
  "stripe_event_id" TEXT NOT NULL REFERENCES "license_stripe_events" ("event_id") ON DELETE RESTRICT,
  "livemode" INTEGER NOT NULL CHECK ("livemode" IN (0, 1)),
  "payment_link_id" TEXT NOT NULL,
  "payment_intent_id" TEXT,
  "customer_id" TEXT,
  "email_hash" TEXT NOT NULL,
  "email_masked" TEXT NOT NULL,
  "amount_total" INTEGER NOT NULL CHECK ("amount_total" > 0),
  "currency" TEXT NOT NULL CHECK (length("currency") = 3),
  "status" TEXT NOT NULL DEFAULT 'paid' CHECK ("status" IN ('paid', 'revoked')),
  "paid_at" TEXT NOT NULL,
  "claimed_license_id" TEXT REFERENCES "license_entitlements" ("id") ON DELETE SET NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "license_paid_sessions_claim_idx"
  ON "license_paid_sessions" ("status", "claimed_license_id", "created_at");

-- Revocation is monotonic and always invalidates outstanding receipts on their
-- next online refresh by incrementing license_version.
CREATE TRIGGER IF NOT EXISTS "license_revocation_version_guard"
BEFORE UPDATE OF "status", "license_version" ON "license_entitlements"
FOR EACH ROW
WHEN NEW."license_version" < OLD."license_version"
  OR (OLD."status" = 'revoked' AND NEW."status" <> 'revoked')
  OR (
    OLD."status" = 'active' AND NEW."status" = 'revoked'
    AND NEW."license_version" <= OLD."license_version"
  )
BEGIN
  SELECT RAISE(ABORT, 'license_revocation_not_reversible');
END;
