const STORAGE_KEY = "crackprep:progress:v1";
const EMPTY_SNAPSHOT = "[]";

type Listener = () => void;

let completed: Set<string> | null = null;
let snapshot = EMPTY_SNAPSHOT;
const listeners = new Set<Listener>();

function read(): Set<string> {
  if (completed) return completed;
  completed = new Set();
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) if (typeof item === "string") completed.add(item);
      }
    }
  } catch {
    // Unreadable, blocked, or corrupt storage: start from empty rather than throw.
  }
  snapshot = JSON.stringify([...completed].sort());
  return completed;
}

function commit(): void {
  const set = read();
  snapshot = JSON.stringify([...set].sort());
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, snapshot);
  } catch {
    // Quota or private browsing: keep the in-memory state, lose persistence.
  }
  for (const listener of listeners) listener();
}

export const progressStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** A JSON string so React can compare snapshots by value. */
  getSnapshot(): string {
    read();
    return snapshot;
  },

  /** The server always renders "nothing completed", which stops a hydration flash. */
  getServerSnapshot(): string {
    return EMPTY_SNAPSHOT;
  },

  toggle(key: string): void {
    const set = read();
    if (set.has(key)) set.delete(key);
    else set.add(key);
    commit();
  },

  has(key: string): boolean {
    return read().has(key);
  },

  count(): number {
    return read().size;
  },

  clear(): void {
    completed = new Set();
    commit();
  },

  /** Test-only: drops the cache so the next read re-parses storage. */
  __resetForTests(): void {
    completed = null;
    snapshot = EMPTY_SNAPSHOT;
    listeners.clear();
  },
};

export { STORAGE_KEY };
