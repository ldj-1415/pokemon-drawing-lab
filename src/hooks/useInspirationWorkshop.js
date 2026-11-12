import { useCallback, useMemo, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { usePersistentState } from './usePersistentState.js';
import { STORAGE_KEYS } from '../utils/storage.js';
import { getCompositionPokemon } from '../utils/composition.js';
import { copyText } from '../utils/clipboard.js';
import { buildColorCopyText, getPaletteRoles } from '../utils/colorReferenceEngine.js';
import {
  buildInspirationText,
  createCollectionEntry,
  createEmptyInspiration,
  generateInspiration,
  getInspirationDifficultyMeta,
  getInspirationSignature,
  getInspirationTitle,
  normalizeInspiration,
  normalizeInspirationCollection,
  searchInspirationCollection,
} from '../utils/inspirationEngine.js';
import { INSPIRATION_DIMENSION_KEYS } from '../data/inspiration.js';
import { SCENE_MODULE_MAP } from '../data/scenes.js';

function getLinkedSceneLabels(composition) {
  if (!composition?.scenes) return [];
  return ['location', 'weather', 'time'].flatMap((key) => {
    const scene = composition.scenes[key];
    if (!scene?.enabled) return [];
    const module = SCENE_MODULE_MAP[key];
    const option = module?.options.find((item) => item.id === scene.value);
    return option ? [{ key, title: module.title, value: option.label }] : [];
  });
}

export function useInspirationWorkshop() {
  const {
    current,
    dexMap,
    settings,
    timer,
    navigate,
    notify,
  } = useLab();
  const [inspiration, setInspiration] = usePersistentState(
    STORAGE_KEYS.inspiration,
    createEmptyInspiration(),
    normalizeInspiration,
  );
  const [collection, setCollection] = usePersistentState(
    STORAGE_KEYS.inspirationCollection,
    [],
    normalizeInspirationCollection,
  );
  const [mode, setMode] = useState(
    inspiration.dimensions.theme.value
      ? inspiration.mode
      : (current.pokemon?.length ? 'linked' : 'random'),
  );
  const [difficulty, setDifficulty] = useState(inspiration.difficulty || 'intermediate');
  const [customSeed, setCustomSeedState] = useState(inspiration.meta?.customSeed || '');

  const setCustomSeed = useCallback((value) => {
    setCustomSeedState(value);
    // Editing an auto-generated custom theme is an explicit intent to replace it.
    if (
      inspiration.mode === 'custom'
      && inspiration.meta?.themeId === 'custom'
      && inspiration.dimensions.theme.locked
      && value.trim() !== inspiration.dimensions.theme.value
    ) {
      setInspiration((previous) => ({
        ...previous,
        dimensions: {
          ...previous.dimensions,
          theme: { ...previous.dimensions.theme, locked: false },
        },
      }));
    }
  }, [inspiration, setInspiration]);

  const linkedPokemon = useMemo(
    () => getCompositionPokemon(current, dexMap),
    [current, dexMap],
  );
  const linkedSceneLabels = useMemo(
    () => getLinkedSceneLabels(current),
    [current],
  );
  const linkedPokemonChips = useMemo(() => {
    const map = new Map();
    for (const pokemon of linkedPokemon) {
      if (!map.has(pokemon.id)) map.set(pokemon.id, pokemon);
    }
    return [...map.values()];
  }, [linkedPokemon]);
  const linkedSignature = useMemo(
    () => linkedPokemon.map((pokemon) => pokemon.id).join('-'),
    [linkedPokemon],
  );
  const linkedSceneSignature = useMemo(
    () => ['location', 'weather', 'time']
      .map((key) => `${key}:${current.scenes?.[key]?.enabled ? current.scenes[key].value : ''}`)
      .join('|'),
    [current.scenes],
  );

  const hasInspiration = Boolean(inspiration.dimensions.theme.value);
  const linkedStale = hasInspiration
    && mode === 'linked'
    && (inspiration.meta.sourceSignature !== linkedSignature
      || inspiration.meta.sceneSignature !== linkedSceneSignature);
  const lockedCount = INSPIRATION_DIMENSION_KEYS
    .filter((key) => inspiration.dimensions[key]?.locked).length;
  const allLocked = lockedCount === INSPIRATION_DIMENSION_KEYS.length;
  const selectedDifficultyMeta = getInspirationDifficultyMeta(difficulty);
  const generatedDifficultyMeta = getInspirationDifficultyMeta(inspiration.difficulty);

  let generationBlockReason = '';
  if (mode === 'linked' && !linkedPokemon.length) {
    generationBlockReason = '当前工作台还没有宝可梦。请先去随机工作台抽取，再回来生成联动灵感。';
  } else if (mode === 'custom' && !customSeed.trim()) {
    generationBlockReason = '请先输入一个自定义主题或关键词。';
  }
  const canGenerate = !generationBlockReason;

  const generate = useCallback(() => {
    if (!canGenerate) {
      notify(generationBlockReason, 'warning', 5000);
      return null;
    }
    if (inspiration.meta.workbenchLocked) {
      notify('随机工作台已锁定整套绘画灵感，请先回工作台解除模块锁定。', 'warning', 5000);
      return null;
    }
    if (allLocked) {
      notify('所有灵感维度都已锁定，先生成前请解除至少一个锁定。', 'info', 5000);
      return null;
    }
    const result = generateInspiration({
      previous: inspiration,
      mode,
      difficulty,
      pokemonList: mode === 'linked' ? linkedPokemon : [],
      currentComposition: mode === 'linked' ? current : null,
      customSeed,
      settings,
    });
    if (result.error) {
      notify(result.error, 'error', 5500);
      return null;
    }
    setInspiration(result.inspiration);
    return result.inspiration;
  }, [
    canGenerate, generationBlockReason, allLocked, notify, inspiration, mode,
    difficulty, linkedPokemon, current, customSeed, settings, setInspiration,
  ]);

  const rerollDimension = useCallback((key) => {
    if (inspiration.meta.workbenchLocked) {
      notify('随机工作台已锁定整套绘画灵感，请先回工作台解除模块锁定。', 'warning', 5000);
      return null;
    }
    if (inspiration.dimensions[key]?.locked) {
      notify('该维度已锁定，请先解除锁定。', 'warning');
      return null;
    }
    if (!canGenerate) {
      notify(generationBlockReason, 'warning', 5000);
      return null;
    }
    const result = generateInspiration({
      previous: inspiration,
      mode,
      difficulty,
      pokemonList: mode === 'linked' ? linkedPokemon : [],
      currentComposition: mode === 'linked' ? current : null,
      customSeed,
      settings,
      onlyKey: key,
    });
    if (result.error) {
      notify(result.error, 'error', 5500);
      return null;
    }
    setInspiration(result.inspiration);
    return result.inspiration;
  }, [
    inspiration, notify, canGenerate, generationBlockReason, mode, difficulty,
    linkedPokemon, current, customSeed, settings, setInspiration,
  ]);

  const toggleDimensionLock = useCallback((key) => {
    setInspiration((previous) => ({
      ...previous,
      dimensions: {
        ...previous.dimensions,
        [key]: {
          ...previous.dimensions[key],
          locked: !previous.dimensions[key].locked,
        },
      },
      updatedAt: new Date().toISOString(),
    }));
  }, [setInspiration]);

  const saveToCollection = useCallback(() => {
    if (!hasInspiration) {
      notify('当前还没有完整灵感可收藏。先生成一套灵感吧。', 'warning');
      return false;
    }
    const signature = getInspirationSignature(inspiration);
    if (collection.some((entry) => getInspirationSignature(entry.inspiration) === signature)) {
      notify('这套完整灵感已经在收藏中了。', 'info');
      return false;
    }
    const entry = createCollectionEntry(inspiration);
    setCollection((previous) => [entry, ...previous].slice(0, 80));
    notify('完整灵感已收藏。', 'success');
    return true;
  }, [hasInspiration, inspiration, collection, setCollection, notify]);

  const loadSaved = useCallback((id) => {
    const entry = collection.find((item) => item.id === id);
    if (!entry) {
      notify('没有找到这条灵感收藏。', 'error');
      return false;
    }
    const next = normalizeInspiration(entry.inspiration);
    setInspiration(next);
    setMode(next.mode);
    setDifficulty(next.difficulty);
    setCustomSeedState(next.meta.customSeed || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify('已载入收藏的完整灵感。', 'success');
    return true;
  }, [collection, setInspiration, notify]);

  const deleteSaved = useCallback((id) => {
    setCollection((previous) => previous.filter((entry) => entry.id !== id));
    notify('灵感收藏已删除。', 'info');
  }, [setCollection, notify]);

  const searchCollection = useCallback(
    (query) => searchInspirationCollection(collection, query),
    [collection],
  );

  const copyPalette = useCallback(async () => {
    const palette = inspiration.dimensions.palette.value;
    if (!palette) {
      notify('当前还没有可复制的配色。', 'warning');
      return false;
    }
    const roles = getPaletteRoles(palette);
    const text = buildColorCopyText({
      value: {
        paletteId: palette.id,
        name: palette.name,
        description: palette.description,
        colors: palette.colors,
        ...roles,
        moodText: inspiration.dimensions.mood.value,
        materialText: inspiration.dimensions.material.value,
      },
    });
    const ok = await copyText(text);
    if (ok) notify('配色方案与 HEX 色号已复制。', 'success');
    else notify('浏览器未允许访问剪贴板，请手动复制。', 'warning');
    return ok;
  }, [inspiration, notify]);

  const copyCurrent = useCallback(async () => {
    if (!hasInspiration) {
      notify('当前还没有可复制的灵感。', 'warning');
      return false;
    }
    const ok = await copyText(buildInspirationText(inspiration));
    if (ok) notify('完整灵感已复制到剪贴板。', 'success');
    else notify('浏览器未允许访问剪贴板，请手动选择文字复制。', 'warning');
    return ok;
  }, [hasInspiration, inspiration, notify]);

  const sendToTimer = useCallback(() => {
    if (!hasInspiration) {
      notify('当前还没有完整灵感，先生成一套再发送。', 'warning');
      return false;
    }
    const meta = getInspirationDifficultyMeta(inspiration.difficulty);
    timer.selectDuration(meta.timerSeconds);
    navigate('workbench');
    notify(
      `已将「${getInspirationTitle(inspiration)}」发送到计时器：${meta.timerLabel}。到工作台点击开始计时即可。`,
      'success',
      6500,
    );
    return true;
  }, [hasInspiration, inspiration, timer, navigate, notify]);

  return {
    inspiration,
    collection,
    mode,
    setMode,
    difficulty,
    setDifficulty,
    customSeed,
    setCustomSeed,
    selectedDifficultyMeta,
    generatedDifficultyMeta,
    linkedPokemon,
    linkedPokemonChips,
    linkedSceneLabels,
    hasInspiration,
    linkedStale,
    lockedCount,
    allLocked,
    canGenerate,
    generationBlockReason,
    generate,
    rerollDimension,
    toggleDimensionLock,
    saveToCollection,
    loadSaved,
    deleteSaved,
    searchCollection,
    copyCurrent,
    copyPalette,
    sendToTimer,
    title: getInspirationTitle(inspiration),
  };
}
