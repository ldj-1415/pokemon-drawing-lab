import { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';

export function Switch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? 'is-on' : ''}`.trim()}
      onClick={() => onChange?.(!checked)}
      disabled={disabled}
    >
      <span className="switch-thumb" />
    </button>
  );
}

export function NumberInput({
  value,
  min = 1,
  max = 1025,
  onChange,
  label,
  prefix = '',
  suffix = '',
  className = '',
  disabled = false,
}) {
  const [text, setText] = useState(String(value ?? ''));

  useEffect(() => {
    setText(String(value ?? ''));
  }, [value]);

  const commit = (raw) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setText(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    setText(String(clamped));
    if (clamped !== value) onChange?.(clamped);
  };

  return (
    <label className={`number-input ${className}`.trim()}>
      {label ? <span className="number-input-label">{label}</span> : null}
      <span className="number-input-shell">
        {prefix ? <span className="number-prefix">{prefix}</span> : null}
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={min}
          max={max}
          value={text}
          disabled={disabled}
          aria-label={label}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            if (/^\d+$/.test(raw)) {
              const parsed = Number(raw);
              if (parsed >= min && parsed <= max) onChange?.(parsed);
            }
          }}
          onBlur={() => commit(text)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        {suffix ? <span className="number-suffix">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function IconButton({ icon, label, onClick, active = false, disabled = false, tone = 'default', className = '' }) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? 'is-active' : ''} ${tone === 'danger' ? 'icon-button-danger' : ''} ${className}`.trim()}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
