(function () {
  'use strict';

  function track(name, properties) {
    if (typeof window.datafast !== 'function') return;
    try { window.datafast(name, properties || {}); } catch (_) {}
  }

  var project = document.querySelector('[data-diy-project]')?.getAttribute('data-diy-project')
    || document.querySelector('[data-fast-goal-project]')?.getAttribute('data-fast-goal-project')
    || 'directory';

  track('diy_page_view', {
    project: project,
    page_type: document.querySelector('.diy-detail') ? 'project' : 'directory'
  });

  var video = document.querySelector('[data-diy-video]');
  if (video) {
    var play = video.querySelector('.diy-video__play');
    play?.addEventListener('click', function () {
      var id = video.getAttribute('data-video-id');
      var title = video.getAttribute('data-video-title') || 'Original project video';
      if (!id || video.querySelector('iframe')) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&cc_load_policy=1';
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      video.replaceChildren(iframe);
      track('diy_video_play', { project: project, video_id: id, provider: 'youtube' });
    });
  }

  document.querySelectorAll('[data-copy-target]').forEach(function (button) {
    button.addEventListener('click', async function () {
      var target = document.getElementById(button.getAttribute('data-copy-target'));
      var value = target?.innerText || '';
      if (!value) return;
      var original = button.textContent;
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Copied';
        track('diy_copy_command', {
          project: project,
          label: button.getAttribute('data-copy-label') || 'commands'
        });
      } catch (_) {
        button.textContent = 'Select text';
      }
      window.setTimeout(function () { button.textContent = original; }, 1800);
    });
  });
})();
