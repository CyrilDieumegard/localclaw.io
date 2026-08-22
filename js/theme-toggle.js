/** Global LocalClaw light/dark theme controller. */

(function () {
    'use strict';

    var THEME_KEY = 'localclaw-theme';
    var LIGHT_COLOR = '#faf9f6';
    var DARK_COLOR = '#050505';

    function storedTheme() {
        try {
            var value = localStorage.getItem(THEME_KEY);
            return value === 'dark' || value === 'light' ? value : 'light';
        } catch (error) {
            return 'light';
        }
    }

    function updateMeta(name, value) {
        var meta = document.querySelector('meta[name="' + name + '"]');
        if (!meta && document.head) {
            meta = document.createElement('meta');
            meta.setAttribute('name', name);
            document.head.appendChild(meta);
        }
        if (meta) meta.setAttribute('content', value);
    }

    function updateControls(theme) {
        document.querySelectorAll('[data-theme-option]').forEach(function (button) {
            var active = button.getAttribute('data-theme-option') === theme;
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function applyTheme(theme, persist) {
        var selected = theme === 'dark' ? 'dark' : 'light';
        var html = document.documentElement;

        html.classList.remove(selected === 'dark' ? 'light' : 'dark');
        html.classList.add(selected);
        html.style.colorScheme = selected;

        updateMeta('theme-color', selected === 'dark' ? DARK_COLOR : LIGHT_COLOR);
        updateMeta('color-scheme', selected);
        updateControls(selected);

        if (persist) {
            try {
                localStorage.setItem(THEME_KEY, selected);
            } catch (error) {
                // The theme still works for this page when storage is restricted.
            }
        }

        document.dispatchEvent(new CustomEvent('localclaw:themechange', {
            detail: { theme: selected }
        }));

        return selected;
    }

    function bindControls() {
        document.querySelectorAll('[data-theme-option]').forEach(function (button) {
            if (button.getAttribute('data-theme-bound') === 'true') return;
            button.setAttribute('data-theme-bound', 'true');
            button.addEventListener('click', function () {
                applyTheme(button.getAttribute('data-theme-option'), true);
            });
        });
        updateControls(storedTheme());
    }

    function init() {
        applyTheme(storedTheme(), false);
        bindControls();
    }

    window.setLocalClawTheme = function (theme) {
        return applyTheme(theme, true);
    };

    window.toggleLocalClawTheme = function () {
        return applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark', true);
    };

    // This script is intentionally loaded synchronously in <head> so the saved
    // theme is applied before the first body paint. Light is the safe default.
    var initialTheme = applyTheme(storedTheme(), false);
    var controlObserver = null;

    if (document.readyState === 'loading' && window.MutationObserver) {
        controlObserver = new MutationObserver(function (mutations) {
            var controlsAdded = mutations.some(function (mutation) {
                return Array.prototype.some.call(mutation.addedNodes, function (node) {
                    return node.nodeType === 1 && (
                        node.matches('[data-theme-option]') ||
                        node.querySelector('[data-theme-option]')
                    );
                });
            });
            if (controlsAdded) updateControls(initialTheme);
        });
        controlObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (controlObserver) controlObserver.disconnect();
            init();
        });
    } else {
        init();
    }
})();
