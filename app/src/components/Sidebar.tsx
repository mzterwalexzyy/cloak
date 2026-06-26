import { NavLink } from "react-router-dom";
import { explorerAddress } from "../lib/format";

const REGISTRY = "0x2f0750Bbb0A246059d80e94c454586a7F27a128e";

const nav = [
  { to: "/", label: "Registry", icon: "❖", end: true },
  { to: "/faucet", label: "Faucet", icon: "⛲", end: false },
  { to: "/about", label: "How it works", icon: "✦", end: false },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="side-brand" onClick={onNavigate}>
        <span className="brand-mark">🔒</span>
        <div className="brand-title">Confidential Wrapper Registry</div>
      </NavLink>

      <nav className="side-nav">
        <div className="side-group">App</div>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
          >
            <span className="side-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}

        <div className="side-group">Resources</div>
        <a className="side-link" href={explorerAddress(REGISTRY)} target="_blank" rel="noreferrer">
          <span className="side-icon">◎</span> Registry contract ↗
        </a>
        <a className="side-link" href="https://docs.zama.org/protocol" target="_blank" rel="noreferrer">
          <span className="side-icon">▤</span> Zama docs ↗
        </a>
        <a
          className="side-link"
          href="https://www.alchemy.com/faucets/ethereum-sepolia"
          target="_blank"
          rel="noreferrer"
        >
          <span className="side-icon">⛽</span> Get test ETH ↗
        </a>
      </nav>

      <div className="side-foot">
        <span className="side-net">● Sepolia testnet</span>
        <span className="side-tag">Zama Developer Program · Season 3</span>
      </div>
    </aside>
  );
}
