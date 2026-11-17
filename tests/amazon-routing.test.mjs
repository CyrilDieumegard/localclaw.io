import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {selectMarket, findOffer, resolveAmazon, shoppingContext, storePreference, normalizeAmazonQuery, FAMILY_TAGS, MARKETS, STORE_COOKIE} from '../functions/_lib/amazon-links.mjs';
import {verifiedOffers} from '../functions/_lib/amazon-offers.mjs';
import {onRequestGet, onRequestHead} from '../functions/go/amazon.js';
const now = Date.parse('2026-11-17T12:00:00Z');
const request = (query, country='CH', headers={}) => Object.assign(new Request('https://localclaw.io/go/amazon?' + query,{headers}),{cf:{country}});
const result = (q, options={}) => resolveAmazon(q,{now,...options});
const clock = t => t.mock.method(Date,'now',() => now);

// Assert destinations from visitor scenarios, not an implementation copy.
test('one-click routing uses each enrolled country and keeps every family tag',async t => {
  clock(t);
  for (const market of Object.keys(MARKETS)) for (const family of Object.keys(FAMILY_TAGS)) {
    const response = await onRequestGet({request:request(`q=DDR5+64GB&family=${family}&url=https://evil.test`,market)});
    assert.equal(response.status,302);
    assert.equal(await response.text(),'');
    const target = new URL(response.headers.get('Location'));
    assert.equal(target.hostname,MARKETS[market][1]);
    assert.equal(target.pathname,'/s');
    assert.equal(target.searchParams.get('k'),'DDR5 64GB');
    assert.equal(target.searchParams.get('tag'),FAMILY_TAGS[family]);
    assert.match(response.headers.get('Cache-Control'),/no-store/);
  }
});
test('fresh local variants go straight to the exact configuration; a French hint cannot override US shoppers',async t => {
  clock(t);
  const q='Apple Mac mini M6 16GB 512GB';
  for (const [country,asin,host] of [['FR','B0HGGBZNTT','www.amazon.fr'],['US','B0HGGC82BG','www.amazon.com'],['CH','B0HGGBZNTT','www.amazon.fr']]) {
    const response=await onRequestGet({request:request(`q=${encodeURIComponent(q)}&listing=FR`,country)});
    const target=new URL(response.headers.get('Location'));
    assert.equal(target.hostname,host);assert.equal(target.pathname,`/dp/${asin}`);
    assert.equal(target.searchParams.get('creatorsDisableRedirect'),'true');
    assert.equal(response.headers.get('X-Amazon-Match'),'exact');
  }
  assert.equal(result(q,{country:'DE'}).market,'DE');
  assert.equal(new URL(result(q,{country:'DE'}).href).pathname,'/s');
});
test('Swiss cross-border exact offers require verified delivery and respect manual choice',() => {
  const q='GMKtec EVO-X3 Ryzen AI Max+ 395 128GB 2TB';
  assert.equal(result(q,{country:'CH'}).market,'FR');
  assert.equal(result(q,{country:'CH'}).match,'exact');
  assert.equal(result(q,{country:'CH',market:'DE'}).market,'DE');
  assert.equal(result(q,{country:'CH',market:'DE'}).match,'search');
  assert.equal(result(q,{country:'US'}).market,'US');
});
test('wrong memory, storage, marketplace, expired, disabled and refurbished offers cannot become exact new offers',() => {
  assert.equal(findOffer('Apple Mac mini M6 32GB 512GB','FR',now),undefined);
  assert.equal(findOffer('Apple Mac mini M6 16GB 1TB','FR',now),undefined);
  assert.equal(findOffer('Apple Mac mini M6 16GB 512GB','DE',now),undefined);
  assert.equal(findOffer('Apple Mac mini M6 16GB 512GB','FR',now+31*86400000),undefined);
  assert.equal(findOffer('Apple Mac mini M6 16GB 512GB','FR',now-86400000),undefined);
  for (const q of ['Beelink GTR9 Pro Ryzen AI Max+ 395 128GB 2TB','ASUS Ascent GX10 NVIDIA GB10 128GB 2TB']) assert.equal(result(q,{country:'FR'}).match,'search');
  assert.equal(result('Apple Mac mini M4 16GB 256GB',{country:'US',now:Date.parse('2026-09-11T12:00:00Z')}).match,'search');
  for (const offer of verifiedOffers) {
    assert.match(offer.asin,/^[A-Z0-9]{10}$/);
    assert.ok(offer.memory && offer.storage && offer.condition && offer.checked);
  }
});
test('country and saved preference are allowlisted, manual choice wins, reset removes the preference',async t => {
  clock(t);
  const cookie={Cookie:`other=1; ${STORE_COOKIE}=FR`};
  assert.equal(storePreference(request('q=DDR5+64GB','DE',cookie)),'FR');
  assert.equal(storePreference(request('q=DDR5+64GB&market=GB','DE',cookie)),'GB');
  assert.equal(storePreference(request('q=DDR5+64GB&reset=1','DE',cookie)),'');
  assert.equal(storePreference(request('q=DDR5+64GB','DE',{Cookie:`${STORE_COOKIE}=https://evil.test`})),'');
  const response=await onRequestGet({request:request('q=DDR5+64GB&market=FR&remember=1','DE')});
  assert.match(response.headers.get('Set-Cookie'),/localclaw_amazon_store=FR;.*HttpOnly; Secure; SameSite=Lax/);
  assert.equal(new URL(response.headers.get('Location')).hostname,'www.amazon.fr');
  const reset=await onRequestGet({request:request('q=DDR5+64GB&reset=1','DE',cookie)});
  assert.match(reset.headers.get('Set-Cookie'),/Max-Age=0/);
  assert.equal(new URL(reset.headers.get('Location')).hostname,'www.amazon.de');
  assert.equal(selectMarket('__proto__','CA'),'CA');
  assert.equal(selectMarket('','CH'),'DE');
});
test('unsupported countries keep tagged US OneLink rather than an unregistered destination',async t => {
  clock(t);
  for (const country of ['IE','BR','AU','JP','IN','MX','BE','SG','XX','']) {
    const response=await onRequestGet({request:request('q=DDR5+64GB&market='+country+'&family=gpuram',country)});
    const target=new URL(response.headers.get('Location'));
    assert.equal(target.hostname,'www.amazon.com');
    assert.equal(target.searchParams.get('tag'),FAMILY_TAGS.gpuram);
    assert.equal(target.searchParams.has('creatorsDisableRedirect'),false);
  }
});
test('link previews, verified bots, HEAD and prefetch cannot produce affiliate redirects or save preferences',async () => {
  const inputs=[{'User-Agent':'Googlebot'},{'User-Agent':'Slackbot-LinkExpanding 1.0'},{'Sec-Purpose':'prefetch'},{Purpose:'prefetch'}];
  for (const headers of inputs) {
    const response=await onRequestGet({request:request('q=DDR5+64GB&market=FR&remember=1','FR',headers)});
    assert.equal(response.status,204);assert.equal(response.headers.get('Location'),null);assert.equal(response.headers.get('Set-Cookie'),null);
  }
  const verified=request('q=DDR5+64GB');verified.cf.botManagement={verifiedBot:true};
  assert.equal((await onRequestGet({request:verified})).status,204);
  assert.equal(onRequestHead().status,204);
});
test('context describes the server decision without redirecting, storing a preference or recording human clicks',async t => {
  clock(t);
  const response=await onRequestGet({request:request('context=1')});
  assert.equal(response.status,200);assert.equal(response.headers.get('Location'),null);assert.equal(response.headers.get('Set-Cookie'),null);
  const data=await response.json();
  assert.equal(data.country,'CH');assert.equal(data.market,'DE');
  assert.equal(data.offers['apple mac mini m6 16gb 512gb'].market,'FR');
  assert.equal(data.offers['beelink gtr9 pro ryzen ai max+ 395 128gb 2tb'],undefined);
  const saved=shoppingContext(request('context=1','CH',{Cookie:`${STORE_COOKIE}=GB`}),now);
  assert.equal(saved.market,'GB');assert.deepEqual(saved.offers,{});
});
test('secondary chooser offers direct store links with remembered choice, tags and accurate destination metadata',async t => {
  clock(t);
  const html=await (await onRequestGet({request:request('options=1&q=DDR5+64GB&family=gpuram&source=ram_gpu_page')})).text();
  assert.ok(!html.includes('<form'));
  const links=[...html.matchAll(/<a[^>]+data-fast-goal="amazon_click"[^>]*>/g)].map(match=>match[0]);
  assert.equal(links.length,12);
  for (const link of links) {
    assert.match(link,/target="_blank"/);assert.match(link,/data-fast-goal-tag="localclaw-gpuram-20"/);
  }
  const france=links.find(link=>link.includes('class="store-choice"') && link.includes('data-fast-goal-market="FR"'));
  assert.match(france,/market=FR&amp;remember=1/);
  assert.match(france,/data-fast-goal-destination_host="www.amazon.fr"/);
  assert.match(france,/data-fast-goal-selected_market="DE"/);
  assert.match(france,/data-fast-goal-match="search"/);
});
test('invalid inputs and open-redirect/XSS attempts fail closed',async () => {
  for (const q of ['','x','a'.repeat(141),'safe\nquery']) assert.equal(normalizeAmazonQuery(q),'');
  assert.equal((await onRequestGet({request:request('q=x')})).status,400);
  const html=await (await onRequestGet({request:request('options=1&q='+encodeURIComponent('<script>alert(1)</script>')+'&family=__proto__&market=https://evil.test')})).text();
  assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('href="https://evil'));
  assert.ok(html.includes('data-fast-goal-family="computers"'));
  assert.ok(html.includes('data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei"'));
});

function clientEnvironment(context, fail=false) {
  const listeners={}, events=[],links=[];let observer;
  const document={body:{},visibilityState:'visible',querySelectorAll:()=>links,addEventListener:(name,fn)=>listeners[name]=fn,createElement:()=>({setAttribute(){}})};
  const window={location:{href:'https://localclaw.io/',origin:'https://localclaw.io'},datafast:(...args)=>events.push(args)};
  function addLink(href) {
    const attrs={href};const link={dataset:{},childNodes:[],setAttribute:(key,value)=>attrs[key]=value,getAttribute:key=>attrs[key]||null,after:()=>{},attrs};
    links.push(link);observer([{addedNodes:[{querySelectorAll:()=>[link]}]}]);return link;
  }
  vm.runInNewContext(fs.readFileSync(new URL('../js/amazon-clicks-20260921.js',import.meta.url),'utf8'),{
    URL,window,document,fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>context};},
    MutationObserver:class {constructor(fn){observer=fn;}observe(){}}
  });
  return {listeners,events,window,addLink};
}
test('browser tracking resolves dynamic links before aggregate capture and emits only one family event',async () => {
  const context={country:'CH',market:'DE',preference:'',automatic:false,offers:{'apple mac mini m6 16gb 512gb':{market:'FR',match:'exact'}}};
  const env=clientEnvironment(context);
  const link=env.addLink('/go/amazon?q=Apple+Mac+mini+M6+16GB+512GB&family=computers&source=computers_card&listing=FR');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(link.attrs['data-fast-goal-market'],'FR');assert.equal(link.attrs['data-fast-goal-match'],'exact');
  assert.equal(link.attrs['data-fast-goal-destination_host'],'www.amazon.fr');
  env.listeners.click({isTrusted:true,target:{closest:()=>link}});
  assert.equal(env.events.length,1);assert.equal(env.events[0][0],'amazon_computers_click');
  assert.equal(env.events[0][1].tag,FAMILY_TAGS.computers);
  env.listeners.click({isTrusted:false,target:{closest:()=>link}});assert.equal(env.events.length,1);
  env.window.datafast=undefined;assert.doesNotThrow(()=>env.listeners.click({target:{closest:()=>link}}));
});
test('context/analytics failure never blocks buying and does not invent a country or an exact match',async () => {
  const env=clientEnvironment(null,true);
  const link=env.addLink('/go/amazon?q=DDR5+64GB&family=gpuram&listing=FR');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(link.attrs.href,'/go/amazon?q=DDR5+64GB&family=gpuram&listing=FR');
  assert.equal(link.attrs['data-fast-goal-market'],'auto');assert.equal(link.attrs['data-fast-goal-match'],'unknown');
  env.listeners.click({target:{closest:()=>link}});
  assert.equal(env.events[0][0],'amazon_gpuram_click');
});
test('chooser family tracking supplements the SDK without another aggregate event',() => {
  let listener;const events=[];
  vm.runInNewContext(fs.readFileSync(new URL('../js/amazon-offers-20260917.js',import.meta.url),'utf8'),{
    document:{addEventListener:(name,fn)=>listener=fn},window:{datafast:(...args)=>events.push(args)}
  });
  const link={getAttribute:name=>name==='data-fast-goal-family'?'diy':'test'};
  listener({target:{closest:()=>link}});assert.equal(events.length,1);assert.equal(events[0][0],'amazon_diy_click');
  assert.equal(events[0][1].tag,FAMILY_TAGS.diy);
});
test('reset-choice telemetry uses the automatic destination rather than the remembered store',async t => {
  clock(t);
  const html=await (await onRequestGet({request:request('options=1&q=DDR5+64GB&family=gpuram','CH',{Cookie:`${STORE_COOKIE}=FR`})})).text();
  const automatic=html.match(/<a class="automatic"[^>]*>/)[0];
  assert.match(automatic,/data-fast-goal-market="DE"/);
  assert.match(automatic,/data-fast-goal-destination_host="www.amazon.de"/);
});
