import { POKEMON_TYPES } from './types.js';
import { DEX_MAX, DEX_MIN } from './generations.js';
import { REFERENCE_CATEGORY_IDS } from './gallery.js';
import { ATMOSPHERES, ATMOSPHERE_MODE_OPTIONS, ATMOSPHERE_STRENGTH_OPTIONS } from './atmospheres.js';
import { COMPATIBILITY_MODE_OPTIONS } from './compatibility.js';
import {
  IMAGE_PREFERENCES,
  IMAGE_PREFERENCE_MODE_OPTIONS,
  IMAGE_PREFERENCE_STRENGTH_OPTIONS,
} from './imagePreferences.js';

export const MAX_DRAW_COUNT = 100;
export const MIN_DRAW_COUNT = 1;

export const EVOLUTION_STAGES = [
  { value: 0, label: '未进化' },
  { value: 1, label: '1阶进化' },
  { value: 2, label: '2阶进化' },
  { value: 3, label: '3阶及以上' },
];

export const BODY_SHAPES = [
  { id: 'ball', label: '球形' },
  { id: 'squiggle', label: '软体' },
  { id: 'fish', label: '鱼形' },
  { id: 'arms', label: '双臂形' },
  { id: 'blob', label: '团状' },
  { id: 'upright', label: '直立形' },
  { id: 'legs', label: '双腿形' },
  { id: 'quadruped', label: '四足形' },
  { id: 'wings', label: '翼形' },
  { id: 'tentacles', label: '触手形' },
  { id: 'heads', label: '多头形' },
  { id: 'humanoid', label: '人形' },
  { id: 'bug-wings', label: '虫翼形' },
  { id: 'armor', label: '装甲形' },
  { id: 'arms-legs', label: '手足形' },
];

export const APPEARANCE_TAG_SUGGESTIONS = ['毛茸茸', '圆润', '细长', '机械感', '复古', '可爱', '威严', '幼小'];

export const IMAGE_MODES = [
  { id: 'artwork', label: '官方 Artwork', hint: '高分辨率官方插画' },
  { id: 'sprite', label: '游戏像素 Sprite', hint: '经典像素立绘' },
];

export const createDefaultSettings = () => ({
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  rangeMin: DEX_MIN,
  rangeMax: DEX_MAX,
  count: 3,
  duplicateMode: 'avoid',
  typeMode: 'weighted',
  preferredTypes: [],
  typeWeights: Object.fromEntries(POKEMON_TYPES.map((type) => [type.id, 2])),
  includeLegendary: true,
  includeMythical: true,
  evolutionStages: [],
  bodyShapes: [],
  appearanceTags: [],
  imageMode: 'artwork',
  referenceCategories: [...REFERENCE_CATEGORY_IDS],
  atmosphereMode: 'off',
  atmospheres: [],
  customAtmospheres: [],
  atmosphereStrength: 'standard',
  compatibilityMode: 'reasonable',
  imagePreferenceMode: 'off',
  imagePreferences: [],
  customImagePreferences: [],
  imagePreferenceStrength: 'standard',
});

export const DEFAULT_SETTINGS = createDefaultSettings();

const VALID_DUPLICATE_MODES = ['unique', 'allow', 'avoid'];
const VALID_TYPE_MODES = ['hard', 'weighted', 'off'];
const VALID_IMAGE_MODES = IMAGE_MODES.map((mode) => mode.id);
const VALID_ATMOSPHERE_MODES = ATMOSPHERE_MODE_OPTIONS.map((mode) => mode.id);
const VALID_ATMOSPHERE_IDS = ATMOSPHERES.map((item) => item.id);
const VALID_ATMOSPHERE_STRENGTHS = ATMOSPHERE_STRENGTH_OPTIONS.map((item) => item.id);
const VALID_COMPATIBILITY_MODES = COMPATIBILITY_MODE_OPTIONS.map((item) => item.id);
const VALID_IMAGE_PREFERENCE_MODES = IMAGE_PREFERENCE_MODE_OPTIONS.map((item) => item.id);
const VALID_IMAGE_PREFERENCE_IDS = IMAGE_PREFERENCES.map((item) => item.id);
const VALID_IMAGE_PREFERENCE_STRENGTHS = IMAGE_PREFERENCE_STRENGTH_OPTIONS.map((item) => item.id);

const clampInt = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const uniqueValidArray = (value, allowed) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value)].filter((item) => allowed.includes(item));
};

export function normalizeSettings(raw = {}) {
  const defaults = createDefaultSettings();
  const source = raw && typeof raw === 'object' ? raw : {};
  const selectedGenerations = Array.isArray(source.selectedGenerations)
    ? uniqueValidArray(source.selectedGenerations.map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    : defaults.selectedGenerations;

  const preferredTypes = uniqueValidArray(
    source.preferredTypes,
    POKEMON_TYPES.map((type) => type.id),
  );

  const typeWeights = { ...defaults.typeWeights };
  if (source.typeWeights && typeof source.typeWeights === 'object') {
    for (const type of POKEMON_TYPES) {
      typeWeights[type.id] = clampInt(source.typeWeights[type.id], 1, 9, 2);
    }
  }

  const atmosphereMode = VALID_ATMOSPHERE_MODES.includes(source.atmosphereMode)
    ? source.atmosphereMode
    : defaults.atmosphereMode;
  let atmospheres = uniqueValidArray(source.atmospheres, VALID_ATMOSPHERE_IDS);
  if (atmosphereMode === 'single') atmospheres = atmospheres.slice(0, 1);
  const customAtmospheres = Array.isArray(source.customAtmospheres)
    ? [...new Set(source.customAtmospheres.map((item) => String(item).trim()).filter(Boolean))]
      .map((item) => item.slice(0, 20))
      .slice(0, 3)
    : [];
  const imagePreferenceMode = VALID_IMAGE_PREFERENCE_MODES.includes(source.imagePreferenceMode)
    ? source.imagePreferenceMode
    : defaults.imagePreferenceMode;
  const imagePreferences = uniqueValidArray(source.imagePreferences, VALID_IMAGE_PREFERENCE_IDS);
  const customImagePreferences = Array.isArray(source.customImagePreferences)
    ? [...new Set(source.customImagePreferences.map((item) => String(item).trim()).filter(Boolean))]
      .map((item) => item.slice(0, 20))
      .slice(0, 3)
    : [];

  return {
    selectedGenerations,
    rangeMin: clampInt(source.rangeMin, DEX_MIN, DEX_MAX, defaults.rangeMin),
    rangeMax: clampInt(source.rangeMax, DEX_MIN, DEX_MAX, defaults.rangeMax),
    count: clampInt(source.count, MIN_DRAW_COUNT, MAX_DRAW_COUNT, defaults.count),
    duplicateMode: VALID_DUPLICATE_MODES.includes(source.duplicateMode)
      ? source.duplicateMode
      : defaults.duplicateMode,
    typeMode: VALID_TYPE_MODES.includes(source.typeMode)
      ? source.typeMode
      : defaults.typeMode,
    preferredTypes,
    typeWeights,
    includeLegendary: source.includeLegendary !== false,
    includeMythical: source.includeMythical !== false,
    evolutionStages: Array.isArray(source.evolutionStages)
      ? [...new Set(source.evolutionStages.map(Number))].filter((value) => value >= 0 && value <= 3)
      : [],
    bodyShapes: uniqueValidArray(source.bodyShapes, BODY_SHAPES.map((shape) => shape.id)),
    appearanceTags: Array.isArray(source.appearanceTags)
      ? [...new Set(source.appearanceTags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 12)
      : [],
    imageMode: VALID_IMAGE_MODES.includes(source.imageMode) ? source.imageMode : defaults.imageMode,
    referenceCategories: Array.isArray(source.referenceCategories)
      ? uniqueValidArray(source.referenceCategories, REFERENCE_CATEGORY_IDS)
      : defaults.referenceCategories,
    atmosphereMode,
    atmospheres,
    customAtmospheres,
    atmosphereStrength: VALID_ATMOSPHERE_STRENGTHS.includes(source.atmosphereStrength)
      ? source.atmosphereStrength
      : defaults.atmosphereStrength,
    compatibilityMode: VALID_COMPATIBILITY_MODES.includes(source.compatibilityMode)
      ? source.compatibilityMode
      : defaults.compatibilityMode,
    imagePreferenceMode,
    imagePreferences,
    customImagePreferences,
    imagePreferenceStrength: VALID_IMAGE_PREFERENCE_STRENGTHS.includes(source.imagePreferenceStrength)
      ? source.imagePreferenceStrength
      : defaults.imagePreferenceStrength,
  };
}
