import { getRequiredSession, json, requireSameOrigin } from "../../_lib/auth.js";
import {
  MAX_FAVORITES_PER_ACCOUNT,
  favoriteRowToJson,
  getOwnedMachine,
  invalidWorkspacePayload,
  parseWorkspaceJsonBody,
  validateFavorite
} from "../../_lib/model-workspace.js";

export async function onRequestPut(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const parsedBody = await parseWorkspaceJsonBody(context.request);
  if (parsedBody.response) return parsedBody.response;

  const validation = validateFavorite(parsedBody.value, context.params.modelId);
  if (!validation.ok) return invalidWorkspacePayload(validation.errors);

  const favorite = validation.favorite;
  const machine = await getOwnedMachine(context, auth.session.user.id, favorite.machineId);
  if (!machine) return json({ ok: false, error: "machine_not_found" }, 404);

  const existing = await context.env.LOCALCLAW_DB.prepare(`
    SELECT model_id, status, quantization, test_verdict, measured_tps, notes, last_tested_at
    FROM model_favorites
    WHERE user_id = ? AND machine_id = ? AND model_id = ?
  `).bind(auth.session.user.id, favorite.machineId, favorite.modelId).first();

  if (!existing) {
    const countRow = await context.env.LOCALCLAW_DB.prepare(
      "SELECT COUNT(*) AS count FROM model_favorites WHERE user_id = ?"
    ).bind(auth.session.user.id).first();

    if (Number(countRow?.count || 0) >= MAX_FAVORITES_PER_ACCOUNT) {
      return json({
        ok: false,
        error: "favorite_limit_reached",
        message: `You can save up to ${MAX_FAVORITES_PER_ACCOUNT} machine-model pairs.`
      }, 409);
    }
  }

  const now = new Date().toISOString();
  const resolved = {
    status: validation.provided.status ? favorite.status : existing?.status || favorite.status,
    quantization: validation.provided.quantization ? favorite.quantization : existing?.quantization || favorite.quantization,
    testVerdict: validation.provided.testVerdict ? favorite.testVerdict : existing?.test_verdict || favorite.testVerdict,
    measuredTps: validation.provided.measuredTps ? favorite.measuredTps : existing?.measured_tps ?? null,
    notes: validation.provided.notes ? favorite.notes : existing?.notes || "",
    lastTestedAt: validation.provided.testVerdict || validation.provided.measuredTps || validation.provided.notes
      ? now
      : existing?.last_tested_at || null
  };

  await context.env.LOCALCLAW_DB.prepare(`
    INSERT INTO model_favorites (
      user_id, machine_id, model_id, status, quantization,
      test_verdict, measured_tps, notes, last_tested_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (user_id, machine_id, model_id) DO UPDATE SET
      status = excluded.status,
      quantization = excluded.quantization,
      test_verdict = excluded.test_verdict,
      measured_tps = excluded.measured_tps,
      notes = excluded.notes,
      last_tested_at = excluded.last_tested_at,
      updated_at = excluded.updated_at
  `).bind(
    auth.session.user.id,
    favorite.machineId,
    favorite.modelId,
    resolved.status,
    resolved.quantization || null,
    resolved.testVerdict,
    resolved.measuredTps,
    resolved.notes || null,
    resolved.lastTestedAt,
    now,
    now
  ).run();

  const row = await context.env.LOCALCLAW_DB.prepare(`
    SELECT machine_id, model_id, status, quantization,
           test_verdict, measured_tps, notes, last_tested_at,
           created_at, updated_at
    FROM model_favorites
    WHERE user_id = ? AND machine_id = ? AND model_id = ?
  `).bind(auth.session.user.id, favorite.machineId, favorite.modelId).first();

  return json({ ok: true, favorite: favoriteRowToJson(row) });
}

export async function onRequestDelete(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const url = new URL(context.request.url);
  const validation = validateFavorite({ machineId: url.searchParams.get("machineId") }, context.params.modelId);
  if (!validation.ok) return invalidWorkspacePayload(validation.errors);

  const favorite = validation.favorite;
  const result = await context.env.LOCALCLAW_DB.prepare(`
    DELETE FROM model_favorites
    WHERE user_id = ? AND machine_id = ? AND model_id = ?
  `).bind(auth.session.user.id, favorite.machineId, favorite.modelId).run();

  if (!result.meta?.changes) {
    return json({ ok: false, error: "favorite_not_found" }, 404);
  }

  return json({ ok: true });
}
