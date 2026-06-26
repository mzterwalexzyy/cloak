import { ZamaSDK, WrappersRegistry } from "@zama-fhe/sdk";
import { createConfig as createZamaConfig, ViemProvider } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import { sepolia as sepoliaFhe } from "@zama-fhe/sdk/chains";
import type { PublicClient, WalletClient } from "viem";

/**
 * A read-only registry instance backed only by a viem PublicClient.
 *
 * This powers registry browsing with NO wallet connected — anyone can land on
 * the app and immediately see every ERC-20 ↔ ERC-7984 pair on Sepolia.
 */
export function createReadonlyRegistry(publicClient: PublicClient): WrappersRegistry {
  const provider = new ViemProvider({ publicClient });
  return new WrappersRegistry({ provider });
}

/**
 * The full SDK — required for write paths (wrap/unwrap) and FHE user-decryption.
 * Needs a connected wallet (walletClient).
 */
export function createSdk(publicClient: PublicClient, walletClient: WalletClient): ZamaSDK {
  const config = createZamaConfig({
    chains: [sepoliaFhe],
    publicClient,
    walletClient,
    relayers: { [sepoliaFhe.id]: web() },
  });
  return new ZamaSDK(config);
}

export { sepoliaFhe };
