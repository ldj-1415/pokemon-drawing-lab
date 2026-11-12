import { useLab } from '../context/LabContext.jsx';
import { getSavedSnapshotTitle } from '../utils/composition.js';
import { formatDateTime } from '../utils/format.js';
import { Icon } from './Icon.jsx';
import { PokemonImage } from './PokemonImage.jsx';
import { SceneSummaryChips } from './SceneSummaryChips.jsx';
import { BlobImage } from './BlobImage.jsx';
import { getCategoryMeta } from '../data/gallery.js';

export function SavedCompositionCard({
  entry,
  variant = 'favorite',
  onLoad,
  onDelete,
  onFavorite,
}) {
  const { imageMode, galleryImageMap } = useLab();
  const composition = entry.composition;
  const pokemon = composition?.pokemon || [];
  const title = entry.title || getSavedSnapshotTitle(composition);
  const visible = pokemon.slice(0, 8);
  const hiddenCount = Math.max(0, pokemon.length - visible.length);
  const reference = composition?.reference;
  const referenceImage = reference?.imageId ? galleryImageMap.get(reference.imageId) : null;
  const showReference = reference?.enabled && Boolean(reference.imageId);
  const referenceCategory = getCategoryMeta(referenceImage?.category || reference?.imageCategory);

  return (
    <article className="saved-card">
      <header className="saved-card-head">
        <div className="saved-heading">
          <div className="saved-meta-line">
            <span className={`saved-type-badge saved-type-${variant}`}>
              {variant === 'history' ? entry.action || '历史组合' : '收藏组合'}
            </span>
            <span className="saved-date">
              <Icon name="clock" size={12} />
              {formatDateTime(entry.createdAt)}
            </span>
          </div>
          <h3>{title}</h3>
        </div>
        <span className="saved-count">{pokemon.length} 只</span>
      </header>

      <div className="saved-pokemon-strip">
        {visible.map((item) => (
          <div className="saved-pokemon" key={item.id}>
            <div className="saved-pokemon-image">
              <PokemonImage pokemon={item} mode={imageMode} size="thumb" />
              {item.locked ? <span className="saved-lock"><Icon name="lock" size={10} /></span> : null}
            </div>
            <span>{item.nameZh || item.nameEn}</span>
          </div>
        ))}
        {hiddenCount ? <div className="saved-pokemon-more">+{hiddenCount}</div> : null}
      </div>

      <SceneSummaryChips scenes={composition?.scenes} />

      {showReference ? (
        <div className={`saved-reference ${referenceImage ? '' : 'is-missing'}`.trim()}>
          {referenceImage ? (
            <BlobImage
              blob={referenceImage.thumbBlob}
              alt={`参考图：${referenceImage.name}`}
              className="saved-reference-image"
              fit="cover"
            />
          ) : (
            <span className="saved-reference-missing-icon"><Icon name="image" size={16} /></span>
          )}
          <div className="saved-reference-copy">
            <span className="saved-reference-label">
              <Icon name="image" size={12} />
              参考图
              {reference.locked ? <Icon name="lock" size={11} /> : null}
            </span>
            <strong>{referenceImage?.name || reference.imageName || '参考图片已删除'}</strong>
          </div>
          <span className="saved-reference-category" style={{ '--reference-color': referenceCategory.color }}>
            {referenceCategory.label}
          </span>
        </div>
      ) : null}

      <footer className="saved-card-actions">
        <button type="button" className="button button-small button-primary" onClick={() => onLoad?.(entry.id)}>
          <Icon name="arrow-right" size={15} />
          载入工作台
        </button>
        {variant === 'history' ? (
          <button type="button" className="button button-small button-ghost" onClick={() => onFavorite?.(entry.id)}>
            <Icon name="heart" size={15} />
            加入收藏
          </button>
        ) : null}
        <button
          type="button"
          className="button button-small button-ghost button-danger-text saved-delete"
          onClick={() => onDelete?.(entry.id)}
        >
          <Icon name="trash" size={15} />
          {variant === 'history' ? '删除' : '取消收藏'}
        </button>
      </footer>
    </article>
  );
}
