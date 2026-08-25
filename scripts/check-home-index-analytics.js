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
requireText(homepage, "target: 'multimodal'", 'Homepage multimodal interactions must identify their catalogue');
requireText(homepage, '}, 400);', 'Homepage searches must be debounced to avoid one goal per keystroke');
requireText(homepage, 'data-sponsor-empty-slot', 'Empty sponsor inventory needs a dedicated DOM marker');
requireText(homepage, "trackHomeGoal('sponsor_empty_slot_click'", 'Empty sponsor slot clicks need a dedicated goal');
requireText(homepage, "placement: offer.dataset.sponsorPlacement || 'unknown'", 'Empty sponsor slot goals must retain the exact placement key');
requireText(homepage, "slot.removeAttribute('data-sponsor-empty-slot')", 'Hydrated sponsor campaigns must remove the empty-slot marker');
requireText(index, 'js/home-index-20260814g.js?v=20260825b', 'Homepage analytics JavaScript cache key was not updated');
requireText(homepage, "trackHomeGoal('funnel_account_open'", 'Homepage account funnel entry tracking is missing');
requireText(homepage, 'localclaw_funnel_landing_page', 'Homepage funnel landing-page context is missing');
requireText(homepage, 'source_control:', 'Homepage sort goals must distinguish the select from column-header clicks');
requireText(homepage, "fitFilter.value = 'fits'", 'Signed-in machines must default the homepage to green fits only');
requireText(homepage, 'Green fits only', 'Homepage machine filtering must clearly label the strict green-fit view');
requireText(homepage, '!sharedRanking.isLocallyEligible(model)', 'Homepage green-fit filtering must use the shared LLM eligibility rules');
requireText(homepage, 'Green LLM fits only', 'Homepage saved-machine status must match the strict green-fit filter wording');
if (/Comfortable \+ tight|Tight only/.test(homepage)) {
  errors.push('Homepage machine availability must not offer tight-fit models');
}
requireText(homepage, "link.textContent = 'Account'", 'Signed-in homepage navigation must expose the consistent Account label');
requireText(homepage, "machineCta.textContent = savedMachines.length ? 'Manage machines →' : 'Add machine →'", 'Signed-in homepage CTA must match the saved-machine state');
requireText(homepage, 'const LLM_PAGE_SIZE = 40', 'Homepage LLMs must render progressively');
requireText(homepage, 'const SPEECH_PAGE_SIZE = 24', 'Homepage speech records must render progressively');
requireText(homepage, 'const MULTIMODAL_PAGE_SIZE = 6', 'Homepage multimodal cards must render progressively');
requireText(homepage, 'id="lc-index-model-more"', 'Homepage LLM progressive-render control is missing');
requireText(homepage, 'id="lc-index-tts-more"', 'Homepage speech progressive-render control is missing');
requireText(homepage, 'data-multimodal-more=', 'Homepage multimodal progressive-render controls are missing');
requireText(homepage, "trackHomeGoal('home_machine_select'", 'Saved-machine selection needs a dedicated privacy-safe goal');
requireText(homepage, 'machine_count: savedMachines.length', 'Machine selection telemetry must be aggregate-only');
requireText(homepage, 'ram_bucket: ramBucket(machine.ramGb)', 'Machine selection telemetry must bucket RAM');
requireText(homepage, 'tabindex="${selected ? \'0\' : \'-1\'}"', 'Saved-machine radios must use a roving tab stop');
requireText(homepage, "event.key === 'ArrowRight' || event.key === 'ArrowDown'", 'Saved-machine radios must support arrow-key selection');
const machineSelectionGoal = homepage.match(/trackHomeGoal\('home_machine_select',[\s\S]*?\n\s*}\);/);
if (!machineSelectionGoal || /machine_(?:id|name)|\bid\s*:|\bname\s*:/.test(machineSelectionGoal[0])) {
  errors.push('Machine selection telemetry must not include a machine name or identifier');
}
for (const sortKey of ['name', 'score', 'community', 'params', 'ram', 'license', 'fresh']) {
  requireText(homepage, `data-sort-key="${sortKey}"`, `Homepage table is missing the ${sortKey} sortable header`);
}
requireText(homepage, "header.setAttribute('aria-sort'", 'Homepage sortable headers must expose their current direction');
requireText(homepage, "activeSortDirection === 'asc' ? 'desc' : 'asc'", 'Homepage sortable headers must reverse direction on a second click');

if ((homepage.match(/trackHomeGoal\('home_index_search'/g) || []).length !== 3) {
  errors.push('Homepage must track one debounced search path for LLM, speech and multimodal records');
}
if ((homepage.match(/data-sponsor-empty-slot/g) || []).length !== 3) {
  errors.push('The sponsor rail template, click handler and hydration path must share the empty-slot marker');
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Homepage analytics checks passed.');
