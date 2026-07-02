import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { read as xlsxRead, utils as xlsxUtils } from "xlsx";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { ActionButton } from "../components/ActionButton";
import { PairSelect } from "../components/PairSelect";
import { parseRecipientText } from "../hooks/useDisperse";
import { airdropStore, type AirdropCampaign, type AirdropRecipient } from "../lib/airdropStore";
import { fetchDuneQuery, DUNE_KEY_STORAGE, type DuneRow } from "../lib/duneImport";
import { displaySym, shortAddr, explorerTx, toBaseUnits } from "../lib/format";

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

function DunePanel({ onImport }: { onImport: (rows: { address: string; amount: string }[]) => void }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(DUNE_KEY_STORAGE) ?? "");
  const [queryId, setQueryId] = useState("");
  const [minTx, setMinTx] = useState("1");
  const [minVol, setMinVol] = useState("0");
  const [defAmt, setDefAmt] = useState("100");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [rows, setRows] = useState<DuneRow[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

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
        <span className="dune-logo">◈ Dune</span>
        <p className="dune-desc">
          Pull a wallet list from any Dune Analytics query. Your query must return a column named
          <code>address</code> (or <code>wallet</code> / <code>user</code>). Optional columns
          <code>tx_count</code> and <code>volume</code> unlock the filters below.
        </p>
      </div>

      <div className="dune-fields">
        <div className="dc-section">
          <label className="dc-label">Dune API key</label>
          <input
            className="dc-input mono-input"
            type="password"
            placeholder="paste your key from dune.com/settings/api"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="dc-section">
          <label className="dc-label">
            Query ID
            <span className="dc-label-meta">— the number in the Dune URL</span>
          </label>
          <input
            className="dc-input"
            placeholder="e.g. 4521938"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
          />
        </div>
      </div>

      <div className="dune-hint-box">
        <strong>Suggested query for Zama:</strong> wallets that called the wrapper registry on Sepolia,
        with columns <code>address</code>, <code>tx_count</code>, <code>volume</code>. Sort by tx_count desc.
      </div>

      <div className="dune-filters">
        <div className="dc-section">
          <label className="dc-label">Min tx count</label>
          <input className="dc-input" type="number" min="0" value={minTx} onChange={(e) => setMinTx(e.target.value)} />
        </div>
        <div className="dc-section">
          <label className="dc-label">Min volume (USD)</label>
          <input className="dc-input" type="number" min="0" value={minVol} onChange={(e) => setMinVol(e.target.value)} />
        </div>
        <div className="dc-section">
          <label className="dc-label">Amount per address</label>
          <input className="dc-input" type="number" min="0" value={defAmt} onChange={(e) => setDefAmt(e.target.value)} />
        </div>
      </div>

      {errorMsg && <div className="tx-line err">{errorMsg}</div>}

      {status === "done" && rows.length > 0 && (
        <div className="dune-results">
          <div className="dc-parse-summary">
            <span className="ok-badge">{rows.length} addresses fetched</span>
            {rows.length !== filtered.length && (
              <span className="muted">→ {filtered.length} after filters</span>
            )}
          </div>
          <div className="dc-table-wrap" style={{ maxHeight: 200, overflowY: "auto" }}>
            <table className="dc-table">
              <thead><tr><th>Address</th><th>Tx count</th><th>Volume</th></tr></thead>
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
        <button
          className="btn btn-ghost btn-sm"
          disabled={status === "loading"}
          onClick={fetch}
        >
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
    });
    onCreated(c.id);
  }

  return (
    <div className="airdrop-create">
      {/* ── Campaign meta ── */}
      <div className="ac-row">
        <div className="dc-section" style={{ gridColumn: "1 / -1" }}>
          <label className="dc-label">Campaign name</label>
          <input className="dc-input" placeholder="e.g. Season 1 Community Airdrop" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="dc-section">
        <label className="dc-label">Description <span className="dc-label-meta">(optional)</span></label>
        <input className="dc-input" placeholder="Reward early community members with confidential tokens" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>

      <div className="ac-row">
        <div className="dc-section">
          <label className="dc-label">Start date</label>
          <input className="dc-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="dc-section">
          <label className="dc-label">Claim deadline</label>
          <input className="dc-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>

      <div className="dc-section">
        <label className="dc-label">Token to distribute</label>
        <PairSelect pairs={pairs} value={selectedPair?.confidentialTokenAddress ?? ""} onChange={setSelectedAddr} />
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
        Save campaign draft →
      </button>
    </div>
  );
}

// ── Campaign detail ───────────────────────────────────────────────────────────

function CampaignDetail({ campaign: initial, zama, onBack, onUpdate }: {
  campaign: AirdropCampaign;
  zama: ReturnType<typeof useZamaSdk>;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [campaign, setCampaign] = useState(initial);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

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

    for (const r of campaign.recipients) {
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

  return (
    <div className="campaign-detail">
      <button className="back-link" onClick={onBack}>← All campaigns</button>

      <div className="cd-head">
        <div>
          <h2 className="cd-name">{campaign.name}</h2>
          {campaign.description && <p className="cd-desc">{campaign.description}</p>}
          <div className="cd-meta">
            <span className={`badge ${statusCls(campaign.status)}`}>{statusLabel(campaign.status)}</span>
            <span className="muted">
              · {sym} · {total} recipients
              · {campaign.startDate} → {campaign.deadline}
            </span>
          </div>
        </div>
        {!isDone && (
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
      </div>

      {isDone && (
        <div className={`dc-done-banner ${failCount > 0 ? "partial" : "success"}`}>
          {failCount === 0
            ? `✓ All ${sentCount} allocations distributed confidentially`
            : `⚠ ${sentCount} sent, ${failCount} failed`}
        </div>
      )}

      <div className="dc-table-wrap">
        <table className="dc-table">
          <thead><tr><th>#</th><th>Recipient</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {campaign.recipients.map((r, i) => (
              <tr key={r.address} className={r.status === "sent" ? "row-ok" : r.status === "failed" ? "row-fail" : ""}>
                <td className="mono muted">{i + 1}</td>
                <td className="mono">{shortAddr(r.address)}</td>
                <td className="mono">{r.amount} {sym}</td>
                <td>
                  {r.status === "sent" ? (
                    <span className="badge badge-ok">
                      {r.txHash ? <a href={explorerTx(r.txHash)} target="_blank" rel="noreferrer">sent ↗</a> : "sent ✓"}
                    </span>
                  ) : r.status === "failed" ? (
                    <span className="badge badge-err" title={r.errMsg}>failed</span>
                  ) : r.status === "pending" ? (
                    <span className="badge badge-pending"><span className="spinner" /> sending</span>
                  ) : (
                    <span className="badge badge-idle">pending</span>
                  )}
                </td>
              </tr>
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
        <Link to="/" className="back-link">← Home</Link>
        <div>
          <div className="distrib-kicker">Confidential Distribution</div>
          <h1 className="distrib-title">Airdrop</h1>
          <p className="distrib-sub">
            Create named campaigns to distribute confidential ERC-7984 tokens. Import recipients from a
            CSV, Excel file, or directly from Dune Analytics. Amounts are FHE-encrypted — only
            each recipient can see what they received.
          </p>
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
            className="distrib-card"
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
