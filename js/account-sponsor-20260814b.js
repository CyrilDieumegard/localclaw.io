(function () {
    'use strict';

    const state = {
        accountReady: false,
        catalog: null,
        campaigns: [],
        activeView: 'machines',
        loading: false,
        saving: false,
        visualPreview: false,
        selectedLogoFile: null,
        previewObjectUrl: null,
        checkoutReturnHandled: false,
        pendingIntentHandled: false
    };

    const elements = {};
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        cacheElements();
        bindEvents();
        const params = new URLSearchParams(window.location.search);
        state.visualPreview = isSponsorVisualPreview(params);
        if (params.get('view') === 'sponsorship' || state.visualPreview || params.has('checkout')) switchView('sponsorship', false);
        if (state.visualPreview) {
            state.accountReady = true;
            renderVisualPreview();
            openPendingSponsorIntent();
        }
    }

    function cacheElements() {
        elements.tabs = [...document.querySelectorAll('[data-account-tab]')];
        elements.panels = [...document.querySelectorAll('[data-account-panel]')];
        elements.machineAction = document.querySelector('[data-account-machine-action]');
        elements.campaignCount = document.getElementById('sponsor-campaign-count');
        elements.activeCount = document.getElementById('sponsor-active-count');
        elements.inventoryGrid = document.getElementById('sponsor-inventory-grid');
        elements.campaignList = document.getElementById('sponsor-campaign-list');
        elements.newCampaign = document.getElementById('new-sponsor-campaign');
        elements.manageBilling = document.getElementById('manage-sponsor-billing');
        elements.dialog = document.getElementById('sponsor-dialog');
        elements.form = document.getElementById('sponsor-form');
        elements.formError = document.getElementById('sponsor-form-error');
        elements.dialogTitle = document.getElementById('sponsor-dialog-title');
        elements.closeDialog = document.getElementById('close-sponsor-dialog');
        elements.cancelEdit = document.getElementById('cancel-sponsor-edit');
        elements.saveDraft = document.getElementById('save-sponsor-draft');
        elements.startCheckout = document.getElementById('start-sponsor-checkout');
        elements.planKey = document.getElementById('sponsor-plan-key');
        elements.startMode = document.getElementById('sponsor-start-mode');
        elements.dateField = document.getElementById('sponsor-date-field');
        elements.startDate = document.getElementById('sponsor-start-date');
        elements.placementKey = document.getElementById('sponsor-placement-key');
        elements.autoRenew = document.getElementById('sponsor-auto-renew');
        elements.acceptTerms = document.getElementById('sponsor-accept-terms');
        elements.logoFile = document.getElementById('sponsor-logo-file');
        elements.previewMark = document.getElementById('sponsor-preview-mark');
        elements.previewLogo = document.getElementById('sponsor-preview-logo');
        elements.previewName = document.getElementById('sponsor-preview-name');
        elements.previewCopy = document.getElementById('sponsor-preview-copy');
        elements.bookingSummary = document.getElementById('sponsor-booking-summary');
        elements.toast = document.getElementById('toast');
    }

    function bindEvents() {
        elements.tabs.forEach((tab) => tab.addEventListener('click', () => switchView(tab.dataset.accountTab)));
        elements.newCampaign?.addEventListener('click', () => openCampaignDialog());
        elements.manageBilling?.addEventListener('click', openBillingPortal);
        elements.closeDialog?.addEventListener('click', closeCampaignDialog);
        elements.cancelEdit?.addEventListener('click', closeCampaignDialog);
        elements.form?.addEventListener('submit', (event) => saveCampaign(event, 'save'));
        elements.startCheckout?.addEventListener('click', (event) => saveCampaign(event, 'checkout'));
        elements.dialog?.addEventListener('click', (event) => { if (event.target === elements.dialog) closeCampaignDialog(); });
        ['sponsor-advertiser-name', 'sponsor-tagline'].forEach((id) => document.getElementById(id)?.addEventListener('input', renderCreativePreview));
        [elements.planKey, elements.startMode, elements.startDate, elements.placementKey, elements.autoRenew].forEach((element) => {
            element?.addEventListener('change', renderBookingSummary);
        });
        elements.logoFile?.addEventListener('change', selectLogoFile);
        elements.previewLogo?.addEventListener('error', renderCreativePreviewFallback);
        document.addEventListener('localclaw:account-ready', (event) => {
            state.accountReady = true;
            identifyDataFastVisitor(event.detail?.session?.user);
            if (state.activeView === 'sponsorship') loadSponsorWorkspace();
        });
    }

    function switchView(view, updateUrl = true) {
        if (!new Set(['machines', 'sponsorship', 'campaign-admin']).has(view)) return;
        state.activeView = view;
        elements.tabs.forEach((tab) => {
            const active = tab.dataset.accountTab === view;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        elements.panels.forEach((panel) => { panel.hidden = panel.dataset.accountPanel !== view; });
        if (elements.machineAction) elements.machineAction.hidden = view !== 'machines';
        if (updateUrl) {
            const url = new URL(window.location.href);
            if (view === 'sponsorship') url.searchParams.set('view', 'sponsorship');
            else if (view === 'campaign-admin') url.searchParams.set('view', 'campaign-admin');
            else url.searchParams.delete('view');
            history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        }
        if (view === 'sponsorship' && state.accountReady) loadSponsorWorkspace();
        if (view === 'campaign-admin') document.dispatchEvent(new CustomEvent('localclaw:sponsor-admin-view'));
    }

    function isSponsorVisualPreview(params) {
        const hostname = window.location.hostname.toLowerCase();
        const previewHost = hostname.endsWith('.pages.dev') || hostname === 'localhost' || hostname === '127.0.0.1';
        return previewHost && params.get('preview') === 'sponsorship';
    }

    function renderVisualPreview() {
        state.catalog = mockCatalog();
        const mode = document.querySelector('.lc-sponsor-mode');
        if (mode) {
            mode.querySelector('strong').textContent = 'Read-only commerce preview';
            mode.querySelector('small').textContent = 'Stripe, D1 and logo storage stay disconnected';
        }
        if (elements.newCampaign) elements.newCampaign.textContent = '+ Preview checkout form';
        renderInventory();
        if (elements.campaignList) {
            elements.campaignList.innerHTML = '<div class="lc-sponsor-empty"><span aria-hidden="true">◇</span><div><strong>Live UI preview</strong><p>Inspect the fixed-slot booking form and launch pricing. Saving, logo upload, reservation and payment remain disabled on this visual preview.</p></div></div>';
        }
    }

    async function loadSponsorWorkspace() {
        if (state.loading || state.visualPreview) return;
        state.loading = true;
        renderLoading();
        try {
            const [catalogResponse, campaignsResponse] = await Promise.all([api('/api/sponsor/catalog'), api('/api/sponsor/campaigns')]);
            if (!catalogResponse.ok) throw new Error(catalogResponse.data?.message || 'Could not load sponsor inventory.');
            if (!campaignsResponse.ok) throw new Error(campaignsResponse.data?.message || 'Could not load campaigns.');
            state.catalog = catalogResponse.data;
            state.campaigns = Array.isArray(campaignsResponse.data?.campaigns) ? campaignsResponse.data.campaigns : [];
            renderInventory();
            renderCampaigns();
            await handleCheckoutReturn();
            openPendingSponsorIntent();
        } catch (error) {
            renderWorkspaceError(error.message || 'Sponsorship workspace is temporarily unavailable.');
        } finally {
            state.loading = false;
        }
    }

    function renderLoading() {
        if (elements.campaignList) elements.campaignList.innerHTML = '<div class="lc-sponsor-empty"><span class="lc-sponsor-spinner" aria-hidden="true"></span><div><strong>Loading campaigns</strong><p>Reading fixed inventory and your private Stripe-backed campaign state…</p></div></div>';
    }

    function renderWorkspaceError(message) {
        if (!elements.campaignList) return;
        elements.campaignList.innerHTML = `<div class="lc-sponsor-empty lc-sponsor-empty--error"><span aria-hidden="true">!</span><div><strong>Workspace unavailable</strong><p>${escapeHtml(message)}</p><button class="lc-button" type="button" data-sponsor-retry>Retry</button></div></div>`;
        elements.campaignList.querySelector('[data-sponsor-retry]')?.addEventListener('click', loadSponsorWorkspace);
    }

    function renderInventory() {
        const placements = Array.isArray(state.catalog?.placements) ? state.catalog.placements : [];
        if (!elements.inventoryGrid || placements.length !== 6) return;
        elements.inventoryGrid.innerHTML = placements.map((placement) => {
            const blocks = Array.isArray(placement.blockedRanges) ? placement.blockedRanges : [];
            const recurring = blocks.some((range) => range.recurring);
            const note = recurring ? 'Auto-renew reserved' : blocks.length ? `${blocks.length} booked period${blocks.length === 1 ? '' : 's'}` : 'Open dates';
            return `<article data-sponsor-placement="${escapeAttribute(placement.key)}" data-state="${blocks.length ? 'bounded' : 'open'}"><span>${escapeHtml(placement.rail)} rail</span><strong>${String(placement.position).padStart(2, '0')}</strong><small>${escapeHtml(note)}</small></article>`;
        }).join('');
    }

    function renderCampaigns() {
        if (elements.campaignCount) elements.campaignCount.textContent = String(state.campaigns.length);
        const active = state.campaigns.filter((campaign) => campaign.status === 'active').length;
        if (elements.activeCount) elements.activeCount.textContent = String(active);
        const hasBilling = state.campaigns.some((campaign) => campaign.billing?.customerConfigured);
        if (elements.manageBilling) elements.manageBilling.hidden = !hasBilling;
        if (!elements.campaignList) return;
        if (!state.campaigns.length) {
            elements.campaignList.innerHTML = '<div class="lc-sponsor-empty"><span aria-hidden="true">＋</span><div><strong>No campaigns yet</strong><p>Create a draft, upload a logo and reserve one fixed position through Stripe.</p></div></div>';
            return;
        }
        elements.campaignList.innerHTML = state.campaigns.map(campaignCard).join('');
        elements.campaignList.querySelectorAll('[data-sponsor-edit]').forEach((button) => button.addEventListener('click', () => openCampaignDialog(campaignForButton(button))));
        elements.campaignList.querySelectorAll('[data-sponsor-cancel]').forEach((button) => button.addEventListener('click', () => cancelCampaign(campaignForButton(button))));
        elements.campaignList.querySelectorAll('[data-sponsor-cancel-checkout]').forEach((button) => button.addEventListener('click', () => cancelCheckout(campaignForButton(button))));
        elements.campaignList.querySelectorAll('[data-sponsor-manage-billing]').forEach((button) => button.addEventListener('click', openBillingPortal));
    }

    function campaignCard(campaign) {
        const editable = ['draft', 'changes_requested'].includes(campaign.storedStatus || campaign.status);
        const pendingCheckout = campaign.billing?.status === 'pending';
        const status = statusPresentation(campaign.status, campaign.billing?.status);
        const schedule = campaign.startsAt && campaign.paidThrough
            ? `${formatDateTime(campaign.startsAt)} → ${formatDateTime(campaign.paidThrough)}`
            : 'Not purchased';
        const ctr = campaign.analytics?.ctrPercent === null || campaign.analytics?.ctrPercent === undefined ? '—' : `${campaign.analytics.ctrPercent}%`;
        const mark = campaign.creative?.logoUrl
            ? `<img src="${escapeAttribute(campaign.creative.logoUrl)}" alt="${escapeAttribute(campaign.creative.logoAltText || '')}">`
            : escapeHtml(initials(campaign.advertiserName));
        const price = campaign.price ? `${formatMoney(campaign.price.amountCents, campaign.price.currency)} · ${campaign.planKey === 'month' ? 'month' : '7 days'}` : 'Draft';
        return `<article class="lc-sponsor-campaign" data-campaign-id="${escapeAttribute(campaign.id)}">
            <div class="lc-sponsor-campaign__identity"><span class="lc-sponsor-campaign__mark">${mark}</span><div><span class="lc-sponsor-status" data-tone="${status.tone}">${status.label}</span><h4>${escapeHtml(campaign.campaignName)}</h4><p>${escapeHtml(campaign.advertiserName)} · ${escapeHtml(campaign.placement?.label || campaign.placementKey)}</p></div></div>
            <div class="lc-sponsor-campaign__schedule"><span>${escapeHtml(price)}</span><strong>${escapeHtml(schedule)}</strong><small>${campaign.autoRenew ? 'Stripe auto-renewal' : 'One-time booking'}</small></div>
            <div class="lc-sponsor-campaign__metrics" aria-label="Campaign analytics">
                <div><span>Visible</span><strong>${formatNumber(campaign.analytics?.impressions || 0)}</strong></div>
                <div><span>Visitors</span><strong>${formatNumber(campaign.analytics?.uniqueVisitors || 0)}</strong></div>
                <div><span>Clicks</span><strong>${formatNumber(campaign.analytics?.clicks || 0)}</strong></div>
                <div><span>CTR</span><strong>${ctr}</strong></div>
            </div>
            <div class="lc-sponsor-campaign__actions">
                ${editable ? '<button class="lc-button" type="button" data-sponsor-edit>Edit draft</button><button class="lc-button lc-button-danger" type="button" data-sponsor-cancel>Cancel draft</button>' : ''}
                ${pendingCheckout ? '<button class="lc-button lc-button-danger" type="button" data-sponsor-cancel-checkout>Cancel checkout</button>' : ''}
                ${campaign.billing?.subscriptionConfigured ? '<button class="lc-button" type="button" data-sponsor-manage-billing>Manage renewal</button>' : ''}
            </div>
        </article>`;
    }

    function campaignForButton(button) {
        const id = button.closest('[data-campaign-id]')?.dataset.campaignId;
        return state.campaigns.find((campaign) => campaign.id === id) || null;
    }

    function openCampaignDialog(campaign = null, defaults = {}) {
        if (!elements.dialog || !elements.form) return;
        elements.form.reset();
        clearPreviewObjectUrl();
        state.selectedLogoFile = null;
        elements.formError.textContent = '';
        elements.form.elements.campaignId.value = campaign?.id || '';
        elements.form.elements.campaignName.value = campaign?.campaignName || '';
        elements.form.elements.advertiserName.value = campaign?.advertiserName || '';
        elements.form.elements.destinationUrl.value = campaign?.destinationUrl || '';
        elements.form.elements.tagline.value = campaign?.tagline || '';
        elements.form.elements.ctaLabel.value = campaign?.ctaLabel || 'Learn more';
        const requestedPlacement = placementByKey(defaults.placementKey) ? defaults.placementKey : 'home-left-1';
        const requestedPlan = planByKey(defaults.planKey) ? defaults.planKey : 'week';
        elements.form.elements.placementKey.value = campaign?.placementKey || requestedPlacement;
        elements.form.elements.logoAltText.value = campaign?.creative?.logoAltText || '';
        elements.planKey.value = campaign?.planKey || requestedPlan;
        elements.startMode.value = 'now';
        elements.autoRenew.checked = Boolean(campaign?.autoRenew);
        elements.acceptTerms.checked = false;
        elements.dialogTitle.textContent = campaign ? 'Edit sponsorship campaign' : 'New sponsorship campaign';
        renderCreativePreview(campaign?.creative?.logoUrl || null);
        configureDateInput();
        renderBookingSummary();
        elements.dialog.showModal();
        elements.form.elements.campaignName.focus();
    }

    function openPendingSponsorIntent() {
        if (state.pendingIntentHandled || !state.accountReady || !state.catalog) return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('intent') !== 'new') return;
        state.pendingIntentHandled = true;
        const placementKey = url.searchParams.get('placement') || '';
        const planKey = url.searchParams.get('plan') || 'week';
        openCampaignDialog(null, { placementKey, planKey });
        trackDataFastGoal('sponsor_campaign_form_opened', {
            source: 'homepage_offer_modal',
            placement: placementByKey(placementKey) ? placementKey : 'unselected',
            plan: planByKey(planKey) ? planKey : 'week'
        });
        ['intent', 'placement', 'plan', 'next'].forEach((key) => url.searchParams.delete(key));
        url.searchParams.set('view', 'sponsorship');
        history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }

    function closeCampaignDialog() {
        clearPreviewObjectUrl();
        if (elements.dialog?.open) elements.dialog.close();
    }

    function selectLogoFile() {
        clearPreviewObjectUrl();
        const file = elements.logoFile?.files?.[0] || null;
        state.selectedLogoFile = file;
        if (!file) return renderCreativePreview();
        if (!new Set(['image/png', 'image/webp']).has(file.type) || file.size > 512 * 1024) {
            elements.formError.textContent = 'Choose a genuine PNG or WebP logo no larger than 512 KB.';
            elements.logoFile.value = '';
            state.selectedLogoFile = null;
            return;
        }
        state.previewObjectUrl = URL.createObjectURL(file);
        renderCreativePreview(state.previewObjectUrl);
    }

    function renderCreativePreview(explicitLogoUrl) {
        const advertiser = elements.form?.elements.advertiserName.value.trim() || 'Your product';
        const tagline = elements.form?.elements.tagline.value.trim() || 'Your concise campaign message will appear here.';
        if (elements.previewName) elements.previewName.textContent = advertiser;
        if (elements.previewCopy) elements.previewCopy.textContent = tagline;
        const logoUrl = explicitLogoUrl || state.previewObjectUrl;
        if (logoUrl && elements.previewLogo) {
            elements.previewLogo.src = logoUrl;
            elements.previewLogo.alt = '';
            elements.previewLogo.hidden = false;
            elements.previewMark.hidden = true;
        } else {
            elements.previewLogo.hidden = true;
            elements.previewLogo.removeAttribute('src');
            elements.previewMark.hidden = false;
            elements.previewMark.textContent = initials(advertiser);
        }
    }

    function renderCreativePreviewFallback() {
        if (!elements.previewLogo || !elements.previewMark) return;
        elements.previewLogo.hidden = true;
        elements.previewLogo.removeAttribute('src');
        elements.previewMark.hidden = false;
        elements.previewMark.textContent = initials(elements.form?.elements.advertiserName.value || 'LC');
    }

    function configureDateInput() {
        if (!elements.startDate) return;
        const today = new Date().toISOString().slice(0, 10);
        const maxDays = Number(state.catalog?.schedule?.maxScheduleDays || 365);
        const max = new Date(Date.now() + maxDays * 86400000).toISOString().slice(0, 10);
        elements.startDate.min = today;
        elements.startDate.max = max;
        if (!elements.startDate.value) elements.startDate.value = today;
    }

    function renderBookingSummary() {
        if (!elements.bookingSummary || !state.catalog) return;
        elements.dateField.hidden = elements.startMode.value !== 'date';
        elements.startDate.required = elements.startMode.value === 'date';
        const plan = planByKey(elements.planKey.value);
        const schedule = clientSchedule(plan?.key || 'week');
        const placement = placementByKey(elements.placementKey.value);
        const unavailable = placement && schedule ? rangesOverlap(placement.blockedRanges, schedule.startsAt, schedule.endsAt) : false;
        const price = formatMoney(plan?.priceCents || 0, state.catalog.pricing?.currency || 'usd');
        const period = plan?.key === 'month' ? 'one calendar month' : '7 days';
        elements.bookingSummary.dataset.state = unavailable ? 'unavailable' : 'available';
        elements.bookingSummary.innerHTML = `<span>${unavailable ? 'Dates unavailable' : 'Launch price'}</span><strong>${escapeHtml(price)} · ${escapeHtml(period)}</strong><p>${unavailable ? 'This exact fixed position overlaps another hold or paid booking. Choose another date or position.' : `${elements.autoRenew.checked ? 'Automatic Stripe renewal enabled. ' : ''}${schedule ? `${formatDateTime(schedule.startsAt)} → ${formatDateTime(schedule.endsAt)}.` : ''} No rotation.`}</p>`;
        if (elements.startCheckout) {
            elements.startCheckout.disabled = unavailable || !state.catalog.billing?.checkoutAvailable;
            elements.startCheckout.textContent = state.catalog.billing?.checkoutAvailable ? 'Continue to Stripe' : 'Stripe pilot access required';
        }
    }

    async function saveCampaign(event, action) {
        event.preventDefault();
        if (state.saving || !elements.form) return;
        elements.formError.textContent = '';
        if (!elements.form.reportValidity()) return;
        if (state.visualPreview) {
            elements.formError.textContent = 'Read-only preview: no campaign, reservation, logo or payment request was sent.';
            return;
        }
        if (action === 'checkout' && !elements.acceptTerms.checked) {
            elements.formError.textContent = 'Accept the current LocalClaw sponsorship terms before checkout.';
            return;
        }
        setSaving(true);
        try {
            const payload = formPayload();
            let campaignId = elements.form.elements.campaignId.value;
            let saved;
            if (campaignId) {
                saved = await api(`/api/sponsor/campaigns/${encodeURIComponent(campaignId)}`, { method: 'PATCH', body: JSON.stringify({ ...payload, action: 'save' }) });
            } else {
                saved = await api('/api/sponsor/campaigns', { method: 'POST', body: JSON.stringify(payload) });
                campaignId = saved.data?.campaign?.id || '';
                elements.form.elements.campaignId.value = campaignId;
            }
            if (!saved.ok || !campaignId) throw new Error(fieldError(saved.data) || saved.data?.message || 'Could not save the campaign draft.');
            if (state.selectedLogoFile) await uploadLogo(campaignId, state.selectedLogoFile);
            const currentCampaign = saved.data?.campaign;
            if (action === 'save') {
                closeCampaignDialog();
                await loadSponsorWorkspace();
                showToast('Campaign draft saved. No inventory was reserved and nothing was billed.');
                return;
            }
            if (!state.selectedLogoFile && !currentCampaign?.creative?.logoUrl) {
                throw new Error('Upload a PNG or WebP logo before checkout.');
            }
            const schedule = checkoutPayload();
            const checkout = await api(`/api/sponsor/campaigns/${encodeURIComponent(campaignId)}/checkout`, {
                method: 'POST',
                body: JSON.stringify(schedule)
            });
            if (!checkout.ok || !checkout.data?.checkoutUrl) {
                throw new Error(checkout.data?.message || 'Stripe checkout could not be opened.');
            }
            trackDataFastGoal('sponsor_checkout_started', {
                campaign_id: campaignId,
                plan: schedule.planKey,
                placement: payload.placementKey,
                start_mode: schedule.startMode,
                auto_renew: schedule.autoRenew ? 'true' : 'false'
            });
            window.location.assign(checkout.data.checkoutUrl);
        } catch (error) {
            elements.formError.textContent = error.message || 'Could not prepare the campaign.';
        } finally {
            setSaving(false);
        }
    }

    async function uploadLogo(campaignId, file) {
        const response = await fetch(`/api/sponsor/campaigns/${encodeURIComponent(campaignId)}/logo`, {
            method: 'PUT', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': file.type }, body: file
        });
        let data = null;
        try { data = await response.json(); } catch {}
        if (!response.ok) throw new Error(data?.message || 'The logo could not be uploaded.');
    }

    async function cancelCampaign(campaign) {
        if (!campaign || !window.confirm(`Cancel the draft “${campaign.campaignName}”?`)) return;
        const response = await api(`/api/sponsor/campaigns/${encodeURIComponent(campaign.id)}`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) });
        if (!response.ok) return showToast(response.data?.message || 'Could not delete the draft.', 'error');
        await loadSponsorWorkspace();
        showToast('Campaign draft cancelled.');
    }

    async function cancelCheckout(campaign) {
        if (!campaign || !window.confirm(`Cancel the open Stripe checkout for “${campaign.campaignName}” and release its dates?`)) return;
        const response = await api(`/api/sponsor/campaigns/${encodeURIComponent(campaign.id)}/checkout/cancel`, { method: 'POST' });
        if (!response.ok) return showToast(response.data?.message || 'The checkout could not be cancelled.', 'error');
        await loadSponsorWorkspace();
        showToast('Checkout cancelled and temporary date hold released.');
    }

    async function openBillingPortal() {
        const response = await api('/api/sponsor/billing-portal', { method: 'POST' });
        if (!response.ok || !response.data?.portalUrl) return showToast(response.data?.message || 'Stripe billing management is unavailable.', 'error');
        window.location.assign(response.data.portalUrl);
    }

    async function handleCheckoutReturn() {
        if (state.checkoutReturnHandled) return;
        const params = new URLSearchParams(window.location.search);
        const result = params.get('checkout');
        if (!result) return;
        state.checkoutReturnHandled = true;
        if (result === 'cancelled' && params.get('campaign_id')) {
            const response = await api(`/api/sponsor/campaigns/${encodeURIComponent(params.get('campaign_id'))}/checkout/cancel`, { method: 'POST' });
            showToast(response.ok ? 'Checkout cancelled. The temporary date hold was released.' : 'Checkout cancelled. Its hold will expire automatically.', response.ok ? 'success' : 'error');
        } else if (result === 'success') {
            showToast('Payment returned from Stripe. Verified activation may take a few seconds.');
            for (let attempt = 0; attempt < 4; attempt += 1) {
                await delay(1500);
                const response = await api('/api/sponsor/campaigns');
                if (response.ok) {
                    state.campaigns = response.data.campaigns || [];
                    renderCampaigns();
                    if (state.campaigns.some((campaign) => ['paid'].includes(campaign.billing?.status))) break;
                }
            }
        }
        const url = new URL(window.location.href);
        ['checkout', 'session_id', 'campaign_id'].forEach((key) => url.searchParams.delete(key));
        url.searchParams.set('view', 'sponsorship');
        history.replaceState(null, '', `${url.pathname}${url.search}`);
    }

    function formPayload() {
        return {
            campaignName: elements.form.elements.campaignName.value,
            advertiserName: elements.form.elements.advertiserName.value,
            destinationUrl: elements.form.elements.destinationUrl.value,
            tagline: elements.form.elements.tagline.value,
            ctaLabel: elements.form.elements.ctaLabel.value,
            placementKey: elements.form.elements.placementKey.value,
            requestedStartDate: null,
            requestedEndDate: null,
            logoAltText: elements.form.elements.logoAltText.value
        };
    }

    function checkoutPayload() {
        return {
            planKey: elements.planKey.value,
            startMode: elements.startMode.value,
            startDate: elements.startMode.value === 'date' ? elements.startDate.value : null,
            autoRenew: elements.autoRenew.checked,
            acceptTerms: elements.acceptTerms.checked,
            termsVersion: state.catalog.termsVersion,
            pricingVersion: state.catalog.pricing.version
        };
    }

    function clientSchedule(planKey) {
        let startsAt;
        if (elements.startMode.value === 'now') startsAt = new Date();
        else if (elements.startDate.value) startsAt = new Date(`${elements.startDate.value}T00:00:00Z`);
        if (!startsAt || !Number.isFinite(startsAt.getTime())) return null;
        const endsAt = new Date(startsAt.getTime());
        if (planKey === 'month') {
            const day = endsAt.getUTCDate();
            const targetMonth = endsAt.getUTCMonth() + 1;
            endsAt.setUTCDate(1);
            endsAt.setUTCMonth(targetMonth);
            const last = new Date(Date.UTC(endsAt.getUTCFullYear(), endsAt.getUTCMonth() + 1, 0)).getUTCDate();
            endsAt.setUTCDate(Math.min(day, last));
        } else endsAt.setUTCDate(endsAt.getUTCDate() + 7);
        return { startsAt, endsAt };
    }

    function rangesOverlap(ranges, start, end) {
        return (ranges || []).some((range) => {
            const rangeStart = new Date(range.startsAt);
            const rangeEnd = range.blocksUntil ? new Date(range.blocksUntil) : new Date('9999-12-31T23:59:59Z');
            return rangeStart < end && rangeEnd > start;
        });
    }

    function planByKey(key) { return (state.catalog?.pricing?.plans || []).find((plan) => plan.key === key) || null; }
    function placementByKey(key) { return (state.catalog?.placements || []).find((placement) => placement.key === key) || null; }

    function setSaving(saving) {
        state.saving = saving;
        [elements.saveDraft, elements.startCheckout, elements.cancelEdit].forEach((button) => {
            if (!button) return;
            const checkoutBlocked = button === elements.startCheckout && (
                elements.bookingSummary?.dataset.state === 'unavailable' || !state.catalog?.billing?.checkoutAvailable
            );
            button.disabled = saving || checkoutBlocked;
        });
        elements.form?.classList.toggle('lc-loading', saving);
    }

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
            ...options
        });
        let data = null;
        try { data = await response.json(); } catch {}
        return { ok: response.ok, status: response.status, data };
    }

    function identifyDataFastVisitor(user) {
        if (!user?.id || typeof window.datafast !== 'function') return;
        const profile = {
            user_id: String(user.id).slice(0, 255),
            account_area: 'sponsorship'
        };
        if (user.name) profile.name = String(user.name).slice(0, 255);
        if (user.image && /^https:\/\//i.test(String(user.image))) profile.image = String(user.image).slice(0, 250);
        try { window.datafast('identify', profile); } catch {}
    }

    function trackDataFastGoal(name, parameters = {}) {
        if (typeof window.datafast !== 'function') return;
        try { window.datafast(name, parameters); } catch {}
    }

    function fieldError(data) {
        const fields = Array.isArray(data?.fields) ? data.fields : [];
        if (!fields.length) return '';
        const labels = { campaignName: 'campaign name', advertiserName: 'advertiser name', destinationUrl: 'HTTPS destination URL', tagline: 'short message', ctaLabel: 'CTA label', placementKey: 'fixed placement', startDate: 'start date', planKey: 'period' };
        return `Check the ${fields.map((field) => labels[field] || field).join(', ')}.`;
    }

    function statusPresentation(status, billingStatus) {
        if (billingStatus === 'pending') return { label: 'Checkout hold', tone: 'pending' };
        if (billingStatus === 'failed') return { label: 'Payment failed', tone: 'attention' };
        const map = { draft: ['Draft', 'neutral'], changes_requested: ['Changes requested', 'attention'], cancelled: ['Cancelled', 'muted'], scheduled: ['Scheduled', 'positive'], active: ['Live', 'positive'], completed: ['Completed', 'muted'] };
        const [label, tone] = map[status] || [String(status || 'Unknown').replace(/_/g, ' '), 'neutral'];
        return { label, tone };
    }

    function mockCatalog() {
        return {
            placements: ['left-1', 'left-2', 'left-3', 'right-1', 'right-2', 'right-3'].map((key) => ({ key: `home-${key}`, rail: key.split('-')[0], position: Number(key.split('-')[1]), blockedRanges: [] })),
            pricing: { version: 1, currency: 'usd', plans: [{ key: 'week', priceCents: 2900 }, { key: 'month', priceCents: 9900 }] },
            billing: { checkoutAvailable: false }, schedule: { maxScheduleDays: 365 }, termsVersion: '2026-08-14-v1'
        };
    }

    function initials(value) { return String(value || 'LC').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'LC'; }
    function formatDateTime(value) { const date = value instanceof Date ? value : new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date) : '—'; }
    function formatNumber(value) { return new Intl.NumberFormat('en').format(Number(value || 0)); }
    function formatMoney(cents, currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase(), maximumFractionDigits: 0 }).format(Number(cents || 0) / 100); }
    function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
    function clearPreviewObjectUrl() { if (state.previewObjectUrl) URL.revokeObjectURL(state.previewObjectUrl); state.previewObjectUrl = null; }
    function showToast(message, kind = 'success') { if (!elements.toast) return; elements.toast.textContent = message; elements.toast.dataset.kind = kind; elements.toast.hidden = false; window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => { elements.toast.hidden = true; }, 5200); }
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
    function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
})();
