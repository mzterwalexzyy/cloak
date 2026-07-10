import { useEffect, useMemo, useState } from "react";
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
  input: string;
  timeStamp: string;
  isError: string;
  gasUsed: string;
  gasPrice: string;
  confirmations: string;
}

// Known 4-byte method selectors
const SELECTORS: Record<string, string> = {
  // Zama ERC-7984 (from on-chain txs)
  "0xbf376c7a": "Wrap",
  "0x5bb67a05": "Unwrap",
  "0x2fb74e62": "Confidential Send",
  // Standard ERC-20
  "0xa9059cbb": "Transfer",
  "0x23b872dd": "Transfer",
  "0x095ea7b3": "Approve",
  "0x40c10f19": "Mint",
  "0x1249c58b": "Mint",
  // Other wrap/unwrap variants
  "0xd0e30db0": "Wrap",
  "0x2e1a7d4d": "Unwrap",
  "0x441a3e70": "Unwrap",
  "0xf83d08ba": "Wrap",
  // Disperse
  "0x9e5d4c49": "Disperse",
  "0xc73a2d60": "Disperse",
};

function methodLabel(tx: EthTx): string {
  // 1. Try functionName first (Blockscout sometimes populates it)
  const fn = (tx.functionName ?? "").toLowerCase();
  if (fn.includes("wrap") && !fn.includes("unwrap")) return "Wrap";
  if (fn.includes("unwrap")) return "Unwrap";
  if (fn.includes("confidential") && fn.includes("transfer")) return "Confidential Send";
  if (fn.includes("disperse")) return "Disperse";
  if (fn.includes("transfer")) return "Transfer";
  if (fn.includes("mint")) return "Mint";
  if (fn.includes("approve")) return "Approve";
  if (fn.includes("register")) return "Register";

  // 2. Pure ETH transfer — no input data
  const input = (tx.input ?? tx.methodId ?? "");
  if (!input || input === "0x" || input === "") return "ETH Transfer";

  // 3. Match against known selectors from input prefix
  const selector = input.slice(0, 10).toLowerCase();
  if (SELECTORS[selector]) return SELECTORS[selector];

  // 4. Try methodId field
  const mid = (tx.methodId ?? "").toLowerCase();
  if (SELECTORS[mid]) return SELECTORS[mid];

  return "Contract Call";
}

function methodIcon(label: string): string {
  const icons: Record<string, string> = {
    "Wrap": "⬡", "Unwrap": "⬢", "Confidential Send": "🔐",
    "Transfer": "→", "Mint": "◉", "Approve": "✓",
    "Disperse": "⤢", "Register": "📋", "ETH Transfer": "Ξ", "Contract Call": "⚙",
  };
  return icons[label] ?? "⚙";
}

function timeAgo(ts: string): string {
  const diff = Math.floor(Date.now() / 1000) - Number(ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(ts: string): string {
  return new Date(Number(ts) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ACTION_TYPES = ["All Actions", "Wrap", "Unwrap", "Confidential Send", "Transfer", "Mint", "Approve", "Disperse", "Contract Call", "ETH Transfer"];
const STATUS_TYPES = ["All Status", "Success", "Failed"];

export function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [txs, setTxs] = useState<EthTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError("");
    fetch(`https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=100`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "1" && Array.isArray(data.result)) {
          setTxs(data.result as EthTx[]);
        } else if (data.message === "No transactions found") {
          setTxs([]);
        } else {
          setError(data.message ?? data.result ?? "Failed to load transactions.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load transaction history. Check your connection.");
        setLoading(false);
      });
  }, [address]);

  const outgoing = useMemo(() => txs.filter(t => t.from?.toLowerCase() === address?.toLowerCase()), [txs, address]);
  const successful = useMemo(() => txs.filter(t => t.isError !== "1").length, [txs]);
  const failed = useMemo(() => txs.filter(t => t.isError === "1").length, [txs]);
  const totalGasETH = useMemo(() => outgoing.reduce((acc, t) => acc + (Number(t.gasUsed) * Number(t.gasPrice)) / 1e18, 0), [outgoing]);
  const oldest = txs.length ? txs[txs.length - 1] : null;
  const successPct = txs.length ? ((successful / txs.length) * 100).toFixed(1) : "0";
  const failPct = txs.length ? ((failed / txs.length) * 100).toFixed(1) : "0";

  const dateRange = useMemo(() => {
    if (txs.length < 2) return "";
    return `${fmtDate(txs[txs.length - 1].timeStamp)} - ${fmtDate(txs[0].timeStamp)}`;
  }, [txs]);

  const filtered = useMemo(() => {
    setPage(1);
    return txs.filter(tx => {
      const label = methodLabel(tx);
      if (actionFilter !== "All Actions" && label !== actionFilter) return false;
      if (statusFilter === "Success" && tx.isError === "1") return false;
      if (statusFilter === "Failed" && tx.isError !== "1") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!tx.hash.toLowerCase().includes(q) && !tx.to?.toLowerCase().includes(q) &&
            !label.toLowerCase().includes(q) && !(tx.functionName ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [txs, actionFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function copyAddress() {
    navigator.clipboard.writeText(address ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function exportCSV() {
    const rows = [
      ["Type", "To", "Function", "Status", "Time", "Gas Used", "TX Hash"],
      ...filtered.map(tx => [
        methodLabel(tx), tx.to, (tx.functionName || "").split("(")[0],
        tx.isError === "1" ? "Failed" : "Success",
        new Date(Number(tx.timeStamp) * 1000).toISOString(),
        tx.gasUsed, tx.hash,
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `cloak-history-${address?.slice(0, 8)}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

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
        <div className="history-loading"><span className="spinner" /><span>Loading transactions…</span></div>
      ) : error ? (
        <div className="history-empty"><span className="history-empty-icon">⚠</span><p>{error}</p></div>
      ) : (
        <div className="history-content">

          {/* Wallet bar */}
          <div className="history-wallet-row">
            <span className="history-wallet-label">WALLET</span>
            <span className="history-wallet-addr mono">{address}</span>
            <button className="history-wallet-btn" onClick={copyAddress} title="Copy address">
              {copied ? "✓" : "⎘"}
            </button>
            <a className="history-wallet-btn" href={explorerAddress(address!)} target="_blank" rel="noreferrer" title="View on Blockscout">↗</a>
          </div>

          {/* Stats */}
          {txs.length > 0 && (
            <div className="history-stats-row">
              <div className="history-stat">
                <div className="history-stat-icon hist-pulse">⚡</div>
                <div className="history-stat-body">
                  <span className="history-stat-val">{txs.length}</span>
                  <span className="history-stat-label">Total Interactions</span>
                  <span className="history-stat-sub">Last 100 fetched</span>
                </div>
              </div>
              <div className="history-stat">
                <div className="history-stat-icon hist-success">✓</div>
                <div className="history-stat-body">
                  <span className="history-stat-val">{successful}</span>
                  <span className="history-stat-label">Successful</span>
                  <span className="history-stat-sub hist-green">{successPct}%</span>
                </div>
              </div>
              <div className="history-stat">
                <div className="history-stat-icon hist-fail">✕</div>
                <div className="history-stat-body">
                  <span className="history-stat-val">{failed}</span>
                  <span className="history-stat-label">Failed</span>
                  <span className="history-stat-sub hist-red">{failPct}%</span>
                </div>
              </div>
              <div className="history-stat">
                <div className="history-stat-icon hist-gas">⬡</div>
                <div className="history-stat-body">
                  <span className="history-stat-val">{totalGasETH.toFixed(4)} ETH</span>
                  <span className="history-stat-label">Total Gas Used</span>
                </div>
              </div>
              {oldest && (
                <div className="history-stat">
                  <div className="history-stat-icon hist-cal">📅</div>
                  <div className="history-stat-body">
                    <span className="history-stat-val">{fmtDate(oldest.timeStamp)}</span>
                    <span className="history-stat-label">First Interaction</span>
                    <span className="history-stat-sub">{timeAgo(oldest.timeStamp)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {txs.length === 0 ? (
            <div className="history-empty">
              <span className="history-empty-icon">📋</span>
              <p>No transactions found for this wallet on Sepolia.</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="history-toolbar">
                <div className="history-search-wrap">
                  <span className="history-search-icon">⌕</span>
                  <input
                    className="history-search"
                    placeholder="Search by tx hash, contract, or action..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select className="history-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                  {ACTION_TYPES.map(a => <option key={a}>{a}</option>)}
                </select>
                <select className="history-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  {STATUS_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
                {dateRange && <span className="history-date-range">📅 {dateRange}</span>}
                <button className="btn btn-ghost btn-sm" onClick={exportCSV}>↓ Export CSV</button>
              </div>

              {/* Table */}
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>TYPE</th>
                      <th>DETAILS</th>
                      <th>STATUS</th>
                      <th>TIME</th>
                      <th>GAS USED</th>
                      <th>TX HASH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((tx, i) => {
                      const label = methodLabel(tx);
                      const icon = methodIcon(label);
                      const isFailed = tx.isError === "1";
                      const isIn = tx.to?.toLowerCase() === address?.toLowerCase();
                      return (
                        <motion.tr
                          key={tx.hash}
                          className={`history-trow${isFailed ? " history-trow-failed" : ""}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.25) }}
                        >
                          <td>
                            <div className="history-type-cell">
                              <span className="history-type-icon">{icon}</span>
                              <span className="history-type-name">{label}</span>
                            </div>
                          </td>
                          <td>
                            <div className="history-details-cell">
                              <span className="mono">{isIn ? `From: ${shortAddr(tx.from)}` : `To: ${shortAddr(tx.to || "…")}`}</span>
                              {tx.functionName && <span className="history-fn-name">{tx.functionName.split("(")[0]}</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`history-badge ${isFailed ? "hist-badge-fail" : "hist-badge-ok"}`}>
                              ● {isFailed ? "Failed" : "Success"}
                            </span>
                          </td>
                          <td>
                            <div className="history-time-cell">
                              <span>{timeAgo(tx.timeStamp)}</span>
                              <span className="history-time-abs">{fmtDate(tx.timeStamp)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="history-gas-cell">{Number(tx.gasUsed).toLocaleString()} gas</span>
                          </td>
                          <td>
                            <div className="history-hash-cell">
                              <span className="mono">{tx.hash.slice(0, 8)}…{tx.hash.slice(-4)}</span>
                              <a href={explorerTx(tx.hash)} target="_blank" rel="noreferrer" className="history-ext-link">↗</a>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="history-empty" style={{ padding: "40px 0" }}>
                    <span className="history-empty-icon">🔍</span>
                    <p>No transactions match your filters.</p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="history-pagination">
                  <button
                    className="hist-page-btn hist-page-nav"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Previous
                  </button>
                  <div className="hist-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                        if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) =>
                        n === "…" ? (
                          <span key={`ellipsis-${i}`} className="hist-page-ellipsis">…</span>
                        ) : (
                          <button
                            key={n}
                            className={`hist-page-btn ${page === n ? "active" : ""}`}
                            onClick={() => setPage(n as number)}
                          >
                            {n}
                          </button>
                        )
                      )}
                  </div>
                  <button
                    className="hist-page-btn hist-page-nav"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
