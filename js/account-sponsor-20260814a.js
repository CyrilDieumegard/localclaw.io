(function () {
    'use strict';

    const state = {
        accountReady: false,
        catalog: null,
        campaigns: [],
        activeView: 'machines',
        loading: false,
        saving: false,
        visualPreview: false
    };

    const elements = {};

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        cacheElements();
        bindEvents();
        const params = new URLSearchParams(window.location.search);
        state.visualPreview = isSponsorVisualPreview(params);
        const requestedView = params.get('view');
        if (requestedView === 'sponsorship' || state.visualPreview) switchView('sponsorship', false);
        if (state.visualPreview) renderVisualPreview();
    }

    function cacheElements() {
        elements.tabs = [...document.querySelectorAll('[data-account-tab]')];
        elements.panels = [...document.querySelectorAll('[data-account-panel]')];
        elements.machineAction = document.querySelector('[data-account-machine-action]');
        elements.campaignCount = document.getElementById('sponsor-campaign-count');
        elements.inventoryGrid = document.getElementById('sponsor-inventory-grid');
        elements.campaignList = document.getElementById('sponsor-campaign-list');
        elements.newCampaign = document.getElementById('new-sponsor-campaign');
        elements.dialog = document.getElementById('sponsor-dialog');
        elements.form = document.getElementById('sponsor-form');
        elements.formError = document.getElementById('sponsor-form-error');
        elements.dialogTitle = document.getElementById('sponsor-dialog-title');
        elements.closeDialog = document.getElementById('close-sponsor-dialog');
        elements.cancelEdit = document.getElementById('cancel-sponsor-edit');
        elements.saveDraft = document.getElementById('save-sponsor-draft');
        elements.submitReview = document.getElementById('submit-sponsor-review');
        elements.previewMark = document.getElementById('sponsor-preview-mark');
        elements.previewName = document.getElementById('sponsor-preview-name');
        elements.previewCopy = document.getElementById('sponsor-preview-copy');
        elements.toast = document.getElementById('toast');
    }

    function bindEvents() {
        elements.tabs.forEach((tab) => tab.addEventListener('click', () => switchView(tab.dataset.accountTab)));
        elements.newCampaign?.addEventListener('click', () => openCampaignDialog());
        elements.closeDialog?.addEventListener('click', closeCampaignDialog);
        elements.cancelEdit?.addEventListener('click', closeCampaignDialog);
        elements.form?.addEventListener('submit', (event) => saveCampaign(event, 'save'));
        elements.submitReview?.addEventListener('click', (event) => saveCampaign(event, 'submit'));
        elements.dialog?.addEventListener('click', (event) => {
            if (event.target === elements.dialog) closeCampaignDialog();
        });
        ['sponsor-advertiser-name', 'sponsor-tagline'].forEach((id) => {
            document.getElementById(id)?.addEventListener('input', renderCreativePreview);
        });
        document.addEventListener('localclaw:account-ready', () => {
            state.accountReady = true;
            if (state.activeView === 'sponsorship') loadSponsorWorkspace();
        });
    }

    function switchView(view, updateUrl = true) {
        if (!new Set(['machines', 'sponsorship']).has(view)) return;
        state.activeView = view;
        elements.tabs.forEach((tab) => {
            const active = tab.dataset.accountTab === view;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        elements.panels.forEach((panel) => {
            panel.hidden = panel.dataset.accountPanel !== view;
        });
        if (elements.machineAction) elements.machineAction.hidden = view !== 'machines';

        if (updateUrl) {
            const url = new URL(window.location.href);
            if (view === 'sponsorship') url.searchParams.set('view', 'sponsorship');
            else url.searchParams.delete('view');
            history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        }
        if (view === 'sponsorship' && state.accountReady) loadSponsorWorkspace();
    }

    function isSponsorVisualPreview(params = new URLSearchParams(window.location.search)) {
        const hostname = window.location.hostname.toLowerCase();
        const previewHost = hostname.endsWith('.pages.dev') || hostname === 'localhost' || hostname === '127.0.0.1';
        return previewHost && params.get('preview') === 'sponsorship';
    }

    function renderVisualPreview() {
        const mode = document.querySelector('.lc-sponsor-mode');
        if (mode) {
            mode.querySelector('strong').textContent = 'Read-only design preview';
            mode.querySelector('small').textContent = 'No account, database or billing connection';
        }
        if (elements.newCampaign) elements.newCampaign.textContent = '+ Preview campaign form';
        if (elements.campaignList) {
            elements.campaignList.innerHTML = '<div class="lc-sponsor-empty"><span aria-hidden="true">◇</span><div><strong>Live UI preview</strong><p>This branch preview uses no account or campaign data. Open the form to inspect the draft experience; saving and submission remain disabled.</p></div></div>';
        }
    }

    async function loadSponsorWorkspace() {
        if (state.loading) return;
        state.loading = true;
        renderLoading();
        try {
            const [catalogResponse, campaignsResponse] = await Promise.all([
                api('/api/sponsor/catalog'),
                api('/api/sponsor/campaigns')
            ]);
            if (!catalogResponse.ok) throw new Error(catalogResponse.data?.message || 'Could not load sponsor inventory.');
            if (!campaignsResponse.ok) throw new Error(campaignsResponse.data?.message || 'Could not load campaigns.');
            state.catalog = catalogResponse.data;
            state.campaigns = Array.isArray(campaignsResponse.data?.campaigns) ? campaignsResponse.data.campaigns : [];
            renderInventory();
            renderCampaigns();
        } catch (error) {
            renderWorkspaceError(error.message || 'Sponsorship workspace is temporarily unavailable.');
        } finally {
            state.loading = false;
        }
    }

    function renderLoading() {
        if (!elements.campaignList) return;
        elements.campaignList.innerHTML = '<div class="lc-sponsor-empty"><span class="lc-sponsor-spinner" aria-hidden="true"></span><div><strong>Loading campaigns</strong><p>Reading your private sponsor workspace…</p></div></div>';
    }

    function renderWorkspaceError(message) {
        if (!elements.campaignList) return;
        elements.campaignList.innerHTML = `<div class="lc-sponsor-empty lc-sponsor-empty--error"><span aria-hidden="true">!</span><div><strong>Workspace unavailable</strong><p>${escapeHtml(message)}</p><button class="lc-button" type="button" data-sponsor-retry>Retry</button></div></div>`;
        elements.campaignList.querySelector('[data-sponsor-retry]')?.addEventListener('click', loadSponsorWorkspace);
    }

    function renderInventory() {
        const placements = Array.isArray(state.catalog?.placements) ? state.catalog.placements : [];
        if (!elements.inventoryGrid || placements.length !== 6) return;
        elements.inventoryGrid.innerHTML = placements.map((placement) => `
            <article data-sponsor-placement="${escapeAttribute(placement.key)}">
                <span>${escapeHtml(placement.rail)} rail</span>
                <strong>${String(placement.position).padStart(2, '0')}</strong>
                <small>${placement.availability === 'not_for_sale' ? 'Preview only' : escapeHtml(placement.availability)}</small>
            </article>
        `).join('');
    }

    function renderCampaigns() {
        if (elements.campaignCount) elements.campaignCount.textContent = String(state.campaigns.length);
        if (!elements.campaignList) return;
        if (!state.campaigns.length) {
            elements.campaignList.innerHTML = '<div class="lc-sponsor-empty"><span aria-hidden="true">＋</span><div><strong>No campaigns yet</strong><p>Create a private draft. Submission does not reserve inventory or trigger payment.</p></div></div>';
            return;
        }

        elements.campaignList.innerHTML = state.campaigns.map((campaign) => {
            const editable = ['draft', 'changes_requested'].includes(campaign.status);
            const cancellable = ['draft', 'submitted', 'changes_requested', 'approved_pending_billing'].includes(campaign.status);
            const status = statusPresentation(campaign.status);
            const schedule = campaign.requestedStartDate && campaign.requestedEndDate
                ? `${formatDate(campaign.requestedStartDate)} → ${formatDate(campaign.requestedEndDate)}`
                : 'Schedule not set';
            const ctr = campaign.analytics?.ctrPercent === null || campaign.analytics?.ctrPercent === undefined
                ? '—'
                : `${campaign.analytics.ctrPercent}%`;
            return `
                <article class="lc-sponsor-campaign" data-campaign-id="${escapeAttribute(campaign.id)}">
                    <div class="lc-sponsor-campaign__identity">
                        <span class="lc-sponsor-campaign__mark">${escapeHtml(initials(campaign.advertiserName))}</span>
                        <div>
                            <span class="lc-sponsor-status" data-tone="${status.tone}">${status.label}</span>
                            <h4>${escapeHtml(campaign.campaignName)}</h4>
                            <p>${escapeHtml(campaign.advertiserName)} · ${escapeHtml(campaign.placement?.label || campaign.placementKey)}</p>
                        </div>
                    </div>
                    <div class="lc-sponsor-campaign__schedule"><span>Requested run</span><strong>${escapeHtml(schedule)}</strong></div>
                    <div class="lc-sponsor-campaign__metrics" aria-label="Campaign analytics">
                        <div><span>Impressions</span><strong>${formatNumber(campaign.analytics?.impressions || 0)}</strong></div>
                        <div><span>Clicks</span><strong>${formatNumber(campaign.analytics?.clicks || 0)}</strong></div>
                        <div><span>CTR</span><strong>${ctr}</strong></div>
                    </div>
                    <div class="lc-sponsor-campaign__actions">
                        ${editable ? '<button class="lc-button" type="button" data-sponsor-edit>Edit draft</button>' : ''}
                        ${cancellable ? '<button class="lc-button lc-button-danger" type="button" data-sponsor-cancel>Cancel</button>' : ''}
                    </div>
                </article>
            `;
        }).join('');

        elements.campaignList.querySelectorAll('[data-sponsor-edit]').forEach((button) => {
            button.addEventListener('click', () => openCampaignDialog(campaignForButton(button)));
        });
        elements.campaignList.querySelectorAll('[data-sponsor-cancel]').forEach((button) => {
            button.addEventListener('click', () => cancelCampaign(campaignForButton(button)));
        });
    }

    function campaignForButton(button) {
        const id = button.closest('[data-campaign-id]')?.dataset.campaignId;
        return state.campaigns.find((campaign) => campaign.id === id) || null;
    }

    function openCampaignDialog(campaign = null) {
        if (!elements.dialog || !elements.form) return;
        elements.form.reset();
        elements.formError.textContent = '';
        elements.form.elements.campaignId.value = campaign?.id || '';
        elements.form.elements.campaignName.value = campaign?.campaignName || '';
        elements.form.elements.advertiserName.value = campaign?.advertiserName || '';
        elements.form.elements.destinationUrl.value = campaign?.destinationUrl || '';
        elements.form.elements.tagline.value = campaign?.tagline || '';
        elements.form.elements.ctaLabel.value = campaign?.ctaLabel || 'Learn more';
        elements.form.elements.placementKey.value = campaign?.placementKey || 'home-left-1';
        elements.form.elements.requestedStartDate.value = campaign?.requestedStartDate || '';
        elements.form.elements.requestedEndDate.value = campaign?.requestedEndDate || '';
        elements.form.elements.logoAltText.value = campaign?.creative?.logoAltText || '';
        elements.dialogTitle.textContent = campaign ? 'Edit sponsorship campaign' : 'New sponsorship campaign';
        renderCreativePreview();
        elements.dialog.showModal();
        elements.form.elements.campaignName.focus();
    }

    function closeCampaignDialog() {
        if (elements.dialog?.open) elements.dialog.close();
    }

    function renderCreativePreview() {
        const advertiser = elements.form?.elements.advertiserName.value.trim() || 'Your product';
        const tagline = elements.form?.elements.tagline.value.trim() || 'Your concise campaign message will appear here.';
        if (elements.previewMark) elements.previewMark.textContent = initials(advertiser);
        if (elements.previewName) elements.previewName.textContent = advertiser;
        if (elements.previewCopy) elements.previewCopy.textContent = tagline;
    }

    async function saveCampaign(event, action) {
        event.preventDefault();
        if (state.saving || !elements.form) return;
        elements.formError.textContent = '';
        if (!elements.form.reportValidity()) return;

        if (state.visualPreview) {
            elements.formError.textContent = 'Read-only preview: this form cannot save, submit, reserve inventory or start billing.';
            showToast('Read-only preview — no campaign data was sent.');
            return;
        }

        const payload = formPayload();
        if (Boolean(payload.requestedStartDate) !== Boolean(payload.requestedEndDate)) {
            elements.formError.textContent = 'Choose both a requested start and end date, or leave both empty.';
            return;
        }
        if (action === 'submit' && (!payload.requestedStartDate || !payload.requestedEndDate)) {
            elements.formError.textContent = 'Add a requested schedule before submitting for review.';
            return;
        }

        setSaving(true);
        try {
            let campaignId = elements.form.elements.campaignId.value;
            let response;
            if (campaignId) {
                response = await api(`/api/sponsor/campaigns/${encodeURIComponent(campaignId)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ ...payload, action })
                });
            } else {
                response = await api('/api/sponsor/campaigns', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                campaignId = response.data?.campaign?.id || '';
                if (response.ok && action === 'submit') {
                    response = await api(`/api/sponsor/campaigns/${encodeURIComponent(campaignId)}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ action: 'submit' })
                    });
                }
            }
            if (!response.ok) {
                throw new Error(fieldError(response.data) || response.data?.message || 'Could not save the campaign.');
            }
            closeCampaignDialog();
            await loadSponsorWorkspace();
            showToast(action === 'submit' ? 'Campaign submitted for review. No inventory or payment was activated.' : 'Campaign draft saved.');
        } catch (error) {
            elements.formError.textContent = error.message || 'Could not save the campaign.';
        } finally {
            setSaving(false);
        }
    }

    async function cancelCampaign(campaign) {
        if (!campaign || !window.confirm(`Cancel “${campaign.campaignName}”? Nothing will be billed.`)) return;
        const response = await api(`/api/sponsor/campaigns/${encodeURIComponent(campaign.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'cancel' })
        });
        if (!response.ok) {
            showToast(response.data?.message || 'Could not cancel the campaign.', 'error');
            return;
        }
        await loadSponsorWorkspace();
        showToast('Campaign cancelled.');
    }

    function formPayload() {
        return {
            campaignName: elements.form.elements.campaignName.value,
            advertiserName: elements.form.elements.advertiserName.value,
            destinationUrl: elements.form.elements.destinationUrl.value,
            tagline: elements.form.elements.tagline.value,
            ctaLabel: elements.form.elements.ctaLabel.value,
            placementKey: elements.form.elements.placementKey.value,
            requestedStartDate: elements.form.elements.requestedStartDate.value || null,
            requestedEndDate: elements.form.elements.requestedEndDate.value || null,
            logoAltText: elements.form.elements.logoAltText.value || null
        };
    }

    function setSaving(saving) {
        state.saving = saving;
        [elements.saveDraft, elements.submitReview, elements.cancelEdit].forEach((button) => {
            if (button) button.disabled = saving;
        });
        elements.form?.classList.toggle('lc-loading', saving);
    }

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {})
            },
            ...options
        });
        let data = null;
        try { data = await response.json(); } catch {}
        return { ok: response.ok, status: response.status, data };
    }

    function fieldError(data) {
        const fields = Array.isArray(data?.fields) ? data.fields : [];
        if (!fields.length) return '';
        const labels = {
            campaignName: 'campaign name', advertiserName: 'advertiser name', destinationUrl: 'HTTPS destination URL',
            tagline: 'short message', ctaLabel: 'CTA label', placementKey: 'placement', schedule: 'requested schedule'
        };
        return `Check the ${fields.map((field) => labels[field] || field).join(', ')}.`;
    }

    function statusPresentation(status) {
        const map = {
            draft: ['Draft', 'neutral'],
            submitted: ['In review', 'pending'],
            changes_requested: ['Changes requested', 'attention'],
            approved_pending_billing: ['Approved · billing offline', 'pending'],
            cancelled: ['Cancelled', 'muted'],
            scheduled: ['Scheduled', 'positive'],
            active: ['Live', 'positive'],
            completed: ['Completed', 'muted']
        };
        const [label, tone] = map[status] || [String(status || 'Unknown').replace(/_/g, ' '), 'neutral'];
        return { label, tone };
    }

    function initials(value) {
        const words = String(value || 'LC').trim().split(/\s+/).filter(Boolean);
        return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'LC';
    }

    function formatDate(value) {
        const date = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(date.getTime())
            ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
            : value;
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('en').format(Number(value || 0));
    }

    function showToast(message, kind = 'success') {
        if (!elements.toast) return;
        elements.toast.textContent = message;
        elements.toast.dataset.kind = kind;
        elements.toast.hidden = false;
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => { elements.toast.hidden = true; }, 4200);
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[character]);
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }
})();
