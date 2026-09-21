import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { selectMarket, findOffer, localDestination, amazonSearchUrl, normalizeAmazonQuery, FAMILY_TAGS, MARKETS } from '../functions/_lib/amazon-links.mjs';
import { verifiedOffers } from '../functions/_lib/amazon-offers.mjs';
import { onRequestGet } from '../functions/go/amazon.js';
const now=Date.parse('2026-09-11T12:00:00Z');
const request=(query,country='CH')=>Object.assign(new Request('https://localclaw.io/go/amazon?'+query),{cf:{country}});
test('default and legacy links leave in one click via tagged US OneLink, without script or second page',async()=>{
  for(const country of [...Object.keys(MARKETS),'CH','IN','XX']) {
    for(const family of Object.keys(FAMILY_TAGS)) {
      const q='Apple Mac mini M4 Pro 24GB 512GB';
      const res=await onRequestGet({request:request(`q=${encodeURIComponent(q)}&family=${family}&market=DE&url=https://evil.test`,country)});
      assert.equal(res.status,302);
      assert.equal(await res.text(),'');
      const target=new URL(res.headers.get('Location'));
      assert.equal(target.origin,'https://www.amazon.com');
      assert.equal(target.pathname,'/s');
      assert.equal(target.searchParams.get('k'),q);
      assert.equal(target.searchParams.get('tag'),FAMILY_TAGS[family]);
      assert.equal(target.searchParams.has('creatorsDisableRedirect'),false);
      assert.match(res.headers.get('Cache-Control'),/no-store/);
    }
  }
  const invalid=await onRequestGet({request:request('q='+encodeURIComponent('safe\nLocation: https://evil.test'))});
  assert.equal(invalid.status,400);
  const unknown=await onRequestGet({request:request('q=DDR5+64GB&family=__proto__')});
  assert.equal(new URL(unknown.headers.get('Location')).searchParams.get('tag'),FAMILY_TAGS.computers);
});
test('secondary chooser remains explicit when changing stores and keeps source page alive',async()=>{
  const html=await (await onRequestGet({request:request('options=1&q=DDR5+64GB&market=FR&family=gpuram')})).text();
  assert.match(html,/name="options" value="1"/);
  for(const link of html.matchAll(/<a[^>]+data-fast-goal="amazon_click"[^>]*>/g)) assert.match(link[0],/target="_blank"/);
});
test('direct family tracking includes dynamic and homepage links without duplicate aggregate events',()=>{
  let listener;const events=[];
  const window={location:{href:'https://localclaw.io/',origin:'https://localclaw.io'},datafast:(...args)=>events.push(args)};
  vm.runInNewContext(fs.readFileSync(new URL('../js/amazon-clicks-20260921.js',import.meta.url),'utf8'),{
    URL,window,document:{body:{},querySelectorAll:()=>[],addEventListener:(name,fn)=>listener=fn},
    MutationObserver:class {observe(){}}
  });
  for(const [family,source] of [['computers','recommender_products'],['gpuram','buyer_path'],['diy','diy_parts']]){
    const href=`/go/amazon?q=DDR5+64GB&family=${family}&source=${source}`;
    listener({target:{closest:()=>({getAttribute:()=>href})}});
    assert.equal(events.at(-1)[0],`amazon_${family}_click`);
    assert.equal(events.at(-1)[1].source,source);
    assert.equal(events.at(-1)[1].tag,FAMILY_TAGS[family]);
  }
  assert.equal(events.length,3);
  listener({target:{closest:()=>({getAttribute:()=>'/go/amazon?q=DDR5+64GB&options=1'})}});
  assert.equal(events.length,3);
  window.datafast=undefined;
  assert.doesNotThrow(()=>listener({target:{closest:()=>({getAttribute:()=>'/go/amazon?q=DDR5+64GB'})}}));
});
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
  assert.equal(selectMarket('','XX'),'US');assert.equal(selectMarket('','IN'),'US');
});
test('compact Amazon configurations preserve exact SSD, memory and marketplace',()=>{
  for(const [query,market,asin] of [
    ['GMKtec EVO-X2 Ryzen AI Max+ 395 128GB 2TB','DE','B0F6X332N6'],
    ['Minisforum MS-S1 MAX Ryzen AI Max+ 395 128GB 2TB','DE','B0HCNRF4Y1'],
    ['ASUS Ascent GX10 NVIDIA GB10 128GB 2TB','FR','B0GBXPZ8V8']
  ]){
    const offer=findOffer(query,market,now);
    assert.equal(offer.asin,asin);
    assert.equal(offer.storage,'2TB SSD');
    assert.match(offer.memory,/128GB/);
    assert.equal(findOffer(query.replace('128GB','64GB'),market,now),undefined);
    assert.equal(findOffer(query.replace('2TB','1TB'),market,now),undefined);
    assert.equal(findOffer(query,'US',now),undefined);
  }
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
    assert.equal(new URL(localDestination('test computer','IN',null,family,now)).searchParams.get('tag'),'localclaw-20');
  }
  for(const market of Object.keys(MARKETS)){
    const destination=new URL(localDestination('DDR5 64GB',market));
    assert.equal(destination.hostname,MARKETS[market][1]);
    assert.equal(destination.searchParams.get('creatorsDisableRedirect'),'true');
  }
  const exact=new URL(localDestination('Apple Mac mini M4 16GB 256GB','US',findOffer('Apple Mac mini M4 16GB 256GB','US',now),'computers',now,'CH'));
  assert.equal(exact.pathname,'/dp/B0DTPPBN95');
  assert.equal(exact.searchParams.get('creatorsDisableRedirect'),'true');
  assert.equal(new URL(amazonSearchUrl('DDR5 64GB',{now})).searchParams.has('creatorsDisableRedirect'),false);
  assert.equal(new URL(amazonSearchUrl('DDR5 64GB',{family:'gpuram',country:'US',now})).searchParams.get('tag'),FAMILY_TAGS.gpuram);
});
test('HTML escapes supplied text, rejects invalid input and is never cached',async()=>{
  for(const q of ['','x','a'.repeat(141),'safe\nquery'])assert.equal(normalizeAmazonQuery(q),'');
  assert.equal((await onRequestGet({request:request('q=x')})).status,400);
  const res=await onRequestGet({request:request('options=1&q='+encodeURIComponent('<script>alert(1)</script>')+'&family=__proto__&market=FR')});
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
  vm.runInNewContext(fs.readFileSync(new URL('../js/amazon-offers-20260917.js',import.meta.url),'utf8'),{document:{addEventListener:(name,fn)=>listener=fn},window:{datafast:(...args)=>events.push(args)}});
  const link={getAttribute:name=>name==='data-fast-goal-family'?'diy':'test'};
  listener({target:{closest:()=>link}});
  assert.equal(events.length,1);assert.equal(events[0][0],'amazon_diy_click');
  assert.equal(events[0][1].family,'diy');
});

test('unsupported countries and legacy market URLs always offer tagged destinations',async()=>{
  for (const country of ['IE','BR','AU','JP','IN','MX','BE','SG']) {
    for (const family of Object.keys(FAMILY_TAGS)) {
      const res=await onRequestGet({request:request(`options=1&q=DDR5+64GB&family=${family}&market=${country}`,country)});
      const html=await res.text();
      assert.equal(res.status,200);
      assert.match(html,/Showing Amazon.com. Check delivery/);
      assert.ok(!html.includes(`value="${country}"`));
      assert.ok(!html.includes('data-fast-goal-attribution="none"'));
      const links=[...html.matchAll(/<a[^>]+href="(https:[^"]+)"[^>]*data-fast-goal="amazon_click"[^>]*>/g)];
      assert.ok(links.length);
      for (const [,href] of links) {
        const url=new URL(href.replaceAll('&amp;','&'));
        assert.equal(url.hostname,'www.amazon.com');
        assert.ok([FAMILY_TAGS[family],'localclaw-20'].includes(url.searchParams.get('tag')));
      }
    }
  }
});
test('outbound analytics describe the linked store, not the previously selected store',async()=>{
  const html=await (await onRequestGet({request:request('options=1&q=DDR5+64GB&market=DE&family=gpuram','CH')})).text();
  const primary=html.match(/<a class="primary"[^>]+>/)[0];
  const secondary=html.match(/<a class="secondary"[^>]+>/)[0];
  assert.match(primary,/data-fast-goal-market="DE"/);
  assert.match(primary,/data-fast-goal-destination_host="www.amazon.de"/);
  assert.match(secondary,/data-fast-goal-market="US"/);
  assert.match(secondary,/data-fast-goal-selected_market="DE"/);
  assert.match(secondary,/data-fast-goal-destination_host="www.amazon.com"/);
  assert.match(secondary,/data-fast-goal-tag="localclaw-gpuram-20"/);
});
