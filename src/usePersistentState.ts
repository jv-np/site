import { useEffect, useState } from 'react';

/**
 * useState + localStorage. `validate` filters/normalizes parsed JSON;
 * if it returns undefined the fallback is used. Keys are stable so
 * existing user data is never invalidated by a refactor.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  validate: (raw: unknown) => T | undefined,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      const ok = validate(JSON.parse(raw));
      return ok === undefined ? fallback : ok;
    } catch { return fallback; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore quota / privacy mode */ }
  }, [key, value]);

  return [value, setValue];
}
