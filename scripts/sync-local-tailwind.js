const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const SITE_STYLESHEET = '<link rel="stylesheet" href="/css/site-tailwind-20260823a.css?v=20260823a">';
const SOFTWARE_STYLESHEET = '<link rel="stylesheet" href="/css/software-tailwind-20260823a.css?v=20260823a">';
const EXCLUDED = new Set([
  'pricing.html',
  'success.html',
  'sponsor-terms.html'
]);
const SKIP_DIRECTORIES = new Set([
  '.git',
  '.pages-dist',
  'node_modules',
  'functions',
  'images',
  'css',
  'js',
  'scripts'
]);

function collectHtmlFiles(directory, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const relativePath = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRECTORIES.has(entry.name)) files.push(...collectHtmlFiles(path.join(directory, entry.name), relativePath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(relativePath);
  }
  return files;
}

function migrate(html, relativePath) {
  const stylesheet = relativePath === 'software.html' ? SOFTWARE_STYLESHEET : SITE_STYLESHEET;
  if (!html.includes('cdn.tailwindcss.com')) {
    let output = html.replace(/\s*<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>/gi, '');
    if (relativePath === 'software.html') {
      output = output.replace(SITE_STYLESHEET, SOFTWARE_STYLESHEET);
    }
    return output;
  }
  let output = html
    .replace(/\s*<link\s+rel="preconnect"\s+href="https:\/\/cdn\.tailwindcss\.com"\s*\/?>/gi, '')
    .replace(/\s*<script\s+src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<script>[\s\S]*?tailwind\.config\s*=[\s\S]*?<\/script>/gi, '')
    .replace(/\s*<script\s+src="https:\/\/cdn\.tailwindcss\.com"><\/script>/gi, '');

  if (!output.includes('/css/site-tailwind-20260823a.css') && !output.includes('/css/software-tailwind-20260823a.css')) {
    if (/<style(?:\s|>)/i.test(output)) output = output.replace(/(\s*<style(?:\s|>))/i, `\n    ${stylesheet}$1`);
    else output = output.replace(/\s*<\/head>/i, `\n    ${stylesheet}\n</head>`);
  }
  return output;
}

const errors = [];
let changed = 0;
for (const relativePath of collectHtmlFiles(ROOT)) {
  if (EXCLUDED.has(relativePath) || relativePath.startsWith('sponsor')) continue;
  const absolutePath = path.join(ROOT, relativePath);
  const input = fs.readFileSync(absolutePath, 'utf8');
  const output = migrate(input, relativePath);
  if (output === input) continue;
  if (CHECK) errors.push(`${relativePath} still uses the Tailwind browser runtime`);
  else {
    fs.writeFileSync(absolutePath, output);
    changed += 1;
  }
}

if (!fs.existsSync(path.join(ROOT, 'css/site-tailwind-20260823a.css'))) {
  errors.push('Missing compiled css/site-tailwind-20260823a.css');
}
if (!fs.existsSync(path.join(ROOT, 'css/software-tailwind-20260823a.css'))) {
  errors.push('Missing compiled css/software-tailwind-20260823a.css');
}

if (errors.length) {
  console.error(`Local Tailwind validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(CHECK
  ? 'Local Tailwind validation passed for non-sponsor public HTML.'
  : `Replaced the Tailwind browser runtime in ${changed} non-sponsor HTML file(s).`);
