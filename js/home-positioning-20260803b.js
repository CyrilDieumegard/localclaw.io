// LocalClaw discovery-first homepage. Loaded after the main application bundle so
// the recommender keeps its existing state machine while the initial view stays focused.
if (typeof App !== 'undefined') {
    App.renderHero = function renderDiscoveryHome(container) {
        const freshModels = [
            ['Nanbeige4.2 3B', 'Apache 2.0 · 256K context · 8 GB class', '/models/nanbeige4.2-3b', 'Agentic 3B'],
            ['Agents-A1 4B', 'Official Q4_K_M GGUF · tool use · 8 GB class', '/models/agents-a1-4b', 'Agentic 4B'],
            ['Laguna S 2.1', '118B total · 8B active · 1M context', '/models/laguna-s-2.1', 'Coding MoE']
        ];
        const catalogue = [
            ['Qwen 3.5 9B', 'Balanced local model for 16 GB+', '/models/qwen3.5-9b', 'Laptop'],
            ['Gemma 4 12B', 'Multimodal local model for 16 GB+', '/models/gemma4-12b', 'Vision'],
            ['GLM-5.2', '744B MoE · workstation class', '/models/glm-5.2', 'Frontier'],
            ['NeuTTS Air', 'Real-time CPU TTS and voice cloning', '/tts/neutts-air', 'Voice'],
            ['Dots TTS MF', '2B zero-shot voice cloning · Apache 2.0', '/tts/dots-tts-mf', 'Speech'],
            ['MOSS-TTS Nano', 'Compact multilingual speech for local CPU use', '/tts/moss-tts-nano', 'Small TTS']
        ];
        const guides = [
            ['Hardware', 'Best local LLMs for Mac mini M4', 'Start from the machine and choose models that fit unified memory.', '/guides/best-local-llms-for-mac-mini-m4'],
            ['RAM', 'Best local LLMs for 16GB RAM', 'Avoid memory pressure with laptop-safe models and quantizations.', '/guides/best-local-llms-for-16gb-ram'],
            ['Use case', 'Best local LLMs for coding', 'Compare private coding assistants, agents and repo workflows.', '/guides/best-local-llms-for-coding'],
            ['Voice', 'Best local TTS for voice cloning', 'Find speech models for private voice workflows and offline pipelines.', '/guides/best-local-tts-for-voice-cloning']
        ];

        container.innerHTML = `
            <header class="py-10 sm:py-16 lg:py-20 border-b border-white/10 mb-14">
                <div class="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr]">
                    <div class="text-center lg:text-left">
                        <div class="mb-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                            <span class="rounded-full border border-claw-primary/40 bg-claw-primary/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-claw-primary">215 LLM records</span>
                            <span class="rounded-full border border-purple-400/25 bg-purple-400/[0.06] px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-purple-300">58 speech models</span>
                            <span class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-claw-muted">hardware-aware</span>
                        </div>
                        <h1 class="text-[clamp(2.8rem,7vw,5.35rem)] font-display font-bold leading-[0.93] tracking-tight text-white uppercase">
                            Find the right local AI for <span class="text-claw-primary">your machine</span>
                        </h1>
                        <p class="mt-6 max-w-2xl text-base sm:text-lg text-claw-muted font-mono leading-relaxed lg:mx-0 mx-auto">
                            Compare local LLMs and speech models by RAM, VRAM, speed, use case, quantization and a real install path.
                        </p>
                        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 lg:justify-start">
                            <a href="/account" data-fast-goal="account_open" data-fast-goal-source="home_hero" class="w-full sm:w-auto px-7 py-4 bg-claw-primary hover:bg-white active:translate-y-0.5 hover:text-black text-white font-mono font-bold text-sm transition-all shadow-[4px_4px_0px_0px_rgba(234,88,12,0.28)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] hover:-translate-y-0.5 uppercase tracking-tight text-center">Add My Machine</a>
                            <a href="/llm-list" data-fast-goal="catalogue_click" data-fast-goal-target="llm" data-fast-goal-source="home_hero" class="w-full sm:w-auto border border-white/15 px-7 py-4 text-center text-sm font-mono font-bold uppercase tracking-tight text-white transition-colors hover:border-white hover:bg-white hover:text-black">Browse Local Models</a>
                        </div>
                        <button type="button" onclick="App.startFlow('guided', 'home_hero')" data-fast-goal-source="home_hero" class="mt-5 text-xs font-mono font-bold uppercase tracking-wider text-claw-muted hover:text-claw-primary transition-colors">Quick match without an account →</button>
                    </div>

                    <div class="relative mx-auto w-full max-w-xl pt-56 sm:pt-80">
                        <div class="absolute left-1/2 top-6 h-40 w-3/4 -translate-x-1/2 rounded-full bg-claw-primary/20 blur-3xl" aria-hidden="true"></div>
                        <img src="images/localclaw-mascot-hero.webp?v=20260601" width="719" height="600" alt="LocalClaw mascot, orange robot crab" class="pointer-events-none absolute left-1/2 top-0 z-10 h-auto w-[76%] -translate-x-1/2 object-contain drop-shadow-[0_18px_34px_rgba(234,88,12,0.42)] sm:w-[72%]" loading="eager" decoding="async" fetchpriority="high">
                        <div class="relative z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0c] shadow-[0_28px_90px_rgba(0,0,0,0.58),0_0_55px_rgba(255,69,58,0.10)]">
                            <div class="flex items-center justify-between border-b border-white/10 bg-[#121214] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em]">
                                <span class="text-claw-muted">Example hardware profile</span>
                                <span class="text-[#22c55e]">● fit ready</span>
                            </div>
                            <div class="p-5 sm:p-6">
                                <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                                    <div>
                                        <p class="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-claw-primary">Primary machine</p>
                                        <h2 class="mt-2 text-2xl font-display font-bold text-white">Mac mini M4</h2>
                                        <p class="mt-1 text-sm font-mono text-claw-muted">16 GB unified memory · macOS</p>
                                    </div>
                                    <span class="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-mono font-bold text-white">Coding</span>
                                </div>
                                <div class="mt-5 flex items-center justify-between gap-3">
                                    <p class="text-xs font-mono font-bold uppercase tracking-[0.16em] text-claw-muted">Top compatible picks</p>
                                    <a href="/account" class="text-[11px] font-mono font-bold uppercase tracking-wider text-claw-primary hover:text-white">Open workspace →</a>
                                </div>
                                <div class="mt-3 space-y-2">
                                    <div class="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border border-claw-primary/25 bg-claw-primary/[0.07] p-3"><div><strong class="block text-sm text-white">Qwen 3.5 9B</strong><span class="text-[11px] font-mono text-claw-muted">Q5_K_M · balanced fit</span></div><span class="text-xs font-mono font-bold text-[#22c55e]">READY</span></div>
                                    <div class="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-3"><div><strong class="block text-sm text-white">Gemma 4 12B</strong><span class="text-[11px] font-mono text-claw-muted">Q4_K_M · multimodal</span></div><span class="text-xs font-mono font-bold text-white">FITS</span></div>
                                    <div class="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-3"><div><strong class="block text-sm text-white">Qwen 3.5 4B</strong><span class="text-[11px] font-mono text-claw-muted">Q6_K · extra headroom</span></div><span class="text-xs font-mono font-bold text-white">FAST</span></div>
                                </div>
                                <div class="mt-4 grid grid-cols-3 gap-2 text-center font-mono"><div class="rounded-md bg-black/45 p-2"><strong class="block text-sm text-white">RAM</strong><span class="text-[9px] uppercase text-claw-muted">checked</span></div><div class="rounded-md bg-black/45 p-2"><strong class="block text-sm text-white">QUANT</strong><span class="text-[9px] uppercase text-claw-muted">matched</span></div><div class="rounded-md bg-black/45 p-2"><strong class="block text-sm text-white">LOCAL</strong><span class="text-[9px] uppercase text-claw-muted">install path</span></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <section aria-labelledby="workspace-value-title" class="mb-20">
                <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p class="mb-3 text-xs font-mono font-bold uppercase tracking-[0.2em] text-claw-primary">// YOUR HARDWARE WORKSPACE</p>
                        <h2 id="workspace-value-title" class="max-w-3xl text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">Stop rebuilding the same shortlist for every computer</h2>
                        <p class="mt-3 max-w-3xl text-sm text-claw-muted font-mono leading-relaxed">Save your Macs, PCs and NVIDIA workstations once. LocalClaw gives each machine its own compatible models, saved picks and test history.</p>
                    </div>
                    <a href="/account" data-fast-goal="account_open" data-fast-goal-source="home_workspace" class="text-sm font-mono font-bold uppercase tracking-wider text-claw-primary hover:text-white">My Machines →</a>
                </div>
                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article class="rounded-xl border border-white/10 bg-white/[0.025] p-5"><span class="font-mono text-xs font-bold text-claw-primary">01</span><h3 class="mt-4 text-lg font-display font-bold text-white">Hardware profiles</h3><p class="mt-2 text-sm leading-relaxed text-claw-muted">Keep RAM, VRAM, OS, accelerator and workload together.</p></article>
                    <article class="rounded-xl border border-white/10 bg-white/[0.025] p-5"><span class="font-mono text-xs font-bold text-claw-primary">02</span><h3 class="mt-4 text-lg font-display font-bold text-white">Compatible models</h3><p class="mt-2 text-sm leading-relaxed text-claw-muted">See what fits each machine and which quantization leaves headroom.</p></article>
                    <article class="rounded-xl border border-white/10 bg-white/[0.025] p-5"><span class="font-mono text-xs font-bold text-claw-primary">03</span><h3 class="mt-4 text-lg font-display font-bold text-white">Saved picks and tests</h3><p class="mt-2 text-sm leading-relaxed text-claw-muted">Shortlist models, record measured speed and keep private notes.</p></article>
                    <article class="rounded-xl border border-white/10 bg-white/[0.025] p-5"><span class="font-mono text-xs font-bold text-claw-primary">04</span><h3 class="mt-4 text-lg font-display font-bold text-white">Community signal</h3><p class="mt-2 text-sm leading-relaxed text-claw-muted">Use LLM and speech ratings as context beside hardware fit.</p></article>
                </div>
            </section>

            <section id="model-finder" class="mb-20">
                <div class="rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(255,69,58,0.10),transparent_45%),rgba(255,255,255,0.025)] p-6 sm:p-8">
                    <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div><p class="mb-3 text-xs font-mono font-bold uppercase tracking-[0.2em] text-claw-primary">// LOCAL FIT ENGINE</p><h2 class="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">Benchmarks rank models. Hardware fit makes them usable.</h2><p class="mt-3 max-w-3xl text-sm text-claw-muted font-mono leading-relaxed">LocalClaw weighs memory headroom, context, use case, quantization and installability. Every recommendation explains why it fits.</p></div>
                        <button type="button" onclick="App.startFlow('guided', 'home_fit_engine')" class="w-full sm:w-auto rounded-lg border border-claw-primary/35 bg-claw-primary/10 px-4 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider text-claw-primary transition-colors hover:bg-claw-primary hover:text-white">Run the fit check →</button>
                    </div>
                    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        ${[
                            ['01', 'Hardware first', 'RAM, VRAM, OS and model size define the usable shortlist.', 'M4 · 16 GB → laptop-safe picks'],
                            ['02', 'Context costs memory', 'Long context increases KV cache and reduces usable headroom.', '32K → headroom check'],
                            ['03', 'Workload changes rank', 'Coding, reasoning, vision, chat and speed use different signals.', 'Coding → code score + tags'],
                            ['04', 'Install path required', 'Open weights count only when there is a practical local route.', 'GGUF / MLX / local runtime']
                        ].map(([num, title, copy, example]) => `<article class="rounded-xl border border-white/10 bg-black/35 p-4"><span class="font-mono text-xs font-bold text-claw-primary">${num}</span><h3 class="mt-4 mb-2 text-base font-display font-bold text-white">${title}</h3><p class="text-xs leading-relaxed text-claw-muted">${copy}</p><p class="mt-4 rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-2 font-mono text-[11px] text-claw-muted">${example}</p></article>`).join('')}
                    </div>
                </div>
            </section>

            <section id="fresh-local-ai" aria-labelledby="fresh-title" class="mb-20">
                <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p class="mb-3 text-xs font-mono font-bold uppercase tracking-[0.2em] text-claw-primary">// RECENTLY VERIFIED</p><h2 id="fresh-title" class="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">Fresh local AI worth checking</h2><p class="mt-3 max-w-2xl text-sm text-claw-muted font-mono leading-relaxed">New entries are screened for a credible local install path before they reach the catalogue.</p></div><div class="flex gap-4 text-xs font-mono font-bold uppercase tracking-wider"><a href="/new" class="text-claw-primary hover:text-white">All new models →</a><a href="/new-models.xml" class="text-claw-muted hover:text-white">RSS</a></div></div>
                <div class="grid gap-4 md:grid-cols-3">${freshModels.map(([name, meta, href, tag]) => `<a href="${href}" data-fast-goal="model_open" data-fast-goal-source="home_recent" class="group rounded-xl border border-white/10 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-claw-primary/45"><div class="flex items-center justify-between"><span class="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-claw-primary">${tag}</span><span class="text-claw-muted group-hover:text-white">→</span></div><h3 class="mt-4 text-lg font-display font-bold text-white">${name}</h3><p class="mt-2 text-xs leading-relaxed text-claw-muted">${meta}</p></a>`).join('')}</div>
            </section>

            <section aria-labelledby="guided-title" class="mb-20">
                <div class="mb-8 flex items-end justify-between gap-4"><div><p class="mb-3 text-xs font-mono font-bold uppercase tracking-[0.2em] text-claw-primary">// START FROM A REAL NEED</p><h2 id="guided-title" class="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">Hardware, RAM, workload or voice</h2></div><a href="/guides/" class="hidden sm:inline text-sm font-mono font-bold uppercase tracking-wider text-claw-primary hover:text-white">All guides →</a></div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${guides.map(([tag, title, copy, href]) => `<a href="${href}" data-fast-goal="guide_open" data-fast-goal-source="home_guides" class="group rounded-xl border border-white/10 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-claw-primary/45"><p class="text-[10px] font-mono font-bold uppercase tracking-[0.18em] ${tag === 'Voice' ? 'text-purple-300' : 'text-claw-primary'}">${tag}</p><h3 class="mt-3 text-lg font-display font-bold text-white">${title}</h3><p class="mt-2 text-xs leading-relaxed text-claw-muted">${copy}</p></a>`).join('')}</div>
            </section>

            <section aria-labelledby="catalogue-title" class="mb-20">
                <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p class="mb-3 text-xs font-mono font-bold uppercase tracking-[0.2em] text-claw-primary">// EXPLORE THE DATABASE</p><h2 id="catalogue-title" class="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">Models you can inspect, compare and save</h2></div><div class="flex flex-wrap gap-3 text-sm font-mono"><a href="/llm-list" class="text-claw-primary hover:text-white">215 LLM records →</a><a href="/tts-list" class="text-purple-300 hover:text-white">58 speech models →</a><a href="/computers" class="text-claw-muted hover:text-white">Hardware →</a></div></div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${catalogue.map(([name, meta, href, tag]) => `<a href="${href}" data-fast-goal="${href.startsWith('/tts/') ? 'tts_open' : 'model_open'}" data-fast-goal-source="home_teaser" class="group rounded-xl border border-white/10 bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"><div class="flex items-center justify-between"><span class="text-[10px] font-mono uppercase tracking-[0.18em] text-claw-primary">${tag}</span><span class="text-claw-muted group-hover:text-white">→</span></div><h3 class="mt-4 text-lg font-display font-bold text-white">${name}</h3><p class="mt-2 text-xs font-mono leading-relaxed text-claw-muted">${meta}</p></a>`).join('')}</div>
            </section>

            <section aria-labelledby="software-title" class="mb-20 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,69,58,0.10),rgba(255,255,255,0.02)_45%,rgba(0,0,0,0.35))]">
                <div class="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[0.82fr_1.18fr]">
                    <div><p class="mb-3 text-xs font-mono font-bold uppercase tracking-[0.2em] text-claw-primary">// OPTIONAL MAC SOFTWARE</p><h2 id="software-title" class="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">Operate OpenClaw from a native dashboard</h2><p class="mt-4 text-sm leading-relaxed text-claw-muted">LocalClaw for Mac handles setup, health, models, agents, channels and scheduled work. The web database and hardware workspace remain useful on their own.</p><div class="mt-6 flex flex-col gap-3 sm:flex-row"><a href="/software" data-fast-goal="software_open" data-fast-goal-source="home_software_teaser" class="rounded-lg bg-claw-primary px-5 py-3 text-center text-sm font-mono font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black">Explore LocalClaw for Mac</a><a href="/pricing" class="rounded-lg border border-white/15 px-5 py-3 text-center text-sm font-mono font-bold uppercase tracking-wider text-white hover:border-white">View pricing</a></div></div>
                    <a href="/software" class="block overflow-hidden rounded-xl border border-white/10 bg-black/40" aria-label="Explore the LocalClaw for Mac software"><img src="/images/pricing-carousel/home.jpg?v=20260602" width="1400" height="770" alt="LocalClaw for Mac dashboard with OpenClaw health, models and system load" class="h-auto w-full" loading="lazy" decoding="async"></a>
                </div>
            </section>

            <div class="text-center"><button onclick="App.showFAQ()" class="text-claw-muted hover:text-white text-xs font-mono uppercase tracking-widest transition-colors">[ OPEN LOCAL AI FAQ ]</button></div>
        `;
    };
}
