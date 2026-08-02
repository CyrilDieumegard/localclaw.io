CREATE TABLE "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL,
  "image" TEXT,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);

CREATE TABLE "session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" DATE NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" DATE,
  "refreshTokenExpiresAt" DATE,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);

CREATE TABLE "verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" DATE NOT NULL,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);

CREATE INDEX "session_userId_idx" ON "session" ("userId");
CREATE INDEX "account_userId_idx" ON "account" ("userId");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE "machines" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "platform" TEXT NOT NULL CHECK ("platform" IN ('macos', 'windows', 'linux')),
  "accelerator" TEXT NOT NULL CHECK ("accelerator" IN ('apple-silicon', 'nvidia', 'amd', 'cpu')),
  "cpu_model" TEXT,
  "gpu_model" TEXT,
  "ram_gb" INTEGER NOT NULL CHECK ("ram_gb" BETWEEN 4 AND 2048),
  "vram_gb" INTEGER CHECK ("vram_gb" BETWEEN 0 AND 256),
  "use_case" TEXT NOT NULL DEFAULT 'general' CHECK ("use_case" IN ('general', 'chat', 'coding', 'reasoning', 'vision', 'creative')),
  "priority" TEXT NOT NULL DEFAULT 'balanced' CHECK ("priority" IN ('balanced', 'quality', 'speed', 'memory')),
  "is_primary" INTEGER NOT NULL DEFAULT 0 CHECK ("is_primary" IN (0, 1)),
  "source" TEXT NOT NULL DEFAULT 'manual' CHECK ("source" IN ('manual', 'finder')),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX "machines_user_id_idx" ON "machines" ("user_id");
CREATE INDEX "machines_user_primary_idx" ON "machines" ("user_id", "is_primary");
