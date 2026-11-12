import { POKEMON_TYPES } from '../data/types.js';
import { fetchPokeApiJson, API_BASE } from './pokeapi.js';
import { readJSON, STORAGE_KEYS, writeJSON } from '../utils/storage.js';

const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

const SHAPE_ZH = {
  ball: '球形', squiggle: '软体', fish: '鱼形', arms: '双臂形', blob: '团状',
  upright: '直立形', legs: '双腿形', quadruped: '四足形', wings: '翼形',
  tentacles: '触手形', heads: '多头形', humanoid: '人形', 'bug-wings': '虫翼形',
  armor: '装甲形', 'arms-legs': '手足形',
};

const COLOR_ZH = {
  black: '黑色', blue: '蓝色', brown: '棕色', gray: '灰色', green: '绿色',
  pink: '粉色', purple: '紫色', red: '红色', white: '白色', yellow: '黄色',
};

const HABITAT_ZH = {
  cave: '洞穴', forest: '森林', grassland: '草原', mountain: '山地',
  rare: '稀有环境', 'rough-terrain': '崎岖地带', sea: '海洋', urban: '城市',
  'waters-edge': '水边',
};

const STAT_LABELS = {
  hp: 'HP',
  attack: '攻击',
  defense: '防御',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
};

const ITEM_ZH = {
  'fire-stone': '火之石', 'water-stone': '水之石', 'thunder-stone': '雷之石',
  'leaf-stone': '叶之石', 'moon-stone': '月之石', 'sun-stone': '日之石',
  'shiny-stone': '光之石', 'dusk-stone': '暗之石', 'dawn-stone': '觉醒之石',
  'ice-stone': '冰之石', 'oval-stone': '浑圆之石', 'everstone': '不变之石',
  'kings-rock': '王者之证', 'metal-coat': '金属膜', 'dragon-scale': '龙之鳞片',
  'up-grade': '升级数据', 'dubious-disc': '可疑光盘', 'protector': '护具',
  'electirizer': '电力增幅器', 'magmarizer': '熔岩增幅器', 'razor-claw': '锐利之爪',
  'razor-fang': '锐利之牙', 'reaper-cloth': '灵界之布', 'prism-scale': '美丽鳞片',
  'whipped-dream': '泡沫奶油', 'sachet': '香袋', 'link-cable': '连接绳',
};

const TRIGGER_ZH = {
  'level-up': '等级提升',
  trade: '交换',
  'use-item': '使用道具',
  shed: '特殊方式',
  spin: '旋转',
  'tower-of-darkness': '恶之塔',
  'tower-of-waters': '水之塔',
  'three-critical-hits': '三次命中要害',
  'take-damage': '承受伤害',
  'agile-style-move': '迅疾招式',
  'strong-style-move': '刚猛招式',
  'recoil-damage': '承受反作用力伤害',
};

const FORM_PREFIX_ZH = {
  alolan: '阿罗拉形态',
  galarian: '伽勒尔形态',
  hisuian: '洗翠形态',
  paldean: '帕底亚形态',
  mega: '超级进化',
  gmax: '超极巨化',
  totem: '霸主形态',
  origin: '起源形态',
  therian: '灵兽形态',
  incarnate: '化身形态',
  resolute: '觉悟形态',
  black: '黑',
  white: '白',
};

const inflight = new Map();

function cacheKey(kind, key) {
  return `${STORAGE_KEYS.apiPrefix}${kind}.${key}`;
}

function getCached(key) {
  const entry = readJSON(key, null);
  if (!entry?.savedAt || !entry.data) return null;
  if (Date.now() - entry.savedAt > CACHE_TTL) return null;
  return entry.data;
}

function setCached(key, data) {
  writeJSON(key, { savedAt: Date.now(), data });
}

function dedupe(key, loader) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = loader().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

function parseId(url) {
  return Number(String(url || '').match(/\/(\d+)\/?$/)?.[1]) || null;
}

function formatSlug(value = '') {
  return String(value).replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanText(value = '') {
  return String(value)
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\u00ad/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function localizedName(entries = [], languages = ['zh-hans', 'zh-hant']) {
  for (const language of languages) {
    const found = entries.find((entry) => entry.language?.name === language);
    if (found?.name) return cleanText(found.name);
  }
  return null;
}

function localizedGenus(entries = []) {
  for (const language of ['zh-hans', 'zh-hant', 'en']) {
    const found = entries.find((entry) => entry.language?.name === language);
    if (found?.genus) return cleanText(found.genus);
  }
  return null;
}

function localizedFlavor(entries = []) {
  for (const language of ['zh-hans', 'zh-hant']) {
    const found = entries.find((entry) => entry.language?.name === language);
    if (found?.flavor_text) return { text: cleanText(found.flavor_text), lang: 'zh' };
  }
  const english = entries.find((entry) => entry.language?.name === 'en');
  return english?.flavor_text
    ? { text: cleanText(english.flavor_text), lang: 'en' }
    : null;
}

function typeLabel(type) {
  return POKEMON_TYPES.find((item) => item.id === type)?.label || formatSlug(type);
}

function evolutionCondition(details = []) {
  if (!details.length) return '特殊条件';
  const parts = [];
  for (const detail of details) {
    const trigger = TRIGGER_ZH[detail.trigger?.name] || null;
    if (detail.min_level) parts.push(`Lv.${detail.min_level}`);
    if (detail.item?.name) {
      parts.push(`使用${ITEM_ZH[detail.item.name] || formatSlug(detail.item.name)}`);
    }
    if (detail.held_item?.name) {
      parts.push(`携带${ITEM_ZH[detail.held_item.name] || formatSlug(detail.held_item.name)}`);
    }
    if (detail.known_move?.name) parts.push(`学会${formatSlug(detail.known_move.name)}`);
    if (detail.known_move_type?.name) parts.push(`掌握${typeLabel(detail.known_move_type.name)}属性招式`);
    if (detail.time_of_day) {
      parts.push(detail.time_of_day === 'day' ? '白天' : detail.time_of_day === 'night' ? '夜晚' : detail.time_of_day);
    }
    if (detail.min_happiness) parts.push(`亲密度 ≥ ${detail.min_happiness}`);
    if (detail.min_affection) parts.push(`友好度 ≥ ${detail.min_affection}`);
    if (detail.min_beauty) parts.push(`美丽度 ≥ ${detail.min_beauty}`);
    if (detail.location?.name) parts.push(`在${formatSlug(detail.location.name)}`);
    if (detail.trade_species?.name) parts.push(`与${formatSlug(detail.trade_species.name)}交换`);
    if (detail.party_species?.name) parts.push(`队伍中有${formatSlug(detail.party_species.name)}`);
    if (detail.party_type?.name) parts.push(`队伍中有${typeLabel(detail.party_type.name)}属性`);
    if (detail.gender === 1) parts.push('雌性');
    if (detail.gender === 2) parts.push('雄性');
    if (detail.needs_overworld_rain) parts.push('下雨时');
    if (detail.turn_upside_down) parts.push('倒置设备');
    if (detail.relative_physical_stats === 1) parts.push('攻击 > 防御');
    if (detail.relative_physical_stats === 0) parts.push('攻击 = 防御');
    if (detail.relative_physical_stats === -1) parts.push('攻击 < 防御');
    if (!parts.length && trigger) parts.push(trigger);
  }
  return [...new Set(parts)].join(' · ') || '特殊条件';
}

function flattenEvolutionChain(chain) {
  const steps = [];
  const walk = (node, parent = null) => {
    if (!node) return;
    const toId = parseId(node.species?.url);
    const toName = node.species?.name || '';
    if (parent && toId) {
      steps.push({
        fromId: parent.id,
        fromName: parent.name,
        toId,
        toName,
        condition: evolutionCondition(node.evolution_details || []),
      });
    }
    for (const child of node.evolves_to || []) {
      walk(child, { id: toId, name: toName });
    }
  };
  walk(chain);
  return steps;
}

function formatVariety(speciesName, varietyName) {
  const suffix = String(varietyName || '').startsWith(`${speciesName}-`)
    ? String(varietyName).slice(speciesName.length + 1)
    : String(varietyName || '');
  const parts = suffix.split('-').filter(Boolean);
  const prefix = parts.find((part) => FORM_PREFIX_ZH[part]);
  if (prefix) {
    const rest = parts.filter((part) => part !== prefix).join(' ');
    return rest ? `${FORM_PREFIX_ZH[prefix]} · ${formatSlug(rest)}` : FORM_PREFIX_ZH[prefix];
  }
  return formatSlug(suffix || varietyName);
}

async function loadAbilityProfile(name, { signal } = {}) {
  const key = cacheKey('abilityProfile', name);
  const cached = getCached(key);
  if (cached) return cached;
  return dedupe(key, async () => {
    try {
      const raw = await fetchPokeApiJson(`${API_BASE}/ability/${name}`, { signal });
      const zhName = localizedName(raw.names, ['zh-hans', 'zh-hant']);
      const flavor = localizedFlavor(raw.flavor_text_entries || []);
      const effect = raw.effect_entries?.find((entry) => entry.language?.name === 'zh-hans')
        || raw.effect_entries?.find((entry) => entry.language?.name === 'en');
      const profile = {
        name,
        nameZh: zhName,
        description: flavor?.text || cleanText(effect?.short_effect || effect?.effect || ''),
      };
      setCached(key, profile);
      return profile;
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      return { name, nameZh: null, description: '' };
    }
  });
}

async function loadEvolutionProfile(chainId, { signal } = {}) {
  if (!chainId) return [];
  const key = cacheKey('evolutionProfile', chainId);
  const cached = getCached(key);
  if (cached) return cached;
  return dedupe(key, async () => {
    try {
      const raw = await fetchPokeApiJson(`${API_BASE}/evolution-chain/${chainId}`, { signal });
      const steps = flattenEvolutionChain(raw.chain);
      setCached(key, steps);
      return steps;
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      return [];
    }
  });
}

function buildProfile(pokemon, species, abilityProfiles, evolutionSteps) {
  const types = pokemon.types
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => entry.type.name);
  const statsEntries = pokemon.stats || [];
  const stats = statsEntries.map((entry) => ({
    key: entry.stat.name,
    label: STAT_LABELS[entry.stat.name] || formatSlug(entry.stat.name),
    value: Number(entry.base_stat) || 0,
  }));
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const flavor = localizedFlavor(species.flavor_text_entries || []);
  const shape = species.shape?.name || null;
  const habitat = species.habitat?.name || null;
  const forms = (species.varieties || [])
    .filter((entry) => !entry.is_default)
    .map((entry) => ({
      name: entry.pokemon?.name,
      label: formatVariety(species.name, entry.pokemon?.name),
    }))
    .filter((entry) => entry.name);

  return {
    id: pokemon.id,
    name: pokemon.name,
    nameZh: localizedName(species.names, ['zh-hans', 'zh-hant']),
    types,
    typeLabels: types.map(typeLabel),
    genus: localizedGenus(species.genera || []),
    height: pokemon.height ?? null,
    weight: pokemon.weight ?? null,
    shape,
    shapeZh: shape ? (SHAPE_ZH[shape] || formatSlug(shape)) : null,
    color: species.color?.name || null,
    colorZh: species.color?.name ? (COLOR_ZH[species.color.name] || formatSlug(species.color.name)) : null,
    habitat,
    habitatZh: habitat ? (HABITAT_ZH[habitat] || formatSlug(habitat)) : null,
    abilities: (pokemon.abilities || []).map((entry, index) => {
      const ability = abilityProfiles[index] || {};
      return {
        name: entry.ability?.name,
        nameZh: ability.nameZh || null,
        description: ability.description || '',
        hidden: Boolean(entry.is_hidden),
      };
    }).filter((entry) => entry.name),
    stats,
    statTotal: total,
    flavor,
    forms,
    evolutionSteps,
  };
}

export async function loadPokemonProfile(id, { signal } = {}) {
  if (!Number.isInteger(id) || id < 1) return null;
  const key = cacheKey('profile', id);
  const cached = getCached(key);
  if (cached) return cached;

  return dedupe(key, async () => {
    const [pokemon, species] = await Promise.all([
      fetchPokeApiJson(`${API_BASE}/pokemon/${id}`, { signal }),
      fetchPokeApiJson(`${API_BASE}/pokemon-species/${id}`, { signal }),
    ]);
    const abilityNames = (pokemon.abilities || []).map((entry) => entry.ability?.name).filter(Boolean);
    const chainId = parseId(species.evolution_chain?.url);
    const [abilityProfiles, evolutionSteps] = await Promise.all([
      Promise.all(abilityNames.map((name) => loadAbilityProfile(name, { signal }))),
      loadEvolutionProfile(chainId, { signal }),
    ]);
    const profile = buildProfile(pokemon, species, abilityProfiles, evolutionSteps);
    setCached(key, profile);
    return profile;
  });
}
