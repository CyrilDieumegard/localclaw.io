import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { selectMarket, findOffer, localDestination, amazonSearchUrl, normalizeAmazonQuery, FAMILY_TAGS, MARKETS } from '../functions/_lib/amazon-links.mjs';
import { verifiedOffers } from '../functions/_lib/amazon-offers.mjs';
import { onRequestGet } from '../functions/go/amazon.js';
const now=Date.parse('2026-09-11T12:00:00Z');
const request=(query,country='CH')=>Object.assign(new Request('https://localclaw.io/go/amazon?'+query),{cf:{country}});
test('exact variants never cross memory, condition or country boundaries',()=>{
  assert.equal(findOffer('Apple Mac mini M4 16GB 256GB','US',now).condition,'Renewed');
  assert.equal(findOffer('Apple Mac mini M4 Pro 24GB 512GB','DE',now).asin,'B0DLBWRZS5');
  assert.equal(findOffer('Apple Mac mini M4 Pro 48GB 512GB','DE',now),undefined);
  assert.equal(findOffer('Apple Mac mini M4 16GB 256GB','DE',now),undefined);
  assert.equal(findOffer('Apple Mac mini M4 Pro 24GB 512GB','FR',now),undefined);
  assert.equal(findOffer('Apple Mac mini M4 Pro 24GB 512GB','DE',now+31*86400000),undefined);
  for(const offer of verifiedOffers){assert.match(offer.asin,/^[A-Z0-9]{10}$/);assert.ok(offer.memory&&offer.storage&&offer.condition&&offer.checked);}
});
test('country selection is allowlisted and manual choice takes priority',()=>{
  assert.equal(selectMarket('', 'CH'),'DE'); assert.equal(selectMarket('FR','CH'),'FR');
  assert.equal(selectMarket('https://evil.test','FR'),'FR');assert.equal(selectMarket('__proto__','CA'),'CA');
  assert.equal(selectMarket('','XX'),'US');assert.equal(selectMarket('','IN'),'IN');
});
test('registered family tags are distinct; international activation preserves old tag',()=>{
  for(const family of Object.keys(FAMILY_TAGS)){
    const us=new URL(localDestination('test computer','US',null,family,now,'US'));
    assert.equal(us.searchParams.get('tag'),FAMILY_TAGS[family]);
    assert.equal(new URL(localDestination('test computer','US',null,family,now,'CH')).searchParams.get('tag'),'localclaw-20');
    const de=new URL(localDestination('test computer','DE',null,family,now));
    assert.equal(de.searchParams.get('tag'),'localclaw-20');
    const ready=new URL(localDestination('test computer','DE',null,family,now+2*86400000));
    assert.equal(ready.searchParams.get('tag'),FAMILY_TAGS[family]);
    assert.equal(new URL(localDestination('test computer','IN',null,family,now)).searchParams.get('tag'),null);
  }
  for(const market of Object.keys(MARKETS))assert.equal(new URL(localDestination('DDR5 64GB',market)).hostname,MARKETS[market][1]);
  assert.equal(new URL(amazonSearchUrl('DDR5 64GB',{family:'gpuram',country:'US',now})).searchParams.get('tag'),FAMILY_TAGS.gpuram);
});
test('HTML escapes supplied text, rejects invalid input and is never cached',async()=>{
  for(const q of ['','x','a'.repeat(141),'safe\nquery'])assert.equal(normalizeAmazonQuery(q),'');
  assert.equal((await onRequestGet({request:request('q=x')})).status,400);
  const res=await onRequestGet({request:request('q='+encodeURIComponent('<script>alert(1)</script>')+'&family=__proto__&market=FR')});
  const html=await res.text();assert.equal(res.status,200);assert.match(res.headers.get('Cache-Control'),/no-store/);
  assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei"'));
  assert.ok(html.includes('data-fast-goal-family="computers"'));
  assert.ok(!html.includes('data-fast-goal="amazon_offer_open"'));
  assert.ok(html.includes('France · amazon.fr'));assert.ok(html.includes('configuration not verified'));
  assert.ok(!html.includes('href="https://evil'));
});
test('family click goal fires once alongside the separately handled aggregate goal',()=>{
  let listener;const events=[];
  vm.runInNewContext(fs.readFileSync(new URL('../js/amazon-offers-20260911.js',import.meta.url),'utf8'),{document:{addEventListener:(name,fn)=>listener=fn},window:{datafast:(...args)=>events.push(args)}});
  const link={getAttribute:name=>name==='data-fast-goal-family'?'diy':'test'};
  listener({target:{closest:()=>link}});
  assert.equal(events.length,1);assert.equal(events[0][0],'amazon_diy_click');
  assert.equal(events[0][1].family,'diy');
});
