(function () {
  'use strict';

  function currentSection(pathname) {
    var path = String(pathname || '/').replace(/\.html$/, '');
    if (path === '/' || path === '/index') return 'index';
    if (path === '/llm-list' || path === '/llm-detail' || path.indexOf('/models/') === 0 || path.indexOf('/use-case/') === 0 || path.indexOf('/guides/best-local-llms') === 0) return 'llm';
    if (path === '/tts-list' || path.indexOf('/tts/') === 0 || path.indexOf('/guides/best-local-tts') === 0) return 'voice';
    if (path === '/image-models' || path.indexOf('/image/') === 0) return 'image';
    if (path === '/video-models' || path.indexOf('/video/') === 0) return 'video';
    if (path === '/3d-models' || path.indexOf('/3d/') === 0) return '3d';
    if (path === '/music-models' || path.indexOf('/music/') === 0) return 'music';
    if (path === '/vision-models' || path.indexOf('/vision/') === 0) return 'vision';
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
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(button, menu, false);
        button.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1240) setOpen(button, menu, false);
    });
  }

  document.querySelectorAll('.lc-global-nav').forEach(initializeNavigation);
})();
