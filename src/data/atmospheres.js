const atmosphere = (config) => ({
  typeWeights: {},
  traitWeights: {},
  sceneTags: [],
  weatherTags: [],
  timeTags: [],
  actionTags: [],
  interactionTags: [],
  eventTags: [],
  compositionTags: [],
  visualTags: [],
  ...config,
});

/**
 * Initial weights are deliberately soft. They are starting probabilities, not
 * type bindings: appearance traits always contribute as well, and the user's
 * hard type filter is applied before these weights.
 */
export const ATMOSPHERES = [
  atmosphere({
    id: 'cool',
    label: '帅气',
    icon: 'target',
    color: '#3f6fa0',
    description: '利落、克制、有力量感，强调轮廓与存在感。',
    typeWeights: { fire: 1, dragon: 1, steel: 1, dark: 1, fighting: 1 },
    traitWeights: { majestic: 1, sharp: 1, cool: 1, energetic: 0.55 },
    sceneTags: ['urban', 'mountain', 'open', 'storm-prone', 'night', 'dramatic', 'cool', 'metal', 'snow-mountain'],
    weatherTags: ['windy', 'storm', 'thunderstorm', 'cloudy', 'starry', 'snow'],
    timeTags: ['dusk', 'night', 'midnight'],
    actionTags: ['battling', 'running', 'flying', 'jumping', 'exploring', 'energetic', 'dramatic'],
    interactionTags: ['compete', 'chase', 'cooperate'],
    eventTags: ['meteor-shower', 'stranger-pokemon', 'mystery-cave'],
    compositionTags: ['dynamic', 'low-angle', 'diagonal', 'silhouette', 'negative-space'],
    visualTags: ['hard', 'contrast', 'cool', 'cinematic', 'monochrome', 'neon'],
  }),
  atmosphere({
    id: 'cozy',
    label: '温馨',
    icon: 'heart',
    color: '#b87350',
    description: '柔软、日常、被照顾的感觉，适合小空间与暖光。',
    typeWeights: { fairy: 1, grass: 1, normal: 1, water: 1 },
    traitWeights: { round: 1, soft: 1, cute: 1, warm: 1 },
    sceneTags: ['indoor', 'cozy', 'rural', 'garden', 'forest', 'cafe', 'room', 'warm', 'soft', 'temperate', 'countryside'],
    weatherTags: ['sunny', 'cloudy', 'light-rain', 'snow', 'fog'],
    timeTags: ['morning', 'afternoon', 'dusk', 'dawn'],
    actionTags: ['sleeping', 'resting', 'eating', 'playing', 'dancing', 'gentle', 'quiet'],
    interactionTags: ['care', 'share-food', 'groom', 'cooperate', 'help', 'play-together'],
    eventTags: ['treasure', 'festival', 'other-creature', 'food-stolen'],
    compositionTags: ['center-symmetry', 'close-up', 'framing', 'negative-space', 'rule-thirds'],
    visualTags: ['warm', 'soft', 'pastel', 'gentle', 'low-contrast'],
  }),
  atmosphere({
    id: 'dreamy',
    label: '梦幻',
    icon: 'moon',
    color: '#7d68ad',
    description: '失重、朦胧、像一段没有边界的梦。',
    typeWeights: { fairy: 1, psychic: 1, water: 1, ghost: 1 },
    traitWeights: { soft: 1, mysterious: 1, cute: 1, romantic: 1, dreamy: 1 },
    sceneTags: ['sky', 'space', 'underwater', 'garden', 'lake', 'misty', 'magical', 'night', 'dreamy'],
    weatherTags: ['fog', 'light-rain', 'snow', 'starry', 'rainbow'],
    timeTags: ['dawn', 'dusk', 'night', 'midnight'],
    actionTags: ['flying', 'dancing', 'sleeping', 'observing', 'jumping', 'gentle'],
    interactionTags: ['observe', 'play-together', 'care'],
    eventTags: ['meteor-shower', 'mystery-cave', 'strange-item', 'stranger-pokemon'],
    compositionTags: ['negative-space', 'silhouette', 'leading-lines', 'center-symmetry', 'ethereal'],
    visualTags: ['pastel', 'ethereal', 'glow', 'soft', 'cool', 'saturated'],
  }),
  atmosphere({
    id: 'natural',
    label: '自然',
    icon: 'leaf',
    color: '#4b8663',
    description: '风、植被与土地的气息，让画面保持呼吸感。',
    typeWeights: { grass: 1, bug: 1, ground: 1, flying: 1, water: 1 },
    traitWeights: { natural: 1, round: 1, soft: 1, cute: 0.65 },
    sceneTags: ['forest', 'grassland', 'countryside', 'river', 'lake', 'garden', 'mountain', 'seaside', 'island', 'outdoor', 'green', 'rural'],
    weatherTags: ['sunny', 'cloudy', 'light-rain', 'windy', 'fog', 'snow'],
    timeTags: ['dawn', 'morning', 'afternoon', 'dusk'],
    actionTags: ['foraging', 'exploring', 'sunbathing', 'resting', 'swimming', 'running', 'gentle'],
    interactionTags: ['forage-together', 'observe', 'care', 'help'],
    eventTags: ['other-creature', 'treasure', 'lost-way'],
    compositionTags: ['rule-thirds', 'leading-lines', 'top-down', 'close-up'],
    visualTags: ['green', 'natural', 'soft', 'textured', 'earth', 'bright'],
  }),
  atmosphere({
    id: 'quirky',
    label: '搞怪',
    icon: 'dice',
    color: '#b8862d',
    description: '不按常理出牌，允许夸张比例和一个小小的事故。',
    typeWeights: { normal: 1, dark: 1, poison: 1, electric: 1 },
    traitWeights: { quirky: 1, cute: 1, energetic: 1, round: 0.8, soft: 0.6 },
    sceneTags: ['amusement-park', 'city', 'room', 'school', 'cafe', 'beach', 'garden', 'playful', 'colorful', 'indoor'],
    weatherTags: ['sunny', 'windy', 'thunderstorm', 'rainbow', 'cloudy'],
    timeTags: ['morning', 'noon', 'afternoon', 'dusk'],
    actionTags: ['playing', 'jumping', 'eating', 'dancing', 'hiding', 'exploring', 'playful', 'energetic'],
    interactionTags: ['quarrel', 'chase', 'play-together', 'compete', 'observe'],
    eventTags: ['food-stolen', 'strange-item', 'stranger-pokemon', 'festival', 'other-creature'],
    compositionTags: ['close-up', 'top-down', 'diagonal', 'framing', 'dynamic'],
    visualTags: ['saturated', 'playful', 'hard', 'comic', 'neon', 'bright'],
  }),
  atmosphere({
    id: 'mysterious',
    label: '神秘',
    icon: 'cloud',
    color: '#4a4d70',
    description: '保留未知与暗部，让画面里像还有没说完的故事。',
    typeWeights: { psychic: 1, ghost: 1, dark: 1, dragon: 1 },
    traitWeights: { mysterious: 1, sharp: 1, majestic: 1, cool: 0.8 },
    sceneTags: ['ruins', 'cave', 'forest', 'underwater', 'space', 'fog', 'night', 'snow-mountain', 'lake', 'mysterious', 'misty'],
    weatherTags: ['fog', 'cloudy', 'starry', 'light-rain', 'snow', 'thunderstorm'],
    timeTags: ['night', 'midnight', 'dusk', 'dawn'],
    actionTags: ['hiding', 'observing', 'exploring', 'resting', 'flying'],
    interactionTags: ['observe', 'compete', 'help'],
    eventTags: ['mystery-cave', 'strange-item', 'stranger-pokemon', 'meteor-shower'],
    compositionTags: ['silhouette', 'negative-space', 'framing', 'low-angle', 'leading-lines'],
    visualTags: ['dark', 'cool', 'low-contrast', 'ethereal', 'monochrome', 'misty'],
  }),
  atmosphere({
    id: 'romantic',
    label: '浪漫',
    icon: 'heart',
    color: '#b96583',
    description: '柔和、亲密、带一点被时间放慢的心动。',
    typeWeights: { fairy: 1, water: 1, flying: 1, grass: 1 },
    traitWeights: { romantic: 1, soft: 1, cute: 1, dreamy: 1, majestic: 0.65 },
    sceneTags: ['garden', 'lake', 'seaside', 'beach', 'island', 'cafe', 'city', 'sunset', 'flower', 'romantic', 'warm'],
    weatherTags: ['sunny', 'light-rain', 'rainbow', 'snow', 'starry', 'fog'],
    timeTags: ['dawn', 'dusk', 'night', 'afternoon', 'romantic'],
    actionTags: ['dancing', 'observing', 'playing', 'resting', 'flying', 'sunbathing', 'gentle'],
    interactionTags: ['care', 'share-food', 'groom', 'play-together', 'observe'],
    eventTags: ['festival', 'meteor-shower', 'treasure', 'other-creature'],
    compositionTags: ['center-symmetry', 'close-up', 'framing', 'negative-space', 'silhouette'],
    visualTags: ['pastel', 'warm', 'soft', 'glow', 'saturated', 'romantic'],
  }),
  atmosphere({
    id: 'passionate',
    label: '热血',
    icon: 'zap',
    color: '#b94b3e',
    description: '高能量、强动势、像下一秒就要冲出画面。',
    typeWeights: { fire: 1, fighting: 1, electric: 1, dragon: 1 },
    traitWeights: { energetic: 1, sharp: 1, majestic: 1, cool: 0.7, passionate: 0.9 },
    sceneTags: ['volcano', 'mountain', 'city', 'grassland', 'sky', 'storm-prone', 'desert', 'dramatic', 'hot', 'open'],
    weatherTags: ['sunny', 'windy', 'thunderstorm', 'storm', 'rainbow'],
    timeTags: ['morning', 'noon', 'afternoon', 'dusk'],
    actionTags: ['battling', 'running', 'jumping', 'flying', 'swimming', 'energetic', 'dramatic'],
    interactionTags: ['compete', 'chase', 'cooperate', 'help'],
    eventTags: ['meteor-shower', 'festival', 'stranger-pokemon'],
    compositionTags: ['dynamic', 'diagonal', 'low-angle', 'close-up'],
    visualTags: ['saturated', 'hard', 'warm', 'contrast', 'cinematic'],
  }),
];

export const ATMOSPHERE_MAP = Object.fromEntries(ATMOSPHERES.map((item) => [item.id, item]));

export const ATMOSPHERE_MODE_OPTIONS = [
  { id: 'off', label: '不限制', description: '不按氛围调整概率，所有符合条件的词条自然随机。' },
  { id: 'single', label: '单选', description: '只保留一个主氛围，适合目标明确的练习。' },
  { id: 'multi', label: '多选', description: '多个氛围叠加计算，允许暖色与冷色同时在画面里成立。' },
  { id: 'custom', label: '自定义', description: '输入自己的氛围词，由关键词映射成软性权重。' },
];

export const ATMOSPHERE_STRENGTH_OPTIONS = [
  { id: 'light', label: '轻度', factor: 0.45, description: '只做轻微偏移，结果仍然很分散。' },
  { id: 'standard', label: '标准', factor: 1, description: '在保留随机性的前提下明显偏向所选氛围。' },
  { id: 'strong', label: '强烈', factor: 1.9, description: '更强地提高匹配项概率，但仍不会硬性排除未匹配内容。' },
];

export const CUSTOM_ATMOSPHERE_KEYWORDS = [
  { words: ['帅', '酷', '冷', '利落', '赛博', '硬朗'], profileId: 'cool' },
  { words: ['温暖', '温馨', '治愈', '柔软', '日常', '甜'], profileId: 'cozy' },
  { words: ['梦', '幻', '朦胧', '童话', '星', '空灵'], profileId: 'dreamy' },
  { words: ['自然', '森林', '绿', '风', '野', '生态', '海', '夏', '阳光', '沙滩', '岛'], profileId: 'natural' },
  { words: ['搞怪', '趣味', '滑稽', '恶作剧', '怪'], profileId: 'quirky' },
  { words: ['神秘', '幽暗', '未知', '古', '诡'], profileId: 'mysterious' },
  { words: ['浪漫', '花', '恋', '约会', '粉', '海', '夏', '沙滩'], profileId: 'romantic' },
  { words: ['热血', '燃', '战斗', '激烈', '火'], profileId: 'passionate' },
];

export const ATMOSPHERE_TRAIT_LABELS = {
  round: '圆润',
  soft: '柔软',
  majestic: '威严',
  sharp: '锋利',
  cute: '可爱',
  mysterious: '神秘',
  natural: '自然',
  energetic: '活力',
  quirky: '搞怪',
  romantic: '浪漫',
  cool: '冷峻',
  warm: '温暖',
  dreamy: '梦幻',
  passionate: '热烈',
};

function mergeProfiles(label, profiles) {
  const typeWeights = {};
  const traitWeights = {};
  const tagFields = ['sceneTags', 'weatherTags', 'timeTags', 'actionTags', 'interactionTags', 'eventTags', 'compositionTags', 'visualTags'];
  const mergedTags = Object.fromEntries(tagFields.map((field) => [field, new Set()]));
  for (const profile of profiles) {
    for (const [type, weight] of Object.entries(profile.typeWeights || {})) {
      typeWeights[type] = Math.max(typeWeights[type] || 0, weight);
    }
    for (const [trait, weight] of Object.entries(profile.traitWeights || {})) {
      traitWeights[trait] = Math.max(traitWeights[trait] || 0, weight);
    }
    for (const field of tagFields) {
      for (const tag of profile[field] || []) mergedTags[field].add(tag);
    }
  }
  return atmosphere({
    id: `custom:${label}`,
    label,
    icon: 'sparkles',
    color: '#8b6f9e',
    description: profiles.length
      ? `自定义氛围，参考「${profiles.map((item) => item.label).join('、')}」的软性倾向。`
      : '自定义氛围，没有识别到可映射的关键词；仅作为文字记录。',
    custom: true,
    typeWeights,
    traitWeights,
    ...Object.fromEntries(tagFields.map((field) => [field, [...mergedTags[field]]])),
  });
}

export function buildCustomAtmosphere(label) {
  const clean = String(label || '').trim();
  if (!clean) return null;
  const ids = [...new Set(
    CUSTOM_ATMOSPHERE_KEYWORDS
      .filter((group) => group.words.some((word) => clean.includes(word)))
      .map((group) => group.profileId),
  )];
  const profiles = ids.map((id) => ATMOSPHERE_MAP[id]).filter(Boolean);
  return mergeProfiles(clean, profiles);
}

export function getActiveAtmospheres(settings) {
  if (!settings || settings.atmosphereMode === 'off') return [];
  if (settings.atmosphereMode === 'single') {
    const id = settings.atmospheres?.[0];
    return id && ATMOSPHERE_MAP[id] ? [ATMOSPHERE_MAP[id]] : [];
  }
  if (settings.atmosphereMode === 'multi') {
    return (settings.atmospheres || []).map((id) => ATMOSPHERE_MAP[id]).filter(Boolean);
  }
  if (settings.atmosphereMode === 'custom') {
    return (settings.customAtmospheres || []).map(buildCustomAtmosphere).filter(Boolean);
  }
  return [];
}

export function getAtmosphereStrength(settings) {
  return ATMOSPHERE_STRENGTH_OPTIONS.find((item) => item.id === settings?.atmosphereStrength)
    || ATMOSPHERE_STRENGTH_OPTIONS[1];
}

export function getAtmosphereSummary(settings) {
  const active = getActiveAtmospheres(settings);
  const strength = getAtmosphereStrength(settings);
  const types = [...new Set(active.flatMap((item) => Object.keys(item.typeWeights || {})))];
  const traits = [...new Set(active.flatMap((item) => Object.keys(item.traitWeights || {})))];
  return {
    active,
    labels: active.map((item) => item.label),
    strength,
    types,
    traits,
    isActive: active.length > 0,
  };
}
