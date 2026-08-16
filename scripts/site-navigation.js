const NAV_VERSION = '20260816b';

const items = [
  ['index', '/#local-ai-index', 'AI Index'],
  ['llm', '/llm-list', 'LLM'],
  ['voice', '/tts-list', 'Voice'],
  ['image', '/image-models', 'Image'],
  ['video', '/video-models', 'Video'],
  ['3d', '/3d-models', '3D'],
  ['music', '/music-models', 'Music'],
  ['vision', '/vision-models', 'Vision'],
  ['new', '/new', 'New'],
  ['account', '/account', 'Account']
];

function link([key, href, label], active) {
  const account = key === 'account' ? ' lc-global-nav__link--account' : '';
  const current = key === active ? ' aria-current="page"' : '';
  return `<a href="${href}" class="lc-global-nav__link${account}" data-nav-key="${key}"${current}>${label}</a>`;
}

function siteNavigation(active = '', options = {}) {
  const navigationItems = items.map(item => item[0] === 'account' && options.accountLabel
    ? [item[0], item[1], options.accountLabel]
    : item);
  return `<nav class="lc-global-nav" aria-label="Main navigation">
  <div class="lc-global-nav__inner">
    <a href="/" class="lc-global-nav__brand" aria-label="LocalClaw home">
      <span class="lc-global-nav__logo"><img src="/images/crab-logo.png" width="28" height="28" alt="LocalClaw crab logo" loading="eager" decoding="async"></span>
      <span>Local<span class="lc-global-nav__brand-accent">Claw</span></span>
    </a>
    <div class="lc-global-nav__links">${navigationItems.map(item => link(item, active)).join('')}</div>
    <button class="lc-global-nav__menu-button" type="button" aria-label="Open menu" aria-controls="lc-global-mobile-menu" aria-expanded="false" data-nav-toggle>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="lc-global-mobile-menu" class="lc-global-nav__mobile" data-nav-mobile hidden>
    <div class="lc-global-nav__mobile-inner">${navigationItems.map(item => link(item, active)).join('')}</div>
  </div>
</nav>`;
}

function siteNavAssets() {
  return `<link rel="stylesheet" href="/css/site-nav.css?v=${NAV_VERSION}"><script src="/js/site-nav.js?v=${NAV_VERSION}" defer></script>`;
}

module.exports = { NAV_VERSION, siteNavigation, siteNavAssets };
