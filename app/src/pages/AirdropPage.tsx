import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { ActionButton } from "../components/ActionButton";
import { PairSelect } from "../components/PairSelect";
import { parseRecipientText } from "../hooks/useDisperse";
import { airdropStore, type AirdropCampaign, type AirdropRecipient } from "../lib/airdropStore";
import { displaySym, shortAddr, explorerTx } from "../lib/format";
import { toBaseUnits } from "../lib/format";

type Tab = "create" | "campaigns";

// ── helpers ──────────────────────────────────────────────────────────────────

function errMsg(e: unknown) {
  return e instanceof Error ? e.message.slice(0, 160) : String(e);
}

function statusLabel(s: AirdropCampaign["status"]) {
  return s === "draft" ? "Draft" : s === "executing" ? "Executing…" : "Complete";
}
function statusCls(s: AirdropCampaign["status"]) {
  return s === "draft" ? "badge-idle" : s === "executing" ? "badge-pending" : "badge-ok";
}

// ── Campaign create form ──────────────────────────────────────────────────────

function CreateForm({ pairs, onCreated }: {
  pairs: ReturnType<typeof useRegistryPairs>["data"] extends infer D ? D extends { items: Array<infer P> } ? P[] : never : never;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedAddr, setSelectedAddr] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");

  const selectedPair = useMemo(
    () => (pairs as any[]).find((p: any) => p.confidentialTokenAddress === selectedAddr) ?? (pairs as any[])[0],
    [pairs, selectedAddr],
  );

  const rows = useMemo(() => parseRecipientText(rawText), [rawText]);
  const validRows = rows.filter((r) => !r.parseError);
  const sym = selectedPair ? displaySym(selectedPair.confidential.symbol) : "—";

  function handleCreate() {
    if (!name.trim()) { setError("Give your campaign a name"); return; }
    if (!selectedPair) { setError("Select a token"); return; }
    if (validRows.length === 0) { setError("Add at least one valid recipient"); return; }
    setError("");

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
      deadline,
      recipients,
    });
    onCreated(c.id);
  }

  return (
    <div className="airdrop-create">
      <div className="ac-row">
        <div className="dc-section">
          <label className="dc-label">Campaign name</label>
          <input className="dc-input" placeholder="e.g. Season 1 Airdrop" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="dc-section">
          <label className="dc-label">Claim deadline</label>
          <input className="dc-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>

      <div className="dc-section">
        <label className="dc-label">Description <span className="dc-label-meta">(optional)</span></label>
        <input className="dc-input" placeholder="Reward early community members with confidential cUSDC" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>

      <div className="dc-section">
        <label className="dc-label">Token to distribute</label>
        <PairSelect pairs={pairs as any} value={selectedPair?.confidentialTokenAddress ?? ""} onChange={setSelectedAddr} />
        {selectedPair && (
          <div className="dc-hint">Sending <strong>{sym}</strong> · amounts encrypted on-chain by Zama FHE</div>
        )}
      </div>

      <div className="dc-section">
        <label className="dc-label">
          Recipients
          <span className="dc-label-meta">one per line · <code>address, amount</code></span>
        </label>
        <textarea
          className="dc-textarea"
          rows={8}
          placeholder={"0xRecipient1, 100\n0xRecipient2, 250\n0xRecipient3, 75"}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          spellCheck={false}
        />
        {rows.length > 0 && (
          <div className="dc-parse-summary">
            <span className="ok-badge">{validRows.length} valid</span>
            {rows.length - validRows.length > 0 && <span className="err-badge">{rows.length - validRows.length} errors</span>}
            {validRows.length > 0 && (
              <span className="muted">·  total {validRows.reduce((s, r) => s + (Number(r.amount) || 0), 0).toFixed(4)} {sym}</span>
            )}
          </div>
        )}
      </div>

      {error && <div className="tx-line err">{error}</div>}

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

// ── Campaign detail / execute panel ──────────────────────────────────────────

function CampaignDetail({ campaign: initial, zama, onBack, onUpdate }: {
  campaign: AirdropCampaign;
  zama: ReturnType<typeof useZamaSdk>;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [campaign, setCampaign] = useState(initial);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

  // Reload from store after updates
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
      if (r.status === "sent") continue; // skip already sent

      // Update local display
      airdropStore.updateRecipient(campaign.id, r.address, { status: "pending" });
      setCampaign((c) => ({
        ...c,
        recipients: c.recipients.map((x) => x.address === r.address ? { ...x, status: "pending" } : x),
      }));

      try {
        const token = zama.getSdk().createToken(campaign.tokenAddress as `0x${string}`);
        const res = await token.confidentialTransfer(
          r.address as `0x${string}`,
          toBaseUnits(r.amount, campaign.tokenDecimals),
        );
        const hash = res && typeof res === "object" && "txHash" in res ? (res as any).txHash : undefined;
        airdropStore.updateRecipient(campaign.id, r.address, { status: "sent", txHash: hash });
        setCampaign((c) => ({
          ...c,
          recipients: c.recipients.map((x) => x.address === r.address ? { ...x, status: "sent", txHash: hash } : x),
        }));
      } catch (e) {
        airdropStore.updateRecipient(campaign.id, r.address, { status: "failed", errMsg: errMsg(e) });
        setCampaign((c) => ({
          ...c,
          recipients: c.recipients.map((x) => x.address === r.address ? { ...x, status: "failed", errMsg: errMsg(e) } : x),
        }));
      }
    }

    const latest = airdropStore.get(campaign.id)!;
    const allSent = latest.recipients.every((r) => r.status === "sent");
    airdropStore.update(campaign.id, { status: allSent ? "done" : latest.status === "executing" ? "done" : latest.status, executedAt: new Date().toISOString() });
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
            <span className="muted">· {sym} · {total} recipients · deadline {campaign.deadline}</span>
          </div>
        </div>

        {!isDone && (
          <ActionButton
            ready={!isRunning}
            readyHint="Loading…"
            pending={isRunning}
            pendingText={`Sending… ${sentCount}/${total}`}
            label={sentCount > 0 ? `Resume airdrop (${total - sentCount} left)` : `Launch airdrop →`}
            onAction={execute}
            className="btn btn-primary"
          />
        )}
      </div>

      {isDone && (
        <div className={`dc-done-banner ${failCount > 0 ? "partial" : "success"}`}>
          {failCount === 0
            ? `✓ All ${sentCount} tokens distributed confidentially`
            : `⚠ ${sentCount} sent, ${failCount} failed`}
        </div>
      )}

      <div className="dc-table-wrap">
        <table className="dc-table">
          <thead>
            <tr><th>#</th><th>Recipient</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {campaign.recipients.map((r, i) => (
              <tr key={r.address} className={r.status === "sent" ? "row-ok" : r.status === "failed" ? "row-fail" : ""}>
                <td className="mono muted">{i + 1}</td>
                <td className="mono">{shortAddr(r.address)}</td>
                <td className="mono">{r.amount} {sym}</td>
                <td>
                  {r.status === "sent" ? (
                    <span className="badge badge-ok">
                      {r.txHash
                        ? <a href={explorerTx(r.txHash)} target="_blank" rel="noreferrer">sent ↗</a>
                        : "sent ✓"}
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
  if (campaigns.length === 0) {
    return (
      <div className="dc-empty">
        <span>🪂</span>
        <p>No campaigns yet. Create your first one above.</p>
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
                <span className="muted">· {sym} · {c.recipients.length} recipients · {sent} sent</span>
              </div>
            </div>
            <div className="cr-right">
              <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(c.id); }}>
                {c.status === "draft" ? "Launch →" : c.status === "done" ? "View" : "Resume →"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}>
                Delete
              </button>
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

  function handleCreated(id: string) {
    reload();
    setSelectedId(id);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
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
            Create named campaigns to distribute confidential ERC-7984 tokens to any list of recipients.
            Amounts are FHE-encrypted on-chain — only each recipient can decrypt what they received.
          </p>
        </div>
      </div>

      {selectedCampaign ? (
        <div className="distrib-card airdrop-full">
          <CampaignDetail
            campaign={selectedCampaign}
            zama={zama}
            onBack={() => setSelectedId(null)}
            onUpdate={reload}
          />
        </div>
      ) : (
        <>
          <div className="distrib-tabs">
            {([["campaigns", "My Campaigns"], ["create", "New Campaign"]] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                className={`distrib-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {label}
                {t === "campaigns" && campaigns.length > 0 && (
                  <span className="tab-count">{campaigns.length}</span>
                )}
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
              <CampaignList
                campaigns={campaigns}
                onSelect={(id) => { setSelectedId(id); }}
                onDelete={handleDelete}
              />
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
