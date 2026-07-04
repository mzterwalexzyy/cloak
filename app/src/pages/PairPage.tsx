import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { isAddress } from "viem";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { usePairActions } from "../hooks/usePairActions";
import { PairSelect } from "../components/PairSelect";
import { TokenBadge } from "../components/TokenBadge";
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

  if (isLoading) return <div className="pair-page-new"><div className="loading">Loading token…</div></div>;
  if (!pair) {
    return <div className="pair-page-new"><div className="empty">Token not found. <Link to="/#registry">Back to registry</Link></div></div>;
  }

  const { u, c } = a;
  const sendValid = isAddress(a.sendTo);

  return (
    <div className="pair-page-new">
      <div className="pair-page-head">
        <Link to="/#registry" className="back-link">← Back</Link>
        <div className="pair-page-identity">
          <div className="pair-page-badges">
            <TokenBadge symbol={u.symbol} />
            <TokenBadge symbol={c.symbol} confidential />
          </div>
          <div>
            <h1 className="pair-page-title">{displaySym(u.symbol)} → {displaySym(c.symbol)}</h1>
            <p className="pair-page-sub">{u.name}</p>
          </div>
          <span className={`pair-status-badge ${pair.isValid ? "pair-status-active" : "pair-status-revoked"}`}>
            {pair.isValid ? "● Active" : "Revoked"}
          </span>
        </div>
      </div>

      <div className="pair-page-layout">
        {/* ── Left: balances + tabs + actions ── */}
        <motion.div
          className="pair-main-col"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Balance strip */}
          <div className="pair-balances">
            <div className="pair-balance-item">
              <span>{displaySym(u.symbol)} balance</span>
              <strong>{a.underlyingBal !== undefined ? fmtAmount(a.underlyingBal, u.decimals) : "—"} {displaySym(u.symbol)}</strong>
            </div>
            <div className="pair-balance-item pair-balance-conf">
              <span>c{displaySym(u.symbol)} balance</span>
              {a.bal.value !== undefined
                ? <strong>{fmtAmount(a.bal.value, c.decimals)} {displaySym(c.symbol)}</strong>
                : <strong className="pair-balance-locked">🔒 {fmtAmount(0n, c.decimals)} c{displaySym(u.symbol)}</strong>}
            </div>
          </div>

          {/* Pair selector */}
          <div className="pair-selector-row">
            <PairSelect pairs={items} value={pair.confidentialTokenAddress} onChange={(addr) => navigate(`/pair/${addr}`)} />
          </div>

          {/* Action tabs */}
          <div className="pair-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`pair-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {tab === t.id && <motion.span layoutId="pair-tab-ul" className="pair-tab-ul" />}
              </button>
            ))}
          </div>

          {/* Action body */}
          <motion.div
            key={tab}
            className="pair-action-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "wrap" && (
              <>
                <p className="pair-action-desc">Deposit {displaySym(u.symbol)} into the FHE wrapper. Your balance becomes encrypted.</p>
                <AmountField label={`Wrap ${displaySym(u.symbol)} → ${displaySym(c.symbol)}`} value={a.wrapAmt} onChange={a.setWrapAmt} symbol={displaySym(u.symbol)} />
                <QuickPicks base={a.underlyingBal} decimals={u.decimals} onPick={a.setWrapAmt} />
                <ActionButton
                  ready={!!a.wrapAmt}
                  readyHint="Enter an amount"
                  pending={a.wrapTx.status === "pending"}
                  pendingText="Confirm in your wallet…"
                  label={`Wrap →`}
                  onAction={a.doWrap}
                />
                <TxLine tx={a.wrapTx} />
              </>
            )}

            {tab === "unwrap" && (
              <>
                <p className="pair-action-desc">Redeem {displaySym(c.symbol)} back to public {displaySym(u.symbol)}.</p>
                <AmountField label={`Unwrap ${displaySym(c.symbol)} → ${displaySym(u.symbol)}`} value={a.unwrapAmt} onChange={a.setUnwrapAmt} symbol={displaySym(c.symbol)} />
                {a.bal.value !== undefined
                  ? <QuickPicks base={a.bal.value} decimals={c.decimals} onPick={a.setUnwrapAmt} />
                  : <div className="pair-hint">Decrypt your balance to use 25 / 50 / 75 / Max.</div>}
                <ActionButton
                  ready={!!a.unwrapAmt}
                  readyHint="Enter an amount"
                  pending={a.unwrapTx.status === "pending"}
                  pendingText="Unwrapping…"
                  label="Unwrap"
                  onAction={() => a.doUnwrap(false)}
                />
                <button className="pair-link-btn" onClick={() => a.doUnwrap(true)} disabled={a.unwrapTx.status === "pending"}>
                  or unwrap your entire balance
                </button>
                <TxLine tx={a.unwrapTx} />
              </>
            )}

            {tab === "decrypt" && (
              <>
                <p className="pair-action-desc">Nothing is published on-chain. Your wallet signs an EIP-712 message and the decrypted value is shown only to you.</p>
                <div className="pair-decrypt-display">
                  {a.bal.loading ? (
                    <span className="pair-decrypt-status"><span className="spinner" />{a.bal.msg ?? "Authorizing…"}</span>
                  ) : a.bal.value !== undefined ? (
                    <span className="pair-decrypt-value">{fmtAmount(a.bal.value, c.decimals)} {displaySym(c.symbol)}</span>
                  ) : (
                    <span className="pair-decrypt-status">•••••• encrypted</span>
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
                <p className="pair-action-desc">Send {displaySym(c.symbol)} confidentially. The recipient address is visible; the amount is not.</p>
                <input className="pair-address-input" placeholder="Recipient address (0x…)" value={a.sendTo} onChange={(e) => a.setSendTo(e.target.value)} />
                <AmountField label={`Send ${displaySym(c.symbol)} privately`} value={a.sendAmt} onChange={a.setSendAmt} symbol={displaySym(c.symbol)} />
                {a.bal.value !== undefined
                  ? <QuickPicks base={a.bal.value} decimals={c.decimals} onPick={a.setSendAmt} />
                  : <div className="pair-hint">Decrypt your balance to pick a %. The transfer amount stays encrypted on-chain.</div>}
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
                <p className="pair-action-desc">Mint free test {displaySym(u.symbol)} on Sepolia. You still need a little Sepolia ETH for gas.</p>
                <Faucet underlying={pair.tokenAddress} symbol={displaySym(u.symbol)} decimals={u.decimals} onMinted={() => a.refetchUnderlying()} />
              </>
            )}
          </motion.div>
        </motion.div>

        {/* ── Right: pair info sidebar ── */}
        <motion.div
          className="pair-info-sidebar"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pair-info-title">Pair info</div>
          <div className="pair-info-rows">
            <PairInfoRow label="Underlying" value={displaySym(u.symbol)} />
            <PairInfoRow label="Encrypted" value={displaySym(c.symbol)} />
            <PairInfoRow label="FHE protocol" value="Zama FHE" />
            <PairInfoRow label="Standard" value="ERC-7984" />
            <PairInfoRow
              label="Status"
              value={
                <span className={pair.isValid ? "pair-info-active" : "pair-info-revoked"}>
                  {pair.isValid ? "Active" : "Revoked"}
                </span>
              }
            />
          </div>
          <div className="pair-info-addrs">
            <div className="pair-info-addr-row">
              <span>Wrapper</span>
              <a href={explorerAddress(pair.confidentialTokenAddress)} target="_blank" rel="noreferrer" className="mono">
                {shortAddr(pair.confidentialTokenAddress)} ↗
              </a>
            </div>
            <div className="pair-info-addr-row">
              <span>Registry</span>
              <a href={explorerAddress("0x2f0750Bbb0A246059d80e94c454586a7F27a128e")} target="_blank" rel="noreferrer" className="mono">
                0x2f07…128e ↗
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AmountField({ label, value, onChange, symbol }: { label: string; value: string; onChange: (v: string) => void; symbol: string }) {
  return (
    <div className="pair-amount-field">
      <div className="pair-amount-label">{label}</div>
      <div className="pair-amount-box">
        <input inputMode="decimal" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} />
        <span>{symbol}</span>
      </div>
    </div>
  );
}

function PairInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="pair-info-row">
      <span className="pair-info-label">{label}</span>
      <span className="pair-info-value">{value}</span>
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
