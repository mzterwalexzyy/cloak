import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "../lib/wagmi";

/**
 * Clickable network pill. Tapping it asks the wallet to switch to (or add)
 * Sepolia. Turns red when connected on the wrong network.
 */
export function ChainPill() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const wrong = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  return (
    <button
      type="button"
      className={`chain-pill ${wrong ? "chain-wrong" : ""}`}
      disabled={isPending}
      title={wrong ? "Wrong network — switch to Sepolia" : "Switch / add the Sepolia network"}
      onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
    >
      <span className="chain-dot" />
      {isPending ? "Switching…" : wrong ? "Wrong network" : "Sepolia"}
    </button>
  );
}
