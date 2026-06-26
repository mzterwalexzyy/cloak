// Brand-ish colours for the known mock tokens so each pair is instantly
// recognisable. Falls back to a deterministic colour derived from the symbol.
const BRAND: Record<string, string> = {
  USDC: "#2775CA",
  USDT: "#26A17B",
  WETH: "#627EEA",
  ETH: "#627EEA",
  ZAMA: "#FFD200",
  BRON: "#E8833A",
  GBP: "#8B5CF6",
  XAU: "#D4AF37",
};

function colourFor(symbol: string): string {
  const key = Object.keys(BRAND).find((k) => symbol.toUpperCase().includes(k));
  if (key) return BRAND[key];
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) % 360;
  return `hsl(${h} 65% 55%)`;
}

/** Two-letter token avatar. `confidential` adds an encrypted-purple ring. */
export function TokenBadge({ symbol, confidential = false }: { symbol: string; confidential?: boolean }) {
  const colour = colourFor(symbol);
  const letters = symbol.replace(/^c/, "").slice(0, 2).toUpperCase();
  return (
    <span
      className={`token-badge ${confidential ? "token-badge-conf" : ""}`}
      style={{ background: `linear-gradient(135deg, ${colour}, ${colour}aa)` }}
      title={symbol}
    >
      {letters}
      {confidential && <span className="token-badge-lock">🔒</span>}
    </span>
  );
}
