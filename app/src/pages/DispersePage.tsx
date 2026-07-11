import { Fragment, useRef, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { useDisperse, parseRecipientText } from "../hooks/useDisperse";
import { PairSelect } from "../components/PairSelect";
import { displaySym, shortAddr, explorerTx } from "../lib/format";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { CLOAK_DISPERSE_ADDRESS } from "../lib/disperseContract";

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
        <div className="modal-icon">🚀</div>
        <h3 className="modal-title">Batch dispatch V2</h3>
        <p className="modal-body">
          Sending <strong>{total} {sym}</strong> to <strong>{validCount} recipient{validCount !== 1 ? "s" : ""}</strong> in a single transaction.
        </p>
        <div className="modal-fhe-note">
          <strong>How V2 batch dispatch works:</strong><br />
          All {validCount} encrypted amounts are packed into one ZK proof. Your wallet signs
          once, and all transfers settle in a single on-chain transaction — no repeated popups.
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Dispatch {validCount} →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function DispersePage() {
  const { data } = useRegistryPairs();
  const zama = useZamaSdk();
  const { isConnected } = useAccount();
  const pairs = useMemo(() => data?.items ?? [], [data]);

  const [selectedAddr, setSelectedAddr] = useState("");
  const selectedPair = pairs.find((p) => p.confidentialTokenAddress === selectedAddr) ?? pairs[0];

  const [importMode, setImportMode] = useState<ImportMode>("paste");
  const [rawText, setRawText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = useMemo(() => parseRecipientText(rawText), [rawText]);

  const {
    disperseStatus,
    batchTxHash,
    isOperator,
    runDisperse,
    approveOperator,
    checkIsOperator,
    rows: liveRows,
    reset,
  } = useDisperse(zama);

  const isRunning = disperseStatus === "approving" || disperseStatus === "encrypting" || disperseStatus === "sending";
  const isDone = disperseStatus === "done";

  const [showConfirm, setShowConfirm] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [disperseError, setDisperseError] = useState<string | null>(null);

  const validCount = rows.filter((r) => !r.parseError).length;
  const errorCount = rows.filter((r) => r.parseError).length;
  const sentCount = liveRows.filter((r) => r.status === "ok").length;
  const failCount = liveRows.filter((r) => r.status === "error").length;
  const sym = selectedPair ? displaySym(selectedPair.confidential.symbol) : "...";
  const totalAmt = rows.filter((r) => !r.parseError).reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const displayRows = isDone || isRunning ? liveRows : rows;
  const isDeployed = CLOAK_DISPERSE_ADDRESS.startsWith("0x");

  // Check operator status whenever connected wallet or selected token changes
  useEffect(() => {
    if (isConnected && selectedPair && isDeployed) {
      checkIsOperator(selectedPair.confidentialTokenAddress);
    }
  }, [isConnected, selectedPair?.confidentialTokenAddress, isDeployed, checkIsOperator]);

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

  async function handleApprove() {
    if (!selectedPair) return;
    setApproveError(null);
    try {
      await approveOperator(selectedPair.confidentialTokenAddress);
    } catch (e) {
      setApproveError(e instanceof Error ? e.message.slice(0, 120) : String(e));
    }
  }

  async function handleConfirm() {
    setShowConfirm(false);
    setDisperseError(null);
    try {
      await runDisperse(
        selectedPair.confidentialTokenAddress,
        selectedPair.confidential.decimals,
        rows,
      );
    } catch (e) {
      setDisperseError(e instanceof Error ? e.message.slice(0, 180) : String(e));
    }
  }

  function statusLabel() {
    switch (disperseStatus) {
      case "approving":   return "Approving operator…";
      case "encrypting":  return "Generating batch ZK proof…";
      case "sending":     return "Submitting transaction…";
      default:            return "";
    }
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
        <div className="ds-hero">
          <img src="/disperse-hero.png" alt="" className="ds-hero-img ds-hero-img-dark" aria-hidden />
          <img src="/disperse-hero-light.png" alt="" className="ds-hero-img ds-hero-img-light" aria-hidden />
          <div className="ds-hero-content">
            <Link to="/" className="btn btn-ghost btn-sm ad-back-btn">← Home</Link>
            <div className="ad-hero-badge">◫ Confidential Disperse</div>
            <h1 className="ad-hero-title">Disperse</h1>
            <p className="ad-hero-sub">Send FHE-encrypted tokens to multiple addresses in one transaction.</p>
          </div>
        </div>

        {/* V2 badge */}
        <div className="ds-v2-banner">
          <span className="ds-v2-pill">V2</span>
          <span className="ds-v2-text">Batch dispatch — N recipients, 1 signature, 1 transaction</span>
        </div>

        {/* Operator approval step */}
        {isConnected && isDeployed && isOperator === false && (
          <motion.div
            className="ds-operator-step"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="ds-op-icon">🔑</div>
            <div className="ds-op-body">
              <strong>One-time setup required</strong>
              <p>Approve the Cloak Disperse contract as an operator on this token so it can batch-send on your behalf.</p>
              {approveError && <p className="ds-op-error">{approveError}</p>}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleApprove}
              disabled={disperseStatus === "approving"}
            >
              {disperseStatus === "approving" ? "Approving…" : "Approve Disperse Contract"}
            </button>
          </motion.div>
        )}

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

            {isOperator === true && (
              <div className="ds-op-approved">
                <span>✓</span> Disperse contract approved as operator
              </div>
            )}

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

            {rows.length > 0 && (
              <div className="dc-parse-summary">
                <span className="ok-badge">{validCount} valid</span>
                {errorCount > 0 && <span className="err-badge">{errorCount} skipped</span>}
              </div>
            )}

            {isRunning && (
              <div className="disperse-progress">
                <div className="dp-bar-wrap">
                  <div className="dp-bar dp-bar-animate" />
                </div>
                <span className="dp-label">{statusLabel()}</span>
              </div>
            )}

            {disperseError && (
              <div className="dc-error-banner">{disperseError}</div>
            )}

            {!isDone && (
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 12 }}
                disabled={validCount === 0 || isRunning || isOperator === false || !isDeployed}
                onClick={() => setShowConfirm(true)}
              >
                {!isDeployed
                  ? "Contract deploying…"
                  : isOperator === false
                  ? "Approve operator first"
                  : isRunning
                  ? statusLabel()
                  : `Batch dispatch (${validCount})`}
              </button>
            )}

            {isDone && (
              <div className={`dc-done-banner ${failCount > 0 || errorCount > 0 ? "partial" : "success"}`}>
                <div className="done-counts">
                  <span className="done-count ok">{sentCount} sent</span>
                  {errorCount > 0 && <span className="done-count skip">{errorCount} skipped</span>}
                  {failCount > 0 && <span className="done-count fail">{failCount} failed</span>}
                </div>
                {batchTxHash && (
                  <a
                    href={explorerTx(batchTxHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="done-tx-link"
                  >
                    View batch tx ↗
                  </a>
                )}
                <p className="done-sub">
                  {failCount === 0 && errorCount === 0
                    ? "All transfers sent in one confidential transaction."
                    : "See the results table for details."}
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => { reset(); setRawText(""); setDisperseError(null); }}>
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
                <span className="disperse-preview-count">{validCount} recipients</span>
              )}
            </div>

            {validCount > 0 && !isRunning && !isDone && (
              <div className="disperse-summary-card">
                <div className="dsc-item">
                  <span className="dsc-label">Recipients</span>
                  <span className="dsc-val">{validCount}</span>
                </div>
                <div className="dsc-divider" />
                <div className="dsc-item">
                  <span className="dsc-label">Total amount</span>
                  <span className="dsc-val">{totalAmt.toFixed(4)} <span className="dsc-sym">{sym}</span></span>
                </div>
                <div className="dsc-divider" />
                <div className="dsc-item">
                  <span className="dsc-label">Transactions</span>
                  <span className="dsc-val dsc-highlight">1 (V2 batch)</span>
                </div>
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
                      <th>#</th>
                      <th>Address</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, idx) => (
                      <Fragment key={row.id}>
                        <tr className={row.parseError ? "row-err" : row.status === "ok" ? "row-ok" : row.status === "error" ? "row-fail" : ""}>
                          <td className="mono muted">{idx + 1}</td>
                          <td className="mono">{shortAddr(row.address || "...")}</td>
                          <td className="mono">{row.amount || "..."} {!row.parseError ? sym : ""}</td>
                          <td>
                            {row.parseError ? (
                              <span className="badge badge-skip">skipped</span>
                            ) : row.status === "ok" ? (
                              <span className="badge badge-ok">
                                {row.txHash
                                  ? <a href={explorerTx(row.txHash)} target="_blank" rel="noreferrer">OK ↗</a>
                                  : "OK"}
                              </span>
                            ) : row.status === "error" ? (
                              <span className="badge badge-err">failed</span>
                            ) : row.status === "pending" ? (
                              <span className="badge badge-pending"><span className="spinner" /> batch tx</span>
                            ) : (
                              <span className="badge badge-idle">queued</span>
                            )}
                          </td>
                        </tr>
                        {(row.parseError || row.errMsg) && (
                          <tr className="row-reason">
                            <td colSpan={4} className="row-reason-text">{row.parseError ?? row.errMsg}</td>
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
              ⓘ V2: All amounts packed into one ZK proof. One transaction, one signature.
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
