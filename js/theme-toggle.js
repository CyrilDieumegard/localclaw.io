/**
 * LocalClaw theme lock
 * The public site is intentionally dark-only.
 */

(function () {
    'use strict';

    const THEME_KEY = 'localclaw-theme';

    function forceDarkTheme() {
        const html = document.documentElement;

        html.classList.remove('light');
        html.classList.add('dark');

        if (document.body) {
            document.body.classList.remove('bg-gray-50');
            document.body.classList.add('bg-black');
        }

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#050505');
        }

        try {
            localStorage.removeItem(THEME_KEY);
        } catch (e) {
            // Ignore storage restrictions in private browsing.
        }
    }

    function removeThemeControls() {
        document.querySelectorAll('.theme-toggle-btn').forEach(button => {
            button.remove();
        });
    }

    function init() {
        forceDarkTheme();
        removeThemeControls();
    }

    window.toggleLocalClawTheme = function () {
        forceDarkTheme();
        removeThemeControls();
    };

    forceDarkTheme();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
