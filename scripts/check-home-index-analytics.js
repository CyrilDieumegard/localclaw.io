const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(ROOT, 'js/home-index-20260814g.js'), 'utf8');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const errors = [];

const requireText = (source, expected, message) => {
  if (!source.includes(expected)) errors.push(message);
};

requireText(homepage, "trackHomeGoal('home_index_search'", 'Homepage search interactions are not tracked');
requireText(homepage, "trackHomeGoal('home_index_filter'", 'Homepage filter interactions are not tracked');
requireText(homepage, "trackHomeGoal('home_index_sort'", 'Homepage sort interactions are not tracked');
requireText(homepage, "trackHomeGoal('home_index_compare_add'", 'Homepage comparison selections are not tracked');
requireText(homepage, "trackHomeGoal('home_index_compare_open'", 'Homepage comparison opens are not tracked');
requireText(homepage, "target: 'llm'", 'Homepage LLM interactions must identify their catalogue');
requireText(homepage, "target: 'speech'", 'Homepage speech interactions must identify their catalogue');
requireText(homepage, '}, 400);', 'Homepage searches must be debounced to avoid one goal per keystroke');
requireText(homepage, 'data-sponsor-empty-slot', 'Empty sponsor inventory needs a dedicated DOM marker');
requireText(homepage, "trackHomeGoal('sponsor_empty_slot_click'", 'Empty sponsor slot clicks need a dedicated goal');
requireText(homepage, "placement: offer.dataset.sponsorPlacement || 'unknown'", 'Empty sponsor slot goals must retain the exact placement key');
requireText(homepage, "slot.removeAttribute('data-sponsor-empty-slot')", 'Hydrated sponsor campaigns must remove the empty-slot marker');
requireText(index, 'js/home-index-20260814g.js?v=20260816b', 'Homepage analytics JavaScript cache key was not updated');
requireText(homepage, 'source_control:', 'Homepage sort goals must distinguish the select from column-header clicks');
for (const sortKey of ['name', 'score', 'community', 'params', 'ram', 'license', 'fresh']) {
  requireText(homepage, `data-sort-key="${sortKey}"`, `Homepage table is missing the ${sortKey} sortable header`);
}
requireText(homepage, "header.setAttribute('aria-sort'", 'Homepage sortable headers must expose their current direction');
requireText(homepage, "activeSortDirection === 'asc' ? 'desc' : 'asc'", 'Homepage sortable headers must reverse direction on a second click');

if ((homepage.match(/trackHomeGoal\('home_index_search'/g) || []).length !== 2) {
  errors.push('Homepage must track one debounced search path for LLM and one for speech');
}
if ((homepage.match(/data-sponsor-empty-slot/g) || []).length !== 3) {
  errors.push('The sponsor rail template, click handler and hydration path must share the empty-slot marker');
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Homepage analytics checks passed.');
