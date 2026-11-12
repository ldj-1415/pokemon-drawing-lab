import { useCallback, useEffect, useRef, useState } from 'react';
import { usePersistentState } from './usePersistentState.js';

const DEFAULT_DURATION = 30 * 60;
const INITIAL = {
  durationSec: DEFAULT_DURATION,
  remainingSec: DEFAULT_DURATION,
  status: 'idle',
  endsAt: null,
  completedAt: null,
};

function normalizeTimer(raw) {
  if (!raw || typeof raw !== 'object') return { ...INITIAL };
  const durationSec = Math.max(60, Math.round(Number(raw.durationSec) || DEFAULT_DURATION));
  let remainingSec = Math.max(0, Math.round(Number(raw.remainingSec) || durationSec));
  let status = ['idle', 'running', 'paused', 'done'].includes(raw.status) ? raw.status : 'idle';
  let endsAt = Number(raw.endsAt) || null;
  let completedAt = raw.completedAt || null;

  if (status === 'running') {
    if (!endsAt) endsAt = Date.now() + remainingSec * 1000;
    const liveRemaining = Math.ceil((endsAt - Date.now()) / 1000);
    if (liveRemaining <= 0) {
      status = 'done';
      remainingSec = 0;
      endsAt = null;
      completedAt = completedAt || new Date().toISOString();
    } else {
      remainingSec = liveRemaining;
    }
  }
  if (status === 'done') remainingSec = 0;
  return { durationSec, remainingSec, status, endsAt, completedAt };
}

export function formatTimer(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':');
}

export function useChallengeTimer({ onFinish } = {}) {
  const [timer, setTimer] = usePersistentState(
    'pdl.challenge.v1',
    { ...INITIAL },
    normalizeTimer,
  );
  const [now, setNow] = useState(() => Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const previousStatus = useRef(timer.status);

  const liveRemaining = timer.status === 'running' && timer.endsAt
    ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
    : timer.remainingSec;

  useEffect(() => {
    if (timer.status !== 'running') return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [timer.status, timer.endsAt]);

  useEffect(() => {
    if (timer.status === 'running' && liveRemaining <= 0) {
      setTimer((current) => ({
        ...current,
        status: 'done',
        remainingSec: 0,
        endsAt: null,
        completedAt: new Date().toISOString(),
      }));
    }
  }, [liveRemaining, timer.status, setTimer]);

  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = timer.status;
    if (timer.status === 'done' && previous === 'running') {
      finishRef.current?.();
    }
  }, [timer.status]);

  const start = useCallback((seconds) => {
    const duration = Math.max(60, Math.round(Number(seconds) || DEFAULT_DURATION));
    setNow(Date.now());
    setTimer({
      durationSec: duration,
      remainingSec: duration,
      status: 'running',
      endsAt: Date.now() + duration * 1000,
      completedAt: null,
    });
  }, [setTimer]);

  const pause = useCallback(() => {
    setTimer((current) => {
      if (current.status !== 'running') return current;
      const remaining = Math.max(0, Math.ceil(((current.endsAt || Date.now()) - Date.now()) / 1000));
      return {
        ...current,
        remainingSec: remaining,
        status: remaining > 0 ? 'paused' : 'done',
        endsAt: null,
        completedAt: remaining > 0 ? null : new Date().toISOString(),
      };
    });
  }, [setTimer]);

  const resume = useCallback(() => {
    setNow(Date.now());
    setTimer((current) => {
      if (current.status !== 'paused') return current;
      const remaining = Math.max(1, current.remainingSec);
      return {
        ...current,
        status: 'running',
        remainingSec: remaining,
        endsAt: Date.now() + remaining * 1000,
      };
    });
  }, [setTimer]);

  const reset = useCallback(() => {
    setTimer((current) => ({
      ...current,
      remainingSec: current.durationSec,
      status: 'idle',
      endsAt: null,
      completedAt: null,
    }));
  }, [setTimer]);

  const selectDuration = useCallback((seconds) => {
    const duration = Math.max(60, Math.round(Number(seconds) || DEFAULT_DURATION));
    setTimer((current) => {
      if (current.status === 'running') {
        return {
          ...current,
          durationSec: duration,
          remainingSec: duration,
          endsAt: Date.now() + duration * 1000,
          completedAt: null,
        };
      }
      return {
        durationSec: duration,
        remainingSec: duration,
        status: 'idle',
        endsAt: null,
        completedAt: null,
      };
    });
  }, [setTimer]);

  return {
    ...timer,
    remainingSec: liveRemaining,
    progress: timer.durationSec ? Math.min(1, Math.max(0, 1 - liveRemaining / timer.durationSec)) : 0,
    display: formatTimer(liveRemaining),
    isRunning: timer.status === 'running',
    isPaused: timer.status === 'paused',
    isDone: timer.status === 'done',
    start,
    pause,
    resume,
    reset,
    selectDuration,
  };
}
