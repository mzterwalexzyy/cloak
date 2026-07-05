import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "./Theme";

interface Props {
  text: string;
  startFrame: number;
  endFrame: number;
}

export function Subtitle({ text, startFrame, endFrame }: Props) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 12, endFrame - 12, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [startFrame, startFrame + 12], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        transform: `translateY(${y}px)`,
        opacity,
        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)",
        padding: "48px 120px 36px",
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 24,
        fontWeight: 500,
        color: "#ffffff",
        lineHeight: 1.55,
        letterSpacing: "-0.01em",
        textShadow: "0 1px 8px rgba(0,0,0,0.8)",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

export function SectionLabel({ text, frame: startFrame }: { text: string; frame: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, [startFrame, startFrame + 20], [-24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 80,
        opacity,
        transform: `translateX(${x}px)`,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 700,
        color: C.primary,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}
