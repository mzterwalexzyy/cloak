import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "../components/Theme";
import { AppChrome } from "../components/AppChrome";
import { PairCard } from "../components/GlowCard";
import { SectionLabel, Subtitle } from "../components/Subtitle";

// Registry: frames 0-900 relative (0:20-0:50 absolute)
const PAIRS = [
  { symbol: "USDC", name: "USD Coin", address: "0x2f07…128e" },
  { symbol: "USDT", name: "Tether USD", address: "0xA891…44c2" },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x5B3f…9d71" },
  { symbol: "BRON", name: "Bron Token", address: "0xC4a2…f83a" },
  { symbol: "ZAMA", name: "Zama Token", address: "0x9e1D…2b5c" },
  { symbol: "tGBP", name: "Test GBP", address: "0xD7f0…e9c1" },
  { symbol: "XAUt", name: "Tether Gold", address: "0xF221…3c8b" },
  { symbol: "steakcUSDC", name: "Steakhouse cUSDC", address: "0x8Ba1…d09f" },
];

export function Registry() {
  const frame = useCurrentFrame();

  // Typing animation for search box (starts at frame 420)
  const SEARCH = "USDC";
  const typedChars = Math.floor(interpolate(frame, [420, 480], [0, SEARCH.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const typed = SEARCH.slice(0, typedChars);

  // After typing, filter to 1 result then clear back
  const isFiltered = frame >= 480 && frame < 700;
  const isClearing = frame >= 700;
  const clearChars = isClearing
    ? Math.floor(interpolate(frame, [700, 740], [SEARCH.length, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
    : SEARCH.length;
  const displayText = isClearing ? SEARCH.slice(0, clearChars) : typed;

  const filteredPairs = isFiltered ? PAIRS.filter((p) => p.symbol.includes("USDC")) : PAIRS;
  const gridOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const headOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <AppChrome activeNav="Wrap">
        <div style={{ padding: "32px 40px", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ opacity: headOpacity, marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Live Registry
            </div>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
              {filteredPairs.length} pair{filteredPairs.length !== 1 ? "s" : ""} on-chain
              <span style={{ color: C.muted, fontWeight: 400, fontSize: 18, marginLeft: 12 }}>
                — nothing hardcoded
              </span>
            </h2>
          </div>

          {/* Search + filter bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, opacity: headOpacity }}>
            <div
              style={{
                flex: 1, maxWidth: 380, height: 42,
                background: C.surface2, border: `1px solid ${frame >= 420 && frame < 760 ? C.primary : C.border}`,
                borderRadius: 10, display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
                transition: "border-color 0.2s",
                boxShadow: frame >= 420 && frame < 760 ? `0 0 0 3px rgba(0,217,126,0.08)` : "none",
              }}
            >
              <span style={{ color: C.faint, fontSize: 14 }}>🔍</span>
              <span style={{ fontSize: 14, color: displayText ? C.text : C.faint }}>
                {displayText || "Search by name, symbol, address…"}
                {frame >= 420 && frame < 760 && (
                  <span style={{ borderRight: `2px solid ${C.primary}`, marginLeft: 1, opacity: Math.sin(frame * 0.2) > 0 ? 1 : 0 }}>&nbsp;</span>
                )}
              </span>
            </div>
            {/* Segment */}
            <div style={{ display: "flex", gap: 0, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              {["All", "Active", "Revoked"].map((s) => (
                <div
                  key={s}
                  style={{
                    padding: "0 18px", height: 42, display: "flex", alignItems: "center",
                    fontSize: 13, fontWeight: 600,
                    color: s === "All" ? C.text : C.muted,
                    background: s === "All" ? C.surface3 : "transparent",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              opacity: gridOpacity,
            }}
          >
            {filteredPairs.map((p, i) => (
              <PairCard key={p.symbol} symbol={p.symbol} name={p.name} address={p.address} delay={i * 8} />
            ))}
          </div>
        </div>
      </AppChrome>

      <SectionLabel text="Live On-Chain Registry" frame={0} />
      <Subtitle
        text="No wallet needed — Cloak reads every ERC-7984 wrapper pair directly from the Zama registry. 8 pairs live. Nothing hardcoded."
        startFrame={30}
        endFrame={870}
      />
    </AbsoluteFill>
  );
}
