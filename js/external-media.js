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
    const items = Array.isArray(entry.items) && entry.items.length ? entry.items : [entry];
    const primaryKind = items[0].kind || entry.kind;
    container.dataset.mediaReady = 'true';
    container.classList.add(`lc-external-media-${primaryKind}`);
    if (items.length > 1 && !container.classList.contains('lc-external-media-compact')) {
      container.classList.add('lc-external-media-gallery');
    }
    container.innerHTML = `
      <div class="lc-external-media-stage"></div>
      <div class="lc-external-media-meta">
        <span>Streamed from the official source</span>
        <a href="${entry.sourceUrl}" target="_blank" rel="noopener nofollow">${entry.sourceLabel}</a>
      </div>`;
    renderMedia(container, entry, items);
  }

  function showError(container, entry) {
    const stage = container.querySelector('.lc-external-media-stage');
    if (!stage) return;
    stage.innerHTML = `<p class="lc-external-media-error">The external preview could not be loaded. <a href="${entry.sourceUrl}" target="_blank" rel="noopener nofollow">Open the official source</a>.</p>`;
  }

  function createMedia(container, entry, item) {
    let media;
    if (item.kind === 'audio') {
      media = document.createElement('audio');
      media.controls = true;
      media.preload = 'metadata';
    } else if (item.kind === 'video') {
      media = document.createElement('video');
      media.controls = true;
      media.preload = 'metadata';
      media.playsInline = true;
    } else {
      media = document.createElement('img');
      media.loading = 'lazy';
      media.decoding = 'async';
      media.referrerPolicy = 'no-referrer';
      media.alt = item.alt || entry.alt || 'Official external model example';
    }
    media.className = 'lc-external-media-object';
    if (item.kind === 'audio' || item.kind === 'video') media.pause();
    return media;
  }

  function renderMedia(container, entry, items) {
    const stage = container.querySelector('.lc-external-media-stage');
    if (!entry || !stage || container.dataset.mediaLoaded === 'true') return;
    container.dataset.mediaLoaded = 'true';

    const visibleItems = container.classList.contains('lc-external-media-compact') ? items.slice(0, 1) : items;
    if (visibleItems.length > 1) {
      const gallery = document.createElement('div');
      gallery.className = 'lc-external-media-gallery-grid';
      visibleItems.forEach((item) => {
        const figure = document.createElement('figure');
        figure.className = 'lc-external-media-gallery-item';
        const media = createMedia(container, entry, item);
        media.addEventListener('error', () => {
          figure.remove();
          if (!gallery.children.length) showError(container, entry);
        }, { once: true });
        media.src = item.url;
        figure.appendChild(media);
        if (item.caption) {
          const caption = document.createElement('figcaption');
          caption.textContent = item.caption;
          figure.appendChild(caption);
        }
        gallery.appendChild(figure);
      });
      stage.appendChild(gallery);
      return;
    }

    const media = createMedia(container, entry, visibleItems[0]);
    media.addEventListener('error', () => showError(container, entry), { once: true });
    media.src = visibleItems[0].url;
    stage.appendChild(media);
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
