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
        return { id, address: trimmed, amount: "", parseError: "Expected: address, amount", status: "idle" } as RecipientRow;
      }
      const [addr, amount, ...rest] = parts;
      if (rest.length > 0) {
        return { id, address: addr, amount, parseError: "Too many fields on this line", status: "idle" } as RecipientRow;
      }
      if (!isAddress(addr)) {
        return { id, address: addr, amount, parseError: "Invalid Ethereum address", status: "idle" } as RecipientRow;
      }
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return { id, address: addr, amount, parseError: "Amount must be a positive number", status: "idle" } as RecipientRow;
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
