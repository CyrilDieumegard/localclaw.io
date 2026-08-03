(function () {
  'use strict';

  function currentSection(pathname) {
    var path = String(pathname || '/').replace(/\.html$/, '');
    if (path === '/llm-list' || path === '/llm-detail' || path.indexOf('/models/') === 0) return 'llm';
    if (path === '/tts-list' || path.indexOf('/tts/') === 0) return 'tts';
    if (path === '/new') return 'new';
    if (path === '/computers' || path.indexOf('/hardware/') === 0) return 'computers';
    if (path === '/ram-gpu-for-local-ai' || path.indexOf('/ram/') === 0) return 'ram-gpu';
    if (path === '/blog' || path.indexOf('/blog/') === 0 || path.indexOf('/case-study/') === 0) return 'blog';
    if (path === '/software' || path === '/pricing' || path === '/download' || path.indexOf('/changelog/') === 0) return 'software';
    if (path === '/account' || path.indexOf('/account/') === 0) return 'account';
    return '';
  }

  function setOpen(button, menu, open) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
  }

  function initializeNavigation(nav) {
    var section = currentSection(window.location.pathname);
    nav.querySelectorAll('[data-nav-key]').forEach(function (link) {
      if (link.getAttribute('data-nav-key') === section) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    var button = nav.querySelector('[data-nav-toggle]');
    var menu = nav.querySelector('[data-nav-mobile]');
    if (!button || !menu) return;

    setOpen(button, menu, false);
    button.addEventListener('click', function () {
      setOpen(button, menu, button.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(button, menu, false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(button, menu, false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1120) setOpen(button, menu, false);
    });
  }

  document.querySelectorAll('.lc-global-nav').forEach(initializeNavigation);
})();
