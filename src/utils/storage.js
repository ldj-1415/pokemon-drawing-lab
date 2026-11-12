export const STORAGE_KEYS = {
  settings: 'pdl.settings.v1',
  favorites: 'pdl.favorites.v1',
  history: 'pdl.history.v1',
  composition: 'pdl.composition.v1',
  challenge: 'pdl.challenge.v1',
  inspiration: 'pdl.inspiration.v1',
  inspirationCollection: 'pdl.inspiration.collection.v1',
  workbenchInspiration: 'pdl.workbenchInspiration.v1',
  workbenchColor: 'pdl.workbenchColor.v1',
  dexCache: 'pdl.dex.cache.v1',
  apiPrefix: 'pdl.api.v2.',
};

export function isStorageAvailable() {
  try {
    const key = '__pdl_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[Pokémon Drawing Lab] 无法读取本地数据 ${key}`, error);
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[Pokémon Drawing Lab] 无法写入本地数据 ${key}`, error);
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[Pokémon Drawing Lab] 无法删除本地数据 ${key}`, error);
    return false;
  }
}

export function getStorageSize() {
  try {
    let bytes = 0;
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith('pdl.')) continue;
      const value = window.localStorage.getItem(key) || '';
      bytes += key.length + value.length;
    }
    return bytes;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
