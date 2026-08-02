import { getRequiredSession, json, requireSameOrigin } from "../../_lib/auth.js";
import { machineRowToJson, parseJsonBody, validateMachine } from "../../_lib/machines.js";

export async function onRequestPatch(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const current = await getOwnedMachine(context, auth.session.user.id);
  if (!current) return json({ ok: false, error: "machine_not_found" }, 404);

  const parsedBody = await parseJsonBody(context.request);
  if (parsedBody.response) return parsedBody.response;

  const validation = validateMachine({
    ...machineRowToJson(current),
    ...parsedBody.value
  });
  if (!validation.ok) {
    return json({
      ok: false,
      error: "invalid_machine",
      fields: validation.errors
    }, 422);
  }

  const machine = validation.machine;
  const now = new Date().toISOString();
  const statements = [];

  if (machine.isPrimary) {
    statements.push(
      context.env.LOCALCLAW_DB.prepare(
        "UPDATE machines SET is_primary = 0, updated_at = ? WHERE user_id = ?"
      ).bind(now, auth.session.user.id)
    );
  }

  statements.push(
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE machines
      SET name = ?, platform = ?, accelerator = ?, cpu_model = ?, gpu_model = ?,
          ram_gb = ?, vram_gb = ?, use_case = ?, priority = ?, is_primary = ?,
          source = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      machine.name,
      machine.platform,
      machine.accelerator,
      machine.cpuModel || null,
      machine.gpuModel || null,
      machine.ramGb,
      machine.vramGb,
      machine.useCase,
      machine.priority,
      machine.isPrimary ? 1 : 0,
      machine.source,
      now,
      context.params.id,
      auth.session.user.id
    )
  );

  await context.env.LOCALCLAW_DB.batch(statements);

  const updated = await getOwnedMachine(context, auth.session.user.id);
  return json({ ok: true, machine: machineRowToJson(updated) });
}

export async function onRequestDelete(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const current = await getOwnedMachine(context, auth.session.user.id);
  if (!current) return json({ ok: false, error: "machine_not_found" }, 404);

  await context.env.LOCALCLAW_DB.prepare(
    "DELETE FROM machines WHERE id = ? AND user_id = ?"
  ).bind(context.params.id, auth.session.user.id).run();

  if (current.is_primary === 1) {
    const next = await context.env.LOCALCLAW_DB.prepare(`
      SELECT id FROM machines
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(auth.session.user.id).first();

    if (next?.id) {
      await context.env.LOCALCLAW_DB.prepare(
        "UPDATE machines SET is_primary = 1, updated_at = ? WHERE id = ? AND user_id = ?"
      ).bind(new Date().toISOString(), next.id, auth.session.user.id).run();
    }
  }

  return json({ ok: true });
}

async function getOwnedMachine(context, userId) {
  return context.env.LOCALCLAW_DB.prepare(`
    SELECT id, name, platform, accelerator, cpu_model, gpu_model, ram_gb, vram_gb,
           use_case, priority, is_primary, source, created_at, updated_at
    FROM machines
    WHERE id = ? AND user_id = ?
  `).bind(context.params.id, userId).first();
}
