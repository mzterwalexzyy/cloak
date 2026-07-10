import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ConnectBar } from "./ConnectBar";
import { ChainPill } from "./ChainPill";
import { NavSearch } from "./NavSearch";
import { Tour } from "./Tour";
import { BRAND } from "../lib/brand";

function DisperseSvg() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M2 2h5v1.5H4.5L7.8 6.8 6.8 7.8 3.5 4.5V7H2V2zm16 0v5h-1.5V4.5L13.2 7.8l-1-1L15.5 3.5H13V2h5zM2 18v-5h1.5v2.5l3.3-3.3 1 1L4.5 16.5H7V18H2zm16 0h-5v-1.5h2.5l-3.3-3.3 1-1 3.3 3.3V13H18v5z"/>
    </svg>
  );
}

function AirdropSvg() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M10 2a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
      <line x1="10" y1="9" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="10" y1="9" x2="12.5" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="7" y="14" width="6" height="4" rx="1"/>
    </svg>
  );
}

function HistorySvg() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2zm0 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm.75 3.25a.75.75 0 0 0-1.5 0v4.19l2.72 2.72a.75.75 0 1 0 1.06-1.06L10.75 10.44V6.75z" clipRule="evenodd"/>
    </svg>
  );
}

function FaucetSvg() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden>
      {/* horizontal pipe */}
      <rect x="1" y="8" width="7" height="2.5" rx="1.25"/>
      {/* valve knob */}
      <ellipse cx="4.5" cy="6.5" rx="2.5" ry="1.2" opacity="0.8"/>
      <rect x="4" y="6" width="1" height="2.5" rx="0.5"/>
      {/* spout body */}
      <rect x="8" y="7" width="4" height="5.5" rx="1"/>
      {/* spout lip */}
      <rect x="7.5" y="12" width="5" height="1.5" rx="0.75"/>
      {/* water drop */}
      <path d="M10 14.5 C10 14.5 8.5 16.2 8.5 17.2 A1.5 1.5 0 0 0 11.5 17.2 C11.5 16.2 10 14.5 10 14.5z"/>
    </svg>
  );
}

function AboutSvg() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden>
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="7" r="1.1"/>
      <rect x="9.1" y="9.5" width="1.8" height="5" rx="0.9"/>
    </svg>
  );
}

function SunSvg() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <circle cx="10" cy="10" r="3.5" fill="currentColor" stroke="none"/>
      <line x1="10" y1="1.5" x2="10" y2="3.5"/>
      <line x1="10" y1="16.5" x2="10" y2="18.5"/>
      <line x1="1.5" y1="10" x2="3.5" y2="10"/>
      <line x1="16.5" y1="10" x2="18.5" y2="10"/>
      <line x1="3.93" y1="3.93" x2="5.34" y2="5.34"/>
      <line x1="14.66" y1="14.66" x2="16.07" y2="16.07"/>
      <line x1="16.07" y1="3.93" x2="14.66" y2="5.34"/>
      <line x1="5.34" y1="14.66" x2="3.93" y2="16.07"/>
    </svg>
  );
}

function MoonSvg() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor" aria-hidden>
      <path d="M16.5 11.5A7 7 0 0 1 8.5 3.5c0 .17.01.34.02.5A6.5 6.5 0 1 0 16 13.48c.17-.65.5-1.29.5-1.98z"/>
    </svg>
  );
}

const SIDEBAR_NAV: { to: string; icon: React.ReactNode; label: string; end?: boolean }[] = [
  { to: "/",         icon: "◫",              label: "Wrap",     end: true },
  { to: "/disperse", icon: <DisperseSvg />,  label: "Disperse" },
  { to: "/airdrop",  icon: <AirdropSvg />,   label: "Airdrop"  },
  { to: "/faucet",   icon: <FaucetSvg />,    label: "Faucet"   },
  { to: "/about",    icon: <AboutSvg />,     label: "About"    },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("cloak-theme") as "dark" | "light") ?? "dark";
  });
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cloak-theme", theme);
  }, [theme]);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

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
          <NavLink
            to="/history"
            title="History"
            data-tour="history"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <span className="sidebar-icon" aria-hidden><HistorySvg /></span>
            <span className="sidebar-label">History</span>
          </NavLink>
        </div>
      </aside>

      {/* ── Right content column ── */}
      <div className="app-content">
        <header className="app-topbar">
          <Link to="/" className="app-wordmark">{BRAND}</Link>
          <NavSearch />
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <SunSvg /> : <MoonSvg />}
            </button>
            <button
              className="tour-help"
              onClick={() => window.dispatchEvent(new Event("cloak:start-tour"))}
              aria-label="Take a tour"
              title="Take a tour"
            >?</button>
            <ChainPill />
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
          <AnimatePresence initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
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
              <div className="footer-socials">
                <a className="footer-social-link" href="https://github.com/mzterwalexzyy" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden><path d="M10 1.667A8.333 8.333 0 0 0 1.667 10c0 3.682 2.388 6.805 5.703 7.909.417.077.57-.181.57-.402 0-.199-.007-.725-.011-1.422-2.32.504-2.81-1.119-2.81-1.119-.38-.965-.927-1.222-.927-1.222-.758-.518.058-.507.058-.507.838.059 1.279.861 1.279.861.744 1.274 1.951.906 2.428.693.075-.539.291-.906.53-1.114-1.851-.21-3.797-.926-3.797-4.12 0-.91.325-1.654.858-2.237-.086-.21-.372-1.058.081-2.206 0 0 .699-.224 2.29.853A7.974 7.974 0 0 1 10 5.83c.708.003 1.421.096 2.087.28 1.59-1.077 2.288-.853 2.288-.853.455 1.148.169 1.996.083 2.206.534.583.857 1.327.857 2.237 0 3.202-1.949 3.907-3.806 4.113.299.258.566.767.566 1.546 0 1.116-.01 2.016-.01 2.29 0 .223.15.483.574.401A8.335 8.335 0 0 0 18.333 10 8.333 8.333 0 0 0 10 1.667z"/></svg>
                  @mzterwalexzyy
                </a>
                <a className="footer-social-link" href="https://x.com/de_xklusiv" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor" aria-hidden><path d="M15.18 2h2.64l-5.76 6.59L18.94 18h-5.3l-4.16-5.44L4.77 18H2.13l6.16-7.05L1.06 2h5.43l3.76 4.91L15.18 2zm-.92 14.38h1.46L5.82 3.5H4.25l10.01 12.88z"/></svg>
                  @de_xklusiv
                </a>
              </div>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h4>App</h4>
                <Link to="/">Wrap</Link>
                <Link to="/disperse">Disperse</Link>
                <Link to="/airdrop">Airdrop</Link>
                <Link to="/faucet">Faucet</Link>
                <Link to="/about">About</Link>
                <Link to="/history">History</Link>
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
