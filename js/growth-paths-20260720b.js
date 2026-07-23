(function () {
    'use strict';

    const STYLE_ID = 'lc-growth-paths-style';
    const ARTICLE_CTA_CLASS = 'lc-article-next-step';
    const ARTICLE_PATHS = {
        '/blog/local-tts-guide-2026': {
            eyebrow: 'Choose a local voice stack',
            title: 'Compare speech models by language, latency and hardware',
            copy: 'Move from the guide to the complete TTS and ASR directory, then choose the setup path that fits this computer.',
            primary: { href: '/tts-list.html', label: 'Compare local TTS and ASR models', target: 'tts_directory' }
        },
        '/blog/qwen-3-7-local-ai': {
            eyebrow: 'Use the practical local alternative',
            title: 'Qwen 3.7 is cloud-only. Qwen 3.6 27B runs locally.',
            copy: 'Open the closest practical 27B Qwen option, check its RAM fit and continue with a setup matched to this computer.',
            primary: { href: '/models/qwen3.6-27b.html', label: 'Open Qwen 3.6 27B', target: 'qwen3.6-27b' }
        },
        '/blog/glm-5-2-local-ai': {
            eyebrow: 'Check the workstation reality',
            title: 'See GLM-5.2 quantization and memory requirements first',
            copy: 'Open the model record before downloading hundreds of gigabytes, then compare the setup path that fits this machine.',
            primary: { href: '/models/glm-5.2.html', label: 'Open the GLM-5.2 model record', target: 'glm-5.2' }
        },
        '/blog/best-local-ai-models-2026': {
            eyebrow: 'Compare the current catalogue',
            title: 'Filter every local model by RAM, speed and use case',
            copy: 'Move from the editorial shortlist to the live directory and check which model actually fits this computer.',
            primary: { href: '/llm-list.html', label: 'Compare all local LLMs', target: 'llm_directory' }
        },
        '/blog/ornith-1-0-local-ai': {
            eyebrow: 'Check the practical Ornith build',
            title: 'See whether Ornith 1.0 35B fits your available memory',
            copy: 'Open the local model record for RAM, quantization and LM Studio search details before downloading.',
            primary: { href: '/models/ornith-1.0-35b-gguf.html', label: 'Open Ornith 1.0 35B', target: 'ornith-1.0-35b-gguf' }
        },
        '/blog/qwen-3-8-local-ai': {
            eyebrow: 'Use the available local Qwen path',
            title: 'Qwen 3.8 is not a practical local download yet',
            copy: 'Check Qwen 3.6 27B, the current local alternative with a realistic RAM and quantization path.',
            primary: { href: '/models/qwen3.6-27b.html', label: 'Open Qwen 3.6 27B', target: 'qwen3.6-27b' }
        },
        '/blog/kimi-k3-local-ai': {
            eyebrow: 'Move from frontier news to local hardware',
            title: 'Compare the strongest models you can actually run locally',
            copy: 'Kimi K3 is frontier-scale. Use the live directory to find a practical open model for your RAM and GPU.',
            primary: { href: '/llm-list.html', label: 'Compare practical local alternatives', target: 'llm_directory' }
        },
        '/blog/openclaw-guide': {
            eyebrow: 'Use the guided OpenClaw path',
            title: 'Install and control OpenClaw from one native macOS app',
            copy: 'See the real LocalClaw interface, system requirements and exact one-time license terms before checkout.',
            primary: { href: '/pricing.html', label: 'See LocalClaw for macOS', target: 'macos_app' }
        },
        '/blog/nvidia-rtx-spark-local-ai-pc': {
            eyebrow: 'Compare complete local AI machines',
            title: 'Put RTX Spark next to current Apple and NVIDIA systems',
            copy: 'Compare memory tiers, practical model picks and current hardware options before choosing a machine.',
            primary: { href: '/computers.html', label: 'Compare local AI computers', target: 'computers' }
        },
        '/blog/misotts-8b-local-tts': {
            eyebrow: 'Check the local voice catalogue',
            title: 'Compare MisoTTS with lighter local speech models',
            copy: 'Open the exact MisoTTS record, then compare language support, latency and hardware requirements.',
            primary: { href: '/tts/miso-tts.html', label: 'Open the MisoTTS model page', target: 'miso-tts' }
        },
        '/blog/gemma-4-12b-local-ai': {
            eyebrow: 'Check the Gemma 4 hardware fit',
            title: 'See the exact RAM and quantization path for Gemma 4 12B',
            copy: 'Open the model record before downloading, then continue with a setup matched to this computer.',
            primary: { href: '/models/gemma4-12b.html', label: 'Open Gemma 4 12B', target: 'gemma4-12b' }
        }
    };

    function track(name, data) {
        if (typeof window.datafast === 'function') {
            try { window.datafast(name, data || {}); } catch (error) {}
        }
        if (typeof window.localClawPostHogCapture === 'function') {
            window.localClawPostHogCapture(name, data || {});
        }
    }

    function platformName() {
        const source = [
            navigator.userAgentData && navigator.userAgentData.platform,
            navigator.platform,
            navigator.userAgent
        ].filter(Boolean).join(' ').toLowerCase();

        if (/mac|iphone|ipad|ipod/.test(source)) return 'macos';
        if (/win/.test(source)) return 'windows';
        if (/linux|x11|cros|android/.test(source)) return 'linux';
        return 'other';
    }

    function addStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            [data-lc-path] {
                min-height: 48px;
                border: 1px solid transparent;
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.85rem 1.25rem;
                text-align: center;
                transition: color .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease;
            }
            [data-lc-path].lc-path-recommended {
                color: #fff !important;
                background: #ff453a !important;
                border-color: #ff6a1e !important;
                box-shadow: 4px 4px 0 rgba(234, 88, 12, .28) !important;
            }
            [data-lc-path].lc-path-recommended:hover {
                color: #050505 !important;
                background: #fff !important;
                border-color: #fff !important;
                transform: translateY(-2px);
            }
            [data-lc-path].lc-path-secondary {
                color: #a1a1aa !important;
                background: transparent !important;
                border-color: #333 !important;
                box-shadow: none !important;
            }
            [data-lc-path].lc-path-secondary:hover {
                color: #fff !important;
                border-color: #666 !important;
            }
            .lc-platform-note strong { color: #fff; }
            .${ARTICLE_CTA_CLASS} {
                margin: 2rem 0 2.5rem;
                padding: 1.25rem;
                border: 1px solid rgba(255, 69, 58, .32);
                border-radius: 12px;
                background: radial-gradient(circle at 10% 0%, rgba(255, 69, 58, .13), transparent 42%), #0d0d0d;
                box-shadow: 0 16px 50px rgba(0, 0, 0, .28);
                color: #fff;
            }
            .${ARTICLE_CTA_CLASS}__eyebrow {
                margin: 0 0 .55rem;
                color: #ff6a1e;
                font: 700 .7rem/1.3 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                text-transform: uppercase;
                letter-spacing: .14em;
            }
            .${ARTICLE_CTA_CLASS} h2 {
                margin: 0;
                color: #fff;
                font-size: clamp(1.25rem, 3vw, 1.65rem);
                line-height: 1.15;
            }
            .${ARTICLE_CTA_CLASS}__copy {
                margin: .65rem 0 1rem;
                color: #a1a1aa;
                font-size: .92rem;
                line-height: 1.6;
            }
            .${ARTICLE_CTA_CLASS}__actions {
                display: flex;
                flex-wrap: wrap;
                gap: .65rem;
            }
            .${ARTICLE_CTA_CLASS}__button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 44px;
                padding: .72rem 1rem;
                border: 1px solid #333;
                border-radius: 6px;
                color: #fff !important;
                background: #151515;
                font: 700 .76rem/1.25 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                text-decoration: none !important;
                text-transform: uppercase;
                letter-spacing: .04em;
                transition: transform .2s ease, background .2s ease, border-color .2s ease;
            }
            .${ARTICLE_CTA_CLASS}__button:first-child {
                border-color: #ff453a;
                background: #ff453a;
            }
            .${ARTICLE_CTA_CLASS}__button + .${ARTICLE_CTA_CLASS}__button {
                min-height: auto;
                padding-inline: .45rem;
                border-color: transparent;
                color: #b4b4bc !important;
                background: transparent;
                text-transform: none;
                letter-spacing: 0;
            }
            .${ARTICLE_CTA_CLASS}__trust {
                margin: .85rem 0 0;
                color: #777780;
                font: 600 .7rem/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .${ARTICLE_CTA_CLASS}__button:hover {
                transform: translateY(-2px);
                border-color: #ff6a1e;
            }
            @media (max-width: 640px) {
                [data-lc-path] { width: 100%; }
                .${ARTICLE_CTA_CLASS}__actions { flex-direction: column; }
                .${ARTICLE_CTA_CLASS}__button { width: 100%; }
            }
            @media (prefers-reduced-motion: reduce) {
                [data-lc-path], .${ARTICLE_CTA_CLASS}__button { transition: none; }
            }
        `;
        document.head.appendChild(style);
    }

    function applyHomePaths() {
        const paths = Array.from(document.querySelectorAll('[data-lc-path]'));
        if (!paths.length) return;

        const platform = platformName();
        const preferred = platform === 'macos' ? 'app' : 'finder';
        paths.forEach((link) => {
            const type = link.dataset.lcPath;
            link.classList.toggle('lc-path-recommended', type === preferred);
            link.classList.toggle('lc-path-secondary', type !== preferred);
            if (link.dataset.lcPathBound === 'true') return;
            link.dataset.lcPathBound = 'true';
            link.addEventListener('click', () => {
                track('platform_path_click', {
                    platform,
                    path: type,
                    source: link.dataset.fastGoalSource || 'home'
                });
            });
        });

        const note = document.getElementById('lc-platform-note');
        if (!note) return;
        note.classList.add('lc-platform-note');
        if (platform === 'macos') {
            note.innerHTML = '<strong>macOS detected:</strong> the native app is the fastest path. The free model finder remains available.';
        } else if (platform === 'windows') {
            note.innerHTML = '<strong>Windows detected:</strong> start with the free hardware fit check. The LocalClaw app is currently for macOS.';
        } else if (platform === 'linux') {
            note.innerHTML = '<strong>Linux detected:</strong> start with the free hardware fit check. The LocalClaw app is currently for macOS.';
        } else {
            note.textContent = 'Choose the macOS app or use the free browser-based model finder.';
        }
    }

    function startDeepLinkedFinder() {
        if (window.location.hash !== '#model-finder') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('from') !== 'article') return;
        window.setTimeout(() => {
            if (typeof App !== 'undefined' && typeof App.startFlow === 'function' && App.state && App.state.view === 'hero') {
                App.startFlow('guided');
            }
        }, 0);
    }

    function articleIntent() {
        const haystack = `${window.location.pathname} ${document.title} ${(document.querySelector('meta[name="description"]') || {}).content || ''}`.toLowerCase();
        if (/tts|speech|voice|audio|whisper|miso/.test(haystack)) return 'speech';
        if (/nvidia|apple silicon|hardware|gpu|ram|computer|mac mini|rtx/.test(haystack)) return 'hardware';
        if (/openclaw/.test(window.location.pathname.toLowerCase())) return 'app';
        return 'llm';
    }

    function exactArticleTarget(article) {
        const selectors = [
            'a[href^="../models/"]', 'a[href^="/models/"]',
            'a[href^="../tts/"]', 'a[href^="/tts/"]'
        ];
        const link = article.querySelector(selectors.join(','));
        if (!link) return null;
        return { href: link.href, label: /\/tts\//.test(link.href) ? 'Open the exact speech model' : 'Open the exact model page' };
    }

    function directoryTarget(intent) {
        if (intent === 'speech') return { href: '/tts-list.html', label: 'Compare local speech models' };
        if (intent === 'hardware') return { href: '/ram-gpu-for-local-ai.html', label: 'Compare RAM and GPU upgrades' };
        if (intent === 'app') return { href: '/pricing.html', label: 'See the LocalClaw macOS app' };
        return { href: '/llm-list.html', label: 'Compare local LLMs' };
    }

    function setupArticlePath() {
        if (!/^\/blog\/[^/]+(?:\.html)?\/?$/.test(window.location.pathname)) return;
        const article = document.querySelector('article');
        if (!article || article.querySelector(`.${ARTICLE_CTA_CLASS}`)) return;

        const intent = articleIntent();
        const platform = platformName();
        const normalizedPath = window.location.pathname.replace(/\.html\/?$/, '').replace(/\/$/, '');
        const pathConfig = ARTICLE_PATHS[normalizedPath] || null;
        const primary = (pathConfig && pathConfig.primary) || exactArticleTarget(article) || directoryTarget(intent);
        const primaryPath = new URL(primary.href, window.location.origin).pathname;
        const primaryIsMacApp = /\/pricing(?:\.html)?$/.test(primaryPath);
        const secondary = platform === 'macos' && !primaryIsMacApp
            ? { href: '/pricing.html', label: 'Get LocalClaw for macOS · $49', target: 'macos_app' }
            : { href: `/?from=article&intent=${encodeURIComponent(intent)}#model-finder`, label: 'Find what fits this computer', target: 'model_finder' };

        const box = document.createElement('aside');
        box.className = ARTICLE_CTA_CLASS;
        box.setAttribute('aria-label', 'Continue with LocalClaw');
        box.innerHTML = `
            <p class="${ARTICLE_CTA_CLASS}__eyebrow">${pathConfig ? pathConfig.eyebrow : 'Make this guide practical'}</p>
            <h2>${pathConfig ? pathConfig.title : 'Turn the article into a local setup'}</h2>
            <p class="${ARTICLE_CTA_CLASS}__copy">${pathConfig ? pathConfig.copy : 'Compare the exact model, then use the path that fits this computer. No signup and no hardware data is collected.'}</p>
            <div class="${ARTICLE_CTA_CLASS}__actions">
                <a class="${ARTICLE_CTA_CLASS}__button" href="${primary.href}" data-fast-goal="article_to_tool" data-fast-goal-source="${window.location.pathname}" data-fast-goal-target="${primary.target || 'catalogue'}" data-fast-goal-intent="${intent}" data-fast-goal-platform="${platform}">${primary.label} →</a>
                <a class="${ARTICLE_CTA_CLASS}__button" href="${secondary.href}" data-fast-goal="article_to_tool" data-fast-goal-source="${window.location.pathname}" data-fast-goal-target="${secondary.target}" data-fast-goal-intent="${intent}" data-fast-goal-platform="${platform}">${secondary.label} →</a>
            </div>
            <p class="${ARTICLE_CTA_CLASS}__trust">Model directories and the hardware finder are free. The macOS app is a separate $49 one-time purchase.</p>
        `;

        const firstHeading = article.querySelector('h2');
        if (firstHeading) firstHeading.before(box);
        else article.prepend(box);

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                track('article_cta_view', { article: window.location.pathname, intent, platform });
                observer.disconnect();
            }, { threshold: 0.45 });
            observer.observe(box);
        }

        let timeReady = false;
        let depthReady = false;
        let sent = false;
        const maybeTrackEngagement = () => {
            if (sent || !timeReady || !depthReady) return;
            sent = true;
            track('article_engaged_read', { article: window.location.pathname, intent, platform });
            window.removeEventListener('scroll', checkDepth);
        };
        const checkDepth = () => {
            const top = article.getBoundingClientRect().top + window.scrollY;
            const progress = (window.scrollY + window.innerHeight - top) / Math.max(article.scrollHeight, 1);
            depthReady = progress >= 0.5;
            maybeTrackEngagement();
        };
        window.addEventListener('scroll', checkDepth, { passive: true });
        checkDepth();
        window.setTimeout(() => {
            timeReady = true;
            maybeTrackEngagement();
        }, 30000);
    }

    function init() {
        addStyles();
        applyHomePaths();
        setupArticlePath();
        startDeepLinkedFinder();

        const container = document.getElementById('view-container');
        if (container && 'MutationObserver' in window) {
            let scheduled = false;
            const observer = new MutationObserver(() => {
                if (scheduled) return;
                scheduled = true;
                window.requestAnimationFrame(() => {
                    scheduled = false;
                    applyHomePaths();
                });
            });
            observer.observe(container, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
