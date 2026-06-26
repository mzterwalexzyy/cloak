import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { Faucet } from "../components/Faucet";
import { TokenBadge } from "../components/TokenBadge";
import { displaySym } from "../lib/format";

export function FaucetPage() {
  const { data, isLoading } = useRegistryPairs();
  const pairs = data?.items ?? [];

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Sepolia Faucet</h1>
        <p className="page-sub">Mint test tokens to try wrapping and confidential transfers.</p>
      </div>

      <div className="banner">
        <span className="banner-icon">ⓘ</span>
        These are mock tokens on Sepolia for testing purposes only — they have no real value.
        You’ll need a little free Sepolia ETH for gas.
      </div>

      {isLoading && <div className="loading">Loading tokens…</div>}

      <div className="faucet-grid">
        {pairs.map((p) => (
          <div key={p.tokenAddress} className="card faucet-item">
            <div className="faucet-item-head">
              <TokenBadge symbol={p.underlying.symbol} />
              <div>
                <div className="faucet-item-sym">{displaySym(p.underlying.symbol)} <span className="faint">(Mock)</span></div>
                <div className="faucet-item-name">{p.underlying.name}</div>
              </div>
            </div>
            <Faucet underlying={p.tokenAddress} symbol={displaySym(p.underlying.symbol)} decimals={p.underlying.decimals} />
          </div>
        ))}
      </div>
    </div>
  );
}
