ALTER TABLE "model_favorites"
ADD COLUMN "test_verdict" TEXT NOT NULL DEFAULT 'untested'
CHECK ("test_verdict" IN ('untested', 'works', 'limited', 'failed'));

ALTER TABLE "model_favorites"
ADD COLUMN "measured_tps" REAL
CHECK ("measured_tps" IS NULL OR ("measured_tps" >= 0.1 AND "measured_tps" <= 10000));

ALTER TABLE "model_favorites"
ADD COLUMN "notes" TEXT;

ALTER TABLE "model_favorites"
ADD COLUMN "last_tested_at" TEXT;
