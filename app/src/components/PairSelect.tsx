import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";
import { TokenBadge } from "./TokenBadge";
import { displaySym } from "../lib/format";

/**
 * A fully custom pair dropdown — native <select> can't be styled (the open list
 * is browser-rendered and looked invisible/basic). This gives a branded trigger
 * + animated popover with token badges, hover and selected states.
 */
export function PairSelect({
  pairs,
  value,
  onChange,
  mode = "pair",
}: {
  pairs: TokenWrapperPairWithMetadata[];
  value: string;
  onChange: (confidentialAddress: string) => void;
  /** "pair" shows "USDC → cUSDC" (wrap pages). "confidential" shows just "cUSDC" (send/disperse/airdrop). */
  mode?: "pair" | "confidential";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = pairs.find((p) => p.confidentialTokenAddress === value) ?? pairs[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!selected) return null;

  return (
    <div className="pairsel" ref={ref}>
      <button type="button" className="pairsel-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="pairsel-badges">
          {mode === "pair" && <TokenBadge symbol={selected.underlying.symbol} />}
          <TokenBadge symbol={selected.confidential.symbol} confidential />
        </span>
        <span className="pairsel-label">
          {mode === "pair"
            ? <>{displaySym(selected.underlying.symbol)} <span className="pairsel-arrow">→</span> {displaySym(selected.confidential.symbol)}</>
            : displaySym(selected.confidential.symbol)
          }
        </span>
        <span className={`pairsel-chev ${open ? "up" : ""}`}>⌄</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="pairsel-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {pairs.map((p) => {
              const active = p.confidentialTokenAddress === value;
              return (
                <li key={p.confidentialTokenAddress}>
                  <button
                    type="button"
                    className={`pairsel-option ${active ? "active" : ""}`}
                    onClick={() => {
                      onChange(p.confidentialTokenAddress);
                      setOpen(false);
                    }}
                  >
                    <span className="pairsel-badges sm">
                      {mode === "pair" && <TokenBadge symbol={p.underlying.symbol} />}
                      <TokenBadge symbol={p.confidential.symbol} confidential />
                    </span>
                    <span className="pairsel-opt-label">
                      {mode === "pair"
                        ? `${displaySym(p.underlying.symbol)} → ${displaySym(p.confidential.symbol)}`
                        : displaySym(p.confidential.symbol)
                      }
                    </span>
                    {!p.isValid && <span className="pairsel-revoked">revoked</span>}
                    {active && <span className="pairsel-check">✓</span>}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
