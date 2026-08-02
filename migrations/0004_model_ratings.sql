CREATE TABLE "model_ratings" (
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "model_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("user_id", "model_id")
);

CREATE INDEX "model_ratings_model_idx" ON "model_ratings" ("model_id", "updated_at");
CREATE INDEX "model_ratings_user_idx" ON "model_ratings" ("user_id", "updated_at");
