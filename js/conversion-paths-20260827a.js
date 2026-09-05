(function () {
    'use strict';

    const icon = (name) => {
        const paths = {
            compatible: '<rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M9 9h6v6H9zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"></path>',
            saved: '<path d="M6 4.75A2.75 2.75 0 0 1 8.75 2h6.5A2.75 2.75 0 0 1 18 4.75V22l-6-3.75L6 22z"></path>',
            tests: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>'
        };
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
    };

    const quickPlan = (form) => {
        const system = form.elements.system.value;
        const ram = Number.parseInt(form.elements.ram.value, 10) || 16;
        const usage = form.elements.goal.value || 'chat';
        const app = typeof App !== 'undefined' ? App : window.App;
        window.__localClawQuickFit = {system, ram, usage};
        try { window.sessionStorage.setItem('localclawQuickFit', JSON.stringify(window.__localClawQuickFit)); } catch (_error) {}
        const previousProfile = form._fitProfile;
        const platform = system === 'mac' || system === 'mac-intel' ? 'macos' : system;
        const sameSystem = previousProfile && previousProfile.platform === platform && (system === 'mac') === (previousProfile.accelerator === 'apple-silicon');
        const profile = {ramGb: ram, platform, accelerator: system === 'mac' ? 'apple-silicon' : sameSystem ? previousProfile.accelerator : 'cpu', vramGb: sameSystem ? previousProfile.vramGb : null, useCase: usage, context: sameSystem ? previousProfile.context : '8k'};
        window.LocalClawFitContext?.select(profile);

        if (!app || !app.state || typeof app.calculateResults !== 'function') {
            const target = new URL('/', window.location.origin);
            target.searchParams.set('fitRam', String(ram));
            target.searchParams.set('fitGoal', usage);
            target.searchParams.set('fitPlatform', profile.platform);
            target.searchParams.set('fitAccelerator', profile.accelerator);
            target.hash = 'llm-index';
            window.location.assign(target.toString());
            return;
        }

        if (typeof app.pushState === 'function') app.pushState();
        app.state.activeFlow = 'pro';
        app.state.currentStepIndex = 0;
        app.state.answers = {
            parsedRam: ram,
            parsedOS: system,
            gpu: profile.accelerator === 'apple-silicon' ? 'apple' : profile.accelerator,
            vram: profile.vramGb,
            usage,
            priority: 'balanced',
            context: profile.context
        };
        app.state.flowSource = 'home_quick_fit';
        app.state.trackedStepViews = {};
        app.state.prefilledSteps = [];
        app.state.planHandoffStarted = false;
        app.state.existingMachineMatchTracked = false;
        app.trackGoal('recommender_start', {flow: 'pro', source: 'home_quick_fit'});
        app.calculateResults();
    };

    const enhanceHome = () => {
        const hero = document.querySelector('.lc-index-hero__copy');
        if (!hero || hero.querySelector('.lc-quick-fit')) return;

        const subtitle = hero.querySelector('h1 small');
        const intro = hero.querySelector(':scope > p');
        if (subtitle) subtitle.textContent = 'Find the best local AI for your machine';
        if (intro) intro.textContent = 'Choose your hardware once. See the models that fit, the right quantization, and a real install path.';

        const form = document.createElement('form');
        form.className = 'lc-quick-fit';
        form.setAttribute('aria-label', 'Quick local AI compatibility check');
        form.innerHTML = `
            <label><span>System</span><select name="system" aria-label="Computer system" required><option value="" disabled>Choose your system</option><option value="mac">Apple Silicon</option><option value="mac-intel">Intel Mac</option><option value="windows">Windows PC</option><option value="linux">Linux PC</option></select></label>
            <label><span>Memory</span><select name="ram" aria-label="System memory"><option value="8">8 GB</option><option value="16" selected>16 GB</option><option value="32">32 GB</option><option value="64">64 GB</option><option value="128">128 GB</option></select></label>
            <label><span>Goal</span><select name="goal" aria-label="Primary AI goal"><option value="chat">Private chat</option><option value="code" selected>Coding</option><option value="reasoning">Reasoning</option><option value="vision">Vision</option></select></label>
            <button type="submit">Show my models <span aria-hidden="true">→</span></button>
        `;

        const activeAnswers = (typeof App !== 'undefined' ? App : window.App)?.state?.answers || {};
        let sessionFit = {};
        try {
            sessionFit = JSON.parse(window.sessionStorage.getItem('localclawQuickFit') || '{}');
        } catch (_error) {
            sessionFit = {};
        }
        const activeFit = window.__localClawQuickFit || sessionFit;
        const activeSystem = ['mac', 'mac-intel', 'windows', 'linux'].includes(activeFit.system || activeAnswers.parsedOS) ? (activeFit.system || activeAnswers.parsedOS) : null;
        const activeRam = String(activeFit.ram || activeAnswers.parsedRam || '');
        const activeGoal = activeFit.usage || activeAnswers.usage;
        if (activeSystem) form.elements.system.value = activeSystem;
        if ([...form.elements.ram.options].some((option) => option.value === activeRam)) form.elements.ram.value = activeRam;
        if ([...form.elements.goal.options].some((option) => option.value === activeGoal)) form.elements.goal.value = activeGoal;

        const syncProfile = (profile) => {
            if (!profile || form.dataset.edited === 'true') return;
            form._fitProfile = profile;
            form.elements.system.value = profile.platform === 'macos' || profile.platform === 'mac'
                ? profile.accelerator === 'apple-silicon' ? 'mac' : 'mac-intel' : ['windows', 'linux'].includes(profile.platform) ? profile.platform : '';
            const memory = String(profile.ramGb);
            if (![...form.elements.ram.options].some(option => option.value === memory)) {
                const option = document.createElement('option'); option.value = memory; option.textContent = `${memory} GB`; form.elements.ram.append(option);
            }
            form.elements.ram.value = memory;
            const goal = profile.useCase === 'coding' ? 'code' : profile.useCase === 'general' ? 'chat' : profile.useCase;
            if ([...form.elements.goal.options].some(option => option.value === goal)) form.elements.goal.value = goal;
        };
        const explicitProfile = window.LocalClawFitContext?.fromSearch();
        let savedProfile = null;
        try { savedProfile = JSON.parse(localStorage.getItem('localclaw_primary_machine') || 'null'); } catch (_error) {}
        syncProfile(explicitProfile || window.LocalClawFitContext?.normalize(savedProfile));
        form.addEventListener('change', () => { form.dataset.edited = 'true'; });
        const onProfile = (event) => {
            if (!form.isConnected) {
                window.removeEventListener('localclaw:fit-context', onProfile);
                window.removeEventListener('localclaw:home-machine-selection', onProfile);
                return;
            }
            if (event.type === 'localclaw:home-machine-selection') {
                if (event.detail.explicit) form.dataset.edited = 'false';
                syncProfile(window.LocalClawFitContext?.normalize(event.detail.machine));
            } else syncProfile(event.detail);
        };
        window.addEventListener('localclaw:fit-context', onProfile);
        window.addEventListener('localclaw:home-machine-selection', onProfile);
        const offer = document.querySelector('[aria-labelledby="openclaw-launch-title"]');
        if (offer) hero.closest('.lc-index-hero').insertAdjacentElement('afterend', offer);

        const actions = hero.querySelector('.lc-index-hero__actions');
        if (actions) {
            actions.classList.add('lc-index-hero__actions--quick-fit');
            actions.innerHTML = '<a href="#llm-index">Browse AI Index →</a><a href="#local-ai-index" data-detailed-fit>Use the detailed machine filters →</a>';
            hero.insertBefore(form, actions);
            actions.querySelector('[data-detailed-fit]')?.addEventListener('click', (event) => {
                event.preventDefault();
                document.getElementById('local-ai-index')?.scrollIntoView({behavior: 'smooth', block: 'start'});
            });
        } else {
            hero.appendChild(form);
        }
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            quickPlan(form);
        });

        const universe = document.querySelector('.lc-index-universe');
        const machinePanel = universe?.querySelector('.lc-home-machines');
        if (universe && !universe.querySelector('.lc-workspace-value')) {
            const value = document.createElement('nav');
            value.className = 'lc-workspace-value';
            value.setAttribute('aria-label', 'My Machines workspace benefits');
            value.innerHTML = `
                <div class="lc-workspace-value__intro"><span>Your machine, kept up to date</span><strong>One profile. A living local AI shortlist.</strong></div>
                <a href="#llm-index">${icon('compatible')}<span><strong>Compatible models</strong><small>See what fits your RAM and hardware.</small></span></a>
                <a href="/account">${icon('saved')}<span><strong>Saved picks</strong><small>Keep a shortlist for every machine.</small></span></a>
                <a href="/account">${icon('tests')}<span><strong>Test history</strong><small>Record speed, status and private notes.</small></span></a>
            `;
            if (machinePanel) machinePanel.insertAdjacentElement('afterend', value);
            else universe.querySelector('header')?.insertAdjacentElement('afterend', value);
        }

        const params = new URLSearchParams(window.location.search);
        const fitRam = params.get('fitRam');
        const fitGoal = params.get('fitGoal');
        const fitSearch = params.get('fitSearch');
        if (fitRam || fitGoal || fitSearch) {
            let deepLinkAttempts = 0;
            const applyDeepLinkFilters = () => {
                const ramControl = document.getElementById('lc-index-machine-ram');
                const fitControl = document.getElementById('lc-index-fit-filter');
                const sortControl = document.getElementById('lc-index-sort');
                const searchControl = document.getElementById('lc-index-search');
                if (!window.LocalClawFitContext && fitRam && ramControl && ramControl.value !== fitRam) {
                    ramControl.value = fitRam;
                    ramControl.dispatchEvent(new Event('change', {bubbles: true}));
                }
                if (!window.LocalClawFitContext && fitRam && fitControl && fitControl.value !== 'fits') {
                    fitControl.disabled = false;
                    fitControl.value = 'fits';
                    fitControl.dispatchEvent(new Event('change', {bubbles: true}));
                }
                if (fitGoal && sortControl) {
                    const sortByGoal = {code: 'coding', coding: 'coding', reasoning: 'reasoning', speed: 'speed', chat: 'quality', quality: 'quality'};
                    const goalSort = sortByGoal[fitGoal] || 'score';
                    if (sortControl.value !== goalSort) {
                        sortControl.value = goalSort;
                        sortControl.dispatchEvent(new Event('change', {bubbles: true}));
                    }
                }
                if (fitSearch && searchControl && searchControl.value !== fitSearch) {
                    searchControl.value = fitSearch;
                    searchControl.dispatchEvent(new Event('input', {bubbles: true}));
                }
                if (deepLinkAttempts === 0) document.getElementById('llm-index')?.scrollIntoView({block: 'start'});
                deepLinkAttempts += 1;
                if (deepLinkAttempts < 2) window.setTimeout(applyDeepLinkFilters, 250);
            };
            window.requestAnimationFrame(applyDeepLinkFilters);
        }
    };

    const chartActions = {
        'open-weight-token-share-over-time': {
            title: 'What this means for your machine',
            copy: 'Open-weight adoption matters most when the model has a practical local runtime.',
            primary: ['Explore open models', '/?fitRam=16#llm-index'],
            secondary: ['Run a machine fit check', '/#local-ai-index']
        },
        'notable-models-by-country': {
            title: 'Turn the trend into a shortlist',
            copy: 'Model origin is context. Hardware fit, licence and installability decide what you can actually use.',
            primary: ['Browse the Local AI Index', '/#llm-index'],
            secondary: ['Match my machine', '/#local-ai-index']
        },
        'open-model-downloads-by-origin': {
            title: 'Explore the models behind the shift',
            copy: 'Chinese open-weight families now shape the download layer, led by a broad Qwen ecosystem.',
            primary: ['Explore Qwen models', '/?fitSearch=qwen#llm-index'],
            secondary: ['Match my machine', '/#local-ai-index']
        },
        'downloads-by-parameter-count': {
            title: 'What this means for your machine',
            copy: 'Small open models are the easiest place to start locally.',
            primary: ['See models for 8–16 GB RAM', '/?fitRam=16#llm-index'],
            secondary: ['Run a machine fit check', '/#local-ai-index']
        },
        'repository-growth-by-format': {
            title: 'Put local formats to work',
            copy: 'GGUF and MLX growth matters because formats determine which runtimes and hardware paths are practical.',
            primary: ['Understand quantization', '/blog/quantization-guide'],
            secondary: ['Find models that fit', '/#local-ai-index']
        }
    };

    const enhanceCharts = () => {
        document.querySelectorAll('[data-chart]').forEach((figure) => {
            const config = chartActions[figure.dataset.chart];
            if (!config || figure.querySelector('.charts-practical-action')) return;
            const rail = document.createElement('aside');
            rail.className = 'charts-practical-action';
            rail.setAttribute('aria-label', config.title);
            rail.innerHTML = `
                <div><strong>${config.title}</strong><p>${config.copy}</p></div>
                <div class="charts-practical-action__links">
                    <a class="is-primary" href="${config.primary[1]}">${config.primary[0]} <span aria-hidden="true">→</span></a>
                    <a href="${config.secondary[1]}">${config.secondary[0]} <span aria-hidden="true">→</span></a>
                </div>
            `;
            const srTable = figure.querySelector('.charts-sr-only');
            if (srTable) figure.insertBefore(rail, srTable);
            else figure.appendChild(rail);
        });
    };

    const bootHome = () => {
        let attempts = 0;
        const waitForDirectory = () => {
            enhanceHome();
            attempts += 1;
            if (!document.querySelector('.lc-quick-fit') && attempts < 120) {
                window.requestAnimationFrame(waitForDirectory);
            }
        };
        waitForDirectory();
    };

    const boot = () => {
        if (document.body.classList.contains('lc-home-index')) bootHome();
        if (document.body.querySelector('.charts-main')) enhanceCharts();
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once: true});
    else boot();
})();
