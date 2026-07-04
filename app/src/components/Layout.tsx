import { useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ConnectBar } from "./ConnectBar";
import { ChainPill } from "./ChainPill";
import { NavSearch } from "./NavSearch";
import { Tour } from "./Tour";
import { BRAND } from "../lib/brand";

const SIDEBAR_NAV = [
  { to: "/",         icon: "◫",  label: "Wrap",      end: true },
  { to: "/disperse", icon: "⊕",  label: "Disperse" },
  { to: "/airdrop",  icon: "↓↓", label: "Airdrop" },
  { to: "/faucet",   icon: "◉",  label: "Faucet" },
  { to: "/about",    icon: "≡",  label: "Docs" },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <Tour />

      {/* ── Left sidebar ── */}
      <aside className="app-sidebar">
        <Link to="/" className="sidebar-logo" title={BRAND} onClick={() => setMenuOpen(false)}>
          <span aria-hidden>🔒</span>
        </Link>

        <nav className="sidebar-nav">
          {SIDEBAR_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={n.label}
              data-tour={n.label.toLowerCase()}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="sidebar-icon" aria-hidden>{n.icon}</span>
              <span className="sidebar-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <ChainPill compact />
        </div>
      </aside>

      {/* ── Right content column ── */}
      <div className="app-content">
        <header className="app-topbar">
          <span className="app-wordmark">{BRAND}</span>
          <NavSearch />
          <div className="topbar-actions">
            <button
              className="tour-help"
              onClick={() => window.dispatchEvent(new Event("cloak:start-tour"))}
              aria-label="Take a tour"
              title="Take a tour"
            >?</button>
            <span data-tour="connect"><ConnectBar /></span>
            <button className="mobile-menu" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </header>

        {/* Mobile nav overlay */}
        <nav className={`mobile-nav ${menuOpen ? "open" : ""}`}>
          {SIDEBAR_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="app-main">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
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
                <Link to="/disperse">Disperse</Link>
                <Link to="/airdrop">Airdrop</Link>
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
    </div>
  );
}
