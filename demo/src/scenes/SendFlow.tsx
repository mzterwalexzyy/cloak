import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../components/Theme";
import { ConnectedChrome } from "../components/AppChrome";
import { SectionLabel, Subtitle } from "../components/Subtitle";

// SendFlow: frames 0-750 relative (1:20-1:45 absolute)
const RECIPIENT = "0x9aF3b8E2c761D4dF0527EA9e2d69Af0c89Bb1234";
const SHORT_RECIP = "0x9aF3…1234";

export function SendFlow() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Type recipient address (frame 60-160)
  const typedLen = Math.floor(interpolate(frame, [60, 160], [0, RECIPIENT.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const typedAddr = RECIPIENT.slice(0, typedLen);

  // Amount: select 50% (frame 200)
  const amtVisible = frame >= 200;
  const amount = "50.00";

  // Send pressed (frame 300)
  const sendPressed = frame >= 300;
  const txConfirmed = frame >= 420;

  // Etherscan view (frame 480)
  const etherscanVisible = frame >= 480;
  const etherscanIn = interpolate(frame, [480, 520], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const etherscanY = interpolate(frame, [480, 520], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const panelIn = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const panelY = interpolate(frame, [0, 25], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ConnectedChrome activeNav="Wrap">
        <div
          style={{
            display: "flex", height: "100%",
            opacity: panelIn, transform: `translateY(${panelY}px)`,
          }}
        >
          {/* Left: send console */}
          <div style={{ flex: 1.2, padding: "28px 32px", display: "flex", flexDirection: "column" }}>
            {/* Balance strip */}
            <div
              style={{
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: "14px 14px 0 0", padding: "16px 24px",
                display: "flex", gap: 32,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>USDC Balance</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 4 }}>400.00 <span style={{ color: C.muted, fontSize: 14 }}>USDC</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>cUSDC Balance</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.conf, marginTop: 4 }}>
                  {txConfirmed ? "50.00" : "100.00"} <span style={{ color: C.muted, fontSize: 14 }}>cUSDC</span>
                </div>
              </div>
            </div>

            {/* Tabs — Send active */}
            <div style={{ background: C.surface, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, display: "flex", borderBottom: `1px solid ${C.border}` }}>
              {["Wrap", "Unwrap", "Decrypt", "Send", "Faucet"].map((t) => (
                <div
                  key={t}
                  style={{
                    padding: "10px 20px", fontSize: 14, fontWeight: 600,
                    color: t === "Send" ? C.text : C.muted,
                    borderBottom: `2px solid ${t === "Send" ? C.primary : "transparent"}`,
                  }}
                >{t}</div>
              ))}
            </div>

            {/* Send body */}
            <div
              style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderTop: "none", borderRadius: "0 0 14px 14px",
                padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: 16,
              }}
            >
              <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
                Send cUSDC confidentially. The recipient address is visible on-chain; <strong style={{ color: C.text }}>the amount is not.</strong>
              </p>

              {/* Recipient input */}
              <div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Recipient address</div>
                <div
                  style={{
                    background: C.surface2, border: `1px solid ${frame >= 60 && frame < 200 ? C.primary : C.border}`,
                    borderRadius: 10, padding: "12px 16px", fontFamily: MONO, fontSize: 14,
                    color: typedAddr ? C.text : C.faint,
                    boxShadow: frame >= 60 && frame < 200 ? `0 0 0 3px rgba(0,217,126,0.08)` : "none",
                  }}
                >
                  {typedAddr || "Recipient address (0x…)"}
                  {frame >= 60 && frame < 200 && (
                    <span style={{ borderRight: `2px solid ${C.primary}`, marginLeft: 1, opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0 }}>&nbsp;</span>
                  )}
                </div>
              </div>

              {/* Amount field */}
              {amtVisible && (
                <div
                  style={{
                    opacity: interpolate(frame, [200, 220], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  }}
                >
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Amount</div>
                  <div
                    style={{
                      background: C.surface2, border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: "14px 18px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div style={{ fontSize: 36, fontWeight: 950, color: C.text }}>{amount}</div>
                    <div style={{ background: "rgba(110,231,183,0.1)", border: `1px solid rgba(110,231,183,0.2)`, borderRadius: 8, padding: "6px 14px", fontSize: 14, fontWeight: 700, color: C.conf }}>
                      cUSDC
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {["25%", "50%", "75%", "Max"].map((q) => (
                      <div
                        key={q}
                        style={{
                          flex: 1, padding: "8px 0", textAlign: "center",
                          background: q === "50%" ? "rgba(0,217,126,0.1)" : C.surface3,
                          border: `1px solid ${q === "50%" ? "rgba(0,217,126,0.3)" : C.border}`,
                          borderRadius: 8, fontSize: 13, fontWeight: 600,
                          color: q === "50%" ? C.primary : C.muted,
                        }}
                      >
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Send button */}
              {amtVisible && (
                <button
                  style={{
                    background: txConfirmed
                      ? "rgba(0,217,126,0.1)"
                      : sendPressed
                      ? "rgba(0,217,126,0.2)"
                      : `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                    color: sendPressed && !txConfirmed ? C.primary2 : txConfirmed ? C.primary : "#021a0d",
                    border: "none", borderRadius: 12, padding: "14px",
                    fontWeight: 700, fontSize: 16,
                    opacity: interpolate(frame, [200, 220], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  }}
                >
                  {txConfirmed ? "✓ Sent 50 cUSDC confidentially" : sendPressed ? "⏳ Encrypting & sending…" : "Send confidentially"}
                </button>
              )}

              {txConfirmed && (
                <div style={{ fontSize: 13, color: C.primary, display: "flex", alignItems: "center", gap: 8 }}>
                  ✓ Tx confirmed · <span style={{ fontFamily: MONO, color: C.muted }}>0x7e2c…9a44 ↗</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Etherscan calldata */}
          {etherscanVisible && (
            <div
              style={{
                width: 320, margin: "28px 28px 28px 0",
                opacity: etherscanIn, transform: `translateY(${etherscanY}px)`,
                display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              <div
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: "18px 20px",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                  Etherscan · Sepolia
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["From", SHORT_RECIP.replace("9aF3", "71Be").replace("1234", "3cF4")],
                    ["To", SHORT_RECIP],
                    ["Value", "0 ETH"],
                    ["Status", "✓ Success"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: C.muted }}>{k}</span>
                      <span style={{ fontFamily: MONO, color: k === "Status" ? C.primary : C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calldata box */}
              <div
                style={{
                  background: C.surface, border: `1px solid rgba(248,113,113,0.15)`,
                  borderRadius: 14, padding: "18px 20px",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: C.bad, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Input data (amount = ciphertext)
                </div>
                <div
                  style={{
                    fontFamily: MONO, fontSize: 10, color: C.faint,
                    background: C.surface2, borderRadius: 8, padding: "10px",
                    wordBreak: "break-all", lineHeight: 1.5,
                  }}
                >
                  0x9a8b3c4d<span style={{ color: C.conf }}>4f3e2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5...</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: C.bad, fontWeight: 600 }}>
                  ⚠ Amount is FHE-encrypted — unreadable on-chain
                </div>
              </div>
            </div>
          )}
        </div>
      </ConnectedChrome>

      <SectionLabel text="Confidential Send" frame={0} />
      <Subtitle
        text={
          frame < 300
            ? "Pick a recipient, enter an amount. The value is FHE-encrypted before it leaves your browser."
            : frame < 480
            ? "Sending 50 cUSDC. The transaction is confirmed on Sepolia."
            : "On Etherscan: sender, recipient, timestamp are visible — but the amount is pure ciphertext. No one can read it."
        }
        startFrame={10}
        endFrame={720}
      />
    </AbsoluteFill>
  );
}
