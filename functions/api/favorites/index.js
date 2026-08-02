import { getRequiredSession, json } from "../../_lib/auth.js";
import { favoriteRowToJson } from "../../_lib/model-workspace.js";

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const result = await context.env.LOCALCLAW_DB.prepare(`
    SELECT machine_id, model_id, status, quantization,
           test_verdict, measured_tps, notes, last_tested_at,
           created_at, updated_at
    FROM model_favorites
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).bind(auth.session.user.id).all();

  return json({
    ok: true,
    favorites: (result.results || []).map(favoriteRowToJson)
  });
}
