import {
  INSPIRATION_MATERIALS,
  INSPIRATION_MOODS,
  INSPIRATION_PALETTES,
} from '../data/inspiration.js';
import {
  COLOR_ROLE_CONFIG,
  COLOR_ROLE_LABELS,
  DEFAULT_COLOR_ROLE_CONFIG,
} from '../data/colorReference.js';
import { getActiveAtmospheres, getAtmosphereStrength } from '../data/atmospheres.js';
import { getImagePreferenceThemeWeight } from './imagePreferenceEngine.js';
import { weightedPick } from './random.js';

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `color-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function typeMatchScore(typesA, typesB) {
  const set = new Set(typesA || []);
  return (typesB || []).reduce((sum, type) => sum + (set.has(type) ? 1 : 0), 0);
}

function atmospherePaletteWeight(palette, settings) {
  const active = getActiveAtmospheres(settings);
  if (!active.length) return 1;
  const strength = getAtmosphereStrength(settings);
  const paletteTags = new Set([...(palette.types || []), ...(palette.scenes || []), ...(palette.moods || [])]);
  let score = 0;
  for (const atmosphere of active) {
    for (const type of palette.types || []) {
      if (atmosphere.typeWeights?.[type]) score += 1;
    }
    for (const tag of [...(atmosphere.sceneTags || []), ...(atmosphere.visualTags || [])]) {
      if (paletteTags.has(tag)) score += 1;
    }
  }
  return 1 + score * 0.26 * strength.factor;
}

function paletteWeight(palette, pokemonList, inspiration, settings) {
  const types = [...new Set((pokemonList || []).flatMap((pokemon) => pokemon.types || []))];
  const meta = inspiration?.meta || {};
  let weight = 1;
  weight += typeMatchScore(types, palette.types) * 2;
  weight += typeMatchScore(meta.themeTypes, palette.types) * 1.5;
  weight += typeMatchScore(meta.themeScenes, palette.scenes) * 1.5;
  weight += typeMatchScore(meta.themeMoods, palette.moods) * 1.2;
  weight *= atmospherePaletteWeight(palette, settings);
  weight *= getImagePreferenceThemeWeight(palette, settings);
  return Math.max(0.05, weight);
}

function buildRoles(palette) {
  const config = COLOR_ROLE_CONFIG[palette.id] || DEFAULT_COLOR_ROLE_CONFIG;
  const colors = palette.colors || [];
  const indexes = [config.main, config.secondary, config.accent].map((index) => (
    Math.min(colors.length - 1, Math.max(0, index))
  ));
  const [mainIndex, secondaryIndex, accentIndex] = indexes;
  const roleColor = (index, ratio, label) => ({
    hex: colors[index] || colors[0] || '#000000',
    label,
    ratio,
  });
  const main = roleColor(mainIndex, config.ratios[0], COLOR_ROLE_LABELS.main);
  const secondary = roleColor(secondaryIndex, config.ratios[1], COLOR_ROLE_LABELS.secondary);
  const accent = roleColor(accentIndex, config.ratios[2], COLOR_ROLE_LABELS.accent);
  const used = new Set(indexes);
  const support = colors
    .map((hex, index) => ({ hex, index }))
    .filter((item) => !used.has(item.index))
    .slice(0, 2)
    .map((item) => item.hex);
  return {
    main,
    secondary,
    accent,
    support,
    ratios: [...config.ratios],
  };
}

export function getPaletteRoles(palette) {
  return buildRoles(palette);
}

export function getPaletteColorValue(palette, moodText = '', materialText = '') {
  if (!palette?.colors?.length) return null;
  return {
    paletteId: palette.id,
    name: palette.name,
    description: palette.description,
    colors: [...palette.colors],
    ...getPaletteRoles(palette),
    moodText,
    materialText,
  };
}

function chooseMood(palette, rng) {
  const pool = INSPIRATION_MOODS.filter((mood) => (
    !palette.moods?.length || !mood.tags?.length || mood.tags.some((tag) => palette.moods.includes(tag))
  ));
  return weightedPick(pool.length ? pool : INSPIRATION_MOODS, () => 1, rng) || INSPIRATION_MOODS[0];
}

export function createEmptyColorReference() {
  return {
    id: makeId(),
    sourceSignature: '',
    themeSignature: '',
    locked: false,
    value: null,
    createdAt: null,
    updatedAt: null,
  };
}

export function normalizeColorReference(raw) {
  const base = createEmptyColorReference();
  if (!raw || typeof raw !== 'object') return base;
  const role = (rawRole, fallback) => (
    rawRole && typeof rawRole === 'object' && /^#[0-9a-f]{6}$/i.test(String(rawRole.hex || ''))
      ? {
        hex: String(rawRole.hex),
        label: String(rawRole.label || fallback).slice(0, 12),
        ratio: Math.max(0, Math.min(100, Number(rawRole.ratio) || 0)),
      }
      : null
  );
  const main = raw.value ? role(raw.value.main, '主色') : null;
  const secondary = raw.value ? role(raw.value.secondary, '辅助色') : null;
  const accent = raw.value ? role(raw.value.accent, '点缀色') : null;
  const value = raw.value && typeof raw.value === 'object' && Array.isArray(raw.value.colors) && main && secondary && accent
    ? {
      paletteId: String(raw.value.paletteId || 'palette'),
      name: String(raw.value.name || '配色方案').slice(0, 50),
      description: String(raw.value.description || '').slice(0, 200),
      colors: raw.value.colors.map(String).filter((color) => /^#[0-9a-f]{6}$/i.test(color)).slice(0, 8),
      main,
      secondary,
      accent,
      support: Array.isArray(raw.value.support) ? raw.value.support.map(String).slice(0, 4) : [],
      ratios: Array.isArray(raw.value.ratios) ? raw.value.ratios.map(Number).slice(0, 3) : [],
      moodText: String(raw.value.moodText || '').slice(0, 200),
      materialText: String(raw.value.materialText || '').slice(0, 200),
    }
    : null;
  return {
    ...base,
    id: raw.id ? String(raw.id) : base.id,
    sourceSignature: String(raw.sourceSignature || ''),
    themeSignature: String(raw.themeSignature || ''),
    locked: Boolean(raw.locked),
    value,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function generateColorReference({
  previous,
  pokemonList,
  inspiration,
  settings,
  rng = Math.random,
}) {
  if (!pokemonList?.length) {
    return createEmptyColorReference();
  }
  const base = previous ? normalizeColorReference(previous) : createEmptyColorReference();
  if (base.locked) return base;
  const candidates = INSPIRATION_PALETTES.filter((palette) => palette.id !== base.value?.paletteId);
  const palette = weightedPick(
    candidates.length ? candidates : INSPIRATION_PALETTES,
    (item) => paletteWeight(item, pokemonList, inspiration, settings),
    rng,
  ) || INSPIRATION_PALETTES[0];
  const roles = buildRoles(palette);
  const mood = chooseMood(palette, rng);
  const material = INSPIRATION_MATERIALS[Math.floor(rng() * INSPIRATION_MATERIALS.length)] || INSPIRATION_MATERIALS[0];
  const now = new Date().toISOString();
  return {
    ...base,
    id: base.createdAt ? base.id : makeId(),
    sourceSignature: pokemonList.map((pokemon) => pokemon.id).join('-'),
    themeSignature: inspiration?.dimensions?.theme?.value || '',
    value: {
      paletteId: palette.id,
      name: palette.name,
      description: palette.description,
      colors: [...palette.colors],
      ...roles,
      moodText: mood.text,
      materialText: material.text,
    },
    createdAt: base.createdAt || now,
    updatedAt: now,
  };
}

export function buildColorCopyText(colorReference) {
  const value = colorReference?.value;
  if (!value) return '';
  return [
    `${value.name}：${value.description}`,
    `${value.main.label} ${value.main.hex} · ${value.main.ratio}%`,
    `${value.secondary.label} ${value.secondary.hex} · ${value.secondary.ratio}%`,
    `${value.accent.label} ${value.accent.hex} · ${value.accent.ratio}%`,
    `扩展色 ${value.support.join(' / ')}`,
  ].join('\n');
}
