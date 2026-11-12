import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteGalleryImageRecord,
  describeGalleryError,
  findGalleryImageByHash,
  getAllGalleryMeta,
  getGalleryImageBlob,
  getGalleryMeta,
  isGallerySupported,
  saveGalleryImageRecord,
  updateGalleryMeta,
} from '../services/galleryDb.js';
import {
  getDefaultCategory,
  getUsageMeta,
  isValidCategoryForUsage,
} from '../data/gallery.js';
import {
  createGalleryThumbnail,
  hashGalleryFile,
  normalizeGalleryDescription,
  normalizeGalleryName,
  normalizeGalleryTags,
  sortGalleryImages,
  stripFileExtension,
  validateGalleryFile,
} from '../utils/gallery.js';

function makeGalleryId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMeta(record) {
  if (!record?.id) return null;
  const usage = record.usage === 'artwork' ? 'artwork' : 'reference';
  const category = isValidCategoryForUsage(usage, record.category)
    ? record.category
    : getDefaultCategory(usage);
  const pokemonId = Number(record.pokemonId);
  return {
    ...record,
    usage,
    category,
    name: normalizeGalleryName(record.name),
    description: normalizeGalleryDescription(record.description),
    notes: normalizeGalleryDescription(record.notes, 2000),
    tool: String(record.tool || '').slice(0, 80),
    tags: normalizeGalleryTags(record.tags),
    favorite: Boolean(record.favorite),
    pokemonId: Number.isInteger(pokemonId) && pokemonId >= 1 && pokemonId <= 1025 ? pokemonId : null,
    pokemonName: record.pokemonName ? String(record.pokemonName).slice(0, 60) : '',
    drawingDate: record.drawingDate || '',
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
  };
}

export function useGallery() {
  const supported = useMemo(isGallerySupported, []);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState(supported ? 'loading' : 'unsupported');
  const [error, setError] = useState(supported ? null : '当前浏览器不支持 IndexedDB，无法保存图库图片。');
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      setError('当前浏览器不支持 IndexedDB，无法保存图库图片。');
      return [];
    }
    setStatus('loading');
    setError(null);
    try {
      const records = await getAllGalleryMeta();
      const normalized = records.map(normalizeMeta).filter(Boolean);
      if (mountedRef.current) {
        setImages(sortGalleryImages(normalized, 'newest'));
        setStatus('ready');
        setLastLoadedAt(new Date().toISOString());
      }
      return normalized;
    } catch (loadError) {
      console.error('[Pokémon Drawing Lab] 图库读取失败', loadError);
      if (mountedRef.current) {
        setStatus('error');
        setError(describeGalleryError(loadError));
      }
      return [];
    }
  }, [supported]);

  useEffect(() => {
    let active = true;
    if (!supported) return undefined;
    getAllGalleryMeta()
      .then((records) => {
        if (!active) return;
        const normalized = records.map(normalizeMeta).filter(Boolean);
        // Preserve anything uploaded while the initial read was still in flight.
        setImages((previous) => {
          const merged = new Map(normalized.map((image) => [image.id, image]));
          for (const image of previous) {
            if (!merged.has(image.id)) merged.set(image.id, image);
          }
          return sortGalleryImages([...merged.values()], 'newest');
        });
        setStatus('ready');
        setLastLoadedAt(new Date().toISOString());
        setError(null);
      })
      .catch((loadError) => {
        console.error('[Pokémon Drawing Lab] 图库读取失败', loadError);
        if (!active) return;
        setStatus('error');
        setError(describeGalleryError(loadError));
      });
    return () => {
      active = false;
    };
  }, [supported]);

  const addImages = useCallback(async (files, options = {}) => {
    const list = Array.from(files || []);
    const usage = options.usage === 'artwork' ? 'artwork' : 'reference';
    const category = isValidCategoryForUsage(usage, options.category)
      ? options.category
      : getDefaultCategory(usage);
    const onProgress = options.onProgress || (() => {});
    const shouldCancel = options.shouldCancel || (() => false);
    const results = [];

    for (let index = 0; index < list.length; index += 1) {
      const file = list[index];
      const position = index + 1;
      if (shouldCancel()) {
        results.push({ file, status: 'cancelled', message: '已取消上传。' });
        continue;
      }

      onProgress({
        phase: 'validating',
        done: index,
        total: list.length,
        position,
        currentName: file?.name || '图片',
        message: `正在检查 ${file?.name || '图片'}…`,
      });

      const validation = validateGalleryFile(file);
      if (!validation.ok) {
        results.push({ file, status: 'error', message: validation.error });
        onProgress({
          phase: 'file-error',
          done: position,
          total: list.length,
          position,
          currentName: file?.name || '图片',
          message: validation.error,
        });
        continue;
      }

      try {
        const hash = await hashGalleryFile(file);
        const duplicate = await findGalleryImageByHash(hash);
        if (duplicate) {
          results.push({
            file,
            status: 'duplicate',
            image: normalizeMeta(duplicate),
            message: `与图库中的「${duplicate.name}」是同一张图片。`,
          });
          onProgress({
            phase: 'duplicate',
            done: position,
            total: list.length,
            position,
            currentName: file.name,
            message: `重复图片：${duplicate.name}`,
          });
          continue;
        }

        onProgress({
          phase: 'thumbnailing',
          done: index,
          total: list.length,
          position,
          currentName: file.name,
          message: `正在生成缩略图 ${position}/${list.length}…`,
        });
        const thumbnail = await createGalleryThumbnail(file);
        const now = new Date().toISOString();
        const meta = {
          id: makeGalleryId(),
          hash,
          name: normalizeGalleryName(stripFileExtension(file.name)),
          description: '',
          notes: '',
          tags: [],
          usage,
          category,
          favorite: false,
          pokemonId: null,
          pokemonName: '',
          drawingDate: '',
          tool: '',
          mimeType: validation.mime,
          size: file.size,
          imageWidth: thumbnail.width,
          imageHeight: thumbnail.height,
          thumbWidth: thumbnail.thumbWidth,
          thumbHeight: thumbnail.thumbHeight,
          thumbBlob: thumbnail.thumbBlob,
          sourceFileName: file.name,
          createdAt: now,
          updatedAt: now,
        };

        await saveGalleryImageRecord({ meta, file });
        const normalized = normalizeMeta(meta);
        if (mountedRef.current) {
          setImages((previous) => sortGalleryImages([normalized, ...previous], 'newest'));
          setStatus('ready');
          setError(null);
        }
        results.push({ file, status: 'success', image: normalized });
        onProgress({
          phase: 'file-success',
          done: position,
          total: list.length,
          position,
          currentName: file.name,
          message: `已保存 ${position}/${list.length}：${meta.name}`,
        });
      } catch (uploadError) {
        console.error('[Pokémon Drawing Lab] 图片上传失败', uploadError);
        const message = uploadError?.name === 'ConstraintError'
          ? '这张图片已经存在于图库中，无需重复上传。'
          : describeGalleryError(uploadError);
        results.push({ file, status: 'error', message });
        onProgress({
          phase: 'file-error',
          done: position,
          total: list.length,
          position,
          currentName: file?.name || '图片',
          message,
        });
      }
    }

    onProgress({
      phase: shouldCancel() ? 'cancelled' : 'done',
      done: results.length,
      total: list.length,
      currentName: '',
      message: shouldCancel() ? '已停止上传剩余文件。' : '上传处理完成。',
    });
    return results;
  }, []);

  const updateImage = useCallback(async (id, patch) => {
    const existing = await getGalleryMeta(id);
    if (!existing) throw new Error('没有找到这张图片，可能已被删除。');
    const usage = patch.usage === 'artwork' ? 'artwork' : patch.usage === 'reference' ? 'reference' : existing.usage;
    const category = isValidCategoryForUsage(usage, patch.category ?? existing.category)
      ? (patch.category ?? existing.category)
      : getDefaultCategory(usage);
    const pokemonId = patch.pokemonId == null ? null : Number(patch.pokemonId);
    const next = normalizeMeta({
      ...existing,
      ...patch,
      usage,
      category,
      name: normalizeGalleryName(patch.name ?? existing.name),
      description: normalizeGalleryDescription(patch.description ?? existing.description),
      notes: normalizeGalleryDescription(patch.notes ?? existing.notes, 2000),
      tool: String(patch.tool ?? existing.tool ?? '').slice(0, 80),
      tags: normalizeGalleryTags(patch.tags ?? existing.tags),
      favorite: patch.favorite == null ? Boolean(existing.favorite) : Boolean(patch.favorite),
      pokemonId: Number.isInteger(pokemonId) && pokemonId >= 1 && pokemonId <= 1025 ? pokemonId : null,
      pokemonName: patch.pokemonName == null
        ? existing.pokemonName
        : String(patch.pokemonName).slice(0, 60),
      drawingDate: patch.drawingDate ?? existing.drawingDate ?? '',
      updatedAt: new Date().toISOString(),
    });
    await updateGalleryMeta(next);
    if (mountedRef.current) {
      setImages((previous) => sortGalleryImages(
        previous.map((image) => (image.id === id ? next : image)),
        'newest',
      ));
    }
    return next;
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    const existing = await getGalleryMeta(id);
    if (!existing) throw new Error('没有找到这张图片。');
    return updateImage(id, { favorite: !existing.favorite });
  }, [updateImage]);

  const deleteImage = useCallback(async (id) => {
    await deleteGalleryImageRecord(id);
    if (mountedRef.current) {
      setImages((previous) => previous.filter((image) => image.id !== id));
    }
    return true;
  }, []);

  const getImageBlob = useCallback((id) => getGalleryImageBlob(id), []);

  const stats = useMemo(() => {
    let reference = 0;
    let artwork = 0;
    let favorite = 0;
    let bytes = 0;
    for (const image of images) {
      if (image.usage === 'reference') reference += 1;
      else artwork += 1;
      if (image.favorite) favorite += 1;
      bytes += Number(image.size) || 0;
    }
    return {
      total: images.length,
      reference,
      artwork,
      favorite,
      bytes,
      usageLabel: (usage) => getUsageMeta(usage).label,
    };
  }, [images]);

  return {
    supported,
    status,
    error,
    images,
    stats,
    lastLoadedAt,
    refresh,
    addImages,
    updateImage,
    toggleFavorite,
    deleteImage,
    getImageBlob,
  };
}
