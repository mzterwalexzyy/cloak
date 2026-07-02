/**
 * Dune Analytics import helper.
 * Fetches query results and extracts Ethereum addresses from any column
 * named "address", "wallet", "user", or "from_address".
 */

export interface DuneRow {
  address: string;
  tx_count?: number;
  volume?: number;
  [key: string]: unknown;
}

export interface DuneImportResult {
  rows: DuneRow[];
  executionId?: string;
  columns: string[];
}

const ADDR_COLS = ["address", "wallet", "user", "from_address", "to_address", "sender", "recipient"];
const COUNT_COLS = ["tx_count", "txs", "transactions", "count", "num_txs", "transaction_count"];
const VOL_COLS = ["volume", "amount", "total_amount", "total_volume", "value", "usd_value"];

function findCol(keys: string[], candidates: string[]): string | undefined {
  const lower = keys.map((k) => k.toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c);
    if (idx !== -1) return keys[idx];
  }
  return undefined;
}

export async function fetchDuneQuery(apiKey: string, queryId: string): Promise<DuneImportResult> {
  const url = `https://api.dune.com/api/v1/query/${queryId}/results?limit=5000`;
  const res = await fetch(url, {
    headers: { "X-DUNE-API-KEY": apiKey },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Invalid Dune API key.");
    if (res.status === 404) throw new Error(`Query ${queryId} not found — check the ID.`);
    throw new Error(`Dune API error ${res.status}: ${body.slice(0, 120)}`);
  }

  const json = await res.json();
  const rawRows: Record<string, unknown>[] = json?.result?.rows ?? [];
  if (!rawRows.length) throw new Error("Query returned 0 rows. Make sure it has results and is not still executing.");

  const keys = Object.keys(rawRows[0]);
  const addrCol = findCol(keys, ADDR_COLS);
  if (!addrCol) {
    throw new Error(
      `No address column found. Rename a column to "address" in your Dune query. Columns found: ${keys.join(", ")}`
    );
  }
  const countCol = findCol(keys, COUNT_COLS);
  const volCol = findCol(keys, VOL_COLS);

  const rows: DuneRow[] = rawRows
    .map((r) => ({
      address: String(r[addrCol] ?? "").trim(),
      tx_count: countCol ? Number(r[countCol]) || 0 : undefined,
      volume: volCol ? Number(r[volCol]) || 0 : undefined,
      ...r,
    }))
    .filter((r) => /^0x[0-9a-fA-F]{40}$/.test(r.address));

  return { rows, columns: keys };
}

export const DUNE_KEY_STORAGE = "cloak-dune-api-key";
