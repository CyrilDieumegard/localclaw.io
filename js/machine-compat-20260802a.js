(function () {
    'use strict';

    const USE_CASE_BENCHMARK = {
        chat: 'quality',
        coding: 'coding',
        reasoning: 'reasoning',
        vision: 'quality',
        creative: 'quality',
        general: 'quality'
    };

    function rankModels(machine, models) {
        const normalized = normalizeMachine(machine);
        const ranked = [];
        const seenModelIds = new Set();
        let incompatibleCount = 0;

        for (const model of Array.isArray(models) ? models : []) {
            if (!model?.id || seenModelIds.has(model.id)) continue;
            seenModelIds.add(model.id);
            if (!isLocalModel(model)) continue;

            const result = scoreModel(normalized, model);
            if (!result.compatible) {
                incompatibleCount += 1;
                continue;
            }

            ranked.push({
                ...model,
                compatibilityScore: result.score,
                compatibilityTier: result.tier,
                compatibilityLabel: tierLabel(result.tier),
                compatibilityReasons: result.reasons,
                runtimeNote: result.runtimeNote
            });
        }

        ranked.sort((a, b) => {
            if (b.compatibilityScore !== a.compatibilityScore) {
                return b.compatibilityScore - a.compatibilityScore;
            }
            return String(b.released || '').localeCompare(String(a.released || ''));
        });

        return {
            machine: normalized,
            compatible: ranked,
            incompatibleCount,
            totalLocalModels: ranked.length + incompatibleCount
        };
    }

    function scoreModel(machine, model) {
        const modelSize = finiteNumber(model.size_gb, 0);
        const minimumRam = Math.max(finiteNumber(model.min_ram, 0), Math.ceil(modelSize + 2.5));
        const ram = machine.ramGb;
        const vram = machine.vramGb || 0;
        const memoryOverhead = Math.max(2.5, Math.min(8, ram * 0.12));
        const usableRam = Math.max(0, ram - memoryOverhead);
        const fitsSystemMemory = modelSize <= usableRam && minimumRam <= ram;

        if (!fitsSystemMemory) {
            return { compatible: false, score: 0, tier: 'too-large', reasons: [], runtimeNote: '' };
        }

        const tags = new Set(Array.isArray(model.tags) ? model.tags : []);
        const benchmarks = model.benchmarks || {};
        const memoryRatio = modelSize / Math.max(usableRam, 1);
        let score = 24;
        const reasons = [];

        if (memoryRatio <= 0.58) {
            score += 12;
            reasons.push('Comfortable memory headroom');
        } else if (memoryRatio <= 0.76) {
            score += 7;
            reasons.push('Good memory fit');
        } else if (memoryRatio <= 0.9) {
            score += 2;
            reasons.push('Tight memory fit');
        } else {
            score -= 8;
            reasons.push('Minimal memory headroom');
        }

        const useCaseTag = machine.useCase === 'coding' ? 'code' : machine.useCase;
        const benchmarkKey = USE_CASE_BENCHMARK[machine.useCase] || 'quality';
        const benchmarkScore = finiteNumber(benchmarks[benchmarkKey], 5);

        if (machine.useCase === 'general') {
            if (tags.has('general') || tags.has('chat')) score += 10;
        } else if (tags.has(useCaseTag)) {
            score += 12;
            reasons.push(`${capitalize(machine.useCase)} match`);
        } else if (machine.useCase === 'creative' && (tags.has('chat') || tags.has('vision'))) {
            score += 8;
            reasons.push('Creative workflow fit');
        } else {
            score -= 5;
        }

        score += benchmarkScore * 1.25;
        score += finiteNumber(benchmarks.quality, 5) * 0.45;

        if (machine.priority === 'speed') {
            score += finiteNumber(benchmarks.speed, 5) * 1.4;
        } else if (machine.priority === 'quality') {
            score += finiteNumber(benchmarks.quality, 5) * 1.4;
        } else if (machine.priority === 'memory') {
            score += Math.max(0, 14 - modelSize);
        } else {
            score += finiteNumber(benchmarks.speed, 5) * 0.35;
            score += finiteNumber(benchmarks.quality, 5) * 0.35;
        }

        let runtimeNote = 'CPU and system-memory inference';

        if (machine.accelerator === 'apple-silicon') {
            score += 4;
            runtimeNote = 'Apple unified memory';
            reasons.push('Unified-memory fit');
        } else if (machine.accelerator === 'nvidia' && vram > 0) {
            if (modelSize <= vram * 0.88) {
                score += 8;
                runtimeNote = 'Full GPU offload target';
                reasons.push(`Fits ${vram} GB VRAM`);
            } else if (modelSize <= vram + Math.max(4, ram * 0.2)) {
                score += 2;
                runtimeNote = 'Partial GPU offload likely';
                reasons.push('Partial GPU offload');
            } else {
                score -= 9;
                runtimeNote = 'Mostly system-memory inference';
                reasons.push('Limited GPU offload');
            }
        } else if (machine.accelerator === 'amd') {
            runtimeNote = 'Runtime support varies by OS';
            reasons.push('Check runtime GPU support');
        }

        if (tags.has('long-context')) score += 1;
        if (isRecent(model.released)) score += 2;

        let tier = 'limited';
        if (memoryRatio <= 0.72 && score >= 72) tier = 'best';
        else if (memoryRatio <= 0.84 && score >= 60) tier = 'great';

        return {
            compatible: true,
            score: Math.round(Math.max(0, Math.min(100, score)) * 10) / 10,
            tier,
            reasons: unique(reasons).slice(0, 3),
            runtimeNote
        };
    }

    function normalizeMachine(machine) {
        return {
            id: String(machine?.id || ''),
            name: String(machine?.name || 'My machine'),
            platform: String(machine?.platform || 'macos'),
            accelerator: String(machine?.accelerator || 'apple-silicon'),
            cpuModel: String(machine?.cpuModel || ''),
            gpuModel: String(machine?.gpuModel || ''),
            ramGb: Math.max(4, finiteNumber(machine?.ramGb, 8)),
            vramGb: machine?.vramGb === null || machine?.vramGb === ''
                ? null
                : Math.max(0, finiteNumber(machine?.vramGb, 0)),
            useCase: String(machine?.useCase || 'general'),
            priority: String(machine?.priority || 'balanced'),
            isPrimary: machine?.isPrimary === true,
            source: String(machine?.source || 'manual')
        };
    }

    function isLocalModel(model) {
        return model && !model.hosted_only && finiteNumber(model.size_gb, 0) > 0;
    }

    function isRecent(released) {
        if (!released) return false;
        const date = new Date(`${released}-01T00:00:00Z`);
        if (Number.isNaN(date.getTime())) return false;
        const age = Date.now() - date.getTime();
        return age >= 0 && age < 1000 * 60 * 60 * 24 * 365;
    }

    function tierLabel(tier) {
        if (tier === 'best') return 'Best match';
        if (tier === 'great') return 'Runs great';
        return 'Runs with limits';
    }

    function finiteNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function capitalize(value) {
        const text = String(value || '');
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    }

    function unique(values) {
        return [...new Set(values.filter(Boolean))];
    }

    window.LocalClawCompatibility = {
        rankModels,
        normalizeMachine
    };
})();
