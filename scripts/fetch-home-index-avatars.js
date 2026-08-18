const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'images/model-logos');
const AVATARS = {
  '2noise-avatar': '2Noise',
  '3dtopia-avatar': '3DTopia',
  'ace-step-avatar': 'ACE-Step',
  'agentica-avatar': 'agentica-org',
  'ailab-cvc-avatar': 'AILab-CVC',
  'amphion-avatar': 'amphion',
  'bespokelabs-avatar': 'bespokelabs',
  'bigcode-avatar': 'bigcode',
  'black-forest-labs-avatar': 'black-forest-labs',
  'bosonai-avatar': 'bosonai',
  'camb-ai-avatar': 'CAMB-AI',
  'canopylabs-avatar': 'canopylabs',
  'deepreinforce-avatar': 'deepreinforce-ai',
  'defog-avatar': 'defog',
  'doubiiu-avatar': 'Doubiiu',
  'falcon-avatar': 'tiiuae',
  'funaudiollm-avatar': 'FunAudioLLM',
  'genmo-avatar': 'genmo',
  'guoyww-avatar': 'guoyww',
  'hexgrad-avatar': 'hexgrad',
  'hkustaudio-avatar': 'HKUSTAudio',
  'huggingfaceh4-avatar': 'HuggingFaceH4',
  'huggingface-avatar': 'huggingface',
  'huggingfacetb-avatar': 'HuggingFaceTB',
  'hume-avatar': 'HumeAI',
  'inclusionai-avatar': 'inclusionAI',
  'infly-avatar': 'infly',
  'internscience-avatar': 'InternScience',
  'jbetker-avatar': 'jbetker',
  'kyutai-avatar': 'kyutai',
  'lightricks-avatar': 'Lightricks',
  'lllyasviel-avatar': 'lllyasviel',
  'metavoice-avatar': 'metavoiceio',
  'miromind-avatar': 'miromind-ai',
  'misolabs-avatar': 'MisoLabs',
  'moondream-avatar': 'vikhyatk',
  'nanbeige-avatar': 'Nanbeige',
  'nari-labs-avatar': 'nari-labs',
  'neuphonic-avatar': 'neuphonic',
  'nexusflow-avatar': 'Nexusflow',
  'numind-avatar': 'NuMind',
  'odaxai-avatar': 'OdaxAI',
  'open-thoughts-avatar': 'open-thoughts',
  'openbmb-avatar': 'openbmb',
  'opengvlab-avatar': 'OpenGVLab',
  'openmoss-avatar': 'OpenMOSS-Team',
  'outeai-avatar': 'OuteAI',
  'paddlepaddle-avatar': 'PaddlePaddle',
  'parler-avatar': 'parler-tts',
  'powerinfer-avatar': 'PowerInfer',
  'prismml-avatar': 'prism-ml',
  'rednote-avatar': 'rednote-hilab',
  'resemble-avatar': 'ResembleAI',
  'rhasspy-avatar': 'rhasspy',
  'rohan-joshi-avatar': 'rohan_joshi',
  'sailor-avatar': 'sail',
  'sarvam-avatar': 'sarvamai',
  'sesame-avatar': 'sesame',
  'silma-avatar': 'silma-ai',
  'supertone-avatar': 'Supertone',
  'stabilityai-avatar': 'stabilityai',
  'swiss-ai-avatar': 'swiss-ai',
  'swivid-avatar': 'SWivid',
  'tencentarc-avatar': 'TencentARC',
  'worstchan-avatar': 'worstchan',
  'yl4579-avatar': 'yl4579',
  'zyphra-avatar': 'Zyphra'
};

const EXTRA_ASSETS = {
  'ai4bharat-avatar': {extension: 'jpg', url: 'https://avatars.githubusercontent.com/u/69502895?v=4'},
  'emotivoice-avatar': {extension: 'png', url: 'https://avatars.githubusercontent.com/u/3909232?v=4'},
  'kittenml-avatar': {extension: 'png', url: 'https://avatars.githubusercontent.com/u/224667585?v=4'},
  'ornith-avatar': {extension: 'png', url: 'https://avatars.githubusercontent.com/u/221260191?v=4'},
  'rednote-avatar': {extension: 'png', url: 'https://huggingface.co/spaces/rednote-hilab/dots-demo/resolve/main/rednote_hilab.png'},
  'smallthinker-avatar': {extension: 'png', url: 'https://avatars.githubusercontent.com/u/10797537?v=4'},
  'tinyllama-avatar': {extension: 'jpg', url: 'https://avatars.githubusercontent.com/u/42993249?v=4'}
};

async function avatarUrl(handle) {
  for (const kind of ['organizations', 'users']) {
    const response = await fetch(`https://huggingface.co/api/${kind}/${encodeURIComponent(handle)}/avatar`);
    if (response.ok) return (await response.json()).avatarUrl;
  }
  throw new Error(`No public Hugging Face avatar for ${handle}`);
}

async function main() {
  fs.mkdirSync(OUTPUT, {recursive: true});
  const formats = {};
  const unavailable = [];
  for (const [asset, handle] of Object.entries(AVATARS)) {
    try {
      const url = await avatarUrl(handle);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`download returned ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
      const extension = {
        'image/webp': 'webp',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/svg+xml': 'svg'
      }[contentType];
      if (!extension) throw new Error(`unsupported content type ${contentType || 'unknown'}`);
      fs.writeFileSync(path.join(OUTPUT, `${asset}.${extension}`), bytes);
      formats[asset] = extension;
      console.log(`${asset}.${extension} <- ${handle}`);
    } catch (error) {
      unavailable.push({asset, handle, reason: error.message});
      console.warn(`Unavailable: ${asset} <- ${handle} (${error.message})`);
    }
  }
  for (const [asset, source] of Object.entries(EXTRA_ASSETS)) {
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`Could not download ${asset}: ${response.status}`);
    fs.writeFileSync(path.join(OUTPUT, `${asset}.${source.extension}`), Buffer.from(await response.arrayBuffer()));
    formats[asset] = source.extension;
    console.log(`${asset}.${source.extension} <- official upstream project`);
  }
  const output = `// Generated by scripts/fetch-home-index-avatars.js.\n` +
    `window.HOME_INDEX_AVATAR_FORMATS = ${JSON.stringify(formats, null, 2)};\n`;
  fs.writeFileSync(path.join(ROOT, 'js/home-index-avatar-formats-20260814a.js'), output);
  console.log(`Downloaded ${Object.keys(formats).length} official upstream avatars and project marks.`);
  if (unavailable.length) {
    console.log(`Unavailable public avatars (${unavailable.length}):`);
    for (const item of unavailable) console.log(`- ${item.asset}: ${item.handle}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
