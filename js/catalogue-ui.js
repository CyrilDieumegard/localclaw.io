/* Shared keyboard and mobile-panel behavior for the existing catalogue filters. */
(function () {
    'use strict';
    window.LocalClawCatalogueUI = {
        mount() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const toggle = document.getElementById('mobile-filter-btn');
            const dismiss = document.getElementById('sidebar-close');
            const mobile = window.matchMedia('(max-width: 768px)');
            let previousFocus = null;
            const background = new Map();
            const isOpen = () => sidebar.classList.contains('open');
            const focusable = () => [...sidebar.querySelectorAll('button, input, select, a[href], [tabindex="0"]')]
                .filter(element => !element.disabled && !element.hidden && element.getClientRects().length);
            const restore = () => {
                background.forEach((inert, element) => { element.inert = inert; });
                background.clear();
            };
            function close() {
                const wasOpen = isOpen();
                sidebar.classList.remove('open');
                overlay.classList.remove('visible', 'show');
                document.body.classList.remove('sidebar-open');
                sidebar.removeAttribute('aria-modal');
                sidebar.removeAttribute('role');
                sidebar.inert = mobile.matches;
                toggle.setAttribute('aria-expanded', 'false');
                restore();
                if (wasOpen && previousFocus?.isConnected && mobile.matches) previousFocus.focus();
            }
            function open() {
                if (!mobile.matches) return;
                previousFocus = document.activeElement;
                sidebar.inert = false;
                sidebar.classList.add('open');
                overlay.classList.add('visible', 'show');
                document.body.classList.add('sidebar-open');
                sidebar.setAttribute('role', 'dialog');
                sidebar.setAttribute('aria-modal', 'true');
                toggle.setAttribute('aria-expanded', 'true');
                // Inert the siblings along the panel's ancestor chain, never the panel itself.
                let branch = sidebar;
                while (branch.parentElement && branch !== document.body) {
                    for (const sibling of branch.parentElement.children) {
                        if (sibling === branch || sibling === overlay || sibling.contains(overlay)) continue;
                        background.set(sibling, sibling.inert);
                        sibling.inert = true;
                    }
                    branch = branch.parentElement;
                }
                dismiss.focus();
            }
            function syncPressed() {
                document.querySelectorAll('button.chip, button.sort-btn, button.view-btn, button.preset-btn').forEach(button => {
                    button.setAttribute('aria-pressed', String(button.classList.contains('active') || button.classList.contains('active-view')));
                });
            }
            sidebar.setAttribute('aria-label', 'Catalogue filters');
            sidebar.inert = mobile.matches;
            toggle.setAttribute('aria-controls', sidebar.id);
            toggle.setAttribute('aria-expanded', 'false');
            toggle.addEventListener('click', open);
            dismiss.addEventListener('click', close);
            overlay.addEventListener('click', close);
            mobile.addEventListener('change', close);
            document.addEventListener('click', () => queueMicrotask(syncPressed));
            document.addEventListener('keydown', event => {
                if (!isOpen()) return;
                if (event.key === 'Escape') { event.preventDefault(); close(); return; }
                if (event.key !== 'Tab') return;
                const controls = focusable();
                const first = controls[0];
                const last = controls.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            });
            syncPressed();
            return {close, syncPressed};
        }
    };
})();
