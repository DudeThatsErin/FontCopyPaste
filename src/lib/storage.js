import { useEffect, useState } from 'react';

const PREFIX = 'erin-fonts:';

export function read(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

/* State that persists to localStorage under the same keys the old vanilla
 * build used, so existing favorites and settings carry over. */
export function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  useEffect(() => { write(key, value); }, [key, value]);
  return [value, setValue];
}
