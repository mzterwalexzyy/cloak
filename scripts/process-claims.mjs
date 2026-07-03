/**
 * process-claims.mjs — Auto-process queued CloakAirdrop claims.
 *
 * Reads ClaimRegistered events from the on-chain contract, then sends
 * a confidential FHE transfer to each claimant that hasn't been processed yet.
 *
 * Usage:
 *   node scripts/process-claims.mjs
 *
 * Required .env (in the project root or scripts/ folder):
 *   ADMIN_PRIVATE_KEY=0x...       # Admin wallet that holds the cUSDC
 *   RPC_URL=https://...           # Sepolia RPC (Alchemy / Ankr / publicnode)
 *   CONTRACT_ADDRESS=0x...        # Deployed CloakAirdrop contract
 *   TOKEN_ADDRESS=0x...           # The cUSDC (or other) ERC-7984 token address
 *   TOKEN_DECIMALS=6              # Token decimals (6 for USDC-based)
 *
 * Optionally in the campaign JSON (see --campaign flag):
 *   Amounts per address. If the campaign file isn't supplied, every claimant
 *   gets DEFAULT_AMOUNT tokens.
 *
 * State tracking:
 *   Processed claims are written to scripts/processed-<contract>.json so
 *   the script is safe to re-run — it skips already-processed wallets.
 */

import { createPublicClient, createWalletClient, http, decodeEventLog, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────

function loadEnv() {
  // Try .env in project root
  const envPath = resolve(__dir, "../.env");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const [k, ...rest] = line.trim().split("=");
      if (k && !k.startsWith("#")) process.env[k] = rest.join("=").trim();
    }
  }
}
loadEnv();

const PRIVATE_KEY   = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL       = process.env.RPC_URL ?? "https://rpc.ankr.com/eth_sepolia";
const CONTRACT_ADDR = process.env.CONTRACT_ADDRESS;
const TOKEN_ADDR    = process.env.TOKEN_ADDRESS;
const TOKEN_DEC     = Number(process.env.TOKEN_DECIMALS ?? "6");
const DEFAULT_AMT   = process.env.DEFAULT_AMOUNT ?? "10";   // tokens per claimant if no campaign file

// Optional: path to a JSON file like { "0xAddr": "amount", ... }
const CAMPAIGN_FILE = process.argv[2];

if (!PRIVATE_KEY || !CONTRACT_ADDR || !TOKEN_ADDR) {
  console.error(`
ERROR: Missing required env vars. Set in .env or environment:
  ADMIN_PRIVATE_KEY
  CONTRACT_ADDRESS
  TOKEN_ADDRESS
  RPC_URL (optional, defaults to Ankr Sepolia)
  TOKEN_DECIMALS (optional, defaults to 6)
  DEFAULT_AMOUNT (optional, defaults to 10)
`);
  process.exit(1);
}

// ── ABI fragments we need ────────────────────────────────────────────────────

const AIRDROP_ABI = [
  {
    type: "event",
    name: "ClaimRegistered",
    inputs: [
      { name: "claimant", type: "address", indexed: true },
      { name: "position", type: "uint256", indexed: true },
      { name: "ts",       type: "uint256", indexed: false },
    ],
  },
];

// Minimal ERC-7984 confidentialTransfer ABI.
// The exact signature depends on the Zama token version — adjust if needed.
const TOKEN_ABI = [
  {
    type: "function",
    name: "confidentialTransfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "amount", type: "uint64"  },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
];

// ── State file ───────────────────────────────────────────────────────────────

const STATE_FILE = resolve(__dir, `processed-${CONTRACT_ADDR.slice(0, 10)}.json`);

function loadProcessed() {
  if (!existsSync(STATE_FILE)) return {};
  try { return JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}

function saveProcessed(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchClaimEvents(publicClient) {
  console.log("📡 Fetching ClaimRegistered events from contract…");
  const logs = await publicClient.getLogs({
    address: CONTRACT_ADDR,
    fromBlock: 0n,
    toBlock: "latest",
  });

  const events = [];
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({ abi: AIRDROP_ABI, ...log });
      if (decoded.eventName === "ClaimRegistered") {
        events.push({
          claimant: decoded.args.claimant,
          position: Number(decoded.args.position),
          ts: Number(decoded.args.ts),
        });
      }
    } catch {}
  }

  return events.sort((a, b) => a.position - b.position);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`
╔═══════════════════════════════════════════╗
║   CloakAirdrop — Auto Process Claims      ║
╚═══════════════════════════════════════════╝
Contract : ${CONTRACT_ADDR}
Token    : ${TOKEN_ADDR}
RPC      : ${RPC_URL}
`);

  // Load optional per-address amount map
  let amountMap = {};
  if (CAMPAIGN_FILE && existsSync(CAMPAIGN_FILE)) {
    amountMap = JSON.parse(readFileSync(CAMPAIGN_FILE, "utf8"));
    console.log(`📋 Loaded ${Object.keys(amountMap).length} amounts from ${CAMPAIGN_FILE}`);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`👛 Admin wallet: ${account.address}\n`);

  const transport = http(RPC_URL);
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const walletClient = createWalletClient({ account, chain: sepolia, transport });

  // Fetch all on-chain claims
  const events = await fetchClaimEvents(publicClient);
  console.log(`✅ Found ${events.length} registered claim(s)\n`);

  if (events.length === 0) {
    console.log("Nothing to process. Run again after users claim.");
    return;
  }

  // Load processed state
  const processed = loadProcessed();
  const pending = events.filter((e) => !processed[e.claimant.toLowerCase()]);
  console.log(`⏳ ${pending.length} unprocessed / ${events.length - pending.length} already sent\n`);

  if (pending.length === 0) {
    console.log("All claims already processed. Nothing to do.");
    return;
  }

  // ── Attempt FHE transfers ──────────────────────────────────────────────────
  //
  // NOTE: The Zama SDK (@zama-fhe/sdk) is browser-native. If it works in Node
  // via a raw ethers/viem signer, great. If not, this section will throw on the
  // first `confidentialTransfer` call. In that case:
  //   1. Use this script to export the ordered queue (--dry-run flag).
  //   2. Process the queue manually in the Cloak web UI.
  //
  // The dry-run output is a CSV you can paste directly into Disperse or Airdrop.
  // ──────────────────────────────────────────────────────────────────────────

  const DRY_RUN = process.argv.includes("--dry-run");

  if (DRY_RUN) {
    console.log("=== DRY RUN — No transactions will be sent ===\n");
    console.log("# Paste this into Cloak Disperse or Airdrop:\n");
    for (const ev of pending) {
      const amt = amountMap[ev.claimant.toLowerCase()]
        ?? amountMap[ev.claimant]
        ?? DEFAULT_AMT;
      console.log(`${ev.claimant}, ${amt}`);
    }
    console.log(`\n# ${pending.length} recipient(s) — FCFS order by on-chain position`);
    return;
  }

  let sent = 0, failed = 0;

  for (const ev of pending) {
    const amt = amountMap[ev.claimant.toLowerCase()]
      ?? amountMap[ev.claimant]
      ?? DEFAULT_AMT;

    const amtBaseUnits = parseUnits(String(amt), TOKEN_DEC);

    process.stdout.write(`[${ev.position}] ${ev.claimant} — ${amt} tokens … `);

    try {
      // Try direct contract call first (works if the token supports plaintext transfer)
      const hash = await walletClient.writeContract({
        address: TOKEN_ADDR,
        abi: TOKEN_ABI,
        functionName: "confidentialTransfer",
        args: [ev.claimant, amtBaseUnits],
      });
      await publicClient.waitForTransactionReceipt({ hash });

      processed[ev.claimant.toLowerCase()] = { hash, sentAt: new Date().toISOString(), amount: amt };
      saveProcessed(processed);
      console.log(`✓ ${hash}`);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message.slice(0, 120) : String(e);
      console.log(`✗ FAILED — ${msg}`);

      // If the error is about FHE encryption (SDK required), suggest the web UI
      if (msg.includes("encrypt") || msg.includes("fhe") || msg.includes("proof") || msg.includes("inputProof")) {
        console.log(`
  ⚠️  This token requires FHE client-side encryption (Zama SDK).
     The script cannot sign FHE proofs without a browser wallet.

  👉 Use --dry-run to export the queue as CSV, then paste it
     into the Cloak web UI → Airdrop → Process claims, or Disperse.
`);
        process.exit(1);
      }

      processed[ev.claimant.toLowerCase()] = { hash: null, error: msg, failedAt: new Date().toISOString() };
      saveProcessed(processed);
      failed++;
    }

    // Small delay between txs to avoid nonce racing
    await sleep(1500);
  }

  console.log(`
═══════════════════════════════════
Done. Sent: ${sent} | Failed: ${failed}
State saved to: ${STATE_FILE}
`);

  if (failed > 0) {
    console.log(`To retry failed claims, remove their entries from ${STATE_FILE} and re-run.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
