(function () {
    'use strict';

    const state = { authorized: false, loading: false, overview: null, activeCampaign: null, visualPreview: false };
    const elements = {};
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        cacheElements();
        bindEvents();
        state.visualPreview = isLocalVisualPreview();
        if (state.visualPreview) {
            renderLocalVisualPreview();
            return;
        }
        if (document.getElementById('account-dashboard')?.hidden === false) probeAdminAccess();
    }

    function cacheElements() {
        elements.tab = document.getElementById('sponsor-admin-tab');
        elements.panel = document.getElementById('account-sponsor-admin-panel');
        elements.email = document.getElementById('sponsor-admin-email');
        elements.total = document.getElementById('sponsor-admin-total');
        elements.active = document.getElementById('sponsor-admin-active');
        elements.scheduled = document.getElementById('sponsor-admin-scheduled');
        elements.impressions = document.getElementById('sponsor-admin-impressions');
        elements.visitors = document.getElementById('sponsor-admin-visitors');
        elements.clicks = document.getElementById('sponsor-admin-clicks');
        elements.ctr = document.getElementById('sponsor-admin-ctr');
        elements.timeline = document.getElementById('sponsor-admin-timeline');
        elements.refresh = document.getElementById('sponsor-admin-refresh');
        elements.search = document.getElementById('sponsor-admin-search');
        elements.status = document.getElementById('sponsor-admin-status');
        elements.placement = document.getElementById('sponsor-admin-placement');
        elements.campaigns = document.getElementById('sponsor-admin-campaign-list');
        elements.audit = document.getElementById('sponsor-admin-audit-list');
        elements.dialog = document.getElementById('sponsor-admin-action-dialog');
        elements.form = document.getElementById('sponsor-admin-action-form');
        elements.dialogTitle = document.getElementById('sponsor-admin-dialog-title');
        elements.dialogCopy = document.getElementById('sponsor-admin-dialog-copy');
        elements.actionTarget = document.getElementById('sponsor-admin-action-target');
        elements.campaignId = document.getElementById('sponsor-admin-action-campaign-id');
        elements.actionType = document.getElementById('sponsor-admin-action-type');
        elements.actionNote = document.getElementById('sponsor-admin-action-note');
        elements.actionError = document.getElementById('sponsor-admin-action-error');
        elements.confirmAction = document.getElementById('confirm-sponsor-admin-action');
        elements.cancelAction = document.getElementById('cancel-sponsor-admin-action');
        elements.closeDialog = document.getElementById('close-sponsor-admin-dialog');
    }

    function bindEvents() {
        document.addEventListener('localclaw:account-ready', probeAdminAccess);
        document.addEventListener('localclaw:sponsor-admin-view', () => { if (state.authorized) loadOverview(); });
        elements.refresh?.addEventListener('click', () => loadOverview(true));
        [elements.search, elements.status, elements.placement].forEach((element) => element?.addEventListener('input', renderCampaigns));
        elements.form?.addEventListener('submit', submitAdminAction);
        elements.cancelAction?.addEventListener('click', closeActionDialog);
        elements.closeDialog?.addEventListener('click', closeActionDialog);
        elements.dialog?.addEventListener('click', (event) => { if (event.target === elements.dialog) closeActionDialog(); });
    }

    async function probeAdminAccess() {
        if (state.loading || state.authorized) return;
        await loadOverview(false, true);
    }

    async function loadOverview(force = false, probing = false) {
        if (state.loading || (!state.authorized && !probing)) return;
        state.loading = true;
        if (elements.refresh) elements.refresh.disabled = true;
        if (!probing) renderLoading();
        try {
            const response = await api('/api/sponsor/admin/overview');
            if (!response.ok) {
                if (response.status === 401 || response.status === 403 || response.status === 503) return;
                throw new Error('Campaign administration is temporarily unavailable.');
            }
            state.authorized = true;
            state.overview = response.data;
            elements.tab.hidden = false;
            if (elements.email) elements.email.textContent = response.data.admin?.email || 'Authorized owner';
            renderOverview();
            const params = new URLSearchParams(window.location.search);
            if (params.get('view') === 'campaign-admin' && elements.panel.hidden) elements.tab.click();
            if (force) showToast('Campaign administration refreshed.');
        } catch (error) {
            if (!probing) renderError(error.message || 'Campaign administration is temporarily unavailable.');
        } finally {
            state.loading = false;
            if (elements.refresh) elements.refresh.disabled = false;
        }
    }

    function renderOverview() {
        const summary = state.overview?.summary || {};
        if (elements.total) elements.total.textContent = formatNumber(summary.campaigns);
        if (elements.active) elements.active.textContent = formatNumber(summary.active);
        if (elements.scheduled) elements.scheduled.textContent = formatNumber(summary.scheduled);
        if (elements.impressions) elements.impressions.textContent = formatNumber(summary.visibleImpressions);
        if (elements.visitors) elements.visitors.textContent = formatNumber(summary.uniqueVisitors);
        if (elements.clicks) elements.clicks.textContent = formatNumber(summary.clicks);
        if (elements.ctr) elements.ctr.textContent = summary.ctrPercent === null || summary.ctrPercent === undefined ? '—' : `${summary.ctrPercent}%`;
        renderTimeline();
        renderCampaigns();
        renderAudit();
    }

    function renderTimeline() {
        if (!elements.timeline) return;
        const rows = new Map((state.overview?.daily || []).map((row) => [row.date, row]));
        const days = [];
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        for (let offset = 29; offset >= 0; offset -= 1) {
            const date = new Date(today.getTime() - offset * 86_400_000);
            const key = date.toISOString().slice(0, 10);
            days.push(rows.get(key) || { date: key, visibleImpressions: 0, uniqueVisitors: 0, clicks: 0, uniqueClicks: 0 });
        }
        const maximum = Math.max(...days.map((day) => Number(day.visibleImpressions || 0)), 1);
        elements.timeline.innerHTML = `<div class="lc-sponsor-admin-chart">${days.map((day) => {
            const height = Number(day.visibleImpressions || 0) > 0 ? Math.max(8, Math.round((Number(day.visibleImpressions) / maximum) * 100)) : 2;
            const clickHeight = Number(day.clicks || 0) > 0 ? Math.max(5, Math.min(100, Math.round((Number(day.clicks) / maximum) * 100))) : 0;
            const title = `${formatDate(day.date)} · ${formatNumber(day.visibleImpressions)} visible · ${formatNumber(day.uniqueVisitors)} visitors · ${formatNumber(day.clicks)} clicks`;
            return `<span class="lc-sponsor-admin-day" title="${escapeAttribute(title)}"><i style="--delivery:${height}%"></i>${clickHeight ? `<b style="--clicks:${clickHeight}%"></b>` : ''}</span>`;
        }).join('')}</div><div class="lc-sponsor-admin-chart-legend"><span><i></i>Visible impressions</span><span><i></i>Clicks</span><strong>${formatDate(days[0].date)} → ${formatDate(days[days.length - 1].date)}</strong></div>`;
    }

    function renderCampaigns() {
        if (!elements.campaigns || !state.overview) return;
        const search = String(elements.search?.value || '').trim().toLowerCase();
        const status = elements.status?.value || 'all';
        const placement = elements.placement?.value || 'all';
        const campaigns = (state.overview.campaigns || []).filter((campaign) => {
            const haystack = [campaign.campaignName, campaign.advertiserName, campaign.owner?.email, campaign.owner?.name, campaign.placement?.label].join(' ').toLowerCase();
            const statusMatch = status === 'all'
                || (status === 'pending' ? campaign.billing?.status === 'pending' : campaign.status === status || campaign.storedStatus === status);
            return (!search || haystack.includes(search)) && statusMatch && (placement === 'all' || campaign.placementKey === placement);
        });
        if (!campaigns.length) {
            const all = state.overview.campaigns || [];
            elements.campaigns.innerHTML = `<div class="lc-sponsor-admin-state"><span aria-hidden="true">${all.length ? '⌕' : '＋'}</span><div><strong>${all.length ? 'No matching campaigns' : 'No sponsor campaigns yet'}</strong><p>${all.length ? 'Change the search or filters to inspect another record.' : 'The first paid or draft campaign will appear here with its delivery and billing state.'}</p></div></div>`;
            return;
        }
        elements.campaigns.innerHTML = campaigns.map(campaignCard).join('');
        elements.campaigns.querySelectorAll('[data-admin-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const campaign = campaigns.find((item) => item.id === button.closest('[data-admin-campaign-id]')?.dataset.adminCampaignId);
                if (campaign) openActionDialog(campaign, button.dataset.adminAction);
            });
        });
    }

    function campaignCard(campaign) {
        const status = statusPresentation(campaign.status, campaign.billing?.status);
        const ctr = campaign.analytics?.ctrPercent === null || campaign.analytics?.ctrPercent === undefined ? '—' : `${campaign.analytics.ctrPercent}%`;
        const mark = campaign.creative?.logoUrl
            ? `<img src="${escapeAttribute(campaign.creative.logoUrl)}" alt="${escapeAttribute(campaign.creative.logoAltText || '')}">`
            : escapeHtml(initials(campaign.advertiserName));
        const schedule = campaign.startsAt && campaign.paidThrough ? `${formatDate(campaign.startsAt)} → ${formatDate(campaign.paidThrough)}` : 'No paid period';
        const price = campaign.price ? `${formatMoney(campaign.price.amountCents, campaign.price.currency)} · ${campaign.planKey === 'month' ? 'month' : '7 days'}` : 'No checkout';
        const extensionReason = campaign.controls?.extensionBlockedReason || 'Manual extension is unavailable.';
        return `<article class="lc-sponsor-admin-campaign" data-admin-campaign-id="${escapeAttribute(campaign.id)}">
            <header><div class="lc-sponsor-admin-campaign__identity"><span class="lc-sponsor-admin-mark">${mark}</span><div><span class="lc-sponsor-status" data-tone="${status.tone}">${status.label}</span><h4>${escapeHtml(campaign.campaignName)}</h4><p>${escapeHtml(campaign.advertiserName)} · ${escapeHtml(campaign.placement?.label || campaign.placementKey)}</p></div></div><div class="lc-sponsor-admin-owner"><span>Owner</span><strong>${escapeHtml(campaign.owner?.email || '—')}</strong><small>${escapeHtml(campaign.owner?.name || 'Google account')}</small></div></header>
            <div class="lc-sponsor-admin-campaign__body">
                <div class="lc-sponsor-admin-period"><span>${escapeHtml(price)}</span><strong>${escapeHtml(schedule)}</strong><small>${campaign.autoRenew ? 'Stripe auto-renewal active' : campaign.billing?.cancelAtPeriodEnd ? 'Renewal ends after paid period' : 'No automatic renewal'} · Inventory ${escapeHtml(campaign.inventory?.status || 'not reserved')}</small></div>
                <div class="lc-sponsor-admin-metrics"><div><span>Visible</span><strong>${formatNumber(campaign.analytics?.impressions)}</strong></div><div><span>Visitors</span><strong>${formatNumber(campaign.analytics?.uniqueVisitors)}</strong></div><div><span>Clicks</span><strong>${formatNumber(campaign.analytics?.clicks)}</strong></div><div><span>CTR</span><strong>${ctr}</strong></div></div>
                <div class="lc-sponsor-admin-stripe"><span>Stripe</span><strong>${escapeHtml(campaign.billing?.status || 'not configured')}</strong><small>${escapeHtml(campaign.stripeReferences?.subscription || campaign.stripeReferences?.checkoutSession || campaign.stripeReferences?.customer || 'No Stripe reference')}</small></div>
            </div>
            <footer>
                <a href="${escapeAttribute(campaign.destinationUrl)}" target="_blank" rel="noopener noreferrer">Open destination ↗</a>
                <div class="lc-sponsor-admin-actions">
                    ${campaign.controls?.canCancelRenewal ? '<button class="lc-button" type="button" data-admin-action="cancel_renewal">Cancel renewal</button>' : ''}
                    <button class="lc-button" type="button" data-admin-action="extend_week" ${campaign.controls?.canExtend ? '' : `disabled title="${escapeAttribute(extensionReason)}"`}>+7 days</button>
                    <button class="lc-button" type="button" data-admin-action="extend_month" ${campaign.controls?.canExtend ? '' : `disabled title="${escapeAttribute(extensionReason)}"`}>+1 month</button>
                    ${campaign.controls?.canStopNow ? '<button class="lc-button lc-button-danger" type="button" data-admin-action="stop_now">Stop now</button>' : ''}
                </div>
            </footer>
        </article>`;
    }

    function renderAudit() {
        if (!elements.audit) return;
        const actions = state.overview?.recentActions || [];
        if (!actions.length) {
            elements.audit.innerHTML = '<div class="lc-sponsor-admin-state"><span aria-hidden="true">✓</span><div><strong>No admin changes recorded</strong><p>The audit trail starts with the first stop, renewal cancellation or manual extension.</p></div></div>';
            return;
        }
        elements.audit.innerHTML = actions.map((action) => `<article><span>${escapeHtml(actionLabel(action.action))}</span><div><strong>${escapeHtml(action.campaignName)}</strong><p>${escapeHtml(action.note || `${String(action.fromStatus || 'unknown').replace(/_/g, ' ')} → ${String(action.toStatus || 'unknown').replace(/_/g, ' ')}`)}</p></div><time datetime="${escapeAttribute(action.createdAt)}">${formatDateTime(action.createdAt)}</time></article>`).join('');
    }

    function openActionDialog(campaign, action) {
        if (!elements.dialog || !elements.form) return;
        const presentation = actionPresentation(action, campaign);
        state.activeCampaign = campaign;
        elements.form.reset();
        elements.campaignId.value = campaign.id;
        elements.actionType.value = action;
        elements.dialogTitle.textContent = presentation.title;
        elements.dialogCopy.textContent = presentation.copy;
        elements.actionTarget.innerHTML = `<span>${escapeHtml(campaign.placement?.label || campaign.placementKey)}</span><strong>${escapeHtml(campaign.campaignName)}</strong><small>${escapeHtml(campaign.owner?.email || '')} · paid through ${formatDate(campaign.paidThrough)}</small>`;
        elements.actionError.textContent = '';
        elements.confirmAction.textContent = presentation.confirm;
        elements.confirmAction.classList.toggle('lc-button-danger', action === 'stop_now');
        elements.dialog.showModal();
        elements.actionNote.focus();
    }

    function closeActionDialog() {
        state.activeCampaign = null;
        if (elements.dialog?.open) elements.dialog.close();
    }

    async function submitAdminAction(event) {
        event.preventDefault();
        if (!state.activeCampaign || elements.confirmAction.disabled) return;
        if (state.visualPreview) {
            elements.actionError.textContent = 'Read-only local preview: no campaign, Stripe subscription or inventory record was changed.';
            return;
        }
        const campaign = state.activeCampaign;
        elements.actionError.textContent = '';
        elements.confirmAction.disabled = true;
        elements.cancelAction.disabled = true;
        try {
            const response = await api(`/api/sponsor/admin/campaigns/${encodeURIComponent(campaign.id)}`, {
                method: 'POST',
                body: JSON.stringify({
                    action: elements.actionType.value,
                    confirmation: campaign.id,
                    note: elements.actionNote.value
                })
            });
            if (!response.ok) throw new Error(response.data?.message || adminError(response.data?.error));
            closeActionDialog();
            await loadOverview(true);
        } catch (error) {
            elements.actionError.textContent = error.message || 'The campaign was not changed.';
        } finally {
            elements.confirmAction.disabled = false;
            elements.cancelAction.disabled = false;
        }
    }

    function renderLoading() {
        if (elements.campaigns) elements.campaigns.innerHTML = '<div class="lc-sponsor-admin-state"><span class="lc-sponsor-spinner" aria-hidden="true"></span><div><strong>Refreshing campaign ledger</strong><p>Reading customer, inventory, Stripe and delivery state from the primary database…</p></div></div>';
    }

    function renderError(message) {
        if (elements.campaigns) elements.campaigns.innerHTML = `<div class="lc-sponsor-admin-state lc-sponsor-admin-state--error"><span aria-hidden="true">!</span><div><strong>Admin data unavailable</strong><p>${escapeHtml(message)}</p></div></div>`;
    }

    function actionPresentation(action, campaign) {
        if (action === 'stop_now') return { title: 'Stop this campaign now?', copy: 'Serving stops immediately and the fixed position is released. Stripe renewal is cancelled when present. This action does not create a refund.', confirm: 'Stop campaign now' };
        if (action === 'cancel_renewal') return { title: 'Cancel automatic renewal?', copy: `Stripe will not charge another period. “${campaign.campaignName}” remains scheduled or live until its current paid-through date.`, confirm: 'Cancel renewal' };
        if (action === 'extend_month') return { title: 'Add one calendar month?', copy: 'The position is checked atomically before the end date changes. This manual extension creates no Stripe charge.', confirm: 'Add one month' };
        return { title: 'Add seven days?', copy: 'The position is checked atomically before the end date changes. This manual extension creates no Stripe charge.', confirm: 'Add seven days' };
    }

    function adminError(code) {
        const messages = {
            sponsor_booking_unavailable: 'Those added dates overlap another campaign on the same fixed position.',
            campaign_extension_not_available: 'This campaign cannot be extended in its current billing state.',
            renewal_not_active: 'Automatic renewal is no longer active.',
            campaign_already_stopped: 'This campaign is already stopped or completed.',
            campaign_conflict: 'The campaign changed while this action was being confirmed. Refresh and try again.',
            stripe_admin_action_failed: 'Stripe did not confirm the requested billing change.'
        };
        return messages[code] || 'The campaign was not changed.';
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

    function statusPresentation(status, billingStatus) {
        if (billingStatus === 'pending') return { label: 'Checkout hold', tone: 'pending' };
        if (billingStatus === 'failed') return { label: 'Payment failed', tone: 'attention' };
        const map = { draft: ['Draft', 'neutral'], changes_requested: ['Changes requested', 'attention'], cancelled: ['Cancelled', 'muted'], scheduled: ['Scheduled', 'positive'], active: ['Live', 'positive'], completed: ['Completed', 'muted'] };
        const [label, tone] = map[status] || [String(status || 'Unknown').replace(/_/g, ' '), 'neutral'];
        return { label, tone };
    }

    function actionLabel(action) {
        return ({ stop_now: 'Stopped', cancel_renewal: 'Renewal cancelled', extend_week: '+7 days', extend_month: '+1 month' })[action] || String(action || '').replace(/_/g, ' ');
    }

    function isLocalVisualPreview() {
        const hostname = window.location.hostname.toLowerCase();
        const params = new URLSearchParams(window.location.search);
        return (hostname === 'localhost' || hostname === '127.0.0.1')
            && params.get('preview') === 'sponsorship'
            && params.get('view') === 'campaign-admin';
    }

    function renderLocalVisualPreview() {
        state.authorized = true;
        state.overview = mockOverview();
        elements.tab.hidden = false;
        if (elements.email) elements.email.textContent = 'Local read-only preview';
        renderOverview();
        window.setTimeout(() => elements.tab.click(), 0);
    }

    function mockOverview() {
        const now = new Date();
        const plusDays = (days) => new Date(now.getTime() + days * 86_400_000).toISOString();
        const owner = { id: 'preview-owner', name: 'Sponsor customer', email: 'owner@example.com' };
        const campaign = (overrides) => ({
            id: overrides.id,
            campaignName: overrides.campaignName,
            advertiserName: overrides.advertiserName,
            destinationUrl: 'https://example.com/',
            placementKey: overrides.placementKey,
            placement: { label: overrides.placementLabel },
            status: overrides.status,
            storedStatus: overrides.status,
            planKey: overrides.planKey || 'week',
            startsAt: plusDays(overrides.startOffset || 0),
            paidThrough: plusDays(overrides.endOffset),
            autoRenew: Boolean(overrides.autoRenew),
            price: { amountCents: overrides.planKey === 'month' ? 9900 : 2900, currency: 'usd' },
            owner,
            billing: { status: 'paid', cancelAtPeriodEnd: false },
            creative: { logoUrl: null, logoAltText: null },
            inventory: { status: 'sold' },
            stripeReferences: { subscription: overrides.autoRenew ? 'sub_…preview1' : null, checkoutSession: 'cs_…preview1', customer: 'cus_…preview1' },
            analytics: overrides.analytics,
            controls: { canStopNow: overrides.status !== 'completed', canCancelRenewal: Boolean(overrides.autoRenew), canExtend: !overrides.autoRenew, extensionBlockedReason: overrides.autoRenew ? 'Cancel Stripe renewal before adding a manual extension.' : null }
        });
        const campaigns = [
            campaign({ id: '11111111-1111-4111-8111-111111111111', campaignName: 'Kobold Desktop Launch', advertiserName: 'KoboldAI', placementKey: 'home-left-1', placementLabel: 'Homepage · Left rail · 01', status: 'active', endOffset: 5, analytics: { impressions: 1842, uniqueVisitors: 1264, clicks: 91, uniqueClicks: 78, ctrPercent: 4.94 } }),
            campaign({ id: '22222222-2222-4222-8222-222222222222', campaignName: 'Private LLM Week', advertiserName: 'OpenRouter Local Lab', placementKey: 'home-right-2', placementLabel: 'Homepage · Right rail · 02', status: 'scheduled', startOffset: 8, endOffset: 15, autoRenew: true, analytics: { impressions: 0, uniqueVisitors: 0, clicks: 0, uniqueClicks: 0, ctrPercent: null } }),
            campaign({ id: '33333333-3333-4333-8333-333333333333', campaignName: 'Voice Toolkit', advertiserName: 'Local Voice Studio', placementKey: 'home-left-3', placementLabel: 'Homepage · Left rail · 03', status: 'completed', startOffset: -15, endOffset: -8, analytics: { impressions: 972, uniqueVisitors: 741, clicks: 37, uniqueClicks: 33, ctrPercent: 3.81 } })
        ];
        const daily = Array.from({ length: 30 }, (_, index) => ({
            date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29 + index)).toISOString().slice(0, 10),
            visibleImpressions: index < 4 ? 0 : 35 + ((index * 29) % 110),
            uniqueVisitors: index < 4 ? 0 : 24 + ((index * 17) % 72),
            clicks: index < 4 ? 0 : 1 + ((index * 7) % 8),
            uniqueClicks: index < 4 ? 0 : 1 + ((index * 5) % 7)
        }));
        return {
            admin: { email: 'Local read-only preview' },
            summary: { campaigns: 3, paidCampaigns: 3, active: 1, scheduled: 1, visibleImpressions: 2814, uniqueVisitors: 2005, clicks: 128, uniqueClicks: 111, ctrPercent: 4.55 },
            daily,
            campaigns,
            recentActions: [{ id: 'preview-action', campaignId: campaigns[0].id, campaignName: campaigns[0].campaignName, action: 'extend_week', fromStatus: 'active', toStatus: 'active', note: 'Customer launch extension', createdAt: now.toISOString() }]
        };
    }

    function initials(value) { return String(value || 'LC').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'LC'; }
    function formatNumber(value) { return new Intl.NumberFormat('en').format(Number(value || 0)); }
    function formatMoney(cents, currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase(), maximumFractionDigits: 0 }).format(Number(cents || 0) / 100); }
    function formatDate(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date) : '—'; }
    function formatDateTime(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date) : '—'; }
    function showToast(message) { const toast = document.getElementById('toast'); if (!toast) return; toast.textContent = message; toast.dataset.kind = 'success'; toast.hidden = false; window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 5200); }
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
    function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
})();
