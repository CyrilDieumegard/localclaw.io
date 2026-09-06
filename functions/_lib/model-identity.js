// Keep retired public identifiers usable by old links and cached clients.
// The catalogue exposes the same mapping as APP_DATA.modelAliases.
export const MODEL_ALIASES = Object.freeze({
  "mistral-small3.2-24b": "mistral-small-3.2-24b"
});

export function canonicalModelId(value) {
  const id = String(value || "").trim();
  return Object.prototype.hasOwnProperty.call(MODEL_ALIASES, id) ? MODEL_ALIASES[id] : id;
}
