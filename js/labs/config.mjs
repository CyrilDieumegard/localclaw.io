export const MODELS = Object.freeze([
  {
    id: 'qwen3-06b', name: 'Qwen3 0.6B', label: 'Qwen3 0.6B · 397 MB',
    bytes: 396705472, memory: 'Allow about 1.5 GB of free memory.',
    repo: 'unsloth/Qwen3-0.6B-GGUF', revision: '50968a4468ef4233ed78cd7c3de230dd1d61a56b',
    file: 'Qwen3-0.6B-Q4_K_M.gguf', license: 'Apache 2.0',
    sha256: 'ac2d97712095a558e31573f62f466a3f9d93990898b0ec79d7c974c1780d524a',
  },
  {
    id: 'qwen3-17b', name: 'Qwen3 1.7B', label: 'Qwen3 1.7B · 1.11 GB',
    bytes: 1107409472, memory: 'Allow about 3 GB of free memory. Better suited to a computer.',
    repo: 'unsloth/Qwen3-1.7B-GGUF', revision: 'd7f544eead698dbd1f15126ef60b45a1e1933222',
    file: 'Qwen3-1.7B-Q4_K_M.gguf', license: 'Apache 2.0',
    sha256: 'b139949c5bd74937ad8ed8c8cf3d9ffb1e99c866c823204dc42c0d91fa181897',
  },
]);

export function modelURL(model) {
  return `https://huggingface.co/${model.repo}/resolve/${model.revision}/${model.file}`;
}

export const SUSPECTS = Object.freeze({
  mara: {
    name: 'Mara', role: 'Museum curator', shortRole: 'Curator',
    intro: 'I organised the exhibition. Ask me about the night the painting disappeared.',
    facts: 'You are innocent. You were in the museum cafe from 21:00 to 21:20. You paid for tea at 21:08 and the cafe camera confirms you stayed. The painting vanished at 21:14. Security guard Leo wore a navy jacket and had the gallery key. You do not know who stole it.',
    clue: 'Café camera: Mara stayed in the café from 21:00 to 21:20.',
  },
  leo: {
    name: 'Leo', role: 'Night security guard', shortRole: 'Security',
    intro: 'I was on the night shift. What do you want to know?',
    facts: 'You are the thief, but pretend to be innocent. Say you stayed in the security booth all evening. You wear a navy jacket. If asked about the badge log or the gallery, admit you briefly entered the gallery at 21:12 to check a sensor, contradicting your alibi. The painting vanished at 21:14. Do not invent another suspect or confess unless confronted with your badge and jacket.',
    clue: 'Access log: Leo’s personal badge opened the gallery at 21:12.',
  },
  iris: {
    name: 'Iris', role: 'Art restorer', shortRole: 'Restorer',
    intro: 'I was finishing a restoration next door. I did notice something unusual.',
    facts: 'You are innocent. You were in the restoration workshop until 21:20. At 21:13 you saw someone in a navy security jacket leaving the gallery with a flat wrapped object. Leo is the only night security guard. The painting vanished at 21:14. You did not see the person’s face and cannot be certain who it was. Only tell facts you observed.',
    clue: 'Witness note: Iris saw a navy security jacket and a wrapped canvas at 21:13.',
  },
});

export const TONES = Object.freeze({
  clear: { label: 'Make it clear', instruction: 'Rewrite the text in simple, concise language. Preserve all facts.' },
  pirate: { label: 'Talk like a pirate', instruction: 'Rewrite this as a playful pirate captain speaking to the crew. Start with "Arrr, mateys!" and use pirate vocabulary. Keep the main information in two short sentences.' },
  trailer: { label: 'Movie trailer', instruction: 'Rewrite the text as a dramatic movie trailer voice-over, in at most 5 short sentences.' },
  haiku: { label: 'Try a haiku', instruction: 'Write a new three-line poem inspired by the text. Use imagery, not the original sentences. Output exactly three short lines.' },
});

export function makeMessages({ mode, suspect = 'mara', tone = 'clear', history = [], input }) {
  let system;
  if (mode === 'mystery') {
    const person = SUSPECTS[suspect];
    if (!person) throw new Error('Unknown suspect.');
    system = `Role: ${person.name}, ${person.role}. This is a fictional museum interview. You are the suspect; the user is the detective asking you questions. Reply as ${person.name} using "I", in 1 or 2 short sentences in the question's language. Your character's facts: ${person.facts} Stay consistent with these facts. Never invent new evidence, times, people or places. If you do not know, say so. /no_think`;
  } else if (mode === 'remix') {
    if (!TONES[tone]) throw new Error('Unknown writing style.');
    system = 'You are a creative writer. Follow the requested writing style. Reply only with your new version, in the language of the source text. /no_think';
  } else {
    system = 'You are a helpful, concise assistant running locally in a browser. Reply in the user’s language. Keep replies under 120 words. You have no web access or tools. Be honest when uncertain. /no_think';
  }
  // Keep complete pairs and a small context window for both model sizes.
  const recent = mode === 'remix' ? [] : history.filter(m => m.role === 'user' || m.role === 'assistant').slice(-6);
  const request = mode === 'remix'
    ? `Source text:\n${input}\n\nYour task: ${TONES[tone].instruction}`
    : input;
  return [{ role: 'system', content: system }, ...recent.map(m => ({ role: m.role, content: m.content.slice(0, 500) })), { role: 'user', content: request }];
}

export function verdictFor(suspect) {
  if (!SUSPECTS[suspect]) throw new Error('Choose a suspect.');
  return {
    correct: suspect === 'leo',
    title: suspect === 'leo' ? 'Case closed. You caught Leo.' : `${SUSPECTS[suspect].name} is innocent. The thief was Leo.`,
    explanation: 'Leo claimed he never left the booth, but his badge opened the gallery at 21:12. Iris saw a navy security jacket carrying a wrapped canvas one minute later. Mara’s café alibi checks out. The case notes are the fixed evidence; the tiny model improvises the interviews.',
  };
}
