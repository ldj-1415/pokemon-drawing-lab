import { useMemo, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { useInspirationWorkshop } from '../hooks/useInspirationWorkshop.js';
import {
  INSPIRATION_DIFFICULTIES,
  INSPIRATION_DIMENSION_MAP,
  INSPIRATION_MODES,
  getInspirationDifficulty,
} from '../data/inspiration.js';
import { formatDateTime } from '../utils/format.js';
import { getPaletteRoles } from '../utils/colorReferenceEngine.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Icon } from '../components/Icon.jsx';
import { InspirationRow } from '../components/InspirationRow.jsx';
import { PokemonImage } from '../components/PokemonImage.jsx';
import { ReferencePanel } from '../components/ReferencePanel.jsx';
import { WorkshopScenePanel } from '../components/WorkshopScenePanel.jsx';

const GUIDANCE_KEYS = ['story', 'scene', 'action', 'composition', 'viewpoint', 'lighting', 'background'];
const VISUAL_KEYS = ['palette', 'mood', 'material'];

function PaletteSwatches({ palette, compact = false }) {
  if (!palette?.colors?.length) return <span className="inspiration-muted">尚未生成色卡</span>;
  return (
    <div className={`inspiration-swatches ${compact ? 'is-compact' : ''}`.trim()}>
      {palette.colors.map((color) => (
        <span className="inspiration-swatch" key={color} style={{ '--swatch-color': color }}>
          <i />
          {compact ? null : <small>{color}</small>}
        </span>
      ))}
    </div>
  );
}

function CollectionPanel({
  collection,
  filteredCollection,
  collectionQuery,
  setCollectionQuery,
  loadSaved,
  deleteSaved,
  standalone = false,
}) {
  return (
    <section className={`panel inspiration-collection-panel ${standalone ? 'is-standalone' : ''}`.trim()}>
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">SAVED IDEAS</span>
          <h2>灵感收藏</h2>
        </div>
        <span className="soft-count">{collection.length}</span>
      </div>
      <label className="inspiration-collection-search">
        <Icon name="search" size={15} />
        <input
          type="search"
          value={collectionQuery}
          onChange={(event) => setCollectionQuery(event.target.value)}
          placeholder="搜索主题、指导或宝可梦"
          aria-label="搜索灵感收藏"
        />
        {collectionQuery ? (
          <button type="button" onClick={() => setCollectionQuery('')} aria-label="清空灵感搜索">
            <Icon name="close" size={13} />
          </button>
        ) : null}
      </label>
      <div className="inspiration-collection-list">
        {filteredCollection.length ? filteredCollection.map((entry) => {
          const entryMode = INSPIRATION_MODES.find((item) => item.id === entry.inspiration.mode)
            || INSPIRATION_MODES[0];
          const entryDifficulty = getInspirationDifficulty(entry.inspiration.difficulty);
          const entryPalette = entry.inspiration.dimensions.palette.value;
          return (
            <article className="inspiration-saved-item" key={entry.id}>
              <button
                type="button"
                className="inspiration-saved-main"
                onClick={() => loadSaved(entry.id)}
                title={`载入：${entry.title}`}
              >
                <span className="inspiration-saved-title">{entry.title}</span>
                <span className="inspiration-saved-meta">
                  <span className={`inspiration-usage-dot mode-${entry.inspiration.mode}`}>{entryMode.label}</span>
                  <span>{entryDifficulty.label}</span>
                  <span>{formatDateTime(entry.createdAt)}</span>
                </span>
                <span className="inspiration-saved-bottom">
                  <PaletteSwatches palette={entryPalette} compact />
                  <span className="inspiration-saved-load-hint">
                    载入
                    <Icon name="arrow-right" size={11} />
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="icon-button inspiration-saved-delete"
                onClick={() => deleteSaved(entry.id)}
                aria-label={`删除灵感 ${entry.title}`}
                title="删除收藏"
              >
                <Icon name="trash" size={14} />
              </button>
            </article>
          );
        }) : (
          <div className="inspiration-collection-empty">
            <Icon name="bookmark" size={20} />
            <p>{collectionQuery ? '没有匹配的灵感收藏。' : '还没有收藏完整灵感。'}</p>
            {!collectionQuery ? <small>生成一套灵感后点击「收藏完整灵感」。</small> : null}
          </div>
        )}
      </div>
    </section>
  );
}

function DimensionActions({ label, locked, onLock, onReroll }) {
  return (
    <div className="inspiration-row-actions">
      <button
        type="button"
        className={`icon-button ${locked ? 'is-active' : ''}`.trim()}
        onClick={onLock}
        aria-label={`${locked ? '解除锁定' : '锁定'}${label}`}
        title={locked ? '解除锁定' : '锁定此维度'}
      >
        <Icon name={locked ? 'lock' : 'unlock'} size={16} />
      </button>
      <button
        type="button"
        className="icon-button"
        onClick={onReroll}
        disabled={locked}
        aria-label={`重抽${label}`}
        title={locked ? '请先解除锁定' : `只重抽${label}`}
      >
        <Icon name="dice" size={16} />
      </button>
    </div>
  );
}

export function InspirationPage() {
  const { navigate } = useLab();
  const {
    inspiration,
    collection,
    mode,
    setMode,
    difficulty,
    setDifficulty,
    customSeed,
    setCustomSeed,
    selectedDifficultyMeta,
    generatedDifficultyMeta,
    linkedPokemonChips,
    linkedSceneLabels,
    hasInspiration,
    linkedStale,
    lockedCount,
    allLocked,
    canGenerate,
    generationBlockReason,
    generate,
    rerollDimension,
    toggleDimensionLock,
    saveToCollection,
    loadSaved,
    deleteSaved,
    searchCollection,
    copyCurrent,
    copyPalette,
    sendToTimer,
  } = useInspirationWorkshop();
  const [collectionQuery, setCollectionQuery] = useState('');

  const themeValue = inspiration.dimensions.theme.value;
  const themeDimension = INSPIRATION_DIMENSION_MAP.theme;
  const challengeDimension = INSPIRATION_DIMENSION_MAP.challenge;
  const guidance = GUIDANCE_KEYS.map((key) => INSPIRATION_DIMENSION_MAP[key]);
  const visual = VISUAL_KEYS.map((key) => INSPIRATION_DIMENSION_MAP[key]);
  const filteredCollection = useMemo(
    () => searchCollection(collectionQuery),
    [collectionQuery, searchCollection, collection],
  );
  const themeLocked = inspiration.dimensions.theme.locked;
  const challengeLocked = inspiration.dimensions.challenge.locked;
  const palette = inspiration.dimensions.palette.value;
  const paletteRoles = palette ? getPaletteRoles(palette) : null;
  const linkedNames = inspiration.meta.linkedPokemonNames || [];
  const generatedMode = INSPIRATION_MODES.find((item) => item.id === inspiration.mode)
    || INSPIRATION_MODES[0];

  return (
    <div className="page page-inspiration">
      <PageHeader
        eyebrow="DRAWING INSPIRATION WORKSHOP"
        title="绘画灵感工坊"
        description="用本地结构化词条生成创意主题、绘画指导、视觉风格与特殊挑战。所有结果都可以独立锁定、重抽、收藏，或发送到现有计时器。"
        actions={(
          <>
            <span className="autosave-badge"><Icon name="database" size={14} /> 本地词条 · 无 AI 接口</span>
            <button
              type="button"
              className="button button-primary"
              onClick={generate}
              disabled={!canGenerate || allLocked}
            >
              <Icon name="dice" size={17} />
              {hasInspiration ? '生成未锁定项' : '生成第一套灵感'}
            </button>
          </>
        )}
      />

      <section className="panel inspiration-controls">
        <div className="inspiration-control-section">
          <div className="inspiration-control-label">
            <span className="eyebrow">GENERATION MODE</span>
            <h2>选择生成模式</h2>
          </div>
          <div className="inspiration-mode-grid">
            {INSPIRATION_MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`inspiration-mode-card ${mode === item.id ? 'is-selected' : ''}`.trim()}
                onClick={() => setMode(item.id)}
                aria-pressed={mode === item.id}
              >
                <span className="inspiration-mode-icon"><Icon name={item.icon} size={19} /></span>
                <span className="inspiration-mode-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                {mode === item.id ? <Icon name="check" size={15} className="inspiration-mode-check" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="inspiration-control-split">
          <div className="inspiration-control-section">
            <div className="inspiration-control-label">
              <span className="eyebrow">DIFFICULTY</span>
              <h2>挑战难度</h2>
            </div>
            <div className="difficulty-selector">
              {INSPIRATION_DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`difficulty-option ${difficulty === item.id ? 'is-selected' : ''}`.trim()}
                  onClick={() => setDifficulty(item.id)}
                  aria-pressed={difficulty === item.id}
                >
                  <span className={`difficulty-dot difficulty-${item.id}`} />
                  <strong>{item.label}</strong>
                  <small>{item.timerLabel}</small>
                </button>
              ))}
            </div>
            <p className="inspiration-control-hint">
              {selectedDifficultyMeta.description}
              {inspiration.difficulty !== difficulty && hasInspiration
                ? ' 下次生成时应用新难度。'
                : ''}
            </p>
          </div>

          <div className="inspiration-control-section inspiration-source-section">
            <div className="inspiration-control-label">
              <span className="eyebrow">SOURCE CONTEXT</span>
              <h2>{mode === 'linked' ? '当前宝可梦联动' : mode === 'custom' ? '自定义入口' : '完全随机'}</h2>
            </div>
            {mode === 'linked' ? (
              linkedPokemonChips.length ? (
                <div className="linked-context">
                  <div className="linked-pokemon-chips">
                    {linkedPokemonChips.map((pokemon) => (
                      <span className="linked-pokemon-chip" key={pokemon.id}>
                        <PokemonImage pokemon={pokemon} mode="sprite" size="micro" />
                        <span>{pokemon.nameZh || pokemon.nameEn}</span>
                        <small>{pokemon.typesZh?.join(' / ')}</small>
                      </span>
                    ))}
                  </div>
                  {linkedSceneLabels.length ? (
                    <div className="linked-scene-line">
                      <Icon name="map-pin" size={13} />
                      {linkedSceneLabels.map((item) => `${item.title}：${item.value}`).join(' · ')}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="inspiration-empty-context">
                  <Icon name="alert" size={16} />
                  <span>当前工作台还没有宝可梦。先抽取一只，再回来生成联动灵感。</span>
                  <button type="button" className="text-link" onClick={() => navigate('workbench')}>
                    去随机工作台
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              )
            ) : mode === 'custom' ? (
              <label className="inspiration-custom-field">
                <span>自定义主题 / 关键词</span>
                <textarea
                  value={customSeed}
                  maxLength={120}
                  rows={3}
                  onChange={(event) => setCustomSeed(event.target.value)}
                  placeholder="例如：雨夜的城市天台、森林里的旧车站、温柔的樱花午后……"
                />
                <small>{customSeed.length}/120 · 主题未锁定时，生成会把输入内容作为创意主题并自动锁定。</small>
              </label>
            ) : (
              <p className="inspiration-control-hint">
                完全随机不会读取当前工作台。它会从本地主题词库和已锁定的维度之外重新组合一套灵感。
              </p>
            )}
          </div>
        </div>

        <div className="inspiration-control-footer">
          <span>
            <Icon name="lock" size={13} />
            已锁定 {lockedCount} / 12 个维度
            {allLocked ? '，解除至少一个后才能生成。' : '；生成时只替换未锁定内容。'}
          </span>
          {generationBlockReason ? (
            <span className="inspiration-block-hint"><Icon name="alert" size={13} /> {generationBlockReason}</span>
          ) : null}
        </div>
      </section>

      {mode === 'linked' ? <WorkshopScenePanel /> : null}

      {linkedStale ? (
        <div className="workshop-sync-bar">
          <span>
            <Icon name="refresh" size={14} />
            随机工作台已更新宝可梦或场景；当前灵感仍是旧来源，未锁定内容可以主动同步。
          </span>
          <button type="button" className="button button-small button-secondary" onClick={generate}>
            <Icon name="refresh" size={14} />
            同步最新宝可梦
          </button>
        </div>
      ) : null}

      {!hasInspiration ? (
        <>
          <EmptyState
            icon="bulb"
            title="把绘画练习变成一套可执行灵感"
            description="选择模式与难度后生成第一套灵感：主题、动作、构图、视角、光影、背景、配色色卡、氛围、材质与特殊挑战。"
            action={(
              <button type="button" className="button button-primary" onClick={generate} disabled={!canGenerate || allLocked}>
                <Icon name="sparkles" size={17} />
                生成第一套灵感
              </button>
            )}
          >
            {!canGenerate ? <p className="inspiration-empty-hint">{generationBlockReason}</p> : null}
          </EmptyState>
          {collection.length ? (
            <CollectionPanel
              standalone
              collection={collection}
              filteredCollection={filteredCollection}
              collectionQuery={collectionQuery}
              setCollectionQuery={setCollectionQuery}
              loadSaved={loadSaved}
              deleteSaved={deleteSaved}
            />
          ) : null}
        </>
      ) : (
        <div className="inspiration-layout">
          <div className="inspiration-main">
            <section className={`inspiration-theme-card ${themeLocked ? 'is-locked' : ''}`.trim()}>
              <div className="inspiration-theme-top">
                <div className="inspiration-section-title">
                  <span className="step-number">01</span>
                  <div>
                    <span className="eyebrow">CREATIVE THEME</span>
                    <h2>创意主题</h2>
                  </div>
                </div>
                <DimensionActions
                  label={themeDimension.label}
                  locked={themeLocked}
                  onLock={() => toggleDimensionLock('theme')}
                  onReroll={() => rerollDimension('theme')}
                />
              </div>
              <h3 className="inspiration-theme-value">{themeValue}</h3>
              <div className="inspiration-theme-meta">
                <span className={`inspiration-source-badge mode-${inspiration.mode}`}>
                  <Icon name={generatedMode.icon} size={12} />
                  {generatedMode.label}
                </span>
                <span className={`inspiration-difficulty-badge difficulty-${inspiration.difficulty}`}>
                  {generatedDifficultyMeta.label}
                </span>
                {inspiration.mode === 'linked' && linkedNames.length ? (
                  <span className="inspiration-source-note">
                    <Icon name="target" size={12} />
                    联动：{linkedNames.join('、')}
                  </span>
                ) : null}
                {inspiration.mode === 'custom' && inspiration.meta.customSeed ? (
                  <span className="inspiration-source-note">
                    <Icon name="palette" size={12} />
                    自定义：{inspiration.meta.customSeed}
                  </span>
                ) : null}
                {themeLocked ? <span className="mini-status"><Icon name="lock" size={10} /> 已锁定</span> : null}
              </div>
              <div className="inspiration-generated-line">
                <Icon name="clock" size={12} />
                {inspiration.meta.generatedAt ? formatDateTime(inspiration.meta.generatedAt) : '尚未记录生成时间'}
              </div>
            </section>

            <section className="panel inspiration-section">
              <div className="inspiration-section-head">
                <div className="inspiration-section-title">
                  <span className="step-number">02</span>
                  <div>
                    <span className="eyebrow">DRAWING GUIDANCE</span>
                    <h2>绘画指导</h2>
                  </div>
                </div>
                <span className="soft-count">7 个可独立锁定维度</span>
              </div>
              <div className="inspiration-rows">
                {guidance.map((dimension) => (
                  <InspirationRow
                    key={dimension.key}
                    dimension={dimension}
                    value={inspiration.dimensions[dimension.key].value}
                    locked={inspiration.dimensions[dimension.key].locked}
                    onReroll={rerollDimension}
                    onLock={toggleDimensionLock}
                  />
                ))}
              </div>
            </section>

            <section className="panel inspiration-section">
              <div className="inspiration-section-head">
                <div className="inspiration-section-title">
                  <span className="step-number">03</span>
                  <div>
                    <span className="eyebrow">VISUAL STYLE</span>
                    <h2>视觉风格</h2>
                  </div>
                </div>
                <span className="soft-count">配色 + 色卡 + 氛围 + 材质</span>
              </div>
              <div className="inspiration-rows">
                <InspirationRow
                  dimension={INSPIRATION_DIMENSION_MAP.palette}
                  value={null}
                  locked={inspiration.dimensions.palette.locked}
                  onReroll={rerollDimension}
                  onLock={toggleDimensionLock}
                  className="inspiration-palette-row"
                >
                  {palette ? (
                    <div className="inspiration-palette-content">
                      <div className="inspiration-palette-heading">
                        <strong>{palette.name}</strong>
                        <span>{palette.description}</span>
                        <button type="button" className="button button-small button-ghost" onClick={copyPalette}>
                          <Icon name="copy" size={12} />
                          复制色号
                        </button>
                      </div>
                      {paletteRoles ? (
                        <>
                          <div className="color-proportion-bar" aria-label={`色彩比例 ${paletteRoles.ratios.join(' / ')}`}>
                            {[paletteRoles.main, paletteRoles.secondary, paletteRoles.accent].map((role) => (
                              <span
                                key={role.label}
                                style={{ '--swatch-color': role.hex, flexGrow: role.ratio }}
                                title={`${role.label} ${role.hex} ${role.ratio}%`}
                              />
                            ))}
                          </div>
                          <div className="color-role-grid">
                            {[paletteRoles.main, paletteRoles.secondary, paletteRoles.accent].map((role) => (
                              <div className="color-role-card" key={role.label} style={{ '--swatch-color': role.hex }}>
                                <span className="color-role-swatch" />
                                <span className="color-role-copy">
                                  <span>{role.label}</span>
                                  <strong>{role.hex}</strong>
                                </span>
                                <span className="color-role-ratio">{role.ratio}%</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                      <PaletteSwatches palette={palette} />
                    </div>
                  ) : (
                    <span className="inspiration-muted">尚未生成配色</span>
                  )}
                </InspirationRow>
                {visual.slice(1).map((dimension) => (
                  <InspirationRow
                    key={dimension.key}
                    dimension={dimension}
                    value={inspiration.dimensions[dimension.key].value}
                    locked={inspiration.dimensions[dimension.key].locked}
                    onReroll={rerollDimension}
                    onLock={toggleDimensionLock}
                  />
                ))}
              </div>
            </section>

            <section className={`inspiration-challenge-card ${challengeLocked ? 'is-locked' : ''}`.trim()}>
              <div className="inspiration-section-head">
                <div className="inspiration-section-title">
                  <span className="step-number">04</span>
                  <div>
                    <span className="eyebrow">SPECIAL DRAWING CHALLENGE</span>
                    <h2>特殊绘画挑战</h2>
                  </div>
                </div>
                <div className="inspiration-challenge-actions">
                  <span className={`inspiration-difficulty-badge difficulty-${inspiration.difficulty}`}>
                    {generatedDifficultyMeta.label}
                  </span>
                  <DimensionActions
                    label={challengeDimension.label}
                    locked={challengeLocked}
                    onLock={() => toggleDimensionLock('challenge')}
                    onReroll={() => rerollDimension('challenge')}
                  />
                </div>
              </div>
              <p>{inspiration.dimensions.challenge.value || '尚未生成挑战。'}</p>
              <span className="inspiration-challenge-footnote">
                <Icon name="info" size={12} />
                挑战条目来自本地词库，难度由「{generatedDifficultyMeta.label}」决定。
              </span>
            </section>

            <ReferencePanel />
          </div>

          <aside className="inspiration-aside">
            <section className="panel inspiration-action-panel">
              <div className="panel-heading compact">
                <div>
                  <span className="eyebrow">KEEP & USE</span>
                  <h2>使用这套灵感</h2>
                </div>
                <span className="mini-status"><Icon name="database" size={10} /> 本地</span>
              </div>
              <div className="inspiration-action-stack">
                <button type="button" className="button button-secondary button-block" onClick={saveToCollection}>
                  <Icon name="heart" size={16} />
                  收藏完整灵感
                </button>
                <button type="button" className="button button-ghost button-block" onClick={copyCurrent}>
                  <Icon name="copy" size={16} />
                  复制完整灵感
                </button>
                <button type="button" className="button button-primary button-block" onClick={sendToTimer}>
                  <Icon name="timer" size={16} />
                  发送到计时器
                </button>
              </div>
              <p className="inspiration-timer-hint">
                <Icon name="clock" size={13} />
                推荐 {generatedDifficultyMeta.timerLabel} · 难度 {generatedDifficultyMeta.label}
              </p>
              <button type="button" className="text-link inspiration-workbench-link" onClick={() => navigate('workbench')}>
                回到随机工作台
                <Icon name="arrow-right" size={14} />
              </button>
            </section>

            <CollectionPanel
              collection={collection}
              filteredCollection={filteredCollection}
              collectionQuery={collectionQuery}
              setCollectionQuery={setCollectionQuery}
              loadSaved={loadSaved}
              deleteSaved={deleteSaved}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
