import { getRequiredSession, json } from "../../_lib/auth.js";
import { ratingRowToJson } from "../../_lib/model-ratings.js";

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const result = await context.env.LOCALCLAW_DB.prepare(`
    SELECT model_id, rating, updated_at
    FROM model_ratings
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).bind(auth.session.user.id).all();

  return json({
    ok: true,
    ratings: (result.results || []).map(ratingRowToJson)
  });
}
