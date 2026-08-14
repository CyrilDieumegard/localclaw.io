const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://localclaw.io';
const CHECK_ONLY = process.argv.includes('--check');
const INDEX_PATH = path.join(ROOT, 'index.html');
const LLMS_PATH = path.join(ROOT, 'llms.txt');
const LLMS_FULL_PATH = path.join(ROOT, 'llms-full.txt');
const DATA_PATH = path.join(ROOT, 'js/data.js');
const DETAILS_PATH = path.join(ROOT, 'js/model-details.js');
const SPEECH_PATH = path.join(ROOT, 'js/home-index-speech-20260814c.js');

function evaluate(filePath, suffix, context = {}) {
  vm.createContext(context);
  vm.runInContext(`${fs.readFileSync(filePath, 'utf8')}\n${suffix}`, context);
  return context;
}

const dataSource = fs.readFileSync(DATA_PATH, 'utf8');
const dataContext = evaluate(DATA_PATH, ';this.APP_DATA_EXPORT=APP_DATA;');
const detailContext = evaluate(DETAILS_PATH, ';this.MODEL_DETAILS_EXPORT=MODEL_DETAILS;');
const speechContext = evaluate(SPEECH_PATH, '', { window: {} });
const appData = dataContext.APP_DATA_EXPORT;
const modelDetails = detailContext.MODEL_DETAILS_EXPORT || {};
const speechModels = speechContext.window.HOME_INDEX_SPEECH_MODELS || [];
const localModels = Array.from(new Map(
  appData.models.filter(model => !model.hosted_only).map(model => [model.id, model])
).values());

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function llmScore(model) {
  const scores = model.benchmarks || {};
  return (finite(scores.quality) * 0.38)
    + (finite(scores.coding) * 0.24)
    + (finite(scores.reasoning) * 0.24)
    + (finite(scores.speed) * 0.14);
}

function speechScore(model) {
  return Math.min(10, (finite(model.quality) * 0.68) + (finite(model.speed) * 0.32));
}

function scoreLabel(value) {
  return finite(value).toFixed(1);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function releaseLabel(value) {
  if (!/^\d{4}-\d{2}(?:-\d{2})?$/.test(String(value || ''))) return value || 'Unknown';
  const [year, month, day = '01'] = value.split('-');
  return new Intl.DateTimeFormat('en', {
    month: 'short', year: 'numeric', timeZone: 'UTC', ...(value.length === 10 ? { day: 'numeric' } : {})
  }).format(new Date(`${year}-${month}-${day}T12:00:00Z`));
}

function parseUpdatedDate() {
  const match = dataSource.match(/^\/\/ Updated ([A-Za-z]+ \d{1,2}, \d{4})/m);
  if (!match) throw new Error('The first js/data.js update comment must contain a full date.');
  const date = new Date(`${match[1]} 12:00:00 UTC`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid catalogue update date: ${match[1]}`);
  return date;
}

const updatedDate = parseUpdatedDate();
const updatedIso = updatedDate.toISOString().slice(0, 10);
const updatedDisplay = new Intl.DateTimeFormat('en', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
}).format(updatedDate);
const newestRelease = localModels.map(model => model.released || '').sort().at(-1);
const llmFamilyCount = new Set(localModels.map(model => model.family).filter(Boolean)).size;
const speechFamilyCount = new Set(speechModels.map(model => model.family).filter(Boolean)).size;
const speechTypeCounts = Object.fromEntries(['TTS', 'ASR', 'APP'].map(type => [
  type,
  speechModels.filter(model => model.type === type).length
]));
const rankedModels = [...localModels].sort((a, b) => llmScore(b) - llmScore(a)
  || String(b.released || '').localeCompare(String(a.released || ''))
  || String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' }));
const rankedSpeech = [...speechModels].sort((a, b) => speechScore(b) - speechScore(a)
  || finite(b.quality) - finite(a.quality)
  || String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' }));

function verifiedLicense(model) {
  return modelDetails[model.id] && modelDetails[model.id].license
    ? modelDetails[model.id].license
    : 'See upstream model page';
}

function tierPicks(tier) {
  const families = new Set();
  const picks = [];
  for (const model of rankedModels) {
    if (!Number.isFinite(Number(model.min_ram)) || Number(model.min_ram) > tier) continue;
    const family = model.family || model.id;
    if (families.has(family)) continue;
    families.add(family);
    picks.push(model);
    if (picks.length === 3) break;
  }
  return picks;
}

const ramTiers = [8, 16, 32, 64].map(ram => ({ ram, models: tierPicks(ram) }));

const faqs = [
  {
    question: 'What is The Local Model Index?',
    answer: `It is LocalClaw's hardware-aware directory of ${localModels.length} unique local LLM pages and ${speechModels.length} local speech records. Hosted-only LLM records are excluded and duplicate route IDs are collapsed.`
  },
  {
    question: 'How is the LocalClaw score calculated?',
    answer: 'The homepage LocalClaw catalogue score is a separate 0-10 method calculated from repository fields: 38% quality, 24% coding, 24% reasoning and 14% speed. It is not a community rating or an external benchmark leaderboard.'
  },
  {
    question: 'Are community stars mixed into the LocalClaw score?',
    answer: 'No. Community stars are the independent 1-5 average from signed-in LocalClaw members, always shown with the number of votes. Community confidence uses only stars and vote count for ordering; EARLY means fewer than five votes. It never changes the LocalClaw score.'
  },
  {
    question: 'How should I choose a local model for 8, 16, 32 or 64 GB RAM?',
    answer: 'Use the machine RAM selector or a RAM guide. A model is considered compatible when its catalogue minimum-RAM value is at or below the selected memory; context length, runtime overhead and other applications can require additional headroom.'
  },
  {
    question: 'Does the homepage include cloud-only or API-only models?',
    answer: 'No. The homepage is a local-only index. Hosted-only LLM records, Edge TTS and OCTAVE 2 are excluded because the current catalogue does not provide a verified fully local runtime path for those records.'
  },
  {
    question: 'What speech models are covered?',
    answer: `The local speech index contains ${speechModels.length} records: ${speechTypeCounts.TTS} TTS models, ${speechTypeCounts.ASR} ASR models and ${speechTypeCounts.APP} local speech application. Each entry keeps its Audio score separate from community stars.`
  },
  {
    question: 'How fresh is the LocalClaw catalogue?',
    answer: `This homepage snapshot was generated from the repository catalogue updated ${updatedDisplay}. Release dates, RAM requirements, licences and links come from the maintained LocalClaw records and linked model pages.`
  }
];

function renderModelTableRows(models) {
  return models.map((model, index) => `<tr>
                <td>${String(index + 1).padStart(2, '0')}</td>
                <td><a href="/models/${encodeURIComponent(model.id)}"><strong>${escapeHtml(model.name)}</strong><span>${escapeHtml(model.family || 'local model')}</span></a></td>
                <td>${scoreLabel(llmScore(model))}/10</td>
                <td>${escapeHtml(model.params || 'Unknown')}</td>
                <td>${Number.isFinite(Number(model.min_ram)) ? `${Number(model.min_ram)} GB` : 'See page'}</td>
                <td>${escapeHtml(verifiedLicense(model))}</td>
                <td>${escapeHtml(releaseLabel(model.released))}</td>
              </tr>`).join('\n');
}

function renderSpeechList(models) {
  return models.map((model, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><a href="/tts/${encodeURIComponent(model.id)}"><strong>${escapeHtml(model.name)}</strong><small>${escapeHtml(model.type)} · Audio ${scoreLabel(speechScore(model))}/10 · ${escapeHtml(model.license || 'See model page')}</small></a></li>`).join('\n');
}

function renderFallback() {
  return `        <div id="seo-fallback" class="lc-index-fallback" data-home-index-snapshot="${updatedIso}">
          <header class="lc-index-fallback__hero">
            <p class="lc-index-kicker">// LocalClaw · local models only</p>
            <h1>The Local <span>Model Index</span></h1>
            <p>A hardware-aware directory for comparing local LLM and speech models by independent community stars, LocalClaw score, minimum RAM, family, licence and release date.</p>
            <div class="lc-index-fallback__stats" aria-label="Current LocalClaw index statistics">
              <span><strong>${localModels.length}</strong> local LLM pages</span>
              <span><strong>${llmFamilyCount}</strong> LLM families</span>
              <span><strong>${speechModels.length}</strong> local speech records</span>
              <span><strong>${escapeHtml(releaseLabel(newestRelease))}</strong> latest release month</span>
            </div>
            <nav class="lc-index-fallback__nav" aria-label="Model index shortcuts"><a href="#llm-snapshot">LLM snapshot</a><a href="#speech-snapshot">Speech snapshot</a><a href="#index-methodology">Methodology</a><a href="/new">Newest models</a></nav>
          </header>

          <section id="llm-snapshot" class="lc-index-fallback__section" aria-labelledby="llm-snapshot-title">
            <div><span class="lc-index-eyebrow">Crawlable snapshot</span><h2 id="llm-snapshot-title">Local LLM score leaders</h2><p>The first 16 current local records ordered only by the documented LocalClaw catalogue score. Community ratings remain a separate live signal.</p></div>
            <div class="lc-index-fallback__table-wrap"><table><thead><tr><th>Rank</th><th>Model / family</th><th>LocalClaw</th><th>Parameters</th><th>Min RAM</th><th>Licence</th><th>Released</th></tr></thead><tbody>
${renderModelTableRows(rankedModels.slice(0, 16))}
            </tbody></table></div>
            <a class="lc-index-more" href="/llm-list">Browse all LLM catalogue records →</a>
          </section>

          <section id="speech-snapshot" class="lc-index-fallback__section" aria-labelledby="speech-snapshot-title">
            <div><span class="lc-index-eyebrow">Crawlable snapshot</span><h2 id="speech-snapshot-title">Local speech score leaders</h2><p>The first 10 records ordered by the homepage Audio score: 68% quality and 32% speed. Community stars remain independent.</p></div>
            <ol class="lc-index-fallback__speech">
${renderSpeechList(rankedSpeech.slice(0, 10))}
            </ol>
            <a class="lc-index-more" href="/tts-list">Browse the complete speech catalogue →</a>
          </section>

          <p class="lc-index-fallback__enhance"><strong>Progressive enhancement:</strong> JavaScript adds live community vote counts, machine-fit filtering, search, sorting and comparison. This verified snapshot remains useful if those enhancements are unavailable.</p>
        </div>`;
}

function renderGuide() {
  const tierCards = ramTiers.map(({ ram, models }) => `<article>
              <span class="lc-index-eyebrow">${ram} GB RAM</span>
              <h3>Highest catalogue scores that fit</h3>
              <ol>${models.map(model => `<li><a href="/models/${encodeURIComponent(model.id)}">${escapeHtml(model.name)}</a><span>${scoreLabel(llmScore(model))}/10 · min ${model.min_ram} GB</span></li>`).join('')}</ol>
              <a href="/ram/${ram}gb">Open the ${ram} GB guide →</a>
            </article>`).join('\n');
  const faqMarkup = faqs.map((faq, index) => `<details${index === 0 ? ' open' : ''}><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join('\n');
  return `        <!-- HOME_INDEX_GUIDE_START -->
        <section id="home-index-guide" class="lc-index-guide" aria-labelledby="home-index-guide-title">
          <header class="lc-index-guide__head">
            <div><span class="lc-index-eyebrow">Verified index guide</span><h2 id="home-index-guide-title">Choose a local model with transparent signals</h2></div>
            <p>Catalogue snapshot updated <time datetime="${updatedIso}">${updatedDisplay}</time>. Counts, score formulas and links below are generated from the same repository data as the interactive directory.</p>
          </header>

          <section class="lc-index-guide__ram" aria-labelledby="ram-answers-title">
            <div class="lc-index-guide__section-title"><h3 id="ram-answers-title">Quick answers by installed RAM</h3><p>These are catalogue-score leaders whose minimum-RAM field fits each tier, not universal benchmark winners.</p></div>
            <div class="lc-index-guide__ram-grid">${tierCards}</div>
          </section>

          <section id="index-methodology" class="lc-index-guide__method" aria-labelledby="method-title">
            <div class="lc-index-guide__section-title"><h3 id="method-title">Three signals, never blended</h3><p>Each signal answers a different question. No community average is converted into a software score.</p></div>
            <div class="lc-index-guide__method-grid">
              <article><span>01</span><h4>Community ★ /5</h4><p>Raw signed-in member average plus vote count. The confidence sort uses a transparent 3.5/5 prior over five votes; fewer than five votes is marked EARLY.</p><a href="/api/ratings">Live public aggregates →</a></article>
              <article><span>02</span><h4>LocalClaw /10</h4><p>Editorial catalogue rubric: 38% quality, 24% coding, 24% reasoning and 14% speed, using only maintained repository fields. It is not a standardized third-party benchmark.</p></article>
              <article><span>03</span><h4>Hardware fit</h4><p>Compares installed RAM with the catalogue minimum. Context, runtime overhead, GPU offload and other applications can require more headroom.</p></article>
            </div>
          </section>

          <section class="lc-index-guide__faq" aria-labelledby="index-faq-title">
            <div class="lc-index-guide__section-title"><h3 id="index-faq-title">Local model index FAQ</h3><p>Short, source-aligned answers for people and answer engines.</p></div>
            <div>${faqMarkup}</div>
          </section>

          <nav class="lc-index-guide__paths" aria-label="Local AI decision guides"><a href="/models/">All model pages</a><a href="/tts/">All speech pages</a><a href="/use-case/chat">Chat models</a><a href="/use-case/coding">Coding models</a><a href="/use-case/reasoning">Reasoning models</a><a href="/hardware/">Hardware guides</a><a href="/new">Newest local models</a><a href="/privacy">Privacy</a></nav>
        </section>
        <!-- HOME_INDEX_GUIDE_END -->`;
}

function listItems(models, scoreFn, routePrefix, limit) {
  return models.slice(0, limit).map((model, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: model.name,
    url: `${BASE_URL}/${routePrefix}/${encodeURIComponent(model.id)}`
  }));
}

function structuredDataMarkup() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'LocalClaw',
        url: `${BASE_URL}/`,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo-localclaw.svg` },
        description: 'Hardware-aware local AI model discovery, compatibility guides and optional native software for OpenClaw.'
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: `${BASE_URL}/`,
        name: 'LocalClaw',
        alternateName: 'The Local Model Index',
        inLanguage: 'en',
        publisher: { '@id': `${BASE_URL}/#organization` }
      },
      {
        '@type': 'CollectionPage',
        '@id': `${BASE_URL}/#webpage`,
        url: `${BASE_URL}/`,
        name: 'The Local Model Index — Local LLMs & TTS',
        description: `Compare ${localModels.length} unique local LLM pages and ${speechModels.length} local speech records by community stars, LocalClaw score, RAM, licence and release date.`,
        dateModified: updatedIso,
        inLanguage: 'en',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        publisher: { '@id': `${BASE_URL}/#organization` },
        about: [
          { '@type': 'Thing', name: 'Local large language models' },
          { '@type': 'Thing', name: 'Local text-to-speech models' },
          { '@type': 'Thing', name: 'Local speech recognition models' },
          { '@type': 'Thing', name: 'AI hardware compatibility' }
        ],
        mainEntity: [
          { '@id': `${BASE_URL}/#local-llm-list` },
          { '@id': `${BASE_URL}/#local-speech-list` },
          { '@id': `${BASE_URL}/#local-model-faq` }
        ]
      },
      {
        '@type': 'ItemList',
        '@id': `${BASE_URL}/#local-llm-list`,
        name: 'Highest current LocalClaw catalogue scores for local LLMs',
        description: 'A representative crawlable snapshot ordered by the documented LocalClaw catalogue score, separate from community ratings.',
        numberOfItems: localModels.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: listItems(rankedModels, llmScore, 'models', 20)
      },
      {
        '@type': 'ItemList',
        '@id': `${BASE_URL}/#local-speech-list`,
        name: 'Highest current LocalClaw Audio scores for local speech models',
        description: 'A representative crawlable snapshot ordered by the documented Audio score, separate from community ratings.',
        numberOfItems: speechModels.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: listItems(rankedSpeech, speechScore, 'tts', 20)
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/#local-model-faq`,
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer }
        }))
      }
    ]
  };
  return `    <!-- HOME_INDEX_STRUCTURED_DATA_START -->
    <script type="application/ld+json">
${JSON.stringify(graph, null, 2).split('\n').map(line => `    ${line}`).join('\n')}
    </script>
    <!-- HOME_INDEX_STRUCTURED_DATA_END -->`;
}

function replaceBetween(source, startToken, endToken, replacement) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  if (start === -1 || end === -1) throw new Error(`Cannot find generated block: ${startToken} ... ${endToken}`);
  return `${source.slice(0, start)}${replacement}${source.slice(end + endToken.length)}`;
}

function generateIndexHtml() {
  let html = fs.readFileSync(INDEX_PATH, 'utf8');

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, '<title>The Local Model Index — Local LLM &amp; TTS Scores | LocalClaw</title>')
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="Compare ${localModels.length} local LLM pages and ${speechModels.length} local speech records by community stars, LocalClaw score, RAM, licence and release date.">`)
    .replace(/\n\s*<meta name="keywords"[^>]*>/, '')
    .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Compare local LLM and speech models by independent community stars, LocalClaw score, RAM, licence and release date.">')
    .replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="A hardware-aware index of local LLM and speech models with independent scores, community votes and RAM fit.">')
    .replace(/<meta property="og:image:alt" content="[^"]*">/, '<meta property="og:image:alt" content="LocalClaw — The Local Model Index for local LLM and speech models">')
    .replace(/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="LocalClaw — The Local Model Index">')
    .replace(/<link rel="preload" as="image" href="images\/crab-logo\.png" fetchpriority="high">/, '<link rel="preload" as="image" href="images/localclaw-mascot-hero.webp?v=20260601" fetchpriority="high">');

  if (!html.includes('href="https://localclaw.io/llms.txt"')) {
    html = html.replace(
      /(<link rel="alternate" type="application\/rss\+xml"[^>]+>)/,
      `$1\n    <link rel="alternate" type="text/plain" title="LocalClaw AI-readable summary" href="https://localclaw.io/llms.txt">\n    <link rel="alternate" type="text/plain" title="LocalClaw full model index" href="https://localclaw.io/llms-full.txt">`
    );
  }

  html = html.replace(/\n\s*<!-- HOME_INDEX_GUIDE_START -->[\s\S]*?<!-- HOME_INDEX_GUIDE_END -->\n?/, '\n');

  const fallbackStart = html.indexOf('        <div id="seo-fallback"');
  const viewStart = html.indexOf('        <div id="view-container"', fallbackStart);
  if (fallbackStart === -1 || viewStart === -1) throw new Error('Cannot find homepage fallback or dynamic view container.');
  html = `${html.slice(0, fallbackStart)}${renderFallback()}\n\n${html.slice(viewStart)}`;

  const mainClose = html.indexOf('    </main>');
  if (mainClose === -1) throw new Error('Cannot find homepage main closing tag.');
  html = `${html.slice(0, mainClose)}${renderGuide()}\n\n${html.slice(mainClose)}`;

  html = html.replace(/\n\s*<!-- Hide SEO fallback once JS loads and show dynamic container -->[\s\S]*?<\/script>\n/, '\n');

  if (html.includes('<!-- HOME_INDEX_STRUCTURED_DATA_START -->')) {
    html = replaceBetween(
      html,
      '    <!-- HOME_INDEX_STRUCTURED_DATA_START -->',
      '    <!-- HOME_INDEX_STRUCTURED_DATA_END -->',
      structuredDataMarkup()
    );
  } else {
    const oldStart = html.indexOf('    <!-- ============================================================\n         STRUCTURED DATA: WebApplication');
    const scrollStart = html.indexOf('    <!-- ============================================================\n         SCROLL TO TOP BUTTON', oldStart);
    if (oldStart === -1 || scrollStart === -1) throw new Error('Cannot find legacy homepage structured-data block.');
    html = `${html.slice(0, oldStart)}${structuredDataMarkup()}\n\n${html.slice(scrollStart)}`;
  }

  return html;
}

function compactLlmsText() {
  const leaders = rankedModels.slice(0, 8).map(model => `- [${model.name}](${BASE_URL}/models/${encodeURIComponent(model.id)}) — LocalClaw ${scoreLabel(llmScore(model))}/10; minimum ${model.min_ram} GB RAM; ${model.params}; released ${releaseLabel(model.released)}.`).join('\n');
  const speechLeaders = rankedSpeech.slice(0, 6).map(model => `- [${model.name}](${BASE_URL}/tts/${encodeURIComponent(model.id)}) — Audio ${scoreLabel(speechScore(model))}/10; ${model.type}; ${model.license || 'see model page'}.`).join('\n');
  return `# LocalClaw — The Local Model Index

> A maintained, hardware-aware directory for choosing local LLM, TTS and ASR models. Compare independent community stars, LocalClaw scores, minimum RAM, licences and release dates.

- Verified snapshot: ${updatedIso}
- Local LLM pages: ${localModels.length} unique routes across ${llmFamilyCount} families
- Local speech records: ${speechModels.length} across ${speechFamilyCount} families (${speechTypeCounts.TTS} TTS, ${speechTypeCounts.ASR} ASR, ${speechTypeCounts.APP} app)
- Latest catalogue release month: ${releaseLabel(newestRelease)}
- Scope: hosted-only LLMs, Edge TTS and API-only OCTAVE 2 are excluded from the local-only homepage index

## Ranking Rules

- Community ★ is the raw 1–5 average from signed-in LocalClaw members and is always paired with a vote count.
- Community confidence uses only stars and vote count with a 3.5/5 prior over five votes. EARLY means fewer than five votes.
- LocalClaw /10 is separate: 38% quality + 24% coding + 24% reasoning + 14% speed.
- Audio /10 is separate: 68% quality + 32% speed.
- Community ratings never change or blend into either software score.
- RAM fit compares a model's catalogue minimum with installed RAM; runtime and context overhead can require more memory.

## Core Pages

- [The Local Model Index](${BASE_URL}/) — interactive local-only homepage directory
- [LLM catalogue](${BASE_URL}/llm-list) — complete catalogue surface
- [Speech catalogue](${BASE_URL}/tts-list) — ${speechModels.length} local records plus two clearly labelled online/API references
- [Newest local models](${BASE_URL}/new) — current releases and RSS feed
- [RAM guides](${BASE_URL}/ram/) — recommendations by memory tier
- [Hardware guides](${BASE_URL}/hardware/) — model fit by machine
- [Use-case guides](${BASE_URL}/use-case/) — chat, coding, RAG, reasoning, multilingual work and speed
- [Live community rating aggregates](${BASE_URL}/api/ratings) — current independent star averages and vote counts as JSON
- [Full AI-readable model index](${BASE_URL}/llms-full.txt) — all ${localModels.length + speechModels.length} local homepage entries

## RAM Decision Paths

- [8 GB](${BASE_URL}/ram/8gb)
- [16 GB](${BASE_URL}/ram/16gb)
- [32 GB](${BASE_URL}/ram/32gb)
- [64 GB](${BASE_URL}/ram/64gb)
- [128 GB](${BASE_URL}/ram/128gb)

## Current LocalClaw Score Leaders

${leaders}

## Current Audio Score Leaders

${speechLeaders}

## Data Notes

The counts and score leaders in this file are generated from the same repository records as the homepage. Community aggregates are intentionally not frozen here because votes change live; the homepage and each model page show the current average and count independently from LocalClaw scores.
`;
}

function fullLlmsText() {
  const llmLines = rankedModels.map((model, index) => `- ${String(index + 1).padStart(3, '0')} [${model.name}](${BASE_URL}/models/${encodeURIComponent(model.id)}) — family: ${model.family || 'unknown'}; LocalClaw: ${scoreLabel(llmScore(model))}/10; parameters: ${model.params || 'unknown'}; minimum RAM: ${Number.isFinite(Number(model.min_ram)) ? `${Number(model.min_ram)} GB` : 'see page'}; licence: ${verifiedLicense(model)}; released: ${releaseLabel(model.released)}.`).join('\n');
  const speechLines = rankedSpeech.map((model, index) => `- ${String(index + 1).padStart(2, '0')} [${model.name}](${BASE_URL}/tts/${encodeURIComponent(model.id)}) — family: ${model.family || 'unknown'}; type: ${model.type}; Audio: ${scoreLabel(speechScore(model))}/10; quality: ${scoreLabel(model.quality)}/10; speed: ${scoreLabel(model.speed)}/10; licence: ${model.license || 'see model page'}; released: ${releaseLabel(model.releaseDate)}.`).join('\n');
  return `# LocalClaw Full Local Model Index

> Generated ${updatedIso} from the LocalClaw repository catalogue. This file lists the ${localModels.length} unique local LLM routes and ${speechModels.length} local speech routes used by the homepage. It excludes hosted-only/API-only records.

Community ★ and LocalClaw software scores are independent. Live vote averages and vote counts are shown on the HTML pages and exposed at ${BASE_URL}/api/ratings; they are not copied into this static file because they change independently of catalogue releases.

## Local LLMs (${localModels.length})

${llmLines}

## Local Speech Models (${speechModels.length})

${speechLines}
`;
}

function writeOrCheck(filePath, expected) {
  const normalized = expected.endsWith('\n') ? expected : `${expected}\n`;
  if (CHECK_ONLY) {
    const actual = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    if (actual !== normalized) throw new Error(`${path.relative(ROOT, filePath)} is stale; run npm run home-seo:generate.`);
    return;
  }
  fs.writeFileSync(filePath, normalized);
}

writeOrCheck(INDEX_PATH, generateIndexHtml());
writeOrCheck(LLMS_PATH, compactLlmsText());
writeOrCheck(LLMS_FULL_PATH, fullLlmsText());

console.log(`${CHECK_ONLY ? 'Verified' : 'Generated'} homepage SEO snapshot: ${localModels.length} local LLMs, ${llmFamilyCount} LLM families, ${speechModels.length} speech records, ${speechFamilyCount} speech families, updated ${updatedIso}.`);
