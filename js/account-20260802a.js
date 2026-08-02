(function () {
    'use strict';

    const PENDING_MACHINE_KEY = 'localclaw_pending_machine';
    const state = {
        session: null,
        machines: [],
        favorites: [],
        knownModelIds: [],
        newModelIds: [],
        selectedMachineId: null,
        viewMode: 'compatible',
        compareModelIds: [],
        upgradeModelId: null,
        saving: false
    };

    const elements = {};

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        cacheElements();
        bindEvents();
        await loadSession();
    }

    function cacheElements() {
        elements.authGate = document.getElementById('auth-gate');
        elements.dashboard = document.getElementById('account-dashboard');
        elements.authError = document.getElementById('auth-error');
        elements.googleSignIn = document.getElementById('google-sign-in');
        elements.signOut = document.getElementById('sign-out');
        elements.profile = document.getElementById('profile');
        elements.machineList = document.getElementById('machine-list');
        elements.recommendationPanel = document.getElementById('recommendation-panel');
        elements.addMachine = document.getElementById('add-machine');
        elements.sidebarAddMachine = document.getElementById('sidebar-add-machine');
        elements.dialog = document.getElementById('machine-dialog');
        elements.form = document.getElementById('machine-form');
        elements.formError = document.getElementById('machine-form-error');
        elements.dialogTitle = document.getElementById('machine-dialog-title');
        elements.closeDialog = document.getElementById('close-dialog');
        elements.cancelMachine = document.getElementById('cancel-machine');
        elements.accelerator = document.getElementById('machine-accelerator');
        elements.vramField = document.getElementById('vram-field');
        elements.vramInput = document.getElementById('machine-vram');
        elements.compareDialog = document.getElementById('compare-dialog');
        elements.compareDialogBody = document.getElementById('compare-dialog-body');
        elements.closeCompareDialog = document.getElementById('close-compare-dialog');
        elements.testDialog = document.getElementById('test-dialog');
        elements.testForm = document.getElementById('test-form');
        elements.testFormError = document.getElementById('test-form-error');
        elements.closeTestDialog = document.getElementById('close-test-dialog');
        elements.cancelTest = document.getElementById('cancel-test');
        elements.toast = document.getElementById('toast');
    }

    function bindEvents() {
        elements.googleSignIn.addEventListener('click', signInWithGoogle);
        elements.signOut.addEventListener('click', signOut);
        elements.addMachine.addEventListener('click', () => openMachineDialog());
        elements.sidebarAddMachine.addEventListener('click', () => openMachineDialog());
        elements.closeDialog.addEventListener('click', closeMachineDialog);
        elements.cancelMachine.addEventListener('click', closeMachineDialog);
        elements.accelerator.addEventListener('change', updateVramField);
        elements.form.addEventListener('submit', saveMachine);
        elements.closeCompareDialog.addEventListener('click', closeCompareDialog);
        elements.compareDialog.addEventListener('click', (event) => {
            if (event.target === elements.compareDialog) closeCompareDialog();
        });
        elements.closeTestDialog.addEventListener('click', closeTestDialog);
        elements.cancelTest.addEventListener('click', closeTestDialog);
        elements.testForm.addEventListener('submit', saveTestLog);
        elements.testDialog.addEventListener('click', (event) => {
            if (event.target === elements.testDialog) closeTestDialog();
        });
        elements.dialog.addEventListener('click', (event) => {
            if (event.target === elements.dialog) closeMachineDialog();
        });
    }

    async function loadSession() {
        setPageLoading(true);
        try {
            const response = await fetch('/api/auth/get-session', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            });

            if (response.status === 503) {
                showSignedOut('Accounts are being configured. Please try again shortly.');
                return;
            }

            if (!response.ok) {
                showSignedOut('Unable to check your account right now.');
                return;
            }

            const session = await response.json();
            if (!session?.user?.id) {
                showSignedOut(authErrorFromUrl());
                return;
            }

            state.session = session;
            showDashboard();
            renderProfile();
            await loadWorkspace();
            openPendingMachineIfNeeded();
        } catch {
            showSignedOut('Unable to reach the account service.');
        } finally {
            setPageLoading(false);
        }
    }

    async function signInWithGoogle() {
        elements.authError.textContent = '';
        elements.googleSignIn.disabled = true;
        elements.googleSignIn.classList.add('lc-loading');

        try {
            const requestedPath = new URLSearchParams(window.location.search).get('next');
            const safePath = requestedPath && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
                ? requestedPath
                : '/account';
            const callbackURL = `${window.location.origin}${safePath}`;
            const response = await fetch('/api/auth/sign-in/social', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    provider: 'google',
                    callbackURL,
                    errorCallbackURL: `${callbackURL}?auth=error`,
                    disableRedirect: true
                })
            });
            const data = await readJson(response);

            if (!response.ok || !data?.url) {
                throw new Error(data?.message || 'Google sign-in is unavailable.');
            }

            window.location.assign(data.url);
        } catch (error) {
            elements.authError.textContent = error.message || 'Google sign-in failed.';
            elements.googleSignIn.disabled = false;
            elements.googleSignIn.classList.remove('lc-loading');
        }
    }

    async function signOut() {
        elements.signOut.disabled = true;
        try {
            await fetch('/api/auth/sign-out', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: '{}'
            });
        } finally {
            try { localStorage.removeItem('localclaw_primary_machine'); } catch {}
            window.location.assign('/account');
        }
    }

    async function loadWorkspace(preferredId) {
        const [machineResponse, favoriteResponse, catalogResponse] = await Promise.all([
            fetch('/api/machines', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            }),
            fetch('/api/favorites', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            }),
            fetch('/api/catalog-state', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            })
        ]);
        const [machineData, favoriteData, catalogData] = await Promise.all([
            readJson(machineResponse),
            readJson(favoriteResponse),
            readJson(catalogResponse)
        ]);

        if (machineResponse.status === 401) {
            showSignedOut();
            return;
        }

        if (!machineResponse.ok) {
            showToast(machineData?.message || 'Could not load your machines.', 'error');
            return;
        }

        state.machines = Array.isArray(machineData?.machines) ? machineData.machines : [];
        state.favorites = favoriteResponse.ok && Array.isArray(favoriteData?.favorites) ? favoriteData.favorites : [];
        state.selectedMachineId = chooseSelectedMachineId(preferredId);
        cachePrimaryMachine();

        if (!favoriteResponse.ok && favoriteResponse.status !== 401) {
            showToast('Saved models are temporarily unavailable.', 'error');
        }

        await syncCatalogState(catalogResponse.ok ? catalogData : null);
        renderMachineList();
        renderSelectedMachine();
    }

    async function syncCatalogState(catalogData) {
        const currentIds = currentLocalModelIds();

        if (!catalogData?.initialized) {
            state.knownModelIds = currentIds;
            state.newModelIds = [];
            await updateCatalogState(currentIds, false);
            return;
        }

        state.knownModelIds = Array.isArray(catalogData.knownModelIds) ? catalogData.knownModelIds : [];
        const known = new Set(state.knownModelIds);
        state.newModelIds = currentIds.filter((id) => !known.has(id));
    }

    function chooseSelectedMachineId(preferredId) {
        if (preferredId && state.machines.some((machine) => machine.id === preferredId)) {
            return preferredId;
        }
        if (state.selectedMachineId && state.machines.some((machine) => machine.id === state.selectedMachineId)) {
            return state.selectedMachineId;
        }
        const primary = state.machines.find((machine) => machine.isPrimary);
        return primary?.id || state.machines[0]?.id || null;
    }

    function cachePrimaryMachine() {
        const primary = state.machines.find((machine) => machine.isPrimary) || state.machines[0] || null;
        try {
            if (primary) localStorage.setItem('localclaw_primary_machine', JSON.stringify(primary));
            else localStorage.removeItem('localclaw_primary_machine');
        } catch {}
    }

    function renderProfile() {
        const user = state.session?.user;
        if (!user) return;

        const avatar = user.image
            ? `<img src="${escapeAttribute(user.image)}" width="38" height="38" alt="" referrerpolicy="no-referrer">`
            : `<span class="lc-profile-fallback" aria-hidden="true">${escapeHtml((user.name || user.email || 'U').charAt(0).toUpperCase())}</span>`;

        elements.profile.innerHTML = `
            ${avatar}
            <span><strong>${escapeHtml(user.name || 'LocalClaw user')}</strong><br>${escapeHtml(user.email || '')}</span>
        `;
    }

    function renderMachineList() {
        if (!state.machines.length) {
            elements.machineList.innerHTML = `
                <div class="lc-sidebar-empty">No hardware saved yet. Add a machine to build your compatibility list.</div>
            `;
            return;
        }

        elements.machineList.innerHTML = state.machines.map((machine) => {
            const newFitCount = countNewFitsForMachine(machine);
            return `
                <button class="lc-machine-item${machine.id === state.selectedMachineId ? ' is-active' : ''}" type="button" data-machine-id="${escapeAttribute(machine.id)}">
                    <span class="lc-machine-icon" aria-hidden="true">${machineIcon(machine)}</span>
                    <span>
                        <span class="lc-machine-name">${escapeHtml(machine.name)}</span>
                        <span class="lc-machine-spec">${escapeHtml(machineSpec(machine))}</span>
                    </span>
                    <span class="lc-machine-signals">
                        ${newFitCount ? `<span class="lc-machine-new" title="New compatible models">+${newFitCount}</span>` : ''}
                        ${machine.isPrimary ? '<span class="lc-primary-dot" title="Primary machine"></span>' : ''}
                    </span>
                </button>
            `;
        }).join('');

        elements.machineList.querySelectorAll('[data-machine-id]').forEach((button) => {
            button.addEventListener('click', () => {
                if (state.selectedMachineId !== button.dataset.machineId) {
                    state.compareModelIds = [];
                    state.upgradeModelId = null;
                }
                state.selectedMachineId = button.dataset.machineId;
                renderMachineList();
                renderSelectedMachine();
            });
        });
    }

    function renderSelectedMachine() {
        const machine = state.machines.find((item) => item.id === state.selectedMachineId);
        if (!machine) {
            elements.recommendationPanel.innerHTML = `
                <div class="lc-empty-state">
                    <div>
                        <h2>Add your first machine</h2>
                        <p>Your compatible model list will appear here.</p>
                        <button class="lc-button lc-button-primary" type="button" data-empty-add>+ Add machine</button>
                    </div>
                </div>
            `;
            elements.recommendationPanel.querySelector('[data-empty-add]')?.addEventListener('click', () => openMachineDialog());
            return;
        }

        const result = window.LocalClawCompatibility.rankModels(machine, APP_DATA.models);
        const compatibleById = new Map(result.compatible.map((model) => [model.id, model]));
        const machineFavorites = state.favorites.filter((favorite) => favorite.machineId === machine.id);
        const favoriteById = new Map(machineFavorites.map((favorite) => [favorite.modelId, favorite]));
        const newIds = new Set(state.newModelIds);
        state.compareModelIds = state.compareModelIds.filter((modelId) => compatibleById.has(modelId));
        const selectedCompareModels = state.compareModelIds.map((modelId) => compatibleById.get(modelId)).filter(Boolean);
        let models = result.compatible.slice(0, 18);

        if (state.viewMode === 'saved') {
            models = machineFavorites
                .map((favorite) => savedModelForFavorite(favorite, compatibleById))
                .filter(Boolean);
        } else if (state.viewMode === 'new') {
            models = result.compatible.filter((model) => newIds.has(model.id));
        }

        const bestCount = result.compatible.filter((model) => model.compatibilityTier === 'best').length;
        const newFitCount = result.compatible.filter((model) => newIds.has(model.id)).length;
        const emptyCopy = state.viewMode === 'saved'
            ? ['No saved models for this machine', 'Use the star on any recommendation to build a focused shortlist.']
            : state.viewMode === 'new'
                ? ['No new compatible models', 'You are caught up. New catalogue additions that fit this machine will appear here.']
                : ['No compatible models found', 'Try increasing available memory or changing this hardware profile.'];

        elements.recommendationPanel.innerHTML = `
            <header class="lc-recommendation-head">
                <div>
                    <p class="lc-kicker">Selected hardware</p>
                    <h2>${escapeHtml(machine.name)}</h2>
                    <p>${escapeHtml(fullMachineSpec(machine))}</p>
                </div>
                <div class="lc-head-actions">
                    <button class="lc-button" type="button" data-edit-machine>Edit</button>
                    <button class="lc-button lc-button-danger" type="button" data-delete-machine>Delete</button>
                </div>
            </header>

            <div class="lc-summary-row">
                <div class="lc-summary-cell"><span class="lc-summary-value">${result.compatible.length}</span><span class="lc-summary-label">Compatible models</span></div>
                <div class="lc-summary-cell"><span class="lc-summary-value">${bestCount}</span><span class="lc-summary-label">Best matches</span></div>
                <div class="lc-summary-cell"><span class="lc-summary-value">${machineFavorites.length}</span><span class="lc-summary-label">Saved for this machine</span></div>
            </div>

            <div class="lc-model-toolbar" role="tablist" aria-label="Model views">
                <button class="lc-view-tab${state.viewMode === 'compatible' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${state.viewMode === 'compatible'}" data-model-view="compatible">Compatible</button>
                <button class="lc-view-tab${state.viewMode === 'saved' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${state.viewMode === 'saved'}" data-model-view="saved">Saved <span>${machineFavorites.length}</span></button>
                <button class="lc-view-tab${state.viewMode === 'new' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${state.viewMode === 'new'}" data-model-view="new">New fits <span>${newFitCount}</span></button>
                ${state.newModelIds.length ? '<button class="lc-mark-seen" type="button" data-mark-seen>Mark catalogue seen</button>' : ''}
            </div>

            ${selectedCompareModels.length ? renderCompareTray(selectedCompareModels) : ''}

            ${models.length ? `
                <div class="lc-model-grid">
                    ${models.map((model) => renderModelCard(
                        model,
                        machine,
                        favoriteById.get(model.id),
                        state.compareModelIds.includes(model.id),
                        compatibleById.has(model.id)
                    )).join('')}
                </div>
            ` : `
                <div class="lc-model-empty">
                    <h3>${emptyCopy[0]}</h3>
                    <p>${emptyCopy[1]}</p>
                </div>
            `}

            ${renderUpgradePlanner(machine, compatibleById)}
        `;

        window.LocalClawRatings?.refresh(elements.recommendationPanel);

        elements.recommendationPanel.querySelector('[data-edit-machine]')?.addEventListener('click', () => openMachineDialog(machine));
        elements.recommendationPanel.querySelector('[data-delete-machine]')?.addEventListener('click', () => deleteMachine(machine));
        elements.recommendationPanel.querySelectorAll('[data-model-view]').forEach((button) => {
            button.addEventListener('click', () => {
                state.viewMode = button.dataset.modelView;
                renderSelectedMachine();
            });
        });
        elements.recommendationPanel.querySelector('[data-mark-seen]')?.addEventListener('click', acknowledgeNewModels);
        elements.recommendationPanel.querySelectorAll('[data-favorite-model]').forEach((button) => {
            button.addEventListener('click', () => toggleFavorite(button.dataset.favoriteModel, machine));
        });
        elements.recommendationPanel.querySelectorAll('[data-favorite-status]').forEach((select) => {
            select.addEventListener('change', () => updateFavoriteStatus(select.dataset.favoriteStatus, machine, select.value));
        });
        elements.recommendationPanel.querySelectorAll('[data-compare-model]').forEach((button) => {
            button.addEventListener('click', () => toggleComparison(button.dataset.compareModel));
        });
        elements.recommendationPanel.querySelector('[data-open-comparison]')?.addEventListener('click', () => openCompareDialog(machine, compatibleById));
        elements.recommendationPanel.querySelector('[data-clear-comparison]')?.addEventListener('click', () => {
            state.compareModelIds = [];
            renderSelectedMachine();
        });
        elements.recommendationPanel.querySelectorAll('[data-open-test]').forEach((button) => {
            button.addEventListener('click', () => openTestDialog(button.dataset.openTest, machine));
        });
        elements.recommendationPanel.querySelector('[data-upgrade-model]')?.addEventListener('change', (event) => {
            state.upgradeModelId = event.target.value;
            renderSelectedMachine();
        });
    }

    function renderModelCard(model, machine, favorite, isCompared, canCompare) {
        const reasons = [...model.compatibilityReasons];
        reasons.push(`${formatNumber(model.size_gb)} GB model`);
        const saved = Boolean(favorite);

        return `
            <article class="lc-model-card" data-tier="${escapeAttribute(model.compatibilityTier)}">
                <div class="lc-model-meta">
                    <span class="lc-model-family">${escapeHtml(model.family || 'local model')}</span>
                    <button class="lc-favorite-button${saved ? ' is-saved' : ''}" type="button" data-favorite-model="${escapeAttribute(model.id)}" aria-label="${saved ? 'Remove' : 'Save'} ${escapeAttribute(model.name)} ${saved ? 'from' : 'for'} ${escapeAttribute(machine.name)}" title="${saved ? 'Remove from saved models' : `Save for ${escapeAttribute(machine.name)}`}">${saved ? '★' : '☆'}</button>
                    <span class="lc-tier-pill">${escapeHtml(model.compatibilityLabel)}</span>
                </div>
                <h3>${escapeHtml(model.name)}</h3>
                <div data-community-rating data-model-id="${escapeAttribute(model.id)}" data-rating-mode="interactive"></div>
                <p>${escapeHtml(model.description || 'Local model in the LocalClaw catalogue.')}</p>
                <div class="lc-reason-list">
                    ${reasons.slice(0, 4).map((reason) => `<span class="lc-spec-pill">${escapeHtml(reason)}</span>`).join('')}
                </div>
                ${saved ? `
                    <div class="lc-saved-controls">
                        <span>${escapeHtml(favorite.quantization || model.recommended_quant || 'Recommended quant')}</span>
                        <label>
                            <span class="sr-only">Saved model status</span>
                            <select data-favorite-status="${escapeAttribute(model.id)}">
                                ${favoriteStatusOptions(favorite.status)}
                            </select>
                        </label>
                        <button class="lc-test-button" type="button" data-open-test="${escapeAttribute(model.id)}">Test log</button>
                    </div>
                    ${renderTestSummary(favorite)}
                ` : ''}
                <footer class="lc-model-footer">
                    <span>${escapeHtml(model.runtimeNote)}</span>
                    <span class="lc-model-actions">
                        ${canCompare ? `<button class="lc-compare-button${isCompared ? ' is-selected' : ''}" type="button" data-compare-model="${escapeAttribute(model.id)}" aria-pressed="${isCompared ? 'true' : 'false'}">${isCompared ? 'Selected' : 'Compare'}</button>` : ''}
                        <a class="lc-model-link" href="/models/${encodeURIComponent(model.id)}">View model →</a>
                    </span>
                </footer>
            </article>
        `;
    }

    function renderCompareTray(models) {
        const canCompare = models.length >= 2;
        return `
            <section class="lc-compare-tray" aria-label="Selected models for comparison">
                <div>
                    <span class="lc-compare-count">${models.length}/4 selected</span>
                    <span class="lc-compare-names">${models.map((model) => escapeHtml(model.name)).join(' · ')}</span>
                </div>
                <div class="lc-compare-tray-actions">
                    <button class="lc-button" type="button" data-clear-comparison>Clear</button>
                    <button class="lc-button lc-button-primary" type="button" data-open-comparison${canCompare ? '' : ' disabled'}>Compare ${canCompare ? 'models' : 'after 2 picks'}</button>
                </div>
            </section>
        `;
    }

    function toggleComparison(modelId) {
        if (state.compareModelIds.includes(modelId)) {
            state.compareModelIds = state.compareModelIds.filter((id) => id !== modelId);
        } else if (state.compareModelIds.length >= 4) {
            showToast('Compare up to four models at a time.', 'error');
            return;
        } else {
            state.compareModelIds = [...state.compareModelIds, modelId];
        }
        renderSelectedMachine();
    }

    function openCompareDialog(machine, compatibleById) {
        const models = state.compareModelIds.map((modelId) => compatibleById.get(modelId)).filter(Boolean);
        if (models.length < 2) {
            showToast('Select at least two compatible models.', 'error');
            return;
        }

        const bestScore = Math.max(...models.map((model) => Number(model.compatibilityScore) || 0));
        const rows = [
            ['Personal fit', (model) => `${formatNumber(model.compatibilityScore)}/100`],
            ['Fit tier', (model) => model.compatibilityLabel],
            ['Parameters', (model) => model.params || 'Not listed'],
            ['Model size', (model) => `${formatNumber(model.size_gb)} GB`],
            ['Minimum RAM', (model) => `${formatNumber(model.min_ram)} GB`],
            ['Recommended quant', (model) => model.recommended_quant || 'Not listed'],
            ['Community', (model) => formatCommunityRating(model.id)],
            ['Quality', (model) => benchmarkValue(model, 'quality')],
            ['Coding', (model) => benchmarkValue(model, 'coding')],
            ['Reasoning', (model) => benchmarkValue(model, 'reasoning')],
            ['Speed', (model) => benchmarkValue(model, 'speed')],
            ['Saved status', (model) => getFavorite(machine.id, model.id)?.status || 'Not saved']
        ];

        elements.compareDialogBody.innerHTML = `
            <p class="lc-compare-intro">A side-by-side view for <strong>${escapeHtml(machine.name)}</strong>. Scores use the same hardware, use-case and priority settings as your recommendations.</p>
            <div class="lc-comparison-scroll">
                <table class="lc-comparison-table">
                    <thead>
                        <tr>
                            <th scope="col">Metric</th>
                            ${models.map((model) => `
                                <th scope="col">
                                    ${Number(model.compatibilityScore) === bestScore ? '<span class="lc-recommended-tag">Recommended</span>' : ''}
                                    <a href="/models/${encodeURIComponent(model.id)}">${escapeHtml(model.name)}</a>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(([label, valueFor]) => `
                            <tr>
                                <th scope="row">${escapeHtml(label)}</th>
                                ${models.map((model) => `<td>${escapeHtml(valueFor(model))}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        elements.compareDialog.showModal();
    }

    function closeCompareDialog() {
        if (elements.compareDialog.open) elements.compareDialog.close();
    }

    function renderTestSummary(favorite) {
        const hasTest = favorite.testVerdict && favorite.testVerdict !== 'untested';
        const hasSpeed = Number(favorite.measuredTps) > 0;
        const hasNotes = Boolean(String(favorite.notes || '').trim());
        if (!hasTest && !hasSpeed && !hasNotes) return '';

        const note = String(favorite.notes || '').trim();
        const shortNote = note.length > 110 ? `${note.slice(0, 107)}...` : note;
        return `
            <div class="lc-test-summary">
                <div class="lc-test-summary-head">
                    <span class="lc-test-verdict" data-verdict="${escapeAttribute(favorite.testVerdict || 'untested')}">${escapeHtml(testVerdictLabel(favorite.testVerdict))}</span>
                    ${hasSpeed ? `<strong>${formatNumber(favorite.measuredTps)} tok/s</strong>` : ''}
                    ${favorite.lastTestedAt ? `<time datetime="${escapeAttribute(favorite.lastTestedAt)}">${escapeHtml(formatShortDate(favorite.lastTestedAt))}</time>` : ''}
                </div>
                ${hasNotes ? `<p>${escapeHtml(shortNote)}</p>` : ''}
            </div>
        `;
    }

    function openTestDialog(modelId, machine) {
        const favorite = getFavorite(machine.id, modelId);
        const model = APP_DATA.models.find((item) => item.id === modelId);
        if (!favorite || !model) {
            showToast('Save this model before recording a test.', 'error');
            return;
        }

        elements.testForm.reset();
        elements.testFormError.textContent = '';
        document.getElementById('test-machine-id').value = machine.id;
        document.getElementById('test-model-id').value = model.id;
        document.getElementById('test-status').value = favorite.status || 'saved';
        document.getElementById('test-verdict').value = favorite.testVerdict || 'untested';
        document.getElementById('test-quantization').value = favorite.quantization || model.recommended_quant || '';
        document.getElementById('test-tps').value = favorite.measuredTps ?? '';
        document.getElementById('test-notes').value = favorite.notes || '';
        document.getElementById('test-dialog-copy').textContent = `${model.name} on ${machine.name}`;
        elements.testDialog.showModal();
        window.setTimeout(() => document.getElementById('test-verdict').focus(), 30);
    }

    function closeTestDialog() {
        if (elements.testDialog.open) elements.testDialog.close();
    }

    async function saveTestLog(event) {
        event.preventDefault();
        if (state.saving) return;

        const formData = new FormData(elements.testForm);
        const machineId = String(formData.get('machineId') || '');
        const modelId = String(formData.get('modelId') || '');
        const measuredValue = String(formData.get('measuredTps') || '').trim();
        const payload = {
            machineId,
            status: String(formData.get('status') || 'saved'),
            testVerdict: String(formData.get('testVerdict') || 'untested'),
            quantization: String(formData.get('quantization') || ''),
            measuredTps: measuredValue ? Number(measuredValue) : null,
            notes: String(formData.get('notes') || '')
        };

        state.saving = true;
        elements.testForm.classList.add('lc-loading');
        elements.testFormError.textContent = '';

        try {
            const response = await fetch(`/api/favorites/${encodeURIComponent(modelId)}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await readJson(response);
            if (!response.ok || !data?.favorite) {
                throw new Error(data?.message || 'Could not save this test log.');
            }

            state.favorites = [data.favorite, ...state.favorites.filter((favorite) => !(favorite.machineId === machineId && favorite.modelId === modelId))];
            closeTestDialog();
            renderSelectedMachine();
            showToast(payload.testVerdict === 'untested' ? 'Private test log saved.' : 'Test saved. You can now share a community rating.');
            if (payload.testVerdict !== 'untested') {
                window.setTimeout(() => window.LocalClawRatings?.focus(modelId, elements.recommendationPanel), 120);
            }
        } catch (error) {
            elements.testFormError.textContent = error.message || 'Could not save this test log.';
        } finally {
            state.saving = false;
            elements.testForm.classList.remove('lc-loading');
        }
    }

    function renderUpgradePlanner(machine, compatibleById) {
        const candidates = upgradeCandidates(compatibleById);
        if (!candidates.length) return '';

        if (!state.upgradeModelId || !candidates.some((model) => model.id === state.upgradeModelId)) {
            state.upgradeModelId = candidates[0].id;
        }

        const target = candidates.find((model) => model.id === state.upgradeModelId) || candidates[0];
        const requiredRam = recommendedTier(requiredMemoryForModel(target), [8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024]);
        const requiredVram = recommendedTier(Number(target.size_gb) / 0.88, [8, 12, 16, 24, 32, 48, 64, 80, 96, 128, 192]);
        const isApple = machine.accelerator === 'apple-silicon';
        const advice = isApple
            ? `Apple unified memory cannot be expanded after purchase. A ${requiredRam} GB unified-memory Mac is the planning target for this catalogue fit.`
            : machine.accelerator === 'nvidia'
                ? `Plan for at least ${requiredRam} GB system RAM. About ${requiredVram} GB VRAM is the full-offload planning tier; less VRAM may use partial offload.`
                : `Plan for at least ${requiredRam} GB system RAM. GPU acceleration and usable VRAM depend on your runtime and operating system.`;
        const primaryLink = isApple ? '/computers#apple-machines-title' : '/ram-gpu-for-local-ai#ram-picks';
        const primaryLabel = isApple ? 'Browse Apple systems' : 'Browse RAM upgrades';

        return `
            <section class="lc-upgrade-planner" aria-labelledby="upgrade-planner-title">
                <div class="lc-upgrade-heading">
                    <div>
                        <p class="lc-kicker">Hardware upgrade planner</p>
                        <h3 id="upgrade-planner-title">What would unlock a larger model?</h3>
                    </div>
                    <label>
                        <span>Target model</span>
                        <select data-upgrade-model>
                            ${candidates.slice(0, 80).map((model) => `<option value="${escapeAttribute(model.id)}"${model.id === target.id ? ' selected' : ''}>${escapeHtml(model.name)} · ${formatNumber(model.size_gb)} GB</option>`).join('')}
                        </select>
                    </label>
                </div>
                <div class="lc-upgrade-result">
                    <div><span>Current machine</span><strong>${escapeHtml(machine.ramGb)} GB${machine.vramGb ? ` · ${escapeHtml(machine.vramGb)} GB VRAM` : ''}</strong></div>
                    <div><span>Planning target</span><strong>${requiredRam} GB RAM${machine.accelerator === 'nvidia' ? ` · ${requiredVram} GB VRAM` : ''}</strong></div>
                    <div><span>Model size</span><strong>${formatNumber(target.size_gb)} GB</strong></div>
                </div>
                <p class="lc-upgrade-copy">${escapeHtml(advice)} These are conservative planning estimates, not a performance guarantee.</p>
                <div class="lc-upgrade-actions">
                    <a class="lc-button lc-button-primary" href="${primaryLink}">${primaryLabel}</a>
                    ${isApple ? '' : '<a class="lc-button" href="/ram-gpu-for-local-ai#gpu-picks">Browse GPUs</a>'}
                    <a class="lc-button" href="/models/${encodeURIComponent(target.id)}">View target model</a>
                </div>
            </section>
        `;
    }

    function upgradeCandidates(compatibleById) {
        const seen = new Set();
        return APP_DATA.models
            .filter((model) => {
                if (!model?.id || seen.has(model.id) || model.hosted_only || Number(model.size_gb) <= 0 || compatibleById.has(model.id)) return false;
                seen.add(model.id);
                return true;
            })
            .sort((a, b) => {
                const memoryDelta = requiredMemoryForModel(a) - requiredMemoryForModel(b);
                if (memoryDelta) return memoryDelta;
                return Number(b.benchmarks?.quality || 0) - Number(a.benchmarks?.quality || 0);
            });
    }

    function requiredMemoryForModel(model) {
        return Math.max(Number(model.min_ram) || 0, Math.ceil((Number(model.size_gb) || 0) + 2.5));
    }

    function recommendedTier(required, tiers) {
        const match = tiers.find((tier) => tier >= required);
        return match || Math.ceil(required / 128) * 128;
    }

    function benchmarkValue(model, key) {
        const value = Number(model.benchmarks?.[key]);
        return Number.isFinite(value) ? `${formatNumber(value)}/10` : 'Not listed';
    }

    function formatCommunityRating(modelId) {
        const aggregate = window.LocalClawRatings?.get(modelId);
        if (!aggregate?.count) return 'Not rated';
        return `${Number(aggregate.average).toFixed(1)}/5 · ${aggregate.count} vote${aggregate.count === 1 ? '' : 's'}`;
    }

    function testVerdictLabel(verdict) {
        if (verdict === 'works') return 'Works well';
        if (verdict === 'limited') return 'Works with limits';
        if (verdict === 'failed') return 'Did not work';
        return 'Not tested';
    }

    function formatShortDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }

    function savedModelForFavorite(favorite, compatibleById) {
        const compatible = compatibleById.get(favorite.modelId);
        if (compatible) return compatible;

        const model = APP_DATA.models.find((item) => item.id === favorite.modelId);
        if (!model || model.hosted_only) return null;

        return {
            ...model,
            compatibilityTier: 'too-large',
            compatibilityLabel: 'No longer fits',
            compatibilityReasons: ['Hardware profile changed', `${model.min_ram || '?'} GB minimum RAM`],
            runtimeNote: 'Review this machine before installing'
        };
    }

    async function toggleFavorite(modelId, machine) {
        const current = getFavorite(machine.id, modelId);
        const model = APP_DATA.models.find((item) => item.id === modelId);
        if (!model) return;

        const response = await fetch(
            current
                ? `/api/favorites/${encodeURIComponent(modelId)}?machineId=${encodeURIComponent(machine.id)}`
                : `/api/favorites/${encodeURIComponent(modelId)}`,
            {
                method: current ? 'DELETE' : 'PUT',
                credentials: 'same-origin',
                headers: current
                    ? { Accept: 'application/json' }
                    : { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: current ? undefined : JSON.stringify({
                    machineId: machine.id,
                    status: 'saved',
                    quantization: model.recommended_quant || ''
                })
            }
        );
        const data = await readJson(response);

        if (!response.ok) {
            showToast(data?.message || 'Could not update this saved model.', 'error');
            return;
        }

        if (current) {
            state.favorites = state.favorites.filter((favorite) => !(favorite.machineId === machine.id && favorite.modelId === modelId));
            showToast('Removed from saved models.');
        } else if (data?.favorite) {
            state.favorites = [data.favorite, ...state.favorites.filter((favorite) => !(favorite.machineId === machine.id && favorite.modelId === modelId))];
            showToast(`Saved for ${machine.name}.`);
        }

        renderSelectedMachine();
    }

    async function updateFavoriteStatus(modelId, machine, status) {
        const current = getFavorite(machine.id, modelId);
        if (!current) return;

        const response = await fetch(`/api/favorites/${encodeURIComponent(modelId)}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                machineId: machine.id,
                status,
                quantization: current.quantization
            })
        });
        const data = await readJson(response);

        if (!response.ok || !data?.favorite) {
            showToast(data?.message || 'Could not update model status.', 'error');
            renderSelectedMachine();
            return;
        }

        state.favorites = [data.favorite, ...state.favorites.filter((favorite) => !(favorite.machineId === machine.id && favorite.modelId === modelId))];
        showToast('Saved model status updated.');
        renderSelectedMachine();
    }

    async function acknowledgeNewModels() {
        const currentIds = currentLocalModelIds();
        const updated = await updateCatalogState(currentIds, true);
        if (!updated) return;

        state.knownModelIds = currentIds;
        state.newModelIds = [];
        if (state.viewMode === 'new') state.viewMode = 'compatible';
        renderSelectedMachine();
    }

    async function updateCatalogState(modelIds, notify) {
        try {
            const response = await fetch('/api/catalog-state', {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ knownModelIds: modelIds })
            });
            const data = await readJson(response);
            if (!response.ok) throw new Error(data?.message || 'Could not update catalogue state.');
            if (notify) showToast('New-model feed cleared.');
            return true;
        } catch (error) {
            if (notify) showToast(error.message || 'Could not update catalogue state.', 'error');
            return false;
        }
    }

    function currentLocalModelIds() {
        return [...new Set(APP_DATA.models.filter((model) => !model.hosted_only && Number(model.size_gb) > 0).map((model) => model.id))];
    }

    function countNewFitsForMachine(machine) {
        if (!state.newModelIds.length || !machine) return 0;
        const newIds = new Set(state.newModelIds);
        return window.LocalClawCompatibility.rankModels(machine, APP_DATA.models).compatible.filter((model) => newIds.has(model.id)).length;
    }

    function getFavorite(machineId, modelId) {
        return state.favorites.find((favorite) => favorite.machineId === machineId && favorite.modelId === modelId) || null;
    }

    function favoriteStatusOptions(selected) {
        return [
            ['saved', 'Saved'],
            ['to-test', 'To test'],
            ['downloaded', 'Downloaded'],
            ['installed', 'Installed']
        ].map(([value, label]) => `<option value="${value}"${selected === value ? ' selected' : ''}>${label}</option>`).join('');
    }

    function openMachineDialog(machine) {
        elements.form.reset();
        elements.formError.textContent = '';
        document.getElementById('machine-id').value = machine?.id || '';
        document.getElementById('machine-source').value = machine?.source || 'manual';
        document.getElementById('machine-name').value = machine?.name || '';
        document.getElementById('machine-platform').value = machine?.platform || 'macos';
        elements.accelerator.value = machine?.accelerator || 'apple-silicon';
        document.getElementById('machine-ram').value = machine?.ramGb || 16;
        elements.vramInput.value = machine?.vramGb ?? '';
        document.getElementById('machine-cpu').value = machine?.cpuModel || '';
        document.getElementById('machine-gpu').value = machine?.gpuModel || '';
        document.getElementById('machine-use-case').value = machine?.useCase || 'general';
        document.getElementById('machine-priority').value = machine?.priority || 'balanced';
        document.getElementById('machine-primary').checked = machine?.isPrimary === true || state.machines.length === 0;
        elements.dialogTitle.textContent = machine?.id ? 'Edit machine' : 'Add machine';
        updateVramField();
        elements.dialog.showModal();
        window.setTimeout(() => document.getElementById('machine-name').focus(), 30);
    }

    function closeMachineDialog() {
        if (elements.dialog.open) elements.dialog.close();
    }

    function updateVramField() {
        const showVram = elements.accelerator.value !== 'apple-silicon' && elements.accelerator.value !== 'cpu';
        elements.vramField.hidden = !showVram;
        elements.vramInput.required = elements.accelerator.value === 'nvidia';
        if (!showVram) elements.vramInput.value = '';
    }

    async function saveMachine(event) {
        event.preventDefault();
        if (state.saving) return;

        const formData = new FormData(elements.form);
        const id = String(formData.get('id') || '');
        const machine = {
            name: String(formData.get('name') || ''),
            platform: String(formData.get('platform') || ''),
            accelerator: String(formData.get('accelerator') || ''),
            cpuModel: String(formData.get('cpuModel') || ''),
            gpuModel: String(formData.get('gpuModel') || ''),
            ramGb: Number(formData.get('ramGb')),
            vramGb: formData.get('vramGb') === '' ? null : Number(formData.get('vramGb')),
            useCase: String(formData.get('useCase') || 'general'),
            priority: String(formData.get('priority') || 'balanced'),
            isPrimary: formData.get('isPrimary') === 'on',
            source: String(formData.get('source') || 'manual')
        };

        state.saving = true;
        elements.form.classList.add('lc-loading');
        elements.formError.textContent = '';

        try {
            const response = await fetch(id ? `/api/machines/${encodeURIComponent(id)}` : '/api/machines', {
                method: id ? 'PATCH' : 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(machine)
            });
            const data = await readJson(response);

            if (!response.ok) {
                const fieldMessage = Array.isArray(data?.fields) && data.fields.length
                    ? `Check: ${data.fields.join(', ')}.`
                    : '';
                throw new Error(data?.message || fieldMessage || 'Could not save this machine.');
            }

            closeMachineDialog();
            localStorage.removeItem(PENDING_MACHINE_KEY);
            await loadWorkspace(data.machine?.id || id);
            showToast(id ? 'Machine updated.' : 'Machine added.');
        } catch (error) {
            elements.formError.textContent = error.message || 'Could not save this machine.';
        } finally {
            state.saving = false;
            elements.form.classList.remove('lc-loading');
        }
    }

    async function deleteMachine(machine) {
        const confirmed = window.confirm(`Delete “${machine.name}” from your account?`);
        if (!confirmed) return;

        const response = await fetch(`/api/machines/${encodeURIComponent(machine.id)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        const data = await readJson(response);

        if (!response.ok) {
            showToast(data?.message || 'Could not delete this machine.', 'error');
            return;
        }

        state.selectedMachineId = null;
        await loadWorkspace();
        showToast('Machine deleted.');
    }

    function openPendingMachineIfNeeded() {
        const raw = localStorage.getItem(PENDING_MACHINE_KEY);
        if (!raw) return;

        try {
            const pending = JSON.parse(raw);
            openMachineDialog({ ...pending, id: '' });
            showToast('Review this hardware profile, then save it.');
        } catch {
            localStorage.removeItem(PENDING_MACHINE_KEY);
        }
    }

    function showSignedOut(message) {
        state.session = null;
        elements.dashboard.hidden = true;
        elements.authGate.hidden = false;
        elements.authError.textContent = message || authErrorFromUrl();
    }

    function showDashboard() {
        elements.authGate.hidden = true;
        elements.dashboard.hidden = false;
    }

    function authErrorFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('auth') === 'error' ? 'Google sign-in could not be completed. Please try again.' : '';
    }

    function setPageLoading(isLoading) {
        document.body.classList.toggle('lc-loading', isLoading);
    }

    function showToast(message, kind = 'success') {
        elements.toast.textContent = message;
        elements.toast.dataset.kind = kind;
        elements.toast.hidden = false;
        window.clearTimeout(showToast.timeout);
        showToast.timeout = window.setTimeout(() => {
            elements.toast.hidden = true;
        }, 3600);
    }

    async function readJson(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    function machineIcon(machine) {
        if (machine.accelerator === 'apple-silicon') return 'A';
        if (machine.accelerator === 'nvidia') return 'N';
        if (machine.accelerator === 'amd') return 'R';
        return 'C';
    }

    function machineSpec(machine) {
        const memory = machine.accelerator === 'apple-silicon'
            ? `${machine.ramGb} GB unified`
            : `${machine.ramGb} GB RAM`;
        return `${platformLabel(machine.platform)} · ${memory}`;
    }

    function fullMachineSpec(machine) {
        const parts = [platformLabel(machine.platform), `${machine.ramGb} GB ${machine.accelerator === 'apple-silicon' ? 'unified memory' : 'RAM'}`];
        if (machine.cpuModel) parts.push(machine.cpuModel);
        if (machine.gpuModel) parts.push(machine.gpuModel);
        if (machine.vramGb) parts.push(`${machine.vramGb} GB VRAM`);
        parts.push(`${machine.useCase} · ${machine.priority}`);
        return parts.join(' · ');
    }

    function platformLabel(platform) {
        if (platform === 'macos') return 'macOS';
        if (platform === 'windows') return 'Windows';
        return 'Linux';
    }

    function formatNumber(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '0';
        return Number.isInteger(number) ? String(number) : number.toFixed(1);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }
})();
