import { json } from "./auth.js";

export const MAX_MACHINES_PER_ACCOUNT = 12;

const ALLOWED_PLATFORMS = new Set(["macos", "windows", "linux"]);
const ALLOWED_ACCELERATORS = new Set(["apple-silicon", "nvidia", "amd", "cpu"]);
const ALLOWED_USE_CASES = new Set(["general", "chat", "coding", "reasoning", "vision", "creative"]);
const ALLOWED_PRIORITIES = new Set(["balanced", "quality", "speed", "memory"]);

export function validateMachine(input) {
  const machine = {
    name: cleanText(input?.name, 60),
    platform: cleanEnum(input?.platform, ALLOWED_PLATFORMS),
    accelerator: cleanEnum(input?.accelerator, ALLOWED_ACCELERATORS),
    cpuModel: cleanOptionalText(input?.cpuModel, 80),
    gpuModel: cleanOptionalText(input?.gpuModel, 80),
    ramGb: cleanInteger(input?.ramGb, 4, 2048),
    vramGb: cleanOptionalInteger(input?.vramGb, 0, 256),
    useCase: cleanEnum(input?.useCase || "general", ALLOWED_USE_CASES),
    priority: cleanEnum(input?.priority || "balanced", ALLOWED_PRIORITIES),
    isPrimary: input?.isPrimary === true,
    source: input?.source === "finder" ? "finder" : "manual"
  };

  const errors = [];

  if (!machine.name) errors.push("name");
  if (!machine.platform) errors.push("platform");
  if (!machine.accelerator) errors.push("accelerator");
  if (machine.ramGb === null) errors.push("ramGb");
  if (!machine.useCase) errors.push("useCase");
  if (!machine.priority) errors.push("priority");

  if (machine.accelerator === "apple-silicon") {
    machine.vramGb = null;
  } else if (machine.accelerator === "nvidia" && machine.vramGb === null) {
    errors.push("vramGb");
  }

  return {
    ok: errors.length === 0,
    errors,
    machine
  };
}

export function machineRowToJson(row) {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    accelerator: row.accelerator,
    cpuModel: row.cpu_model || "",
    gpuModel: row.gpu_model || "",
    ramGb: row.ram_gb,
    vramGb: row.vram_gb,
    useCase: row.use_case,
    priority: row.priority,
    isPrimary: row.is_primary === 1,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function parseJsonBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  const contentLength = Number.parseInt(request.headers.get("Content-Length") || "0", 10);

  if (!contentType.toLowerCase().includes("application/json")) {
    return { response: json({ ok: false, error: "json_required" }, 415), value: null };
  }

  if (Number.isFinite(contentLength) && contentLength > 8192) {
    return { response: json({ ok: false, error: "payload_too_large" }, 413), value: null };
  }

  try {
    return { response: null, value: await request.json() };
  } catch {
    return { response: json({ ok: false, error: "invalid_json" }, 400), value: null };
  }
}

function cleanText(value, maxLength) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text && text.length <= maxLength ? text : "";
}

function cleanOptionalText(value, maxLength) {
  if (value === undefined || value === null || value === "") return "";
  return cleanText(value, maxLength);
}

function cleanEnum(value, allowedValues) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowedValues.has(normalized) ? normalized : "";
}

function cleanInteger(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) return null;
  return number;
}

function cleanOptionalInteger(value, minimum, maximum) {
  if (value === undefined || value === null || value === "") return null;
  return cleanInteger(value, minimum, maximum);
}
