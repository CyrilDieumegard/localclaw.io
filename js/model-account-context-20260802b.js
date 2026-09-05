(function () {
    'use strict';

    const panel = document.querySelector('[data-localclaw-model-context]');
    const model = window.LOCALCLAW_MODEL;
    const context = window.LocalClawAccountContext;
    const fitContext = window.LocalClawFitContext;
    const ranking = window.LocalClawModelRanking;

    if (!panel || !model || model.hosted_only || !fitContext || !ranking) return;

    const pendingFavorites = new Map();
    const favoriteErrors = new Map();
    const runtimePicker = document.querySelector('[data-model-run-options]');
    const runtimeOriginals = new Map();
    let intelRuntimeNote = null;
    let currentMachine = null;

    window.addEventListener('localclaw:account-context', (event) => render(event.detail));
    window.addEventListener('localclaw:fit-context', () => render(context?.getState()));
    document.addEventListener?.('DOMContentLoaded', updateAccountLinks);
    ['click', 'auxclick', 'contextmenu'].forEach((name) => {
        document.addEventListener?.(name, (event) => {
            const link = event.target?.closest?.('a[href]');
            if (link) updateAccountLink(link);
        }, true);
    });
    context?.ready.then(() => render(context.getState()));
    render(context?.getState());

    function render(accountState) {
        if (panel.isConnected === false) return;
        const selection = fitContext.fromSearch();
        const savedSelection = selection?.id && accountState?.machines?.find((item) =>
            item.id === selection.id && Number(item.ramGb) === selection.ramGb &&
            item.platform === selection.platform && item.accelerator === selection.accelerator &&
            (Number(item.vramGb) || 0) === (selection.vramGb || 0));
        const savedMachine = selection ? savedSelection : accountState?.primaryMachine;
        const machine = selection ? {...selection, ...(savedSelection ? {name: savedSelection.name} : {})} : savedMachine;
        currentMachine = machine || null;
        updateAccountLinks();
        adaptRuntimePicker(machine);
        if (!machine) {
            panel.hidden = true;
            return;
        }

        const fit = fitContext.assess(machine, model);
        if (!fit) return;
        const score = ranking.scoreModel(machine, {}, model);
        const favorite = savedMachine && context?.getFavorite(model.id, savedMachine.id);
        const favoriteKey = savedMachine ? `${savedMachine.id}:${model.id}` : '';
        const pending = pendingFavorites.has(favoriteKey);
        const errorMessage = favoriteErrors.get(favoriteKey) || '';
        const favoriteLabel = pending
            ? pendingFavorites.get(favoriteKey) ? 'Removing…' : 'Saving…'
            : favorite ? '★ Saved' : '☆ Save for this machine';
        const detail = fit.compatible
            ? `${model.recommended_quant || 'Listed quantization'} · ${score.runtimeNote || 'System-memory inference'}. ${fit.note}`
            : `This model exceeds the available memory for this selection. ${fit.note}`;
        const backHref = fitContext.withMachine('/#llm-index', machine);
        const accountHref = fitContext.withMachine('/account', machine);

        panel.hidden = false;
        panel.dataset.fit = fit.key === 'too-large' ? 'too-large' : fit.fitState === 'comfortable' ? 'best' : 'limited';
        panel.innerHTML = `
            <div>
                <p class="personal-fit-kicker">${selection ? 'Your selected configuration' : 'Your primary machine'}</p>
                <h2>${escapeHtml(fit.label)} on ${escapeHtml(machine.name)}</h2>
                <p>${escapeHtml(detail)}</p>
                ${savedMachine ? `<p id="model-favorite-error" data-context-favorite-error role="alert"${errorMessage ? '' : ' hidden'}>${escapeHtml(errorMessage)}</p>` : ''}
            </div>
            <div class="personal-fit-actions">
                ${savedMachine ? `<button type="button" data-context-favorite aria-describedby="model-favorite-error"${pending ? ' disabled aria-busy="true"' : ''}>${favoriteLabel}</button>` : ''}
                <a href="${escapeHtml(backHref)}">Matching models</a>
                <a href="${escapeHtml(accountHref)}">My Machines</a>
            </div>
        `;

        document.querySelectorAll('a[href^="/models/"]').forEach((link) => {
            link.setAttribute('href', fitContext.withMachine(link.getAttribute('href'), machine));
        });
        panel.querySelector('[data-context-favorite]')?.addEventListener('click', async (event) => {
            const button = event.currentTarget;
            if (button.disabled || pendingFavorites.has(favoriteKey)) return;
            pendingFavorites.set(favoriteKey, Boolean(favorite));
            favoriteErrors.delete(favoriteKey);
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.textContent = favorite ? 'Removing…' : 'Saving…';
            const errorNotice = panel.querySelector('[data-context-favorite-error]');
            if (errorNotice) {
                errorNotice.hidden = true;
                errorNotice.textContent = '';
            }
            try {
                await context.toggleFavorite(model, savedMachine);
            } catch (error) {
                favoriteErrors.set(favoriteKey, error?.message || 'Could not update this model. Please try again.');
            } finally {
                pendingFavorites.delete(favoriteKey);
                if (button.isConnected) {
                    button.disabled = false;
                    button.removeAttribute('aria-busy');
                }
                if (panel.isConnected) render(context.getState());
            }
        });
    }

    function updateAccountLink(link) {
        const href = link.getAttribute('href');
        if (!href) return;
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin || !['/account', '/account/', '/account.html'].includes(url.pathname)) return;
        const next = fitContext.withMachine(href, currentMachine);
        if (next !== href) link.setAttribute('href', next);
    }

    function updateAccountLinks() {
        document.querySelectorAll('a[href]').forEach(updateAccountLink);
    }

    function adaptRuntimePicker(machine) {
        if (!runtimePicker?.querySelectorAll) return;
        const intelMac = ['mac', 'macos'].includes(machine?.platform) && machine?.accelerator !== 'apple-silicon';
        const customRuntime = Boolean(model.custom_runtime);
        const hideForIntel = (element) => {
            if (!element) return;
            if (!runtimeOriginals.has(element)) runtimeOriginals.set(element, {hidden: element.hidden, display: element.style.display});
            const original = runtimeOriginals.get(element);
            element.hidden = intelMac ? true : original.hidden;
            element.style.display = intelMac ? 'none' : original.display;
        };
        runtimePicker.querySelectorAll('[data-runtime]').forEach((link) => {
            const allowed = customRuntime ? ['huggingface', 'official'] : ['huggingface', 'llamacpp'];
            if (!allowed.includes(link.dataset.runtime)) hideForIntel(link);
        });
        hideForIntel(runtimePicker.querySelector('.runtime-launch-disclosure'));
        document.querySelectorAll('.install-steps').forEach((steps) => {
            hideForIntel(steps);
            const heading = steps.previousElementSibling;
            if (heading?.tagName === 'H2') {
                hideForIntel(heading);
                const section = steps.parentElement;
                if (section?.tagName === 'SECTION' && section.children.length === 2) hideForIntel(section);
            }
        });
        const description = runtimePicker.querySelector('.run-picker-head p');
        if (description) {
            if (!runtimeOriginals.has(description)) runtimeOriginals.set(description, {text: description.textContent});
            description.textContent = intelMac && !customRuntime
                ? 'Intel Mac requires manual CPU setup. Check the model files and runtime requirements below.'
                : runtimeOriginals.get(description).text;
        }
        if (intelMac && !customRuntime && !intelRuntimeNote) {
            intelRuntimeNote = document.createElement('div');
            intelRuntimeNote.className = 'run-required';
            intelRuntimeNote.dataset.intelRuntimeNote = '';
            const copy = document.createElement('span');
            const title = document.createElement('strong');
            title.textContent = 'Intel Mac: llama.cpp CPU setup';
            const detail = document.createElement('small');
            detail.textContent = 'LM Studio and the LocalClaw Mac app do not support Intel Macs. Follow the model-specific requirements when a custom runtime is listed.';
            copy.append(title, detail);
            const guide = document.createElement('a');
            guide.href = 'https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#cpu-build';
            guide.target = '_blank';
            guide.rel = 'noopener noreferrer';
            guide.textContent = 'Official CPU setup →';
            guide.style.color = 'var(--primary)';
            intelRuntimeNote.append(copy, guide);
            runtimePicker.append(intelRuntimeNote);
        }
        if (intelRuntimeNote) {
            intelRuntimeNote.hidden = !intelMac || customRuntime;
            intelRuntimeNote.style.display = intelMac && !customRuntime ? '' : 'none';
        }
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
