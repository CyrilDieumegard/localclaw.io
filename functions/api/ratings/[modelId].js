import { getRequiredSession, json, requireSameOrigin } from "../../_lib/auth.js";
import {
  getModelAggregate,
  MAX_RATINGS_PER_ACCOUNT,
  parseRatingBody,
  validateModelId
} from "../../_lib/model-ratings.js";

export async function onRequestPut(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const modelId = validateModelId(context.params.modelId);
  if (!modelId) return json({ ok: false, error: "invalid_model_id" }, 400);

  const parsed = await parseRatingBody(context.request);
  if (parsed.response) return parsed.response;

  const existing = await context.env.LOCALCLAW_DB.prepare(`
    SELECT 1 AS present
    FROM model_ratings
    WHERE user_id = ? AND model_id = ?
  `).bind(auth.session.user.id, modelId).first();

  if (!existing) {
    const countRow = await context.env.LOCALCLAW_DB.prepare(`
      SELECT COUNT(*) AS count
      FROM model_ratings
      WHERE user_id = ?
    `).bind(auth.session.user.id).first();

    if (Number(countRow?.count || 0) >= MAX_RATINGS_PER_ACCOUNT) {
      return json({
        ok: false,
        error: "rating_limit_reached",
        message: `You can rate up to ${MAX_RATINGS_PER_ACCOUNT} models.`
      }, 409);
    }
  }

  const now = new Date().toISOString();
  await context.env.LOCALCLAW_DB.prepare(`
    INSERT INTO model_ratings (user_id, model_id, rating, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (user_id, model_id) DO UPDATE SET
      rating = excluded.rating,
      updated_at = excluded.updated_at
  `).bind(auth.session.user.id, modelId, parsed.rating, now, now).run();

  return json({
    ok: true,
    rating: { modelId, rating: parsed.rating, updatedAt: now },
    aggregate: await getModelAggregate(context.env.LOCALCLAW_DB, modelId)
  });
}

export async function onRequestDelete(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const modelId = validateModelId(context.params.modelId);
  if (!modelId) return json({ ok: false, error: "invalid_model_id" }, 400);

  const result = await context.env.LOCALCLAW_DB.prepare(`
    DELETE FROM model_ratings
    WHERE user_id = ? AND model_id = ?
  `).bind(auth.session.user.id, modelId).run();

  if (!result.meta?.changes) {
    return json({ ok: false, error: "rating_not_found" }, 404);
  }

  return json({
    ok: true,
    aggregate: await getModelAggregate(context.env.LOCALCLAW_DB, modelId)
  });
}
