import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { explorerTx, explorerAddress, shortAddr } from "../lib/format";

interface EthTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  functionName: string;
  methodId: string;
  timeStamp: string;
  isError: string;
  gasUsed: string;
  confirmations: string;
}

function methodLabel(tx: EthTx): string {
  const fn = (tx.functionName ?? "").toLowerCase();
  if (fn.includes("wrap") && !fn.includes("unwrap")) return "Wrap";
  if (fn.includes("unwrap")) return "Unwrap";
  if (fn.includes("confidential") && fn.includes("transfer")) return "Confidential Send";
  if (fn.includes("transfer")) return "Transfer";
  if (fn.includes("mint")) return "Mint";
  if (fn.includes("approve")) return "Approve";
  if (fn.includes("disperse")) return "Disperse";
  if (fn.includes("register")) return "Register";
  if (tx.methodId === "0x") return "ETH Transfer";
  return "Contract Call";
}

function methodIcon(label: string): string {
  const map: Record<string, string> = {
    "Wrap": "⬡",
    "Unwrap": "⬢",
    "Confidential Send": "🔐",
    "Transfer": "→",
    "Mint": "◉",
    "Approve": "✓",
    "Disperse": "⤢",
    "Register": "📋",
    "ETH Transfer": "Ξ",
    "Contract Call": "⚙",
  };
  return map[label] ?? "⚙";
}

function timeAgo(ts: string): string {
  const diff = Math.floor(Date.now() / 1000) - Number(ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [txs, setTxs] = useState<EthTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError("");

    fetch(
      `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=50`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "1" && Array.isArray(data.result)) {
          setTxs(data.result as EthTx[]);
        } else {
          setTxs([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load transaction history. Check your connection.");
        setLoading(false);
      });
  }, [address]);

  return (
    <div className="history-page">
      <div className="history-page-head">
        <Link to="/" className="back-link">← Home</Link>
        <h1>History</h1>
        <p>Your recent on-chain interactions from this wallet on Sepolia.</p>
      </div>

      {!isConnected ? (
        <div className="history-empty">
          <span className="history-empty-icon">🔒</span>
          <p>Connect your wallet to see your transaction history.</p>
        </div>
      ) : loading ? (
        <div className="history-loading">
          <span className="spinner" />
          <span>Loading transactions…</span>
        </div>
      ) : error ? (
        <div className="history-empty">
          <span className="history-empty-icon">⚠</span>
          <p>{error}</p>
        </div>
      ) : txs.length === 0 ? (
        <div className="history-empty">
          <span className="history-empty-icon">📋</span>
          <p>No transactions found for this wallet on Sepolia.</p>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-wallet-row">
            <span className="history-wallet-label">Wallet</span>
            <a
              className="history-wallet-addr mono"
              href={explorerAddress(address!)}
              target="_blank"
              rel="noreferrer"
            >
              {address} ↗
            </a>
          </div>

          <div className="history-list">
            {txs.map((tx, i) => {
              const label = methodLabel(tx);
              const icon = methodIcon(label);
              const isIn = tx.to?.toLowerCase() === address?.toLowerCase();
              const failed = tx.isError === "1";
              return (
                <motion.div
                  key={tx.hash}
                  className={`history-row ${failed ? "history-row-failed" : ""}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <div className="history-row-icon">{icon}</div>
                  <div className="history-row-body">
                    <div className="history-row-top">
                      <span className="history-row-label">{label}</span>
                      {failed && <span className="badge badge-err">Failed</span>}
                      <span className="history-row-time">{timeAgo(tx.timeStamp)}</span>
                    </div>
                    <div className="history-row-sub">
                      {isIn ? (
                        <span className="history-addr-tag">From <span className="mono">{shortAddr(tx.from)}</span></span>
                      ) : (
                        <span className="history-addr-tag">To <span className="mono">{shortAddr(tx.to || "—")}</span></span>
                      )}
                      <span className="history-gas muted">· {Number(tx.gasUsed).toLocaleString()} gas</span>
                    </div>
                  </div>
                  <a
                    className="history-row-link"
                    href={explorerTx(tx.hash)}
                    target="_blank"
                    rel="noreferrer"
                    title="View on Etherscan"
                  >
                    ↗
                  </a>
                </motion.div>
              );
            })}
          </div>

          <div className="history-footer">
            <a
              className="btn btn-ghost btn-sm"
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noreferrer"
            >
              View all on Etherscan ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
