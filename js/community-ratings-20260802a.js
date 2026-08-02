(function () {
    'use strict';

    const aggregates = new Map();
    const userRatings = new Map();
    let publicLoadPromise = null;
    let personalLoadPromise = null;
    let authState = 'unknown';

    function load(options) {
        const force = Boolean(options && options.force);
        if (force) {
            publicLoadPromise = null;
            personalLoadPromise = null;
        }

        if (!publicLoadPromise) publicLoadPromise = loadAggregates();
        if (!personalLoadPromise) personalLoadPromise = loadPersonalRatings();

        return Promise.allSettled([publicLoadPromise, personalLoadPromise]).then(function () {
            refresh(document);
            document.dispatchEvent(new CustomEvent('localclaw:ratings-ready'));
            return api;
        });
    }

    async function loadAggregates() {
        const response = await fetch('/api/ratings', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Community ratings are unavailable.');

        const data = await response.json();
        aggregates.clear();
        (Array.isArray(data?.ratings) ? data.ratings : []).forEach(function (item) {
            if (!item?.modelId) return;
            aggregates.set(item.modelId, normalizeAggregate(item));
        });
    }

    async function loadPersonalRatings() {
        const response = await fetch('/api/ratings/mine', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });

        if (response.status === 401) {
            authState = 'signed-out';
            userRatings.clear();
            return;
        }

        if (!response.ok) {
            authState = 'unavailable';
            return;
        }

        const data = await response.json();
        authState = 'signed-in';
        userRatings.clear();
        (Array.isArray(data?.ratings) ? data.ratings : []).forEach(function (item) {
            if (item?.modelId && Number.isInteger(Number(item.rating))) {
                userRatings.set(item.modelId, Number(item.rating));
            }
        });
    }

    function refresh(root) {
        const scope = root || document;
        const nodes = [];
        if (scope.matches && scope.matches('[data-community-rating]')) nodes.push(scope);
        if (scope.querySelectorAll) nodes.push.apply(nodes, scope.querySelectorAll('[data-community-rating]'));
        nodes.forEach(render);
    }

    function render(container) {
        const modelId = String(container.dataset.modelId || '').trim();
        if (!modelId) return;

        container.classList.add('lc-community-rating');
        const mode = container.dataset.ratingMode || 'compact';
        container.dataset.ratingMode = mode;
        container.replaceChildren();

        const aggregate = get(modelId);
        if (mode === 'compact') {
            container.appendChild(buildCompact(aggregate));
            return;
        }

        container.appendChild(buildPanel(modelId, aggregate, mode));
    }

    function buildCompact(aggregate) {
        const row = element('span', 'lc-rating-compact');
        row.title = aggregate.count ? communityLabel(aggregate) : 'No community ratings yet';
        row.appendChild(textElement('span', 'lc-rating-compact-star', aggregate.count ? '★' : '☆'));
        row.appendChild(textElement('span', 'lc-rating-compact-value', aggregate.count ? formatAverage(aggregate.average) : 'New'));
        row.appendChild(textElement('span', 'lc-rating-compact-count', aggregate.count ? `(${aggregate.count})` : 'community rating'));
        return row;
    }

    function buildPanel(modelId, aggregate, mode) {
        const panel = element('div', 'lc-rating-panel');
        panel.dataset.modelId = modelId;
        panel.appendChild(textElement('p', 'lc-rating-heading', 'Community rating'));

        const summary = element('div', 'lc-rating-summary');
        summary.appendChild(textElement('strong', 'lc-rating-average', aggregate.count ? formatAverage(aggregate.average) : '—'));
        summary.appendChild(textElement('span', 'lc-rating-out-of', '/ 5'));
        summary.appendChild(textElement('span', 'lc-rating-count', aggregate.count ? voteCountLabel(aggregate.count) : 'No ratings yet'));
        panel.appendChild(summary);

        const stars = element('div', 'lc-rating-stars');
        stars.setAttribute('role', 'group');
        stars.setAttribute('aria-label', 'Rate this model from 1 to 5 stars');
        const userRating = userRatings.get(modelId) || 0;
        const roundedAverage = Math.round(aggregate.average || 0);

        for (let value = 1; value <= 5; value += 1) {
            const button = textElement('button', 'lc-rating-star', '★');
            button.type = 'button';
            button.dataset.ratingValue = String(value);
            button.setAttribute('aria-label', `${value} star${value === 1 ? '' : 's'}`);
            button.setAttribute('aria-pressed', userRating === value ? 'true' : 'false');
            if (userRating ? value <= userRating : value <= roundedAverage) {
                button.classList.add(userRating ? 'is-selected' : 'is-average');
            }
            button.addEventListener('click', function () {
                submitRating(modelId, value, panel);
            });
            stars.appendChild(button);
        }
        panel.appendChild(stars);

        const foot = element('div', 'lc-rating-foot');
        if (authState === 'signed-in') {
            foot.appendChild(textElement('span', 'lc-rating-status', userRating ? `Your rating: ${userRating}/5` : 'Choose your rating'));
            if (userRating) {
                const clear = textElement('button', 'lc-rating-clear', 'Clear');
                clear.type = 'button';
                clear.addEventListener('click', function () {
                    clearRating(modelId, panel);
                });
                foot.appendChild(clear);
            }
        } else if (authState === 'signed-out') {
            const signIn = textElement('a', 'lc-rating-signin', 'Sign in to rate this model');
            signIn.href = `/account?next=${encodeURIComponent(window.location.pathname)}`;
            foot.appendChild(signIn);
        } else if (authState === 'unavailable') {
            foot.appendChild(textElement('span', 'lc-rating-status', 'Voting is temporarily unavailable'));
        } else {
            foot.appendChild(textElement('span', 'lc-rating-status', mode === 'full' ? 'Loading your rating…' : 'Loading…'));
        }
        panel.appendChild(foot);
        return panel;
    }

    async function submitRating(modelId, rating, panel) {
        if (authState !== 'signed-in') {
            window.location.assign(`/account?next=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        setSaving(panel, true);
        try {
            const response = await fetch(`/api/ratings/${encodeURIComponent(modelId)}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating })
            });
            const data = await response.json().catch(function () { return null; });
            if (response.status === 401) {
                authState = 'signed-out';
                renderAllForModel(modelId);
                return;
            }
            if (!response.ok || !data?.aggregate) throw new Error(data?.message || 'Could not save your rating.');

            userRatings.set(modelId, rating);
            aggregates.set(modelId, normalizeAggregate(data.aggregate));
            renderAllForModel(modelId);
            document.dispatchEvent(new CustomEvent('localclaw:rating-updated', { detail: { modelId, rating } }));
        } catch (error) {
            showPanelError(panel, error.message || 'Could not save your rating.');
        } finally {
            setSaving(panel, false);
        }
    }

    async function clearRating(modelId, panel) {
        setSaving(panel, true);
        try {
            const response = await fetch(`/api/ratings/${encodeURIComponent(modelId)}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            });
            const data = await response.json().catch(function () { return null; });
            if (!response.ok || !data?.aggregate) throw new Error(data?.message || 'Could not clear your rating.');

            userRatings.delete(modelId);
            aggregates.set(modelId, normalizeAggregate(data.aggregate));
            renderAllForModel(modelId);
            document.dispatchEvent(new CustomEvent('localclaw:rating-updated', { detail: { modelId, rating: null } }));
        } catch (error) {
            showPanelError(panel, error.message || 'Could not clear your rating.');
        } finally {
            setSaving(panel, false);
        }
    }

    function renderAllForModel(modelId) {
        document.querySelectorAll('[data-community-rating]').forEach(function (container) {
            if (container.dataset.modelId === modelId) render(container);
        });
    }

    function focus(modelId, root) {
        const scope = root || document;
        const container = Array.from(scope.querySelectorAll('[data-community-rating]')).find(function (node) {
            return node.dataset.modelId === modelId && node.dataset.ratingMode !== 'compact';
        });
        if (!container) return false;

        const panel = container.querySelector('.lc-rating-panel');
        panel?.classList.add('is-highlighted');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(function () {
            container.querySelector('.lc-rating-star')?.focus({ preventScroll: true });
            panel?.classList.remove('is-highlighted');
        }, 900);
        return true;
    }

    function setSaving(panel, saving) {
        if (!panel?.isConnected) return;
        panel.classList.toggle('is-saving', saving);
        panel.querySelectorAll('button').forEach(function (button) { button.disabled = saving; });
    }

    function showPanelError(panel, message) {
        if (!panel?.isConnected) return;
        const status = panel.querySelector('.lc-rating-status') || panel.querySelector('.lc-rating-foot');
        if (status) status.textContent = message;
    }

    function get(modelId) {
        return aggregates.get(modelId) || { modelId, average: 0, count: 0 };
    }

    function getUserRating(modelId) {
        return userRatings.get(modelId) || null;
    }

    function normalizeAggregate(item) {
        return {
            modelId: String(item.modelId || ''),
            average: Math.max(0, Math.min(5, Number(item.average) || 0)),
            count: Math.max(0, Number(item.count) || 0)
        };
    }

    function formatAverage(value) {
        return Number(value || 0).toFixed(1);
    }

    function voteCountLabel(count) {
        return `${count} vote${count === 1 ? '' : 's'}`;
    }

    function communityLabel(aggregate) {
        return `${formatAverage(aggregate.average)} out of 5 from ${voteCountLabel(aggregate.count)}`;
    }

    function element(tag, className) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        return node;
    }

    function textElement(tag, className, text) {
        const node = element(tag, className);
        node.textContent = text;
        return node;
    }

    const api = {
        focus,
        get,
        getUserRating,
        load,
        refresh
    };

    window.LocalClawRatings = api;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { load(); }, { once: true });
    } else {
        load();
    }
})();
