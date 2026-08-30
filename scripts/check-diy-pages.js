const fs = require('fs');
const path = require('path');
const { projects } = require('./diy-projects');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const indexPath = path.join(ROOT, 'diy', 'index.html');

if (!fs.existsSync(indexPath)) errors.push('Missing DIY index page');
const index = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';

for (const marker of [
  '<h1>Community DIY Builds</h1>',
  'data-nav-key="diy" aria-current="page"',
  'Creator credited. Requirements checked. Step-by-step.',
  'As an Amazon Associate, LocalClaw earns from qualifying purchases.'
]) {
  if (!index.includes(marker)) errors.push(`DIY index missing marker: ${marker}`);
}

for (const project of projects) {
  const detailPath = path.join(ROOT, 'diy', `${project.slug}.html`);
  if (!fs.existsSync(detailPath)) {
    errors.push(`Missing DIY project page: ${project.slug}`);
    continue;
  }
  const detail = fs.readFileSync(detailPath, 'utf8');
  for (const marker of [
    `<link rel="canonical" href="https://localclaw.io/diy/${project.slug}">`,
    project.video.id,
    project.repository.url,
    'LocalClaw has source-reviewed this guide but has not physically reproduced this build.',
    'data-fast-goal="amazon_click"',
    'application/ld+json',
    '"@type":"HowTo"',
    '"@type":"VideoObject"',
    'N16R8'
  ]) {
    if (!detail.includes(marker)) errors.push(`${project.slug} missing marker: ${marker}`);
  }
  const amazonLinks = [...detail.matchAll(/href="\/go\/amazon\?q=[^"]+"/g)];
  if (amazonLinks.length !== project.parts.length) {
    errors.push(`${project.slug} expected ${project.parts.length} Amazon links, found ${amazonLinks.length}`);
  }
  if (/href="https:\/\/(?:www\.)?amazon\./i.test(detail)) errors.push(`${project.slug} contains a direct Amazon URL`);
}

const generatedCards = [...index.matchAll(/data-diy-project="([^"]+)"/g)].map(match => match[1]);
if (generatedCards.length !== projects.length) errors.push(`DIY index expected ${projects.length} project cards, found ${generatedCards.length}`);

if (errors.length) {
  console.error(`DIY validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`DIY validation passed: ${projects.length} creator-credited project page(s), complete sources, schema, regional Amazon links and truthful verification status.`);
