import { DEX_MAX, DEX_MIN, getGenerationByDexNumber, getGenerationIds, GENERATIONS } from '../data/generations.js';
import { TYPE_MAP } from '../data/types.js';

export const emptyPoolError = '当前筛选条件下没有可抽取的宝可梦，请放宽属性、世代或编号范围。';

export function getSelectedIdSet(settings) {
  return new Set(getGenerationIds(settings));
}

export function matchesHardTypeFilter(pokemon, settings) {
  if (settings.typeMode !== 'hard' || !settings.preferredTypes.length) return true;
  const preferred = new Set(settings.preferredTypes);
  return pokemon.types.some((type) => preferred.has(type));
}

export function matchesLegendaryFilters(pokemon, settings) {
  if (!settings.includeLegendary && pokemon.isLegendary) return false;
  if (!settings.includeMythical && pokemon.isMythical) return false;
  return true;
}

export function matchesEvolutionFilter(pokemon, settings) {
  if (!settings.evolutionStages.length) return true;
  return settings.evolutionStages.some((stage) => {
    if (stage >= 3) return pokemon.stage >= 3;
    return pokemon.stage === stage;
  });
}

export function matchesBodyShapeFilter(pokemon, settings) {
  if (!settings.bodyShapes.length) return true;
  return settings.bodyShapes.includes(pokemon.shape);
}

/**
 * Builds the candidate pool from the intersection of every hard filter.
 * Type preference only becomes a hard filter in `hard` mode.
 */
export function getCandidatePool(pokemonList, settings) {
  const ids = getSelectedIdSet(settings);
  return pokemonList.filter((pokemon) => (
    ids.has(pokemon.id)
    && matchesHardTypeFilter(pokemon, settings)
    && matchesLegendaryFilters(pokemon, settings)
    && matchesEvolutionFilter(pokemon, settings)
    && matchesBodyShapeFilter(pokemon, settings)
  ));
}

export function getTypeDrawWeight(pokemon, settings) {
  if (settings.typeMode !== 'weighted' || !settings.preferredTypes.length) return 1;
  const preferred = new Set(settings.preferredTypes);
  let weight = 0;
  for (const type of pokemon.types) {
    if (!preferred.has(type)) continue;
    const configured = Number(settings.typeWeights?.[type] ?? 1);
    weight += Number.isFinite(configured) && configured > 0 ? configured : 1;
  }
  return weight > 0 ? weight : 1;
}

export function getPoolSummary(pool, settings) {
  const typeCounts = {};
  for (const pokemon of pool) {
    for (const type of pokemon.types) {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
  }
  return {
    total: pool.length,
    legendary: pool.filter((pokemon) => pokemon.isLegendary).length,
    mythical: pool.filter((pokemon) => pokemon.isMythical).length,
    typeCounts,
  };
}

export function validatePool(pool, settings) {
  const errors = [];
  const warnings = [];

  if (!settings.selectedGenerations.length) {
    errors.push('请至少选择一个世代。');
  }
  if (settings.rangeMin > settings.rangeMax) {
    errors.push('起始编号不能大于结束编号。');
  }
  if (settings.rangeMin < DEX_MIN || settings.rangeMax > DEX_MAX) {
    errors.push(`全国图鉴编号范围为 ${DEX_MIN}–${DEX_MAX}。`);
  }
  if (!pool.length && settings.selectedGenerations.length && settings.rangeMin <= settings.rangeMax) {
    errors.push(emptyPoolError);
  }

  const needed = settings.count;
  if (settings.duplicateMode === 'unique' && pool.length > 0 && pool.length < needed) {
    warnings.push(`候选池只有 ${pool.length} 只，少于 ${needed} 只；本轮会生成可用数量并提示。`);
  }
  if (settings.typeMode === 'hard' && settings.preferredTypes.length === 0) {
    warnings.push('硬性筛选已开启但未选择属性，当前不会按属性筛选。');
  }
  if (settings.typeMode === 'weighted' && settings.preferredTypes.length === 0) {
    warnings.push('权重模式已开启但未选择属性，当前所有宝可梦概率相同。');
  }

  return { errors, warnings };
}

export function getPokemonFilterConflicts(pokemon, settings) {
  if (!pokemon) return ['宝可梦数据不存在'];
  const reasons = [];
  const generation = getGenerationByDexNumber(pokemon.id);
  if (generation && !settings.selectedGenerations.includes(generation.id)) {
    reasons.push(`所属${generation.label}未选中`);
  }
  if (pokemon.id < settings.rangeMin || pokemon.id > settings.rangeMax) {
    reasons.push(`编号 #${String(pokemon.id).padStart(4, '0')} 不在当前编号范围`);
  }
  if (!matchesHardTypeFilter(pokemon, settings)) {
    const preferred = settings.preferredTypes.map((type) => TYPE_MAP[type]?.label || type).join('、');
    reasons.push(`不符合硬性属性筛选（${preferred}）`);
  }
  if (!settings.includeLegendary && pokemon.isLegendary) {
    reasons.push('已排除传说宝可梦');
  }
  if (!settings.includeMythical && pokemon.isMythical) {
    reasons.push('已排除幻之宝可梦');
  }
  if (!matchesEvolutionFilter(pokemon, settings)) {
    reasons.push('不符合进化阶段筛选');
  }
  if (!matchesBodyShapeFilter(pokemon, settings)) {
    reasons.push('不符合体型筛选');
  }
  return reasons;
}

export function getLockConflictMap(lockedPokemon, settings) {
  const map = {};
  for (const pokemon of lockedPokemon) {
    const reasons = getPokemonFilterConflicts(pokemon, settings);
    if (reasons.length) map[pokemon.id] = reasons;
  }
  return map;
}

export function getActiveGenerationLabels(settings) {
  return GENERATIONS
    .filter((generation) => settings.selectedGenerations.includes(generation.id))
    .map((generation) => generation.label);
}
