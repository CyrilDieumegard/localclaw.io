(function () {
    'use strict';

    const PENDING_MACHINE_KEY = 'localclaw_pending_machine';
    const PENDING_PLAN_KEY = 'localclaw_pending_plan';
    const MACHINE_FAMILIES = [
        { key: 'llm', label: 'LLM', catalogue: '/llm-list' },
        { key: 'voice', label: 'Voice', catalogue: '/tts-list' },
        { key: 'image', label: 'Image', catalogue: '/image-models' },
        { key: 'video', label: 'Video', catalogue: '/video-models' },
        { key: '3d', label: '3D', catalogue: '/3d-models' },
        { key: 'music', label: 'Music', catalogue: '/music-models' },
        { key: 'vision', label: 'Vision', catalogue: '/vision-models' }
    ];
    const MAC_PRESETS = [
        { id: 'mac-mini-m6-2026', year: 2026, name: 'Mac mini M6', chip: 'Apple M6', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'mac-mini-m5-pro-2026', year: 2026, name: 'Mac mini M5 Pro', chip: 'Apple M5 Pro', ram: [24, 48, 64], defaultRam: 24 },
        { id: 'macbook-neo-a18-pro-2026', year: 2026, name: 'MacBook Neo A18 Pro', chip: 'A18 Pro', ram: [8], defaultRam: 8 },
        { id: 'macbook-air-13-m5-2026', year: 2026, name: 'MacBook Air 13-inch M5', chip: 'Apple M5', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'macbook-air-15-m5-2026', year: 2026, name: 'MacBook Air 15-inch M5', chip: 'Apple M5', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'macbook-pro-14-m5-pro-2026', year: 2026, name: 'MacBook Pro 14-inch M5 Pro', chip: 'Apple M5 Pro', ram: [24, 48, 64], defaultRam: 24 },
        { id: 'macbook-pro-14-m5-max-2026', year: 2026, name: 'MacBook Pro 14-inch M5 Max', chip: 'Apple M5 Max', ram: [36, 48, 64, 128], defaultRam: 36 },
        { id: 'macbook-pro-16-m5-pro-2026', year: 2026, name: 'MacBook Pro 16-inch M5 Pro', chip: 'Apple M5 Pro', ram: [24, 48, 64], defaultRam: 24 },
        { id: 'macbook-pro-16-m5-max-2026', year: 2026, name: 'MacBook Pro 16-inch M5 Max', chip: 'Apple M5 Max', ram: [36, 48, 64, 128], defaultRam: 36 },

        { id: 'macbook-air-13-m4-2025', year: 2025, name: 'MacBook Air 13-inch M4', chip: 'Apple M4', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'macbook-air-15-m4-2025', year: 2025, name: 'MacBook Air 15-inch M4', chip: 'Apple M4', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'macbook-pro-14-m5-2025', year: 2025, name: 'MacBook Pro 14-inch M5', chip: 'Apple M5', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'mac-studio-m4-max-2025', year: 2025, name: 'Mac Studio M4 Max', chip: 'Apple M4 Max', ram: [36, 48, 64, 128], defaultRam: 36 },
        { id: 'mac-studio-m3-ultra-2025', year: 2025, name: 'Mac Studio M3 Ultra', chip: 'Apple M3 Ultra', ram: [96, 256, 512], defaultRam: 96 },

        { id: 'macbook-air-13-m3-2024', year: 2024, name: 'MacBook Air 13-inch M3', chip: 'Apple M3', ram: [8, 16, 24], defaultRam: 16 },
        { id: 'macbook-air-15-m3-2024', year: 2024, name: 'MacBook Air 15-inch M3', chip: 'Apple M3', ram: [8, 16, 24], defaultRam: 16 },
        { id: 'mac-mini-m4-2024', year: 2024, name: 'Mac mini M4', chip: 'Apple M4', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'mac-mini-m4-pro-2024', year: 2024, name: 'Mac mini M4 Pro', chip: 'Apple M4 Pro', ram: [24, 48, 64], defaultRam: 24 },
        { id: 'imac-24-m4-2024', year: 2024, name: 'iMac 24-inch M4', chip: 'Apple M4', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'macbook-pro-14-m4-2024', year: 2024, name: 'MacBook Pro 14-inch M4', chip: 'Apple M4', ram: [16, 24, 32], defaultRam: 16 },
        { id: 'macbook-pro-14-m4-pro-2024', year: 2024, name: 'MacBook Pro 14-inch M4 Pro', chip: 'Apple M4 Pro', ram: [24, 48, 64], defaultRam: 24 },
        { id: 'macbook-pro-14-m4-max-2024', year: 2024, name: 'MacBook Pro 14-inch M4 Max', chip: 'Apple M4 Max', ram: [36, 48, 64, 128], defaultRam: 36 },
        { id: 'macbook-pro-16-m4-pro-2024', year: 2024, name: 'MacBook Pro 16-inch M4 Pro', chip: 'Apple M4 Pro', ram: [24, 48, 64], defaultRam: 24 },
        { id: 'macbook-pro-16-m4-max-2024', year: 2024, name: 'MacBook Pro 16-inch M4 Max', chip: 'Apple M4 Max', ram: [36, 48, 64, 128], defaultRam: 36 },

        { id: 'mac-mini-m2-2023', year: 2023, name: 'Mac mini M2', chip: 'Apple M2', ram: [8, 16, 24], defaultRam: 8 },
        { id: 'mac-mini-m2-pro-2023', year: 2023, name: 'Mac mini M2 Pro', chip: 'Apple M2 Pro', ram: [16, 32], defaultRam: 16 },
        { id: 'macbook-air-15-m2-2023', year: 2023, name: 'MacBook Air 15-inch M2', chip: 'Apple M2', ram: [8, 16, 24], defaultRam: 8 },
        { id: 'macbook-pro-14-m2-pro-2023', year: 2023, name: 'MacBook Pro 14-inch M2 Pro', chip: 'Apple M2 Pro', ram: [16, 32], defaultRam: 16 },
        { id: 'macbook-pro-14-m2-max-2023', year: 2023, name: 'MacBook Pro 14-inch M2 Max', chip: 'Apple M2 Max', ram: [32, 64, 96], defaultRam: 32 },
        { id: 'macbook-pro-16-m2-pro-2023', year: 2023, name: 'MacBook Pro 16-inch M2 Pro', chip: 'Apple M2 Pro', ram: [16, 32], defaultRam: 16 },
        { id: 'macbook-pro-16-m2-max-2023', year: 2023, name: 'MacBook Pro 16-inch M2 Max', chip: 'Apple M2 Max', ram: [32, 64, 96], defaultRam: 32 },
        { id: 'mac-studio-m2-max-2023', year: 2023, name: 'Mac Studio M2 Max', chip: 'Apple M2 Max', ram: [32, 64, 96], defaultRam: 32 },
        { id: 'mac-studio-m2-ultra-2023', year: 2023, name: 'Mac Studio M2 Ultra', chip: 'Apple M2 Ultra', ram: [64, 128, 192], defaultRam: 64 },
        { id: 'mac-pro-m2-ultra-2023', year: 2023, name: 'Mac Pro M2 Ultra', chip: 'Apple M2 Ultra', ram: [64, 128, 192], defaultRam: 64 },
        { id: 'imac-24-m3-2023', year: 2023, name: 'iMac 24-inch M3', chip: 'Apple M3', ram: [8, 16, 24], defaultRam: 8 },
        { id: 'macbook-pro-14-m3-2023', year: 2023, name: 'MacBook Pro 14-inch M3', chip: 'Apple M3', ram: [8, 16, 24], defaultRam: 8 },
        { id: 'macbook-pro-14-m3-pro-2023', year: 2023, name: 'MacBook Pro 14-inch M3 Pro', chip: 'Apple M3 Pro', ram: [18, 36], defaultRam: 18 },
        { id: 'macbook-pro-14-m3-max-2023', year: 2023, name: 'MacBook Pro 14-inch M3 Max', chip: 'Apple M3 Max', ram: [36, 48, 64, 96, 128], defaultRam: 36 },
        { id: 'macbook-pro-16-m3-pro-2023', year: 2023, name: 'MacBook Pro 16-inch M3 Pro', chip: 'Apple M3 Pro', ram: [18, 36], defaultRam: 18 },
        { id: 'macbook-pro-16-m3-max-2023', year: 2023, name: 'MacBook Pro 16-inch M3 Max', chip: 'Apple M3 Max', ram: [36, 48, 64, 96, 128], defaultRam: 36 },

        { id: 'macbook-air-13-m2-2022', year: 2022, name: 'MacBook Air 13-inch M2', chip: 'Apple M2', ram: [8, 16, 24], defaultRam: 8 },
        { id: 'macbook-pro-13-m2-2022', year: 2022, name: 'MacBook Pro 13-inch M2', chip: 'Apple M2', ram: [8, 16, 24], defaultRam: 8 },
        { id: 'mac-studio-m1-max-2022', year: 2022, name: 'Mac Studio M1 Max', chip: 'Apple M1 Max', ram: [32, 64], defaultRam: 32 },
        { id: 'mac-studio-m1-ultra-2022', year: 2022, name: 'Mac Studio M1 Ultra', chip: 'Apple M1 Ultra', ram: [64, 128], defaultRam: 64 },

        { id: 'imac-24-m1-2021', year: 2021, name: 'iMac 24-inch M1', chip: 'Apple M1', ram: [8, 16], defaultRam: 8 },
        { id: 'macbook-pro-14-m1-pro-2021', year: 2021, name: 'MacBook Pro 14-inch M1 Pro', chip: 'Apple M1 Pro', ram: [16, 32], defaultRam: 16 },
        { id: 'macbook-pro-14-m1-max-2021', year: 2021, name: 'MacBook Pro 14-inch M1 Max', chip: 'Apple M1 Max', ram: [32, 64], defaultRam: 32 },
        { id: 'macbook-pro-16-m1-pro-2021', year: 2021, name: 'MacBook Pro 16-inch M1 Pro', chip: 'Apple M1 Pro', ram: [16, 32], defaultRam: 16 },
        { id: 'macbook-pro-16-m1-max-2021', year: 2021, name: 'MacBook Pro 16-inch M1 Max', chip: 'Apple M1 Max', ram: [32, 64], defaultRam: 32 },

        { id: 'macbook-air-13-m1-2020', year: 2020, name: 'MacBook Air 13-inch M1', chip: 'Apple M1', ram: [8, 16], defaultRam: 8 },
        { id: 'macbook-pro-13-m1-2020', year: 2020, name: 'MacBook Pro 13-inch M1', chip: 'Apple M1', ram: [8, 16], defaultRam: 8 },
        { id: 'mac-mini-m1-2020', year: 2020, name: 'Mac mini M1', chip: 'Apple M1', ram: [8, 16], defaultRam: 8 }
    ];
    const state = {
        session: null,
        machines: [],
        favorites: [],
        knownModelIds: [],
        newModelIds: [],
        selectedMachineId: null,
        viewMode: 'compatible',
        compareModelIds: [],
        upgradeModelId: null,
        saving: false,
        pendingPlanSelection: null,
        recommendationViewKeys: new Set()
    };

    const elements = {};
    const analytics = window.LocalClawAccountAnalytics;

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        cacheElements();
        bindEvents();
        prepareAuthGateForPendingPlan();
        trackAccountGoal('account_page_loaded', {
            source: 'account_page',
            return_view: analytics?.returnView() || 'machines'
        });
        if (isSponsorVisualPreview()) {
            state.session = {
                user: {
                    id: 'sponsor-preview',
                    name: 'Sponsor workspace preview',
                    email: 'Read-only · no account data'
                }
            };
            document.body.dataset.accountPreview = 'sponsorship';
            showDashboard();
            renderProfile();
            elements.signOut.hidden = true;
            setPageLoading(false);
            return;
        }
        await loadSession();
    }

    function trackAccountGoal(name, properties = {}, options = {}) {
        return analytics?.track(name, properties, options) || false;
    }

    function machineAnalytics(machine = {}) {
        return {
            platform: String(machine.platform || 'unknown'),
            accelerator: String(machine.accelerator || 'unknown'),
            ram_bucket: analytics?.ramBucket(machine.ramGb) || 'unknown',
            use_case: String(machine.useCase || 'general'),
            priority: String(machine.priority || 'balanced')
        };
    }

    function trackApiError(stage, response, data, fallback = 'request_failed') {
        trackAccountGoal('account_api_error', {
            error_stage: stage,
            error_code: analytics?.errorCode(data?.error, fallback) || fallback,
            http_status: Number(response?.status || 0),
            online: navigator.onLine !== false
        });
    }

    function isSponsorVisualPreview() {
        const hostname = window.location.hostname.toLowerCase();
        const previewHost = hostname.endsWith('.pages.dev') || hostname === 'localhost' || hostname === '127.0.0.1';
        return previewHost && new URLSearchParams(window.location.search).get('preview') === 'sponsorship';
    }

    function cacheElements() {
        elements.authGate = document.getElementById('auth-gate');
        elements.dashboard = document.getElementById('account-dashboard');
        elements.authError = document.getElementById('auth-error');
        elements.googleSignIn = document.getElementById('google-sign-in');
        elements.signOut = document.getElementById('sign-out');
        elements.profile = document.getElementById('profile');
        elements.machineList = document.getElementById('machine-list');
        elements.recommendationPanel = document.getElementById('recommendation-panel');
        elements.voiceRatingsGrid = document.getElementById('voice-ratings-grid');
        elements.voiceRatingsCount = document.getElementById('voice-ratings-count');
        elements.addMachine = document.getElementById('add-machine');
        elements.sidebarAddMachine = document.getElementById('sidebar-add-machine');
        elements.dialog = document.getElementById('machine-dialog');
        elements.form = document.getElementById('machine-form');
        elements.formError = document.getElementById('machine-form-error');
        elements.dialogTitle = document.getElementById('machine-dialog-title');
        elements.closeDialog = document.getElementById('close-dialog');
        elements.cancelMachine = document.getElementById('cancel-machine');
        elements.presetType = document.getElementById('machine-preset-type');
        elements.presetYear = document.getElementById('machine-preset-year');
        elements.presetModel = document.getElementById('machine-preset-model');
        elements.presetMemory = document.getElementById('machine-preset-memory');
        elements.presetStatus = document.getElementById('machine-preset-status');
        elements.presetFields = [...document.querySelectorAll('[data-machine-preset-field]')];
        elements.accelerator = document.getElementById('machine-accelerator');
        elements.vramField = document.getElementById('vram-field');
        elements.vramInput = document.getElementById('machine-vram');
        elements.machineMatchDialog = document.getElementById('machine-match-dialog');
        elements.machineMatchTitle = document.getElementById('machine-match-dialog-title');
        elements.machineMatchCopy = document.getElementById('machine-match-dialog-copy');
        elements.machineMatchList = document.getElementById('machine-match-list');
        elements.closeMachineMatchDialog = document.getElementById('close-machine-match-dialog');
        elements.cancelMachineMatch = document.getElementById('cancel-machine-match');
        elements.createMachineFromPlan = document.getElementById('create-machine-from-plan');
        elements.compareDialog = document.getElementById('compare-dialog');
        elements.compareDialogBody = document.getElementById('compare-dialog-body');
        elements.closeCompareDialog = document.getElementById('close-compare-dialog');
        elements.testDialog = document.getElementById('test-dialog');
        elements.testForm = document.getElementById('test-form');
        elements.testFormError = document.getElementById('test-form-error');
        elements.closeTestDialog = document.getElementById('close-test-dialog');
        elements.cancelTest = document.getElementById('cancel-test');
        elements.toast = document.getElementById('toast');
    }

    function bindEvents() {
        elements.googleSignIn.addEventListener('click', signInWithGoogle);
        elements.signOut.addEventListener('click', signOut);
        elements.addMachine.addEventListener('click', () => openMachineDialog());
        elements.sidebarAddMachine.addEventListener('click', () => openMachineDialog());
        elements.closeDialog.addEventListener('click', closeMachineDialog);
        elements.cancelMachine.addEventListener('click', closeMachineDialog);
        elements.presetType.addEventListener('change', updatePresetMode);
        elements.presetYear.addEventListener('change', () => populatePresetModels(elements.presetYear.value));
        elements.presetModel.addEventListener('change', () => {
            const preset = selectedMacPreset();
            if (!preset) {
                resetPresetMemory();
                const count = MAC_PRESETS.filter((item) => item.year === Number(elements.presetYear.value)).length;
                setPresetStatus(`${count} Mac${count === 1 ? '' : 's'} introduced in ${elements.presetYear.value}. Choose your exact model.`);
                return;
            }
            populatePresetMemory(preset, preset.defaultRam);
            applySelectedPreset();
        });
        elements.presetMemory.addEventListener('change', applySelectedPreset);
        elements.accelerator.addEventListener('change', updateVramField);
        elements.form.addEventListener('submit', saveMachine);
        elements.closeMachineMatchDialog.addEventListener('click', closeMachineMatchDialog);
        elements.cancelMachineMatch.addEventListener('click', closeMachineMatchDialog);
        elements.createMachineFromPlan.addEventListener('click', createSelectedPendingPlanMachine);
        elements.machineMatchList.addEventListener('click', choosePendingPlanMachine);
        elements.machineMatchDialog.addEventListener('click', (event) => {
            if (event.target === elements.machineMatchDialog) closeMachineMatchDialog();
        });
        elements.closeCompareDialog.addEventListener('click', closeCompareDialog);
        elements.compareDialog.addEventListener('click', (event) => {
            if (event.target === elements.compareDialog) closeCompareDialog();
        });
        elements.closeTestDialog.addEventListener('click', closeTestDialog);
        elements.cancelTest.addEventListener('click', closeTestDialog);
        elements.testForm.addEventListener('submit', saveTestLog);
        elements.testDialog.addEventListener('click', (event) => {
            if (event.target === elements.testDialog) closeTestDialog();
        });
        elements.dialog.addEventListener('click', (event) => {
            if (event.target === elements.dialog) closeMachineDialog();
        });
        document.addEventListener('localclaw:ratings-ready', renderVoiceRatings);
        document.addEventListener('localclaw:rating-updated', renderVoiceRatings);
    }

    async function loadSession() {
        setPageLoading(true);
        try {
            const response = await fetch('/api/auth/get-session', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            });

            if (response.status === 503) {
                trackAccountGoal('auth_error', {
                    provider: 'google', error_stage: 'session_check', error_code: 'account_unavailable', http_status: 503, online: navigator.onLine !== false
                });
                showSignedOut('Accounts are being configured. Please try again shortly.');
                return;
            }

            if (!response.ok) {
                trackAccountGoal('auth_error', {
                    provider: 'google', error_stage: 'session_check', error_code: 'session_check_failed', http_status: response.status, online: navigator.onLine !== false
                });
                showSignedOut('Unable to check your account right now.');
                return;
            }

            const session = await response.json();
            if (!session?.user?.id) {
                showSignedOut(authErrorFromUrl());
                return;
            }

            state.session = session;
            const accountAge = analytics?.accountAgeBucket(session.user) || 'unknown';
            trackAccountGoal('auth_success', {
                provider: 'google',
                account_age: accountAge,
                return_view: analytics?.returnView() || 'machines'
            }, { onceKey: 'auth_success' });
            if (accountAge === 'new') {
                trackAccountGoal('account_created', {
                    provider: 'google',
                    account_age: accountAge,
                    return_view: analytics?.returnView() || 'machines'
                }, { onceKey: 'account_created' });
            }
            showDashboard();
            renderProfile();
            let workspaceReady = false;
            try {
                workspaceReady = await loadWorkspace();
            } catch {
                trackAccountGoal('account_api_error', {
                    error_stage: 'workspace_load',
                    error_code: 'network_error',
                    http_status: 0,
                    online: navigator.onLine !== false
                });
                showToast('Unable to load your workspace right now.', 'error');
            }
            if (!workspaceReady) return;
            document.dispatchEvent(new CustomEvent('localclaw:account-ready', {
                detail: { session: state.session }
            }));
            await resumePendingPlanIfNeeded();
        } catch {
            trackAccountGoal('auth_error', {
                provider: 'google', error_stage: 'session_check', error_code: 'network_error', http_status: 0, online: navigator.onLine !== false
            });
            showSignedOut('Unable to reach the account service.');
        } finally {
            setPageLoading(false);
        }
    }

    async function signInWithGoogle() {
        elements.authError.textContent = '';
        elements.googleSignIn.disabled = true;
        elements.googleSignIn.classList.add('lc-loading');
        trackAccountGoal('auth_started', {
            provider: 'google',
            return_view: analytics?.returnView() || 'machines'
        });
        let failureTracked = false;

        try {
            const currentUrl = new URL(window.location.href);
            const requestedPath = currentUrl.searchParams.get('next');
            currentUrl.searchParams.delete('auth');
            currentUrl.searchParams.delete('next');
            const currentSponsorPath = currentUrl.searchParams.get('view') === 'sponsorship'
                ? `${currentUrl.pathname}${currentUrl.search}`
                : '/account';
            const safePath = requestedPath && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
                ? requestedPath
                : currentSponsorPath;
            const callbackURL = `${window.location.origin}${safePath}`;
            const errorCallbackURL = new URL(callbackURL);
            errorCallbackURL.searchParams.set('auth', 'error');
            const response = await fetch('/api/auth/sign-in/social', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    provider: 'google',
                    callbackURL,
                    errorCallbackURL: errorCallbackURL.toString(),
                    disableRedirect: true
                })
            });
            const data = await readJson(response);

            if (!response.ok || !data?.url) {
                trackAccountGoal('auth_error', {
                    provider: 'google',
                    error_stage: 'oauth_start',
                    error_code: analytics?.errorCode(data?.error, 'oauth_start_failed') || 'oauth_start_failed',
                    http_status: response.status,
                    online: navigator.onLine !== false
                });
                failureTracked = true;
                throw new Error(data?.message || 'Google sign-in is unavailable.');
            }

            window.location.assign(data.url);
        } catch (error) {
            if (!failureTracked) {
                trackAccountGoal('auth_error', {
                    provider: 'google', error_stage: 'oauth_start', error_code: 'network_error', http_status: 0, online: navigator.onLine !== false
                });
            }
            elements.authError.textContent = error.message || 'Google sign-in failed.';
            elements.googleSignIn.disabled = false;
            elements.googleSignIn.classList.remove('lc-loading');
        }
    }

    async function signOut() {
        elements.signOut.disabled = true;
        trackAccountGoal('account_sign_out', { source: 'account_page' });
        try {
            await fetch('/api/auth/sign-out', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: '{}'
            });
        } finally {
            try { localStorage.removeItem('localclaw_primary_machine'); } catch {}
            window.location.assign('/account');
        }
    }

    async function loadWorkspace(preferredId) {
        const [machineResponse, favoriteResponse, catalogResponse] = await Promise.all([
            fetch('/api/machines', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            }),
            fetch('/api/favorites', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            }),
            fetch('/api/catalog-state', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            })
        ]);
        const [machineData, favoriteData, catalogData] = await Promise.all([
            readJson(machineResponse),
            readJson(favoriteResponse),
            readJson(catalogResponse)
        ]);

        if (machineResponse.status === 401) {
            trackAccountGoal('auth_error', {
                provider: 'google', error_stage: 'workspace_load', error_code: 'session_expired', http_status: 401, online: navigator.onLine !== false
            });
            showSignedOut();
            return false;
        }

        if (!machineResponse.ok) {
            trackApiError('machines_load', machineResponse, machineData, 'machines_load_failed');
            showToast(machineData?.message || 'Could not load your machines.', 'error');
            return false;
        }

        state.machines = Array.isArray(machineData?.machines) ? machineData.machines : [];
        state.favorites = favoriteResponse.ok && Array.isArray(favoriteData?.favorites) ? favoriteData.favorites : [];
        state.selectedMachineId = chooseSelectedMachineId(preferredId);
        cachePrimaryMachine();

        if (!favoriteResponse.ok && favoriteResponse.status !== 401) {
            trackApiError('favorites_load', favoriteResponse, favoriteData, 'favorites_load_failed');
            showToast('Saved models are temporarily unavailable.', 'error');
        }

        if (!catalogResponse.ok && catalogResponse.status !== 401) {
            trackApiError('catalog_state_load', catalogResponse, catalogData, 'catalog_state_load_failed');
        }

        await syncCatalogState(catalogResponse.ok ? catalogData : null);
        trackAccountGoal('workspace_loaded', {
            source: 'account_page',
            machine_count: state.machines.length,
            favorite_count: state.favorites.length,
            return_view: analytics?.returnView() || 'machines'
        }, { onceKey: 'workspace_loaded' });
        renderMachineList();
        renderSelectedMachine();
        renderVoiceRatings();
        return true;
    }

    async function syncCatalogState(catalogData) {
        const currentIds = currentLocalModelIds();

        if (!catalogData?.initialized) {
            state.knownModelIds = currentIds;
            state.newModelIds = [];
            await updateCatalogState(currentIds, false);
            return;
        }

        state.knownModelIds = Array.isArray(catalogData.knownModelIds) ? catalogData.knownModelIds : [];
        const known = new Set(state.knownModelIds);
        state.newModelIds = currentIds.filter((id) => !known.has(id));
    }

    function chooseSelectedMachineId(preferredId) {
        if (preferredId && state.machines.some((machine) => machine.id === preferredId)) {
            return preferredId;
        }
        const requestedId = new URLSearchParams(window.location?.search || '').get('fitMachine');
        if (requestedId && state.machines.some((machine) => machine.id === requestedId)) {
            return requestedId;
        }
        if (state.selectedMachineId && state.machines.some((machine) => machine.id === state.selectedMachineId)) {
            return state.selectedMachineId;
        }
        const primary = state.machines.find((machine) => machine.isPrimary);
        return primary?.id || state.machines[0]?.id || null;
    }

    function rememberSelectedMachine(machine) {
        // Restore owned hardware from the account, not the specs supplied in a URL.
        window.LocalClawFitContext?.select(machine, { notify: false });
    }

    function modelHref(modelId, machine) {
        const href = `/models/${encodeURIComponent(modelId)}`;
        return window.LocalClawFitContext?.withMachine(href, machine) || href;
    }

    function cachePrimaryMachine() {
        const primary = state.machines.find((machine) => machine.isPrimary) || state.machines[0] || null;
        try {
            if (primary) {
                localStorage.setItem('localclaw_primary_machine', JSON.stringify(primary));
                localStorage.setItem('localclaw_saved_machines', JSON.stringify(state.machines.map((machine) => ({
                    id: machine.id,
                    name: machine.name,
                    platform: machine.platform,
                    accelerator: machine.accelerator,
                    ramGb: machine.ramGb,
                    vramGb: machine.vramGb,
                    isPrimary: machine.isPrimary === true
                }))));
            } else {
                localStorage.removeItem('localclaw_primary_machine');
                localStorage.removeItem('localclaw_saved_machines');
            }
        } catch {}
    }

    function renderProfile() {
        const user = state.session?.user;
        if (!user) return;

        const avatar = user.image
            ? `<img src="${escapeAttribute(user.image)}" width="38" height="38" alt="" referrerpolicy="no-referrer">`
            : `<span class="lc-profile-fallback" aria-hidden="true">${escapeHtml((user.name || user.email || 'U').charAt(0).toUpperCase())}</span>`;

        elements.profile.innerHTML = `
            ${avatar}
            <span><strong>${escapeHtml(user.name || 'LocalClaw user')}</strong><br>${escapeHtml(user.email || '')}</span>
        `;
    }

    function renderVoiceRatings() {
        if (!elements.voiceRatingsGrid || !elements.voiceRatingsCount) return;

        const ratings = (window.LocalClawRatings?.getUserRatings?.() || [])
            .filter((item) => String(item.modelId || '').startsWith('tts-'))
            .sort((a, b) => b.rating - a.rating || a.modelId.localeCompare(b.modelId));

        elements.voiceRatingsCount.textContent = `${ratings.length} rated`;
        if (!ratings.length) {
            elements.voiceRatingsGrid.innerHTML = `
                <div class="lc-voice-ratings-empty">No voice ratings yet. Open the TTS catalogue, choose a model and share a 1–5 star rating.</div>
            `;
            return;
        }

        elements.voiceRatingsGrid.innerHTML = ratings.map((item) => {
            const slug = item.modelId.slice(4);
            return `
                <article class="lc-voice-rating-item">
                    <h3><a href="/tts/${encodeURIComponent(slug)}">${escapeHtml(voiceModelName(slug))}</a></h3>
                    <div data-community-rating data-model-id="${escapeAttribute(item.modelId)}" data-rating-mode="interactive" data-rating-theme="voice" data-rating-label="Community voice rating" data-rating-subject="voice model"></div>
                </article>
            `;
        }).join('');
        window.LocalClawRatings?.refresh(elements.voiceRatingsGrid);
    }

    function voiceModelName(slug) {
        const acronyms = new Map([
            ['tts', 'TTS'], ['asr', 'ASR'], ['ai', 'AI'], ['mlx', 'MLX'], ['onnx', 'ONNX'],
            ['vits', 'VITS'], ['xtts', 'XTTS'], ['gpt', 'GPT'], ['sovits', 'SoVITS'], ['f5', 'F5']
        ]);
        return String(slug || '').split('-').filter(Boolean).map((part) => {
            const lower = part.toLowerCase();
            if (acronyms.has(lower)) return acronyms.get(lower);
            if (/^qwen\d/.test(lower)) return `Qwen${lower.slice(4)}`;
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join(' ');
    }

    function renderMachineList() {
        if (!state.machines.length) {
            elements.machineList.innerHTML = `
                <div class="lc-sidebar-empty">No hardware saved yet. Add a machine to build your compatibility list.</div>
            `;
            return;
        }

        elements.machineList.innerHTML = state.machines.map((machine) => {
            const newFitCount = countNewFitsForMachine(machine);
            return `
                <button class="lc-machine-item${machine.id === state.selectedMachineId ? ' is-active' : ''}" type="button" data-machine-id="${escapeAttribute(machine.id)}">
                    <span class="lc-machine-icon" aria-hidden="true">${machineIcon(machine)}</span>
                    <span>
                        <span class="lc-machine-name">${escapeHtml(machine.name)}</span>
                        <span class="lc-machine-spec">${escapeHtml(machineSpec(machine))}</span>
                    </span>
                    <span class="lc-machine-signals">
                        ${newFitCount ? `<span class="lc-machine-new" title="New compatible models">+${newFitCount}</span>` : ''}
                        ${machine.isPrimary ? '<span class="lc-primary-dot" title="Primary machine"></span>' : ''}
                    </span>
                </button>
            `;
        }).join('');

        elements.machineList.querySelectorAll('[data-machine-id]').forEach((button) => {
            button.addEventListener('click', () => {
                if (state.selectedMachineId !== button.dataset.machineId) {
                    state.compareModelIds = [];
                    state.upgradeModelId = null;
                }
                state.selectedMachineId = button.dataset.machineId;
                renderMachineList();
                renderSelectedMachine();
            });
        });
    }

    function renderSelectedMachine() {
        const machine = state.machines.find((item) => item.id === state.selectedMachineId);
        if (!machine) {
            elements.recommendationPanel.innerHTML = `
                <div class="lc-empty-state">
                    <div>
                        <h2>Add your first machine</h2>
                        <p>Your compatible model list will appear here.</p>
                        <button class="lc-button lc-button-primary" type="button" data-empty-add>+ Add machine</button>
                    </div>
                </div>
            `;
            elements.recommendationPanel.querySelector('[data-empty-add]')?.addEventListener('click', () => openMachineDialog());
            return;
        }

        rememberSelectedMachine(machine);
        const result = window.LocalClawCompatibility.rankModels(machine, indexableLocalModels());
        const compatibleById = new Map(result.compatible.map((model) => [model.id, model]));
        const machineFavorites = state.favorites.filter((favorite) => favorite.machineId === machine.id);
        const favoriteById = new Map(machineFavorites.map((favorite) => [favorite.modelId, favorite]));
        const newIds = new Set(state.newModelIds);
        state.compareModelIds = state.compareModelIds.filter((modelId) => compatibleById.has(modelId));
        const selectedCompareModels = state.compareModelIds.map((modelId) => compatibleById.get(modelId)).filter(Boolean);
        let models = result.compatible.slice(0, 18);

        if (state.viewMode === 'saved') {
            models = machineFavorites
                .map((favorite) => savedModelForFavorite(favorite, compatibleById))
                .filter(Boolean);
        } else if (state.viewMode === 'new') {
            models = result.compatible.filter((model) => newIds.has(model.id));
        }

        const bestCount = result.compatible.filter((model) => model.compatibilityTier === 'best').length;
        const newFitCount = result.compatible.filter((model) => newIds.has(model.id)).length;
        const primaryModel = result.compatible[0] || null;
        const emptyCopy = state.viewMode === 'saved'
            ? ['No saved models for this machine', 'Use the star on any recommendation to build a focused shortlist.']
            : state.viewMode === 'new'
                ? ['No new compatible models', 'You are caught up. New catalogue additions that fit this machine will appear here.']
                : ['No compatible models found', 'Try increasing available memory or changing this hardware profile.'];

        elements.recommendationPanel.innerHTML = `
            ${primaryModel ? renderPlanOverview(machine, primaryModel, newFitCount) : ''}
            ${renderMachineFamilySummary(machine, result.compatible)}
            <header class="lc-recommendation-head">
                <div>
                    <p class="lc-kicker">Selected hardware</p>
                    <h2>${escapeHtml(machine.name)}</h2>
                    <p>${escapeHtml(fullMachineSpec(machine))}</p>
                </div>
                <div class="lc-head-actions">
                    <button class="lc-button" type="button" data-edit-machine>Edit</button>
                    <button class="lc-button lc-button-danger" type="button" data-delete-machine>Delete</button>
                </div>
            </header>

            <div class="lc-summary-row">
                <div class="lc-summary-cell"><span class="lc-summary-value">${result.compatible.length}</span><span class="lc-summary-label">Compatible models</span></div>
                <div class="lc-summary-cell"><span class="lc-summary-value">${bestCount}</span><span class="lc-summary-label">Best matches</span></div>
                <div class="lc-summary-cell"><span class="lc-summary-value">${machineFavorites.length}</span><span class="lc-summary-label">Saved for this machine</span></div>
            </div>

            <div class="lc-model-toolbar" role="tablist" aria-label="Model views">
                <button class="lc-view-tab${state.viewMode === 'compatible' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${state.viewMode === 'compatible'}" data-model-view="compatible">Compatible</button>
                <button class="lc-view-tab${state.viewMode === 'saved' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${state.viewMode === 'saved'}" data-model-view="saved">Saved <span>${machineFavorites.length}</span></button>
                <button class="lc-view-tab${state.viewMode === 'new' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${state.viewMode === 'new'}" data-model-view="new">Plan updates <span>${newFitCount}</span></button>
                ${state.newModelIds.length ? '<button class="lc-mark-seen" type="button" data-mark-seen>Mark catalogue seen</button>' : ''}
            </div>

            ${selectedCompareModels.length ? renderCompareTray(selectedCompareModels) : ''}

            ${models.length ? `
                <div class="lc-model-grid">
                    ${models.map((model) => renderModelCard(
                        model,
                        machine,
                        favoriteById.get(model.id),
                        state.compareModelIds.includes(model.id),
                        compatibleById.has(model.id)
                    )).join('')}
                </div>
            ` : `
                <div class="lc-model-empty">
                    <h3>${emptyCopy[0]}</h3>
                    <p>${emptyCopy[1]}</p>
                </div>
            `}

            ${renderUpgradePlanner(machine, compatibleById)}
        `;

        window.LocalClawRatings?.refresh(elements.recommendationPanel);

        elements.recommendationPanel.querySelector('[data-edit-machine]')?.addEventListener('click', () => openMachineDialog(machine));
        elements.recommendationPanel.querySelector('[data-delete-machine]')?.addEventListener('click', () => deleteMachine(machine));
        elements.recommendationPanel.querySelectorAll('[data-model-view]').forEach((button) => {
            button.addEventListener('click', () => {
                state.viewMode = button.dataset.modelView;
                renderSelectedMachine();
            });
        });
        elements.recommendationPanel.querySelector('[data-mark-seen]')?.addEventListener('click', acknowledgeNewModels);
        elements.recommendationPanel.querySelectorAll('[data-favorite-model]').forEach((button) => {
            button.addEventListener('click', () => toggleFavorite(button.dataset.favoriteModel, machine));
        });
        elements.recommendationPanel.querySelectorAll('[data-favorite-status]').forEach((select) => {
            select.addEventListener('change', () => updateFavoriteStatus(select.dataset.favoriteStatus, machine, select.value));
        });
        elements.recommendationPanel.querySelectorAll('[data-compare-model]').forEach((button) => {
            button.addEventListener('click', () => toggleComparison(button.dataset.compareModel));
        });
        elements.recommendationPanel.querySelector('[data-open-comparison]')?.addEventListener('click', () => openCompareDialog(machine, compatibleById));
        elements.recommendationPanel.querySelector('[data-clear-comparison]')?.addEventListener('click', () => {
            state.compareModelIds = [];
            renderSelectedMachine();
        });
        elements.recommendationPanel.querySelectorAll('[data-open-test]').forEach((button) => {
            button.addEventListener('click', () => openTestDialog(button.dataset.openTest, machine));
        });
        elements.recommendationPanel.querySelectorAll('[data-account-model-open]').forEach((link) => {
            link.addEventListener('click', () => {
                trackAccountGoal('account_model_open', {
                    source: 'account_recommendations',
                    view: state.viewMode,
                    model_id: link.dataset.accountModelOpen
                });
            });
        });
        elements.recommendationPanel.querySelector('[data-upgrade-model]')?.addEventListener('change', (event) => {
            state.upgradeModelId = event.target.value;
            renderSelectedMachine();
        });
        elements.recommendationPanel.querySelector('[data-plan-primary-model]')?.addEventListener('click', (event) => {
            trackAccountGoal('plan_action_clicked', {
                source: 'account_plan',
                action: 'open_primary_model',
                model_id: event.currentTarget.dataset.planPrimaryModel,
                ...machineAnalytics(machine)
            });
        });

        const recommendationKey = `${machine.id}:${state.viewMode}`;
        if (!state.recommendationViewKeys.has(recommendationKey)) {
            state.recommendationViewKeys.add(recommendationKey);
            trackAccountGoal('account_recommendation_viewed', {
                source: 'account_workspace',
                view: state.viewMode,
                shown_count: models.length,
                best_match_count: bestCount,
                saved_count: machineFavorites.length,
                ...machineAnalytics(machine)
            });
        }
        if (state.viewMode === 'new') {
            trackAccountGoal('plan_update_viewed', {
                source: 'account_plan',
                update_count: newFitCount,
                plan_state: newFitCount ? 'changed' : 'current',
                ...machineAnalytics(machine)
            }, { onceKey: `plan_update_viewed:${machine.id}:${newFitCount}` });
        }
    }

    function renderPlanOverview(machine, primaryModel, updateCount) {
        const useCase = useCaseLabel(machine.useCase).toLowerCase();
        const priority = priorityLabel(machine.priority);
        const stateLabel = updateCount
            ? `${updateCount} new compatible ${updateCount === 1 ? 'model' : 'models'}`
            : 'Plan current';
        const stateClass = updateCount ? ' has-updates' : '';
        return `
            <section class="lc-plan-overview" aria-labelledby="account-plan-title">
                <div class="lc-plan-overview__main">
                    <div class="lc-plan-overview__status${stateClass}"><span aria-hidden="true"></span>${escapeHtml(stateLabel)}</div>
                    <p class="lc-kicker">My Local AI Plan</p>
                    <h2 id="account-plan-title">${escapeHtml(primaryModel.name)} is your best current fit for ${escapeHtml(useCase)}.</h2>
                    <p>This plan follows <strong>${escapeHtml(machine.name)}</strong>, your ${escapeHtml(priority.toLowerCase())} preference and the current LocalClaw catalogue.</p>
                    <div class="lc-plan-overview__signals">
                        <span>${escapeHtml(primaryModel.recommended_quant || 'Recommended quant')}</span>
                        <span>${escapeHtml(primaryModel.runtimeNote || 'Local runtime')}</span>
                        <span>${escapeHtml(formatNumber(primaryModel.compatibilityScore))}/100 personal fit</span>
                    </div>
                </div>
                <div class="lc-plan-overview__action">
                    <span>Next action</span>
                    <strong>Run the recommended setup</strong>
                    <a class="lc-button lc-button-primary lc-button-full" href="${escapeAttribute(modelHref(primaryModel.id, machine))}" data-plan-primary-model="${escapeAttribute(primaryModel.id)}">Open ${escapeHtml(primaryModel.name)}</a>
                    <small>Plan updates appear here when a stronger compatible model enters the catalogue.</small>
                </div>
            </section>
        `;
    }

    function renderMachineFamilySummary(machine, compatibleLlmModels) {
        const families = machineFamilySummaries(machine, compatibleLlmModels);
        return `
            <section class="lc-machine-families" aria-labelledby="machine-families-title">
                <header class="lc-machine-families__head">
                    <div>
                        <p class="lc-kicker">All local AI paths</p>
                        <h2 id="machine-families-title">What ${escapeHtml(machine.name)} can run</h2>
                    </div>
                    <p>Counts use the same local catalogue metadata as the dedicated directories. Voice is shown only as an explicit hardware tag, not a RAM or VRAM fit.</p>
                </header>
                <div class="lc-machine-families__grid">
                    ${families.map((family) => renderMachineFamilyCard(family, machine)).join('')}
                </div>
            </section>
        `;
    }

    function machineFamilySummaries(machine, compatibleLlmModels) {
        const llmModels = Array.isArray(compatibleLlmModels) ? compatibleLlmModels : [];
        const speechModels = Array.isArray(window.HOME_INDEX_SPEECH_MODELS) ? window.HOME_INDEX_SPEECH_MODELS : [];
        const localAiModels = Array.isArray(window.LOCAL_AI_CATALOG)
            ? window.LOCAL_AI_CATALOG.filter((model) => model?.local_status === 'local')
            : [];

        return MACHINE_FAMILIES.map((family) => {
            if (family.key === 'llm') {
                return {
                    ...family,
                    state: llmModels.length ? 'ready' : 'none',
                    stateLabel: llmModels.length ? 'Ready' : 'No verified fit',
                    count: llmModels.length,
                    countLabel: 'compatible local models',
                    model: llmModels[0] || null,
                    modelLabel: 'Current best match',
                    note: llmModels.length
                        ? 'Ranked by the shared LocalClaw compatibility engine.'
                        : 'No local LLM satisfies the saved hardware profile.'
                };
            }

            if (family.key === 'voice') return voiceFamilySummary(family, machine, speechModels);

            const models = localAiModels.filter((model) => model.category === family.key);
            const compatible = models.filter((model) => multimodalModelFitsMachine(model, machine));
            const lowestFloor = compatible.slice().sort(compareMultimodalFloor)[0] || null;
            return {
                ...family,
                state: compatible.length ? 'ready' : 'none',
                stateLabel: compatible.length ? 'Ready' : 'No verified fit',
                count: compatible.length,
                countLabel: 'verified local fits',
                model: lowestFloor,
                modelLabel: 'Lowest verified floor',
                note: compatible.length
                    ? multimodalFitNote(machine)
                    : multimodalConstraintNote(models, machine)
            };
        });
    }

    function voiceFamilySummary(family, machine, speechModels) {
        const hardwareTag = voiceHardwareTag(machine);
        if (!hardwareTag) {
            return {
                ...family,
                state: 'constraint',
                stateLabel: 'Constraints known',
                count: 0,
                countLabel: 'explicit hardware tags',
                model: null,
                modelLabel: '',
                note: 'The canonical Voice metadata has no AMD hardware tag, so no Voice compatibility is claimed.'
            };
        }

        const tagged = speechModels
            .filter((model) => Array.isArray(model?.hardware) && model.hardware.includes(hardwareTag))
            .sort(compareCanonicalSpeechScore);
        return {
            ...family,
            state: tagged.length ? 'tagged' : 'none',
            stateLabel: tagged.length ? 'Hardware tagged' : 'No verified tag',
            count: tagged.length,
            countLabel: 'explicit hardware tags',
            model: tagged[0] || null,
            modelLabel: tagged.length ? 'Top audio score' : '',
            note: tagged.length
                ? voiceConstraintNote(machine, hardwareTag)
                : `No Voice record is explicitly tagged for this ${hardwareTag.toUpperCase()} path.`
        };
    }

    function voiceHardwareTag(machine) {
        if (machine.accelerator === 'apple-silicon') return 'apple';
        if (machine.accelerator === 'cpu') return 'cpu';
        if (machine.accelerator === 'nvidia') return 'gpu';
        return '';
    }

    function finiteNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function compareCanonicalSpeechScore(left, right) {
        const score = (model) => Math.min(10, (finiteNumber(model?.quality, 0) * 0.68) + (finiteNumber(model?.speed, 0) * 0.32));
        return score(right) - score(left)
            || finiteNumber(right?.quality, 0) - finiteNumber(left?.quality, 0)
            || finiteNumber(right?.speed, 0) - finiteNumber(left?.speed, 0)
            || String(left?.name || '').localeCompare(String(right?.name || ''), 'en');
    }

    function multimodalModelFitsMachine(model, machine) {
        const platforms = Array.isArray(model?.platforms) ? model.platforms : [];
        const accelerators = Array.isArray(model?.accelerators) ? model.accelerators : [];
        const ramFits = finiteNumber(model?.min_ram_gb, 0) <= finiteNumber(machine?.ramGb, 0);
        const needsSeparateVram = machine?.accelerator === 'nvidia' || machine?.accelerator === 'amd';
        const requiredVram = finiteNumber(model?.min_vram_gb, 0);
        const vramFits = !needsSeparateVram
            || requiredVram === 0
            || (machine?.vramGb !== null && machine?.vramGb !== '' && finiteNumber(machine?.vramGb, -1) >= requiredVram);
        return platforms.includes(machine?.platform)
            && accelerators.includes(machine?.accelerator)
            && ramFits
            && vramFits;
    }

    function compareMultimodalFloor(left, right) {
        return finiteNumber(left?.min_ram_gb, 0) - finiteNumber(right?.min_ram_gb, 0)
            || finiteNumber(left?.min_vram_gb, 0) - finiteNumber(right?.min_vram_gb, 0)
            || String(left?.name || '').localeCompare(String(right?.name || ''), 'en');
    }

    function multimodalFitNote(machine) {
        if (machine.accelerator === 'apple-silicon' || machine.accelerator === 'cpu') {
            return 'Verified by OS, compute path and unified/system RAM; separate VRAM is not used for this machine.';
        }
        if (machine.vramGb === null || machine.vramGb === '') {
            return 'No separate-VRAM fit can be verified without a saved VRAM value.';
        }
        return 'Verified by OS, compute path, system RAM and separate VRAM.';
    }

    function multimodalConstraintNote(models, machine) {
        if (!models.length) return 'No verified local catalogue records are available in this family yet.';
        const platformMatches = models.filter((model) => (model.platforms || []).includes(machine.platform));
        if (!platformMatches.length) return 'No verified local record supports this operating system.';
        const computeMatches = platformMatches.filter((model) => (model.accelerators || []).includes(machine.accelerator));
        if (!computeMatches.length) return 'No verified local record supports this compute path.';
        if ((machine.accelerator === 'nvidia' || machine.accelerator === 'amd') && (machine.vramGb === null || machine.vramGb === '')) {
            return 'A separate VRAM value is required before this GPU path can be verified.';
        }
        return 'Available records exceed the saved RAM or VRAM floor.';
    }

    function voiceConstraintNote(machine, hardwareTag) {
        if (machine.accelerator === 'nvidia') {
            return 'Generic GPU tag only: CUDA support and VRAM floors are not consistently published. Verify each guide.';
        }
        return `Explicit ${hardwareTag.toUpperCase()} tag only: canonical Voice records do not consistently publish RAM or VRAM floors.`;
    }

    function renderMachineFamilyCard(family, machine) {
        let modelMarkup = '';
        if (family.model) {
            const modelPath = family.key === 'llm'
                ? modelHref(family.model.id, machine)
                : family.key === 'voice'
                    ? `/tts/${encodeURIComponent(family.model.id)}`
                    : `/${family.key === '3d' ? '3d' : family.key}/${encodeURIComponent(family.model.id)}`;
            modelMarkup = `
                <span class="lc-machine-family__model-label">${escapeHtml(family.modelLabel)}</span>
                <a class="lc-machine-family__model" href="${escapeAttribute(modelPath)}">${escapeHtml(family.model.name)}</a>
            `;
        }
        return `
            <article class="lc-machine-family" data-state="${escapeAttribute(family.state)}">
                <div class="lc-machine-family__top">
                    <h3>${escapeHtml(family.label)}</h3>
                    <span class="lc-machine-family__state">${escapeHtml(family.stateLabel)}</span>
                </div>
                <strong class="lc-machine-family__count">${formatNumber(family.count)}</strong>
                <span class="lc-machine-family__count-label">${escapeHtml(family.countLabel || (family.count === 1 ? 'verified record' : 'verified records'))}</span>
                ${modelMarkup}
                <p>${escapeHtml(family.note)}</p>
                <a class="lc-machine-family__catalogue" href="${family.catalogue}">Open ${escapeHtml(family.label)} catalogue →</a>
            </article>
        `;
    }

    function renderModelCard(model, machine, favorite, isCompared, canCompare) {
        const reasons = [...model.compatibilityReasons];
        reasons.push(`${formatNumber(model.size_gb)} GB model`);
        const saved = Boolean(favorite);

        return `
            <article class="lc-model-card" data-tier="${escapeAttribute(model.compatibilityTier)}">
                <div class="lc-model-meta">
                    <span class="lc-model-family">${escapeHtml(model.family || 'local model')}</span>
                    <button class="lc-favorite-button${saved ? ' is-saved' : ''}" type="button" data-favorite-model="${escapeAttribute(model.id)}" aria-label="${saved ? 'Remove' : 'Save'} ${escapeAttribute(model.name)} ${saved ? 'from' : 'for'} ${escapeAttribute(machine.name)}" title="${saved ? 'Remove from saved models' : `Save for ${escapeAttribute(machine.name)}`}">${saved ? '★' : '☆'}</button>
                    <span class="lc-tier-pill">${escapeHtml(model.compatibilityLabel)}</span>
                </div>
                <h3>${escapeHtml(model.name)}</h3>
                <div data-community-rating data-model-id="${escapeAttribute(model.id)}" data-rating-mode="interactive"></div>
                <p>${escapeHtml(model.description || 'Local model in the LocalClaw catalogue.')}</p>
                <div class="lc-reason-list">
                    ${reasons.slice(0, 4).map((reason) => `<span class="lc-spec-pill">${escapeHtml(reason)}</span>`).join('')}
                </div>
                ${saved ? `
                    <div class="lc-saved-controls">
                        <span>${escapeHtml(favorite.quantization || model.recommended_quant || 'Recommended quant')}</span>
                        <label>
                            <span class="sr-only">Saved model status</span>
                            <select data-favorite-status="${escapeAttribute(model.id)}">
                                ${favoriteStatusOptions(favorite.status)}
                            </select>
                        </label>
                        <button class="lc-test-button" type="button" data-open-test="${escapeAttribute(model.id)}">Test log</button>
                    </div>
                    ${renderTestSummary(favorite)}
                ` : ''}
                <footer class="lc-model-footer">
                    <span>${escapeHtml(model.runtimeNote)}</span>
                    <span class="lc-model-actions">
                        ${canCompare ? `<button class="lc-compare-button${isCompared ? ' is-selected' : ''}" type="button" data-compare-model="${escapeAttribute(model.id)}" aria-pressed="${isCompared ? 'true' : 'false'}">${isCompared ? 'Selected' : 'Compare'}</button>` : ''}
                        <a class="lc-model-link" href="${escapeAttribute(modelHref(model.id, machine))}" data-account-model-open="${escapeAttribute(model.id)}">View model →</a>
                    </span>
                </footer>
            </article>
        `;
    }

    function renderCompareTray(models) {
        const canCompare = models.length >= 2;
        return `
            <section class="lc-compare-tray" aria-label="Selected models for comparison">
                <div>
                    <span class="lc-compare-count">${models.length}/4 selected</span>
                    <span class="lc-compare-names">${models.map((model) => escapeHtml(model.name)).join(' · ')}</span>
                </div>
                <div class="lc-compare-tray-actions">
                    <button class="lc-button" type="button" data-clear-comparison>Clear</button>
                    <button class="lc-button lc-button-primary" type="button" data-open-comparison${canCompare ? '' : ' disabled'}>Compare ${canCompare ? 'models' : 'after 2 picks'}</button>
                </div>
            </section>
        `;
    }

    function toggleComparison(modelId) {
        if (state.compareModelIds.includes(modelId)) {
            state.compareModelIds = state.compareModelIds.filter((id) => id !== modelId);
        } else if (state.compareModelIds.length >= 4) {
            showToast('Compare up to four models at a time.', 'error');
            return;
        } else {
            state.compareModelIds = [...state.compareModelIds, modelId];
        }
        renderSelectedMachine();
    }

    function openCompareDialog(machine, compatibleById) {
        const models = state.compareModelIds.map((modelId) => compatibleById.get(modelId)).filter(Boolean);
        if (models.length < 2) {
            showToast('Select at least two compatible models.', 'error');
            return;
        }

        trackAccountGoal('account_compare_open', {
            source: 'account_recommendations',
            shown_count: models.length,
            ...machineAnalytics(machine)
        });

        const bestScore = Math.max(...models.map((model) => Number(model.compatibilityScore) || 0));
        const rows = [
            ['Personal fit', (model) => `${formatNumber(model.compatibilityScore)}/100`],
            ['Fit tier', (model) => model.compatibilityLabel],
            ['Parameters', (model) => model.params || 'Not listed'],
            ['Model size', (model) => `${formatNumber(model.size_gb)} GB`],
            ['Minimum RAM', (model) => `${formatNumber(model.min_ram)} GB`],
            ['Recommended quant', (model) => model.recommended_quant || 'Not listed'],
            ['Community', (model) => formatCommunityRating(model.id)],
            ['Quality', (model) => benchmarkValue(model, 'quality')],
            ['Coding', (model) => benchmarkValue(model, 'coding')],
            ['Reasoning', (model) => benchmarkValue(model, 'reasoning')],
            ['Speed', (model) => benchmarkValue(model, 'speed')],
            ['Saved status', (model) => getFavorite(machine.id, model.id)?.status || 'Not saved']
        ];

        elements.compareDialogBody.innerHTML = `
            <p class="lc-compare-intro">A side-by-side view for <strong>${escapeHtml(machine.name)}</strong>. Scores use the same hardware, use-case and priority settings as your recommendations.</p>
            <div class="lc-comparison-scroll">
                <table class="lc-comparison-table">
                    <thead>
                        <tr>
                            <th scope="col">Metric</th>
                            ${models.map((model) => `
                                <th scope="col">
                                    ${Number(model.compatibilityScore) === bestScore ? '<span class="lc-recommended-tag">Recommended</span>' : ''}
                                    <a href="${escapeAttribute(modelHref(model.id, machine))}">${escapeHtml(model.name)}</a>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(([label, valueFor]) => `
                            <tr>
                                <th scope="row">${escapeHtml(label)}</th>
                                ${models.map((model) => `<td>${escapeHtml(valueFor(model))}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        elements.compareDialog.showModal();
    }

    function closeCompareDialog() {
        if (elements.compareDialog.open) elements.compareDialog.close();
    }

    function renderTestSummary(favorite) {
        const hasTest = favorite.testVerdict && favorite.testVerdict !== 'untested';
        const hasSpeed = Number(favorite.measuredTps) > 0;
        const hasNotes = Boolean(String(favorite.notes || '').trim());
        if (!hasTest && !hasSpeed && !hasNotes) return '';

        const note = String(favorite.notes || '').trim();
        const shortNote = note.length > 110 ? `${note.slice(0, 107)}...` : note;
        return `
            <div class="lc-test-summary">
                <div class="lc-test-summary-head">
                    <span class="lc-test-verdict" data-verdict="${escapeAttribute(favorite.testVerdict || 'untested')}">${escapeHtml(testVerdictLabel(favorite.testVerdict))}</span>
                    ${hasSpeed ? `<strong>${formatNumber(favorite.measuredTps)} tok/s</strong>` : ''}
                    ${favorite.lastTestedAt ? `<time datetime="${escapeAttribute(favorite.lastTestedAt)}">${escapeHtml(formatShortDate(favorite.lastTestedAt))}</time>` : ''}
                </div>
                ${hasNotes ? `<p>${escapeHtml(shortNote)}</p>` : ''}
            </div>
        `;
    }

    function openTestDialog(modelId, machine) {
        const favorite = getFavorite(machine.id, modelId);
        const model = APP_DATA.models.find((item) => item.id === modelId);
        if (!favorite || !model) {
            showToast('Save this model before recording a test.', 'error');
            return;
        }

        elements.testForm.reset();
        elements.testFormError.textContent = '';
        document.getElementById('test-machine-id').value = machine.id;
        document.getElementById('test-model-id').value = model.id;
        document.getElementById('test-status').value = favorite.status || 'saved';
        document.getElementById('test-verdict').value = favorite.testVerdict || 'untested';
        document.getElementById('test-quantization').value = favorite.quantization || model.recommended_quant || '';
        document.getElementById('test-tps').value = favorite.measuredTps ?? '';
        document.getElementById('test-notes').value = favorite.notes || '';
        document.getElementById('test-dialog-copy').textContent = `${model.name} on ${machine.name}`;
        elements.testDialog.showModal();
        window.setTimeout(() => document.getElementById('test-verdict').focus(), 30);
    }

    function closeTestDialog() {
        if (elements.testDialog.open) elements.testDialog.close();
    }

    async function saveTestLog(event) {
        event.preventDefault();
        if (state.saving) return;

        const formData = new FormData(elements.testForm);
        const machineId = String(formData.get('machineId') || '');
        const modelId = String(formData.get('modelId') || '');
        const measuredValue = String(formData.get('measuredTps') || '').trim();
        const payload = {
            machineId,
            status: String(formData.get('status') || 'saved'),
            testVerdict: String(formData.get('testVerdict') || 'untested'),
            quantization: String(formData.get('quantization') || ''),
            measuredTps: measuredValue ? Number(measuredValue) : null,
            notes: String(formData.get('notes') || '')
        };

        state.saving = true;
        elements.testForm.classList.add('lc-loading');
        elements.testFormError.textContent = '';

        try {
            const response = await fetch(`/api/favorites/${encodeURIComponent(modelId)}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await readJson(response);
            if (!response.ok || !data?.favorite) {
                trackApiError('test_log_save', response, data, 'test_log_save_failed');
                throw new Error(data?.message || 'Could not save this test log.');
            }

            state.favorites = [data.favorite, ...state.favorites.filter((favorite) => !(favorite.machineId === machineId && favorite.modelId === modelId))];
            const testMachine = state.machines.find((machine) => machine.id === machineId);
            trackAccountGoal('test_log_saved', {
                source: 'account_recommendations',
                model_id: modelId,
                status: payload.status,
                verdict: payload.testVerdict,
                ...(testMachine ? machineAnalytics(testMachine) : {})
            });
            closeTestDialog();
            renderSelectedMachine();
            showToast(payload.testVerdict === 'untested' ? 'Private test log saved.' : 'Test saved. You can now share a community rating.');
            if (payload.testVerdict !== 'untested') {
                window.setTimeout(() => window.LocalClawRatings?.focus(modelId, elements.recommendationPanel), 120);
            }
        } catch (error) {
            elements.testFormError.textContent = error.message || 'Could not save this test log.';
        } finally {
            state.saving = false;
            elements.testForm.classList.remove('lc-loading');
        }
    }

    function renderUpgradePlanner(machine, compatibleById) {
        const candidates = upgradeCandidates(machine, compatibleById);
        if (!candidates.length) return '';

        if (!state.upgradeModelId || !candidates.some((model) => model.id === state.upgradeModelId)) {
            state.upgradeModelId = candidates[0].id;
        }

        const target = candidates.find((model) => model.id === state.upgradeModelId) || candidates[0];
        const requiredRam = target.upgradePlan.ramGb;
        const optionalVram = target.upgradePlan.fullOffloadVramGb;
        const gpuUpgrade = optionalVram !== null && optionalVram > Number(machine.vramGb || 0);
        const isApple = machine.accelerator === 'apple-silicon';
        const advice = isApple
            ? `Apple unified memory cannot be expanded after purchase. A ${requiredRam} GB unified-memory Mac meets the memory estimate for this model at 8K context.`
            : machine.accelerator === 'nvidia'
                ? `The system-memory target is ${requiredRam} GB RAM at 8K context, keeping your ${formatNumber(machine.vramGb)} GB GPU. CPU or partial GPU offload may be needed.${gpuUpgrade ? ` A separate ${optionalVram} GB VRAM tier is an optional full-offload estimate, not a requirement for this RAM fit.` : ''}`
                : `The system-memory target is ${requiredRam} GB RAM at 8K context. GPU acceleration depends on your runtime and operating system.`;
        const primaryLink = isApple ? '/computers#apple-machines-title' : '/ram-gpu-for-local-ai#ram-picks';
        const primaryLabel = isApple ? 'Browse Apple systems' : 'Browse RAM upgrades';

        return `
            <section class="lc-upgrade-planner" aria-labelledby="upgrade-planner-title">
                <div class="lc-upgrade-heading">
                    <div>
                        <p class="lc-kicker">Hardware upgrade planner</p>
                        <h3 id="upgrade-planner-title">Which memory upgrade would improve model fit?</h3>
                    </div>
                    <label>
                        <span>Target model</span>
                        <select data-upgrade-model>
                            ${candidates.slice(0, 80).map((model) => `<option value="${escapeAttribute(model.id)}"${model.id === target.id ? ' selected' : ''}>${escapeHtml(model.name)} · ${formatNumber(model.size_gb)} GB</option>`).join('')}
                        </select>
                    </label>
                </div>
                <div class="lc-upgrade-result">
                    <div><span>Current machine</span><strong>${escapeHtml(machine.ramGb)} GB${machine.vramGb ? ` · ${escapeHtml(machine.vramGb)} GB VRAM` : ''}</strong></div>
                    <div><span>${isApple ? 'Unified-memory target' : 'System RAM target'}</span><strong>${requiredRam} GB${isApple ? ' unified memory' : ' RAM'}</strong></div>
                    <div><span>Model size</span><strong>${formatNumber(target.size_gb)} GB</strong></div>
                </div>
                <p class="lc-upgrade-copy">${escapeHtml(advice)} These are conservative planning estimates, not a performance guarantee.</p>
                <div class="lc-upgrade-actions">
                    <a class="lc-button lc-button-primary" href="${primaryLink}">${primaryLabel}</a>
                    ${gpuUpgrade ? '<a class="lc-button" href="/ram-gpu-for-local-ai#gpu-picks">Optional GPU upgrade</a>' : ''}
                    <a class="lc-button" href="${escapeAttribute(modelHref(target.id, machine))}">View target model</a>
                </div>
            </section>
        `;
    }

    function upgradeCandidates(machine, compatibleById) {
        const ranking = window.LocalClawModelRanking;
        if (!ranking?.normalizeMachine || !ranking?.scoreModel || !ranking?.calculateHardwareFit || !ranking?.isLocallyEligible) return [];
        const profile = ranking.normalizeMachine({ ...machine, context: '8k' });
        if (!['macos', 'windows', 'linux'].includes(profile.platform)) return [];
        if (profile.accelerator === 'nvidia' && !(profile.vramGb > 0)) return [];
        const verification = APP_DATA.hfRepoVerification || {};
        const ramTiers = profile.accelerator === 'apple-silicon'
            ? [8, 16, 24, 32, 36, 48, 64, 96, 128, 192, 256, 512]
            : [8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024];
        const seen = new Set();
        return indexableLocalModels()
            .filter((model) => {
                if (seen.has(model.id)) return false;
                seen.add(model.id);
                if (compatibleById.has(model.id) || !ranking.isLocallyEligible(model)) return false;
                // Extra RAM does not resolve download access or special runtime
                // requirements. Restrict purchase guidance to verified GGUFs.
                if (!verification.publicGguf?.[model.id] || verification.gated?.[model.id] || model.gated || model.custom_runtime) return false;
                if (Array.isArray(model.platforms) && !model.platforms.includes(profile.platform)) return false;
                if (Array.isArray(model.accelerators) && !model.accelerators.includes(profile.accelerator)) return false;
                const currentFit = ranking.calculateHardwareFit(profile, model);
                if (currentFit.compatible && currentFit.fitState !== 'tight') return false;
                return true;
            })
            .map((model) => {
                // Keep CPU, OS and GPU unchanged while finding a RAM increase
                // that actually passes the same account fit engine at 8K.
                const ramGb = ramTiers.find((ram) => ram > profile.ramGb && ranking.scoreModel(
                    { ...profile, ramGb: ram }, {}, model, { includeTight: false }
                ).compatible);
                if (!ramGb) return null;
                let fullOffloadVramGb = null;
                if (profile.accelerator === 'nvidia') {
                    const upgradedFit = ranking.calculateHardwareFit({ ...profile, ramGb }, model);
                    const fullOffloadMemory = (upgradedFit.modelSize + upgradedFit.contextOverhead) / 0.88;
                    fullOffloadVramGb = [8, 12, 16, 24, 32, 48, 64, 80, 96, 128, 192].find(
                        (vram) => vram >= profile.vramGb && vram >= fullOffloadMemory
                    ) || null;
                }
                return { ...model, upgradePlan: { ramGb, fullOffloadVramGb } };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const memoryDelta = a.upgradePlan.ramGb - b.upgradePlan.ramGb;
                if (memoryDelta) return memoryDelta;
                return Number(b.benchmarks?.quality || 0) - Number(a.benchmarks?.quality || 0);
            });
    }

    function benchmarkValue(model, key) {
        const value = Number(model.benchmarks?.[key]);
        return Number.isFinite(value) ? `${formatNumber(value)}/10` : 'Not listed';
    }

    function formatCommunityRating(modelId) {
        const aggregate = window.LocalClawRatings?.get(modelId);
        if (!aggregate?.count) return 'Not rated';
        return `${Number(aggregate.average).toFixed(1)}/5 · ${aggregate.count} vote${aggregate.count === 1 ? '' : 's'}`;
    }

    function testVerdictLabel(verdict) {
        if (verdict === 'works') return 'Works well';
        if (verdict === 'limited') return 'Works with limits';
        if (verdict === 'failed') return 'Did not work';
        return 'Not tested';
    }

    function formatShortDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }

    function savedModelForFavorite(favorite, compatibleById) {
        const compatible = compatibleById.get(favorite.modelId);
        if (compatible) return compatible;

        const model = APP_DATA.models.find((item) => item.id === favorite.modelId);
        if (!model || model.hosted_only) return null;

        return {
            ...model,
            compatibilityTier: 'too-large',
            compatibilityLabel: 'No longer fits',
            compatibilityReasons: ['Hardware profile changed', `${model.min_ram || '?'} GB minimum RAM`],
            runtimeNote: 'Review this machine before installing'
        };
    }

    async function toggleFavorite(modelId, machine) {
        const current = getFavorite(machine.id, modelId);
        const model = APP_DATA.models.find((item) => item.id === modelId);
        if (!model) return;

        const response = await fetch(
            current
                ? `/api/favorites/${encodeURIComponent(modelId)}?machineId=${encodeURIComponent(machine.id)}`
                : `/api/favorites/${encodeURIComponent(modelId)}`,
            {
                method: current ? 'DELETE' : 'PUT',
                credentials: 'same-origin',
                headers: current
                    ? { Accept: 'application/json' }
                    : { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: current ? undefined : JSON.stringify({
                    machineId: machine.id,
                    status: 'saved',
                    quantization: model.recommended_quant || ''
                })
            }
        );
        const data = await readJson(response);

        if (!response.ok) {
            trackApiError(current ? 'model_remove' : 'model_save', response, data, current ? 'model_remove_failed' : 'model_save_failed');
            showToast(data?.message || 'Could not update this saved model.', 'error');
            return;
        }

        if (current) {
            state.favorites = state.favorites.filter((favorite) => !(favorite.machineId === machine.id && favorite.modelId === modelId));
            trackAccountGoal('model_removed', {
                source: 'account_recommendations', model_id: modelId, ...machineAnalytics(machine)
            });
            showToast('Removed from saved models.');
        } else if (data?.favorite) {
            state.favorites = [data.favorite, ...state.favorites.filter((favorite) => !(favorite.machineId === machine.id && favorite.modelId === modelId))];
            trackAccountGoal('model_saved', {
                source: 'account_recommendations',
                model_id: modelId,
                quantization: String(model.recommended_quant || ''),
                ...machineAnalytics(machine)
            });
            showToast(`Saved for ${machine.name}.`);
        }

        renderSelectedMachine();
    }

    async function updateFavoriteStatus(modelId, machine, status) {
        const current = getFavorite(machine.id, modelId);
        if (!current) return;

        const response = await fetch(`/api/favorites/${encodeURIComponent(modelId)}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                machineId: machine.id,
                status,
                quantization: current.quantization
            })
        });
        const data = await readJson(response);

        if (!response.ok || !data?.favorite) {
            trackApiError('model_status_update', response, data, 'model_status_update_failed');
            showToast(data?.message || 'Could not update model status.', 'error');
            renderSelectedMachine();
            return;
        }

        state.favorites = [data.favorite, ...state.favorites.filter((favorite) => !(favorite.machineId === machine.id && favorite.modelId === modelId))];
        trackAccountGoal('model_status_updated', {
            source: 'account_recommendations', model_id: modelId, status, ...machineAnalytics(machine)
        });
        showToast('Saved model status updated.');
        renderSelectedMachine();
    }

    async function acknowledgeNewModels() {
        const currentIds = currentLocalModelIds();
        const updated = await updateCatalogState(currentIds, true);
        if (!updated) return;

        state.knownModelIds = currentIds;
        state.newModelIds = [];
        if (state.viewMode === 'new') state.viewMode = 'compatible';
        renderSelectedMachine();
    }

    async function updateCatalogState(modelIds, notify) {
        try {
            const response = await fetch('/api/catalog-state', {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ knownModelIds: modelIds })
            });
            const data = await readJson(response);
            if (!response.ok) throw new Error(data?.message || 'Could not update catalogue state.');
            if (notify) showToast('New-model feed cleared.');
            return true;
        } catch (error) {
            if (notify) showToast(error.message || 'Could not update catalogue state.', 'error');
            return false;
        }
    }

    function currentLocalModelIds() {
        return [...new Set(indexableLocalModels().map((model) => model.id))];
    }

    function indexableLocalModels() {
        const unavailable = new Set(Object.keys(APP_DATA.hfRepoVerification?.unavailable || {}));
        return APP_DATA.models.filter((model) => (
            model?.id
            && !model.hosted_only
            && Number(model.size_gb) > 0
            && !unavailable.has(model.id)
        ));
    }

    function countNewFitsForMachine(machine) {
        if (!state.newModelIds.length || !machine) return 0;
        const newIds = new Set(state.newModelIds);
        return window.LocalClawCompatibility.rankModels(machine, indexableLocalModels()).compatible.filter((model) => newIds.has(model.id)).length;
    }

    function getFavorite(machineId, modelId) {
        return state.favorites.find((favorite) => favorite.machineId === machineId && favorite.modelId === modelId) || null;
    }

    function favoriteStatusOptions(selected) {
        return [
            ['saved', 'Saved'],
            ['to-test', 'To test'],
            ['downloaded', 'Downloaded'],
            ['installed', 'Installed']
        ].map(([value, label]) => `<option value="${value}"${selected === value ? ' selected' : ''}>${label}</option>`).join('');
    }

    function openMachineDialog(machine) {
        trackAccountGoal(machine?.id ? 'machine_update_started' : 'machine_create_started', {
            source: 'account_workspace',
            machine_action: machine?.id ? 'update' : 'create',
            ...(machine?.id ? machineAnalytics(machine) : {})
        });
        elements.form.reset();
        elements.formError.textContent = '';
        document.getElementById('machine-id').value = machine?.id || '';
        document.getElementById('machine-source').value = machine?.source || 'manual';
        document.getElementById('machine-name').value = machine?.name || '';
        document.getElementById('machine-platform').value = machine?.platform || 'macos';
        elements.accelerator.value = machine?.accelerator || 'apple-silicon';
        document.getElementById('machine-ram').value = machine?.ramGb || 16;
        elements.vramInput.value = machine?.vramGb ?? '';
        document.getElementById('machine-cpu').value = machine?.cpuModel || '';
        document.getElementById('machine-gpu').value = machine?.gpuModel || '';
        document.getElementById('machine-use-case').value = machine?.useCase || 'general';
        document.getElementById('machine-priority').value = machine?.priority || 'balanced';
        document.getElementById('machine-primary').checked = machine?.isPrimary === true || state.machines.length === 0;
        elements.dialogTitle.textContent = machine?.id ? 'Edit machine' : 'Add machine';
        updateVramField();
        initializePresetPicker(machine);
        elements.dialog.showModal();
        window.setTimeout(() => {
            const target = machine?.id ? document.getElementById('machine-name') : elements.presetYear;
            target.focus();
        }, 30);
    }

    function closeMachineDialog() {
        if (elements.dialog.open) elements.dialog.close();
    }

    function updateVramField() {
        const showVram = elements.accelerator.value !== 'apple-silicon' && elements.accelerator.value !== 'cpu';
        elements.vramField.hidden = !showVram;
        elements.vramInput.required = elements.accelerator.value === 'nvidia';
        if (!showVram) elements.vramInput.value = '';
    }

    function initializePresetPicker(machine) {
        const preset = findPresetForMachine(machine);
        const isManualMachine = machine && (machine.platform !== 'macos' || machine.accelerator !== 'apple-silicon');
        elements.presetType.value = isManualMachine ? 'manual' : 'mac';

        if (isManualMachine) {
            updatePresetMode();
            return;
        }

        setPresetFieldsHidden(false);
        populatePresetYears(preset ? String(preset.year) : '');
        if (!preset) {
            resetPresetModel();
            setPresetStatus(machine ? 'This Mac is not in the quick list. Keep the specifications below or choose another model.' : 'Choose the year your Mac model was introduced.');
            return;
        }

        populatePresetModels(String(preset.year), preset.id);
        populatePresetMemory(preset, machine?.ramGb || preset.defaultRam);
        setPresetStatus(`${preset.name} matched. Confirm its installed memory below.`, true);
    }

    function updatePresetMode() {
        const manual = elements.presetType.value === 'manual';
        setPresetFieldsHidden(manual);

        if (manual) {
            setPresetStatus('Enter the operating system, compute and memory specifications below.');
            return;
        }

        document.getElementById('machine-platform').value = 'macos';
        elements.accelerator.value = 'apple-silicon';
        updateVramField();
        populatePresetYears(elements.presetYear.value);
        if (elements.presetYear.value) {
            populatePresetModels(elements.presetYear.value, elements.presetModel.value);
        } else {
            resetPresetModel();
            setPresetStatus('Choose the year your Mac model was introduced.');
        }
    }

    function setPresetFieldsHidden(hidden) {
        elements.presetFields.forEach((field) => {
            field.hidden = hidden;
            const select = field.querySelector('select');
            if (select) select.disabled = hidden;
        });
    }

    function populatePresetYears(selectedYear = '') {
        const years = [...new Set(MAC_PRESETS.map((preset) => preset.year))].sort((a, b) => b - a);
        elements.presetYear.innerHTML = '<option value="">Choose a year</option>' + years
            .map((year) => `<option value="${year}">${year}</option>`)
            .join('');
        if (years.includes(Number(selectedYear))) elements.presetYear.value = String(selectedYear);
        elements.presetYear.disabled = false;
    }

    function populatePresetModels(year, selectedId = '') {
        const matches = MAC_PRESETS
            .filter((preset) => preset.year === Number(year))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (!matches.length) {
            resetPresetModel();
            setPresetStatus('Choose the year your Mac model was introduced.');
            return;
        }

        elements.presetModel.disabled = false;
        elements.presetModel.innerHTML = '<option value="">Choose a Mac model</option>' + matches
            .map((preset) => `<option value="${escapeAttribute(preset.id)}">${escapeHtml(preset.name)}</option>`)
            .join('');

        if (matches.some((preset) => preset.id === selectedId)) {
            elements.presetModel.value = selectedId;
            return;
        }

        resetPresetMemory();
        setPresetStatus(`${matches.length} Mac${matches.length === 1 ? '' : 's'} introduced in ${year}. Choose your exact model.`);
    }

    function populatePresetMemory(preset, selectedRam) {
        const memoryOptions = [...new Set(preset.ram)].sort((a, b) => a - b);
        const requestedRam = Number(selectedRam);
        const memory = memoryOptions.includes(requestedRam) ? requestedRam : preset.defaultRam;
        elements.presetMemory.disabled = false;
        elements.presetMemory.innerHTML = memoryOptions
            .map((ram) => `<option value="${ram}">${ram} GB unified memory</option>`)
            .join('');
        elements.presetMemory.value = String(memory);
    }

    function resetPresetModel() {
        elements.presetModel.innerHTML = '<option value="">Choose a year first</option>';
        elements.presetModel.disabled = true;
        resetPresetMemory();
    }

    function resetPresetMemory() {
        elements.presetMemory.innerHTML = '<option value="">Choose a model first</option>';
        elements.presetMemory.disabled = true;
    }

    function selectedMacPreset() {
        return MAC_PRESETS.find((preset) => preset.id === elements.presetModel.value) || null;
    }

    function applySelectedPreset() {
        const preset = selectedMacPreset();
        if (!preset) return;

        const memory = Number(elements.presetMemory.value || preset.defaultRam);
        document.getElementById('machine-name').value = preset.name;
        document.getElementById('machine-platform').value = 'macos';
        elements.accelerator.value = 'apple-silicon';
        document.getElementById('machine-cpu').value = preset.chip;
        document.getElementById('machine-gpu').value = '';
        document.getElementById('machine-ram').value = String(memory);
        elements.vramInput.value = '';
        document.getElementById('machine-source').value = 'manual';
        updateVramField();
        setPresetStatus(`${preset.name} · ${memory} GB. Specifications filled; confirm the memory in About This Mac.`, true);
    }

    function findPresetForMachine(machine) {
        if (!machine || machine.platform !== 'macos' || machine.accelerator !== 'apple-silicon') return null;
        const name = normalizeMachineLabel(machine.name);
        if (!name) return null;
        return MAC_PRESETS.find((preset) => normalizeMachineLabel(preset.name) === name) || null;
    }

    function normalizeMachineLabel(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function setPresetStatus(message, ready = false) {
        elements.presetStatus.textContent = message;
        elements.presetStatus.classList.toggle('is-ready', ready);
    }

    async function saveMachine(event) {
        event.preventDefault();
        if (state.saving) return;

        const formData = new FormData(elements.form);
        const id = String(formData.get('id') || '');
        const action = id ? 'update' : 'create';
        const isFirstMachine = !id && state.machines.length === 0;
        const machine = {
            name: String(formData.get('name') || ''),
            platform: String(formData.get('platform') || ''),
            accelerator: String(formData.get('accelerator') || ''),
            cpuModel: String(formData.get('cpuModel') || ''),
            gpuModel: String(formData.get('gpuModel') || ''),
            ramGb: Number(formData.get('ramGb')),
            vramGb: formData.get('vramGb') === '' ? null : Number(formData.get('vramGb')),
            useCase: String(formData.get('useCase') || 'general'),
            priority: String(formData.get('priority') || 'balanced'),
            isPrimary: formData.get('isPrimary') === 'on',
            source: String(formData.get('source') || 'manual')
        };

        state.saving = true;
        elements.form.classList.add('lc-loading');
        elements.formError.textContent = '';
        let response = null;
        let data = null;
        let failureTracked = false;

        try {
            response = await fetch(id ? `/api/machines/${encodeURIComponent(id)}` : '/api/machines', {
                method: id ? 'PATCH' : 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(machine)
            });
            data = await readJson(response);

            if (!response.ok) {
                const failureEvent = id ? 'machine_update_failed' : 'machine_create_failed';
                const errorCode = analytics?.errorCode(data?.error, 'machine_save_failed') || 'machine_save_failed';
                trackAccountGoal(failureEvent, {
                    source: 'account_workspace',
                    machine_action: action,
                    error_stage: 'machine_save',
                    error_code: errorCode,
                    http_status: response.status,
                    online: navigator.onLine !== false,
                    ...machineAnalytics(machine)
                });
                trackApiError('machine_save', response, data, 'machine_save_failed');
                failureTracked = true;
                const fieldMessage = Array.isArray(data?.fields) && data.fields.length
                    ? `Check: ${data.fields.join(', ')}.`
                    : '';
                throw new Error(data?.message || fieldMessage || 'Could not save this machine.');
            }

            trackAccountGoal(id ? 'machine_update_succeeded' : 'machine_create_succeeded', {
                source: 'account_workspace',
                machine_action: action,
                is_first_machine: isFirstMachine,
                ...machineAnalytics(machine)
            });
            if (!id && machine.source === 'finder') {
                trackAccountGoal('plan_saved', {
                    source: 'account_plan_fallback',
                    save_mode: 'reviewed',
                    is_first_machine: isFirstMachine,
                    ...machineAnalytics(machine)
                });
            }
            closeMachineDialog();
            localStorage.removeItem(PENDING_PLAN_KEY);
            localStorage.removeItem(PENDING_MACHINE_KEY);
            await refreshSavedPlanWorkspace(data.machine?.id || id, id ? 'Machine updated.' : 'Machine added.');
        } catch (error) {
            if (!failureTracked) {
                trackAccountGoal(id ? 'machine_update_failed' : 'machine_create_failed', {
                    source: 'account_workspace',
                    machine_action: action,
                    error_stage: 'machine_save',
                    error_code: 'network_error',
                    http_status: Number(response?.status || 0),
                    online: navigator.onLine !== false,
                    ...machineAnalytics(machine)
                });
                trackApiError('machine_save', response, data, 'network_error');
            }
            elements.formError.textContent = error.message || 'Could not save this machine.';
        } finally {
            state.saving = false;
            elements.form.classList.remove('lc-loading');
        }
    }

    async function deleteMachine(machine) {
        const confirmed = window.confirm(`Delete “${machine.name}” from your account?`);
        if (!confirmed) return;

        const response = await fetch(`/api/machines/${encodeURIComponent(machine.id)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        const data = await readJson(response);

        if (!response.ok) {
            showToast(data?.message || 'Could not delete this machine.', 'error');
            return;
        }

        state.selectedMachineId = null;
        await loadWorkspace();
        showToast('Machine deleted.');
    }

    function prepareAuthGateForPendingPlan() {
        const pending = readPendingPlan();
        if (!pending) return;
        const title = document.querySelector('#auth-gate .lc-auth-panel h2');
        const copy = document.querySelector('#auth-gate .lc-auth-panel > p');
        if (title) title.textContent = 'Save this Local AI Plan';
        if (copy) copy.textContent = pending.machine.accelerator === 'nvidia' && pending.machine.vramGb === null
            ? 'Your recommendation is ready. Continue with Google, then confirm your GPU memory to save this plan.'
            : 'Your recommendation is ready. Continue with Google once and LocalClaw will save the plan automatically.';
        if (elements.googleSignIn) {
            const label = [...elements.googleSignIn.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            if (label) label.textContent = ' Save my plan with Google';
        }
    }

    function readPendingPlan() {
        const rawPlan = localStorage.getItem(PENDING_PLAN_KEY);
        const rawMachine = localStorage.getItem(PENDING_MACHINE_KEY);
        if (!rawPlan && !rawMachine) return null;
        try {
            const parsed = rawPlan ? JSON.parse(rawPlan) : { version: 0, machine: JSON.parse(rawMachine) };
            const machine = parsed?.machine;
            if (!isValidPendingMachine(machine)) throw new Error('invalid_pending_machine');
            return {
                version: Number(parsed.version || 0),
                machine: {
                    name: String(machine.name || '').slice(0, 60),
                    platform: String(machine.platform || ''),
                    accelerator: String(machine.accelerator || ''),
                    cpuModel: String(machine.cpuModel || '').slice(0, 80),
                    gpuModel: String(machine.gpuModel || '').slice(0, 80),
                    ramGb: Number(machine.ramGb),
                    vramGb: machine.vramGb == null || machine.vramGb === '' ? null : Number(machine.vramGb),
                    useCase: String(machine.useCase || 'general'),
                    priority: String(machine.priority || 'balanced'),
                    isPrimary: state.machines.length === 0,
                    source: 'finder'
                },
                preferredMachineId: String(parsed.preferredMachineId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80),
                topModelId: String(parsed.topModelId || ''),
                source: String(parsed.source || 'model_finder')
            };
        } catch {
            localStorage.removeItem(PENDING_PLAN_KEY);
            localStorage.removeItem(PENDING_MACHINE_KEY);
            return null;
        }
    }

    function isValidPendingMachine(machine) {
        if (!machine || typeof machine !== 'object') return false;
        if (!String(machine.name || '').trim()) return false;
        if (!['macos', 'windows', 'linux'].includes(String(machine.platform || ''))) return false;
        if (!['apple-silicon', 'nvidia', 'amd', 'cpu'].includes(String(machine.accelerator || ''))) return false;
        if (!['general', 'chat', 'coding', 'reasoning', 'vision', 'creative'].includes(String(machine.useCase || ''))) return false;
        if (!['balanced', 'quality', 'speed', 'memory'].includes(String(machine.priority || ''))) return false;
        const ram = Number(machine.ramGb);
        const vram = machine.vramGb == null || machine.vramGb === '' ? null : Number(machine.vramGb);
        if (!Number.isFinite(ram) || ram < 4 || ram > 2048) return false;
        if (vram !== null && (!Number.isFinite(vram) || vram < 0 || vram > 256)) return false;
        return true;
    }

    function samePlanMachine(left, right) {
        const comparable = (machine) => [
            machine.platform,
            machine.accelerator,
            Number(machine.ramGb),
            machine.vramGb === null || machine.vramGb === '' ? null : Number(machine.vramGb),
            machine.useCase,
            machine.priority
        ];
        return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
    }

    function sameHardwareProfile(left, right) {
        const vram = (machine) => machine?.vramGb === null || machine?.vramGb === '' || machine?.vramGb === undefined
            ? null
            : Number(machine.vramGb);
        return String(left?.platform || '') === String(right?.platform || '')
            && String(left?.accelerator || '') === String(right?.accelerator || '')
            && Number(left?.ramGb) === Number(right?.ramGb)
            && vram(left) === vram(right);
    }

    function resolvePendingPlanMachine(machines, pending) {
        const hardwareMatches = machines.filter((machine) => sameHardwareProfile(machine, pending.machine));
        const preferred = pending.preferredMachineId
            ? hardwareMatches.find((machine) => machine.id === pending.preferredMachineId)
            : null;
        const exactMatches = hardwareMatches.filter((machine) => samePlanMachine(machine, pending.machine));

        if (preferred) return { mode: 'reuse', machine: preferred, matches: hardwareMatches, matchSource: 'preferred_machine' };
        if (exactMatches.length === 1) return { mode: 'reuse', machine: exactMatches[0], matches: hardwareMatches, matchSource: 'exact_plan' };
        if (hardwareMatches.length === 1) return { mode: 'reuse', machine: hardwareMatches[0], matches: hardwareMatches, matchSource: 'unique_hardware' };
        if (hardwareMatches.length > 1) return { mode: 'choose', machine: null, matches: hardwareMatches, matchSource: 'multiple_hardware' };
        return { mode: 'create', machine: null, matches: [], matchSource: 'no_hardware_match' };
    }

    function trackMachineMatchShown(pending, matches, matchSource) {
        const machine = matches[0] || pending.machine;
        trackAccountGoal('existing_machine_match_shown', {
            source: 'account_plan_handoff',
            match_source: matchSource,
            match_count: matches.length,
            top_model: pending.topModelId,
            ...machineAnalytics(machine)
        }, { onceKey: `existing_machine_match_shown:${pending.topModelId}:${machine.platform}:${machine.ramGb}` });
    }

    function openMachineMatchDialog(pending, matches) {
        state.pendingPlanSelection = { pending, matches };
        elements.machineMatchTitle.textContent = matches.length > 1
            ? 'Which saved machine should use this plan?'
            : 'Reuse this saved machine?';
        elements.machineMatchCopy.textContent = matches.length > 1
            ? 'LocalClaw found more than one hardware match. Choose one to update its recommendations without creating a duplicate.'
            : 'This hardware already exists in your account. Reuse it to keep one clean machine profile and one current plan.';
        elements.machineMatchList.innerHTML = matches.map((machine) => `
            <button class="lc-machine-match" type="button" data-machine-match-id="${escapeAttribute(machine.id)}">
                <span class="lc-machine-match__icon" aria-hidden="true">${machineIcon(machine)}</span>
                <span class="lc-machine-match__copy">
                    <strong>${escapeHtml(machine.name)}</strong>
                    <small>${escapeHtml(machineSpec(machine))}</small>
                </span>
                <span class="lc-machine-match__action">Use this machine</span>
            </button>
        `).join('');
        elements.machineMatchDialog.showModal();
        window.setTimeout(() => elements.machineMatchList.querySelector('button')?.focus(), 30);
    }

    function closeMachineMatchDialog() {
        if (elements.machineMatchDialog.open) elements.machineMatchDialog.close();
    }

    async function choosePendingPlanMachine(event) {
        const button = event.target.closest('[data-machine-match-id]');
        if (!button || state.saving || !state.pendingPlanSelection) return;
        const machine = state.pendingPlanSelection.matches.find((item) => item.id === button.dataset.machineMatchId);
        if (!machine) return;
        await reusePendingPlanMachine(machine, state.pendingPlanSelection.pending, 'user_choice');
    }

    async function createSelectedPendingPlanMachine() {
        if (state.saving || !state.pendingPlanSelection) return;
        const pending = state.pendingPlanSelection.pending;
        closeMachineMatchDialog();
        state.pendingPlanSelection = null;
        trackAccountGoal('new_machine_requested', {
            source: 'account_plan_handoff',
            match_source: 'user_requested_new',
            top_model: pending.topModelId,
            ...machineAnalytics(pending.machine)
        });
        await createPendingPlanMachine(pending);
    }

    async function reusePendingPlanMachine(machine, pending, matchSource) {
        if (state.saving) return;
        state.saving = true;
        const preferencesUpdated = machine.useCase !== pending.machine.useCase || machine.priority !== pending.machine.priority;
        let response = null;
        let data = null;
        let selectedMachine = machine;

        try {
            if (preferencesUpdated) {
                trackAccountGoal('machine_update_started', {
                    source: 'account_plan_reuse',
                    machine_action: 'update_preferences',
                    ...machineAnalytics(machine)
                });
                response = await fetch(`/api/machines/${encodeURIComponent(machine.id)}`, {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        useCase: pending.machine.useCase,
                        priority: pending.machine.priority
                    })
                });
                data = await readJson(response);
                if (!response.ok || !data?.machine?.id) throw new Error(data?.message || 'machine_reuse_failed');
                selectedMachine = data.machine;
                trackAccountGoal('machine_update_succeeded', {
                    source: 'account_plan_reuse',
                    machine_action: 'update_preferences',
                    ...machineAnalytics(selectedMachine)
                });
            }

            closeMachineMatchDialog();
            state.pendingPlanSelection = null;
            clearPendingPlan();
            state.selectedMachineId = selectedMachine.id;
            state.viewMode = 'compatible';
            trackAccountGoal('existing_machine_reused', {
                source: 'account_plan_handoff',
                match_source: matchSource,
                preferences_updated: preferencesUpdated,
                top_model: pending.topModelId,
                ...machineAnalytics(selectedMachine)
            });
            trackAccountGoal('duplicate_machine_avoided', {
                source: 'account_plan_handoff',
                match_source: matchSource,
                top_model: pending.topModelId,
                ...machineAnalytics(selectedMachine)
            });
            trackAccountGoal('plan_saved', {
                source: 'account_plan_handoff',
                save_mode: 'existing_reused',
                top_model: pending.topModelId,
                ...machineAnalytics(selectedMachine)
            });
            if (preferencesUpdated) {
                await refreshSavedPlanWorkspace(selectedMachine.id, `Plan linked to ${selectedMachine.name}. No duplicate machine created.`);
            }
            else {
                renderMachineList();
                renderSelectedMachine();
                cachePrimaryMachine();
                showToast(`Plan linked to ${selectedMachine.name}. No duplicate machine created.`);
            }
        } catch (error) {
            if (preferencesUpdated) {
                trackAccountGoal('machine_update_failed', {
                    source: 'account_plan_reuse',
                    machine_action: 'update_preferences',
                    error_stage: 'existing_machine_reuse',
                    error_code: analytics?.errorCode(data?.error, 'machine_reuse_failed') || 'machine_reuse_failed',
                    http_status: Number(response?.status || 0),
                    online: navigator.onLine !== false,
                    ...machineAnalytics(machine)
                });
            }
            trackAccountGoal('plan_save_failed', {
                source: 'account_plan_handoff',
                error_stage: 'existing_machine_reuse',
                error_code: analytics?.errorCode(data?.error, 'machine_reuse_failed') || 'machine_reuse_failed',
                http_status: Number(response?.status || 0),
                online: navigator.onLine !== false,
                ...machineAnalytics(machine)
            });
            openMachineMatchDialog(pending, [machine]);
            showToast(error?.message || 'Could not reuse this machine. Choose it again or save a new profile.', 'error');
        } finally {
            state.saving = false;
        }
    }

    function clearPendingPlan() {
        localStorage.removeItem(PENDING_PLAN_KEY);
        localStorage.removeItem(PENDING_MACHINE_KEY);
    }

    async function resumePendingPlanIfNeeded() {
        const pending = readPendingPlan();
        if (!pending || state.saving) return;

        // The finder permits skipping exact GPU memory. Keep the handoff until
        // the user supplies it; the existing form requires VRAM for NVIDIA.
        if (pending.machine.accelerator === 'nvidia' && pending.machine.vramGb === null) {
            openMachineDialog({ ...pending.machine, id: '' });
            elements.formError.textContent = 'Enter your NVIDIA GPU memory (VRAM in GB) to save this plan. Your recommendation has been kept.';
            return;
        }

        const resolution = resolvePendingPlanMachine(state.machines, pending);
        if (resolution.matches.length) {
            trackMachineMatchShown(pending, resolution.matches, resolution.matchSource);
            if (resolution.mode === 'reuse') {
                return reusePendingPlanMachine(resolution.machine, pending, resolution.matchSource);
            }
            openMachineMatchDialog(pending, resolution.matches);
            return;
        }

        trackAccountGoal('new_machine_requested', {
            source: 'account_plan_handoff',
            match_source: resolution.matchSource,
            top_model: pending.topModelId,
            ...machineAnalytics(pending.machine)
        });
        await createPendingPlanMachine(pending);
    }

    async function createPendingPlanMachine(pending) {
        state.saving = true;
        let response = null;
        let data = null;
        let savedMachineId = null;
        try {
            trackAccountGoal('machine_create_started', {
                source: 'account_plan_handoff',
                machine_action: 'create',
                is_first_machine: state.machines.length === 0,
                ...machineAnalytics(pending.machine)
            });
            response = await fetch('/api/machines', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(pending.machine)
            });
            data = await readJson(response);
            if (!response.ok || !data?.machine?.id) {
                throw new Error(data?.message || 'automatic_plan_save_failed');
            }

            clearPendingPlan();
            trackAccountGoal('machine_create_succeeded', {
                source: 'account_plan_handoff',
                machine_action: 'create',
                is_first_machine: state.machines.length === 0,
                ...machineAnalytics(pending.machine)
            });
            trackAccountGoal('plan_saved', {
                source: 'account_plan_handoff',
                save_mode: 'automatic',
                top_model: pending.topModelId,
                is_first_machine: state.machines.length === 0,
                ...machineAnalytics(pending.machine)
            });
            savedMachineId = data.machine.id;
        } catch (error) {
            const errorCode = analytics?.errorCode(data?.error, 'automatic_plan_save_failed') || 'automatic_plan_save_failed';
            trackAccountGoal('plan_save_failed', {
                source: 'account_plan_handoff',
                error_stage: 'automatic_save',
                error_code: errorCode,
                http_status: Number(response?.status || 0),
                online: navigator.onLine !== false,
                ...machineAnalytics(pending.machine)
            });
            openMachineDialog({ ...pending.machine, id: '' });
            elements.formError.textContent = error?.message === 'automatic_plan_save_failed'
                ? 'Automatic save was unavailable. Review the details and save once.'
                : String(error?.message || 'Review the details and save once.');
            showToast('One quick review is needed before saving this plan.', 'error');
        } finally {
            state.saving = false;
        }

        if (!savedMachineId) return;
        await refreshSavedPlanWorkspace(savedMachineId, 'Plan saved. We will keep these matches current.');
    }

    async function refreshSavedPlanWorkspace(machineId, successMessage) {
        // A failed refresh cannot undo a successful POST. Never reopen a new
        // machine form after persistence, which could create a duplicate.
        try {
            const refreshed = await loadWorkspace(machineId);
            if (refreshed === false) throw new Error('workspace_refresh_failed');
            state.viewMode = 'compatible';
            renderMachineList();
            renderSelectedMachine();
            showToast(successMessage);
        } catch {
            trackAccountGoal('account_api_error', {
                source: 'account_plan_handoff',
                error_stage: 'workspace_refresh',
                error_code: 'workspace_refresh_failed',
                online: navigator.onLine !== false
            });
            showToast('Your plan is saved. Reload this page to display it.', 'error');
        }
    }

    function showSignedOut(message) {
        state.session = null;
        elements.dashboard.hidden = true;
        elements.authGate.hidden = false;
        const callbackError = authErrorFromUrl();
        if (callbackError) {
            trackAccountGoal('auth_error', {
                provider: 'google',
                error_stage: 'oauth_callback',
                error_code: 'oauth_callback_failed',
                http_status: 0,
                online: navigator.onLine !== false
            }, { onceKey: 'oauth_callback_failed' });
        }
        elements.authError.textContent = message || callbackError;
    }

    function showDashboard() {
        elements.authGate.hidden = true;
        elements.dashboard.hidden = false;
    }

    function authErrorFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('auth') === 'error' ? 'Google sign-in could not be completed. Please try again.' : '';
    }

    function setPageLoading(isLoading) {
        document.body.classList.toggle('lc-loading', isLoading);
    }

    function showToast(message, kind = 'success') {
        elements.toast.textContent = message;
        elements.toast.dataset.kind = kind;
        elements.toast.hidden = false;
        window.clearTimeout(showToast.timeout);
        showToast.timeout = window.setTimeout(() => {
            elements.toast.hidden = true;
        }, 3600);
    }

    async function readJson(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    function machineIcon(machine) {
        if (machine.accelerator === 'apple-silicon') return 'A';
        if (machine.accelerator === 'nvidia') return 'N';
        if (machine.accelerator === 'amd') return 'R';
        return 'C';
    }

    function machineSpec(machine) {
        const memory = machine.accelerator === 'apple-silicon'
            ? `${machine.ramGb} GB unified`
            : `${machine.ramGb} GB RAM`;
        return `${platformLabel(machine.platform)} · ${memory}`;
    }

    function fullMachineSpec(machine) {
        const parts = [platformLabel(machine.platform), `${machine.ramGb} GB ${machine.accelerator === 'apple-silicon' ? 'unified memory' : 'RAM'}`];
        if (machine.cpuModel) parts.push(machine.cpuModel);
        if (machine.gpuModel) parts.push(machine.gpuModel);
        if (machine.vramGb) parts.push(`${machine.vramGb} GB VRAM`);
        parts.push(`${useCaseLabel(machine.useCase)} · ${priorityLabel(machine.priority)}`);
        return parts.join(' · ');
    }

    function useCaseLabel(value) {
        return ({
            general: 'Everyday local AI',
            chat: 'Private chat',
            coding: 'Local coding',
            reasoning: 'Reasoning',
            vision: 'Image understanding',
            creative: 'Creative work'
        })[String(value || '').toLowerCase()] || 'Everyday local AI';
    }

    function priorityLabel(value) {
        return ({
            balanced: 'Balanced',
            quality: 'Quality first',
            speed: 'Speed first',
            memory: 'Lowest memory'
        })[String(value || '').toLowerCase()] || 'Balanced';
    }

    function platformLabel(platform) {
        if (platform === 'macos') return 'macOS';
        if (platform === 'windows') return 'Windows';
        return 'Linux';
    }

    function formatNumber(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '0';
        return Number.isInteger(number) ? String(number) : number.toFixed(1);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }

    window.LocalClawPlanMachineMatcher = Object.freeze({
        resolvePendingPlanMachine,
        sameHardwareProfile
    });
})();
