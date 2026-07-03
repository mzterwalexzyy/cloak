import { http, createConfig, fallback } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const SEPOLIA_CHAIN_ID = sepolia.id; // 11155111

// Priority: env var (Alchemy/Infura) → Ankr free tier → dRPC → publicnode fallback
const buildTransport = () => {
  const sources = [
    import.meta.env.VITE_SEPOLIA_RPC_URL,
    "https://rpc.ankr.com/eth_sepolia",
    "https://sepolia.drpc.org",
    "https://ethereum-sepolia-rpc.publicnode.com",
  ].filter(Boolean) as string[];
  return fallback(sources.map((url) => http(url)));
};

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: buildTransport(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
