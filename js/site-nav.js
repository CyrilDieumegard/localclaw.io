(function () {
  'use strict';

  function currentSection(pathname) {
    var path = String(pathname || '/').replace(/\.html$/, '');
    if (path === '/' || path === '/index') return 'index';
    if (path === '/local-ai-activity-index') return 'atlas';
    if (path === '/llm-list' || path === '/llm-detail' || path.indexOf('/models/') === 0 || path.indexOf('/use-case/') === 0 || path.indexOf('/guides/best-local-llms') === 0) return 'llm';
    if (path === '/tts-list' || path.indexOf('/tts/') === 0 || path.indexOf('/guides/best-local-tts') === 0) return 'voice';
    if (path === '/image-models' || path.indexOf('/image/') === 0) return 'image';
    if (path === '/video-models' || path.indexOf('/video/') === 0) return 'video';
    if (path === '/3d-models' || path.indexOf('/3d/') === 0) return '3d';
    if (path === '/music-models' || path.indexOf('/music/') === 0) return 'music';
    if (path === '/vision-models' || path.indexOf('/vision/') === 0) return 'vision';
    if (path === '/new') return 'new';
    if (path === '/charts') return 'charts';
    if (path === '/diy' || path.indexOf('/diy/') === 0) return 'diy';
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
    var modelSections = ['llm', 'voice', 'image', 'video', '3d', 'music', 'vision'];
    if (modelSections.indexOf(section) >= 0) section = 'index';
    nav.querySelectorAll('[data-nav-key]').forEach(function (link) {
      if (link.getAttribute('data-nav-key') === section) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    var dropdowns = nav.querySelectorAll('[data-nav-dropdown]');
    function closeDropdowns() {
      dropdowns.forEach(function (dropdown) { dropdown.open = false; });
    }
    dropdowns.forEach(function (dropdown) {
      var summary = dropdown.querySelector('summary');
      if (dropdown.querySelector('[aria-current="page"]')) summary.setAttribute('data-current', 'true');
      else summary.removeAttribute('data-current');
      dropdown.addEventListener('click', function (event) {
        if (event.target.closest('a')) dropdown.open = false;
      });
      dropdown.addEventListener('focusout', function (event) {
        if (!dropdown.contains(event.relatedTarget)) dropdown.open = false;
      });
      dropdown.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && dropdown.open) {
          event.preventDefault();
          event.stopPropagation();
          dropdown.open = false;
          summary.focus();
        }
      });
    });
    document.addEventListener('click', function (event) {
      dropdowns.forEach(function (dropdown) {
        if (!dropdown.contains(event.target)) dropdown.open = false;
      });
    });

    var button = nav.querySelector('[data-nav-toggle]');
    var menu = nav.querySelector('[data-nav-mobile]');
    if (!button || !menu) return;

    setOpen(button, menu, false);
    button.addEventListener('click', function () {
      closeDropdowns();
      setOpen(button, menu, button.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        closeDropdowns();
        setOpen(button, menu, false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        closeDropdowns();
        setOpen(button, menu, false);
        button.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target)) setOpen(button, menu, false);
    });

    var mobileLayout = window.matchMedia('(max-width: 980px)');
    mobileLayout.addEventListener('change', function () {
      closeDropdowns();
      setOpen(button, menu, false);
    });
  }

  document.querySelectorAll('.lc-global-nav').forEach(initializeNavigation);
})();
