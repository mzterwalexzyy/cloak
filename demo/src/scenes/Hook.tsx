import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../components/Theme";
import { Subtitle } from "../components/Subtitle";

// Hook: frames 0-600 (0:00-0:20)
export function Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const taglineOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [30, 55], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const badgesOpacity = interpolate(frame, [55, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const panelOpacity = interpolate(frame, [80, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const panelX = interpolate(frame, [80, 140], [60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Glow pulse
  const glowPulse = Math.sin(frame * 0.04) * 0.5 + 0.5;

  const PAIRS = [
    { sym: "USDC", addr: "0x2f07…128e" },
    { sym: "USDT", addr: "0xA891…44c2" },
    { sym: "WETH", addr: "0x5B3f…9d71" },
    { sym: "BRON", addr: "0xC4a2…f83a" },
    { sym: "ZAMA", addr: "0x9e1D…2b5c" },
    { sym: "tGBP", addr: "0xD7f0…e9c1" },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      {/* Background glow */}
      <div
        style={{
          position: "absolute", top: -200, right: -200,
          width: 800, height: 800, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,217,126,${0.06 + glowPulse * 0.02}), transparent 65%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute", top: 100, left: -300,
          width: 700, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.04), transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Left: Brand */}
      <div
        style={{
          position: "absolute", left: 100, top: "50%",
          transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 24, maxWidth: 560,
        }}
      >
        {/* Lock + Wordmark */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: "flex", alignItems: "center", gap: 20,
          }}
        >
          <div
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: "rgba(0,217,126,0.1)",
              border: `1.5px solid rgba(0,217,126,0.3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
              boxShadow: `0 0 40px rgba(0,217,126,${0.15 + glowPulse * 0.1})`,
            }}
          >🔒</div>
          <span
            style={{
              fontSize: 72, fontWeight: 800, color: C.text,
              letterSpacing: "-0.04em", fontStyle: "italic",
            }}
          >
            Cloak
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontSize: 28, fontWeight: 400, color: C.muted,
            lineHeight: 1.4,
          }}
        >
          Confidential token wrappers<br />
          <span style={{ color: C.text }}>built on Zama FHE.</span>
        </div>

        {/* Badges */}
        <div
          style={{
            opacity: badgesOpacity,
            display: "flex", gap: 12, flexWrap: "wrap",
          }}
        >
          {["Wrap & Unwrap", "Decrypt privately", "Send hidden amounts", "Batch airdrop"].map((b) => (
            <span
              key={b}
              style={{
                background: "rgba(0,217,126,0.08)",
                border: `1px solid rgba(0,217,126,0.2)`,
                borderRadius: 999, padding: "6px 16px",
                fontSize: 14, fontWeight: 600, color: C.primary2,
              }}
            >
              {b}
            </span>
          ))}
        </div>

        {/* Built on Zama */}
        <div
          style={{
            opacity: badgesOpacity,
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(0,217,126,0.05)", border: `1px solid rgba(0,217,126,0.12)`,
            borderRadius: 12, padding: "10px 18px", width: "fit-content",
          }}
        >
          <span style={{ fontSize: 18 }}>🔐</span>
          <span style={{ color: C.muted, fontSize: 14 }}>Built on</span>
          <span style={{ color: C.conf, fontWeight: 700, fontSize: 14 }}>Zama FHE · ERC-7984</span>
          <span style={{ color: C.faint, fontSize: 14, marginLeft: 8 }}>· Ethereum Sepolia</span>
        </div>
      </div>

      {/* Right: App mockup — pairs grid */}
      <div
        style={{
          position: "absolute", right: 80, top: "50%",
          transform: `translateY(-50%) translateX(${panelX}px)`,
          opacity: panelOpacity,
          width: 520,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: `0 40px 80px -20px rgba(0,0,0,0.7), 0 0 60px rgba(0,217,126,0.05)`,
        }}
      >
        {/* Mini topbar */}
        <div
          style={{
            padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(5,11,20,0.8)",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontStyle: "italic" }}>Cloak</span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              background: "rgba(0,217,126,0.08)", border: `1px solid rgba(0,217,126,0.15)`,
              borderRadius: 6, padding: "3px 10px", fontSize: 11, color: C.primary,
            }}
          >
            🟢 Sepolia
          </div>
        </div>
        {/* Search */}
        <div style={{ padding: "14px 20px 10px" }}>
          <div
            style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 14px",
              fontSize: 13, color: C.faint, display: "flex", gap: 8,
            }}
          >
            <span>🔍</span>
            <span>8 pairs loaded from registry</span>
          </div>
        </div>
        {/* Pairs */}
        <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {PAIRS.map((p, i) => {
            const pOpacity = interpolate(frame, [100 + i * 12, 130 + i * 12], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const pY = interpolate(frame, [100 + i * 12, 130 + i * 12], [14, 0], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <div
                key={p.sym}
                style={{
                  opacity: pOpacity, transform: `translateY(${pY}px)`,
                  background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(0,217,126,0.1)", border: `1px solid rgba(0,217,126,0.2)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, color: C.primary,
                    }}
                  >
                    {p.sym.slice(0, 2)}
                  </div>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(110,231,183,0.1)", border: `1px solid rgba(110,231,183,0.2)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, color: C.conf,
                    }}
                  >
                    c{p.sym.slice(0, 1)}
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.sym} → c{p.sym}</div>
                <div style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>{p.addr}</div>
              </div>
            );
          })}
        </div>
      </div>

      <Subtitle
        text="On Ethereum, every token transfer is public. Zama's FHE changes that — Cloak wraps any token into its confidential version."
        startFrame={60}
        endFrame={580}
      />
    </AbsoluteFill>
  );
}
