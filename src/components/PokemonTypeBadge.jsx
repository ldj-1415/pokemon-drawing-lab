import { getTypeMeta } from '../data/types.js';

export function PokemonTypeBadge({ type, size = 'normal' }) {
  const meta = getTypeMeta(type);
  return (
    <span
      className={`type-badge type-${size}`}
      style={{
        '--type-color': meta.color,
        '--type-soft': meta.soft,
        '--type-text': meta.text,
      }}
    >
      <span className="type-dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PokemonTypeList({ types = [], size = 'normal' }) {
  return (
    <span className="type-list">
      {types.map((type) => <PokemonTypeBadge key={type} type={type} size={size} />)}
    </span>
  );
}
