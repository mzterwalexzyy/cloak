import { useCallback, useRef } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import type { PublicClient, WalletClient } from "viem";
import type { ZamaSDK } from "@zama-fhe/sdk";
import { createSdk } from "../lib/zama";

export interface ZamaSdkHandle {
  /** Lazily build (and cache) the SDK. Throws a readable error if it can't. */
  getSdk: () => ZamaSDK;
  /** True when a wallet + RPC are available so actions can run. */
  ready: boolean;
}

/**
 * Returns a lazy SDK factory instead of a pre-built instance.
 *
 * Building the FHE SDK can fail (WASM worker, relayer, wallet not ready). The old
 * approach pre-built it in a hook and returned null on failure — which made every
 * action button silently dead with no error. Here we build on demand inside the
 * click handler so the real error surfaces in the UI, and buttons stay enabled
 * whenever a wallet is connected.
 */
export function useZamaSdk(): ZamaSdkHandle {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const cache = useRef<{ key: string; sdk: ZamaSDK } | null>(null);

  const getSdk = useCallback((): ZamaSDK => {
    if (!walletClient) throw new Error("Connect your wallet on Sepolia first.");
    if (!publicClient) throw new Error("No RPC connection — check your network.");
    const key = `${walletClient.account?.address ?? ""}:${walletClient.chain?.id ?? ""}`;
    if (cache.current?.key === key) return cache.current.sdk;
    const sdk = createSdk(publicClient as PublicClient, walletClient as WalletClient);
    cache.current = { key, sdk };
    return sdk;
  }, [publicClient, walletClient]);

  return { getSdk, ready: Boolean(publicClient && walletClient) };
}
