import { Icon } from './Icon.jsx';
import { PokemonImage } from './PokemonImage.jsx';
import { PokemonTypeList } from './PokemonTypeBadge.jsx';
import { formatDexNumber } from '../utils/search.js';

export function PokemonCard({
  pokemon,
  locked,
  slotIndex,
  onLock,
  onReroll,
  conflictReasons = [],
  mode = 'artwork',
  detail = null,
}) {
  if (!pokemon) {
    return (
      <article className="pokemon-card pokemon-card-missing">
        <div className="pokemon-card-missing-inner">
          <Icon name="alert" size={22} />
          <h3>图片数据缺失</h3>
          <p>这只宝可梦暂时无法从本地图鉴读取。</p>
        </div>
      </article>
    );
  }

  const isConflict = conflictReasons.length > 0;
  const specialTag = pokemon.isMythical ? '幻之宝可梦' : pokemon.isLegendary ? '传说宝可梦' : null;

  return (
    <article
      className={`pokemon-card ${locked ? 'is-locked' : ''} ${isConflict ? 'has-conflict' : ''}`.trim()}
      style={{ '--card-accent': `var(--type-${pokemon.types[0] || 'normal'})` }}
    >
      <div className="pokemon-card-media">
        <div className="card-media-topline">
          <span className="dex-chip">{formatDexNumber(pokemon.id)}</span>
          {locked ? (
            <span className="locked-chip">
              <Icon name="lock" size={12} />
              已锁定
            </span>
          ) : (
            <button
              type="button"
              className="card-lock-quick"
              onClick={() => onLock?.(slotIndex)}
              aria-label={`锁定 ${pokemon.nameZh || pokemon.nameEn}`}
              title="锁定这只宝可梦"
            >
              <Icon name="lock" size={16} />
            </button>
          )}
        </div>
        <PokemonImage pokemon={pokemon} mode={mode} size="card" className="card-artwork" />
        <span className="card-art-accent" aria-hidden="true" />
        <span className="slot-index" aria-hidden="true">{String(slotIndex + 1).padStart(2, '0')}</span>
      </div>

      <div className="pokemon-card-body">
        <div className="pokemon-name-row">
          <div>
            <h3>{pokemon.nameZh || pokemon.nameEn}</h3>
            <p>{pokemon.nameZh ? pokemon.nameEn : '中文名暂缺'}</p>
          </div>
          {specialTag ? <span className="special-tag">{specialTag}</span> : null}
        </div>

        <PokemonTypeList types={pokemon.types} />

        <div className="pokemon-meta-row">
          <span>{pokemon.stageLabel || (pokemon.stage === 0 ? '未进化' : `${pokemon.stage}阶进化`)}</span>
          <span className="meta-divider" aria-hidden="true" />
          <span>{pokemon.shapeZh || '体型未知'}</span>
          {pokemon.height ? (
            <>
              <span className="meta-divider" aria-hidden="true" />
              <span>{pokemon.height / 10} m</span>
            </>
          ) : null}
        </div>

        {isConflict ? (
          <div className="card-warning">
            <Icon name="alert" size={15} />
            <span>{conflictReasons.join('；')}</span>
          </div>
        ) : null}

        <div className="pokemon-card-actions">
          <button
            type="button"
            className={`button button-small ${locked ? 'button-lock-active' : 'button-ghost'}`.trim()}
            onClick={() => onLock?.(slotIndex)}
          >
            <Icon name={locked ? 'unlock' : 'lock'} size={15} />
            {locked ? '解除锁定' : '锁定'}
          </button>
          <button
            type="button"
            className="button button-small button-ghost"
            onClick={() => onReroll?.(slotIndex)}
            disabled={locked}
            title={locked ? '请先解除锁定' : '只替换这一只宝可梦'}
          >
            <Icon name="dice" size={15} />
            单只重抽
          </button>
        </div>
      </div>
      {detail ? <div className="pokemon-card-detail">{detail}</div> : null}
    </article>
  );
}
