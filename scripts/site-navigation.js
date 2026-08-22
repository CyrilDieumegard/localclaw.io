const NAV_VERSION = '20260823a';

const items = [
  ['index', '/#local-ai-index', 'AI Index'],
  ['llm', '/llm-list', 'LLM'],
  ['voice', '/tts-list', 'Voice'],
  ['image', '/image-models', 'Image'],
  ['video', '/video-models', 'Video'],
  ['3d', '/3d-models', '3D'],
  ['music', '/music-models', 'Music'],
  ['vision', '/vision-models', 'Vision'],
  ['computers', '/computers', 'Computers'],
  ['ram-gpu', '/ram-gpu-for-local-ai', 'RAM/GPU'],
  ['software', '/software', 'Software'],
  ['new', '/new', 'New'],
  ['account', '/account', 'Account']
];

const modelKeys = new Set(['llm', 'voice', 'image', 'video', '3d', 'music', 'vision']);

function link([key, href, label], active) {
  const account = key === 'account' ? ' lc-global-nav__link--account' : '';
  const current = key === active ? ' aria-current="page"' : '';
  return `<a href="${href}" class="lc-global-nav__link${account}" data-nav-key="${key}"${current}>${label}</a>`;
}

function themeSwitcher(context) {
  const modifier = context === 'mobile' ? ' lc-theme-switcher--mobile' : '';
  return `<div class="lc-theme-switcher${modifier}" role="group" aria-label="Color theme" data-theme-switcher>
      <button class="lc-theme-switcher__option" type="button" data-theme-option="light" aria-label="Use light theme" aria-pressed="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>
        <span>Light</span>
      </button>
      <button class="lc-theme-switcher__option" type="button" data-theme-option="dark" aria-label="Use dark theme" aria-pressed="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20.3 15.2A9 9 0 0 1 8.8 3.7a9 9 0 1 0 11.5 11.5Z"></path></svg>
        <span>Dark</span>
      </button>
    </div>`;
}

function siteNavigation(active = '', options = {}) {
  const navigationItems = items.map(item => item[0] === 'account' && options.accountLabel
    ? [item[0], item[1], options.accountLabel]
    : item);
  const modelItems = navigationItems.filter(item => modelKeys.has(item[0]));
  const desktopItems = navigationItems.filter(item => !modelKeys.has(item[0]));
  const modelsCurrent = modelKeys.has(active) ? ' data-current="true"' : '';
  const desktopNavigation = desktopItems.map((item, index) => {
    if (index !== 1) return link(item, active);
    return `<details class="lc-global-nav__models" data-nav-models>
      <summary class="lc-global-nav__link lc-global-nav__models-summary" data-nav-group="models"${modelsCurrent}>Models</summary>
      <div class="lc-global-nav__models-panel" aria-label="Model directories">${modelItems.map(modelItem => link(modelItem, active)).join('')}</div>
    </details>${link(item, active)}`;
  }).join('');
  return `<nav class="lc-global-nav" aria-label="Main navigation">
  <div class="lc-global-nav__inner">
    <a href="/" class="lc-global-nav__brand" aria-label="LocalClaw home">
      <span class="lc-global-nav__logo"><img src="/images/crab-logo.png" width="28" height="28" alt="LocalClaw crab logo" loading="eager" decoding="async"></span>
      <span>Local<span class="lc-global-nav__brand-accent">Claw</span></span>
    </a>
    <div class="lc-global-nav__links">${desktopNavigation}</div>
    ${themeSwitcher('desktop')}
    <button class="lc-global-nav__menu-button" type="button" aria-label="Open menu" aria-controls="lc-global-mobile-menu" aria-expanded="false" data-nav-toggle>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div id="lc-global-mobile-menu" class="lc-global-nav__mobile" data-nav-mobile hidden>
    <div class="lc-global-nav__mobile-inner">
      ${themeSwitcher('mobile')}
      ${navigationItems.map(item => link(item, active)).join('')}
    </div>
  </div>
</nav>`;
}

function siteNavAssets() {
  return `<script src="/js/theme-toggle.js?v=${NAV_VERSION}"></script><link rel="stylesheet" href="/css/site-nav.css?v=${NAV_VERSION}"><script src="/js/site-nav.js?v=${NAV_VERSION}" defer></script>`;
}

module.exports = { NAV_VERSION, siteNavigation, siteNavAssets };
