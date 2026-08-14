export const SPONSOR_LOGO_MAX_BYTES = 512 * 1024;
export const SPONSOR_LOGO_MIN_DIMENSION = 64;
export const SPONSOR_LOGO_MAX_DIMENSION = 1024;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function requireSponsorLogoBucket(env) {
  const bucket = env?.SPONSOR_LOGOS;
  if (!bucket || typeof bucket.get !== "function" || typeof bucket.put !== "function" || typeof bucket.delete !== "function") {
    throw new Error("sponsor_logo_storage_unavailable");
  }
  return bucket;
}

export async function readSponsorLogoBody(request) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > SPONSOR_LOGO_MAX_BYTES) {
    throw new SponsorLogoError(413, "sponsor_logo_too_large", "Sponsor logos must be 512 KB or smaller.");
  }
  if (!request.body) throw new SponsorLogoError(400, "sponsor_logo_missing", "Choose a PNG or WebP logo to upload.");

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new SponsorLogoError(400, "sponsor_logo_invalid", "The uploaded logo could not be read.");
      total += value.byteLength;
      if (total > SPONSOR_LOGO_MAX_BYTES) {
        await reader.cancel("sponsor logo too large");
        throw new SponsorLogoError(413, "sponsor_logo_too_large", "Sponsor logos must be 512 KB or smaller.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!total) throw new SponsorLogoError(400, "sponsor_logo_missing", "Choose a PNG or WebP logo to upload.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function validateSponsorLogo(bytes, declaredMediaType = "") {
  if (!(bytes instanceof Uint8Array) || !bytes.byteLength || bytes.byteLength > SPONSOR_LOGO_MAX_BYTES) {
    throw new SponsorLogoError(400, "sponsor_logo_invalid", "The uploaded logo is invalid.");
  }
  const detected = detectImage(bytes);
  const declared = String(declaredMediaType || "").split(";", 1)[0].trim().toLowerCase();
  if (!detected || declared !== detected.mediaType) {
    throw new SponsorLogoError(415, "sponsor_logo_type_invalid", "Sponsor logos must be genuine PNG or WebP files.");
  }
  if (
    detected.width < SPONSOR_LOGO_MIN_DIMENSION || detected.height < SPONSOR_LOGO_MIN_DIMENSION ||
    detected.width > SPONSOR_LOGO_MAX_DIMENSION || detected.height > SPONSOR_LOGO_MAX_DIMENSION
  ) {
    throw new SponsorLogoError(400, "sponsor_logo_dimensions_invalid", "Sponsor logos must be between 64×64 and 1024×1024 pixels.");
  }
  const ratio = detected.width / detected.height;
  if (ratio < 0.75 || ratio > 1.3334) {
    throw new SponsorLogoError(400, "sponsor_logo_aspect_invalid", "Use a square or near-square sponsor logo.");
  }
  return { ...detected, sizeBytes: bytes.byteLength, sha256: await sha256Hex(bytes) };
}

export function sponsorLogoObjectKey(campaignId, logo) {
  const id = String(campaignId || "");
  if (!isCampaignId(id) || !/^[0-9a-f]{64}$/.test(String(logo?.sha256 || ""))) {
    throw new TypeError("A valid campaign and logo digest are required.");
  }
  return `sponsor-logos/${id}/${logo.sha256.slice(0, 32)}.${logo.extension}`;
}

export class SponsorLogoError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function isCampaignId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function detectImage(bytes) {
  return detectPng(bytes) || detectWebp(bytes);
}

function detectPng(bytes) {
  if (bytes.byteLength < 57 || !PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return null;
  if (readU32Be(bytes, 8) !== 13 || ascii(bytes, 12, 4) !== "IHDR") return null;
  const width = readU32Be(bytes, 16);
  const height = readU32Be(bytes, 20);
  if (!width || !height || !validPngChunks(bytes)) return null;
  return { mediaType: "image/png", extension: "png", width, height };
}

function validPngChunks(bytes) {
  let offset = 8;
  let first = true;
  let hasImageData = false;
  while (offset + 12 <= bytes.byteLength) {
    const length = readU32Be(bytes, offset);
    const typeOffset = offset + 4;
    const dataOffset = offset + 8;
    const crcOffset = dataOffset + length;
    const nextOffset = crcOffset + 4;
    if (length > SPONSOR_LOGO_MAX_BYTES || nextOffset > bytes.byteLength) return false;
    const type = ascii(bytes, typeOffset, 4);
    if (!/^[A-Za-z]{4}$/.test(type)) return false;
    if (first && (type !== "IHDR" || length !== 13)) return false;
    if (type === "IDAT") hasImageData = true;
    if (readU32Be(bytes, crcOffset) !== crc32(bytes.subarray(typeOffset, crcOffset))) return false;
    if (type === "IEND") return length === 0 && hasImageData && nextOffset === bytes.byteLength;
    first = false;
    offset = nextOffset;
  }
  return false;
}

function detectWebp(bytes) {
  if (bytes.byteLength < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return null;
  if (readU32Le(bytes, 4) + 8 !== bytes.byteLength) return null;
  const chunk = ascii(bytes, 12, 4);
  const chunkSize = readU32Le(bytes, 16);
  if (20 + chunkSize > bytes.byteLength) return null;
  if (chunk === "VP8X") {
    return { mediaType: "image/webp", extension: "webp", width: 1 + readU24Le(bytes, 24), height: 1 + readU24Le(bytes, 27) };
  }
  if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { mediaType: "image/webp", extension: "webp", width: readU16Le(bytes, 26) & 0x3fff, height: readU16Le(bytes, 28) & 0x3fff };
  }
  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    const bits = readU32Le(bytes, 21);
    return { mediaType: "image/webp", extension: "webp", width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  return null;
}

async function sha256Hex(value) {
  const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function ascii(bytes, offset, length) { return String.fromCharCode(...bytes.subarray(offset, offset + length)); }
function readU16Le(bytes, offset) { return bytes[offset] | (bytes[offset + 1] << 8); }
function readU24Le(bytes, offset) { return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16); }
function readU32Le(bytes, offset) { return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0; }
function readU32Be(bytes, offset) { return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0; }
