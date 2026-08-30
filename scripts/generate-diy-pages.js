const fs = require('fs');
const path = require('path');
const { siteNavigation, siteNavAssets } = require('./site-navigation');
const { DIY_VERIFIED_DATE, projects } = require('./diy-projects');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'diy');
const BASE = 'https://localclaw.io';
const ASSET_VERSION = '20260830a';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function json(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function route(project) {
  return `/diy/${project.slug}`;
}

function tracking() {
  return `<script id="datafast-queue">window.datafast=window.datafast||function(){(window.datafast.q=window.datafast.q||[]).push(arguments);};</script>
  <script defer data-website-id="dfid_ohBb9fpcjhfySeJJ6CAei" data-domain="localclaw.io" src="https://datafa.st/js/script.js"></script>
  <script src="/js/clarity.js" defer></script>`;
}

function commonHead({ title, description, canonical, image, type = 'website', schema }) {
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="LocalClaw">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="LocalClaw AI-readable index">
  <meta property="og:type" content="${esc(type)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:site_name" content="LocalClaw">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${BASE}${esc(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="800">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${BASE}${esc(image)}">
  <meta name="theme-color" content="#faf9f6">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon.png?v=20260211g">
  <link rel="apple-touch-icon" href="/images/favicon.png?v=20260211g">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css?v=20260822a">
  <link rel="stylesheet" href="/css/diy-${ASSET_VERSION}.css">
  ${siteNavAssets()}
  ${tracking()}
  <script type="application/ld+json">${json(schema)}</script>`;
}

function footer() {
  return `<footer class="diy-footer"><div class="diy-shell diy-footer__inner"><span>© 2026 LocalClaw · Independent local AI index</span><div><a href="/diy/">DIY Builds</a><a href="/privacy">Privacy</a><a href="/pricing">Pricing</a><a href="/account">My Machines</a></div></div></footer>`;
}

function statusBadges(project) {
  return project.status.map(status => `<span class="diy-status"><span aria-hidden="true">✓</span>${esc(status)}</span>`).join('');
}

function topicBadges(project) {
  return [project.difficulty, project.budget, ...project.topics.slice(0, 1)]
    .map((topic, index) => `<span class="diy-chip diy-chip--${index + 1}">${esc(topic)}</span>`)
    .join('');
}

function projectCard(project) {
  return `<article class="diy-card" data-diy-project="${esc(project.slug)}">
    <a class="diy-card__media" href="${route(project)}" aria-label="Open ${esc(project.title)} build guide" data-fast-goal="diy_card_open" data-fast-goal-project="${esc(project.slug)}">
      <img src="${esc(project.image)}" width="1200" height="800" alt="${esc(project.imageAlt)}" loading="eager" decoding="async">
      <span class="diy-card__status">${statusBadges(project)}</span>
    </a>
    <div class="diy-card__body">
      <h2><a href="${route(project)}" data-fast-goal="diy_card_open" data-fast-goal-project="${esc(project.slug)}">${esc(project.cardTitle)}</a></h2>
      <p class="diy-card__creator">By <a href="${esc(project.creator.url)}" target="_blank" rel="noopener">${esc(project.creator.displayName)}</a> · ESP32 implementation by <a href="${esc(project.creator.implementationUrl)}" target="_blank" rel="noopener">${esc(project.creator.implementationName)}</a></p>
      <div class="diy-chips">${topicBadges(project)}</div>
      <p>${esc(project.summary)}</p>
      <a class="diy-card__cta" href="${route(project)}" data-fast-goal="diy_card_open" data-fast-goal-project="${esc(project.slug)}">View build guide <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

function indexSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${BASE}/diy/#page`,
        name: 'Community DIY Builds',
        url: `${BASE}/diy/`,
        description: 'Creator-credited local AI hardware projects with original videos, source-reviewed requirements, step-by-step instructions and purchasing guidance.',
        dateModified: DIY_VERIFIED_DATE,
        isPartOf: { '@type': 'WebSite', name: 'LocalClaw', url: `${BASE}/` },
        mainEntity: { '@id': `${BASE}/diy/#projects` }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Community DIY Builds', item: `${BASE}/diy/` }
        ]
      },
      {
        '@type': 'ItemList',
        '@id': `${BASE}/diy/#projects`,
        name: 'Community local AI DIY projects',
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: project.title,
          url: `${BASE}${route(project)}`
        }))
      }
    ]
  };
}

function renderIndex() {
  const title = 'DIY Local AI Projects & Hardware Builds | LocalClaw';
  const description = 'Build practical local AI projects with creator videos, source-reviewed hardware, Amazon parts, step-by-step instructions and troubleshooting.';
  const firstProject = projects[0];
  return `<!DOCTYPE html>
<html lang="en" class="light">
<head>
  ${commonHead({ title, description, canonical: `${BASE}/diy/`, image: firstProject.image, schema: indexSchema() })}
</head>
<body class="diy-body">
  <div class="diy-grid-bg" aria-hidden="true"></div>
  ${siteNavigation('diy')}
  <main class="diy-main">
    <header class="diy-shell diy-index-hero">
      <p class="diy-eyebrow">DIY Directory 01</p>
      <h1>Community DIY Builds</h1>
      <p class="diy-index-hero__lede">Build local AI projects from the best creators on the web.</p>
      <p class="diy-index-hero__proof">Creator credited. Requirements checked. Step-by-step.</p>
    </header>

    <section class="diy-shell diy-library" aria-labelledby="diy-projects-title">
      <div class="diy-section-head">
        <div><p class="diy-section-no">Directory 01</p><h2 id="diy-projects-title">Build something real</h2></div>
        <p>Every project links back to its creator and original sources. LocalClaw adds a structured build path, exact requirements, regional purchasing links and troubleshooting.</p>
      </div>
      <div class="diy-card-grid">${projects.map(projectCard).join('\n')}</div>
      <div class="diy-library-note"><strong>More creator builds will appear here.</strong><span>The directory is data-driven, but LocalClaw will not publish placeholder projects or unreviewed hardware claims.</span></div>
    </section>

    <section class="diy-shell diy-how" aria-labelledby="diy-how-title">
      <p class="diy-section-no">How it works</p>
      <h2 id="diy-how-title" class="sr-only">How Community DIY Builds work</h2>
      <div class="diy-how__grid">
        <article><span>01</span><div><h3>Watch the creator</h3><p>See the original build in action and keep the creator's context attached.</p></div></article>
        <article><span>02</span><div><h3>Buy verified parts</h3><p>Use a source-reviewed parts list with regional Amazon search links.</p></div></article>
        <article><span>03</span><div><h3>Follow the guide</h3><p>Work through original LocalClaw instructions, checks and troubleshooting.</p></div></article>
      </div>
    </section>

    <section class="diy-shell diy-method" aria-labelledby="diy-method-title">
      <article><p class="diy-section-no">Editorial standard</p><h2 id="diy-method-title">Credit is part of the build</h2><p>LocalClaw embeds the original video, links the creator and source repository, and names the model author. The written guide is independently structured and never represents an affiliate link as the creator's endorsement.</p></article>
      <aside><h2>Verification labels</h2><dl><div><dt>Creator demonstrated</dt><dd>Shown working by the original project creator.</dd></div><div><dt>Source-reviewed</dt><dd>Requirements and commands checked against primary sources.</dd></div><div><dt>LocalClaw tested</dt><dd>Reserved for a future hands-on reproduction by LocalClaw.</dd></div></dl></aside>
    </section>

    <p class="diy-shell diy-affiliate">Amazon links may be affiliate links. As an Amazon Associate, LocalClaw earns from qualifying purchases. Prices and availability can change.</p>
  </main>
  ${footer()}
  <script src="/js/diy-${ASSET_VERSION}.js" defer></script>
</body>
</html>`;
}

function detailSchema(project) {
  const projectUrl = `${BASE}${route(project)}`;
  const howToId = `${projectUrl}#howto`;
  const articleId = `${projectUrl}#article`;
  const videoId = `${projectUrl}#video`;
  const howTo = {
    '@type': 'HowTo',
    '@id': howToId,
    name: project.title,
    description: project.summary,
    image: `${BASE}${project.image}`,
    totalTime: 'PT2H',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '10-25' },
    supply: project.parts.map(part => ({ '@type': 'HowToSupply', name: part.name })),
    tool: ['ESP-IDF 5.5+', 'Python 3', 'CMake', 'Git'].map(name => ({ '@type': 'HowToTool', name })),
    step: project.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.summary,
      url: `${projectUrl}#step-${index + 1}`
    }))
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': articleId,
        headline: project.title,
        description: project.summary,
        url: projectUrl,
        mainEntityOfPage: projectUrl,
        image: [`${BASE}${project.image}`],
        datePublished: DIY_VERIFIED_DATE,
        dateModified: DIY_VERIFIED_DATE,
        author: { '@type': 'Organization', name: 'LocalClaw', url: `${BASE}/` },
        publisher: { '@type': 'Organization', name: 'LocalClaw', url: `${BASE}/`, logo: { '@type': 'ImageObject', url: `${BASE}/images/crab-logo.png` } },
        about: [project.model.name, 'ESP32-S3', 'offline AI', 'tool calling', 'edge AI'],
        proficiencyLevel: project.difficulty,
        isBasedOn: [project.video.url, project.repository.url, project.model.url],
        citation: project.sources.map(source => source.url),
        mainEntity: { '@id': howToId },
        video: { '@id': videoId }
      },
      howTo,
      {
        '@type': 'VideoObject',
        '@id': videoId,
        name: project.video.title,
        description: `Original ${project.creator.displayName} demonstration of ${project.model.name} running offline on an ESP32-S3.`,
        thumbnailUrl: [project.video.thumbnailUrl],
        uploadDate: project.video.uploadDate,
        duration: project.video.duration,
        embedUrl: `https://www.youtube.com/embed/${project.video.id}`,
        contentUrl: project.video.url,
        publisher: { '@type': 'Organization', name: project.creator.displayName, url: project.creator.url }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Community DIY Builds', item: `${BASE}/diy/` },
          { '@type': 'ListItem', position: 3, name: project.cardTitle, item: projectUrl }
        ]
      },
      {
        '@type': 'FAQPage',
        mainEntity: project.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer }
        }))
      }
    ]
  };
}

function sourceLinks(items) {
  return items.map(item => `<li><a href="${esc(item.url)}" target="_blank" rel="noopener" data-fast-goal="diy_source_open" data-fast-goal-source="${esc(item.type.toLowerCase().replace(/\s+/g, '_'))}"><span>${esc(item.label)}</span><small>${esc(item.type)}</small></a></li>`).join('');
}

function codeBlocks(step, stepIndex) {
  if (!step.commands?.length) return '';
  const value = step.commands.join('\n');
  const id = `step-${stepIndex + 1}-commands`;
  return `<div class="diy-code"><div class="diy-code__bar"><span>Terminal</span><button type="button" data-copy-target="${id}" data-copy-label="Step ${stepIndex + 1}">Copy</button></div><pre id="${id}"><code>${esc(value)}</code></pre></div>`;
}

function stepMarkup(step, index) {
  const checks = step.checks?.length ? `<ul class="diy-checks">${step.checks.map(check => `<li>${esc(check)}</li>`).join('')}</ul>` : '';
  const links = step.links?.length ? `<p class="diy-step__links">${step.links.map(link => `<a href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.label)} →</a>`).join('')}</p>` : '';
  const prompts = step.prompts?.length ? `<div class="diy-prompts"><strong>Test prompts</strong>${step.prompts.map(prompt => `<code>${esc(prompt)}</code>`).join('')}</div>` : '';
  const note = step.note ? `<p class="diy-note"><strong>Note:</strong> ${esc(step.note)}</p>` : '';
  return `<article class="diy-step" id="step-${index + 1}">
    <div class="diy-step__number">${String(index + 1).padStart(2, '0')}</div>
    <div class="diy-step__content"><h3>${esc(step.title)}</h3><p>${esc(step.summary)}</p>${checks}${links}${codeBlocks(step, index)}${prompts}${note}</div>
  </article>`;
}

function renderDetail(project) {
  const title = 'Run Needle 2 on ESP32-S3: Step-by-Step DIY Guide | LocalClaw';
  const description = 'Build a fully offline 14 MB tool-calling AI on an ESP32-S3 N16R8. Exact hardware, original video, commands, testing and troubleshooting.';
  const canonical = `${BASE}${route(project)}`;
  const parts = project.parts.map((part, index) => {
    const href = `/go/amazon?q=${encodeURIComponent(part.amazonQuery)}`.replace(/&/g, '&amp;');
    return `<article class="diy-part"><div class="diy-part__index">${String(index + 1).padStart(2, '0')}</div><div><span class="diy-part__required">${esc(part.requirement)}</span><h3>${esc(part.name)}</h3><p>${esc(part.description)}</p></div><a class="diy-button diy-button--amazon" href="${href}" target="_blank" rel="sponsored nofollow noopener" data-fast-goal="amazon_click" data-fast-goal-source="diy_parts" data-fast-goal-project="${esc(project.slug)}" data-fast-goal-product="${esc(part.name)}">Find on Amazon <span aria-hidden="true">↗</span></a></article>`;
  }).join('');
  const requirements = project.requirements.map(item => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('');
  const performance = project.performance.map(item => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('');
  const troubleshooting = project.troubleshooting.map(item => `<details><summary>${esc(item.problem)}</summary><p>${esc(item.fix)}</p></details>`).join('');
  const faq = project.faq.map(item => `<details><summary>${esc(item.question)}</summary><p>${esc(item.answer)}</p></details>`).join('');

  return `<!DOCTYPE html>
<html lang="en" class="light">
<head>
  ${commonHead({ title, description, canonical, image: project.image, type: 'article', schema: detailSchema(project) })}
  <meta property="article:published_time" content="${DIY_VERIFIED_DATE}">
  <meta property="article:modified_time" content="${DIY_VERIFIED_DATE}">
</head>
<body class="diy-body">
  <div class="diy-grid-bg" aria-hidden="true"></div>
  ${siteNavigation('diy')}
  <main class="diy-main diy-detail">
    <div class="diy-shell diy-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/diy/">DIY Builds</a><span>/</span><span>${esc(project.cardTitle)}</span></div>

    <header class="diy-shell diy-detail-hero">
      <div class="diy-detail-hero__copy">
        <div class="diy-status-row">${statusBadges(project)}</div>
        <h1>${esc(project.title)}</h1>
        <p class="diy-detail-hero__lede">${esc(project.outcome)}</p>
        <div class="diy-chips">${topicBadges(project)}</div>
        <div class="diy-creator-credit"><strong>Original demonstration by <a href="${esc(project.creator.url)}" target="_blank" rel="noopener">${esc(project.creator.displayName)}</a></strong><span>ESP32 implementation and documentation by <a href="${esc(project.repository.url)}" target="_blank" rel="noopener">${esc(project.creator.implementationName)}</a>. Needle 2 by <a href="${esc(project.model.url)}" target="_blank" rel="noopener">${esc(project.model.author)}</a>.</span></div>
        <div class="diy-actions"><a class="diy-button diy-button--primary" href="#original-video">Watch original video</a><a class="diy-button" href="#parts">See exact parts</a><a class="diy-button diy-button--quiet" href="${esc(project.repository.url)}" target="_blank" rel="noopener" data-fast-goal="diy_source_open" data-fast-goal-source="github">Open source code ↗</a></div>
      </div>
      <figure class="diy-detail-hero__media"><img src="${esc(project.image)}" width="1200" height="800" alt="${esc(project.imageAlt)}" decoding="async"><figcaption>Original LocalClaw editorial artwork · not a creator thumbnail</figcaption></figure>
    </header>

    <section class="diy-shell diy-facts" aria-label="Build overview">
      <div><span>Model</span><strong>${esc(project.model.parameters)} parameters</strong><small>${esc(project.model.binarySize)}</small></div>
      <div><span>Hardware</span><strong>ESP32-S3 N16R8</strong><small>16 MB flash · 8 MB octal PSRAM</small></div>
      <div><span>Purpose</span><strong>Offline tool calling</strong><small>Device actions, not general chat</small></div>
      <div><span>Source status</span><strong>Reviewed ${esc(DIY_VERIFIED_DATE)}</strong><small>Creator demonstrated · not yet LocalClaw tested</small></div>
    </section>

    <section class="diy-shell diy-video-section" id="original-video" aria-labelledby="video-title">
      <div class="diy-section-head"><div><p class="diy-section-no">Original demonstration</p><h2 id="video-title">Watch Better Stack build it</h2></div><p>The original video remains attached to the project. Playback uses YouTube's privacy-enhanced player and starts only after you choose to play it.</p></div>
      <div class="diy-video" data-diy-video data-video-id="${esc(project.video.id)}" data-video-title="${esc(project.video.title)}">
        <img src="${esc(project.image)}" width="1200" height="800" alt="" loading="lazy" decoding="async">
        <div class="diy-video__shade"></div>
        <button type="button" class="diy-video__play" aria-label="Play the original Better Stack video"><span aria-hidden="true">▶</span><strong>Play original video</strong><small>${esc(project.creator.displayName)} · 9:53</small></button>
      </div>
      <p class="diy-video-credit">Video: <a href="${esc(project.video.url)}" target="_blank" rel="noopener">${esc(project.video.title)}</a> by <a href="${esc(project.creator.url)}" target="_blank" rel="noopener">${esc(project.creator.displayName)}</a>. LocalClaw does not rehost or modify the video.</p>
      <noscript><p><a href="${esc(project.video.url)}">Watch the original video on YouTube</a>.</p></noscript>
    </section>

    <section class="diy-shell diy-compat" aria-labelledby="compat-title">
      <div class="diy-compat__warning"><span aria-hidden="true">!</span><div><p class="diy-section-no">Compatibility gate</p><h2 id="compat-title">N16R8 is not optional</h2><p>A generic ESP32-S3 listing is not enough. The reference implementation requires <strong>16 MB flash</strong> and <strong>8 MB octal PSRAM</strong>. A 2 MB or quad-PSRAM board will not run this documented build.</p></div></div>
      <dl class="diy-specs">${requirements}</dl>
      <p class="diy-truth"><strong>Verification boundary:</strong> LocalClaw checked these requirements and commands against the creator's repository at commit <code>${esc(project.repository.reviewedCommit.slice(0, 12))}</code> and Cactus Compute's model page. LocalClaw has source-reviewed this guide but has not physically reproduced this build.</p>
    </section>

    <section class="diy-shell diy-section" id="parts" aria-labelledby="parts-title">
      <div class="diy-section-head"><div><p class="diy-section-no">Parts list</p><h2 id="parts-title">Buy the compatible hardware</h2></div><p>These buttons open regional Amazon searches through LocalClaw. Confirm the exact specifications on the seller page before ordering.</p></div>
      <div class="diy-parts">${parts}</div>
      <p class="diy-affiliate diy-affiliate--inline">Affiliate disclosure: As an Amazon Associate, LocalClaw earns from qualifying purchases. The original creators do not endorse these purchasing links, and prices or availability may change.</p>
    </section>

    <section class="diy-shell diy-section" id="guide" aria-labelledby="guide-title">
      <div class="diy-section-head"><div><p class="diy-section-no">Step-by-step</p><h2 id="guide-title">Build Needle 2 on ESP32-S3</h2></div><p>Commands are preserved where technical accuracy requires it; the explanations, order and checks are independently organized by LocalClaw from the cited primary sources.</p></div>
      <div class="diy-steps">${project.steps.map(stepMarkup).join('\n')}</div>
    </section>

    <section class="diy-shell diy-two-col" aria-labelledby="performance-title">
      <article><p class="diy-section-no">Expected performance</p><h2 id="performance-title">Slow, local and purposeful</h2><p>${esc(project.model.purpose)}. The documented ESP32-S3 port is compute-bound, so treat it as an offline device-action demo rather than a conversational assistant.</p><dl class="diy-performance">${performance}</dl></article>
      <aside><p class="diy-section-no">Go beyond the LED</p><h2>Replace the tool, not the model</h2><p>The repository lets you describe another tool in JSON, write a hardware handler and register it in the firmware. That is the path to servos, relays and sensor actions.</p><a href="${esc(project.repository.url)}#using-your-own-tools" target="_blank" rel="noopener">Read the creator's customization notes →</a></aside>
    </section>

    <section class="diy-shell diy-section" aria-labelledby="troubleshooting-title">
      <div class="diy-section-head"><div><p class="diy-section-no">Troubleshooting</p><h2 id="troubleshooting-title">The failures that look mysterious</h2></div><p>The reference repository documents several silent configuration failures. Check these before changing the inference engine.</p></div>
      <div class="diy-accordion">${troubleshooting}</div>
    </section>

    <section class="diy-shell diy-sources" aria-labelledby="sources-title">
      <div><p class="diy-section-no">Sources and credit</p><h2 id="sources-title">Follow the work back to its creators</h2><p>${esc(project.creator.note)} LocalClaw's page is an independent guide and does not imply endorsement by Better Stack, Andris Gauracs or Cactus Compute.</p></div>
      <ul>${sourceLinks(project.sources)}</ul>
      <p class="diy-license"><strong>License note:</strong> the ESP32 implementation and Needle 2 materials cited here identify Apache 2.0 licensing. LocalClaw links to the original repositories and does not redistribute their source code or model binary on this page.</p>
    </section>

    <section class="diy-shell diy-section" aria-labelledby="faq-title"><div class="diy-section-head"><div><p class="diy-section-no">Questions</p><h2 id="faq-title">Needle 2 ESP32-S3 FAQ</h2></div></div><div class="diy-accordion">${faq}</div></section>

    <div class="diy-shell diy-back"><a href="/diy/">← Browse Community DIY Builds</a></div>
  </main>
  ${footer()}
  <script src="/js/diy-${ASSET_VERSION}.js" defer></script>
</body>
</html>`;
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), renderIndex());
for (const project of projects) fs.writeFileSync(path.join(OUT, `${project.slug}.html`), renderDetail(project));

console.log(`Generated DIY index and ${projects.length} creator-credited project page(s).`);
