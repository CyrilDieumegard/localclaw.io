import { MODELS, SUSPECTS, TONES, makeMessages, verdictFor } from './config.mjs?v=20260921rlcd1';
import { DECISION_PRESETS, validateDecision } from './decisions.mjs?v=20260921rlcd1';

const $ = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const state = {
  mode: 'mystery', suspect: 'mara', tone: 'clear', loaded: null,
  ready: false, loading: false, busy: false, supported: false, controller: null,
  histories: { mara: [], leo: [], iris: [], chat: [] }, clues: new Set(),
  questions: 0, solved: false, remix: '', engine: null,
};

function announce(text) { $('labs-announcement').textContent = text; }
function status(text, error = false) {
  $('labs-model-note').textContent = text;
  $('labs-model-note').dataset.error = String(error);
}
function model() { return MODELS.find(item => item.id === $('labs-model').value) || MODELS[0]; }
function hint() { return `${model().memory} Download starts only when you click Load model.`; }
function activeHistory() { return state.histories[state.mode === 'mystery' ? state.suspect : 'chat']; }
function syncControls() {
  const locked = state.busy || state.loading;
  $('labs-model').disabled = locked;
  $('labs-load').disabled = !state.supported || locked || state.loaded?.id === model().id;
  $('labs-load').textContent = state.loading ? 'Loading…' : state.loaded?.id === model().id ? 'Model ready' : state.loaded ? 'Switch model' : 'Load model';
  $('labs-cancel-load').hidden = !state.loading;
  $('labs-unload').hidden = !state.ready;
  $('labs-unload').disabled = locked;
  $('labs-delete-cache').disabled = locked;
  all('[data-send]').forEach(button => { button.disabled = !state.ready || state.loaded?.id !== model().id || locked || (state.mode === 'mystery' && state.solved); button.hidden = state.busy; });
  all('[data-stop]').forEach(button => { button.hidden = !state.busy; });
  all('[data-mode], [data-suspect], [data-tone], [data-starter]').forEach(button => { button.disabled = state.busy; });
  all('[data-decision-edit], [data-decision-preset]').forEach(element => { element.disabled = locked; });
  $('labs-restart').disabled = state.busy;
  $('labs-clear-chat').disabled = state.busy;
  $('labs-accuse').disabled = state.busy || state.questions === 0 || state.solved;
  $('labs-copy-remix').disabled = !state.remix || state.busy;
}

function addMessage(container, label, text, user = false) {
  const article = document.createElement('article');
  article.className = `labs-message${user ? ' labs-message--user' : ''}`;
  const name = document.createElement('span');
  name.className = 'labs-message-label';
  name.textContent = label;
  const body = document.createElement('p');
  body.textContent = text;
  article.append(name, body);
  container.append(article);
  container.scrollTop = container.scrollHeight;
  return body;
}

function renderInterview() {
  const person = SUSPECTS[state.suspect];
  $('labs-suspect-name').textContent = `Interview ${person.name}`;
  $('labs-suspect-role').textContent = person.role;
  all('[data-suspect]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.suspect === state.suspect)));
  const container = $('labs-mystery-messages');
  container.replaceChildren();
  addMessage(container, 'Scene introduction', person.intro);
  for (const message of state.histories[state.suspect]) {
    addMessage(container, message.role === 'user' ? 'You' : `${person.name} · generated locally`, message.content, message.role === 'user');
  }
}

function renderClues() {
  $('labs-clue-count').textContent = `${state.clues.size}/3`;
  $('labs-clues').replaceChildren();
  const texts = state.clues.size ? [...state.clues].map(id => SUSPECTS[id].clue) : ['The painting disappeared at 21:14. Interview each suspect to uncover the evidence.'];
  for (const text of texts) {
    const li = document.createElement('li'); li.textContent = text; $('labs-clues').append(li);
  }
}

function setMode(mode) {
  if (mode === 'rlcd') mode = 'decisions';
  if (!['mystery', 'remix', 'chat', 'decisions'].includes(mode) || state.busy) return;
  state.mode = mode;
  all('[data-mode]').forEach(button => {
    const selected = button.dataset.mode === mode;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    $(`panel-${button.dataset.mode}`).hidden = !selected;
  });
  // Only the experiment name enters the URL; user text is never serialized.
  history.replaceState(null, '', `${location.pathname}#${mode}`);
  syncControls();
}

function errorMessage(error, duringLoad = false) {
  const message = String(error?.message || error);
  if (/WebGPU required/i.test(message)) return 'This high-memory model requires WebGPU. Choose a smaller model or an up-to-date WebGPU-capable browser on a computer.';
  if (/score for every option/i.test(message)) return message;
  if (/quota|storage|disk|notallowed/i.test(message)) return 'Your browser could not store the model. Free some disk space or try a regular browser window, then retry.';
  if (/memory|alloc|out of bounds|device.*lost/i.test(message)) return 'The model ran out of available memory. Close other heavy tabs and try Qwen3 0.6B.';
  if (/fetch|network|download|HTTP|CORS/i.test(message)) return 'The model download was interrupted. Check your connection and retry.';
  if (/context|token.*limit|kv_cache/i.test(message)) return 'The conversation is too long for this small model. Start a new case or clear the chat, then try a shorter message.';
  return duringLoad ? 'This browser could not start the model. Try an up-to-date Chrome or Edge browser, or close other heavy tabs and retry.' : 'The local model could not finish this response. Try a shorter message, or unload and reload the model.';
}

async function getEngine() {
  state.engine ||= await import('./engine.mjs?v=20260921rlcd1');
  return state.engine;
}

async function load() {
  if (state.loading || state.busy || !state.supported) return;
  state.loading = true; state.ready = false; state.loaded = null;
  resetDecision();
  $('labs-chat-model').textContent = 'Your model, your machine.';
  for (const mode of ['mystery', 'remix', 'chat', 'decisions']) $(`labs-${mode}-help`).textContent = 'Waiting for the model to load.';
  state.controller = new AbortController();
  const controller = state.controller;
  const selected = model();
  const started = performance.now();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); status('Loading is taking too long. Cancelling…'); }, 600000);
  syncControls();
  status('Starting the local engine…');
  $('labs-progress').hidden = false;
  $('labs-progress').removeAttribute('value');
  try {
    const engine = await getEngine();
    const result = await engine.loadModel(selected, {
      signal: controller.signal,
      onStatus: text => { if (!controller.signal.aborted) status(text); },
      onProgress: (loaded, total) => {
        if (controller.signal.aborted) return;
        const percent = Math.max(0, Math.min(100, loaded / total * 100));
        $('labs-progress').value = percent;
        if (percent < 100) status(`Downloading ${selected.name}: ${Math.round(loaded / 1e6)} / ${Math.round(total / 1e6)} MB (${Math.round(percent)}%)`);
      },
    });
    state.ready = true; state.loaded = selected;
    status(`${selected.name} ready · ${result.backend} · loaded in ${((performance.now() - started) / 1000).toFixed(1)} s`);
    $('labs-chat-model').textContent = `${selected.name} · running on your device`;
    for (const mode of ['mystery', 'remix', 'chat', 'decisions']) $(`labs-${mode}-help`).textContent = 'Ready. Your prompt stays on this device.';
    announce(`${selected.name} is ready. You can start an experiment.`);
  } catch (error) {
    status(timedOut ? 'Loading timed out. Try again on a faster connection or use the smaller model.' : controller.signal.aborted ? 'Loading cancelled. You can try again.' : errorMessage(error, true), !controller.signal.aborted || timedOut);
    for (const mode of ['mystery', 'remix', 'chat', 'decisions']) $(`labs-${mode}-help`).textContent = 'Load a model to continue.';
  } finally {
    clearTimeout(timeout);
    state.loading = false; state.controller = null;
    $('labs-progress').hidden = true;
    syncControls();
  }
}

async function unload() {
  if (state.loading || state.busy) return;
  state.ready = false; state.loaded = null; state.loading = true; syncControls();
  try {
    await state.engine?.unloadModel();
    status('Model unloaded. The download stays cached for next time.');
    for (const mode of ['mystery', 'remix', 'chat', 'decisions']) $(`labs-${mode}-help`).textContent = 'Load a model to continue.';
    $('labs-chat-model').textContent = 'Your model, your machine.';
  } catch { status('Close this tab to release the model’s memory.', true); }
  finally { state.loading = false; syncControls(); }
}

function timingLabel(result) {
  const parts = [];
  if (result.firstTokenMs !== null) parts.push(`First token ${(result.firstTokenMs / 1000).toFixed(1)} s`);
  if (result.timings?.predicted_per_second > 0) parts.push(`${result.timings.predicted_per_second.toFixed(1)} tokens/s`);
  parts.push(`${(result.durationMs / 1000).toFixed(1)} s total`);
  if (result.finishReason === 'length') parts.push('Reply reached the length limit');
  return parts.join(' · ');
}

async function submit(mode) {
  if (!state.ready || state.loaded?.id !== model().id || state.busy || state.loading || (mode === 'mystery' && state.solved)) return;
  const inputElement = $(`labs-${mode}-input`);
  const input = inputElement.value.trim();
  if (!input) { inputElement.focus(); return; }
  const history = mode === 'remix' ? [] : activeHistory();
  const messages = makeMessages({ mode, suspect: state.suspect, tone: state.tone, history, input });
  const help = $(`labs-${mode}-help`);
  const controller = new AbortController();
  state.controller = controller; state.busy = true; syncControls();
  let output = '';
  let responseNode;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180000);
  if (mode === 'remix') {
    state.remix = '';
    responseNode = $('labs-remix-result');
    responseNode.textContent = 'Writing on your device…';
  } else {
    const container = $(`labs-${mode}-messages`);
    addMessage(container, 'You', input, true);
    responseNode = addMessage(container, mode === 'mystery' ? `${SUSPECTS[state.suspect].name} · generated locally` : `${state.loaded.name} · generated locally`, 'Thinking on your device…');
    inputElement.value = '';
  }
  help.textContent = 'Generating locally…';
  try {
    const result = await state.engine.generate(messages, {
      signal: controller.signal, maxTokens: mode === 'mystery' ? 150 : 256,
      temperature: mode === 'mystery' ? 0.35 : 0.7,
      onText(text) {
        output = text;
        responseNode.textContent = text;
        if (mode !== 'remix') {
          const container = $(`labs-${mode}-messages`);
          container.scrollTop = container.scrollHeight;
        }
      },
    });
    if (!result.text.trim()) throw new Error('Empty reply');
    help.textContent = timingLabel(result);
    if (mode === 'mystery') {
      state.questions++;
      state.clues.add(state.suspect);
      renderClues();
    }
    announce(mode === 'remix' ? 'Your remix is ready.' : 'Your local model has replied.');
  } catch (error) {
    const message = timedOut ? 'Response stopped after three minutes. Try a shorter prompt or a faster device.' : controller.signal.aborted ? 'Response stopped.' : errorMessage(error);
    help.textContent = message;
    if (!output) responseNode.textContent = message;
    announce(message);
  } finally {
    clearTimeout(timeout);
    if (mode === 'remix') state.remix = output;
    else if (output.trim()) history.push({ role: 'user', content: input }, { role: 'assistant', content: output });
    state.busy = false; state.controller = null;
    syncControls();
  }
}

function resetDecision() {
  $('labs-decision-scores').textContent = 'No scores yet.';
  $('labs-decision-json').textContent = 'No generated JSON yet.';
  for (const id of ['labs-decision-score-timing', 'labs-decision-json-timing', 'labs-decision-validation']) $(id).textContent = '';
  $('labs-decisions-model').textContent = 'Results appear only after you run a comparison.';
  $('labs-decision-comparison').textContent = 'Warm-up excluded. Scores run first, JSON second; prompt caching is disabled for both measured calls. This is a single-device experiment, not a benchmark against Jev.';
  $('labs-decisions-help').dataset.error = 'false';
}

function decisionPreset(id) {
  const preset = DECISION_PRESETS[id];
  if (!preset || state.busy) return;
  $('labs-decision-state').value = preset.state;
  $('labs-decision-question').value = preset.question;
  $('labs-decision-options').value = preset.options.join('\n');
  resetDecision();
  $('labs-decisions-help').textContent = state.ready ? 'Example ready. Compare the two methods on your device.' : 'Load a model to compare. The SemIf group contains the exact builds used on OpenJEV.';
}

function renderDecisionScores(result) {
  const rows = result.scores.map(({ label, option, probability }) => {
    const row = document.createElement('div'); row.className = 'labs-score-row';
    const name = document.createElement('span'); name.textContent = `${label}. ${option}`;
    const value = document.createElement('span'); value.textContent = `${(probability * 100).toFixed(1)}%`;
    const track = document.createElement('span'); track.className = 'labs-score-track'; track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span'); fill.className = 'labs-score-fill'; fill.style.width = `${probability * 100}%`;
    track.append(fill); row.append(name, value, track); return row;
  });
  $('labs-decision-scores').replaceChildren(...rows);
  $('labs-decision-score-timing').textContent = `${(result.durationMs / 1000).toFixed(2)} s · ${result.usage?.prompt_tokens ?? '—'} input tokens · ${result.usage?.completion_tokens ?? '—'} output token`;
}

async function runDecisions() {
  if (!state.ready || state.loaded?.id !== model().id || state.busy || state.loading) return;
  const help = $('labs-decisions-help');
  let data;
  try {
    data = validateDecision({ state: $('labs-decision-state').value, question: $('labs-decision-question').value, options: $('labs-decision-options').value.split('\n').map(value => value.trim()).filter(Boolean) });
  } catch (error) { help.textContent = error.message; help.dataset.error = 'true'; return; }
  resetDecision();
  $('labs-decisions-model').textContent = `${state.loaded.name} · ${state.loaded.quantization} · this run only`;
  const controller = new AbortController();
  state.controller = controller; state.busy = true; syncControls();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180000);
  try {
    const result = await state.engine.compareDecision(data, {
      signal: controller.signal,
      onPhase: text => { help.textContent = text; },
      onScores: renderDecisionScores,
      onText: text => { $('labs-decision-json').textContent = text; },
    });
    $('labs-decision-json-timing').textContent = timingLabel(result.generated);
    $('labs-decision-validation').textContent = result.validation.message;
    $('labs-decision-validation').dataset.error = String(!result.validation.valid);
    const ratio = result.generated.durationMs / result.direct.durationMs;
    $('labs-decision-comparison').textContent = `This run: JSON took ${ratio.toFixed(2)}× the scoring time. Warm-up excluded${result.warmupMs ? ` (${(result.warmupMs / 1000).toFixed(1)} s)` : ''}; scores first, JSON second; prompt cache off. Different output instructions, same situation and options. Not a Jev benchmark.`;
    help.textContent = result.validation.valid ? 'Comparison complete. These scores are not calibrated confidence.' : 'Comparison complete, but the generated JSON failed validation. See the raw result.';
    announce(help.textContent);
  } catch (error) {
    help.textContent = timedOut ? 'Comparison timed out. Try a shorter situation or a smaller model.' : controller.signal.aborted ? 'Comparison stopped. Any partial results remain visible.' : errorMessage(error);
    help.dataset.error = String(!controller.signal.aborted || timedOut);
    announce(help.textContent);
  } finally { clearTimeout(timeout); state.busy = false; state.controller = null; syncControls(); }
}

function newCase() {
  for (const suspect of Object.keys(SUSPECTS)) state.histories[suspect] = [];
  state.clues.clear(); state.questions = 0; state.solved = false; state.suspect = 'mara';
  renderInterview(); renderClues(); syncControls();
  $('labs-mystery-help').textContent = state.ready ? 'A fresh start. The same case, with new AI conversations.' : 'Load a model to start the interview.';
}

function showAccusation() {
  $('labs-verdict-title').textContent = 'Who took the painting?';
  $('labs-verdict-body').replaceChildren();
  const text = document.createElement('p');
  text.textContent = 'Choose your suspect. This reveals the solution, so check your case notes first.';
  const choices = document.createElement('div'); choices.className = 'labs-accusations';
  for (const [id, person] of Object.entries(SUSPECTS)) {
    const button = document.createElement('button'); button.className = 'labs-button';
    button.textContent = `Accuse ${person.name}`;
    button.addEventListener('click', () => {
      const verdict = verdictFor(id);
      $('labs-verdict-title').textContent = verdict.title;
      const explanation = document.createElement('p'); explanation.textContent = verdict.explanation;
      $('labs-verdict-body').replaceChildren(explanation);
      $('labs-share').hidden = false; state.solved = true;
      $('labs-mystery-help').textContent = 'Case closed. Start a new case to replay.';
      syncControls();
    });
    choices.append(button);
  }
  $('labs-verdict-body').append(text, choices);
  $('labs-share').hidden = true;
  $('labs-verdict').showModal();
}

all('[data-mode]').forEach(button => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
  button.addEventListener('keydown', event => {
    const tabs = all('[data-mode]'); const index = tabs.indexOf(button);
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault(); setMode(tabs[next].dataset.mode); tabs[next].focus();
  });
});
all('[data-suspect]').forEach(button => button.addEventListener('click', () => { state.suspect = button.dataset.suspect; renderInterview(); }));
all('[data-tone]').forEach(button => button.addEventListener('click', () => {
  state.tone = button.dataset.tone;
  all('[data-tone]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $('labs-remix-style').textContent = TONES[state.tone].label;
}));
for (const mode of ['mystery', 'chat']) {
  $(`labs-${mode}-form`).addEventListener('submit', event => { event.preventDefault(); submit(mode); });
  $(`labs-${mode}-input`).addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(mode); }
  });
}
all('[data-starter]').forEach(button => button.addEventListener('click', () => { $('labs-chat-input').value = button.dataset.starter; $('labs-chat-input').focus(); }));
all('[data-stop]').forEach(button => button.addEventListener('click', () => { state.controller?.abort(); }));
$('labs-load').addEventListener('click', load);
$('labs-cancel-load').addEventListener('click', () => { state.controller?.abort(); status('Cancelling…'); });
$('labs-unload').addEventListener('click', unload);
$('labs-model').addEventListener('change', () => { status(hint()); resetDecision(); syncControls(); });
$('labs-decisions-form').addEventListener('submit', event => { event.preventDefault(); runDecisions(); });
all('[data-decision-preset]').forEach(button => button.addEventListener('click', () => decisionPreset(button.dataset.decisionPreset)));
all('[data-decision-edit]').forEach(element => element.addEventListener('input', () => { resetDecision(); $('labs-decisions-help').textContent = 'Inputs changed. Run a new comparison to get matching results.'; }));
$('labs-remix-run').addEventListener('click', () => submit('remix'));
$('labs-restart').addEventListener('click', newCase);
$('labs-accuse').addEventListener('click', showAccusation);
$('labs-close-verdict').addEventListener('click', () => $('labs-verdict').close());
$('labs-share').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('https://localclaw.io/labs#mystery'); $('labs-share').textContent = 'Link copied'; }
  catch { $('labs-share').textContent = 'localclaw.io/labs#mystery'; }
});
$('labs-clear-chat').addEventListener('click', () => {
  state.histories.chat = []; $('labs-chat-messages').replaceChildren();
  addMessage($('labs-chat-messages'), 'Getting started', 'What would you like to try?');
  $('labs-chat-help').textContent = 'Chat cleared. Messages were only held in this tab.';
});
$('labs-copy-remix').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(state.remix); $('labs-remix-help').textContent = 'Text copied.'; }
  catch { $('labs-remix-help').textContent = 'Select the generated text to copy it.'; }
});
$('labs-delete-cache').addEventListener('click', async () => {
  if (state.loading || state.busy) return;
  await unload();
  state.loading = true; syncControls();
  try {
    const engine = await getEngine(); await engine.deleteModelCache();
    $('labs-cache-status').textContent = 'Labs model downloads removed. Your other browser data is unchanged.';
    status('Cached models removed. Loading a model will download it again.');
  } catch { $('labs-cache-status').textContent = 'Could not remove cached models. Close other Labs tabs and try again.'; }
  finally { state.loading = false; syncControls(); }
});

state.supported = Boolean(window.isSecureContext && window.WebAssembly && window.Worker && navigator.storage?.getDirectory);
status(state.supported ? hint() : 'Labs needs a modern browser with local storage support. Try a regular Chrome or Edge window.', !state.supported);
decisionPreset('support');
setMode(location.hash.slice(1) || 'mystery');
syncControls();
