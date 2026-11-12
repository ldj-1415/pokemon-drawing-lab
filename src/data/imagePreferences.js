const preference = (config) => ({
  typeWeights: {},
  traitWeights: {},
  themeTags: [],
  actionTags: [],
  interactionTags: [],
  compositionTags: [],
  visualTags: [],
  challengeTags: [],
  ...config,
});

/**
 * Image preferences are soft weights, not type bindings. Every preference
 * contributes both type affinity and derived appearance traits.
 */
export const IMAGE_PREFERENCES = [
  preference({
    id: 'cute',
    label: '可爱',
    icon: 'heart',
    color: '#c96f8b',
    description: '圆润、柔软、让人想靠近的可爱感。',
    typeWeights: { fairy: 1, normal: 1, water: 1, electric: 1, grass: 1 },
    traitWeights: { cute: 1, round: 0.8, soft: 0.7, small: 0.6, fluffy: 0.55 },
    themeTags: ['cozy', 'playful', 'gentle', 'warm'],
    actionTags: ['playing', 'sleeping', 'eating', 'dancing', 'sunbathing'],
    interactionTags: ['play-together', 'care', 'share-food', 'groom'],
    compositionTags: ['close-up', 'center-symmetry', 'rule-thirds'],
    visualTags: ['pastel', 'soft', 'warm', 'bright'],
    challengeTags: ['three-colors', 'thirty-min'],
  }),
  preference({
    id: 'cool',
    label: '帅气',
    icon: 'target',
    color: '#3f6fa0',
    description: '利落、克制、有轮廓力量感。',
    typeWeights: { fire: 1, dragon: 1, steel: 1, dark: 1, fighting: 1 },
    traitWeights: { cool: 1, sharp: 1, majestic: 0.8, energetic: 0.65, fierce: 0.5 },
    themeTags: ['cool', 'dramatic', 'urban', 'night', 'heroic'],
    actionTags: ['battling', 'running', 'flying', 'jumping', 'exploring'],
    interactionTags: ['compete', 'chase', 'cooperate'],
    compositionTags: ['low-angle', 'diagonal', 'silhouette', 'negative-space'],
    visualTags: ['hard', 'contrast', 'cool', 'cinematic', 'monochrome'],
    challengeTags: ['two-lights', 'rim-only'],
  }),
  preference({
    id: 'elegant',
    label: '优雅',
    icon: 'sparkles',
    color: '#8b6fa8',
    description: '线条舒展、姿态从容，带一点舞台感。',
    typeWeights: { fairy: 1, psychic: 1, ice: 1, water: 1, flying: 1 },
    traitWeights: { elegant: 1, majestic: 0.8, soft: 0.65, romantic: 0.55, cool: 0.45 },
    themeTags: ['elegant', 'romantic', 'gentle', 'dreamy', 'quiet'],
    actionTags: ['dancing', 'observing', 'flying', 'swimming', 'resting'],
    interactionTags: ['groom', 'observe', 'care'],
    compositionTags: ['center-symmetry', 'close-up', 'negative-space', 'leading-lines'],
    visualTags: ['pastel', 'soft', 'glow', 'cinematic', 'ethereal'],
    challengeTags: ['negative-space', 'rim-only'],
  }),
  preference({
    id: 'majestic',
    label: '威严',
    icon: 'lock',
    color: '#8a6b38',
    description: '体量、秩序与不可忽视的存在感。',
    typeWeights: { dragon: 1, steel: 1, rock: 1, ground: 1, psychic: 1 },
    traitWeights: { majestic: 1, giant: 0.8, fierce: 0.7, sharp: 0.6, cool: 0.5 },
    themeTags: ['majestic', 'epic', 'dramatic', 'heroic', 'silent'],
    actionTags: ['battling', 'observing', 'resting', 'flying', 'exploring'],
    interactionTags: ['compete', 'observe', 'cooperate'],
    compositionTags: ['low-angle', 'center-symmetry', 'silhouette', 'negative-space'],
    visualTags: ['cinematic', 'contrast', 'cool', 'monochrome', 'warm'],
    challengeTags: ['three-depths', 'rim-only'],
  }),
  preference({
    id: 'fluffy',
    label: '毛茸茸',
    icon: 'cloud',
    color: '#b07a58',
    description: '蓬松、柔软、边缘带绒毛的触感。',
    typeWeights: { normal: 1, fairy: 1, grass: 1, ice: 1 },
    traitWeights: { fluffy: 1, soft: 0.8, round: 0.7, cute: 0.6, warm: 0.5 },
    themeTags: ['cozy', 'warm', 'gentle', 'natural'],
    actionTags: ['sleeping', 'resting', 'eating', 'sunbathing', 'playing'],
    interactionTags: ['groom', 'care', 'share-food', 'play-together'],
    compositionTags: ['close-up', 'center-symmetry', 'rule-thirds'],
    visualTags: ['soft', 'warm', 'pastel', 'low-contrast', 'textured'],
    challengeTags: ['three-colors', 'no-black'],
  }),
  preference({
    id: 'small',
    label: '小巧',
    icon: 'sparkles',
    color: '#6e9b78',
    description: '迷你、轻盈，需要画面给它留出尺度感。',
    typeWeights: { electric: 1, fairy: 1, normal: 1, bug: 1 },
    traitWeights: { small: 1, cute: 0.8, round: 0.6, soft: 0.5 },
    themeTags: ['cozy', 'playful', 'quiet', 'gentle'],
    actionTags: ['playing', 'jumping', 'foraging', 'hiding', 'eating'],
    interactionTags: ['play-together', 'chase', 'care', 'help'],
    compositionTags: ['close-up', 'top-down', 'rule-thirds', 'negative-space'],
    visualTags: ['pastel', 'bright', 'soft', 'warm'],
    challengeTags: ['one-moment', 'negative-space'],
  }),
  preference({
    id: 'giant',
    label: '巨大',
    icon: 'target',
    color: '#6d6e78',
    description: '以尺度差、低机位和大面积环境衬托体量。',
    typeWeights: { rock: 1, ground: 1, steel: 1, dragon: 1 },
    traitWeights: { giant: 1, majestic: 0.75, fierce: 0.65, sharp: 0.5 },
    themeTags: ['epic', 'dramatic', 'majestic', 'silent'],
    actionTags: ['resting', 'observing', 'battling', 'exploring', 'flying'],
    interactionTags: ['observe', 'compete', 'cooperate'],
    compositionTags: ['low-angle', 'negative-space', 'leading-lines', 'silhouette'],
    visualTags: ['cinematic', 'contrast', 'cool', 'dramatic', 'monochrome'],
    challengeTags: ['three-depths', 'no-horizon'],
  }),
  preference({
    id: 'round',
    label: '圆润',
    icon: 'dice',
    color: '#9b7b58',
    description: '圆形轮廓、短肢体和柔软的体积感。',
    typeWeights: { normal: 1, water: 1, fairy: 1, grass: 1 },
    traitWeights: { round: 1, soft: 0.8, cute: 0.6, fluffy: 0.55 },
    themeTags: ['cozy', 'playful', 'gentle', 'lazy'],
    actionTags: ['sleeping', 'eating', 'playing', 'resting', 'dancing'],
    interactionTags: ['play-together', 'share-food', 'care', 'groom'],
    compositionTags: ['center-symmetry', 'close-up', 'rule-thirds'],
    visualTags: ['soft', 'pastel', 'warm', 'bright'],
    challengeTags: ['three-colors', 'one-moment'],
  }),
  preference({
    id: 'mysterious',
    label: '神秘',
    icon: 'moon',
    color: '#4b4f75',
    description: '保留未知、暗部和没有说完的线索。',
    typeWeights: { psychic: 1, ghost: 1, dark: 1, dragon: 1 },
    traitWeights: { mysterious: 1, elegant: 0.65, cool: 0.55, dreamy: 0.5, fierce: 0.4 },
    themeTags: ['mysterious', 'eerie', 'night', 'dreamy', 'silent'],
    actionTags: ['hiding', 'observing', 'exploring', 'flying', 'resting'],
    interactionTags: ['observe', 'compete', 'help'],
    compositionTags: ['silhouette', 'negative-space', 'frame', 'low-angle', 'leading-lines'],
    visualTags: ['dark', 'cool', 'low-contrast', 'ethereal', 'monochrome', 'misty'],
    challengeTags: ['rim-only', 'no-sun'],
  }),
  preference({
    id: 'quirky',
    label: '搞怪',
    icon: 'dice',
    color: '#b8862d',
    description: '不按常理出牌，允许夸张比例和一个小事故。',
    typeWeights: { normal: 1, dark: 1, poison: 1, electric: 1 },
    traitWeights: { quirky: 1, derpy: 0.85, energetic: 0.6, cute: 0.5 },
    themeTags: ['playful', 'comic', 'lively', 'colorful'],
    actionTags: ['playing', 'jumping', 'eating', 'hiding', 'dancing', 'exploring'],
    interactionTags: ['quarrel', 'chase', 'play-together', 'compete', 'observe'],
    compositionTags: ['top-down', 'diagonal', 'frame', 'close-up'],
    visualTags: ['saturated', 'playful', 'hard', 'comic', 'neon', 'bright'],
    challengeTags: ['two-moments', 'one-moment'],
  }),
  preference({
    id: 'fierce',
    label: '凶猛',
    icon: 'zap',
    color: '#b94b3e',
    description: '锋利的轮廓、低重心和明确的攻击方向。',
    typeWeights: { dragon: 1, dark: 1, fighting: 1, fire: 1, rock: 1 },
    traitWeights: { fierce: 1, sharp: 0.8, energetic: 0.7, giant: 0.6, cool: 0.5 },
    themeTags: ['dramatic', 'heroic', 'intense', 'storm', 'volcanic'],
    actionTags: ['battling', 'running', 'jumping', 'flying', 'swimming'],
    interactionTags: ['compete', 'chase', 'cooperate'],
    compositionTags: ['diagonal', 'low-angle', 'close-up', 'dynamic', 'silhouette'],
    visualTags: ['hard', 'contrast', 'saturated', 'cinematic', 'warm'],
    challengeTags: ['rim-only', 'five-colors', 'two-lights'],
  }),
  preference({
    id: 'derpy',
    label: '呆萌',
    icon: 'cloud',
    color: '#8a9b76',
    description: '慢半拍、表情空白、认真做着小事。',
    typeWeights: { normal: 1, water: 1, psychic: 1, fairy: 1 },
    traitWeights: { derpy: 1, cute: 0.8, round: 0.6, soft: 0.5, small: 0.45 },
    themeTags: ['lazy', 'cozy', 'playful', 'gentle', 'quiet'],
    actionTags: ['sleeping', 'eating', 'resting', 'observing', 'hiding', 'sunbathing'],
    interactionTags: ['observe', 'quarrel', 'share-food', 'play-together'],
    compositionTags: ['close-up', 'rule-thirds', 'top-down', 'negative-space'],
    visualTags: ['pastel', 'soft', 'bright', 'warm', 'low-contrast'],
    challengeTags: ['one-moment', 'thirty-min', 'no-black'],
  }),
];

export const IMAGE_PREFERENCE_MAP = Object.fromEntries(
  IMAGE_PREFERENCES.map((item) => [item.id, item]),
);

export const IMAGE_PREFERENCE_MODE_OPTIONS = [
  { id: 'off', label: '不限制', description: '不按形象词条调整概率，所有候选保持基础权重。' },
  { id: 'multi', label: '多选', description: '叠加多个形象偏好，例如「可爱 + 毛茸茸」。' },
  { id: 'custom', label: '自定义', description: '输入自己的形象词，由关键词映射成软权重。' },
];

export const IMAGE_PREFERENCE_STRENGTH_OPTIONS = [
  { id: 'light', label: '轻度', factor: 0.45, description: '轻微偏移，不抢走随机性。' },
  { id: 'standard', label: '标准', factor: 1, description: '明显偏好，但未匹配内容仍可出现。' },
  { id: 'strong', label: '强烈', factor: 1.9, description: '更强地提高匹配度，仍不是硬性筛选。' },
];

export const IMAGE_PREFERENCE_KEYWORDS = [
  { words: ['可爱', '甜', '萌', '软', '治愈', '圆'], profileId: 'cute' },
  { words: ['帅', '酷', '利落', '飒', '冷'], profileId: 'cool' },
  { words: ['优雅', '高贵', '精致', '气质', '仙'], profileId: 'elegant' },
  { words: ['威严', '庄重', '王者', '霸气', '强大'], profileId: 'majestic' },
  { words: ['毛茸茸', '蓬松', '毛发', '绒', '软乎'], profileId: 'fluffy' },
  { words: ['小巧', '迷你', '小只', '幼', '袖珍'], profileId: 'small' },
  { words: ['巨大', '庞大', '巨型', '大型', '巨'], profileId: 'giant' },
  { words: ['圆润', '圆', '胖', '团', '滚圆'], profileId: 'round' },
  { words: ['神秘', '未知', '幽', '诡', '隐秘'], profileId: 'mysterious' },
  { words: ['搞怪', '滑稽', '怪', '趣味', '沙雕'], profileId: 'quirky' },
  { words: ['凶猛', '凶', '猛', '战斗', '攻击'], profileId: 'fierce' },
  { words: ['呆萌', '呆', '憨', '傻', '木'], profileId: 'derpy' },
];

function mergeProfiles(label, profiles) {
  const typeWeights = {};
  const traitWeights = {};
  const tagFields = ['themeTags', 'actionTags', 'interactionTags', 'compositionTags', 'visualTags', 'challengeTags'];
  const tags = Object.fromEntries(tagFields.map((field) => [field, new Set()]));
  for (const profile of profiles) {
    for (const [type, weight] of Object.entries(profile.typeWeights || {})) {
      typeWeights[type] = Math.max(typeWeights[type] || 0, weight);
    }
    for (const [trait, weight] of Object.entries(profile.traitWeights || {})) {
      traitWeights[trait] = Math.max(traitWeights[trait] || 0, weight);
    }
    for (const field of tagFields) {
      for (const tag of profile[field] || []) tags[field].add(tag);
    }
  }
  return preference({
    id: `custom:${label}`,
    label,
    icon: 'sparkles',
    color: '#8b6f9e',
    description: profiles.length
      ? `自定义形象偏好，参考「${profiles.map((item) => item.label).join('、')}」。`
      : '自定义形象偏好，没有识别到关键词；仅作为文字记录。',
    custom: true,
    typeWeights,
    traitWeights,
    ...Object.fromEntries(tagFields.map((field) => [field, [...tags[field]]])),
  });
}

export function buildCustomImagePreference(label) {
  const clean = String(label || '').trim();
  if (!clean) return null;
  const ids = [...new Set(
    IMAGE_PREFERENCE_KEYWORDS
      .filter((group) => group.words.some((word) => clean.includes(word)))
      .map((group) => group.profileId),
  )];
  return mergeProfiles(clean, ids.map((id) => IMAGE_PREFERENCE_MAP[id]).filter(Boolean));
}

export function getActiveImagePreferences(settings) {
  if (!settings || settings.imagePreferenceMode === 'off') return [];
  if (settings.imagePreferenceMode === 'multi') {
    return (settings.imagePreferences || []).map((id) => IMAGE_PREFERENCE_MAP[id]).filter(Boolean);
  }
  if (settings.imagePreferenceMode === 'custom') {
    return (settings.customImagePreferences || []).map(buildCustomImagePreference).filter(Boolean);
  }
  return [];
}

export function getImagePreferenceStrength(settings) {
  return IMAGE_PREFERENCE_STRENGTH_OPTIONS.find((item) => item.id === settings?.imagePreferenceStrength)
    || IMAGE_PREFERENCE_STRENGTH_OPTIONS[1];
}

export function getImagePreferenceSummary(settings) {
  const active = getActiveImagePreferences(settings);
  const strength = getImagePreferenceStrength(settings);
  return {
    active,
    labels: active.map((item) => item.label),
    strength,
    types: [...new Set(active.flatMap((item) => Object.keys(item.typeWeights || {})))],
    traits: [...new Set(active.flatMap((item) => Object.keys(item.traitWeights || {})))],
    isActive: active.length > 0,
  };
}
