import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export type Waypoint = {
  x: number;       // px in 1920x1080
  y: number;
  frame: number;   // absolute frame within the scene this waypoint is reached
  click?: boolean; // triggers click animation + zoom
};

interface Props {
  waypoints: Waypoint[];
  totalFrames: number;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function MouseCursor({ waypoints, totalFrames }: Props) {
  const frame = useCurrentFrame();

  // Find the two surrounding waypoints
  let prev = waypoints[0];
  let next = waypoints[0];
  for (let i = 0; i < waypoints.length - 1; i++) {
    if (frame >= waypoints[i].frame && frame <= waypoints[i + 1].frame) {
      prev = waypoints[i];
      next = waypoints[i + 1];
      break;
    }
    if (frame > waypoints[waypoints.length - 1].frame) {
      prev = next = waypoints[waypoints.length - 1];
    }
  }

  const duration = next.frame - prev.frame;
  const elapsed = frame - prev.frame;
  const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
  const te = easeInOut(t);

  const x = prev.x + (next.x - prev.x) * te;
  const y = prev.y + (next.y - prev.y) * te;

  // Click animation: scale down then back up over 20 frames
  const isClickFrame = waypoints.find((w) => w.click && Math.abs(frame - w.frame) < 20);
  const clickProgress = isClickFrame
    ? interpolate(frame - isClickFrame.frame, [0, 8, 20], [1, 0.7, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-4px, -2px)",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <svg
        width={28 * clickProgress}
        height={28 * clickProgress}
        viewBox="0 0 28 28"
        fill="none"
        style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}
      >
        {/* Arrow cursor */}
        <path
          d="M4 2L4 22L9.5 16.5L14 25L17 23.5L12.5 15H20L4 2Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Click ripple */}
      {isClickFrame && (
        <div
          style={{
            position: "absolute",
            top: -20,
            left: -20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(0,217,126,0.8)",
            opacity: interpolate(frame - isClickFrame.frame, [0, 20], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `scale(${interpolate(frame - isClickFrame.frame, [0, 20], [0.4, 1.8], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
          }}
        />
      )}
    </div>
  );
}
