import { SCENE_MODULE_MAP, SCENE_MODULES } from '../data/scenes.js';
import { COMPATIBILITY_STATUS } from '../data/compatibility.js';
import { getSceneAffinity } from './sceneRandom.js';
import { weightedPick } from './random.js';
import { getAtmosphereTermWeight } from './atmosphereEngine.js';
import {
  evaluateCandidateTerm,
  evaluateCompositionCompatibility,
  getStatusWeight,
  isStatusAllowed,
} from './compatibilityEngine.js';

export const SCENE_GENERATION_ORDER = [
  'location',
  'weather',
  'time',
  'action',
  'interaction',
  'event',
  'composition',
  'visual',
];

const MAX_PLACEMENT_ATTEMPTS = 3;
const STATUS_WEIGHT = {
  [COMPATIBILITY_STATUS.COMPATIBLE]: 1,
  [COMPATIBILITY_STATUS.CONDITIONAL]: 0.85,
  [COMPATIBILITY_STATUS.INCOMPATIBLE]: 0.05,
};

function sceneWeight(moduleKey, option, pokemonList, settings, status, useAtmosphere = true) {
  const affinity = getSceneAffinity(moduleKey, option, pokemonList);
  const atmosphere = useAtmosphere
    ? getAtmosphereTermWeight(moduleKey, option.id, settings)
    : 1;
  const statusWeight = getStatusWeight(status, settings.compatibilityMode);
  return Math.max(0, affinity * atmosphere * statusWeight);
}

function buildCandidateList({
  moduleKey,
  options,
  fixedTerms,
  context,
  pokemonList,
  settings,
  excludeId,
  useAtmosphere,
}) {
  const candidates = [];
  for (const option of options) {
    if (excludeId && option.id === excludeId) continue;
    const evaluation = evaluateCandidateTerm(moduleKey, option.id, fixedTerms, context);
    const allowed = isStatusAllowed(evaluation.status, settings.compatibilityMode);
    const weight = sceneWeight(moduleKey, option, pokemonList, settings, evaluation.status, useAtmosphere);
    candidates.push({
      option,
      evaluation,
      allowed,
      weight: allowed ? Math.max(weight, 0.0001) : 0,
    });
  }
  return candidates;
}

function chooseStageCandidate({
  moduleKey,
  options,
  fixedTerms,
  context,
  pokemonList,
  settings,
  excludeId,
  rng,
}) {
  let candidates = [];
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt += 1) {
    candidates = buildCandidateList({
      moduleKey,
      options,
      fixedTerms,
      context,
      pokemonList,
      settings,
      excludeId,
      useAtmosphere: attempt < MAX_PLACEMENT_ATTEMPTS - 1,
    });
    const allowed = candidates.filter((item) => item.allowed && item.weight > 0);
    if (allowed.length) {
      // Passive retries are bounded; if a pool is still empty the caller gets a
      // structured fallback rather than an infinite loop.
      return {
        option: weightedPick(allowed, (item) => item.weight, rng)?.option || allowed[0].option,
        warning: null,
      };
    }
    if (settings.compatibilityMode === 'unlimited') {
      return { option: weightedPick(candidates, (item) => item.weight || 0.0001, rng)?.option || options[0], warning: null };
    }
  }

  const withStatus = candidates.length
    ? candidates
    : options.map((option) => ({
      option,
      evaluation: evaluateCandidateTerm(moduleKey, option.id, fixedTerms, context),
    }));
  const softest = withStatus
    .slice()
    .sort((a, b) => (STATUS_WEIGHT[b.evaluation?.status] || 0) - (STATUS_WEIGHT[a.evaluation?.status] || 0));
  const fallback = softest[0]?.option || options[0];
  return {
    option: fallback,
    warning: `「${SCENE_MODULE_MAP[moduleKey]?.title || moduleKey}」找不到完全兼容的候选，已保留最接近的选项，请人工确认。`,
  };
}

/**
 * Generates scene modules in a fixed staged order:
 * location -> weather -> time -> action -> interaction -> event -> composition -> visual.
 * Locked modules are inserted as fixed terms before the first stage, so a new
 * candidate is always checked against them. Disabled modules are untouched.
 */
export function generateSceneState({
  sceneState,
  pokemonList,
  settings,
  rng = Math.random,
}) {
  const next = Object.fromEntries(
    SCENE_MODULES.map((module) => [module.key, { ...sceneState[module.key] }]),
  );
  const generated = new Set();
  const warnings = [];

  const lockedTerms = SCENE_MODULES
    .filter((module) => next[module.key]?.enabled && next[module.key]?.locked)
    .map((module) => ({ module: module.key, id: next[module.key].value, locked: true }));

  const context = {
    pokemonList,
    partySize: pokemonList.length,
  };

  for (const moduleKey of SCENE_GENERATION_ORDER) {
    const module = SCENE_MODULE_MAP[moduleKey];
    const current = next[moduleKey];
    if (!module || !current) continue;
    if (!current.enabled || current.locked) {
      continue;
    }

    const fixedTerms = [
      ...lockedTerms,
      ...SCENE_MODULES
        .filter((item) => generated.has(item.key))
        .map((item) => ({ module: item.key, id: next[item.key].value, locked: Boolean(next[item.key].locked) })),
    ].filter((term) => term.module !== moduleKey);

    const result = chooseStageCandidate({
      moduleKey,
      options: module.options,
      fixedTerms,
      context,
      pokemonList,
      settings,
      excludeId: current.value,
      rng,
    });
    if (!result.option) continue;
    next[moduleKey] = { ...current, value: result.option.id };
    generated.add(moduleKey);
    if (result.warning) warnings.push(result.warning);
  }

  const issues = settings.compatibilityMode === 'unlimited'
    ? []
    : evaluateCompositionCompatibility(next, pokemonList, settings);
  return { scenes: next, warnings, issues };
}

/**
 * Re-rolls exactly one scene module. Every other enabled module is treated as
 * fixed, including unlocked ones, so the result cannot silently rewrite the
 * rest of the picture.
 */
export function rerollSceneWithCompatibility({
  sceneState,
  moduleKey,
  pokemonList,
  settings,
  rng = Math.random,
}) {
  const module = SCENE_MODULE_MAP[moduleKey];
  const current = sceneState[moduleKey];
  if (!module || !current) return { ok: false, error: '没有找到要重抽的场景模块。' };
  if (!current.enabled) return { ok: false, error: `「${module.title}」已关闭，开启后才能重抽。` };
  if (current.locked) return { ok: false, error: `「${module.title}」已锁定，请先解除锁定。` };

  const fixedTerms = SCENE_MODULES
    .filter((item) => item.key !== moduleKey && sceneState[item.key]?.enabled)
    .map((item) => ({ module: item.key, id: sceneState[item.key].value, locked: Boolean(sceneState[item.key].locked) }));

  const fixedState = Object.fromEntries(
    SCENE_MODULES.map((item) => [
      item.key,
      item.key === moduleKey ? { ...sceneState[item.key], enabled: false } : sceneState[item.key],
    ]),
  );
  const fixedIssues = settings.compatibilityMode === 'unlimited'
    ? []
    : evaluateCompositionCompatibility(fixedState, pokemonList, settings);
  const lockedIssues = fixedIssues.filter((issue) => issue.locked);
  if (lockedIssues.length) {
    return {
      ok: false,
      error: `当前锁定词条之间已有冲突：${lockedIssues[0].labels.join(' / ')}。请先解除其中一项锁定，软件不会擅自修改。`,
      issues: lockedIssues,
    };
  }

  const context = { pokemonList, partySize: pokemonList.length };
  let candidates = buildCandidateList({
    moduleKey,
    options: module.options,
    fixedTerms,
    context,
    pokemonList,
    settings,
    excludeId: current.value,
    useAtmosphere: true,
  }).filter((item) => item.allowed && item.weight > 0);

  if (!candidates.length && settings.compatibilityMode !== 'unlimited') {
    candidates = buildCandidateList({
      moduleKey,
      options: module.options,
      fixedTerms,
      context,
      pokemonList,
      settings,
      excludeId: null,
      useAtmosphere: false,
    }).filter((item) => item.allowed && item.weight > 0);
  }

  if (!candidates.length && settings.compatibilityMode === 'unlimited') {
    candidates = module.options
      .filter((option) => option.id !== current.value)
      .map((option) => ({
        option,
        weight: sceneWeight(moduleKey, option, pokemonList, settings, COMPATIBILITY_STATUS.COMPATIBLE, true),
      }));
  }

  if (!candidates.length) {
    return {
      ok: false,
      error: `没有找到与当前画面兼容的新「${module.title}」。请调整锁定内容或切换到创意 / 无限制模式。`,
    };
  }

  const picked = weightedPick(candidates, (item) => item.weight, rng)?.option || candidates[0].option;
  if (picked.id === current.value) {
    return { ok: false, error: `当前条件下没有其他可用的「${module.title}」。` };
  }

  const scenes = {
    ...sceneState,
    [moduleKey]: { ...current, value: picked.id },
  };
  const issues = settings.compatibilityMode === 'unlimited'
    ? []
    : evaluateCompositionCompatibility(scenes, pokemonList, settings);
  return { ok: true, scenes, issues, warning: null };
}

export function getCompositionCompatibilityIssues(sceneState, pokemonList, settings) {
  if (settings?.compatibilityMode === 'unlimited') return [];
  return evaluateCompositionCompatibility(sceneState, pokemonList, settings);
}
