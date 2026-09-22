import { MODELS, modelURL } from './config.mjs?v=20260921growth1';
import { decisionLabels, decisionMessages, scoresFromLogprobs, validateDecisionJSON, validateDecision } from './decisions.mjs?v=20260922types1';

const RUNTIME = '/js/labs/vendor/3.6.1/';
let runtime;
let library;
let loadedModel;
let decisionWarmed = false;

async function getLibrary() {
  library ||= await import(`${RUNTIME}index.js`);
  return library;
}

export async function loadModel(model, { signal, onProgress, onStatus, cpuOnly = false }) {
  const { Wllama } = await getLibrary();
  await unloadModel();
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  let gpu = false;
  if (!cpuOnly && navigator.gpu) {
    try { gpu = Boolean(await navigator.gpu.requestAdapter()); } catch { /* CPU path */ }
  }
  if (model.gpuRequired && !gpu) throw new Error('WebGPU required for this high-memory model. Choose a smaller model or use a WebGPU-capable computer.');
  runtime = new Wllama({ default: `${RUNTIME}wllama.wasm` }, {
    allowOffline: true, suppressNativeLog: true,
    logger: { debug() {}, log() {}, warn() {}, error() {} },
  });
  runtime.setCompat({ worker: `${RUNTIME}compat.js`, wasm: `${RUNTIME}compat.wasm` }, 'firefox_safari');
  onStatus(gpu ? 'Preparing your graphics processor…' : 'Preparing the CPU engine…');
  try {
    await runtime.loadModelFromUrl(modelURL(model), {
      signal, n_ctx: 2048, n_batch: 256, n_ubatch: 128,
      n_gpu_layers: gpu ? 99 : 0,
      n_threads: crossOriginIsolated ? Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1)) : 1,
      reasoning: false, default_template_kwargs: { enable_thinking: false },
      progressCallback: ({ loaded, total }) => {
        onProgress(loaded, total || model.bytes);
        if (loaded >= (total || model.bytes)) onStatus('Download complete. Preparing the model…');
      },
    });
    if (signal.aborted) {
      await unloadModel();
      throw new DOMException('Cancelled', 'AbortError');
    }
    loadedModel = model;
    return { backend: gpu ? 'WebGPU' : 'CPU' };
  } catch (error) {
    await unloadModel();
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (gpu && !model.gpuRequired) {
      onStatus('GPU unavailable for this model. Trying your CPU…');
      return loadModel(model, { signal, onProgress, onStatus, cpuOnly: true });
    }
    throw error;
  }
}

export async function generate(messages, { signal, onText, maxTokens = 256, temperature = 0.6, cachePrompt = true }) {
  if (!runtime?.isModelLoaded()) throw new Error('Load a model first.');
  let output = '';
  let firstTokenMs = null;
  let timings = null;
  let finishReason = null;
  let usage = null;
  const started = performance.now();
  await runtime.createChatCompletion({
    messages, stream: true, max_tokens: maxTokens, temperature, top_p: 0.9,
    chat_template_kwargs: { enable_thinking: false },
    abortSignal: signal, cache_prompt: cachePrompt,
    onData(chunk) {
      const choice = chunk.choices?.[0];
      const token = choice?.delta?.content;
      if (token) {
        firstTokenMs ??= performance.now() - started;
        output += token;
        onText(output);
      }
      if (chunk.timings) timings = chunk.timings;
      if (chunk.usage) usage = chunk.usage;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    },
  });
  return { text: output, firstTokenMs, durationMs: performance.now() - started, timings, finishReason, usage };
}

async function scoreDecision(data, signal) {
  if (!runtime?.isModelLoaded() || !loadedModel) throw new Error('Load a model first.');
  const labels = decisionLabels(data.options);
  const start = performance.now();
  // Equal positive bias makes all allowed labels observable in top_logprobs.
  // It cancels under normalization across those same labels. Their pinned
  // tokenizer IDs follow the SemIf presets; returned token labels are checked.
  const response = await runtime.createChatCompletion({
    messages: decisionMessages(data, 'score'),
    max_tokens: 1, temperature: 1, top_k: 0, top_p: 1,
    grammar: `root ::= ${labels.map(label => `"${label}"`).join(' | ')}`,
    logit_bias: Object.fromEntries(labels.map((_, index) => [String(loadedModel.labelTokenBase + index), 100])),
    logprobs: true, top_logprobs: 20, cache_prompt: false,
    chat_template_kwargs: { enable_thinking: false }, abortSignal: signal,
  });
  const scores = scoresFromLogprobs(response.choices?.[0]?.logprobs?.content?.[0]?.top_logprobs, data.options);
  return { scores, durationMs: performance.now() - start, usage: response.usage };
}

export async function compareDecision(input, { signal, onPhase, onScores, onText }) {
  const data = validateDecision(input);
  let warmupMs = 0;
  if (!decisionWarmed) {
    onPhase('Warming both paths. This setup time is excluded from the comparison…');
    const start = performance.now();
    const warmup = { state: 'The light is on.', question: 'Is the light on?', options: ['Yes', 'No'] };
    await scoreDecision(warmup, signal);
    await generate(decisionMessages(warmup, 'json'), { signal, onText() {}, maxTokens: 1, temperature: 0, cachePrompt: false });
    signal.throwIfAborted();
    warmupMs = performance.now() - start;
    decisionWarmed = true;
  }
  onPhase('Scoring the allowed options on your device…');
  const direct = await scoreDecision(data, signal);
  signal.throwIfAborted();
  onScores(direct);
  onPhase('Now asking the same model to write its estimates as JSON…');
  const generated = await generate(decisionMessages(data, 'json'), { signal, onText, maxTokens: 192, temperature: 0, cachePrompt: false });
  signal.throwIfAborted();
  return { direct, generated, warmupMs, validation: validateDecisionJSON(generated.text, data.options) };
}

export async function unloadModel() {
  loadedModel = null;
  decisionWarmed = false;
  if (runtime) {
    const instance = runtime;
    runtime = null;
    await instance.exit();
  }
}

export async function deleteModelCache() {
  const { CacheManager } = await getLibrary();
  const cache = new CacheManager();
  // Delete only the listed Labs artifacts, never unrelated site/browser storage.
  for (const model of MODELS) await cache.delete(modelURL(model));
}
