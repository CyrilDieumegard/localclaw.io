(() => {
    const VIDEO_SELECTOR = '[data-lc-youtube-id]';

    function loadVideo(trigger) {
        const videoId = trigger.dataset.lcYoutubeId;
        const shell = trigger.closest('[data-lc-video-shell]');
        if (!videoId || !shell || shell.dataset.lcVideoLoaded === 'true') return;

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
        iframe.title = trigger.dataset.lcVideoTitle || 'LocalClaw product demo';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.className = 'lc-case-video-frame';

        shell.dataset.lcVideoLoaded = 'true';
        shell.replaceChildren(iframe);
    }

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest(VIDEO_SELECTOR);
        if (!trigger) return;
        loadVideo(trigger);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const trigger = event.target.closest(VIDEO_SELECTOR);
        if (!trigger) return;
        event.preventDefault();
        loadVideo(trigger);
    });
})();
