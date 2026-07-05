import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "./Theme";

interface PairCardProps {
  symbol: string;
  name: string;
  address: string;
  delay?: number;
}

function TokenBadge({ symbol, conf }: { symbol: string; conf?: boolean }) {
  const bg = conf ? "rgba(110,231,183,0.12)" : "rgba(0,217,126,0.12)";
  const color = conf ? C.conf : C.primary;
  const initials = symbol.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: 44, height: 44, borderRadius: "50%",
        background: bg, border: `1.5px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT, fontSize: 13, fontWeight: 800, color,
      }}
    >
      {initials}
    </div>
  );
}

export function PairCard({ symbol, name, address, delay = 0 }: PairCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120, mass: 0.8 } });
  const opacity = Math.min(progress, 1);
  const y = interpolate(progress, [0, 1], [28, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: FONT,
      }}
    >
      {/* Badges */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <TokenBadge symbol={symbol} />
        <span style={{ color: C.faint, fontSize: 16, fontWeight: 300 }}>→</span>
        <TokenBadge symbol={"c" + symbol} conf />
      </div>
      {/* Name + symbol */}
      <div>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
          {symbol} <span style={{ color: C.muted, fontWeight: 400 }}>→</span> c{symbol}
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{name}</div>
      </div>
      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${C.border}`, paddingTop: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span
          style={{
            background: "rgba(0,217,126,0.1)", border: `1px solid rgba(0,217,126,0.2)`,
            borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: C.primary,
          }}
        >
          ● Active
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{address}</span>
      </div>
    </div>
  );
}
