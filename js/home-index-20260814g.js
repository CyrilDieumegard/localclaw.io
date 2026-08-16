// Homepage-only model index. The canonical catalogues stay in js/data.js and
// tts-list.html; this view filters non-local records and de-duplicates routes.
if (typeof App !== 'undefined' && typeof APP_DATA !== 'undefined') {
    App.renderHero = function renderLocalModelIndex(container) {
        const unavailableLlmIds = new Set(Object.keys((APP_DATA.hfRepoVerification && APP_DATA.hfRepoVerification.unavailable) || {}));
        const allLocalModels = APP_DATA.models.filter((model) => !model.hosted_only && !unavailableLlmIds.has(model.id));
        const localModels = Array.from(new Map(allLocalModels.map((model) => [model.id, model])).values());
        const newestRelease = localModels.reduce((latest, model) => model.released > latest ? model.released : latest, '');
        const familyCount = new Set(localModels.map((model) => model.family)).size;
        const llmFamilies = Array.from(new Set(localModels.map((model) => model.family).filter(Boolean)))
            .sort((a, b) => String(a).localeCompare(String(b), 'en', {sensitivity: 'base'}));
        const catalogueOrder = new Map(localModels.map((model, index) => [model.id, index]));
        const communityRatings = new Map();
        let communityState = 'loading';
        const COMMUNITY_PRIOR_AVERAGE = 3.5;
        const COMMUNITY_PRIOR_WEIGHT = 5;
        const COMMUNITY_CONFIDENCE_VOTES = 5;
        const comparedModelIds = new Set();
        const trackHomeGoal = (name, properties = {}) => {
            const payload = {source: 'home_index', ...properties};
            if (typeof App.trackGoal === 'function') {
                App.trackGoal(name, payload);
                return;
            }
            if (typeof window.datafast === 'function') {
                try { window.datafast(name, payload); } catch (error) {}
            }
            if (typeof window.localClawPostHogCapture === 'function') {
                window.localClawPostHogCapture(name, payload);
            }
        };
        const normalizeMachineRam = (value) => {
            const parsed = Number.parseInt(value, 10);
            return Number.isFinite(parsed) && parsed >= 4 && parsed <= 2048 ? parsed : 0;
        };
        let machineRam = (() => {
            const queryRam = normalizeMachineRam(new URLSearchParams(window.location.search).get('ram'));
            if (queryRam) return queryRam;
            try {
                return normalizeMachineRam(window.localStorage.getItem('localclaw_home_machine_ram'));
            } catch (error) {
                return 0;
            }
        })();

        const speechModels = Array.isArray(window.HOME_INDEX_SPEECH_MODELS) ? window.HOME_INDEX_SPEECH_MODELS : [];
        const speechCatalogueOrder = new Map(speechModels.map((model, index) => [model.id, index]));
        const logoRegistry = window.HOME_INDEX_LOGOS || {llm: {}, speech: {}, labels: {}};

        const familyDetails = (model) => {
            if (typeof MODEL_DETAILS !== 'undefined' && MODEL_DETAILS[model.id]) return MODEL_DETAILS[model.id];
            return {};
        };
        const modelLicense = (model) => familyDetails(model).license || 'See upstream';
        const logoAsset = (scope, family) => logoRegistry[scope] && logoRegistry[scope][family] ? logoRegistry[scope][family] : '';
        const avatarFormats = window.HOME_INDEX_AVATAR_FORMATS || {};
        const logoExtension = (asset) => avatarFormats[asset] || 'svg';
        const logoMarkup = (scope, family, upstreamLabel) => {
            const asset = logoAsset(scope, family);
            if (!asset) return '';
            const label = logoRegistry.labels[asset] || upstreamLabel || 'Upstream project';
            return `<span class="lc-index-family-mark" title="${escapeHtml(label)}" aria-hidden="true"><img src="/images/model-logos/${encodeURIComponent(asset)}.${logoExtension(asset)}" width="24" height="24" alt="" loading="lazy" decoding="async"></span>`;
        };
        const releaseLabel = (value) => {
            if (!/^\d{4}-\d{2}$/.test(value || '')) return value || '—';
            return new Intl.DateTimeFormat('en', {month: 'short', year: 'numeric', timeZone: 'UTC'}).format(new Date(`${value}-01T00:00:00Z`));
        };
        const escapeHtml = (value) => String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
        const llmScore = (model) => {
            const ratings = model.benchmarks || {};
            return (finite(ratings.quality) * 0.38) + (finite(ratings.coding) * 0.24) + (finite(ratings.reasoning) * 0.24) + (finite(ratings.speed) * 0.14);
        };
        const speechScore = (model) => Math.min(10, (finite(model.quality) * 0.68) + (finite(model.speed) * 0.32));
        const scoreLabel = (value) => finite(value).toFixed(1);
        const communityAggregate = (modelId) => communityRatings.get(modelId) || {average: 0, count: 0};
        const speechCommunityId = (model) => `tts-${model.id}`;
        const communityConfidenceScore = (aggregate) => {
            const count = Math.max(0, finite(aggregate && aggregate.count));
            if (!count) return 0;
            const average = Math.max(0, Math.min(5, finite(aggregate && aggregate.average)));
            return ((average * count) + (COMMUNITY_PRIOR_AVERAGE * COMMUNITY_PRIOR_WEIGHT)) / (count + COMMUNITY_PRIOR_WEIGHT);
        };
        const communityCompare = (aId, bId, mode) => {
            if (communityState !== 'ready') return 0;
            const a = communityAggregate(aId);
            const b = communityAggregate(bId);
            if (mode === 'votes') return finite(b.count) - finite(a.count) || finite(b.average) - finite(a.average);
            return Number(b.count > 0) - Number(a.count > 0)
                || communityConfidenceScore(b) - communityConfidenceScore(a)
                || finite(b.count) - finite(a.count)
                || finite(b.average) - finite(a.average);
        };
        const communityMarkup = (modelId, modifier = '') => {
            if (communityState === 'loading') {
                return `<span class="lc-index-community is-loading ${modifier}" aria-label="Community rating loading"><strong>★ —</strong><small>loading</small></span>`;
            }
            if (communityState === 'unavailable') {
                return `<span class="lc-index-community is-empty ${modifier}" aria-label="Community rating unavailable"><strong>☆ —</strong><small>unavailable</small></span>`;
            }
            const aggregate = communityAggregate(modelId);
            const voteLabel = `${aggregate.count} vote${aggregate.count === 1 ? '' : 's'}`;
            if (!aggregate.count) {
                return `<span class="lc-index-community is-empty ${modifier}" title="No LocalClaw community ratings yet" aria-label="No LocalClaw community ratings yet"><strong>☆ —</strong><small>/5 · 0 votes</small></span>`;
            }
            const average = finite(aggregate.average).toFixed(1);
            const isEarly = aggregate.count < COMMUNITY_CONFIDENCE_VOTES;
            const confidenceCopy = isEarly ? ' Early signal: fewer than 5 votes.' : '';
            const title = `LocalClaw community rating ${average} out of 5 from ${voteLabel}.${confidenceCopy} The confidence ranking uses only community rating and vote count, independently from the LocalClaw score.`;
            return `<span class="lc-index-community ${isEarly ? 'is-early' : ''} ${modifier}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}"><strong>★ ${average}</strong><small>/5 · ${voteLabel}${isEarly ? ' · EARLY' : ''}</small></span>`;
        };
        const familyLabel = (value) => String(value || '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
        const nameCompare = (a, b) => String(a.name).localeCompare(String(b.name), 'en', {sensitivity: 'base'});
        const textCompare = (a, b) => String(a || '').localeCompare(String(b || ''), 'en', {sensitivity: 'base'});
        const parameterCount = (model) => {
            const value = String(model && model.params || '');
            const mixture = value.match(/([\d.]+)\s*[x×]\s*([\d.]+)\s*([TBMK])/i);
            if (mixture) return finite(mixture[1]) * finite(mixture[2]) * ({T: 1e12, B: 1e9, M: 1e6, K: 1e3}[mixture[3].toUpperCase()] || 1);
            const amount = value.match(/([\d.]+)\s*([TBMK])/i);
            return amount ? finite(amount[1]) * ({T: 1e12, B: 1e9, M: 1e6, K: 1e3}[amount[2].toUpperCase()] || 1) : 0;
        };
        const defaultSortDirection = (sortKey) => ['catalogue', 'name', 'family', 'ram', 'license'].includes(sortKey) ? 'asc' : 'desc';
        let activeSortKey = 'community';
        let activeSortDirection = defaultSortDirection(activeSortKey);
        const llmTieBreak = (a, b) => {
            const aRatings = a.benchmarks || {};
            const bRatings = b.benchmarks || {};
            return finite(bRatings.quality) - finite(aRatings.quality)
                || finite(bRatings.reasoning) - finite(aRatings.reasoning)
                || finite(bRatings.coding) - finite(aRatings.coding)
                || finite(bRatings.speed) - finite(aRatings.speed)
                || String(b.released || '').localeCompare(String(a.released || ''))
                || nameCompare(a, b);
        };
        const compareModels = (sortKey, direction = defaultSortDirection(sortKey)) => (a, b) => {
            if (sortKey === 'catalogue') return catalogueOrder.get(a.id) - catalogueOrder.get(b.id);
            let result = 0;
            if (sortKey === 'community') result = communityCompare(a.id, b.id, 'average');
            if (sortKey === 'votes') result = communityCompare(a.id, b.id, 'votes');
            if (sortKey === 'score') result = llmScore(b) - llmScore(a);
            if (['quality', 'coding', 'reasoning', 'speed'].includes(sortKey)) result = finite(b.benchmarks && b.benchmarks[sortKey]) - finite(a.benchmarks && a.benchmarks[sortKey]);
            if (sortKey === 'fresh') result = String(b.released || '').localeCompare(String(a.released || ''));
            if (sortKey === 'ram') result = finite(a.min_ram, Infinity) - finite(b.min_ram, Infinity);
            if (sortKey === 'name') result = nameCompare(a, b);
            if (sortKey === 'family') result = textCompare(a.family, b.family) || nameCompare(a, b);
            if (sortKey === 'params') result = parameterCount(b) - parameterCount(a);
            if (sortKey === 'license') result = textCompare(modelLicense(a), modelLicense(b));
            if (direction !== defaultSortDirection(sortKey)) result *= -1;
            return result || llmScore(b) - llmScore(a) || llmTieBreak(a, b);
        };
        const compareSpeech = (sortKey) => (a, b) => {
            let result = 0;
            if (sortKey === 'community') result = communityCompare(speechCommunityId(a), speechCommunityId(b), 'average');
            if (sortKey === 'votes') result = communityCompare(speechCommunityId(a), speechCommunityId(b), 'votes');
            if (sortKey === 'score') result = speechScore(b) - speechScore(a);
            if (sortKey === 'quality') result = finite(b.quality) - finite(a.quality);
            if (sortKey === 'speed') result = finite(b.speed) - finite(a.speed);
            if (sortKey === 'fresh') result = String(b.releaseDate || '').localeCompare(String(a.releaseDate || ''));
            if (sortKey === 'name') result = nameCompare(a, b);
            return result || speechScore(b) - speechScore(a) || finite(b.quality) - finite(a.quality) || finite(b.speed) - finite(a.speed) || nameCompare(a, b) || speechCatalogueOrder.get(a.id) - speechCatalogueOrder.get(b.id);
        };
        const scoreMarkup = (value, title, modifier = '') => `<span class="lc-index-score ${modifier}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}"><strong>${scoreLabel(value)}</strong><small>/10</small></span>`;
        const machineFit = (model) => {
            if (!machineRam) return {key: 'unset', label: 'Set RAM'};
            const minimum = finite(model && model.min_ram, Infinity);
            if (minimum > machineRam) return {key: 'too-large', label: 'Too large'};
            if (minimum > machineRam * 0.75) return {key: 'tight', label: 'Tight'};
            return {key: 'fits', label: 'Fits'};
        };
        const fitMarkup = (model) => {
            const fit = machineFit(model);
            if (fit.key === 'unset') return '';
            const title = `${fit.label} for a ${machineRam} GB machine using the catalogue minimum-RAM field. Actual context and runtime overhead can require more memory.`;
            return `<span class="lc-index-fit is-${fit.key}" title="${escapeHtml(title)}">${escapeHtml(fit.label)}</span>`;
        };
        const sponsorAudienceSnapshot = Object.freeze({
            siteVisitors: 3430,
            desktopHomepageVisitors: 308,
            asOf: '2026-08-15',
            periodLabel: 'Jul 17–Aug 15, 2026',
            sourceLabel: 'DataFast · Europe/Zurich'
        });
        const sponsorRail = (side) => `
            <aside class="lc-sponsor-rail" aria-label="${side} advertising rail — three fixed positions">
                ${[1, 2, 3].map((slot) => {
                    const placementKey = `home-${side.toLowerCase()}-${slot}`;
                    return `<a class="lc-sponsor-slot" href="/account?view=sponsorship&amp;intent=new&amp;placement=${placementKey}&amp;plan=week" data-sponsor-offer data-sponsor-empty-slot data-sponsor-placement="${placementKey}" aria-label="See audience details and sponsor ${side.toLowerCase()} rail position ${String(slot).padStart(2, '0')} at the $29 weekly launch rate"><span class="lc-sponsor-slot__label">Ad slot ${String(slot).padStart(2, '0')}</span><span class="lc-sponsor-slot__mark"></span><p>Founding sponsor launch rate.</p><span class="lc-sponsor-slot__size">$29 / WEEK</span></a>`;
                }).join('')}
            </aside>`;

        const hydrateSponsorRails = async () => {
            try {
                const response = await fetch('/api/sponsor/placements', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (!response.ok) return;
                const payload = await response.json();
                updateSponsorAvailability(payload.placements || []);
                (payload.placements || []).forEach((placement) => {
                    const slot = document.querySelector(`[data-sponsor-placement="${placement.key}"]`);
                    if (!slot || !placement.campaign) return;
                    const campaign = placement.campaign;
                    slot.classList.add('lc-sponsor-slot--active');
                    slot.removeAttribute('data-sponsor-offer');
                    slot.removeAttribute('data-sponsor-empty-slot');
                    slot.removeAttribute('data-fast-goal');
                    slot.removeAttribute('data-fast-goal-source');
                    slot.removeAttribute('data-fast-goal-placement');
                    slot.href = campaign.clickUrl;
                    slot.target = '_blank';
                    slot.rel = 'sponsored nofollow noopener';
                    slot.dataset.sponsorCampaign = campaign.id;
                    slot.innerHTML = `<span class="lc-sponsor-slot__label">Sponsored · ${String(placement.position).padStart(2, '0')}</span><img class="lc-sponsor-slot__logo" src="${escapeHtml(campaign.logoUrl)}" alt="${escapeHtml(campaign.logoAltText || '')}" loading="lazy" decoding="async"><strong class="lc-sponsor-slot__name">${escapeHtml(campaign.advertiserName)}</strong><p>${escapeHtml(campaign.tagline)}</p><span class="lc-sponsor-slot__cta">${escapeHtml(campaign.ctaLabel)} →</span>`;
                });
                observeSponsorImpressions();
            } catch {
                // Placeholders remain useful when sponsor APIs are unavailable.
            }
        };

        const observeSponsorImpressions = () => {
            if (!('IntersectionObserver' in window)) return;
            const timers = new Map();
            const recorded = new Set();
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const campaignId = entry.target.dataset.sponsorCampaign;
                    const placementKey = entry.target.dataset.sponsorPlacement;
                    if (!campaignId || recorded.has(campaignId)) return;
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        if (timers.has(campaignId)) return;
                        timers.set(campaignId, window.setTimeout(() => {
                            recorded.add(campaignId);
                            timers.delete(campaignId);
                            observer.unobserve(entry.target);
                            fetch('/api/sponsor/impressions', {
                                method: 'POST', credentials: 'same-origin', keepalive: true,
                                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                                body: JSON.stringify({ campaignId, placementKey })
                            }).catch(() => {});
                        }, 1000));
                    } else if (timers.has(campaignId)) {
                        window.clearTimeout(timers.get(campaignId));
                        timers.delete(campaignId);
                    }
                });
            }, { threshold: [0, 0.5, 1] });
            document.querySelectorAll('[data-sponsor-campaign]').forEach((slot) => observer.observe(slot));
        };

        const renderModelRows = (models) => models.map((model, index) => {
            const ratings = model.benchmarks || {};
            const overall = llmScore(model);
            const scoreTitle = `LocalClaw catalogue score ${scoreLabel(overall)} out of 10. Quality ${finite(ratings.quality)}; coding ${finite(ratings.coding)}; reasoning ${finite(ratings.reasoning)}; speed ${finite(ratings.speed)}.`;
            const isCompared = comparedModelIds.has(model.id);
            const compareLimitReached = comparedModelIds.size >= 3 && !isCompared;
            return `
                <tr>
                    <td class="lc-index-rank">${String(index + 1).padStart(3, '0')}</td>
                    <td>
                        <a class="lc-index-model-link" href="/models/${encodeURIComponent(model.id)}" data-fast-goal="model_open" data-fast-goal-source="home_index" data-fast-goal-model="${escapeHtml(model.id)}">
                            ${logoMarkup('llm', model.family, familyDetails(model).developer || model.family)}
                            <span><strong class="lc-index-model-name">${escapeHtml(model.name)}</strong><span class="lc-index-model-family">${escapeHtml(model.family || 'local model')}</span></span>
                        </a>
                    </td>
                    <td class="lc-index-score-cell">${scoreMarkup(overall, scoreTitle)}</td>
                    <td class="lc-index-community-cell">${communityMarkup(model.id)}</td>
                    <td>${escapeHtml(model.params || '—')}</td>
                    <td><span class="lc-index-ram-value">${Number.isFinite(model.min_ram) ? `${model.min_ram} GB` : '—'}</span>${fitMarkup(model)}</td>
                    <td class="lc-index-license" title="${escapeHtml(modelLicense(model))}">${escapeHtml(modelLicense(model))}</td>
                    <td>${escapeHtml(releaseLabel(model.released))}</td>
                    <td class="lc-index-action-cell"><button class="lc-index-compare-toggle ${isCompared ? 'is-selected' : ''}" type="button" data-compare-id="${escapeHtml(model.id)}" aria-pressed="${isCompared}" ${compareLimitReached ? 'disabled' : ''}>${isCompared ? 'Added' : 'Compare'}</button><a class="lc-index-row-link" href="/models/${encodeURIComponent(model.id)}" aria-label="Open ${escapeHtml(model.name)}">→</a></td>
                </tr>`;
        }).join('');

        const renderSpeechRows = (models) => models.map((model, index) => {
            const overall = speechScore(model);
            const scoreTitle = `LocalClaw audio score ${scoreLabel(overall)} out of 10. Quality ${finite(model.quality)}; speed ${finite(model.speed)}.`;
            return `<a class="lc-index-tts-row" href="/tts/${encodeURIComponent(model.id)}" data-fast-goal="tts_open" data-fast-goal-source="home_index" data-fast-goal-model="${escapeHtml(model.id)}">
                <span class="lc-index-tts-rank">${String(index + 1).padStart(2, '0')}</span>
                ${logoMarkup('speech', model.family, model.developer)}
                <span class="lc-index-tts-copy"><strong class="lc-index-tts-name">${escapeHtml(model.name)}</strong><span class="lc-index-tts-meta">${escapeHtml(model.developer)} · ${escapeHtml(model.license || 'See model page')}</span><span class="lc-index-tts-signals">QUALITY ${scoreLabel(model.quality)} · SPEED ${scoreLabel(model.speed)}</span></span>
                <span class="lc-index-tts-score-group">${communityMarkup(speechCommunityId(model), 'lc-index-community--speech')}${scoreMarkup(overall, scoreTitle, 'lc-index-score--speech')}<span class="lc-index-tts-type">${escapeHtml(model.type)}</span></span>
            </a>`;
        }).join('');

        const rankedModels = [...localModels].sort(compareModels(activeSortKey, activeSortDirection));
        const rankedSpeechModels = [...speechModels].sort(compareSpeech('community'));
        const releaseMonth = releaseLabel(newestRelease);

        container.className = 'lc-index-shell';
        container.innerHTML = `
            <div class="lc-index-grid">
                ${sponsorRail('Left')}

                <div class="lc-index-directory">
                    <header class="lc-index-hero">
                        <div class="lc-index-hero__copy">
                            <p class="lc-index-kicker">// LocalClaw · local models only</p>
                            <h1>The Local <span>Model Index</span></h1>
                            <p>One maintained directory for comparing local models by independent community stars, LocalClaw score, family, minimum RAM, licence and release date.</p>
                            <a class="lc-index-hero__guide-link" href="#home-index-guide">How rankings work · RAM quick answers ↓</a>
                        </div>
                        <div class="lc-index-hero__mascot" aria-hidden="true"><img src="/images/localclaw-mascot-hero.webp?v=20260601" width="719" height="600" alt="" loading="eager" decoding="async" fetchpriority="high"></div>
                    </header>

                    <section class="lc-index-facts" aria-label="Index information">
                        <article class="lc-index-fact"><span class="lc-index-eyebrow">Catalogue</span><strong class="lc-index-fact__value"><span class="lc-index-fact__number">${localModels.length}</span><span class="lc-index-fact__label">local LLM pages</span></strong><p>Hosted-only records excluded.</p></article>
                        <article class="lc-index-fact"><span class="lc-index-eyebrow">Families</span><strong class="lc-index-fact__value"><span class="lc-index-fact__number">${familyCount}</span><span class="lc-index-fact__label">model families</span></strong><p>Duplicate route IDs collapsed.</p></article>
                        <article class="lc-index-fact"><span class="lc-index-eyebrow">Freshness</span><strong class="lc-index-fact__value"><span class="lc-index-fact__number lc-index-fact__number--date">${escapeHtml(releaseMonth)}</span><span class="lc-index-fact__label">latest catalogue month</span></strong><p>From repository release metadata.</p></article>
                    </section>

                    <section class="lc-index-universe" aria-labelledby="lc-index-universe-title">
                        <header><div><span class="lc-index-eyebrow">The Local AI Index</span><h2 id="lc-index-universe-title">Every kind of AI your machine can run</h2></div><a href="/local-ai-index" data-fast-goal="catalogue_click" data-fast-goal-source="home_index" data-fast-goal-target="local-ai-index">Match my machine →</a></header>
                        <nav aria-label="Local AI categories">
                            <a href="/llm-list"><strong>LLM</strong><span>${localModels.length} local pages</span></a>
                            <a href="/tts-list"><strong>Voice</strong><span>${speechModels.length} local records</span></a>
                            <a href="/image-models"><strong>Image</strong><span>Generate and edit</span></a>
                            <a href="/video-models"><strong>Video</strong><span>Create and animate</span></a>
                            <a href="/3d-models"><strong>3D</strong><span>Meshes and splats</span></a>
                            <a href="/music-models"><strong>Music</strong><span>Songs and sound</span></a>
                            <a href="/vision-models"><strong>Vision</strong><span>OCR and documents</span></a>
                        </nav>
                    </section>

                    <a class="lc-sponsor-offer-inline" href="/account?view=sponsorship&amp;intent=new&amp;plan=week" data-sponsor-offer data-fast-goal="sponsor_offer_open" data-fast-goal-source="home_sponsor_inline">
                        <span><strong>Founding sponsor offer</strong><small>Lock in the introductory rate before new-campaign pricing changes.</small></span>
                        <span>$29 / 7 days</span>
                    </a>

                    <section id="llm-index" aria-labelledby="llm-index-title">
                        <div class="lc-index-section-head">
                            <div><span class="lc-index-eyebrow">Directory 01</span><h2 id="llm-index-title">Local LLMs</h2></div>
                            <div class="lc-index-section-meta"><p><strong id="lc-index-result-count">${localModels.length}</strong> ranked entries · independent signals</p><span class="lc-index-method-pill lc-index-method-pill--community">Community ★ · /5</span><span class="lc-index-method-pill">LocalClaw · /10</span></div>
                        </div>
                        <div class="lc-index-controls">
                            <label><span class="sr-only">Search models</span><input id="lc-index-search" class="lc-index-control" type="search" placeholder="Search model or family…" autocomplete="off"></label>
                            <label><span class="sr-only">Choose machine memory</span><select id="lc-index-machine-ram" class="lc-index-control"><option value="0">My machine · set RAM</option><option value="8">My machine · 8 GB</option><option value="16">My machine · 16 GB</option><option value="32">My machine · 32 GB</option><option value="64">My machine · 64 GB</option><option value="128">My machine · 128 GB</option><option value="256">My machine · 256 GB</option><option value="512">My machine · 512 GB</option></select></label>
                            <label><span class="sr-only">Filter by machine fit</span><select id="lc-index-fit-filter" class="lc-index-control"><option value="all">All fit states</option><option value="compatible">Fits my machine</option><option value="fits">Comfortable fits</option><option value="tight">Tight fits</option><option value="too-large">Too large</option></select></label>
                            <label><span class="sr-only">Filter by model family</span><select id="lc-index-family" class="lc-index-control"><option value="all">All families</option>${llmFamilies.map((family) => `<option value="${escapeHtml(family)}">${escapeHtml(familyLabel(family))}</option>`).join('')}</select></label>
                            <label><span class="sr-only">Sort models</span><select id="lc-index-sort" class="lc-index-control"><option value="community">Community confidence ★</option><option value="votes">Most votes</option><option value="score">LocalClaw score</option><option value="quality">Quality — highest</option><option value="coding">Coding — highest</option><option value="reasoning">Reasoning — highest</option><option value="speed">Speed — highest</option><option value="fresh">Release date</option><option value="ram">Minimum RAM</option><option value="params">Parameters</option><option value="name">Model name</option><option value="family">Family</option><option value="license">Licence</option><option value="catalogue">Catalogue order</option></select></label>
                        </div>
                        <div class="lc-index-table-wrap">
                            <table class="lc-index-table">
                                <thead><tr><th class="lc-index-rank" scope="col">Rank</th><th class="lc-index-model-col" scope="col" data-sort-key="name" aria-sort="none"><button class="lc-index-sort-button" type="button" data-sort-key="name" data-sort-label="model name">Model / family<span class="lc-index-sort-indicator" aria-hidden="true">↕</span></button></th><th class="lc-index-score-col" scope="col" data-sort-key="score" aria-sort="none"><button class="lc-index-sort-button" type="button" data-sort-key="score" data-sort-label="LocalClaw score">LocalClaw<span class="lc-index-sort-indicator" aria-hidden="true">↕</span></button></th><th class="lc-index-community-col" scope="col" data-sort-key="community" aria-sort="descending"><button class="lc-index-sort-button" type="button" data-sort-key="community" data-sort-label="community confidence">Community<span class="lc-index-sort-indicator" aria-hidden="true">↓</span></button></th><th scope="col" data-sort-key="params" aria-sort="none"><button class="lc-index-sort-button" type="button" data-sort-key="params" data-sort-label="parameter count">Params<span class="lc-index-sort-indicator" aria-hidden="true">↕</span></button></th><th scope="col" data-sort-key="ram" aria-sort="none"><button class="lc-index-sort-button" type="button" data-sort-key="ram" data-sort-label="minimum RAM">Min RAM<span class="lc-index-sort-indicator" aria-hidden="true">↕</span></button></th><th scope="col" data-sort-key="license" aria-sort="none"><button class="lc-index-sort-button" type="button" data-sort-key="license" data-sort-label="licence">Licence<span class="lc-index-sort-indicator" aria-hidden="true">↕</span></button></th><th scope="col" data-sort-key="fresh" aria-sort="none"><button class="lc-index-sort-button" type="button" data-sort-key="fresh" data-sort-label="release date">Released<span class="lc-index-sort-indicator" aria-hidden="true">↕</span></button></th><th class="lc-index-action-col" scope="col">Compare</th></tr></thead>
                                <tbody id="lc-index-model-rows">${renderModelRows(rankedModels)}</tbody>
                            </table>
                        </div>
                        <aside id="lc-index-compare-tray" class="lc-index-compare-tray" aria-live="polite" hidden><div><strong><span id="lc-index-compare-count">0</span>/3 selected</strong><span id="lc-index-compare-status">Select at least two LLMs.</span></div><div id="lc-index-compare-chips" class="lc-index-compare-chips"></div><div class="lc-index-compare-actions"><button id="lc-index-compare-clear" type="button">Clear</button><button id="lc-index-compare-open" type="button" disabled>Compare models</button></div></aside>
                        <p class="lc-index-method-note"><strong>Two independent rankings.</strong> Community ★ shows the raw 1–5 star average. “Community confidence” orders rated models with a transparent Bayesian prior of 3.5/5 over five votes, so one vote cannot dominate; EARLY marks fewer than five votes. Unrated ties may use LocalClaw order, but community ratings never change or blend into the separate LocalClaw /10 editorial catalogue rubric (38% quality + 24% coding + 24% reasoning + 14% speed). It is not a standardized third-party benchmark.</p>
                    </section>

                    <section class="lc-index-tts" aria-labelledby="tts-index-title">
                        <div class="lc-index-section-head">
                            <div><span class="lc-index-eyebrow">Directory 02</span><h2 id="tts-index-title">Local speech / TTS</h2></div>
                            <div class="lc-index-section-meta"><p><strong id="lc-index-tts-result-count">${speechModels.length}</strong> ranked speech records · local only</p><span class="lc-index-method-pill lc-index-method-pill--community">Community ★ · /5</span><span class="lc-index-method-pill">Audio · /10</span></div>
                        </div>
                        <div class="lc-index-controls lc-index-tts-controls">
                            <label><span class="sr-only">Search speech models</span><input id="lc-index-tts-search" class="lc-index-control" type="search" placeholder="Search speech model or maker…" autocomplete="off"></label>
                            <label><span class="sr-only">Filter speech model type</span><select id="lc-index-tts-type" class="lc-index-control"><option value="all">All speech types</option><option value="TTS">TTS only</option><option value="ASR">ASR only</option><option value="APP">Apps only</option></select></label>
                            <label><span class="sr-only">Sort speech models</span><select id="lc-index-tts-sort" class="lc-index-control"><option value="community">Community confidence ★</option><option value="votes">Most votes</option><option value="score">Audio score</option><option value="quality">Quality — highest</option><option value="speed">Speed — highest</option><option value="fresh">Newest first</option><option value="name">Name A–Z</option></select></label>
                        </div>
                        <div id="lc-index-tts-list" class="lc-index-tts-list">${renderSpeechRows(rankedSpeechModels)}</div>
                        <p class="lc-index-method-note lc-index-method-note--speech"><strong>Independent speech rankings.</strong> Community confidence uses only the raw star average and number of signed-in member votes; EARLY marks fewer than five votes. The separate Audio /10 score remains 68% quality + 32% speed, capped at 10. The two classifications are displayed together but never mixed.</p>
                        <a class="lc-index-more" href="/tts-list">Browse the full speech catalogue →</a>
                    </section>
                    <dialog id="lc-index-compare-dialog" class="lc-index-compare-dialog" aria-labelledby="lc-index-compare-title"><div class="lc-index-compare-dialog__head"><div><span class="lc-index-eyebrow">Side-by-side</span><h2 id="lc-index-compare-title">Compare local LLMs</h2></div><button id="lc-index-compare-close" type="button" aria-label="Close model comparison">×</button></div><div id="lc-index-compare-content" class="lc-index-compare-content"></div></dialog>
                    <dialog id="lc-sponsor-offer-dialog" class="lc-sponsor-offer-dialog" aria-labelledby="lc-sponsor-offer-title" aria-describedby="lc-sponsor-offer-description">
                        <div class="lc-sponsor-offer-dialog__scroll">
                            <header class="lc-sponsor-offer-dialog__head">
                                <div><span class="lc-index-eyebrow">Founding sponsor offer</span><h2 id="lc-sponsor-offer-title">Lock in the $29 launch rate</h2></div>
                                <button id="lc-sponsor-offer-close" type="button">Close</button>
                            </header>
                            <p id="lc-sponsor-offer-description" class="lc-sponsor-offer-dialog__intro">Book a fixed homepage position at LocalClaw's introductory sponsor rate. New-campaign pricing may increase as the audience grows, while your selected desktop position never rotates.</p>
                            <div class="lc-sponsor-offer-metrics" aria-label="LocalClaw audience snapshot">
                                <article><strong>${new Intl.NumberFormat('en-US').format(sponsorAudienceSnapshot.siteVisitors)}</strong><span>Site visitors</span><small>Last 30 days</small></article>
                                <article><strong>${new Intl.NumberFormat('en-US').format(sponsorAudienceSnapshot.desktopHomepageVisitors)}</strong><span>Desktop homepage visitors</span><small>Where placements appear</small></article>
                                <article><strong id="lc-sponsor-open-count">Exact dates</strong><span>Live availability</span><small id="lc-sponsor-open-note">Checked before Stripe</small></article>
                            </div>
                            <p class="lc-sponsor-offer-source"><strong>Search-led, product-specific traffic.</strong> Popular visits include model, TTS and RAM guides. Audience snapshot: ${sponsorAudienceSnapshot.periodLabel} · ${sponsorAudienceSnapshot.sourceLabel}.</p>
                            <section class="lc-sponsor-offer-benefits" aria-labelledby="lc-sponsor-benefits-title">
                                <h3 id="lc-sponsor-benefits-title">What the booking includes</h3>
                                <div><article><span>01</span><strong>Fixed placement</strong><p>Choose one exact desktop rail position. No rotation or ranking influence.</p></article><article><span>02</span><strong>Measured delivery</strong><p>Track visible impressions, estimated unique visitors, clicks and CTR.</p></article><article><span>03</span><strong>Launch rate you can keep</strong><p>Book seven days for $29. Enable renewal in your account to keep the same rate until you cancel.</p></article></div>
                            </section>
                            <div class="lc-sponsor-offer-checkout">
                                <div><span id="lc-sponsor-selected-placement">Choose any available position</span><strong>$29 <small>/ 7 days</small></strong><p>Founding sponsor rate. Logo and destination are reviewed before serving.</p></div>
                                <a id="lc-sponsor-offer-continue" href="/account?view=sponsorship&amp;intent=new&amp;plan=week" data-fast-goal="sponsor_offer_continue" data-fast-goal-source="home_sponsor_modal">Lock in the launch rate</a>
                            </div>
                            <p class="lc-sponsor-offer-disclaimer">No traffic, click, conversion or ranking benefit is guaranteed. Exact dates and availability are checked again before Stripe opens. <a href="/sponsor-terms" target="_blank" rel="noopener">Read sponsorship terms</a>.</p>
                        </div>
                    </dialog>
                </div>

                ${sponsorRail('Right')}
            </div>`;

        const sponsorOfferDialog = document.getElementById('lc-sponsor-offer-dialog');
        const sponsorOfferClose = document.getElementById('lc-sponsor-offer-close');
        const sponsorOfferContinue = document.getElementById('lc-sponsor-offer-continue');
        const sponsorSelectedPlacement = document.getElementById('lc-sponsor-selected-placement');
        let sponsorOfferOpener = null;
        let sponsorFocusTimer = 0;
        const sponsorAccountUrl = (placementKey = '') => {
            const params = new URLSearchParams({ view: 'sponsorship', intent: 'new', plan: 'week' });
            if (placementKey) params.set('placement', placementKey);
            return `/account?${params.toString()}`;
        };
        const sponsorPlacementLabel = (placementKey) => {
            const match = /^home-(left|right)-(\d)$/.exec(String(placementKey || ''));
            return match ? `${match[1] === 'left' ? 'Left' : 'Right'} rail · position ${match[2].padStart(2, '0')}` : 'Choose any available position';
        };
        const openSponsorOffer = (opener) => {
            if (!sponsorOfferDialog?.isConnected) return;
            const placementKey = opener?.dataset.sponsorPlacement || '';
            sponsorOfferOpener = opener || null;
            if (sponsorSelectedPlacement) sponsorSelectedPlacement.textContent = sponsorPlacementLabel(placementKey);
            if (sponsorOfferContinue) {
                sponsorOfferContinue.href = sponsorAccountUrl(placementKey);
                sponsorOfferContinue.textContent = placementKey ? 'Lock this position at $29' : 'Lock in the launch rate';
            }
            if (typeof sponsorOfferDialog?.showModal === 'function') {
                if (sponsorOfferDialog.open) sponsorOfferDialog.close();
                sponsorOfferDialog.showModal();
            } else window.location.assign(sponsorAccountUrl(placementKey));
        };
        const restoreSponsorOfferFocus = () => {
            const opener = sponsorOfferOpener;
            if (sponsorFocusTimer) window.clearTimeout(sponsorFocusTimer);
            sponsorFocusTimer = window.setTimeout(() => {
                sponsorFocusTimer = 0;
                const active = document.activeElement;
                const mayRestore = !sponsorOfferDialog?.open && (
                    !active
                    || active === document.body
                    || active === sponsorOfferDialog
                    || sponsorOfferDialog?.contains(active)
                );
                if (mayRestore && opener?.isConnected) opener.focus({ preventScroll: true });
            }, 100);
        };
        const closeSponsorOffer = () => {
            if (sponsorOfferDialog?.open) sponsorOfferDialog.close();
            else restoreSponsorOfferFocus();
        };
        const updateSponsorAvailability = (placements) => {
            const count = document.getElementById('lc-sponsor-open-count');
            const note = document.getElementById('lc-sponsor-open-note');
            if (!count || !note || !Array.isArray(placements) || !placements.length) return;
            const openNow = placements.filter((placement) => !placement.campaign).length;
            count.textContent = `${openNow}/${placements.length}`;
            note.textContent = openNow === 1 ? 'One position open now' : `${openNow} positions open now`;
        };
        if (container.__lcSponsorOfferClickHandler) {
            container.removeEventListener('click', container.__lcSponsorOfferClickHandler);
        }
        const sponsorOfferClickHandler = (event) => {
            const offer = event.target.closest('[data-sponsor-offer]');
            if (!offer || offer.dataset.sponsorCampaign) return;
            event.preventDefault();
            if (offer.hasAttribute('data-sponsor-empty-slot')) {
                trackHomeGoal('sponsor_empty_slot_click', {
                    source: 'home_sponsor_slot', placement: offer.dataset.sponsorPlacement || 'unknown'
                });
            }
            openSponsorOffer(offer);
        };
        container.__lcSponsorOfferClickHandler = sponsorOfferClickHandler;
        container.addEventListener('click', sponsorOfferClickHandler);
        sponsorOfferClose?.addEventListener('click', closeSponsorOffer);
        sponsorOfferDialog?.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            closeSponsorOffer();
        });
        sponsorOfferDialog?.addEventListener('cancel', (event) => { event.preventDefault(); closeSponsorOffer(); });
        sponsorOfferDialog?.addEventListener('close', restoreSponsorOfferFocus);
        sponsorOfferDialog?.addEventListener('click', (event) => { if (event.target === sponsorOfferDialog) closeSponsorOffer(); });

        hydrateSponsorRails();

        const search = document.getElementById('lc-index-search');
        const machineRamSelect = document.getElementById('lc-index-machine-ram');
        const fitFilter = document.getElementById('lc-index-fit-filter');
        const family = document.getElementById('lc-index-family');
        const sort = document.getElementById('lc-index-sort');
        const rows = document.getElementById('lc-index-model-rows');
        const count = document.getElementById('lc-index-result-count');
        const compareTray = document.getElementById('lc-index-compare-tray');
        const compareCount = document.getElementById('lc-index-compare-count');
        const compareStatus = document.getElementById('lc-index-compare-status');
        const compareChips = document.getElementById('lc-index-compare-chips');
        const compareOpen = document.getElementById('lc-index-compare-open');
        const compareClear = document.getElementById('lc-index-compare-clear');
        const compareDialog = document.getElementById('lc-index-compare-dialog');
        const compareContent = document.getElementById('lc-index-compare-content');
        const compareClose = document.getElementById('lc-index-compare-close');
        const sortHeaders = Array.from(document.querySelectorAll('.lc-index-table thead th[data-sort-key]'));
        const syncSortControls = () => {
            sort.value = activeSortKey;
            sortHeaders.forEach((header) => {
                const isActive = header.dataset.sortKey === activeSortKey;
                const button = header.querySelector('.lc-index-sort-button');
                const indicator = header.querySelector('.lc-index-sort-indicator');
                header.setAttribute('aria-sort', isActive ? (activeSortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
                if (indicator) indicator.textContent = isActive ? (activeSortDirection === 'asc' ? '↑' : '↓') : '↕';
                if (button) {
                    const nextSortDirection = isActive
                        ? (activeSortDirection === 'asc' ? 'desc' : 'asc')
                        : defaultSortDirection(header.dataset.sortKey);
                    const nextDirection = nextSortDirection === 'asc' ? 'ascending' : 'descending';
                    button.setAttribute('aria-label', `Sort by ${button.dataset.sortLabel} ${nextDirection}`);
                    button.title = `Sort by ${button.dataset.sortLabel} ${nextDirection}`;
                }
            });
        };
        const ensureMachineOption = (ramValue, label) => {
            const value = String(normalizeMachineRam(ramValue));
            if (value === '0') return;
            let option = Array.from(machineRamSelect.options).find((item) => item.value === value);
            if (!option) {
                option = document.createElement('option');
                option.value = value;
                machineRamSelect.appendChild(option);
            }
            option.textContent = label || `My machine · ${value} GB`;
        };
        if (machineRam) {
            ensureMachineOption(machineRam);
            machineRamSelect.value = String(machineRam);
        }
        fitFilter.disabled = !machineRam;

        const renderCompareDialog = () => {
            const models = Array.from(comparedModelIds).map((id) => localModels.find((model) => model.id === id)).filter(Boolean);
            const valueRow = (label, values) => `<tr><th scope="row">${escapeHtml(label)}</th>${values.map((value) => `<td>${value}</td>`).join('')}</tr>`;
            const headers = models.map((model) => `<th scope="col"><a href="/models/${encodeURIComponent(model.id)}">${logoMarkup('llm', model.family, familyDetails(model).developer || model.family)}<span>${escapeHtml(model.name)}</span></a></th>`).join('');
            const rowsMarkup = [
                valueRow('Community', models.map((model) => communityMarkup(model.id))),
                valueRow('LocalClaw', models.map((model) => {
                    const ratings = model.benchmarks || {};
                    const title = `LocalClaw catalogue score. Quality ${finite(ratings.quality)}; coding ${finite(ratings.coding)}; reasoning ${finite(ratings.reasoning)}; speed ${finite(ratings.speed)}.`;
                    return scoreMarkup(llmScore(model), title);
                })),
                valueRow('Machine fit', models.map((model) => machineRam ? fitMarkup(model) : '<span class="lc-index-compare-muted">Set RAM above</span>')),
                valueRow('Minimum RAM', models.map((model) => escapeHtml(Number.isFinite(model.min_ram) ? `${model.min_ram} GB` : '—'))),
                valueRow('Parameters', models.map((model) => escapeHtml(model.params || '—'))),
                valueRow('Quality', models.map((model) => escapeHtml(scoreLabel(model.benchmarks && model.benchmarks.quality)))),
                valueRow('Coding', models.map((model) => escapeHtml(scoreLabel(model.benchmarks && model.benchmarks.coding)))),
                valueRow('Reasoning', models.map((model) => escapeHtml(scoreLabel(model.benchmarks && model.benchmarks.reasoning)))),
                valueRow('Speed', models.map((model) => escapeHtml(scoreLabel(model.benchmarks && model.benchmarks.speed)))),
                valueRow('Licence', models.map((model) => escapeHtml(modelLicense(model)))),
                valueRow('Released', models.map((model) => escapeHtml(releaseLabel(model.released)))),
                valueRow('Details', models.map((model) => `<a class="lc-index-compare-detail" href="/models/${encodeURIComponent(model.id)}">Open model →</a>`))
            ].join('');
            compareContent.innerHTML = `<div class="lc-index-compare-table-wrap"><table class="lc-index-compare-table"><thead><tr><th scope="col">Signal</th>${headers}</tr></thead><tbody>${rowsMarkup}</tbody></table></div>`;
        };
        const renderCompareTray = () => {
            const models = Array.from(comparedModelIds).map((id) => localModels.find((model) => model.id === id)).filter(Boolean);
            compareTray.hidden = models.length === 0;
            compareCount.textContent = models.length;
            compareStatus.textContent = models.length < 2 ? 'Select one more LLM.' : models.length === 3 ? 'Maximum reached.' : 'Ready to compare.';
            compareChips.innerHTML = models.map((model) => `<button type="button" data-compare-remove="${escapeHtml(model.id)}" aria-label="Remove ${escapeHtml(model.name)} from comparison">${escapeHtml(model.name)} <span>×</span></button>`).join('');
            compareOpen.disabled = models.length < 2;
            rows.querySelectorAll('[data-compare-id]').forEach((button) => {
                const selected = comparedModelIds.has(button.dataset.compareId);
                button.classList.toggle('is-selected', selected);
                button.setAttribute('aria-pressed', String(selected));
                button.textContent = selected ? 'Added' : 'Compare';
                button.disabled = comparedModelIds.size >= 3 && !selected;
            });
        };
        const updateIndex = () => {
            const query = search.value.trim().toLowerCase();
            const selectedFamily = family.value;
            const selectedFit = fitFilter.value;
            const filtered = localModels.filter((model) => {
                const haystack = `${model.name} ${model.family} ${(model.tags || []).join(' ')}`.toLowerCase();
                const fit = machineFit(model).key;
                const matchesFit = selectedFit === 'all'
                    || (selectedFit === 'compatible' && (fit === 'fits' || fit === 'tight'))
                    || fit === selectedFit;
                return haystack.includes(query)
                    && matchesFit
                    && (selectedFamily === 'all' || model.family === selectedFamily);
            }).sort(compareModels(activeSortKey, activeSortDirection));
            rows.innerHTML = filtered.length ? renderModelRows(filtered) : '<tr><td class="lc-index-empty" colspan="9">No local model matches these filters.</td></tr>';
            count.textContent = filtered.length;
            renderCompareTray();
        };
        let llmSearchGoalTimer = 0;
        let lastTrackedLlmSearch = '';
        search.addEventListener('input', () => {
            updateIndex();
            if (llmSearchGoalTimer) window.clearTimeout(llmSearchGoalTimer);
            const query = search.value.trim().toLowerCase();
            if (query.length < 2) {
                lastTrackedLlmSearch = '';
                return;
            }
            llmSearchGoalTimer = window.setTimeout(() => {
                llmSearchGoalTimer = 0;
                if (query === lastTrackedLlmSearch) return;
                lastTrackedLlmSearch = query;
                trackHomeGoal('home_index_search', {target: 'llm', shown: count.textContent});
            }, 400);
        });
        machineRamSelect.addEventListener('change', () => {
            machineRam = normalizeMachineRam(machineRamSelect.value);
            fitFilter.disabled = !machineRam;
            if (!machineRam) fitFilter.value = 'all';
            try {
                if (machineRam) window.localStorage.setItem('localclaw_home_machine_ram', String(machineRam));
                else window.localStorage.removeItem('localclaw_home_machine_ram');
            } catch (error) {
                // Storage can be unavailable in privacy modes; the current selection still works.
            }
            updateIndex();
            trackHomeGoal('home_index_filter', {
                target: 'llm', group: 'machine_ram', value: machineRam ? String(machineRam) : 'unset', shown: count.textContent
            });
        });
        fitFilter.addEventListener('change', () => {
            updateIndex();
            trackHomeGoal('home_index_filter', {target: 'llm', group: 'fit', value: fitFilter.value, shown: count.textContent});
        });
        family.addEventListener('change', () => {
            updateIndex();
            trackHomeGoal('home_index_filter', {target: 'llm', group: 'family', value: family.value, shown: count.textContent});
        });
        sort.addEventListener('change', () => {
            activeSortKey = sort.value;
            activeSortDirection = defaultSortDirection(activeSortKey);
            syncSortControls();
            updateIndex();
            trackHomeGoal('home_index_sort', {target: 'llm', sort: activeSortKey, direction: activeSortDirection, source_control: 'select', shown: count.textContent});
        });
        sortHeaders.forEach((header) => {
            header.querySelector('.lc-index-sort-button')?.addEventListener('click', () => {
                const nextSortKey = header.dataset.sortKey;
                activeSortDirection = nextSortKey === activeSortKey
                    ? (activeSortDirection === 'asc' ? 'desc' : 'asc')
                    : defaultSortDirection(nextSortKey);
                activeSortKey = nextSortKey;
                syncSortControls();
                updateIndex();
                trackHomeGoal('home_index_sort', {target: 'llm', sort: activeSortKey, direction: activeSortDirection, source_control: 'column_header', shown: count.textContent});
            });
        });
        rows.addEventListener('click', (event) => {
            const button = event.target.closest('[data-compare-id]');
            if (!button) return;
            const modelId = button.dataset.compareId;
            let added = false;
            if (comparedModelIds.has(modelId)) comparedModelIds.delete(modelId);
            else if (comparedModelIds.size < 3) {
                comparedModelIds.add(modelId);
                added = true;
            }
            renderCompareTray();
            if (added) {
                trackHomeGoal('home_index_compare_add', {target: 'llm', model: modelId, shown: comparedModelIds.size});
            }
        });
        compareChips.addEventListener('click', (event) => {
            const button = event.target.closest('[data-compare-remove]');
            if (!button) return;
            comparedModelIds.delete(button.dataset.compareRemove);
            renderCompareTray();
        });
        compareClear.addEventListener('click', () => {
            comparedModelIds.clear();
            renderCompareTray();
        });
        compareOpen.addEventListener('click', () => {
            if (comparedModelIds.size < 2) return;
            renderCompareDialog();
            trackHomeGoal('home_index_compare_open', {
                target: 'llm', value: Array.from(comparedModelIds).join(','), shown: comparedModelIds.size
            });
            if (typeof compareDialog.showModal === 'function') compareDialog.showModal();
            else compareDialog.setAttribute('open', '');
        });
        compareClose.addEventListener('click', () => compareDialog.close());
        compareDialog.addEventListener('click', (event) => {
            if (event.target === compareDialog) compareDialog.close();
        });

        const speechSearch = document.getElementById('lc-index-tts-search');
        const speechType = document.getElementById('lc-index-tts-type');
        const speechSort = document.getElementById('lc-index-tts-sort');
        const speechRows = document.getElementById('lc-index-tts-list');
        const speechCount = document.getElementById('lc-index-tts-result-count');
        const updateSpeechIndex = () => {
            const query = speechSearch.value.trim().toLowerCase();
            const type = speechType.value;
            const filtered = speechModels.filter((model) => {
                const haystack = `${model.name} ${model.family} ${model.developer} ${model.license || ''}`.toLowerCase();
                return haystack.includes(query) && (type === 'all' || model.type === type);
            }).sort(compareSpeech(speechSort.value));
            speechRows.innerHTML = filtered.length ? renderSpeechRows(filtered) : '<p class="lc-index-tts-empty">No local speech model matches these filters.</p>';
            speechCount.textContent = filtered.length;
        };
        let speechSearchGoalTimer = 0;
        let lastTrackedSpeechSearch = '';
        speechSearch.addEventListener('input', () => {
            updateSpeechIndex();
            if (speechSearchGoalTimer) window.clearTimeout(speechSearchGoalTimer);
            const query = speechSearch.value.trim().toLowerCase();
            if (query.length < 2) {
                lastTrackedSpeechSearch = '';
                return;
            }
            speechSearchGoalTimer = window.setTimeout(() => {
                speechSearchGoalTimer = 0;
                if (query === lastTrackedSpeechSearch) return;
                lastTrackedSpeechSearch = query;
                trackHomeGoal('home_index_search', {target: 'speech', shown: speechCount.textContent});
            }, 400);
        });
        speechType.addEventListener('change', () => {
            updateSpeechIndex();
            trackHomeGoal('home_index_filter', {target: 'speech', group: 'type', value: speechType.value, shown: speechCount.textContent});
        });
        speechSort.addEventListener('change', () => {
            updateSpeechIndex();
            trackHomeGoal('home_index_sort', {target: 'speech', sort: speechSort.value, shown: speechCount.textContent});
        });

        const loadCommunityRatings = async () => {
            try {
                const response = await fetch('/api/ratings', {
                    credentials: 'same-origin',
                    headers: {Accept: 'application/json'}
                });
                if (!response.ok) throw new Error('Community ratings unavailable');
                const data = await response.json();
                communityRatings.clear();
                (Array.isArray(data && data.ratings) ? data.ratings : []).forEach((item) => {
                    const modelId = String(item && item.modelId || '').trim();
                    if (!modelId) return;
                    communityRatings.set(modelId, {
                        average: Math.max(0, Math.min(5, finite(item.average))),
                        count: Math.max(0, Math.floor(finite(item.count)))
                    });
                });
                communityState = 'ready';
            } catch (error) {
                communityState = 'unavailable';
            }
            updateIndex();
            updateSpeechIndex();
        };
        const loadPrimaryMachine = async () => {
            try {
                const response = await fetch('/api/machines', {
                    credentials: 'same-origin',
                    headers: {Accept: 'application/json'}
                });
                if (!response.ok) return;
                const data = await response.json();
                const machines = Array.isArray(data && data.machines) ? data.machines : [];
                const primary = machines.find((item) => item && item.isPrimary) || machines[0];
                const accountRam = normalizeMachineRam(primary && primary.ramGb);
                if (!accountRam) return;
                machineRam = accountRam;
                ensureMachineOption(accountRam, `${primary.name || 'Primary machine'} · ${accountRam} GB`);
                machineRamSelect.value = String(accountRam);
                fitFilter.disabled = false;
                try {
                    window.localStorage.setItem('localclaw_home_machine_ram', String(accountRam));
                } catch (error) {
                    // The account-backed selection still works without local storage.
                }
                updateIndex();
            } catch (error) {
                // Anonymous visitors and unavailable account APIs keep the local quick selector.
            }
        };
        syncSortControls();
        renderCompareTray();
        loadCommunityRatings();
        loadPrimaryMachine();
        const seoFallback = document.getElementById('seo-fallback');
        if (seoFallback) seoFallback.remove();
    };
}
