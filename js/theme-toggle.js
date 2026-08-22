/**
 * LocalClaw theme lock
 * The public site uses the accessible light catalogue theme by default.
 */

(function () {
    'use strict';

    const THEME_KEY = 'localclaw-theme';

    function forceLightTheme() {
        const html = document.documentElement;

        html.classList.remove('dark');
        html.classList.add('light');
        html.style.colorScheme = 'light';

        if (document.body) {
            document.body.classList.remove('bg-black');
            document.body.classList.add('bg-gray-50');
        }

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#faf9f6');
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
        forceLightTheme();
        removeThemeControls();
    }

    window.toggleLocalClawTheme = function () {
        forceLightTheme();
        removeThemeControls();
    };

    forceLightTheme();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
