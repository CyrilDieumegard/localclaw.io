import { ALERT_ORIGIN, configured, validateCatalog, knownIds, newMatches, deliveryId, buildEmail } from '../../functions/_lib/model-alerts.js';

const changed = result => Number(result?.meta?.changes ?? result?.changes ?? 0);
const profile = row => ({id:row.machine_id,ramGb:row.ram_gb,vramGb:row.vram_gb,platform:row.platform,accelerator:row.accelerator,useCase:row.use_case,priority:row.priority,context:row.context});
export async function runAlerts(env, {fetcher=fetch, now=new Date()}={}) {
  if(!configured(env) || !env.RESEND_API_KEY || !env.MODEL_ALERTS_FROM)return {disabled:true};
  const response=await fetcher(`${ALERT_ORIGIN}/data/model-alert-catalog.json`, {signal:AbortSignal.timeout(15000),cf:{cacheTtl:0}});
  if(!response.ok)throw new Error('catalog_unavailable');
  const catalog=validateCatalog(await response.json()), db=env.LOCALCLAW_DB, stamp=now.toISOString();
  const allIds=catalog.models.map(model=>model.id);
  const result=await db.prepare(`SELECT s.*,m.platform,m.accelerator,m.ram_gb,m.vram_gb,m.use_case,m.priority,m.context,u.email
    FROM model_alert_subscriptions s JOIN machines m ON m.id=s.machine_id AND m.user_id=s.user_id
    JOIN user u ON u.id=s.user_id WHERE s.enabled=1 AND u.emailVerified=1 ORDER BY s.updated_at ASC LIMIT 100`).all();
  let queued=0,sent=0,failed=0;
  for(const row of result.results || []) {
    await db.prepare('UPDATE model_alert_subscriptions SET updated_at=? WHERE machine_id=? AND enabled=1').bind(stamp,row.machine_id).run();
    if(row.last_sent_at && now-new Date(row.last_sent_at)<86400000)continue;
    const pending=await db.prepare("SELECT id FROM model_alert_deliveries WHERE machine_id=? AND consent_at=? AND status IN ('pending','sending') LIMIT 1").bind(row.machine_id,row.consent_at).first();
    if(pending)continue;
    const matches=newMatches(profile(row),catalog,knownIds(row.known_model_ids));
    if(!matches.length) {
      await db.prepare('UPDATE model_alert_subscriptions SET known_model_ids=? WHERE machine_id=? AND consent_at=? AND enabled=1').bind(JSON.stringify(allIds),row.machine_id,row.consent_at).run();
      continue;
    }
    const ids=matches.map(model=>model.id), id=await deliveryId(row.machine_id,row.consent_at,ids);
    const email=await buildEmail(env,row,profile(row),matches,row.email);
    const payload=JSON.stringify({email,catalogIds:allIds});
    const insert=await db.prepare(`INSERT OR IGNORE INTO model_alert_deliveries (id,machine_id,user_id,consent_at,model_ids,payload,next_attempt_at,created_at,updated_at)
      SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM model_alert_subscriptions WHERE machine_id=? AND consent_at=? AND enabled=1)`)
      .bind(id,row.machine_id,row.user_id,row.consent_at,JSON.stringify(ids),payload,stamp,stamp,stamp,row.machine_id,row.consent_at).run();
    queued+=changed(insert);
  }
  const stale=new Date(now.getTime()-300000).toISOString();
  const deliveries=await db.prepare(`SELECT d.* FROM model_alert_deliveries d WHERE (d.status='pending' OR (d.status='sending' AND d.updated_at<?)) AND d.next_attempt_at<=? ORDER BY d.created_at LIMIT 20`).bind(stale,stamp).all();
  for(const delivery of deliveries.results || []) {
    const claim=await db.prepare(`UPDATE model_alert_deliveries SET status='sending',attempts=attempts+1,updated_at=?
      WHERE id=? AND (status='pending' OR (status='sending' AND updated_at<?))`).bind(stamp,delivery.id,stale).run();
    if(!changed(claim))continue;
    const current=await db.prepare(`SELECT s.*,m.platform,m.accelerator,m.ram_gb,m.vram_gb,m.use_case,m.priority,m.context,u.email,u.emailVerified
      FROM model_alert_subscriptions s JOIN machines m ON m.id=s.machine_id AND m.user_id=s.user_id JOIN user u ON u.id=s.user_id WHERE s.machine_id=?`).bind(delivery.machine_id).first();
    const payload=JSON.parse(delivery.payload), ids=knownIds(delivery.model_ids);
    const valid=current?.enabled===1 && current.emailVerified===1 && current.consent_at===delivery.consent_at && current.email===payload.email.to[0]
      && ids.every(id=>newMatches(profile(current),catalog,[]).some(model=>model.id===id));
    if(!valid) {
      await db.prepare("UPDATE model_alert_deliveries SET status='cancelled',updated_at=? WHERE id=?").bind(stamp,delivery.id).run();
      continue;
    }
    if(delivery.attempts>0 && now-new Date(delivery.created_at)>22*3600000) {
      await db.prepare("UPDATE model_alert_deliveries SET status='failed',last_error='retry_window_expired',updated_at=? WHERE id=?").bind(stamp,delivery.id).run();
      failed++;continue;
    }
    let status=0, receipt=null;
    try {
      const send=await fetcher('https://api.resend.com/emails', {method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':delivery.id},body:JSON.stringify(payload.email)});
      status=send.status;
      if(send.ok)receipt=await send.json();
    } catch {} // Retry ambiguous network outcomes with the identical provider key.
    if(receipt?.id) {
      await db.batch([
        db.prepare("UPDATE model_alert_deliveries SET status='sent',provider_id=?,last_error=NULL,payload='{}',updated_at=? WHERE id=?").bind(receipt.id,stamp,delivery.id),
        db.prepare('UPDATE model_alert_subscriptions SET known_model_ids=?,last_sent_at=?,updated_at=? WHERE machine_id=? AND consent_at=? AND enabled=1').bind(JSON.stringify(payload.catalogIds),stamp,stamp,delivery.machine_id,delivery.consent_at)
      ]);
      sent++;continue;
    }
    const retryable=status===0 || status===429 || status>=500, attempts=Number(delivery.attempts)+1;
    const retry=retryable && attempts<6;
    const next=new Date(now.getTime()+Math.min(3600000,60000*2**attempts)).toISOString();
    await db.prepare('UPDATE model_alert_deliveries SET status=?,last_error=?,next_attempt_at=?,updated_at=? WHERE id=? AND status=\'sending\'')
      .bind(retry?'pending':'failed',status?`provider_${status}`:'provider_network_error',next,stamp,delivery.id).run();
    if(!retry)failed++;
  }
  return {scanned:(result.results || []).length,queued,sent,failed};
}
export default {
  async scheduled(_event,env,ctx) { ctx.waitUntil(runAlerts(env).then(result=>console.log(JSON.stringify(result)))); },
  fetch() { return new Response('LocalClaw model alert worker',{headers:{'Content-Type':'text/plain'}}); }
};
