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

// Records without a delivery marker have a verified local path. Online/API
// services and preserved unverified routes remain in the full speech catalogue
// but must never enter the homepage's local-only index.
const allSpeechRecords = context.TTS_MODELS;
const localSpeechRecords = allSpeechRecords.filter((model) => !model.delivery);
const remoteSpeechRecords = allSpeechRecords.filter((model) => model.delivery === 'online' || model.delivery === 'api');
const unverifiedSpeechRecords = allSpeechRecords.filter((model) => model.delivery === 'unverified');

if (allSpeechRecords.length !== 58 || localSpeechRecords.length !== 55 || remoteSpeechRecords.length !== 2 || unverifiedSpeechRecords.length !== 1) {
  throw new Error(`Unexpected speech classification: ${allSpeechRecords.length} total, ${localSpeechRecords.length} local, ${remoteSpeechRecords.length} remote, ${unverifiedSpeechRecords.length} unverified`);
}

const speechModels = localSpeechRecords.map((model) => ({
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
console.log(`Exported ${speechModels.length} local speech entries; excluded ${remoteSpeechRecords.length} online/API records and ${unverifiedSpeechRecords.length} unverified preserved route.`);
