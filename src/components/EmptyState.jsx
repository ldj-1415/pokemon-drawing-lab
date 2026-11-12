import { Icon } from './Icon.jsx';

export function EmptyState({
  icon = 'sparkles',
  title,
  description,
  action = null,
  compact = false,
  children,
}) {
  return (
    <div className={`empty-state ${compact ? 'empty-state-compact' : ''}`.trim()}>
      <div className="empty-icon">
        <Icon name={icon} size={compact ? 24 : 32} />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
      {children}
    </div>
  );
}
