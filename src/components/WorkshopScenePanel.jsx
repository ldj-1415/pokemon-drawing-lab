import { useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { SCENE_MODULES } from '../data/scenes.js';
import { SceneRow } from './SceneRow.jsx';
import { Icon } from './Icon.jsx';

export function WorkshopScenePanel() {
  const {
    current,
    compositionPokemon,
    rerollScene,
    toggleSceneEnabled,
    toggleSceneLock,
    randomizeScenesOnly,
  } = useLab();
  const [open, setOpen] = useState(false);
  const lockedScenes = Object.values(current.scenes).filter((scene) => scene.locked).length;
  const enabledScenes = Object.values(current.scenes).filter((scene) => scene.enabled).length;

  return (
    <section className="panel scenes-panel workshop-scene-panel" aria-labelledby="workshop-scenes-title">
      <div className="section-heading">
        <div className="section-title-wrap">
          <span className="step-number">00</span>
          <div>
            <span className="eyebrow">SCENE INPUT</span>
            <h2 id="workshop-scenes-title">基础场景设定</h2>
            <p className="workshop-scene-subtitle">联动生成会读取这里的场景、天气、时间与画面词条。</p>
          </div>
        </div>
        <div className="section-heading-actions">
          <span className="soft-count">
            启用 {enabledScenes}/{SCENE_MODULES.length} · 锁定 {lockedScenes}
          </span>
          <button
            type="button"
            className="button button-small button-secondary"
            onClick={randomizeScenesOnly}
            disabled={!compositionPokemon.length}
          >
            <Icon name="refresh" size={14} />
            生成场景
          </button>
          <button
            type="button"
            className="button button-small button-ghost"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <Icon name={open ? 'chevron-down' : 'sliders'} size={14} />
            {open ? '收起场景' : '展开场景'}
          </button>
        </div>
      </div>
      {open ? (
        <div className="scene-grid workshop-scene-grid">
          {SCENE_MODULES.map((module) => (
            <SceneRow
              key={module.key}
              module={module}
              scene={current.scenes[module.key]}
              pokemonList={compositionPokemon}
              onReroll={rerollScene}
              onToggleEnabled={toggleSceneEnabled}
              onToggleLock={toggleSceneLock}
            />
          ))}
        </div>
      ) : (
        <div className="workshop-scene-summary">
          {SCENE_MODULES.map((module) => {
            const scene = current.scenes[module.key];
            const option = module.options.find((item) => item.id === scene?.value);
            return (
              <span key={module.key} className={scene?.enabled ? '' : 'is-disabled'}>
                <Icon name={module.icon} size={12} />
                {module.title}：{scene?.enabled ? option?.label || '—' : '关闭'}
                {scene?.locked ? <Icon name="lock" size={10} /> : null}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
