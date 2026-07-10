import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAccount, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { SEPOLIA_CHAIN_ID } from "../lib/wagmi";
import { shortAddr } from "../lib/format";
import { WalletModal } from "./WalletModal";

export function ConnectBar() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const wrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isConnected) {
    return (
      <>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Connect Wallet
        </button>
        <AnimatePresence>
          {showModal && <WalletModal onClose={() => setShowModal(false)} />}
        </AnimatePresence>
      </>
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
      <button className="connect-disconnect" onClick={() => disconnect({ connector })}>
        Disconnect
      </button>
    </div>
  );
}
