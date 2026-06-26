import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { usePairActions } from "../hooks/usePairActions";
import { TokenBadge } from "../components/TokenBadge";
import { PairSelect } from "../components/PairSelect";
import { Faucet } from "../components/Faucet";
import { QuickPicks, TxLine } from "../components/AmountField";
import { shortAddr, fmtAmount, displaySym, explorerAddress } from "../lib/format";

type Tab = "wrap" | "unwrap" | "decrypt" | "send" | "faucet";

export function PairPage() {
  const { address: confidentialAddress } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { data, isLoading } = useRegistryPairs();
  const zama = useZamaSdk();
  const [tab, setTab] = useState<Tab>("wrap");

  const items = data?.items ?? [];
  // With an address in the URL, show that pair. On the bare /app route (no
  // address), default to the first pair so the swap screen always has something.
  const pair = confidentialAddress
    ? items.find((p) => p.confidentialTokenAddress.toLowerCase() === confidentialAddress.toLowerCase())
    : items[0];

  const a = usePairActions(pair ?? PLACEHOLDER, zama);

  if (isLoading) return <div className="page"><div className="loading">Loading token...</div></div>;
  if (!pair) {
    return <div className="page"><div className="empty">Token not found. <Link to="/">Back to registry</Link></div></div>;
  }

  const { u, c } = a;
  const sendValid = isAddress(a.sendTo);
  const canAct = isConnected;

  return (
    <div className="token-page">
      <Link to="/" className="back-link">← Back to all tokens</Link>

      <section className="token-hero">
        <div className="pair-badges xl">
          <TokenBadge symbol={u.symbol} />
          <TokenBadge symbol={c.symbol} confidential />
        </div>
        <div>
          <h1>{displaySym(u.symbol)} to {displaySym(c.symbol)}</h1>
          <p>Wrap public {displaySym(u.symbol)} into confidential ERC-7984 tokens, then decrypt, send or unwrap from one focused screen.</p>
          <div className="pair-switcher">
            <span className="pair-switcher-label">Switch pair</span>
            <PairSelect
              pairs={items}
              value={pair.confidentialTokenAddress}
              onChange={(addr) => navigate(`/pair/${addr}`)}
            />
          </div>
          <div className="pair-hero-tags left">
            {pair.isValid ? <span className="tag tag-ok">Active Registry Pair</span> : <span className="tag tag-bad">Revoked</span>}
            <a className="tag tag-muted" href={explorerAddress(pair.tokenAddress)} target="_blank" rel="noreferrer">ERC-20 {shortAddr(pair.tokenAddress)} ↗</a>
            <a className="tag tag-muted" href={explorerAddress(pair.confidentialTokenAddress)} target="_blank" rel="noreferrer">ERC-7984 {shortAddr(pair.confidentialTokenAddress)} ↗</a>
          </div>
        </div>
      </section>

      <section className="action-shell-card">
        <div className="balance-strip">
          <div>
            <span>Public balance</span>
            <strong>{a.underlyingBal !== undefined ? fmtAmount(a.underlyingBal, u.decimals) : "..."} {displaySym(u.symbol)}</strong>
          </div>
          <div>
            <span>Confidential balance</span>
            {a.bal.value !== undefined ? (
              <strong>{fmtAmount(a.bal.value, c.decimals)} {displaySym(c.symbol)}</strong>
            ) : (
              <strong className="locked">Encrypted</strong>
            )}
          </div>
        </div>

        <div className="tabs big-tabs">
          <TabBtn id="wrap" tab={tab} setTab={setTab} label="Wrap" />
          <TabBtn id="unwrap" tab={tab} setTab={setTab} label="Unwrap" />
          <TabBtn id="decrypt" tab={tab} setTab={setTab} label="Decrypt" />
          <TabBtn id="send" tab={tab} setTab={setTab} label="Send" />
          <TabBtn id="faucet" tab={tab} setTab={setTab} label="Faucet" />
        </div>

        {!isConnected && <div className="connect-warning">Connect your wallet on Sepolia to execute transactions. You can still inspect the registry without connecting.</div>}

        <motion.div key={tab} className="action-body" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === "wrap" && (
            <ActionBlock eyebrow="You wrap" title={`${displaySym(u.symbol)} → ${displaySym(c.symbol)}`}>
              <BigAmountInput value={a.wrapAmt} onChange={a.setWrapAmt} symbol={displaySym(u.symbol)} />
              <QuickPicks base={a.underlyingBal} decimals={u.decimals} onPick={a.setWrapAmt} />
              <button className="btn btn-primary btn-full" onClick={a.doWrap} disabled={!canAct || a.wrapTx.status === "pending" || !a.wrapAmt}>
                {a.wrapTx.status === "pending" ? "Preparing wallet request..." : `Wrap ${displaySym(u.symbol)}`}
              </button>
              <TxLine tx={a.wrapTx} />
            </ActionBlock>
          )}

          {tab === "unwrap" && (
            <ActionBlock eyebrow="You unwrap" title={`${displaySym(c.symbol)} → ${displaySym(u.symbol)}`}>
              <BigAmountInput value={a.unwrapAmt} onChange={a.setUnwrapAmt} symbol={displaySym(c.symbol)} />
              {a.bal.value !== undefined ? <QuickPicks base={a.bal.value} decimals={c.decimals} onPick={a.setUnwrapAmt} /> : <div className="quick-hint">Decrypt first to use 25 / 50 / 75 / Max.</div>}
              <div className="split-buttons">
                <button className="btn btn-primary" onClick={() => a.doUnwrap(false)} disabled={!canAct || a.unwrapTx.status === "pending" || !a.unwrapAmt}>Unwrap amount</button>
                <button className="btn btn-dark" onClick={() => a.doUnwrap(true)} disabled={!canAct || a.unwrapTx.status === "pending"}>Unwrap all</button>
              </div>
              <TxLine tx={a.unwrapTx} />
            </ActionBlock>
          )}

          {tab === "decrypt" && (
            <ActionBlock eyebrow="Private read" title="Reveal your encrypted balance">
              <p className="action-copy">This does not publish anything on-chain. Your wallet signs an EIP-712 message and the decrypted value is shown only in your browser.</p>
              <div className="decrypt-display">
                {a.bal.loading ? (a.bal.msg ?? "Authorizing...") : a.bal.value !== undefined ? `${fmtAmount(a.bal.value, c.decimals)} ${displaySym(c.symbol)}` : "•••••• encrypted"}
              </div>
              <button className="btn btn-primary btn-full" onClick={a.decryptBalance} disabled={!canAct || a.bal.loading}>
                {a.bal.value !== undefined ? "Re-authorize & Decrypt" : "Authorize & Decrypt"}
              </button>
              {a.bal.error && <div className="tx-line err">{a.bal.error}</div>}
            </ActionBlock>
          )}

          {tab === "send" && (
            <ActionBlock eyebrow="Confidential transfer" title={`Send ${displaySym(c.symbol)}`}>
              <input className="address-box" placeholder="Recipient address (0x...)" value={a.sendTo} onChange={(e) => a.setSendTo(e.target.value)} />
              <BigAmountInput value={a.sendAmt} onChange={a.setSendAmt} symbol={displaySym(c.symbol)} />
              {a.bal.value !== undefined ? <QuickPicks base={a.bal.value} decimals={c.decimals} onPick={a.setSendAmt} /> : <div className="quick-hint">Decrypt first to pick a percentage. The transfer amount stays encrypted on-chain.</div>}
              <button className="btn btn-primary btn-full" onClick={() => a.doSend(sendValid)} disabled={!canAct || a.sendTx.status === "pending" || !sendValid || !a.sendAmt}>
                {a.sendTx.status === "pending" ? "Encrypting amount..." : "Send Confidentially"}
              </button>
              <TxLine tx={a.sendTx} />
            </ActionBlock>
          )}

          {tab === "faucet" && (
            <ActionBlock eyebrow="Test tokens" title={`Mint ${displaySym(u.symbol)} on Sepolia`}>
              <p className="action-copy">Use this only for the official Sepolia mock tokens. You still need free Sepolia ETH for gas.</p>
              <Faucet underlying={pair.tokenAddress} symbol={displaySym(u.symbol)} decimals={u.decimals} onMinted={() => a.refetchUnderlying()} />
            </ActionBlock>
          )}
        </motion.div>
      </section>
    </div>
  );
}

function ActionBlock({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="action-block-new">
      <div className="action-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function BigAmountInput({ value, onChange, symbol }: { value: string; onChange: (v: string) => void; symbol: string }) {
  return (
    <div className="amount-box">
      <input inputMode="decimal" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{symbol}</span>
    </div>
  );
}

function TabBtn({ id, tab, setTab, label }: { id: Tab; tab: Tab; setTab: (t: Tab) => void; label: string }) {
  return (
    <button className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
      {label}
      {tab === id && <motion.span layoutId="tab-underline" className="tab-underline" />}
    </button>
  );
}

const PLACEHOLDER = {
  tokenAddress: "0x0000000000000000000000000000000000000000",
  confidentialTokenAddress: "0x0000000000000000000000000000000000000000",
  isValid: false,
  underlying: { name: "", symbol: "", decimals: 18, totalSupply: 0n },
  confidential: { name: "", symbol: "", decimals: 18 },
} as const;