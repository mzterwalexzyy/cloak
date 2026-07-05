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
        bottom: 64,
        left: "50%",
        transform: `translateX(-50%) translateY(${y}px)`,
        opacity,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 12,
        padding: "14px 28px",
        maxWidth: 1100,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 22,
        fontWeight: 500,
        color: C.text,
        lineHeight: 1.5,
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
