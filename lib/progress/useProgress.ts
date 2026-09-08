import { useCallback, useMemo, useSyncExternalStore } from "react";
import { progressStore } from "./store";

export function useProgress() {
  const snapshot = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );

  const completed = useMemo(() => new Set<string>(JSON.parse(snapshot)), [snapshot]);

  const toggle = useCallback((key: string) => progressStore.toggle(key), []);
  const isComplete = useCallback((key: string) => completed.has(key), [completed]);

  return { completed, toggle, isComplete };
}
