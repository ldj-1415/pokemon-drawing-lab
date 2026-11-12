import {
  ACTION_REQUIREMENTS,
  ACTION_REQUIREMENT_RULES,
  COMPATIBILITY_MODE_MAP,
  COMPATIBILITY_MODE_OPTIONS,
  COMPATIBILITY_STATUS,
  INTERACTION_GROUP_RULE,
  POKEMON_ACTION_RULES,
  TAG_RULES,
  TERM_PROFILES,
  WEATHER_TYPE_RULES,
} from '../data/compatibility.js';
import { SCENE_MODULE_MAP } from '../data/scenes.js';

const SEVERITY = {
  [COMPATIBILITY_STATUS.COMPATIBLE]: 0,
  [COMPATIBILITY_STATUS.CONDITIONAL]: 1,
  [COMPATIBILITY_STATUS.INCOMPATIBLE]: 2,
};

const EMPTY_PROFILE = {
  semantic: [],
  environment: [],
  temperature: [],
  climate: [],
  ecology: [],
  terrain: [],
  time: [],
  mood: [],
  visual: [],
  supports: [],
  social: [],
  requirements: [],
};

export function getTermProfile(moduleKey, optionId) {
  const profile = TERM_PROFILES[moduleKey]?.[optionId];
  if (!profile) return { ...EMPTY_PROFILE, semantic: optionId ? [String(optionId)] : [] };
  const all = new Set(profile.semantic || []);
  for (const field of ['environment', 'temperature', 'climate', 'ecology', 'terrain', 'time', 'mood', 'visual', 'supports', 'social', 'requirements']) {
    for (const value of profile[field] || []) all.add(value);
  }
  return { ...profile, all: [...all] };
}

export function getTermLabel(moduleKey, optionId) {
  return SCENE_MODULE_MAP[moduleKey]?.options.find((item) => item.id === optionId)?.label || optionId || '—';
}

export function getCompatibilityMode(id) {
  return COMPATIBILITY_MODE_MAP[id] || COMPATIBILITY_MODE_MAP.reasonable;
}

export function isStatusAllowed(status, mode = 'reasonable') {
  if (mode === 'unlimited') return true;
  return status !== COMPATIBILITY_STATUS.INCOMPATIBLE;
}

export function getStatusWeight(status, mode = 'reasonable') {
  if (mode === 'unlimited') return 1;
  if (status === COMPATIBILITY_STATUS.INCOMPATIBLE) return 0;
  if (status === COMPATIBILITY_STATUS.CONDITIONAL) {
    return getCompatibilityMode(mode).conditionalBoost || 1;
  }
  return 1;
}

function hasAny(profile, field, values) {
  if (!profile) return false;
  const source = profile[field] || [];
  return values.some((value) => source.includes(value));
}

function worse(a, b) {
  return (SEVERITY[b] || 0) > (SEVERITY[a] || 0) ? b : a;
}

function result(status, reason, source = '') {
  return { status, reason: reason || '', source };
}

function mergeResult(current, next) {
  if (!next) return current;
  if (!current) return next;
  const status = worse(current.status, next.status);
  if (status === current.status) return current;
  return next;
}

function applyTagRules(profileByModule) {
  let current = result(COMPATIBILITY_STATUS.COMPATIBLE);
  for (const rule of TAG_RULES) {
    const [aKey, bKey] = rule.modules;
    const a = profileByModule[aKey];
    const b = profileByModule[bKey];
    if (!a || !b) continue;
    if (!rule.when(a, b)) continue;
    const status = typeof rule.status === 'function' ? rule.status(a, b) : rule.status;
    current = mergeResult(current, result(status, rule.reason, rule.id));
  }
  return current;
}

function evaluateActionLocation(actionId, locationId) {
  const action = getTermProfile('action', actionId);
  const location = getTermProfile('location', locationId);
  if (!action || !location) return null;
  let current = result(COMPATIBILITY_STATUS.COMPATIBLE);
  for (const requirement of ACTION_REQUIREMENTS[actionId] || []) {
    if ((location.supports || []).includes(requirement)) continue;
    const rule = ACTION_REQUIREMENT_RULES[requirement];
    if (!rule) continue;
    const incompatible = (rule.incompatibleEnvironments && hasAny(location, 'environment', rule.incompatibleEnvironments))
      || (rule.incompatibleTerrains && hasAny(location, 'terrain', rule.incompatibleTerrains));
    current = mergeResult(current, result(
      incompatible ? COMPATIBILITY_STATUS.INCOMPATIBLE : COMPATIBILITY_STATUS.CONDITIONAL,
      rule.reason,
      `action:${requirement}`,
    ));
  }
  return current.status === COMPATIBILITY_STATUS.COMPATIBLE ? null : current;
}

function evaluateActionWeather(actionId, weatherId) {
  if (actionId !== 'sunbathing') return null;
  const profile = getTermProfile('weather', weatherId);
  if (hasAny(profile, 'requirements', ['rain', 'snow', 'storm', 'fog'])) {
    return result(COMPATIBILITY_STATUS.CONDITIONAL, '晒太阳需要解释遮蔽物、间歇晴天或室内暖光', 'action:sunbathing');
  }
  return null;
}

function evaluateActionTime(actionId, timeId) {
  if (actionId !== 'sunbathing') return null;
  if (['night', 'midnight'].includes(timeId)) {
    return result(COMPATIBILITY_STATUS.CONDITIONAL, '夜间晒太阳需要改为月光、暖灯或回忆画面', 'action:sunbathing');
  }
  return null;
}

function evaluatePokemonAction(actionId, pokemon) {
  let current = result(COMPATIBILITY_STATUS.COMPATIBLE);
  for (const rule of POKEMON_ACTION_RULES) {
    if (rule.action !== actionId) continue;
    if (!rule.when(pokemon)) continue;
    current = mergeResult(current, result(rule.status, rule.reason, 'pokemon-action'));
  }
  return current.status === COMPATIBILITY_STATUS.COMPATIBLE ? null : current;
}

function evaluateWeatherPokemon(weatherId, pokemon) {
  let current = result(COMPATIBILITY_STATUS.COMPATIBLE);
  const types = new Set(pokemon?.types || []);
  for (const rule of WEATHER_TYPE_RULES) {
    if (!rule.weather.includes(weatherId)) continue;
    if (!rule.types.some((type) => types.has(type))) continue;
    current = mergeResult(current, result(rule.status, rule.reason, 'weather-pokemon'));
  }
  return current.status === COMPATIBILITY_STATUS.COMPATIBLE ? null : current;
}

/**
 * Evaluates one scene-term pair. This is intentionally tag-driven: adding a
 * new option only requires a profile, and optional pair rules when the tags
 * alone cannot describe the exception.
 */
export function evaluateTermPair(moduleA, optionA, moduleB, optionB, context = {}) {
  if (!moduleA || !moduleB || moduleA === moduleB) {
    return result(COMPATIBILITY_STATUS.COMPATIBLE);
  }
  const profileByModule = {
    [moduleA]: getTermProfile(moduleA, optionA),
    [moduleB]: getTermProfile(moduleB, optionB),
  };
  let current = applyTagRules(profileByModule);

  if ((moduleA === 'action' && moduleB === 'location') || (moduleA === 'location' && moduleB === 'action')) {
    const actionId = moduleA === 'action' ? optionA : optionB;
    const locationId = moduleA === 'location' ? optionA : optionB;
    current = mergeResult(current, evaluateActionLocation(actionId, locationId));
  }
  if ((moduleA === 'action' && moduleB === 'weather') || (moduleA === 'weather' && moduleB === 'action')) {
    const actionId = moduleA === 'action' ? optionA : optionB;
    const weatherId = moduleA === 'weather' ? optionA : optionB;
    current = mergeResult(current, evaluateActionWeather(actionId, weatherId));
  }
  if ((moduleA === 'action' && moduleB === 'time') || (moduleA === 'time' && moduleB === 'action')) {
    const actionId = moduleA === 'action' ? optionA : optionB;
    const timeId = moduleA === 'time' ? optionA : optionB;
    current = mergeResult(current, evaluateActionTime(actionId, timeId));
  }
  if (moduleA === 'weather' || moduleB === 'weather') {
    const weatherId = moduleA === 'weather' ? optionA : optionB;
    for (const pokemon of context.pokemonList || []) {
      current = mergeResult(current, evaluateWeatherPokemon(weatherId, pokemon));
    }
  }
  if ((moduleA === 'interaction' || moduleB === 'interaction') && context.partySize !== undefined) {
    if (context.partySize < 2) {
      current = mergeResult(current, result(COMPATIBILITY_STATUS.CONDITIONAL, INTERACTION_GROUP_RULE.reason, 'interaction-group'));
    }
  }
  return current;
}

/**
 * Checks one candidate term against all already-fixed terms and the current
 * Pokémon party. No loops are performed here; callers use bounded candidate
 * lists.
 */
export function evaluateCandidateTerm(moduleKey, optionId, fixedTerms = [], context = {}) {
  let current = result(COMPATIBILITY_STATUS.COMPATIBLE);
  for (const term of fixedTerms) {
    current = mergeResult(
      current,
      evaluateTermPair(moduleKey, optionId, term.module, term.id, context),
    );
  }
  if (moduleKey === 'weather') {
    for (const pokemon of context.pokemonList || []) {
      current = mergeResult(current, evaluateWeatherPokemon(optionId, pokemon));
    }
  }
  if (moduleKey === 'action') {
    for (const pokemon of context.pokemonList || []) {
      current = mergeResult(current, evaluatePokemonAction(optionId, pokemon));
    }
  }
  if (moduleKey === 'interaction' && (context.partySize ?? 0) < 2) {
    current = mergeResult(current, result(COMPATIBILITY_STATUS.CONDITIONAL, INTERACTION_GROUP_RULE.reason, 'interaction-group'));
  }
  return current;
}

export function getSceneTerms(sceneState) {
  return Object.entries(sceneState || {})
    .filter(([, scene]) => scene?.enabled && scene?.value)
    .map(([module, scene]) => ({ module, id: scene.value, locked: Boolean(scene.locked) }));
}

/**
 * Full validation of the current composition. Incompatible pairs are reported
 * with structured reasons; the caller decides whether the active mode should
 * display them or suppress filtering.
 */
export function evaluateCompositionCompatibility(sceneState, pokemonList, settings = {}) {
  const terms = getSceneTerms(sceneState);
  if (!terms.length && !(pokemonList || []).length) return [];
  const issues = [];
  const context = {
    pokemonList: pokemonList || [],
    partySize: (pokemonList || []).length,
  };

  for (let i = 0; i < terms.length; i += 1) {
    for (let j = i + 1; j < terms.length; j += 1) {
      const a = terms[i];
      const b = terms[j];
      const evaluation = evaluateTermPair(a.module, a.id, b.module, b.id, context);
      if (evaluation.status === COMPATIBILITY_STATUS.INCOMPATIBLE) {
        issues.push({
          id: `${a.module}:${a.id}|${b.module}:${b.id}`,
          status: evaluation.status,
          reason: evaluation.reason,
          modules: [a.module, b.module],
          labels: [
            `${SCENE_MODULE_MAP[a.module]?.title || a.module}：${getTermLabel(a.module, a.id)}`,
            `${SCENE_MODULE_MAP[b.module]?.title || b.module}：${getTermLabel(b.module, b.id)}`,
          ],
          locked: a.locked || b.locked,
          source: evaluation.source,
        });
      }
    }
  }

  const weather = terms.find((term) => term.module === 'weather');
  if (weather) {
    for (const pokemon of pokemonList || []) {
      const evaluation = evaluateWeatherPokemon(weather.id, pokemon);
      if (evaluation?.status === COMPATIBILITY_STATUS.INCOMPATIBLE) {
        issues.push({
          id: `weather:${weather.id}|pokemon:${pokemon.id}`,
          status: evaluation.status,
          reason: evaluation.reason,
          modules: ['weather', 'pokemon'],
          labels: [
            `天气：${getTermLabel('weather', weather.id)}`,
            `宝可梦：${pokemon.nameZh || pokemon.nameEn || `#${pokemon.id}`}`,
          ],
          locked: weather.locked,
          source: evaluation.source,
        });
      }
    }
  }

  return issues;
}

export function getCompatibilityModeOptions() {
  return COMPATIBILITY_MODE_OPTIONS;
}
