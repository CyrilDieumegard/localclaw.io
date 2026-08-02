import { getRequiredSession, json, requireSameOrigin } from "../../_lib/auth.js";
import {
  MAX_MACHINES_PER_ACCOUNT,
  machineRowToJson,
  parseJsonBody,
  validateMachine
} from "../../_lib/machines.js";

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const result = await context.env.LOCALCLAW_DB.prepare(`
    SELECT id, name, platform, accelerator, cpu_model, gpu_model, ram_gb, vram_gb,
           use_case, priority, is_primary, source, created_at, updated_at
    FROM machines
    WHERE user_id = ?
    ORDER BY is_primary DESC, updated_at DESC
  `).bind(auth.session.user.id).all();

  return json({
    ok: true,
    machines: (result.results || []).map(machineRowToJson)
  });
}

export async function onRequestPost(context) {
  if (!requireSameOrigin(context.request)) {
    return json({ ok: false, error: "invalid_origin" }, 403);
  }

  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const parsedBody = await parseJsonBody(context.request);
  if (parsedBody.response) return parsedBody.response;

  const validation = validateMachine(parsedBody.value);
  if (!validation.ok) {
    return json({
      ok: false,
      error: "invalid_machine",
      fields: validation.errors
    }, 422);
  }

  const countRow = await context.env.LOCALCLAW_DB.prepare(
    "SELECT COUNT(*) AS count FROM machines WHERE user_id = ?"
  ).bind(auth.session.user.id).first();
  const machineCount = Number(countRow?.count || 0);

  if (machineCount >= MAX_MACHINES_PER_ACCOUNT) {
    return json({
      ok: false,
      error: "machine_limit_reached",
      message: `You can save up to ${MAX_MACHINES_PER_ACCOUNT} machines.`
    }, 409);
  }

  const machine = validation.machine;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const isPrimary = machine.isPrimary || machineCount === 0 ? 1 : 0;

  const statements = [];
  if (isPrimary === 1) {
    statements.push(
      context.env.LOCALCLAW_DB.prepare(
        "UPDATE machines SET is_primary = 0, updated_at = ? WHERE user_id = ?"
      ).bind(now, auth.session.user.id)
    );
  }

  statements.push(
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO machines (
        id, user_id, name, platform, accelerator, cpu_model, gpu_model, ram_gb,
        vram_gb, use_case, priority, is_primary, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      auth.session.user.id,
      machine.name,
      machine.platform,
      machine.accelerator,
      machine.cpuModel || null,
      machine.gpuModel || null,
      machine.ramGb,
      machine.vramGb,
      machine.useCase,
      machine.priority,
      isPrimary,
      machine.source,
      now,
      now
    )
  );

  await context.env.LOCALCLAW_DB.batch(statements);

  return json({
    ok: true,
    machine: machineRowToJson({
      id,
      name: machine.name,
      platform: machine.platform,
      accelerator: machine.accelerator,
      cpu_model: machine.cpuModel,
      gpu_model: machine.gpuModel,
      ram_gb: machine.ramGb,
      vram_gb: machine.vramGb,
      use_case: machine.useCase,
      priority: machine.priority,
      is_primary: isPrimary,
      source: machine.source,
      created_at: now,
      updated_at: now
    })
  }, 201);
}
