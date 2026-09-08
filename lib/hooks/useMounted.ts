import { useSyncExternalStore } from "react";

// Module-level constants so the store identity never changes between renders.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during server render and the first client render, true afterwards.
 *
 * Use this to gate reads of browser-only state (localStorage, matchMedia) so
 * the server HTML and the first client render agree. No effect is involved, so
 * there is no cascading render and no setState-in-effect lint error.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
