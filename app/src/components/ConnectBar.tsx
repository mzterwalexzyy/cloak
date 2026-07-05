import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "../lib/wagmi";
import { shortAddr } from "../lib/format";

export function ConnectBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];
  const wrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
      <button className="connect-addr-btn" onClick={copyAddress} title={copied ? "Copied!" : "Click to copy address"}>
        <span className="mono connect-addr-text">{shortAddr(address!)}</span>
        <span className="connect-copy-hint">{copied ? "✓ Copied" : "Copy"}</span>
      </button>
      <button className="connect-disconnect" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
