import { getRequiredSession, json, requireSameOrigin } from '../../_lib/auth.js';
import { parseJsonBody } from '../../_lib/machines.js';
import { configured, CONSENT_VERSION, validateCatalog } from '../../_lib/model-alerts.js';
import catalog from '../../../data/model-alert-catalog.json';

export async function onRequestGet(context) {
  const auth=await getRequiredSession(context);
  if(auth.response)return auth.response;
  const result=await context.env.LOCALCLAW_DB.prepare('SELECT machine_id, enabled FROM model_alert_subscriptions WHERE user_id = ?').bind(auth.session.user.id).all();
  return json({ok:true,available:configured(context.env) && auth.session.user.emailVerified === true,subscriptions:(result.results || []).map(row=>({machineId:row.machine_id,enabled:row.enabled===1}))});
}
export async function onRequestPut(context) {
  if(!requireSameOrigin(context.request))return json({ok:false,error:'invalid_origin'},403);
  const auth=await getRequiredSession(context);
  if(auth.response)return auth.response;
  const parsed=await parseJsonBody(context.request);
  if(parsed.response)return parsed.response;
  const body=parsed.value;
  if(typeof body?.enabled!=='boolean' || typeof body.machineId!=='string')return json({ok:false,error:'invalid_subscription'},422);
  const db=context.env.LOCALCLAW_DB, user=auth.session.user;
  const machine=await db.prepare('SELECT id FROM machines WHERE id = ? AND user_id = ?').bind(body.machineId,user.id).first();
  if(!machine)return json({ok:false,error:'machine_not_found'},404);
  if(body.enabled && (!configured(context.env) || !user.emailVerified))return json({ok:false,error:'alerts_unavailable',message:'Email alerts require an available service and a verified account email.'},503);
  const now=new Date().toISOString();
  if(body.enabled) {
    const previous=await db.prepare('SELECT consent_at FROM model_alert_subscriptions WHERE machine_id=?').bind(machine.id).first();
    const consentAt=new Date(Math.max(Date.now(), (Date.parse(previous?.consent_at) || 0)+1)).toISOString();
    const ids=validateCatalog(catalog).models.map(model=>model.id);
    await db.prepare(`INSERT INTO model_alert_subscriptions (machine_id,user_id,enabled,consent_version,consent_at,known_model_ids,updated_at) VALUES (?,?,1,?,?,?,?)
      ON CONFLICT(machine_id) DO UPDATE SET enabled=1,consent_version=excluded.consent_version,consent_at=excluded.consent_at,known_model_ids=excluded.known_model_ids,updated_at=excluded.updated_at
      WHERE model_alert_subscriptions.enabled=0`).bind(machine.id,user.id,CONSENT_VERSION,consentAt,JSON.stringify(ids),now).run();
  } else {
    await db.batch([
      db.prepare('UPDATE model_alert_subscriptions SET enabled=0, updated_at=? WHERE machine_id=? AND user_id=?').bind(now,machine.id,user.id),
      db.prepare("UPDATE model_alert_deliveries SET status='cancelled', updated_at=? WHERE machine_id=? AND user_id=? AND status IN ('pending','sending')").bind(now,machine.id,user.id)
    ]);
  }
  return json({ok:true,subscription:{machineId:machine.id,enabled:body.enabled}});
}
