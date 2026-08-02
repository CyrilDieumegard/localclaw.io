CREATE TABLE "model_favorites" (
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "machine_id" TEXT NOT NULL REFERENCES "machines" ("id") ON DELETE CASCADE,
  "model_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'saved' CHECK ("status" IN ('saved', 'to-test', 'downloaded', 'installed')),
  "quantization" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("user_id", "machine_id", "model_id")
);

CREATE INDEX "model_favorites_user_idx" ON "model_favorites" ("user_id", "updated_at");
CREATE INDEX "model_favorites_machine_idx" ON "model_favorites" ("machine_id", "updated_at");

CREATE TABLE "user_catalog_state" (
  "user_id" TEXT NOT NULL PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  "known_model_ids" TEXT NOT NULL DEFAULT '[]',
  "updated_at" TEXT NOT NULL
);
