/** localStorage-backed campaign store. */

export interface AirdropRecipient {
  address: string;
  amount: string;
  status: "idle" | "pending" | "sent" | "failed";
  txHash?: string;
  errMsg?: string;
}

export interface AirdropCampaign {
  id: string;
  name: string;
  description: string;
  tokenAddress: string;   // confidential token address (ERC-7984)
  tokenSymbol: string;    // e.g. "cUSDC"
  tokenDecimals: number;
  underlyingSymbol: string; // e.g. "USDC"
  startDate: string;        // ISO date string
  deadline: string;         // ISO date string
  recipients: AirdropRecipient[];
  createdAt: string;
  executedAt?: string;
  status: "draft" | "executing" | "done";
  // Claim-link mode fields
  mode: "push" | "claim";
  claimLimit?: number;       // 0 or undefined = unlimited
  claimFeeEth?: string;      // fee in ETH string, e.g. "0.001"
  creatorAddress?: string;    // wallet that created the campaign (lowercase)
  contractAddress?: string;   // deployed CloakAirdrop contract
  contractDeployed?: boolean;
  deploymentBlock?: string;   // block number at deploy time (stringified bigint)
}

const KEY = "cloak-airdrop-campaigns";

function load(): AirdropCampaign[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(campaigns: AirdropCampaign[]) {
  localStorage.setItem(KEY, JSON.stringify(campaigns));
}

export const airdropStore = {
  list(): AirdropCampaign[] {
    return load();
  },
  get(id: string): AirdropCampaign | undefined {
    return load().find((c) => c.id === id);
  },
  create(campaign: Omit<AirdropCampaign, "id" | "createdAt" | "status">): AirdropCampaign {
    const all = load();
    const c: AirdropCampaign = {
      ...campaign,
      mode: campaign.mode ?? "push",
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: "draft",
    };
    save([...all, c]);
    return c;
  },
  update(id: string, patch: Partial<AirdropCampaign>): AirdropCampaign | undefined {
    const all = load();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...patch };
    all[idx] = updated;
    save(all);
    return updated;
  },
  updateRecipient(campaignId: string, address: string, patch: Partial<AirdropRecipient>) {
    const all = load();
    const c = all.find((x) => x.id === campaignId);
    if (!c) return;
    c.recipients = c.recipients.map((r) => r.address === address ? { ...r, ...patch } : r);
    save(all);
  },
  delete(id: string) {
    save(load().filter((c) => c.id !== id));
  },
};
