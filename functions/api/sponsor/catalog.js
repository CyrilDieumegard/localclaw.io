import { getRequiredSession, json } from "../../_lib/auth.js";
import { sponsorCatalogPayload } from "../../_lib/sponsor-campaigns.js";
import {
  inventoryRangesByPlacement,
  listSponsorInventory,
  readSponsorPricing,
  sponsorCatalogCommerce
} from "../../_lib/sponsor-commerce.js";

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  try {
    const [pricing, inventory] = await Promise.all([
      readSponsorPricing(context.env.LOCALCLAW_DB),
      listSponsorInventory(context.env.LOCALCLAW_DB)
    ]);
    const commerce = sponsorCatalogCommerce(pricing, context.env, auth.session.user.email);
    return json({ ok: true, ...sponsorCatalogPayload(commerce, inventoryRangesByPlacement(inventory)) });
  } catch {
    return json({ ok: false, error: "sponsor_catalog_unavailable", message: "Sponsorship inventory is temporarily unavailable." }, 503);
  }
}
