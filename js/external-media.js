(function initExternalMedia() {
  'use strict';

  const catalog = window.LOCAL_AI_EXTERNAL_MEDIA || {};

  function entryFor(container) {
    const category = container.dataset.mediaCategory;
    const id = container.dataset.mediaId;
    return category && id && catalog[category] ? catalog[category][id] : null;
  }

  function actionLabel(kind) {
    if (kind === 'audio') return 'Listen to official sample';
    if (kind === 'video') return 'Watch official example';
    return 'Load official example';
  }

  function hydrate(container) {
    if (container.dataset.mediaReady === 'true') return;
    const entry = entryFor(container);
    if (!entry) {
      container.remove();
      return;
    }
    container.dataset.mediaReady = 'true';
    container.classList.add(`lc-external-media-${entry.kind}`);
    container.innerHTML = `
      <div class="lc-external-media-stage">
        <button class="lc-external-media-load" type="button" data-external-media-load>${actionLabel(entry.kind)}</button>
      </div>
      <div class="lc-external-media-meta">
        <span>External media, not hosted by LocalClaw</span>
        <a href="${entry.sourceUrl}" target="_blank" rel="noopener nofollow">${entry.sourceLabel}</a>
      </div>`;
  }

  function showError(container, entry) {
    const stage = container.querySelector('.lc-external-media-stage');
    if (!stage) return;
    stage.innerHTML = `<p class="lc-external-media-error">The external preview could not be loaded. <a href="${entry.sourceUrl}" target="_blank" rel="noopener nofollow">Open the official source</a>.</p>`;
  }

  function load(container) {
    const entry = entryFor(container);
    const stage = container.querySelector('.lc-external-media-stage');
    if (!entry || !stage || container.dataset.mediaLoaded === 'true') return;
    container.dataset.mediaLoaded = 'true';
    stage.textContent = '';

    let media;
    if (entry.kind === 'audio') {
      media = document.createElement('audio');
      media.controls = true;
      media.preload = 'none';
    } else if (entry.kind === 'video') {
      media = document.createElement('video');
      media.controls = true;
      media.preload = 'none';
      media.playsInline = true;
    } else {
      media = document.createElement('img');
      media.loading = 'lazy';
      media.decoding = 'async';
      media.referrerPolicy = 'no-referrer';
      media.alt = entry.alt || 'Official external model example';
    }
    media.className = 'lc-external-media-object';
    media.addEventListener('error', () => showError(container, entry), { once: true });
    media.src = entry.url;
    stage.appendChild(media);
  }

  function hydrateWithin(root) {
    if (root.matches && root.matches('[data-external-media]')) hydrate(root);
    if (root.querySelectorAll) root.querySelectorAll('[data-external-media]').forEach(hydrate);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-external-media-load]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const container = button.closest('[data-external-media]');
    if (container) load(container);
  });

  hydrateWithin(document);
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) hydrateWithin(node);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
