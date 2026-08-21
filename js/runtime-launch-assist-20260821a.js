(function () {
  'use strict';

  var APP_INFO = {
    lmstudio: { name: 'LM Studio', download: 'https://lmstudio.ai/download' },
    unsloth: { name: 'Unsloth Desktop', download: 'https://unsloth.ai/' }
  };

  function cleanValue(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  }

  function trackingPayload(link, platform, target) {
    return {
      source: 'runtime_launch_assist',
      platform: platform,
      model: cleanValue(link.getAttribute('data-fast-goal-model')),
      target: target
    };
  }

  function track(name, link, platform, target) {
    var payload = trackingPayload(link, platform, target);
    try {
      if (typeof window.datafast === 'function') window.datafast(name, payload);
    } catch (error) {
      // Analytics must never interrupt the launch flow.
    }
    try {
      if (typeof window.localClawPostHogCapture === 'function') {
        window.localClawPostHogCapture(name, payload);
      }
    } catch (error) {
      // Analytics must never interrupt the launch flow.
    }
  }

  function sourceUrl(container) {
    var source = container.querySelector('a[data-runtime="huggingface"], a[data-fast-goal="model_install_huggingface"]');
    return source && /^https:\/\/huggingface\.co\//.test(source.href) ? source.href : '';
  }

  function assistPanel(container) {
    var panel = container.querySelector('[data-runtime-launch-assist]');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.className = 'runtime-launch-assist';
    panel.hidden = true;
    panel.setAttribute('data-runtime-launch-assist', '');
    panel.setAttribute('data-state', 'waiting');
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = '<div class="runtime-launch-assist-head"><div><span class="runtime-launch-assist-kicker" data-runtime-launch-kicker>Desktop app handoff</span><strong data-runtime-launch-title>Did the app open?</strong><p data-runtime-launch-copy>The download happens inside the desktop app. LocalClaw cannot confirm it from this browser.</p></div><button class="runtime-launch-assist-close" type="button" data-runtime-launch-close aria-label="Close launch help">&times;</button></div><div class="runtime-launch-assist-actions"><button type="button" data-runtime-launch-confirm>It opened</button><a href="#" target="_blank" rel="noopener" data-runtime-launch-download>Get the app</a><a href="#" target="_blank" rel="noopener" data-runtime-launch-source>Open model files</a></div>';
    container.appendChild(panel);
    return panel;
  }

  function configurePanel(container, link, platform) {
    var info = APP_INFO[platform];
    var panel = assistPanel(container);
    var files = sourceUrl(container);
    panel.hidden = false;
    panel.setAttribute('data-state', 'waiting');
    panel.setAttribute('data-runtime', platform);
    panel._launchLink = link;
    panel.querySelector('[data-runtime-launch-kicker]').textContent = 'Opening ' + info.name;
    panel.querySelector('[data-runtime-launch-title]').textContent = 'Did ' + info.name + ' open?';
    panel.querySelector('[data-runtime-launch-copy]').textContent = 'This opens the model download screen inside the desktop app. LocalClaw cannot confirm that the download completed.';

    var download = panel.querySelector('[data-runtime-launch-download]');
    download.href = info.download;
    download.textContent = 'Get ' + info.name;

    var source = panel.querySelector('[data-runtime-launch-source]');
    source.hidden = !files;
    if (files) source.href = files;
    return panel;
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    var launchLink = target.closest('a[href^="lmstudio://"], a[href^="unsloth://"]');
    if (launchLink) {
      var platform = launchLink.href.indexOf('lmstudio://') === 0 ? 'lmstudio' : 'unsloth';
      var container = launchLink.closest('[data-model-run-options], [data-install-choice]');
      if (!container) return;
      configurePanel(container, launchLink, platform);
      track('model_runtime_launch_requested', launchLink, platform, 'desktop_app');
      return;
    }

    var panel = target.closest('[data-runtime-launch-assist]');
    if (!panel || !panel._launchLink) return;
    var panelPlatform = panel.getAttribute('data-runtime') || '';

    if (target.closest('[data-runtime-launch-close]')) {
      panel.hidden = true;
      return;
    }

    if (target.closest('[data-runtime-launch-confirm]')) {
      var confirm = panel.querySelector('[data-runtime-launch-confirm]');
      panel.setAttribute('data-state', 'confirmed');
      panel.querySelector('[data-runtime-launch-kicker]').textContent = 'App opened';
      panel.querySelector('[data-runtime-launch-title]').textContent = 'Continue the download in the app';
      panel.querySelector('[data-runtime-launch-copy]').textContent = 'Choose the recommended quantization shown on this page. Opening the app is confirmed; the model download is not yet verified.';
      confirm.textContent = 'Opening confirmed';
      confirm.disabled = true;
      track('model_runtime_launch_confirmed', panel._launchLink, panelPlatform, 'user_reported_app_open');
      return;
    }

    if (target.closest('[data-runtime-launch-download]')) {
      track('model_runtime_help_opened', panel._launchLink, panelPlatform, 'app_download');
      return;
    }

    if (target.closest('[data-runtime-launch-source]')) {
      track('model_runtime_help_opened', panel._launchLink, panelPlatform, 'model_files');
    }
  });
})();
