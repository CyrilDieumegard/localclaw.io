(function (root, factory) {
    'use strict';

    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.LocalClawModelRanking = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const DAY_MS = 24 * 60 * 60 * 1000;
    const DEFAULT_FRESH_DAYS = 60;
    const DEFAULT_RECENT_DAYS = 180;
    const DEFAULT_EXCLUDED_IDS = new Set([
        'qwen3.6-6.7b',
        'qwen3-coder-8b',
        'glm4.6-air',
        'llama4-scout'
    ]);
    const USE_CASE_BENCHMARK = {
        chat: 'quality',
        coding: 'coding',
        code: 'coding',
        reasoning: 'reasoning',
        vision: 'quality',
        creative: 'quality',
        'creative-writing': 'quality',
        rag: 'reasoning',
        multilingual: 'quality',
        fast: 'speed',
        speed: 'speed',
        general: 'quality',
        mix: 'quality'
    };

    function finiteNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function normalizeReleaseDate(value) {
        if (!value) return null;
        const text = String(value).trim();
        const normalized = /^\d{4}-\d{2}$/.test(text) ? `${text}-01T00:00:00Z` : text;
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function releaseAgeDays(released, asOf = new Date()) {
        const releaseDate = normalizeReleaseDate(released);
        const reference = asOf instanceof Date ? asOf : new Date(asOf);
        if (!releaseDate || Number.isNaN(reference.getTime())) return null;
        return (reference.getTime() - releaseDate.getTime()) / DAY_MS;
    }

    function isFresh(released, asOf = new Date(), days = DEFAULT_FRESH_DAYS) {
        const age = releaseAgeDays(released, asOf);
        return age !== null && age >= 0 && age <= days;
    }

    function isRecent(released, asOf = new Date(), days = DEFAULT_RECENT_DAYS) {
        const age = releaseAgeDays(released, asOf);
        return age !== null && age >= 0 && age <= days;
    }

    function normalizeUseCase(value) {
        const text = String(value || 'general').toLowerCase();
        if (text === 'code') return 'coding';
        if (text === 'mix') return 'general';
        if (text === 'speed') return 'fast';
        return text;
    }

    function normalizeMachine(machine = {}) {
        const ramGb = Math.max(4, finiteNumber(machine.ramGb ?? machine.ram ?? machine.parsedRam, 8));
        const rawVram = machine.vramGb ?? machine.vram ?? null;
        const platform = String(machine.platform || machine.os || 'other').toLowerCase();
        let accelerator = String(machine.accelerator || '').toLowerCase();
        if (!accelerator) {
            if (platform === 'mac' || platform === 'macos' || machine.gpu === 'apple') accelerator = 'apple-silicon';
            else if (String(machine.gpu || '').startsWith('nvidia')) accelerator = 'nvidia';
            else accelerator = 'cpu';
        }

        return {
            id: String(machine.id || ''),
            name: String(machine.name || 'My machine'),
            platform,
            accelerator,
            ramGb,
            vramGb: rawVram === null || rawVram === '' ? null : Math.max(0, finiteNumber(rawVram, 0)),
            useCase: normalizeUseCase(machine.useCase || machine.usage || 'general'),
            priority: String(machine.priority || 'balanced').toLowerCase(),
            context: String(machine.context || '8k').toLowerCase()
        };
    }

    function isLocallyEligible(model) {
        return Boolean(
            model &&
            model.id &&
            !DEFAULT_EXCLUDED_IDS.has(model.id) &&
            !model.hosted_only &&
            finiteNumber(model.size_gb, 0) > 0 &&
            String(model.recommended_quant || '').toUpperCase() !== 'API'
        );
    }

    function contextOverheadGb(model, context) {
        const size = finiteNumber(model?.size_gb, 0);
        const scale = Math.max(size / 5, 0.5);
        if (context === '16k') return 0.8 * scale;
        if (context === '32k') return 1.8 * scale;
        return context === '8k' ? 0.3 * scale : 0;
    }

    function calculateHardwareFit(machineInput, model) {
        const machine = normalizeMachine(machineInput);
        const modelSize = finiteNumber(model?.size_gb, 0);
        const contextOverhead = contextOverheadGb(model, machine.context);
        const systemHeadroom = Math.max(2.5, Math.min(8, machine.ramGb * 0.12));
        const usableRam = Math.max(0, machine.ramGb - systemHeadroom);
        const minimumRam = Math.max(finiteNumber(model?.min_ram, 0), Math.ceil(modelSize + contextOverhead + 2.5));
        const memoryRatio = (modelSize + contextOverhead) / Math.max(usableRam, 1);
        const fitsRam = minimumRam <= machine.ramGb && modelSize + contextOverhead <= usableRam;

        let vramState = 'not-specified';
        if (machine.accelerator === 'nvidia' && machine.vramGb > 0) {
            if (modelSize <= machine.vramGb * 0.88) vramState = 'full-offload';
            else if (modelSize <= machine.vramGb + Math.max(4, machine.ramGb * 0.2)) vramState = 'partial-offload';
            else vramState = 'system-memory';
        }

        let fitState = 'too-large';
        if (fitsRam && memoryRatio <= 0.58) fitState = 'comfortable';
        else if (fitsRam && memoryRatio <= 0.76) fitState = 'good';
        else if (fitsRam) fitState = 'tight';

        return {
            compatible: fitsRam,
            fitState,
            memoryRatio,
            minimumRam,
            modelSize,
            contextOverhead,
            systemHeadroom,
            usableRam,
            vramState
        };
    }

    function useCaseMatches(model, useCase) {
        const tags = new Set(Array.isArray(model?.tags) ? model.tags.map(tag => String(tag).toLowerCase()) : []);
        const alternatives = {
            general: ['general', 'chat'],
            chat: ['chat', 'general'],
            coding: ['code', 'coding'],
            reasoning: ['reasoning'],
            vision: ['vision', 'multimodal'],
            creative: ['chat', 'general', 'quality'],
            'creative-writing': ['chat', 'general', 'quality'],
            rag: ['long-context', 'reasoning', 'chat'],
            multilingual: ['multilingual', 'chat', 'general'],
            fast: ['speed', 'light', 'edge']
        }[useCase] || [useCase];
        return alternatives.some(tag => tags.has(tag));
    }

    function scoreModel(machineInput, preferences, model, options = {}) {
        const machine = normalizeMachine({ ...machineInput, ...preferences });
        const fit = calculateHardwareFit(machine, model);
        if (!isLocallyEligible(model) || !fit.compatible) return { compatible: false, score: 0, fit };
        if (options.includeTight === false && fit.fitState === 'tight') return { compatible: false, score: 0, fit };

        const benchmarks = model.benchmarks || {};
        const benchmarkKey = USE_CASE_BENCHMARK[machine.useCase] || 'quality';
        const benchmarkScore = finiteNumber(benchmarks[benchmarkKey], 5);
        const quality = finiteNumber(benchmarks.quality, 5);
        const speed = finiteNumber(benchmarks.speed, 5);
        let score = 24;
        const reasons = [];

        if (fit.fitState === 'comfortable') {
            score += 15;
            reasons.push('Comfortable memory headroom');
        } else if (fit.fitState === 'good') {
            score += 9;
            reasons.push('Good memory fit');
        } else {
            score += 1;
            reasons.push('Tight memory fit');
        }

        if (useCaseMatches(model, machine.useCase)) {
            score += 15;
            reasons.push(`${machine.useCase === 'coding' ? 'Coding' : capitalize(machine.useCase)} match`);
        } else {
            score -= 5;
        }

        score += benchmarkScore * 1.3;
        score += quality * 0.55;

        if (machine.priority === 'speed') score += speed * 1.5;
        else if (machine.priority === 'quality') score += quality * 1.5;
        else if (machine.priority === 'memory') score += Math.max(0, 14 - fit.modelSize);
        else {
            score += quality * 0.45;
            score += speed * 0.45;
        }

        if (machine.accelerator === 'apple-silicon') {
            score += 4;
            reasons.push('Apple unified-memory fit');
        } else if (machine.accelerator === 'nvidia') {
            if (fit.vramState === 'full-offload') {
                score += 8;
                reasons.push(`Fits ${machine.vramGb} GB VRAM`);
            } else if (fit.vramState === 'partial-offload') {
                score += 2;
                reasons.push('Partial GPU offload');
            } else if (fit.vramState === 'system-memory') {
                score -= 8;
                reasons.push('Limited GPU offload');
            }
        }

        const asOf = options.asOf || new Date();
        if (isFresh(model.released, asOf)) score += 3;
        else if (isRecent(model.released, asOf)) score += 1;

        if (model.custom_runtime) {
            score -= 4;
            reasons.push('Custom runtime required');
        }
        if (Array.isArray(model.tags) && model.tags.includes('long-context') && ['rag', 'reasoning'].includes(machine.useCase)) score += 2;

        const rounded = Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
        let compatibilityTier = 'limited';
        if (fit.fitState === 'comfortable' && rounded >= 68) compatibilityTier = 'best';
        else if (fit.fitState !== 'tight' && rounded >= 58) compatibilityTier = 'great';

        return {
            compatible: true,
            score: rounded,
            fit,
            compatibilityTier,
            compatibilityLabel: tierLabel(compatibilityTier, fit.fitState),
            reasons: unique(reasons).slice(0, 3),
            runtimeNote: runtimeNote(machine, fit),
            fresh: isFresh(model.released, asOf)
        };
    }

    function rankModels(machineInput, preferences, models, options = {}) {
        const machine = normalizeMachine({ ...machineInput, ...preferences });
        const excludedIds = new Set(options.excludedIds || []);
        const seenIds = new Set();
        const ranked = [];
        let incompatibleCount = 0;

        for (const model of Array.isArray(models) ? models : []) {
            if (!model?.id || seenIds.has(model.id)) continue;
            seenIds.add(model.id);
            if (excludedIds.has(model.id) || !isLocallyEligible(model)) continue;
            if (typeof options.filter === 'function' && !options.filter(model)) continue;

            const result = scoreModel(machine, preferences, model, options);
            if (!result.compatible) {
                incompatibleCount += 1;
                continue;
            }
            ranked.push({
                ...model,
                recommendationScore: result.score,
                compatibilityScore: result.score,
                compatibilityTier: result.compatibilityTier,
                compatibilityLabel: result.compatibilityLabel,
                compatibilityReasons: result.reasons,
                runtimeNote: result.runtimeNote,
                fitState: result.fit.fitState,
                memoryRatio: result.fit.memoryRatio,
                isFresh: result.fresh
            });
        }

        ranked.sort((a, b) => {
            if (b.recommendationScore !== a.recommendationScore) return b.recommendationScore - a.recommendationScore;
            const releaseOrder = String(b.released || '').localeCompare(String(a.released || ''));
            if (releaseOrder) return releaseOrder;
            return String(a.name || a.id).localeCompare(String(b.name || b.id));
        });

        const limit = Math.max(0, finiteNumber(options.limit, ranked.length));
        let compatible = ranked;
        if (options.diversifyFamilies) {
            const families = new Set();
            compatible = ranked.filter(model => {
                const family = String(model.family || model.id);
                if (families.has(family)) return false;
                families.add(family);
                return true;
            });
        }
        if (limit) compatible = compatible.slice(0, limit);

        return {
            machine,
            compatible,
            allCompatible: ranked,
            incompatibleCount,
            totalLocalModels: ranked.length + incompatibleCount
        };
    }

    function tierLabel(tier, fitState) {
        if (tier === 'best') return 'Best match';
        if (fitState === 'comfortable') return 'Comfortable fit';
        if (fitState === 'good') return 'Good fit';
        return 'Tight fit';
    }

    function runtimeNote(machine, fit) {
        if (machine.accelerator === 'apple-silicon') return 'Apple unified memory';
        if (fit.vramState === 'full-offload') return 'Full GPU offload target';
        if (fit.vramState === 'partial-offload') return 'Partial GPU offload likely';
        if (fit.vramState === 'system-memory') return 'Mostly system-memory inference';
        return 'CPU and system-memory inference';
    }

    function capitalize(value) {
        const text = String(value || '');
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    }

    function unique(values) {
        return [...new Set(values.filter(Boolean))];
    }

    return {
        DEFAULT_EXCLUDED_IDS,
        DEFAULT_FRESH_DAYS,
        DEFAULT_RECENT_DAYS,
        calculateHardwareFit,
        isFresh,
        isLocallyEligible,
        isRecent,
        normalizeMachine,
        rankModels,
        releaseAgeDays,
        scoreModel,
        tierLabel
    };
});
