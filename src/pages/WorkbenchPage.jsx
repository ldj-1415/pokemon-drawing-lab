import { useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { DUPLICATE_MODE_OPTIONS, TYPE_MODE_OPTIONS } from '../data/types.js';
import { getActiveGenerationLabels } from '../utils/filters.js';
import { formatDateTime } from '../utils/format.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { ChallengeTimerCard } from '../components/ChallengeTimerCard.jsx';
import { PokemonCard } from '../components/PokemonCard.jsx';
import { PokemonDetailPanel } from '../components/PokemonDetailPanel.jsx';
import { WorkbenchDrawSettings } from '../components/WorkbenchDrawSettings.jsx';
import { PokemonSearchModal } from '../components/PokemonSearchModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Icon } from '../components/Icon.jsx';

function EmptyPokemonSlot({ canGenerate, onDraw, label = '等待抽取' }) {
  return (
    <button
      type="button"
      className="empty-pokemon-slot"
      onClick={onDraw}
      disabled={!canGenerate}
    >
      <span className="empty-slot-plus"><Icon name="plus" size={22} /></span>
      <strong>{label}</strong>
      <small>{canGenerate ? '点击抽取填充' : '请先调整筛选条件'}</small>
    </button>
  );
}

export function WorkbenchPage() {
  const {
    settings,
    navigate,
    dexMap,
    candidatePool,
    poolSummary,
    poolValidation,
    current,
    atmosphereSummary,
    imagePreferenceSummary,
    lockedCount,
    randomNeed,
    lockConflicts,
    conflictCount,
    lockedOverCount,
    candidatePoolEmpty,
    canGenerate,
    randomizeAll,
    rerollSinglePokemon,
    toggleCurrentPokemonLock,
    clearComposition,
    imageMode,
    timer,
    history,
  } = useLab();
  const [searchOpen, setSearchOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const duplicateLabel = DUPLICATE_MODE_OPTIONS.find((option) => option.id === settings.duplicateMode)?.title;
  const typeModeLabel = TYPE_MODE_OPTIONS.find((option) => option.id === settings.typeMode)?.title;
  const generationLabels = getActiveGenerationLabels(settings);
  const emptySlots = Math.max(0, settings.count - current.pokemon.length);
  const placeholders = Math.min(emptySlots, 3);

  const criticalError = lockedOverCount
    ? `已锁定 ${lockedCount} 只，超过本轮抽取数量 ${settings.count} 只。请调整数量或解除锁定。`
    : !settings.selectedGenerations.length
      ? '请至少选择一个世代，候选池目前为空。'
      : settings.rangeMin > settings.rangeMax
        ? '起始编号不能大于结束编号，请先修正全国图鉴范围。'
        : candidatePoolEmpty
          ? '当前筛选条件下候选池为空。请放宽世代、编号范围或属性筛选。'
          : poolValidation.errors.find((error) => !error.startsWith('候选池只有')) || null;

  const visibleCardCount = Math.min(4, Math.max(1, current.pokemon.length + placeholders));

  const handleRandomize = () => {
    const result = randomizeAll({
      includeScenes: false,
      includeReference: false,
      label: '抽取宝可梦',
    });
    if (result?.ok) {
      window.setTimeout(() => {
        document.getElementById('pokemon-section-title')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  };

  return (
    <div className="page page-workbench">
      <PageHeader
        eyebrow="POKÉMON DRAW"
        title="今天画什么宝可梦？"
        description="随机工作台只负责宝可梦抽取与筛选。绘画灵感、配色、参考素材和挑战内容请前往「绘画灵感工坊」。"
        actions={(
          <>
            <button type="button" className="button button-secondary" onClick={() => setSearchOpen(true)}>
              <Icon name="search" size={17} />
              手动锁定
            </button>
            <button type="button" className="button button-primary" onClick={handleRandomize} disabled={!canGenerate}>
              <Icon name="sparkles" size={18} />
              开始抽取
            </button>
          </>
        )}
      />

      <div className="workbench-meta-row">
        <span className="meta-pill meta-pill-strong">
          <Icon name="target" size={14} />
          候选池 {candidatePool.length.toLocaleString('zh-CN')} 只
        </span>
        <span className="meta-pill">
          <Icon name="grid" size={14} />
          本轮 {settings.count} 只
        </span>
        <span className="meta-pill">
          <Icon name="lock" size={14} />
          锁定 {lockedCount} 只
        </span>
        <span className="meta-pill">
          <Icon name="refresh" size={14} />
          {duplicateLabel}
        </span>
        <span className="meta-pill meta-pill-hide-mobile">
          <Icon name="palette" size={14} />
          {typeModeLabel}
        </span>
        <span className="meta-pill meta-pill-atmosphere" title="氛围是软性概率偏好，不会硬性排除宝可梦">
          <Icon name="sparkles" size={14} />
          {atmosphereSummary.isActive
            ? `氛围 ${atmosphereSummary.labels.join(' + ')} · ${atmosphereSummary.strength.label}`
            : settings.atmosphereMode === 'off' ? '氛围不限' : '氛围待配置'}
        </span>
        <span className="meta-pill meta-pill-image-preference" title="形象偏好是软性概率权重，不会硬性排除宝可梦">
          <Icon name="heart" size={14} />
          {imagePreferenceSummary.isActive
            ? `形象 ${imagePreferenceSummary.labels.join(' + ')} · ${imagePreferenceSummary.strength.label}`
            : settings.imagePreferenceMode === 'off' ? '形象不限' : '形象待配置'}
        </span>
        <span className="meta-pill meta-pill-generation" title={generationLabels.join('、')}>
          {generationLabels.length === 9 ? '全世代' : generationLabels.length ? `${generationLabels.length} 个世代` : '未选世代'}
          <span className="dot-separator">·</span>
          #{String(settings.rangeMin).padStart(4, '0')}–#{String(settings.rangeMax).padStart(4, '0')}
        </span>
      </div>

      <WorkbenchDrawSettings />

      {criticalError ? (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon"><Icon name="alert" size={19} /></span>
          <div>
            <strong>暂时无法随机</strong>
            <p>{criticalError}</p>
          </div>
          <button type="button" className="button button-small button-secondary" onClick={() => navigate('settings')}>
            调整设置
          </button>
        </div>
      ) : null}

      {conflictCount ? (
        <div className="alert alert-warning">
          <span className="alert-icon"><Icon name="alert" size={19} /></span>
          <div>
            <strong>锁定对象与筛选条件有冲突</strong>
            <p>软件会保留这些锁定对象，不会偷偷替换。你可以继续抽取，或解除锁定 / 调整筛选。</p>
            <div className="conflict-list">
              {Object.entries(lockConflicts).map(([id, reasons]) => {
                const pokemon = dexMap.get(Number(id));
                return (
                  <span key={id} className="conflict-chip">
                    {pokemon?.nameZh || `#${id}`}：{reasons.join('；')}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {!current.pokemon.length && !criticalError ? (
        <div className="alert alert-info">
          <span className="alert-icon"><Icon name="sparkles" size={19} /></span>
          <div>
            <strong>随机工作台是空的</strong>
            <p>点击「开始抽取」抽第一组宝可梦；也可以先手动锁定 1–{settings.count} 只，再让软件补全其余对象。绘画创作请到「绘画灵感工坊」。</p>
          </div>
          <button type="button" className="button button-small button-secondary" onClick={() => navigate('inspiration')}>
            去绘画灵感工坊
            <Icon name="arrow-right" size={14} />
          </button>
        </div>
      ) : null}

      <div className="workbench-grid">
        <section className="panel pokemon-panel" aria-labelledby="pokemon-section-title">
          <div className="section-heading">
            <div className="section-title-wrap">
              <span className="step-number">01</span>
              <div>
                <span className="eyebrow">POKÉMON OF THIS ROUND</span>
                <h2 id="pokemon-section-title">本轮宝可梦</h2>
              </div>
            </div>
            <div className="section-heading-actions">
              <span className="soft-count">
                {current.pokemon.length}/{settings.count}
                {lockedCount ? <span> · 锁定 {lockedCount}</span> : null}
              </span>
              <button type="button" className="button button-small button-ghost" onClick={() => setSearchOpen(true)}>
                <Icon name="search" size={15} />
                搜索图鉴
              </button>
            </div>
          </div>

          {!current.pokemon.length ? (
            <EmptyState
              icon="sparkles"
              title="从 1025 只宝可梦里开始一轮"
              description="当前设置会一起决定候选池：世代、编号范围、属性偏好与硬性筛选。先抽取一次，再逐只微调。"
              action={(
                <div className="empty-actions-row">
                  <button type="button" className="button button-primary" onClick={handleRandomize} disabled={!canGenerate}>
                    <Icon name="dice" size={18} />
                    开始抽取
                  </button>
                  <button type="button" className="button button-secondary" onClick={() => setSearchOpen(true)}>
                    <Icon name="lock" size={16} />
                    先手动锁定
                  </button>
                </div>
              )}
            >
              <div className="empty-pool-stats">
                <span><strong>{candidatePool.length}</strong> 只候选</span>
                <span><strong>{poolSummary.legendary}</strong> 传说</span>
                <span><strong>{poolSummary.mythical}</strong> 幻之</span>
                <span><strong>{randomNeed}</strong> 待随机</span>
              </div>
            </EmptyState>
          ) : (
            <>
              <div className={`pokemon-grid count-${visibleCardCount} ${settings.count > 6 ? 'is-dense' : ''}`.trim()}>
                {current.pokemon.map((entry, index) => {
                  const pokemon = dexMap.get(entry.id);
                  return (
                    <PokemonCard
                      key={`${entry.id}-${index}`}
                      pokemon={pokemon}
                      locked={entry.locked}
                      slotIndex={index}
                      mode={imageMode}
                      conflictReasons={entry.locked ? lockConflicts[entry.id] || [] : []}
                      onLock={toggleCurrentPokemonLock}
                      onReroll={rerollSinglePokemon}
                      detail={<PokemonDetailPanel pokemon={pokemon} dexMap={dexMap} />}
                    />
                  );
                })}
                {Array.from({ length: placeholders }, (_, index) => (
                  <EmptyPokemonSlot
                    key={`empty-${index}`}
                    canGenerate={canGenerate}
                    onDraw={handleRandomize}
                  />
                ))}
              </div>
              {emptySlots > placeholders ? (
                <p className="more-empty-note">
                  还有 {emptySlots - placeholders} 个槽位待填充，点击「开始抽取」一起补齐。
                </p>
              ) : null}
              <div className="pokemon-panel-footer">
                <span>
                  <Icon name="history" size={14} />
                  本轮更新于 {formatDateTime(current.updatedAt || current.createdAt)}
                </span>
                <button type="button" className="button button-small button-ghost" onClick={handleRandomize} disabled={!canGenerate}>
                  <Icon name="refresh" size={14} />
                  继续抽取未锁定槽位
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="workbench-aside">
          <ChallengeTimerCard />

          <section className="panel action-panel">
            <div className="panel-heading compact">
              <div>
                <span className="eyebrow">POKÉMON ACTIONS</span>
                <h2>本轮操作</h2>
              </div>
              <span className="mini-status"><Icon name="history" size={11} /> 自动记录</span>
            </div>
            <div className="action-stack">
              <button
                type="button"
                className="button button-ghost button-block"
                onClick={() => setSearchOpen(true)}
              >
                <Icon name="search" size={16} />
                手动锁定宝可梦
              </button>
              <button
                type="button"
                className="button button-ghost button-block"
                onClick={() => navigate('inspiration')}
              >
                <Icon name="palette" size={16} />
                去绘画灵感工坊
              </button>
              <button
                type="button"
                className="button button-ghost button-block button-danger-text"
                onClick={() => setClearOpen(true)}
                disabled={!current.pokemon.length}
              >
                <Icon name="trash" size={16} />
                清空本轮
              </button>
            </div>
            <div className="action-note">
              <Icon name="info" size={14} />
              每次成功抽取都会自动写入历史记录，最多保留 80 条。
            </div>
          </section>

          <section className="panel pool-mini-card">
            <div className="panel-heading compact">
              <div>
                <span className="eyebrow">CANDIDATE POOL</span>
                <h2>候选池概览</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => navigate('settings')} aria-label="前往筛选设置" title="调整筛选">
                <Icon name="sliders" size={17} />
              </button>
            </div>
            <div className="pool-number-row">
              <strong>{candidatePool.length.toLocaleString('zh-CN')}</strong>
              <span>只宝可梦</span>
            </div>
            <div className="pool-breakdown">
              <span><i className="legend-dot legend-gold" />传说 <strong>{poolSummary.legendary}</strong></span>
              <span><i className="legend-dot legend-violet" />幻之 <strong>{poolSummary.mythical}</strong></span>
              <span><i className="legend-dot legend-green" />待随机 <strong>{randomNeed}</strong></span>
            </div>
            {poolValidation.warnings.length ? (
              <p className="pool-warning">{poolValidation.warnings[0]}</p>
            ) : (
              <p className="pool-ok"><Icon name="check" size={13} /> 筛选条件已生效</p>
            )}
            {history.length ? (
              <button type="button" className="text-link" onClick={() => navigate('history')}>
                查看 {history.length} 条抽取历史
                <Icon name="arrow-right" size={14} />
              </button>
            ) : null}
          </section>
        </aside>
      </div>

      <p className="page-footnote">
        {timer.isRunning ? (
          <>
            <Icon name="clock" size={13} />
            挑战计时进行中，剩余 {timer.display}。
          </>
        ) : (
          <>
            <Icon name="database" size={13} />
            图鉴数据来自 PokeAPI，筛选与历史均保存在本机浏览器。
          </>
        )}
      </p>

      <PokemonSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ConfirmDialog
        open={clearOpen}
        title="清空本轮抽取？"
        description="本轮宝可梦与锁定状态会被清空；历史、收藏、图库和灵感工坊内容不会受到影响。"
        confirmLabel="清空本轮"
        cancelLabel="保留结果"
        tone="danger"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          clearComposition();
          setClearOpen(false);
        }}
      />
    </div>
  );
}
