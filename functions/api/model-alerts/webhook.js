import { json } from '../../_lib/auth.js';
import { verifyWebhook } from '../../_lib/model-alerts.js';
export async function onRequestPost(context) {
  const raw=await context.request.text();
  if(raw.length>65536 || !await verifyWebhook(context.request,context.env.MODEL_ALERTS_WEBHOOK_SECRET,raw))return json({ok:false},401);
  let event;try{event=JSON.parse(raw);}catch{return json({ok:false},400);}
  if(!['email.bounced','email.complained','email.suppressed'].includes(event.type))return json({ok:true});
  const delivery=await context.env.LOCALCLAW_DB.prepare('SELECT user_id FROM model_alert_deliveries WHERE provider_id=?').bind(String(event.data?.email_id || '')).first();
  if(!delivery)return json({ok:false},503); // Provider may beat the send receipt; retry.
  const now=new Date().toISOString(), db=context.env.LOCALCLAW_DB;
  await db.batch([
    db.prepare('UPDATE model_alert_subscriptions SET enabled=0,updated_at=? WHERE user_id=?').bind(now,delivery.user_id),
    db.prepare("UPDATE model_alert_deliveries SET status='cancelled',last_error=?,updated_at=? WHERE user_id=? AND status IN ('pending','sending')").bind(event.type,now,delivery.user_id)
  ]);
  return json({ok:true});
}
