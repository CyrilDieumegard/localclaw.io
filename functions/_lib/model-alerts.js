import '../../js/model-ranking.js';

export const CONSENT_VERSION = 'model-releases-2026-11-01';
export const ALERT_ORIGIN = 'https://localclaw.io';
const ranking = globalThis.LocalClawModelRanking;
const enc = new TextEncoder();
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function configured(env) { return env.MODEL_ALERTS_ENABLED === 'true' && String(env.MODEL_ALERTS_UNSUBSCRIBE_SECRET || '').length >= 32; }
export function validateCatalog(data) {
  if (data?.version !== 1 || !Array.isArray(data.models) || data.models.length < 1 || data.models.length > 2000) throw new Error('invalid_catalog');
  const seen = new Set();
  for (const model of data.models) {
    if (!/^[a-z0-9][a-z0-9._-]{0,119}$/i.test(model?.id || '') || seen.has(model.id) || typeof model.name !== 'string' || !Number.isFinite(Number(model.size_gb)) || Number(model.size_gb) <= 0 || model.hosted_only) throw new Error('invalid_catalog');
    seen.add(model.id);
  }
  return data;
}
export function knownIds(value) { try { const ids = JSON.parse(value); return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []; } catch { return []; } }
export function newMatches(machine, catalog, baseline) {
  const known = new Set(baseline);
  return ranking.rankModels(machine, {}, catalog.models, {includeTight:false}).allCompatible.filter(model => !known.has(model.id));
}
function bytesFromBase64(value) { return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0)); }
async function key(secret) { return crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'},false,['sign','verify']); }
export async function unsubscribeToken(secret, row) {
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(`${row.machine_id}|${row.consent_at}`)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export async function verifyUnsubscribe(secret, row, token) {
  if (!row || !/^[A-Za-z0-9_-]{43}$/.test(token || '') || String(secret || '').length < 32) return false;
  return crypto.subtle.verify('HMAC', await key(secret), bytesFromBase64(token), enc.encode(`${row.machine_id}|${row.consent_at}`));
}
export async function deliveryId(machineId, consentAt, modelIds) {
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(`${machineId}|${consentAt}|${[...modelIds].sort().join(',')}`));
  return 'model-alert-' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,'0')).join('');
}
export async function buildEmail(env, row, machine, models, email) {
  const token = await unsubscribeToken(env.MODEL_ALERTS_UNSUBSCRIBE_SECRET, row);
  const unsubscribe = `${ALERT_ORIGIN}/api/model-alerts/unsubscribe?machine=${encodeURIComponent(row.machine_id)}&token=${token}`;
  const updates = `${ALERT_ORIGIN}/account?view=updates&fitMachine=${encodeURIComponent(row.machine_id)}`;
  const subject = `${models.length} new local AI ${models.length === 1 ? 'model fits' : 'models fit'} your ${machine.ramGb}GB setup`;
  const intro = `New catalogue additions match your saved ${machine.ramGb}GB machine and ${machine.useCase} workload. Compatibility is a sizing estimate; actual speed depends on your setup.`;
  const lines = models.slice(0,5).map(model => `${model.name}: ${ALERT_ORIGIN}/models/${encodeURIComponent(model.id)}`);
  return {
    from: env.MODEL_ALERTS_FROM,
    to: [email],
    reply_to: 'helplocalclaw@gmail.com',
    subject,
    text: `LocalClaw\n\n${intro}\n\n${lines.join('\n')}\n\nView all updates: ${updates}\n\nYou requested model alerts for this machine in My Machines.\nUnsubscribe: ${unsubscribe}\nLocalClaw: ${ALERT_ORIGIN}`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#faf9f6;color:#111827;font-family:Arial,sans-serif"><main style="max-width:560px;margin:auto;padding:32px 20px"><p style="font-weight:bold;color:#c92f28">LOCALCLAW</p><h1 style="font-size:25px">New models for your ${machine.ramGb}GB setup</h1><p style="line-height:1.6">${escapeHtml(intro)}</p><ul>${models.slice(0,5).map(model=>`<li style="margin:16px 0"><a style="color:#a92520" href="${ALERT_ORIGIN}/models/${encodeURIComponent(model.id)}">${escapeHtml(model.name)}</a></li>`).join('')}</ul><p style="margin:28px 0"><a href="${escapeHtml(updates)}" style="display:inline-block;padding:14px 20px;background:#c92f28;color:white;border-radius:8px;text-decoration:none">View my Plan updates</a></p><p style="font-size:12px;line-height:1.6;color:#475569">You requested model alerts for this machine in My Machines.<br><a href="${escapeHtml(unsubscribe)}" style="color:#475569">Unsubscribe from these alerts</a> · <a href="${ALERT_ORIGIN}" style="color:#475569">LocalClaw</a></p></main></body></html>`,
    headers: {'List-Unsubscribe':`<${unsubscribe}>`, 'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}
  };
}
export async function verifyWebhook(request, secret, raw, now = Date.now()) {
  const id=request.headers.get('svix-id'), timestamp=request.headers.get('svix-timestamp');
  if (!id || !/^\d+$/.test(timestamp || '') || Math.abs(now/1000-Number(timestamp))>300 || !secret?.startsWith('whsec_')) return false;
  const k=await crypto.subtle.importKey('raw',bytesFromBase64(secret.slice(6)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  for(const signature of (request.headers.get('svix-signature') || '').split(' ')) {
    const [version,value]=signature.split(',');
    if(version !== 'v1' || !value) continue;
    try { if(await crypto.subtle.verify('HMAC',k,bytesFromBase64(value),enc.encode(`${id}.${timestamp}.${raw}`)))return true; } catch {}
  }
  return false;
}
