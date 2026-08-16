(function initExternalMedia() {
  'use strict';

  const catalog = window.LOCAL_AI_EXTERNAL_MEDIA || {};

  function entryFor(container) {
    const category = container.dataset.mediaCategory;
    const id = container.dataset.mediaId;
    return category && id && catalog[category] ? catalog[category][id] : null;
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
      <div class="lc-external-media-stage"></div>
      <div class="lc-external-media-meta">
        <span>Streamed from the official source</span>
        <a href="${entry.sourceUrl}" target="_blank" rel="noopener nofollow">${entry.sourceLabel}</a>
      </div>`;
    renderMedia(container, entry);
  }

  function showError(container, entry) {
    const stage = container.querySelector('.lc-external-media-stage');
    if (!stage) return;
    stage.innerHTML = `<p class="lc-external-media-error">The external preview could not be loaded. <a href="${entry.sourceUrl}" target="_blank" rel="noopener nofollow">Open the official source</a>.</p>`;
  }

  function renderMedia(container, entry) {
    const stage = container.querySelector('.lc-external-media-stage');
    if (!entry || !stage || container.dataset.mediaLoaded === 'true') return;
    container.dataset.mediaLoaded = 'true';

    let media;
    if (entry.kind === 'audio') {
      media = document.createElement('audio');
      media.controls = true;
      media.preload = 'metadata';
    } else if (entry.kind === 'video') {
      media = document.createElement('video');
      media.controls = true;
      media.preload = 'metadata';
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
    if (entry.kind === 'audio' || entry.kind === 'video') media.pause();
  }

  function hydrateWithin(root) {
    if (root.matches && root.matches('[data-external-media]')) hydrate(root);
    if (root.querySelectorAll) root.querySelectorAll('[data-external-media]').forEach(hydrate);
  }

  hydrateWithin(document);
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) hydrateWithin(node);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
