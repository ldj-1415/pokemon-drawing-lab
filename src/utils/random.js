/**
 * Random helpers used by the draw engine.
 * Every public sampling helper supports an optional RNG for deterministic tests.
 */

export function createRng(seed = Date.now()) {
  let state = seed >>> 0;
  return function rng() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function randomInt(min, max, rng = Math.random) {
  if (max < min) return min;
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function shuffle(items, rng = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function pickOne(items, rng = Math.random) {
  if (!items.length) return null;
  return items[Math.floor(rng() * items.length)] || null;
}

export function sampleUnique(items, count, rng = Math.random) {
  if (count <= 0 || !items.length) return [];
  return shuffle(items, rng).slice(0, Math.min(count, items.length));
}

export function weightedPick(items, getWeight, rng = Math.random) {
  if (!items.length) return null;
  const weights = items.map((item) => {
    const value = Number(getWeight(item));
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return pickOne(items, rng);

  let ticket = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    ticket -= weights[index];
    if (ticket <= 0) return items[index];
  }
  return items[items.length - 1];
}

export function weightedSampleUnique(items, count, getWeight, rng = Math.random) {
  const pool = [...items];
  const picked = [];
  const target = Math.min(count, pool.length);
  while (picked.length < target && pool.length) {
    const item = weightedPick(pool, getWeight, rng);
    if (!item) break;
    picked.push(item);
    const index = pool.indexOf(item);
    if (index >= 0) pool.splice(index, 1);
  }
  return picked;
}

export function sampleWithReplacement(items, count, getWeight, rng = Math.random) {
  if (!items.length || count <= 0) return [];
  return Array.from({ length: count }, () => weightedPick(items, getWeight, rng)).filter(Boolean);
}

/**
 * Returns a shuffled copy with no duplicates. If `count` is larger than the
 * source, the list simply comes back shorter.
 */
export function drawUnique(items, count, rng = Math.random) {
  return sampleUnique(items, count, rng);
}

export function weightedRerollOne(items, getWeight, excludedIds = [], rng = Math.random) {
  if (!items.length) return null;
  const excluded = new Set(excludedIds);
  const filtered = items.filter((item) => !excluded.has(item.id));
  return weightedPick(filtered.length ? filtered : items, getWeight, rng);
}
