-- Only an authenticated, verified account can opt in. Existing users remain off.
CREATE TABLE model_alert_subscriptions (
  machine_id TEXT PRIMARY KEY REFERENCES machines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  consent_version TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  known_model_ids TEXT NOT NULL,
  last_sent_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX model_alert_subscriptions_enabled ON model_alert_subscriptions(enabled, user_id);
CREATE TABLE model_alert_deliveries (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  consent_at TEXT NOT NULL,
  model_ids TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  provider_id TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX model_alert_deliveries_pending ON model_alert_deliveries(status, next_attempt_at);
