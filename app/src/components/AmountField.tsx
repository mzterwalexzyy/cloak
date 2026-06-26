import { formatUnits } from "viem";
import type { TxState } from "../hooks/usePairActions";
import { explorerTx } from "../lib/format";

/** 25 / 50 / 75 / Max quick-pick chips computed from a known balance. */
export function QuickPicks({ base, decimals, onPick }: { base?: bigint; decimals: number; onPick: (v: string) => void }) {
  if (base === undefined || base <= 0n) return null;
  const picks: Array<[string, bigint]> = [
    ["25%", (base * 25n) / 100n],
    ["50%", (base * 50n) / 100n],
    ["75%", (base * 75n) / 100n],
    ["Max", base],
  ];
  return (
    <div className="quick-picks">
      {picks.map(([label, amount]) => (
        <button key={label} className="chip" type="button" onClick={() => onPick(formatUnits(amount, decimals))}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function TxLine({ tx }: { tx: TxState }) {
  if (tx.status === "idle") return null;
  const cls = tx.status === "error" ? "err" : tx.status === "ok" ? "ok" : "muted";
  return (
    <div className={`tx-line ${cls}`}>
      {tx.status === "pending" && <span className="spinner" />}
      {tx.msg}
      {tx.hash && (
        <a className="mono tx-link" href={explorerTx(tx.hash)} target="_blank" rel="noreferrer">
          view tx ↗
        </a>
      )}
    </div>
  );
}
