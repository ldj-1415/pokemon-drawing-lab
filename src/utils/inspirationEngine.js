import {
  ACTION_BLOCKED_LOCATIONS,
  ACTION_NOTES,
  BACKGROUND_SUGGESTIONS,
  COMPOSITION_RULES,
  INSPIRATION_CHALLENGES,
  INSPIRATION_COMPOSITIONS,
  INSPIRATION_DIMENSION_KEYS,
  INSPIRATION_DIFFICULTIES,
  INSPIRATION_LIGHTING,
  INSPIRATION_MATERIALS,
  INSPIRATION_MOODS,
  INSPIRATION_PALETTES,
  INSPIRATION_THEMES,
  INSPIRATION_VIEWPOINTS,
  LOCATION_DETAILS,
  VIEWPOINT_RULES,
  inferCustomTags,
} from '../data/inspiration.js';
import { SCENE_MODULE_MAP } from '../data/scenes.js';
import { GROUP_THEMES, INTERACTION_IDEAS, STORY_IDEAS } from '../data/workbenchInspiration.js';
import { evaluateCandidateTerm, getStatusWeight, isStatusAllowed } from './compatibilityEngine.js';
import { getSceneAffinity } from './sceneRandom.js';
import { getPokemonTraits } from './pokemonTraits.js';
import { getImagePreferenceTagWeight, getImagePreferenceThemeWeight } from './imagePreferenceEngine.js';
import { getActiveAtmospheres, getAtmosphereStrength } from '../data/atmospheres.js';
import { weightedPick } from './random.js';

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `insp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyDimension(key) {
  return {
    value: key === 'palette' ? null : '',
    locked: false,
  };
}

export function createEmptyInspiration() {
  return {
    id: makeId(),
    mode: 'random',
    difficulty: 'intermediate',
    dimensions: Object.fromEntries(INSPIRATION_DIMENSION_KEYS.map((key) => [key, emptyDimension(key)])),
    meta: {
      themeId: null,
      storyId: null,
      sceneId: null,
      backgroundId: null,
      backgroundSuggestionId: null,
      actionId: null,
      interactionId: null,
      lightingId: null,
      compositionId: null,
      viewpointId: null,
      paletteId: null,
      moodId: null,
      materialId: null,
      challengeId: null,
      themeTypes: [],
      themeScenes: [],
      themeMoods: [],
      linkedPokemonIds: [],
      linkedPokemonNames: [],
      sceneContext: {},
      sourceSignature: '',
      workbenchLocked: false,
      customSeed: '',
      generatedAt: null,
    },
    createdAt: null,
    updatedAt: null,
  };
}

function uniqueStrings(value, limit = 20) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, limit);
}

function formatPokemonNames(pokemonList) {
  const names = (pokemonList || []).map((pokemon) => pokemon.nameZh || pokemon.nameEn).filter(Boolean);
  if (!names.length) return '这群宝可梦';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}和${names[1]}`;
  if (names.length === 3) return `${names[0]}、${names[1]}和${names[2]}`;
  return `${names.slice(0, 3).join('、')}等 ${names.length} 只宝可梦`;
}

function atmosphereThemeWeight(theme, settings) {
  const active = getActiveAtmospheres(settings);
  if (!active.length) return 1;
  const strength = getAtmosphereStrength(settings);
  const tags = new Set([...(theme?.types || []), ...(theme?.scenes || []), ...(theme?.moods || [])]);
  let score = 0;
  for (const atmosphere of active) {
    for (const type of theme?.types || []) {
      if (atmosphere.typeWeights?.[type]) score += 1;
    }
    for (const tag of [...(atmosphere.sceneTags || []), ...(atmosphere.visualTags || []), ...(atmosphere.timeTags || [])]) {
      if (tags.has(tag)) score += 1;
    }
  }
  return 1 + score * 0.24 * strength.factor;
}

function atmosphereTagWeight(tags, settings) {
  const active = getActiveAtmospheres(settings);
  if (!active.length || !tags?.length) return 1;
  const strength = getAtmosphereStrength(settings);
  const tagSet = new Set(tags);
  let score = 0;
  for (const atmosphere of active) {
    for (const field of ['sceneTags', 'weatherTags', 'timeTags', 'actionTags', 'interactionTags', 'eventTags', 'compositionTags', 'visualTags']) {
      for (const tag of atmosphere[field] || []) {
        if (tagSet.has(tag)) score += 1;
      }
    }
  }
  return 1 + score * 0.25 * strength.factor;
}

function optionLabel(module, id) {
  return SCENE_MODULE_MAP[module]?.options.find((option) => option.id === id)?.label || '';
}

function sceneContextText(sceneId, weatherId, timeId) {
  const scene = optionLabel('location', sceneId) || '未知场景';
  const weather = optionLabel('weather', weatherId);
  const time = optionLabel('time', timeId);
  return [scene, time, weather].filter(Boolean).join(' · ');
}

function getSceneDetail(sceneId, weatherId, timeId) {
  let detail = LOCATION_DETAILS[sceneId] || '环境细节保持克制';
  const dark = ['night', 'midnight', 'dusk', 'dawn'].includes(timeId);
  const wet = ['rain', 'heavy-rain', 'thunderstorm', 'storm', 'snow', 'blizzard', 'fog'].includes(weatherId);
  if (dark || wet) {
    detail = detail
      .replace('空气里有强烈日光', wet ? '空气潮湿，远处被雨幕压低' : '空气沉静，远处只剩低亮度轮廓')
      .replace('午后光斑落在地面', dark ? '微弱的环境光落在地面' : '光斑落在地面');
  }
  return detail;
}

const ACTION_BODY_RULES = {
  flying: { types: ['flying'], shapes: ['wings', 'bug-wings'], traits: ['majestic'] },
  swimming: { types: ['water'], shapes: ['fish', 'tentacles', 'blob'] },
  dancing: { shapes: ['humanoid', 'arms', 'legs', 'wings', 'bug-wings', 'fish'], traits: ['elegant', 'energetic', 'soft'] },
  running: { shapes: ['legs', 'quadruped', 'arms-legs', 'humanoid'], traits: ['energetic'] },
  jumping: { shapes: ['legs', 'quadruped', 'arms-legs', 'humanoid'], traits: ['energetic'] },
  climbing: { shapes: ['arms', 'legs', 'tentacles', 'quadruped'], traits: ['energetic', 'natural'] },
};

const ACTION_LOCATION_RULES = {
  running: ['room', 'cafe', 'school', 'cave', 'underwater', 'space', 'sky'],
  jumping: ['room', 'cafe', 'school', 'underwater', 'space'],
  exploring: ['room', 'cafe', 'school'],
  sunbathing: ['room', 'cafe', 'school', 'cave', 'underwater', 'space', 'sky'],
};

function actionContextCompatible(actionId, sceneId, weatherId, timeId) {
  if ((ACTION_BLOCKED_LOCATIONS[actionId] || []).includes(sceneId)) return false;
  if ((ACTION_LOCATION_RULES[actionId] || []).includes(sceneId)) return false;
  if (actionId === 'sunbathing') {
    if (['night', 'midnight', 'dusk', 'dawn'].includes(timeId)) return false;
    if (['rain', 'heavy-rain', 'thunderstorm', 'storm', 'snow', 'blizzard', 'fog'].includes(weatherId)) return false;
  }
  return true;
}
function actionBodyCompatible(actionId, pokemonList) {
  const rule = ACTION_BODY_RULES[actionId];
  if (!rule || !pokemonList?.length) return true;
  return pokemonList.every((pokemon) => {
    const traits = getPokemonTraits(pokemon);
    const typeMatch = rule.types?.some((type) => pokemon.types?.includes(type));
    const shapeMatch = rule.shapes?.includes(pokemon.shape);
    const traitMatch = rule.traits?.some((trait) => traits.includes(trait));
    return Boolean(typeMatch || shapeMatch || traitMatch);
  });
}

function normalizePalette(value) {
  if (!value || typeof value !== 'object') return null;
  const colors = uniqueStrings(value.colors, 8).filter((color) => /^#[0-9a-f]{6}$/i.test(color));
  if (!value.name || colors.length < 2) return null;
  return {
    id: String(value.id || 'custom-palette'),
    name: String(value.name).slice(0, 40),
    description: String(value.description || '').slice(0, 180),
    colors,
    moods: uniqueStrings(value.moods, 8),
  };
}

export function normalizeInspiration(raw) {
  const base = createEmptyInspiration();
  if (!raw || typeof raw !== 'object') return base;
  const mode = ['random', 'linked', 'custom'].includes(raw.mode) ? raw.mode : 'random';
  const difficulty = INSPIRATION_DIFFICULTIES.some((item) => item.id === raw.difficulty)
    ? raw.difficulty
    : 'intermediate';
  const dimensions = {};
  for (const key of INSPIRATION_DIMENSION_KEYS) {
    const value = raw.dimensions?.[key];
    if (key === 'palette') {
      dimensions[key] = {
        value: normalizePalette(value?.value),
        locked: Boolean(value?.locked),
      };
    } else {
      dimensions[key] = {
        value: typeof value?.value === 'string' ? value.value.slice(0, 500) : '',
        locked: Boolean(value?.locked),
      };
    }
  }
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  const sceneContext = meta.sceneContext && typeof meta.sceneContext === 'object'
    ? meta.sceneContext
    : {};
  return {
    ...base,
    id: raw.id ? String(raw.id) : base.id,
    mode,
    difficulty,
    dimensions,
    meta: {
      ...base.meta,
      ...meta,
      themeId: meta.themeId ? String(meta.themeId) : null,
      storyId: meta.storyId ? String(meta.storyId) : null,
      sceneId: meta.sceneId ? String(meta.sceneId) : null,
      backgroundId: meta.backgroundId ? String(meta.backgroundId) : null,
      backgroundSuggestionId: meta.backgroundSuggestionId ? String(meta.backgroundSuggestionId) : null,
      actionId: meta.actionId ? String(meta.actionId) : null,
      interactionId: meta.interactionId ? String(meta.interactionId) : null,
      lightingId: meta.lightingId ? String(meta.lightingId) : null,
      compositionId: meta.compositionId ? String(meta.compositionId) : null,
      viewpointId: meta.viewpointId ? String(meta.viewpointId) : null,
      paletteId: meta.paletteId ? String(meta.paletteId) : null,
      moodId: meta.moodId ? String(meta.moodId) : null,
      materialId: meta.materialId ? String(meta.materialId) : null,
      challengeId: meta.challengeId ? String(meta.challengeId) : null,
      themeTypes: uniqueStrings(meta.themeTypes),
      themeScenes: uniqueStrings(meta.themeScenes),
      themeMoods: uniqueStrings(meta.themeMoods),
      linkedPokemonIds: Array.isArray(meta.linkedPokemonIds)
        ? [...new Set(meta.linkedPokemonIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 30)
        : [],
      linkedPokemonNames: uniqueStrings(meta.linkedPokemonNames, 30),
      sceneContext,
      sourceSignature: String(meta.sourceSignature || ''),
      workbenchLocked: Boolean(meta.workbenchLocked),
      customSeed: String(meta.customSeed || '').slice(0, 160),
      generatedAt: meta.generatedAt || null,
    },
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function normalizeInspirationCollection(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || !entry.inspiration) return null;
      const inspiration = normalizeInspiration(entry.inspiration);
      if (!inspiration.dimensions.theme.value) return null;
      return {
        id: entry.id || makeId(),
        createdAt: entry.createdAt || new Date().toISOString(),
        title: String(entry.title || getInspirationTitle(inspiration)).slice(0, 120),
        inspiration,
      };
    })
    .filter(Boolean)
    .slice(0, 80);
}

function typeOverlap(a = [], b = []) {
  const set = new Set(a);
  return b.reduce((count, value) => count + (set.has(value) ? 1 : 0), 0);
}

function getLevel(difficulty) {
  return INSPIRATION_DIFFICULTIES.find((item) => item.id === difficulty)?.level || 2;
}

function choose(items, weightFn, { excludeId = null, rng = Math.random } = {}) {
  if (!items.length) return null;
  const pool = excludeId && items.length > 1
    ? items.filter((item) => item.id !== excludeId)
    : items;
  return weightedPick(pool.length ? pool : items, weightFn, rng);
}

const GROUP_THEME_CONTEXT = {
  'wait-out-rain': { weathers: ['light-rain', 'rain', 'heavy-rain', 'storm', 'thunderstorm'] },
  'shared-umbrella': { weathers: ['light-rain', 'rain', 'heavy-rain', 'thunderstorm'] },
  'quiet-dusk': { times: ['dusk'] },
  'shared-nap': { times: ['noon', 'afternoon'], weathers: ['sunny', 'cloudy', 'rainbow'] },
  'midnight-adventure': { times: ['night', 'midnight'] },
  'snowy-field': { times: ['morning', 'noon'], weathers: ['snow', 'blizzard', 'cloudy'] },
};

const PALETTE_TIMES = {
  'forest-moss': ['morning', 'noon', 'afternoon'],
  'moon-ghost': ['night', 'midnight', 'dusk'],
  'deep-glow': ['night', 'midnight', 'dawn'],
  'cyber-lemon': ['night', 'midnight'],
  'sakura-cream': ['morning', 'afternoon'],
  'coffee-cream': ['morning', 'afternoon', 'dawn'],
  'dusk-candy': ['dusk', 'afternoon'],
  'desert-sun': ['noon', 'afternoon', 'dusk'],
  'after-rain': ['morning', 'noon', 'afternoon', 'dusk', 'night'],
};
const PALETTE_WEATHERS = {
  'after-rain': ['light-rain', 'rain', 'heavy-rain', 'storm', 'thunderstorm'],
  'forest-moss': ['sunny', 'cloudy', 'fog'],
  'volcano-ember': ['sunny', 'cloudy'],
  'snow-haze': ['snow', 'blizzard', 'fog', 'cloudy'],
  'deep-glow': ['rain', 'storm', 'thunderstorm', 'fog', 'snow', 'blizzard'],
  'dusk-candy': ['sunny', 'cloudy', 'rainbow'],
  'old-paper': ['cloudy', 'fog', 'light-rain'],
  'moon-ghost': ['fog', 'cloudy', 'starry'],
  'desert-sun': ['sunny'],
  'sakura-cream': ['sunny', 'cloudy'],
  'cyber-lemon': ['rain', 'storm'],
  'coffee-cream': ['cloudy', 'light-rain', 'rain', 'snow'],
};
function createSceneTheme({ sceneId, context }) {
  const scene = optionLabel('location', sceneId) || '这个场景';
  const time = optionLabel('time', context.times[0]);
  const weather = optionLabel('weather', context.weathers[0]);
  const when = [time, weather].filter(Boolean).join('、');
  const text = context.groupCount >= 2
    ? `${context.names}在${when ? `${when}的` : ''}${scene}里发现的小秘密`
    : `${context.names}在${when ? `${when}的` : ''}${scene}里停了一会儿`;
  return {
    id: 'scene-fallback',
    level: 1,
    text,
    types: context.types,
    scenes: [sceneId],
    times: context.times,
    weathers: context.weathers,
    moods: ['quiet', 'gentle'],
  };
}
function chooseTheme({ context, difficulty, excludeId, sceneId, rng, settings }) {
  const level = getLevel(difficulty);
  const singlePool = INSPIRATION_THEMES.filter((theme) => theme.level <= level);
  const groupPool = context.groupCount >= 2
    ? GROUP_THEMES.map((theme) => ({
      ...theme,
      level: 1,
      times: theme.times || GROUP_THEME_CONTEXT[theme.id]?.times || [],
      weathers: theme.weathers || GROUP_THEME_CONTEXT[theme.id]?.weathers || [],
    }))
    : [];
  const levelPool = [...groupPool, ...singlePool];
  const compatiblePool = levelPool.filter((theme) => {
    const sceneOk = !sceneId || !theme.scenes?.length || theme.scenes.includes(sceneId);
    const timeOk = !context.times.length || !theme.times?.length || theme.times.some((time) => context.times.includes(time));
    const weatherOk = !context.weathers.length || !theme.weathers?.length || theme.weathers.some((weather) => context.weathers.includes(weather));
    return sceneOk && timeOk && weatherOk;
  });
  const fallbackPool = levelPool.filter((theme) => (
    !sceneId || !theme.scenes?.length || theme.scenes.includes(sceneId)
  ));
  if (sceneId && !compatiblePool.length) {
    return createSceneTheme({ sceneId, context });
  }
  const pool = compatiblePool.length ? compatiblePool : fallbackPool.length ? fallbackPool : levelPool;
  const theme = choose(pool, (item) => {
    let weight = 1;
    weight += typeOverlap(item.types, context.types) * 3;
    weight += typeOverlap(item.scenes, context.scenes) * 2;
    weight += typeOverlap(item.times, context.times) * 2;
    weight += typeOverlap(item.weathers, context.weathers) * 2;
    if (sceneId && item.scenes?.length) {
      weight *= item.scenes.includes(sceneId) ? 2.2 : 0.12;
    }
    weight *= atmosphereThemeWeight(item, settings);
    weight *= getImagePreferenceThemeWeight(item, settings);
    return Math.max(0.05, weight);
  }, { excludeId, rng });
  return theme || INSPIRATION_THEMES[0];
}

function createCustomTheme(seed) {
  const tags = inferCustomTags(seed);
  return {
    id: 'custom',
    level: 1,
    text: String(seed).trim().slice(0, 120),
    types: tags.types,
    scenes: tags.scenes,
    times: tags.times,
    weathers: [],
    moods: tags.moods,
  };
}

function getContext({ mode, difficulty, pokemonList, currentComposition, customSeed }) {
  const types = new Set();
  const scenes = new Set();
  const times = new Set();
  const weathers = new Set();
  const sceneContext = {};
  if (mode === 'linked') {
    for (const pokemon of pokemonList) {
      for (const type of pokemon.types || []) types.add(type);
    }
    for (const key of ['location', 'weather', 'time']) {
      const scene = currentComposition?.scenes?.[key];
      if (scene?.enabled && scene.value) {
        sceneContext[key] = scene.value;
        if (key === 'location') scenes.add(scene.value);
        if (key === 'weather') weathers.add(scene.value);
        if (key === 'time') times.add(scene.value);
      }
    }
  }
  if (mode === 'custom') {
    const tags = inferCustomTags(customSeed);
    tags.types.forEach((type) => types.add(type));
    tags.scenes.forEach((scene) => scenes.add(scene));
    tags.times.forEach((time) => times.add(time));
  }
  return {
    mode,
    difficulty,
    groupCount: pokemonList.length,
    pokemonList,
    names: formatPokemonNames(pokemonList),
    types: [...types],
    scenes: [...scenes],
    times: [...times],
    weathers: [...weathers],
    sceneContext,
    seedTags: mode === 'custom' ? inferCustomTags(customSeed) : {},
  };
}

function backgroundWeight(option, theme, context, pokemonList, currentLocationId) {
  let weight = 1;
  weight += typeOverlap(theme.types, option.types) * 2;
  weight += theme.scenes?.includes(option.id) ? 4 : 0;
  weight += context.scenes.includes(option.id) ? 3 : 0;
  weight += context.types.some((type) => option.types?.includes(type)) ? 1.5 : 0;
  weight += getSceneAffinity('location', option, pokemonList) - 1;
  if (currentLocationId && option.id === currentLocationId) weight += 5;
  if (theme.scenes?.length && !theme.scenes.includes(option.id)) weight *= 0.35;
  return Math.max(0.05, weight);
}

function actionIsCompatible(actionId, locationId) {
  if (!locationId) return true;
  return !(ACTION_BLOCKED_LOCATIONS[actionId] || []).includes(locationId);
}

function actionWeight(option, theme, context, settings) {
  let weight = 1;
  weight += typeOverlap(theme.types, option.types) * 2.5;
  weight += typeOverlap(context.types, option.types) * 2;
  if (option.id === 'observing') weight += 0.3;
  weight *= atmosphereTagWeight([...(option.types || []), option.id], settings);
  weight *= getImagePreferenceTagWeight([...(option.types || []), option.id], settings);
  return Math.max(0.1, weight);
}

function compositionCompatible(item, sceneId, context) {
  const rule = COMPOSITION_RULES[item.id];
  if (!rule) return true;
  if (rule.minGroup && context.groupCount < rule.minGroup) return false;
  if (rule.maxGroup && context.groupCount > rule.maxGroup) return false;
  if (rule.scenes?.length && sceneId && !rule.scenes.includes(sceneId)) return false;
  return true;
}

function viewpointCompatible(item, sceneId, context) {
  const rule = VIEWPOINT_RULES[item.id];
  if (!rule) return true;
  if (rule.minGroup && context.groupCount < rule.minGroup) return false;
  if (rule.maxGroup && context.groupCount > rule.maxGroup) return false;
  if (rule.scenes?.length && sceneId && !rule.scenes.includes(sceneId)) return false;
  return true;
}

function interactionWeight(idea, context, settings, actionId) {
  let weight = 1;
  weight *= atmosphereTagWeight(idea.tags, settings);
  weight *= getImagePreferenceTagWeight(idea.tags, settings);
  if (actionId && idea.actionTags?.includes(actionId)) weight += 0.8;
  if (context.groupCount >= 2) weight += 0.3;
  return Math.max(0.1, weight);
}

function chooseInteraction(context, settings, actionId, excludeId, rng) {
  const pool = INTERACTION_IDEAS.filter((idea) => (
    context.groupCount >= idea.minCount && context.groupCount <= idea.maxCount
  ));
  return choose(
    pool.length ? pool : INTERACTION_IDEAS,
    (idea) => interactionWeight(idea, context, settings, actionId),
    { excludeId, rng },
  ) || INTERACTION_IDEAS[0];
}

function storyWeight(idea, settings) {
  return Math.max(0.1, getImagePreferenceTagWeight(idea.tags, settings) * atmosphereTagWeight(idea.tags, settings));
}

function buildBackgroundSuggestion(sceneOption, weatherId, timeId, actionLabel, settings, excludeId, rng) {
  const detail = getSceneDetail(sceneOption?.id, weatherId, timeId);
  const weather = optionLabel('weather', weatherId) || '当前天气';
  const time = optionLabel('time', timeId) || '当前时间';
  const template = choose(
    BACKGROUND_SUGGESTIONS,
    (item) => atmosphereTagWeight([item.id], settings),
    { excludeId, rng },
  ) || BACKGROUND_SUGGESTIONS[0];
  return template.text
    .replaceAll('{scene}', sceneOption?.label || '当前场景')
    .replaceAll('{detail}', detail)
    .replaceAll('{weather}', weather)
    .replaceAll('{time}', time)
    .replaceAll('{action}', actionLabel || '主体动作');
}

function lightingWeight(entry, theme, context) {
  let weight = 1;
  weight += typeOverlap(entry.types, theme.types) * 2;
  weight += typeOverlap(entry.scenes, theme.scenes) * 2;
  weight += typeOverlap(entry.times, theme.times) * 2;
  weight += typeOverlap(entry.weathers, theme.weathers) * 2;
  weight += typeOverlap(entry.types, context.types) * 1.5;
  weight += typeOverlap(entry.scenes, context.scenes) * 2;
  weight += typeOverlap(entry.times, context.times) * 2;
  weight += typeOverlap(entry.weathers, context.weathers) * 3;
  return Math.max(0.1, weight);
}

function paletteWeight(palette, theme, context, backgroundId) {
  let weight = 1;
  weight += typeOverlap(palette.types, theme.types) * 2;
  weight += typeOverlap(palette.scenes, theme.scenes) * 1.5;
  weight += typeOverlap(palette.moods, theme.moods) * 2;
  weight += typeOverlap(palette.types, context.types) * 1.4;
  weight += typeOverlap(PALETTE_WEATHERS[palette.id] || [], context.weathers) * 4;
  weight += typeOverlap(PALETTE_TIMES[palette.id] || [], context.times) * 4;
  if (theme.scenes?.length && palette.scenes?.length) {
    const sceneMatch = palette.scenes.some((scene) => (
      theme.scenes.includes(scene) || scene === backgroundId
    ));
    if (!sceneMatch) weight *= 0.12;
  }
  return Math.max(0.05, weight);
}

function moodWeight(mood, theme, palette) {
  let weight = 1;
  weight += typeOverlap(mood.tags, theme.moods) * 3;
  weight += typeOverlap(mood.tags, palette?.moods || []) * 2;
  return Math.max(0.1, weight);
}

function currentValue(inspiration, key) {
  return inspiration?.dimensions?.[key]?.value || '';
}

function currentLocked(inspiration, key) {
  return Boolean(inspiration?.dimensions?.[key]?.locked);
}

function getCachedTheme(inspiration) {
  const value = currentValue(inspiration, 'theme');
  const meta = inspiration?.meta || {};
  return {
    id: meta.themeId || 'cached',
    text: value,
    types: meta.themeTypes || [],
    scenes: meta.themeScenes || [],
    moods: meta.themeMoods || [],
    times: [],
    weathers: [],
  };
}

/**
 * Generates a complete inspiration or re-rolls one dimension. Locked dimensions
 * are always preserved. `onlyKey` guarantees all other dimensions are untouched.
 */
export function generateInspiration({
  previous,
  mode = 'random',
  difficulty = 'intermediate',
  pokemonList = [],
  currentComposition = null,
  customSeed = '',
  onlyKey = null,
  rng = Math.random,
  settings = null,
  skipReconcile = false,
}) {
  const base = previous ? normalizeInspiration(previous) : createEmptyInspiration();
  if (mode === 'linked' && !pokemonList.length) {
    return { inspiration: base, error: '当前工作台还没有宝可梦，无法生成联动灵感。' };
  }
  if (mode === 'custom' && !String(customSeed || '').trim()) {
    return { inspiration: base, error: '请先输入一个自定义主题或关键词。' };
  }

  if (onlyKey && currentLocked(base, onlyKey)) return { inspiration: base, error: null };

  const isFull = !onlyKey;
  const context = getContext({
    mode,
    difficulty,
    pokemonList,
    currentComposition,
    customSeed,
  });
  const settingsSafe = settings || {};
  const dimensions = Object.fromEntries(
    INSPIRATION_DIMENSION_KEYS.map((key) => [key, { ...base.dimensions[key] }]),
  );
  const meta = { ...base.meta };
  const sceneContext = context.sceneContext || {};
  const weatherId = sceneContext.weather || '';
  const timeId = sceneContext.time || '';

  let theme = getCachedTheme(base);
  const shouldGenerateTheme = isFull ? !currentLocked(base, 'theme') : onlyKey === 'theme';
  if (shouldGenerateTheme) {
    if (mode === 'custom' && isFull && String(customSeed || '').trim()) {
      theme = createCustomTheme(customSeed);
      dimensions.theme = { value: theme.text, locked: true };
    } else {
      const sceneConstraint = currentLocked(base, 'scene')
        ? (meta.sceneId || '')
        : (mode === 'linked' ? (sceneContext.location || '') : '');
      theme = chooseTheme({
        context,
        difficulty,
        excludeId: meta.themeId,
        sceneId: sceneConstraint,
        rng,
        settings: settingsSafe,
      });
      dimensions.theme = {
        ...dimensions.theme,
        value: theme.text.includes('{names}')
          ? theme.text.replaceAll('{names}', context.names)
          : theme.text,
      };
    }
    meta.themeId = theme.id;
    meta.themeTypes = theme.types || [];
    meta.themeScenes = theme.scenes || [];
    meta.themeMoods = theme.moods || [];
  } else if (!dimensions.theme.value && theme.text) {
    dimensions.theme = {
      ...dimensions.theme,
      value: theme.text.includes('{names}')
        ? theme.text.replaceAll('{names}', context.names)
        : theme.text,
    };
  }
  if (!theme.types) theme = getCachedTheme({ ...base, meta });

  const themeForWeight = {
    ...theme,
    types: meta.themeTypes || theme.types || [],
    scenes: meta.themeScenes || theme.scenes || [],
    moods: meta.themeMoods || theme.moods || [],
  };

  // Scene (location) is the stage. Background is a separate visual suggestion.
  const shouldGenerateScene = isFull ? !currentLocked(base, 'scene') : onlyKey === 'scene';
  const shouldGenerateAction = isFull ? !currentLocked(base, 'action') : onlyKey === 'action';
  const fixedActionId = !shouldGenerateAction ? meta.actionId : null;
  let sceneOption = SCENE_MODULE_MAP.location.options.find((item) => item.id === meta.sceneId)
    || SCENE_MODULE_MAP.location.options.find((item) => item.id === sceneContext.location)
    || SCENE_MODULE_MAP.location.options[0];

  if (shouldGenerateScene) {
    const linkedLocationId = mode === 'linked' ? sceneContext.location : '';
    const linkedSceneOption = linkedLocationId
      ? SCENE_MODULE_MAP.location.options.find((option) => option.id === linkedLocationId)
      : null;
    if (linkedSceneOption && onlyKey !== 'scene') {
      sceneOption = linkedSceneOption;
    } else {
      const fixedTerms = [
        ...(fixedActionId ? [{ module: 'action', id: fixedActionId }] : []),
        ...(weatherId ? [{ module: 'weather', id: weatherId }] : []),
        ...(timeId ? [{ module: 'time', id: timeId }] : []),
      ];
      const themeScenes = new Set(themeForWeight.scenes || []);
      const themeScopedPool = themeScenes.size
        ? SCENE_MODULE_MAP.location.options.filter((option) => themeScenes.has(option.id))
        : SCENE_MODULE_MAP.location.options;
      const usablePool = themeScopedPool.filter((option) => (
        !fixedActionId || actionIsCompatible(fixedActionId, option.id)
      ));
      const evaluated = usablePool.map((option) => ({
        option,
        evaluation: evaluateCandidateTerm('location', option.id, fixedTerms, context),
      }));
      const allowed = evaluated.filter((item) => isStatusAllowed(
        item.evaluation.status,
        settingsSafe.compatibilityMode || 'reasonable',
      ));
      const pool = allowed.length ? allowed : evaluated;
      const picked = choose(
        pool,
        (item) => backgroundWeight(item.option, themeForWeight, context, pokemonList, linkedLocationId)
          * getStatusWeight(item.evaluation.status, settingsSafe.compatibilityMode || 'reasonable'),
        { excludeId: onlyKey === 'scene' ? meta.sceneId : null, rng },
      );
      sceneOption = picked?.option || sceneOption;
    }
    meta.sceneId = sceneOption.id;
    const detail = getSceneDetail(sceneOption.id, weatherId, timeId);
    const contextText = sceneContextText(sceneOption.id, weatherId, timeId);
    dimensions.scene = {
      ...dimensions.scene,
      value: `${contextText}：${detail}`,
    };
  } else if (!dimensions.scene.value) {
    const detail = getSceneDetail(sceneOption.id, weatherId, timeId);
    const contextText = sceneContextText(sceneOption.id, weatherId, timeId);
    dimensions.scene = { ...dimensions.scene, value: `${contextText}：${detail}` };
    meta.sceneId = sceneOption.id;
  }
  const sceneId = meta.sceneId || sceneOption.id;
  meta.backgroundId = sceneId;

  let actionLabel = '';
  if (shouldGenerateAction) {
    const fixedTerms = [
      { module: 'location', id: sceneId },
      ...(weatherId ? [{ module: 'weather', id: weatherId }] : []),
      ...(timeId ? [{ module: 'time', id: timeId }] : []),
    ];
    const actionOptions = SCENE_MODULE_MAP.action.options.filter((option) => (
      actionBodyCompatible(option.id, pokemonList)
      && actionContextCompatible(option.id, sceneId, weatherId, timeId)
    ));
    const safeActions = SCENE_MODULE_MAP.action.options.filter((option) => (
      ['sleeping', 'resting', 'observing'].includes(option.id)
    ));
    const evaluated = (actionOptions.length ? actionOptions : safeActions).map((option) => ({
      option,
      evaluation: evaluateCandidateTerm('action', option.id, fixedTerms, context),
    }));
    const allowed = evaluated.filter((item) => isStatusAllowed(
      item.evaluation.status,
      settingsSafe.compatibilityMode || 'reasonable',
    ));
    const pool = allowed.length ? allowed : evaluated;
    const picked = choose(
      pool,
      (item) => actionWeight(item.option, themeForWeight, context, settingsSafe)
        * getStatusWeight(item.evaluation.status, settingsSafe.compatibilityMode || 'reasonable'),
      { excludeId: meta.actionId, rng },
    );
    const action = picked?.option || SCENE_MODULE_MAP.action.options[0];
    const interaction = chooseInteraction(context, settingsSafe, action.id, meta.interactionId, rng);
    const note = ACTION_NOTES[action.id] || action.description;
    actionLabel = action.label;
    const groupText = context.groupCount >= 2
      ? (context.groupCount === 2
        ? '两只宝可梦保持同一动作方向，但一只更主动，另一只略微迟疑。'
        : '几只宝可梦共用同一个动作节拍，但各自幅度不同。')
      : '';
    dimensions.action = {
      ...dimensions.action,
      value: `${action.label}：${note}${groupText ? `。${groupText.replace(/。$/, '')}` : ''}。互动：${interaction.text}`,
    };
    meta.actionId = action.id;
    meta.interactionId = interaction.id;
  } else {
    actionLabel = SCENE_MODULE_MAP.action.options.find((item) => item.id === meta.actionId)?.label || '';
  }

  const shouldGenerateStory = isFull ? !currentLocked(base, 'story') : onlyKey === 'story';
  if (shouldGenerateStory) {
    const storyPool = STORY_IDEAS.filter((idea) => (
      context.groupCount >= idea.minCount && context.groupCount <= idea.maxCount
    ));
    const story = choose(
      storyPool.length ? storyPool : STORY_IDEAS,
      (idea) => storyWeight(idea, settingsSafe),
      { excludeId: meta.storyId, rng },
    ) || STORY_IDEAS[0];
    const sceneLabel = optionLabel('location', sceneId) || '当前场景';
    const timeWeather = [
      optionLabel('time', timeId),
      optionLabel('weather', weatherId),
    ].filter(Boolean).join('、');
    const environmentText = timeWeather ? `${timeWeather}中的${sceneLabel}` : sceneLabel;
    let storyText = story.text
      .replaceAll('{names}', context.names)
      .replaceAll('{environment}', environmentText || '这个场景')
      .replaceAll('{action}', actionLabel || '停下动作');
    if (!storyText.includes(sceneLabel)) {
      storyText = `${environmentText || sceneLabel}，${storyText}`;
    }
    dimensions.story = {
      ...dimensions.story,
      value: storyText,
    };
    meta.storyId = story.id;
  }

  const shouldGenerateBackground = isFull
    ? !currentLocked(base, 'background')
    : onlyKey === 'background';
  if (shouldGenerateBackground) {
    dimensions.background = {
      ...dimensions.background,
      value: buildBackgroundSuggestion(
        sceneOption,
        weatherId,
        timeId,
        actionLabel,
        settingsSafe,
        meta.backgroundSuggestionId,
        rng,
      ),
    };
    meta.backgroundSuggestionId = meta.backgroundSuggestionId || 'background';
  }

  if (isFull ? !currentLocked(base, 'composition') : onlyKey === 'composition') {
    const compatible = INSPIRATION_COMPOSITIONS.filter((item) => compositionCompatible(item, sceneId, context));
    const item = choose(compatible.length ? compatible : INSPIRATION_COMPOSITIONS, () => 1, {
      excludeId: meta.compositionId,
      rng,
    });
    dimensions.composition = { ...dimensions.composition, value: item.text };
    meta.compositionId = item.id;
  }
  if (isFull ? !currentLocked(base, 'viewpoint') : onlyKey === 'viewpoint') {
    const compatible = INSPIRATION_VIEWPOINTS.filter((item) => viewpointCompatible(item, sceneId, context));
    const item = choose(compatible.length ? compatible : INSPIRATION_VIEWPOINTS, () => 1, {
      excludeId: meta.viewpointId,
      rng,
    });
    dimensions.viewpoint = { ...dimensions.viewpoint, value: item.text };
    meta.viewpointId = item.id;
  }
  if (isFull ? !currentLocked(base, 'lighting') : onlyKey === 'lighting') {
    const sceneSafe = INSPIRATION_LIGHTING.filter((entry) => (
      !entry.scenes?.length || entry.scenes.includes(sceneId)
    ));
    const timeSafe = sceneSafe.filter((entry) => (
      !entry.times?.length || !context.times.length || entry.times.some((time) => context.times.includes(time))
    ));
    const weatherSafe = timeSafe.filter((entry) => (
      !entry.weathers?.length || !context.weathers.length || entry.weathers.some((weather) => context.weathers.includes(weather))
    ));
    const needsContextualLighting = (context.weathers.length && !weatherSafe.length)
      || (context.times.length && !timeSafe.length)
      || !sceneSafe.length;
    if (needsContextualLighting) {
      const timeLabel = optionLabel('time', timeId) || '当前时间';
      const weatherLabel = optionLabel('weather', weatherId) || '当前天气';
      const sceneLabel = optionLabel('location', sceneId) || '当前场景';
      dimensions.lighting = {
        ...dimensions.lighting,
        value: `${timeLabel}的${weatherLabel}压低了${sceneLabel}的整体照度，近景只保留一处清晰材质，远景退成低对比轮廓。`,
      };
      meta.lightingId = 'contextual';
    } else {
      const pool = weatherSafe.length ? weatherSafe : timeSafe.length ? timeSafe : sceneSafe;
      const item = choose(
        pool,
        (entry) => lightingWeight(entry, themeForWeight, context),
        { excludeId: meta.lightingId, rng },
      ) || pool[0];
      dimensions.lighting = { ...dimensions.lighting, value: item.text };
      meta.lightingId = item.id;
    }
  }
  if (isFull ? !currentLocked(base, 'palette') : onlyKey === 'palette') {
    const exactScenePalettes = INSPIRATION_PALETTES.filter((item) => (
      !item.scenes?.length || item.scenes.includes(sceneId)
    ));
    const themeScenePalettes = INSPIRATION_PALETTES.filter((item) => (
      !item.scenes?.length
      || !themeForWeight.scenes?.length
      || item.scenes.some((scene) => themeForWeight.scenes.includes(scene))
    ));
    const palettePool = exactScenePalettes.length
      ? exactScenePalettes
      : themeScenePalettes.length ? themeScenePalettes : INSPIRATION_PALETTES;
    const palette = choose(
      palettePool,
      (item) => paletteWeight(item, themeForWeight, context, sceneId),
      { excludeId: meta.paletteId, rng },
    );
    dimensions.palette = {
      ...dimensions.palette,
      value: {
        id: palette.id,
        name: palette.name,
        description: palette.description,
        colors: [...palette.colors],
        moods: [...palette.moods],
      },
    };
    meta.paletteId = palette.id;
  }
  const currentPalette = dimensions.palette.value;
  if (isFull ? !currentLocked(base, 'mood') : onlyKey === 'mood') {
    const mood = choose(
      INSPIRATION_MOODS,
      (item) => moodWeight(item, themeForWeight, currentPalette),
      { excludeId: meta.moodId, rng },
    );
    dimensions.mood = { ...dimensions.mood, value: mood.text };
    meta.moodId = mood.id;
  }
  if (isFull ? !currentLocked(base, 'material') : onlyKey === 'material') {
    const material = choose(INSPIRATION_MATERIALS, () => 1, { excludeId: meta.materialId, rng });
    dimensions.material = { ...dimensions.material, value: material.text };
    meta.materialId = material.id;
  }
  if (isFull ? !currentLocked(base, 'challenge') : onlyKey === 'challenge') {
    const level = getLevel(difficulty);
    const pool = INSPIRATION_CHALLENGES.filter((item) => item.level === level);
    const challenge = choose(pool.length ? pool : INSPIRATION_CHALLENGES, () => 1, {
      excludeId: meta.challengeId,
      rng,
    });
    dimensions.challenge = { ...dimensions.challenge, value: challenge.text };
    meta.challengeId = challenge.id;
  }

  const now = new Date().toISOString();
  const linkedPokemonNames = [...new Set(
    pokemonList.map((pokemon) => pokemon.nameZh || pokemon.nameEn).filter(Boolean),
  )];
  const next = {
    ...base,
    id: base.createdAt ? base.id : makeId(),
    mode,
    difficulty,
    dimensions,
    meta: {
      ...meta,
      themeId: meta.themeId || theme.id || null,
      sceneId: sceneId || null,
      backgroundId: sceneId || null,
      linkedPokemonIds: [...new Set(pokemonList.map((pokemon) => pokemon.id))],
      linkedPokemonNames,
      sceneContext: context.sceneContext,
      sourceSignature: pokemonList.map((pokemon) => pokemon.id).join('-'),
      sceneSignature: ['location', 'weather', 'time']
        .map((key) => `${key}:${context.sceneContext[key] || ''}`)
        .join('|'),
      customSeed: mode === 'custom' ? String(customSeed || '').trim().slice(0, 160) : '',
      generatedAt: now,
    },
    createdAt: base.createdAt || now,
    updatedAt: now,
  };

  if (onlyKey && !skipReconcile) {
    const dependencies = {
      theme: ['scene', 'action', 'story', 'background', 'composition', 'viewpoint', 'lighting', 'palette', 'mood'],
      scene: ['action', 'story', 'background', 'composition', 'viewpoint', 'lighting', 'palette', 'mood'],
      action: ['story', 'background', 'composition', 'viewpoint'],
      lighting: ['background', 'palette', 'mood'],
      palette: ['mood'],
    }[onlyKey] || [];
    const unlockedDependencies = dependencies.filter((key) => !base.dimensions[key]?.locked);
    if (unlockedDependencies.length) {
      const reconcileBase = {
        ...next,
        dimensions: Object.fromEntries(INSPIRATION_DIMENSION_KEYS.map((key) => [
          key,
          { ...next.dimensions[key], locked: !unlockedDependencies.includes(key) },
        ])),
      };
      const reconciled = generateInspiration({
        previous: reconcileBase,
        mode,
        difficulty,
        pokemonList,
        currentComposition,
        customSeed,
        onlyKey: null,
        rng,
        settings,
        skipReconcile: true,
      }).inspiration;
      for (const key of INSPIRATION_DIMENSION_KEYS) {
        reconciled.dimensions[key] = {
          ...reconciled.dimensions[key],
          locked: Boolean(base.dimensions[key]?.locked),
        };
      }
      return { inspiration: reconciled, error: null };
    }
  }

  return { inspiration: next, error: null };
}
export function getInspirationTitle(inspiration) {
  const theme = inspiration?.dimensions?.theme?.value;
  if (!theme) return '未命名灵感';
  return theme.length > 32 ? `${theme.slice(0, 32)}…` : theme;
}

export function getInspirationSearchText(entry) {
  const inspiration = entry.inspiration || entry;
  const dimensions = inspiration.dimensions || {};
  const values = Object.values(dimensions).flatMap((dimension) => {
    if (dimension?.value && typeof dimension.value === 'object') {
      return [dimension.value.name, dimension.value.description, ...(dimension.value.colors || [])];
    }
    return dimension?.value ? [dimension.value] : [];
  });
  return [
    entry.title,
    inspiration.mode,
    inspiration.difficulty,
    inspiration.meta?.customSeed,
    ...(inspiration.meta?.linkedPokemonNames || []),
    ...values,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function searchInspirationCollection(collection, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return collection;
  return collection.filter((entry) => getInspirationSearchText(entry).includes(needle));
}

export function buildInspirationText(inspiration) {
  if (!inspiration) return '';
  const dims = inspiration.dimensions;
  const palette = dims.palette?.value;
  const difficulty = INSPIRATION_DIFFICULTIES.find((item) => item.id === inspiration.difficulty);
  return [
    `创意主题：${dims.theme?.value || '未生成'}`,
    `故事情境：${dims.story?.value || '未生成'}`,
    `场景环境：${dims.scene?.value || '未生成'}`,
    `绘画指导：`,
    `- 动作互动：${dims.action?.value || '未生成'}`,
    `- 构图：${dims.composition?.value || '未生成'}`,
    `- 视角：${dims.viewpoint?.value || '未生成'}`,
    `- 光影：${dims.lighting?.value || '未生成'}`,
    `- 背景建议：${dims.background?.value || '未生成'}`,
    `视觉风格：`,
    `- 配色：${palette ? `${palette.name} — ${palette.description}` : '未生成'}`,
    `- 色卡：${palette ? palette.colors.join(' / ') : '未生成'}`,
    `- 氛围：${dims.mood?.value || '未生成'}`,
    `- 材质：${dims.material?.value || '未生成'}`,
    `特殊绘画挑战：${dims.challenge?.value || '未生成'}`,
    `难度：${difficulty?.label || '进阶'}`,
  ].join('\n');
}

export function getInspirationSignature(inspiration) {
  if (!inspiration) return '';
  const dims = inspiration.dimensions;
  return [
    inspiration.mode,
    inspiration.difficulty,
    ...INSPIRATION_DIMENSION_KEYS.map((key) => {
      const value = dims?.[key]?.value;
      if (value && typeof value === 'object') return `${key}:${value.id}:${value.colors?.join(',')}`;
      return `${key}:${value || ''}`;
    }),
  ].join('|');
}

export function createCollectionEntry(inspiration) {
  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    title: getInspirationTitle(inspiration),
    inspiration: normalizeInspiration(inspiration),
  };
}

export function getInspirationDifficultyMeta(id) {
  return INSPIRATION_DIFFICULTIES.find((item) => item.id === id) || INSPIRATION_DIFFICULTIES[1];
}
