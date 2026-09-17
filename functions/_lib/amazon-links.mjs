import { verifiedOffers } from './amazon-offers.mjs';
export const FAMILY_TAGS = Object.freeze({computers:'localclaw-computers-20',gpuram:'localclaw-gpuram-20',diy:'localclaw-diy-20'});
// Only offer stores enrolled in this account. Other countries use the tagged US store.
export const MARKETS = Object.freeze({
  US:['United States','www.amazon.com'], CA:['Canada','www.amazon.ca'], GB:['United Kingdom','www.amazon.co.uk'],
  DE:['Germany','www.amazon.de'], FR:['France','www.amazon.fr'], IT:['Italy','www.amazon.it'], ES:['Spain','www.amazon.es'],
  NL:['Netherlands','www.amazon.nl'], PL:['Poland','www.amazon.pl'], SE:['Sweden','www.amazon.se']
});
const own = (object,key) => Object.hasOwn(object,key);
export function normalizeAmazonQuery(value) {
  const raw = String(value || '');
  if (/[\u0000-\u001f\u007f]/.test(raw)) return '';
  const query = raw.trim().replace(/\s+/g,' ');
  return query.length >= 2 && query.length <= 140 ? query : '';
}
export function normalizeFamily(value) { return own(FAMILY_TAGS,value) ? value : 'computers'; }
export function selectMarket(value,country='') {
  if (own(MARKETS,value)) return value;
  if (own(MARKETS,country)) return country;
  return ({CH:'DE',AT:'DE',LI:'DE',LU:'FR',PT:'ES'})[country] || 'US';
}
export function findOffer(query,market,now=Date.now()) {
  // Recheck after 30 days. An old verification must never become a permanent promise.
  return verifiedOffers.find(o => o.query.toLowerCase() === normalizeAmazonQuery(query).toLowerCase() && o.market === market && now-Date.parse(o.checked+'T00:00:00Z') < 30*86400000);
}
export function amazonSearchUrl(queryValue,options={}) {
  const query=normalizeAmazonQuery(queryValue);
  if(!query)return '';
  const family=normalizeFamily(options.family);
  const target=new URL('https://www.amazon.com/s');
  target.searchParams.set('k',query);
  // Use the known working original tag during Amazon's new-ID activation window.
  const ready=(options.now ?? Date.now()) >= Date.parse('2026-09-12T07:00:00Z');
  target.searchParams.set('tag',options.country==='US'||ready ? FAMILY_TAGS[family] : 'localclaw-20');
  return target.href;
}
export function localDestination(query,market,offer,family,now=Date.now(),country="") {
  if (!own(MARKETS,market)) { market='US'; offer=null; }
  const target=new URL(`https://${MARKETS[market][1]}/${offer ? 'dp/'+offer.asin : 's'}`);
  // Amazon's own return-to-original-store links use this parameter. Without it,
  // OneLink can replace an explicitly selected exact US listing with DE search.
  target.searchParams.set('creatorsDisableRedirect','true');
  if(!offer)target.searchParams.set('k',normalizeAmazonQuery(query));
  // The account uses one store ID across its ten Global Earning countries.
  target.searchParams.set("tag", (market === "US" && country === "US") || now >= Date.parse("2026-09-12T07:00:00Z") ? FAMILY_TAGS[normalizeFamily(family)] : "localclaw-20");
  return target.href;
}
