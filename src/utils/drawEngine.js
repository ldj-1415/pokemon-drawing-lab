import { getTypeDrawWeight } from './filters.js';
import { sampleUnique, sampleWithReplacement, weightedPick, weightedSampleUnique } from './random.js';

const weightFor = (settings) => (pokemon) => getTypeDrawWeight(pokemon, settings);

/**
 * Fills only the unlocked slots. Locked entries are passed in separately and
 * are always preserved.
 */
export function drawPokemonSelection({
  pool,
  count,
  lockedEntries = [],
  settings,
  weightFn: providedWeightFn = null,
  rng = Math.random,
}) {
  if (lockedEntries.length > count) {
    return {
      slots: lockedEntries,
      warning: null,
      error: `已锁定 ${lockedEntries.length} 只，超过本轮抽取数量 ${count} 只，请先调整数量或解除锁定。`,
    };
  }

  const randomNeed = count - lockedEntries.length;
  if (randomNeed <= 0) {
    return { slots: lockedEntries, warning: null, error: null };
  }
  if (!pool.length) {
    return {
      slots: lockedEntries,
      warning: null,
      error: '当前筛选条件下没有可抽取的宝可梦。请调整世代、编号范围或偏好属性。',
    };
  }

  const lockedIds = new Set(lockedEntries.map((entry) => entry.id));
  const unlockedCandidates = pool.filter((pokemon) => !lockedIds.has(pokemon.id));
  const weightFn = providedWeightFn || weightFor(settings);
  let randomPicks = [];
  let warning = null;

  if (settings.duplicateMode === 'allow') {
    randomPicks = sampleWithReplacement(pool, randomNeed, weightFn, rng);
  } else if (settings.duplicateMode === 'unique') {
    randomPicks = weightedSampleUnique(unlockedCandidates, randomNeed, weightFn, rng);
    if (randomPicks.length < randomNeed) {
      warning = `不允许重复模式下，可选宝可梦只有 ${unlockedCandidates.length} 只，已生成 ${randomPicks.length} 只，少于目标 ${randomNeed} 只。`;
    }
  } else {
    randomPicks = weightedSampleUnique(unlockedCandidates, randomNeed, weightFn, rng);
    if (randomPicks.length < randomNeed) {
      const remaining = randomNeed - randomPicks.length;
      const repeats = sampleWithReplacement(pool, remaining, weightFn, rng);
      randomPicks = [...randomPicks, ...repeats];
      if (repeats.length) {
        warning = `候选池中不同宝可梦不足，已按「尽量避免重复」规则补足，并允许少量重复。`;
      }
    }
  }

  return {
    slots: [
      ...lockedEntries,
      ...randomPicks.map((pokemon) => ({ id: pokemon.id, locked: false })),
    ],
    warning,
    error: null,
  };
}

export function drawSingleReplacement({
  pool,
  currentEntries,
  slotIndex,
  settings,
  weightFn: providedWeightFn = null,
  rng = Math.random,
}) {
  const entry = currentEntries[slotIndex];
  if (!entry) return { id: null, warning: null, error: '没有找到要重抽的宝可梦。' };
  if (entry.locked) return { id: entry.id, warning: '该宝可梦已锁定，请先解除锁定再重抽。', error: null };
  if (!pool.length) return { id: null, warning: null, error: '候选池为空，无法重抽。' };

  const currentIds = new Set(currentEntries.map((item) => item.id));
  currentIds.add(entry.id);
  const weightFn = providedWeightFn || weightFor(settings);
  let candidates;

  if (settings.duplicateMode === 'allow') {
    candidates = pool.filter((pokemon) => pokemon.id !== entry.id);
  } else {
    candidates = pool.filter((pokemon) => !currentIds.has(pokemon.id));
  }

  let fallbackUsed = false;
  if (!candidates.length) {
    if (settings.duplicateMode === 'unique') {
      return {
        id: null,
        warning: null,
        error: '不允许重复模式下，候选池里已经没有其他可替换的宝可梦。请放宽筛选或解除其他宝可梦。',
      };
    }
    candidates = pool.filter((pokemon) => pokemon.id !== entry.id);
    fallbackUsed = true;
  }
  if (!candidates.length) candidates = pool;

  const picked = weightedPick(candidates, weightFn, rng);
  if (!picked) return { id: null, warning: null, error: '候选池为空，无法重抽。' };

  let warning = null;
  if (picked.id === entry.id) {
    warning = '候选池中没有其他可选宝可梦，本次重抽保留了原宝可梦。';
  } else if (fallbackUsed && settings.duplicateMode !== 'allow') {
    warning = '候选池中不同宝可梦不足，本次重抽使用了可重复的候选池。';
  }

  return { id: picked.id, warning, error: null };
}

export function getRandomSlotCount(count, lockedEntries) {
  return Math.max(0, count - lockedEntries.length);
}

export function getAvailableUniqueCount(pool, lockedEntries, currentEntries = []) {
  const excluded = new Set([
    ...lockedEntries.map((entry) => entry.id),
    ...currentEntries.map((entry) => entry.id),
  ]);
  return pool.filter((pokemon) => !excluded.has(pokemon.id)).length;
}

export function drawFromPoolForSearch(pool) {
  if (!pool.length) return [];
  return sampleUnique(pool, 8);
}
