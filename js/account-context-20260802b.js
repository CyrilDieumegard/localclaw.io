(function () {
    'use strict';

    const CACHE_KEY = 'localclaw_primary_machine';
    const EVENT_NAME = 'localclaw:account-context';
    const state = {
        authenticated: null,
        machines: [],
        favorites: [],
        primaryMachine: readCachedMachine(),
        loading: false
    };

    const api = {
        getState: snapshot,
        refresh,
        getFavorite,
        toggleFavorite,
        upsertFavorite,
        removeFavorite,
        ready: Promise.resolve()
    };

    window.LocalClawAccountContext = api;
    dispatch();

    if (state.primaryMachine) {
        api.ready = refresh();
    }

    async function refresh() {
        if (state.loading) return snapshot();
        state.loading = true;

        try {
            const [machineResponse, favoriteResponse] = await Promise.all([
                fetch('/api/machines', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
                fetch('/api/favorites', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            ]);

            if (machineResponse.status === 401) {
                clearContext();
                return snapshot();
            }

            if (!machineResponse.ok) return snapshot();

            const [machineData, favoriteData] = await Promise.all([
                readJson(machineResponse),
                readJson(favoriteResponse)
            ]);

            state.authenticated = true;
            state.machines = Array.isArray(machineData?.machines) ? machineData.machines : [];
            state.favorites = favoriteResponse.ok && Array.isArray(favoriteData?.favorites) ? favoriteData.favorites : [];
            state.primaryMachine = state.machines.find((machine) => machine.isPrimary) || state.machines[0] || null;
            writeCachedMachine(state.primaryMachine);
            dispatch();
            return snapshot();
        } catch {
            return snapshot();
        } finally {
            state.loading = false;
        }
    }

    function getFavorite(modelId, machineId) {
        const targetMachineId = machineId || state.primaryMachine?.id;
        return state.favorites.find((favorite) => favorite.machineId === targetMachineId && favorite.modelId === modelId) || null;
    }

    async function toggleFavorite(model, machine) {
        const targetMachine = machine || state.primaryMachine;
        if (!targetMachine || !model?.id) throw new Error('Choose a primary machine first.');
        const current = getFavorite(model.id, targetMachine.id);
        return current
            ? removeFavorite(model.id, targetMachine.id)
            : upsertFavorite(model.id, targetMachine.id, 'saved', model.recommended_quant || '');
    }

    async function upsertFavorite(modelId, machineId, status, quantization) {
        const response = await fetch(`/api/favorites/${encodeURIComponent(modelId)}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ machineId, status: status || 'saved', quantization: quantization || '' })
        });
        const data = await readJson(response);
        if (!response.ok || !data?.favorite) throw new Error(data?.message || 'Could not save this model.');

        state.favorites = [data.favorite, ...state.favorites.filter((favorite) => !(favorite.machineId === machineId && favorite.modelId === modelId))];
        dispatch();
        return data.favorite;
    }

    async function removeFavorite(modelId, machineId) {
        const response = await fetch(`/api/favorites/${encodeURIComponent(modelId)}?machineId=${encodeURIComponent(machineId)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        const data = await readJson(response);
        if (!response.ok) throw new Error(data?.message || 'Could not remove this model.');

        state.favorites = state.favorites.filter((favorite) => !(favorite.machineId === machineId && favorite.modelId === modelId));
        dispatch();
        return null;
    }

    function snapshot() {
        return {
            authenticated: state.authenticated,
            machines: state.machines.slice(),
            favorites: state.favorites.slice(),
            primaryMachine: state.primaryMachine ? { ...state.primaryMachine } : null
        };
    }

    function dispatch() {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: snapshot() }));
    }

    function clearContext() {
        state.authenticated = false;
        state.machines = [];
        state.favorites = [];
        state.primaryMachine = null;
        writeCachedMachine(null);
        dispatch();
    }

    function readCachedMachine() {
        try {
            const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            return parsed?.id ? parsed : null;
        } catch {
            return null;
        }
    }

    function writeCachedMachine(machine) {
        try {
            if (machine?.id) localStorage.setItem(CACHE_KEY, JSON.stringify(machine));
            else localStorage.removeItem(CACHE_KEY);
        } catch {}
    }

    async function readJson(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }
})();
