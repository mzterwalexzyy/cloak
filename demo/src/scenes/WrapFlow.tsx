import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../components/Theme";
import { ConnectedChrome } from "../components/AppChrome";
import { SectionLabel, Subtitle } from "../components/Subtitle";

// WrapFlow: frames 0-900 relative (0:50-1:20 absolute)
export function WrapFlow() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Faucet (0-360) — mint USDC
  // Phase 2: Wrap console (360-900) — wrap 100, decrypt
  const phase2 = frame >= 360;

  // Faucet phase
  const faucetOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const faucetExit = interpolate(frame, [330, 360], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const faucetY = interpolate(frame, [330, 360], [0, -20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Balance before/after mint
  const mintDone = frame >= 200;
  const usdcBal = mintDone ? "500.00" : "0.00";
  const mintBtnScale = spring({ frame: frame - 140, fps, config: { damping: 12, stiffness: 200 } });

  // Wrap phase
  const wrapIn = interpolate(frame, [360, 400], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wrapY = interpolate(frame, [360, 400], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Wrap amount typing (frame 400-450)
  const wrapAmt = Math.floor(interpolate(frame, [400, 450], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  // Wrap button press (frame 500)
  const wrapBtnPress = spring({ frame: frame - 500, fps, config: { damping: 12, stiffness: 300 } });

  // TX confirmed (frame 570)
  const txConfirmed = frame >= 570;
  const publicBal = txConfirmed ? "400.00" : "500.00";
  const confBal = txConfirmed ? "100.00" : "0.00";

  // Decrypt (frame 650)
  const decryptActive = frame >= 650;
  const decryptDone = frame >= 780;
  const decryptBtnScale = spring({ frame: frame - 650, fps, config: { damping: 12, stiffness: 200 } });

  const TAB_STYLE = (active: boolean) => ({
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    color: active ? C.text : C.muted,
    borderBottom: `2px solid ${active ? C.primary : "transparent"}`,
    background: "transparent", border: "none",
  });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ConnectedChrome activeNav={phase2 ? "Wrap" : "Faucet"}>
        {/* FAUCET PHASE */}
        {!phase2 && (
          <div
            style={{
              opacity: faucetOpacity * faucetExit,
              transform: `translateY(${faucetY}px)`,
              padding: "32px 40px",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 800, color: C.text }}>Test token faucet</h2>
            <p style={{ margin: "0 0 28px", color: C.muted, fontSize: 15 }}>Mint test tokens so you can wrap them.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, maxWidth: 800 }}>
              {[
                { sym: "USDC", name: "USD Coin", amount: "1,000" },
                { sym: "USDT", name: "Tether USD", amount: "1,000" },
                { sym: "WETH", name: "Wrapped Ether", amount: "1,000" },
              ].map((t, i) => {
                const isMinting = i === 0 && frame >= 140 && frame < 200;
                const isMinted = i === 0 && frame >= 200;
                return (
                  <div
                    key={t.sym}
                    style={{
                      background: `linear-gradient(145deg, ${C.surface}, ${C.surface2})`,
                      border: `1px solid ${i === 0 && isMinted ? "rgba(0,217,126,0.3)" : C.border}`,
                      borderRadius: 16, padding: "22px 20px",
                      display: "flex", flexDirection: "column", gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: "rgba(0,217,126,0.1)", border: `1px solid rgba(0,217,126,0.2)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: C.primary,
                        }}
                      >
                        {t.sym.slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{t.sym}</div>
                        <div style={{ color: C.muted, fontSize: 11 }}>{t.name}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 950, color: C.text }}>
                      {i === 0 && isMinted ? "500" : t.amount}
                      <span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>.00</span>
                    </div>
                    <button
                      style={{
                        background: isMinting
                          ? "rgba(0,217,126,0.15)"
                          : isMinted && i === 0
                          ? "rgba(0,217,126,0.1)"
                          : `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                        color: isMinted && i === 0 ? C.primary : "#021a0d",
                        border: "none", borderRadius: 10, padding: "10px",
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                        transform: i === 0 ? `scale(${0.96 + mintBtnScale * 0.04})` : "scale(1)",
                      }}
                    >
                      {isMinting ? "⏳ Minting…" : isMinted && i === 0 ? "✓ Minted 500 USDC" : `Mint ${t.sym}`}
                    </button>
                    <div style={{ fontSize: 11, color: C.faint, textAlign: "center" }}>Sepolia testnet · free</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WRAP + DECRYPT PHASE */}
        {phase2 && (
          <div
            style={{
              opacity: wrapIn, transform: `translateY(${wrapY}px)`,
              display: "flex", height: "100%",
            }}
          >
            {/* Left: wrap console */}
            <div style={{ flex: 1.2, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Balance strip */}
              <div
                style={{
                  background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: "14px 14px 0 0", padding: "16px 24px",
                  display: "flex", gap: 32,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    USDC Balance
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 4 }}>
                    {publicBal} <span style={{ color: C.muted, fontSize: 14 }}>USDC</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    cUSDC Balance
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: decryptDone ? C.conf : C.text, marginTop: 4 }}>
                    {decryptDone ? confBal : (txConfirmed ? "🔒 ••••••" : "0.00")}
                    {" "}<span style={{ color: C.muted, fontSize: 14 }}>cUSDC</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div
                style={{
                  background: C.surface, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                  display: "flex", borderBottom: `1px solid ${C.border}`,
                }}
              >
                {["Wrap", "Unwrap", "Decrypt", "Send", "Faucet"].map((t) => {
                  const active = (t === "Wrap" && frame < 650) || (t === "Decrypt" && frame >= 650);
                  return (
                    <div key={t} style={TAB_STYLE(active)}>{t}</div>
                  );
                })}
              </div>

              {/* Action body */}
              <div
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderTop: "none", borderRadius: "0 0 14px 14px",
                  padding: "24px",
                  flex: 1,
                }}
              >
                {frame < 650 ? (
                  /* WRAP TAB */
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
                      Deposit USDC into the FHE wrapper. Your balance becomes encrypted.
                    </p>
                    {/* Amount input */}
                    <div
                      style={{
                        background: C.surface2, border: `1px solid ${frame >= 400 && frame < 500 ? C.primary : C.border}`,
                        borderRadius: 12, padding: "14px 18px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        boxShadow: frame >= 400 && frame < 500 ? `0 0 0 3px rgba(0,217,126,0.08)` : "none",
                      }}
                    >
                      <div style={{ fontSize: 36, fontWeight: 950, color: wrapAmt > 0 ? C.text : C.faint }}>
                        {wrapAmt > 0 ? wrapAmt : "0.00"}
                        {frame >= 400 && frame < 500 && (
                          <span style={{ borderRight: `3px solid ${C.primary}`, marginLeft: 2, opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0 }}>&nbsp;</span>
                        )}
                      </div>
                      <div
                        style={{
                          background: "rgba(0,217,126,0.1)", border: `1px solid rgba(0,217,126,0.2)`,
                          borderRadius: 8, padding: "6px 14px",
                          fontSize: 14, fontWeight: 700, color: C.primary,
                        }}
                      >
                        USDC
                      </div>
                    </div>
                    {/* Quick picks */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {["25%", "50%", "75%", "Max"].map((q) => (
                        <div
                          key={q}
                          style={{
                            flex: 1, padding: "8px 0", textAlign: "center",
                            background: C.surface3, border: `1px solid ${C.border}`,
                            borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.muted,
                          }}
                        >
                          {q}
                        </div>
                      ))}
                    </div>
                    {/* Wrap button */}
                    <button
                      style={{
                        background: frame >= 500
                          ? txConfirmed
                            ? "rgba(0,217,126,0.1)"
                            : "rgba(0,217,126,0.2)"
                          : `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                        color: frame >= 500 && !txConfirmed ? C.primary2 : "#021a0d",
                        border: "none", borderRadius: 12, padding: "14px",
                        fontWeight: 700, fontSize: 16,
                        transform: `scale(${frame >= 490 && frame < 510 ? 0.97 : 1})`,
                      }}
                    >
                      {txConfirmed ? "✓ Wrapped 100 USDC" : frame >= 500 ? "⏳ Confirm in wallet…" : "Wrap →"}
                    </button>
                    {/* TX line */}
                    {txConfirmed && (
                      <div
                        style={{
                          fontSize: 13, color: C.primary, display: "flex", alignItems: "center", gap: 8,
                          opacity: interpolate(frame, [570, 590], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                        }}
                      >
                        ✓ Tx confirmed · <span style={{ fontFamily: MONO, color: C.muted }}>0x4f8a…3c12 ↗</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* DECRYPT TAB */
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
                      Nothing published on-chain. Sign one EIP-712 message — your balance is revealed <em>only to you</em>.
                    </p>
                    <div
                      style={{
                        background: C.surface2, border: `1px solid ${decryptDone ? "rgba(110,231,183,0.3)" : C.border}`,
                        borderRadius: 12, padding: "28px 24px", textAlign: "center",
                        boxShadow: decryptDone ? `0 0 30px rgba(110,231,183,0.1)` : "none",
                      }}
                    >
                      {decryptDone ? (
                        <div style={{ fontSize: 40, fontWeight: 950, color: C.conf }}>
                          100.00 <span style={{ fontSize: 22, color: C.muted }}>cUSDC</span>
                        </div>
                      ) : decryptActive ? (
                        <div style={{ color: C.muted, fontSize: 16 }}>
                          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.primary}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginRight: 8 }} />
                          Authorizing with EIP-712…
                        </div>
                      ) : (
                        <div style={{ fontSize: 28, color: C.faint, letterSpacing: "0.1em" }}>•••••• encrypted</div>
                      )}
                    </div>
                    <button
                      style={{
                        background: decryptDone
                          ? "rgba(110,231,183,0.1)"
                          : `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                        color: decryptDone ? C.conf : "#021a0d",
                        border: "none", borderRadius: 12, padding: "14px",
                        fontWeight: 700, fontSize: 16,
                        transform: `scale(${decryptActive && !decryptDone ? 0.97 : 1})`,
                      }}
                    >
                      {decryptDone ? "✓ Balance decrypted" : decryptActive ? "⏳ Signing EIP-712…" : "Authorize & Decrypt"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: pair info */}
            <div
              style={{
                width: 240, padding: "28px 24px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14, margin: "28px 28px 28px 0",
                display: "flex", flexDirection: "column", gap: 0,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                Pair Info
              </div>
              {[
                ["Underlying", "USDC"],
                ["Encrypted", "cUSDC"],
                ["FHE protocol", "Zama FHE"],
                ["Standard", "ERC-7984"],
                ["Status", "Active"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
                  <span style={{ color: val === "Active" ? C.primary : C.text, fontSize: 13, fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ConnectedChrome>

      <SectionLabel text="Faucet → Wrap → Decrypt" frame={0} />
      <Subtitle
        text={
          frame < 360
            ? "Connect wallet, switch to Sepolia — then mint free test USDC from the built-in faucet."
            : frame < 570
            ? "Wrap USDC: one click handles the ERC-20 approval and the confidential shield. Public balance → encrypted."
            : frame < 650
            ? "Public USDC is gone — replaced by encrypted cUSDC. The amount is hidden on-chain."
            : "Click Decrypt, sign one EIP-712 message — balance revealed to you and only you. No on-chain trace."
        }
        startFrame={10}
        endFrame={870}
      />
    </AbsoluteFill>
  );
}
