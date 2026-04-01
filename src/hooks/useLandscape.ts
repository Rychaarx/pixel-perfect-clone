import { useEffect, useRef } from "react";

/**
 * Forces fullscreen + landscape orientation on mobile when `active` is true.
 * screen.orientation.lock() requires fullscreen mode on most mobile browsers.
 */
export function useLandscape(active: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const el = containerRef.current || document.documentElement;

    const enterFullscreenAndLock = async () => {
      try {
        // Enter fullscreen first — required for orientation lock
        if (!document.fullscreenElement) {
          await el.requestFullscreen?.();
        }
        // Then lock to landscape
        // @ts-ignore
        await screen.orientation?.lock?.("landscape");
      } catch {
        // Not supported or denied — ignore silently
      }
    };

    enterFullscreenAndLock();

    return () => {
      try {
        // @ts-ignore
        screen.orientation?.unlock?.();
      } catch {}
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        }
      } catch {}
    };
  }, [active]);

  return containerRef;
}
