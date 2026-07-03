import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { type Address } from "viem";
import { fetchClaimStatus, submitClaim, type ClaimStatus } from "../hooks/useCloakAirdrop";

function fmtDeadline(ts: bigint): string {
  if (ts === 0n) return "";
  return new Date(Number(ts) * 1000).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function ClaimPage() {
  const [params] = useSearchParams();
  const contractAddress = params.get("c") as Address | null;

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimDone, setClaimDone] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  // Read status from contract whenever wallet address changes
  useEffect(() => {
    if (!contractAddress || !address || !publicClient) return;
    setLoading(true);
    setError("");
    fetchClaimStatus(publicClient, contractAddress, address)
      .then((s) => { setClaimStatus(s); setClaimDone(s.hasClaimed); })
      .catch((e) => setError(e instanceof Error ? e.message.slice(0, 120) : "Failed to read contract"))
      .finally(() => setLoading(false));
  }, [contractAddress, address, publicClient]);

  async function doClaim() {
    if (!walletClient || !publicClient || !contractAddress) return;
    setClaiming(true);
    setError("");
    try {
      const hash = await submitClaim(walletClient, publicClient, contractAddress);
      setTxHash(hash);
      setClaimDone(true);
      // Refresh status
      const s = await fetchClaimStatus(publicClient, contractAddress, address!);
      setClaimStatus(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("AlreadyClaimed")) setError("Your wallet has already claimed.");
      else if (msg.includes("DeadlinePassed")) setError("The claim period has ended.");
      else if (msg.includes("ClaimLimitReached")) setError("All slots have been claimed (FCFS limit reached).");
      else if (msg.includes("NotEligible")) setError("This wallet is not on the eligibility list.");
      else setError(msg.slice(0, 180));
    } finally {
      setClaiming(false);
    }
  }

  if (!contractAddress) {
    return (
      <div className="claim-page">
        <div className="claim-card">
          <div className="cs-icon">⚠</div>
          <div className="cs-text">Invalid claim link</div>
          <div className="cs-sub">This URL is missing the campaign contract address.</div>
          <Link to="/" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>← Back to Cloak</Link>
        </div>
      </div>
    );
  }

  const deadline = claimStatus?.deadlineTs ?? 0n;
  const limit = claimStatus?.limitVal ?? 0n;
  const count = claimStatus?.currentCount ?? 0n;

  return (
    <div className="claim-page">
      <div className="claim-card">
        <div className="claim-badge">🪂 Airdrop</div>
        <h1 className="claim-title">Claim your allocation</h1>

        <div className="claim-meta">
          {deadline > 0n && (
            <span className="claim-meta-pill">
              ⏱ Claim by {fmtDeadline(deadline)}
            </span>
          )}
          {limit > 0n && (
            <span className="claim-meta-pill">
              ⚡ FCFS · {count.toString()}/{limit.toString()} claimed
            </span>
          )}
        </div>

        <div className="claim-divider" />

        {!isConnected ? (
          <div className="claim-status neutral">
            <div className="cs-icon">🔌</div>
            <div className="cs-text">Connect your wallet to check eligibility</div>
            <div className="cs-sub">Use the Connect button in the top-right corner.</div>
          </div>
        ) : loading ? (
          <div className="claim-status neutral">
            <span className="spinner" /> <span className="cs-text">Checking eligibility…</span>
          </div>
        ) : error ? (
          <div className="claim-status ineligible">
            <div className="cs-icon">✗</div>
            <div className="cs-text">Error</div>
            <div className="cs-sub">{error}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setError("");
              setClaimStatus(null);
              setLoading(true);
              fetchClaimStatus(publicClient!, contractAddress, address!)
                .then(setClaimStatus)
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false));
            }}>Retry</button>
          </div>
        ) : claimDone ? (
          <div className="claim-status success">
            <div className="cs-icon">✓</div>
            <div className="cs-text">Claim registered</div>
            <div className="cs-sub">
              Your claim is recorded on-chain. The campaign organizer will send your
              confidential allocation — only you will be able to see the amount.
            </div>
            {txHash && (
              <a
                className="btn btn-ghost btn-sm"
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 12 }}
              >
                View tx ↗
              </a>
            )}
          </div>
        ) : claimStatus?.deadlinePassed ? (
          <div className="claim-status expired">
            <div className="cs-icon">⏱</div>
            <div className="cs-text">Claim period ended</div>
            <div className="cs-sub">The deadline for this campaign has passed.</div>
          </div>
        ) : claimStatus?.limitReached ? (
          <div className="claim-status expired">
            <div className="cs-icon">⚡</div>
            <div className="cs-text">All slots taken</div>
            <div className="cs-sub">
              This campaign was first-come-first-served and all {limit.toString()} slots
              have been claimed.
            </div>
          </div>
        ) : claimStatus?.isEligible ? (
          <div className="claim-status eligible">
            <div className="cs-icon">✓</div>
            <div className="cs-text">You are eligible</div>
            <div className="cs-sub">
              Your allocation will be sent as a confidential FHE-encrypted transfer —
              only you can see the amount after it arrives.
            </div>
            <button
              className="btn btn-primary claim-btn"
              onClick={doClaim}
              disabled={claiming}
            >
              {claiming ? <><span className="spinner" /> Confirming…</> : "Claim my allocation →"}
            </button>
          </div>
        ) : (
          <div className="claim-status ineligible">
            <div className="cs-icon">✗</div>
            <div className="cs-text">Not eligible</div>
            <div className="cs-sub">
              This wallet address is not on the eligibility list for this campaign.
            </div>
          </div>
        )}

        <div className="claim-footer">
          <Link to="/" className="muted">Powered by 🔒 Cloak · Zama FHE</Link>
        </div>
      </div>
    </div>
  );
}
