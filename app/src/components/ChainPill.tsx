import { useAccount, useChainId, useConnect, useSwitchChain } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "../lib/wagmi";

/**
 * Network pill. Not connected → connects. Connected on the wrong network →
 * shows "Wrong network" (red) and switches/adds Sepolia on click. On Sepolia →
 * shows the green status.
 */
export function ChainPill({ compact }: { compact?: boolean } = {}) {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switching } = useSwitchChain();

  const wrong = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  async function onClick() {
    try {
      if (!isConnected) {
        const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];
        await connect({ connector: injected });
        return;
      }
      if (chainId !== SEPOLIA_CHAIN_ID) {
        await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
      }
    } catch (err) {
      // Surfacing in console; the wallet shows its own rejection UI.
      console.error("Network switch failed", err);
    }
  }

  const label = !isConnected
    ? "Sepolia"
    : switching
      ? "Switching…"
      : connecting
        ? "Connecting…"
        : wrong
          ? "Wrong network"
          : "Sepolia";

  if (compact) {
    return (
      <button
        type="button"
        className={`chain-pill chain-pill-compact ${wrong ? "chain-wrong" : ""}`}
        disabled={switching || connecting}
        title={wrong ? "Wrong network — click to switch to Sepolia" : label}
        onClick={onClick}
      >
        <span className="chain-dot" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`chain-pill ${wrong ? "chain-wrong" : ""}`}
      disabled={switching || connecting}
      title={wrong ? "Wrong network — click to switch to Sepolia" : "Sepolia testnet"}
      onClick={onClick}
    >
      <span className="chain-dot" />
      {label}
    </button>
  );
}
