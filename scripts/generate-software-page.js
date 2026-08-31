const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { checkedOn, roles, platforms, uses, software } = require('./software-catalog');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'software.html');
const BASE = 'https://localclaw.io';
const check = process.argv.includes('--check');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function validateCatalog() {
  assert.match(checkedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(software.length, 'The catalogue must not be empty');
  assert.equal(new Set(software.map(item => item.id)).size, software.length, 'Software IDs must be unique');
  for (const item of software) {
    assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const field of ['name', 'type', 'workflow', 'description', 'platformNote', 'docs', 'href', 'icon']) {
      assert.ok(typeof item[field] === 'string' && item[field].trim(), `${item.id}: missing ${field}`);
    }
    for (const [field, allowed] of Object.entries({ roles, platforms, uses })) {
      assert.ok(item[field]?.length, `${item.id}: missing ${field}`);
      assert.equal(new Set(item[field]).size, item[field].length, `${item.id}: duplicate ${field}`);
      assert.ok(item[field].every(value => Object.hasOwn(allowed, value)), `${item.id}: unknown ${field}`);
    }
    assert.ok(item.sources?.length && item.sources.includes(item.docs), `${item.id}: documentation must have a source`);
    assert.ok(item.action?.label && item.action.href, `${item.id}: missing action`);
    for (const href of [item.href, item.docs, item.action.href, ...item.sources]) {
      const url = new URL(href, BASE);
      assert.equal(url.protocol, 'https:', `${item.id}: insecure or invalid URL`);
      if (url.origin === BASE) {
        const route = url.pathname.replace(/\/$/, '') || '/index';
        assert.ok(fs.existsSync(path.join(ROOT, `${route}.html`)), `${item.id}: missing local destination ${route}`);
      }
    }
    assert.ok(item.icon.startsWith('/images/'), `${item.id}: icons must be served locally`);
    assert.ok(fs.existsSync(path.join(ROOT, item.icon)), `${item.id}: missing icon`);
  }
  for (const [field, allowed] of Object.entries({ roles, platforms, uses })) {
    for (const value of Object.keys(allowed)) {
      assert.ok(software.some(item => item[field].includes(value)), `Empty ${field} filter: ${value}`);
    }
  }
}

function link(href, content, className = '', label = '') {
  const url = new URL(href, BASE);
  const external = url.origin !== BASE;
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const accessible = label ? ` aria-label="${escapeHtml(label)}${external ? ' (opens in a new tab)' : ''}"` : '';
  const destination = external ? href : `${url.pathname}${url.search}${url.hash}`;
  return `<a href="${escapeHtml(destination)}"${className ? ` class="${className}"` : ''}${target}${accessible}>${content}</a>`;
}

function row(item) {
  const badge = item.badge ? `<span class="sw-badge">${escapeHtml(item.badge)}</span>` : '';
  const action = link(item.action.href, `${escapeHtml(item.action.label)} <span aria-hidden="true">↗</span>`, 'sw-download', `${item.action.label} ${item.name}`);
  return `        <article id="software-${item.id}" class="sw-directory-row" aria-labelledby="software-${item.id}-title" data-software-row data-type="${item.roles.join(' ')}" data-platforms="${item.platforms.join(' ')}" data-uses="${item.uses.join(' ')}" data-keywords="${escapeHtml(item.keywords || '')}">
          <div class="sw-product-cell"><img class="sw-product-icon${item.iconClass ? ` ${item.iconClass}` : ''}" src="${item.icon}" width="44" height="44" alt="" loading="lazy" decoding="async"><div class="sw-product-copy"><div class="sw-product-name"><h3 id="software-${item.id}-title">${link(item.href, escapeHtml(item.name))}</h3>${badge}</div><p>${escapeHtml(item.description)}</p></div></div>
          <div class="sw-meta-cell"><span class="sw-cell-label">Type / use</span><strong>${escapeHtml(item.type)}</strong><p>${escapeHtml(item.workflow)}</p></div>
          <div class="sw-platform-cell"><span class="sw-cell-label">System / requirements</span><strong>${item.platforms.map(value => platforms[value]).join(' · ')}</strong><p>${escapeHtml(item.platformNote)}</p></div>
          <div class="sw-action-cell">${action}${link(item.docs, 'Docs', 'sw-docs', `${item.name} documentation`)}</div>
        </article>`;
}

function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', name: 'Local AI Software: Apps, Model Servers and Inference Engines',
        url: `${BASE}/software`, description: 'Compare local AI software by operating system, role and use case, with documented hardware requirements and official sources.',
        dateModified: checkedOn, isPartOf: { '@type': 'WebSite', name: 'LocalClaw', url: `${BASE}/` },
        mainEntity: { '@id': `${BASE}/software#list` }
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Software', item: `${BASE}/software` }
        ]
      },
      {
        '@type': 'ItemList', '@id': `${BASE}/software#list`, name: 'Local AI software directory',
        numberOfItems: software.length,
        itemListElement: software.map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item.name, url: new URL(item.href, BASE).href
        }))
      }
    ]
  };
}

function replaceBlock(html, name, content) {
  const start = `<!-- SOFTWARE_${name}_START -->`;
  const end = `<!-- SOFTWARE_${name}_END -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  assert.ok(pattern.test(html), `Missing generated block: ${name}`);
  return html.replace(pattern, () => `${start}\n${content}\n      ${end}`);
}

validateCatalog();
const before = fs.readFileSync(PAGE, 'utf8');
let after = before;
after = replaceBlock(after, 'SCHEMA', `  <script type="application/ld+json">\n${JSON.stringify(structuredData(), null, 2).replace(/</g, '\\u003c')}\n  </script>`);
after = replaceBlock(after, 'ROWS', software.map(row).join('\n'));
after = replaceBlock(after, 'ROLES', [['all', 'All software'], ...Object.entries(roles)].map(([value, label]) =>
  `        <button class="sw-filter" type="button" data-software-filter="${value}" aria-pressed="${value === 'all'}" aria-controls="software-results" disabled>${label}</button>`
).join('\n'));
for (const [name, values, placeholder] of [['PLATFORMS', platforms, 'All systems'], ['USES', uses, 'All uses']]) {
  after = replaceBlock(after, name, [['all', placeholder], ...Object.entries(values)].map(([value, label]) => `              <option value="${value}">${label}</option>`).join('\n'));
}
after = replaceBlock(after, 'COUNT', `        <p class="sw-result-count" role="status" aria-live="polite" aria-atomic="true" data-software-count>Showing ${software.length} of ${software.length} tools</p>`);
const checkedLabel = new Date(`${checkedOn}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
after = replaceBlock(after, 'CHECKED', `        <span>Sources checked <time datetime="${checkedOn}">${checkedLabel}</time></span>`);

if (check) {
  assert.equal(after, before, 'Software HTML is out of sync. Run npm run software:generate.');
  console.log(`Software validation passed: ${software.length} sourced records, static rows, schema, icons and filter metadata agree.`);
} else {
  fs.writeFileSync(PAGE, after);
  console.log(`Generated Software directory: ${software.length} records.`);
}
