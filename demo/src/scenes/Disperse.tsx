import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "../components/Theme";
import { ConnectedChrome } from "../components/AppChrome";
import { SectionLabel, Subtitle } from "../components/Subtitle";

const RECIPIENTS = [
  { addr: "0x1aB2c3D4e5F6a7B8c9D0e1F2a3b4C5d6E7F8a9B0", amount: "250.00" },
  { addr: "0x9F8e7D6c5B4a3C2d1E0f9A8b7C6d5E4f3A2b1C0d", amount: "180.00" },
  { addr: "0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d", amount: "320.00" },
  { addr: "0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", amount: "90.00" },
  { addr: "0x5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f", amount: "160.00" },
];
const SHORT = (addr: string) => addr.slice(0, 6) + "…" + addr.slice(-4);

// Disperse: frames 0-900 relative (1:45-2:15 absolute)
export function Disperse() {
  const frame = useCurrentFrame();

  const pageIn = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Paste animation: recipients appear one by one 60-200
  const visibleRows = Math.min(
    RECIPIENTS.length,
    Math.floor(interpolate(frame, [60, 220], [0, RECIPIENTS.length + 0.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
  );

  // Disperse pressed: frame 380
  const dispersePressed = frame >= 380;

  // Status updates: each row updates sequentially starting at frame 430
  const getStatus = (i: number) => {
    if (!dispersePressed) return "queued";
    const sendStart = 430 + i * 60;
    const sendDone = sendStart + 50;
    if (frame >= sendDone) return "sent";
    if (frame >= sendStart) return "sending";
    return "queued";
  };

  const statusColor = (s: string) => s === "sent" ? C.primary : s === "sending" ? C.warn : C.faint;
  const statusLabel = (s: string) => s === "sent" ? "✓ Sent" : s === "sending" ? "⏳ Sending…" : "Queued";

  const totalSent = RECIPIENTS.filter((_, i) => getStatus(i) === "sent").length;

  // Paste textarea content
  const pasteLines = RECIPIENTS.slice(0, visibleRows)
    .map((r) => `${SHORT(r.addr)} ${r.amount}`)
    .join("\n");

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ConnectedChrome activeNav="Disperse">
        <div style={{ opacity: pageIn, height: "100%", display: "flex", flexDirection: "column", padding: "24px 32px", gap: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: C.text }}>Disperse</h2>
            <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
              Send confidential tokens to multiple addresses in one session. Every amount encrypted.
            </p>
          </div>

          {/* Main layout */}
          <div style={{ display: "flex", gap: 20, flex: 1, overflow: "hidden" }}>
            {/* Left: input */}
            <div
              style={{
                flex: 1, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", gap: 14,
              }}
            >
              {/* Token selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Token:</div>
                <div
                  style={{
                    background: "rgba(110,231,183,0.08)", border: `1px solid rgba(110,231,183,0.2)`,
                    borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(110,231,183,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: C.conf }}>cU</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.conf }}>cUSDC</span>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 13, color: C.muted }}>
                  Balance: <span style={{ color: C.conf, fontWeight: 700 }}>100.00 cUSDC</span>
                </div>
              </div>

              {/* Textarea */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Recipients (address amount)</div>
                <div
                  style={{
                    flex: 1, background: C.surface2, border: `1px solid ${frame >= 60 && frame < 280 ? C.primary : C.border}`,
                    borderRadius: 10, padding: "14px", fontFamily: MONO, fontSize: 12,
                    color: C.text, lineHeight: 1.8, whiteSpace: "pre", overflow: "hidden",
                    boxShadow: frame >= 60 && frame < 280 ? `0 0 0 3px rgba(0,217,126,0.08)` : "none",
                  }}
                >
                  {pasteLines}
                  {frame >= 60 && frame < 280 && (
                    <span style={{ borderRight: `2px solid ${C.primary}`, opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0 }}>&nbsp;</span>
                  )}
                </div>
              </div>

              {/* Disperse button */}
              <button
                style={{
                  background: dispersePressed
                    ? totalSent === RECIPIENTS.length
                      ? "rgba(0,217,126,0.1)"
                      : "rgba(0,217,126,0.2)"
                    : `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                  color: dispersePressed ? (totalSent === RECIPIENTS.length ? C.primary : C.primary2) : "#021a0d",
                  border: "none", borderRadius: 12, padding: "14px",
                  fontWeight: 700, fontSize: 15,
                  transform: `scale(${frame >= 370 && frame < 390 ? 0.97 : 1})`,
                }}
              >
                {totalSent === RECIPIENTS.length
                  ? `✓ All ${RECIPIENTS.length} transfers complete`
                  : dispersePressed
                  ? `⏳ Sending… (${totalSent}/${RECIPIENTS.length})`
                  : `Disperse to ${visibleRows} recipients`}
              </button>
            </div>

            {/* Right: live preview table */}
            <div
              style={{
                flex: 1.2, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column",
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
                  background: C.surface2,
                }}
              >
                {["Address", "Amount", "Token", "Status"].map((h) => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                {RECIPIENTS.map((r, i) => {
                  const rowVisible = i < visibleRows;
                  const rowOpacity = interpolate(frame, [60 + i * 28, 90 + i * 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  const status = getStatus(i);
                  return (
                    <div
                      key={r.addr}
                      style={{
                        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
                        opacity: rowVisible ? rowOpacity : 0,
                        background: status === "sent" ? "rgba(0,217,126,0.03)" : "transparent",
                      }}
                    >
                      <span style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>{SHORT(r.addr)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.amount}</span>
                      <span style={{ fontSize: 12, color: C.conf, fontWeight: 600 }}>cUSDC</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(status) }}>
                        {statusLabel(status)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {visibleRows > 0 && (
                <div
                  style={{
                    padding: "12px 20px", borderTop: `1px solid ${C.border}`,
                    display: "flex", justifyContent: "space-between",
                    background: C.surface2, fontSize: 13,
                  }}
                >
                  <span style={{ color: C.muted }}>{visibleRows} recipients</span>
                  <span style={{ color: C.text, fontWeight: 700 }}>
                    Total: {RECIPIENTS.slice(0, visibleRows).reduce((s, r) => s + parseFloat(r.amount), 0).toFixed(2)} cUSDC
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </ConnectedChrome>

      <SectionLabel text="Batch Disperse" frame={0} />
      <Subtitle
        text={
          frame < 280
            ? "Paste a list — address and amount per line. Cloak validates every recipient in real time."
            : frame < 430
            ? "Preview table ready. Every amount will be FHE-encrypted before it leaves your browser."
            : totalSent === RECIPIENTS.length
            ? `All ${RECIPIENTS.length} transfers complete. Each recipient's amount stays hidden on-chain.`
            : "Cloak sends each transfer sequentially — queued → encrypting → confirmed. Fully trackable."
        }
        startFrame={10}
        endFrame={870}
      />
    </AbsoluteFill>
  );
}
