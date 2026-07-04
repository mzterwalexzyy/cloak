import { useState, useCallback } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseAbiItem, type Address } from "viem";
import artifact from "../lib/cloakAirdropArtifact.json";

const ABI = artifact.abi as any[];
const BYTECODE = artifact.bytecode as `0x${string}`;

// Batch size for addEligible() — keeps gas per tx reasonable
const BATCH = 200;

export interface ClaimStatus {
  isEligible: boolean;
  hasClaimed: boolean;
  deadlinePassed: boolean;
  limitReached: boolean;
  currentCount: bigint;
  limitVal: bigint;
  deadlineTs: bigint;
  feeWei: bigint;
  accumulatedFees: bigint;
}

export interface ClaimedEvent {
  claimant: Address;
  position: bigint;
  ts: bigint;
}

/** Deploy a new CloakAirdrop contract. Returns the deployed address. */
export function useDeployAirdrop() {
  const [status, setStatus] = useState<"idle" | "deploying" | "adding" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ batch: 0, total: 0 });

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const deploy = useCallback(async (
    deadlineTs: bigint,
    claimLimit: bigint,
    claimFeeWei: bigint,
    addresses: Address[],
  ): Promise<{ address: Address; blockNumber: bigint } | null> => {
    if (!walletClient || !publicClient) { setError("Wallet not connected"); return null; }
    setStatus("deploying");
    setError("");
    try {
      const hash = await walletClient.deployContract({
        abi: ABI,
        bytecode: BYTECODE,
        args: [deadlineTs, claimLimit, claimFeeWei],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const contractAddress = receipt.contractAddress!;

      // Batch addEligible calls
      const batches = [];
      for (let i = 0; i < addresses.length; i += BATCH) {
        batches.push(addresses.slice(i, i + BATCH));
      }
      setProgress({ batch: 0, total: batches.length });
      setStatus("adding");

      for (let i = 0; i < batches.length; i++) {
        const h = await walletClient.writeContract({
          address: contractAddress,
          abi: ABI,
          functionName: "addEligible",
          args: [batches[i]],
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
        setProgress({ batch: i + 1, total: batches.length });
      }

      setStatus("done");
      return { address: contractAddress, blockNumber: receipt.blockNumber };
    } catch (e) {
      setError(e instanceof Error ? e.message.slice(0, 200) : String(e));
      setStatus("error");
      return null;
    }
  }, [walletClient, publicClient]);

  return { deploy, status, error, progress };
}

/** Read claim status for an address from the contract. */
export async function fetchClaimStatus(
  publicClient: ReturnType<typeof usePublicClient>,
  contractAddress: Address,
  userAddress: Address,
): Promise<ClaimStatus> {
  const result = await publicClient!.readContract({
    address: contractAddress,
    abi: ABI,
    functionName: "getStatus",
    args: [userAddress],
  }) as [boolean, boolean, boolean, boolean, bigint, bigint, bigint, bigint, bigint];

  return {
    isEligible: result[0],
    hasClaimed: result[1],
    deadlinePassed: result[2],
    limitReached: result[3],
    currentCount: result[4],
    limitVal: result[5],
    deadlineTs: result[6],
    feeWei: result[7],
    accumulatedFees: result[8],
  };
}

/** Submit a claim tx, attaching the required fee (in wei). */
export async function submitClaim(
  walletClient: { writeContract: (params: any) => Promise<`0x${string}`> },
  publicClient: ReturnType<typeof usePublicClient>,
  contractAddress: Address,
  feeWei: bigint,
): Promise<string> {
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: ABI,
    functionName: "claim",
    args: [],
    value: feeWei,
  });
  await publicClient!.waitForTransactionReceipt({ hash });
  return hash;
}

const CLAIM_EVENT = parseAbiItem(
  "event ClaimRegistered(address indexed claimant, uint256 indexed position, uint256 ts)"
);

/** Fetch all ClaimRegistered events from the contract (ordered by position). */
export async function fetchClaimEvents(
  publicClient: ReturnType<typeof usePublicClient>,
  contractAddress: Address,
  deploymentBlock?: bigint,
): Promise<ClaimedEvent[]> {
  // Use stored deployment block so we don't query from genesis (RPC range limit).
  // Fall back to 200 000 blocks ago (~28 days on Sepolia) if unknown.
  let fromBlock = deploymentBlock;
  if (!fromBlock) {
    const latest = await publicClient!.getBlockNumber();
    fromBlock = latest > 200_000n ? latest - 200_000n : 0n;
  }

  const logs = await publicClient!.getLogs({
    address: contractAddress,
    event: CLAIM_EVENT,
    fromBlock,
    toBlock: "latest",
  });

  return logs
    .map((log) => {
      const args = log.args as { claimant: Address; position: bigint; ts: bigint };
      if (!args?.claimant) return null;
      return { claimant: args.claimant, position: args.position, ts: args.ts };
    })
    .filter((e): e is ClaimedEvent => e !== null)
    .sort((a, b) => Number(a.position - b.position));
}
