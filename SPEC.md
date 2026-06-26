# Confidential Wrapper Registry App — SPEC

Bounty: **Zama Developer Program — Mainnet Season 3, Bounty Track**
Reward: 3,000 cUSDT (1st 1,500 / 2nd 1,000 / 3rd 500), up to 3 winners.
Deadline: **2026-07-07 23:59 AOE**.
Tag `@zama` + `#ZamaDeveloperProgram` on X when shipping.

## The bounty (verbatim goals)
Build a production-ready app that turns the official Zama Wrappers Registry into a usable product. It must:
1. Surface **every** ERC-20 ↔ ERC-7984 wrapper pair on Sepolia.
2. Let users **wrap and unwrap** any registry pair.
3. **Decrypt any ERC-7984 balance** through the EIP-712 user-decryption flow.
4. Include a **Sepolia faucet** for the official cTokenMocks.

Judged on: **coverage, correctness, extensibility, UX, code quality, production-readiness.**

## Judging → feature map (our checklist)
- **Coverage** → enumerate ALL pairs dynamically from the registry (no hardcoding); handle invalid/revoked entries gracefully.
- **Correctness** → real on-chain reads/writes; accurate decrypted balances; correct wrap/unwrap accounting & decimals.
- **Extensibility** → registry-driven (new pairs appear automatically); clean config; works for non-mock official wrappers too.
- **UX** → one-click wrap/unwrap/decrypt; clear tx states; responsive; empty/error states; copy-to-clipboard addresses.
- **Code quality** → typed, modular, no dead code, lint clean.
- **Production-readiness** → deployed (Vercel), env handling, network guard (Sepolia), graceful RPC failures, README.

## Verified on-chain facts (Sepolia, chainId 11155111)

### Wrapper Registry
- Address: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
- TokenWrapperPair struct: `{ address tokenAddress; address confidentialTokenAddress; bool isValid; }`
- Read interface:
  - `getTokenConfidentialTokenPairs() -> TokenWrapperPair[]`
  - `getTokenConfidentialTokenPairsLength() -> uint256`
  - `getTokenConfidentialTokenPair(uint256 index) -> TokenWrapperPair`
  - `getTokenConfidentialTokenPairsSlice(uint256 fromIndex, uint256 toIndex) -> TokenWrapperPair[]`
- Event: `ConfidentialTokenRegistered(address tokenAddress, address confidentialTokenAddress)`
- ERC-7984 ERC-165 interface id: `0x4958f2a4`

### Official wrapper pairs (mock set) — Sepolia
| Confidential (ERC-7984) | Address | Underlying ERC-20 |
|---|---|---|
| cUSDCMock | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` |
| cUSDTMock | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` | `0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0` |
| cWETHMock | `0x46208622DA27d91db4f0393733C8BA082ed83158` | `0xff54739b16576FA5402F211D0b938469Ab9A5f3F` |
| cZAMAMock | `0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB` | `0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57` |
| cBRONMock | `0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891` | `0xFf021fB13cA64e5354c62c954b949a88cfDEb25E` |
| ctGBPMock | `0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC` | `0x93c931278A2aad1916783F952f94276eA5111442` |
| cXAUtMock | `0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7` | `0x24377AE4AA0C45ecEe71225007f17c5D423dd940` |

Official (non-mock) wrapper: ctGBP `0x167DC962808B32CFFFc7e14B5018c0bE06A3A208` (underlying `0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3`).

> NOTE: We do NOT hardcode the table above as the source of truth — it is reference only.
> The app reads pairs live from the registry. The table is for sanity-checking coverage.

### Core FHEVM Sepolia addresses
- FHEVM Executor: `0x92C920834Ec8941d2C77D188936E1f7A6f49c127`
- ACL: `0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D`
- KMS Verifier: `0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A`
- Input Verifier: `0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0`
- Decryption: `0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478`
- Relayer URL: `https://relayer.testnet.zama.org`
- Gateway chain id: `10901`

## SDK
- Package: `@zama-fhe/sdk` (v3.1.0) — high-level, viem-based. Has `registry`, `createWrappedToken`, `shield`/`unshield`, user-decryption.
- Fallback/lower-level: `@zama-fhe/relayer-sdk` (v0.4.4) for `createInstance(SepoliaConfig)`, `generateKeypair`, `createEIP712`, `userDecrypt`, `createEncryptedInput`.
- EXACT API to be confirmed by reading installed package types (task #3) before coding — do not trust doc summaries blindly.

## VERIFIED SDK API (read from installed @zama-fhe/sdk@3.1.0 .d.ts — ground truth)

Imports:
```ts
import { ZamaSDK, WrappersRegistry } from "@zama-fhe/sdk";
import { createConfig, ViemProvider } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import { sepolia as sepoliaFhe } from "@zama-fhe/sdk/chains";
```

Sepolia `FheChain` already includes: `id 11155111`, `gatewayChainId 10901`,
`relayerUrl https://relayer.testnet.zama.org/v2`, default RPC, ACL/KMS addrs. No proxy needed.

**Read-only registry browse (NO wallet):**
```ts
const provider = new ViemProvider({ publicClient });           // publicClient = viem PublicClient
const registry = new WrappersRegistry({ provider });
const res = await registry.listPairs({ metadata: true, pageSize: 100 }); // PaginatedResult<TokenWrapperPairWithMetadata>
// res.items[i]: { tokenAddress, confidentialTokenAddress, isValid,
//   underlying:{name,symbol,decimals,totalSupply}, confidential:{name,symbol,decimals} }
// res.total, res.page, res.pageSize
registry.refresh(); // bust cache
```

**Full SDK (needs wallet) — for wrap/unwrap/decrypt:**
```ts
const config = createConfig({
  chains: [sepoliaFhe],
  publicClient,            // viem PublicClient
  walletClient,            // viem WalletClient (from wagmi useWalletClient)
  relayers: { [sepoliaFhe.id]: web() },
});
const sdk = new ZamaSDK(config);
sdk.registry            // WrappersRegistry (same listPairs API)
sdk.decryption          // Decryption
```

**Wrap / unwrap (any pair):**
```ts
const wt = sdk.createWrappedToken(confidentialTokenAddress); // WrappedToken
await wt.approveUnderlying(amount?);        // optional explicit approve (max if no arg)
await wt.shield(amount: bigint, options?);  // wrap ERC20 -> ERC7984 (auto approve+wrap or transferAndCall)
await wt.unshield(amount: bigint);          // unwrap a specific amount (orchestrates unwrap->finalize)
await wt.unshieldAll();                     // unwrap entire balance
await wt.allowance(owner);                  // bigint
await wt.underlying();                      // Address
// each returns TransactionResult
```

**Decrypt any ERC-7984 balance (EIP-712 user-decryption, under the hood):**
```ts
const token = sdk.createToken(confidentialTokenAddress);      // Token
const plain: bigint = await token.balanceOf(owner);          // decrypts via EIP-712 (1 wallet signature)
const handle = await token.confidentialBalanceOf(owner);     // raw encrypted handle (no decrypt)
await token.symbol(); token.name(); token.decimals(); token.isConfidential(); token.isWrapper();
```

Useful constants exported: `ERC7984_INTERFACE_ID` (0x4958f2a4), `ERC7984_WRAPPER_INTERFACE_ID`,
`DefaultRegistryAddresses` (chainId->registry address).

## Stack decision
Vite + React + TypeScript, wagmi + viem for wallet/chain, @tanstack/react-query, @zama-fhe/sdk for confidential ops. Deploy to Vercel.
