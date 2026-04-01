import { useEffect } from "react";

/**
 * Forces landscape orientation on mobile when `active` is true.
 * Falls back gracefully on unsupported browsers.
 */
export function useLandscape(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const lock = async () => {
      try {
        // @ts-ignore – screen.orientation.lock is not in all TS libs
        await screen.orientation?.lock?.("landscape");
      } catch {
        // Not supported or denied — ignore
      }
    };

    lock();

    return () => {
      try {
        // @ts-ignore
        screen.orientation?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, [active]);
}
