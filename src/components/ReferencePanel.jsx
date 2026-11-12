import { useLab } from '../context/LabContext.jsx';
import { REFERENCE_CATEGORIES, formatFileSize, getCategoryMeta } from '../data/gallery.js';
import { Icon } from './Icon.jsx';
import { Switch } from './FormControls.jsx';
import { BlobImage } from './BlobImage.jsx';

export function ReferencePanel() {
  const {
    current,
    currentReferenceImage,
    referenceCandidates,
    settings,
    gallery,
    navigate,
    toggleReferenceEnabled,
    toggleReferenceLock,
    rerollReference,
    toggleReferenceCategory,
  } = useLab();

  const reference = current.reference;
  const image = currentReferenceImage;
  const category = getCategoryMeta(
    image?.category || reference.imageCategory,
  );
  const selectedCategories = new Set(settings.referenceCategories);
  const disabled = !reference.enabled;
  const loading = gallery.status === 'loading';
  const galleryError = gallery.status === 'error' || gallery.status === 'unsupported';
  const noCandidates = !loading && !galleryError && !disabled && referenceCandidates.length === 0;
  const canReroll = reference.enabled && !reference.locked && referenceCandidates.length > 0;

  return (
    <section className={`panel reference-panel ${disabled ? 'is-disabled' : ''} ${reference.locked ? 'is-locked' : ''}`.trim()} aria-labelledby="reference-title">
      <div className="section-heading reference-heading">
        <div className="section-title-wrap">
          <span className="step-number">05</span>
          <div>
            <span className="eyebrow">REFERENCE MATERIALS</span>
            <h2 id="reference-title">参考素材</h2>
          </div>
        </div>
        <div className="section-heading-actions reference-actions">
          <span className="soft-count">
            {referenceCandidates.length} 张可用
          </span>
          <Switch
            checked={reference.enabled}
            onChange={toggleReferenceEnabled}
            disabled={reference.locked}
            label={`参考素材随机${reference.enabled ? '已开启' : '已关闭'}`}
          />
          <button
            type="button"
            className={`icon-button ${reference.locked ? 'is-active' : ''}`.trim()}
            onClick={toggleReferenceLock}
            disabled={!reference.imageId || disabled}
            aria-label={reference.locked ? '解除参考素材锁定' : '锁定参考素材'}
            title={reference.locked ? '解除锁定' : '锁定参考素材'}
          >
            <Icon name={reference.locked ? 'lock' : 'unlock'} size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={rerollReference}
            disabled={!canReroll}
            aria-label="重抽参考素材"
            title={reference.locked ? '请先解除锁定' : '只重抽参考素材'}
          >
            <Icon name="dice" size={17} />
          </button>
        </div>
      </div>

      <div className="reference-body">
        <div className={`reference-preview ${disabled ? 'is-disabled' : ''}`.trim()}>
          {image ? (
            <>
              <BlobImage
                blob={image.thumbBlob}
                alt={`参考素材：${image.name}`}
                className="reference-image"
                fit="cover"
                loading="eager"
                onClick={() => navigate('gallery')}
              />
              <div className="reference-preview-top">
                <span className="reference-usage">
                  <Icon name="image" size={12} />
                  参考素材
                </span>
                {reference.locked ? (
                  <span className="locked-chip"><Icon name="lock" size={12} /> 已锁定</span>
                ) : null}
              </div>
              <div className="reference-preview-bottom">
                <span className="reference-category-badge" style={{ '--reference-color': category.color }}>
                  {category.label}
                </span>
                <span className="reference-size">{formatFileSize(image.size)}</span>
              </div>
            </>
          ) : (
            <div className="reference-placeholder">
              <span className="reference-placeholder-icon">
                <Icon name={galleryError ? 'alert' : disabled ? 'image' : 'plus'} size={28} />
              </span>
              <strong>
                {galleryError
                  ? '图库暂不可用'
                  : loading
                    ? '正在读取图库…'
                    : disabled
                      ? '参考素材模块已关闭'
                      : noCandidates
                        ? '没有符合条件的参考素材'
                        : '还没有选中的参考素材'}
              </strong>
              <p>
                {galleryError
                  ? gallery.error || '请检查浏览器 IndexedDB 权限。'
                  : disabled
                    ? '开启后，开始抽取时会从参考素材中选择一张图片。'
                    : loading
                      ? '稍候即可使用图库中的参考素材。'
                      : noCandidates
                        ? '当前参考分类下没有可用素材。可以在图库上传，或在抽取设置中调整分类。'
                        : '点击右上角骰子抽取一张参考素材，或直接开始抽取。'}
              </p>
              {!loading ? (
                <button type="button" className="button button-small button-secondary" onClick={() => navigate('gallery')}>
                  <Icon name="image" size={14} />
                  前往我的图库
                </button>
              ) : null}
            </div>
          )}
          {disabled && image ? (
            <div className="reference-off-overlay">
              <Icon name="image" size={20} />
              模块已关闭
            </div>
          ) : null}
        </div>

        <div className="reference-copy">
          <div className="reference-copy-head">
            <div>
              <span className="eyebrow">CURRENT MATERIAL</span>
              <h3>{image?.name || reference.imageName || '等待抽取参考素材'}</h3>
            </div>
            {image?.favorite ? <span className="mini-status"><Icon name="heart" size={11} /> 图库收藏</span> : null}
          </div>

          <p className="reference-description">
            {image?.description
              || (image
                ? '从图库中随机选中的参考素材。仅用于绘画提示，不会混入个人作品。'
                : '只从参考素材中抽取图片，个人作品默认不参与。')}
          </p>

          {image?.tags?.length ? (
            <div className="reference-tags">
              {image.tags.map((tag) => <span key={tag}>#{tag}</span>)}
            </div>
          ) : null}

          <div className="reference-category-picker">
            <div className="reference-category-head">
              <strong>参与抽取的素材分类</strong>
              <span>{referenceCandidates.length} 张可用 · 至少保留一个分类</span>
            </div>
            <div className="reference-category-chips">
              {REFERENCE_CATEGORIES.map((item) => {
                const checked = selectedCategories.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`reference-category-chip ${checked ? 'is-selected' : ''}`.trim()}
                    onClick={() => toggleReferenceCategory(item.id)}
                    aria-pressed={checked}
                    style={{ '--reference-color': item.color }}
                  >
                    <span className="reference-category-dot" />
                    {item.label}
                    {checked ? <Icon name="check" size={11} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="reference-footer">
            <span>
              <Icon name="info" size={13} />
              仅从参考素材抽取，个人作品不会混入。
            </span>
            <button type="button" className="text-link" onClick={() => navigate('gallery')}>
              管理图库
              <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
