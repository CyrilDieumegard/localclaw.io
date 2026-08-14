const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'tts-list.html'), 'utf8');
const match = source.match(/const TTS_MODELS = (\[[\s\S]*?\n\s*\]);/);

if (!match) throw new Error('TTS_MODELS not found in tts-list.html');

const context = {};
vm.createContext(context);
vm.runInContext(`this.TTS_MODELS=${match[1]}`, context);

// Edge TTS declares an Internet requirement in the source catalogue, so it is
// intentionally kept off the homepage's "local models only" index. OCTAVE 2
// only exposes a vendor/API entry point in the current record and is excluded
// until the repository carries a verified local checkpoint/runtime path.
const HOMEPAGE_EXCLUSIONS = new Set(['edge-tts', 'octave-2']);
const speechModels = context.TTS_MODELS.filter((model) => !HOMEPAGE_EXCLUSIONS.has(model.id)).map((model) => ({
  id: model.id,
  name: model.name,
  developer: model.developer,
  family: model.family,
  license: model.license,
  releaseDate: model.releaseDate,
  quality: model.quality,
  speed: model.speed,
  type: model.isAsr ? 'ASR' : model.isOrchestrator ? 'APP' : 'TTS'
}));

const output = `// Generated from the canonical TTS_MODELS array in tts-list.html.\n` +
  `// Run \`node scripts/export-home-index-data.js\` after speech catalogue changes.\n` +
  `window.HOME_INDEX_SPEECH_MODELS = ${JSON.stringify(speechModels, null, 2)};\n`;

fs.writeFileSync(path.join(ROOT, 'js/home-index-speech-20260814c.js'), output);
console.log(`Exported ${speechModels.length} local speech catalogue entries (${HOMEPAGE_EXCLUSIONS.size} non-local or API-only records excluded).`);
