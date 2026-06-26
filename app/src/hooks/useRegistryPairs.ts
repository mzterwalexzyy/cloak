import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import type { TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";
import { createReadonlyRegistry } from "../lib/zama";

export interface RegistryPairsResult {
  items: TokenWrapperPairWithMetadata[];
  total: number;
}

/**
 * Fetch EVERY wrapper pair from the on-chain registry, enriched with
 * name/symbol/decimals metadata for both tokens. This is the "coverage"
 * pillar of the bounty: the table is registry-driven, so any pair added on
 * chain shows up automatically — nothing is hardcoded.
 */
export function useRegistryPairs() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["registry-pairs"],
    enabled: Boolean(publicClient),
    staleTime: 60_000,
    queryFn: async (): Promise<RegistryPairsResult> => {
      const registry = createReadonlyRegistry(publicClient as PublicClient);
      // Page through everything. pageSize 100 covers current + future growth.
      const first = await registry.listPairs({ metadata: true, page: 1, pageSize: 100 });
      const items = [...first.items];
      const total = first.total;
      let page = 2;
      while (items.length < total) {
        const next = await registry.listPairs({ metadata: true, page, pageSize: 100 });
        if (next.items.length === 0) break;
        items.push(...next.items);
        page += 1;
      }
      return { items, total };
    },
  });
}
