import { useState, useCallback } from "react";
import { isAddress } from "viem";
import { toBaseUnits, explorerTx } from "../lib/format";
import type { ZamaSdkHandle } from "./useZamaSdk";

export interface RecipientRow {
  id: string;
  address: string;
  amount: string;
  parseError?: string;
  status: "idle" | "pending" | "ok" | "error";
  txHash?: string;
  errMsg?: string;
}

export type DisperseStatus = "idle" | "running" | "done";

/**
 * Returns a human-readable explanation of why an address is invalid.
 * Distinguishes EVM-specific mistakes from cross-chain confusion.
 */
export function diagnoseAddress(addr: string): string {
  const trimmed = addr.trim();

  // No 0x prefix — could be Solana base58, Bitcoin, or just garbage
  if (!trimmed.startsWith("0x") && !trimmed.startsWith("0X")) {
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      return "Looks like a Solana address — Cloak runs on Ethereum. Use an EVM (0x…) address.";
    }
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed) || /^bc1[a-z0-9]{6,87}$/i.test(trimmed)) {
      return "Looks like a Bitcoin address — Cloak runs on Ethereum. Use an EVM (0x…) address.";
    }
    if (/^[A-Za-z0-9]{32,64}$/.test(trimmed)) {
      return "Unrecognised address format — EVM addresses start with 0x followed by 40 hex characters.";
    }
    return "Not an Ethereum address — must start with 0x.";
  }

  const hex = trimmed.slice(2);

  // Non-hex characters after 0x
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    return "Contains non-hex characters after 0x — EVM addresses use 0–9 and a–f only.";
  }

  if (hex.length < 40) {
    return `Incomplete address — ${trimmed.length} chars, needs 42 (0x + 40 hex digits).`;
  }

  if (hex.length === 64) {
    // Aptos and SUI both use 0x + 64 hex
    return "Looks like an Aptos or SUI address (0x + 64 hex) — EVM addresses are 0x + 40 hex.";
  }

  if (hex.length > 40) {
    return `Too long — ${trimmed.length} chars. EVM addresses are exactly 42 characters.`;
  }

  // Exactly 40 valid hex chars but failed isAddress() checksum
  return "Invalid EIP-55 checksum — double-check the address or use the all-lowercase version.";
}

/** Parse a free-form recipient list (one per line: `address, amount` or `address amount`). */
export function parseRecipientText(text: string): RecipientRow[] {
  return text
    .split("\n")
    .map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return null;
      const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
      const id = String(i);
      if (parts.length < 2) {
        return { id, address: trimmed, amount: "", parseError: "Missing amount — expected: address, amount", status: "idle" } as RecipientRow;
      }
      const [addr, amount, ...rest] = parts;
      if (rest.length > 0) {
        return { id, address: addr, amount, parseError: "Too many fields — expected only: address, amount", status: "idle" } as RecipientRow;
      }
      if (!isAddress(addr, { strict: false })) {
        return { id, address: addr, amount, parseError: diagnoseAddress(addr), status: "idle" } as RecipientRow;
      }
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return { id, address: addr, amount, parseError: `Amount "${amount}" is not a positive number`, status: "idle" } as RecipientRow;
      }
      return { id, address: addr, amount, status: "idle" } as RecipientRow;
    })
    .filter((r): r is RecipientRow => r !== null);
}

export function useDisperse(zama: ZamaSdkHandle) {
  const [rows, setRows] = useState<RecipientRow[]>([]);
  const [disperseStatus, setDisperseStatus] = useState<DisperseStatus>("idle");

  const setRow = useCallback((id: string, patch: Partial<RecipientRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  async function runDisperse(tokenAddress: string, decimals: number) {
    const valid = rows.filter((r) => !r.parseError);
    if (!valid.length) return;

    setDisperseStatus("running");
    // Reset all statuses
    setRows((prev) => prev.map((r) => r.parseError ? r : { ...r, status: "idle", txHash: undefined, errMsg: undefined }));

    for (const row of valid) {
      setRow(row.id, { status: "pending" });
      try {
        const token = zama.getSdk().createToken(tokenAddress as `0x${string}`);
        const res = await token.confidentialTransfer(
          row.address as `0x${string}`,
          toBaseUnits(row.amount, decimals),
        );
        const hash = res && typeof res === "object" && "txHash" in res ? (res as { txHash: string }).txHash : undefined;
        setRow(row.id, { status: "ok", txHash: hash });
      } catch (e) {
        const msg = e instanceof Error ? e.message.slice(0, 160) : String(e);
        setRow(row.id, { status: "error", errMsg: msg });
      }
    }
    setDisperseStatus("done");
  }

  function reset() {
    setRows([]);
    setDisperseStatus("idle");
  }

  const validRows = rows.filter((r) => !r.parseError);
  const errorRows = rows.filter((r) => r.parseError);
  const sentCount = rows.filter((r) => r.status === "ok").length;
  const failCount = rows.filter((r) => r.status === "error").length;

  return { rows, setRows, disperseStatus, runDisperse, reset, validRows, errorRows, sentCount, failCount, explorerTx };
}
