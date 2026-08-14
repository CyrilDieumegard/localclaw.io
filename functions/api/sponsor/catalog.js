import { getRequiredSession, json } from "../../_lib/auth.js";
import { sponsorCatalogPayload } from "../../_lib/sponsor-campaigns.js";

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  return json({ ok: true, ...sponsorCatalogPayload() });
}
