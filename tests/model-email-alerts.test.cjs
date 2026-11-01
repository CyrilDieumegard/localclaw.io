const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {webcrypto}=require('node:crypto');
const ranking=require('../js/model-ranking');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function load(file,imports,names) {
  const source=read(file).split('export default {')[0].replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\s*/g,'').replace(/import\s+['"][^'"]+['"];?\s*/g,'').replace(/\bexport\s+/g,'');
  return new Function(...Object.keys(imports),source+`\nreturn {${names.join(',')}};`)(...Object.values(imports));
}
const lib=load('functions/_lib/model-alerts.js',{globalThis:{LocalClawModelRanking:ranking},crypto:webcrypto},['configured','CONSENT_VERSION','ALERT_ORIGIN','validateCatalog','knownIds','newMatches','deliveryId','buildEmail','unsubscribeToken','verifyUnsubscribe','verifyWebhook']);
const model=(id,extra={})=>({id,name:id,size_gb:4,min_ram:8,hf_repo:'qa/'+id+'-GGUF',recommended_quant:'Q4_K_M',tags:['chat','general'],benchmarks:{quality:7,speed:8},...extra});
function setup() {
  const db=new DatabaseSync(':memory:');
  for(const file of ['0001_accounts_and_machines.sql','0009_saved_plan_selection.sql','0011_model_email_alerts.sql'])db.exec(read('migrations/'+file));
  db.exec(`INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt)VALUES('u','QA','qa@example.invalid',1,'now','now');
    INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt)VALUES('other','Other','other@example.invalid',1,'now','now');
    INSERT INTO machines(id,user_id,name,platform,accelerator,ram_gb,use_case,priority,context,is_primary,source,created_at,updated_at)VALUES('m','u','My machine','macos','apple-silicon',16,'chat','balanced','8k',1,'manual','now','now');`);
  const d1={prepare(sql){const statement=db.prepare(sql);let args=[];return {bind(...values){args=values;return this;},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){return statement.run(...args);}};},async batch(statements){db.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}};
  const env={LOCALCLAW_DB:d1,MODEL_ALERTS_ENABLED:'true',MODEL_ALERTS_UNSUBSCRIBE_SECRET:'test-unsubscribe-secret-with-more-than-32-characters',RESEND_API_KEY:'test-key',MODEL_ALERTS_FROM:'LocalClaw <models@updates.localclaw.io>'};
  const catalog={version:1,models:[model('existing')]};
  const auth={getRequiredSession:async context=>context.unauth?{response:new Response(null,{status:401})}:{session:{user:{id:context.user || 'u',emailVerified:context.verified!==false}}},json:(body,status=200)=>new Response(JSON.stringify(body),{status}),requireSameOrigin:request=>request.headers.get('Origin')===new URL(request.url).origin,parseJsonBody:async request=>({value:await request.json()})};
  const api=load('functions/api/model-alerts/index.js',{...auth,...lib,catalog},['onRequestGet','onRequestPut']);
  const unsubscribe=load('functions/api/model-alerts/unsubscribe.js',{...lib,escapeHtml:x=>String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;')},['onRequestGet','onRequestPost']);
  const worker=load('workers/model-alerts/index.js',lib,['runAlerts']);
  const webhook=load('functions/api/model-alerts/webhook.js',{...auth,...lib},['onRequestPost']);
  const send=[];let fail=false;
  const fetcher=async (url,options)=>{
    if(url.startsWith(lib.ALERT_ORIGIN))return Response.json(catalog);
    assert.equal(url,'https://api.resend.com/emails');
    send.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});
    if(fail){fail=false;throw Error('ambiguous timeout');}
    return Response.json({id:'mail-'+send.length});
  };
  const context=(body,extra={})=>({env,request:new Request('https://localclaw.io/api/model-alerts',{method:'PUT',headers:{Origin:'https://localclaw.io','Content-Type':'application/json'},body:JSON.stringify(body)}),...extra});
  const enable=()=>api.onRequestPut(context({machineId:'m',enabled:true}));
  const subscription=()=>db.prepare('SELECT * FROM model_alert_subscriptions WHERE machine_id=?').get('m');
  const run=(offset=0)=>worker.runAlerts(env,{fetcher,now:new Date(Date.now()+offset)});
  return {db,env,catalog,api,unsubscribe,webhook,context,enable,subscription,run,send,setFail(){fail=true;}};
}

test('subscriptions require ownership, same origin and a verified account, with no automatic opt-in',async()=>{
  const s=setup();assert.equal(s.subscription(),undefined);
  assert.equal((await s.api.onRequestPut(s.context({machineId:'m',enabled:true},{user:'other'}))).status,404);
  assert.equal((await s.api.onRequestPut(s.context({machineId:'m',enabled:true},{verified:false}))).status,503);
  const wrong=s.context({machineId:'m',enabled:true});wrong.request=new Request(wrong.request,{headers:{Origin:'https://attacker.invalid'}});
  assert.equal((await s.api.onRequestPut(wrong)).status,403);
  assert.equal((await s.enable()).status,200);assert.equal(s.subscription().enabled,1);
  const consent=s.subscription().consent_at;await s.enable();assert.equal(s.subscription().consent_at,consent,'duplicate enable preserves baseline and unsubscribe token');
  await s.run();assert.equal(s.send.length,0,'the existing catalogue is not emailed');
});

test('scheduler sends a real compatible addition without a site visit and does not duplicate it',async()=>{
  const s=setup();await s.enable();s.catalog.models.push(model('new-local'),model('too-large',{size_gb:100,min_ram:128}));
  const result=await s.run();assert.equal(result.sent,1);assert.equal(s.send.length,1);
  assert.match(s.send[0].body.text,/new-local/);assert.doesNotMatch(s.send[0].body.text,/too-large/);
  assert.deepEqual(s.send[0].body.to,['qa@example.invalid']);assert.equal(s.send[0].body.headers['List-Unsubscribe-Post'],'List-Unsubscribe=One-Click');
  assert.match(s.send[0].body.headers['List-Unsubscribe'],/https:\/\/localclaw.io\/api\/model-alerts\/unsubscribe/);
  await s.run(2*3600000);assert.equal(s.send.length,1);
  s.catalog.models.push(model('new-later'));await s.run(3*3600000);assert.equal(s.send.length,1,'at most one email a day per machine');
  await s.run(25*3600000);assert.equal(s.send.length,2);
});

test('network retries reuse the exact provider payload and idempotency key, and never advance the baseline on failure',async()=>{
  const s=setup();await s.enable();s.catalog.models.push(model('new-local'));s.setFail();await s.run();
  assert(!JSON.parse(s.subscription().known_model_ids).includes('new-local'));
  await s.run(2*3600000);assert.equal(s.send.length,2);assert.deepEqual(s.send[0],s.send[1]);
  assert(JSON.parse(s.subscription().known_model_ids).includes('new-local'));
});

test('turning alerts off cancels pending sends; email scanners cannot unsubscribe with a GET',async()=>{
  const s=setup();await s.enable();s.catalog.models.push(model('new-local'));s.setFail();await s.run();
  const row=s.subscription(),token=await lib.unsubscribeToken(s.env.MODEL_ALERTS_UNSUBSCRIBE_SECRET,row);
  const url='https://localclaw.io/api/model-alerts/unsubscribe?machine=m&token='+token;
  assert.equal((await s.unsubscribe.onRequestGet({env:s.env,request:new Request(url)})).status,200);assert.equal(s.subscription().enabled,1);
  assert.equal((await s.unsubscribe.onRequestPost({env:s.env,request:new Request(url,{method:'POST'})})).status,200);
  assert.equal(s.subscription().enabled,0);await s.run(2*3600000);assert.equal(s.send.length,1);
  await s.enable();assert.notEqual(s.subscription().consent_at,row.consent_at);
  assert.equal((await s.unsubscribe.onRequestPost({env:s.env,request:new Request(url,{method:'POST'})})).status,400,'old consent link cannot cancel a new opt-in');
});

test('changed hardware and disabled subscriptions prevent queued email delivery',async()=>{
  const s=setup();await s.enable();s.catalog.models.push(model('new-local',{size_gb:8,min_ram:12}));s.setFail();await s.run();
  s.db.exec('UPDATE machines SET ram_gb=4 WHERE id=\'m\'');await s.run(2*3600000);assert.equal(s.send.length,1);
  assert.equal(s.db.prepare('SELECT status FROM model_alert_deliveries').get().status,'cancelled');
});

test('a forged or expired webhook is rejected; signed complaints stop further sends',async()=>{
  const s=setup();await s.enable();s.catalog.models.push(model('new-local'));await s.run();
  const raw=JSON.stringify({type:'email.complained',data:{email_id:'mail-1'}});
  s.env.MODEL_ALERTS_WEBHOOK_SECRET='whsec_'+Buffer.from('test-signing-key').toString('base64');
  const make=(headers)=>({env:s.env,request:new Request('https://localclaw.io/api/model-alerts/webhook',{method:'POST',body:raw,headers})});
  assert.equal((await s.webhook.onRequestPost(make({}))).status,401);
  const timestamp=String(Math.floor(Date.now()/1000)),id='evt-test';
  const k=await webcrypto.subtle.importKey('raw',Buffer.from('test-signing-key'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=Buffer.from(await webcrypto.subtle.sign('HMAC',k,Buffer.from(`${id}.${timestamp}.${raw}`))).toString('base64');
  assert.equal((await s.webhook.onRequestPost(make({'svix-id':id,'svix-timestamp':timestamp,'svix-signature':'v1,'+signature}))).status,200);
  assert.equal(s.subscription().enabled,0);
});
