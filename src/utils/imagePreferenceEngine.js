import {
  getActiveImagePreferences,
  getImagePreferenceStrength,
  getImagePreferenceSummary as buildImagePreferenceSummary,
} from '../data/imagePreferences.js';
import { getPokemonTraits } from './pokemonTraits.js';
import { getTermProfile } from './compatibilityEngine.js';

const TERM_TAG_FIELD = {
  theme: 'themeTags',
  location: 'themeTags',
  weather: 'themeTags',
  time: 'themeTags',
  action: 'actionTags',
  interaction: 'interactionTags',
  event: 'themeTags',
  composition: 'compositionTags',
  visual: 'visualTags',
  challenge: 'challengeTags',
};

export function getImagePreferenceBreakdown(pokemon, settings) {
  const active = getActiveImagePreferences(settings);
  const strength = getImagePreferenceStrength(settings);
  const traits = getPokemonTraits(pokemon);
  const matchedTypes = new Map();
  const matchedTraits = new Map();
  let typeScore = 0;
  let traitScore = 0;

  for (const preference of active) {
    for (const type of pokemon?.types || []) {
      const value = Number(preference.typeWeights?.[type] || 0);
      if (value > 0) {
        typeScore += value;
        matchedTypes.set(type, (matchedTypes.get(type) || 0) + value);
      }
    }
    for (const trait of traits) {
      const value = Number(preference.traitWeights?.[trait] || 0);
      if (value > 0) {
        traitScore += value;
        matchedTraits.set(trait, (matchedTraits.get(trait) || 0) + value);
      }
    }
  }

  const weightedScore = typeScore + traitScore * 0.82;
  return {
    weight: Math.max(1, 1 + weightedScore * strength.factor),
    typeScore,
    traitScore,
    matchedTypes: [...matchedTypes.keys()],
    matchedTraits: [...matchedTraits.keys()],
    active: active.map((item) => item.label),
    strength: strength.id,
  };
}

export function getImagePreferenceWeight(pokemon, settings) {
  return getImagePreferenceBreakdown(pokemon, settings).weight;
}

export function getImagePreferenceTagWeight(tags, settings) {
  const active = getActiveImagePreferences(settings);
  if (!active.length || !tags?.length) return 1;
  const strength = getImagePreferenceStrength(settings);
  const tagSet = new Set(tags);
  const matches = new Set();
  for (const preference of active) {
    for (const field of ['themeTags', 'actionTags', 'interactionTags', 'compositionTags', 'visualTags', 'challengeTags']) {
      for (const tag of preference[field] || []) {
        if (tagSet.has(tag)) matches.add(tag);
      }
    }
  }
  return 1 + matches.size * 0.34 * strength.factor;
}

export function getImagePreferenceTermWeight(moduleKey, optionId, settings) {
  const active = getActiveImagePreferences(settings);
  if (!active.length) return 1;
  const field = TERM_TAG_FIELD[moduleKey];
  if (!field) return 1;
  const profile = getTermProfile(moduleKey, optionId);
  const terms = new Set(profile?.all || []);
  const strength = getImagePreferenceStrength(settings);
  const matches = new Set();
  for (const preference of active) {
    for (const tag of preference[field] || []) {
      if (terms.has(tag)) matches.add(tag);
    }
  }
  return 1 + matches.size * 0.34 * strength.factor;
}

export function getImagePreferenceThemeWeight(theme, settings) {
  const active = getActiveImagePreferences(settings);
  if (!active.length) return 1;
  const strength = getImagePreferenceStrength(settings);
  let typeScore = 0;
  let tagScore = 0;
  for (const preference of active) {
    for (const type of theme?.types || []) {
      typeScore += Number(preference.typeWeights?.[type] || 0);
    }
    const themeTags = new Set([...(theme?.moods || []), ...(theme?.scenes || []), ...(theme?.types || [])]);
    for (const tag of preference.themeTags || []) {
      if (themeTags.has(tag)) tagScore += 1;
    }
  }
  return 1 + (typeScore * 0.55 + tagScore * 0.32) * strength.factor;
}

export function getImagePreferenceSummary(settings) {
  return buildImagePreferenceSummary(settings);
}
