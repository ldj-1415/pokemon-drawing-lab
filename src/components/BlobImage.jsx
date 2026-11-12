import { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';

export function BlobImage({
  blob,
  alt = '图库图片',
  className = '',
  onClick,
  loading = 'lazy',
  fit = 'cover',
}) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!(blob instanceof Blob)) {
      setUrl(null);
      setFailed(false);
      setLoaded(false);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    setFailed(false);
    setLoaded(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url || failed) {
    return (
      <div className={`blob-image-placeholder ${className}`.trim()}>
        <Icon name="image" size={24} />
        <span>图片不可用</span>
      </div>
    );
  }

  return (
    <div
      className={`blob-image ${loaded ? 'is-loaded' : ''} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event);
        }
      } : undefined}
    >
      {!loaded ? <span className="blob-image-shimmer" aria-hidden="true" /> : null}
      <img
        src={url}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable="false"
        style={{ objectFit: fit }}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
