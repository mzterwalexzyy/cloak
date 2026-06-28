import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { ConnectBar } from "./ConnectBar";
import { ChainPill } from "./ChainPill";
import { NavSearch } from "./NavSearch";
import { Tour } from "./Tour";
import { BRAND } from "../lib/brand";

const NAV = [
  { to: "/", label: "Wrap", end: true },
  { to: "/faucet", label: "Faucet" },
  { to: "/about", label: "Docs" },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Tour />
      <header className="relay-nav">
        <Link to="/" className="relay-logo" onClick={() => setMenuOpen(false)}>
          <span className="relay-star" aria-hidden>🔒</span>
          <span className="relay-word">{BRAND}</span>
        </Link>

        <nav className={`relay-links ${menuOpen ? "open" : ""}`}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-tour={n.label.toLowerCase()}
              className={({ isActive }) => `relay-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <NavSearch />

        <div className="relay-actions">
          <button
            className="tour-help"
            onClick={() => window.dispatchEvent(new Event("cloak:start-tour"))}
            aria-label="Take a tour"
            title="Take a tour"
          >
            ?
          </button>
          <ChainPill />
          <span data-tour="connect"><ConnectBar /></span>
          <button className="mobile-menu" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🔒 {BRAND}</span>
            <p className="footer-tag">
              Confidential token wrappers on Ethereum Sepolia. Wrap, unwrap, decrypt and send ERC-7984
              tokens from the official Zama Wrappers Registry.
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>App</h4>
              <Link to="/">Wrap</Link>
              <Link to="/app">Swap console</Link>
              <Link to="/faucet">Faucet</Link>
              <Link to="/about">Docs</Link>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="https://docs.zama.org/protocol" target="_blank" rel="noreferrer">Zama Protocol ↗</a>
              <a href="https://sepolia.etherscan.io/address/0x2f0750Bbb0A246059d80e94c454586a7F27a128e" target="_blank" rel="noreferrer">Registry contract ↗</a>
              <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noreferrer">Get test ETH ↗</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {BRAND} · Built for the Zama Developer Program</span>
          <span>Sepolia testnet · not financial advice</span>
        </div>
      </footer>
    </div>
  );
}