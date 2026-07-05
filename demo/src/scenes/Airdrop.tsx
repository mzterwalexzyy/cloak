import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "../components/Theme";
import { ConnectedChrome } from "../components/AppChrome";
import { SectionLabel, Subtitle } from "../components/Subtitle";

const RECIPIENTS = [
  { addr: "0x2bC3d4E5f6A7b8C9d0", amount: "500.00", label: "Team — Alice" },
  { addr: "0xF9e8D7c6B5a4C3d2E1", amount: "500.00", label: "Team — Bob" },
  { addr: "0x4A5b6C7d8E9f0A1b2C", amount: "250.00", label: "Advisor" },
];

const SHORT = (addr: string) => addr.slice(0, 6) + "…" + addr.slice(-4);

// Airdrop: frames 0-1050 relative (2:15-2:50 absolute)
export function Airdrop() {
  const frame = useCurrentFrame();

  const pageIn = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Phase 1: Form fill (0-400)
  // Phase 2: Campaign launched (400-1050)
  const launched = frame >= 480;

  // Form typing
  const NAME = "Season 1 Airdrop";
  const nameLen = Math.floor(interpolate(frame, [40, 130], [0, NAME.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typedName = NAME.slice(0, nameLen);

  const recipientsVisible = frame >= 160;
  const visibleRecips = Math.min(
    RECIPIENTS.length,
    Math.floor(interpolate(frame, [160, 280], [0, RECIPIENTS.length + 0.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
  );

  const launchPressed = frame >= 400;

  const getStatus = (i: number) => {
    if (!launched) return "pending";
    const start = 510 + i * 90;
    const done = start + 70;
    if (frame >= done) return "sent";
    if (frame >= start) return "sending";
    return "pending";
  };

  const statusColor = (s: string) =>
    s === "sent" ? C.primary : s === "sending" ? C.warn : C.muted;
  const statusLabel = (s: string) =>
    s === "sent" ? "✓ Sent" : s === "sending" ? "⏳ Encrypting…" : "Pending";

  const sentCount = RECIPIENTS.filter((_, i) => getStatus(i) === "sent").length;

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ConnectedChrome activeNav="Airdrop">
        <div style={{ opacity: pageIn, height: "100%", display: "flex", flexDirection: "column", padding: "24px 32px", gap: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: C.text }}>Airdrop Campaigns</h2>
            <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
              Named campaigns with persistent recipient lists. Privacy-preserving token distribution at scale.
            </p>
          </div>

          {/* Main layout */}
          <div style={{ display: "flex", gap: 20, flex: 1, overflow: "hidden" }}>
            {/* Left: form / campaign detail */}
            <div
              style={{
                flex: 1, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", gap: 16,
              }}
            >
              {!launched ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    New Campaign
                  </div>

                  {/* Name field */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Campaign name</div>
                    <div
                      style={{
                        background: C.surface2, border: `1px solid ${frame >= 40 && frame < 150 ? C.primary : C.border}`,
                        borderRadius: 10, padding: "12px 16px", fontSize: 15, color: typedName ? C.text : C.faint,
                        boxShadow: frame >= 40 && frame < 150 ? `0 0 0 3px rgba(0,217,126,0.08)` : "none",
                      }}
                    >
                      {typedName || "e.g. Season 1 Airdrop"}
                      {frame >= 40 && frame < 150 && (
                        <span style={{ borderRight: `2px solid ${C.primary}`, marginLeft: 1, opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0 }}>&nbsp;</span>
                      )}
                    </div>
                  </div>

                  {/* Token */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Token</div>
                    <div
                      style={{
                        background: "rgba(110,231,183,0.08)", border: `1px solid rgba(110,231,183,0.2)`,
                        borderRadius: 10, padding: "10px 16px",
                        display: "flex", alignItems: "center", gap: 10,
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(110,231,183,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: C.conf }}>cU</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.conf }}>cUSDC</div>
                        <div style={{ fontSize: 11, color: C.muted }}>Confidential USD Coin · ERC-7984</div>
                      </div>
                    </div>
                  </div>

                  {/* Recipients */}
                  {recipientsVisible && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, opacity: interpolate(frame, [160, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Recipients ({visibleRecips})</div>
                      {RECIPIENTS.slice(0, visibleRecips).map((r, i) => (
                        <div
                          key={r.addr}
                          style={{
                            background: C.surface2, border: `1px solid ${C.border}`,
                            borderRadius: 8, padding: "10px 14px",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            opacity: interpolate(frame, [160 + i * 30, 190 + i * 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.label}</div>
                            <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 2 }}>{SHORT(r.addr)}</div>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: C.conf }}>{r.amount} <span style={{ fontSize: 11, color: C.muted }}>cUSDC</span></div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    style={{
                      background: launchPressed
                        ? "rgba(0,217,126,0.2)"
                        : typedName && visibleRecips === RECIPIENTS.length
                        ? `linear-gradient(135deg, ${C.primary}, ${C.primary2})`
                        : C.surface3,
                      color: launchPressed ? C.primary2 : typedName && visibleRecips === RECIPIENTS.length ? "#021a0d" : C.faint,
                      border: "none", borderRadius: 12, padding: "14px",
                      fontWeight: 700, fontSize: 15, marginTop: "auto",
                      transform: `scale(${frame >= 390 && frame < 415 ? 0.97 : 1})`,
                    }}
                  >
                    {launchPressed ? "⏳ Launching campaign…" : "Launch Airdrop"}
                  </button>
                </>
              ) : (
                /* Campaign detail after launch */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Active Campaign</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Season 1 Airdrop</div>
                    </div>
                    <span style={{ background: "rgba(0,217,126,0.1)", border: `1px solid rgba(0,217,126,0.25)`, borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: C.primary }}>● Live</span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 14 }}>
                    {[
                      { label: "Recipients", value: RECIPIENTS.length.toString() },
                      { label: "Total", value: "1,250 cUSDC" },
                      { label: "Sent", value: `${sentCount}/${RECIPIENTS.length}` },
                    ].map((s) => (
                      <div key={s.label} style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px" }}>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: s.label === "Sent" && sentCount === RECIPIENTS.length ? C.primary : C.text, marginTop: 4 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-recipient status */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                    {RECIPIENTS.map((r, i) => {
                      const status = getStatus(i);
                      return (
                        <div
                          key={r.addr}
                          style={{
                            background: status === "sent" ? "rgba(0,217,126,0.04)" : C.surface2,
                            border: `1px solid ${status === "sent" ? "rgba(0,217,126,0.2)" : C.border}`,
                            borderRadius: 10, padding: "12px 16px",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.label}</div>
                            <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 2 }}>{SHORT(r.addr)}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.conf }}>{r.amount} cUSDC</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: statusColor(status), marginTop: 2 }}>{statusLabel(status)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Right: info panel */}
            <div
              style={{
                width: 260, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", gap: 14,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>How it works</div>
              {[
                ["🔒", "FHE-encrypted", "Every recipient's amount is encrypted before the tx is sent"],
                ["⛓", "Fully on-chain", "No backend — contracts handle distribution and tracking"],
                ["📋", "Persistent", "Close the tab, come back — campaigns resume where they left off"],
                ["👁", "Private", "No one on-chain can see who got what or how much"],
              ].map(([icon, title, desc]) => (
                <div key={title as string} style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ConnectedChrome>

      <SectionLabel text="Airdrop Campaigns" frame={0} />
      <Subtitle
        text={
          !launched
            ? "Create a named campaign. Add recipients with allocations. Every amount will be encrypted at send time."
            : sentCount === RECIPIENTS.length
            ? "All recipients received their tokens privately. No one on-chain can see the individual allocations."
            : "Launching — Cloak iterates through every recipient, encrypts and sends. Tracks each one live."
        }
        startFrame={10}
        endFrame={1020}
      />
    </AbsoluteFill>
  );
}
