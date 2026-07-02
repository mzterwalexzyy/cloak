import { Fragment, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function ConfirmModal({
  validCount,
  sym,
  total,
  onConfirm,
  onCancel,
}: {
  validCount: number;
  sym: string;
  total: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icon">🔐</div>
        <h3 className="modal-title">Ready to disperse</h3>
        <p className="modal-body">
          Sending <strong>{total} {sym}</strong> to <strong>{validCount} recipient{validCount !== 1 ? "s" : ""}</strong>.
        </p>
        <div className="modal-fhe-note">
          <strong>Why {validCount} wallet confirmation{validCount !== 1 ? "s" : ""}?</strong><br />
          FHE tokens encrypt each amount individually — every transfer needs its own unique
          ciphertext and your wallet's proof. This is a protocol requirement of ERC-7984
          confidential transfers, not a UI limitation. Simply click <em>Confirm</em> for each
          popup as it appears.
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Send {validCount} transfer{validCount !== 1 ? "s" : ""} →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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

  const [showConfirm, setShowConfirm] = useState(false);

  const validCount = rows.filter((r) => !r.parseError).length;
  const errorCount = rows.filter((r) => r.parseError).length;
  const sentCount = liveRows.filter((r) => r.status === "ok").length;
  const failCount = liveRows.filter((r) => r.status === "error").length;
  const sym = selectedPair ? displaySym(selectedPair.confidential.symbol) : "—";
  const totalAmt = rows.filter((r) => !r.parseError).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const progressPct = validCount > 0 ? Math.round((sentCount / validCount) * 100) : 0;

  const displayRows = isDone || isRunning ? liveRows : rows;

  function handleDisperseClick() {
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    setRows(rows);
    setTimeout(() => runDisperse(
      selectedPair.confidentialTokenAddress,
      selectedPair.confidential.decimals,
    ), 0);
  }

  return (
    <>
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            validCount={validCount}
            sym={sym}
            total={totalAmt.toFixed(4)}
            onConfirm={handleConfirm}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>

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
                {errorCount > 0 && <span className="err-badge">{errorCount} skipped</span>}
              </div>
            )}

            {isRunning && (
              <div className="disperse-progress">
                <div className="dp-bar-wrap">
                  <div className="dp-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="dp-label">Sending {sentCount} of {validCount} — confirm each wallet popup</span>
              </div>
            )}

            <ActionButton
              ready={validCount > 0 && !isRunning && !isDone}
              readyHint={rows.length === 0 ? "Add recipients above" : validCount === 0 ? "Fix errors above" : undefined}
              pending={isRunning}
              pendingText={`Sending… ${sentCount}/${validCount}`}
              label={`Disperse ${sym} to ${validCount} recipient${validCount !== 1 ? "s" : ""}`}
              onAction={handleDisperseClick}
            />

            {isDone && (
              <div className={`dc-done-banner ${failCount > 0 || errorCount > 0 ? "partial" : "success"}`}>
                <div className="done-counts">
                  <span className="done-count ok">{sentCount} sent</span>
                  {errorCount > 0 && <span className="done-count skip">{errorCount} skipped</span>}
                  {failCount > 0 && <span className="done-count fail">{failCount} failed</span>}
                </div>
                <p className="done-sub">
                  {failCount === 0 && errorCount === 0
                    ? "All transfers sent confidentially."
                    : errorCount > 0 && failCount === 0
                    ? "Skipped rows had invalid addresses — see reasons in the table."
                    : "See the results table for skipped and failed rows."}
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  setRows([]);
                  setRawText("");
                }}>
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
                      <Fragment key={row.id}>
                        <tr className={row.parseError ? "row-err" : row.status === "ok" ? "row-ok" : row.status === "error" ? "row-fail" : ""}>
                          <td className="mono muted">{i + 1}</td>
                          <td className="mono">{shortAddr(row.address || "—")}</td>
                          <td className="mono">{row.amount || "—"} {!row.parseError ? sym : ""}</td>
                          <td>
                            {row.parseError ? (
                              <span className="badge badge-skip">skipped</span>
                            ) : row.status === "ok" ? (
                              <span className="badge badge-ok">
                                {row.txHash
                                  ? <a href={explorerTx(row.txHash)} target="_blank" rel="noreferrer">sent ↗</a>
                                  : "sent ✓"}
                              </span>
                            ) : row.status === "error" ? (
                              <span className="badge badge-err">failed</span>
                            ) : row.status === "pending" ? (
                              <span className="badge badge-pending"><span className="spinner" /> sending</span>
                            ) : (
                              <span className="badge badge-idle">queued</span>
                            )}
                          </td>
                        </tr>
                        {(row.parseError || row.errMsg) && (
                          <tr className="row-reason">
                            <td />
                            <td colSpan={3} className="row-reason-text">
                              {row.parseError ?? row.errMsg}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {displayRows.length > 0 && !isRunning && !isDone && (
              <div className="dc-total">
                Total: <strong>{totalAmt.toFixed(4)} {sym}</strong> across {validCount} recipients
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
