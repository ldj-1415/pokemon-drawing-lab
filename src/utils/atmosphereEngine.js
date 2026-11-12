import {
  ATMOSPHERE_TRAIT_LABELS,
  getActiveAtmospheres,
  getAtmosphereStrength,
} from '../data/atmospheres.js';
import { getPokemonTraits } from './pokemonTraits.js';
import { getTermProfile } from './compatibilityEngine.js';

const TERM_TAG_FIELD = {
  location: 'sceneTags',
  weather: 'weatherTags',
  time: 'timeTags',
  action: 'actionTags',
  interaction: 'interactionTags',
  event: 'eventTags',
  composition: 'compositionTags',
  visual: 'visualTags',
};

/**
 * Calculates the soft Pokémon bias for every active atmosphere. Both types and
 * derived appearance traits contribute. The value is always >= 1, so an
 * unmatched Pokémon can still appear.
 */
export function getPokemonAtmosphereBreakdown(pokemon, settings) {
  const active = getActiveAtmospheres(settings);
  const strength = getAtmosphereStrength(settings);
  const traits = getPokemonTraits(pokemon);
  const matchedTypes = new Map();
  const matchedTraits = new Map();
  let typeScore = 0;
  let traitScore = 0;

  for (const atmosphereItem of active) {
    for (const type of pokemon?.types || []) {
      const value = Number(atmosphereItem.typeWeights?.[type] || 0);
      if (value > 0) {
        typeScore += value;
        matchedTypes.set(type, (matchedTypes.get(type) || 0) + value);
      }
    }
    for (const trait of traits) {
      const value = Number(atmosphereItem.traitWeights?.[trait] || 0);
      if (value > 0) {
        traitScore += value;
        matchedTraits.set(trait, (matchedTraits.get(trait) || 0) + value);
      }
    }
  }

  const weightedScore = typeScore + traitScore * 0.82;
  const weight = Math.max(1, 1 + weightedScore * strength.factor);
  return {
    weight,
    typeScore,
    traitScore,
    matchedTypes: [...matchedTypes.keys()],
    matchedTraits: [...matchedTraits.keys()],
    traitLabels: [...matchedTraits.keys()].map((trait) => ATMOSPHERE_TRAIT_LABELS[trait] || trait),
    active: active.map((item) => item.label),
    strength: strength.id,
  };
}

export function getPokemonAtmosphereWeight(pokemon, settings) {
  return getPokemonAtmosphereBreakdown(pokemon, settings).weight;
}

/**
 * Soft affinity between an atmosphere and a scene term. Atmosphere is never a
 * hard constraint: this number only changes the sampling probability.
 */
export function getAtmosphereTermBreakdown(moduleKey, optionId, settings) {
  const active = getActiveAtmospheres(settings);
  if (!active.length) return { weight: 1, matches: [], active: [], strength: 'standard' };
  const strength = getAtmosphereStrength(settings);
  const field = TERM_TAG_FIELD[moduleKey];
  const profile = getTermProfile(moduleKey, optionId);
  const termTags = new Set(profile?.all || []);
  const matches = new Set();
  for (const atmosphereItem of active) {
    for (const tag of atmosphereItem[field] || []) {
      if (termTags.has(tag)) matches.add(tag);
    }
  }
  const weight = 1 + matches.size * 0.38 * strength.factor;
  return {
    weight,
    matches: [...matches],
    active: active.map((item) => item.label),
    strength: strength.id,
  };
}

export function getAtmosphereTermWeight(moduleKey, optionId, settings) {
  return getAtmosphereTermBreakdown(moduleKey, optionId, settings).weight;
}

export function getAtmosphereTraitSummary(labels) {
  return labels.map((trait) => ATMOSPHERE_TRAIT_LABELS[trait] || trait);
}
