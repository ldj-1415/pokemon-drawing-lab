import { Icon } from './Icon.jsx';

function ColorRoleCard({ role, onCopy }) {
  return (
    <button
      type="button"
      className="color-role-card"
      onClick={() => onCopy(role.hex)}
      title={`点击复制 ${role.hex}`}
      style={{ '--swatch-color': role.hex }}
    >
      <span className="color-role-swatch" />
      <span className="color-role-copy">
        <span>{role.label}</span>
        <strong>{role.hex}</strong>
      </span>
      <span className="color-role-ratio">{role.ratio}%</span>
    </button>
  );
}

export function WorkbenchColorReference({
  colorReference,
  colorStale,
  onReroll,
  onToggleLock,
  onCopyAll,
  onCopyHex,
}) {
  const value = colorReference?.value;
  const roles = value ? [value.main, value.secondary, value.accent] : [];
  return (
    <section className="panel color-reference-panel" aria-labelledby="workbench-color-title">
      <div className="section-heading color-reference-heading">
        <div className="section-title-wrap">
          <span className="step-number">04</span>
          <div>
            <span className="eyebrow">COLOR PALETTE</span>
            <h2 id="workbench-color-title">配色参考</h2>
            <p className="color-reference-subtitle">根据本轮宝可梦与绘画灵感生成主色、辅助色和点缀色。</p>
          </div>
        </div>
        <div className="section-heading-actions color-reference-actions">
          {value ? <span className="soft-count">{value.ratios.map((ratio) => `${ratio}%`).join(' / ')}</span> : null}
          <button
            type="button"
            className={`icon-button ${colorReference?.locked ? 'is-active' : ''}`.trim()}
            onClick={onToggleLock}
            disabled={!value}
            aria-label={colorReference?.locked ? '解除锁定配色参考' : '锁定配色参考'}
            title={colorReference?.locked ? '解除锁定' : '锁定配色'}
          >
            <Icon name={colorReference?.locked ? 'lock' : 'unlock'} size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onReroll}
            disabled={!value || colorReference?.locked}
            aria-label="重抽配色参考"
            title={colorReference?.locked ? '请先解除锁定' : '只重抽配色参考'}
          >
            <Icon name="dice" size={16} />
          </button>
          <button
            type="button"
            className="button button-small button-secondary"
            onClick={onCopyAll}
            disabled={!value}
          >
            <Icon name="copy" size={13} />
            复制色号
          </button>
        </div>
      </div>

      {colorStale ? (
        <div className="color-stale">
          <span><Icon name="refresh" size={12} /> 当前配色与工作台宝可梦来源不同，可能来自单只重抽或工坊随机 / 自定义。</span>
          <button type="button" className="text-link" onClick={onReroll}>
            更新配色
            <Icon name="arrow-right" size={12} />
          </button>
        </div>
      ) : null}

      {value ? (
        <>
          <div className="color-proportion-bar" aria-label={`色彩比例 ${value.ratios.join(' / ')}`}>
            {roles.map((role) => (
              <span
                key={role.label}
                style={{ '--swatch-color': role.hex, flexGrow: role.ratio }}
                title={`${role.label} ${role.hex} ${role.ratio}%`}
              />
            ))}
          </div>
          <div className="color-role-grid">
            {roles.map((role) => (
              <ColorRoleCard key={role.label} role={role} onCopy={onCopyHex} />
            ))}
          </div>
          <div className="color-reference-meta">
            <div>
              <strong>{value.name}</strong>
              <p>{value.description}</p>
            </div>
            <div className="color-extra">
              <span>扩展色</span>
              {value.support?.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className="color-extra-chip"
                  onClick={() => onCopyHex(hex)}
                  title={`复制 ${hex}`}
                  style={{ '--swatch-color': hex }}
                >
                  <i />
                  {hex}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="wi-empty">
          <span className="wi-empty-icon"><Icon name="palette" size={23} /></span>
          <div>
            <strong>开始抽取后生成配色</strong>
            <p>配色会结合本轮宝可梦、主题和光影自动生成，不会使用固定色卡。</p>
          </div>
        </div>
      )}
    </section>
  );
}
