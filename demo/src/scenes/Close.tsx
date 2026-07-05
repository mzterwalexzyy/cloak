import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../components/Theme";

// Close: frames 0-300 relative (2:50-3:00 absolute)
export function Close() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowPulse = Math.sin(frame * 0.06) * 0.5 + 0.5;

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const line1Opacity = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Opacity = interpolate(frame, [40, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line3Opacity = interpolate(frame, [60, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const linksOpacity = interpolate(frame, [90, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zamaOpacity  = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const FEATURES = ["Wrap", "Decrypt", "Send", "Disperse", "Airdrop"];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Background glow */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(900px 600px at 50% 40%, rgba(0,217,126,${0.07 + glowPulse * 0.03}), transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(600px 400px at 80% 70%, rgba(52,211,153,0.04), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        {/* Lock + Cloak */}
        <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 22,
            background: "rgba(0,217,126,0.1)", border: `1.5px solid rgba(0,217,126,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40,
            boxShadow: `0 0 60px rgba(0,217,126,${0.15 + glowPulse * 0.1})`,
          }}>🔒</div>
          <span style={{ fontSize: 84, fontWeight: 800, color: C.text, letterSpacing: "-0.04em", fontStyle: "italic" }}>Cloak</span>
        </div>

        {/* Feature chips */}
        <div style={{ opacity: line1Opacity, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {FEATURES.map((f, i) => (
            <span
              key={f}
              style={{
                background: "rgba(0,217,126,0.08)", border: `1px solid rgba(0,217,126,0.2)`,
                borderRadius: 999, padding: "8px 22px",
                fontSize: 16, fontWeight: 600, color: C.primary2,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <div style={{ opacity: line2Opacity, fontSize: 24, color: C.muted, lineHeight: 1.5, maxWidth: 700 }}>
          The complete confidential token lifecycle —<br />
          <span style={{ color: C.text }}>built on Zama FHE, live on Sepolia.</span>
        </div>

        {/* URLs */}
        <div style={{ opacity: linksOpacity, display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Live app</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: C.primary }}>cloak.vercel.app</div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>GitHub</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: C.primary }}>github.com/mzterwalexzyy/cloak</div>
          </div>
        </div>

        {/* Zama badge */}
        <div style={{
          opacity: zamaOpacity,
          background: "rgba(0,217,126,0.06)", border: `1px solid rgba(0,217,126,0.15)`,
          borderRadius: 14, padding: "12px 28px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <span style={{ color: C.muted, fontSize: 15 }}>Built for</span>
          <span style={{ color: C.conf, fontWeight: 800, fontSize: 15 }}>Zama Developer Program — Season 3</span>
          <span style={{ color: C.faint, fontSize: 14 }}>· #ZamaDeveloperProgram</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
