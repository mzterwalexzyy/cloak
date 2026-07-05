import React from "react";
import { C, FONT, MONO } from "./Theme";

interface Props {
  children: React.ReactNode;
  activeNav?: string;
}

const NAV = [
  { icon: "◫", label: "Wrap" },
  { icon: "⤢", label: "Disperse" },
  { icon: "🪂", label: "Airdrop" },
  { icon: "💧", label: "Faucet" },
  { icon: "ℹ", label: "About" },
];

export function AppChrome({ children, activeNav = "Wrap" }: Props) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: C.bg, fontFamily: FONT }}>
      {/* Sidebar */}
      <div
        style={{
          width: 72,
          flexShrink: 0,
          background: "rgba(8,15,26,0.98)",
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 16,
          gap: 4,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(0,217,126,0.1)",
            border: `1px solid rgba(0,217,126,0.22)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            marginBottom: 16,
          }}
        >
          🔒
        </div>
        {NAV.map((n) => (
          <div
            key={n.label}
            style={{
              width: 52,
              height: 48,
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: activeNav === n.label ? "rgba(0,217,126,0.1)" : "transparent",
              border: `1px solid ${activeNav === n.label ? "rgba(0,217,126,0.22)" : "transparent"}`,
            }}
          >
            <span style={{ fontSize: 16, color: activeNav === n.label ? C.primary : C.muted }}>{n.icon}</span>
            <span style={{ fontSize: 9, color: activeNav === n.label ? C.primary : C.faint, fontWeight: 600 }}>
              {n.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div
          style={{
            height: 56,
            borderBottom: `1px solid ${C.border}`,
            background: "rgba(5,11,20,0.96)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <span style={{ color: C.text, fontWeight: 800, fontSize: 16, letterSpacing: "0.02em", fontStyle: "italic" }}>
            Cloak
          </span>
          <div style={{ flex: 1 }} />
          {/* Search pill */}
          <div
            style={{
              height: 34,
              width: 220,
              borderRadius: 8,
              background: C.surface2,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 8,
            }}
          >
            <span style={{ color: C.faint, fontSize: 13 }}>🔍</span>
            <span style={{ color: C.faint, fontSize: 13 }}>Search tokens…</span>
          </div>
          {/* Chain pill */}
          <div
            style={{
              height: 32,
              borderRadius: 8,
              background: C.surface2,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 6,
              fontSize: 12,
              color: C.muted,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, display: "inline-block" }} />
            Sepolia
          </div>
          {/* Connect button */}
          <div
            style={{
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
              color: "#021a0d",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
            }}
          >
            Connect Wallet
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}

export function ConnectedChrome({ children, activeNav = "Wrap", address = "0x71Be…3cF4" }: Props & { address?: string }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: C.bg, fontFamily: FONT }}>
      <div
        style={{
          width: 72,
          flexShrink: 0,
          background: "rgba(8,15,26,0.98)",
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 16,
          gap: 4,
        }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(0,217,126,0.1)", border: `1px solid rgba(0,217,126,0.22)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16,
          }}
        >🔒</div>
        {NAV.map((n) => (
          <div
            key={n.label}
            style={{
              width: 52, height: 48, borderRadius: 10,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              background: activeNav === n.label ? "rgba(0,217,126,0.1)" : "transparent",
              border: `1px solid ${activeNav === n.label ? "rgba(0,217,126,0.22)" : "transparent"}`,
            }}
          >
            <span style={{ fontSize: 16, color: activeNav === n.label ? C.primary : C.muted }}>{n.icon}</span>
            <span style={{ fontSize: 9, color: activeNav === n.label ? C.primary : C.faint, fontWeight: 600 }}>{n.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            height: 56, borderBottom: `1px solid ${C.border}`,
            background: "rgba(5,11,20,0.96)", display: "flex", alignItems: "center",
            padding: "0 24px", gap: 16, flexShrink: 0,
          }}
        >
          <span style={{ color: C.text, fontWeight: 800, fontSize: 16, letterSpacing: "0.02em", fontStyle: "italic" }}>Cloak</span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              height: 34, width: 220, borderRadius: 8, background: C.surface2,
              border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
              padding: "0 12px", gap: 8,
            }}
          >
            <span style={{ color: C.faint, fontSize: 13 }}>🔍</span>
            <span style={{ color: C.faint, fontSize: 13 }}>Search tokens…</span>
          </div>
          <div
            style={{
              height: 32, borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", padding: "0 12px", gap: 6, fontSize: 12, color: C.muted,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, display: "inline-block" }} />
            Sepolia
          </div>
          {/* Connected pill */}
          <div
            style={{
              height: 34, borderRadius: 8, background: C.surface2,
              border: `1px solid rgba(0,217,126,0.2)`,
              display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, display: "inline-block", boxShadow: `0 0 6px ${C.primary}` }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>{address}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}
