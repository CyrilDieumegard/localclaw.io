import { verifyUnsubscribe, escapeHtml } from '../../_lib/model-alerts.js';
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"};
function page(text,form='',status=200) {return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>LocalClaw email alerts</title><body style="font:18px Arial,sans-serif;max-width:540px;margin:12vh auto;padding:24px"><h1>LocalClaw email alerts</h1><p>${text}</p>${form}</body></html>`,{status,headers});}
async function owned(context) {
  const url=new URL(context.request.url), machineId=url.searchParams.get('machine');
  if(!machineId || machineId.length>80)return null;
  const row=await context.env.LOCALCLAW_DB.prepare('SELECT machine_id, consent_at FROM model_alert_subscriptions WHERE machine_id=?').bind(machineId).first();
  return await verifyUnsubscribe(context.env.MODEL_ALERTS_UNSUBSCRIBE_SECRET,row,url.searchParams.get('token')) ? row : null;
}
export async function onRequestGet(context) {
  const row=await owned(context);
  if(!row)return page('This unsubscribe link is invalid or has been replaced. You can manage alerts in My Machines.', '',400);
  return page('Stop email alerts for this machine?',`<form method="post" action="${escapeHtml(context.request.url)}"><button style="padding:14px 24px">Unsubscribe</button></form>`);
}
export async function onRequestPost(context) {
  const row=await owned(context);
  if(!row)return page('This unsubscribe link is invalid or has been replaced.','',400);
  const now=new Date().toISOString(), db=context.env.LOCALCLAW_DB;
  await db.batch([
    db.prepare('UPDATE model_alert_subscriptions SET enabled=0,updated_at=? WHERE machine_id=? AND consent_at=?').bind(now,row.machine_id,row.consent_at),
    db.prepare("UPDATE model_alert_deliveries SET status='cancelled',updated_at=? WHERE machine_id=? AND consent_at=? AND status IN ('pending','sending')").bind(now,row.machine_id,row.consent_at)
  ]);
  return page('You are unsubscribed. Your saved machine remains available in My Machines.');
}
