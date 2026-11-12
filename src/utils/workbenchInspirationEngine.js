import {
  ACTION_NOTES,
  INSPIRATION_CHALLENGES,
  INSPIRATION_COMPOSITIONS,
  INSPIRATION_LIGHTING,
  INSPIRATION_THEMES,
  INSPIRATION_VIEWPOINTS,
  LOCATION_DETAILS,
} from '../data/inspiration.js';
import { SCENE_MODULE_MAP } from '../data/scenes.js';
import {
  GROUP_THEMES,
  INTERACTION_IDEAS,
  STORY_IDEAS,
  WORKBENCH_COMPOSITION_GROUP_HINTS,
  WORKBENCH_INSPIRATION_KEYS,
} from '../data/workbenchInspiration.js';
import { getActiveAtmospheres, getAtmosphereStrength } from '../data/atmospheres.js';
import { getAtmosphereTermWeight } from './atmosphereEngine.js';
import {
  getImagePreferenceTagWeight,
  getImagePreferenceTermWeight,
  getImagePreferenceThemeWeight,
} from './imagePreferenceEngine.js';
import {
  evaluateCandidateTerm,
  getStatusWeight,
  getTermProfile,
  isStatusAllowed,
} from './compatibilityEngine.js';
import { getSceneAffinity } from './sceneRandom.js';
import { weightedPick } from './random.js';
import { createEmptyInspiration, normalizeInspiration } from './inspirationEngine.js';

const CHALLENGE_TAGS = {
  'b-three-colors': ['three-colors', 'color'],
  'b-no-black': ['no-black', 'color'],
  'b-thirty-min': ['thirty-min', 'time'],
  'b-negative-space': ['negative-space', 'composition'],
  'b-one-moment': ['one-moment', 'motion'],
  'i-two-lights': ['two-lights', 'light'],
  'i-bounce-color': ['bounce-color', 'color', 'light'],
  'i-one-shape': ['one-shape', 'composition'],
  'i-partial-body': ['partial-body', 'composition'],
  'i-story-object': ['story-object', 'detail'],
  'c-five-colors': ['five-colors', 'color'],
  'c-no-horizon': ['no-horizon', 'composition'],
  'c-rim-only': ['rim-only', 'light'],
  'c-three-depths': ['three-depths', 'composition'],
  'c-no-sun': ['no-sun', 'light', 'color'],
  'c-two-moments': ['two-moments', 'time'],
};

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `wi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyDimension() {
  return {
    value: '',
    locked: false,
  };
}

export function createEmptyWorkbenchInspiration() {
  return {
    id: makeId(),
    sourceSignature: '',
    locked: false,
    dimensions: Object.fromEntries(WORKBENCH_INSPIRATION_KEYS.map((key) => [key, emptyDimension(key)])),
    meta: {
      themeId: null,
      storyId: null,
      actionId: null,
      environmentId: null,
      interactionId: null,
      compositionId: null,
      viewpointId: null,
      lightingId: null,
      challengeId: null,
      pokemonIds: [],
      pokemonNames: [],
      groupCount: 0,
      generatedAt: null,
    },
    createdAt: null,
    updatedAt: null,
  };
}

function normalizeObject(value) {
  return value && typeof value === 'object' ? value : null;
}

export function normalizeWorkbenchInspiration(raw) {
  const base = createEmptyWorkbenchInspiration();
  if (!raw || typeof raw !== 'object') return base;
  const rawDimensions = raw.dimensions || {};
  const oldColor = normalizeObject(rawDimensions.colorLight?.value);
  const oldCompositionView = normalizeObject(rawDimensions.compositionView?.value);
  const oldAction = rawDimensions.actionPose?.value || '';
  const oldInteraction = rawDimensions.interaction?.value || '';
  const actionInteraction = rawDimensions.actionInteraction?.value
    || [oldAction, oldInteraction].filter(Boolean).join('；');
  const story = rawDimensions.story?.value || '';
  const lighting = rawDimensions.lighting?.value || oldColor?.lighting?.text || '';
  const composition = rawDimensions.composition?.value || oldCompositionView?.composition || '';
  const viewpoint = rawDimensions.viewpoint?.value || oldCompositionView?.viewpoint || '';
  const dimensions = {};
  for (const key of WORKBENCH_INSPIRATION_KEYS) {
    const dimension = rawDimensions[key];
    if (key === 'composition') {
      dimensions[key] = {
        locked: Boolean(dimension?.locked || rawDimensions.compositionView?.locked),
        value: String(composition).slice(0, 400),
      };
    } else if (key === 'viewpoint') {
      dimensions[key] = {
        locked: Boolean(dimension?.locked || rawDimensions.compositionView?.locked),
        value: String(viewpoint).slice(0, 400),
      };
    } else if (key === 'actionInteraction') {
      dimensions[key] = {
        locked: Boolean(rawDimensions.actionInteraction?.locked || rawDimensions.actionPose?.locked || rawDimensions.interaction?.locked),
        value: String(actionInteraction).slice(0, 700),
      };
    } else if (key === 'story') {
      dimensions[key] = {
        locked: Boolean(rawDimensions.story?.locked),
        value: String(story).slice(0, 500),
      };
    } else if (key === 'lighting') {
      dimensions[key] = {
        locked: Boolean(rawDimensions.lighting?.locked || rawDimensions.colorLight?.locked),
        value: String(lighting).slice(0, 400),
      };
    } else {
      dimensions[key] = {
        locked: Boolean(dimension?.locked),
        value: typeof dimension?.value === 'string' ? dimension.value.slice(0, 600) : '',
      };
    }
  }
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  return {
    ...base,
    id: raw.id ? String(raw.id) : base.id,
    sourceSignature: raw.sourceSignature ? String(raw.sourceSignature) : '',
    locked: Boolean(raw.locked),
    dimensions,
    meta: {
      ...base.meta,
      ...meta,
      pokemonIds: Array.isArray(meta.pokemonIds) ? meta.pokemonIds.map(Number).filter(Number.isInteger).slice(0, 100) : [],
      pokemonNames: Array.isArray(meta.pokemonNames) ? meta.pokemonNames.map(String).slice(0, 100) : [],
      groupCount: Number(meta.groupCount) || 0,
    },
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function getPokemonSourceSignature(pokemonList) {
  return (pokemonList || []).map((pokemon) => pokemon.id).join('-');
}

export function formatPokemonNames(pokemonList) {
  const names = (pokemonList || []).map((pokemon) => pokemon.nameZh || pokemon.nameEn).filter(Boolean);
  if (names.length <= 1) return names[0] || '宝可梦';
  if (names.length === 2) return `${names[0]}和${names[1]}`;
  if (names.length === 3) return `${names[0]}、${names[1]}和${names[2]}`;
  return `${names.slice(0, 3).join('、')}等 ${names.length} 只宝可梦`;
}

function typeMatchScore(typesA, typesB) {
  const set = new Set(typesA || []);
  return (typesB || []).reduce((sum, type) => sum + (set.has(type) ? 1 : 0), 0);
}

function getAtmosphereTagWeight(tags, settings) {
  const active = getActiveAtmospheres(settings);
  if (!active.length || !tags?.length) return 1;
  const strength = getAtmosphereStrength(settings);
  const tagSet = new Set(tags);
  const matches = new Set();
  for (const atmosphere of active) {
    for (const field of ['sceneTags', 'weatherTags', 'timeTags', 'actionTags', 'interactionTags', 'eventTags', 'compositionTags', 'visualTags']) {
      for (const tag of atmosphere[field] || []) {
        if (tagSet.has(tag)) matches.add(tag);
      }
    }
  }
  return 1 + matches.size * 0.34 * strength.factor;
}

function getAtmosphereThemeWeight(theme, settings) {
  const active = getActiveAtmospheres(settings);
  if (!active.length) return 1;
  const strength = getAtmosphereStrength(settings);
  let typeScore = 0;
  let tagScore = 0;
  const themeTags = new Set([...(theme?.types || []), ...(theme?.scenes || []), ...(theme?.moods || [])]);
  for (const atmosphere of active) {
    for (const type of theme?.types || []) {
      if (atmosphere.typeWeights?.[type]) typeScore += 1;
    }
    for (const tag of [...(atmosphere.sceneTags || []), ...(atmosphere.visualTags || []), ...(atmosphere.timeTags || [])]) {
      if (themeTags.has(tag)) tagScore += 1;
    }
  }
  return 1 + (typeScore * 0.5 + tagScore * 0.22) * strength.factor;
}

function themeWeight(theme, context, settings) {
  let weight = 1;
  weight += typeMatchScore(context.types, theme.types) * 2.6;
  weight += typeMatchScore(context.sceneIds, theme.scenes) * 1.8;
  weight += typeMatchScore(context.moods, theme.moods) * 0.8;
  weight *= getAtmosphereThemeWeight(theme, settings);
  weight *= getImagePreferenceThemeWeight(theme, settings);
  return Math.max(0.05, weight);
}

function choose(items, getWeight, excludeId, rng) {
  if (!items.length) return null;
  const pool = excludeId && items.length > 1 ? items.filter((item) => item.id !== excludeId) : items;
  return weightedPick(pool.length ? pool : items, getWeight, rng);
}

function locationWeight(option, theme, context, settings) {
  let weight = 1;
  weight += getSceneAffinity('location', option, context.pokemonList);
  weight += typeMatchScore(option.types, context.types) * 1.2;
  weight += typeMatchScore([option.id], theme.scenes || []) * 2;
  weight *= getAtmosphereTermWeight('location', option.id, settings);
  weight *= getImagePreferenceTermWeight('location', option.id, settings);
  if (option.id === context.currentLocationId) weight += 2.5;
  return Math.max(0.05, weight);
}

function actionWeight(option, theme, context, settings) {
  let weight = 1;
  weight += getSceneAffinity('action', option, context.pokemonList);
  weight += typeMatchScore(option.types, context.types) * 1.2;
  weight *= getAtmosphereTermWeight('action', option.id, settings);
  weight *= getImagePreferenceTermWeight('action', option.id, settings);
  if (context.groupCount >= 2) weight += 0.4;
  return Math.max(0.05, weight);
}

function compositionWeight(composition, context, settings) {
  let weight = 1;
  const hints = WORKBENCH_COMPOSITION_GROUP_HINTS[context.groupCount >= 2 ? 'group' : 'solo'];
  const profile = getTermProfile('composition', composition.id);
  if (hints.some((hint) => profile?.all?.includes(hint))) weight += 1.25;
  weight *= getAtmosphereTermWeight('composition', composition.id, settings);
  weight *= getImagePreferenceTermWeight('composition', composition.id, settings);
  return Math.max(0.05, weight);
}

function viewpointWeight(viewpoint, context, settings) {
  let weight = 1;
  if (context.groupCount >= 2 && ['eye-level', 'low-angle', 'high-angle', 'over-shoulder', 'wide-close', 'profile', 'oblique-high'].includes(viewpoint.id)) {
    weight += 0.7;
  }
  weight *= getAtmosphereTagWeight([...(viewpoint.moodTags || []), ...(viewpoint.visualTags || [])], settings);
  weight *= getImagePreferenceTagWeight([...(viewpoint.moodTags || []), ...(viewpoint.visualTags || [])], settings);
  return Math.max(0.05, weight);
}

function lightingWeight(lighting, context, settings) {
  let weight = 1;
  weight += typeMatchScore(context.types, lighting.types) * 1.3;
  weight += typeMatchScore([context.environmentId], lighting.scenes || []) * 1.8;
  weight += typeMatchScore([context.weatherId], lighting.weathers || []) * 1.8;
  weight += typeMatchScore([context.timeId], lighting.times || []) * 1.8;
  weight *= getAtmosphereTagWeight([...(lighting.types || []), ...(lighting.scenes || []), ...(lighting.times || []), ...(lighting.weathers || [])], settings);
  weight *= getImagePreferenceTagWeight([...(lighting.types || []), ...(lighting.scenes || []), ...(lighting.times || []), ...(lighting.weathers || [])], settings);
  return Math.max(0.05, weight);
}

function getThemeText(theme, names) {
  return theme.text.includes('{names}')
    ? theme.text.replaceAll('{names}', names)
    : theme.text;
}

function getEnvironmentText(option) {
  return `${option.label}：${LOCATION_DETAILS[option.id] || option.description}`;
}

function getGroupActionSuffix(groupCount) {
  if (groupCount <= 1) return '';
  if (groupCount === 2) return '两只宝可梦保持同一动作方向，但一只更主动，另一只略微迟疑，形成互动节奏。';
  return '几只宝可梦共用同一个动作节拍，但各自幅度不同，避免像复制粘贴。';
}

function chooseInteraction(context, settings, excludeId, rng, actionId) {
  const pool = INTERACTION_IDEAS.filter((idea) => context.groupCount >= idea.minCount && context.groupCount <= idea.maxCount);
  const actionProfile = actionId ? getTermProfile('action', actionId) : null;
  const actionTags = new Set([...(actionProfile?.mood || []), ...(actionProfile?.visual || [])]);
  return choose(pool, (idea) => {
    const actionOverlap = (idea.tags || []).filter((tag) => actionTags.has(tag)).length;
    return getImagePreferenceTagWeight(idea.tags, settings)
      * getAtmosphereTagWeight(idea.tags, settings)
      * (context.groupCount >= 2 ? 1.1 : 1)
      * (1 + actionOverlap * 0.45);
  }, excludeId, rng);
}

function chooseStory(context, settings, excludeId, rng, environmentLabel, actionLabel, names) {
  const pool = STORY_IDEAS.filter((idea) => context.groupCount >= idea.minCount && context.groupCount <= idea.maxCount);
  const idea = choose(
    pool,
    (item) => getImagePreferenceTagWeight(item.tags, settings) * getAtmosphereTagWeight(item.tags, settings),
    excludeId,
    rng,
  ) || pool[0] || STORY_IDEAS[0];
  return {
    ...idea,
    text: idea.text
      .replaceAll('{names}', names)
      .replaceAll('{environment}', environmentLabel || '这个场景')
      .replaceAll('{action}', actionLabel || '停下动作'),
  };
}

function actionLabelFromId(actionId) {
  return SCENE_MODULE_MAP.action.options.find((option) => option.id === actionId)?.label || '';
}

function environmentLabelFromId(environmentId) {
  return SCENE_MODULE_MAP.location.options.find((option) => option.id === environmentId)?.label || '';
}

export function toWorkshopInspiration(inspiration, pokemonList, sceneState, colorReference = null) {
  if (!inspiration?.dimensions?.theme?.value) return null;
  const dims = inspiration.dimensions;
  const color = colorReference?.value;
  const base = createEmptyInspiration();
  const themeValue = dims.story.value
    ? `${dims.theme.value}\n情境：${dims.story.value}`
    : dims.theme.value;
  const paletteValue = color
    ? {
      id: color.paletteId,
      name: color.name,
      description: color.description,
      colors: color.colors,
      moods: color.moods || [],
    }
    : null;
  const dimensions = {
    ...base.dimensions,
    theme: { value: themeValue, locked: dims.theme.locked || dims.story.locked },
    action: { value: dims.actionInteraction.value, locked: dims.actionInteraction.locked },
    composition: { value: dims.composition.value, locked: dims.composition.locked },
    viewpoint: { value: dims.viewpoint.value, locked: dims.viewpoint.locked },
    background: { value: dims.environment.value, locked: dims.environment.locked },
    lighting: { value: dims.lighting.value, locked: dims.lighting.locked },
    palette: { value: paletteValue, locked: Boolean(colorReference?.locked) },
    mood: { value: color?.moodText || '', locked: Boolean(colorReference?.locked) },
    material: { value: color?.materialText || '', locked: Boolean(colorReference?.locked) },
    challenge: { value: dims.challenge.value, locked: dims.challenge.locked },
  };
  const now = new Date().toISOString();
  return normalizeInspiration({
    ...base,
    mode: 'linked',
    difficulty: 'intermediate',
    dimensions,
    meta: {
      ...base.meta,
      themeId: inspiration.meta.themeId || 'workbench',
      themeTypes: inspiration.meta.themeTypes || [],
      themeScenes: inspiration.meta.themeScenes || [],
      themeMoods: inspiration.meta.themeMoods || [],
      linkedPokemonIds: (pokemonList || []).map((pokemon) => pokemon.id),
      linkedPokemonNames: (pokemonList || []).map((pokemon) => pokemon.nameZh || pokemon.nameEn).filter(Boolean),
      sceneContext: Object.fromEntries(
        ['location', 'weather', 'time']
          .filter((key) => sceneState?.[key]?.enabled && sceneState[key].value)
          .map((key) => [key, sceneState[key].value]),
      ),
      paletteId: color?.paletteId || null,
      lightingId: inspiration.meta.lightingId || null,
      generatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  });
}

export function buildWorkbenchPrompt(inspiration, colorReference = null, pokemonList = []) {
  if (!inspiration?.dimensions?.theme?.value) return '';
  const dims = inspiration.dimensions;
  const names = (pokemonList || []).map((pokemon) => pokemon.nameZh || pokemon.nameEn).join('、');
  const lines = [
    `宝可梦：${names || inspiration.meta.pokemonNames?.join('、') || '未记录'}`,
    `创作主题：${dims.theme.value}`,
    `故事情境：${dims.story.value}`,
    `动作互动：${dims.actionInteraction.value}`,
    `场景环境：${dims.environment.value}`,
    `构图：${dims.composition.value}`,
    `视角：${dims.viewpoint.value}`,
    `光影建议：${dims.lighting.value}`,
    `可选挑战：${dims.challenge.value}`,
  ];
  if (colorReference?.value) {
    const color = colorReference.value;
    lines.push(`配色参考：${color.name}（主色 ${color.main.hex} ${color.main.ratio}% / 辅助色 ${color.secondary.hex} ${color.secondary.ratio}% / 点缀色 ${color.accent.hex} ${color.accent.ratio}%）`);
  }
  return lines.filter((line) => line && !line.endsWith('：')).join('\n');
}

export function generateWorkbenchInspiration({
  previous,
  pokemonList,
  settings,
  sceneState,
  onlyKey = null,
  rng = Math.random,
}) {
  if (!pokemonList?.length) {
    return { inspiration: createEmptyWorkbenchInspiration(), error: null };
  }
  const base = previous ? normalizeWorkbenchInspiration(previous) : createEmptyWorkbenchInspiration();
  if (onlyKey && base.dimensions[onlyKey]?.locked) {
    return { inspiration: base, error: '该灵感维度已锁定，请先解除锁定。' };
  }
  const isFull = !onlyKey;
  const dimensions = Object.fromEntries(
    WORKBENCH_INSPIRATION_KEYS.map((key) => [key, { ...base.dimensions[key] }]),
  );
  const meta = { ...base.meta };
  const currentLocationId = sceneState?.location?.enabled ? sceneState.location.value : null;
  const context = {
    pokemonList,
    types: [...new Set(pokemonList.flatMap((pokemon) => pokemon.types || []))],
    groupCount: pokemonList.length,
    currentLocationId,
    sceneIds: [currentLocationId, sceneState?.weather?.value, sceneState?.time?.value].filter(Boolean),
    weatherId: sceneState?.weather?.enabled ? sceneState.weather.value : null,
    timeId: sceneState?.time?.enabled ? sceneState.time.value : null,
    environmentId: meta.environmentId,
    moods: [],
  };
  const names = formatPokemonNames(pokemonList);

  const shouldTheme = isFull ? !base.dimensions.theme.locked : onlyKey === 'theme';
  if (shouldTheme) {
    let theme;
    if (context.groupCount >= 2) {
      theme = choose(
        GROUP_THEMES,
        (item) => themeWeight(item, context, settings),
        meta.themeId,
        rng,
      ) || GROUP_THEMES[0];
      dimensions.theme = { ...dimensions.theme, value: getThemeText(theme, names) };
    } else {
      theme = choose(
        INSPIRATION_THEMES,
        (item) => themeWeight(item, context, settings),
        meta.themeId,
        rng,
      ) || INSPIRATION_THEMES[0];
      dimensions.theme = { ...dimensions.theme, value: theme.text };
    }
    meta.themeId = theme.id;
    meta.themeTypes = theme.types || [];
    meta.themeScenes = theme.scenes || [];
    meta.themeMoods = theme.moods || [];
  }
  const themeForContext = {
    ...(context.groupCount >= 2 ? GROUP_THEMES.find((item) => item.id === meta.themeId) : INSPIRATION_THEMES.find((item) => item.id === meta.themeId)),
    id: meta.themeId,
    types: meta.themeTypes || [],
    scenes: meta.themeScenes || [],
    moods: meta.themeMoods || [],
    text: dimensions.theme.value,
  };

  const shouldEnvironment = isFull ? !base.dimensions.environment.locked : onlyKey === 'environment';
  const shouldActionInteraction = isFull ? !base.dimensions.actionInteraction.locked : onlyKey === 'actionInteraction';
  const fixedActionForEnvironment = !shouldActionInteraction && meta.actionId
    ? [{ module: 'action', id: meta.actionId }]
    : [];
  let environmentOption = SCENE_MODULE_MAP.location.options.find((item) => item.id === meta.environmentId)
    || SCENE_MODULE_MAP.location.options.find((item) => item.id === currentLocationId)
    || SCENE_MODULE_MAP.location.options[0];

  if (shouldEnvironment) {
    const fixedTerms = [
      ...fixedActionForEnvironment,
      ...(context.weatherId ? [{ module: 'weather', id: context.weatherId }] : []),
      ...(context.timeId ? [{ module: 'time', id: context.timeId }] : []),
    ];
    const themeScenes = new Set(themeForContext.scenes || []);
    const themeLocations = themeScenes.size
      ? SCENE_MODULE_MAP.location.options.filter((option) => themeScenes.has(option.id))
      : SCENE_MODULE_MAP.location.options;
    const locationPool = themeLocations.length ? themeLocations : SCENE_MODULE_MAP.location.options;
    const candidates = locationPool
      .map((option) => ({
        id: option.id,
        option,
        evaluation: evaluateCandidateTerm('location', option.id, fixedTerms, context),
      }))
      .filter((item) => isStatusAllowed(item.evaluation.status, settings.compatibilityMode));
    const pool = candidates.length
      ? candidates
      : locationPool.map((option) => ({
        id: option.id,
        option,
        evaluation: evaluateCandidateTerm('location', option.id, [], context),
      }));
    const picked = choose(
      pool,
      (item) => locationWeight(item.option, themeForContext, context, settings)
        * getStatusWeight(item.evaluation.status, settings.compatibilityMode),
      meta.environmentId ? pool.find((item) => item.option.id === meta.environmentId)?.option.id : null,
      rng,
    );
    environmentOption = picked?.option || environmentOption;
    meta.environmentId = environmentOption.id;
    dimensions.environment = { ...dimensions.environment, value: getEnvironmentText(environmentOption) };
  } else if (!dimensions.environment.value) {
    dimensions.environment = { ...dimensions.environment, value: getEnvironmentText(environmentOption) };
    meta.environmentId = environmentOption.id;
  }

  const environmentId = meta.environmentId || environmentOption.id;
  context.environmentId = environmentId;

  if (shouldActionInteraction) {
    const fixedTerms = [
      { module: 'location', id: environmentId },
      ...(context.weatherId ? [{ module: 'weather', id: context.weatherId }] : []),
      ...(context.timeId ? [{ module: 'time', id: context.timeId }] : []),
    ];
    const actionCandidates = SCENE_MODULE_MAP.action.options
      .map((option) => ({
        id: option.id,
        option,
        evaluation: evaluateCandidateTerm('action', option.id, fixedTerms, context),
      }))
      .filter((item) => isStatusAllowed(item.evaluation.status, settings.compatibilityMode));
    const actionPool = actionCandidates.length
      ? actionCandidates
      : SCENE_MODULE_MAP.action.options.map((option) => ({
        id: option.id,
        option,
        evaluation: evaluateCandidateTerm('action', option.id, [], context),
      }));
    const actionPick = choose(
      actionPool,
      (item) => actionWeight(item.option, themeForContext, context, settings)
        * getStatusWeight(item.evaluation.status, settings.compatibilityMode),
      meta.actionId ? actionPool.find((item) => item.option.id === meta.actionId)?.option.id : null,
      rng,
    );
    const action = actionPick?.option || SCENE_MODULE_MAP.action.options[0];
    const interaction = chooseInteraction(context, settings, meta.interactionId, rng, action.id);
    const note = ACTION_NOTES[action.id] || action.description;
    const groupSuffix = getGroupActionSuffix(context.groupCount);
    const interactionText = interaction?.text || '保持自然距离，让视线在一个共同目标上相遇。';
    const groupText = groupSuffix ? `。${groupSuffix.replace(/。$/, '')}` : '';
    dimensions.actionInteraction = {
      ...dimensions.actionInteraction,
      value: `${action.label}：${note}${groupText}。互动：${interactionText}`,
    };
    meta.actionId = action.id;
    meta.interactionId = interaction?.id || null;
  }

  const shouldStory = isFull ? !base.dimensions.story.locked : onlyKey === 'story';
  if (shouldStory) {
    const environmentLabel = environmentLabelFromId(meta.environmentId || environmentId);
    const actionLabel = actionLabelFromId(meta.actionId);
    const story = chooseStory(context, settings, meta.storyId, rng, environmentLabel, actionLabel, names);
    dimensions.story = { ...dimensions.story, value: story.text };
    meta.storyId = story.id;
  }

  const shouldComposition = isFull ? !base.dimensions.composition.locked : onlyKey === 'composition';
  if (shouldComposition) {
    const composition = choose(
      INSPIRATION_COMPOSITIONS,
      (item) => compositionWeight(item, context, settings),
      meta.compositionId,
      rng,
    ) || INSPIRATION_COMPOSITIONS[0];
    dimensions.composition = { ...dimensions.composition, value: composition.text };
    meta.compositionId = composition.id;
  }

  const shouldViewpoint = isFull ? !base.dimensions.viewpoint.locked : onlyKey === 'viewpoint';
  if (shouldViewpoint) {
    const viewpointPool = context.groupCount >= 2
      ? INSPIRATION_VIEWPOINTS.filter((item) => item.id !== 'macro')
      : INSPIRATION_VIEWPOINTS;
    const viewpoint = choose(
      viewpointPool,
      (item) => viewpointWeight(item, context, settings),
      meta.viewpointId,
      rng,
    ) || viewpointPool[0];
    dimensions.viewpoint = { ...dimensions.viewpoint, value: viewpoint.text };
    meta.viewpointId = viewpoint.id;
  }

  const shouldLighting = isFull ? !base.dimensions.lighting.locked : onlyKey === 'lighting';
  if (shouldLighting) {
    const sceneLighting = INSPIRATION_LIGHTING.filter((item) => (
      !item.scenes?.length
      || item.scenes.includes(environmentId)
      || item.scenes.includes(context.currentLocationId)
    ));
    const environmentSafe = sceneLighting.length ? sceneLighting : INSPIRATION_LIGHTING;
    const timeSafe = context.timeId
      ? environmentSafe.filter((item) => !item.times?.length || item.times.includes(context.timeId))
      : environmentSafe;
    const weatherSafe = context.weatherId
      ? environmentSafe.filter((item) => !item.weathers?.length || item.weathers.includes(context.weatherId))
      : environmentSafe;
    const strictLighting = timeSafe.filter((item) => weatherSafe.includes(item));
    const lightingPool = strictLighting.length
      ? strictLighting
      : timeSafe.length ? timeSafe : weatherSafe.length ? weatherSafe : environmentSafe;
    const lighting = choose(
      lightingPool,
      (item) => lightingWeight(item, context, settings),
      meta.lightingId,
      rng,
    ) || lightingPool[0];
    dimensions.lighting = { ...dimensions.lighting, value: lighting.text };
    meta.lightingId = lighting.id;
  }

  const shouldChallenge = isFull ? !base.dimensions.challenge.locked : onlyKey === 'challenge';
  if (shouldChallenge) {
    const challenge = choose(
      INSPIRATION_CHALLENGES,
      (item) => getImagePreferenceTagWeight(CHALLENGE_TAGS[item.id] || [], settings)
        * getAtmosphereTagWeight(CHALLENGE_TAGS[item.id] || [], settings),
      meta.challengeId,
      rng,
    ) || INSPIRATION_CHALLENGES[0];
    dimensions.challenge = { ...dimensions.challenge, value: challenge.text };
    meta.challengeId = challenge.id;
  }

  const now = new Date().toISOString();
  const next = {
    ...base,
    id: base.createdAt ? base.id : makeId(),
    sourceSignature: getPokemonSourceSignature(pokemonList),
    dimensions,
    meta: {
      ...meta,
      pokemonIds: pokemonList.map((pokemon) => pokemon.id),
      pokemonNames: pokemonList
        .map((pokemon) => pokemon.nameZh || pokemon.nameEn)
        .filter(Boolean),
      groupCount: pokemonList.length,
      generatedAt: now,
    },
    createdAt: base.createdAt || now,
    updatedAt: now,
  };
  return { inspiration: next, error: null };
}
