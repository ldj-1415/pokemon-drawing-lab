export const MAX_GALLERY_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_GALLERY_TAGS = 12;
export const MAX_TAG_LENGTH = 16;

export const GALLERY_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const IMAGE_USAGES = [
  {
    id: 'reference',
    label: '参考素材',
    short: '参考',
    description: '场景、构图、配色、动作、宝可梦等绘画参考，可参与工作台随机。',
    icon: 'image',
    color: '#3f8f75',
  },
  {
    id: 'artwork',
    label: '个人作品',
    short: '作品',
    description: '自己的宝可梦绘画作品，保存名称、宝可梦、日期、工具与备注。',
    icon: 'palette',
    color: '#b45e50',
  },
];

export const REFERENCE_CATEGORIES = [
  { id: 'scene', usage: 'reference', label: '场景参考', description: '环境、建筑与自然景观', color: '#3f8f75' },
  { id: 'composition', usage: 'reference', label: '构图参考', description: '镜头、布局与画面节奏', color: '#4b7fc1' },
  { id: 'palette', usage: 'reference', label: '配色参考', description: '色彩关系与光影氛围', color: '#c18a2d' },
  { id: 'action', usage: 'reference', label: '动作参考', description: '姿态、运动与肢体语言', color: '#b45e50' },
  { id: 'pokemon', usage: 'reference', label: '宝可梦参考', description: '宝可梦造型与细节参考', color: '#7b61a8' },
  { id: 'other', usage: 'reference', label: '其他素材', description: '无法归入以上分类的参考', color: '#747983' },
];

export const ARTWORK_CATEGORIES = [
  { id: 'finished', usage: 'artwork', label: '完成作品', description: '已经完成的绘画作品', color: '#3f8f75' },
  { id: 'practice', usage: 'artwork', label: '绘画练习', description: '日常练习与阶段成果', color: '#4b7fc1' },
  { id: 'sketch', usage: 'artwork', label: '草稿', description: '线稿、草图与未完成尝试', color: '#c18a2d' },
  { id: 'other-work', usage: 'artwork', label: '其他作品', description: '其他个人绘画记录', color: '#747983' },
];

export const ALL_GALLERY_CATEGORIES = [...REFERENCE_CATEGORIES, ...ARTWORK_CATEGORIES];

export const GALLERY_SORT_OPTIONS = [
  { id: 'newest', label: '最近上传' },
  { id: 'oldest', label: '最早上传' },
  { id: 'name-asc', label: '名称 A–Z' },
  { id: 'name-desc', label: '名称 Z–A' },
];

export const GALLERY_VIEWS = [
  { id: 'all', label: '全部图片', icon: 'grid' },
  { id: 'reference', label: '参考素材', icon: 'image' },
  { id: 'artwork', label: '我的作品', icon: 'palette' },
  { id: 'favorites', label: '收藏图片', icon: 'heart' },
];

export const USAGE_MAP = Object.fromEntries(IMAGE_USAGES.map((usage) => [usage.id, usage]));
export const CATEGORY_MAP = Object.fromEntries(ALL_GALLERY_CATEGORIES.map((category) => [category.id, category]));

export function getCategoriesForUsage(usage) {
  return usage === 'artwork' ? ARTWORK_CATEGORIES : REFERENCE_CATEGORIES;
}

export function getCategoryMeta(categoryId) {
  return CATEGORY_MAP[categoryId] || {
    id: categoryId,
    usage: 'reference',
    label: categoryId || '未分类',
    description: '',
    color: '#747983',
  };
}

export function getUsageMeta(usage) {
  return USAGE_MAP[usage] || USAGE_MAP.reference;
}

export function getDefaultCategory(usage) {
  return getCategoriesForUsage(usage)[0]?.id || null;
}

export function isValidCategoryForUsage(usage, category) {
  return getCategoriesForUsage(usage).some((item) => item.id === category);
}

export const REFERENCE_CATEGORY_IDS = REFERENCE_CATEGORIES.map((category) => category.id);

export function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function formatGalleryDate(value) {
  if (!value) return '未填写日期';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
