import { useEffect, useState } from "react";

/** useState com localStorage (chave vdp:tool:<slug>) dentro de try/catch; SSR-safe. */
export function usePersisted<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {
      /* modo privado ou storage cheio */
    }
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignora */
    }
  }, [key, state, loaded]);
  return [state, setState];
}
