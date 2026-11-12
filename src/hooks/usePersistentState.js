import { useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '../utils/storage.js';

/**
 * localStorage-backed React state with a safe in-memory fallback.
 * A `normalize` function can repair malformed or older persisted data.
 */
export function usePersistentState(key, initialValue, normalize) {
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;

  const getInitial = () => {
    const fallback = typeof initialValue === 'function' ? initialValue() : initialValue;
    const stored = readJSON(key, fallback);
    return normalizeRef.current ? normalizeRef.current(stored) : stored;
  };

  const [state, setState] = useState(getInitial);
  const [storageOk, setStorageOk] = useState(true);
  const isFirstWrite = useRef(true);

  useEffect(() => {
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    const ok = writeJSON(key, state);
    if (!ok) setStorageOk(false);
  }, [key, state]);

  return [state, setState, { storageOk }];
}
