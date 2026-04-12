/**
 * usePersistedState
 * A drop-in replacement for useState that automatically persists the value to
 * localStorage under a user-scoped key (`${userId}_${key}`).  When the user
 * is not yet known the value is still persisted under the bare `key`.
 *
 * Usage:
 *   const [view, setView] = usePersistedState('offers_view', 'kanban', bizUser?.id);
 */
import { useState, useCallback } from 'react';

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  userId?: string | null,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = userId ? `${userId}_${key}` : key;

  const [state, setStateRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw(prev => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch { /* quota exceeded or private mode – degrade silently */ }
        return next;
      });
    },
    [storageKey],
  );

  return [state, setState];
}
