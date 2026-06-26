# Confidential Wrapper Registry — Full Product Description

A handoff spec for designing/building the app in any framework (v0, Lovable, Bolt, custom).
Everything below is verified and working; the **on-chain facts + SDK calls at the bottom are the
critical part** — whatever UI you build must wire to exactly these to actually function.

---

## 1. What this is (one line)
A web3 dApp that turns Zama's official **Wrappers Registry** into a usable product: browse every
ERC-20 ↔ confidential ERC-7984 token pair on Sepolia, and **wrap, unwrap, privately send, and
decrypt** them.

## 2. Why it exists (the bounty)
Built for the **Zama Developer Program — Season 3, Bounty Track** (deadline **2026-07-07**,
reward 3,000 cUSDT, up to 3 winners). Judges score on: **coverage, correctness, extensibility, UX,
code quality, production-readiness.** The required features are fixed:
1. Surface **every** ERC-20 ↔ ERC-7984 pair on Sepolia (read live from the registry, nothing hardcoded).
2. **Wrap & unwrap** any pair.
3. **Decrypt** any ERC-7984 balance via the EIP-712 user-decryption flow.
4. A **Sepolia faucet** for the official cTokenMocks.
(We also added a **confidential Send** — beyond spec, strong for the demo.)

## 3. The concept in plain terms
- A normal token (USDC) is **public** — everyone sees balances/amounts.
- Zama's **ERC-7984** is its confidential twin (cUSDC) — balances are **encrypted on-chain** (FHE).
- **Wrap** = lock USDC, get cUSDC (balance now hidden). **Unwrap** = reverse.
- **Decrypt** = privately reveal *your own* balance to *yourself* (sign EIP-712; nothing changes on-chain).
- **Send privately** = transfer cUSDC with the **amount encrypted** (the transfer is visible, the amount is not).
- Privacy caveat to state honestly: it's **amount-confidential, not anonymous** — sender/recipient
  addresses are public; only amounts are hidden. Wrapping a public token reveals that amount at wrap-time.

## 4. Tech stack
React + TypeScript (Vite). Wallet/chain: **wagmi + viem**. Data fetching: **TanStack Query**.
Confidential ops: **`@zama-fhe/sdk`** (v3). Sepolia-only.

---

## 5. Pages / screens

### A. Registry (home) — the catalog
- Hero: headline + subtext + a few headline stats (total pairs, active, % on-chain).
- A **searchable/filterable list of token pairs** (search by symbol/name/address; toggle to show revoked).
- Each pair shown as a card/row: both token icons, `USDC → cUSDC`, full name, validity badge (Active/Revoked).
- Clicking a pair opens its **detail screen**.
- Data: read live from the registry — so new pairs appear automatically (this is the "coverage" pillar).

### B. Token detail — the action screen (one token pair)
Header: token icons, `USDC → cUSDC`, "USD Coin (Mock) · confidential ERC-7984", validity, and
links to both contracts on Etherscan.
Sections:
1. **Your confidential balance** — shows "encrypted" until the user clicks **Decrypt** (then shows the number).
2. **Wrap** — input amount (with 25/50/75/Max from the user's public balance) → button. Shows their public ERC-20 balance.
3. **Unwrap** — input amount (25/50/75/Max from decrypted balance) + an "All" option.
4. **Send privately** — recipient address + amount → button (amount encrypted).
5. **Faucet** — "Mint 1000 {TOKEN}" to get test tokens for this pair.
(These can be tabs or stacked sections — your call. Each action shows pending/success/error + a tx link.)

### C. Faucet page
A grid of all underlying tokens, each with a "Mint 1000" button. Same mint action as the detail page.

### D. How it works / About
Explainer of wrap/send/decrypt + the honest privacy/trust model. Optional but good for judges.

> Note: it does NOT have to be a single page, and a sidebar is optional. Could be top-nav + pages,
> tabs, or a single scroll — design freely. The four feature areas just need to be reachable and clear.

---

## 6. Reusable components
- **TokenIcon/Badge** — circular token avatar (brand color + symbol); confidential variant gets a lock/ring.
- **PairCard / PairRow** — one registry entry (icons, symbols, name, validity, click-through).
- **AmountInput** — numeric input + 25/50/75/Max quick-pick buttons (computed from a balance).
- **ActionButton + TxStatus** — button with pending spinner; status line with success/error + Etherscan tx link.
- **ConnectButton** — connect/disconnect + "wrong network → Switch to Sepolia" guard.
- **BalanceDisplay** — shows "encrypted ••••" or the decrypted number with a Decrypt/Re-decrypt button.

## 7. Actions / functions (and their states)
Every write action has 4 states: **idle → pending (wallet/confirming) → success (show tx link) → error (show message)**.
- **Browse pairs** (read, no wallet): list all pairs with metadata.
- **Decrypt balance** (needs wallet): 1 EIP-712 signature → shows plaintext to the user only.
- **Wrap**: may need an approve tx first, then wrap (so possibly **two** wallet prompts).
- **Unwrap / Unwrap All**.
- **Send privately**: validate recipient address → encrypt amount → send.
- **Mint (faucet)**: mint test tokens, wait for confirmation, refresh balance.

## 8. Key UX states to handle
- Wallet not connected → actions prompt to connect.
- Wrong network → "Switch to Sepolia".
- No gas → wallet shows "insufficient funds"; link to a Sepolia ETH faucet.
- Loading (skeletons) / empty search / revoked pair (greyed, flagged).
- Amounts respect each token's **decimals** (USDC/USDT = 6, most others = 18).

---

## 9. ⭐ VERIFIED ON-CHAIN FACTS + SDK CALLS (must wire to these)

**Network:** Ethereum **Sepolia** (chainId `11155111`).
**RPC:** use `https://ethereum-sepolia-rpc.publicnode.com` (viem's default `rpc.sepolia.org` is dead/404).

**Wrappers Registry contract:** `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`

**SDK:** `@zama-fhe/sdk` (v3). Imports:
```ts
import { ZamaSDK, WrappersRegistry } from "@zama-fhe/sdk";
import { createConfig, ViemProvider } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import { sepolia as sepoliaFhe } from "@zama-fhe/sdk/chains";
```

**Read all pairs (no wallet needed):**
```ts
const registry = new WrappersRegistry({ provider: new ViemProvider({ publicClient }) });
const res = await registry.listPairs({ metadata: true, pageSize: 100 });
// res.items[i] = { tokenAddress, confidentialTokenAddress, isValid,
//   underlying:{name,symbol,decimals,totalSupply}, confidential:{name,symbol,decimals} }
```

**Full SDK (needs connected wallet) for writes/decrypt:**
```ts
const sdk = new ZamaSDK(createConfig({
  chains: [sepoliaFhe], publicClient, walletClient,
  relayers: { [sepoliaFhe.id]: web() },
}));
```

**Wrap / unwrap (per pair):**
```ts
const wt = sdk.createWrappedToken(confidentialTokenAddress);
await wt.shield(amountBigInt);     // wrap (auto approve+wrap)
await wt.unshield(amountBigInt);   // unwrap a specific amount
await wt.unshieldAll();            // unwrap everything
```

**Decrypt a balance / read public balance:**
```ts
const token = sdk.createToken(confidentialTokenAddress);
const plaintext: bigint = await token.balanceOf(userAddress);  // EIP-712 decrypt (1 signature)
// public ERC-20 balance: standard balanceOf on the tokenAddress (viem readContract)
```

**Send privately:**
```ts
await sdk.createToken(confidentialTokenAddress).confidentialTransfer(toAddress, amountBigInt);
```

**Faucet:** every underlying ERC-20 mock has a permissionless `mint(address,uint256)`:
```solidity
function mint(address to, uint256 amount)  // selector 0x40c10f19, no owner check
```

**Build note:** the SDK runs FHE in a WASM web-worker → set `Cross-Origin-Opener-Policy: same-origin`
and `Cross-Origin-Embedder-Policy: require-corp` headers (dev + prod). If using framer-motion, dedupe
React in the bundler or hooks throw "Invalid hook call".

**Verified pairs currently live (8):** USDC, USDT, WETH, ZAMA, BRON, tGBP, XAUt (all "…Mock"), plus a non-mock tGBP.

---

## 10. Definition of done (bounty)
- Lists all pairs live ✅  · wrap/unwrap works ✅ · decrypt works ✅ · faucet works ✅
- Polished, readable UI · deployed (Vercel) with the COOP/COEP headers · README · 3-min video.
- Post on X tagging **@zama** + **#ZamaDeveloperProgram**.

## 11. Known open item
The wrap/unwrap/decrypt buttons only do anything when a wallet is connected **on Sepolia with a working
RPC and a little test ETH for gas**. If they appear "unclickable," it's almost always: not connected /
wrong network / wallet using the dead `rpc.sepolia.org` (use publicnode) / dev server not restarted after
config change. The action logic itself is wired to the verified SDK calls above.
