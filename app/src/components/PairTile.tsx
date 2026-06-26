import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";
import { TokenBadge } from "./TokenBadge";
import { displaySym, shortAddr } from "../lib/format";

export function PairTile({ pair, index }: { pair: TokenWrapperPairWithMetadata; index: number }) {
  const u = pair.underlying;
  const c = pair.confidential;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.04, 0.35), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/pair/${pair.confidentialTokenAddress}`} className={`glow-card ${!pair.isValid ? "glow-card-revoked" : ""}`}>
        <span className="glow-card-aura" />
        <div className="glow-card-top">
          <div className="pair-badges">
            <TokenBadge symbol={u.symbol} />
            <TokenBadge symbol={c.symbol} confidential />
          </div>
          {pair.isValid ? <span className="tag tag-ok">● Active</span> : <span className="tag tag-bad">Revoked</span>}
        </div>

        <div className="glow-card-symbols">
          <span className="sym-plain">{displaySym(u.symbol)}</span>
          <span className="arrow">→</span>
          <span className="sym-conf">{displaySym(c.symbol)}</span>
        </div>
        <div className="glow-card-name">{u.name}</div>

        <div className="glow-card-foot">
          <span className="mono">{shortAddr(pair.tokenAddress)}</span>
          <span className="glow-card-cta">Open →</span>
        </div>
      </Link>
    </motion.div>
  );
}
