import { useLab } from '../context/LabContext.jsx';
import { useWorkbenchInspiration } from '../hooks/useWorkbenchInspiration.js';
import { INSPIRATION_DIMENSION_MAP } from '../data/inspiration.js';
import { WORKBENCH_INSPIRATION_HINT } from '../data/workbenchInspiration.js';
import { InspirationRow } from './InspirationRow.jsx';
import { WorkbenchColorReference } from './WorkbenchColorReference.jsx';
import { Icon } from './Icon.jsx';

function DimensionActions({ label, locked, onLock, onReroll, disabled = false }) {
  return (
    <div className="inspiration-row-actions">
      <button
        type="button"
        className={`icon-button ${locked ? 'is-active' : ''}`.trim()}
        onClick={onLock}
        aria-label={`${locked ? '解除锁定' : '锁定'}${label}`}
        title={locked ? '解除锁定' : '锁定此维度'}
        disabled={disabled}
      >
        <Icon name={locked ? 'lock' : 'unlock'} size={16} />
      </button>
      <button
        type="button"
        className="icon-button"
        onClick={onReroll}
        disabled={locked || disabled}
        aria-label={`重抽${label}`}
        title={disabled ? '模块已锁定' : locked ? '请先解除锁定' : `只重抽${label}`}
      >
        <Icon name="dice" size={16} />
      </button>
    </div>
  );
}

export function WorkbenchInspiration() {
  const {
    atmosphereSummary,
    imagePreferenceSummary,
  } = useLab();
  const {
    inspiration,
    colorReference,
    hasPokemon,
    hasInspiration,
    moduleLocked,
    sourceStale,
    colorStale,
    lockedCount,
    collectionCount,
    generateAll,
    rerollDimension,
    toggleLock,
    toggleInspirationLock,
    rerollColor,
    toggleColorLock,
    copyPrompt,
    copyColorCodes,
    copyHex,
    saveToCollection,
    sendToWorkshop,
    openWorkshop,
  } = useWorkbenchInspiration();

  const dims = INSPIRATION_DIMENSION_MAP;
  const theme = inspiration.dimensions.theme;
  const themeLocked = theme.locked;
  const sourceNames = inspiration.meta.linkedPokemonNames || [];

  return (
    <>
      <section className="panel workbench-inspiration-panel" aria-labelledby="workbench-inspiration-title">
        <div className="section-heading wi-section-heading">
          <div className="section-title-wrap">
            <span className="step-number">03</span>
            <div>
              <span className="eyebrow">DRAWING INSPIRATION</span>
              <h2 id="workbench-inspiration-title">绘画灵感</h2>
              <p className="wi-section-subtitle">
                同一份灵感驱动主题、故事、动作互动、场景、构图、视角、光影、背景与配色；修改任一项都会检查上下文。
              </p>
            </div>
          </div>
          <div className="section-heading-actions wi-header-actions">
            <span className="soft-count">
              {moduleLocked
                ? '模块已锁定'
                : lockedCount
                  ? `已锁定 ${lockedCount}/9`
                  : '8 个核心维度 + 可选挑战'}
            </span>
            <button
              type="button"
              className={`icon-button ${moduleLocked ? 'is-active' : ''}`.trim()}
              onClick={toggleInspirationLock}
              disabled={!hasInspiration}
              aria-label={moduleLocked ? '解除锁定绘画灵感' : '锁定绘画灵感'}
              title={moduleLocked ? '解除模块锁定' : '锁定整个绘画灵感模块'}
            >
              <Icon name={moduleLocked ? 'lock' : 'unlock'} size={16} />
            </button>
            <button
              type="button"
              className="button button-small button-secondary"
              onClick={generateAll}
              disabled={!hasPokemon || moduleLocked}
            >
              <Icon name="refresh" size={14} />
              整组重抽
            </button>
            <button
              type="button"
              className="button button-small button-ghost"
              onClick={saveToCollection}
              disabled={!hasInspiration}
            >
              <Icon name="heart" size={14} />
              收藏
            </button>
          </div>
        </div>

        {!hasPokemon ? (
          <div className="wi-empty">
            <span className="wi-empty-icon"><Icon name="bulb" size={23} /></span>
            <div>
              <strong>先抽取宝可梦，灵感会自动出现</strong>
              <p>抽取或手动锁定宝可梦后，这里会生成同一套主题、故事、动作互动、场景、构图、视角、光影和背景。</p>
            </div>
          </div>
        ) : (
          <>
            <div className="wi-context-line">
              <span><Icon name="users" size={13} /> {sourceNames.length} 只宝可梦：{sourceNames.join('、')}</span>
              {atmosphereSummary.isActive ? (
                <span><Icon name="sparkles" size={13} /> 氛围 {atmosphereSummary.labels.join(' + ')} · {atmosphereSummary.strength.label}</span>
              ) : null}
              {imagePreferenceSummary.isActive ? (
                <span><Icon name="heart" size={13} /> 形象 {imagePreferenceSummary.labels.join(' + ')} · {imagePreferenceSummary.strength.label}</span>
              ) : null}
            </div>

            {sourceStale ? (
              <div className="wi-stale">
                <span><Icon name="refresh" size={13} /> 当前灵感与工作台宝可梦来源不同，可能来自单只重抽或工坊随机 / 自定义。</span>
                <button type="button" className="text-link" onClick={generateAll} disabled={moduleLocked}>
                  更新整套灵感
                  <Icon name="arrow-right" size={12} />
                </button>
              </div>
            ) : null}

            <div className={`wi-theme-card ${themeLocked || moduleLocked ? 'is-locked' : ''}`.trim()}>
              <div className="wi-theme-top">
                <div>
                  <span className="wi-theme-label"><Icon name="bulb" size={14} /> 创作主题</span>
                  {themeLocked ? <span className="mini-status"><Icon name="lock" size={10} /> 已锁定</span> : null}
                </div>
                <DimensionActions
                  label={dims.theme.label}
                  locked={themeLocked}
                  onLock={() => toggleLock('theme')}
                  onReroll={() => rerollDimension('theme')}
                  disabled={moduleLocked}
                />
              </div>
              <h3>{theme.value || '等待生成'}</h3>
              <p>主题决定场景、动作与光线的方向；重抽主题时，未锁定的关联维度会同步重新匹配。</p>
            </div>

            <div className="wi-grid">
              <InspirationRow
                dimension={dims.story}
                value={inspiration.dimensions.story.value}
                locked={inspiration.dimensions.story.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
              <InspirationRow
                dimension={dims.action}
                value={inspiration.dimensions.action.value}
                locked={inspiration.dimensions.action.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
              <InspirationRow
                dimension={dims.scene}
                value={inspiration.dimensions.scene.value}
                locked={inspiration.dimensions.scene.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
              <InspirationRow
                dimension={dims.composition}
                value={inspiration.dimensions.composition.value}
                locked={inspiration.dimensions.composition.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
              <InspirationRow
                dimension={dims.viewpoint}
                value={inspiration.dimensions.viewpoint.value}
                locked={inspiration.dimensions.viewpoint.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
              <InspirationRow
                dimension={dims.lighting}
                value={inspiration.dimensions.lighting.value}
                locked={inspiration.dimensions.lighting.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
              <InspirationRow
                dimension={dims.background}
                value={inspiration.dimensions.background.value}
                locked={inspiration.dimensions.background.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
              <InspirationRow
                dimension={dims.challenge}
                value={inspiration.dimensions.challenge.value}
                locked={inspiration.dimensions.challenge.locked}
                onReroll={rerollDimension}
                onLock={toggleLock}
                disabled={moduleLocked}
              />
            </div>

            <div className="wi-footer">
              <span className="wi-hint">
                <Icon name="info" size={13} />
                {WORKBENCH_INSPIRATION_HINT}
              </span>
              <div className="wi-footer-actions">
                {collectionCount ? (
                  <button type="button" className="text-link" onClick={openWorkshop}>
                    已收藏 {collectionCount} 套 · 前往灵感工坊
                    <Icon name="arrow-right" size={13} />
                  </button>
                ) : null}
                <button type="button" className="button button-small button-ghost" onClick={copyPrompt} disabled={!hasInspiration}>
                  <Icon name="copy" size={13} />
                  复制提示词
                </button>
                <button type="button" className="button button-small button-primary" onClick={sendToWorkshop} disabled={!hasInspiration}>
                  <Icon name="arrow-right" size={14} />
                  发送到灵感工坊
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <WorkbenchColorReference
        colorReference={colorReference}
        colorStale={colorStale}
        onReroll={rerollColor}
        onToggleLock={toggleColorLock}
        onCopyAll={copyColorCodes}
        onCopyHex={copyHex}
      />
    </>
  );
}
