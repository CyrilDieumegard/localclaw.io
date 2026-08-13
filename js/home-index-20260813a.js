// Homepage-only model index. The canonical catalogue stays in js/data.js;
// this view filters out hosted-only records and de-duplicates route IDs.
if (typeof App !== 'undefined' && typeof APP_DATA !== 'undefined') {
    App.renderHero = function renderLocalModelIndex(container) {
        document.querySelectorAll('.lc-global-nav__link[data-nav-key="account"]').forEach((link) => { link.textContent = 'Account'; });
        const allLocalModels = APP_DATA.models.filter((model) => !model.hosted_only);
        const localModels = Array.from(new Map(allLocalModels.map((model) => [model.id, model])).values());
        const newestRelease = localModels.reduce((latest, model) => model.released > latest ? model.released : latest, '');

        const speechModels = [
            ['qwen3-tts', 'Qwen3 TTS', 'Alibaba Cloud · Apache 2.0', 'TTS'],
            ['melotts', 'MeloTTS', 'MYShell · MIT', 'TTS'],
            ['piper', 'Piper', 'Rhasspy · MIT', 'TTS'],
            ['coqui-tts', 'Coqui TTS (XTTS v2)', 'Coqui · CPML', 'TTS'],
            ['bark', 'Bark (Suno)', 'Suno · MIT', 'TTS'],
            ['mms', 'MMS (Meta)', 'Meta AI · CC-BY-NC', 'TTS'],
            ['parler-tts', 'Parler TTS', 'Hugging Face · Apache 2.0', 'TTS'],
            ['fish-speech', 'Fish Speech', 'Fish Audio · Apache 2.0', 'TTS'],
            ['styletts2', 'StyleTTS 2', 'Y. L. Ma et al. · MIT', 'TTS'],
            ['f5-tts', 'F5-TTS', 'Speech Research · MIT', 'TTS'],
            ['chattts', 'ChatTTS', '2Noise · AGPL-3.0', 'TTS'],
            ['tortoise-tts', 'Tortoise TTS', 'James Betker · Apache 2.0', 'TTS'],
            ['metavoice', 'MetaVoice-1B', 'Metavoice · Apache 2.0', 'TTS'],
            ['kokoro', 'Kokoro TTS', 'hexgrad · Apache 2.0', 'TTS'],
            ['orpheus-tts', 'Orpheus TTS', 'Canopy Labs · Apache 2.0', 'TTS'],
            ['chatterbox', 'Chatterbox TTS', 'Resemble AI · MIT', 'TTS'],
            ['qwen3-asr', 'Qwen3 ASR', 'Alibaba Cloud · Apache 2.0', 'ASR'],
            ['whisper-v3-turbo', 'Whisper v3 Turbo', 'OpenAI · MIT', 'ASR']
        ];

        const familyDetails = (model) => {
            if (typeof MODEL_DETAILS !== 'undefined' && MODEL_DETAILS[model.id]) return MODEL_DETAILS[model.id];
            if (typeof generateDefaultDetails === 'function') return generateDefaultDetails(model);
            return {};
        };
        const modelLicense = (model) => familyDetails(model).license || 'See model page';
        const familyInitials = (family) => String(family || 'AI').split(/[-_\s]+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
        const releaseLabel = (value) => {
            if (!/^\d{4}-\d{2}$/.test(value || '')) return value || '—';
            return new Intl.DateTimeFormat('en', {month: 'short', year: 'numeric', timeZone: 'UTC'}).format(new Date(`${value}-01T00:00:00Z`));
        };
        const escapeHtml = (value) => String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

        const renderModelRows = (models) => models.map((model, index) => `
            <tr>
                <td class="lc-index-rank">${String(index + 1).padStart(3, '0')}</td>
                <td>
                    <a class="lc-index-model-link" href="/models/${encodeURIComponent(model.id)}" data-fast-goal="model_open" data-fast-goal-source="home_index" data-fast-goal-model="${escapeHtml(model.id)}">
                        <span class="lc-index-family-mark" aria-hidden="true">${escapeHtml(familyInitials(model.family))}</span>
                        <span><strong class="lc-index-model-name">${escapeHtml(model.name)}</strong><span class="lc-index-model-family">${escapeHtml(model.family || 'local model')}</span></span>
                    </a>
                </td>
                <td>${escapeHtml(model.params || '—')}</td>
                <td>${Number.isFinite(model.min_ram) ? `${model.min_ram} GB` : '—'}</td>
                <td class="lc-index-license" title="${escapeHtml(modelLicense(model))}">${escapeHtml(modelLicense(model))}</td>
                <td>${escapeHtml(releaseLabel(model.released))}</td>
                <td><span class="lc-index-method">Method preview</span></td>
                <td><a class="lc-index-row-link" href="/models/${encodeURIComponent(model.id)}" aria-label="Open ${escapeHtml(model.name)}">→</a></td>
            </tr>
        `).join('');

        container.className = 'lc-index-shell';
        container.innerHTML = `
            <header class="lc-index-hero">
                <div class="lc-index-hero__copy">
                    <p class="lc-index-kicker">// LocalClaw directory · local models only</p>
                    <h1>The Local <span>Model Index</span></h1>
                    <p>A dense, hardware-aware directory built from LocalClaw's existing catalogue. Compare real local model records by family, parameters, minimum RAM, licence and release date.</p>
                    <div class="lc-index-hero__actions">
                        <a class="lc-index-button lc-index-button--primary" href="#llm-index">Explore the index</a>
                        <a class="lc-index-button" href="/account" data-fast-goal="account_open" data-fast-goal-source="home_index">Account</a>
                    </div>
                </div>
                <div class="lc-index-hero__mascot" aria-hidden="true">
                    <img src="/images/localclaw-mascot-hero.webp?v=20260601" width="719" height="600" alt="" loading="eager" decoding="async" fetchpriority="high">
                </div>
            </header>

            <section class="lc-index-facts" aria-label="Index information">
                <article class="lc-index-fact"><span class="lc-index-eyebrow">Leader</span><strong>${escapeHtml(localModels[0].name)}</strong><p>First entry in the maintained catalogue order. This is not a benchmark claim.</p></article>
                <article class="lc-index-fact"><span class="lc-index-eyebrow">Variations</span><strong>${localModels.length} unique local LLM pages</strong><p>${new Set(localModels.map((model) => model.family)).size} model families after hosted-only filtering and ID de-duplication.</p></article>
                <article class="lc-index-fact"><span class="lc-index-eyebrow">Freshness</span><strong>Latest catalogue month · ${escapeHtml(releaseLabel(newestRelease))}</strong><p>Release metadata comes directly from the repository catalogue.</p></article>
            </section>

            <div class="lc-index-grid">
                <aside class="lc-sponsor-rail" aria-label="Left sponsor placeholder"><div class="lc-sponsor-slot"><span class="lc-sponsor-slot__label">Sponsor space</span><span class="lc-sponsor-slot__mark"></span><p>Reserved placeholder. No commercial partner.</p></div></aside>

                <div class="lc-index-directory">
                    <section id="llm-index" aria-labelledby="llm-index-title">
                        <div class="lc-index-section-head">
                            <div><span class="lc-index-eyebrow">Directory 01</span><h2 id="llm-index-title">Local LLMs</h2></div>
                            <p><span id="lc-index-result-count">${localModels.length}</span> local entries · use the catalogue page order as an index, not a benchmark ranking.</p>
                        </div>
                        <div class="lc-index-controls">
                            <label><span class="sr-only">Search models</span><input id="lc-index-search" class="lc-index-control" type="search" placeholder="Search model or family…" autocomplete="off"></label>
                            <label><span class="sr-only">Filter by RAM</span><select id="lc-index-ram" class="lc-index-control"><option value="all">All RAM classes</option><option value="8">Up to 8 GB</option><option value="16">Up to 16 GB</option><option value="32">Up to 32 GB</option><option value="64">Up to 64 GB</option><option value="128">Up to 128 GB</option></select></label>
                            <label><span class="sr-only">Sort models</span><select id="lc-index-sort" class="lc-index-control"><option value="catalogue">Catalogue order</option><option value="fresh">Newest first</option><option value="ram">Lowest RAM first</option><option value="name">Name A–Z</option></select></label>
                        </div>
                        <div class="lc-index-table-wrap">
                            <table class="lc-index-table">
                                <thead><tr><th class="lc-index-rank">Rank</th><th class="lc-index-model-col">Model / family</th><th>Params</th><th>Min RAM</th><th>Licence</th><th>Released</th><th>Status</th><th></th></tr></thead>
                                <tbody id="lc-index-model-rows">${renderModelRows(localModels)}</tbody>
                            </table>
                        </div>
                        <p class="lc-index-method-note"><strong>Method note.</strong> LocalClaw has hardware-fit signals inside its recommendation flow, but the repository does not provide one global, source-backed score that can fairly rank every model here. The index therefore labels score space as a method preview instead of publishing invented values. RAM, licence and release fields come from existing LocalClaw data and detail records.</p>
                    </section>

                    <section class="lc-index-tts" aria-labelledby="tts-index-title">
                        <div class="lc-index-section-head"><div><span class="lc-index-eyebrow">Directory 02</span><h2 id="tts-index-title">Local speech / TTS</h2></div><p>A separate list sampled from the existing 58-entry LocalClaw speech catalogue.</p></div>
                        <div class="lc-index-tts-list">${speechModels.map(([id, name, meta, type], index) => `<a class="lc-index-tts-row" href="/tts/${id}" data-fast-goal="tts_open" data-fast-goal-source="home_index"><span class="lc-index-tts-rank">${String(index + 1).padStart(2, '0')}</span><span><strong class="lc-index-tts-name">${escapeHtml(name)}</strong><span class="lc-index-tts-meta">${escapeHtml(meta)}</span></span><span class="lc-index-tts-type">${type}</span></a>`).join('')}</div>
                        <a class="lc-index-more" href="/tts-list">Browse all 58 speech models →</a>
                    </section>
                </div>

                <aside class="lc-sponsor-rail" aria-label="Right sponsor placeholder"><div class="lc-sponsor-slot"><span class="lc-sponsor-slot__label">Sponsor space</span><span class="lc-sponsor-slot__mark"></span><p>Reserved placeholder. No commercial partner.</p></div></aside>
            </div>
        `;

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
            });
            if (sort.value === 'fresh') filtered.sort((a, b) => String(b.released).localeCompare(String(a.released)) || a.name.localeCompare(b.name));
            if (sort.value === 'ram') filtered.sort((a, b) => Number(a.min_ram || Infinity) - Number(b.min_ram || Infinity) || a.name.localeCompare(b.name));
            if (sort.value === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
            rows.innerHTML = filtered.length ? renderModelRows(filtered) : '<tr><td class="lc-index-empty" colspan="8">No local model matches these filters.</td></tr>';
            count.textContent = filtered.length;
        };
        search.addEventListener('input', updateIndex);
        ram.addEventListener('change', updateIndex);
        sort.addEventListener('change', updateIndex);
    };
}
