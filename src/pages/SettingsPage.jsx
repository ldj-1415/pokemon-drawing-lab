import { useMemo, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import {
  APPEARANCE_TAG_SUGGESTIONS,
  BODY_SHAPES,
  EVOLUTION_STAGES,
  IMAGE_MODES,
  MAX_DRAW_COUNT,
  MIN_DRAW_COUNT,
} from '../data/settings.js';
import { GENERATIONS } from '../data/generations.js';
import { DUPLICATE_MODE_OPTIONS, POKEMON_TYPES, TYPE_MODE_OPTIONS, getTypeMeta } from '../data/types.js';
import {
  ATMOSPHERES,
  ATMOSPHERE_MODE_OPTIONS,
  ATMOSPHERE_STRENGTH_OPTIONS,
  ATMOSPHERE_TRAIT_LABELS,
  getAtmosphereSummary,
} from '../data/atmospheres.js';
import { COMPATIBILITY_MODE_OPTIONS } from '../data/compatibility.js';
import {
  IMAGE_PREFERENCES,
  IMAGE_PREFERENCE_MODE_OPTIONS,
  IMAGE_PREFERENCE_STRENGTH_OPTIONS,
  getImagePreferenceSummary,
} from '../data/imagePreferences.js';
import { POKEMON_TRAIT_LABELS } from '../utils/pokemonTraits.js';
import { formatBytes, getStorageSize } from '../utils/storage.js';
import { formatDateTime } from '../utils/format.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { NumberInput, Switch } from '../components/FormControls.jsx';
import { Icon } from '../components/Icon.jsx';
import { PokemonImage } from '../components/PokemonImage.jsx';
import { PokemonTypeBadge } from '../components/PokemonTypeBadge.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

function SettingsSection({ step, title, eyebrow, description, actions, children, id }) {
  return (
    <section className="panel settings-panel" id={id} aria-labelledby={`${id}-title`}>
      <div className="settings-section-head">
        <div className="section-title-wrap">
          <span className="step-number">{step}</span>
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 id={`${id}-title`}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="settings-section-actions">{actions}</div> : null}
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

function ToggleRow({ icon, title, description, checked, onChange, badge }) {
  return (
    <div className="toggle-row">
      <span className="toggle-row-icon"><Icon name={icon} size={19} /></span>
      <div className="toggle-row-copy">
        <div className="toggle-row-title">
          <strong>{title}</strong>
          {badge ? <span className="mini-status">{badge}</span> : null}
        </div>
        <p>{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function SettingsPage() {
  const {
    navigate,
    settings,
    updateSettings,
    toggleGeneration,
    selectAllGenerations,
    clearGenerations,
    togglePreferredType,
    setTypeWeight,
    addAppearanceTag,
    removeAppearanceTag,
    resetSettings,
    dex,
    dexMap,
    candidatePool,
    poolSummary,
    poolValidation,
    randomizeAll,
    imageMode,
    setImageMode,
    pokedex,
    syncRangeForSettings,
    storageAvailable,
  } = useLab();
  const [tagInput, setTagInput] = useState('');
  const [atmosphereInput, setAtmosphereInput] = useState('');
  const [imagePreferenceInput, setImagePreferenceInput] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  const previewPokemon = dexMap.get(25) || dex[0];
  const storageSize = formatBytes(getStorageSize());
  const selectedGenerationData = GENERATIONS.filter((generation) => settings.selectedGenerations.includes(generation.id));
  const selectedRange = selectedGenerationData.length
    ? {
      min: Math.min(...selectedGenerationData.map((generation) => generation.range[0])),
      max: Math.max(...selectedGenerationData.map((generation) => generation.range[1])),
    }
    : null;

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(POKEMON_TYPES.map((type) => [type.id, 0]));
    for (const pokemon of dex) {
      for (const type of pokemon.types) counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [dex]);

  const generationCounts = useMemo(() => {
    const counts = {};
    for (const pokemon of dex) {
      counts[pokemon.generation] = (counts[pokemon.generation] || 0) + 1;
    }
    return counts;
  }, [dex]);

  const shapeOptions = useMemo(() => BODY_SHAPES
    .map((shape) => ({
      ...shape,
      count: dex.filter((pokemon) => pokemon.shape === shape.id).length,
    }))
    .filter((shape) => shape.count > 0), [dex]);

  const stageCounts = useMemo(() => ({
    0: dex.filter((pokemon) => pokemon.stage === 0).length,
    1: dex.filter((pokemon) => pokemon.stage === 1).length,
    2: dex.filter((pokemon) => pokemon.stage === 2).length,
    3: dex.filter((pokemon) => pokemon.stage >= 3).length,
  }), [dex]);

  const atmosphereSummary = useMemo(() => getAtmosphereSummary(settings), [settings]);
  const imagePreferenceSummary = useMemo(() => getImagePreferenceSummary(settings), [settings]);
  const activeAtmosphereLabels = atmosphereSummary.labels;
  const activeTraitLabels = atmosphereSummary.traits.map((trait) => ATMOSPHERE_TRAIT_LABELS[trait] || trait);
  const activeTypeLabels = atmosphereSummary.types.map((type) => getTypeMeta(type).label);
  const activeImagePreferenceLabels = imagePreferenceSummary.labels;
  const activeImageTraitLabels = imagePreferenceSummary.traits.map((trait) => POKEMON_TRAIT_LABELS[trait] || trait);
  const activeImageTypeLabels = imagePreferenceSummary.types.map((type) => getTypeMeta(type).label);

  const syncing = pokedex.syncState.status === 'syncing';
  const syncPercent = pokedex.syncState.total
    ? Math.min(100, Math.round((pokedex.syncState.done / pokedex.syncState.total) * 100))
    : 0;

  const applySelectedGenerationRange = () => {
    if (!selectedRange) return;
    updateSettings({ rangeMin: selectedRange.min, rangeMax: selectedRange.max });
  };

  const submitTag = (event) => {
    event.preventDefault();
    const clean = tagInput.trim();
    if (!clean) return;
    addAppearanceTag(clean);
    setTagInput('');
  };

  const toggleAtmosphere = (id) => {
    updateSettings((previous) => {
      if (previous.atmosphereMode === 'single') {
        return {
          atmospheres: previous.atmospheres.includes(id) ? [] : [id],
        };
      }
      if (previous.atmosphereMode === 'multi') {
        return {
          atmospheres: previous.atmospheres.includes(id)
            ? previous.atmospheres.filter((item) => item !== id)
            : [...previous.atmospheres, id],
        };
      }
      return {};
    });
  };

  const addCustomAtmosphere = (event) => {
    event.preventDefault();
    const clean = atmosphereInput.trim().slice(0, 20);
    if (!clean) return;
    updateSettings((previous) => ({
      customAtmospheres: previous.customAtmospheres.includes(clean)
        ? previous.customAtmospheres
        : [...previous.customAtmospheres, clean].slice(0, 3),
    }));
    setAtmosphereInput('');
  };

  const removeCustomAtmosphere = (label) => {
    updateSettings((previous) => ({
      customAtmospheres: previous.customAtmospheres.filter((item) => item !== label),
    }));
  };

  const toggleImagePreference = (id) => {
    updateSettings((previous) => ({
      imagePreferences: previous.imagePreferences.includes(id)
        ? previous.imagePreferences.filter((item) => item !== id)
        : [...previous.imagePreferences, id],
    }));
  };

  const addCustomImagePreference = (event) => {
    event.preventDefault();
    const clean = imagePreferenceInput.trim().slice(0, 20);
    if (!clean) return;
    updateSettings((previous) => ({
      customImagePreferences: previous.customImagePreferences.includes(clean)
        ? previous.customImagePreferences
        : [...previous.customImagePreferences, clean].slice(0, 3),
    }));
    setImagePreferenceInput('');
  };

  const removeCustomImagePreference = (label) => {
    updateSettings((previous) => ({
      customImagePreferences: previous.customImagePreferences.filter((item) => item !== label),
    }));
  };

  const startDraw = () => {
    const result = randomizeAll();
    if (result.ok) navigate('workbench');
  };

  return (
    <div className="page page-settings">
      <PageHeader
        eyebrow="FILTERS & PREFERENCES"
        title="筛选设置"
        description="世代、编号与硬性筛选决定候选池；属性权重、氛围偏好、形象偏好和词条兼容性共同影响随机结果。所有修改即时生效并自动保存在浏览器中。"
        actions={(
          <>
            <span className="autosave-badge"><Icon name="check" size={14} /> 自动保存</span>
            <button type="button" className="button button-secondary" onClick={() => setResetOpen(true)}>
              <Icon name="reset" size={16} />
              恢复默认
            </button>
            <button type="button" className="button button-primary" onClick={startDraw} disabled={!candidatePool.length}>
              <Icon name="sparkles" size={17} />
              生成一轮
            </button>
          </>
        )}
      />

      <div className="settings-layout">
        <div className="settings-main">
          <SettingsSection
            id="draw-scope"
            step="01"
            eyebrow="DRAW SCOPE"
            title="抽取范围"
            description="目标世代与全国图鉴编号范围取交集，只有同时满足的宝可梦会进入候选池。"
            actions={(
              <div className="inline-actions">
                <button type="button" className="text-button" onClick={selectAllGenerations}>全选世代</button>
                <span className="action-divider" />
                <button type="button" className="text-button" onClick={clearGenerations}>清空</button>
              </div>
            )}
          >
            <div className="generation-grid">
              {GENERATIONS.map((generation) => {
                const selected = settings.selectedGenerations.includes(generation.id);
                return (
                  <button
                    key={generation.id}
                    type="button"
                    className={`generation-option ${selected ? 'is-selected' : ''}`.trim()}
                    onClick={() => toggleGeneration(generation.id)}
                    aria-pressed={selected}
                    style={{ '--generation-color': generation.color }}
                  >
                    <span className="generation-check">
                      {selected ? <Icon name="check" size={13} /> : null}
                    </span>
                    <span className="generation-roman">{generation.short}</span>
                    <strong>{generation.label}</strong>
                    <small>{generation.region} · {String(generation.range[0]).padStart(4, '0')}–{String(generation.range[1]).padStart(4, '0')}</small>
                    <span className="generation-count">{generationCounts[generation.id] || 0} 只</span>
                  </button>
                );
              })}
            </div>

            {!settings.selectedGenerations.length ? (
              <div className="inline-note inline-note-warning">
                <Icon name="alert" size={16} />
                当前没有选中任何世代，候选池会为空。点击「全选世代」或至少选择一个世代。
              </div>
            ) : null}

            <div className="setting-split">
              <div className="setting-block">
                <div className="setting-label-row">
                  <h3>全国图鉴编号范围</h3>
                  <span className="setting-value">#{String(settings.rangeMin).padStart(4, '0')} – #{String(settings.rangeMax).padStart(4, '0')}</span>
                </div>
                <div className="range-input-row">
                  <NumberInput
                    label="起始编号"
                    prefix="#"
                    min={1}
                    max={1025}
                    value={settings.rangeMin}
                    onChange={(value) => updateSettings({ rangeMin: value })}
                  />
                  <span className="range-dash" aria-hidden="true">—</span>
                  <NumberInput
                    label="结束编号"
                    prefix="#"
                    min={1}
                    max={1025}
                    value={settings.rangeMax}
                    onChange={(value) => updateSettings({ rangeMax: value })}
                  />
                </div>
                {settings.rangeMin > settings.rangeMax ? (
                  <p className="field-error"><Icon name="alert" size={13} /> 起始编号不能大于结束编号。</p>
                ) : null}
                <div className="quick-range-row">
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={() => updateSettings({ rangeMin: 1, rangeMax: 1025 })}
                  >
                    全图鉴 1–1025
                  </button>
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={applySelectedGenerationRange}
                    disabled={!selectedRange}
                  >
                    当前世代范围
                  </button>
                </div>
              </div>

              <div className="setting-block">
                <div className="setting-label-row">
                  <h3>抽取数量</h3>
                  <span className="setting-value">1–{MAX_DRAW_COUNT} 只</span>
                </div>
                <div className="count-control">
                  <button
                    type="button"
                    className="count-step"
                    onClick={() => updateSettings({ count: Math.max(MIN_DRAW_COUNT, settings.count - 1) })}
                    disabled={settings.count <= MIN_DRAW_COUNT}
                    aria-label="减少抽取数量"
                  >
                    −
                  </button>
                  <NumberInput
                    value={settings.count}
                    min={MIN_DRAW_COUNT}
                    max={MAX_DRAW_COUNT}
                    onChange={(value) => updateSettings({ count: value })}
                    suffix="只"
                  />
                  <button
                    type="button"
                    className="count-step"
                    onClick={() => updateSettings({ count: Math.min(MAX_DRAW_COUNT, settings.count + 1) })}
                    disabled={settings.count >= MAX_DRAW_COUNT}
                    aria-label="增加抽取数量"
                  >
                    +
                  </button>
                </div>
                <div className="quick-count-row">
                  {[1, 3, 5, 10].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`quick-chip ${settings.count === value ? 'is-active' : ''}`.trim()}
                      onClick={() => updateSettings({ count: value })}
                    >
                      {value} 只
                    </button>
                  ))}
                </div>
                <p className="setting-hint">
                  默认 3 只。候选池不足或锁定对象超过数量时，工作台会明确提示。
                </p>
              </div>
            </div>

            <div className="setting-block">
              <div className="setting-label-row">
                <h3>重复规则</h3>
                <span className="setting-value">影响真实抽取结果</span>
              </div>
              <div className="mode-grid mode-grid-3">
                {DUPLICATE_MODE_OPTIONS.map((option) => (
                  <label key={option.id} className={`mode-card ${settings.duplicateMode === option.id ? 'is-selected' : ''}`.trim()}>
                    <input
                      type="radio"
                      name="duplicate-mode"
                      value={option.id}
                      checked={settings.duplicateMode === option.id}
                      onChange={() => updateSettings({ duplicateMode: option.id })}
                    />
                    <span className="mode-radio" aria-hidden="true" />
                    <span className="mode-card-copy">
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="type-preferences"
            step="02"
            eyebrow="TYPE PREFERENCES"
            title="属性偏好"
            description="选中的属性可以硬性筛选，也可以只提高出现概率。所有 18 种官方属性均支持多选。"
            actions={<span className="soft-count">已选 {settings.preferredTypes.length} / 18</span>}
          >
            <div className="type-picker">
              {POKEMON_TYPES.map((type) => {
                const selected = settings.preferredTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`type-pref-chip ${selected ? 'is-selected' : ''}`.trim()}
                    style={{
                      '--type-color': type.color,
                      '--type-soft': type.soft,
                      '--type-text': type.text,
                    }}
                    onClick={() => togglePreferredType(type.id)}
                    aria-pressed={selected}
                  >
                    <span className="type-pref-dot" />
                    <span>{type.label}</span>
                    <small>{typeCounts[type.id] || 0}</small>
                    {selected ? <Icon name="check" size={13} /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mode-grid mode-grid-3">
              {TYPE_MODE_OPTIONS.map((option) => (
                <label key={option.id} className={`mode-card ${settings.typeMode === option.id ? 'is-selected' : ''}`.trim()}>
                  <input
                    type="radio"
                    name="type-mode"
                    value={option.id}
                    checked={settings.typeMode === option.id}
                    onChange={() => updateSettings({ typeMode: option.id })}
                  />
                  <span className="mode-radio" aria-hidden="true" />
                  <span className="mode-card-copy">
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>

            {settings.typeMode === 'weighted' ? (
              <div className="weight-panel">
                <div className="weight-panel-head">
                  <div>
                    <h3>属性权重</h3>
                    <p>权重越高，符合该属性的宝可梦被抽中的概率越大。双属性宝可梦会累加匹配权重。</p>
                  </div>
                  <span className="mini-status">1–9 级</span>
                </div>
                {settings.preferredTypes.length ? (
                  <div className="weight-list">
                    {settings.preferredTypes.map((typeId) => {
                      const meta = getTypeMeta(typeId);
                      const weight = settings.typeWeights[typeId] || 1;
                      return (
                        <div className="weight-row" key={typeId}>
                          <div className="weight-type">
                            <PokemonTypeBadge type={typeId} />
                            <span className="weight-type-count">{typeCounts[typeId]} 只图鉴成员</span>
                          </div>
                          <input
                            className="weight-slider"
                            type="range"
                            min="1"
                            max="9"
                            step="1"
                            value={weight}
                            onChange={(event) => setTypeWeight(typeId, event.target.value)}
                            style={{ '--weight-color': meta.color }}
                            aria-label={`${meta.label}属性权重`}
                          />
                          <div className="weight-stepper">
                            <button
                              type="button"
                              onClick={() => setTypeWeight(typeId, weight - 1)}
                              disabled={weight <= 1}
                              aria-label={`降低${meta.label}权重`}
                            >
                              −
                            </button>
                            <strong>{weight}</strong>
                            <button
                              type="button"
                              onClick={() => setTypeWeight(typeId, weight + 1)}
                              disabled={weight >= 9}
                              aria-label={`提高${meta.label}权重`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="inline-note inline-note-warning">
                    <Icon name="info" size={16} />
                    权重模式已开启，但还没有选择偏好属性。请先在上方点选属性，否则所有宝可梦概率相同。
                  </div>
                )}
                <p className="setting-hint">
                  未匹配任何偏好属性的宝可梦仍保留基础权重 1，因此权重模式不会变成硬性筛选。
                </p>
              </div>
            ) : null}

            {settings.typeMode === 'hard' && !settings.preferredTypes.length ? (
              <div className="inline-note inline-note-warning">
                <Icon name="alert" size={16} />
                硬性筛选已开启但未选择属性，目前不会按属性过滤。选择至少一种属性后才会收窄候选池。
              </div>
            ) : null}
            {settings.typeMode === 'off' ? (
              <div className="inline-note">
                <Icon name="info" size={16} />
                「仅作参考」不会改变候选池或抽取概率，属性选择只作为你的绘画偏好保留。
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            id="atmosphere"
            step="03"
            eyebrow="ATMOSPHERE & COMPATIBILITY"
            title="氛围与词条兼容"
            description="氛围是概率偏好，不会硬性排除宝可梦。它会同时影响属性、外观特征、场景、天气、时间、动作、互动、构图和视觉表现；词条兼容性则负责排除明确冲突。"
            actions={(
              <span className="soft-count">
                {atmosphereSummary.isActive
                  ? `当前 ${activeAtmosphereLabels.join(' + ')}`
                  : settings.atmosphereMode === 'off' ? '不限制' : '待配置'}
              </span>
            )}
          >
            <div className="setting-block">
              <div className="setting-label-row">
                <h3>氛围选择方式</h3>
                <span className="setting-value">软性偏好</span>
              </div>
              <div className="mode-grid mode-grid-4">
                {ATMOSPHERE_MODE_OPTIONS.map((option) => (
                  <label key={option.id} className={`mode-card ${settings.atmosphereMode === option.id ? 'is-selected' : ''}`.trim()}>
                    <input
                      type="radio"
                      name="atmosphere-mode"
                      value={option.id}
                      checked={settings.atmosphereMode === option.id}
                      onChange={() => updateSettings({ atmosphereMode: option.id })}
                    />
                    <span className="mode-radio" aria-hidden="true" />
                    <span className="mode-card-copy">
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {settings.atmosphereMode === 'off' ? (
              <div className="inline-note">
                <Icon name="info" size={16} />
                不限制模式下不会根据氛围调整任何权重；词条兼容性仍按下方规则处理。
              </div>
            ) : null}

            {settings.atmosphereMode === 'single' || settings.atmosphereMode === 'multi' ? (
              <div className="setting-block atmosphere-picker-block">
                <div className="setting-label-row">
                  <h3>{settings.atmosphereMode === 'single' ? '选择一个主氛围' : '选择多个氛围'}</h3>
                  <span className="setting-value">
                    {settings.atmosphereMode === 'single' ? '单选 · 可取消' : '多选 · 可叠加'}
                  </span>
                </div>
                <div className="atmosphere-picker">
                  {ATMOSPHERES.map((item) => {
                    const selected = settings.atmospheres.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`atmosphere-option ${selected ? 'is-selected' : ''}`.trim()}
                        style={{ '--atmosphere-color': item.color }}
                        onClick={() => toggleAtmosphere(item.id)}
                        aria-pressed={selected}
                      >
                        <span className="atmosphere-option-icon"><Icon name={item.icon} size={18} /></span>
                        <span className="atmosphere-option-copy">
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                        {selected ? <Icon name="check" size={14} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {settings.atmosphereMode === 'custom' ? (
              <div className="setting-block atmosphere-picker-block">
                <div className="setting-label-row">
                  <h3>自定义氛围</h3>
                  <span className="setting-value">最多 3 个 · 关键词映射为软权重</span>
                </div>
                <p className="setting-hint">
                  例如「夏日海边」「赛博雨夜」「毛茸茸的午后」。自定义词会按关键词映射到已有氛围倾向；未识别的词只作为文字记录，不会乱加属性权重。
                </p>
                <form className="tag-form" onSubmit={addCustomAtmosphere}>
                  <input
                    type="text"
                    value={atmosphereInput}
                    maxLength={20}
                    onChange={(event) => setAtmosphereInput(event.target.value)}
                    placeholder="输入自定义氛围，例如：夏日海边"
                    aria-label="自定义氛围"
                  />
                  <button
                    type="submit"
                    className="button button-small button-secondary"
                    disabled={!atmosphereInput.trim() || settings.customAtmospheres.length >= 3}
                  >
                    <Icon name="plus" size={14} />
                    添加
                  </button>
                </form>
                {settings.customAtmospheres.length ? (
                  <div className="tag-list">
                    {settings.customAtmospheres.map((label) => (
                      <span className="appearance-tag" key={label}>
                        {label}
                        <button type="button" onClick={() => removeCustomAtmosphere(label)} aria-label={`删除自定义氛围${label}`}>
                          <Icon name="close" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="inline-note inline-note-warning">
                    <Icon name="alert" size={16} />
                    自定义模式还没有词条。添加至少一个自定义氛围，或切换到单选 / 多选。
                  </div>
                )}
              </div>
            ) : null}

            {settings.atmosphereMode !== 'off' ? (
              <>
                <div className="setting-block">
                  <div className="setting-label-row">
                    <h3>偏好强度</h3>
                    <span className="setting-value">不改变硬性筛选</span>
                  </div>
                  <div className="atmosphere-strength-grid">
                    {ATMOSPHERE_STRENGTH_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`atmosphere-strength ${settings.atmosphereStrength === item.id ? 'is-selected' : ''}`.trim()}
                        onClick={() => updateSettings({ atmosphereStrength: item.id })}
                        aria-pressed={settings.atmosphereStrength === item.id}
                      >
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`atmosphere-summary ${atmosphereSummary.isActive ? 'is-active' : ''}`.trim()}>
                  <div className="atmosphere-summary-head">
                    <span><Icon name="sparkles" size={15} /> 当前氛围倾向</span>
                    <strong>
                      {atmosphereSummary.isActive
                        ? `${activeAtmosphereLabels.join(' + ')} · ${atmosphereSummary.strength.label}`
                        : '等待选择'}
                    </strong>
                  </div>
                  {atmosphereSummary.isActive ? (
                    <>
                      <p>
                        会提高「{activeTypeLabels.join('、') || '无特定属性'}」属性与「{activeTraitLabels.join('、') || '无特定外观'}」外观特征的出现概率。
                        未匹配的宝可梦、场景与动作仍会保留基础概率，不会被硬性排除。
                      </p>
                      <div className="atmosphere-summary-chips">
                        {activeTypeLabels.map((label) => <span key={`type-${label}`}>{label}</span>)}
                        {activeTraitLabels.map((label) => <span key={`trait-${label}`} className="is-trait">{label}</span>)}
                      </div>
                    </>
                  ) : (
                    <p>还没有可生效的氛围倾向。选择氛围或添加自定义词后，生成时会自动参与软权重。</p>
                  )}
                </div>
              </>
            ) : null}

            <div className="setting-block compatibility-block">
              <div className="setting-label-row">
                <h3>词条兼容模式</h3>
                <span className="setting-value">地点 / 天气 / 时间 / 动作 / 互动 / 事件 / 构图</span>
              </div>
              <div className="mode-grid mode-grid-3">
                {COMPATIBILITY_MODE_OPTIONS.map((option) => (
                  <label key={option.id} className={`mode-card ${settings.compatibilityMode === option.id ? 'is-selected' : ''}`.trim()}>
                    <input
                      type="radio"
                      name="compatibility-mode"
                      value={option.id}
                      checked={settings.compatibilityMode === option.id}
                      onChange={() => updateSettings({ compatibilityMode: option.id })}
                    />
                    <span className="mode-radio" aria-hidden="true" />
                    <span className="mode-card-copy">
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className="setting-hint">
                兼容性由结构化标签计算，例如「暴雪」与「热带海岛」会冲突，但与「寒冷海岛」可以兼容。有条件兼容不会强制添加解释文字，创意模式只会提高它们出现的概率。
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            id="image-preferences"
            step="04"
            eyebrow="FORM & SILHOUETTE"
            title="宝可梦形象偏好"
            description="形象偏好与氛围偏好独立设置，但会在抽取时叠加计算。它根据属性与派生外观特征调整概率，不会硬性排除未匹配的宝可梦。"
            actions={(
              <span className="soft-count">
                {imagePreferenceSummary.isActive
                  ? `当前 ${activeImagePreferenceLabels.join(' + ')}`
                  : settings.imagePreferenceMode === 'off' ? '不限制' : '待配置'}
              </span>
            )}
          >
            <div className="setting-block">
              <div className="setting-label-row">
                <h3>形象选择方式</h3>
                <span className="setting-value">抽取权重</span>
              </div>
              <div className="mode-grid mode-grid-3">
                {IMAGE_PREFERENCE_MODE_OPTIONS.map((option) => (
                  <label key={option.id} className={`mode-card ${settings.imagePreferenceMode === option.id ? 'is-selected' : ''}`.trim()}>
                    <input
                      type="radio"
                      name="image-preference-mode"
                      value={option.id}
                      checked={settings.imagePreferenceMode === option.id}
                      onChange={() => updateSettings({ imagePreferenceMode: option.id })}
                    />
                    <span className="mode-radio" aria-hidden="true" />
                    <span className="mode-card-copy">
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {settings.imagePreferenceMode === 'off' ? (
              <div className="inline-note">
                <Icon name="info" size={16} />
                不限制模式不会根据形象词条调整抽取概率；已有氛围偏好仍会独立生效。
              </div>
            ) : null}

            {settings.imagePreferenceMode === 'multi' ? (
              <div className="setting-block image-preference-block">
                <div className="setting-label-row">
                  <h3>选择形象词条</h3>
                  <span className="setting-value">可多选 · 综合计算</span>
                </div>
                <div className="image-preference-grid">
                  {IMAGE_PREFERENCES.map((item) => {
                    const selected = settings.imagePreferences.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`image-preference-option ${selected ? 'is-selected' : ''}`.trim()}
                        style={{ '--image-preference-color': item.color }}
                        onClick={() => toggleImagePreference(item.id)}
                        aria-pressed={selected}
                      >
                        <span className="image-preference-icon"><Icon name={item.icon} size={17} /></span>
                        <span className="image-preference-copy">
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                        {selected ? <Icon name="check" size={13} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {settings.imagePreferenceMode === 'custom' ? (
              <div className="setting-block image-preference-block">
                <div className="setting-label-row">
                  <h3>自定义形象偏好</h3>
                  <span className="setting-value">最多 3 个 · 关键词映射</span>
                </div>
                <p className="setting-hint">
                  例如「毛茸茸的小家伙」「优雅又神秘」「圆滚滚的呆萌」。自定义词会映射到已有形象倾向；未识别的词不会凭空增加属性权重。
                </p>
                <form className="tag-form" onSubmit={addCustomImagePreference}>
                  <input
                    type="text"
                    value={imagePreferenceInput}
                    maxLength={20}
                    onChange={(event) => setImagePreferenceInput(event.target.value)}
                    placeholder="输入自定义形象，例如：毛茸茸的小家伙"
                    aria-label="自定义形象偏好"
                  />
                  <button
                    type="submit"
                    className="button button-small button-secondary"
                    disabled={!imagePreferenceInput.trim() || settings.customImagePreferences.length >= 3}
                  >
                    <Icon name="plus" size={14} />
                    添加
                  </button>
                </form>
                {settings.customImagePreferences.length ? (
                  <div className="tag-list">
                    {settings.customImagePreferences.map((label) => (
                      <span className="appearance-tag" key={label}>
                        {label}
                        <button type="button" onClick={() => removeCustomImagePreference(label)} aria-label={`删除自定义形象偏好${label}`}>
                          <Icon name="close" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="inline-note inline-note-warning">
                    <Icon name="alert" size={16} />
                    自定义模式还没有词条。添加至少一个自定义形象，或切换到多选。
                  </div>
                )}
              </div>
            ) : null}

            {settings.imagePreferenceMode !== 'off' ? (
              <>
                <div className="setting-block">
                  <div className="setting-label-row">
                    <h3>形象偏好强度</h3>
                    <span className="setting-value">不改变硬性筛选</span>
                  </div>
                  <div className="atmosphere-strength-grid">
                    {IMAGE_PREFERENCE_STRENGTH_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`atmosphere-strength ${settings.imagePreferenceStrength === item.id ? 'is-selected' : ''}`.trim()}
                        onClick={() => updateSettings({ imagePreferenceStrength: item.id })}
                        aria-pressed={settings.imagePreferenceStrength === item.id}
                      >
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`image-preference-summary ${imagePreferenceSummary.isActive ? 'is-active' : ''}`.trim()}>
                  <div className="atmosphere-summary-head">
                    <span><Icon name="heart" size={15} /> 当前形象倾向</span>
                    <strong>
                      {imagePreferenceSummary.isActive
                        ? `${activeImagePreferenceLabels.join(' + ')} · ${imagePreferenceSummary.strength.label}`
                        : '等待选择'}
                    </strong>
                  </div>
                  {imagePreferenceSummary.isActive ? (
                    <>
                      <p>
                        会提高「{activeImageTypeLabels.join('、') || '无特定属性'}」属性与「{activeImageTraitLabels.join('、') || '无特定外观'}」外观特征的出现概率。
                        未匹配的宝可梦仍保留基础概率；硬性筛选和锁定宝可梦优先。
                      </p>
                      <div className="atmosphere-summary-chips">
                        {activeImageTypeLabels.map((label) => <span key={`image-type-${label}`}>{label}</span>)}
                        {activeImageTraitLabels.map((label) => <span key={`image-trait-${label}`} className="is-trait">{label}</span>)}
                      </div>
                    </>
                  ) : (
                    <p>还没有可生效的形象倾向。选择词条或添加自定义词后，生成时会自动参与软权重。</p>
                  )}
                </div>
              </>
            ) : null}
          </SettingsSection>

          <SettingsSection
            id="other-preferences"
            step="05"
            eyebrow="MORE FILTERS"
            title="其他偏好"
            description="使用 PokeAPI 提供的进化阶段、体型、传说与幻之标记。无法从 API 获得的外观分类会作为自定义备注，不伪装成官方数据。"
          >
            <div className="setting-block">
              <div className="setting-label-row">
                <h3>进化阶段</h3>
                <span className="setting-value">不选代表不限</span>
              </div>
              <div className="chip-wrap">
                <button
                  type="button"
                  className={`filter-chip ${!settings.evolutionStages.length ? 'is-active' : ''}`.trim()}
                  onClick={() => updateSettings({ evolutionStages: [] })}
                >
                  不限
                </button>
                {EVOLUTION_STAGES.map((stage) => {
                  const active = settings.evolutionStages.includes(stage.value);
                  return (
                    <button
                      key={stage.value}
                      type="button"
                      className={`filter-chip ${active ? 'is-active' : ''}`.trim()}
                      onClick={() => updateSettings((previous) => ({
                        evolutionStages: previous.evolutionStages.includes(stage.value)
                          ? previous.evolutionStages.filter((value) => value !== stage.value)
                          : [...previous.evolutionStages, stage.value],
                      }))}
                    >
                      {stage.label}
                      <small>{stageCounts[stage.value] || 0}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="setting-block">
              <div className="setting-label-row">
                <h3>体型</h3>
                <span className="setting-value">来自 PokeAPI shape</span>
              </div>
              <div className="chip-wrap">
                <button
                  type="button"
                  className={`filter-chip ${!settings.bodyShapes.length ? 'is-active' : ''}`.trim()}
                  onClick={() => updateSettings({ bodyShapes: [] })}
                >
                  不限
                </button>
                {shapeOptions.map((shape) => {
                  const active = settings.bodyShapes.includes(shape.id);
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      className={`filter-chip ${active ? 'is-active' : ''}`.trim()}
                      onClick={() => updateSettings((previous) => ({
                        bodyShapes: previous.bodyShapes.includes(shape.id)
                          ? previous.bodyShapes.filter((value) => value !== shape.id)
                          : [...previous.bodyShapes, shape.id],
                      }))}
                    >
                      {shape.label}
                      <small>{shape.count}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="toggle-list">
              <ToggleRow
                icon="sparkles"
                title="包含传说宝可梦"
                description="关闭后，拥有传说标记的宝可梦会从候选池中排除。"
                checked={settings.includeLegendary}
                onChange={(checked) => updateSettings({ includeLegendary: checked })}
                badge={`${dex.filter((pokemon) => pokemon.isLegendary).length} 只`}
              />
              <ToggleRow
                icon="zap"
                title="包含幻之宝可梦"
                description="关闭后，拥有幻之标记的宝可梦会从候选池中排除。"
                checked={settings.includeMythical}
                onChange={(checked) => updateSettings({ includeMythical: checked })}
                badge={`${dex.filter((pokemon) => pokemon.isMythical).length} 只`}
              />
            </div>

            <div className="setting-block appearance-block">
              <div className="setting-label-row">
                <h3>自定义外观标签</h3>
                <span className="setting-value">仅作绘画备注</span>
              </div>
              <p className="setting-hint">
                PokeAPI 没有官方的“外观风格”分类，因此这里不生成虚假筛选数据。标签只会保留在你的偏好里，方便你记下想画的质感。
              </p>
              <form className="tag-form" onSubmit={submitTag}>
                <input
                  type="text"
                  value={tagInput}
                  maxLength={16}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="输入自定义标签，例如：毛茸茸"
                  aria-label="自定义外观标签"
                />
                <button type="submit" className="button button-small button-secondary" disabled={!tagInput.trim()}>
                  <Icon name="plus" size={14} />
                  添加
                </button>
              </form>
              <div className="tag-suggestion-row">
                <span>试试：</span>
                {APPEARANCE_TAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="tag-suggestion"
                    onClick={() => addAppearanceTag(tag)}
                    disabled={settings.appearanceTags.includes(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              {settings.appearanceTags.length ? (
                <div className="tag-list">
                  {settings.appearanceTags.map((tag) => (
                    <span className="appearance-tag" key={tag}>
                      {tag}
                      <button type="button" onClick={() => removeAppearanceTag(tag)} aria-label={`删除标签${tag}`}>
                        <Icon name="close" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted-text">还没有自定义标签。</p>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            id="display-data"
            step="06"
            eyebrow="DISPLAY & DATA"
            title="显示与数据"
            description="切换图鉴图片类型，查看 PokeAPI 缓存状态，或重新同步当前筛选范围内的宝可梦资料。"
          >
            <div className="setting-block">
              <div className="setting-label-row">
                <h3>图片显示模式</h3>
                <span className="setting-value">立即应用到全部页面</span>
              </div>
              <div className="image-mode-grid">
                {IMAGE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`image-mode-card ${imageMode === mode.id ? 'is-selected' : ''}`.trim()}
                    onClick={() => setImageMode(mode.id)}
                    aria-pressed={imageMode === mode.id}
                  >
                    <div className="image-mode-preview">
                      {previewPokemon ? (
                        <PokemonImage
                          pokemon={previewPokemon}
                          mode={mode.id}
                          size="mode-preview"
                          loading="eager"
                        />
                      ) : null}
                      {imageMode === mode.id ? <span className="selected-check"><Icon name="check" size={14} /></span> : null}
                    </div>
                    <strong>{mode.label}</strong>
                    <small>{mode.hint}</small>
                  </button>
                ))}
              </div>
              <p className="setting-hint">图片加载失败时会自动尝试备用图，再失败则显示编号占位图，不会影响抽取。</p>
            </div>

            <div className="data-panel">
              <div className="data-panel-head">
                <div>
                  <span className="eyebrow">POKEAPI CACHE</span>
                  <h3>图鉴数据与缓存</h3>
                </div>
                <span className={`data-status data-status-${pokedex.apiStatus}`}>
                  <span className="api-dot" />
                  {pokedex.apiStatus === 'online' ? 'API 在线' : pokedex.apiStatus === 'offline' ? 'API 离线' : '检查中'}
                </span>
              </div>

              <div className="data-stats-grid">
                <div className="data-stat">
                  <span>本地图鉴</span>
                  <strong>{dex.length.toLocaleString('zh-CN')} 只</strong>
                  <small>随软件打包，立即可用</small>
                </div>
                <div className="data-stat">
                  <span>API 更新缓存</span>
                  <strong>{pokedex.cachedUpdateCount.toLocaleString('zh-CN')} 只</strong>
                  <small>{pokedex.lastSyncedAt ? `上次同步 ${formatDateTime(pokedex.lastSyncedAt)}` : '尚未手动同步'}</small>
                </div>
                <div className="data-stat">
                  <span>本地数据占用</span>
                  <strong>{storageSize}</strong>
                  <small>{storageAvailable ? 'localStorage 可用' : '存储受限，仅临时生效'}</small>
                </div>
                <div className="data-stat">
                  <span>当前候选池</span>
                  <strong>{candidatePool.length.toLocaleString('zh-CN')} 只</strong>
                  <small>遵循全部硬性筛选</small>
                </div>
              </div>

              <div className="data-meta-line">
                <span>数据源：<a href={pokedex.source.url} target="_blank" rel="noreferrer">pokeapi.co <Icon name="external" size={11} /></a></span>
                <span>打包数据：{formatDateTime(pokedex.source.generatedAt)}</span>
                <span>图片 URL 缓存，不保存图片二进制</span>
              </div>

              <div className="sync-area">
                <div className="sync-copy">
                  <strong>从 PokeAPI 同步当前范围</strong>
                  <p>
                    将当前世代与编号范围内的宝可梦资料批量写入本地缓存。范围越大耗时越长；失败时软件会继续使用已有数据。
                  </p>
                </div>
                <div className="sync-actions">
                  {syncing ? (
                    <button type="button" className="button button-small button-ghost" onClick={pokedex.cancelSync}>
                      <Icon name="close" size={14} />
                      取消同步
                    </button>
                  ) : (
                    <button type="button" className="button button-small button-secondary" onClick={syncRangeForSettings}>
                      <Icon name="refresh" size={14} />
                      同步当前范围
                    </button>
                  )}
                  <button type="button" className="button button-small button-ghost" onClick={pokedex.retryHealth}>
                    <Icon name="wifi" size={14} />
                    重新检测
                  </button>
                </div>
              </div>

              {pokedex.syncState.status !== 'idle' ? (
                <div className={`sync-progress sync-${pokedex.syncState.status}`}>
                  <div className="sync-progress-head">
                    <span>{pokedex.syncState.message}</span>
                    {syncing ? <strong>{syncPercent}%</strong> : null}
                  </div>
                  {syncing ? (
                    <div className="progress-track">
                      <span style={{ width: `${syncPercent}%` }} />
                    </div>
                  ) : null}
                  {pokedex.syncState.errors?.length ? (
                    <p className="sync-error">失败项：{pokedex.syncState.errors.slice(0, 3).join('；')}</p>
                  ) : null}
                </div>
              ) : null}

              {pokedex.apiStatus === 'offline' ? (
                <div className="inline-note inline-note-warning">
                  <Icon name="wifi-off" size={16} />
                  PokeAPI 暂时无法连接。内置图鉴和已缓存数据仍可完整使用，筛选、随机、收藏和历史不受影响。
                </div>
              ) : null}
            </div>
          </SettingsSection>

          <div className="settings-danger-zone">
            <div>
              <strong>恢复默认设置</strong>
              <p>重置世代、编号、数量、属性、氛围、形象与兼容性设置。收藏、历史和当前工作台不会被删除。</p>
            </div>
            <button type="button" className="button button-small button-ghost button-danger-text" onClick={() => setResetOpen(true)}>
              <Icon name="reset" size={14} />
              恢复默认
            </button>
          </div>
        </div>

        <aside className="settings-aside">
          <section className="panel pool-preview-panel" aria-labelledby="pool-preview-title">
            <div className="panel-heading compact">
              <div>
                <span className="eyebrow">LIVE PREVIEW</span>
                <h2 id="pool-preview-title">候选池预览</h2>
              </div>
              <span className={`live-dot ${candidatePool.length ? 'is-live' : ''}`} />
            </div>
            <div className="pool-big-number">
              <strong>{candidatePool.length.toLocaleString('zh-CN')}</strong>
              <span>只进入抽取池</span>
            </div>
            <div className="pool-preview-stats">
              <div><span>传说</span><strong>{poolSummary.legendary}</strong></div>
              <div><span>幻之</span><strong>{poolSummary.mythical}</strong></div>
              <div><span>抽取</span><strong>{settings.count} 只</strong></div>
            </div>
            <div className="pool-preview-summary">
              <span><Icon name="target" size={13} /> #{String(settings.rangeMin).padStart(4, '0')}–#{String(settings.rangeMax).padStart(4, '0')}</span>
              <span><Icon name="sparkles" size={13} /> {settings.preferredTypes.length ? `${settings.preferredTypes.length} 种偏好属性` : '属性不限'}</span>
              <span><Icon name="sliders" size={13} /> {DUPLICATE_MODE_OPTIONS.find((option) => option.id === settings.duplicateMode)?.title}</span>
              <span>
                <Icon name="heart" size={13} />
                {atmosphereSummary.isActive ? `${activeAtmosphereLabels.join(' + ')} · ${atmosphereSummary.strength.label}` : '氛围不限'}
              </span>
              <span>
                <Icon name="sparkles" size={13} />
                {imagePreferenceSummary.isActive
                  ? `${activeImagePreferenceLabels.join(' + ')} · ${imagePreferenceSummary.strength.label}`
                  : '形象不限'}
              </span>
              <span>
                <Icon name="check" size={13} />
                {COMPATIBILITY_MODE_OPTIONS.find((option) => option.id === settings.compatibilityMode)?.label}
              </span>
            </div>
            {poolValidation.errors.length ? (
              <div className="pool-alert pool-alert-error">
                <Icon name="alert" size={15} />
                <span>{poolValidation.errors[0]}</span>
              </div>
            ) : null}
            {poolValidation.warnings.length ? (
              <div className="pool-alert pool-alert-warning">
                <Icon name="info" size={15} />
                <span>{poolValidation.warnings[0]}</span>
              </div>
            ) : null}
            <button
              type="button"
              className="button button-primary button-block"
              onClick={startDraw}
              disabled={!candidatePool.length || settings.rangeMin > settings.rangeMax}
            >
              <Icon name="dice" size={17} />
              随机并查看工作台
            </button>
            <button type="button" className="button button-ghost button-block" onClick={() => navigate('workbench')}>
              返回随机工作台
            </button>
            <p className="setting-hint center">
              当前设置已自动保存到本机浏览器。
            </p>
          </section>

          <section className="panel quick-nav-panel">
            <span className="eyebrow">SHORTCUTS</span>
            <button type="button" className="quick-nav-row" onClick={() => navigate('favorites')}>
              <span><Icon name="heart" size={17} /> 我的收藏</span>
              <Icon name="chevron-right" size={15} />
            </button>
            <button type="button" className="quick-nav-row" onClick={() => navigate('history')}>
              <span><Icon name="history" size={17} /> 抽取历史</span>
              <Icon name="chevron-right" size={15} />
            </button>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="恢复默认设置？"
        description="世代、编号范围、抽取数量、属性偏好、权重、氛围、形象偏好、兼容模式、其他筛选与图片模式都会回到默认值。收藏、历史和工作台不会受到影响。"
        confirmLabel="恢复默认"
        cancelLabel="保留当前设置"
        tone="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetSettings();
          setResetOpen(false);
        }}
      />
    </div>
  );
}
