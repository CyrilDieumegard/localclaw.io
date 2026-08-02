(function () {
    'use strict';

    const PENDING_MACHINE_KEY = 'localclaw_pending_machine';
    const state = {
        session: null,
        machines: [],
        selectedMachineId: null,
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
            await loadMachines();
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
            const callbackURL = `${window.location.origin}/account`;
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
            window.location.assign('/account');
        }
    }

    async function loadMachines(preferredId) {
        const response = await fetch('/api/machines', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        const data = await readJson(response);

        if (response.status === 401) {
            showSignedOut();
            return;
        }

        if (!response.ok) {
            showToast(data?.message || 'Could not load your machines.', 'error');
            return;
        }

        state.machines = Array.isArray(data.machines) ? data.machines : [];
        state.selectedMachineId = chooseSelectedMachineId(preferredId);
        renderMachineList();
        renderSelectedMachine();
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

        elements.machineList.innerHTML = state.machines.map((machine) => `
            <button class="lc-machine-item${machine.id === state.selectedMachineId ? ' is-active' : ''}" type="button" data-machine-id="${escapeAttribute(machine.id)}">
                <span class="lc-machine-icon" aria-hidden="true">${machineIcon(machine)}</span>
                <span>
                    <span class="lc-machine-name">${escapeHtml(machine.name)}</span>
                    <span class="lc-machine-spec">${escapeHtml(machineSpec(machine))}</span>
                </span>
                ${machine.isPrimary ? '<span class="lc-primary-dot" title="Primary machine"></span>' : '<span></span>'}
            </button>
        `).join('');

        elements.machineList.querySelectorAll('[data-machine-id]').forEach((button) => {
            button.addEventListener('click', () => {
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
        const models = result.compatible.slice(0, 18);
        const bestCount = result.compatible.filter((model) => model.compatibilityTier === 'best').length;

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
                <div class="lc-summary-cell"><span class="lc-summary-value">${escapeHtml(machine.priority)}</span><span class="lc-summary-label">Optimization</span></div>
            </div>

            <div class="lc-model-grid">
                ${models.map(renderModelCard).join('')}
            </div>
        `;

        elements.recommendationPanel.querySelector('[data-edit-machine]')?.addEventListener('click', () => openMachineDialog(machine));
        elements.recommendationPanel.querySelector('[data-delete-machine]')?.addEventListener('click', () => deleteMachine(machine));
    }

    function renderModelCard(model) {
        const reasons = [...model.compatibilityReasons];
        reasons.push(`${formatNumber(model.size_gb)} GB model`);

        return `
            <article class="lc-model-card" data-tier="${escapeAttribute(model.compatibilityTier)}">
                <div class="lc-model-meta">
                    <span class="lc-model-family">${escapeHtml(model.family || 'local model')}</span>
                    <span class="lc-tier-pill">${escapeHtml(model.compatibilityLabel)}</span>
                </div>
                <h3>${escapeHtml(model.name)}</h3>
                <p>${escapeHtml(model.description || 'Local model in the LocalClaw catalogue.')}</p>
                <div class="lc-reason-list">
                    ${reasons.slice(0, 4).map((reason) => `<span class="lc-spec-pill">${escapeHtml(reason)}</span>`).join('')}
                </div>
                <footer class="lc-model-footer">
                    <span>${escapeHtml(model.runtimeNote)}</span>
                    <a class="lc-model-link" href="/models/${encodeURIComponent(model.id)}">View model →</a>
                </footer>
            </article>
        `;
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
            await loadMachines(data.machine?.id || id);
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
        await loadMachines();
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
