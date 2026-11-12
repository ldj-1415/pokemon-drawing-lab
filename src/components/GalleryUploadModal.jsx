import { useEffect, useRef, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import {
  ARTWORK_CATEGORIES,
  GALLERY_ACCEPT,
  MAX_GALLERY_FILE_BYTES,
  REFERENCE_CATEGORIES,
  formatFileSize,
  getDefaultCategory,
} from '../data/gallery.js';
import { validateGalleryFile } from '../utils/gallery.js';
import { Modal } from './Modal.jsx';
import { Icon } from './Icon.jsx';
import { BlobImage } from './BlobImage.jsx';

let localItemCounter = 0;
const makeItemKey = (file) => `${file.name}-${file.size}-${file.lastModified}-${localItemCounter += 1}`;

function itemFromFile(file) {
  const validation = validateGalleryFile(file);
  return {
    key: makeItemKey(file),
    file,
    error: validation.ok ? null : validation.error,
    status: validation.ok ? 'ready' : 'invalid',
    message: validation.ok ? '' : validation.error,
  };
}

export function GalleryUploadModal({ open, onClose, initialFiles = [], defaultUsage = 'reference' }) {
  const { addGalleryImages, notify } = useLab();
  const [items, setItems] = useState([]);
  const [usage, setUsage] = useState(defaultUsage);
  const [category, setCategory] = useState(getDefaultCategory(defaultUsage));
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFinished, setUploadFinished] = useState(false);
  const inputRef = useRef(null);
  const cancelRef = useRef(false);
  const initialFilesRef = useRef(initialFiles);
  initialFilesRef.current = initialFiles;
  const defaultUsageRef = useRef(defaultUsage);
  defaultUsageRef.current = defaultUsage;

  useEffect(() => {
    if (!open) return;
    const initial = Array.from(initialFilesRef.current || []).map(itemFromFile);
    setItems(initial);
    setUsage(defaultUsageRef.current);
    setCategory(getDefaultCategory(defaultUsageRef.current));
    setUploading(false);
    setProgress(null);
    setDragOver(false);
    setUploadFinished(false);
    cancelRef.current = false;
  }, [open]);

  const appendFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setItems((previous) => {
      const existingKeys = new Set(previous.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
      const next = [...previous];
      for (const file of files) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        next.push(itemFromFile(file));
      }
      return next;
    });
    setUploadFinished(false);
  };

  const handleFiles = (fileList) => {
    appendFiles(fileList);
  };

  const removeItem = (key) => {
    if (uploading) return;
    setItems((previous) => previous.filter((item) => item.key !== key));
  };

  const handleUsageChange = (nextUsage) => {
    setUsage(nextUsage);
    setCategory(getDefaultCategory(nextUsage));
  };

  const startUpload = async () => {
    const readyItems = items.filter((item) => item.status === 'ready' && !item.error);
    if (!readyItems.length || uploading) {
      if (!readyItems.length) notify('请先选择至少一张有效图片。', 'warning');
      return;
    }
    setUploading(true);
    setUploadFinished(false);
    cancelRef.current = false;
    setProgress({ done: 0, total: readyItems.length, message: '准备上传…', percent: 0 });
    let results;
    try {
      results = await addGalleryImages(
        readyItems.map((item) => item.file),
        {
          usage,
          category,
          shouldCancel: () => cancelRef.current,
          onProgress: (state) => {
            const total = state.total || readyItems.length;
            setProgress({
              ...state,
              total,
              percent: total ? Math.min(100, Math.round(((state.done || 0) / total) * 100)) : 0,
            });
          },
        },
      );
    } catch (uploadError) {
      console.error('[Pokémon Drawing Lab] 批量上传失败', uploadError);
      notify(uploadError.message || '上传失败，请重试。', 'error', 6500);
      setUploading(false);
      setProgress((current) => ({
        ...(current || {}),
        message: '上传失败，请检查浏览器存储空间。',
        percent: 0,
      }));
      return;
    }

    const resultByFile = new Map();
    results.forEach((result, index) => {
      const file = result.file || readyItems[index]?.file;
      if (file) resultByFile.set(`${file.name}-${file.size}-${file.lastModified}`, result);
    });
    setItems((previous) => previous.map((item) => {
      const key = `${item.file.name}-${item.file.size}-${item.file.lastModified}`;
      const result = resultByFile.get(key);
      if (!result) return item;
      return {
        ...item,
        status: result.status,
        message: result.message || '',
        storedImage: result.image || null,
      };
    }));

    const successCount = results.filter((result) => result.status === 'success').length;
    const duplicateCount = results.filter((result) => result.status === 'duplicate').length;
    const errorCount = results.filter((result) => result.status === 'error').length;
    const cancelledCount = results.filter((result) => result.status === 'cancelled').length;
    if (successCount) notify(`已成功上传 ${successCount} 张图片。`, 'success', 5000);
    if (duplicateCount) notify(`有 ${duplicateCount} 张图片因重复被跳过。`, 'info', 5500);
    if (errorCount) notify(`有 ${errorCount} 张图片上传失败，请查看列表。`, 'warning', 6000);
    if (cancelledCount) notify('已取消剩余图片上传。', 'info', 4500);
    setProgress((current) => ({
      ...(current || {}),
      done: results.length,
      total: readyItems.length,
      percent: 100,
      message: successCount ? '上传处理完成。' : '没有新图片被保存。',
    }));
    setUploadFinished(true);
    setUploading(false);
  };

  const requestClose = () => {
    if (uploading) {
      notify('上传进行中，请等待完成或点击「取消剩余」。', 'info');
      return;
    }
    onClose();
  };

  const cancelRemaining = () => {
    if (!uploading) return;
    cancelRef.current = true;
    setProgress((current) => ({
      ...(current || {}),
      message: '正在停止剩余文件…',
    }));
  };

  const categoryOptions = usage === 'artwork' ? ARTWORK_CATEGORIES : REFERENCE_CATEGORIES;
  const readyCount = items.filter((item) => item.status === 'ready' && !item.error).length;

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title="上传图库图片"
      eyebrow="MY GALLERY · UPLOAD"
      icon="image"
      size="lg"
      className="gallery-upload-modal"
      footer={(
        <>
          {uploading ? (
            <button type="button" className="button button-ghost" onClick={cancelRemaining}>
              取消剩余
            </button>
          ) : (
            <button type="button" className="button button-ghost" onClick={requestClose}>
              关闭
            </button>
          )}
          {uploadFinished ? (
            <button type="button" className="button button-primary" onClick={onClose}>
              完成
            </button>
          ) : (
            <button
              type="button"
              className="button button-primary"
              onClick={startUpload}
              disabled={!readyCount || uploading}
            >
              <Icon name="upload" size={16} />
              {uploading ? '正在上传…' : readyCount ? `上传 ${readyCount} 张图片` : '上传图片'}
            </button>
          )}
        </>
      )}
    >
      <div className="upload-settings">
        <div className="upload-setting-block">
          <span className="form-label">图片用途</span>
          <div className="upload-usage-tabs">
            <button
              type="button"
              className={`upload-usage-tab ${usage === 'reference' ? 'is-active' : ''}`.trim()}
              onClick={() => handleUsageChange('reference')}
              disabled={uploading}
            >
              <Icon name="image" size={16} />
              <span>
                <strong>参考素材</strong>
                <small>可参与工作台随机</small>
              </span>
            </button>
            <button
              type="button"
              className={`upload-usage-tab ${usage === 'artwork' ? 'is-active' : ''}`.trim()}
              onClick={() => handleUsageChange('artwork')}
              disabled={uploading}
            >
              <Icon name="palette" size={16} />
              <span>
                <strong>个人作品</strong>
                <small>默认不参与随机</small>
              </span>
            </button>
          </div>
        </div>

        <label className="upload-setting-block upload-category-field">
          <span className="form-label">初始分类</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={uploading}
          >
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <small>上传后仍可逐张修改用途、分类和名称。</small>
        </label>
      </div>

      <div
        className={`upload-dropzone ${dragOver ? 'is-dragover' : ''}`.trim()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (uploading) return;
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => {
          if (!uploading) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!uploading) inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={GALLERY_ACCEPT}
          multiple
          hidden
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <span className="upload-dropzone-icon"><Icon name="upload" size={26} /></span>
        <strong>点击选择图片，或拖拽到这里</strong>
        <p>支持 JPG、JPEG、PNG、WEBP，可一次选择多张</p>
        <span className="upload-limit">单张最大 10MB</span>
      </div>

      {items.length ? (
        <div className="upload-file-section">
          <div className="upload-file-head">
            <strong>待处理图片</strong>
            <span>{items.length} 张 · 有效 {readyCount} 张</span>
          </div>
          <div className="upload-file-list">
            {items.map((item) => (
              <div className={`upload-file-row status-${item.status}`} key={item.key}>
                <BlobImage
                  blob={item.file}
                  alt={item.file.name}
                  className="upload-file-thumb"
                  fit="cover"
                />
                <div className="upload-file-copy">
                  <strong title={item.file.name}>{item.file.name}</strong>
                  <span>{formatFileSize(item.file.size)}</span>
                  {item.message ? <small>{item.message}</small> : null}
                </div>
                <span className={`upload-file-status status-${item.status}`}>
                  {item.status === 'ready' ? '待上传'
                    : item.status === 'success' ? '已上传'
                      : item.status === 'duplicate' ? '重复'
                        : item.status === 'cancelled' ? '已取消'
                          : '失败'}
                </span>
                {!uploading && item.status === 'ready' ? (
                  <button
                    type="button"
                    className="icon-button upload-remove"
                    onClick={() => removeItem(item.key)}
                    aria-label={`移除 ${item.file.name}`}
                  >
                    <Icon name="close" size={14} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="upload-hint-row">
          <Icon name="info" size={14} />
          <span>上传时会自动检查重复图片；同一张图片只会保存一次。单张限制为 {formatFileSize(MAX_GALLERY_FILE_BYTES)}。</span>
        </div>
      )}

      {progress ? (
        <div className="upload-progress">
          <div className="upload-progress-head">
            <span>{progress.message || '上传中…'}</span>
            <strong>{progress.percent ?? 0}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress.percent ?? 0}%` }} />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
