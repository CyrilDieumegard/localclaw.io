// LocalClaw Main Application Logic v2.0 - LM STUDIO EDITION
// Complete rewrite: smarter engine, better UX, more features

const App = {
    state: {
        view: 'hero',        // hero | flow | pro-input | results | compare | faq
        activeFlow: null,     // guided | quick | pro
        currentStepIndex: 0,
        answers: {},
        recommendations: [],
        compareList: [],      // model ids for comparison
        history: [],          // navigation history for back button
        selectedModelIndex: 0, // index of the selected model in recommendations
    },

    init() {
        this.render();
        this.initParticles();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.goBack();
        });
    },

    // ========================================================================
    // NAVIGATION & STATE
    // ========================================================================

    pushState() {
        this.state.history.push(JSON.parse(JSON.stringify({
            view: this.state.view,
            activeFlow: this.state.activeFlow,
            currentStepIndex: this.state.currentStepIndex,
            answers: this.state.answers,
        })));
    },

    goBack() {
        if (this.state.history.length > 0) {
            const prev = this.state.history.pop();
            Object.assign(this.state, prev);
            this.render();
        } else {
            this.reset();
        }
    },

    startFlow(flowId) {
        this.pushState();
        this.state.activeFlow = flowId;
        this.state.currentStepIndex = 0;
        this.state.answers = {};

        if (flowId === 'pro') {
            this.state.view = 'pro-input';
        } else {
            this.state.view = 'flow';
        }
        this.render();
    },

    reset() {
        this.state = {
            view: 'hero',
            activeFlow: null,
            currentStepIndex: 0,
            answers: {},
            recommendations: [],
            compareList: [],
            history: [],
            selectedModelIndex: 0,
            _contextNote: false,
        };
        this.render();
    },

    showFAQ() {
        this.pushState();
        this.state.view = 'faq';
        this.render();
    },

    showCompare() {
        this.pushState();
        this.state.view = 'compare';
        this.render();
    },

    handleOptionSelect(key, value) {
        this.pushState();
        this.state.answers[key] = value;

        const flowSteps = APP_DATA.flows[this.state.activeFlow];

        if (this.state.currentStepIndex < flowSteps.length - 1) {
            this.state.currentStepIndex++;
            this.render();
        } else {
            this.calculateResults();
        }
    },

    // ========================================================================
    // RECOMMENDATION ENGINE v2 - Smarter scoring
    // ========================================================================

    calculateResults() {
        const answers = this.state.answers;
        let candidates = [...APP_DATA.models];
        let ramLimit = 8;

        // --- Determine RAM ---
        if (this.state.activeFlow === 'guided') {
            const ramMap = { light: 8, standard: 16, power: 32, beast: 64 };
            ramLimit = ramMap[answers.level] || 8;
        } else if (this.state.activeFlow === 'quick') {
            ramLimit = answers.ram === 'unknown' ? 8 : parseInt(answers.ram);
        } else if (this.state.activeFlow === 'pro') {
            ramLimit = answers.parsedRam || 16;
        }

        // --- GPU Bonus Factor ---
        let gpuBonus = 0;
        const isAppleSilicon = (answers.gpu === 'apple') || (this.state.activeFlow === 'guided' && answers.os === 'mac');
        if (isAppleSilicon) gpuBonus = 0.15; // Unified memory = more efficient
        if (answers.gpu === 'nvidia_high') gpuBonus = 0.1;
        if (answers.gpu === 'nvidia_low') gpuBonus = 0.05;

        const effectiveRam = ramLimit * (1 + gpuBonus);

        // --- VRAM (new optional input) ---
        const vramRaw = answers.vram || '';
        const vramGB = vramRaw ? parseInt(vramRaw) : 0; // 0 = not specified

        // --- Context target (new optional input) ---
        const contextTarget = answers.context || ''; // '', '4k', '8k', '16k', '32k'
        const highContext = (contextTarget === '16k' || contextTarget === '32k');

        // KV cache overhead estimation (GB) based on context target and model size
        const kvCacheOverhead = (modelSizeGb) => {
            if (!contextTarget) return 0;
            // Rough heuristic: KV cache ≈ proportional to (params × context_length)
            // Base: 8k context adds ~0 extra (default). 16k ≈ +15-25% of model size, 32k ≈ +30-50%
            const paramScale = Math.max(modelSizeGb / 5, 0.5); // normalize around 5GB model
            if (contextTarget === '4k') return 0;
            if (contextTarget === '8k') return 0.3 * paramScale;
            if (contextTarget === '16k') return 0.8 * paramScale;
            if (contextTarget === '32k') return 1.8 * paramScale;
            return 0;
        };

        // --- Filter by RAM (leave ~2-3 GB for OS) ---
        candidates = candidates.filter(m => !m.hosted_only);
        candidates = candidates.filter(m => {
            const overhead = kvCacheOverhead(m.size_gb);
            return (m.size_gb + overhead) < (effectiveRam - 2.5);
        });

        // --- VRAM-based filter: if VRAM specified and low, hard-exclude models that can't fit ---
        if (vramGB > 0 && vramGB <= 8) {
            candidates = candidates.filter(m => {
                // Model must fit in VRAM OR be small enough to CPU-offload gracefully
                return m.size_gb <= (vramGB + 2); // allow small overflow for partial offload
            });
        }

        // --- Usage ---
        const usage = answers.usage || 'chat';
        const priority = answers.priority || 'balanced';

        // --- Scoring ---
        candidates = candidates.map(m => {
            let score = 0;

            // Usage Match (primary factor)
            if (usage === 'mix') {
                if (m.tags.includes('general')) score += 15;
                else if (m.tags.includes('chat')) score += 8;
                // Penalize hyper-specialized models for "Everything"
                const specialOnly = m.tags.filter(t => ['vision', 'code'].includes(t));
                if (specialOnly.length > 0 && !m.tags.includes('general') && !m.tags.includes('chat')) score -= 5;
            } else if (usage === 'reasoning') {
                if (m.tags.includes('reasoning')) score += 20;
                else if (m.tags.includes('general')) score += 5;
                // Benchmarks
                score += (m.benchmarks?.reasoning || 5) * 1.5;
            } else {
                if (m.tags.includes(usage)) score += 15;
                if (m.tags.includes('general') && usage !== 'vision') score += 5;
                // Use benchmark scores
                if (usage === 'code') score += (m.benchmarks?.coding || 5) * 1.2;
                if (usage === 'chat') score += (m.benchmarks?.quality || 5) * 1.0;
                if (usage === 'vision') score += m.tags.includes('vision') ? 20 : -10;
            }

            // Quality benchmark bonus
            score += (m.benchmarks?.quality || 5) * 0.5;

            // Priority adjustments
            if (priority === 'speed') {
                score += (m.benchmarks?.speed || 5) * 2;
                if (m.tags.includes('light')) score += 5;
            } else if (priority === 'quality') {
                score += (m.benchmarks?.quality || 5) * 2;
                if (m.tags.includes('quality')) score += 5;
                if (m.tags.includes('light') && ramLimit >= 16) score -= 5;
            } else {
                // Balanced: slight preference for quality but don't kill speed
                score += (m.benchmarks?.quality || 5) * 1.0;
                score += (m.benchmarks?.speed || 5) * 0.5;
            }

            // Recency bonus (newer models get a slight edge)
            if (m.released) {
                const relDate = new Date(m.released);
                const now = new Date('2026-02-08');
                const monthsAgo = (now - relDate) / (1000 * 60 * 60 * 24 * 30);
                if (monthsAgo < 6) score += 3;
                if (monthsAgo < 3) score += 2;
            }

            // Size efficiency: prefer models that USE available RAM well (not too small for big systems)
            if (ramLimit >= 32 && m.size_gb < 3 && priority !== 'speed') score -= 5;
            if (ramLimit >= 16 && m.size_gb < 2 && priority !== 'speed') score -= 3;

            // RAM utilization bonus: models that use 25-70% of available RAM score well
            const utilization = m.size_gb / effectiveRam;
            if (utilization > 0.25 && utilization < 0.7) score += 3;

            // Gemma 4 sweet spot: on 16 GB Apple Silicon, E4B is the logical default.
            // E2B is great for tiny machines, but Mac mini 16 GB should surface the stronger 4B-class model.
            if (isAppleSilicon && ramLimit >= 16 && m.id === 'gemma4-e4b') score += 5;
            if (isAppleSilicon && ramLimit >= 16 && m.id === 'gemma4-e2b' && priority !== 'speed') score -= 2;

            // --- Apple Silicon speed bonus ---
            // On Apple Metal, tokens/sec scales strongly with model size.
            // A 4B model is ~2.5x faster than a 9B on M-series chips.
            // If speed is important OR RAM is 16GB, reward smaller fast models.
            if (isAppleSilicon) {
                const speedScore = m.benchmarks?.speed || 5;
                if (m.size_gb <= 4 && speedScore >= 9) {
                    // Tiny fast models (≤4GB) get a strong Apple Metal bonus
                    if (priority === 'speed') score += 12;
                    else if (priority === 'balanced') score += 6;
                } else if (m.size_gb <= 6 && speedScore >= 8) {
                    // Small fast models (≤6GB)
                    if (priority === 'speed') score += 7;
                    else if (priority === 'balanced') score += 3;
                } else if (m.size_gb > 8 && ramLimit <= 16) {
                    // On 16GB RAM, models >8GB will be SLOW due to memory pressure
                    // Hybrid thinking models (qwen3.5 etc) make it worse
                    const isHeavyForRam = (m.size_gb / ramLimit) > 0.5;
                    if (isHeavyForRam) score -= 8;
                }
            }

            // --- NEW: VRAM penalty — if user specified VRAM, penalize models that don't fit in GPU ---
            if (vramGB > 0) {
                if (m.size_gb > vramGB) {
                    // Model won't fit entirely in VRAM → partial offload penalty
                    const overflowRatio = (m.size_gb - vramGB) / m.size_gb;
                    score -= overflowRatio * 12; // significant penalty for CPU spillover
                } else {
                    // Model fits in VRAM → bonus
                    score += 3;
                }
            }

            // --- NEW: High context penalty for heavy models ---
            if (highContext) {
                const overhead = kvCacheOverhead(m.size_gb);
                const totalNeeded = m.size_gb + overhead;
                const headroom = effectiveRam - totalNeeded - 2.5;
                if (headroom < 2) {
                    score -= 8; // very tight with KV cache
                } else if (headroom < 4) {
                    score -= 4; // somewhat tight
                }
                // Prefer smaller/faster models when asking for high context
                if (m.tags.includes('light')) score += 3;
            }

            return { ...m, score: Math.round(score * 10) / 10 };
        });

        // --- Sort & Deduplicate by family ---
        candidates.sort((a, b) => b.score - a.score);

        const finalRecs = [];
        const seenFamilies = new Set();

        for (const m of candidates) {
            if (!seenFamilies.has(m.family)) {
                finalRecs.push(m);
                seenFamilies.add(m.family);
            }
            if (finalRecs.length >= 4) break;
        }

        // Mac mini 16 GB sanity rule: Gemma 4 E4B should always be visible if it fits.
        // This prevents newer Gemma 4 from being hidden by family dedupe or use-case scoring edge cases.
        const gemma4E4B = candidates.find(m => m.id === 'gemma4-e4b');
        const hasGemma4E4B = finalRecs.some(m => m.id === 'gemma4-e4b');
        if (isAppleSilicon && ramLimit === 16 && gemma4E4B && !hasGemma4E4B) {
            if (finalRecs.length < 4) finalRecs.push(gemma4E4B);
            else finalRecs[finalRecs.length - 1] = gemma4E4B;
        }

        // Fallback
        if (finalRecs.length === 0) {
            finalRecs.push(APP_DATA.models.find(m => m.id === 'phi4-mini'));
        }

        // --- NEW: Compute "Why this pick" + risk badge per recommendation ---
        finalRecs.forEach(m => {
            m._why = this._buildWhyThisPick(m, ramLimit, vramGB, contextTarget, effectiveRam, kvCacheOverhead);
            m._risk = this._computeRiskBadge(m, effectiveRam, vramGB, contextTarget, kvCacheOverhead);
        });

        this.state.recommendations = finalRecs;
        this.state._contextNote = highContext; // flag for KV-cache note in results
        this.state.view = 'results';
        this.render();
    },

    // --- "Why this pick" explanation builder ---
    _buildWhyThisPick(model, ramLimit, vramGB, contextTarget, effectiveRam, kvCacheOverhead) {
        const parts = [];
        const ramPct = Math.round((model.size_gb / effectiveRam) * 100);
        const answers = this.state.answers;
        const isApple = (answers.gpu === 'apple') || (this.state.activeFlow === 'guided' && answers.os === 'mac');

        parts.push(`Uses ~${ramPct}% of your ~${Math.round(effectiveRam)} GB effective RAM`);

        // Apple Silicon specific reasoning
        if (isApple) {
            if (model.size_gb <= 4 && (model.benchmarks?.speed || 0) >= 9) {
                parts.push('⚡ Runs at ~70–120 tok/s on Apple Silicon Metal — very fast');
                parts.push('Small enough for full GPU acceleration on unified memory');
            } else if (model.size_gb <= 6 && (model.benchmarks?.speed || 0) >= 8) {
                parts.push('⚡ Runs at ~40–70 tok/s on Apple Silicon Metal — fast');
            } else if (model.size_gb > 8 && ramLimit <= 16) {
                parts.push('⚠️ May feel slow on 16 GB — memory pressure reduces tok/s');
            }
        }

        if (vramGB > 0) {
            if (model.size_gb <= vramGB) {
                parts.push(`Fits in your ${vramGB} GB VRAM → full GPU acceleration`);
            } else {
                parts.push(`Exceeds ${vramGB} GB VRAM → partial CPU offload needed`);
            }
        }

        if (contextTarget) {
            const overhead = kvCacheOverhead(model.size_gb);
            if (overhead > 0.5) {
                parts.push(`${contextTarget.toUpperCase()} context adds ~${overhead.toFixed(1)} GB KV cache overhead`);
            } else {
                parts.push(`${contextTarget.toUpperCase()} context — minimal extra memory`);
            }
        }

        if (!vramGB && !contextTarget && !isApple) {
            parts.push('Based on RAM estimation only');
        }

        return parts;
    },

    // --- Risk badge computation ---
    _computeRiskBadge(model, effectiveRam, vramGB, contextTarget, kvCacheOverhead) {
        const overhead = kvCacheOverhead(model.size_gb);
        const totalNeeded = model.size_gb + overhead + 2.5; // model + KV + OS reserve
        const headroom = effectiveRam - totalNeeded;

        // VRAM overflow factor
        let vramStress = 0;
        if (vramGB > 0 && model.size_gb > vramGB) {
            vramStress = (model.size_gb - vramGB) / model.size_gb;
        }

        if (headroom < 1 || vramStress > 0.5) {
            return { label: 'Risk of OOM', color: 'red', icon: 'dot_red' };
        }
        if (headroom < 3 || vramStress > 0.25 || (contextTarget === '32k' && headroom < 6)) {
            return { label: 'May be slow', color: 'yellow', icon: 'dot_yellow' };
        }
        return { label: 'Likely smooth', color: 'green', icon: 'dot_green' };
    },

    parseProInput(text) {
        if (!text || text.trim().length < 5) {
            this.showToast('Please paste your terminal output first', 'error');
            return;
        }

        const lower = text.toLowerCase();
        let ram = 8;
        let os = 'linux';
        let gpu = 'unknown';

        // Detect OS
        if (lower.includes('darwin') || lower.includes('mac') || lower.includes('apple')) os = 'mac';
        else if (lower.includes('microsoft') || lower.includes('windows') || lower.includes('win32')) os = 'win';

        // Detect RAM
        const gbMatch = lower.match(/(\d+)\s*gb/i);
        if (gbMatch) {
            ram = parseInt(gbMatch[1]);
        } else {
            const mbMatch = lower.match(/memtotal:\s*(\d+)\s*kb/i);
            if (mbMatch) {
                ram = Math.round(parseInt(mbMatch[1]) / 1024 / 1024);
            }
            const hwMemMatch = lower.match(/hw\.memsize[:\s]*(\d+)/);
            if (hwMemMatch) {
                ram = Math.round(parseInt(hwMemMatch[1]) / 1024 / 1024 / 1024);
            }
        }

        // Detect GPU
        if (lower.includes('apple m1') || lower.includes('apple m2') || lower.includes('apple m3') || lower.includes('apple m4')) {
            gpu = 'apple';
        } else if (lower.includes('nvidia') || lower.includes('geforce') || lower.includes('rtx') || lower.includes('gtx')) {
            // Try to detect VRAM
            const vramMatch = lower.match(/(\d+)\s*(?:mib|mb)\s*(?:vram|memory)/i);
            if (vramMatch && parseInt(vramMatch[1]) > 10000) gpu = 'nvidia_high';
            else gpu = 'nvidia_low';
        } else if (lower.includes('amd') || lower.includes('radeon')) {
            gpu = 'amd';
        }

        if (os === 'mac') gpu = 'apple'; // Safe assumption for macOS

        this.state.answers = {
            os,
            parsedRam: ram,
            gpu,
            usage: 'chat'
        };

        this.showToast(`Detected: ${os.toUpperCase()} · ${ram} GB RAM · GPU: ${gpu}`, 'success');
        setTimeout(() => this.calculateResults(), 800);
    },

    // ========================================================================
    // UI HELPERS
    // ========================================================================

    showToast(message, type = 'info') {
        const existing = document.querySelector('.claw-toast');
        if (existing) existing.remove();

        const colors = {
            success: 'from-emerald-600 to-emerald-700 border-emerald-500',
            error: 'from-red-600 to-red-700 border-red-500',
            info: 'from-blue-600 to-blue-700 border-blue-500',
            copied: 'from-claw-primary to-orange-600 border-claw-primary'
        };

        const toast = document.createElement('div');
        toast.className = `claw-toast fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-6 py-3 rounded-xl bg-gradient-to-r ${colors[type] || colors.info} border text-white text-sm font-medium shadow-2xl backdrop-blur-sm`;
        toast.style.cssText = 'animation: toastIn 0.3s ease-out forwards;';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    copyToClipboard(text, label) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(`Copied: ${label || text}`, 'copied');
        });
    },

    toggleCompare(modelId) {
        const idx = this.state.compareList.indexOf(modelId);
        if (idx > -1) {
            this.state.compareList.splice(idx, 1);
        } else {
            if (this.state.compareList.length >= 3) {
                this.showToast('Max 3 models to compare', 'error');
                return;
            }
            this.state.compareList.push(modelId);
        }
        // Re-render results to update checkboxes
        if (this.state.view === 'results') this.render();
    },

    // Select a model from the recommendations list — updates left panel
    selectModel(idx) {
        if (idx === this.state.selectedModelIndex) return;
        if (idx < 0 || idx >= this.state.recommendations.length) return;
        this.state.selectedModelIndex = idx;

        // Update left panel without full re-render (smooth UX)
        const leftPanel = document.getElementById('results-left-panel');
        if (leftPanel) {
            const selectedModel = this.state.recommendations[idx];
            leftPanel.innerHTML = this.buildLeftPanel(selectedModel, idx);
            // Smooth scroll left panel into view on mobile
            if (window.innerWidth < 1024) {
                leftPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Update card highlights on the right
        const cards = document.querySelectorAll('[data-model-card]');
        cards.forEach((card, i) => {
            if (i === idx) {
                card.classList.add('ring-1', 'ring-claw-primary/40', 'border-claw-primary/40');
                card.classList.remove('border-white/5');
            } else {
                card.classList.remove('ring-1', 'ring-claw-primary/40', 'border-claw-primary/40');
                // Restore default border
                if (!card.classList.contains('border-white/5')) {
                    card.classList.add('border-white/5');
                }
            }
            // Update "Selected" badge
            const badge = card.querySelector('[data-selected-badge]');
            if (badge) {
                if (i === idx) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        });

        this.showToast(`Selected: ${this.state.recommendations[idx].name}`, 'copied');
    },

    getProgressPercent() {
        if (!this.state.activeFlow || !APP_DATA.flows[this.state.activeFlow]) return 0;
        const total = APP_DATA.flows[this.state.activeFlow].length;
        return Math.round(((this.state.currentStepIndex) / total) * 100);
    },

    // ========================================================================
    // PARTICLES SYSTEM
    // ========================================================================

    initParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animFrame;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.pulse = Math.random() * Math.PI * 2;
                this.pulseSpeed = Math.random() * 0.02 + 0.005;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.pulse += this.pulseSpeed;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
            }
            draw() {
                const dynamicOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.pulse));
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 69, 58, ${dynamicOpacity})`;
                ctx.fill();
            }
        }

        // Create particles
        const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }

        // Also add some white/neutral particles
        const whiteCount = Math.floor(count * 0.6);
        for (let i = 0; i < whiteCount; i++) {
            const p = new Particle();
            p.drawOriginal = p.draw;
            p.draw = function() {
                const dynamicOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.pulse)) * 0.4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${dynamicOpacity})`;
                ctx.fill();
            };
            particles.push(p);
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections between close red particles
            for (let i = 0; i < count; i++) {
                for (let j = i + 1; j < count; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 69, 58, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animFrame = requestAnimationFrame(animate);
        };
        animate();
    },

    // ========================================================================
    // BENCHMARK BAR RENDERER
    // ========================================================================

    renderBenchmarkBar(value, max = 10, label, color = 'claw-primary') {
        const pct = Math.round((value / max) * 100);
        const colorMap = {
            'claw-primary': 'bg-red-500',
            'emerald': 'bg-emerald-500',
            'blue': 'bg-blue-500',
            'orange': 'bg-orange-500',
            'purple': 'bg-purple-500'
        };
        const bgColor = colorMap[color] || 'bg-red-500';

        return `
            <div class="flex items-center gap-2 text-xs">
                <span class="w-16 text-claw-muted font-medium shrink-0">${label}</span>
                <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="${bgColor} h-full rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                </div>
                <span class="w-5 text-right text-claw-muted font-mono">${value}</span>
            </div>
        `;
    },

    // ========================================================================
    // QUANTIZATION EDUCATIONAL SECTION BUILDER
    // ========================================================================

    buildQuantNameBreakdown(quantName) {
        const parts = quantName.split(/[_]/).filter(Boolean);
        let html = '';
        parts.forEach(function(part) {
            let meaning = '';
            if (part.startsWith('Q') && part.length <= 3) meaning = part.replace('Q', '') + '-bit precision';
            else if (part === 'K') meaning = 'K-quant (smart compression)';
            else if (part === 'M') meaning = 'Medium variant';
            else if (part === 'S') meaning = 'Small (more compressed)';
            else if (part === 'L') meaning = 'Large (less compressed)';
            else if (part === '0') meaning = 'Basic quantization';
            else if (part === 'fp16') meaning = '16-bit float (original)';
            if (meaning) {
                html += '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10">';
                html += '<code class="text-claw-primary font-bold">' + part + '</code>';
                html += '<span class="text-[11px]">' + meaning + '</span></span>';
            }
        });
        return html;
    },

    buildQuantComparisonRows(selectedQuant) {
        let html = '';
        const entries = Object.entries(APP_DATA.quantizations);
        entries.forEach(function(entry) {
            const k = entry[0];
            const v = entry[1];
            const isSelected = k === selectedQuant;
            const barWidth = Math.round((v.quality / 10) * 100);
            const sizeWidth = Math.round((1 - v.size_multiplier / 2) * 100);
            
            html += '<div class="flex items-center gap-3 p-2.5 rounded-lg ';
            html += isSelected ? 'bg-claw-primary/10 border border-claw-primary/30 ring-1 ring-claw-primary/10' : 'bg-white/[0.02] border border-white/5';
            html += '">';
            
            // Name column
            html += '<div class="w-20 shrink-0">';
            html += '<code class="text-xs font-bold ' + (isSelected ? 'text-claw-primary' : 'text-white') + '">' + k + '</code>';
            if (isSelected) html += '<div class="text-[9px] text-claw-primary font-bold uppercase tracking-wider mt-0.5">← Your pick</div>';
            html += '</div>';
            
            // Bars column
            html += '<div class="flex-1 space-y-1">';
            html += '<div class="flex items-center gap-2">';
            html += '<span class="text-[10px] text-claw-muted w-12 shrink-0">Quality</span>';
            html += '<div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">';
            html += '<div class="h-full rounded-full bg-blue-500" style="width: ' + barWidth + '%"></div></div>';
            html += '<span class="text-[10px] text-claw-muted font-mono w-4 text-right">' + v.quality + '</span></div>';
            html += '<div class="flex items-center gap-2">';
            html += '<span class="text-[10px] text-claw-muted w-12 shrink-0">Size</span>';
            html += '<div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">';
            html += '<div class="h-full rounded-full bg-emerald-500" style="width: ' + sizeWidth + '%"></div></div>';
            html += '<span class="text-[10px] text-claw-muted font-mono w-4 text-right">' + Math.round(v.size_multiplier * 100) + '%</span></div>';
            html += '</div>';
            
            // Label column
            html += '<div class="w-28 shrink-0 text-right hidden sm:block">';
            html += '<div class="text-[10px] ' + (isSelected ? 'text-white font-bold' : 'text-claw-muted') + '">' + v.label + '</div>';
            html += '<div class="text-[9px] text-claw-muted">' + v.bits + '-bit · ×' + v.size_multiplier + '</div>';
            html += '</div>';
            
            html += '</div>';
        });
        return html;
    },

    // ========================================================================
    // ========================================================================
    // ONE-CLICK SETUP BLOCK (Revenue Stream #8 — Stripe)
    // ========================================================================

    // Stripe Payment Links
    STRIPE_LINKS: {},   // legacy — no longer used
    TIER_PRICES:  {},   // legacy — no longer used

    // ── CTA LocalClaw Installer (remplace l'ancien One-Click Setup) ──
    buildOneClickSetupBlock(selectedModel) {
        try {
            // Lire l'OS directement depuis le state de l'app (source unique de vérité)
            const answers = this.state.answers || {};
            const osRaw = answers.os || 'mac';
            // Normalisation : 'win', 'windows' → 'win' ; tout le reste → 'mac'
            const isWindows = (osRaw === 'win' || osRaw === 'windows');

            // Windows → message d'attente
            if (isWindows) {
                return `
                <div class="ocs-card ocs-card-disabled">
                    <div class="ocs-card-inner">
                        <div class="ocs-header">
                            <span class="ocs-icon">
                                <svg class="lc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            </span>
                            <span class="ocs-title">LocalClaw Installer — macOS only for now</span>
                        </div>
                        <p class="ocs-desc">The LocalClaw Installer is currently macOS only. Windows support is coming soon.</p>
                    </div>
                </div>`;
            }

            // macOS / Linux → CTA vers pricing.html
            return `
            <div class="ocs-card" onclick="window.location.href='pricing.html'" role="button" tabindex="0" aria-label="Get LocalClaw Installer">
                <div class="ocs-card-inner">
                    <div class="ocs-header">
                        <span class="ocs-icon">
                            <svg class="lc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        </span>
                        <span class="ocs-title">Optional LocalClaw Installer — Run AI locally in minutes</span>
                    </div>
                    <div class="ocs-body">
                        <p class="ocs-desc">The web recommender is free. Upgrade only if you want the optional macOS app for one-click setup, activation and updates. No terminal needed.</p>
                    </div>
                    <div class="ocs-cta-row">
                        <div class="ocs-pricing">
                            <span class="ocs-price">$49</span>
                            <span class="ocs-price-note">one-time · optional</span>
                        </div>
                        <a class="ocs-btn" href="pricing.html" onclick="event.stopPropagation()">
                            View optional installer →
                        </a>
                    </div>
                    <div class="ocs-features">
                        <span>✓ Free recommender stays free</span>
                        <span>✓ Lifetime license</span>
                        <span>✓ No subscription</span>
                    </div>
                    <div style="margin-top:10px;padding:7px 10px;border-radius:7px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.22);font-size:10px;color:#d97706;line-height:1.5;">
                        <strong style="color:#fbbf24;">⚠ Requires macOS 13 Ventura or later</strong><br>
                        Apple Silicon or Intel · 8 GB RAM minimum · Not compatible with Windows or Linux
                    </div>
                </div>
            </div>`;
        } catch (e) {
            console.warn('LocalClaw Installer block error:', e);
            return '';
        }
    },

    // Stubs pour éviter les erreurs si appelés depuis du HTML résiduel
    saveWindowsEmail(e) { if (e) e.preventDefault(); },
    showOneClickOverlay() { window.location.href = 'pricing.html'; },
    closeOneClickOverlay() {},
    selectTier() {},
    handlePurchase() { window.location.href = 'pricing.html'; },

    // ========================================================================
    // UPGRADE HARDWARE BLOCK (Amazon Affiliate — conditional)
    // ========================================================================
    buildUpgradeBlock() {
        const answers = this.state.answers;
        let ramLimit = 8;
        if (this.state.activeFlow === 'guided') {
            const ramMap = { light: 8, standard: 16, power: 32, beast: 64 };
            ramLimit = ramMap[answers.level] || 8;
        } else if (this.state.activeFlow === 'quick') {
            ramLimit = answers.ram === 'unknown' ? 8 : parseInt(answers.ram);
        } else if (this.state.activeFlow === 'pro') {
            ramLimit = answers.parsedRam || 16;
        }

        // Only show for 8GB and 16GB
        if (ramLimit > 16) return '';

        const AMZ_TAG = 'localclaw-20';
        const amzLink = (asin) => 'https://www.amazon.com/dp/' + asin + '?tag=' + AMZ_TAG;
        const productLink = (product) => product.amazonUrl || amzLink(product.asin);

        // Determine OS for showing Mac vs PC options
        const isMac = answers.os === 'mac' || (this.state.activeFlow === 'guided' && answers.os === 'mac');
        const isWindows = answers.os === 'windows' || answers.os === 'linux';

        let upgradeTitle, upgradeText, unlockText, products;

        if (ramLimit <= 8) {
            upgradeTitle = 'Unlock Bigger Models';
            upgradeText = 'Your 8GB limits you to 8B parameter models. With more RAM, you could run much more powerful AI:';
            unlockText = 'Qwen 3 14B, DeepSeek R1 14B, Gemma 3 12B';
            products = [
                { name: 'Apple Mac Mini M4 16GB', amazonUrl: 'https://www.amazon.com/s?k=Apple+Mac+mini+M4+16GB+256GB&tag=localclaw-20', price: 'from $499', badge: 'Best Mac Option', show: true },
                { name: 'Beelink Mini PC 16GB', asin: 'B08XBVXNFP', price: 'from $199', badge: 'Budget PC', show: !isMac }
            ];
        } else {
            // 16GB
            upgradeTitle = 'Go Beyond 14B Models';
            upgradeText = 'With 16GB, you run great 14B models. But 24-32GB unlocks the real powerhouses:';
            unlockText = 'Qwen 3 32B, DeepSeek R1 32B, QwQ 32B';
            products = [
                { name: 'Mac Mini M4 Pro 24GB', amazonUrl: 'https://www.amazon.com/s?k=Apple+Mac+mini+M4+Pro+24GB+512GB&tag=localclaw-20', price: 'from $1,399', badge: 'Best Mac Option', show: true },
                { name: 'NVIDIA RTX 4060 Ti 16GB', asin: 'B0CBK7H19M', price: 'from $399', badge: 'Best GPU', show: !isMac }
            ];
        }

        const productCards = products.filter(p => p.show).map(p => `
            <a href="${productLink(p)}" target="_blank" rel="noopener sponsored" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,153,0,0.03);border:1px solid rgba(255,153,0,0.08);text-decoration:none;color:inherit;transition:all .2s;margin-bottom:6px;" onmouseover="this.style.borderColor='rgba(255,153,0,0.25)';this.style.background='rgba(255,153,0,0.06)'" onmouseout="this.style.borderColor='rgba(255,153,0,0.08)';this.style.background='rgba(255,153,0,0.03)'">
                <span style="font-size:10px;padding:2px 6px;background:rgba(255,153,0,0.12);color:#FF9900;border-radius:5px;font-weight:700;flex-shrink:0;white-space:nowrap;">${p.badge}</span>
                <span style="flex:1;min-width:0;"><span style="font-size:12px;font-weight:600;color:rgba(255,255,255,.9);display:block;">${p.name}</span><span style="font-size:11px;color:#a1a1aa;">${p.price}</span></span>
                <span style="padding:5px 10px;border-radius:7px;background:#FF9900;color:#111;font-size:10px;font-weight:700;flex-shrink:0;white-space:nowrap;">View on Amazon →</span>
            </a>
        `).join('');

        return `
            <div class="claw-card rounded-xl p-6 relative overflow-hidden" style="border-color:rgba(255,153,0,0.2);background:linear-gradient(145deg, rgba(255,153,0,0.04) 0%, rgba(255,153,0,0.01) 100%);">
                <div class="absolute top-0 left-0 w-1 h-full" style="background:#FF9900;"></div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                    <span style="font-size:16px;color:#FF9900;"><svg class="lc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0m3 7v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"/></svg></span>
                    <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#FF9900;font-weight:700;">${upgradeTitle}</h3>
                </div>
                <p style="font-size:13px;color:#a1a1aa;margin-bottom:6px;line-height:1.6;">${upgradeText}</p>
                <p style="font-size:12px;color:#fff;margin-bottom:14px;font-weight:600;">→ ${unlockText}</p>
                ${productCards}
                <p style="font-size:9px;color:rgba(161,161,170,0.5);margin-top:8px;line-height:1.4;">As an Amazon Associate, LocalClaw earns from qualifying purchases.</p>
            </div>
        `;
    },

    buildQuantSection(topPick) {
        const q = APP_DATA.quantizations[topPick.recommended_quant];
        if (!q) return '';

        const nameBreakdown = this.buildQuantNameBreakdown(topPick.recommended_quant);
        const comparisonRows = this.buildQuantComparisonRows(topPick.recommended_quant);
        const explainer = APP_DATA.quantExplainer || {};

        let tradeoffHtml = '';
        if (q.tradeoff) {
            tradeoffHtml = '<div class="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2">' +
                '<span class="text-emerald-400 text-sm mt-0.5">✓</span>' +
                '<p class="text-emerald-300/80 text-xs leading-relaxed"><strong class="text-emerald-300">Why ' + topPick.recommended_quant + '?</strong> ' + q.tradeoff + '</p></div>';
        }

        return '<details class="claw-card rounded-xl p-6 cursor-pointer group" open>' +
            '<summary class="text-sm font-bold text-white flex items-center justify-between list-none">' +
                '<span class="flex items-center gap-2">' +
                    '<svg class="w-4 h-4 text-claw-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
                    'Understanding "' + topPick.recommended_quant + '" — What does it mean?' +
                '</span>' +
                '<svg class="w-4 h-4 text-claw-muted group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>' +
            '</summary>' +
            '<div class="mt-5 text-sm text-claw-muted leading-relaxed space-y-5">' +
                // Quick explanation
                '<div class="p-4 rounded-lg bg-black/40 border border-white/5">' +
                    '<p class="text-white font-semibold mb-2"><svg class="lc-icon lc-icon-lg" style="color:#FF453A" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> Quick Explanation</p>' +
                    '<p>' + q.desc + '</p>' +
                '</div>' +
                // Breaking down the name
                '<div class="p-4 rounded-lg bg-claw-primary/5 border border-claw-primary/10">' +
                    '<p class="text-white font-semibold mb-3"><svg class="lc-icon lc-icon-lg" style="color:#FF453A" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Breaking Down the Name</p>' +
                    '<p class="mb-3">' + (q.explained || '') + '</p>' +
                    '<div class="flex flex-wrap gap-2 mt-3">' + nameBreakdown + '</div>' +
                '</div>' +
                // Analogy
                '<div class="p-4 rounded-lg bg-white/[0.02] border border-white/5">' +
                    '<p class="text-white font-semibold mb-2"><svg class="lc-icon lc-icon-lg" style="color:#FBBF24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6m-5 3h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg> Simple Analogy</p>' +
                    '<p>' + (explainer.analogy || 'Think of quantization like JPEG compression for images.') + '</p>' +
                '</div>' +
                // Visual comparison
                '<div>' +
                    '<p class="text-white font-semibold mb-3"><svg class="lc-icon lc-icon-lg" style="color:#60A5FA" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> All Quantization Levels Compared</p>' +
                    '<div class="space-y-2">' + comparisonRows + '</div>' +
                '</div>' +
                tradeoffHtml +
            '</div>' +
        '</details>';
    },

    // ========================================================================
    // RENDER DISPATCHER
    // ========================================================================

    render() {
        const container = document.getElementById('view-container');
        if (!container) return;

        // Clean up typewriter when leaving hero
        if (this._twTimer) { clearTimeout(this._twTimer); this._twTimer = null; }

        container.innerHTML = '';
        container.className = 'w-full max-w-6xl mx-auto opacity-0 translate-y-4 transition-all duration-500 ease-out';

        setTimeout(() => {
            container.classList.remove('opacity-0', 'translate-y-4');
        }, 50);

        switch (this.state.view) {
            case 'hero': this.renderHero(container); break;
            case 'flow': this.renderFlowStep(container); break;
            case 'pro-input': this.renderProInput(container); break;
            case 'results': this.renderResults(container); break;
            case 'compare': this.renderCompare(container); break;
            case 'faq': this.renderFAQ(container); break;
        }

        // Scroll to top on view change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ========================================================================
    // HERO VIEW
    // ========================================================================

    renderHero(container) {
        const icon = (paths) => `<svg class="w-6 h-6 text-claw-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
        const features = [
            ['Smart Hardware Matching', 'RAM, GPU, OS → perfect model. No guesswork.', icon('<path d="M12 3v3m0 12v3M3 12h3m12 0h3"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>')],
            ['183+ LLM Database', 'Llama 4, Qwen 3.5, DeepSeek R1, Gemma 4 — always updated.', icon('<path d="M4 7c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2z"/><path d="M4 7v5c0 1.1 3.6 2 8 2s8-.9 8-2V7"/><path d="M4 12v5c0 1.1 3.6 2 8 2s8-.9 8-2v-5"/>')],
            ['47 TTS/ASR Models', 'Voice cloning, speech-to-text, 99 languages — all offline.', icon('<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v3"/><path d="M8 21h8"/>')],
            ['Zero Data Collection', 'Runs in your browser. No tracking, no cloud, no API calls.', icon('<path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"/><path d="M9 12l2 2 4-4"/>')],
            ['macOS One-Click Install', 'Native installer: LM Studio + models, no terminal needed. $49.', icon('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 18v3"/><path d="M12 8v6"/><path d="M9 11l3 3 3-3"/>')],
            ['RAM-Optimized Picks', 'From 8 GB laptops to 128 GB workstations — matched to your tier.', icon('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>')]
        ];
        const latestModels = [
            ['DeepSeek V4 Pro', '1.6T MoE · 49B active · MIT', 'models/deepseek-v4-pro.html', 'Frontier', 'border-sky-500/30 bg-sky-500/5 text-sky-400'],
            ['GLM-5.1', 'Agentic engineering · repo work · MIT', 'models/glm-5.1.html', 'Agentic', 'border-claw-primary/30 bg-claw-primary/5 text-claw-primary'],
            ['MiMo-V2.5-Pro', '1M context · 42B active · MIT', 'models/mimo-v2.5-pro.html', 'Long context', 'border-violet-500/30 bg-violet-500/5 text-violet-400'],
            ['Kimi Linear 48B-A3B', '3B active · efficient reasoning', 'models/kimi-linear-48b-a3b-instruct.html', 'Efficient', 'border-amber-500/30 bg-amber-500/5 text-amber-400'],
            ['Nemotron Nano 9B v2', 'Hybrid reasoning · laptop friendly', 'models/nemotron-nano-9b-v2.html', 'Local', 'border-blue-500/30 bg-blue-500/5 text-blue-400'],
            ['NeuTTS Air', 'Real-time CPU TTS · voice cloning', 'tts/neutts-air.html', 'Voice', 'border-pink-500/30 bg-pink-500/5 text-pink-400']
        ];

        container.innerHTML = `
            <section class="relative pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 text-center">
                <div class="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-claw-primary/40 bg-claw-primary/10 text-claw-primary rounded-full text-[11px] sm:text-xs font-mono font-bold tracking-[0.18em] uppercase shadow-[0_0_30px_rgba(255,69,58,0.12)]">
                    <span class="lc-fresh-dot w-2 h-2 rounded-full bg-claw-primary"></span>
                    183 LLMs + 47 TTS/ASR — Updated May 2026
                </div>
                <h1 class="mx-auto max-w-5xl text-[clamp(2.5rem,7vw,4.5rem)] font-display font-bold leading-[0.95] tracking-tight text-white uppercase">
                    Match Your Hardware to the <span class="text-claw-primary">Right</span> Local AI
                </h1>
                <p class="mx-auto mt-5 max-w-3xl text-base sm:text-lg text-claw-muted font-mono leading-relaxed">
                    Tell us your RAM, GPU and OS. Get personalized model recommendations — instantly, privately, for free.
                </p>
                <div class="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button onclick="App.startFlow('guided')" class="w-full sm:w-auto px-8 py-4 bg-claw-primary hover:bg-white hover:text-black text-white font-mono font-bold text-base transition-all shadow-[4px_4px_0px_0px_rgba(255,69,58,0.22)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] hover:-translate-y-0.5 uppercase tracking-tight">Find My Model — Free</button>
                    <a href="pricing.html" class="w-full sm:w-auto px-8 py-4 bg-black/40 border border-white/25 hover:border-claw-primary text-white hover:text-claw-primary font-mono font-bold text-base transition-all hover:bg-white/5 uppercase tracking-tight">macOS Installer — $49</a>
                </div>
                <p class="mt-4 text-xs sm:text-[13px] text-claw-muted font-mono">No signup. No data collected. Runs in your browser.</p>

                <div class="lc-hero-mockup mx-auto mt-10 max-w-6xl overflow-hidden rounded-2xl border border-claw-primary/25 bg-[#0d0d0d] text-left shadow-[0_30px_120px_rgba(0,0,0,0.65),0_0_70px_rgba(255,69,58,0.12)]">
                    <div class="relative flex items-center justify-between border-b border-[#2a2a2a] bg-[#151515] px-4 py-3">
                        <div class="flex items-center gap-2" aria-hidden="true"><span class="w-3 h-3 rounded-full bg-[#ff5f57]"></span><span class="w-3 h-3 rounded-full bg-[#ffbd2e]"></span><span class="w-3 h-3 rounded-full bg-[#28c840]"></span></div>
                        <div class="absolute left-1/2 -translate-x-1/2 font-mono text-xs text-claw-muted">LocalClaw v1.0</div>
                        <div class="hidden sm:block font-mono text-[10px] text-claw-primary uppercase tracking-widest">Local LLM</div>
                    </div>
                    <div class="grid lg:grid-cols-[210px_1fr]">
                        <aside class="border-b lg:border-b-0 lg:border-r border-[#2a2a2a] bg-[#090909] p-4 font-mono text-[11px]">
                            <div class="mb-3 text-[10px] uppercase tracking-[0.18em] text-claw-muted">Navigation</div>
                            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
                                <div class="rounded-md bg-claw-primary px-3 py-2 font-bold text-white">● Home</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Install</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Updates</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Control Center</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">OpenClaw Chat <span class="ml-1 rounded border border-claw-primary/40 px-1 text-[9px] text-claw-primary">BETA</span></div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Developer <span class="ml-1 rounded border border-claw-primary/40 px-1 text-[9px] text-claw-primary">BETA</span></div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Models</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Skills</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Channels <span class="ml-1 rounded border border-claw-primary/40 px-1 text-[9px] text-claw-primary">BETA</span></div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Agents</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Cron Jobs</div>
                                <div class="rounded-md bg-[#1a1a1a] px-3 py-2 text-claw-muted">Kanban</div>
                            </div>
                            <div class="mt-4 border-t border-[#333] pt-4">
                                <div class="text-[10px] uppercase tracking-[0.18em] text-claw-muted">OpenClaw Version</div>
                                <div class="mt-2 flex items-center justify-between text-base font-bold text-white"><span>v2026.5.22</span><span class="h-2.5 w-2.5 rounded-full bg-[#22c55e]"></span></div>
                                <div class="mt-3 text-claw-muted">Machine: <span class="text-white">Apple M2 Max</span></div>
                                <div class="text-claw-muted">32 GB · macOS</div>
                            </div>
                        </aside>
                        <div class="p-4 sm:p-5 font-mono">
                            <div class="mb-4 flex flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#151515] p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-claw-primary text-xs font-black text-white">LC</div>
                                    <div>
                                        <div class="text-base font-bold text-white">LocalClaw</div>
                                        <div class="text-[11px] text-claw-muted">Version 1.0.140 (build 285)</div>
                                    </div>
                                </div>
                                <span class="w-fit rounded-md border border-claw-primary/35 bg-claw-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-claw-primary">Local LLM</span>
                            </div>
                            <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <div class="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"><div class="text-lg font-bold text-white">Online</div><div class="mt-1 text-[11px] text-claw-muted">Gateway</div></div>
                                <div class="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"><div class="text-lg font-bold text-white">Healthy</div><div class="mt-1 text-[11px] text-claw-muted">System</div></div>
                                <div class="rounded-xl border border-claw-primary/35 bg-[#1a1a1a] p-4"><div class="text-lg font-bold text-white">299.2K</div><div class="mt-1 text-[11px] text-claw-muted">Tokens used</div></div>
                                <div class="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"><div class="text-lg font-bold text-white">1 active</div><div class="mt-1 text-[11px] text-claw-muted">Channels</div></div>
                            </div>
                            <div class="mt-4 rounded-xl border border-[#333] bg-[#1a1a1a] p-4">
                                <div class="flex flex-wrap gap-2 text-[11px] font-bold text-claw-muted">
                                    <span><span class="mr-1 inline-block h-2 w-2 rounded-full bg-[#22c55e]"></span>Gateway</span>
                                    <span><span class="mr-1 inline-block h-2 w-2 rounded-full bg-[#22c55e]"></span>Chat</span>
                                    <span><span class="mr-1 inline-block h-2 w-2 rounded-full bg-[#22c55e]"></span>Model</span>
                                    <span><span class="mr-1 inline-block h-2 w-2 rounded-full bg-[#22c55e]"></span>Channel</span>
                                    <span><span class="mr-1 inline-block h-2 w-2 rounded-full bg-[#22c55e]"></span>Skill</span>
                                </div>
                            </div>
                            <div class="mt-4 rounded-xl border border-[#333] bg-[#1a1a1a] p-4">
                                <div class="mb-3 text-sm font-bold text-white">System Load</div>
                                <div class="space-y-3 text-[11px]">
                                    <div><div class="mb-1 flex justify-between text-claw-muted"><span>CPU</span><span>38%</span></div><div class="h-2 rounded-full bg-[#333]"><div class="h-full w-[38%] rounded-full bg-claw-primary"></div></div></div>
                                    <div><div class="mb-1 flex justify-between text-claw-muted"><span>RAM</span><span>31.3 / 32.0 GB</span></div><div class="h-2 rounded-full bg-[#333]"><div class="h-full w-[98%] rounded-full bg-claw-primary"></div></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mb-20">
                <h2 class="text-center text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight mb-8">Three ways to find your model</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${[
                        ['01', 'Guided Mode', 'Answer 3 questions. We handle the complexity.', 'MacBook Air 8 GB → Qwen 3 8B'],
                        ['02', 'Quick Spec', 'Select RAM, GPU, priorities. Instant match.', '32 GB + RTX 4090 → DeepSeek R1 32B'],
                        ['03', 'Terminal', 'Paste your system info. Auto-detect & match.', 'Paste neofetch → auto-config']
                    ].map(([num, title, desc, example]) => `
                        <article class="rounded-xl border border-white/10 bg-white/[0.025] p-6 hover:border-claw-primary/35 transition-colors">
                            <div class="text-4xl font-display font-bold text-claw-primary/80 mb-4">${num}</div>
                            <h3 class="text-lg font-display font-bold text-white mb-2">${title}</h3>
                            <p class="text-sm text-claw-muted leading-relaxed mb-4">${desc}</p>
                            <p class="text-xs font-mono text-claw-muted">${example}</p>
                        </article>
                    `).join('')}
                </div>
            </section>

            <section class="mb-20">
                <h2 class="text-center text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight mb-8">What LocalClaw does for you</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${features.map(([title, desc, svg]) => `
                        <article class="rounded-xl border border-white/10 bg-[#0d0d0d] p-6 hover:border-claw-primary/35 transition-colors">
                            <div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-claw-primary/25 bg-claw-primary/10">${svg}</div>
                            <h3 class="text-lg font-display font-bold text-white mb-2">${title}</h3>
                            <p class="text-sm text-claw-muted leading-relaxed">${desc}</p>
                        </article>
                    `).join('')}
                </div>
            </section>

            <section class="mb-20">
                <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 class="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-tight">Latest models worth testing</h2>
                        <p class="mt-2 text-sm text-claw-muted font-mono">A compact snapshot of the newest useful local AI picks.</p>
                    </div>
                    <a href="llm-list.html" class="text-sm font-mono text-claw-primary hover:text-white uppercase tracking-wider">See all 183 models →</a>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${latestModels.map(([name, meta, href, tag, classes]) => `
                        <a href="${href}" class="group rounded-xl border ${classes} p-5 transition-all hover:-translate-y-0.5 hover:border-white/30">
                            <div class="flex items-center justify-between gap-3 mb-4"><span class="font-mono text-[10px] uppercase tracking-[0.18em]">${tag}</span><span class="text-claw-muted group-hover:text-white transition-colors">→</span></div>
                            <h3 class="text-lg font-display font-bold text-white mb-2">${name}</h3>
                            <p class="text-xs font-mono text-claw-muted leading-relaxed">${meta}</p>
                        </a>
                    `).join('')}
                </div>
            </section>

            <section class="mb-16">
                <div class="rounded-2xl border border-claw-primary/25 bg-gradient-to-br from-claw-primary/10 via-white/[0.025] to-black p-8 sm:p-12 text-center">
                    <h2 class="text-3xl sm:text-4xl font-display font-bold text-white uppercase tracking-tight mb-3">Find your perfect model in 30 seconds</h2>
                    <p class="text-claw-muted font-mono mb-7">Free. Private. No signup required.</p>
                    <button onclick="App.startFlow('guided')" class="inline-flex items-center justify-center px-9 py-4 bg-claw-primary hover:bg-white hover:text-black text-white font-mono font-bold text-base transition-all shadow-[4px_4px_0px_0px_rgba(255,69,58,0.22)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] hover:-translate-y-0.5 uppercase tracking-tight">Find My Model</button>
                </div>
            </section>

            <div class="text-center">
                <button onclick="App.showFAQ()" class="text-claw-muted hover:text-white text-xs font-mono uppercase tracking-widest transition-colors inline-flex items-center gap-2">[ ACCESS_FAQ_DATABASE ]</button>
            </div>
        `;
        return;
    },

    // ========================================================================
    // HERO MOCKUP CAROUSEL
    // ========================================================================

    initHeroCarousel() {
        const slides = document.querySelectorAll('.hero-slide');
        const dots   = document.querySelectorAll('.hero-dot');
        if (!slides.length) return;

        const TOTAL = slides.length;
        let current = 0;
        let timer   = null;

        // Inject base styles once
        if (!document.getElementById('hero-carousel-style')) {
            const s = document.createElement('style');
            s.id = 'hero-carousel-style';
            s.textContent = `
                .hero-slide { display:none; animation: heroSlideIn 0.45s cubic-bezier(0.4,0,0.2,1) both; }
                .hero-slide.active { display:block; }
                @keyframes heroSlideIn {
                    from { opacity:0; transform: translateY(12px) scale(0.98); }
                    to   { opacity:1; transform: translateY(0)   scale(1);    }
                }
            `;
            document.head.appendChild(s);
        }

        const goTo = (idx) => {
            current = ((idx % TOTAL) + TOTAL) % TOTAL;
            slides.forEach((s, i) => s.classList.toggle('active', i === current));
            dots.forEach((d, i) => {
                d.style.width      = i === current ? '20px' : '6px';
                d.style.background = i === current ? '#FF453A' : 'rgba(255,255,255,0.2)';
            });
        };

        const next = () => goTo(current + 1);

        const startAuto = () => {
            clearInterval(timer);
            timer = setInterval(next, 5500);
        };

        dots.forEach(d => d.addEventListener('click', () => {
            goTo(parseInt(d.dataset.dot));
            startAuto();
        }));

        goTo(0);
        startAuto();
    },

    // ========================================================================
    // ANIMATED COUNTER
    // ========================================================================

    animateCounter(elementId, target, duration = 2000) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const start = performance.now();
        const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target).toLocaleString('en-US');
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target.toLocaleString('en-US');
        };
        requestAnimationFrame(step);
    },

    // ========================================================================
    // TYPEWRITER EFFECT
    // ========================================================================

    _twTimer: null,

    initTypewriter() {
        // Clear any previous typewriter
        if (this._twTimer) { clearTimeout(this._twTimer); this._twTimer = null; }

        const el = document.getElementById('typewriter-text');
        const cursor = document.getElementById('typewriter-cursor');
        if (!el || !cursor) return;

        const words = ['OpenClaw', 'local AI', 'LM Studio', 'private agents', 'beta app'];
        let wordIndex = 0;
        let charIndex = words[0].length; // Start fully typed
        let isDeleting = false;
        const typeSpeed = 110;  // ms per char typing
        const deleteSpeed = 70;  // ms per char deleting
        const pauseAfterType = 4000; // pause when word is fully typed
        const pauseAfterDelete = 600; // pause before typing next word

        // Cursor blink via CSS
        cursor.style.animation = 'cursorBlink 1s step-end infinite';

        const tick = () => {
            const currentWord = words[wordIndex];

            if (!isDeleting) {
                // Typing
                if (charIndex < currentWord.length) {
                    charIndex++;
                    el.textContent = currentWord.substring(0, charIndex);
                    this._twTimer = setTimeout(tick, typeSpeed + Math.random() * 40);
                } else {
                    // Word complete — pause then start deleting
                    this._twTimer = setTimeout(() => {
                        isDeleting = true;
                        tick();
                    }, pauseAfterType);
                }
            } else {
                // Deleting
                if (charIndex > 0) {
                    charIndex--;
                    el.textContent = currentWord.substring(0, charIndex);
                    this._twTimer = setTimeout(tick, deleteSpeed);
                } else {
                    // Fully deleted — move to next word
                    isDeleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                    this._twTimer = setTimeout(tick, pauseAfterDelete);
                }
            }
        };

        // Start after initial pause (word is already displayed)
        this._twTimer = setTimeout(() => {
            isDeleting = true;
            tick();
        }, pauseAfterType);
    },

    renderModeCard(flowId, title, desc, colorKey, label, example) {
        // SVG icons for each mode (no emoji)
        const icons = {
            'guided': `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>`,
            'quick': `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"/></svg>`,
            'pro': `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/></svg>`
        };
        const icon = icons[flowId] || '';
        const textColor = `text-${colorKey}`;

        return `
            <div onclick="App.startFlow('${flowId}')" class="p-8 border-b md:border-b-0 md:border-r border-white/20 hover:bg-white/5 transition-colors group cursor-pointer h-full flex flex-col justify-between relative">
                <div class="absolute top-6 right-6 ${textColor} opacity-20 group-hover:opacity-60 transition-opacity">${icon}</div>
                <div>
                    <div class="${textColor} mb-4 font-mono text-xs opacity-50 group-hover:opacity-100">${label}</div>
                    <h3 class="text-xl font-bold text-white mb-3 font-display uppercase tracking-tight group-hover:${textColor} transition-colors">${title}</h3>
                    <p class="text-sm text-claw-muted font-mono leading-relaxed">${desc}</p>
                    ${example ? `<p class="mt-3 text-xs font-mono ${textColor} opacity-60 group-hover:opacity-100 transition-opacity"><span class="text-claw-muted">Ex:</span> ${example}</p>` : ''}
                </div>
                <div class="mt-6 flex justify-end">
                    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs uppercase tracking-widest">[ SELECT ]</span>
                </div>
            </div>
        `;
    },

    // ========================================================================
    // FLOW STEP VIEW
    // ========================================================================

    renderFlowStep(container) {
        const step = APP_DATA.flows[this.state.activeFlow][this.state.currentStepIndex];
        const total = APP_DATA.flows[this.state.activeFlow].length;
        const progress = this.getProgressPercent();
        const isMac = this.state.answers.os === 'mac';

        let optionsHtml = step.options.map((opt, i) => {
            // Dynamic desc based on OS for the 'level' step
            const desc = (isMac && opt.macDesc) ? opt.macDesc : (opt.desc || '');

            return `
                <button onclick="App.handleOptionSelect('${step.id}', '${opt.value}')"
                    class="claw-card group flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl hover:border-claw-primary/50 transition-all text-center"
                    style="animation: fadeInUp 0.4s ${i * 0.08}s ease-out both;">
                    ${opt.icon ? `<span class="mb-4 text-claw-muted group-hover:text-claw-primary transition-colors">${opt.icon}</span>` : ''}
                    <span class="font-bold text-lg text-white mb-1">${opt.label}</span>
                    ${desc ? `<span class="text-xs text-claw-muted mt-1 font-medium leading-snug">${desc}</span>` : ''}
                </button>
            `;
        }).join('');

        container.innerHTML = `
            <div class="max-w-3xl mx-auto">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <button onclick="App.goBack()" class="text-sm text-claw-muted hover:text-white flex items-center gap-2 transition-colors group">
                        <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        Back
                    </button>
                    <span class="text-xs font-bold text-claw-primary tracking-widest uppercase">Step ${this.state.currentStepIndex + 1}/${total}</span>
                </div>

                <!-- Progress Bar -->
                <div class="w-full h-1 bg-white/5 rounded-full mb-12 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-claw-primary to-orange-500 rounded-full transition-all duration-500 ease-out" style="width: ${progress}%"></div>
                </div>

                <!-- Question -->
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center mb-3 text-white leading-tight">${step.question}</h2>
                ${step.subtitle ? `<p class="text-claw-muted text-center mb-12 text-sm">${step.subtitle}</p>` : '<div class="mb-12"></div>'}

                <!-- Options -->
                <div class="grid grid-cols-1 ${step.options.length >= 5 ? 'sm:grid-cols-3' : step.options.length > 3 ? 'sm:grid-cols-2' : 'sm:grid-cols-' + step.options.length} gap-4">
                    ${optionsHtml}
                </div>
            </div>
        `;
    },

    // ========================================================================
    // PRO INPUT VIEW
    // ========================================================================

    renderProInput(container) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <button onclick="App.goBack()" class="text-sm text-claw-muted hover:text-white flex items-center gap-2 group">
                        <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        Back
                    </button>
                    <span class="text-xs font-bold text-emerald-500 tracking-widest uppercase border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-500/10">Pro Mode</span>
                </div>

                <h2 class="text-3xl font-display font-bold mb-3 text-white">System Diagnostic</h2>
                <p class="text-claw-muted mb-8 leading-relaxed">Run one of these commands to grab your hardware specs, then paste the output below.</p>

                <!-- Command Tabs -->
                <div class="flex gap-2 mb-4">
                    <button data-command='system_profiler SPHardwareDataType | egrep "Model Name|Model Identifier|Chip|Total Number of Cores|Memory"'
                        class="cmd-tab text-xs px-3 py-1.5 rounded-lg border border-white/10 text-claw-muted hover:text-white transition-colors bg-white/10 text-white">macOS</button>
                    <button data-command='systeminfo | findstr /C:"Total Physical Memory" /C:"OS Name" && wmic path win32_VideoController get name,adapterram'
                        class="cmd-tab text-xs px-3 py-1.5 rounded-lg border border-white/10 text-claw-muted hover:text-white transition-colors">Windows</button>
                    <button data-command='uname -a && grep MemTotal /proc/meminfo && lspci | grep -i vga && nvidia-smi 2>/dev/null | head -10'
                        class="cmd-tab text-xs px-3 py-1.5 rounded-lg border border-white/10 text-claw-muted hover:text-white transition-colors">Linux</button>
                </div>

                <div class="cmd-block bg-black rounded-xl p-5 font-mono text-sm text-emerald-400 mb-8 flex justify-between items-start border border-claw-border gap-3">
                    <code class="break-all leading-relaxed">system_profiler SPHardwareDataType | egrep "Model Name|Model Identifier|Chip|Total Number of Cores|Memory"</code>
                    <button onclick="App.copyToClipboard(this.previousElementSibling.textContent, 'Command')" class="text-xs bg-claw-surface border border-claw-border px-3 py-2 rounded-lg hover:bg-white/10 text-white transition-colors shrink-0">Copy</button>
                </div>

                <textarea id="pro-input-text" class="w-full h-48 bg-claw-surface border border-claw-border rounded-xl p-5 text-sm font-mono text-claw-muted focus:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all mb-6 resize-none placeholder-white/15" placeholder="// Paste your terminal output here...&#10;// We'll detect OS, RAM, and GPU automatically"></textarea>

                <button onclick="App.parseProInput(document.getElementById('pro-input-text').value)" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    Analyze & Recommend
                </button>
            </div>
        `;

        const tabButtons = container.querySelectorAll('.cmd-tab');
        const codeEl = container.querySelector('.cmd-block code');
        const setActiveTab = (btn) => {
            tabButtons.forEach((tab) => tab.classList.remove('bg-white/10', 'text-white'));
            btn.classList.add('bg-white/10', 'text-white');
            codeEl.textContent = btn.dataset.command;
        };

        tabButtons.forEach((btn) => btn.addEventListener('click', () => setActiveTab(btn)));
        if (tabButtons.length) {
            setActiveTab(tabButtons[0]);
        }
    },

    // ========================================================================
    // RESULTS VIEW
    // ========================================================================

    // Build the left instruction panel for a given model
    buildLeftPanel(selectedModel, selectedIdx) {
        return `
                    <div>
                        <button onclick="App.goBack()" class="text-sm text-claw-muted hover:text-white mb-6 flex items-center gap-2 group">
                            <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                            Start Over
                        </button>
                        <h2 class="text-3xl sm:text-4xl font-display font-bold mb-1 text-white">Your Setup Guide</h2>
                        <p class="text-claw-primary text-sm font-semibold mb-3">${selectedModel.name} <span class="text-claw-muted font-normal">${selectedModel.params}</span>${selectedModel._risk ? ` <span class="text-[10px] ml-2 px-2 py-0.5 rounded-full font-bold ${selectedModel._risk.color === 'green' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : selectedModel._risk.color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}"><svg class='lc-icon lc-icon-sm' viewBox='0 0 24 24'><circle cx='12' cy='12' r='6' fill='currentColor'/></svg> ${selectedModel._risk.label}</span>` : ''}</p>
                        <p class="text-claw-muted leading-relaxed text-sm">${selectedModel.description}</p>
                    </div>

                    <!-- LocalClaw Installer CTA — affiché immédiatement sous le titre -->
                    ${this.buildOneClickSetupBlock(selectedModel)}

                    <!-- Step 1 -->
                    <div class="claw-card rounded-xl p-6 relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-1 h-full bg-white/10"></div>
                        <div class="flex items-center gap-3 mb-3">
                            <span class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">1</span>
                            <h3 class="text-xs uppercase tracking-widest text-claw-muted font-bold">Get LM Studio</h3>
                        </div>
                        <p class="text-sm text-claw-muted mb-4 leading-relaxed">Download and install LM Studio for your operating system.</p>
                        <a href="https://lmstudio.ai" target="_blank" class="inline-flex items-center justify-center w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-lg font-medium transition-all gap-2 text-sm">
                            Download LM Studio
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                    </div>

                    <!-- Step 2 -->
                    <div class="claw-card rounded-xl p-6 relative overflow-hidden border-claw-primary/30 bg-claw-primary/[0.03]">
                        <div class="absolute top-0 left-0 w-1 h-full bg-claw-primary"></div>
                        <div class="flex items-center gap-3 mb-3">
                            <span class="w-7 h-7 rounded-full bg-claw-primary/20 flex items-center justify-center text-xs font-bold text-claw-primary">2</span>
                            <h3 class="text-xs uppercase tracking-widest text-claw-primary font-bold">Search & Download</h3>
                        </div>
                        <ol class="list-decimal list-inside text-sm text-claw-muted space-y-2.5 leading-relaxed">
                            <li>Open LM Studio → <strong class="text-white">Search</strong> tab</li>
                            <li>Search: <code class="text-claw-primary bg-black/50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-black/80 transition-colors" onclick="App.copyToClipboard('${selectedModel.search_term}', 'Search term')">${selectedModel.search_term}</code></li>
                            <li>Find the quantization: <code class="text-white bg-claw-primary/20 px-1.5 py-0.5 rounded border border-claw-primary/30 font-bold">${selectedModel.recommended_quant}</code></li>
                            <li>Click <strong class="text-white">Download</strong>, then <strong class="text-white">Load</strong></li>
                        </ol>
                    </div>

                    <!-- Step 3 -->
                    <div class="claw-card rounded-xl p-6 relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                        <div class="flex items-center gap-3 mb-3">
                            <span class="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">3</span>
                            <h3 class="text-xs uppercase tracking-widest text-emerald-400 font-bold">Start Chatting!</h3>
                        </div>
                        <p class="text-sm text-claw-muted leading-relaxed">Go to the Chat tab and start talking to your local AI. No internet needed. Your data stays on your machine.</p>
                    </div>

                    <!-- One-Click Setup supprimé ici — remonté au-dessus des steps -->

                    <!-- Upgrade Hardware (conditional: 8GB / 16GB only) -->
                    ${this.buildUpgradeBlock()}

                    <!-- Quantization Info — Educational -->
                    ${this.buildQuantSection(selectedModel)}
        `;
    },

    renderResults(container) {
        const selectedIdx = this.state.selectedModelIndex || 0;
        // Clamp index
        if (selectedIdx >= this.state.recommendations.length) this.state.selectedModelIndex = 0;
        const selectedModel = this.state.recommendations[this.state.selectedModelIndex] || this.state.recommendations[0];
        if (!selectedModel) return;

        const recCards = this.state.recommendations.map((model, idx) => {
            const isCompared = this.state.compareList.includes(model.id);
            const isSelected = idx === this.state.selectedModelIndex;
            const isTopPick = idx === 0;
            return `
                <div class="claw-card rounded-xl p-6 relative overflow-hidden group cursor-pointer transition-all duration-200 hover:border-claw-primary/30 ${isSelected ? 'ring-1 ring-claw-primary/40 border-claw-primary/40' : ''}" 
                     data-model-card="${idx}"
                     onclick="App.selectModel(${idx})" 
                     style="animation: fadeInUp 0.5s ${idx * 0.1}s ease-out both;">
                    ${isTopPick ? '<div class="absolute top-0 right-0 bg-gradient-to-l from-claw-primary to-orange-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl tracking-widest"><svg class=\'lc-icon lc-icon-sm\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2m12 6h2a2 2 0 002-2V5a2 2 0 00-2-2h-2M6 3h12v7a6 6 0 01-12 0V3zm3 18h6m-3-4v4\'/></svg> TOP PICK</div>' : ''}
                    <div class="absolute top-0 right-0 ${isSelected && !isTopPick ? '' : 'hidden'} bg-gradient-to-l from-claw-primary/80 to-orange-600/80 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest" data-selected-badge>✓ SELECTED</div>
                    
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white flex items-center gap-3">
                                <a href="models/${model.id}.html" class="hover:text-claw-primary transition-colors" onclick="event.stopPropagation()" title="View full details">${model.name}</a>
                                <span class="text-xs font-mono text-claw-muted font-normal">${model.params}</span>
                            </h3>
                            <div class="flex flex-wrap gap-1.5 mt-3">
                                ${model.tags.slice(0, 5).map(t => `<span class="text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-claw-muted">${t}</span>`).join('')}
                                ${model._risk ? `<span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${model._risk.color === 'green' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : model._risk.color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}"><svg class='lc-icon lc-icon-sm' viewBox='0 0 24 24'><circle cx='12' cy='12' r='6' fill='currentColor'/></svg> ${model._risk.label}</span>` : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-mono text-white font-bold">${model.size_gb}<span class="text-xs text-claw-muted font-normal ml-1">GB</span></div>
                            <div class="text-[10px] text-claw-muted">min ${model.min_ram} GB RAM</div>
                        </div>
                    </div>

                    <p class="text-sm text-claw-muted mb-5 leading-relaxed">${model.description}</p>

                    <!-- Benchmarks -->
                    <div class="space-y-1.5 mb-5">
                        ${this.renderBenchmarkBar(model.benchmarks?.speed || 5, 10, 'Speed', 'emerald')}
                        ${this.renderBenchmarkBar(model.benchmarks?.quality || 5, 10, 'Quality', 'blue')}
                        ${this.renderBenchmarkBar(model.benchmarks?.coding || 5, 10, 'Coding', 'orange')}
                        ${this.renderBenchmarkBar(model.benchmarks?.reasoning || 5, 10, 'Reason', 'purple')}
                    </div>

                    <!-- Why this pick -->
                    ${model._why && model._why.length > 0 ? `
                    <div class="mb-5 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div class="text-[10px] uppercase tracking-widest text-claw-muted font-bold mb-1.5"><svg class='lc-icon lc-icon-sm' style='color:#FBBF24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M9 18h6m-5 3h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z'/></svg> Why this pick</div>
                        <ul class="text-[11px] text-claw-muted leading-relaxed space-y-0.5">
                            ${model._why.map(r => `<li>• ${r}</li>`).join('')}
                        </ul>
                    </div>` : ''}

                    <!-- Actions -->
                    <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                        <div class="flex-grow bg-black/60 border border-white/5 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:border-claw-primary/30 transition-colors" onclick="App.copyToClipboard('${model.search_term}', '${model.name}')">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-claw-muted uppercase">Search in LM Studio</span>
                                <code class="text-xs text-claw-primary font-mono">${model.search_term}</code>
                            </div>
                            <svg class="h-4 w-4 text-claw-muted shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                        <div class="bg-claw-primary/10 border border-claw-primary/20 rounded-lg p-2 flex flex-col items-center justify-center w-16 shrink-0" title="Recommended Quantization">
                            <span class="text-[9px] text-claw-primary uppercase font-bold">Quant</span>
                            <span class="text-xs text-white font-mono font-bold">${model.recommended_quant}</span>
                        </div>
                        <a href="models/${model.id}.html" class="p-2 rounded-lg border border-white/10 text-claw-muted hover:text-claw-primary hover:border-claw-primary/30 transition-all h-[52px] w-10 flex items-center justify-center shrink-0" title="View full details">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </a>
                        <button onclick="App.toggleCompare('${model.id}')" class="p-2 rounded-lg border ${isCompared ? 'border-claw-primary bg-claw-primary/20 text-claw-primary' : 'border-white/10 text-claw-muted hover:text-white hover:border-white/20'} transition-all h-[52px] w-10 flex items-center justify-center shrink-0" title="Compare">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                <!-- Left: Instructions (dynamic based on selected model) -->
                <div class="lg:col-span-5 space-y-6 lg:sticky lg:top-24" id="results-left-panel">
                    ${this.buildLeftPanel(selectedModel, this.state.selectedModelIndex)}
                </div>

                <!-- Right: Recommendations -->
                <div class="lg:col-span-7 flex flex-col gap-4">
                    <div class="flex items-center justify-between mb-1">
                        <h3 class="text-sm uppercase tracking-widest text-claw-muted font-bold">Top Recommendations</h3>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-claw-muted/50">Click a card to select</span>
                            ${this.state.compareList.length >= 2 ? `
                                <button onclick="App.showCompare()" class="text-xs px-3 py-1.5 bg-claw-primary/10 border border-claw-primary/30 text-claw-primary rounded-full hover:bg-claw-primary/20 transition-colors font-bold flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                    Compare (${this.state.compareList.length})
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${recCards}
                    ${this.state._contextNote ? `
                    <div class="mt-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-2">
                        <span class="text-yellow-400 text-sm mt-0.5"><svg class='lc-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'/></svg></span>
                        <p class="text-[11px] text-yellow-200/80 leading-relaxed"><strong>Long context uses much more memory (KV cache).</strong> At 16K+ tokens, the KV cache can add 20-50% extra RAM on top of the model size. If you experience slowdowns, reduce context length in LM Studio settings.</p>
                    </div>` : ''}
                </div>
            </div>
        `;
    },

    // ========================================================================
    // COMPARE VIEW
    // ========================================================================

    renderCompare(container) {
        const models = this.state.compareList.map(id => APP_DATA.models.find(m => m.id === id)).filter(Boolean);
        
        if (models.length < 2) {
            this.showToast('Select at least 2 models to compare', 'error');
            this.goBack();
            return;
        }

        const benchmarkKeys = ['speed', 'quality', 'coding', 'reasoning'];
        const benchmarkColors = { speed: '#10b981', quality: '#3b82f6', coding: '#f97316', reasoning: '#a855f7' };

        container.innerHTML = `
            <div class="max-w-5xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <button onclick="App.goBack()" class="text-sm text-claw-muted hover:text-white flex items-center gap-2 group">
                        <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        Back to Results
                    </button>
                    <h2 class="text-lg font-display font-bold text-white">Model Comparison</h2>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-white/10">
                                <th class="text-left py-4 px-3 text-claw-muted font-medium text-xs uppercase tracking-wider">Property</th>
                                ${models.map(m => `<th class="text-center py-4 px-3 text-white font-bold">${m.name}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-white/5">
                                <td class="py-3 px-3 text-claw-muted">Parameters</td>
                                ${models.map(m => `<td class="text-center py-3 px-3 text-white font-mono">${m.params}</td>`).join('')}
                            </tr>
                            <tr class="border-b border-white/5">
                                <td class="py-3 px-3 text-claw-muted">File Size</td>
                                ${models.map(m => `<td class="text-center py-3 px-3 text-white font-mono">${m.size_gb} GB</td>`).join('')}
                            </tr>
                            <tr class="border-b border-white/5">
                                <td class="py-3 px-3 text-claw-muted">Min RAM</td>
                                ${models.map(m => `<td class="text-center py-3 px-3 text-white font-mono">${m.min_ram} GB</td>`).join('')}
                            </tr>
                            <tr class="border-b border-white/5">
                                <td class="py-3 px-3 text-claw-muted">Quantization</td>
                                ${models.map(m => `<td class="text-center py-3 px-3"><code class="text-claw-primary bg-claw-primary/10 px-2 py-0.5 rounded">${m.recommended_quant}</code></td>`).join('')}
                            </tr>
                            ${benchmarkKeys.map(key => `
                                <tr class="border-b border-white/5">
                                    <td class="py-3 px-3 text-claw-muted capitalize">${key}</td>
                                    ${models.map(m => {
                                        const val = m.benchmarks?.[key] || 5;
                                        const isMax = val === Math.max(...models.map(mm => mm.benchmarks?.[key] || 5));
                                        return `<td class="text-center py-3 px-3">
                                            <div class="flex items-center justify-center gap-2">
                                                <div class="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div class="h-full rounded-full" style="width: ${val * 10}%; background: ${benchmarkColors[key]}"></div>
                                                </div>
                                                <span class="font-mono ${isMax ? 'text-white font-bold' : 'text-claw-muted'}">${val}</span>
                                                ${isMax ? '<span class="text-yellow-500 text-xs">★</span>' : ''}
                                            </div>
                                        </td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                            <tr class="border-b border-white/5">
                                <td class="py-3 px-3 text-claw-muted">Released</td>
                                ${models.map(m => `<td class="text-center py-3 px-3 text-claw-muted font-mono text-xs">${m.released || 'N/A'}</td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ========================================================================
    // FAQ VIEW
    // ========================================================================

    renderFAQ(container) {
        const faqHtml = APP_DATA.faq.map((item, i) => `
            <details class="claw-card rounded-xl p-6 group" style="animation: fadeInUp 0.4s ${i * 0.08}s ease-out both;" ${i === 0 ? 'open' : ''}>
                <summary class="text-base font-bold text-white flex items-center justify-between list-none cursor-pointer">
                    ${item.q}
                    <svg class="w-5 h-5 text-claw-muted group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <p class="mt-4 text-sm text-claw-muted leading-relaxed">${item.a}</p>
            </details>
        `).join('');

        container.innerHTML = `
            <div class="max-w-3xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <button onclick="App.goBack()" class="text-sm text-claw-muted hover:text-white flex items-center gap-2 group">
                        <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        Back
                    </button>
                </div>

                <div class="text-center mb-12">
                    <h2 class="text-4xl font-display font-bold text-white mb-3">Frequently Asked Questions</h2>
                    <p class="text-claw-muted">Everything you need to know about running AI locally</p>
                </div>

                <div class="space-y-3">
                    ${faqHtml}
                </div>

                <div class="text-center mt-12">
                    <button onclick="App.reset()" class="px-6 py-3 bg-claw-primary hover:bg-red-500 text-white rounded-xl font-bold transition-all">
                        Find My Model →
                    </button>
                </div>
            </div>
        `;
    }
};

// Global helper
function resetApp() {
    App.reset();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
