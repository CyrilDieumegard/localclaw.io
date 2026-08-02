import { json } from "./auth.js";
import { parseJsonBody } from "./machines.js";

export const MAX_FAVORITES_PER_ACCOUNT = 160;
export const MAX_CATALOG_MODEL_IDS = 600;

const ALLOWED_STATUSES = new Set(["saved", "to-test", "downloaded", "installed"]);
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,119}$/i;
const MACHINE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/i;

export function validateFavorite(input, modelId) {
  const favorite = {
    machineId: cleanIdentifier(input?.machineId, MACHINE_ID_PATTERN),
    modelId: cleanIdentifier(modelId, MODEL_ID_PATTERN),
    status: cleanStatus(input?.status || "saved"),
    quantization: cleanOptionalText(input?.quantization, 32)
  };

  const errors = [];
  if (!favorite.machineId) errors.push("machineId");
  if (!favorite.modelId) errors.push("modelId");
  if (!favorite.status) errors.push("status");
  if (input?.quantization && !favorite.quantization) errors.push("quantization");

  return { ok: errors.length === 0, errors, favorite };
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

function cleanOptionalText(value, maxLength) {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value).trim().replace(/\s+/g, " ");
  return text.length <= maxLength ? text : "";
}
