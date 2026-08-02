import { createAuth, json } from "../../_lib/auth.js";

export async function onRequest(context) {
  try {
    const auth = createAuth(context.env, context.request);
    return auth.handler(context.request);
  } catch (error) {
    console.error("LocalClaw auth configuration error", error);
    return json({
      ok: false,
      error: "account_unavailable",
      message: "Accounts are not configured yet."
    }, 503);
  }
}
