import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { useDisperse, parseRecipientText } from "../hooks/useDisperse";
import { ActionButton } from "../components/ActionButton";
import { PairSelect } from "../components/PairSelect";
import { displaySym, shortAddr, explorerTx } from "../lib/format";
import { Link } from "react-router-dom";

const PLACEHOLDER_TEXT = `# Paste one recipient per line: address, amount
0xAbCd...1234, 50
0xEfGh...5678, 120.5
0xIjKl...9012, 75`;

export function DispersePage() {
  const { data } = useRegistryPairs();
  const zama = useZamaSdk();
  const pairs = useMemo(() => data?.items ?? [], [data]);

  const [selectedAddr, setSelectedAddr] = useState("");
  const selectedPair = pairs.find((p) => p.confidentialTokenAddress === selectedAddr) ?? pairs[0];

  const [rawText, setRawText] = useState("");
  const rows = useMemo(() => parseRecipientText(rawText), [rawText]);

  const { disperseStatus, runDisperse, rows: liveRows, setRows } = useDisperse(zama);
  const isRunning = disperseStatus === "running";
  const isDone = disperseStatus === "done";

  // Sync parsed rows into the hook before executing
  function handleDisperse() {
    setRows(rows);
    // slight tick so state settles
    setTimeout(() => runDisperse(
      selectedPair.confidentialTokenAddress,
      selectedPair.confidential.decimals,
    ), 0);
  }

  const validCount = rows.filter((r) => !r.parseError).length;
  const errorCount = rows.filter((r) => r.parseError).length;
  const sentCount = liveRows.filter((r) => r.status === "ok").length;
  const failCount = liveRows.filter((r) => r.status === "error").length;
  const sym = selectedPair ? displaySym(selectedPair.confidential.symbol) : "—";

  const displayRows = isDone || isRunning ? liveRows : rows;

  return (
    <div className="distrib-page">
      <div className="distrib-header">
        <Link to="/" className="back-link">← Home</Link>
        <div>
          <div className="distrib-kicker">Confidential Distribution</div>
          <h1 className="distrib-title">Disperse</h1>
          <p className="distrib-sub">
            Send confidential ERC-7984 tokens to multiple recipients in one session.
            Amounts are encrypted — recipients see what they received, no one else does.
          </p>
        </div>
      </div>

      <div className="distrib-layout">
        {/* ── Left: inputs ── */}
        <motion.div
          className="distrib-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="dc-section">
            <label className="dc-label">Confidential token</label>
            <PairSelect
              pairs={pairs}
              value={selectedPair?.confidentialTokenAddress ?? ""}
              onChange={setSelectedAddr}
            />
            {selectedPair && (
              <div className="dc-hint">
                Sending <strong>{sym}</strong> — balances encrypted on-chain
              </div>
            )}
          </div>

          <div className="dc-section">
            <label className="dc-label">
              Recipients
              <span className="dc-label-meta">one per line · <code>address, amount</code></span>
            </label>
            <textarea
              className="dc-textarea"
              rows={10}
              placeholder={PLACEHOLDER_TEXT}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isRunning}
              spellCheck={false}
            />
          </div>

          {rows.length > 0 && (
            <div className="dc-parse-summary">
              <span className="ok-badge">{validCount} valid</span>
              {errorCount > 0 && <span className="err-badge">{errorCount} errors</span>}
            </div>
          )}

          <ActionButton
            ready={validCount > 0 && !isRunning && !isDone}
            readyHint={rows.length === 0 ? "Add recipients above" : "Fix errors above"}
            pending={isRunning}
            pendingText={`Sending… (${sentCount}/${validCount})`}
            label={`Disperse ${sym} to ${validCount} recipient${validCount !== 1 ? "s" : ""}`}
            onAction={handleDisperse}
          />

          {isDone && (
            <div className={`dc-done-banner ${failCount > 0 ? "partial" : "success"}`}>
              {failCount === 0
                ? `✓ All ${sentCount} transfers sent confidentially`
                : `⚠ ${sentCount} sent, ${failCount} failed — check results`}
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setRows([]);
                setRawText("");
              }} style={{ marginLeft: 12 }}>
                New disperse
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Right: preview/results table ── */}
        <motion.div
          className="distrib-card results-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <div className="dc-label">
            {isDone || isRunning ? "Results" : "Preview"}
          </div>

          {displayRows.length === 0 ? (
            <div className="dc-empty">
              <span>📋</span>
              <p>Paste recipient addresses and amounts on the left to preview them here.</p>
            </div>
          ) : (
            <div className="dc-table-wrap">
              <table className="dc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Address</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr key={row.id} className={row.parseError ? "row-err" : row.status === "ok" ? "row-ok" : row.status === "error" ? "row-fail" : ""}>
                      <td className="mono muted">{i + 1}</td>
                      <td className="mono">{shortAddr(row.address)}</td>
                      <td className="mono">{row.amount} {sym}</td>
                      <td>
                        {row.parseError ? (
                          <span className="badge badge-err" title={row.parseError}>invalid</span>
                        ) : row.status === "ok" ? (
                          <span className="badge badge-ok">
                            {row.txHash
                              ? <a href={explorerTx(row.txHash)} target="_blank" rel="noreferrer">sent ↗</a>
                              : "sent ✓"}
                          </span>
                        ) : row.status === "error" ? (
                          <span className="badge badge-err" title={row.errMsg}>failed</span>
                        ) : row.status === "pending" ? (
                          <span className="badge badge-pending"><span className="spinner" /> sending</span>
                        ) : (
                          <span className="badge badge-idle">queued</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {displayRows.length > 0 && !isRunning && !isDone && (
            <div className="dc-total">
              Total: <strong>{rows.filter((r) => !r.parseError).reduce((s, r) => s + (Number(r.amount) || 0), 0).toFixed(4)} {sym}</strong> across {validCount} recipients
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
