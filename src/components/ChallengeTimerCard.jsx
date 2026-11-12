import { useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { formatTimer } from '../hooks/useChallengeTimer.js';
import { Icon } from './Icon.jsx';

const PRESETS = [
  { seconds: 30 * 60, label: '30 分钟' },
  { seconds: 60 * 60, label: '1 小时' },
  { seconds: 120 * 60, label: '2 小时' },
];

const STATUS_TEXT = {
  idle: '准备开始',
  running: '绘画进行中',
  paused: '计时已暂停',
  done: '挑战完成',
};

function durationLabel(seconds) {
  if (seconds % 3600 === 0) return `${seconds / 3600} 小时挑战`;
  return `${Math.round(seconds / 60)} 分钟挑战`;
}

export function ChallengeTimerCard() {
  const { timer, notify } = useLab();
  const [customMinutes, setCustomMinutes] = useState('45');

  const handleCustomStart = (event) => {
    event.preventDefault();
    const minutes = Number(customMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600) {
      notify('自定义时间需在 1–600 分钟之间。', 'warning');
      return;
    }
    timer.start(minutes * 60);
  };

  const primaryAction = () => {
    if (timer.status === 'running') timer.pause();
    else if (timer.status === 'paused') timer.resume();
    else timer.start(timer.durationSec);
  };

  const primaryLabel = timer.status === 'running'
    ? '暂停计时'
    : timer.status === 'paused'
      ? '继续计时'
      : timer.status === 'done'
        ? '再挑战一次'
        : '开始计时';

  const primaryIcon = timer.status === 'running'
    ? 'pause'
    : timer.status === 'paused'
      ? 'play'
      : 'play';

  const timerAngle = Math.round(Math.min(1, Math.max(0, timer.progress)) * 360);

  return (
    <section className="panel timer-card" aria-labelledby="timer-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">DRAWING CHALLENGE</span>
          <h2 id="timer-title">绘画挑战</h2>
        </div>
        <span className={`timer-state timer-state-${timer.status}`}>
          <span className="timer-state-dot" />
          {STATUS_TEXT[timer.status]}
        </span>
      </div>

      <div
        className={`timer-ring timer-ring-${timer.status}`}
        style={{ '--timer-angle': `${timerAngle}deg` }}
        role="timer"
        aria-live="off"
        aria-label={`剩余时间 ${timer.display}`}
      >
        <div className="timer-ring-inner">
          <span className="timer-caption">{timer.status === 'done' ? 'TIME IS UP' : 'TIME LEFT'}</span>
          <strong>{timer.display}</strong>
          <small>{timer.isDone ? '挑战时间结束' : durationLabel(timer.durationSec)}</small>
        </div>
      </div>

      {timer.isDone ? (
        <div className="timer-done-note">
          <Icon name="sparkles" size={18} />
          <div>
            <strong>时间到！</strong>
            <p>停下来看看画面，别忘了把喜欢的组合收藏起来。</p>
          </div>
        </div>
      ) : null}

      <div className="timer-presets" aria-label="选择挑战时长">
        {PRESETS.map((preset) => (
          <button
            key={preset.seconds}
            type="button"
            className={`timer-preset ${timer.durationSec === preset.seconds ? 'is-active' : ''}`.trim()}
            onClick={() => timer.selectDuration(preset.seconds)}
            disabled={timer.isRunning || timer.isPaused}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form className="custom-timer" onSubmit={handleCustomStart}>
        <label htmlFor="custom-timer-minutes">自定义</label>
        <div className="custom-timer-field">
          <input
            id="custom-timer-minutes"
            type="number"
            min="1"
            max="600"
            inputMode="numeric"
            value={customMinutes}
            onChange={(event) => setCustomMinutes(event.target.value)}
            disabled={timer.isRunning || timer.isPaused}
          />
          <span>分钟</span>
          <button
            type="submit"
            className="button button-small button-ghost"
            disabled={timer.isRunning || timer.isPaused}
          >
            设定并开始
          </button>
        </div>
      </form>

      <div className="timer-actions">
        <button type="button" className="button button-primary button-block" onClick={primaryAction}>
          <Icon name={primaryIcon} size={17} />
          {primaryLabel}
        </button>
        <button
          type="button"
          className="button button-ghost button-block"
          onClick={timer.reset}
          disabled={timer.status === 'idle'}
        >
          <Icon name="reset" size={16} />
          重置计时
        </button>
      </div>

      <p className="timer-footnote">
        <Icon name="info" size={13} />
        计时状态保存在本地，刷新页面后仍会继续。
      </p>
      {timer.status === 'paused' ? (
        <p className="sr-only">剩余时间 {formatTimer(timer.remainingSec)}</p>
      ) : null}
    </section>
  );
}
