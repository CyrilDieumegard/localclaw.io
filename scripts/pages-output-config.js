const fs = require('fs');
const path = require('path');

const OUTPUT_DIRECTORY = '.pages-dist';

const PUBLIC_ROOT_FILES = Object.freeze([
  '_headers',
  '_redirects',
  '_routes.json',
  '404.html',
  'account.html',
  'computers.html',
  'download.html',
  'favicon.ico',
  'google7a49ecaded8c2575.html',
  'index.html',
  'llm-detail.html',
  'llm-list.html',
  'llms-full.txt',
  'llms.txt',
  'new-models.xml',
  'new.html',
  'pricing.html',
  'privacy.html',
  'ram-gpu-for-local-ai.html',
  'robots.txt',
  'sitemap-blog.xml',
  'sitemap-core.xml',
  'sitemap-guides.xml',
  'sitemap-models.xml',
  'sitemap-tts.xml',
  'sitemap.xml',
  'software.html',
  'success.html',
  'tts-list.html'
]);

const PUBLIC_DIRECTORIES = Object.freeze([
  'blog',
  'case-study',
  'changelog',
  'css',
  'downloads',
  'guides',
  'hardware',
  'images',
  'js',
  'models',
  'ram',
  'tts',
  'use-case'
]);

const PUBLIC_EXTENSIONS = new Set([
  '.css', '.dmg', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json', '.png', '.svg', '.txt', '.webp', '.xml'
]);

const PRIVATE_PROBES = Object.freeze([
  '.assetsignore',
  '.gitignore',
  'README.md',
  'all-amazon-links.md',
  'amazon-links-updated.md',
  'design-qa.md',
  'SPONSOR_ACCOUNT_ARCHITECTURE.md',
  'package-lock.json',
  'package.json',
  'test-amazon-links.html',
  'wrangler.toml',
  'functions/_middleware.js',
  'migrations/0004_model_ratings.sql',
  'migrations/0005_sponsor_workspace.sql',
  'scripts/check-seo.js',
  'scripts/check-sponsor-workspace.js',
  'functions/_lib/sponsor-campaigns.js',
  'functions/api/sponsor/campaigns/index.js',
  '_check/hf-search-gemma4.json',
  'images/model-logos/ATTRIBUTION.md',
  'images/ram-gpu/ATTRIBUTION.md'
]);

function collectDirectoryFiles(root, relativeDirectory, output) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) throw new Error(`Missing public directory: ${relativeDirectory}`);

  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(root, relativePath);
    if (entry.isSymbolicLink()) throw new Error(`Public allowlist does not accept symlinks: ${relativePath}`);
    if (entry.isDirectory()) {
      collectDirectoryFiles(root, relativePath, output);
      continue;
    }
    if (entry.isFile() && PUBLIC_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) output.push(relativePath);
  }
}

function collectPublicAssets(root) {
  const output = [...PUBLIC_ROOT_FILES];
  for (const relativeDirectory of PUBLIC_DIRECTORIES) collectDirectoryFiles(root, relativeDirectory, output);
  const unique = new Set(output);
  if (unique.size !== output.length) throw new Error('Duplicate path in the Pages public allowlist');
  return [...unique].sort();
}

module.exports = {
  OUTPUT_DIRECTORY,
  PRIVATE_PROBES,
  PUBLIC_DIRECTORIES,
  PUBLIC_EXTENSIONS,
  PUBLIC_ROOT_FILES,
  collectPublicAssets
};
