(function () {
  'use strict';
  let available=false, ready=false, machine=null, subscriptions=[], busy=false, message='', error=false;
  const escape=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.addEventListener('localclaw:account-ready', async () => {
    try {
      const response=await fetch('/api/model-alerts',{credentials:'same-origin',headers:{Accept:'application/json'}});
      const data=await response.json();
      if(!response.ok)throw Error('Email preferences are temporarily unavailable. Reload to try again.');
      available=data.available===true;
      subscriptions=Array.isArray(data.subscriptions)?data.subscriptions:[];
      ready=true;render();updateChoice();
    } catch(e) {message=e.message;error=true;ready=true;render();}
  });
  document.addEventListener('localclaw:machine-rendered',event=>{machine=event.detail.machine;message='';error=false;render();});
  document.addEventListener('localclaw:ram-follow-review',updateChoice);
  document.addEventListener('localclaw:ram-follow-activated',event=>{
    if(event.detail.emailRequested)save(true,event.detail.machine.id);
  });
  function updateChoice() {
    const choice=document.getElementById('machine-email-choice');
    const checkbox=document.getElementById('machine-email-alerts');
    if(!choice || !checkbox)return;
    choice.hidden=!available;
    checkbox.checked=false;
  }
  function render() {
    const root=document.querySelector('[data-model-alert-settings]');
    if(!root || !machine || !ready)return;
    const enabled=subscriptions.some(s=>s.machineId===machine.id&&s.enabled);
    root.innerHTML=`<div class="lc-email-alert-panel"><h3>Email alerts for this machine</h3><p>${enabled?'Enabled. We email your account address when new compatible models are added, at most once a day.':'Get an email when new models fit this hardware and workload. At most one update a day, only when there is something new.'}</p>${available||enabled?`<button class="lc-button${enabled?'':' lc-button-primary'}" type="button" data-toggle-model-alerts ${busy?'disabled':''}>${busy?'Saving…':enabled?'Turn off email alerts':'Enable email alerts'}</button>`:'<p>Email alerts are temporarily unavailable.</p>'}<p role="status" ${error?'style="color:#b91c1c"':''}>${escape(message)}</p><p><a href="/privacy">Email privacy details</a> · Unsubscribe from any alert.</p></div>`;
    root.querySelector('[data-toggle-model-alerts]')?.addEventListener('click',()=>save(!enabled,machine.id));
  }
  async function save(enabled,machineId) {
    if(busy)return;
    busy=true;message='';error=false;render();
    try {
      const response=await fetch('/api/model-alerts',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({machineId,enabled})});
      const data=await response.json();
      if(!response.ok)throw Error(data.message || 'Email alerts could not be saved. Please try again.');
      subscriptions=subscriptions.filter(s=>s.machineId!==machineId).concat(data.subscription);
      message=enabled?'Email alerts enabled. We will send the next new compatible releases to your account email.':'Email alerts turned off.';
      window.LocalClawAccountAnalytics?.track(enabled?'model_email_alerts_enabled':'model_email_alerts_disabled',{source:'account_workspace'});
    } catch(e) {message=e.message;error=true;}
    finally {busy=false;render();}
  }
})();
