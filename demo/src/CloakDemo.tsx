import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, Img, staticFile, spring, useVideoConfig } from "remotion";
import { ScreenScene } from "./components/ScreenScene";
import { MouseCursor, Waypoint } from "./components/MouseCursor";
import { ZoomWrapper } from "./components/ZoomWrapper";
import { Subtitle, SectionLabel } from "./components/Subtitle";
import { C, FONT, MONO } from "./components/Theme";

// ─── Scene timing (frames @ 30fps) ────────────────────────────────────────────
// Hook         0   –  600  (0:00 – 0:20)  hand-coded title card
// Home         600 – 1110  (0:20 – 0:37)  real screenshot
// Registry    1110 – 1500  (0:37 – 0:50)  real screenshot + search
// Faucet      1500 – 1920  (0:50 – 1:04)  real screenshot
// Wrap        1920 – 2520  (1:04 – 1:24)  real screenshot
// Decrypt     2520 – 2820  (1:24 – 1:34)  real screenshot
// Send        2820 – 3300  (1:34 – 1:50)  real screenshot
// Disperse    3300 – 4050  (1:50 – 2:15)  real screenshot
// Airdrop     4050 – 5100  (2:15 – 2:50)  real screenshot
// Close       5100 – 5400  (2:50 – 3:00)  hand-coded title card

export function CloakDemo() {
  return (
    <AbsoluteFill>
      {/* ── 0:00 Hook ── */}
      <Sequence from={0} durationInFrames={600}>
        <HookScene />
      </Sequence>

      {/* ── 0:20 Home page ── */}
      <Sequence from={600} durationInFrames={510}>
        <ScreenScene
          screenshot="home"
          totalFrames={510}
          sectionLabel="Live Registry"
          subtitle="No wallet needed — Cloak reads every ERC-7984 pair directly from the Zama on-chain registry. 8 pairs. Nothing hardcoded."
          waypoints={[
            { x: 960, y: 200, frame: 0 },
            { x: 960, y: 400, frame: 80 },           // hover over hero
            { x: 960, y: 400, frame: 180 },           // pause → zoom
            { x: 700, y: 600, frame: 260 },           // move to registry
            { x: 700, y: 600, frame: 380 },           // pause on pair card → zoom
            { x: 960, y: 600, frame: 460 },
            { x: 960, y: 600, frame: 500 },
          ]}
        />
      </Sequence>

      {/* ── 0:37 Registry + search ── */}
      <Sequence from={1110} durationInFrames={390}>
        <RegistrySearchScene />
      </Sequence>

      {/* ── 0:50 Faucet ── */}
      <Sequence from={1500} durationInFrames={420}>
        <ScreenScene
          screenshot="faucet"
          totalFrames={420}
          sectionLabel="Token Faucet"
          subtitle="Mint free test tokens on Sepolia. You need a little Sepolia ETH for gas — everything else is free."
          waypoints={[
            { x: 400, y: 300, frame: 0 },
            { x: 400, y: 450, frame: 60 },
            { x: 400, y: 450, frame: 160 },           // hover card → zoom
            { x: 600, y: 500, frame: 220 },
            { x: 400, y: 520, frame: 280, click: true }, // click Mint USDC
            { x: 400, y: 520, frame: 380 },
          ]}
        />
      </Sequence>

      {/* ── 1:04 Wrap tab ── */}
      <Sequence from={1920} durationInFrames={600}>
        <ScreenScene
          screenshot="pair_wrap"
          totalFrames={600}
          sectionLabel="Wrap → Encrypt"
          subtitle="Wrap USDC into cUSDC: one tx handles the ERC-20 approval and the FHE shield. Your public balance disappears — replaced by ciphertext."
          waypoints={[
            { x: 960, y: 300, frame: 0 },
            { x: 500, y: 450, frame: 60 },            // amount field
            { x: 500, y: 450, frame: 180 },           // hover → zoom
            { x: 700, y: 550, frame: 260 },           // quick pick button
            { x: 700, y: 550, frame: 300, click: true },
            { x: 500, y: 620, frame: 420, click: true }, // Wrap button
            { x: 500, y: 620, frame: 560 },
          ]}
        />
      </Sequence>

      {/* ── 1:24 Decrypt tab ── */}
      <Sequence from={2520} durationInFrames={300}>
        <ScreenScene
          screenshot="pair_decrypt"
          totalFrames={300}
          sectionLabel="Decrypt (EIP-712)"
          subtitle="Sign one EIP-712 message — your encrypted balance is revealed only to you. Nothing published on-chain."
          waypoints={[
            { x: 960, y: 300, frame: 0 },
            { x: 500, y: 450, frame: 60 },
            { x: 500, y: 450, frame: 120 },           // hover → zoom
            { x: 500, y: 600, frame: 200, click: true }, // Decrypt button
            { x: 500, y: 600, frame: 270 },
          ]}
        />
      </Sequence>

      {/* ── 1:34 Send tab ── */}
      <Sequence from={2820} durationInFrames={480}>
        <ScreenScene
          screenshot="pair_send"
          totalFrames={480}
          sectionLabel="Confidential Send"
          subtitle="Send cUSDC privately. Recipient address is visible on-chain — the amount is FHE-encrypted. No analyst can read it."
          waypoints={[
            { x: 960, y: 300, frame: 0 },
            { x: 400, y: 400, frame: 60 },            // recipient input
            { x: 400, y: 400, frame: 160 },           // hover → zoom
            { x: 400, y: 500, frame: 220 },           // amount field
            { x: 700, y: 540, frame: 280, click: true }, // 50% quick pick
            { x: 500, y: 630, frame: 380, click: true }, // Send button
            { x: 500, y: 630, frame: 450 },
          ]}
        />
      </Sequence>

      {/* ── 1:50 Disperse ── */}
      <Sequence from={3300} durationInFrames={750}>
        <DisperseScene />
      </Sequence>

      {/* ── 2:15 Airdrop ── */}
      <Sequence from={4050} durationInFrames={1050}>
        <AirdropScene />
      </Sequence>

      {/* ── 2:50 Close ── */}
      <Sequence from={5100} durationInFrames={300}>
        <CloseScene />
      </Sequence>
    </AbsoluteFill>
  );
}

// ─── Hook (title card — stays hand-coded, looks intentional) ─────────────────
function HookScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgesOpacity = interpolate(frame, [55, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = Math.sin(frame * 0.04) * 0.5 + 0.5;

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: -200, right: -200, width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, rgba(0,217,126,${0.07 + glow * 0.03}), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>
        <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: "rgba(0,217,126,0.1)", border: `1.5px solid rgba(0,217,126,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: `0 0 60px rgba(0,217,126,${0.15 + glow * 0.1})` }}>🔒</div>
          <span style={{ fontSize: 90, fontWeight: 800, color: C.text, letterSpacing: "-0.04em", fontStyle: "italic" }}>Cloak</span>
        </div>

        <div style={{ opacity: taglineOpacity, fontSize: 28, color: C.muted, lineHeight: 1.5 }}>
          Confidential token wrappers · <span style={{ color: C.text }}>built on Zama FHE</span>
        </div>

        <div style={{ opacity: badgesOpacity, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {["Wrap", "Decrypt privately", "Send hidden", "Disperse", "Airdrop"].map((b) => (
            <span key={b} style={{ background: "rgba(0,217,126,0.08)", border: `1px solid rgba(0,217,126,0.2)`, borderRadius: 999, padding: "8px 22px", fontSize: 16, fontWeight: 600, color: C.primary2 }}>
              {b}
            </span>
          ))}
        </div>

        <div style={{ opacity: badgesOpacity, background: "rgba(0,217,126,0.05)", border: `1px solid rgba(0,217,126,0.12)`, borderRadius: 14, padding: "12px 28px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <span style={{ color: C.muted, fontSize: 15 }}>Built for</span>
          <span style={{ color: C.conf, fontWeight: 800, fontSize: 15 }}>Zama Developer Program — Season 3</span>
          <span style={{ color: C.faint, fontSize: 14 }}>· Ethereum Sepolia</span>
        </div>
      </div>

      <Subtitle text="On Ethereum, every transfer is public. Zama FHE changes that — Cloak wraps any token into its confidential version." startFrame={60} endFrame={570} />
    </AbsoluteFill>
  );
}

// ─── Registry search scene (two screenshots, transition mid-scene) ─────────────
function RegistrySearchScene() {
  const frame = useCurrentFrame();
  const TOTAL = 390;
  // First half: home_registry, second half: home_search
  const useSearch = frame >= 180;
  const crossfade = interpolate(frame, [170, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const waypoints: Waypoint[] = [
    { x: 960, y: 500, frame: 0 },
    { x: 330, y: 108, frame: 60 },        // nav search bar
    { x: 330, y: 108, frame: 90, click: true },
    { x: 330, y: 108, frame: 200 },        // typing USDC (shown by crossfade to home_search)
    { x: 330, y: 108, frame: 280 },        // hover → zoom on search
    { x: 700, y: 500, frame: 340 },        // move to filtered result
    { x: 700, y: 500, frame: 370 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ZoomWrapper waypoints={waypoints}>
        <AbsoluteFill>
          {/* Base: registry */}
          <Img src={staticFile("screenshots/home_registry.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
          {/* Crossfade to search result */}
          <Img src={staticFile("screenshots/home_search.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", opacity: crossfade }} />
          <MouseCursor waypoints={waypoints} totalFrames={TOTAL} />
        </AbsoluteFill>
      </ZoomWrapper>
      <SectionLabel text="Search & Filter" frame={0} />
      <Subtitle text='Type "USDC" in the search bar — pairs filter instantly. Works with name, symbol or contract address.' startFrame={10} endFrame={370} />
    </AbsoluteFill>
  );
}

// ─── Disperse scene (empty → filled crossfade) ────────────────────────────────
function DisperseScene() {
  const frame = useCurrentFrame();
  const TOTAL = 750;
  const crossfade = interpolate(frame, [200, 260], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const waypoints: Waypoint[] = [
    { x: 960, y: 300, frame: 0 },
    { x: 600, y: 400, frame: 60 },         // textarea
    { x: 600, y: 400, frame: 80, click: true },
    { x: 600, y: 400, frame: 250 },        // "typing" — shown by crossfade
    { x: 600, y: 450, frame: 330 },
    { x: 600, y: 450, frame: 420 },        // hover → zoom on preview table
    { x: 900, y: 480, frame: 500 },
    { x: 600, y: 600, frame: 620, click: true }, // Disperse button
    { x: 600, y: 600, frame: 720 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ZoomWrapper waypoints={waypoints}>
        <AbsoluteFill>
          <Img src={staticFile("screenshots/disperse_empty.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
          <Img src={staticFile("screenshots/disperse_filled.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", opacity: crossfade }} />
          <MouseCursor waypoints={waypoints} totalFrames={TOTAL} />
        </AbsoluteFill>
      </ZoomWrapper>
      <SectionLabel text="Batch Disperse" frame={0} />
      <Subtitle
        text={
          frame < 260
            ? "Paste a recipient list — address and amount per line. Every amount FHE-encrypted. No one on-chain knows who got what."
            : "Preview validates every address in real time. Hit Disperse — Cloak sends each transfer sequentially and tracks status live."
        }
        startFrame={10}
        endFrame={720}
      />
    </AbsoluteFill>
  );
}

// ─── Airdrop scene (list → form crossfade) ────────────────────────────────────
function AirdropScene() {
  const frame = useCurrentFrame();
  const TOTAL = 1050;
  const toForm = interpolate(frame, [100, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const backToList = interpolate(frame, [650, 720], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const waypoints: Waypoint[] = [
    { x: 960, y: 300, frame: 0 },
    { x: 400, y: 370, frame: 60, click: true },  // New campaign button
    { x: 400, y: 450, frame: 160 },              // campaign name field
    { x: 400, y: 450, frame: 260 },              // hover → zoom
    { x: 400, y: 550, frame: 360 },
    { x: 500, y: 680, frame: 460, click: true }, // Launch button
    { x: 500, y: 680, frame: 560 },
    { x: 700, y: 500, frame: 700 },              // back to list, hover campaign
    { x: 700, y: 500, frame: 800 },              // hover → zoom
    { x: 700, y: 600, frame: 900 },
    { x: 700, y: 600, frame: 1000 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ZoomWrapper waypoints={waypoints}>
        <AbsoluteFill>
          <Img src={staticFile("screenshots/airdrop.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
          <Img src={staticFile("screenshots/airdrop_form.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", opacity: toForm * (1 - backToList) }} />
          <Img src={staticFile("screenshots/airdrop.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", opacity: backToList }} />
          <MouseCursor waypoints={waypoints} totalFrames={TOTAL} />
        </AbsoluteFill>
      </ZoomWrapper>
      <SectionLabel text="Airdrop Campaigns" frame={0} />
      <Subtitle
        text={
          frame < 400
            ? "Create a named campaign, set allocations, launch. Every recipient's amount is FHE-encrypted — no one sees what others received."
            : "Close the tab and come back — campaigns persist and resume. Full history per recipient, fully on-chain."
        }
        startFrame={10}
        endFrame={1020}
      />
    </AbsoluteFill>
  );
}

// ─── Close (title card) ───────────────────────────────────────────────────────
function CloseScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = Math.sin(frame * 0.06) * 0.5 + 0.5;
  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const itemsOpacity = interpolate(frame, [25, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const linksOpacity = interpolate(frame, [70, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(900px 600px at 50% 40%, rgba(0,217,126,${0.07 + glow * 0.03}), transparent 65%)` }} />

      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: "rgba(0,217,126,0.1)", border: `1.5px solid rgba(0,217,126,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: `0 0 60px rgba(0,217,126,${0.15 + glow * 0.1})` }}>🔒</div>
          <span style={{ fontSize: 90, fontWeight: 800, color: C.text, letterSpacing: "-0.04em", fontStyle: "italic" }}>Cloak</span>
        </div>

        <div style={{ opacity: itemsOpacity, display: "flex", gap: 12 }}>
          {["Wrap", "Decrypt", "Send", "Disperse", "Airdrop"].map((f) => (
            <span key={f} style={{ background: "rgba(0,217,126,0.08)", border: `1px solid rgba(0,217,126,0.2)`, borderRadius: 999, padding: "8px 22px", fontSize: 16, fontWeight: 600, color: C.primary2 }}>{f}</span>
          ))}
        </div>

        <div style={{ opacity: itemsOpacity, fontSize: 24, color: C.muted }}>
          The complete confidential token lifecycle — <span style={{ color: C.text }}>built on Zama FHE, live on Sepolia.</span>
        </div>

        <div style={{ opacity: linksOpacity, display: "flex", gap: 20 }}>
          {[["Live app", "cloak-mzterwalexzyys-projects.vercel.app"], ["GitHub", "github.com/mzterwalexzyy/cloak"]].map(([label, url]) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 24px" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: C.primary, marginTop: 4 }}>{url}</div>
            </div>
          ))}
        </div>

        <div style={{ opacity: linksOpacity, background: "rgba(0,217,126,0.06)", border: `1px solid rgba(0,217,126,0.15)`, borderRadius: 14, padding: "12px 28px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <span style={{ color: C.conf, fontWeight: 800, fontSize: 15 }}>Zama Developer Program — Season 3</span>
          <span style={{ color: C.faint, fontSize: 14 }}>· #ZamaDeveloperProgram</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
