import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "../lib/wagmi";

/**
 * A wallet-aware primary button. Flows:
 *   Connect Wallet → Switch to Sepolia → <readyHint> → <label/action>.
 *
 * Uses useAccount().chainId (the wallet's actual chain) rather than
 * useChainId() which can fall back to the wagmi config's default (Sepolia)
 * when the wallet is on a chain not in the config, silently bypassing the
 * wrong-network check.
 */
export function ActionButton({
  ready,
  readyHint,
  pending,
  pendingText = "Working…",
  label,
  onAction,
  className = "btn btn-primary btn-full",
}: {
  ready: boolean;
  readyHint: string;
  pending?: boolean;
  pendingText?: string;
  label: string;
  onAction: () => void;
  className?: string;
}) {
  const { isConnected, chainId: walletChainId } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  if (!isConnected) {
    const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];
    return (
      <button className={className} disabled={connecting} onClick={() => connect({ connector: injected })}>
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }
  if (walletChainId !== SEPOLIA_CHAIN_ID) {
    return (
      <button className={className} disabled={switching} onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}>
        {switching ? "Switching…" : "Switch to Sepolia"}
      </button>
    );
  }
  if (pending) {
    return <button className={className} disabled>{pendingText}</button>;
  }
  if (!ready) {
    return <button className={className} disabled>{readyHint}</button>;
  }
  return <button className={className} onClick={onAction}>{label}</button>;
}
