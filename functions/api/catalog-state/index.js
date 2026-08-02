import { getRequiredSession, json, requireSameOrigin } from "../../_lib/auth.js";
import {
  invalidWorkspacePayload,
  parseWorkspaceJsonBody,
  validateCatalogState
} from "../../_lib/model-workspace.js";

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const row = await context.env.LOCALCLAW_DB.prepare(`
    SELECT known_model_ids, updated_at
    FROM user_catalog_state
    WHERE user_id = ?
  `).bind(auth.session.user.id).first();

  return json({
    ok: true,
    initialized: Boolean(row),
    knownModelIds: parseKnownModelIds(row?.known_model_ids),
    updatedAt: row?.updated_at || null
  });
}

export async function onRequestPut(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const parsedBody = await parseWorkspaceJsonBody(context.request);
  if (parsedBody.response) return parsedBody.response;

  const validation = validateCatalogState(parsedBody.value);
  if (!validation.ok) return invalidWorkspacePayload(validation.errors);

  const now = new Date().toISOString();
  await context.env.LOCALCLAW_DB.prepare(`
    INSERT INTO user_catalog_state (user_id, known_model_ids, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT (user_id) DO UPDATE SET
      known_model_ids = excluded.known_model_ids,
      updated_at = excluded.updated_at
  `).bind(auth.session.user.id, JSON.stringify(validation.modelIds), now).run();

  return json({ ok: true, knownModelIds: validation.modelIds, updatedAt: now });
}

function parseKnownModelIds(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}
