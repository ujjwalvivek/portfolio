// Small persisted settings and a shared event bus. Storage can be unavailable (private modes), so every read has a fallback.

const PREFIX = "v4:";

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Not persisted; the setting still applies for this visit.
  }
}

export type ShellEvents = {
  palette: { name: string };
  wallpaper: { on: boolean };
};

const bus = new EventTarget();

export function emit<K extends keyof ShellEvents>(type: K, detail: ShellEvents[K]): void {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

export function on<K extends keyof ShellEvents>(type: K, fn: (detail: ShellEvents[K]) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<ShellEvents[K]>).detail);
  bus.addEventListener(type, handler);
  return () => bus.removeEventListener(type, handler);
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
