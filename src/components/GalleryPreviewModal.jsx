import { useEffect, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import {
  formatFileSize,
  formatGalleryDate,
  getCategoryMeta,
  getUsageMeta,
} from '../data/gallery.js';
import { Icon } from './Icon.jsx';
import { BlobImage } from './BlobImage.jsx';
import { Modal } from './Modal.jsx';

export function GalleryPreviewModal({ open, onClose, image, onEdit, onDelete }) {
  const { getGalleryImageBlob, toggleGalleryFavorite } = useLab();
  const [fullBlob, setFullBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const imageId = image?.id;
  const thumbBlob = image?.thumbBlob;

  useEffect(() => {
    let active = true;
    if (!open || !imageId) {
      setFullBlob(null);
      setLoading(false);
      setLoadError('');
      return undefined;
    }
    setFullBlob(null);
    setLoading(true);
    setLoadError('');
    getGalleryImageBlob(imageId)
      .then((blob) => {
        if (!active) return;
        if (!blob) {
          setLoadError('原始图片文件缺失，正在显示缩略图。');
          setFullBlob(thumbBlob || null);
        } else {
          setFullBlob(blob);
        }
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error.message || '原始图片读取失败，正在显示缩略图。');
        setFullBlob(thumbBlob || null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, imageId, thumbBlob, getGalleryImageBlob]);

  if (!image) return null;

  const usage = getUsageMeta(image.usage);
  const category = getCategoryMeta(image.category);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={image.name}
      eyebrow="MY GALLERY · PREVIEW"
      icon="image"
      size="xl"
      className="gallery-preview-modal"
      footer={(
        <>
          <span className="gallery-preview-footnote">
            <Icon name="database" size={13} />
            图片文件保存在 IndexedDB
          </span>
          <button type="button" className="button button-ghost" onClick={onClose}>关闭预览</button>
          <button type="button" className="button button-secondary" onClick={() => onEdit?.(image)}>
            <Icon name="sliders" size={15} />
            编辑信息
          </button>
          <button
            type="button"
            className={`button button-small ${image.favorite ? 'button-lock-active' : 'button-ghost'}`.trim()}
            onClick={() => toggleGalleryFavorite(image.id)}
          >
            <Icon name="heart" size={15} />
            {image.favorite ? '已收藏' : '收藏'}
          </button>
        </>
      )}
    >
      <div className="gallery-preview-layout">
        <div className="gallery-preview-media">
          {loading ? (
            <div className="gallery-preview-loading">
              <span className="loading-spinner" />
              正在读取原图…
            </div>
          ) : (
            <BlobImage
              blob={fullBlob || image.thumbBlob}
              alt={image.name}
              className="gallery-preview-image"
              fit="contain"
              loading="eager"
            />
          )}
          {loadError ? (
            <div className="inline-note inline-note-warning gallery-preview-warning">
              <Icon name="alert" size={14} />
              {loadError}
            </div>
          ) : null}
        </div>

        <aside className="gallery-preview-info">
          <div className="gallery-preview-badges">
            <span className={`gallery-usage-badge usage-${image.usage}`}>{usage.label}</span>
            <span className="gallery-category-badge" style={{ '--reference-color': category.color }}>
              {category.label}
            </span>
            {image.favorite ? <span className="mini-status"><Icon name="heart" size={11} /> 收藏</span> : null}
          </div>

          {image.description ? <p className="gallery-preview-description">{image.description}</p> : null}

          {image.tags?.length ? (
            <div className="gallery-tag-list">
              {image.tags.map((tag) => <span className="gallery-tag" key={tag}>#{tag}</span>)}
            </div>
          ) : null}

          {image.usage === 'artwork' ? (
            <div className="gallery-detail-list">
              <div>
                <span>对应宝可梦</span>
                <strong>{image.pokemonName || (image.pokemonId ? `#${String(image.pokemonId).padStart(4, '0')}` : '未关联')}</strong>
              </div>
              <div>
                <span>绘画日期</span>
                <strong>{formatGalleryDate(image.drawingDate)}</strong>
              </div>
              <div>
                <span>绘画工具</span>
                <strong>{image.tool || '未填写'}</strong>
              </div>
              {image.notes ? (
                <div>
                  <span>备注</span>
                  <p>{image.notes}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="gallery-detail-list gallery-file-details">
            <div><span>图片尺寸</span><strong>{image.imageWidth && image.imageHeight ? `${image.imageWidth} × ${image.imageHeight}px` : '未知'}</strong></div>
            <div><span>文件大小</span><strong>{formatFileSize(image.size)}</strong></div>
            <div><span>上传时间</span><strong>{formatGalleryDate(image.createdAt)}</strong></div>
            <div><span>文件类型</span><strong>{String(image.mimeType || '').replace('image/', '').toUpperCase() || '未知'}</strong></div>
          </div>

          <div className="gallery-preview-actions">
            <button type="button" className="button button-secondary button-block" onClick={() => onEdit?.(image)}>
              <Icon name="sliders" size={16} />
              编辑名称、分类与信息
            </button>
            <button
              type="button"
              className="button button-ghost button-block button-danger-text"
              onClick={() => onDelete?.(image)}
            >
              <Icon name="trash" size={16} />
              删除这张图片
            </button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
