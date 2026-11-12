const SHAPE_TRAITS = {
  ball: ['round', 'soft', 'cute', 'fluffy'],
  squiggle: ['soft', 'quirky', 'derpy'],
  fish: ['natural', 'sharp', 'elegant'],
  arms: ['energetic', 'quirky'],
  blob: ['round', 'soft', 'cute', 'derpy'],
  upright: ['cool', 'energetic'],
  legs: ['energetic', 'sharp'],
  quadruped: ['cute', 'natural', 'fluffy'],
  wings: ['majestic', 'sharp', 'cool', 'elegant'],
  tentacles: ['mysterious', 'soft', 'elegant'],
  heads: ['majestic', 'mysterious', 'fierce'],
  humanoid: ['energetic', 'sharp', 'elegant'],
  'bug-wings': ['cute', 'natural', 'dreamy', 'elegant'],
  armor: ['sharp', 'majestic', 'cool', 'fierce'],
  'arms-legs': ['energetic', 'sharp'],
};

const TYPE_TRAITS = {
  fire: ['energetic', 'warm', 'fierce'],
  water: ['natural', 'soft', 'elegant'],
  grass: ['natural', 'soft', 'cute'],
  electric: ['energetic', 'quirky', 'cute'],
  ice: ['cool', 'dreamy', 'elegant'],
  fighting: ['energetic', 'sharp', 'fierce'],
  poison: ['quirky', 'mysterious'],
  ground: ['natural', 'majestic'],
  flying: ['natural', 'cool', 'elegant'],
  psychic: ['mysterious', 'dreamy', 'elegant'],
  bug: ['natural', 'quirky'],
  rock: ['sharp', 'natural', 'fierce'],
  ghost: ['mysterious', 'dreamy'],
  dragon: ['majestic', 'sharp', 'fierce'],
  dark: ['cool', 'mysterious', 'sharp', 'fierce'],
  steel: ['sharp', 'cool', 'elegant'],
  fairy: ['cute', 'romantic', 'dreamy', 'elegant'],
  normal: ['cute', 'quirky', 'derpy'],
};

const COLOR_TRAITS = {
  green: ['natural'],
  pink: ['romantic', 'cute', 'dreamy', 'elegant'],
  purple: ['mysterious', 'dreamy', 'romantic', 'elegant'],
  blue: ['cool', 'natural', 'elegant'],
  red: ['energetic', 'passionate', 'fierce'],
  yellow: ['cute', 'quirky', 'energetic'],
  black: ['mysterious', 'cool', 'sharp', 'fierce'],
  brown: ['natural', 'warm', 'fluffy'],
  gray: ['cool', 'majestic', 'fierce'],
  white: ['majestic', 'dreamy', 'soft', 'elegant'],
};

export const POKEMON_TRAIT_LABELS = {
  round: '圆润',
  soft: '柔软',
  majestic: '威严',
  sharp: '锋利',
  cute: '可爱',
  mysterious: '神秘',
  natural: '自然',
  energetic: '活力',
  quirky: '搞怪',
  romantic: '浪漫',
  cool: '冷峻',
  warm: '温暖',
  dreamy: '梦幻',
  passionate: '热烈',
  elegant: '优雅',
  fluffy: '毛茸茸',
  small: '小巧',
  giant: '巨大',
  fierce: '凶猛',
  derpy: '呆萌',
};

/**
 * Appearance features are derived from real PokeAPI fields (shape, color,
 * height, weight, legendary/mythical/baby/stage). They are not official
 * appearance categories, so the UI labels them as sketch-oriented traits.
 */
export function getPokemonTraits(pokemon) {
  const traits = new Set();
  const add = (values) => {
    for (const value of values || []) if (value) traits.add(value);
  };

  add(SHAPE_TRAITS[pokemon?.shape]);
  for (const type of pokemon?.types || []) add(TYPE_TRAITS[type]);
  add(COLOR_TRAITS[pokemon?.color]);

  const height = Number(pokemon?.height) || 0;
  const weight = Number(pokemon?.weight) || 0;
  if (height > 0 && height <= 4) {
    traits.add('small');
    traits.add('cute');
    traits.add('round');
  }
  if (height >= 20 || weight >= 2200) {
    traits.add('giant');
    traits.add('majestic');
    traits.add('sharp');
    traits.add('fierce');
  }
  if (
    ['ball', 'blob', 'squiggle', 'quadruped'].includes(pokemon?.shape)
    && !['rock', 'steel', 'ground', 'dragon', 'poison', 'bug'].some((type) => pokemon?.types?.includes(type))
  ) {
    traits.add('fluffy');
  }
  if (
    pokemon?.types?.some((type) => ['normal', 'water', 'psychic'].includes(type))
    && (height > 0 && height <= 5)
  ) {
    traits.add('derpy');
  }
  if (
    weight >= 900
    && height >= 8
    && ['ball', 'blob', 'squiggle', 'humanoid', 'quadruped'].includes(pokemon?.shape)
  ) {
    traits.add('soft');
  }
  if (pokemon?.isBaby || pokemon?.stage === 0) {
    traits.add('cute');
    traits.add('soft');
    traits.add('small');
  }
  if (pokemon?.isLegendary) {
    traits.add('majestic');
    traits.add('mysterious');
  }
  if (pokemon?.isMythical) {
    traits.add('mysterious');
    traits.add('dreamy');
  }

  return [...traits];
}

export function getPokemonTraitLabels(pokemon) {
  return getPokemonTraits(pokemon).map((trait) => POKEMON_TRAIT_LABELS[trait] || trait);
}
