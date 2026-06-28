import { useAccount, useChainId, useConnect, useSwitchChain } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "../lib/wagmi";

/**
 * A wallet-aware primary button. Instead of silently disabling when the user
 * isn't connected / on the wrong network, it flows:
 *   Connect Wallet → Switch to Sepolia → <readyHint> → <label/action>.
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
  const { isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();

  if (!isConnected) {
    const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];
    return (
      <button className={className} disabled={connecting} onClick={() => connect({ connector: injected })}>
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }
  if (chainId !== SEPOLIA_CHAIN_ID) {
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
