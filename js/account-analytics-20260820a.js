(function (root) {
    'use strict';

    const STORAGE_PREFIX = 'localclaw_account_goal:';
    const ALLOWED_EVENTS = new Set([
        'account_page_loaded',
        'auth_started',
        'auth_success',
        'auth_error',
        'account_created',
        'workspace_loaded',
        'machine_create_started',
        'machine_create_succeeded',
        'machine_create_failed',
        'machine_update_started',
        'machine_update_succeeded',
        'machine_update_failed',
        'account_recommendation_viewed',
        'account_compare_open',
        'account_model_open',
        'plan_saved',
        'plan_save_failed',
        'plan_update_viewed',
        'plan_action_clicked',
        'existing_machine_match_shown',
        'existing_machine_reused',
        'duplicate_machine_avoided',
        'new_machine_requested',
        'model_saved',
        'model_removed',
        'model_status_updated',
        'test_log_saved',
        'account_api_error',
        'account_sign_out'
    ]);
    const ALLOWED_PROPERTIES = new Set([
        'source',
        'view',
        'provider',
        'account_age',
        'error_stage',
        'error_code',
        'http_status',
        'online',
        'platform',
        'accelerator',
        'ram_bucket',
        'use_case',
        'priority',
        'machine_action',
        'machine_count',
        'favorite_count',
        'shown_count',
        'best_match_count',
        'saved_count',
        'update_count',
        'model_id',
        'top_model',
        'action',
        'save_mode',
        'plan_state',
        'quantization',
        'status',
        'verdict',
        'is_first_machine',
        'match_source',
        'match_count',
        'preferences_updated',
        'return_view'
    ]);

    function track(name, properties = {}, options = {}) {
        if (!ALLOWED_EVENTS.has(name) || typeof root.datafast !== 'function') return false;
        const onceKey = cleanOnceKey(options.onceKey);
        if (onceKey && wasTracked(onceKey)) return false;

        const safeProperties = sanitize(properties);
        try {
            root.datafast(name, safeProperties);
            if (onceKey) markTracked(onceKey);
            return true;
        } catch {
            return false;
        }
    }

    function sanitize(properties) {
        const safe = {};
        for (const [key, value] of Object.entries(properties || {})) {
            if (!ALLOWED_PROPERTIES.has(key)) continue;
            const cleaned = cleanValue(value);
            if (cleaned !== null) safe[key] = cleaned;
        }
        return safe;
    }

    function cleanValue(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (typeof value !== 'string') return null;
        const text = value.trim().slice(0, 64);
        if (!text || /@/.test(text) || /[\r\n]/.test(text)) return null;
        return text;
    }

    function ramBucket(value) {
        const ram = Number(value);
        if (!Number.isFinite(ram) || ram <= 0) return 'unknown';
        if (ram <= 8) return 'up_to_8';
        if (ram <= 16) return '9_to_16';
        if (ram <= 32) return '17_to_32';
        if (ram <= 64) return '33_to_64';
        if (ram <= 128) return '65_to_128';
        return 'over_128';
    }

    function accountAgeBucket(user, now = new Date()) {
        const createdAt = new Date(user && user.createdAt);
        const reference = now instanceof Date ? now : new Date(now);
        if (Number.isNaN(createdAt.getTime()) || Number.isNaN(reference.getTime())) return 'unknown';
        const ageMinutes = Math.max(0, (reference.getTime() - createdAt.getTime()) / 60000);
        if (ageMinutes <= 15) return 'new';
        if (ageMinutes <= 24 * 60) return 'same_day';
        if (ageMinutes <= 30 * 24 * 60) return 'under_30_days';
        return 'existing';
    }

    function errorCode(value, fallback = 'unknown') {
        const normalized = String(value || fallback)
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 48);
        return normalized || fallback;
    }

    function returnView() {
        const view = new URLSearchParams(root.location && root.location.search || '').get('view');
        return view === 'sponsorship' ? 'sponsorship' : 'machines';
    }

    function cleanOnceKey(value) {
        return String(value || '').replace(/[^a-zA-Z0-9:_-]+/g, '').slice(0, 96);
    }

    function wasTracked(key) {
        try {
            return root.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`) === '1';
        } catch {
            return false;
        }
    }

    function markTracked(key) {
        try {
            root.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, '1');
        } catch {}
    }

    root.LocalClawAccountAnalytics = Object.freeze({
        accountAgeBucket,
        errorCode,
        ramBucket,
        returnView,
        sanitize,
        track
    });
})(window);
