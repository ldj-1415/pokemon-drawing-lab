import { getSceneSummary } from '../utils/sceneRandom.js';
import { Icon } from './Icon.jsx';

export function SceneSummaryChips({ scenes, limit = null }) {
  let items = getSceneSummary(scenes);
  if (limit && items.length > limit) items = [...items.slice(0, limit), null];

  if (!items.length) {
    return <span className="scene-summary-empty">所有场景模块均已关闭</span>;
  }

  return (
    <div className="scene-summary-chips">
      {items.map((item, index) => (
        item ? (
          <span className="scene-summary-chip" key={item.key}>
            <span style={{ color: item.color }}><Icon name={item.icon} size={13} /></span>
            <span className="summary-label">{item.title}</span>
            <strong>{item.value}</strong>
            {item.locked ? <Icon name="lock" size={10} /> : null}
          </span>
        ) : (
          <span className="scene-summary-chip scene-summary-more" key={`more-${index}`}>更多…</span>
        )
      ))}
    </div>
  );
}
