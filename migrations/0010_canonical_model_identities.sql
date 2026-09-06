-- Consolidate the two public Mistral Small 3.2 identifiers.
-- Requires 0009_saved_plan_selection.sql. D1 applies migrations transactionally.
-- Original rows are archived before any merge, including conflicting test logs.
-- Favorite winner: most advanced installation status, then latest updated_at,
-- then canonical ID. Quantization and test measurements stay together.
-- Rating winner: latest updated_at, then canonical ID. One vote per user remains.

CREATE TABLE IF NOT EXISTS model_identity_merge_archive (
  migration_key TEXT NOT NULL,
  entity TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL DEFAULT '',
  original_model_id TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  archived_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (migration_key, entity, user_id, machine_id, original_model_id)
);

INSERT OR IGNORE INTO model_identity_merge_archive
  (migration_key, entity, user_id, machine_id, original_model_id, payload)
SELECT '0010', 'favorite', f.user_id, f.machine_id, f.model_id,
  json_object('user_id', f.user_id, 'machine_id', f.machine_id, 'model_id', f.model_id,
    'status', f.status, 'quantization', f.quantization, 'test_verdict', f.test_verdict,
    'measured_tps', f.measured_tps, 'notes', f.notes, 'last_tested_at', f.last_tested_at,
    'created_at', f.created_at, 'updated_at', f.updated_at)
FROM model_favorites f
WHERE f.model_id IN ('mistral-small3.2-24b', 'mistral-small-3.2-24b')
  AND EXISTS (SELECT 1 FROM model_favorites old
    WHERE old.user_id = f.user_id AND old.machine_id = f.machine_id
      AND old.model_id = 'mistral-small3.2-24b');

WITH records AS (
  SELECT f.*,
    ROW_NUMBER() OVER (PARTITION BY f.user_id, f.machine_id ORDER BY
      CASE f.status WHEN 'installed' THEN 3 WHEN 'downloaded' THEN 2 WHEN 'to-test' THEN 1 ELSE 0 END DESC,
      f.updated_at DESC, (f.model_id = 'mistral-small-3.2-24b') DESC) AS preference,
    COUNT(*) OVER (PARTITION BY f.user_id, f.machine_id) AS record_count,
    MIN(f.created_at) OVER (PARTITION BY f.user_id, f.machine_id) AS first_created,
    MAX(f.updated_at) OVER (PARTITION BY f.user_id, f.machine_id) AS last_updated,
    '[' || f.model_id || ' | ' || COALESCE(f.quantization, 'unspecified quant') ||
      ' | ' || f.status || ' | ' || f.test_verdict ||
      ' | ' || COALESCE(CAST(f.measured_tps AS TEXT), 'unmeasured') || ' tokens/s' ||
      ' | ' || COALESCE(f.last_tested_at, f.updated_at) || ']' || char(10) || COALESCE(f.notes, '') AS report
  FROM model_favorites f
  WHERE f.model_id IN ('mistral-small3.2-24b', 'mistral-small-3.2-24b')
    AND EXISTS (SELECT 1 FROM model_favorites old
      WHERE old.user_id = f.user_id AND old.machine_id = f.machine_id
        AND old.model_id = 'mistral-small3.2-24b')
)
INSERT INTO model_favorites
  (user_id, machine_id, model_id, status, quantization, test_verdict,
    measured_tps, notes, last_tested_at, created_at, updated_at)
SELECT r.user_id, r.machine_id, 'mistral-small-3.2-24b', r.status, r.quantization,
  r.test_verdict, r.measured_tps,
  CASE WHEN r.record_count = 1 THEN r.notes ELSE (
    SELECT group_concat(report, char(10) || char(10)) FROM (
      SELECT report FROM records other
      WHERE other.user_id = r.user_id AND other.machine_id = r.machine_id
      ORDER BY other.updated_at, other.model_id
    )
  ) END,
  r.last_tested_at, r.first_created, r.last_updated
FROM records r WHERE r.preference = 1
ON CONFLICT (user_id, machine_id, model_id) DO UPDATE SET
  status = excluded.status, quantization = excluded.quantization,
  test_verdict = excluded.test_verdict, measured_tps = excluded.measured_tps,
  notes = excluded.notes, last_tested_at = excluded.last_tested_at,
  created_at = excluded.created_at, updated_at = excluded.updated_at;

DELETE FROM model_favorites AS old
WHERE old.model_id = 'mistral-small3.2-24b'
  AND EXISTS (SELECT 1 FROM model_favorites canonical
    WHERE canonical.user_id = old.user_id AND canonical.machine_id = old.machine_id
      AND canonical.model_id = 'mistral-small-3.2-24b')
  AND EXISTS (SELECT 1 FROM model_identity_merge_archive archived
    WHERE archived.migration_key = '0010' AND archived.entity = 'favorite'
      AND archived.user_id = old.user_id AND archived.machine_id = old.machine_id
      AND archived.original_model_id = old.model_id);

INSERT OR IGNORE INTO model_identity_merge_archive
  (migration_key, entity, user_id, original_model_id, payload)
SELECT '0010', 'rating', r.user_id, r.model_id,
  json_object('user_id', r.user_id, 'model_id', r.model_id, 'rating', r.rating,
    'created_at', r.created_at, 'updated_at', r.updated_at)
FROM model_ratings r
WHERE r.model_id IN ('mistral-small3.2-24b', 'mistral-small-3.2-24b')
  AND EXISTS (SELECT 1 FROM model_ratings old
    WHERE old.user_id = r.user_id AND old.model_id = 'mistral-small3.2-24b');

WITH ranked AS (
  SELECT r.*,
    ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY r.updated_at DESC,
      (r.model_id = 'mistral-small-3.2-24b') DESC) AS preference,
    MIN(r.created_at) OVER (PARTITION BY r.user_id) AS first_created
  FROM model_ratings r
  WHERE r.model_id IN ('mistral-small3.2-24b', 'mistral-small-3.2-24b')
    AND EXISTS (SELECT 1 FROM model_ratings old
      WHERE old.user_id = r.user_id AND old.model_id = 'mistral-small3.2-24b')
)
INSERT INTO model_ratings (user_id, model_id, rating, created_at, updated_at)
SELECT user_id, 'mistral-small-3.2-24b', rating, first_created, updated_at
FROM ranked WHERE preference = 1
ON CONFLICT (user_id, model_id) DO UPDATE SET
  rating = excluded.rating, created_at = excluded.created_at, updated_at = excluded.updated_at;

DELETE FROM model_ratings AS old
WHERE old.model_id = 'mistral-small3.2-24b'
  AND EXISTS (SELECT 1 FROM model_ratings canonical
    WHERE canonical.user_id = old.user_id AND canonical.model_id = 'mistral-small-3.2-24b')
  AND EXISTS (SELECT 1 FROM model_identity_merge_archive archived
    WHERE archived.migration_key = '0010' AND archived.entity = 'rating'
      AND archived.user_id = old.user_id AND archived.original_model_id = old.model_id);

INSERT OR IGNORE INTO model_identity_merge_archive
  (migration_key, entity, user_id, original_model_id, payload)
SELECT '0010', 'catalog_state', user_id, 'mistral-small3.2-24b',
  json_object('known_model_ids', known_model_ids, 'updated_at', updated_at)
FROM user_catalog_state
WHERE json_valid(known_model_ids) AND json_type(known_model_ids) = 'array'
  AND EXISTS (SELECT 1 FROM json_each(known_model_ids) WHERE value = 'mistral-small3.2-24b');

UPDATE user_catalog_state SET known_model_ids = (
  SELECT json_group_array(canonical_id) FROM (
    SELECT CASE value WHEN 'mistral-small3.2-24b' THEN 'mistral-small-3.2-24b' ELSE value END AS canonical_id
    FROM json_each(user_catalog_state.known_model_ids)
    GROUP BY canonical_id ORDER BY MIN(key)
  )
)
WHERE json_valid(known_model_ids) AND json_type(known_model_ids) = 'array'
  AND EXISTS (SELECT 1 FROM json_each(known_model_ids) WHERE value = 'mistral-small3.2-24b');

INSERT OR IGNORE INTO model_identity_merge_archive
  (migration_key, entity, user_id, machine_id, original_model_id, payload)
SELECT '0010', 'machine_selection', user_id, id, selected_model_id,
  json_object('selected_model_id', selected_model_id, 'updated_at', updated_at)
FROM machines WHERE selected_model_id = 'mistral-small3.2-24b';

UPDATE machines SET selected_model_id = 'mistral-small-3.2-24b'
WHERE selected_model_id = 'mistral-small3.2-24b';
