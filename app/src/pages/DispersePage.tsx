import { Fragment, useRef, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { useDisperse, parseRecipientText } from "../hooks/useDisperse";
import { ActionButton } from "../components/ActionButton";
import { PairSelect } from "../components/PairSelect";
import { displaySym, shortAddr, explorerTx } from "../lib/format";
import { Link } from "react-router-dom";

type ImportMode = "csv" | "paste";

async function parseCsvFile(file: File): Promise<string> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  return lines.join("\n");
}

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

  const [importMode, setImportMode] = useState<ImportMode>("paste");
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [rawText, setRawText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
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

  async function handleFile(file: File) {
    const text = await parseCsvFile(file);
    setRawText(text);
    setImportMode("paste");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
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

      <div className="disperse-page">
        <div className="disperse-page-head">
          <Link to="/" className="back-link">← Home</Link>
          <h1>Disperse</h1>
          <p>Send FHE-encrypted tokens to multiple addresses in one session.</p>
        </div>

        <div className="disperse-layout">
          {/* ── Left: inputs ── */}
          <motion.div
            className="disperse-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="dc-section">
              <label className="dc-label">Token to disperse</label>
              <PairSelect
                pairs={pairs}
                value={selectedPair?.confidentialTokenAddress ?? ""}
                onChange={setSelectedAddr}
                mode="confidential"
              />
            </div>

            <div className="dc-section">
              <label className="dc-label">Import method</label>
              <div className="disperse-method-tabs">
                <button className={`dmt-btn ${importMode === "csv" ? "active" : ""}`} onClick={() => setImportMode("csv")}>CSV</button>
                <button className={`dmt-btn ${importMode === "paste" ? "active" : ""}`} onClick={() => setImportMode("paste")}>Paste</button>
                {rawText && <button className="dmt-btn dmt-done" onClick={() => setRawText("")}>Clear</button>}
              </div>
            </div>

            {importMode === "csv" ? (
              <div
                className="disperse-drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <span className="ddz-icon">📂</span>
                <p>Drop CSV file here</p>
                <p className="ddz-sub">or click to browse</p>
              </div>
            ) : (
              <div className="dc-section">
                <textarea
                  className="dc-textarea"
                  rows={9}
                  placeholder={PLACEHOLDER_TEXT}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  disabled={isRunning}
                  spellCheck={false}
                />
              </div>
            )}

            <div className="disperse-format-row">
              <span className="dc-label">Format</span>
              <code className="disperse-format-code">Address,Amount</code>
            </div>

            <div className="disperse-options-row">
              <span className="dc-label">Options</span>
              <label className="disperse-toggle-label">
                <span>Skip invalid rows</span>
                <button
                  className={`disperse-toggle ${skipInvalid ? "on" : ""}`}
                  onClick={() => setSkipInvalid((v) => !v)}
                  type="button"
                  aria-pressed={skipInvalid}
                />
              </label>
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
              readyHint={rows.length === 0 ? "Add recipients above" : "Fix errors above"}
              pending={isRunning}
              pendingText={`Sending… ${sentCount}/${validCount}`}
              label={`Approve ${sym}`}
              onAction={() => setShowConfirm(true)}
            />
            {validCount > 0 && !isRunning && !isDone && (
              <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={() => setShowConfirm(true)}>
                Send all ({validCount})
              </button>
            )}

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
                    : "See the results table for skipped and failed rows."}
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => { setRows([]); setRawText(""); }}>
                  New disperse
                </button>
              </div>
            )}
          </motion.div>

          {/* ── Right: preview/results ── */}
          <motion.div
            className="disperse-right"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <div className="disperse-preview-head">
              <span className="dc-label">{isDone || isRunning ? "Results" : "Preview"}</span>
              {displayRows.length > 0 && !isRunning && !isDone && (
                <span className="disperse-preview-count">— {validCount} recipients</span>
              )}
            </div>

            {isRunning && (
              <div className="disperse-progress" style={{ marginBottom: 12 }}>
                <div className="dp-bar-wrap">
                  <div className="dp-bar" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="dp-label">{sentCount} / {validCount} sent</span>
              </div>
            )}

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
                      <th>Address</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row) => (
                      <Fragment key={row.id}>
                        <tr className={row.parseError ? "row-err" : row.status === "ok" ? "row-ok" : row.status === "error" ? "row-fail" : ""}>
                          <td className="mono">{shortAddr(row.address || "—")}</td>
                          <td className="mono">{row.amount || "—"} {!row.parseError ? sym : ""}</td>
                          <td>
                            {row.parseError ? (
                              <span className="badge badge-skip">skipped</span>
                            ) : row.status === "ok" ? (
                              <span className="badge badge-ok">
                                {row.txHash ? <a href={explorerTx(row.txHash)} target="_blank" rel="noreferrer">OK ↗</a> : "OK"}
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
                            <td colSpan={3} className="row-reason-text">{row.parseError ?? row.errMsg}</td>
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
                Total: <strong>{totalAmt.toFixed(4)} {sym}</strong> to {validCount} addresses
              </div>
            )}

            <div className="disperse-footer-note">
              ⓘ Encrypted transfers. Balances remain hidden.
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
