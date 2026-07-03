import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { useZamaSdk } from "../hooks/useZamaSdk";
import { usePairActions } from "../hooks/usePairActions";
import { PairTile } from "../components/PairTile";
import { PairSelect } from "../components/PairSelect";
import { ActionButton } from "../components/ActionButton";
import { TokenBadge } from "../components/TokenBadge";
import { QuickPicks, TxLine } from "../components/AmountField";
import { displaySym, fmtAmount } from "../lib/format";
import type { TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";

type StatusFilter = "all" | "active" | "revoked";

export function RegistryPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useRegistryPairs();
  const zama = useZamaSdk();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<StatusFilter>("all");

  // Sync the search box when the header search navigates here with ?q=…
  useEffect(() => {
    const qp = searchParams.get("q");
    if (qp !== null) setQ(qp);
  }, [searchParams]);

  // SPA hash links don't auto-scroll — scroll to the registry section when
  // arriving via /#registry (e.g. the "All pairs" back button or nav search).
  const location = useLocation();
  useEffect(() => {
    if (location.hash !== "#registry") return;
    const t = setTimeout(() => {
      document.getElementById("registry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, [location.hash, location.key]);
  const [selectedAddress, setSelectedAddress] = useState("");

  const pairs = useMemo(() => data?.items ?? [], [data]);
  const selectedPair = pairs.find((p) => p.confidentialTokenAddress === selectedAddress) ?? pairs[0] ?? PLACEHOLDER;
  const a = usePairActions(selectedPair, zama);

  useEffect(() => {
    if (!selectedAddress && pairs[0]) setSelectedAddress(pairs[0].confidentialTokenAddress);
  }, [pairs, selectedAddress]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // Deduplicate: if the registry has multiple wrappers for the same underlying
    // token address, keep only the first (most recently active takes precedence
    // when sorted active-first below).
    // Deduplicate: keep one wrapper per underlying symbol (active preferred over revoked).
    // The Zama registry can have multiple wrapper versions for the same token.
    // Deduplicate: keep one wrapper per underlying token (active before revoked).
    // Some registry entries have both a "Mock" and non-Mock symbol for the same token
    // (e.g. "tGBPMock" vs "tGBP"). Strip the Mock suffix so they collapse to one key.
    const seen = new Set<string>();
    const deduped = [...pairs]
      .sort((a, b) => (a.isValid === b.isValid ? 0 : a.isValid ? -1 : 1))
      .filter((p) => {
        const key = p.underlying.symbol.toLowerCase().replace(/mock$/, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return deduped.filter((p) => {
      if (status === "active" && !p.isValid) return false;
      if (status === "revoked" && p.isValid) return false;
      if (!needle) return true;
      return (
        p.underlying.symbol.toLowerCase().includes(needle) ||
        p.confidential.symbol.toLowerCase().includes(needle) ||
        p.underlying.name.toLowerCase().includes(needle) ||
        p.confidential.name.toLowerCase().includes(needle) ||
        p.tokenAddress.toLowerCase().includes(needle) ||
        p.confidentialTokenAddress.toLowerCase().includes(needle)
      );
    });
  }, [pairs, q, status]);

  const total = data?.total ?? 0;
  const active = pairs.filter((p) => p.isValid).length;
  const hasPair = selectedPair !== PLACEHOLDER;

  return (
    <div className="home-page">
      <section className="zama-hero">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-kicker">Zama FHE wrappers on Sepolia</div>
          <h1>
            Wrap tokens.<br />
            Hide balances.<br />
            <span>Stay composable.</span>
          </h1>
          <p>
            A focused interface for the official Zama Wrapper Registry. Pick a token, wrap it into
            an ERC-7984 confidential asset, decrypt only for yourself, then send hidden amounts.
          </p>
          <div className="hero-buttons">
            <Link to="/app" data-tour="start" className="btn btn-primary btn-big">Start Wrapping</Link>
            <Link to="/about" className="btn btn-light btn-big">Read the flow ↗</Link>
          </div>
        </motion.div>

        <motion.div
          id="wrap-app"
          data-tour="console"
          className="zama-console"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="console-head">
            <div>
              <span>Wrapper Console</span>
              <strong>{hasPair ? `${displaySym(selectedPair.underlying.symbol)} → ${displaySym(selectedPair.confidential.symbol)}` : "Loading pairs"}</strong>
            </div>
            <div className="console-live"><i /> Live registry</div>
          </div>

          <div className="swap-panel">
            <div className="swap-label">Token to wrap</div>
            <PairSelect
              pairs={pairs}
              value={selectedPair.confidentialTokenAddress}
              onChange={(addr) => {
                setSelectedAddress(addr);
                a.setWrapAmt("");
              }}
            />
          </div>

          <div className="swap-panel amount-panel">
            <div className="swap-label">Amount</div>
            <div className="amount-line">
              <input inputMode="decimal" placeholder="0" value={a.wrapAmt} onChange={(e) => a.setWrapAmt(e.target.value)} />
              <div className="token-chip">
                <TokenBadge symbol={selectedPair.underlying.symbol} />
                <strong>{displaySym(selectedPair.underlying.symbol)}</strong>
              </div>
            </div>
            <div className="balance-line">
              Balance: {a.underlyingBal !== undefined ? fmtAmount(a.underlyingBal, selectedPair.underlying.decimals) : "..."}
            </div>
            <QuickPicks base={a.underlyingBal} decimals={selectedPair.underlying.decimals} onPick={a.setWrapAmt} />
          </div>

          <div className="receive-preview">
            <span>You receive</span>
            <div>
              <TokenBadge symbol={selectedPair.confidential.symbol} confidential />
              <strong>{displaySym(selectedPair.confidential.symbol)}</strong>
              <small>encrypted balance</small>
            </div>
          </div>

          <ActionButton
            ready={!!a.wrapAmt}
            readyHint="Enter an amount"
            pending={a.wrapTx.status === "pending"}
            pendingText="Confirm in your wallet…"
            label={`Wrap ${displaySym(selectedPair.underlying.symbol)}`}
            onAction={a.doWrap}
          />
          <TxLine tx={a.wrapTx} />

          <div className="console-mini-actions">
            <button className="mini-action" onClick={a.decryptBalance} disabled={!zama.ready || a.bal.loading}>
              {a.bal.loading ? (a.bal.msg ?? "Authorizing...") : "Authorize & Decrypt"}
            </button>
            <Link className="mini-action" to={hasPair ? `/pair/${selectedPair.confidentialTokenAddress}` : "/"}>Advanced actions</Link>
          </div>
          {a.bal.value !== undefined && (
            <div className="console-balance">Private balance: {fmtAmount(a.bal.value, selectedPair.confidential.decimals)} {displaySym(selectedPair.confidential.symbol)}</div>
          )}
          {a.bal.error && <div className="tx-line err">{a.bal.error}</div>}
        </motion.div>
      </section>

      <section className="proof-section fresh">
        <h2>Built for private balances. Not anonymous transfers.</h2>
        <p>
          The app hides balances and transfer amounts while keeping the registry, token pairs, and transaction history composable on public Ethereum Sepolia.
        </p>
        <div className="proof-grid">
          <InfoCard title="Registry native" body="Every token pair is loaded from Zama's official wrapper registry, not a hand-made list." />
          <InfoCard title="Owner-only reveal" body="Decrypting asks your wallet for authorization before showing the balance in your browser." />
          <InfoCard title="Full lifecycle" body="Wrap, unwrap, decrypt, confidential send, and faucet — the complete token privacy flow in one place." />
        </div>
      </section>

      <section id="registry" className="registry-section compact-registry">
        <div className="section-top">
          <div data-tour="pairs">
            <h2>Supported pairs</h2>
            <p>{isLoading ? "Loading wrapper pairs..." : `${active}/${total} active pairs loaded from the Zama registry.`}</p>
          </div>
          <button className="btn btn-dark" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="controls clean-controls">
          <input className="search" placeholder="Search token, wrapper or address" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg">
            {(["all", "active", "revoked"] as StatusFilter[]).map((s) => (
              <button key={s} className={`seg-btn ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="pair-list relay-list">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="tile skeleton" />)}
          {isError && <div className="empty err">Failed to load registry: {error instanceof Error ? error.message : "unknown error"}</div>}
          {!isLoading && !isError && filtered.length === 0 && <div className="empty">No pairs match “{q}”.</div>}
          {filtered.map((p, i) => <PairTile key={p.confidentialTokenAddress} pair={p} index={i} />)}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="info-card">
      <div className="info-icon">✧</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

const PLACEHOLDER = {
  tokenAddress: "0x0000000000000000000000000000000000000000",
  confidentialTokenAddress: "0x0000000000000000000000000000000000000000",
  isValid: false,
  underlying: { name: "", symbol: "", decimals: 18, totalSupply: 0n },
  confidential: { name: "", symbol: "", decimals: 18 },
} as const satisfies TokenWrapperPairWithMetadata;