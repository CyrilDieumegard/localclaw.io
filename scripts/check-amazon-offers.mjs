import {verifiedOffers} from '../functions/_lib/amazon-offers.mjs';
import {findOffer} from '../functions/_lib/amazon-links.mjs';
const now=Date.now();
const fresh=verifiedOffers.filter(offer=>findOffer(offer.query,offer.market,now)===offer && offer.condition==='New');
const disabled=verifiedOffers.filter(offer=>offer.disabled);
const stale=verifiedOffers.filter(offer=>!offer.disabled && !fresh.includes(offer));
console.log(`Amazon offers: ${fresh.length} fresh exact configurations, ${disabled.length} disabled, ${stale.length} historical configurations using search fallback.`);
if (!fresh.length) {
  console.error('No exact offer is current. Recheck selected memory/storage, seller, condition and delivery on the original marketplace before updating checked dates.');
  process.exitCode=1;
} else {
  const next=new Date(Math.min(...fresh.map(offer=>Date.parse(offer.checked+'T00:00:00Z')+30*86400000))).toISOString().slice(0,10);
  console.log(`Next exact-offer expiry: ${next}. Run npm run amazon:offers before refreshing links.`);
}
