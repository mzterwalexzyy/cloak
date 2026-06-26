import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "../lib/wagmi";
import { shortAddr } from "../lib/format";

export function ConnectBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];
  const wrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  if (!isConnected) {
    return (
      <button className="btn btn-primary" disabled={isPending} onClick={() => connect({ connector: injected })}>
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button className="btn btn-warn" onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}>
        Switch to Sepolia
      </button>
    );
  }

  return (
    <div className="connect-pill">
      <span className="dot" />
      <span className="mono">{shortAddr(address!)}</span>
      <button className="btn btn-ghost" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
