import { formatUnits, parseUnits } from "viem";

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Drop the noisy "Mock" suffix for display, keeping a leading c (confidential). */
export function displaySym(symbol: string): string {
  return symbol.replace(/Mock$/, "");
}

export function fmtAmount(value: bigint, decimals: number, maxFrac = 4): string {
  const s = formatUnits(value, decimals);
  if (!s.includes(".")) return s;
  const [int, frac] = s.split(".");
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, "");
  return trimmed ? `${int}.${trimmed}` : int;
}

/** Parse a user-entered decimal string into base units, or throw a friendly error. */
export function toBaseUnits(input: string, decimals: number): bigint {
  const trimmed = input.trim();
  if (!trimmed || Number(trimmed) <= 0 || Number.isNaN(Number(trimmed))) {
    throw new Error("Enter an amount greater than 0");
  }
  return parseUnits(trimmed, decimals);
}

const explorer = "https://sepolia.etherscan.io";
export const explorerAddress = (addr: string) => `${explorer}/address/${addr}`;
export const explorerTx = (hash: string) => `${explorer}/tx/${hash}`;
