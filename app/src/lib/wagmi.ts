import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * The app is Sepolia-only — the Zama Wrappers Registry and the official
 * cTokenMock wrappers are deployed there. We guard the UI against any other
 * chain so write operations can never hit the wrong network.
 */
export const SEPOLIA_CHAIN_ID = sepolia.id; // 11155111

// viem's built-in default Sepolia RPC (rpc.sepolia.org) is unreliable and
// frequently 404s, so we pin a known-good public endpoint. Override with
// VITE_SEPOLIA_RPC_URL (e.g. an Alchemy/Infura key) for production reliability.
const DEFAULT_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || DEFAULT_SEPOLIA_RPC),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
