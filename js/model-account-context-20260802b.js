(function () {
    'use strict';

    const panel = document.querySelector('[data-localclaw-model-context]');
    const model = window.LOCALCLAW_MODEL;
    const context = window.LocalClawAccountContext;
    const fitContext = window.LocalClawFitContext;
    const ranking = window.LocalClawModelRanking;

    if (!panel || !model || model.hosted_only || !fitContext || !ranking) return;

    window.addEventListener('localclaw:account-context', (event) => render(event.detail));
    window.addEventListener('localclaw:fit-context', () => render(context?.getState()));
    context?.ready.then(() => render(context.getState()));
    render(context?.getState());

    function render(accountState) {
        const selection = fitContext.fromSearch();
        const savedSelection = selection?.id && accountState?.machines?.find((item) =>
            item.id === selection.id && Number(item.ramGb) === selection.ramGb &&
            item.platform === selection.platform && item.accelerator === selection.accelerator &&
            (Number(item.vramGb) || 0) === (selection.vramGb || 0));
        const savedMachine = selection ? savedSelection : accountState?.primaryMachine;
        const machine = selection ? {...selection, ...(savedSelection ? {name: savedSelection.name} : {})} : savedMachine;
        if (!machine) {
            panel.hidden = true;
            return;
        }

        const fit = fitContext.assess(machine, model);
        if (!fit) return;
        const score = ranking.scoreModel(machine, {}, model);
        const favorite = savedMachine && context?.getFavorite(model.id, savedMachine.id);
        const detail = fit.compatible
            ? `${model.recommended_quant || 'Listed quantization'} · ${score.runtimeNote || 'System-memory inference'}. ${fit.note}`
            : `This model exceeds the available memory for this selection. ${fit.note}`;
        const backHref = fitContext.withMachine('/#llm-index', machine);

        panel.hidden = false;
        panel.dataset.fit = fit.key === 'too-large' ? 'too-large' : fit.fitState === 'comfortable' ? 'best' : 'limited';
        panel.innerHTML = `
            <div>
                <p class="personal-fit-kicker">${selection ? 'Your selected configuration' : 'Your primary machine'}</p>
                <h2>${escapeHtml(fit.label)} on ${escapeHtml(machine.name)}</h2>
                <p>${escapeHtml(detail)}</p>
            </div>
            <div class="personal-fit-actions">
                ${savedMachine ? `<button type="button" data-context-favorite>${favorite ? '★ Saved' : '☆ Save for this machine'}</button>` : ''}
                <a href="${escapeHtml(backHref)}">Matching models</a>
                <a href="/account">My Machines</a>
            </div>
        `;

        document.querySelectorAll('a[href^="/models/"]').forEach((link) => {
            link.setAttribute('href', fitContext.withMachine(link.getAttribute('href'), machine));
        });
        panel.querySelector('[data-context-favorite]')?.addEventListener('click', async (event) => {
            event.currentTarget.disabled = true;
            try {
                await context.toggleFavorite(model, savedMachine);
                render(context.getState());
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
