import { MARKETS, FAMILY_TAGS, STORE_COOKIE, normalizeAmazonQuery, normalizeFamily, resolveAmazon, shoppingContext } from '../_lib/amazon-links.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bounded = value => String(value || '').replace(/[^a-zA-Z0-9 _.-]/g,'').slice(0,80);
const baseHeaders = () => ({'Cache-Control':'no-store, max-age=0','Cloudflare-CDN-Cache-Control':'no-store','Referrer-Policy':'strict-origin-when-cross-origin','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive'});
const previewRequest = request => request.cf?.botManagement?.verifiedBot === true
  || /prefetch|prerender/i.test((request.headers.get('Sec-Purpose') || '') + ' ' + (request.headers.get('Purpose') || ''))
  || /bot\b|crawler|spider|facebookexternalhit|linkpreview|slackbot|discordbot|telegrambot|whatsapp/i.test(request.headers.get('User-Agent') || '');

export function onRequestHead() {
  return new Response(null, {status:204, headers:baseHeaders()});
}

export async function onRequestGet({request}) {
  const url = new URL(request.url), headers = baseHeaders();
  const context = shoppingContext(request);
  if (url.searchParams.get('context') === '1') {
    return Response.json(context, {headers});
  }
  const q = normalizeAmazonQuery(url.searchParams.get('q'));
  if (!q) return new Response('A valid product search is required.', {status:400, headers});
  // Link previews and speculative loading are requests, not shopping intent.
  if (previewRequest(request)) return new Response(null, {status:204, headers});
  const family = normalizeFamily(url.searchParams.get('family'));
  const resolved = resolveAmazon(q, {family, country:context.country, market:context.preference});
  if (url.searchParams.get('reset') === '1') {
    headers['Set-Cookie'] = `${STORE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
  } else if (url.searchParams.get('remember') === '1' && Object.hasOwn(MARKETS, url.searchParams.get('market'))) {
    headers['Set-Cookie'] = `${STORE_COOKIE}=${url.searchParams.get('market')}; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax`;
  }
  if (url.searchParams.get('options') !== '1') {
    console.info(JSON.stringify({event:'amazon_redirect',family,market:resolved.market,match:resolved.match,attribution:resolved.attribution}));
    return new Response(null, {status:302, headers:{...headers, Location:resolved.href, 'X-Amazon-Market':resolved.market, 'X-Amazon-Match':resolved.match}});
  }
  const {market, offer, match} = resolved;
  const primary = resolveAmazon(q, {family, country:context.country, market});
  const source = bounded(url.searchParams.get('source')), product = bounded(url.searchParams.get('product'));
  const route = targetMarket => {
    const target = new URL('/go/amazon', url.origin);
    for (const [key,value] of Object.entries({q,family,source,product,market:targetMarket,remember:'1'})) if (value) target.searchParams.set(key,value);
    return target.pathname + target.search;
  };
  const props = (targetMarket, targetMatch, targetAttribution) => `data-fast-goal="amazon_click" data-fast-goal-family="${family}" data-fast-goal-market="${targetMarket}" data-fast-goal-country="${context.country || 'unknown'}" data-fast-goal-destination_host="${MARKETS[targetMarket][1]}" data-fast-goal-tag="${FAMILY_TAGS[family]}" data-fast-goal-source="${escape(source)}" data-fast-goal-product="${escape(product || q.slice(0,80))}" data-fast-goal-match="${targetMatch}" data-fast-goal-attribution="${targetAttribution}" data-fast-goal-route="direct"`;
  const automaticChoice = resolveAmazon(q, {family, country:context.country});
  const automatic = new URL('/go/amazon', url.origin);
  for (const [key,value] of Object.entries({q,family,source,product,reset:'1'})) if (value) automatic.searchParams.set(key,value);
  const storeLinks = Object.entries(MARKETS).map(([key,[label,host]]) => {
    const choice = resolveAmazon(q,{family,country:context.country,market:key});
    return `<a class="store-choice${key === market ? ' selected' : ''}" href="${escape(route(key))}" target="_blank" rel="sponsored nofollow noopener" ${props(key,choice.match,choice.attribution)}${key === market ? ' aria-current="true"' : ''}>${escape(label)}<span>${host.replace('www.','')}</span></a>`;
  }).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(q)} | Amazon stores | LocalClaw</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/css/amazon-offers-20260911.css?v=20261117"><script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script><script defer src="/js/amazon-offers-20260917.js?v=20261117"></script></head><body><header><a class="brand" href="/">LOCAL<span>CLAW</span></a><a href="/computers">Hardware guides ↗</a></header><main><p class="eyebrow">AMAZON STORES</p><h1>Your configuration.<br><span>Your Amazon store.</span></h1><p class="requested">${escape(q)}</p><article><div class="status ${offer ? 'verified' : ''}">${offer ? 'Exact configuration checked' : 'Search for this configuration'}</div><h2>${offer ? escape(offer.title) : 'Find this configuration on Amazon'}</h2>${offer ? `<dl><div><dt>Memory</dt><dd>${escape(offer.memory)}</dd></div><div><dt>Storage</dt><dd>${escape(offer.storage)}</dd></div><div><dt>Condition</dt><dd>${escape(offer.condition)}</dd></div></dl><p>${escape(offer.note)}</p><p class="hint">Checked ${offer.checked}. Confirm the variant, seller and delivery on Amazon.</p>` : '<p>No exact listing is currently checked in this store. Search results may include other configurations. Confirm the memory, storage and condition before buying.</p>'}<a class="primary" href="${escape(route(market))}" target="_blank" rel="sponsored nofollow noopener" ${props(market,match,primary.attribution)}>View ${offer ? 'this configuration' : 'offers'} on ${MARKETS[market][1].replace('www.','')} ↗</a></article><section class="store-section" aria-labelledby="store-heading"><h2 id="store-heading">Shop in another store</h2><p class="hint">Choose a store to go straight to Amazon. We’ll remember your choice for your next visit.${context.country === 'CH' ? ' For Switzerland, check delivery from Germany, France or Italy.' : ''}</p><nav class="store-grid" aria-label="Amazon stores">${storeLinks}</nav><a class="automatic" href="${escape(automatic.pathname + automatic.search)}" target="_blank" rel="sponsored nofollow noopener" ${props(automaticChoice.market,automaticChoice.match,automaticChoice.attribution)}>Use automatic store selection ↗</a></section><footer>As an Amazon Associate, LocalClaw earns from qualifying purchases. Prices, stock, delivery and return terms are confirmed by Amazon.</footer></main></body></html>`;
  return new Response(html, {headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' https://datafa.st; style-src 'self'; connect-src 'self' https://datafa.st; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}});
}
