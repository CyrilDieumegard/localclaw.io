import { MODELS, modelURL } from './config.mjs?v=20260921b';

const RUNTIME = '/js/labs/vendor/3.6.1/';
let runtime;
let library;

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
    return { backend: gpu ? 'WebGPU' : 'CPU' };
  } catch (error) {
    await unloadModel();
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (gpu) {
      onStatus('GPU unavailable for this model. Trying your CPU…');
      return loadModel(model, { signal, onProgress, onStatus, cpuOnly: true });
    }
    throw error;
  }
}

export async function generate(messages, { signal, onText, maxTokens = 256, temperature = 0.6 }) {
  if (!runtime?.isModelLoaded()) throw new Error('Load a model first.');
  let output = '';
  let firstTokenMs = null;
  let timings = null;
  let finishReason = null;
  const started = performance.now();
  await runtime.createChatCompletion({
    messages, stream: true, max_tokens: maxTokens, temperature, top_p: 0.9,
    chat_template_kwargs: { enable_thinking: false },
    abortSignal: signal, cache_prompt: true,
    onData(chunk) {
      const choice = chunk.choices?.[0];
      const token = choice?.delta?.content;
      if (token) {
        firstTokenMs ??= performance.now() - started;
        output += token;
        onText(output);
      }
      if (chunk.timings) timings = chunk.timings;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    },
  });
  return { text: output, firstTokenMs, durationMs: performance.now() - started, timings, finishReason };
}

export async function unloadModel() {
  if (runtime) {
    const instance = runtime;
    runtime = null;
    await instance.exit();
  }
}

export async function deleteModelCache() {
  const { CacheManager } = await getLibrary();
  const cache = new CacheManager();
  // Delete only the two Labs artifacts, never unrelated site/browser storage.
  for (const model of MODELS) await cache.delete(modelURL(model));
}
