import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createEmptyComposition, getCompositionPokemon, getCompositionSignature, getLockedEntries, getSavedSnapshotTitle, hydrateComposition, normalizeComposition, normalizeReferenceState, snapshotComposition, togglePokemonLock } from '../utils/composition.js';
import { getCandidatePool, getLockConflictMap, getPokemonFilterConflicts, getPoolSummary, getTypeDrawWeight, validatePool } from '../utils/filters.js';
import { drawPokemonSelection, drawSingleReplacement } from '../utils/drawEngine.js';
import { getSceneSummary, rerollSingleScene } from '../utils/sceneRandom.js';
import { getAtmosphereSummary } from '../data/atmospheres.js';
import { getPokemonAtmosphereWeight } from '../utils/atmosphereEngine.js';
import { getImagePreferenceSummary, getImagePreferenceWeight } from '../utils/imagePreferenceEngine.js';
import {
  generateSceneState,
  getCompositionCompatibilityIssues,
  rerollSceneWithCompatibility,
} from '../utils/sceneGeneration.js';
import { getCompatibilityMode } from '../utils/compatibilityEngine.js';
import {
  buildReferenceSelection,
  clearReferenceSelection,
  getReferenceCandidates,
  pickReferenceImage,
  randomizeReferenceState,
} from '../utils/referenceRandom.js';
import { createDefaultSettings, normalizeSettings } from '../data/settings.js';
import { SCENE_MODULE_MAP, createSceneState, normalizeSceneState } from '../data/scenes.js';
import { REFERENCE_CATEGORY_IDS } from '../data/gallery.js';
import { getGenerationIds } from '../data/generations.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { usePokedex } from '../hooks/usePokedex.js';
import { useGallery } from '../hooks/useGallery.js';
import { useChallengeTimer } from '../hooks/useChallengeTimer.js';
import { isStorageAvailable, STORAGE_KEYS } from '../utils/storage.js';
import { getPokemonDisplayName } from '../utils/search.js';
import { describeGalleryError } from '../services/galleryDb.js';

const LabContext = createContext(null);

const VALID_PAGES = ['workbench', 'inspiration', 'settings', 'gallery', 'favorites', 'history'];
const MAX_HISTORY = 80;
const MAX_FAVORITES = 100;

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function readPageFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return VALID_PAGES.includes(raw) ? raw : 'workbench';
}

function normalizeSavedEntries(raw, dexMap) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || !entry.composition || !Array.isArray(entry.composition.pokemon)) return null;
      const pokemon = entry.composition.pokemon
        .filter((item) => item && Number.isInteger(item.id) && dexMap.has(item.id))
        .map((item) => ({ ...item, locked: Boolean(item.locked) }));
      if (!pokemon.length) return null;
      return {
        ...entry,
        id: entry.id || makeId(),
        createdAt: entry.createdAt || new Date().toISOString(),
        action: entry.action || '保存的组合',
        title: entry.title || getSavedSnapshotTitle({ pokemon }),
        composition: {
          ...entry.composition,
          pokemon,
          scenes: normalizeSceneState(entry.composition.scenes),
          reference: normalizeReferenceState(entry.composition.reference),
        },
      };
    })
    .filter(Boolean)
    .slice(0, MAX_HISTORY);
}

function normalizeFavorites(raw, dexMap) {
  return normalizeSavedEntries(raw, dexMap).slice(0, MAX_FAVORITES);
}

function playFinishChime() {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    const context = new AudioCtor();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, context.currentTime + index * 0.18);
      gain.gain.linearRampToValueAtTime(0.08, context.currentTime + index * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.18 + 0.38);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + index * 0.18);
      oscillator.stop(context.currentTime + index * 0.18 + 0.4);
    });
    window.setTimeout(() => context.close().catch(() => {}), 1400);
  } catch {
    // Audio is a bonus; visual reminders remain available.
  }
}

export function LabProvider({ children }) {
  const pokedex = usePokedex();
  const gallery = useGallery();
  const { dexMap } = pokedex;

  const [settings, setSettings] = usePersistentState(
    STORAGE_KEYS.settings,
    createDefaultSettings(),
    normalizeSettings,
  );
  const [current, setCurrent] = usePersistentState(
    STORAGE_KEYS.composition,
    createEmptyComposition(),
    (raw) => normalizeComposition(raw, dexMap),
  );
  const [favorites, setFavorites] = usePersistentState(
    STORAGE_KEYS.favorites,
    [],
    (raw) => normalizeFavorites(raw, dexMap),
  );
  const [history, setHistory] = usePersistentState(
    STORAGE_KEYS.history,
    [],
    (raw) => normalizeSavedEntries(raw, dexMap),
  );
  const [page, setPage] = useState(readPageFromHash);
  const [drawRevision, setDrawRevision] = useState(0);
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef(new Map());
  const storageAvailable = useMemo(() => isStorageAvailable(), []);

  const notify = useCallback((message, type = 'info', duration = 4200) => {
    if (!message) return;
    const id = makeId();
    setToasts((currentToasts) => [...currentToasts.slice(-3), { id, message, type }]);
    const timer = window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
      toastTimers.current.delete(id);
    }, duration);
    toastTimers.current.set(id, timer);
  }, []);

  useEffect(() => () => {
    for (const timer of toastTimers.current.values()) window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageAvailable) {
      notify('浏览器阻止了 localStorage，本次设置仍可使用，但刷新后不会保留。', 'warning', 7000);
    }
  }, [storageAvailable, notify]);

  const navigate = useCallback((nextPage) => {
    if (!VALID_PAGES.includes(nextPage)) return;
    setPage(nextPage);
    if (window.location.hash !== `#/${nextPage}`) {
      window.location.hash = `#/${nextPage}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => setPage(readPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const timer = useChallengeTimer({
    onFinish: () => {
      playFinishChime();
      notify('挑战时间到！放下笔，看看完成的画面吧。', 'success', 9000);
    },
  });

  const candidatePool = useMemo(() => getCandidatePool(pokedex.dex, settings), [pokedex.dex, settings]);
  const poolSummary = useMemo(() => getPoolSummary(candidatePool, settings), [candidatePool, settings]);
  const poolValidation = useMemo(() => validatePool(candidatePool, settings), [candidatePool, settings]);
  const poolById = useMemo(() => new Map(candidatePool.map((pokemon) => [pokemon.id, pokemon])), [candidatePool]);

  const compositionPokemon = useMemo(
    () => getCompositionPokemon(current, dexMap),
    [current, dexMap],
  );
  const lockedEntries = useMemo(() => getLockedEntries(current), [current]);
  const lockedPokemon = useMemo(
    () => compositionPokemon.filter((pokemon) => pokemon.locked),
    [compositionPokemon],
  );
  const lockConflicts = useMemo(
    () => getLockConflictMap(lockedPokemon, settings),
    [lockedPokemon, settings],
  );
  const lockedCount = lockedEntries.length;
  const randomNeed = Math.max(0, settings.count - lockedCount);
  const conflictCount = Object.keys(lockConflicts).length;
  const lockedOverCount = lockedCount > settings.count;
  const candidatePoolEmpty = candidatePool.length === 0 && randomNeed > 0;
  const canGenerate = !lockedOverCount && !candidatePoolEmpty
    && settings.selectedGenerations.length > 0
    && settings.rangeMin <= settings.rangeMax;
  const sceneSummary = useMemo(() => getSceneSummary(current.scenes), [current.scenes]);
  const atmosphereSummary = useMemo(() => getAtmosphereSummary(settings), [settings]);
  const imagePreferenceSummary = useMemo(() => getImagePreferenceSummary(settings), [settings]);
  const compatibilityMode = getCompatibilityMode(settings.compatibilityMode);
  const compatibilityIssues = useMemo(
    () => getCompositionCompatibilityIssues(current.scenes, compositionPokemon, settings),
    [current.scenes, compositionPokemon, settings],
  );
  const pokemonPreferenceWeightFor = useCallback(
    (pokemon) => (
      getTypeDrawWeight(pokemon, settings)
      * getPokemonAtmosphereWeight(pokemon, settings)
      * getImagePreferenceWeight(pokemon, settings)
    ),
    [settings],
  );
  const galleryImageMap = useMemo(
    () => new Map(gallery.images.map((image) => [image.id, image])),
    [gallery.images],
  );
  const referenceCandidates = useMemo(
    () => getReferenceCandidates(gallery.images, settings.referenceCategories),
    [gallery.images, settings.referenceCategories],
  );
  const currentReferenceImage = current.reference?.imageId
    ? galleryImageMap.get(current.reference.imageId) || null
    : null;

  useEffect(() => {
    if (gallery.status !== 'ready') return;
    const reference = current.reference;
    if (!reference?.imageId) return;
    const image = galleryImageMap.get(reference.imageId);
    if (image && image.usage === 'reference') return;
    setCurrent((previous) => {
      if (previous.reference?.imageId !== reference.imageId) return previous;
      return {
        ...previous,
        reference: clearReferenceSelection(previous.reference),
        updatedAt: new Date().toISOString(),
      };
    });
    if (reference.locked) {
      notify('当前锁定的参考图片已被删除或改为个人作品，参考图片已清空。', 'warning', 6500);
    }
  }, [gallery.status, galleryImageMap, current.reference, setCurrent, notify]);

  const updateSettings = useCallback((patchOrUpdater) => {
    setSettings((previous) => {
      const patch = typeof patchOrUpdater === 'function' ? patchOrUpdater(previous) : patchOrUpdater;
      return normalizeSettings({ ...previous, ...patch });
    });
  }, [setSettings]);

  const replaceSettings = useCallback((next) => {
    setSettings(normalizeSettings(next));
  }, [setSettings]);

  const toggleGeneration = useCallback((generationId) => {
    updateSettings((previous) => ({
      selectedGenerations: previous.selectedGenerations.includes(generationId)
        ? previous.selectedGenerations.filter((id) => id !== generationId)
        : [...previous.selectedGenerations, generationId].sort((a, b) => a - b),
    }));
  }, [updateSettings]);

  const selectAllGenerations = useCallback(() => {
    updateSettings({ selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
  }, [updateSettings]);

  const clearGenerations = useCallback(() => {
    updateSettings({ selectedGenerations: [] });
  }, [updateSettings]);

  const togglePreferredType = useCallback((typeId) => {
    updateSettings((previous) => ({
      preferredTypes: previous.preferredTypes.includes(typeId)
        ? previous.preferredTypes.filter((id) => id !== typeId)
        : [...previous.preferredTypes, typeId],
    }));
  }, [updateSettings]);

  const setTypeWeight = useCallback((typeId, weight) => {
    updateSettings((previous) => ({
      typeWeights: {
        ...previous.typeWeights,
        [typeId]: Math.min(9, Math.max(1, Number(weight) || 1)),
      },
    }));
  }, [updateSettings]);

  const addAppearanceTag = useCallback((tag) => {
    const clean = String(tag || '').trim();
    if (!clean) return;
    updateSettings((previous) => ({
      appearanceTags: previous.appearanceTags.includes(clean)
        ? previous.appearanceTags
        : [...previous.appearanceTags, clean].slice(0, 12),
    }));
  }, [updateSettings]);

  const removeAppearanceTag = useCallback((tag) => {
    updateSettings((previous) => ({
      appearanceTags: previous.appearanceTags.filter((item) => item !== tag),
    }));
  }, [updateSettings]);

  const resetSettings = useCallback(() => {
    setSettings(createDefaultSettings());
    notify('筛选设置已恢复默认。', 'success');
  }, [setSettings, notify]);

  const recordHistory = useCallback((composition, action) => {
    if (!composition?.pokemon?.length) return;
    const snapshot = snapshotComposition(composition, dexMap);
    if (!snapshot.pokemon.length) return;
    const entry = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      action,
      title: getSavedSnapshotTitle(snapshot),
      composition: snapshot,
    };
    setHistory((previous) => [entry, ...previous].slice(0, MAX_HISTORY));
  }, [dexMap, setHistory]);

  const commitComposition = useCallback((composition, action, { record = true } = {}) => {
    const now = new Date().toISOString();
    const next = {
      ...composition,
      createdAt: composition.createdAt || now,
      updatedAt: now,
    };
    setCurrent(next);
    if (record) recordHistory(next, action);
    return next;
  }, [recordHistory, setCurrent]);

  const randomizeAll = useCallback(({ includeScenes = true, includeReference = true, label = '整体随机' } = {}) => {
    if (lockedOverCount) {
      notify(`已锁定 ${lockedCount} 只，超过本轮数量 ${settings.count} 只。请先调整数量或解除锁定。`, 'error', 6000);
      return { ok: false };
    }
    if (candidatePoolEmpty) {
      notify('候选池为空，无法随机。请放宽世代、编号范围或属性筛选。', 'error', 6000);
      return { ok: false };
    }

    const result = drawPokemonSelection({
      pool: candidatePool,
      count: settings.count,
      lockedEntries,
      settings,
      weightFn: pokemonPreferenceWeightFor,
    });
    if (result.error) {
      notify(result.error, 'error', 6500);
      return { ok: false, error: result.error };
    }

    const pickedPokemon = result.slots
      .map((slot) => dexMap.get(slot.id))
      .filter(Boolean);
    const sceneResult = includeScenes
      ? generateSceneState({
        sceneState: current.scenes,
        pokemonList: pickedPokemon,
        settings,
      })
      : { scenes: current.scenes, warnings: [], issues: [] };
    const next = {
      pokemon: result.slots,
      scenes: sceneResult.scenes,
      reference: includeReference && gallery.status === 'ready'
        ? randomizeReferenceState(current.reference, referenceCandidates)
        : { ...current.reference },
      createdAt: null,
      updatedAt: null,
    };
    commitComposition(next, label);
    setDrawRevision((revision) => revision + 1);
    if (result.warning) notify(result.warning, 'warning', 6500);
    if (includeScenes && sceneResult.warnings.length) notify(sceneResult.warnings[0], 'warning', 7000);
    if (includeScenes && sceneResult.issues.length) {
      notify(
        `当前画面有 ${sceneResult.issues.length} 处词条冲突，可能是锁定内容造成的。软件已保留锁定项，请在工作台查看提示。`,
        'warning',
        7500,
      );
    }
    if (conflictCount) {
      notify(`有 ${conflictCount} 只锁定宝可梦不符合当前硬性筛选，已保留并在画面中标记。`, 'warning', 6500);
    }
    return {
      ok: true,
      warning: result.warning,
      issues: includeScenes ? sceneResult.issues : [],
    };
  }, [
    lockedOverCount, lockedCount, settings, candidatePoolEmpty, notify, candidatePool,
    lockedEntries, dexMap, current.scenes, current.reference, referenceCandidates,
    gallery.status, commitComposition, conflictCount, pokemonPreferenceWeightFor,
  ]);

  const rerollSinglePokemon = useCallback((slotIndex) => {
    const entry = current.pokemon[slotIndex];
    if (!entry) {
      notify('没有找到要重抽的宝可梦。', 'error');
      return false;
    }
    if (entry.locked) {
      notify('该宝可梦已锁定，请先解除锁定。', 'warning');
      return false;
    }
    if (lockedOverCount) {
      notify(`已锁定 ${lockedCount} 只，超过本轮数量 ${settings.count} 只，请先调整。`, 'error');
      return false;
    }
    if (!candidatePool.length) {
      notify('候选池为空，无法重抽宝可梦。', 'error');
      return false;
    }

    const result = drawSingleReplacement({
      pool: candidatePool,
      currentEntries: current.pokemon,
      slotIndex,
      settings,
      weightFn: pokemonPreferenceWeightFor,
    });
    if (result.error) {
      notify(result.error, 'error');
      return false;
    }
    if (!result.id) {
      notify('本次没有抽到新的宝可梦。', 'warning');
      return false;
    }

    const pokemonSlots = current.pokemon.map((item, index) => (
      index === slotIndex ? { id: result.id, locked: false } : item
    ));
    commitComposition({
      ...current,
      pokemon: pokemonSlots,
    }, '重抽宝可梦');
    if (result.warning) notify(result.warning, 'warning', 6000);
    return true;
  }, [current, notify, lockedOverCount, lockedCount, settings, candidatePool, dexMap, commitComposition, pokemonPreferenceWeightFor]);

  const rerollScene = useCallback((moduleKey) => {
    const module = SCENE_MODULE_MAP[moduleKey];
    const scene = current.scenes[moduleKey];
    if (!module || !scene) return false;
    if (!scene.enabled) {
      notify(`「${module.title}」已关闭，开启后才能重抽。`, 'warning');
      return false;
    }
    if (scene.locked) {
      notify(`「${module.title}」已锁定，请先解除锁定。`, 'warning');
      return false;
    }
    const result = rerollSceneWithCompatibility({
      sceneState: current.scenes,
      moduleKey,
      pokemonList: compositionPokemon,
      settings,
    });
    if (!result.ok) {
      notify(result.error, 'warning', 6500);
      return false;
    }
    commitComposition({ ...current, scenes: result.scenes }, `重抽${module.title}`);
    if (result.issues?.length) {
      notify(`「${module.title}」已重抽，但画面仍保留 ${result.issues.length} 处锁定冲突。`, 'warning', 6000);
    }
    return true;
  }, [current, compositionPokemon, settings, commitComposition, notify]);

  const randomizeScenesOnly = useCallback(() => {
    if (!compositionPokemon.length) {
      notify('先抽取宝可梦，才能生成场景。', 'warning');
      return { ok: false };
    }
    const result = generateSceneState({
      sceneState: current.scenes,
      pokemonList: compositionPokemon,
      settings,
    });
    commitComposition({ ...current, scenes: result.scenes }, '重新生成场景');
    if (result.warnings?.length) notify(result.warnings[0], 'warning', 6500);
    if (result.issues?.length) {
      notify(`画面仍有 ${result.issues.length} 处锁定冲突，已保留锁定项。`, 'warning', 6500);
    }
    return { ok: true, ...result };
  }, [compositionPokemon, current, settings, commitComposition, notify]);

  const toggleSceneEnabled = useCallback((moduleKey) => {
    const module = SCENE_MODULE_MAP[moduleKey];
    const scene = current.scenes[moduleKey];
    if (!module || !scene) return;
    if (scene.locked) {
      notify(`「${module.title}」已锁定，解除锁定后才能关闭。`, 'warning');
      return;
    }
    const enabled = !scene.enabled;
    let value = scene.value;
    if (enabled && !value) {
      const scenes = rerollSingleScene({ ...current.scenes, [moduleKey]: { ...scene, enabled: true } }, moduleKey, compositionPokemon);
      value = scenes[moduleKey]?.value || value;
    }
    setCurrent({
      ...current,
      scenes: {
        ...current.scenes,
        [moduleKey]: { ...scene, enabled, value },
      },
      updatedAt: new Date().toISOString(),
    });
  }, [current, compositionPokemon, notify, setCurrent]);

  const toggleSceneLock = useCallback((moduleKey) => {
    const scene = current.scenes[moduleKey];
    if (!scene) return;
    setCurrent({
      ...current,
      scenes: {
        ...current.scenes,
        [moduleKey]: { ...scene, locked: !scene.locked },
      },
      updatedAt: new Date().toISOString(),
    });
  }, [current, setCurrent]);

  const toggleReferenceEnabled = useCallback(() => {
    const reference = current.reference;
    if (reference.locked) {
      notify('参考图片已锁定，解除锁定后才能关闭模块。', 'warning');
      return;
    }
    const enabled = !reference.enabled;
    let nextReference = { ...reference, enabled };
    if (enabled && !reference.imageId) {
      const image = pickReferenceImage(referenceCandidates, reference.imageId);
      nextReference = buildReferenceSelection(nextReference, image);
    }
    setCurrent({
      ...current,
      reference: nextReference,
      updatedAt: new Date().toISOString(),
    });
  }, [current, referenceCandidates, setCurrent, notify]);

  const toggleReferenceLock = useCallback(() => {
    const reference = current.reference;
    if (!reference.imageId) {
      notify('当前没有参考图片可锁定。先抽取或选择一张参考图。', 'warning');
      return;
    }
    if (!reference.enabled) {
      notify('参考图片模块已关闭，开启后才能锁定。', 'warning');
      return;
    }
    setCurrent({
      ...current,
      reference: { ...reference, locked: !reference.locked },
      updatedAt: new Date().toISOString(),
    });
  }, [current, setCurrent, notify]);

  const rerollReference = useCallback(() => {
    const reference = current.reference;
    if (!reference.enabled) {
      notify('参考图片模块已关闭，开启后才能重抽。', 'warning');
      return false;
    }
    if (reference.locked) {
      notify('参考图片已锁定，请先解除锁定。', 'warning');
      return false;
    }
    if (!referenceCandidates.length) {
      notify('图库中没有符合当前分类的参考素材。请上传素材或调整参考分类。', 'warning', 6500);
      return false;
    }
    const image = pickReferenceImage(referenceCandidates, reference.imageId);
    if (!image) {
      notify('没有找到可用的参考图片。', 'warning');
      return false;
    }
    if (image.id === reference.imageId) {
      notify('当前分类下只有这一张参考图，已保留原图。', 'info');
      return true;
    }
    commitComposition({
      ...current,
      reference: buildReferenceSelection(reference, image),
    }, '重抽参考图片');
    return true;
  }, [current, referenceCandidates, commitComposition, notify]);

  const toggleReferenceCategory = useCallback((categoryId) => {
    if (!REFERENCE_CATEGORY_IDS.includes(categoryId)) return;
    const selected = settings.referenceCategories.includes(categoryId);
    if (selected && settings.referenceCategories.length === 1) {
      notify('参考图片至少需要保留一个素材分类。', 'warning');
      return;
    }
    updateSettings({
      referenceCategories: selected
        ? settings.referenceCategories.filter((id) => id !== categoryId)
        : [...settings.referenceCategories, categoryId],
    });
  }, [settings.referenceCategories, updateSettings, notify]);

  const toggleCurrentPokemonLock = useCallback((slotIndex) => {
    const entry = current.pokemon[slotIndex];
    if (!entry) return false;
    if (!entry.locked && lockedCount + 1 > settings.count) {
      notify(`本轮数量为 ${settings.count} 只，已锁定 ${lockedCount} 只，不能再锁定更多。请增加数量。`, 'error', 6000);
      return false;
    }
    setCurrent(togglePokemonLock(current, slotIndex));
    return true;
  }, [current, lockedCount, settings.count, setCurrent, notify]);

  const addLockedPokemon = useCallback((pokemon) => {
    if (!pokemon) return false;
    const lockedIndex = current.pokemon.findIndex((entry) => entry.id === pokemon.id && entry.locked);
    if (lockedIndex >= 0) {
      notify(`${getPokemonDisplayName(pokemon)} 已在本轮锁定中。`, 'info');
      return false;
    }
    const unlockedIndex = current.pokemon.findIndex((entry) => entry.id === pokemon.id && !entry.locked);
    if (unlockedIndex >= 0) {
      if (lockedCount + 1 > settings.count) {
        notify(`本轮数量为 ${settings.count} 只，已锁定 ${lockedCount} 只，不能再锁定更多。`, 'error', 6000);
        return false;
      }
      setCurrent(togglePokemonLock(current, unlockedIndex));
      notify(`已锁定 ${getPokemonDisplayName(pokemon)}。`, 'success');
      return true;
    }

    if (current.pokemon.length >= settings.count) {
      notify(`本轮已满（${current.pokemon.length}/${settings.count}）。请先增加抽取数量或解除现有锁定。`, 'error', 6000);
      return false;
    }
    if (lockedCount >= settings.count) {
      notify(`锁定数量已达到本轮抽取数量 ${settings.count} 只，请先调整数量。`, 'error', 6000);
      return false;
    }

    const conflicts = getPokemonFilterConflicts(pokemon, settings);
    setCurrent({
      ...current,
      pokemon: [...current.pokemon, { id: pokemon.id, locked: true }],
      updatedAt: new Date().toISOString(),
    });
    if (conflicts.length) {
      notify(`已锁定 ${getPokemonDisplayName(pokemon)}，但它不符合当前筛选：${conflicts.join('；')}。软件不会自动替换它。`, 'warning', 8000);
    } else {
      notify(`已锁定 ${getPokemonDisplayName(pokemon)}。`, 'success');
    }
    return true;
  }, [current, lockedCount, settings, setCurrent, notify]);

  const clearComposition = useCallback(() => {
    setCurrent(createEmptyComposition(createSceneState()));
    notify('本轮画面已清空。', 'info');
  }, [setCurrent, notify]);

  const addSnapshotToFavorites = useCallback((snapshot) => {
    if (!snapshot?.pokemon?.length) {
      notify('当前没有可收藏的宝可梦。先随机一轮吧。', 'warning');
      return false;
    }
    const signature = getCompositionSignature(snapshot);
    const duplicate = favorites.some((favorite) => getCompositionSignature(favorite.composition) === signature);
    if (duplicate) {
      notify('这个完整组合已经在收藏里了。', 'info');
      return false;
    }
    const entry = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      title: getSavedSnapshotTitle(snapshot),
      composition: snapshot,
    };
    setFavorites((previous) => [entry, ...previous].slice(0, MAX_FAVORITES));
    notify('已收藏当前绘画组合。', 'success');
    return true;
  }, [favorites, notify, setFavorites]);

  const saveCurrentToFavorites = useCallback(() => {
    if (!current.pokemon.length) {
      notify('当前没有可收藏的宝可梦。先随机一轮吧。', 'warning');
      return false;
    }
    const snapshot = snapshotComposition(current, dexMap);
    return addSnapshotToFavorites(snapshot);
  }, [current, dexMap, addSnapshotToFavorites, notify]);

  const removeFavorite = useCallback((favoriteId) => {
    setFavorites((previous) => previous.filter((favorite) => favorite.id !== favoriteId));
    notify('已取消收藏。', 'info');
  }, [setFavorites, notify]);

  const loadSnapshot = useCallback((snapshot) => {
    if (!snapshot?.pokemon?.length) {
      notify('这个组合没有可载入的宝可梦。', 'error');
      return false;
    }
    const next = hydrateComposition(snapshot, dexMap);
    setCurrent(next);
    navigate('workbench');
    notify('组合已载入随机工作台。', 'success');
    return true;
  }, [dexMap, setCurrent, navigate, notify]);

  const loadFavorite = useCallback((favoriteId) => {
    const favorite = favorites.find((item) => item.id === favoriteId);
    if (!favorite) {
      notify('没有找到这条收藏。', 'error');
      return false;
    }
    return loadSnapshot(favorite.composition);
  }, [favorites, loadSnapshot, notify]);

  const addHistoryToFavorites = useCallback((historyId) => {
    const entry = history.find((item) => item.id === historyId);
    if (!entry) {
      notify('没有找到这条历史记录。', 'error');
      return false;
    }
    return addSnapshotToFavorites(entry.composition);
  }, [history, addSnapshotToFavorites, notify]);

  const loadHistory = useCallback((historyId) => {
    const entry = history.find((item) => item.id === historyId);
    if (!entry) {
      notify('没有找到这条历史记录。', 'error');
      return false;
    }
    return loadSnapshot(entry.composition);
  }, [history, loadSnapshot, notify]);

  const deleteHistory = useCallback((historyId) => {
    setHistory((previous) => previous.filter((entry) => entry.id !== historyId));
    notify('历史记录已删除。', 'info');
  }, [setHistory, notify]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    notify('历史记录已清空。', 'info');
  }, [setHistory, notify]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    notify('收藏已清空。', 'info');
  }, [setFavorites, notify]);

  const updateGalleryImage = useCallback(async (id, patch) => {
    try {
      const next = await gallery.updateImage(id, patch);
      if (current.reference?.imageId === id) {
        if (next.usage !== 'reference') {
          setCurrent((previous) => ({
            ...previous,
            reference: clearReferenceSelection(previous.reference),
            updatedAt: new Date().toISOString(),
          }));
          notify('这张图片已改为个人作品，已从参考图片模块中移除。', 'info', 6000);
        } else {
          setCurrent((previous) => ({
            ...previous,
            reference: buildReferenceSelection(previous.reference, next),
            updatedAt: new Date().toISOString(),
          }));
        }
      }
      notify('图库信息已更新。', 'success');
      return { ok: true, image: next };
    } catch (updateError) {
      console.error('[Pokémon Drawing Lab] 图库更新失败', updateError);
      notify(describeGalleryError(updateError), 'error', 6000);
      return { ok: false, error: describeGalleryError(updateError) };
    }
  }, [gallery, current.reference, setCurrent, notify]);

  const toggleGalleryFavorite = useCallback(async (id) => {
    try {
      const next = await gallery.toggleFavorite(id);
      notify(next.favorite ? '已加入图库收藏。' : '已取消图库收藏。', 'success');
      return { ok: true, image: next };
    } catch (favoriteError) {
      notify(describeGalleryError(favoriteError), 'error', 6000);
      return { ok: false, error: describeGalleryError(favoriteError) };
    }
  }, [gallery, notify]);

  const deleteGalleryImage = useCallback(async (id) => {
    try {
      const image = gallery.images.find((item) => item.id === id);
      await gallery.deleteImage(id);
      if (current.reference?.imageId === id) {
        setCurrent((previous) => ({
          ...previous,
          reference: clearReferenceSelection(previous.reference),
          updatedAt: new Date().toISOString(),
        }));
      }
      notify(`已从图库删除「${image?.name || '图片'}」，IndexedDB 文件已同步清理。`, 'success', 5500);
      return { ok: true };
    } catch (deleteError) {
      notify(describeGalleryError(deleteError), 'error', 6000);
      return { ok: false, error: describeGalleryError(deleteError) };
    }
  }, [gallery, current.reference, setCurrent, notify]);

  const refreshGallery = useCallback(async () => gallery.refresh(), [gallery]);

  const syncRangeForSettings = useCallback(async () => {
    const ids = getGenerationIds(settings);
    const result = await pokedex.syncRange(ids);
    if (result?.ok) notify('图鉴同步完成，已更新本地缓存。', 'success');
    else if (!result?.aborted) notify('图鉴同步失败，软件继续使用本地缓存。', 'warning', 6500);
    return result;
  }, [settings, pokedex, notify]);

  const dismissToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    toastTimers.current.delete(id);
  }, []);

  const value = useMemo(() => ({
    page,
    drawRevision,
    navigate,
    settings,
    updateSettings,
    replaceSettings,
    resetSettings,
    toggleGeneration,
    selectAllGenerations,
    clearGenerations,
    togglePreferredType,
    setTypeWeight,
    addAppearanceTag,
    removeAppearanceTag,
    imageMode: settings.imageMode,
    setImageMode: (imageMode) => updateSettings({ imageMode }),
    dex: pokedex.dex,
    dexMap,
    candidatePool,
    poolById,
    poolSummary,
    poolValidation,
    current,
    compositionPokemon,
    sceneSummary,
    atmosphereSummary,
    imagePreferenceSummary,
    compatibilityMode,
    compatibilityIssues,
    lockedEntries,
    lockedPokemon,
    lockedCount,
    randomNeed,
    lockConflicts,
    conflictCount,
    lockedOverCount,
    candidatePoolEmpty,
    canGenerate,
    randomizeAll,
    randomizeScenesOnly,
    rerollSinglePokemon,
    rerollScene,
    toggleSceneEnabled,
    toggleSceneLock,
    toggleCurrentPokemonLock,
    addLockedPokemon,
    clearComposition,
    referenceCandidates,
    currentReferenceImage,
    toggleReferenceEnabled,
    toggleReferenceLock,
    rerollReference,
    toggleReferenceCategory,
    saveCurrentToFavorites,
    addSnapshotToFavorites,
    favorites,
    removeFavorite,
    loadFavorite,
    history,
    loadHistory,
    addHistoryToFavorites,
    deleteHistory,
    clearHistory,
    clearFavorites,
    timer,
    toasts,
    notify,
    dismissToast,
    storageAvailable,
    pokedex,
    syncRangeForSettings,
    gallery,
    galleryImageMap,
    addGalleryImages: gallery.addImages,
    updateGalleryImage,
    toggleGalleryFavorite,
    deleteGalleryImage,
    refreshGallery,
    getGalleryImageBlob: gallery.getImageBlob,
  }), [
    page, drawRevision, navigate, settings, updateSettings, replaceSettings, resetSettings, toggleGeneration,
    selectAllGenerations, clearGenerations, togglePreferredType, setTypeWeight, addAppearanceTag,
    removeAppearanceTag, pokedex.dex, dexMap, candidatePool, poolById, poolSummary, poolValidation,
    current, compositionPokemon, sceneSummary, atmosphereSummary, imagePreferenceSummary,
    compatibilityMode, compatibilityIssues, lockedEntries, lockedPokemon, lockedCount, randomNeed,
    lockConflicts, conflictCount, lockedOverCount, candidatePoolEmpty, canGenerate, randomizeAll,
    randomizeScenesOnly, rerollSinglePokemon, rerollScene, toggleSceneEnabled, toggleSceneLock, toggleCurrentPokemonLock,
    addLockedPokemon, clearComposition, referenceCandidates, currentReferenceImage,
    toggleReferenceEnabled, toggleReferenceLock, rerollReference, toggleReferenceCategory,
    saveCurrentToFavorites, addSnapshotToFavorites, favorites, removeFavorite, loadFavorite,
    history, loadHistory, addHistoryToFavorites, deleteHistory, clearHistory, clearFavorites,
    timer, toasts, notify, dismissToast, storageAvailable, syncRangeForSettings, gallery,
    galleryImageMap, updateGalleryImage, toggleGalleryFavorite, deleteGalleryImage,
    refreshGallery,
  ]);

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab() {
  const context = useContext(LabContext);
  if (!context) throw new Error('useLab 必须在 LabProvider 内使用');
  return context;
}
