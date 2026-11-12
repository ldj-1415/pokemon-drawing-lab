import { useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { GENERATIONS } from '../data/generations.js';
import {
  BODY_SHAPES,
  EVOLUTION_STAGES,
  MAX_DRAW_COUNT,
  MIN_DRAW_COUNT,
} from '../data/settings.js';
import {
  DUPLICATE_MODE_OPTIONS,
  POKEMON_TYPES,
  TYPE_MODE_OPTIONS,
} from '../data/types.js';
import {
  ATMOSPHERES,
  ATMOSPHERE_MODE_OPTIONS,
  ATMOSPHERE_STRENGTH_OPTIONS,
  getAtmosphereSummary,
} from '../data/atmospheres.js';
import {
  IMAGE_PREFERENCES,
  IMAGE_PREFERENCE_MODE_OPTIONS,
  IMAGE_PREFERENCE_STRENGTH_OPTIONS,
  getImagePreferenceSummary,
} from '../data/imagePreferences.js';
import { NumberInput, Switch } from './FormControls.jsx';
import { Icon } from './Icon.jsx';

const SETTING_TABS = [
  { id: 'range', label: '范围与数量' },
  { id: 'types', label: '属性' },
  { id: 'atmosphere', label: '氛围' },
  { id: 'image', label: '形象' },
  { id: 'other', label: '其他筛选' },
];

function CompactChoice({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      className={`draw-choice ${active ? 'is-active' : ''} ${className}`.trim()}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function WorkbenchDrawSettings() {
  const {
    settings,
    updateSettings,
    toggleGeneration,
    selectAllGenerations,
    clearGenerations,
    togglePreferredType,
    setTypeWeight,
    atmosphereSummary,
    imagePreferenceSummary,
    canGenerate,
    randomizeAll,
  } = useLab();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState('range');
  const [atmosphereCustom, setAtmosphereCustom] = useState('');
  const [imageCustom, setImageCustom] = useState('');

  const typeMode = TYPE_MODE_OPTIONS.find((item) => item.id === settings.typeMode);
  const duplicateMode = DUPLICATE_MODE_OPTIONS.find((item) => item.id === settings.duplicateMode);
  const selectedTypeLabels = settings.preferredTypes
    .map((id) => POKEMON_TYPES.find((type) => type.id === id)?.label)
    .filter(Boolean);
  const summary = [
    settings.selectedGenerations.length === 9 ? '全世代' : `${settings.selectedGenerations.length} 世代`,
    `${settings.count} 只`,
    typeMode?.title || '属性',
    atmosphereSummary.isActive ? `氛围 ${atmosphereSummary.labels.join('+')}` : '氛围不限',
    imagePreferenceSummary.isActive ? `形象 ${imagePreferenceSummary.labels.join('+')}` : '形象不限',
  ];

  const toggleAtmosphere = (id) => {
    updateSettings((previous) => {
      if (previous.atmosphereMode === 'single') {
        return { atmospheres: previous.atmospheres.includes(id) ? [] : [id] };
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
    const clean = atmosphereCustom.trim().slice(0, 20);
    if (!clean) return;
    updateSettings((previous) => ({
      customAtmospheres: previous.customAtmospheres.includes(clean)
        ? previous.customAtmospheres
        : [...previous.customAtmospheres, clean].slice(0, 3),
    }));
    setAtmosphereCustom('');
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
    const clean = imageCustom.trim().slice(0, 20);
    if (!clean) return;
    updateSettings((previous) => ({
      customImagePreferences: previous.customImagePreferences.includes(clean)
        ? previous.customImagePreferences
        : [...previous.customImagePreferences, clean].slice(0, 3),
    }));
    setImageCustom('');
  };

  const removeCustomImagePreference = (label) => {
    updateSettings((previous) => ({
      customImagePreferences: previous.customImagePreferences.filter((item) => item !== label),
    }));
  };

  const startDraw = () => {
    const result = randomizeAll({
      includeScenes: false,
      includeReference: false,
      label: '抽取宝可梦',
    });
    if (result?.ok) {
      setOpen(false);
      window.setTimeout(() => {
        document.getElementById('pokemon-section-title')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  };

  return (
    <section className={`panel draw-settings-panel ${open ? 'is-open' : ''}`.trim()} aria-labelledby="draw-settings-title">
      <div className="draw-settings-head">
        <div className="draw-settings-title-wrap">
          <span className="step-number">00</span>
          <div>
            <span className="eyebrow">DRAW SETTINGS</span>
            <h2 id="draw-settings-title">抽取设置</h2>
            <p>{summary.join(' · ')}</p>
          </div>
        </div>
        <div className="draw-settings-head-actions">
          <button type="button" className="button button-small button-primary" onClick={startDraw} disabled={!canGenerate}>
            <Icon name="sparkles" size={15} />
            开始抽取
          </button>
          <button
            type="button"
            className="button button-small button-ghost"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <Icon name={open ? 'chevron-down' : 'sliders'} size={15} />
            {open ? '收起设置' : '展开设置'}
          </button>
        </div>
      </div>

      {open ? (
        <>
          <div className="draw-settings-tabs" role="tablist" aria-label="抽取设置分类">
            {SETTING_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`draw-settings-tab ${tab === item.id ? 'is-active' : ''}`.trim()}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="draw-settings-body">
            {tab === 'range' ? (
              <div className="draw-settings-grid">
                <div className="draw-settings-group draw-settings-group-wide">
                  <div className="draw-group-head">
                    <h3>世代范围</h3>
                    <div className="inline-actions">
                      <button type="button" className="text-button" onClick={selectAllGenerations}>全选</button>
                      <button type="button" className="text-button" onClick={clearGenerations}>清空</button>
                    </div>
                  </div>
                  <div className="draw-generation-grid">
                    {GENERATIONS.map((generation) => {
                      const selected = settings.selectedGenerations.includes(generation.id);
                      return (
                        <button
                          key={generation.id}
                          type="button"
                          className={`draw-generation ${selected ? 'is-active' : ''}`.trim()}
                          onClick={() => toggleGeneration(generation.id)}
                          aria-pressed={selected}
                          style={{ '--generation-color': generation.color }}
                          title={generation.label}
                        >
                          <strong>{generation.short}</strong>
                          <small>{generation.region}</small>
                        </button>
                      );
                    })}
                  </div>
                  <div className="draw-range-row">
                    <NumberInput
                      label="起始编号"
                      prefix="#"
                      min={1}
                      max={1025}
                      value={settings.rangeMin}
                      onChange={(value) => updateSettings({ rangeMin: value })}
                    />
                    <span className="range-dash">—</span>
                    <NumberInput
                      label="结束编号"
                      prefix="#"
                      min={1}
                      max={1025}
                      value={settings.rangeMax}
                      onChange={(value) => updateSettings({ rangeMax: value })}
                    />
                    <button
                      type="button"
                      className="draw-choice"
                      onClick={() => updateSettings({ rangeMin: 1, rangeMax: 1025 })}
                    >
                      全图鉴
                    </button>
                  </div>
                  {settings.rangeMin > settings.rangeMax ? (
                    <p className="field-error"><Icon name="alert" size={12} /> 起始编号不能大于结束编号。</p>
                  ) : null}
                </div>

                <div className="draw-settings-group">
                  <div className="draw-group-head"><h3>抽取数量</h3><span>{MIN_DRAW_COUNT}–{MAX_DRAW_COUNT} 只</span></div>
                  <div className="draw-count-row">
                    <button type="button" className="count-step" onClick={() => updateSettings({ count: Math.max(MIN_DRAW_COUNT, settings.count - 1) })} aria-label="减少抽取数量">−</button>
                    <NumberInput
                      value={settings.count}
                      min={MIN_DRAW_COUNT}
                      max={MAX_DRAW_COUNT}
                      onChange={(value) => updateSettings({ count: value })}
                      suffix="只"
                    />
                    <button type="button" className="count-step" onClick={() => updateSettings({ count: Math.min(MAX_DRAW_COUNT, settings.count + 1) })} aria-label="增加抽取数量">+</button>
                  </div>
                  <div className="draw-choice-row">
                    {[1, 3, 5, 10].map((value) => (
                      <CompactChoice key={value} active={settings.count === value} onClick={() => updateSettings({ count: value })}>
                        {value} 只
                      </CompactChoice>
                    ))}
                  </div>
                </div>

                <div className="draw-settings-group">
                  <div className="draw-group-head"><h3>重复规则</h3><span>{duplicateMode?.title}</span></div>
                  <div className="draw-choice-row">
                    {DUPLICATE_MODE_OPTIONS.map((option) => (
                      <CompactChoice
                        key={option.id}
                        active={settings.duplicateMode === option.id}
                        onClick={() => updateSettings({ duplicateMode: option.id })}
                      >
                        {option.title}
                      </CompactChoice>
                    ))}
                  </div>
                  <p className="draw-group-hint">{duplicateMode?.description}</p>
                </div>
              </div>
            ) : null}

            {tab === 'types' ? (
              <div className="draw-settings-grid">
                <div className="draw-settings-group draw-settings-group-wide">
                  <div className="draw-group-head"><h3>属性模式</h3><span>{typeMode?.title}</span></div>
                  <div className="draw-choice-row">
                    {TYPE_MODE_OPTIONS.map((option) => (
                      <CompactChoice
                        key={option.id}
                        active={settings.typeMode === option.id}
                        onClick={() => updateSettings({ typeMode: option.id })}
                      >
                        {option.title}
                      </CompactChoice>
                    ))}
                  </div>
                  <p className="draw-group-hint">{typeMode?.description}</p>
                </div>
                <div className="draw-settings-group draw-settings-group-wide">
                  <div className="draw-group-head">
                    <h3>偏好属性</h3>
                    <span>{selectedTypeLabels.length ? selectedTypeLabels.join('、') : '未选择'}</span>
                  </div>
                  <div className="draw-type-grid">
                    {POKEMON_TYPES.map((type) => {
                      const selected = settings.preferredTypes.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          type="button"
                          className={`draw-type ${selected ? 'is-active' : ''}`.trim()}
                          onClick={() => togglePreferredType(type.id)}
                          aria-pressed={selected}
                          style={{ '--type-color': type.color, '--type-soft': type.soft, '--type-text': type.text }}
                        >
                          <span className="draw-type-dot" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {settings.typeMode === 'weighted' && settings.preferredTypes.length ? (
                  <div className="draw-settings-group draw-settings-group-wide">
                    <div className="draw-group-head"><h3>属性权重</h3><span>1–9 级</span></div>
                    <div className="draw-weight-list">
                      {settings.preferredTypes.map((typeId) => {
                        const type = POKEMON_TYPES.find((item) => item.id === typeId);
                        const weight = settings.typeWeights[typeId] || 1;
                        return (
                          <div className="draw-weight-row" key={typeId}>
                            <span style={{ '--type-color': type.color }}>{type.label}</span>
                            <input
                              type="range"
                              min="1"
                              max="9"
                              step="1"
                              value={weight}
                              onChange={(event) => setTypeWeight(typeId, event.target.value)}
                              style={{ '--weight-color': type.color }}
                              aria-label={`${type.label}属性权重`}
                            />
                            <strong>{weight}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === 'atmosphere' ? (
              <div className="draw-settings-grid">
                <div className="draw-settings-group draw-settings-group-wide">
                  <div className="draw-group-head"><h3>氛围模式</h3><span>软性概率偏好</span></div>
                  <div className="draw-choice-row">
                    {ATMOSPHERE_MODE_OPTIONS.map((option) => (
                      <CompactChoice
                        key={option.id}
                        active={settings.atmosphereMode === option.id}
                        onClick={() => updateSettings({ atmosphereMode: option.id })}
                      >
                        {option.label}
                      </CompactChoice>
                    ))}
                  </div>
                </div>
                {settings.atmosphereMode === 'single' || settings.atmosphereMode === 'multi' ? (
                  <div className="draw-settings-group draw-settings-group-wide">
                    <div className="draw-group-head"><h3>氛围词条</h3><span>{atmosphereSummary.isActive ? atmosphereSummary.labels.join(' + ') : '未选择'}</span></div>
                    <div className="draw-pref-grid">
                      {ATMOSPHERES.map((item) => {
                        const selected = settings.atmospheres.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`draw-pref ${selected ? 'is-active' : ''}`.trim()}
                            style={{ '--pref-color': item.color }}
                            onClick={() => toggleAtmosphere(item.id)}
                            aria-pressed={selected}
                          >
                            <Icon name={item.icon} size={15} />
                            <span>{item.label}</span>
                            {selected ? <Icon name="check" size={12} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {settings.atmosphereMode === 'custom' ? (
                  <div className="draw-settings-group draw-settings-group-wide">
                    <div className="draw-group-head"><h3>自定义氛围</h3><span>最多 3 个</span></div>
                    <form className="draw-custom-form" onSubmit={addCustomAtmosphere}>
                      <input
                        type="text"
                        value={atmosphereCustom}
                        maxLength={20}
                        onChange={(event) => setAtmosphereCustom(event.target.value)}
                        placeholder="例如：夏日海边"
                        aria-label="工作台自定义氛围"
                      />
                      <button type="submit" className="button button-small button-secondary" disabled={!atmosphereCustom.trim() || settings.customAtmospheres.length >= 3}>
                        <Icon name="plus" size={13} />
                        添加
                      </button>
                    </form>
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
                  </div>
                ) : null}
                {settings.atmosphereMode !== 'off' ? (
                  <div className="draw-settings-group">
                    <div className="draw-group-head"><h3>偏好强度</h3><span>{atmosphereSummary.strength.label}</span></div>
                    <div className="draw-choice-row">
                      {ATMOSPHERE_STRENGTH_OPTIONS.map((item) => (
                        <CompactChoice
                          key={item.id}
                          active={settings.atmosphereStrength === item.id}
                          onClick={() => updateSettings({ atmosphereStrength: item.id })}
                        >
                          {item.label}
                        </CompactChoice>
                      ))}
                    </div>
                    <p className="draw-group-hint">未匹配氛围仍保留基础概率。</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === 'image' ? (
              <div className="draw-settings-grid">
                <div className="draw-settings-group draw-settings-group-wide">
                  <div className="draw-group-head"><h3>形象模式</h3><span>与氛围独立叠加</span></div>
                  <div className="draw-choice-row">
                    {IMAGE_PREFERENCE_MODE_OPTIONS.map((option) => (
                      <CompactChoice
                        key={option.id}
                        active={settings.imagePreferenceMode === option.id}
                        onClick={() => updateSettings({ imagePreferenceMode: option.id })}
                      >
                        {option.label}
                      </CompactChoice>
                    ))}
                  </div>
                </div>
                {settings.imagePreferenceMode === 'multi' ? (
                  <div className="draw-settings-group draw-settings-group-wide">
                    <div className="draw-group-head"><h3>形象词条</h3><span>{imagePreferenceSummary.isActive ? imagePreferenceSummary.labels.join(' + ') : '未选择'}</span></div>
                    <div className="draw-image-grid">
                      {IMAGE_PREFERENCES.map((item) => {
                        const selected = settings.imagePreferences.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`draw-image-pref ${selected ? 'is-active' : ''}`.trim()}
                            style={{ '--pref-color': item.color }}
                            onClick={() => toggleImagePreference(item.id)}
                            aria-pressed={selected}
                          >
                            <Icon name={item.icon} size={14} />
                            {item.label}
                            {selected ? <Icon name="check" size={11} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {settings.imagePreferenceMode === 'custom' ? (
                  <div className="draw-settings-group draw-settings-group-wide">
                    <div className="draw-group-head"><h3>自定义形象</h3><span>最多 3 个</span></div>
                    <form className="draw-custom-form" onSubmit={addCustomImagePreference}>
                      <input
                        type="text"
                        value={imageCustom}
                        maxLength={20}
                        onChange={(event) => setImageCustom(event.target.value)}
                        placeholder="例如：毛茸茸的小家伙"
                        aria-label="工作台自定义形象"
                      />
                      <button type="submit" className="button button-small button-secondary" disabled={!imageCustom.trim() || settings.customImagePreferences.length >= 3}>
                        <Icon name="plus" size={13} />
                        添加
                      </button>
                    </form>
                    <div className="tag-list">
                      {settings.customImagePreferences.map((label) => (
                        <span className="appearance-tag" key={label}>
                          {label}
                          <button type="button" onClick={() => removeCustomImagePreference(label)} aria-label={`删除自定义形象${label}`}>
                            <Icon name="close" size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {settings.imagePreferenceMode !== 'off' ? (
                  <div className="draw-settings-group">
                    <div className="draw-group-head"><h3>偏好强度</h3><span>{imagePreferenceSummary.strength.label}</span></div>
                    <div className="draw-choice-row">
                      {IMAGE_PREFERENCE_STRENGTH_OPTIONS.map((item) => (
                        <CompactChoice
                          key={item.id}
                          active={settings.imagePreferenceStrength === item.id}
                          onClick={() => updateSettings({ imagePreferenceStrength: item.id })}
                        >
                          {item.label}
                        </CompactChoice>
                      ))}
                    </div>
                    <p className="draw-group-hint">未匹配形象仍保留基础概率。</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === 'other' ? (
              <div className="draw-settings-grid">
                <div className="draw-settings-group draw-settings-group-wide">
                  <div className="draw-group-head"><h3>进化阶段</h3><span>不选代表不限</span></div>
                  <div className="draw-choice-row">
                    <CompactChoice active={!settings.evolutionStages.length} onClick={() => updateSettings({ evolutionStages: [] })}>不限</CompactChoice>
                    {EVOLUTION_STAGES.map((stage) => (
                      <CompactChoice
                        key={stage.value}
                        active={settings.evolutionStages.includes(stage.value)}
                        onClick={() => updateSettings((previous) => ({
                          evolutionStages: previous.evolutionStages.includes(stage.value)
                            ? previous.evolutionStages.filter((value) => value !== stage.value)
                            : [...previous.evolutionStages, stage.value],
                        }))}
                      >
                        {stage.label}
                      </CompactChoice>
                    ))}
                  </div>
                </div>
                <div className="draw-settings-group draw-settings-group-wide">
                  <div className="draw-group-head"><h3>体型</h3><span>来自 PokeAPI shape</span></div>
                  <div className="draw-shape-grid">
                    <CompactChoice active={!settings.bodyShapes.length} onClick={() => updateSettings({ bodyShapes: [] })}>不限</CompactChoice>
                    {BODY_SHAPES.map((shape) => (
                      <CompactChoice
                        key={shape.id}
                        active={settings.bodyShapes.includes(shape.id)}
                        onClick={() => updateSettings((previous) => ({
                          bodyShapes: previous.bodyShapes.includes(shape.id)
                            ? previous.bodyShapes.filter((value) => value !== shape.id)
                            : [...previous.bodyShapes, shape.id],
                        }))}
                      >
                        {shape.label}
                      </CompactChoice>
                    ))}
                  </div>
                </div>
                <div className="draw-settings-group">
                  <div className="draw-group-head"><h3>传说与幻之</h3><span>硬性排除</span></div>
                  <div className="draw-toggle-list">
                    <div className="draw-toggle-row">
                      <span>包含传说宝可梦</span>
                      <Switch checked={settings.includeLegendary} onChange={(checked) => updateSettings({ includeLegendary: checked })} label="包含传说宝可梦" />
                    </div>
                    <div className="draw-toggle-row">
                      <span>包含幻之宝可梦</span>
                      <Switch checked={settings.includeMythical} onChange={(checked) => updateSettings({ includeMythical: checked })} label="包含幻之宝可梦" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="draw-settings-footer">
            <span><Icon name="database" size={13} /> 设置会自动保存；开始抽取只更新宝可梦，绘画创作请前往绘画灵感工坊。</span>
            <button type="button" className="button button-small button-primary" onClick={startDraw} disabled={!canGenerate}>
              <Icon name="sparkles" size={15} />
              开始抽取
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
