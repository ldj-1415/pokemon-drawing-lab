import { getCategoryMeta, getUsageMeta } from '../data/gallery.js';
import { pickOne } from './random.js';

export function getReferenceCandidates(images, selectedCategories) {
  const selected = new Set(selectedCategories || []);
  if (!selected.size) return [];
  return (images || []).filter(
    (image) => image.usage === 'reference' && selected.has(image.category),
  );
}

export function createReferenceSnapshot(image) {
  if (!image) return null;
  const category = getCategoryMeta(image.category);
  return {
    imageId: image.id,
    imageName: image.name,
    imageCategory: image.category,
    imageCategoryLabel: category.label,
    imageUsage: getUsageMeta(image.usage).label,
    imageTags: Array.isArray(image.tags) ? [...image.tags] : [],
  };
}

export function pickReferenceImage(candidates, currentImageId, rng = Math.random) {
  if (!candidates?.length) return null;
  const pool = candidates.length > 1
    ? candidates.filter((image) => image.id !== currentImageId)
    : candidates;
  return pickOne(pool.length ? pool : candidates, rng);
}

export function buildReferenceSelection(reference, image) {
  return {
    ...reference,
    imageId: image?.id || null,
    imageName: image?.name || '',
    imageCategory: image?.category || null,
    imageCategoryLabel: image ? getCategoryMeta(image.category).label : '',
    imageTags: image?.tags ? [...image.tags] : [],
    imageUsage: image ? getUsageMeta(image.usage).label : '',
  };
}

/**
 * Applies the reference module rules during a full reroll:
 * disabled and locked modules are preserved; otherwise one eligible reference
 * image is selected, or the current selection is cleared if none remain.
 */
export function randomizeReferenceState(referenceState, candidates, rng = Math.random) {
  const reference = referenceState || {
    enabled: true,
    locked: false,
    imageId: null,
  };
  if (!reference.enabled || reference.locked) return { ...reference };
  const image = pickReferenceImage(candidates, reference.imageId, rng);
  return buildReferenceSelection(reference, image);
}

export function clearReferenceSelection(referenceState) {
  return {
    ...buildReferenceSelection(referenceState, null),
    locked: false,
  };
}
