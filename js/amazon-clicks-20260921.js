// DataFast owns amazon_click. Family series are separate, never extra purchases.
(() => {
  const goals = {computers:'amazon_computers_click',gpuram:'amazon_gpuram_click',diy:'amazon_diy_click'};
  const stores = {US:'www.amazon.com',CA:'www.amazon.ca',GB:'www.amazon.co.uk',DE:'www.amazon.de',FR:'www.amazon.fr',IT:'www.amazon.it',ES:'www.amazon.es',NL:'www.amazon.nl',PL:'www.amazon.pl',SE:'www.amazon.se'};
  const selector = 'a[data-fast-goal="amazon_click"]';
  const storeLinks = new WeakMap();
  let context = null, loading = null;
  function route(link) {
    try {
      const url = new URL(link.getAttribute('href'), window.location.href);
      return url.origin === window.location.origin && url.pathname === '/go/amazon' && url.searchParams.get('options') !== '1' ? url : null;
    } catch { return null; }
  }
  function describe(link, url) {
    const family = Object.hasOwn(goals, url.searchParams.get('family')) ? url.searchParams.get('family') : 'computers';
    const query = (url.searchParams.get('q') || '').trim().replace(/\s+/g,' ');
    const queryKey = query.toLowerCase();
    const chosen = context?.offers?.[queryKey];
    const exactMarkets = context?.exactMarkets?.[queryKey];
    const manual = url.searchParams.get('market');
    // Only server-resolved context can label the destination; a listing hint is not a country choice.
    const market = Object.hasOwn(stores, manual) ? manual : chosen?.market || context?.market || 'auto';
    const known = Object.hasOwn(stores, context?.market) && Object.hasOwn(stores, market);
    const exact = known && (chosen?.market === market || (Array.isArray(exactMarkets) && exactMarkets.includes(market)));
    const automatic = known && context.automatic && !chosen && !Object.hasOwn(stores, manual);
    const props = {
      family, source:url.searchParams.get('source') || 'unknown',
      product:(url.searchParams.get('product') || query).slice(0,80),
      market, country:context?.country || 'unknown',
      destination_host:known ? stores[market] : 'resolved_by_server', tag:'localclaw-' + family + '-20',
      match:known ? exact ? 'exact' : 'search' : 'unknown',
      attribution:known ? automatic ? 'onelink' : 'global_store' : 'unresolved', route:'direct'
    };
    // The SDK accepts at most ten custom properties, including old markup attributes.
    for (const name of link.getAttributeNames?.() || []) {
      if (name.startsWith('data-fast-goal-') && !Object.hasOwn(props,name.slice(15))) link.removeAttribute(name);
    }
    for (const [key,value] of Object.entries(props)) link.setAttribute('data-fast-goal-' + key,value);
    const label = known
      ? `${exact ? 'Check price & delivery on' : 'Search'} ${stores[market].replace('www.','')}`
      : 'Check price & delivery on Amazon';
    for (const node of link.childNodes || []) {
      if (node.nodeType === 3 && /Amazon/i.test(node.textContent)) node.textContent = label + ' ↗';
    }
    link.setAttribute('aria-label', label + ' for ' + query);
    const options = storeLinks.get(link);
    if (options) {
      const optionsLabel = known && !exact && Array.isArray(exactMarkets) && exactMarkets.length
        ? 'See exact offers by country' : 'Change Amazon store';
      if (options.textContent !== optionsLabel) options.textContent = optionsLabel;
      options.setAttribute('aria-label', optionsLabel + ' for ' + query);
    }
    return props;
  }
  function prepare(root) {
    const links = [...(root.querySelectorAll?.(selector) || [])];
    if (root.matches?.(selector)) links.push(root);
    let found = false;
    for (const link of links) {
      const url = route(link);
      if (!url) continue;
      found = true;
      link.target = '_blank';
      link.rel = 'sponsored nofollow noopener';
      if (link.dataset.amazonPrepared) {
        describe(link,url);
        continue;
      }
      link.dataset.amazonPrepared = '1';
      const options = document.createElement('a');
      const optionsUrl = new URL(url);
      optionsUrl.searchParams.set('options','1');
      options.href = optionsUrl.pathname + optionsUrl.search;
      options.className = 'amazon-options-link';
      options.setAttribute('data-fast-goal','amazon_offer_open');
      options.setAttribute('data-fast-goal-source',url.searchParams.get('source') || 'unknown');
      storeLinks.set(link, options);
      const {family} = describe(link,url);
      options.setAttribute('data-fast-goal-family',family);
      link.after(options);
    }
    if (found && !context && !loading) loadContext();
  }
  function loadContext() {
    if (loading || typeof fetch !== 'function') return;
    loading = Promise.resolve().then(() => fetch('/go/amazon?context=1', {
      credentials:'same-origin', cache:'no-store',
      ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? {signal:AbortSignal.timeout(2500)} : {})
    })).then(response => response.ok ? response.json() : null).then(value => {
      if (value && Object.hasOwn(stores,value.market)) context = value;
    }).catch(() => {}).finally(() => {
      // Keep a failed request from creating a retry loop on every DOM mutation.
      if (!context) context = {};
      loading = null;
      prepare(document);
    });
  }
  document.addEventListener('click', event => {
    if (event.isTrusted === false) return;
    const link = event.target.closest?.(selector);
    if (!link || typeof window.datafast !== 'function') return;
    const url = route(link);
    if (!url) return;
    const props = describe(link,url);
    try { window.datafast(goals[props.family],props); } catch { /* Shopping works without analytics. */ }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    context = null;
    loadContext();
  });
  prepare(document);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) prepare(node);
  }).observe(document.body,{childList:true,subtree:true});
})();
