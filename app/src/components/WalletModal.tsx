import { createPortal } from "react-dom";
import { useConnect } from "wagmi";
import { motion } from "framer-motion";
import type { Connector } from "wagmi";

function GenericWalletSvg() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
      <rect width="32" height="32" rx="8" fill="#1e2535"/>
      <rect x="6" y="11" width="20" height="14" rx="3" stroke="#00d97e" strokeWidth="1.8"/>
      <path d="M6 15h20" stroke="#00d97e" strokeWidth="1.8"/>
      <circle cx="22" cy="19" r="1.5" fill="#00d97e"/>
      <path d="M10 7h8a2 2 0 0 1 2 2v2H8V9a2 2 0 0 1 2-2z" stroke="#00d97e" strokeWidth="1.4"/>
    </svg>
  );
}

const KNOWN_WALLETS: { name: string; rdns: string[]; url: string; icon: string }[] = [
  {
    name: "MetaMask",
    rdns: ["io.metamask", "io.metamask.mobile"],
    url: "https://metamask.io/download/",
    icon: "data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='8' fill='%23F6851B'/%3E%3Cpath d='M24.5 5.5L17.1 11l1.4-3.3 6-2.2z' fill='%23E2761B'/%3E%3Cpath d='M7.5 5.5l7.3 5.6-1.3-3.4-6 2.2z' fill='%23E4761B'/%3E%3Cpath d='M21.8 20.5l-2 3 4.2 1.2 1.2-4.1-3.4-.1zm-13.6 0l-3.4.1 1.1 4.1 4.2-1.2-1.9-3z' fill='%23E4761B'/%3E%3C/svg%3E",
  },
  {
    name: "OKX Wallet",
    rdns: ["com.okex.wallet", "app.okexchain"],
    url: "https://www.okx.com/web3",
    icon: "data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='8' fill='%23000'/%3E%3Crect x='6' y='6' width='8' height='8' rx='1' fill='white'/%3E%3Crect x='12' y='12' width='8' height='8' rx='1' fill='white'/%3E%3Crect x='18' y='6' width='8' height='8' rx='1' fill='white'/%3E%3Crect x='6' y='18' width='8' height='8' rx='1' fill='white'/%3E%3Crect x='18' y='18' width='8' height='8' rx='1' fill='white'/%3E%3C/svg%3E",
  },
  {
    name: "Coinbase Wallet",
    rdns: ["com.coinbase.wallet"],
    url: "https://www.coinbase.com/wallet/downloads",
    icon: "data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='16' fill='%231652F0'/%3E%3Ccircle cx='16' cy='16' r='9' stroke='white' stroke-width='2' fill='none'/%3E%3Crect x='11' y='14.5' width='10' height='3' rx='1.5' fill='white'/%3E%3C/svg%3E",
  },
  {
    name: "Trust Wallet",
    rdns: ["com.trustwallet.app"],
    url: "https://trustwallet.com/download",
    icon: "data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='8' fill='%233375BB'/%3E%3Cpath d='M16 6l8 3.5v6c0 5-3.5 9-8 10.5C11.5 24.5 8 20.5 8 15.5v-6L16 6z' fill='white'/%3E%3C/svg%3E",
  },
  {
    name: "Rabby",
    rdns: ["io.rabby"],
    url: "https://rabby.io/",
    icon: "data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='8' fill='%238697FF'/%3E%3Cellipse cx='16' cy='14' rx='7' ry='5' fill='white'/%3E%3Ccircle cx='12.5' cy='12.5' r='1.5' fill='%238697FF'/%3E%3Ccircle cx='19.5' cy='12.5' r='1.5' fill='%238697FF'/%3E%3Cpath d='M12 18c1 2 7 2 8 0' stroke='%238697FF' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E",
  },
  {
    name: "Brave Wallet",
    rdns: ["com.brave.wallet"],
    url: "https://brave.com/wallet/",
    icon: "data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' rx='8' fill='%23FF5500'/%3E%3Cpath d='M16 6l7 4v7c0 4-2.5 7-7 9-4.5-2-7-5-7-9v-7l7-4z' fill='white'/%3E%3C/svg%3E",
  },
];

function matchesKnown(connector: Connector) {
  const id = (connector.id ?? "").toLowerCase();
  const name = (connector.name ?? "").toLowerCase();
  return KNOWN_WALLETS.find(
    (w) => w.rdns.some((r) => id.includes(r.toLowerCase().split(".").pop()!)) ||
           w.name.toLowerCase() === name
  );
}

function WalletRow({
  icon,
  name,
  badge,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  name: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`wallet-option ${disabled ? "wallet-option-disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="wallet-option-icon">{icon}</span>
      <span className="wallet-option-name">{name}</span>
      {badge && <span className="wallet-option-badge">{badge}</span>}
    </button>
  );
}

export function WalletModal({ onClose }: { onClose: () => void }) {
  const { connect, connectors, isPending } = useConnect();

  const discovered = connectors.filter((c) => c.id !== "injected" || connectors.length === 1);
  const discoveredRdns = new Set(discovered.map((c) => c.id.toLowerCase()));

  const notInstalled = KNOWN_WALLETS.filter(
    (w) => !w.rdns.some((r) => discoveredRdns.has(r.toLowerCase()))
      && !discovered.some((c) => c.name.toLowerCase() === w.name.toLowerCase())
  );

  return createPortal(
    <div className="wallet-modal-backdrop" onClick={onClose}>
      <motion.div
        className="wallet-modal"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wallet-modal-head">
          <h3>Connect Wallet</h3>
          <button className="wallet-modal-close" onClick={onClose}>✕</button>
        </div>

        {discovered.length > 0 && (
          <div className="wallet-section">
            <p className="wallet-section-label">Detected</p>
            {discovered.map((connector) => {
              const known = matchesKnown(connector);
              const iconSrc = (connector as any).icon ?? known?.icon;
              return (
                <WalletRow
                  key={connector.uid}
                  icon={
                    iconSrc
                      ? <img src={iconSrc} width={32} height={32} alt={connector.name} style={{ borderRadius: 8 }} />
                      : <GenericWalletSvg />
                  }
                  name={connector.name}
                  badge={<span className="badge-installed">Installed</span>}
                  onClick={() => { connect({ connector }); onClose(); }}
                  disabled={isPending}
                />
              );
            })}
          </div>
        )}

        {notInstalled.length > 0 && (
          <div className="wallet-section">
            <p className="wallet-section-label">Popular wallets</p>
            {notInstalled.map((w) => (
              <WalletRow
                key={w.name}
                icon={<img src={w.icon} width={32} height={32} alt={w.name} style={{ borderRadius: 8 }} />}
                name={w.name}
                badge={
                  <a className="badge-get" href={w.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    Get ↗
                  </a>
                }
                disabled
              />
            ))}
          </div>
        )}

        {discovered.length === 0 && notInstalled.length === 0 && (
          <p className="wallet-empty">No wallets detected. Install a browser extension wallet and refresh.</p>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
