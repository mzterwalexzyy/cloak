import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { read as xlsxRead, utils as xlsxUtils } from "xlsx";
import { usePublicClient, useWalletClient } from "wagmi";
import { type Address, parseEther } from "viem";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { ActionButton } from "../components/ActionButton";
import { PairSelect } from "../components/PairSelect";
import { parseRecipientText } from "../hooks/useDisperse";
import { airdropStore, type AirdropCampaign, type AirdropRecipient } from "../lib/airdropStore";
import { fetchDuneQuery, DUNE_KEY_STORAGE, type DuneRow } from "../lib/duneImport";
import { displaySym, shortAddr, explorerTx, toBaseUnits } from "../lib/format";
import { useDeployAirdrop, fetchClaimEvents } from "../hooks/useCloakAirdrop";

type Tab = "create" | "campaigns";
type ImportMode = "paste" | "file" | "dune";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message.slice(0, 200) : String(e);
}
function statusLabel(s: AirdropCampaign["status"]) {
  return s === "draft" ? "Draft" : s === "executing" ? "Executing…" : "Complete";
}
function statusCls(s: AirdropCampaign["status"]) {
  return s === "draft" ? "badge-idle" : s === "executing" ? "badge-pending" : "badge-ok";
}
function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── File import (CSV / Excel) ─────────────────────────────────────────────────

async function parseFile(file: File): Promise<{ address: string; amount: string }[]> {
  const buf = await file.arrayBuffer();
  const wb = xlsxRead(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, unknown>[] = xlsxUtils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length) throw new Error("File is empty");

  const keys = Object.keys(rows[0]);
  const addrKey = keys.find((k) => /addr|wallet|user|recipient/i.test(k)) ?? keys[0];
  const amtKey = keys.find((k) => /amount|amt|allocation|value/i.test(k));

  return rows
    .map((r) => ({
      address: String(r[addrKey] ?? "").trim(),
      amount: amtKey ? String(r[amtKey] ?? "").trim() : "",
    }))
    .filter((r) => /^0x[0-9a-fA-F]{40}$/.test(r.address));
}

// ── Dune import panel ─────────────────────────────────────────────────────────

const EXAMPLE_SQL = `-- Wallets that interacted with USDC (ERC-20) on Ethereum mainnet
-- Swap the hex address for any contract you want to target
-- Required output column: address   Optional: tx_count, volume
SELECT
  bytearray_to_varchar("from") AS address,
  COUNT(*) AS tx_count,
  SUM(CAST(value AS double) / 1e18) AS volume
FROM ethereum.transactions
WHERE "to" = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
  AND block_time >= now() - interval '90' day
  AND success = true
GROUP BY 1
ORDER BY tx_count DESC
LIMIT 10000`;

function DunePanel({ onImport }: { onImport: (rows: { address: string; amount: string }[]) => void }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(DUNE_KEY_STORAGE) ?? "");
  const [queryId, setQueryId] = useState("");
  const [minTx, setMinTx] = useState("1");
  const [minVol, setMinVol] = useState("0");
  const [defAmt, setDefAmt] = useState("100");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [rows, setRows] = useState<DuneRow[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [sqlCopied, setSqlCopied] = useState(false);

  const filtered = rows.filter(
    (r) =>
      (r.tx_count === undefined || r.tx_count >= Number(minTx)) &&
      (r.volume === undefined || r.volume >= Number(minVol)),
  );

  async function fetch() {
    if (!apiKey.trim() || !queryId.trim()) { setErrorMsg("Enter both API key and query ID."); return; }
    setStatus("loading");
    setErrorMsg("");
    localStorage.setItem(DUNE_KEY_STORAGE, apiKey.trim());
    try {
      const res = await fetchDuneQuery(apiKey.trim(), queryId.trim());
      setRows(res.rows);
      setStatus("done");
    } catch (e) {
      setErrorMsg(errMsg(e));
      setStatus("error");
    }
  }

  function doImport() {
    onImport(filtered.map((r) => ({ address: r.address, amount: defAmt })));
  }

  return (
    <div className="dune-panel">
      <div className="dune-header">
        <div className="dune-header-top">
          <span className="dune-logo">◈ Dune Analytics</span>
          <div className="dune-header-actions">
            <a
              className="btn btn-ghost btn-xs"
              href="https://dune.com/queries/new"
              target="_blank"
              rel="noreferrer"
            >
              Create query ↗
            </a>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => {
                navigator.clipboard.writeText(EXAMPLE_SQL);
                setSqlCopied(true);
                setTimeout(() => setSqlCopied(false), 2000);
              }}
            >
              {sqlCopied ? "Copied!" : "Copy example SQL"}
            </button>
          </div>
        </div>
        <p className="dune-desc">
          Run a Dune query returning an <code>address</code> column (+ optional <code>tx_count</code> / <code>volume</code>),
          then paste your API key and query ID below.
        </p>
      </div>

      <div className="dune-fields">
        <div className="dc-section">
          <label className="dc-label">API key</label>
          <input
            className="dc-input mono-input"
            type="password"
            placeholder="from dune.com/settings/api"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="dc-section">
          <label className="dc-label">
            Query ID
            <span className="dc-label-meta"> — number in Dune URL</span>
          </label>
          <input
            className="dc-input"
            placeholder="e.g. 4521938"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
          />
        </div>
      </div>

      <div className="dune-filters">
        <div className="dc-section">
          <label className="dc-label">Min tx count</label>
          <input className="dc-input" type="number" min="0" value={minTx} onChange={(e) => setMinTx(e.target.value)} />
        </div>
        <div className="dc-section">
          <label className="dc-label">Min vol (USD)</label>
          <input className="dc-input" type="number" min="0" value={minVol} onChange={(e) => setMinVol(e.target.value)} />
        </div>
        <div className="dc-section">
          <label className="dc-label">Amount each</label>
          <input className="dc-input" type="number" min="0" value={defAmt} onChange={(e) => setDefAmt(e.target.value)} />
        </div>
      </div>

      {errorMsg && <div className="tx-line err">{errorMsg}</div>}

      {status === "done" && rows.length > 0 && (
        <div className="dune-results">
          <div className="dc-parse-summary">
            <span className="ok-badge">{rows.length} fetched</span>
            {rows.length !== filtered.length && <span className="muted">→ {filtered.length} after filters</span>}
          </div>
          <div className="dc-table-wrap" style={{ maxHeight: 180, overflowY: "auto" }}>
            <table className="dc-table">
              <thead><tr><th>Address</th><th>Txs</th><th>Vol</th></tr></thead>
              <tbody>
                {filtered.slice(0, 50).map((r) => (
                  <tr key={r.address}>
                    <td className="mono">{shortAddr(r.address)}</td>
                    <td className="mono">{r.tx_count ?? "—"}</td>
                    <td className="mono">{r.volume !== undefined ? `$${r.volume.toLocaleString()}` : "—"}</td>
                  </tr>
                ))}
                {filtered.length > 50 && (
                  <tr><td colSpan={3} className="muted" style={{ textAlign: "center" }}>+{filtered.length - 50} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dune-actions">
        <button className="btn btn-ghost btn-sm" disabled={status === "loading"} onClick={fetch}>
          {status === "loading" ? <><span className="spinner" /> Fetching…</> : "Fetch from Dune →"}
        </button>
        {status === "done" && filtered.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={doImport}>
            Import {filtered.length} addresses
          </button>
        )}
      </div>
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({ pairs, onCreated }: {
  pairs: Parameters<typeof PairSelect>[0]["pairs"];
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedAddr, setSelectedAddr] = useState("");
  const [startDate, setStartDate] = useState(todayPlus(0));
  const [deadline, setDeadline] = useState(todayPlus(7));
  const [mode, setMode] = useState<"push" | "claim">("push");
  const [claimLimit, setClaimLimit] = useState("");
  const [feeMode, setFeeMode] = useState<"free" | "paid">("free");
  const [claimFeeEth, setClaimFeeEth] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("paste");
  const [rawText, setRawText] = useState("");
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedPair = useMemo(
    () => (pairs as any[]).find((p: any) => p.confidentialTokenAddress === selectedAddr) ?? (pairs as any[])[0],
    [pairs, selectedAddr],
  );

  const rows = useMemo(() => parseRecipientText(rawText), [rawText]);
  const validRows = rows.filter((r) => !r.parseError);
  const sym = selectedPair ? displaySym(selectedPair.confidential.symbol) : "—";

  async function handleFile(file: File) {
    setFileError("");
    try {
      const parsed = await parseFile(file);
      if (!parsed.length) { setFileError("No valid addresses found in file."); return; }
      const noAmt = parsed.filter((r) => !r.amount);
      const lines = parsed.map((r) => `${r.address}${r.amount ? `, ${r.amount}` : ", 0"}`).join("\n");
      setRawText(lines);
      setImportMode("paste");
      if (noAmt.length) setFileError(`${noAmt.length} rows had no amount column — set to 0. Edit below.`);
    } catch (e) {
      setFileError(errMsg(e));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDuneImport(imported: { address: string; amount: string }[]) {
    const lines = imported.map((r) => `${r.address}, ${r.amount}`).join("\n");
    setRawText(lines);
    setImportMode("paste");
  }

  function handleCreate() {
    if (!name.trim()) { setFormError("Give your campaign a name."); return; }
    if (!selectedPair) { setFormError("Select a token."); return; }
    if (validRows.length === 0) { setFormError("Add at least one valid recipient."); return; }
    setFormError("");

    const recipients: AirdropRecipient[] = validRows.map((r) => ({
      address: r.address,
      amount: r.amount,
      status: "pending",
    }));

    const c = airdropStore.create({
      name: name.trim(),
      description: desc.trim(),
      tokenAddress: selectedPair.confidentialTokenAddress,
      tokenSymbol: selectedPair.confidential.symbol,
      tokenDecimals: selectedPair.confidential.decimals,
      underlyingSymbol: selectedPair.underlying.symbol,
      startDate,
      deadline,
      recipients,
      mode,
      claimLimit: claimLimit ? Number(claimLimit) : undefined,
      claimFeeEth: claimFeeEth || undefined,
    });
    onCreated(c.id);
  }

  const NAME_MAX = 60;
  const DESC_MAX = 140;

  return (
    <div className="airdrop-create">
      {/* ── Campaign meta ── */}
      <div className="dc-section">
        <div className="dc-label-row">
          <label className="dc-label">Campaign name</label>
          <span className={`char-counter ${name.length >= NAME_MAX ? "at" : name.length >= NAME_MAX * 0.85 ? "near" : ""}`}>
            {name.length}/{NAME_MAX}
          </span>
        </div>
        <input
          className="dc-input"
          placeholder="e.g. Season 1 Community Airdrop"
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="dc-section">
        <div className="dc-label-row">
          <label className="dc-label">Description <span className="dc-label-meta">(optional)</span></label>
          <span className={`char-counter ${desc.length >= DESC_MAX ? "at" : desc.length >= DESC_MAX * 0.85 ? "near" : ""}`}>
            {desc.length}/{DESC_MAX}
          </span>
        </div>
        <input
          className="dc-input"
          placeholder="Reward early community members with confidential tokens"
          maxLength={DESC_MAX}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      {/* ── Distribution mode ── */}
      <div className="dc-section">
        <label className="dc-label">Distribution mode</label>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "push" ? "active" : ""}`}
            onClick={() => setMode("push")}
            type="button"
          >
            <span className="mode-icon">⚡</span>
            <span>
              <strong>Send Now</strong>
              <span className="mode-desc">You push tokens to all addresses directly</span>
            </span>
          </button>
          <button
            className={`mode-btn ${mode === "claim" ? "active" : ""}`}
            onClick={() => setMode("claim")}
            type="button"
          >
            <span className="mode-icon">🔗</span>
            <span>
              <strong>Claim Link</strong>
              <span className="mode-desc">Users claim themselves via a shareable link</span>
            </span>
          </button>
        </div>
        {mode === "claim" && (
          <div className="dc-hint" style={{ marginTop: 8 }}>
            A smart contract enforces FCFS order and the deadline on-chain. You deploy it once,
            share the link, then send FHE tokens to whoever claimed.
          </div>
        )}
      </div>

      <div className="ac-row">
        <div className="dc-section">
          <label className="dc-label">Start date</label>
          <input className="dc-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="dc-section">
          <label className="dc-label">{mode === "claim" ? "Claim deadline (on-chain)" : "Claim deadline"}</label>
          <input className="dc-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>

      {mode === "claim" && (
        <div className="ac-row">
          <div className="dc-section">
            <label className="dc-label">
              FCFS limit
              <span className="dc-label-meta"> — blank = unlimited</span>
            </label>
            <input
              className="dc-input"
              type="number"
              min="1"
              maxLength={7}
              placeholder="e.g. 500"
              value={claimLimit}
              onChange={(e) => setClaimLimit(e.target.value)}
            />
          </div>
          <div className="dc-section">
            <label className="dc-label">Claim fee</label>
            <div className="seg">
              <button
                className={`seg-btn ${feeMode === "free" ? "active" : ""}`}
                onClick={() => { setFeeMode("free"); setClaimFeeEth(""); }}
                type="button"
              >Free</button>
              <button
                className={`seg-btn ${feeMode === "paid" ? "active" : ""}`}
                onClick={() => setFeeMode("paid")}
                type="button"
              >Charge fee</button>
            </div>
          </div>
        </div>
      )}

      {mode === "claim" && feeMode === "paid" && (
        <div className="dc-section">
          <label className="dc-label">
            Fee amount (ETH)
            <span className="dc-label-meta"> — collected on claim, you withdraw anytime</span>
          </label>
          <input
            className="dc-input"
            type="number"
            min="0"
            step="0.0001"
            placeholder="e.g. 0.001 ≈ $3 · covers gas for one FHE transfer"
            value={claimFeeEth}
            onChange={(e) => setClaimFeeEth(e.target.value)}
          />
        </div>
      )}

      <div className="dc-section">
        <label className="dc-label">Token to distribute</label>
        <PairSelect pairs={pairs} value={selectedPair?.confidentialTokenAddress ?? ""} onChange={setSelectedAddr} mode="confidential" />
        {selectedPair && (
          <div className="dc-hint">Sending <strong>{sym}</strong> · amounts FHE-encrypted on-chain by Zama</div>
        )}
      </div>

      {/* ── Import mode tabs ── */}
      <div className="dc-section">
        <div className="import-mode-tabs">
          {([
            ["paste", "✎ Paste list"],
            ["file", "⬆ Upload CSV / Excel"],
            ["dune", "◈ Import from Dune"],
          ] as [ImportMode, string][]).map(([m, label]) => (
            <button
              key={m}
              className={`import-mode-tab ${importMode === m ? "active" : ""}`}
              onClick={() => setImportMode(m)}
            >
              {label}
            </button>
          ))}
        </div>

        {importMode === "paste" && (
          <>
            <div className="dc-label" style={{ marginTop: 12 }}>
              Recipients
              <span className="dc-label-meta">one per line · <code>address, amount</code></span>
            </div>
            <textarea
              className="dc-textarea"
              rows={7}
              placeholder={"0xRecipient1, 100\n0xRecipient2, 250\n0xRecipient3, 75"}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              spellCheck={false}
            />
          </>
        )}

        {importMode === "file" && (
          <div
            className={`file-drop-zone`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <span className="fdz-icon">📂</span>
            <p>Drag & drop or <u>click to browse</u></p>
            <p className="fdz-sub">Accepts .csv, .xlsx, .xls · Needs an <code>address</code> column · optional <code>amount</code> column</p>
            {fileError && <div className="tx-line err" style={{ marginTop: 8 }}>{fileError}</div>}
          </div>
        )}

        {importMode === "dune" && (
          <DunePanel onImport={handleDuneImport} />
        )}
      </div>

      {rows.length > 0 && importMode === "paste" && (
        <div className="dc-parse-summary">
          <span className="ok-badge">{validRows.length} valid</span>
          {rows.length - validRows.length > 0 && <span className="err-badge">{rows.length - validRows.length} errors</span>}
          {validRows.length > 0 && (
            <span className="muted">· total {validRows.reduce((s, r) => s + (Number(r.amount) || 0), 0).toFixed(2)} {sym}</span>
          )}
        </div>
      )}

      {formError && <div className="tx-line err">{formError}</div>}

      <button
        className="btn btn-primary btn-full"
        disabled={!name.trim() || validRows.length === 0}
        onClick={handleCreate}
      >
        {mode === "claim" ? "Save draft → Deploy contract next" : "Save campaign draft →"}
      </button>
    </div>
  );
}

// ── Campaign detail ───────────────────────────────────────────────────────────

function CampaignDetail({ campaign: initial, zama, onUpdate }: {
  campaign: AirdropCampaign;
  zama: ReturnType<typeof useZamaSdk>;
  onBack?: () => void;
  onUpdate: () => void;
}) {
  const [campaign, setCampaign] = useState(initial);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { deploy, status: deployStatus, error: deployError, progress } = useDeployAirdrop();
  const [copied, setCopied] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [claimQueue, setClaimQueue] = useState<{ claimant: string; position: bigint; ts: bigint }[]>([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addRawText, setAddRawText] = useState("");
  const [addImportMode, setAddImportMode] = useState<"paste" | "file">("paste");
  const [addFileError, setAddFileError] = useState("");
  const [addStatus, setAddStatus] = useState<"idle" | "adding" | "done" | "error">("idle");
  const [addMsg, setAddMsg] = useState("");
  const addFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCampaign(airdropStore.get(initial.id) ?? initial);
  }, [initial.id]);

  const sym = displaySym(campaign.tokenSymbol);
  const sentCount = campaign.recipients.filter((r) => r.status === "sent").length;
  const failCount = campaign.recipients.filter((r) => r.status === "failed").length;
  const total = campaign.recipients.length;
  const isDone = campaign.status === "done";

  async function execute() {
    cancelRef.current = false;
    setIsRunning(true);
    airdropStore.update(campaign.id, { status: "executing" });
    setCampaign((c) => ({ ...c, status: "executing" }));

    // Always read from store so retryFailed()'s store updates are visible
    const snapshot = airdropStore.get(campaign.id)!;

    for (const r of snapshot.recipients) {
      if (cancelRef.current) break;
      if (r.status === "sent") continue;

      airdropStore.updateRecipient(campaign.id, r.address, { status: "pending" });
      setCampaign((c) => ({ ...c, recipients: c.recipients.map((x) => x.address === r.address ? { ...x, status: "pending" } : x) }));

      try {
        const token = zama.getSdk().createToken(campaign.tokenAddress as `0x${string}`);
        const res = await token.confidentialTransfer(
          r.address as `0x${string}`,
          toBaseUnits(r.amount, campaign.tokenDecimals),
        );
        const hash = res && typeof res === "object" && "txHash" in res ? (res as any).txHash : undefined;
        airdropStore.updateRecipient(campaign.id, r.address, { status: "sent", txHash: hash });
        setCampaign((c) => ({ ...c, recipients: c.recipients.map((x) => x.address === r.address ? { ...x, status: "sent", txHash: hash } : x) }));
      } catch (e) {
        airdropStore.updateRecipient(campaign.id, r.address, { status: "failed", errMsg: errMsg(e) });
        setCampaign((c) => ({ ...c, recipients: c.recipients.map((x) => x.address === r.address ? { ...x, status: "failed", errMsg: errMsg(e) } : x) }));
      }
    }

    const latest = airdropStore.get(campaign.id)!;
    airdropStore.update(campaign.id, { status: "done", executedAt: new Date().toISOString() });
    setCampaign(airdropStore.get(campaign.id) ?? latest);
    setIsRunning(false);
    onUpdate();
  }

  function retryFailed() {
    campaign.recipients
      .filter((r) => r.status === "failed")
      .forEach((r) => {
        airdropStore.updateRecipient(campaign.id, r.address, { status: "pending", errMsg: undefined });
      });
    airdropStore.update(campaign.id, { status: "draft" });
    execute();
  }

  async function deployContract() {
    const deadlineTs = campaign.deadline
      ? BigInt(Math.floor(new Date(campaign.deadline).getTime() / 1000))
      : 0n;
    const limit = BigInt(campaign.claimLimit ?? 0);
    const feeWei = campaign.claimFeeEth ? parseEther(campaign.claimFeeEth) : 0n;
    const addresses = campaign.recipients.map((r) => r.address as Address);
    const contractAddr = await deploy(deadlineTs, limit, feeWei, addresses);
    if (contractAddr) {
      airdropStore.update(campaign.id, { contractAddress: contractAddr, contractDeployed: true });
      setCampaign((c) => ({ ...c, contractAddress: contractAddr, contractDeployed: true }));
      onUpdate();
    }
  }

  function claimLink() {
    return `${window.location.origin}/claim?c=${campaign.contractAddress}`;
  }

  function copyLink() {
    navigator.clipboard.writeText(claimLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function loadClaimEvents() {
    if (!publicClient || !campaign.contractAddress) return;
    setLoadingEvents(true);
    try {
      const events = await fetchClaimEvents(publicClient, campaign.contractAddress as Address);
      setClaimQueue(events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function withdrawFees() {
    if (!walletClient || !publicClient || !campaign.contractAddress) return;
    setWithdrawing(true);
    setWithdrawMsg("");
    try {
      const hash = await walletClient.writeContract({
        address: campaign.contractAddress as Address,
        abi: [{ type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [], outputs: [] }],
        functionName: "withdraw",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setWithdrawMsg(`Withdrawn ✓ — tx: ${hash.slice(0, 12)}…`);
    } catch (e) {
      setWithdrawMsg(e instanceof Error ? e.message.slice(0, 100) : "Withdraw failed");
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleAddFile(file: File) {
    setAddFileError("");
    try {
      const parsed = await parseFile(file);
      if (!parsed.length) { setAddFileError("No valid addresses found."); return; }
      const lines = parsed.map((r) => `${r.address}${r.amount ? `, ${r.amount}` : ", 0"}`).join("\n");
      setAddRawText(lines);
      setAddImportMode("paste");
    } catch (e) { setAddFileError(errMsg(e)); }
  }

  async function handleAddWallets() {
    const parsed = parseRecipientText(addRawText);
    const validParsed = parsed.filter((r) => !r.parseError);
    if (!validParsed.length) { setAddMsg("No valid addresses found."); return; }

    // Skip addresses already in the campaign (case-insensitive)
    const existingSet = new Set(campaign.recipients.map((r) => r.address.toLowerCase()));
    const newRecipients: AirdropRecipient[] = validParsed
      .filter((r) => !existingSet.has(r.address.toLowerCase()))
      .map((r) => ({ address: r.address, amount: r.amount, status: "pending" as const }));

    if (!newRecipients.length) {
      setAddMsg("All addresses are already in this campaign.");
      return;
    }

    setAddStatus("adding");
    setAddMsg("");

    // Update store — reset to draft if campaign was done so new recipients get executed
    const updatedRecipients = [...campaign.recipients, ...newRecipients];
    const needsReset = campaign.status === "done";
    airdropStore.update(campaign.id, {
      recipients: updatedRecipients,
      ...(needsReset ? { status: "draft" as const } : {}),
    });
    setCampaign((c) => ({
      ...c,
      recipients: updatedRecipients,
      ...(needsReset ? { status: "draft" as const } : {}),
    }));

    // For claim campaigns with a deployed contract: also call addEligible on-chain
    if (campaign.mode === "claim" && campaign.contractDeployed && campaign.contractAddress && walletClient && publicClient) {
      const BATCH = 200;
      const addrs = newRecipients.map((r) => r.address as Address);
      const addEligibleAbi = [{
        type: "function" as const, name: "addEligible",
        stateMutability: "nonpayable" as const,
        inputs: [{ name: "addrs", type: "address[]" }], outputs: [],
      }];
      try {
        for (let i = 0; i < addrs.length; i += BATCH) {
          const h = await walletClient.writeContract({
            address: campaign.contractAddress as Address,
            abi: addEligibleAbi,
            functionName: "addEligible",
            args: [addrs.slice(i, i + BATCH)],
          });
          await publicClient.waitForTransactionReceipt({ hash: h });
        }
      } catch (e) {
        setAddMsg(`Local list updated but on-chain addEligible failed: ${errMsg(e)}`);
        setAddStatus("error");
        onUpdate();
        return;
      }
    }

    setAddStatus("done");
    setAddMsg(`${newRecipients.length} address${newRecipients.length !== 1 ? "es" : ""} added.${needsReset ? " Campaign reset to draft so they can be sent." : ""}`);
    setAddRawText("");
    onUpdate();
  }

  // Auto-load events when contract is deployed
  useEffect(() => {
    if (campaign.contractDeployed && campaign.contractAddress && claimQueue.length === 0) {
      loadClaimEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.contractDeployed, campaign.contractAddress]);

  const isClaimMode = campaign.mode === "claim";
  const isDeploying = deployStatus === "deploying" || deployStatus === "adding";

  return (
    <div className="campaign-detail">
      <div className="cd-head">
        <div>
          <h2 className="cd-name">{campaign.name}</h2>
          {campaign.description && <p className="cd-desc">{campaign.description}</p>}
          <div className="cd-meta">
            <span className={`badge ${statusCls(campaign.status)}`}>{statusLabel(campaign.status)}</span>
            <span className={`badge ${isClaimMode ? "badge-claim" : "badge-idle"}`}>
              {isClaimMode ? "🔗 Claim link" : "⚡ Send now"}
            </span>
            <span className="muted">
              · {sym} · {total} recipients
              · {campaign.startDate} → {campaign.deadline}
            </span>
          </div>
        </div>
        {/* Push mode: launch/resume button */}
        {!isClaimMode && !isDone && (
          <ActionButton
            ready={!isRunning}
            readyHint="Loading…"
            pending={isRunning}
            pendingText={`Sending… ${sentCount}/${total}`}
            label={sentCount > 0 ? `Resume (${total - sentCount} left)` : "Launch airdrop →"}
            onAction={execute}
            className="btn btn-primary"
          />
        )}
        {/* Claim mode: deploy contract or show link */}
        {isClaimMode && !campaign.contractDeployed && (
          <button
            className="btn btn-primary"
            onClick={deployContract}
            disabled={isDeploying}
          >
            {deployStatus === "deploying" ? <><span className="spinner" /> Deploying contract…</>
              : deployStatus === "adding" ? <><span className="spinner" /> Adding addresses ({progress.batch}/{progress.total})…</>
              : "Deploy claim contract →"}
          </button>
        )}
      </div>

      {/* Claim mode: contract deployed UI */}
      {isClaimMode && campaign.contractDeployed && campaign.contractAddress && (
        <div className="claim-deploy-box">
          <div className="cdb-row">
            <div>
              <div className="cdb-label">Claim contract</div>
              <div className="mono cdb-addr">{campaign.contractAddress}</div>
            </div>
            <div className="cdb-actions">
              <button className="btn btn-ghost btn-sm" onClick={copyLink}>
                {copied ? "Copied!" : "Copy claim link"}
              </button>
              <a
                className="btn btn-ghost btn-sm"
                href={`https://sepolia.etherscan.io/address/${campaign.contractAddress}`}
                target="_blank" rel="noreferrer"
              >
                Etherscan ↗
              </a>
            </div>
          </div>
          <div className="cdb-link-preview">{claimLink()}</div>
          {campaign.claimFeeEth && (
            <div className="cdb-fee-row">
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                💳 Claim fee: <strong>{campaign.claimFeeEth} ETH</strong> per user
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={withdrawFees}
                disabled={withdrawing}
              >
                {withdrawing ? <><span className="spinner" /> Withdrawing…</> : "Withdraw fees →"}
              </button>
            </div>
          )}
          {withdrawMsg && (
            <div className={`tx-line ${withdrawMsg.includes("✓") ? "ok" : "err"}`} style={{ marginTop: 6 }}>
              {withdrawMsg}
            </div>
          )}
          <div className="cdb-row" style={{ marginTop: 12 }}>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {claimQueue.length} claim{claimQueue.length !== 1 ? "s" : ""} registered on-chain
            </span>
            <div className="cdb-actions">
              <button className="btn btn-ghost btn-sm" onClick={loadClaimEvents} disabled={loadingEvents}>
                {loadingEvents ? <><span className="spinner" /> Loading…</> : "Refresh claims"}
              </button>
              {claimQueue.length > 0 && !isDone && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    // Override recipients with claim queue order then run
                    const ordered: AirdropRecipient[] = claimQueue.map((ev) => {
                      const existing = campaign.recipients.find(
                        (r) => r.address.toLowerCase() === ev.claimant.toLowerCase()
                      );
                      return existing ?? { address: ev.claimant, amount: "0", status: "pending" };
                    });
                    airdropStore.update(campaign.id, { recipients: ordered });
                    setCampaign((c) => ({ ...c, recipients: ordered }));
                    setTimeout(execute, 0);
                  }}
                  disabled={isRunning}
                >
                  Process {claimQueue.length} claims →
                </button>
              )}
            </div>
          </div>
          {claimQueue.length > 0 && (
            <div className="dc-table-wrap" style={{ marginTop: 12 }}>
              <table className="dc-table">
                <thead><tr><th>#</th><th>Claimant</th><th>Claimed at</th><th>Status</th></tr></thead>
                <tbody>
                  {claimQueue.map((ev) => {
                    const r = campaign.recipients.find(
                      (x) => x.address.toLowerCase() === ev.claimant.toLowerCase()
                    );
                    const claimedAt = new Date(Number(ev.ts) * 1000).toLocaleString();
                    return (
                      <tr key={ev.claimant} className={r?.status === "sent" ? "row-ok" : r?.status === "failed" ? "row-fail" : ""}>
                        <td className="mono muted">{ev.position.toString()}</td>
                        <td className="mono">{shortAddr(ev.claimant)}</td>
                        <td className="mono muted" style={{ fontSize: "0.8rem" }}>{claimedAt}</td>
                        <td>
                          {r?.status === "sent" ? (
                            <span className="badge badge-ok">
                              {r.txHash ? <a href={explorerTx(r.txHash)} target="_blank" rel="noreferrer">sent ↗</a> : "sent ✓"}
                            </span>
                          ) : r?.status === "failed" ? (
                            <span className="badge badge-err">failed</span>
                          ) : r?.status === "pending" ? (
                            <span className="badge badge-pending"><span className="spinner" /> sending</span>
                          ) : (
                            <span className="badge badge-idle">queued</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {deployError && <div className="tx-line err" style={{ marginTop: 8 }}>{deployError}</div>}

      {/* ── Add wallets panel ── */}
      {!isRunning && (
        <div className="add-wallets-section">
          <button
            className={`btn btn-ghost btn-sm add-wallets-toggle ${showAddPanel ? "active" : ""}`}
            onClick={() => { setShowAddPanel((v) => !v); setAddStatus("idle"); setAddMsg(""); }}
          >
            {showAddPanel ? "✕ Cancel" : "+ Add wallets"}
          </button>

          {showAddPanel && (
            <div className="add-wallets-panel">
              <div className="dc-label">
                Add more recipients
                <span className="dc-label-meta"> — duplicates are skipped automatically</span>
              </div>

              <div className="import-mode-tabs" style={{ marginTop: 10 }}>
                {([["paste", "✎ Paste list"], ["file", "⬆ Upload CSV / Excel"]] as ["paste" | "file", string][]).map(([m, lbl]) => (
                  <button
                    key={m}
                    className={`import-mode-tab ${addImportMode === m ? "active" : ""}`}
                    onClick={() => setAddImportMode(m)}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {addImportMode === "paste" ? (
                <textarea
                  className="dc-textarea"
                  rows={5}
                  placeholder={"0xNewAddr1, 100\n0xNewAddr2, 250"}
                  value={addRawText}
                  onChange={(e) => setAddRawText(e.target.value)}
                  spellCheck={false}
                  style={{ marginTop: 10 }}
                />
              ) : (
                <div
                  className="file-drop-zone"
                  style={{ marginTop: 10 }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleAddFile(f); }}
                  onClick={() => addFileRef.current?.click()}
                >
                  <input
                    ref={addFileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddFile(f); }}
                  />
                  <span className="fdz-icon">📂</span>
                  <p>Drag & drop or <u>click to browse</u></p>
                  {addFileError && <div className="tx-line err" style={{ marginTop: 6 }}>{addFileError}</div>}
                </div>
              )}

              {addRawText && (() => {
                const parsed = parseRecipientText(addRawText);
                const valid = parsed.filter((r) => !r.parseError);
                const skip = parsed.length - valid.length;
                const existing = new Set(campaign.recipients.map((r) => r.address.toLowerCase()));
                const newCount = valid.filter((r) => !existing.has(r.address.toLowerCase())).length;
                return (
                  <div className="dc-parse-summary" style={{ marginTop: 8 }}>
                    <span className="ok-badge">{newCount} new</span>
                    {valid.length - newCount > 0 && <span className="muted">{valid.length - newCount} already in campaign</span>}
                    {skip > 0 && <span className="err-badge">{skip} skipped</span>}
                  </div>
                );
              })()}

              {addMsg && (
                <div className={`tx-line ${addStatus === "error" ? "err" : "ok"}`} style={{ marginTop: 8 }}>
                  {addMsg}
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={handleAddWallets}
                disabled={!addRawText.trim() || addStatus === "adding"}
              >
                {addStatus === "adding" ? <><span className="spinner" /> Adding…</> : "Confirm & add →"}
              </button>
            </div>
          )}
        </div>
      )}

      {isDone && (
        <div className={`dc-done-banner ${failCount > 0 ? "partial" : "success"}`}>
          <div className="done-counts">
            <span className="done-count ok">{sentCount} sent</span>
            {failCount > 0 && <span className="done-count fail">{failCount} failed</span>}
          </div>
          <p className="done-sub">
            {failCount === 0
              ? "All allocations distributed confidentially."
              : "Failed rows show the reason below."}
          </p>
          {failCount > 0 && (
            <button className="btn btn-primary btn-sm" onClick={retryFailed} disabled={isRunning}>
              Retry {failCount} failed →
            </button>
          )}
        </div>
      )}

      <div className="dc-table-wrap">
        <table className="dc-table">
          <thead><tr><th>#</th><th>Recipient</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {campaign.recipients.map((r, i) => (
              <Fragment key={r.address}>
                <tr className={r.status === "sent" ? "row-ok" : r.status === "failed" ? "row-fail" : ""}>
                  <td className="mono muted">{i + 1}</td>
                  <td className="mono">{shortAddr(r.address)}</td>
                  <td className="mono">{r.amount} {sym}</td>
                  <td>
                    {r.status === "sent" ? (
                      <span className="badge badge-ok">
                        {r.txHash ? <a href={explorerTx(r.txHash)} target="_blank" rel="noreferrer">sent ↗</a> : "sent ✓"}
                      </span>
                    ) : r.status === "failed" ? (
                      <span className="badge badge-err">failed</span>
                    ) : r.status === "pending" ? (
                      <span className="badge badge-pending"><span className="spinner" /> sending</span>
                    ) : (
                      <span className="badge badge-idle">pending</span>
                    )}
                  </td>
                </tr>
                {r.errMsg && (
                  <tr className="row-reason">
                    <td />
                    <td colSpan={3} className="row-reason-text">{r.errMsg}</td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Campaign list ─────────────────────────────────────────────────────────────

function CampaignList({ campaigns, onSelect, onDelete }: {
  campaigns: AirdropCampaign[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!campaigns.length) {
    return (
      <div className="dc-empty">
        <span>🪂</span>
        <p>No campaigns yet. Create your first one.</p>
      </div>
    );
  }
  return (
    <div className="campaign-list">
      {campaigns.map((c) => {
        const sym = displaySym(c.tokenSymbol);
        const sent = c.recipients.filter((r) => r.status === "sent").length;
        return (
          <div key={c.id} className="campaign-row" onClick={() => onSelect(c.id)}>
            <div className="cr-left">
              <div className="cr-name">{c.name}</div>
              <div className="cr-meta">
                <span className={`badge ${statusCls(c.status)}`}>{statusLabel(c.status)}</span>
                <span className="muted">· {sym} · {c.recipients.length} recipients · {sent} sent · {c.startDate} → {c.deadline}</span>
              </div>
            </div>
            <div className="cr-right">
              <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(c.id); }}>
                {c.status === "draft" ? "Launch →" : c.status === "done" ? "View" : "Resume →"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AirdropPage() {
  const { data } = useRegistryPairs();
  const zama = useZamaSdk();
  const pairs = useMemo(() => data?.items ?? [], [data]);
  const [tab, setTab] = useState<Tab>("campaigns");
  const [campaigns, setCampaigns] = useState<AirdropCampaign[]>(() => airdropStore.list());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = useCallback(() => setCampaigns(airdropStore.list()), []);
  const selectedCampaign = selectedId ? campaigns.find((c) => c.id === selectedId) : null;

  function handleCreated(id: string) { reload(); setSelectedId(id); }
  function handleDelete(id: string) {
    if (!window.confirm("Delete this campaign?")) return;
    airdropStore.delete(id);
    reload();
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="distrib-page">
      <div className="distrib-header">
        {selectedCampaign
          ? <button className="back-link" onClick={() => setSelectedId(null)}>← All campaigns</button>
          : <Link to="/" className="back-link">← Home</Link>
        }
        <div>
          <div className="distrib-kicker">Confidential Distribution</div>
          <h1 className="distrib-title">Airdrop</h1>
          {!selectedCampaign && (
            <p className="distrib-sub">
              Create named campaigns to distribute confidential ERC-7984 tokens. Import recipients from a
              CSV, Excel file, or directly from Dune Analytics. Amounts are FHE-encrypted — only
              each recipient can see what they received.
            </p>
          )}
        </div>
      </div>

      {selectedCampaign ? (
        <div className="distrib-card airdrop-full">
          <CampaignDetail campaign={selectedCampaign} zama={zama} onBack={() => setSelectedId(null)} onUpdate={reload} />
        </div>
      ) : (
        <>
          <div className="distrib-tabs">
            {([["campaigns", "My Campaigns"], ["create", "New Campaign"]] as [Tab, string][]).map(([t, label]) => (
              <button key={t} className={`distrib-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {label}
                {t === "campaigns" && campaigns.length > 0 && <span className="tab-count">{campaigns.length}</span>}
              </button>
            ))}
          </div>

          <motion.div
            key={tab}
            className={`distrib-card${tab === "create" ? " airdrop-full" : ""}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "create" ? (
              <CreateForm pairs={pairs as any} onCreated={handleCreated} />
            ) : (
              <CampaignList campaigns={campaigns} onSelect={setSelectedId} onDelete={handleDelete} />
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
