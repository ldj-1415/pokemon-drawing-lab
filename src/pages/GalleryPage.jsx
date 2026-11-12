import { useEffect, useMemo, useRef, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import {
  ALL_GALLERY_CATEGORIES,
  ARTWORK_CATEGORIES,
  GALLERY_SORT_OPTIONS,
  GALLERY_VIEWS,
  REFERENCE_CATEGORIES,
  formatFileSize,
} from '../data/gallery.js';
import { matchesGallerySearch, sortGalleryImages } from '../utils/gallery.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Icon } from '../components/Icon.jsx';
import { GalleryImageCard } from '../components/GalleryImageCard.jsx';
import { GalleryUploadModal } from '../components/GalleryUploadModal.jsx';
import { GalleryEditModal } from '../components/GalleryEditModal.jsx';
import { GalleryPreviewModal } from '../components/GalleryPreviewModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

function hasDraggedFiles(event) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

export function GalleryPage() {
  const {
    gallery,
    dexMap,
    toggleGalleryFavorite,
    deleteGalleryImage,
    refreshGallery,
  } = useLab();
  const [view, setView] = useState('all');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadUsage, setUploadUsage] = useState('reference');
  const [previewImage, setPreviewImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);

  useEffect(() => {
    const resetDrag = () => {
      dragDepth.current = 0;
      setDragActive(false);
    };
    window.addEventListener('dragend', resetDrag);
    window.addEventListener('blur', resetDrag);
    return () => {
      window.removeEventListener('dragend', resetDrag);
      window.removeEventListener('blur', resetDrag);
    };
  }, []);

  const galleryById = useMemo(
    () => new Map(gallery.images.map((image) => [image.id, image])),
    [gallery.images],
  );
  const livePreview = previewImage ? galleryById.get(previewImage.id) || previewImage : null;
  const liveEdit = editImage ? galleryById.get(editImage.id) || editImage : null;

  const categoryOptions = view === 'reference'
    ? REFERENCE_CATEGORIES
    : view === 'artwork'
      ? ARTWORK_CATEGORIES
      : ALL_GALLERY_CATEGORIES;

  const filteredImages = useMemo(() => {
    let list = gallery.images;
    if (view === 'reference') list = list.filter((image) => image.usage === 'reference');
    if (view === 'artwork') list = list.filter((image) => image.usage === 'artwork');
    if (view === 'favorites') list = list.filter((image) => image.favorite);
    if (category !== 'all') list = list.filter((image) => image.category === category);
    if (query.trim()) {
      list = list.filter((image) => matchesGallerySearch(
        image,
        query,
        image.pokemonId ? dexMap.get(image.pokemonId) : null,
      ));
    }
    return sortGalleryImages(list, sort);
  }, [gallery.images, view, category, query, sort, dexMap]);

  const activeView = GALLERY_VIEWS.find((item) => item.id === view) || GALLERY_VIEWS[0];
  const viewCounts = {
    all: gallery.stats.total,
    reference: gallery.stats.reference,
    artwork: gallery.stats.artwork,
    favorites: gallery.stats.favorite,
  };
  const referenceCategorySet = new Set(REFERENCE_CATEGORIES.map((item) => item.id));
  const artworkCategorySet = new Set(ARTWORK_CATEGORIES.map((item) => item.id));

  const openUpload = (files = []) => {
    if (gallery.status === 'unsupported' || gallery.status === 'error') return;
    setUploadFiles(files);
    setUploadUsage(view === 'artwork' ? 'artwork' : 'reference');
    setUploadOpen(true);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length) openUpload(files);
  };

  const handleViewChange = (nextView) => {
    setView(nextView);
    if (nextView === 'reference' && category !== 'all' && !referenceCategorySet.has(category)) {
      setCategory('all');
    }
    if (nextView === 'artwork' && category !== 'all' && !artworkCategorySet.has(category)) {
      setCategory('all');
    }
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setView('all');
  };

  const requestDelete = (image) => {
    setPreviewImage(null);
    setEditImage(null);
    setDeleteTarget(image);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteGalleryImage(deleteTarget.id);
    if (result.ok) setDeleteTarget(null);
  };

  const handlePreviewEdit = (image) => {
    setPreviewImage(null);
    setEditImage(image);
  };

  const isLoading = gallery.status === 'loading' && gallery.images.length === 0;
  const unavailable = gallery.status === 'unsupported' || gallery.status === 'error';
  const noImagesAtAll = gallery.status === 'ready' && gallery.images.length === 0;
  const noFilteredImages = !isLoading && !unavailable && gallery.images.length > 0 && filteredImages.length === 0;

  return (
    <div
      className={`page page-gallery ${dragActive ? 'is-drag-active' : ''}`.trim()}
      onDragEnter={(event) => {
        if (!hasDraggedFiles(event)) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragActive(true);
      }}
      onDragOver={(event) => {
        if (!hasDraggedFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragActive(false);
      }}
      onDrop={handleDrop}
    >
      <PageHeader
        eyebrow="MY GALLERY"
        title="我的图库"
        description="统一管理绘画参考素材和个人作品。参考素材可以参与工作台随机，个人作品只用于整理与回顾。"
        actions={(
          <>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => refreshGallery()}
              disabled={gallery.status === 'loading'}
            >
              <Icon name="refresh" size={16} />
              刷新
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => openUpload([])}
              disabled={unavailable}
            >
              <Icon name="upload" size={17} />
              上传图片
            </button>
          </>
        )}
      />

      <div className="gallery-stats">
        <div className="gallery-stat-card">
          <span className="gallery-stat-icon"><Icon name="grid" size={20} /></span>
          <div><strong>{gallery.stats.total}</strong><span>全部图片</span></div>
        </div>
        <div className="gallery-stat-card">
          <span className="gallery-stat-icon reference"><Icon name="image" size={20} /></span>
          <div><strong>{gallery.stats.reference}</strong><span>参考素材</span></div>
        </div>
        <div className="gallery-stat-card">
          <span className="gallery-stat-icon artwork"><Icon name="palette" size={20} /></span>
          <div><strong>{gallery.stats.artwork}</strong><span>个人作品</span></div>
        </div>
        <div className="gallery-stat-card">
          <span className="gallery-stat-icon favorite"><Icon name="heart" size={20} /></span>
          <div><strong>{gallery.stats.favorite}</strong><span>收藏图片</span></div>
        </div>
        <div className="gallery-stat-card gallery-stat-storage">
          <span className="gallery-stat-icon"><Icon name="database" size={20} /></span>
          <div><strong>{formatFileSize(gallery.stats.bytes)}</strong><span>图片文件占用</span></div>
        </div>
      </div>

      <div className="gallery-view-tabs" role="tablist" aria-label="图库视图">
        {GALLERY_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            className={`gallery-view-tab ${view === item.id ? 'is-active' : ''}`.trim()}
            onClick={() => handleViewChange(item.id)}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
            <b>{viewCounts[item.id]}</b>
          </button>
        ))}
      </div>

      <div className="panel gallery-toolbar">
        <label className="gallery-search-field">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索图片名称、宝可梦名称、标签或描述"
            aria-label="搜索图库"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="清空图库搜索">
              <Icon name="close" size={14} />
            </button>
          ) : null}
        </label>

        <div className="gallery-filter-group">
          <label className="gallery-select-field">
            <span>分类</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">全部分类</option>
              {view === 'all' || view === 'favorites' ? (
                <>
                  <optgroup label="参考素材">
                    {REFERENCE_CATEGORIES.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="个人作品">
                    {ARTWORK_CATEGORIES.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </optgroup>
                </>
              ) : categoryOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="gallery-select-field">
            <span>排序</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              {GALLERY_SORT_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="gallery-toolbar-note">
          <Icon name="info" size={13} />
          点击上传或把图片拖到页面任意位置
        </div>
      </div>

      {unavailable ? (
        <div className="alert alert-error">
          <span className="alert-icon"><Icon name="alert" size={19} /></span>
          <div>
            <strong>图库无法打开</strong>
            <p>{gallery.error || '当前浏览器不支持 IndexedDB，无法保存图片。'}</p>
          </div>
          <button type="button" className="button button-small button-secondary" onClick={() => refreshGallery()}>
            重试
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="gallery-grid" aria-label="正在加载图库">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="gallery-card gallery-card-skeleton" key={index}>
              <div className="gallery-skeleton-media" />
              <div className="gallery-skeleton-line" />
              <div className="gallery-skeleton-line short" />
            </div>
          ))}
        </div>
      ) : null}

      {noImagesAtAll ? (
        <EmptyState
          icon="image"
          title="图库还是空的"
          description="上传场景、构图、配色、动作或宝可梦参考素材，它们就可以参与工作台的随机参考图片模块。也可以保存自己的绘画作品。"
          action={(
            <div className="empty-actions-row">
              <button type="button" className="button button-primary" onClick={() => openUpload([])}>
                <Icon name="upload" size={17} />
                上传第一张图片
              </button>
              <span className="gallery-drop-hint">
                <Icon name="image" size={14} />
                支持拖拽多张 JPG / PNG / WEBP
              </span>
            </div>
          )}
        />
      ) : null}

      {noFilteredImages ? (
        <EmptyState
          icon="search"
          title="没有符合条件的图片"
          description={`「${activeView.label}」中找不到匹配当前搜索、分类或排序条件的图片。`}
          action={(
            <button type="button" className="button button-secondary" onClick={clearFilters}>
              <Icon name="reset" size={16} />
              清除筛选
            </button>
          )}
        />
      ) : null}

      {!isLoading && !unavailable && filteredImages.length ? (
        <div className="gallery-grid">
          {filteredImages.map((image) => (
            <GalleryImageCard
              key={image.id}
              image={image}
              onPreview={setPreviewImage}
              onEdit={setEditImage}
              onDelete={requestDelete}
              onToggleFavorite={(item) => toggleGalleryFavorite(item.id)}
            />
          ))}
        </div>
      ) : null}

      <div className="gallery-page-footnote">
        <span><Icon name="database" size={13} /> 图片二进制和缩略图存储在 IndexedDB，localStorage 只保存轻量设置。</span>
        <span><Icon name="lock" size={13} /> 参考素材可随机，个人作品默认不参与随机。</span>
      </div>

      {dragActive ? (
        <div className="gallery-drop-overlay">
          <div className="gallery-drop-card">
            <span className="gallery-drop-icon"><Icon name="upload" size={30} /></span>
            <strong>松开鼠标，上传到我的图库</strong>
            <p>支持一次拖入多张 JPG、JPEG、PNG、WEBP，单张最大 10MB。</p>
          </div>
        </div>
      ) : null}

      <GalleryUploadModal
        open={uploadOpen}
        initialFiles={uploadFiles}
        defaultUsage={uploadUsage}
        onClose={() => {
          setUploadOpen(false);
          setUploadFiles([]);
        }}
      />

      <GalleryEditModal
        open={Boolean(liveEdit)}
        image={liveEdit}
        onClose={() => setEditImage(null)}
      />

      <GalleryPreviewModal
        open={Boolean(livePreview)}
        image={livePreview}
        onClose={() => setPreviewImage(null)}
        onEdit={handlePreviewEdit}
        onDelete={requestDelete}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="从图库删除这张图片？"
        description={deleteTarget
          ? `「${deleteTarget.name}」的元数据、缩略图和 IndexedDB 原始文件都会被永久删除。已保存的历史组合中会显示参考图缺失。`
          : ''}
        confirmLabel="永久删除"
        cancelLabel="保留图片"
        tone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
