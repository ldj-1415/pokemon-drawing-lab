import { SCENE_MODULE_MAP, SCENE_MODULES } from '../data/scenes.js';
import { weightedPick } from './random.js';

function getTypeSet(pokemonList) {
  return new Set((pokemonList || []).flatMap((pokemon) => pokemon.types || []));
}

export function getSceneAffinity(moduleKey, option, pokemonList) {
  if (!option || !['location', 'action'].includes(moduleKey)) return 1;
  if (!option.types?.length) return 1;
  const activeTypes = getTypeSet(pokemonList);
  const matches = option.types.filter((type) => activeTypes.has(type)).length;
  return matches > 0 ? 1 + matches * 2.25 : 1;
}

export function pickSceneValue(moduleKey, pokemonList, previousValue, rng = Math.random) {
  const module = SCENE_MODULE_MAP[moduleKey];
  if (!module) return null;
  const pool = module.options.length > 1
    ? module.options.filter((optionItem) => optionItem.id !== previousValue)
    : module.options;
  const picked = weightedPick(
    pool.length ? pool : module.options,
    (optionItem) => getSceneAffinity(moduleKey, optionItem, pokemonList),
    rng,
  );
  return picked?.id || module.options[0]?.id || null;
}

/**
 * Randomizes only modules that are enabled, unlocked and included in `keys`.
 * Locked and disabled scene values are never changed.
 */
export function randomizeScenes(sceneState, pokemonList, keys = null, rng = Math.random) {
  const requested = keys ? new Set(keys) : null;
  const next = { ...sceneState };
  for (const module of SCENE_MODULES) {
    const current = sceneState[module.key];
    if (!current) continue;
    if (requested && !requested.has(module.key)) continue;
    if (!current.enabled || current.locked) {
      next[module.key] = { ...current };
      continue;
    }
    next[module.key] = {
      ...current,
      value: pickSceneValue(module.key, pokemonList, current.value, rng),
    };
  }
  return next;
}

export function rerollSingleScene(sceneState, moduleKey, pokemonList, rng = Math.random) {
  const current = sceneState[moduleKey];
  if (!current) return sceneState;
  if (!current.enabled || current.locked) return sceneState;
  return {
    ...sceneState,
    [moduleKey]: {
      ...current,
      value: pickSceneValue(moduleKey, pokemonList, current.value, rng),
    },
  };
}

export function getSceneSummary(scenes) {
  return SCENE_MODULES
    .filter((module) => scenes?.[module.key]?.enabled)
    .map((module) => {
      const option = module.options.find((item) => item.id === scenes[module.key].value);
      return {
        key: module.key,
        title: module.title,
        icon: module.icon,
        color: module.color,
        value: option?.label || '—',
        locked: Boolean(scenes[module.key].locked),
      };
    });
}

export function getSceneAffinityLabels(moduleKey, option, pokemonList) {
  if (!option?.types?.length || !['location', 'action'].includes(moduleKey)) return [];
  const activeTypes = getTypeSet(pokemonList);
  return option.types.filter((type) => activeTypes.has(type));
}
