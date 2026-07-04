import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { motion } from "framer-motion";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { TokenBadge } from "../components/TokenBadge";
import { displaySym } from "../lib/format";
import { explorerTx } from "../lib/format";

const MINT_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const MINT_AMOUNT = 1000;

function FaucetCard({
  underlying,
  symbol,
  name,
  decimals,
  index,
}: {
  underlying: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  index: number;
}) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<{ status: "idle" | "pending" | "ok" | "error"; msg?: string; hash?: string }>({ status: "idle" });

  const sym = displaySym(symbol);

  async function mint() {
    if (!address) return;
    setState({ status: "pending" });
    try {
      const hash = await writeContractAsync({
        address: underlying,
        abi: MINT_ABI,
        functionName: "mint",
        args: [address, parseUnits(String(MINT_AMOUNT), decimals)],
      });
      setState({ status: "pending", hash });
      await publicClient?.waitForTransactionReceipt({ hash });
      setState({ status: "ok", msg: `Minted ${MINT_AMOUNT} ${sym} ✓`, hash });
    } catch (e) {
      setState({ status: "error", msg: e instanceof Error ? e.message.slice(0, 100) : String(e) });
    }
  }

  return (
    <motion.div
      className="faucet-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="faucet-card-head">
        <TokenBadge symbol={symbol} />
        <div className="faucet-card-meta">
          <span className="faucet-card-sym">{sym} <span className="faucet-card-mock">(Mock)</span></span>
          <span className="faucet-card-name">{name.replace(" (Mock)", "").replace("Mock", "").trim()}</span>
        </div>
      </div>

      <div className="faucet-card-amount">
        {MINT_AMOUNT.toLocaleString()}.00
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={mint}
        disabled={state.status === "pending" || !address}
      >
        {state.status === "pending" ? <><span className="spinner" />Minting…</> : `Mint ${sym}`}
      </button>

      <div className="faucet-card-limit">
        {state.status === "ok" && state.hash ? (
          <a className="tx-link" href={explorerTx(state.hash)} target="_blank" rel="noreferrer">
            {state.msg} · view tx ↗
          </a>
        ) : state.status === "error" ? (
          <span className="faucet-err">{state.msg}</span>
        ) : (
          <span>Sepolia testnet · free for testing</span>
        )}
      </div>
    </motion.div>
  );
}

export function FaucetPage() {
  const { data, isLoading } = useRegistryPairs();
  const pairs = data?.items ?? [];

  return (
    <div className="faucet-page">
      <motion.div
        className="faucet-page-head"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>Test token faucet</h1>
        <p>Mint test tokens so you can wrap them.</p>
      </motion.div>

      {isLoading ? (
        <div className="faucet-grid-new">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="faucet-card faucet-card-skeleton" />
          ))}
        </div>
      ) : (
        <div className="faucet-grid-new">
          {pairs.map((p, i) => (
            <FaucetCard
              key={p.tokenAddress}
              underlying={p.tokenAddress as `0x${string}`}
              symbol={p.underlying.symbol}
              name={p.underlying.name}
              decimals={p.underlying.decimals}
              index={i}
            />
          ))}
        </div>
      )}

      <div className="faucet-footnote">
        Faucet tokens are for testing only on Sepolia.
      </div>
    </div>
  );
}
