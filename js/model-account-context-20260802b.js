(function () {
    'use strict';

    const panel = document.querySelector('[data-localclaw-model-context]');
    const model = window.LOCALCLAW_MODEL;
    const context = window.LocalClawAccountContext;

    if (!panel || !model || model.hosted_only || !context || !window.LocalClawCompatibility) return;

    window.addEventListener('localclaw:account-context', (event) => render(event.detail));
    context.ready.then(() => render(context.getState()));
    render(context.getState());

    function render(accountState) {
        const machine = accountState?.primaryMachine;
        if (!machine) {
            panel.hidden = true;
            return;
        }

        const result = window.LocalClawCompatibility.rankModels(machine, [model]);
        const fit = result.compatible[0] || null;
        const favorite = context.getFavorite(model.id, machine.id);
        const label = fit?.compatibilityLabel || 'Too large for this machine';
        const detail = fit
            ? `${fit.runtimeNote}. ${fit.compatibilityReasons.join(' · ')}`
            : `This model exceeds the current memory fit for ${machine.name}.`;

        panel.hidden = false;
        panel.dataset.fit = fit?.compatibilityTier || 'too-large';
        panel.innerHTML = `
            <div>
                <p class="personal-fit-kicker">Your primary machine</p>
                <h2>${escapeHtml(label)} on ${escapeHtml(machine.name)}</h2>
                <p>${escapeHtml(detail)}</p>
            </div>
            <div class="personal-fit-actions">
                <button type="button" data-context-favorite>${favorite ? '★ Saved' : '☆ Save for this machine'}</button>
                <a href="/account">Open My Machines</a>
            </div>
        `;

        panel.querySelector('[data-context-favorite]')?.addEventListener('click', async (event) => {
            event.currentTarget.disabled = true;
            try {
                await context.toggleFavorite(model, machine);
            } catch (error) {
                event.currentTarget.textContent = error.message || 'Could not update';
                event.currentTarget.disabled = false;
            }
        });
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();
