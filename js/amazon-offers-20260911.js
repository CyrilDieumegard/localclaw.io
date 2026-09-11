// The aggregate goal is handled by DataFast's data-fast-goal listener.
// Family goals are separate series, never a second amazon_click event.
(() => {
  const familyGoals = {computers:'amazon_computers_click',gpuram:'amazon_gpuram_click',diy:'amazon_diy_click'};
  document.addEventListener('click', event => {
    const link=event.target.closest('a[data-fast-goal="amazon_click"]');
    if(!link || typeof window.datafast!=='function')return;
    const family=link.getAttribute('data-fast-goal-family');
    if(!Object.hasOwn(familyGoals,family))return;
    const props={};
    for(const key of ['family','market','country','source','product','match','attribution'])props[key]=link.getAttribute('data-fast-goal-'+key)||'';
    try { window.datafast(familyGoals[family],props); } catch { /* Shopping must work without analytics. */ }
  });
})();
