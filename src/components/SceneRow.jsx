import { getTypeMeta } from '../data/types.js';
import { getSceneAffinityLabels } from '../utils/sceneRandom.js';
import { Icon } from './Icon.jsx';
import { Switch } from './FormControls.jsx';

export function SceneRow({
  module,
  scene,
  pokemonList = [],
  onReroll,
  onToggleEnabled,
  onToggleLock,
}) {
  const option = module.options.find((item) => item.id === scene.value);
  const affinityTypes = option
    ? getSceneAffinityLabels(module.key, option, pokemonList)
    : [];

  return (
    <article
      className={`scene-row ${!scene.enabled ? 'is-disabled' : ''} ${scene.locked ? 'is-locked' : ''}`.trim()}
      style={{ '--scene-accent': module.color }}
    >
      <div className="scene-row-main">
        <span className="scene-icon"><Icon name={module.icon} size={20} /></span>
        <div className="scene-copy">
          <div className="scene-title-line">
            <h3>{module.title}</h3>
            {scene.locked ? (
              <span className="mini-status">
                <Icon name="lock" size={11} />
                已锁定
              </span>
            ) : null}
          </div>
          {scene.enabled ? (
            <>
              <strong className="scene-value">{option?.label || '待抽取'}</strong>
              <p>{option?.description || module.hint}</p>
              {affinityTypes.length ? (
                <span className="affinity-note">
                  <Icon name="sparkles" size={12} />
                  与
                  {affinityTypes.map((type) => getTypeMeta(type).label).join(' / ')}
                  属性有画面相性
                </span>
              ) : null}
            </>
          ) : (
            <p className="scene-off-text">模块已关闭，不会显示在本轮绘画提示中。</p>
          )}
        </div>
      </div>

      <div className="scene-row-actions">
        <Switch
          checked={scene.enabled}
          onChange={() => onToggleEnabled?.(module.key)}
          disabled={scene.locked}
          label={`${module.title}${scene.enabled ? '已开启' : '已关闭'}`}
        />
        <div className="scene-buttons">
          <button
            type="button"
            className={`icon-button ${scene.locked ? 'is-active' : ''}`.trim()}
            onClick={() => onToggleLock?.(module.key)}
            aria-label={scene.locked ? `解除锁定${module.title}` : `锁定${module.title}`}
            title={scene.locked ? '解除锁定' : '锁定此项'}
            disabled={!scene.enabled}
          >
            <Icon name={scene.locked ? 'lock' : 'unlock'} size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => onReroll?.(module.key)}
            aria-label={`重抽${module.title}`}
            title={scene.locked ? '请先解除锁定' : `重抽${module.title}`}
            disabled={!scene.enabled || scene.locked}
          >
            <Icon name="dice" size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
