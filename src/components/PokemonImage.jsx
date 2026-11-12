import { useEffect, useState } from 'react';
import { formatDexNumber } from '../utils/search.js';

export function PokemonImage({
  pokemon,
  mode = 'artwork',
  className = '',
  size = 'normal',
  loading = 'lazy',
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setFailed(false);
    setLoaded(false);
  }, [pokemon?.id, mode]);

  if (!pokemon) {
    return (
      <div className={`pokemon-image-frame placeholder ${className}`.trim()}>
        <span className="image-placeholder">?</span>
      </div>
    );
  }

  const primary = mode === 'sprite' ? pokemon.sprite : pokemon.artwork;
  const secondary = mode === 'sprite' ? pokemon.artwork : pokemon.sprite;
  const sources = [primary, secondary].filter(Boolean);
  const source = sources[sourceIndex];
  const pixelated = mode === 'sprite' && source === pokemon.sprite;

  if (failed || !source) {
    return (
      <div className={`pokemon-image-frame is-placeholder image-${size} ${className}`.trim()}>
        <svg viewBox="0 0 64 64" className="placeholder-ball" aria-hidden="true">
          <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M10 32h16M38 32h16" stroke="currentColor" strokeWidth="3" />
          <circle cx="32" cy="32" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
        <span>{formatDexNumber(pokemon.id)}</span>
      </div>
    );
  }

  return (
    <div className={`pokemon-image-frame image-${size} ${pixelated ? 'is-pixel' : ''} ${loaded ? 'is-loaded' : ''} ${className}`.trim()}>
      {!loaded ? <span className="image-loading-shimmer" aria-hidden="true" /> : null}
      <img
        key={`${pokemon.id}-${mode}-${sourceIndex}`}
        src={source}
        alt={`${pokemon.nameZh || pokemon.nameEn || `#${pokemon.id}`} 的${mode === 'sprite' ? '像素' : '官方'}图片`}
        loading={loading}
        decoding="async"
        draggable="false"
        className={pixelated ? 'pixelated' : ''}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (sourceIndex < sources.length - 1) setSourceIndex(sourceIndex + 1);
          else setFailed(true);
        }}
      />
    </div>
  );
}
