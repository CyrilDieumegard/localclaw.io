import Stripe from "stripe";

export const STRIPE_API_VERSION = "2026-06-24.dahlia";

let cachedClient = null;
let cachedKey = null;

export function stripeClient(env) {
  const key = String(env?.STRIPE_SECRET_KEY || "").trim();
  if (!/^(?:rk|sk)_(?:test|live)_[A-Za-z0-9]+$/.test(key)) {
    throw new Error("stripe_secret_missing");
  }
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedKey = key;
  cachedClient = new Stripe(key, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
    timeout: 12_000
  });
  return cachedClient;
}

export function sponsorStripeProductId(env) {
  const id = String(env?.STRIPE_SPONSOR_PRODUCT_ID || "").trim();
  if (!/^prod_[A-Za-z0-9]+$/.test(id)) throw new Error("stripe_sponsor_product_missing");
  return id;
}

export function sponsorCheckoutAccess(env, email) {
  const mode = String(env?.SPONSOR_CHECKOUT_MODE || "off").trim().toLowerCase();
  if (mode === "live") return { enabled: true, mode };
  if (mode !== "pilot") return { enabled: false, mode: "off" };
  const allowed = String(env?.SPONSOR_PILOT_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return { enabled: allowed.includes(String(email || "").trim().toLowerCase()), mode };
}

export function expectedStripeLivemode(env) {
  return String(env?.STRIPE_EXPECTED_LIVEMODE || "true").trim().toLowerCase() !== "false";
}

export function stripeWebhookSecret(env) {
  const secret = String(env?.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!/^whsec_[A-Za-z0-9]+$/.test(secret)) throw new Error("stripe_webhook_secret_missing");
  return secret;
}

export function stripeCryptoProvider() {
  return Stripe.createSubtleCryptoProvider();
}

export function integrationIdentifier() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  return `localclaw-sponsor-${suffix}`;
}
