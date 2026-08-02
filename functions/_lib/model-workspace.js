import { json } from "./auth.js";
import { parseJsonBody } from "./machines.js";

export const MAX_FAVORITES_PER_ACCOUNT = 160;
export const MAX_CATALOG_MODEL_IDS = 600;

const ALLOWED_STATUSES = new Set(["saved", "to-test", "downloaded", "installed"]);
const ALLOWED_TEST_VERDICTS = new Set(["untested", "works", "limited", "failed"]);
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,119}$/i;
const MACHINE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/i;

export function validateFavorite(input, modelId) {
  const payload = input && typeof input === "object" ? input : {};
  const measuredTps = cleanOptionalNumber(payload.measuredTps, 0.1, 10000);
  const provided = {
    status: hasOwn(payload, "status"),
    quantization: hasOwn(payload, "quantization"),
    testVerdict: hasOwn(payload, "testVerdict"),
    measuredTps: hasOwn(payload, "measuredTps"),
    notes: hasOwn(payload, "notes")
  };
  const favorite = {
    machineId: cleanIdentifier(payload.machineId, MACHINE_ID_PATTERN),
    modelId: cleanIdentifier(modelId, MODEL_ID_PATTERN),
    status: cleanStatus(provided.status ? payload.status : "saved"),
    quantization: cleanOptionalText(payload.quantization, 32),
    testVerdict: cleanTestVerdict(provided.testVerdict ? payload.testVerdict : "untested"),
    measuredTps: measuredTps.value,
    notes: cleanOptionalNote(payload.notes, 800)
  };

  const errors = [];
  if (!favorite.machineId) errors.push("machineId");
  if (!favorite.modelId) errors.push("modelId");
  if (!favorite.status) errors.push("status");
  if (provided.quantization && String(payload.quantization ?? "").trim() && !favorite.quantization) errors.push("quantization");
  if (!favorite.testVerdict) errors.push("testVerdict");
  if (provided.measuredTps && !measuredTps.valid) errors.push("measuredTps");
  if (provided.notes && String(payload.notes ?? "").replace(/\r\n?/g, "\n").trim().length > 800) errors.push("notes");

  return { ok: errors.length === 0, errors, favorite, provided };
}

export function validateCatalogState(input) {
  if (!Array.isArray(input?.knownModelIds)) {
    return { ok: false, errors: ["knownModelIds"], modelIds: [] };
  }

  const modelIds = [...new Set(input.knownModelIds.map((value) => cleanIdentifier(value, MODEL_ID_PATTERN)).filter(Boolean))];
  const invalidCount = input.knownModelIds.length - modelIds.length;

  if (invalidCount > 0 || modelIds.length > MAX_CATALOG_MODEL_IDS) {
    return { ok: false, errors: ["knownModelIds"], modelIds: [] };
  }

  return { ok: true, errors: [], modelIds };
}

export function favoriteRowToJson(row) {
  return {
    machineId: row.machine_id,
    modelId: row.model_id,
    status: row.status,
    quantization: row.quantization || "",
    testVerdict: row.test_verdict || "untested",
    measuredTps: row.measured_tps === null || row.measured_tps === undefined ? null : Number(row.measured_tps),
    notes: row.notes || "",
    lastTestedAt: row.last_tested_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getOwnedMachine(context, userId, machineId) {
  return context.env.LOCALCLAW_DB.prepare(
    "SELECT id FROM machines WHERE id = ? AND user_id = ?"
  ).bind(machineId, userId).first();
}

export async function parseWorkspaceJsonBody(request) {
  return parseJsonBody(request);
}

export function invalidWorkspacePayload(fields) {
  return json({ ok: false, error: "invalid_workspace_payload", fields }, 422);
}

function cleanIdentifier(value, pattern) {
  const text = String(value || "").trim();
  return pattern.test(text) ? text : "";
}

function cleanStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : "";
}

function cleanTestVerdict(value) {
  const verdict = String(value || "").trim().toLowerCase();
  return ALLOWED_TEST_VERDICTS.has(verdict) ? verdict : "";
}

function cleanOptionalText(value, maxLength) {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value).trim().replace(/\s+/g, " ");
  return text.length <= maxLength ? text : "";
}

function cleanOptionalNote(value, maxLength) {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value).replace(/\r\n?/g, "\n").trim();
  return text.length <= maxLength ? text : "";
}

function cleanOptionalNumber(value, minimum, maximum) {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: null };
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    return { valid: false, value: null };
  }

  return { valid: true, value: Math.round(number * 100) / 100 };
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
