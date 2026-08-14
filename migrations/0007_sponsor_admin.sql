PRAGMA foreign_keys = ON;

-- Every privileged sponsor mutation is recorded independently from the public
-- campaign event stream. The administrator allowlist remains a Cloudflare
-- secret and is never persisted here.
CREATE TABLE "sponsor_admin_actions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaign_id" TEXT NOT NULL REFERENCES "sponsor_campaigns" ("id") ON DELETE CASCADE,
  "admin_user_id" TEXT REFERENCES "user" ("id") ON DELETE SET NULL,
  "admin_email" TEXT NOT NULL,
  "action_type" TEXT NOT NULL CHECK (
    "action_type" IN ('stop_now', 'cancel_renewal', 'extend_week', 'extend_month')
  ),
  "from_status" TEXT,
  "to_status" TEXT,
  "previous_paid_through" INTEGER,
  "next_paid_through" INTEGER,
  "details_json" TEXT NOT NULL DEFAULT '{}',
  "created_at" TEXT NOT NULL,
  CHECK (length("admin_email") BETWEEN 3 AND 320),
  CHECK (length("details_json") BETWEEN 2 AND 4096)
);

CREATE INDEX "sponsor_admin_actions_created_idx"
  ON "sponsor_admin_actions" ("created_at" DESC);
CREATE INDEX "sponsor_admin_actions_campaign_idx"
  ON "sponsor_admin_actions" ("campaign_id", "created_at" DESC);
