import { useEffect, useRef, useState } from "react";

/**
 * Forces landscape viewing experience on mobile.
 * - Android/Chrome: uses fullscreen + screen.orientation.lock()
 * - iOS/Safari: rotates the container 90° via CSS when in portrait mode
 */
export function useLandscape(active: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cssRotate, setCssRotate] = useState(false);

  useEffect(() => {
    if (!active) {
      setCssRotate(false);
      return;
    }

    let orientationLocked = false;

    const tryNativeLock = async () => {
      try {
        const el = containerRef.current || document.documentElement;
        if (!document.fullscreenElement && el.requestFullscreen) {
          await el.requestFullscreen();
        }
        // @ts-ignore
        await screen.orientation?.lock?.("landscape");
        orientationLocked = true;
      } catch {
        // Native lock not supported (iOS Safari) — use CSS fallback
        orientationLocked = false;
        applyCSS();
      }
    };

    const applyCSS = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setCssRotate(isPortrait);
    };

    const handleResize = () => {
      if (!orientationLocked) {
        applyCSS();
      }
    };

    tryNativeLock();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      setCssRotate(false);
      try {
        // @ts-ignore
        screen.orientation?.unlock?.();
      } catch {}
      try {
        if (document.fullscreenElement) document.exitFullscreen?.();
      } catch {}
    };
  }, [active]);

  return { containerRef, cssRotate };
}
