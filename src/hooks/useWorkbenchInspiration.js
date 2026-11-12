import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { usePersistentState } from './usePersistentState.js';
import { STORAGE_KEYS, readJSON, writeJSON } from '../utils/storage.js';
import {
  buildInspirationText,
  createCollectionEntry,
  createEmptyInspiration,
  generateInspiration,
  getInspirationSignature,
  normalizeInspiration,
  normalizeInspirationCollection,
} from '../utils/inspirationEngine.js';
import {
  buildColorCopyText,
  getPaletteColorValue,
} from '../utils/colorReferenceEngine.js';
import { copyText } from '../utils/clipboard.js';

function migrateLegacyWorkbench(legacy, legacyColor, pokemonList) {
  if (!legacy?.dimensions?.theme?.value) return null;
  const old = legacy.dimensions;
  const color = legacyColor?.value;
  const palette = color?.colors?.length
    ? {
      id: color.paletteId || 'legacy',
      name: color.name || '旧版配色',
      description: color.description || '',
      colors: color.colors,
      moods: [],
    }
    : null;
  const composition = old.compositionView?.value;
  const raw = {
    id: legacy.id,
    mode: 'linked',
    difficulty: 'intermediate',
    dimensions: {
      theme: { value: old.theme?.value || '', locked: Boolean(old.theme?.locked) },
      story: { value: old.story?.value || '', locked: Boolean(old.story?.locked) },
      scene: { value: old.environment?.value || '', locked: Boolean(old.environment?.locked) },
      action: { value: old.actionInteraction?.value || '', locked: Boolean(old.actionInteraction?.locked) },
      composition: { value: composition?.composition || '', locked: Boolean(old.compositionView?.locked) },
      viewpoint: { value: composition?.viewpoint || '', locked: Boolean(old.compositionView?.locked) },
      lighting: { value: old.lighting?.value || '', locked: Boolean(old.lighting?.locked) },
      background: { value: '', locked: false },
      palette: { value: palette, locked: Boolean(legacyColor?.locked) },
      mood: { value: color?.moodText || '', locked: Boolean(legacyColor?.locked) },
      material: { value: color?.materialText || '', locked: Boolean(legacyColor?.locked) },
      challenge: { value: old.challenge?.value || '', locked: Boolean(old.challenge?.locked) },
    },
    meta: {
      themeId: legacy.meta?.themeId || null,
      linkedPokemonIds: pokemonList.map((pokemon) => pokemon.id),
      linkedPokemonNames: pokemonList.map((pokemon) => pokemon.nameZh || pokemon.nameEn).filter(Boolean),
      sourceSignature: pokemonList.map((pokemon) => pokemon.id).join('-'),
      workbenchLocked: Boolean(legacy.locked),
      generatedAt: legacy.updatedAt || legacy.createdAt || null,
    },
    createdAt: legacy.createdAt || null,
    updatedAt: legacy.updatedAt || null,
  };
  return normalizeInspiration(raw);
}

const WORKBENCH_KEYS = [
  'theme',
  'story',
  'scene',
  'action',
  'composition',
  'viewpoint',
  'lighting',
  'background',
  'challenge',
];

export function useWorkbenchInspiration() {
  const {
    current,
    compositionPokemon,
    settings,
    drawRevision,
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

  const sourceSignature = useMemo(
    () => compositionPokemon.map((pokemon) => pokemon.id).join('-'),
    [compositionPokemon],
  );
  const sceneSignature = useMemo(
    () => ['location', 'weather', 'time']
      .map((key) => `${key}:${current.scenes?.[key]?.enabled ? current.scenes[key].value : ''}`)
      .join('|'),
    [current.scenes],
  );
  const hasPokemon = compositionPokemon.length > 0;
  const hasInspiration = Boolean(inspiration.dimensions.theme.value);
  const palette = inspiration.dimensions.palette.value;
  const hasColor = Boolean(palette);
  const moduleLocked = Boolean(inspiration.meta.workbenchLocked);
  const lockedCount = WORKBENCH_KEYS.filter((key) => inspiration.dimensions[key]?.locked).length;
  const sourceStale = hasInspiration
    && hasPokemon
    && (inspiration.meta.sourceSignature !== sourceSignature
      || inspiration.meta.sceneSignature !== sceneSignature);
  const colorStale = hasColor
    && hasPokemon
    && (inspiration.meta.sourceSignature !== sourceSignature
      || inspiration.meta.sceneSignature !== sceneSignature);
  const observedDrawRevision = useRef(drawRevision);

  const colorReference = useMemo(() => ({
    value: palette
      ? getPaletteColorValue(
        palette,
        inspiration.dimensions.mood.value,
        inspiration.dimensions.material.value,
      )
      : null,
    locked: Boolean(inspiration.dimensions.palette.locked),
    sourceSignature: inspiration.meta.sourceSignature || '',
  }), [
    palette,
    inspiration.dimensions.mood.value,
    inspiration.dimensions.material.value,
    inspiration.dimensions.palette.locked,
    inspiration.meta.sourceSignature,
  ]);

  useEffect(() => {
    if (!inspiration.dimensions.theme.value) {
      const migrated = migrateLegacyWorkbench(
        readJSON(STORAGE_KEYS.workbenchInspiration, null),
        readJSON(STORAGE_KEYS.workbenchColor, null),
        compositionPokemon,
      );
      if (migrated) {
        setInspiration(migrated);
        return;
      }
    }
    if (!sourceSignature) return;
    const drawTriggered = drawRevision !== observedDrawRevision.current;
    observedDrawRevision.current = drawRevision;
    const incomplete = !inspiration.dimensions.theme.value
      || !inspiration.dimensions.story.value
      || !inspiration.dimensions.scene.value
      || !inspiration.dimensions.palette.value;

    if (!drawTriggered && !incomplete) return;

    if (moduleLocked) {
      if (drawTriggered && !inspiration.dimensions.palette.locked) {
        const paletteResult = generateInspiration({
          previous: inspiration,
          mode: 'linked',
          difficulty: inspiration.difficulty,
          pokemonList: compositionPokemon,
          currentComposition: current,
          settings,
          onlyKey: 'palette',
        });
        setInspiration(paletteResult.inspiration);
      }
      return;
    }

    const result = generateInspiration({
      previous: inspiration,
      mode: 'linked',
      difficulty: inspiration.difficulty,
      pokemonList: compositionPokemon,
      currentComposition: current,
      settings,
    });
    setInspiration(result.inspiration);
  }, [
    drawRevision, sourceSignature, inspiration, compositionPokemon,
    current, settings, setInspiration, moduleLocked,
  ]);

  const generateAll = useCallback(() => {
    if (!hasPokemon) {
      notify('先抽取宝可梦，才能生成绘画灵感。', 'warning');
      return false;
    }
    if (moduleLocked) {
      notify('绘画灵感模块已锁定，请先解除模块锁定。', 'warning');
      return false;
    }
    if (lockedCount >= WORKBENCH_KEYS.length) {
      notify('所有灵感维度都已锁定，请先解除至少一个锁定。', 'info');
      return false;
    }
    const result = generateInspiration({
      previous: inspiration,
      mode: 'linked',
      difficulty: inspiration.difficulty,
      pokemonList: compositionPokemon,
      currentComposition: current,
      settings,
    });
    setInspiration(result.inspiration);
    return true;
  }, [
    hasPokemon, moduleLocked, lockedCount, inspiration, compositionPokemon,
    current, settings, setInspiration, notify,
  ]);

  const rerollDimension = useCallback((key) => {
    if (!hasPokemon) {
      notify('先抽取宝可梦，才能重抽绘画灵感。', 'warning');
      return false;
    }
    if (moduleLocked) {
      notify('绘画灵感模块已锁定，请先解除模块锁定。', 'warning');
      return false;
    }
    if (inspiration.dimensions[key]?.locked) {
      notify('该灵感维度已锁定，请先解除锁定。', 'warning');
      return false;
    }
    const result = generateInspiration({
      previous: inspiration,
      mode: 'linked',
      difficulty: inspiration.difficulty,
      pokemonList: compositionPokemon,
      currentComposition: current,
      settings,
      onlyKey: key,
    });
    if (result.error) {
      notify(result.error, 'warning');
      return false;
    }
    setInspiration(result.inspiration);
    return true;
  }, [
    hasPokemon, moduleLocked, inspiration, compositionPokemon, current,
    settings, setInspiration, notify,
  ]);

  const toggleLock = useCallback((key) => {
    setInspiration((previous) => ({
      ...previous,
      dimensions: {
        ...previous.dimensions,
        [key]: { ...previous.dimensions[key], locked: !previous.dimensions[key].locked },
      },
      updatedAt: new Date().toISOString(),
    }));
  }, [setInspiration]);

  const toggleInspirationLock = useCallback(() => {
    setInspiration((previous) => ({
      ...previous,
      meta: { ...previous.meta, workbenchLocked: !previous.meta.workbenchLocked },
      updatedAt: new Date().toISOString(),
    }));
  }, [setInspiration]);

  const rerollColor = useCallback(() => {
    if (!hasPokemon) {
      notify('先抽取宝可梦，才能生成配色参考。', 'warning');
      return false;
    }
    if (inspiration.dimensions.palette.locked) {
      notify('配色参考已锁定，请先解除锁定。', 'warning');
      return false;
    }
    const result = generateInspiration({
      previous: inspiration,
      mode: 'linked',
      difficulty: inspiration.difficulty,
      pokemonList: compositionPokemon,
      currentComposition: current,
      settings,
      onlyKey: 'palette',
    });
    setInspiration(result.inspiration);
    return true;
  }, [
    hasPokemon, inspiration, compositionPokemon, current, settings,
    setInspiration, notify,
  ]);

  const toggleColorLock = useCallback(() => {
    setInspiration((previous) => ({
      ...previous,
      dimensions: {
        ...previous.dimensions,
        palette: {
          ...previous.dimensions.palette,
          locked: !previous.dimensions.palette.locked,
        },
      },
      updatedAt: new Date().toISOString(),
    }));
  }, [setInspiration]);

  const copyPrompt = useCallback(async () => {
    if (!hasInspiration) {
      notify('当前还没有可复制的绘画灵感。', 'warning');
      return false;
    }
    const prompt = [
      buildInspirationText(inspiration),
      colorReference.value ? buildColorCopyText(colorReference) : '',
    ].filter(Boolean).join('\n\n');
    const ok = await copyText(prompt);
    if (ok) notify('完整灵感与配色提示词已复制。', 'success');
    else notify('浏览器未允许访问剪贴板，请手动选择文字复制。', 'warning');
    return ok;
  }, [hasInspiration, inspiration, colorReference, notify]);

  const copyColorCodes = useCallback(async () => {
    if (!hasColor) {
      notify('当前还没有可复制的配色。', 'warning');
      return false;
    }
    const ok = await copyText(buildColorCopyText(colorReference));
    if (ok) notify('配色方案与 HEX 色号已复制。', 'success');
    else notify('浏览器未允许访问剪贴板，请手动选择文字复制。', 'warning');
    return ok;
  }, [hasColor, colorReference, notify]);

  const copyHex = useCallback(async (hex) => {
    const ok = await copyText(hex);
    if (ok) notify(`已复制色号 ${hex}`, 'success');
    else notify('浏览器未允许访问剪贴板，请手动复制色号。', 'warning');
    return ok;
  }, [notify]);

  const saveToCollection = useCallback(() => {
    if (!hasInspiration) {
      notify('当前还没有完整灵感可收藏。先生成一套吧。', 'warning');
      return false;
    }
    const signature = getInspirationSignature(inspiration);
    if (collection.some((entry) => getInspirationSignature(entry.inspiration) === signature)) {
      notify('这套完整灵感已经在收藏中了。', 'info');
      return false;
    }
    setCollection((previous) => [createCollectionEntry(inspiration), ...previous].slice(0, 80));
    notify('完整灵感已收藏，可在灵感工坊继续查看和编辑。', 'success');
    return true;
  }, [hasInspiration, inspiration, collection, setCollection, notify]);

  const sendToWorkshop = useCallback(() => {
    if (!hasInspiration) {
      notify('当前还没有可发送的完整灵感。', 'warning');
      return false;
    }
    writeJSON(STORAGE_KEYS.inspiration, inspiration);
    navigate('inspiration');
    notify('已载入当前完整灵感；工坊不会重新随机生成。', 'success', 5200);
    return true;
  }, [hasInspiration, inspiration, navigate, notify]);

  return {
    inspiration,
    colorReference,
    hasPokemon,
    hasInspiration,
    hasColor,
    moduleLocked,
    sourceStale,
    colorStale,
    lockedCount,
    sourceSignature,
    collectionCount: collection.length,
    generateAll,
    rerollDimension,
    toggleLock,
    toggleInspirationLock,
    rerollColor,
    toggleColorLock,
    copyPrompt,
    copyColorCodes,
    copyHex,
    saveToCollection,
    sendToWorkshop,
    openWorkshop: () => navigate('inspiration'),
  };
}
