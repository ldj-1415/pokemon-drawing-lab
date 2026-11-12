import { useEffect, useMemo, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import {
  ARTWORK_CATEGORIES,
  MAX_GALLERY_TAGS,
  REFERENCE_CATEGORIES,
  formatFileSize,
  formatGalleryDate,
  getCategoryMeta,
  getDefaultCategory,
  getUsageMeta,
} from '../data/gallery.js';
import { normalizeGalleryTags, todayInputValue } from '../utils/gallery.js';
import { searchPokemon } from '../utils/search.js';
import { Modal } from './Modal.jsx';
import { BlobImage } from './BlobImage.jsx';
import { Icon } from './Icon.jsx';

export function GalleryEditModal({ open, onClose, image }) {
  const { dex, dexMap, updateGalleryImage, notify } = useLab();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [usage, setUsage] = useState('reference');
  const [category, setCategory] = useState('scene');
  const [favorite, setFavorite] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [pokemonId, setPokemonId] = useState(null);
  const [pokemonName, setPokemonName] = useState('');
  const [pokemonQuery, setPokemonQuery] = useState('');
  const [drawingDate, setDrawingDate] = useState('');
  const [tool, setTool] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open || !image) return;
    setName(image.name || '');
    setDescription(image.description || '');
    setNotes(image.notes || '');
    setUsage(image.usage || 'reference');
    setCategory(image.category || getDefaultCategory(image.usage || 'reference'));
    setFavorite(Boolean(image.favorite));
    setTags(image.tags || []);
    setTagInput('');
    setPokemonId(image.pokemonId || null);
    setPokemonName(image.pokemonName || '');
    setPokemonQuery('');
    setDrawingDate(image.drawingDate || (image.usage === 'artwork' ? todayInputValue() : ''));
    setTool(image.tool || '');
    setSaving(false);
    setFormError('');
  }, [open, image?.id]);

  const categoryOptions = usage === 'artwork' ? ARTWORK_CATEGORIES : REFERENCE_CATEGORIES;
  const categoryMeta = getCategoryMeta(category);
  const selectedPokemon = pokemonId ? dexMap.get(pokemonId) : null;
  const pokemonResults = useMemo(
    () => (pokemonQuery.trim() ? searchPokemon(dex, pokemonQuery, 6) : []),
    [dex, pokemonQuery],
  );

  const addTags = (raw) => {
    const candidates = String(raw || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
    if (!candidates.length) return;
    const merged = normalizeGalleryTags([...tags, ...candidates]);
    if (merged.length === tags.length) {
      notify('标签为空、重复，或已经达到数量上限。', 'info');
      return;
    }
    setTags(merged);
    setTagInput('');
  };

  const handleUsageChange = (nextUsage) => {
    setUsage(nextUsage);
    setCategory(getDefaultCategory(nextUsage));
    if (nextUsage === 'artwork' && !drawingDate) setDrawingDate(todayInputValue());
  };

  const handleSave = async () => {
    if (!image) return;
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('请填写图片名称。');
      return;
    }
    const pendingTags = normalizeGalleryTags([
      ...tags,
      ...String(tagInput || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
    ]);
    setSaving(true);
    setFormError('');
    const result = await updateGalleryImage(image.id, {
      name: cleanName,
      description,
      notes,
      usage,
      category,
      favorite,
      tags: pendingTags,
      pokemonId: usage === 'artwork' ? pokemonId : null,
      pokemonName: usage === 'artwork' ? pokemonName : '',
      drawingDate: usage === 'artwork' ? drawingDate : '',
      tool: usage === 'artwork' ? tool : '',
    });
    setSaving(false);
    if (result.ok) onClose();
  };

  if (!image) return null;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="编辑图库图片"
      eyebrow="MY GALLERY · EDIT"
      icon="palette"
      size="lg"
      className="gallery-edit-modal"
      footer={(
        <>
          <button type="button" className="button button-ghost" onClick={onClose} disabled={saving}>
            取消
          </button>
          <button type="button" className="button button-primary" onClick={handleSave} disabled={saving}>
            <Icon name="check" size={16} />
            {saving ? '保存中…' : '保存修改'}
          </button>
        </>
      )}
    >
      <div className="gallery-edit-summary">
        <BlobImage blob={image.thumbBlob} alt={image.name} className="gallery-edit-thumb" fit="cover" />
        <div>
          <span className={`gallery-usage-badge usage-${image.usage}`}>
            {getUsageMeta(image.usage).label}
          </span>
          <strong>{image.name}</strong>
          <small>
            {image.imageWidth && image.imageHeight ? `${image.imageWidth} × ${image.imageHeight}px · ` : ''}
            {formatFileSize(image.size)} · 上传于 {formatGalleryDate(image.createdAt)}
          </small>
        </div>
      </div>

      {formError ? (
        <div className="inline-note inline-note-warning">
          <Icon name="alert" size={15} />
          {formError}
        </div>
      ) : null}

      <div className="gallery-form-grid">
        <label className="form-field form-field-wide">
          <span>图片名称 <b>*</b></span>
          <input
            type="text"
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="给这张图片起一个名字"
          />
        </label>

        <div className="form-field form-field-wide">
          <span>图片用途</span>
          <div className="edit-usage-toggle">
            {['reference', 'artwork'].map((id) => {
              const meta = getUsageMeta(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`edit-usage-option ${usage === id ? 'is-selected' : ''}`.trim()}
                  onClick={() => handleUsageChange(id)}
                >
                  <Icon name={meta.icon} size={16} />
                  <span>
                    <strong>{meta.label}</strong>
                    <small>{id === 'reference' ? '参与随机' : '不参与随机'}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="form-field">
          <span>分类</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <small>{categoryMeta.description}</small>
        </label>

        <div className="form-field">
          <span>收藏状态</span>
          <button
            type="button"
            className={`favorite-toggle ${favorite ? 'is-favorite' : ''}`.trim()}
            onClick={() => setFavorite((value) => !value)}
          >
            <Icon name="heart" size={16} />
            {favorite ? '已收藏图片' : '加入收藏图片'}
          </button>
        </div>

        <label className="form-field form-field-wide">
          <span>描述</span>
          <textarea
            value={description}
            rows={2}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="画面内容、灵感来源或使用说明"
          />
        </label>

        <div className="form-field form-field-wide">
          <span>标签 <small>用于搜索和筛选</small></span>
          <div className="tag-editor">
            {tags.map((tag) => (
              <span className="gallery-tag editable" key={tag}>
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((previous) => previous.filter((item) => item !== tag))}
                  aria-label={`移除标签 ${tag}`}
                >
                  <Icon name="close" size={11} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              maxLength={16}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  addTags(tagInput);
                }
              }}
              placeholder={tags.length >= MAX_GALLERY_TAGS ? '标签已满' : '输入标签后按回车'}
              disabled={tags.length >= MAX_GALLERY_TAGS}
            />
            <button
              type="button"
              className="tag-add-button"
              onClick={() => addTags(tagInput)}
              disabled={!tagInput.trim() || tags.length >= MAX_GALLERY_TAGS}
            >
              添加
            </button>
          </div>
        </div>

        {usage === 'artwork' ? (
          <>
            <div className="form-field form-field-wide">
              <span>对应宝可梦</span>
              {selectedPokemon || pokemonName ? (
                <span className="selected-pokemon">
                  {selectedPokemon ? (
                    <img
                      src={selectedPokemon.sprite}
                      alt=""
                      loading="lazy"
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <span>{selectedPokemon?.nameZh || pokemonName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPokemonId(null);
                      setPokemonName('');
                    }}
                    aria-label="清除对应宝可梦"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ) : null}
              <div className="gallery-pokemon-search">
                <Icon name="search" size={15} />
                <input
                  type="text"
                  value={pokemonQuery}
                  onChange={(event) => setPokemonQuery(event.target.value)}
                  placeholder="搜索宝可梦中文名、英文名或编号"
                />
              </div>
              {pokemonResults.length ? (
                <div className="gallery-pokemon-results">
                  {pokemonResults.map((pokemon) => (
                    <button
                      key={pokemon.id}
                      type="button"
                      onClick={() => {
                        setPokemonId(pokemon.id);
                        setPokemonName(pokemon.nameZh || pokemon.nameEn);
                        setPokemonQuery('');
                      }}
                    >
                      <img src={pokemon.sprite} alt="" loading="lazy" />
                      <span>{pokemon.nameZh || pokemon.nameEn}</span>
                      <small>#{String(pokemon.id).padStart(4, '0')}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="form-field">
              <span>绘画日期</span>
              <input
                type="date"
                value={drawingDate}
                onChange={(event) => setDrawingDate(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>绘画工具</span>
              <input
                type="text"
                value={tool}
                maxLength={80}
                onChange={(event) => setTool(event.target.value)}
                placeholder="例如：Procreate、CSP、彩铅"
              />
            </label>

            <label className="form-field form-field-wide">
              <span>作品备注</span>
              <textarea
                value={notes}
                rows={3}
                maxLength={2000}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="创作过程、想改进的地方、参考来源等"
              />
            </label>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
