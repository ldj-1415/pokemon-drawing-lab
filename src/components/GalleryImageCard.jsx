import {
  formatFileSize,
  formatGalleryDate,
  getCategoryMeta,
  getUsageMeta,
} from '../data/gallery.js';
import { BlobImage } from './BlobImage.jsx';
import { Icon } from './Icon.jsx';

export function GalleryImageCard({
  image,
  onPreview,
  onEdit,
  onDelete,
  onToggleFavorite,
}) {
  const usage = getUsageMeta(image.usage);
  const category = getCategoryMeta(image.category);
  const tags = image.tags || [];

  return (
    <article className={`gallery-card usage-${image.usage}`}>
      <div className="gallery-card-media">
        <button
          type="button"
          className="gallery-thumb-button"
          onClick={() => onPreview?.(image)}
          aria-label={`预览 ${image.name}`}
        >
          <BlobImage
            blob={image.thumbBlob}
            alt={image.name}
            className="gallery-thumb"
            fit="cover"
          />
          <span className="gallery-preview-hint">
            <Icon name="search" size={16} />
            查看大图
          </span>
        </button>
        <span className={`gallery-usage-badge usage-${image.usage}`}>
          <Icon name={usage.icon} size={11} />
          {usage.label}
        </span>
        <button
          type="button"
          className={`gallery-favorite-button ${image.favorite ? 'is-favorite' : ''}`.trim()}
          onClick={() => onToggleFavorite?.(image)}
          aria-label={image.favorite ? `取消收藏 ${image.name}` : `收藏 ${image.name}`}
          title={image.favorite ? '取消收藏' : '收藏图片'}
        >
          <Icon name="heart" size={17} />
        </button>
      </div>

      <div className="gallery-card-body">
        <div className="gallery-card-title-row">
          <div>
            <h3 title={image.name}>{image.name}</h3>
            <span className="gallery-card-category" style={{ '--reference-color': category.color }}>
              {category.label}
            </span>
          </div>
          <span className="gallery-file-size">{formatFileSize(image.size)}</span>
        </div>

        {image.description ? <p className="gallery-card-description">{image.description}</p> : null}

        {tags.length ? (
          <div className="gallery-tag-list">
            {tags.slice(0, 4).map((tag) => <span className="gallery-tag" key={tag}>#{tag}</span>)}
            {tags.length > 4 ? <span className="gallery-tag more">+{tags.length - 4}</span> : null}
          </div>
        ) : null}

        <div className="gallery-card-meta">
          {image.usage === 'artwork' ? (
            <>
              <span><Icon name="target" size={12} /> {image.pokemonName || '未关联宝可梦'}</span>
              <span><Icon name="clock" size={12} /> {image.drawingDate ? formatGalleryDate(image.drawingDate) : '未填日期'}</span>
            </>
          ) : (
            <>
              <span><Icon name="image" size={12} /> {image.imageWidth && image.imageHeight ? `${image.imageWidth}×${image.imageHeight}` : '参考素材'}</span>
              <span><Icon name="clock" size={12} /> {formatGalleryDate(image.createdAt)}</span>
            </>
          )}
        </div>

        <div className="gallery-card-actions">
          <button type="button" className="button button-small button-secondary" onClick={() => onPreview?.(image)}>
            <Icon name="search" size={14} />
            预览
          </button>
          <button type="button" className="button button-small button-ghost" onClick={() => onEdit?.(image)}>
            <Icon name="sliders" size={14} />
            编辑
          </button>
          <button
            type="button"
            className="button button-small button-ghost button-danger-text"
            onClick={() => onDelete?.(image)}
          >
            <Icon name="trash" size={14} />
            删除
          </button>
        </div>
      </div>
    </article>
  );
}
