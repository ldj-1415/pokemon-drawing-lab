import { readJSON, STORAGE_KEYS, writeJSON } from '../utils/storage.js';

export const API_BASE = 'https://pokeapi.co/api/v2';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;
const REQUEST_TIMEOUT = 15000;
const CONCURRENCY = 6;

const TYPE_ZH = {
  normal: '一般', fire: '火', water: '水', electric: '电', grass: '草', ice: '冰',
  fighting: '格斗', poison: '毒', ground: '地面', flying: '飞行', psychic: '超能力',
  bug: '虫', rock: '岩石', ghost: '幽灵', dragon: '龙', dark: '恶', steel: '钢', fairy: '妖精',
};

const SHAPE_ZH = {
  ball: '球形', squiggle: '软体', fish: '鱼形', arms: '双臂形', blob: '团状',
  upright: '直立形', legs: '双腿形', quadruped: '四足形', wings: '翼形',
  tentacles: '触手形', heads: '多头形', humanoid: '人形', 'bug-wings': '虫翼形',
  armor: '装甲形', 'arms-legs': '手足形',
};

const GENERATION_MAP = {
  'generation-i': 1, 'generation-ii': 2, 'generation-iii': 3,
  'generation-iv': 4, 'generation-v': 5, 'generation-vi': 6,
  'generation-vii': 7, 'generation-viii': 8, 'generation-ix': 9,
};

const abortError = () => {
  const error = new Error('请求已取消');
  error.name = 'AbortError';
  return error;
};

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    signal?.removeEventListener('abort', onAbort);
    resolve();
  }, ms);
  const onAbort = () => {
    clearTimeout(timer);
    reject(abortError());
  };
  signal?.addEventListener('abort', onAbort, { once: true });
});

async function fetchJson(url, { signal, timeout = REQUEST_TIMEOUT, retries = 2 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (signal?.aborted) throw abortError();
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error(`PokeAPI 未找到数据（404）`);
        throw new Error(`PokeAPI 请求失败（HTTP ${response.status}）`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw abortError();
      if (attempt === retries) break;
      await sleep(800 * (attempt + 1), signal);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  throw lastError;
}

function getCached(key) {
  const entry = readJSON(key, null);
  if (!entry || !entry.savedAt || !entry.data) return null;
  if (Date.now() - entry.savedAt > CACHE_TTL) return null;
  return entry.data;
}

function setCached(key, data) {
  writeJSON(key, { savedAt: Date.now(), data });
}

export const fetchPokeApiJson = fetchJson;

export async function checkApiHealth(signal) {
  const startedAt = Date.now();
  try {
    await fetchJson(`${API_BASE}/pokemon?limit=1`, { signal, timeout: 9000, retries: 1 });
    return { ok: true, checkedAt: new Date().toISOString(), latency: Date.now() - startedAt, error: null };
  } catch (error) {
    if (error.name === 'AbortError') return { ok: false, aborted: true, error: '请求已取消' };
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      latency: null,
      error: error.message || '无法连接 PokeAPI',
    };
  }
}

function pickChineseName(names = []) {
  const byLanguage = (code) => names.find(
    (entry) => String(entry.language?.name || '').toLowerCase() === code,
  )?.name || null;
  return byLanguage('zh-hans') || byLanguage('zh-hant') || null;
}

function parseChainId(url) {
  return Number(String(url || '').match(/\/(\d+)\/?$/)?.[1]) || null;
}

function evolutionDepths(chain, target = {}) {
  const walk = (node, depth) => {
    if (!node) return;
    const id = Number(node.species?.url?.match(/\/(\d+)\/?$/)?.[1]);
    if (Number.isFinite(id) && id >= 1 && id <= 1025) {
      target[id] = target[id] == null ? depth : Math.min(target[id], depth);
    }
    for (const next of node.evolves_to || []) walk(next, depth + 1);
  };
  walk(chain, 0);
  return target;
}

function normalizeDetail(pokemon, species, stage) {
  const types = pokemon.types
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => entry.type.name);
  const official = pokemon.sprites?.other?.['official-artwork']?.front_default;
  const home = pokemon.sprites?.other?.home?.front_default;
  const artwork = official || home
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
  const sprite = pokemon.sprites?.front_default || artwork;
  const names = species.names || [];
  const nameZh = pickChineseName(names);
  const byLanguage = (code) => names.find(
    (entry) => String(entry.language?.name || '').toLowerCase() === code,
  )?.name || null;
  const nameEn = byLanguage('en') || pokemon.name.replace(/-/g, ' ');
  const nameJa = byLanguage('ja-hrkt');
  const shape = species.shape?.name || null;

  return {
    id: pokemon.id,
    name: pokemon.name,
    nameEn,
    nameZh,
    nameJa,
    types,
    typesZh: types.map((type) => TYPE_ZH[type] || type),
    generation: GENERATION_MAP[species.generation?.name] || Math.ceil(pokemon.id / 151),
    artwork,
    home: home || artwork,
    sprite,
    isLegendary: Boolean(species.is_legendary),
    isMythical: Boolean(species.is_mythical),
    isBaby: Boolean(species.is_baby),
    stage: Number.isFinite(stage) ? stage : 0,
    stageLabel: !Number.isFinite(stage) || stage === 0 ? '未进化' : `${stage}阶进化`,
    evolvesFrom: species.evolves_from_species?.name || null,
    evolutionChainId: parseChainId(species.evolution_chain?.url),
    height: pokemon.height ?? null,
    weight: pokemon.weight ?? null,
    shape,
    shapeZh: shape ? (SHAPE_ZH[shape] || shape) : null,
    color: species.color?.name || null,
    syncedAt: new Date().toISOString(),
  };
}

async function mapConcurrent(items, limit, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/**
 * Fetches and normalizes a range of Pokémon via PokeAPI. Every individual
 * detail is cached in localStorage so repeated syncs are inexpensive.
 */
export async function syncPokemonRange({
  ids,
  onProgress = () => {},
  signal,
  fallbackStageById = {},
}) {
  const uniqueIds = [...new Set(ids)].filter((id) => Number.isInteger(id) && id >= 1 && id <= 1025);
  if (!uniqueIds.length) return { pokemon: [], errors: [], requested: 0 };

  const details = new Map();
  const pending = [];
  const errors = [];

  for (const id of uniqueIds) {
    const cached = getCached(`${STORAGE_KEYS.apiPrefix}pokemon.${id}`);
    if (cached) {
      details.set(id, cached);
    } else {
      pending.push(id);
    }
  }

  onProgress({
    stage: 'details',
    done: uniqueIds.length - pending.length,
    total: uniqueIds.length,
    message: pending.length ? `正在从 PokeAPI 同步 ${pending.length} 只宝可梦…` : '正在使用本地 API 缓存…',
  });

  let completed = uniqueIds.length - pending.length;
  await mapConcurrent(pending, CONCURRENCY, async (id) => {
    try {
      const [pokemon, species] = await Promise.all([
        fetchJson(`${API_BASE}/pokemon/${id}`, { signal }),
        fetchJson(`${API_BASE}/pokemon-species/${id}`, { signal }),
      ]);
      const detail = normalizeDetail(pokemon, species, undefined);
      const fallbackStage = fallbackStageById[id];
      if (Number.isFinite(fallbackStage)) {
        detail.stage = fallbackStage;
        detail.stageLabel = fallbackStage === 0 ? '未进化' : `${fallbackStage}阶进化`;
      }
      details.set(id, detail);
      setCached(`${STORAGE_KEYS.apiPrefix}pokemon.${id}`, detail);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      errors.push(`#${id}: ${error.message}`);
    } finally {
      completed += 1;
      onProgress({
        stage: 'details',
        done: completed,
        total: uniqueIds.length,
        message: `正在从 PokeAPI 同步宝可梦数据 ${completed}/${uniqueIds.length}`,
      });
    }
  });

  const chainIds = [...new Set(
    [...details.values()].map((detail) => detail.evolutionChainId).filter(Boolean),
  )];
  const chainDepths = {};
  let chainDone = 0;
  onProgress({
    stage: 'chains',
    done: 0,
    total: chainIds.length,
    message: chainIds.length ? `正在同步 ${chainIds.length} 条进化链…` : '进化链已就绪',
  });

  await mapConcurrent(chainIds, CONCURRENCY, async (chainId) => {
    const cacheKey = `${STORAGE_KEYS.apiPrefix}chain.${chainId}`;
    let depths = getCached(cacheKey);
    if (!depths) {
      try {
        const chain = await fetchJson(`${API_BASE}/evolution-chain/${chainId}`, { signal });
        depths = evolutionDepths(chain.chain, {});
        setCached(cacheKey, depths);
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        errors.push(`进化链 ${chainId}: ${error.message}`);
      }
    }
    if (depths) Object.assign(chainDepths, depths);
    chainDone += 1;
    onProgress({
      stage: 'chains',
      done: chainDone,
      total: chainIds.length,
      message: `正在同步进化链 ${chainDone}/${chainIds.length}`,
    });
  });

  const pokemon = [];
  for (const id of uniqueIds) {
    const detail = details.get(id);
    if (!detail) continue;
    const fromChain = chainDepths[id];
    const stage = Number.isFinite(fromChain) ? fromChain : (detail.stage ?? fallbackStageById[id] ?? 0);
    pokemon.push({
      ...detail,
      stage,
      stageLabel: stage === 0 ? '未进化' : `${stage}阶进化`,
      syncedAt: new Date().toISOString(),
    });
  }

  onProgress({
    stage: 'done',
    done: uniqueIds.length,
    total: uniqueIds.length,
    message: `同步完成：${pokemon.length} 只宝可梦已写入本地缓存。`,
  });

  return { pokemon, errors, requested: uniqueIds.length };
}
