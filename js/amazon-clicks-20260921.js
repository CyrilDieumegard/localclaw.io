// DataFast owns the aggregate amazon_click. This listener adds one family series.
// First clicks now leave for Amazon; optional store choices remain a separate step.
(() => {
  const goals = {computers:'amazon_computers_click',gpuram:'amazon_gpuram_click',diy:'amazon_diy_click'};
  function route(link) {
    try {
      const url = new URL(link.getAttribute('href'), window.location.href);
      return url.origin === window.location.origin && url.pathname === '/go/amazon' && url.searchParams.get('options') !== '1' ? url : null;
    } catch { return null; }
  }
  function prepare(root) {
    const links = [...(root.querySelectorAll?.('a[data-fast-goal="amazon_click"]') || [])];
    if (root.matches?.('a[data-fast-goal="amazon_click"]')) links.push(root);
    for (const link of links) {
      const url = route(link);
      if (!url || link.dataset.amazonPrepared) continue;
      link.dataset.amazonPrepared = '1';
      const family = url.searchParams.get('family');
      link.setAttribute('data-fast-goal-family', Object.hasOwn(goals, family) ? family : 'computers');
      link.setAttribute('data-fast-goal-route', 'direct');
      link.setAttribute('data-fast-goal-attribution', 'onelink');
      // Keep the source page alive so analytics do not compete with unloading it.
      link.target = '_blank';
      link.rel = 'sponsored nofollow noopener';
      const options = document.createElement('a');
      url.searchParams.set('options', '1');
      options.href = url.pathname + url.search;
      options.className = 'amazon-options-link';
      options.textContent = 'Choose Amazon store';
      options.setAttribute('aria-label', 'Choose Amazon store for ' + (url.searchParams.get('q') || 'this product'));
      options.setAttribute('data-fast-goal', 'amazon_offer_open');
      options.setAttribute('data-fast-goal-family', link.getAttribute('data-fast-goal-family'));
      options.setAttribute('data-fast-goal-source', url.searchParams.get('source') || 'unknown');
      link.after(options);
    }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-fast-goal="amazon_click"]');
    if (!link || typeof window.datafast !== 'function') return;
    const url = route(link);
    if (!url) return;
    const family = Object.hasOwn(goals, url.searchParams.get('family')) ? url.searchParams.get('family') : 'computers';
    const props = {
      family, source:url.searchParams.get('source') || 'unknown',
      product:(url.searchParams.get('product') || url.searchParams.get('q') || '').slice(0,80),
      market:'US', destination_host:'www.amazon.com', tag:'localclaw-' + family + '-20',
      attribution:'onelink', route:'direct'
    };
    try { window.datafast(goals[family], props); } catch { /* Shopping works without analytics. */ }
  });
  prepare(document);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) prepare(node);
  }).observe(document.body, {childList:true, subtree:true});
})();
