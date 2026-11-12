import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import bundledDex from '../data/pokemonDex.json';
import { checkApiHealth, syncPokemonRange } from '../services/pokeapi.js';
import { readJSON, STORAGE_KEYS, writeJSON } from '../utils/storage.js';

const SEED_POKEMON = bundledDex.pokemon;
const SEED_BY_ID = new Map(SEED_POKEMON.map((pokemon) => [pokemon.id, pokemon]));

function isValidRecord(pokemon) {
  return pokemon
    && Number.isInteger(pokemon.id)
    && pokemon.id >= 1
    && pokemon.id <= 1025
    && Array.isArray(pokemon.types);
}

function mergeDex(updates = []) {
  const map = new Map(SEED_BY_ID);
  for (const update of updates) {
    if (!isValidRecord(update)) continue;
    const base = SEED_BY_ID.get(update.id);
    map.set(update.id, {
      ...base,
      ...update,
      nameZh: update.nameZh || base?.nameZh || null,
      types: update.types?.length ? update.types : base?.types || [],
      typesZh: update.typesZh?.length ? update.typesZh : base?.typesZh || [],
      artwork: update.artwork || base?.artwork,
      sprite: update.sprite || base?.sprite,
    });
  }
  return [...map.values()].sort((a, b) => a.id - b.id);
}

function loadCachedUpdates() {
  const cached = readJSON(STORAGE_KEYS.dexCache, null);
  if (!cached || !Array.isArray(cached.pokemon)) return { updates: [], updatedAt: null };
  return {
    updates: cached.pokemon.filter(isValidRecord),
    updatedAt: cached.updatedAt || null,
  };
}

export function usePokedex() {
  const initialCache = useMemo(loadCachedUpdates, []);
  const [updates, setUpdates] = useState(initialCache.updates);
  const [dex, setDex] = useState(() => mergeDex(initialCache.updates));
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiError, setApiError] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(initialCache.updatedAt);
  const [syncState, setSyncState] = useState({
    status: 'idle',
    done: 0,
    total: 0,
    message: '',
    errors: [],
  });
  const updatesRef = useRef(initialCache.updates);
  const syncControllerRef = useRef(null);

  const runHealthCheck = useCallback(async () => {
    setApiStatus('checking');
    const result = await checkApiHealth();
    if (result.aborted) return;
    setLastCheckedAt(result.checkedAt);
    if (result.ok) {
      setApiStatus('online');
      setApiError(null);
    } else {
      setApiStatus('offline');
      setApiError(result.error);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    checkApiHealth(controller.signal).then((result) => {
      if (!active || result.aborted) return;
      setLastCheckedAt(result.checkedAt);
      setApiStatus(result.ok ? 'online' : 'offline');
      setApiError(result.ok ? null : result.error);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const dexMap = useMemo(() => new Map(dex.map((pokemon) => [pokemon.id, pokemon])), [dex]);

  const cancelSync = useCallback(() => {
    syncControllerRef.current?.abort();
  }, []);

  const syncRange = useCallback(async (ids) => {
    if (syncControllerRef.current) syncControllerRef.current.abort();
    const controller = new AbortController();
    syncControllerRef.current = controller;

    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) {
      setSyncState({
        status: 'error',
        done: 0,
        total: 0,
        message: '请先选择至少一个世代与有效编号范围。',
        errors: ['没有可同步的编号'],
      });
      return { ok: false, message: '没有可同步的编号' };
    }

    setSyncState({
      status: 'syncing',
      done: 0,
      total: uniqueIds.length,
      message: '准备连接 PokeAPI…',
      errors: [],
    });

    const fallbackStageById = Object.fromEntries(
      [...dexMap.values()].map((pokemon) => [pokemon.id, pokemon.stage]),
    );

    try {
      const result = await syncPokemonRange({
        ids: uniqueIds,
        signal: controller.signal,
        fallbackStageById,
        onProgress: (progress) => {
          setSyncState((current) => ({
            ...current,
            status: 'syncing',
            done: progress.done,
            total: progress.total,
            message: progress.message,
          }));
        },
      });

      if (result.pokemon.length) {
        const merged = new Map(updatesRef.current.map((pokemon) => [pokemon.id, pokemon]));
        for (const pokemon of result.pokemon) merged.set(pokemon.id, pokemon);
        const nextUpdates = [...merged.values()].sort((a, b) => a.id - b.id);
        const updatedAt = new Date().toISOString();
        updatesRef.current = nextUpdates;
        setUpdates(nextUpdates);
        setDex(mergeDex(nextUpdates));
        setLastSyncedAt(updatedAt);
        writeJSON(STORAGE_KEYS.dexCache, {
          version: 1,
          updatedAt,
          pokemon: nextUpdates,
        });
      }

      const errors = result.errors || [];
      setSyncState({
        status: errors.length && !result.pokemon.length ? 'error' : 'success',
        done: uniqueIds.length,
        total: uniqueIds.length,
        message: result.pokemon.length
          ? `已同步 ${result.pokemon.length} 只宝可梦${errors.length ? `，${errors.length} 项失败` : '，全部写入本地缓存' }。`
          : 'PokeAPI 未能返回可用的宝可梦数据。',
        errors,
      });
      setApiStatus(result.pokemon.length ? 'online' : 'offline');
      if (!result.pokemon.length) {
        setApiError(errors[0] || 'PokeAPI 请求失败');
      } else {
        setApiError(null);
      }
      return { ok: result.pokemon.length > 0, result };
    } catch (error) {
      if (error.name === 'AbortError') {
        setSyncState((current) => ({ ...current, status: 'idle', message: '已取消同步。' }));
        return { ok: false, aborted: true };
      }
      setSyncState({
        status: 'error',
        done: 0,
        total: uniqueIds.length,
        message: error.message || '同步失败。',
        errors: [error.message || '同步失败。'],
      });
      setApiStatus('offline');
      setApiError(error.message || '同步失败。');
      return { ok: false, message: error.message };
    } finally {
      if (syncControllerRef.current === controller) syncControllerRef.current = null;
    }
  }, [dexMap]);

  return {
    dex,
    dexMap,
    apiStatus,
    apiError,
    lastCheckedAt,
    lastSyncedAt,
    syncState,
    cachedUpdateCount: updates.length,
    syncRange,
    cancelSync,
    retryHealth: runHealthCheck,
    source: buildSource(bundledDex),
  };
}

function buildSource(data) {
  return {
    name: 'PokeAPI',
    generatedAt: data.generatedAt,
    count: data.count,
    url: data.source,
  };
}
