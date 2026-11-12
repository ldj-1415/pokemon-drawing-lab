#!/usr/bin/env node
/**
 * Build a compact, offline-friendly Pokédex from the public PokeAPI.
 *
 * Usage: node scripts/generate-pokedex.mjs
 *
 * All raw responses are cached under scripts/.cache so the script can resume.
 * The generated file contains only data shown by the app (plus image URLs).
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'pokemonDex.json');
const API = 'https://pokeapi.co/api/v2';
const MAX_ID = 1025;
const CONCURRENCY = 8;

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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function cachedJson(key, url) {
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (await exists(file)) {
    try {
      return JSON.parse(await readFile(file, 'utf8'));
    } catch {
      // corrupted cache, refetch
    }
  }

  let lastError;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PokemonDrawingLab/1.0 (local fan project)' },
      });
      clearTimeout(timer);
      if (res.status === 404) {
        throw new Error(`404 for ${url}`);
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      const data = await res.json();
      await writeFile(file, JSON.stringify(data));
      return data;
    } catch (error) {
      lastError = error;
      const status = /HTTP (\d+)/.exec(error.message)?.[1];
      const wait = status === '429' ? 3000 * (attempt + 1) : 900 * (attempt + 1);
      console.warn(`  retry ${attempt + 1}/6 ${key}: ${error.message}`);
      await delay(wait);
    }
  }
  throw lastError;
}

async function pool(tasks, workerCount, label) {
  let cursor = 0;
  let done = 0;
  const results = new Array(tasks.length);
  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= tasks.length) return;
      results[index] = await tasks[index]();
      done += 1;
      if (done % 100 === 0 || done === tasks.length) {
        console.log(`  ${label}: ${done}/${tasks.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

function pickName(names) {
  if (!Array.isArray(names)) return { zh: null, en: null, ja: null };
  const byLanguage = (code) => names.find(
    (n) => String(n.language?.name || '').toLowerCase() === code,
  )?.name || null;
  const zh = byLanguage('zh-hans') || byLanguage('zh-hant');
  const en = byLanguage('en');
  const ja = byLanguage('ja-hrkt');
  return { zh, en, ja };
}

function generationFromSpecies(species) {
  const gen = species.generation?.name || '';
  const map = {
    'generation-i': 1, 'generation-ii': 2, 'generation-iii': 3,
    'generation-iv': 4, 'generation-v': 5, 'generation-vi': 6,
    'generation-vii': 7, 'generation-viii': 8, 'generation-ix': 9,
  };
  return map[gen] || Math.max(1, Math.min(9, Math.ceil(species.id / 151)));
}

function evolutionDepths(chain, target = new Map()) {
  if (!chain) return target;
  const walk = (node, depth) => {
    if (!node) return;
    const id = Number(node.species?.url?.match(/\/(\d+)\/?$/)?.[1]);
    if (Number.isFinite(id) && id >= 1 && id <= MAX_ID) {
      const current = target.get(id);
      target.set(id, current == null ? depth : Math.min(current, depth));
    }
    for (const next of node.evolves_to || []) walk(next, depth + 1);
  };
  walk(chain, 0);
  return target;
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  console.log(`Fetching ${MAX_ID} species + Pokémon records from PokeAPI…`);

  const tasks = [];
  for (let id = 1; id <= MAX_ID; id += 1) {
    tasks.push(() => cachedJson(`species-${id}`, `${API}/pokemon-species/${id}`));
    tasks.push(() => cachedJson(`pokemon-${id}`, `${API}/pokemon/${id}`));
  }
  const records = await pool(tasks, CONCURRENCY, 'base data');
  const speciesById = new Map();
  const pokemonById = new Map();
  for (let i = 0; i < MAX_ID; i += 1) {
    speciesById.set(i + 1, records[i * 2]);
    pokemonById.set(i + 1, records[i * 2 + 1]);
  }

  const chainUrls = [...new Set(
    [...speciesById.values()]
      .map((s) => s.evolution_chain?.url)
      .filter(Boolean),
  )];
  console.log(`Fetching ${chainUrls.length} evolution chains…`);
  const chainTasks = chainUrls.map((url, index) => () => cachedJson(`chain-${index}`, url));
  const chains = await pool(chainTasks, CONCURRENCY, 'evolution chains');
  const depths = new Map();
  for (const chain of chains) evolutionDepths(chain.chain, depths);

  const pokemon = [];
  const missingZh = [];
  for (let id = 1; id <= MAX_ID; id += 1) {
    const species = speciesById.get(id);
    const raw = pokemonById.get(id);
    const names = pickName(species.names);
    if (!names.zh) missingZh.push(id);
    const types = raw.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((item) => item.type.name);
    const official = raw.sprites?.other?.['official-artwork']?.front_default;
    const home = raw.sprites?.other?.home?.front_default;
    const sprite = raw.sprites?.front_default
      || raw.sprites?.versions?.['generation-vii']?.icons?.front_default
      || null;
    const artwork = official || home || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    const stage = depths.get(id) ?? 0;
    const shape = species.shape?.name || null;
    const nameEn = names.en || raw.name.replace(/-/g, ' ');
    pokemon.push({
      id,
      name: raw.name,
      nameEn,
      nameZh: names.zh,
      nameJa: names.ja,
      types,
      typesZh: types.map((t) => TYPE_ZH[t] || t),
      generation: generationFromSpecies(species),
      artwork,
      home: home || artwork,
      sprite: sprite || artwork,
      isLegendary: Boolean(species.is_legendary),
      isMythical: Boolean(species.is_mythical),
      isBaby: Boolean(species.is_baby),
      stage,
      stageLabel: stage === 0 ? '未进化' : `${stage}阶进化`,
      evolvesFrom: species.evolves_from_species?.name || null,
      evolutionChainId: Number(species.evolution_chain?.url?.match(/\/(\d+)\/?$/)?.[1]) || null,
      height: raw.height ?? null,
      weight: raw.weight ?? null,
      shape,
      shapeZh: shape ? (SHAPE_ZH[shape] || shape) : null,
      color: species.color?.name || null,
    });
  }

  const output = {
    source: 'https://pokeapi.co/',
    generatedAt: new Date().toISOString(),
    range: [1, MAX_ID],
    count: pokemon.length,
    pokemon,
  };
  await writeFile(OUT_FILE, JSON.stringify(output));
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(`Pokémon: ${pokemon.length}`);
  console.log(`Missing official zh-Hans/zh-Hant names: ${missingZh.length ? missingZh.join(', ') : 'none'}`);
  console.log(`Legendary: ${pokemon.filter((p) => p.isLegendary).length}, Mythical: ${pokemon.filter((p) => p.isMythical).length}`);
  console.log(`Evolution stages: ${[...new Set(pokemon.map((p) => p.stage))].sort().join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
