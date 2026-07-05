import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Waypoint } from "./MouseCursor";

interface Props {
  children: React.ReactNode;
  waypoints: Waypoint[];
  /**
   * Frames the mouse must be stationary before zoom triggers.
   * Default: 60 (2 seconds at 30fps)
   */
  hoverThreshold?: number;
}

/** Returns the x,y mouse position and active zoom events (hover pauses + clicks). */
function useZoomEvents(waypoints: Waypoint[], hoverThreshold: number) {
  const frame = useCurrentFrame();

  // Build zoom events: every click waypoint, and every hover pause (where two
  // consecutive waypoints have the same x,y or gap >= hoverThreshold frames).
  const events: { frame: number; x: number; y: number }[] = [];

  for (let i = 0; i < waypoints.length; i++) {
    const w = waypoints[i];
    if (w.click) {
      events.push({ frame: w.frame, x: w.x, y: w.y });
      continue;
    }
    // Hover pause: this waypoint and the next have a gap >= hoverThreshold
    const next = waypoints[i + 1];
    if (next && next.frame - w.frame >= hoverThreshold) {
      events.push({ frame: w.frame + Math.floor(hoverThreshold / 2), x: w.x, y: w.y });
    }
  }

  return events;
}

export function ZoomWrapper({ children, waypoints, hoverThreshold = 60 }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const events = useZoomEvents(waypoints, hoverThreshold);

  // Find the most recent event within the zoom window (±30 frames)
  const ZOOM_WINDOW = 45; // frames
  const activeEvent = [...events]
    .reverse()
    .find((e) => frame >= e.frame && frame <= e.frame + ZOOM_WINDOW);

  let scale = 1;
  let originX = 960;
  let originY = 540;

  if (activeEvent) {
    const t = frame - activeEvent.frame;
    // 0-15: zoom in, 15-30: hold, 30-45: zoom out
    const zoomIn = interpolate(t, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const zoomOut = interpolate(t, [30, 45], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const zoomAmount = t < 30 ? zoomIn : zoomOut;
    scale = 1 + zoomAmount * 0.18; // zoom to 118%
    originX = activeEvent.x;
    originY = activeEvent.y;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: `${originX}px ${originY}px`,
          transition: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
