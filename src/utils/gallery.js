import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_GALLERY_FILE_BYTES,
  MAX_GALLERY_TAGS,
  MAX_TAG_LENGTH,
} from '../data/gallery.js';

export function getFileExtension(filename = '') {
  return String(filename).split('.').pop()?.toLowerCase() || '';
}

export function stripFileExtension(filename = '') {
  return String(filename).replace(/\.[^.]+$/, '').trim();
}

export function normalizeMime(file) {
  const raw = String(file?.type || '').toLowerCase();
  if (raw === 'image/jpg') return 'image/jpeg';
  if (ACCEPTED_MIME_TYPES.includes(raw)) return raw === 'image/jpg' ? 'image/jpeg' : raw;
  const extension = getFileExtension(file?.name);
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return null;
}

export function validateGalleryFile(file) {
  if (!file || typeof file !== 'object' || !('size' in file) || !('name' in file)) {
    return { ok: false, error: '文件无效。' };
  }
  if (!file.size) return { ok: false, error: '图片文件为空。' };
  if (file.size > MAX_GALLERY_FILE_BYTES) {
    return {
      ok: false,
      error: `图片超过 10MB 限制（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）。`,
    };
  }
  const extension = getFileExtension(file.name);
  const mime = normalizeMime(file);
  if (!mime || !ACCEPTED_EXTENSIONS.includes(extension)) {
    return { ok: false, error: '仅支持 JPG、JPEG、PNG、WEBP 格式。' };
  }
  return { ok: true, mime, extension };
}

const toHex = (buffer) => [...new Uint8Array(buffer)]
  .map((value) => value.toString(16).padStart(2, '0'))
  .join('');

function fnv1a(bytes) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * SHA-256 when available (secure context); deterministic FNV-1a fallback for
 * plain HTTP LAN pages where crypto.subtle may be unavailable.
 */
export async function hashGalleryFile(file) {
  const buffer = await file.arrayBuffer();
  if (globalThis.crypto?.subtle) {
    try {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
      return `sha256-${toHex(digest)}`;
    } catch {
      // Fall through.
    }
  }
  return `fnv1a-${fnv1a(new Uint8Array(buffer))}-${buffer.byteLength}`;
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('无法读取图片内容，文件可能已损坏。'));
    image.src = url;
  });
}

/**
 * Creates a compact thumbnail stored alongside metadata. Full files live in a
 * separate IndexedDB store so gallery lists never need to load original blobs.
 */
export async function createGalleryThumbnail(file, maxDimension = 900) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('无法读取图片尺寸。');

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法生成缩略图。');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    let thumbBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (!thumbBlob) {
      thumbBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
    }
    if (!thumbBlob) throw new Error('浏览器无法生成缩略图。');

    return {
      thumbBlob,
      width,
      height,
      thumbWidth: targetWidth,
      thumbHeight: targetHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function normalizeGalleryName(value, fallback = '未命名图片') {
  const clean = String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
  return clean || fallback;
}

export function normalizeGalleryTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  return tags
    .map((tag) => String(tag ?? '').trim().replace(/^#/, '').slice(0, MAX_TAG_LENGTH))
    .filter((tag) => {
      if (!tag || seen.has(tag.toLowerCase())) return false;
      seen.add(tag.toLowerCase());
      return true;
    })
    .slice(0, MAX_GALLERY_TAGS);
}

export function normalizeGalleryDescription(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

export function sortGalleryImages(images, sort = 'newest') {
  const list = [...images];
  if (sort === 'oldest') {
    return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  if (sort === 'name-asc') {
    return list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN', { numeric: true }));
  }
  if (sort === 'name-desc') {
    return list.sort((a, b) => String(b.name).localeCompare(String(a.name), 'zh-CN', { numeric: true }));
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function gallerySearchText(image, pokemon = null) {
  return [
    image.name,
    image.description,
    image.notes,
    image.pokemonName,
    pokemon?.nameZh,
    pokemon?.nameEn,
    image.tool,
    ...(image.tags || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function matchesGallerySearch(image, query, pokemon = null) {
  const needle = String(query || '').trim().toLowerCase().replace(/^#/, '');
  if (!needle) return true;
  return gallerySearchText(image, pokemon).includes(needle);
}

export function todayInputValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
