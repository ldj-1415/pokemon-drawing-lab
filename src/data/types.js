export const POKEMON_TYPES = [
  { id: 'normal', label: '一般', color: '#8d948b', soft: '#eff0ea', text: '#4f554e' },
  { id: 'fire', label: '火', color: '#ef7d45', soft: '#fde9df', text: '#8f3d1d' },
  { id: 'water', label: '水', color: '#4b8ed8', soft: '#e4effb', text: '#24568c' },
  { id: 'electric', label: '电', color: '#d9ad24', soft: '#fcf2cf', text: '#725a0e' },
  { id: 'grass', label: '草', color: '#5fa762', soft: '#e6f3e3', text: '#2f6332' },
  { id: 'ice', label: '冰', color: '#62b8c8', soft: '#e2f4f6', text: '#286672' },
  { id: 'fighting', label: '格斗', color: '#cf5466', soft: '#fbe5e8', text: '#812d39' },
  { id: 'poison', label: '毒', color: '#a06abe', soft: '#f2e6f7', text: '#603376' },
  { id: 'ground', label: '地面', color: '#c28a52', soft: '#f6eadc', text: '#76502a' },
  { id: 'flying', label: '飞行', color: '#7b98d4', soft: '#e8eefb', text: '#3c568d' },
  { id: 'psychic', label: '超能力', color: '#e36a8d', soft: '#fbe6ed', text: '#8c2e4b' },
  { id: 'bug', label: '虫', color: '#8aab38', soft: '#eef4dd', text: '#4c6217' },
  { id: 'rock', label: '岩石', color: '#b2a06d', soft: '#f2eedf', text: '#665931' },
  { id: 'ghost', label: '幽灵', color: '#6b6fa9', soft: '#e9e8f6', text: '#3d4072' },
  { id: 'dragon', label: '龙', color: '#526fc3', soft: '#e5eafb', text: '#2d4386' },
  { id: 'dark', label: '恶', color: '#70676f', soft: '#eee9ed', text: '#463c43' },
  { id: 'steel', label: '钢', color: '#6b929d', soft: '#e5eff1', text: '#375962' },
  { id: 'fairy', label: '妖精', color: '#d77ebb', soft: '#f9e8f4', text: '#833569' },
];

export const TYPE_MAP = Object.fromEntries(POKEMON_TYPES.map((type) => [type.id, type]));

export function getTypeMeta(typeId) {
  return TYPE_MAP[typeId] || {
    id: typeId,
    label: typeId,
    color: '#8d948b',
    soft: '#eff0ea',
    text: '#4f554e',
  };
}

export const TYPE_MODE_OPTIONS = [
  {
    id: 'hard',
    title: '硬性筛选',
    description: '候选池只保留符合偏好属性的宝可梦。',
  },
  {
    id: 'weighted',
    title: '权重偏好',
    description: '偏好属性优先出现，但其他属性仍有机会被抽中。',
  },
  {
    id: 'off',
    title: '仅作参考',
    description: '记录你的偏好，不影响本轮抽取概率。',
  },
];

export const DUPLICATE_MODE_OPTIONS = [
  {
    id: 'unique',
    title: '不允许重复',
    description: '同一轮中每只宝可梦最多出现一次。',
  },
  {
    id: 'allow',
    title: '允许重复',
    description: '按候选池概率独立抽取，可以出现相同宝可梦。',
  },
  {
    id: 'avoid',
    title: '尽量避免重复',
    description: '优先抽不同宝可梦，候选池不足时才重复。',
  },
];
