import { createSceneState, normalizeSceneState, SCENE_KEYS } from '../data/scenes.js';

export function createReferenceState() {
  return {
    enabled: true,
    locked: false,
    imageId: null,
    imageName: '',
    imageCategory: null,
    imageCategoryLabel: '',
    imageTags: [],
    imageUsage: '',
  };
}

export function normalizeReferenceState(raw) {
  const defaults = createReferenceState();
  if (!raw || typeof raw !== 'object') return defaults;
  return {
    enabled: raw.enabled !== false,
    locked: Boolean(raw.locked && raw.imageId),
    imageId: raw.imageId ? String(raw.imageId) : null,
    imageName: raw.imageName ? String(raw.imageName).slice(0, 100) : '',
    imageCategory: raw.imageCategory ? String(raw.imageCategory) : null,
    imageCategoryLabel: raw.imageCategoryLabel ? String(raw.imageCategoryLabel).slice(0, 40) : '',
    imageTags: Array.isArray(raw.imageTags)
      ? [...new Set(raw.imageTags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 12)
      : [],
    imageUsage: raw.imageUsage ? String(raw.imageUsage).slice(0, 40) : '',
  };
}

export function createEmptyComposition(sceneState = createSceneState()) {
  return {
    pokemon: [],
    scenes: normalizeSceneState(sceneState),
    reference: createReferenceState(),
    createdAt: null,
    updatedAt: null,
  };
}

export function normalizeComposition(raw, dexMap) {
  if (!raw || typeof raw !== 'object') return createEmptyComposition();
  const pokemon = [];
  for (const entry of Array.isArray(raw.pokemon) ? raw.pokemon : []) {
    const id = Number(entry?.id ?? entry?.pokemonId);
    if (!Number.isInteger(id) || id < 1 || id > 1025) continue;
    if (dexMap && !dexMap.has(id)) continue;
    // Duplicate IDs are valid in "允许重复" mode, so slots are not deduplicated.
    pokemon.push({ id, locked: Boolean(entry.locked) });
  }
  return {
    pokemon,
    scenes: normalizeSceneState(raw.scenes),
    reference: normalizeReferenceState(raw.reference),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function getCompositionPokemon(composition, dexMap) {
  return composition.pokemon
    .map((entry) => {
      const pokemon = dexMap.get(entry.id);
      return pokemon ? { ...pokemon, locked: entry.locked } : null;
    })
    .filter(Boolean);
}

export function getLockedEntries(composition) {
  return composition.pokemon.filter((entry) => entry.locked);
}

export function countLocked(composition) {
  return composition.pokemon.filter((entry) => entry.locked).length;
}

export function hasPokemon(composition) {
  return composition.pokemon.length > 0;
}

export function slimPokemon(pokemon) {
  if (!pokemon) return null;
  return {
    id: pokemon.id,
    name: pokemon.name,
    nameEn: pokemon.nameEn,
    nameZh: pokemon.nameZh,
    nameJa: pokemon.nameJa,
    types: pokemon.types,
    typesZh: pokemon.typesZh,
    generation: pokemon.generation,
    artwork: pokemon.artwork,
    home: pokemon.home,
    sprite: pokemon.sprite,
    isLegendary: pokemon.isLegendary,
    isMythical: pokemon.isMythical,
    isBaby: pokemon.isBaby,
    stage: pokemon.stage,
    stageLabel: pokemon.stageLabel,
    shape: pokemon.shape,
    shapeZh: pokemon.shapeZh,
    height: pokemon.height,
    weight: pokemon.weight,
  };
}

export function snapshotComposition(composition, dexMap) {
  const pokemon = composition.pokemon
    .map((entry) => {
      const full = dexMap.get(entry.id);
      const slim = slimPokemon(full);
      return slim ? { ...slim, locked: entry.locked } : null;
    })
    .filter(Boolean);

  return {
    pokemon,
    scenes: Object.fromEntries(
      SCENE_KEYS.map((key) => [key, { ...composition.scenes[key] }]),
    ),
    reference: normalizeReferenceState(composition.reference),
    createdAt: composition.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function hydrateComposition(snapshot, dexMap) {
  const entries = (snapshot?.pokemon || [])
    .map((entry) => ({ id: entry.id, locked: Boolean(entry.locked) }))
    .filter((entry) => entry.id && (!dexMap || dexMap.has(entry.id)));
  return {
    pokemon: entries,
    scenes: normalizeSceneState(snapshot?.scenes),
    reference: normalizeReferenceState(snapshot?.reference),
    createdAt: snapshot?.createdAt || null,
    updatedAt: new Date().toISOString(),
  };
}

export function getCompositionSignature(composition) {
  const pokemonPart = composition.pokemon.map((entry) => entry.id).join('-');
  const scenesPart = SCENE_KEYS
    .map((key) => {
      const scene = composition.scenes?.[key];
      return `${key}:${scene?.enabled ? scene.value : 'off'}`;
    })
    .join('|');
  const reference = composition.reference;
  const referencePart = reference?.enabled && reference?.imageId ? reference.imageId : 'off';
  return `${pokemonPart}::${scenesPart}::ref:${referencePart}`;
}

export function getCompositionTitle(composition, dexMap) {
  if (!composition?.pokemon?.length) return '未命名绘画组合';
  return composition.pokemon
    .map((entry) => {
      const pokemon = dexMap.get(entry.id);
      return pokemon?.nameZh || pokemon?.nameEn || `#${entry.id}`;
    })
    .join(' × ');
}

export function getSavedSnapshotTitle(entry) {
  if (!entry?.pokemon?.length) return '未命名绘画组合';
  return entry.pokemon.map((pokemon) => pokemon.nameZh || pokemon.nameEn || `#${pokemon.id}`).join(' × ');
}

export function getSavedPokemonList(entry, dexMap) {
  return (entry?.pokemon || [])
    .map((slim) => {
      const full = dexMap?.get(slim.id);
      return full ? { ...full, locked: slim.locked } : { ...slim, locked: slim.locked };
    })
    .filter(Boolean);
}

export function isLocked(composition, pokemonId) {
  return composition.pokemon.some((entry) => entry.id === pokemonId && entry.locked);
}

export function togglePokemonLock(composition, slotIndex) {
  const entry = composition.pokemon[slotIndex];
  if (!entry) return composition;
  return {
    ...composition,
    pokemon: composition.pokemon.map((item, index) => (
      index === slotIndex ? { ...item, locked: !item.locked } : item
    )),
    updatedAt: new Date().toISOString(),
  };
}
