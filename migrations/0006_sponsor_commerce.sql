PRAGMA foreign_keys = ON;

-- Stripe-backed commercial state. Prices are snapshotted on each campaign so
-- future pricing changes never alter an already purchased booking.
ALTER TABLE "sponsor_campaigns" ADD COLUMN "plan_key" TEXT
  CHECK ("plan_key" IS NULL OR "plan_key" IN ('week', 'month'));
ALTER TABLE "sponsor_campaigns" ADD COLUMN "starts_at" INTEGER
  CHECK ("starts_at" IS NULL OR "starts_at" > 0);
ALTER TABLE "sponsor_campaigns" ADD COLUMN "ends_at" INTEGER
  CHECK ("ends_at" IS NULL OR "ends_at" > 0);
ALTER TABLE "sponsor_campaigns" ADD COLUMN "paid_through" INTEGER
  CHECK ("paid_through" IS NULL OR "paid_through" > 0);
ALTER TABLE "sponsor_campaigns" ADD COLUMN "auto_renew" INTEGER NOT NULL DEFAULT 0
  CHECK ("auto_renew" IN (0, 1));
ALTER TABLE "sponsor_campaigns" ADD COLUMN "price_cents" INTEGER
  CHECK ("price_cents" IS NULL OR "price_cents" BETWEEN 100 AND 1000000);
ALTER TABLE "sponsor_campaigns" ADD COLUMN "currency" TEXT
  CHECK ("currency" IS NULL OR "currency" = 'usd');
ALTER TABLE "sponsor_campaigns" ADD COLUMN "terms_version" TEXT
  CHECK ("terms_version" IS NULL OR length("terms_version") BETWEEN 8 AND 40);
ALTER TABLE "sponsor_campaigns" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "sponsor_campaigns" ADD COLUMN "stripe_checkout_session_id" TEXT;
ALTER TABLE "sponsor_campaigns" ADD COLUMN "stripe_subscription_id" TEXT;
ALTER TABLE "sponsor_campaigns" ADD COLUMN "stripe_subscription_status" TEXT;
ALTER TABLE "sponsor_campaigns" ADD COLUMN "stripe_cancel_at_period_end" INTEGER NOT NULL DEFAULT 0
  CHECK ("stripe_cancel_at_period_end" IN (0, 1));
ALTER TABLE "sponsor_campaigns" ADD COLUMN "checkout_expires_at" INTEGER
  CHECK ("checkout_expires_at" IS NULL OR "checkout_expires_at" > 0);
ALTER TABLE "sponsor_campaigns" ADD COLUMN "billing_updated_at" TEXT;

CREATE UNIQUE INDEX "sponsor_campaigns_checkout_session_idx"
  ON "sponsor_campaigns" ("stripe_checkout_session_id")
  WHERE "stripe_checkout_session_id" IS NOT NULL;
CREATE UNIQUE INDEX "sponsor_campaigns_subscription_idx"
  ON "sponsor_campaigns" ("stripe_subscription_id")
  WHERE "stripe_subscription_id" IS NOT NULL;
CREATE INDEX "sponsor_campaigns_serving_idx"
  ON "sponsor_campaigns" ("placement_key", "billing_status", "starts_at", "paid_through");

ALTER TABLE "sponsor_campaign_creatives" ADD COLUMN "logo_media_type" TEXT
  CHECK ("logo_media_type" IS NULL OR "logo_media_type" IN ('image/png', 'image/webp'));
ALTER TABLE "sponsor_campaign_creatives" ADD COLUMN "logo_size_bytes" INTEGER
  CHECK ("logo_size_bytes" IS NULL OR "logo_size_bytes" BETWEEN 1 AND 524288);
ALTER TABLE "sponsor_campaign_creatives" ADD COLUMN "logo_width" INTEGER
  CHECK ("logo_width" IS NULL OR "logo_width" BETWEEN 64 AND 1024);
ALTER TABLE "sponsor_campaign_creatives" ADD COLUMN "logo_height" INTEGER
  CHECK ("logo_height" IS NULL OR "logo_height" BETWEEN 64 AND 1024);
ALTER TABLE "sponsor_campaign_creatives" ADD COLUMN "logo_sha256" TEXT
  CHECK (
    "logo_sha256" IS NULL OR
    (length("logo_sha256") = 64 AND "logo_sha256" NOT GLOB '*[^0-9a-f]*')
  );
ALTER TABLE "sponsor_campaign_creatives" ADD COLUMN "logo_uploaded_at" TEXT;

CREATE UNIQUE INDEX "sponsor_campaign_creatives_asset_idx"
  ON "sponsor_campaign_creatives" ("logo_asset_key")
  WHERE "logo_asset_key" IS NOT NULL;

CREATE TABLE "sponsor_pricing_settings" (
  "singleton" INTEGER NOT NULL PRIMARY KEY CHECK ("singleton" = 1),
  "weekly_price_cents" INTEGER NOT NULL CHECK ("weekly_price_cents" BETWEEN 100 AND 1000000),
  "monthly_price_cents" INTEGER NOT NULL CHECK ("monthly_price_cents" BETWEEN 100 AND 1000000),
  "currency" TEXT NOT NULL DEFAULT 'usd' CHECK ("currency" = 'usd'),
  "max_schedule_days" INTEGER NOT NULL DEFAULT 365 CHECK ("max_schedule_days" BETWEEN 1 AND 730),
  "checkout_hold_minutes" INTEGER NOT NULL DEFAULT 35 CHECK ("checkout_hold_minutes" BETWEEN 30 AND 60),
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" >= 1),
  "updated_at" TEXT NOT NULL
);

INSERT INTO "sponsor_pricing_settings" (
  "singleton", "weekly_price_cents", "monthly_price_cents", "currency", "updated_at"
) VALUES (1, 2900, 9900, 'usd', datetime('now'));

CREATE TABLE "sponsor_inventory_reservations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaign_id" TEXT NOT NULL UNIQUE REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "placement_key" TEXT NOT NULL CHECK (
    "placement_key" IN (
      'home-left-1', 'home-left-2', 'home-left-3',
      'home-right-1', 'home-right-2', 'home-right-3'
    )
  ),
  "starts_at" INTEGER NOT NULL CHECK ("starts_at" > 0),
  "ends_at" INTEGER NOT NULL CHECK ("ends_at" > "starts_at"),
  "blocks_until" INTEGER NOT NULL CHECK ("blocks_until" >= "ends_at"),
  "status" TEXT NOT NULL CHECK ("status" IN ('held', 'sold', 'released', 'expired')),
  "auto_renew" INTEGER NOT NULL DEFAULT 0 CHECK ("auto_renew" IN (0, 1)),
  "hold_expires_at" INTEGER,
  "stripe_checkout_session_id" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CHECK (
    ("status" = 'held' AND "hold_expires_at" IS NOT NULL) OR
    ("status" <> 'held')
  )
);

CREATE INDEX "sponsor_inventory_schedule_idx"
  ON "sponsor_inventory_reservations" ("placement_key", "status", "starts_at", "blocks_until");
CREATE UNIQUE INDEX "sponsor_inventory_checkout_idx"
  ON "sponsor_inventory_reservations" ("stripe_checkout_session_id")
  WHERE "stripe_checkout_session_id" IS NOT NULL;

CREATE TRIGGER "sponsor_inventory_overlap_insert_guard"
BEFORE INSERT ON "sponsor_inventory_reservations"
FOR EACH ROW
WHEN NEW."status" IN ('held', 'sold') AND EXISTS (
  SELECT 1
  FROM "sponsor_inventory_reservations" AS existing
  WHERE existing."placement_key" = NEW."placement_key"
    AND (
      (existing."status" = 'held' AND existing."hold_expires_at" > CAST(strftime('%s', 'now') AS INTEGER)) OR
      (existing."status" = 'sold' AND existing."blocks_until" > CAST(strftime('%s', 'now') AS INTEGER))
    )
    AND existing."starts_at" < NEW."blocks_until"
    AND existing."blocks_until" > NEW."starts_at"
)
BEGIN
  SELECT RAISE(ABORT, 'sponsor_booking_unavailable');
END;

CREATE TRIGGER "sponsor_inventory_overlap_update_guard"
BEFORE UPDATE OF "placement_key", "starts_at", "ends_at", "blocks_until", "status", "hold_expires_at"
ON "sponsor_inventory_reservations"
FOR EACH ROW
WHEN NEW."status" IN ('held', 'sold') AND EXISTS (
  SELECT 1
  FROM "sponsor_inventory_reservations" AS existing
  WHERE existing."id" <> NEW."id"
    AND existing."placement_key" = NEW."placement_key"
    AND (
      (existing."status" = 'held' AND existing."hold_expires_at" > CAST(strftime('%s', 'now') AS INTEGER)) OR
      (existing."status" = 'sold' AND existing."blocks_until" > CAST(strftime('%s', 'now') AS INTEGER))
    )
    AND existing."starts_at" < NEW."blocks_until"
    AND existing."blocks_until" > NEW."starts_at"
)
BEGIN
  SELECT RAISE(ABORT, 'sponsor_booking_unavailable');
END;

CREATE TRIGGER "sponsor_inventory_campaign_match_guard"
BEFORE INSERT ON "sponsor_inventory_reservations"
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM "sponsor_campaigns" AS campaign
  WHERE campaign."id" = NEW."campaign_id"
    AND campaign."user_id" = NEW."user_id"
    AND campaign."placement_key" = NEW."placement_key"
)
BEGIN
  SELECT RAISE(ABORT, 'sponsor_booking_campaign_mismatch');
END;

CREATE TABLE "sponsor_stripe_events" (
  "event_id" TEXT NOT NULL PRIMARY KEY,
  "event_type" TEXT NOT NULL,
  "livemode" INTEGER NOT NULL CHECK ("livemode" IN (0, 1)),
  "object_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'processing' CHECK ("status" IN ('processing', 'processed', 'failed')),
  "received_at" TEXT NOT NULL,
  "processed_at" TEXT,
  "error_code" TEXT
);

CREATE INDEX "sponsor_stripe_events_status_idx"
  ON "sponsor_stripe_events" ("status", "received_at");

CREATE TABLE "sponsor_metric_events" (
  "event_hash" TEXT NOT NULL PRIMARY KEY,
  "campaign_id" TEXT NOT NULL REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "placement_key" TEXT NOT NULL,
  "event_type" TEXT NOT NULL CHECK ("event_type" IN ('impression', 'click')),
  "metric_date" TEXT NOT NULL,
  "visitor_hash" TEXT NOT NULL,
  "dedupe_bucket" INTEGER NOT NULL,
  "occurred_at" INTEGER NOT NULL,
  CHECK (length("event_hash") = 64),
  CHECK (length("visitor_hash") = 64),
  CHECK (length("metric_date") = 10),
  UNIQUE ("campaign_id", "event_type", "visitor_hash", "dedupe_bucket")
);

CREATE INDEX "sponsor_metric_events_expiry_idx"
  ON "sponsor_metric_events" ("occurred_at" ASC);

CREATE TABLE "sponsor_daily_metric_uniques" (
  "campaign_id" TEXT NOT NULL REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "metric_date" TEXT NOT NULL,
  "event_type" TEXT NOT NULL CHECK ("event_type" IN ('impression', 'click')),
  "visitor_hash" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("campaign_id", "metric_date", "event_type", "visitor_hash")
);

CREATE TABLE "sponsor_campaign_metric_uniques" (
  "campaign_id" TEXT NOT NULL REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "event_type" TEXT NOT NULL CHECK ("event_type" IN ('impression', 'click')),
  "visitor_hash" TEXT NOT NULL,
  "first_seen_at" INTEGER NOT NULL,
  PRIMARY KEY ("campaign_id", "event_type", "visitor_hash")
);

CREATE TRIGGER "sponsor_metric_event_rollup"
AFTER INSERT ON "sponsor_metric_events"
FOR EACH ROW
BEGIN
  INSERT INTO "sponsor_daily_metrics" (
    "campaign_id", "metric_date", "impressions", "clicks",
    "unique_impressions", "unique_clicks", "updated_at"
  ) VALUES (
    NEW."campaign_id", NEW."metric_date",
    CASE WHEN NEW."event_type" = 'impression' THEN 1 ELSE 0 END,
    CASE WHEN NEW."event_type" = 'click' THEN 1 ELSE 0 END,
    0, 0, datetime('now')
  )
  ON CONFLICT("campaign_id", "metric_date") DO UPDATE SET
    "impressions" = "sponsor_daily_metrics"."impressions" + excluded."impressions",
    "clicks" = "sponsor_daily_metrics"."clicks" + excluded."clicks",
    "updated_at" = datetime('now');

  INSERT OR IGNORE INTO "sponsor_daily_metric_uniques" (
    "campaign_id", "metric_date", "event_type", "visitor_hash", "created_at"
  ) VALUES (
    NEW."campaign_id", NEW."metric_date", NEW."event_type", NEW."visitor_hash", NEW."occurred_at"
  );

  INSERT OR IGNORE INTO "sponsor_campaign_metric_uniques" (
    "campaign_id", "event_type", "visitor_hash", "first_seen_at"
  ) VALUES (
    NEW."campaign_id", NEW."event_type", NEW."visitor_hash", NEW."occurred_at"
  );
END;

CREATE TRIGGER "sponsor_metric_unique_rollup"
AFTER INSERT ON "sponsor_daily_metric_uniques"
FOR EACH ROW
BEGIN
  UPDATE "sponsor_daily_metrics"
  SET "unique_impressions" = "unique_impressions" + CASE WHEN NEW."event_type" = 'impression' THEN 1 ELSE 0 END,
      "unique_clicks" = "unique_clicks" + CASE WHEN NEW."event_type" = 'click' THEN 1 ELSE 0 END,
      "updated_at" = datetime('now')
  WHERE "campaign_id" = NEW."campaign_id" AND "metric_date" = NEW."metric_date";
END;
