// Homepage-only model index. The canonical catalogues stay in js/data.js and
// tts-list.html; this view filters non-local records and de-duplicates routes.
if (typeof App !== 'undefined' && typeof APP_DATA !== 'undefined') {
    App.renderHero = function renderLocalModelIndex(container) {
        document.querySelectorAll('.lc-global-nav__link[data-nav-key="account"]').forEach((link) => { link.textContent = 'Account'; });

        const allLocalModels = APP_DATA.models.filter((model) => !model.hosted_only);
        const localModels = Array.from(new Map(allLocalModels.map((model) => [model.id, model])).values());
        const newestRelease = localModels.reduce((latest, model) => model.released > latest ? model.released : latest, '');
        const familyCount = new Set(localModels.map((model) => model.family)).size;
        const catalogueOrder = new Map(localModels.map((model, index) => [model.id, index]));

        const speechModels = Array.isArray(window.HOME_INDEX_SPEECH_MODELS) ? window.HOME_INDEX_SPEECH_MODELS : [];
        const speechCatalogueOrder = new Map(speechModels.map((model, index) => [model.id, index]));
        const logoRegistry = window.HOME_INDEX_LOGOS || {llm: {}, speech: {}, labels: {}};

        const familyDetails = (model) => {
            if (typeof MODEL_DETAILS !== 'undefined' && MODEL_DETAILS[model.id]) return MODEL_DETAILS[model.id];
            if (typeof generateDefaultDetails === 'function') return generateDefaultDetails(model);
            return {};
        };
        const modelLicense = (model) => familyDetails(model).license || 'See model page';
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
        const nameCompare = (a, b) => String(a.name).localeCompare(String(b.name), 'en', {sensitivity: 'base'});
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
        const compareModels = (sortKey) => (a, b) => {
            if (sortKey === 'catalogue') return catalogueOrder.get(a.id) - catalogueOrder.get(b.id);
            let result = 0;
            if (sortKey === 'score') result = llmScore(b) - llmScore(a);
            if (['quality', 'coding', 'reasoning', 'speed'].includes(sortKey)) result = finite(b.benchmarks && b.benchmarks[sortKey]) - finite(a.benchmarks && a.benchmarks[sortKey]);
            if (sortKey === 'fresh') result = String(b.released || '').localeCompare(String(a.released || ''));
            if (sortKey === 'ram') result = finite(a.min_ram, Infinity) - finite(b.min_ram, Infinity);
            if (sortKey === 'name') result = nameCompare(a, b);
            return result || llmScore(b) - llmScore(a) || llmTieBreak(a, b);
        };
        const compareSpeech = (sortKey) => (a, b) => {
            let result = 0;
            if (sortKey === 'score') result = speechScore(b) - speechScore(a);
            if (sortKey === 'quality') result = finite(b.quality) - finite(a.quality);
            if (sortKey === 'speed') result = finite(b.speed) - finite(a.speed);
            if (sortKey === 'fresh') result = String(b.releaseDate || '').localeCompare(String(a.releaseDate || ''));
            if (sortKey === 'name') result = nameCompare(a, b);
            return result || speechScore(b) - speechScore(a) || finite(b.quality) - finite(a.quality) || finite(b.speed) - finite(a.speed) || nameCompare(a, b) || speechCatalogueOrder.get(a.id) - speechCatalogueOrder.get(b.id);
        };
        const scoreMarkup = (value, title, modifier = '') => `<span class="lc-index-score ${modifier}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}"><strong>${scoreLabel(value)}</strong><small>/10</small></span>`;
        const sponsorRail = (side) => `
            <aside class="lc-sponsor-rail" aria-label="${side} advertising placeholders — three non-commercial slots">
                ${[1, 2, 3].map((slot) => `<div class="lc-sponsor-slot" data-sponsor-placeholder="${side.toLowerCase()}-${slot}"><span class="lc-sponsor-slot__label">Ad slot ${String(slot).padStart(2, '0')}</span><span class="lc-sponsor-slot__mark"></span><p>Reserved placeholder.<br>No advertiser.</p><span class="lc-sponsor-slot__size">NON-COMMERCIAL</span></div>`).join('')}
            </aside>`;

        const renderModelRows = (models) => models.map((model, index) => {
            const ratings = model.benchmarks || {};
            const overall = llmScore(model);
            const scoreTitle = `LocalClaw catalogue score ${scoreLabel(overall)} out of 10. Quality ${finite(ratings.quality)}; coding ${finite(ratings.coding)}; reasoning ${finite(ratings.reasoning)}; speed ${finite(ratings.speed)}.`;
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
                    <td>${escapeHtml(model.params || '—')}</td>
                    <td>${Number.isFinite(model.min_ram) ? `${model.min_ram} GB` : '—'}</td>
                    <td class="lc-index-license" title="${escapeHtml(modelLicense(model))}">${escapeHtml(modelLicense(model))}</td>
                    <td>${escapeHtml(releaseLabel(model.released))}</td>
                    <td><a class="lc-index-row-link" href="/models/${encodeURIComponent(model.id)}" aria-label="Open ${escapeHtml(model.name)}">→</a></td>
                </tr>`;
        }).join('');

        const renderSpeechRows = (models) => models.map((model, index) => {
            const overall = speechScore(model);
            const scoreTitle = `LocalClaw audio score ${scoreLabel(overall)} out of 10. Quality ${finite(model.quality)}; speed ${finite(model.speed)}.`;
            return `<a class="lc-index-tts-row" href="/tts/${encodeURIComponent(model.id)}" data-fast-goal="tts_open" data-fast-goal-source="home_index" data-fast-goal-model="${escapeHtml(model.id)}">
                <span class="lc-index-tts-rank">${String(index + 1).padStart(2, '0')}</span>
                ${logoMarkup('speech', model.family, model.developer)}
                <span class="lc-index-tts-copy"><strong class="lc-index-tts-name">${escapeHtml(model.name)}</strong><span class="lc-index-tts-meta">${escapeHtml(model.developer)} · ${escapeHtml(model.license || 'See model page')}</span><span class="lc-index-tts-signals">QUALITY ${scoreLabel(model.quality)} · SPEED ${scoreLabel(model.speed)}</span></span>
                <span class="lc-index-tts-score-group">${scoreMarkup(overall, scoreTitle, 'lc-index-score--speech')}<span class="lc-index-tts-type">${escapeHtml(model.type)}</span></span>
            </a>`;
        }).join('');

        const rankedModels = [...localModels].sort(compareModels('score'));
        const rankedSpeechModels = [...speechModels].sort(compareSpeech('score'));
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
                            <p>One maintained directory for comparing local models by LocalClaw score, family, parameters, minimum RAM, licence and release date.</p>
                        </div>
                        <div class="lc-index-hero__mascot" aria-hidden="true"><img src="/images/localclaw-mascot-hero.webp?v=20260601" width="719" height="600" alt="" loading="eager" decoding="async" fetchpriority="high"></div>
                    </header>

                    <section class="lc-index-facts" aria-label="Index information">
                        <article class="lc-index-fact"><span class="lc-index-eyebrow">Catalogue</span><strong class="lc-index-fact__value"><span class="lc-index-fact__number">${localModels.length}</span><span class="lc-index-fact__label">local LLM pages</span></strong><p>Hosted-only records excluded.</p></article>
                        <article class="lc-index-fact"><span class="lc-index-eyebrow">Families</span><strong class="lc-index-fact__value"><span class="lc-index-fact__number">${familyCount}</span><span class="lc-index-fact__label">model families</span></strong><p>Duplicate route IDs collapsed.</p></article>
                        <article class="lc-index-fact"><span class="lc-index-eyebrow">Freshness</span><strong class="lc-index-fact__value"><span class="lc-index-fact__number lc-index-fact__number--date">${escapeHtml(releaseMonth)}</span><span class="lc-index-fact__label">latest catalogue month</span></strong><p>From repository release metadata.</p></article>
                    </section>

                    <section id="llm-index" aria-labelledby="llm-index-title">
                        <div class="lc-index-section-head">
                            <div><span class="lc-index-eyebrow">Directory 01</span><h2 id="llm-index-title">Local LLMs</h2></div>
                            <div class="lc-index-section-meta"><p><strong id="lc-index-result-count">${localModels.length}</strong> ranked entries · repository signals</p><span class="lc-index-method-pill">LocalClaw score · /10</span></div>
                        </div>
                        <div class="lc-index-controls">
                            <label><span class="sr-only">Search models</span><input id="lc-index-search" class="lc-index-control" type="search" placeholder="Search model or family…" autocomplete="off"></label>
                            <label><span class="sr-only">Filter by RAM</span><select id="lc-index-ram" class="lc-index-control"><option value="all">All RAM classes</option><option value="8">Up to 8 GB</option><option value="16">Up to 16 GB</option><option value="32">Up to 32 GB</option><option value="64">Up to 64 GB</option><option value="128">Up to 128 GB</option></select></label>
                            <label><span class="sr-only">Sort models</span><select id="lc-index-sort" class="lc-index-control"><option value="score">Score — overall</option><option value="quality">Quality — highest</option><option value="coding">Coding — highest</option><option value="reasoning">Reasoning — highest</option><option value="speed">Speed — highest</option><option value="fresh">Newest first</option><option value="ram">Lowest RAM first</option><option value="name">Name A–Z</option><option value="catalogue">Catalogue order</option></select></label>
                        </div>
                        <div class="lc-index-table-wrap">
                            <table class="lc-index-table">
                                <thead><tr><th class="lc-index-rank">Rank</th><th class="lc-index-model-col">Model / family</th><th class="lc-index-score-col">Score</th><th>Params</th><th>Min RAM</th><th>Licence</th><th>Released</th><th></th></tr></thead>
                                <tbody id="lc-index-model-rows">${renderModelRows(rankedModels)}</tbody>
                            </table>
                        </div>
                        <p class="lc-index-method-note"><strong>LLM score method.</strong> This reuses the catalogue composite already shown on LocalClaw: 38% quality + 24% coding + 24% reasoning + 14% speed. Every input is an existing repository rating on a 0–10 scale. It is a LocalClaw comparison signal, not an external or lab benchmark.</p>
                    </section>

                    <section class="lc-index-tts" aria-labelledby="tts-index-title">
                        <div class="lc-index-section-head">
                            <div><span class="lc-index-eyebrow">Directory 02</span><h2 id="tts-index-title">Local speech / TTS</h2></div>
                            <div class="lc-index-section-meta"><p><strong id="lc-index-tts-result-count">${speechModels.length}</strong> ranked speech records · local only</p><span class="lc-index-method-pill">Audio score · /10</span></div>
                        </div>
                        <div class="lc-index-controls lc-index-tts-controls">
                            <label><span class="sr-only">Search speech models</span><input id="lc-index-tts-search" class="lc-index-control" type="search" placeholder="Search speech model or maker…" autocomplete="off"></label>
                            <label><span class="sr-only">Filter speech model type</span><select id="lc-index-tts-type" class="lc-index-control"><option value="all">All speech types</option><option value="TTS">TTS only</option><option value="ASR">ASR only</option><option value="APP">Apps only</option></select></label>
                            <label><span class="sr-only">Sort speech models</span><select id="lc-index-tts-sort" class="lc-index-control"><option value="score">Score — overall</option><option value="quality">Quality — highest</option><option value="speed">Speed — highest</option><option value="fresh">Newest first</option><option value="name">Name A–Z</option></select></label>
                        </div>
                        <div id="lc-index-tts-list" class="lc-index-tts-list">${renderSpeechRows(rankedSpeechModels)}</div>
                        <p class="lc-index-method-note lc-index-method-note--speech"><strong>Speech score method.</strong> This reuses the Audio score already shown in the speech catalogue: 68% quality + 32% speed, capped at 10. Both inputs come from the existing speech records. It is a LocalClaw comparison signal, not an external benchmark.</p>
                        <a class="lc-index-more" href="/tts-list">Browse the full speech catalogue →</a>
                    </section>
                </div>

                ${sponsorRail('Right')}
            </div>`;

        const search = document.getElementById('lc-index-search');
        const ram = document.getElementById('lc-index-ram');
        const sort = document.getElementById('lc-index-sort');
        const rows = document.getElementById('lc-index-model-rows');
        const count = document.getElementById('lc-index-result-count');
        const updateIndex = () => {
            const query = search.value.trim().toLowerCase();
            const maxRam = ram.value === 'all' ? Infinity : Number(ram.value);
            const filtered = localModels.filter((model) => {
                const haystack = `${model.name} ${model.family} ${(model.tags || []).join(' ')}`.toLowerCase();
                return haystack.includes(query) && Number(model.min_ram || Infinity) <= maxRam;
            }).sort(compareModels(sort.value));
            rows.innerHTML = filtered.length ? renderModelRows(filtered) : '<tr><td class="lc-index-empty" colspan="8">No local model matches these filters.</td></tr>';
            count.textContent = filtered.length;
        };
        search.addEventListener('input', updateIndex);
        ram.addEventListener('change', updateIndex);
        sort.addEventListener('change', updateIndex);

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
        speechSearch.addEventListener('input', updateSpeechIndex);
        speechType.addEventListener('change', updateSpeechIndex);
        speechSort.addEventListener('change', updateSpeechIndex);
    };
}
