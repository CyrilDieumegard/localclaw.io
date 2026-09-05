(function () {
    'use strict';

    var controls = document.getElementById('pricing-tour-controls');
    var play = document.getElementById('pricing-tour-play');
    var progress = document.getElementById('pricing-tour-progress');
    var clock = document.getElementById('pricing-tour-time');
    var status = document.getElementById('pricing-tour-status');
    if (!controls || !play || !progress || !clock || !status || typeof window.setPricingSlide !== 'function') return;

    var chapters = [
        {
            slide: 1,
            title: '1. Set up with guided checks',
            caption: 'Choose local, cloud or OAuth mode and review the checks before installing OpenClaw.'
        },
        {
            slide: 6,
            title: '2. Choose the model for your work',
            caption: 'Review your active model and its health. Use local models with LM Studio, or connect a cloud or OAuth provider.'
        },
        {
            slide: 4,
            title: '3. Start your first conversation',
            caption: 'Open Chat once your setup is ready. Keep the selected model, project conversations and chat memory in view.'
        }
    ];
    var chapterButtons = Array.from(controls.querySelectorAll('[data-tour-chapter]'));
    var elapsed = 0;
    var duration = 45000;
    var selected = -1;
    var started = false;
    var running = false;
    var timer = null;
    var lastTick = 0;

    function track(name) {
        if (typeof window.datafast === 'function') window.datafast(name, { source: 'pricing_tour' });
    }

    function showChapter(index) {
        if (index === selected) return;
        selected = index;
        var chapter = chapters[index];
        window.setPricingSlide(chapter.slide);
        document.getElementById('pricing-carousel-title').textContent = chapter.title;
        document.getElementById('pricing-carousel-caption').textContent = chapter.caption;
        chapterButtons.forEach(function (button, i) {
            button.setAttribute('aria-pressed', String(i === index));
        });
        status.textContent = chapter.title + '. ' + chapter.caption;
    }

    function updateControls() {
        var seconds = Math.floor(elapsed / 1000);
        clock.textContent = '0:' + String(seconds).padStart(2, '0') + ' / 0:45';
        progress.value = elapsed / 1000;
        progress.textContent = seconds + ' of 45 seconds';
        play.textContent = running ? 'Pause tour' : elapsed >= duration ? 'Replay 45-second tour' : started ? 'Resume tour' : 'Start 45-second tour';
    }

    function tick() {
        if (!running) return;
        var now = performance.now();
        elapsed = Math.min(duration, elapsed + now - lastTick);
        lastTick = now;
        showChapter(Math.min(2, Math.floor(elapsed / 15000)));
        if (elapsed >= duration) {
            running = false;
            window.clearInterval(timer);
            timer = null;
            status.textContent = 'Tour complete. Replay or explore any chapter at your own pace.';
            track('pricing_tour_complete');
        }
        updateControls();
    }

    function pause() {
        if (!running) return;
        tick();
        running = false;
        window.clearInterval(timer);
        timer = null;
        if (elapsed < duration) status.textContent = 'Tour paused. ' + chapters[selected].title + '.';
        updateControls();
    }

    play.addEventListener('click', function () {
        if (running) {
            pause();
            return;
        }
        if (elapsed >= duration) elapsed = 0;
        track(started && elapsed > 0 ? 'pricing_tour_resume' : 'pricing_tour_start');
        started = true;
        running = true;
        showChapter(Math.min(2, Math.floor(elapsed / 15000)));
        status.textContent = 'Tour playing. ' + chapters[selected].title + '.';
        lastTick = performance.now();
        timer = window.setInterval(tick, 250);
        updateControls();
    });

    chapterButtons.forEach(function (button, index) {
        button.addEventListener('click', function () {
            pause();
            elapsed = index * 15000;
            started = true;
            showChapter(index);
            status.textContent = chapters[index].title + '. Tour paused; read at your own pace or resume.';
            updateControls();
        });
    });

    document.querySelectorAll('[data-pricing-slide]').forEach(function (button) {
        button.addEventListener('click', function () {
            pause();
            // The gallery is independent: keep its selected screenshot when playback stops.
            window.setPricingSlide(Number(button.getAttribute('data-pricing-slide')));
            selected = -1;
            elapsed = 0;
            started = false;
            chapterButtons.forEach(function (chapterButton) { chapterButton.setAttribute('aria-pressed', 'false'); });
            status.textContent = 'Browsing app screenshots. Start the guided tour whenever you are ready.';
            updateControls();
        });
    });

    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
    window.addEventListener('pagehide', pause);
    window.pausePricingTour = pause;
    showChapter(0);
    updateControls();
    controls.hidden = false;
}());
