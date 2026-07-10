import { useState, useCallback } from "react";
import { isAddress, getAddress } from "viem";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import { toBaseUnits, explorerTx } from "../lib/format";
import type { ZamaSdkHandle } from "./useZamaSdk";
import {
  CLOAK_DISPERSE_ADDRESS,
  CLOAK_DISPERSE_ABI,
  SET_OPERATOR_ABI,
  IS_OPERATOR_ABI,
  OPERATOR_UNTIL_MAX,
} from "../lib/disperseContract";

export interface RecipientRow {
  id: string;
  address: string;
  amount: string;
  parseError?: string;
  status: "idle" | "pending" | "ok" | "error";
  txHash?: string;
  errMsg?: string;
}

export type DisperseStatus = "idle" | "approving" | "encrypting" | "sending" | "done";

/**
 * Returns a human-readable explanation of why an address is invalid.
 * Distinguishes EVM-specific mistakes from cross-chain confusion.
 */
export function diagnoseAddress(addr: string): string {
  const trimmed = addr.trim();

  if (!trimmed.startsWith("0x") && !trimmed.startsWith("0X")) {
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      return "Looks like a Solana address. Cloak runs on Ethereum. Use an EVM (0x…) address.";
    }
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed) || /^bc1[a-z0-9]{6,87}$/i.test(trimmed)) {
      return "Looks like a Bitcoin address. Cloak runs on Ethereum. Use an EVM (0x…) address.";
    }
    if (/^[A-Za-z0-9]{32,64}$/.test(trimmed)) {
      return "Unrecognised address format. EVM addresses start with 0x followed by 40 hex characters.";
    }
    return "Not an Ethereum address. Must start with 0x.";
  }

  const hex = trimmed.slice(2);

  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    return "Contains non-hex characters after 0x. EVM addresses use 0-9 and a-f only.";
  }

  if (hex.length < 40) {
    return `Incomplete address: ${trimmed.length} chars, needs 42 (0x + 40 hex digits).`;
  }

  if (hex.length === 64) {
    return "Looks like an Aptos or SUI address (0x + 64 hex). EVM addresses are 0x + 40 hex.";
  }

  if (hex.length > 40) {
    return `Too long: ${trimmed.length} chars. EVM addresses are exactly 42 characters.`;
  }

  return "Invalid EIP-55 checksum. Double-check the address or use the all-lowercase version.";
}

/** Parse a free-form recipient list (one per line: `address, amount` or `address amount`). */
export function parseRecipientText(text: string): RecipientRow[] {
  const rows = text
    .split("\n")
    .map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return null;
      const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
      const id = String(i);
      if (parts.length < 2) {
        return { id, address: trimmed, amount: "", parseError: "Missing amount. Expected: address, amount", status: "idle" } as RecipientRow;
      }
      const [addr, amount, ...rest] = parts;
      if (rest.length > 0) {
        return { id, address: addr, amount, parseError: "Too many fields. Expected only: address, amount", status: "idle" } as RecipientRow;
      }
      if (!isAddress(addr, { strict: false })) {
        return { id, address: addr, amount, parseError: diagnoseAddress(addr), status: "idle" } as RecipientRow;
      }
      const checksumAddr = getAddress(addr);
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return { id, address: checksumAddr, amount, parseError: `Amount "${amount}" is not a positive number`, status: "idle" } as RecipientRow;
      }
      return { id, address: checksumAddr, amount, status: "idle" } as RecipientRow;
    })
    .filter((r): r is RecipientRow => r !== null);

  const seen = new Map<string, number>();
  return rows.map((row, i) => {
    if (row.parseError) return row;
    const key = row.address.toLowerCase();
    if (seen.has(key)) {
      return { ...row, parseError: `Duplicate address, already listed at row ${seen.get(key)}` };
    }
    seen.set(key, i + 1);
    return row;
  });
}

export function useDisperse(zama: ZamaSdkHandle) {
  const [rows, setRows] = useState<RecipientRow[]>([]);
  const [disperseStatus, setDisperseStatus] = useState<DisperseStatus>("idle");
  const [batchTxHash, setBatchTxHash] = useState<string | undefined>(undefined);
  const [isOperator, setIsOperator] = useState<boolean | null>(null);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address: userAddress } = useAccount();

  /** Check if CloakDisperse is approved as an operator on the given token. */
  const checkIsOperator = useCallback(async (tokenAddress: string): Promise<boolean> => {
    if (!publicClient || !userAddress || !CLOAK_DISPERSE_ADDRESS.startsWith("0x")) return false;
    try {
      const result = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: IS_OPERATOR_ABI,
        functionName: "isOperator",
        args: [userAddress, CLOAK_DISPERSE_ADDRESS as `0x${string}`],
      });
      setIsOperator(Boolean(result));
      return Boolean(result);
    } catch {
      setIsOperator(false);
      return false;
    }
  }, [publicClient, userAddress]);

  /** Approve CloakDisperse as an operator for this token. One-time per token per wallet. */
  async function approveOperator(tokenAddress: string): Promise<string> {
    if (!walletClient || !userAddress) throw new Error("Wallet not connected.");
    if (!CLOAK_DISPERSE_ADDRESS.startsWith("0x")) throw new Error("Disperse contract not yet deployed.");

    setDisperseStatus("approving");
    const hash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: SET_OPERATOR_ABI,
      functionName: "setOperator",
      args: [CLOAK_DISPERSE_ADDRESS as `0x${string}`, OPERATOR_UNTIL_MAX],
    });
    if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
    setIsOperator(true);
    setDisperseStatus("idle");
    return hash;
  }

  /**
   * V2 batch dispatch: generate ONE proof for all recipients, submit ONE transaction.
   * Requires CloakDisperse to be approved as operator first (see approveOperator).
   */
  async function runDisperse(tokenAddress: string, decimals: number) {
    const valid = rows.filter((r) => !r.parseError);
    if (!valid.length) return;
    if (!walletClient || !userAddress) throw new Error("Wallet not connected.");
    if (!CLOAK_DISPERSE_ADDRESS.startsWith("0x")) throw new Error("Disperse contract not yet deployed.");

    setDisperseStatus("encrypting");
    setBatchTxHash(undefined);
    setRows((prev) => prev.map((r) => r.parseError ? r : { ...r, status: "pending", txHash: undefined, errMsg: undefined }));

    try {
      const sdk = zama.getSdk();

      // Generate all encrypted amounts for the TOKEN contract address in one proof
      const { encryptedValues, inputProof } = await sdk.encrypt({
        values: valid.map((r) => ({
          value: toBaseUnits(r.amount, decimals),
          type: "euint64" as const,
        })),
        contractAddress: tokenAddress as `0x${string}`,
        userAddress,
      });

      setDisperseStatus("sending");

      // Single transaction — all recipients at once
      const hash = await walletClient.writeContract({
        address: CLOAK_DISPERSE_ADDRESS as `0x${string}`,
        abi: CLOAK_DISPERSE_ABI,
        functionName: "disperseConfidential",
        args: [
          tokenAddress as `0x${string}`,
          userAddress,
          valid.map((r) => r.address as `0x${string}`),
          encryptedValues as `0x${string}`[],
          inputProof as `0x${string}`,
        ],
      });

      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      setBatchTxHash(hash);
      setRows((prev) =>
        prev.map((r) => r.parseError ? r : { ...r, status: "ok", txHash: hash })
      );
      setDisperseStatus("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message.slice(0, 200) : String(e);
      setRows((prev) =>
        prev.map((r) => r.parseError ? r : { ...r, status: "error", errMsg: msg })
      );
      setDisperseStatus("idle");
      throw e;
    }
  }

  function reset() {
    setRows([]);
    setDisperseStatus("idle");
    setBatchTxHash(undefined);
    setIsOperator(null);
  }

  const validRows = rows.filter((r) => !r.parseError);
  const errorRows = rows.filter((r) => r.parseError);
  const sentCount = rows.filter((r) => r.status === "ok").length;
  const failCount = rows.filter((r) => r.status === "error").length;

  return {
    rows,
    setRows,
    disperseStatus,
    batchTxHash,
    isOperator,
    runDisperse,
    approveOperator,
    checkIsOperator,
    reset,
    validRows,
    errorRows,
    sentCount,
    failCount,
    explorerTx,
  };
}
