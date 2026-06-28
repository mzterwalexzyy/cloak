import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { isAddress } from "viem";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { usePairActions } from "../hooks/usePairActions";
import { PairSelect } from "../components/PairSelect";
import { ActionButton } from "../components/ActionButton";
import { Faucet } from "../components/Faucet";
import { QuickPicks, TxLine } from "../components/AmountField";
import { shortAddr, fmtAmount, displaySym, explorerAddress } from "../lib/format";

type Tab = "wrap" | "unwrap" | "decrypt" | "send" | "faucet";
const TABS: { id: Tab; label: string }[] = [
  { id: "wrap", label: "Wrap" },
  { id: "unwrap", label: "Unwrap" },
  { id: "decrypt", label: "Decrypt" },
  { id: "send", label: "Send" },
  { id: "faucet", label: "Faucet" },
];

export function PairPage() {
  const { address: confidentialAddress } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useRegistryPairs();
  const zama = useZamaSdk();
  const [tab, setTab] = useState<Tab>("wrap");

  const items = data?.items ?? [];
  const pair = confidentialAddress
    ? items.find((p) => p.confidentialTokenAddress.toLowerCase() === confidentialAddress.toLowerCase())
    : items[0];

  const a = usePairActions(pair ?? PLACEHOLDER, zama);

  if (isLoading) return <div className="swap-page"><div className="loading">Loading token…</div></div>;
  if (!pair) {
    return <div className="swap-page"><div className="empty">Token not found. <Link to="/">Back to registry</Link></div></div>;
  }

  const { u, c } = a;
  const sendValid = isAddress(a.sendTo);

  return (
    <div className="swap-page">
      <div className="swap-head">
        <Link to="/" className="back-link">← All pairs</Link>
      </div>

      <motion.div
        className="swap-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="swap-card-top">
          <span className="swap-pick-label">Pair</span>
          <PairSelect pairs={items} value={pair.confidentialTokenAddress} onChange={(addr) => navigate(`/pair/${addr}`)} />
        </div>

        <div className="swap-balances">
          <div>
            <span>Public balance</span>
            <strong>{a.underlyingBal !== undefined ? fmtAmount(a.underlyingBal, u.decimals) : "—"} {displaySym(u.symbol)}</strong>
          </div>
          <div>
            <span>Confidential balance</span>
            {a.bal.value !== undefined
              ? <strong>{fmtAmount(a.bal.value, c.decimals)} {displaySym(c.symbol)}</strong>
              : <strong className="locked">🔒 Encrypted</strong>}
          </div>
        </div>

        <div className="swap-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`swap-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {tab === t.id && <motion.span layoutId="swap-tab-underline" className="swap-tab-underline" />}
            </button>
          ))}
        </div>

        <motion.div key={tab} className="swap-body" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          {tab === "wrap" && (
            <>
              <AmountField label={`Wrap ${displaySym(u.symbol)} → ${displaySym(c.symbol)}`} value={a.wrapAmt} onChange={a.setWrapAmt} symbol={displaySym(u.symbol)} />
              <QuickPicks base={a.underlyingBal} decimals={u.decimals} onPick={a.setWrapAmt} />
              <ActionButton
                ready={!!a.wrapAmt}
                readyHint="Enter an amount"
                pending={a.wrapTx.status === "pending"}
                pendingText="Confirm in your wallet…"
                label={`Wrap ${displaySym(u.symbol)}`}
                onAction={a.doWrap}
              />
              <TxLine tx={a.wrapTx} />
            </>
          )}

          {tab === "unwrap" && (
            <>
              <AmountField label={`Unwrap ${displaySym(c.symbol)} → ${displaySym(u.symbol)}`} value={a.unwrapAmt} onChange={a.setUnwrapAmt} symbol={displaySym(c.symbol)} />
              {a.bal.value !== undefined
                ? <QuickPicks base={a.bal.value} decimals={c.decimals} onPick={a.setUnwrapAmt} />
                : <div className="quick-hint">Decrypt your balance to use 25 / 50 / 75 / Max.</div>}
              <ActionButton
                ready={!!a.unwrapAmt}
                readyHint="Enter an amount"
                pending={a.unwrapTx.status === "pending"}
                pendingText="Unwrapping…"
                label={`Unwrap ${displaySym(c.symbol)}`}
                onAction={() => a.doUnwrap(false)}
              />
              <button className="link-btn-center" onClick={() => a.doUnwrap(true)} disabled={a.unwrapTx.status === "pending"}>
                or unwrap your entire balance
              </button>
              <TxLine tx={a.unwrapTx} />
            </>
          )}

          {tab === "decrypt" && (
            <>
              <p className="swap-copy">Nothing is published on-chain. Your wallet signs an EIP-712 message and the decrypted value is shown only to you.</p>
              <div className="decrypt-display">
                {a.bal.loading ? (
                  <span className="decrypt-status"><span className="spinner" />{a.bal.msg ?? "Authorizing…"}</span>
                ) : a.bal.value !== undefined ? (
                  <span className="decrypt-value">{fmtAmount(a.bal.value, c.decimals)} {displaySym(c.symbol)}</span>
                ) : (
                  <span className="decrypt-status">•••••• encrypted</span>
                )}
              </div>
              <ActionButton
                ready
                readyHint=""
                pending={a.bal.loading}
                pendingText="Authorizing…"
                label={a.bal.value !== undefined ? "Re-decrypt balance" : "Authorize & Decrypt"}
                onAction={a.decryptBalance}
              />
              {a.bal.error && <div className="tx-line err">{a.bal.error}</div>}
            </>
          )}

          {tab === "send" && (
            <>
              <input className="address-box" placeholder="Recipient address (0x…)" value={a.sendTo} onChange={(e) => a.setSendTo(e.target.value)} />
              <AmountField label={`Send ${displaySym(c.symbol)} privately`} value={a.sendAmt} onChange={a.setSendAmt} symbol={displaySym(c.symbol)} />
              {a.bal.value !== undefined
                ? <QuickPicks base={a.bal.value} decimals={c.decimals} onPick={a.setSendAmt} />
                : <div className="quick-hint">Decrypt your balance to pick a %. The transfer amount stays encrypted on-chain.</div>}
              <ActionButton
                ready={sendValid && !!a.sendAmt}
                readyHint={!a.sendTo || !sendValid ? "Enter a valid recipient" : "Enter an amount"}
                pending={a.sendTx.status === "pending"}
                pendingText="Encrypting & sending…"
                label="Send confidentially"
                onAction={() => a.doSend(sendValid)}
              />
              <TxLine tx={a.sendTx} />
            </>
          )}

          {tab === "faucet" && (
            <>
              <p className="swap-copy">Mint free test {displaySym(u.symbol)} on Sepolia. You still need a little Sepolia ETH for gas.</p>
              <Faucet underlying={pair.tokenAddress} symbol={displaySym(u.symbol)} decimals={u.decimals} onMinted={() => a.refetchUnderlying()} />
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Contract details — informative on desktop, hidden on mobile to reduce noise */}
      <div className="swap-meta">
        {pair.isValid ? <span className="tag tag-ok">● Active registry pair</span> : <span className="tag tag-bad">Revoked</span>}
        <a className="tag tag-muted" href={explorerAddress(pair.tokenAddress)} target="_blank" rel="noreferrer">ERC-20 {shortAddr(pair.tokenAddress)} ↗</a>
        <a className="tag tag-muted" href={explorerAddress(pair.confidentialTokenAddress)} target="_blank" rel="noreferrer">ERC-7984 {shortAddr(pair.confidentialTokenAddress)} ↗</a>
      </div>
    </div>
  );
}

function AmountField({ label, value, onChange, symbol }: { label: string; value: string; onChange: (v: string) => void; symbol: string }) {
  return (
    <div className="swap-field">
      <div className="swap-field-label">{label}</div>
      <div className="amount-box">
        <input inputMode="decimal" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
        <span>{symbol}</span>
      </div>
    </div>
  );
}

const PLACEHOLDER = {
  tokenAddress: "0x0000000000000000000000000000000000000000",
  confidentialTokenAddress: "0x0000000000000000000000000000000000000000",
  isValid: false,
  underlying: { name: "", symbol: "", decimals: 18, totalSupply: 0n },
  confidential: { name: "", symbol: "", decimals: 18 },
} as const;
