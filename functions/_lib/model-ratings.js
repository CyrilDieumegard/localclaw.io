import { json } from "./auth.js";

const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,159}$/i;
export const MAX_RATINGS_PER_ACCOUNT = 300;

export function validateModelId(value) {
  const modelId = String(value || "").trim();
  return MODEL_ID_PATTERN.test(modelId) ? modelId : null;
}

export async function parseRatingBody(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 1024) {
    return { response: json({ ok: false, error: "payload_too_large" }, 413), rating: null };
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return { response: json({ ok: false, error: "invalid_json" }, 400), rating: null };
  }

  const rating = Number(payload?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      response: json({
        ok: false,
        error: "invalid_rating",
        message: "Rating must be an integer from 1 to 5."
      }, 400),
      rating: null
    };
  }

  return { response: null, rating };
}

export async function getModelAggregate(database, modelId) {
  const row = await database.prepare(`
    SELECT ROUND(AVG(rating), 2) AS average, COUNT(*) AS count
    FROM model_ratings
    WHERE model_id = ?
  `).bind(modelId).first();

  return {
    modelId,
    average: Number(row?.average || 0),
    count: Number(row?.count || 0)
  };
}

export function ratingRowToJson(row) {
  return {
    modelId: row.model_id,
    rating: Number(row.rating),
    updatedAt: row.updated_at
  };
}
