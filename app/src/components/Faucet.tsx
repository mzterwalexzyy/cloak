import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { explorerTx } from "../lib/format";

/**
 * Faucet for the official cTokenMock underlying ERC-20s. Every underlying mock
 * exposes a permissionless `mint(address,uint256)` (verified on-chain), so any
 * user can self-mint test tokens and immediately try the wrap flow — no
 * external faucet hunting required.
 */
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

const DEFAULT_MINT = 1000;

export function Faucet({
  underlying,
  symbol,
  decimals,
  onMinted,
}: {
  underlying: `0x${string}`;
  symbol: string;
  decimals: number;
  onMinted?: () => void;
}) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<{ status: "idle" | "pending" | "ok" | "error"; msg?: string; hash?: string }>({
    status: "idle",
  });

  async function mint() {
    if (!address) return;
    setState({ status: "pending", msg: `Minting ${DEFAULT_MINT} ${symbol}…` });
    try {
      const hash = await writeContractAsync({
        address: underlying,
        abi: MINT_ABI,
        functionName: "mint",
        args: [address, parseUnits(String(DEFAULT_MINT), decimals)],
      });
      setState({ status: "pending", msg: "Confirming…", hash });
      await publicClient?.waitForTransactionReceipt({ hash });
      setState({ status: "ok", msg: `Minted ${DEFAULT_MINT} ${symbol} ✓`, hash });
      onMinted?.();
    } catch (e) {
      setState({ status: "error", msg: e instanceof Error ? e.message.slice(0, 140) : String(e) });
    }
  }

  return (
    <div className="faucet">
      <button className="btn btn-primary btn-block" onClick={mint} disabled={state.status === "pending" || !address}>
        {state.status === "pending" ? "Minting…" : `⛲ Mint ${DEFAULT_MINT} ${symbol}`}
      </button>
      <div className="faucet-hint">Mints to your wallet on Sepolia · needs a little free test ETH for gas.</div>
      {state.status !== "idle" && (
        <div className={`tx-line ${state.status === "error" ? "err" : state.status === "ok" ? "ok" : "muted"}`}>
          {state.status === "pending" && <span className="spinner" />}
          {state.msg}
          {state.hash && (
            <a className="mono tx-link" href={explorerTx(state.hash)} target="_blank" rel="noreferrer">
              view tx ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
