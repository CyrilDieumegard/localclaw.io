PRAGMA foreign_keys = ON;

-- Sponsor management is intentionally payment-provider agnostic in this phase.
-- Billing can only be advanced by a future trusted server integration; the
-- owner-facing API created with this migration never writes billing_status.
CREATE TABLE "sponsor_campaigns" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "campaign_name" TEXT NOT NULL,
  "advertiser_name" TEXT NOT NULL,
  "destination_url" TEXT NOT NULL,
  "tagline" TEXT NOT NULL,
  "cta_label" TEXT NOT NULL DEFAULT 'Learn more',
  "placement_key" TEXT NOT NULL CHECK (
    "placement_key" IN (
      'home-left-1', 'home-left-2', 'home-left-3',
      'home-right-1', 'home-right-2', 'home-right-3'
    )
  ),
  "requested_start_date" TEXT,
  "requested_end_date" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft' CHECK (
    "status" IN (
      'draft', 'submitted', 'changes_requested', 'approved_pending_billing',
      'cancelled', 'scheduled', 'active', 'completed'
    )
  ),
  "review_note" TEXT,
  "billing_status" TEXT NOT NULL DEFAULT 'not_configured' CHECK (
    "billing_status" IN ('not_configured', 'pending', 'paid', 'failed', 'refunded')
  ),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  "submitted_at" TEXT,
  "approved_at" TEXT,
  "activated_at" TEXT,
  "completed_at" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" >= 1),
  CHECK (length("campaign_name") BETWEEN 2 AND 80),
  CHECK (length("advertiser_name") BETWEEN 2 AND 80),
  CHECK (length("destination_url") BETWEEN 8 AND 500),
  CHECK (length("tagline") BETWEEN 8 AND 140),
  CHECK (length("cta_label") BETWEEN 2 AND 28),
  CHECK (
    "requested_start_date" IS NULL OR "requested_end_date" IS NULL
    OR "requested_end_date" > "requested_start_date"
  )
);

CREATE INDEX "sponsor_campaigns_owner_idx"
  ON "sponsor_campaigns" ("user_id", "updated_at" DESC);
CREATE INDEX "sponsor_campaigns_placement_idx"
  ON "sponsor_campaigns" ("placement_key", "status", "requested_start_date", "requested_end_date");

CREATE TABLE "sponsor_campaign_creatives" (
  "campaign_id" TEXT NOT NULL PRIMARY KEY REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "logo_asset_key" TEXT,
  "logo_alt_text" TEXT,
  "creative_status" TEXT NOT NULL DEFAULT 'missing' CHECK (
    "creative_status" IN ('missing', 'draft', 'ready_for_review', 'approved', 'rejected')
  ),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CHECK ("logo_alt_text" IS NULL OR length("logo_alt_text") BETWEEN 2 AND 120)
);

CREATE TABLE "sponsor_daily_metrics" (
  "campaign_id" TEXT NOT NULL REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "metric_date" TEXT NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0 CHECK ("impressions" >= 0),
  "clicks" INTEGER NOT NULL DEFAULT 0 CHECK ("clicks" >= 0),
  "unique_impressions" INTEGER NOT NULL DEFAULT 0 CHECK ("unique_impressions" >= 0),
  "unique_clicks" INTEGER NOT NULL DEFAULT 0 CHECK ("unique_clicks" >= 0),
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("campaign_id", "metric_date"),
  CHECK (length("metric_date") = 10)
);

CREATE INDEX "sponsor_daily_metrics_date_idx"
  ON "sponsor_daily_metrics" ("metric_date" DESC, "campaign_id");

CREATE TABLE "sponsor_campaign_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaign_id" TEXT NOT NULL REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "user_id" TEXT REFERENCES "user" ("id") ON DELETE SET NULL,
  "event_type" TEXT NOT NULL,
  "from_status" TEXT,
  "to_status" TEXT,
  "details_json" TEXT NOT NULL DEFAULT '{}',
  "created_at" TEXT NOT NULL,
  CHECK (length("event_type") BETWEEN 3 AND 60),
  CHECK (length("details_json") BETWEEN 2 AND 4096)
);

CREATE INDEX "sponsor_campaign_events_campaign_idx"
  ON "sponsor_campaign_events" ("campaign_id", "created_at" ASC);

CREATE TRIGGER "sponsor_campaign_insert_draft_guard"
BEFORE INSERT ON "sponsor_campaigns"
FOR EACH ROW
WHEN NEW."status" <> 'draft' OR NEW."billing_status" <> 'not_configured'
BEGIN
  SELECT RAISE(ABORT, 'sponsor_campaign_must_start_as_draft');
END;

-- No campaign can be scheduled or served before a trusted future billing
-- integration has recorded payment. This keeps the current scaffold fail-closed.
CREATE TRIGGER "sponsor_campaign_activation_guard"
BEFORE UPDATE OF "status" ON "sponsor_campaigns"
FOR EACH ROW
WHEN NEW."status" IN ('scheduled', 'active') AND NEW."billing_status" <> 'paid'
BEGIN
  SELECT RAISE(ABORT, 'sponsor_campaign_billing_not_confirmed');
END;
