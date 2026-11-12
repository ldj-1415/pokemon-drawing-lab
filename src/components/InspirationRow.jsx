import { Icon } from './Icon.jsx';

export function InspirationRow({
  dimension,
  value,
  locked,
  onReroll,
  onLock,
  children = null,
  className = '',
  disabled = false,
}) {
  return (
    <article className={`inspiration-row ${locked ? 'is-locked' : ''} ${className}`.trim()}>
      <span className="inspiration-row-icon">
        <Icon name={dimension.icon} size={18} />
      </span>
      <div className="inspiration-row-copy">
        <div className="inspiration-row-label">
          <span>{dimension.label}</span>
          {locked ? <span className="mini-status"><Icon name="lock" size={10} /> 已锁定</span> : null}
        </div>
        <div className="inspiration-row-value">
          {children || <span>{value || '等待生成'}</span>}
        </div>
      </div>
      <div className="inspiration-row-actions">
        <button
          type="button"
          className={`icon-button ${locked ? 'is-active' : ''}`.trim()}
          onClick={() => onLock?.(dimension.key)}
          aria-label={`${locked ? '解除锁定' : '锁定'}${dimension.label}`}
          title={locked ? '解除锁定' : '锁定此维度'}
          disabled={disabled}
        >
          <Icon name={locked ? 'lock' : 'unlock'} size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onReroll?.(dimension.key)}
          disabled={locked || disabled}
          aria-label={`重抽${dimension.label}`}
          title={disabled ? '模块已锁定' : locked ? '请先解除锁定' : `只重抽${dimension.label}`}
        >
          <Icon name="dice" size={16} />
        </button>
      </div>
    </article>
  );
}
