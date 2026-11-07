"use client";

import { useSyncExternalStore } from "react";

/** Jenis input utama perangkat: sentuh (HP/tablet) atau mouse (laptop/desktop). */
export type InputKind = "sentuh" | "mouse";

const QUERY = "(pointer: coarse)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Hook reaktif — ikut berubah bila perangkat beralih mode (mis. laptop 2-in-1). */
export function useInputKind(): InputKind {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(QUERY).matches ? "sentuh" : "mouse"),
    () => "mouse",
  );
}

/** Setelan kontrol kamera per jenis input. */
export const CAMERA_CONTROL_PRESETS: Record<
  InputKind,
  { rotateSpeed: number; zoomSpeed: number; dampingFactor: number; minDistance: number; maxDistance: number }
> = {
  sentuh: { rotateSpeed: 0.95, zoomSpeed: 1.2, dampingFactor: 0.12, minDistance: 3, maxDistance: 10 },
  mouse: { rotateSpeed: 0.6, zoomSpeed: 0.7, dampingFactor: 0.08, minDistance: 2.5, maxDistance: 9 },
};
