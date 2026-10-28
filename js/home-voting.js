// Direct catalogue voting. Authentication and one-vote-per-member rules stay server-side.
(function () {
    'use strict';
    const pendingKey = 'localclaw_pending_rating';
    const maxAge = 30 * 60 * 1000;
    const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
    const unavailable = new Set(Object.keys(typeof APP_DATA === 'undefined' ? {} : APP_DATA.hfRepoVerification?.unavailable || {}));
    const models = new Map((typeof APP_DATA === 'undefined' ? [] : APP_DATA.models)
        .filter(model => !model.hosted_only && !unavailable.has(model.id)).map(model => [model.id, model]));
    const personal = new Map();
    let dialog, active, sessionPromise, signedIn = null;
    let busy = false;

    function pending(value) {
        try {
            if (value === null) sessionStorage.removeItem(pendingKey);
            else if (value) sessionStorage.setItem(pendingKey, JSON.stringify(value));
            else {
                const item = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
                if (item && models.has(item.modelId) && ((Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5) || (item.rating === null && item.action === 'remove'))
                    && Number.isFinite(item.createdAt) && Date.now() - item.createdAt >= 0 && Date.now() - item.createdAt < maxAge) return item;
                sessionStorage.removeItem(pendingKey);
            }
        } catch (_) { /* Choosing again after sign-in still works when storage is blocked. */ }
        return null;
    }

    async function session() {
        if (!sessionPromise) sessionPromise = (async () => {
            const response = await fetch('/api/auth/get-session', {credentials: 'same-origin', headers: {Accept: 'application/json'}});
            if (!response.ok) throw Error('Unable to check your account. Please try again.');
            const data = await response.json();
            signedIn = Boolean(data?.user?.id);
            personal.clear();
            if (signedIn) {
                const mine = await fetch('/api/ratings/mine', {credentials: 'same-origin', headers: {Accept: 'application/json'}});
                if (mine.status === 401) signedIn = false;
                else if (!mine.ok) throw Error('Unable to load your ratings. Please try again.');
                else for (const item of (await mine.json()).ratings || []) personal.set(item.modelId, Number(item.rating));
            }
        })().catch(error => { sessionPromise = null; signedIn = null; throw error; });
        return sessionPromise;
    }

    function createDialog() {
        if (dialog) return;
        dialog = document.createElement('dialog');
        dialog.className = 'lc-vote-dialog';
        dialog.setAttribute('aria-labelledby', 'lc-vote-title');
        dialog.setAttribute('aria-describedby', 'lc-vote-copy');
        dialog.innerHTML = `<div class="lc-vote-head"><div><p class="lc-vote-eyebrow">Community rating</p><h2 id="lc-vote-title"></h2></div><button class="lc-vote-close" type="button" aria-label="Close rating">×</button></div>
            <p id="lc-vote-copy">How was your experience with this model?</p>
            <div class="lc-vote-stars" role="group" aria-label="Choose your rating from 1 to 5 stars">${labels.map((label, index) => `<button type="button" data-vote-value="${index + 1}" aria-label="${index + 1} ${index ? 'stars' : 'star'}: ${label}" aria-pressed="false">★</button>`).join('')}</div>
            <p class="lc-vote-preview" aria-hidden="true">Choose a star</p>
            <p class="lc-vote-status" role="status" aria-live="polite" aria-atomic="true"></p>
            <button class="lc-vote-signin" type="button" hidden>Continue with Google</button>
            <button class="lc-vote-retry" type="button" hidden>Try again</button>
            <button class="lc-vote-clear" type="button" hidden>Remove my rating</button>
            <p class="lc-vote-note">Your /5 rating contributes to the community average. It does not change the LocalClaw /10 score.</p>`;
        document.body.appendChild(dialog);
        dialog.querySelector('.lc-vote-close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
        dialog.addEventListener('close', () => {
            const id = active?.modelId;
            active = null;
            pending(null);
            // Saving refreshes catalogue rows, so find the replacement trigger.
            const triggers = [...document.querySelectorAll('[data-rate-id]')].filter(node => node.dataset.rateId === id);
            (triggers.find(node => node.getBoundingClientRect().width && node.getBoundingClientRect().right <= innerWidth) || triggers[0])?.focus({preventScroll: true});
        });
        dialog.querySelectorAll('[data-vote-value]').forEach(button => {
            const rating = Number(button.dataset.voteValue);
            button.addEventListener('pointerenter', () => preview(rating));
            button.addEventListener('focus', () => preview(rating));
            button.addEventListener('click', () => choose(rating));
        });
        dialog.querySelector('.lc-vote-stars').addEventListener('pointerleave', () => preview(active?.selected || 0));
        dialog.querySelector('.lc-vote-signin').addEventListener('click', signIn);
        dialog.querySelector('.lc-vote-retry').addEventListener('click', () => open(active.modelId));
        dialog.querySelector('.lc-vote-clear').addEventListener('click', () => save(null));
    }

    function preview(rating) {
        dialog.querySelectorAll('[data-vote-value]').forEach(button => button.classList.toggle('is-filled', Number(button.dataset.voteValue) <= rating));
        dialog.querySelector('.lc-vote-preview').textContent = rating ? `${rating}/5 · ${labels[rating - 1]}` : 'Choose a star';
    }

    function render(message, error = false) {
        if (!active) return;
        preview(active.selected);
        dialog.querySelectorAll('[data-vote-value]').forEach(button => {
            button.disabled = busy || signedIn === null;
            button.setAttribute('aria-pressed', String(Number(button.dataset.voteValue) === active.selected));
        });
        const status = dialog.querySelector('.lc-vote-status');
        status.textContent = message;
        status.classList.toggle('is-error', error);
        dialog.querySelector('.lc-vote-stars').setAttribute('aria-busy', String(busy));
        const signInButton = dialog.querySelector('.lc-vote-signin');
        signInButton.hidden = signedIn !== false;
        signInButton.disabled = busy || (!active.selected && active.action !== 'remove');
        signInButton.textContent = active.action === 'remove' ? 'Continue with Google to remove your rating'
            : active.selected ? `Continue with Google to save ${active.selected}/5` : 'Choose a star to continue with Google';
        dialog.querySelector('.lc-vote-retry').hidden = signedIn !== null || !error;
        dialog.querySelector('.lc-vote-clear').hidden = !personal.has(active.modelId) || signedIn !== true;
        dialog.querySelector('.lc-vote-clear').disabled = busy;
    }

    async function open(modelId, resumed = null) {
        if (!models.has(modelId) || busy) return;
        createDialog();
        active = {modelId, selected: 0, action: resumed?.action};
        const current = active;
        dialog.querySelector('#lc-vote-title').textContent = models.get(modelId).name;
        render('Checking your account…');
        if (!dialog.open) dialog.showModal();
        try {
            await session();
            if (active !== current) return;
            active.selected = resumed?.rating || personal.get(modelId) || 0;
            if (resumed?.autoSave && signedIn) { await save(resumed.action === 'remove' ? null : resumed.rating); return; }
            render(resumed?.authFailed ? 'Google sign-in was not completed. Your choice is kept. Please try again.' : signedIn ? (active.selected ? `Your rating: ${active.selected}/5. Choose another star to update it.` : 'Choose a star. Your rating is saved immediately.')
                : 'Choose your rating, then sign in with Google to save it.');
            dialog.querySelector(`[data-vote-value="${active.selected || 1}"]`).focus();
        } catch (error) { if (active === current) render(error.message, true); }
    }

    function choose(rating) {
        if (!active || busy || signedIn === null) return;
        active.selected = rating;
        active.action = 'save';
        if (signedIn) save(rating);
        else {
            pending({modelId: active.modelId, rating, createdAt: Date.now()});
            render(`${rating}/5 selected. Continue with Google to save your rating and return here.`);
        }
    }

    async function save(rating) {
        if (!active || busy || !signedIn) return;
        const current = active;
        busy = true;
        render(rating === null ? 'Removing your rating…' : 'Saving your rating…');
        try {
            const response = await fetch(`/api/ratings/${encodeURIComponent(current.modelId)}`, {
                method: rating === null ? 'DELETE' : 'PUT', credentials: 'same-origin',
                headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                ...(rating === null ? {} : {body: JSON.stringify({rating})})
            });
            const data = await response.json().catch(() => null);
            if (response.status === 401) {
                signedIn = false; sessionPromise = null;
                current.action = rating === null ? 'remove' : 'save';
                pending({modelId: current.modelId, rating, action: current.action, createdAt: Date.now()});
                throw Error(`Your session expired. Continue with Google to ${rating === null ? 'remove' : 'save'} this rating.`);
            }
            if (!response.ok || !data?.aggregate) throw Error(data?.message || 'Your rating was not saved. Please try again.');
            if (rating === null) personal.delete(current.modelId);
            else personal.set(current.modelId, rating);
            pending(null);
            document.dispatchEvent(new CustomEvent('localclaw:home-rating-updated', {detail: {modelId: current.modelId, rating, aggregate: data.aggregate}}));
            busy = false;
            if (active === current) {
                active.selected = rating || 0;
                active.action = null;
                render(rating === null ? 'Your rating was removed.' : `Saved. Your rating: ${rating}/5. You can change it at any time.`);
            }
        } catch (error) { busy = false; if (active === current) render(error.message || 'Your rating was not saved. Please try again.', true); }
        finally { busy = false; }
    }

    async function signIn() {
        if (!active || (!active.selected && active.action !== 'remove') || busy) return;
        const current = active;
        pending({modelId: current.modelId, rating: current.action === 'remove' ? null : current.selected, action: current.action, createdAt: Date.now()});
        busy = true;
        render('Opening Google sign-in…');
        try {
            const callback = new URL(window.location.href);
            callback.searchParams.set('rate', current.modelId);
            callback.searchParams.set('vote', 'resume');
            callback.searchParams.delete('auth');
            const errorCallback = new URL(callback);
            errorCallback.searchParams.set('auth', 'error');
            const response = await fetch('/api/auth/sign-in/social', {
                method: 'POST', credentials: 'same-origin', headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
                body: JSON.stringify({provider: 'google', callbackURL: callback.href, errorCallbackURL: errorCallback.href, disableRedirect: true})
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.url) throw Error(data?.message || 'Google sign-in is unavailable. Please try again.');
            window.location.assign(data.url);
        } catch (error) { busy = false; if (active === current) render(error.message || 'Google sign-in is unavailable. Please try again.', true); }
    }

    window.LocalClawHomeVoting = {getRating: modelId => personal.get(modelId) || null};
    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-rate-id]');
        if (!trigger) return;
        event.preventDefault();
        open(trigger.dataset.rateId);
    });
    function resume() {
        const url = new URL(window.location.href);
        const id = url.searchParams.get('rate');
        if (!models.has(id)) return;
        const item = pending();
        const authFailed = url.searchParams.get('auth') === 'error';
        const shouldResume = url.searchParams.get('vote') === 'resume' && !authFailed && item?.modelId === id;
        url.searchParams.delete('rate'); url.searchParams.delete('vote'); url.searchParams.delete('auth');
        history.replaceState(history.state, '', url);
        // Only a fresh choice saved in this tab can be submitted automatically after sign-in.
        open(id, item?.modelId === id ? {...item, autoSave: shouldResume, authFailed} : null);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resume, {once: true});
    else resume();
})();
