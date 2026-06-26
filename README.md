# Confidential Wrapper Registry

A production-ready web app that turns the official **Zama Wrappers Registry** into a usable product. It surfaces **every** ERC‑20 ↔ ERC‑7984 wrapper pair on Sepolia, lets anyone **wrap / unwrap** any pair, **decrypts confidential balances** through the EIP‑712 user‑decryption flow, and ships a **built‑in faucet** for the official cTokenMocks.

> Built for the **Zama Developer Program — Mainnet Season 3, Bounty Track**.

![status](https://img.shields.io/badge/network-Sepolia-ffd200) ![status](https://img.shields.io/badge/registry-on--chain%20driven-38d39f)

---

## Why this exists

Today developers spin up their own test ERC‑20s and ERC‑7984 wrappers instead of using the ones already in the official registry. That fragments the ecosystem. This app makes the registry the obvious place to point: one screen where every official pair is discoverable and immediately usable.

## What it does

| Bounty requirement | How it's met |
|---|---|
| **Surface every ERC‑20 ↔ ERC‑7984 pair** | The pair list is read **live** from the registry via `WrappersRegistry.listPairs({ metadata: true })`. Nothing is hardcoded — new pairs registered on‑chain appear automatically. Revoked pairs are shown and clearly flagged. |
| **Wrap & unwrap any pair** | One‑click `shield` / `unshield` / `unshield all` per pair, with automatic approval handling, via the SDK's `WrappedToken`. |
| **Decrypt any ERC‑7984 balance** | Per‑pair "Decrypt" reveals your confidential balance through the EIP‑712 user‑decryption flow (`Token.balanceOf`), requiring a single wallet signature. |
| **Sepolia faucet for cTokenMocks** | Each underlying mock exposes a permissionless `mint(address,uint256)` (verified on‑chain); the app self‑mints test tokens so you can try wrapping in seconds. |
| **Confidential send** _(beyond spec)_ | Send any ERC‑7984 to another address with the **amount encrypted via FHE** (`Token.confidentialTransfer`). The transfer is visible on‑chain; the amount is not — making the privacy model tangible. |

## Architecture

```
src/
  lib/
    wagmi.ts        # wagmi config — Sepolia only, injected connector
    zama.ts         # ZamaSDK + read-only WrappersRegistry factories
    format.ts       # address / amount formatting, explorer links
  hooks/
    useRegistryPairs.ts  # react-query: paginated, metadata-enriched pair list (no wallet needed)
    useZamaSdk.ts        # builds a full ZamaSDK once a wallet is connected
  components/
    ConnectBar.tsx  # connect / wrong-network guard / account pill
    PairCard.tsx    # per-pair: decrypt balance, wrap, unwrap
    Faucet.tsx      # mint underlying cTokenMock
  App.tsx           # registry dashboard: stats, search, coverage grid
```

**Design choices**
- **Read path needs no wallet.** Registry browsing uses a `ViemProvider` over a public client, so the app is fully explorable before connecting — only state‑changing actions require a wallet.
- **Registry‑driven coverage.** The grid is generated from on‑chain data; the app keeps working as the registry grows.
- **Network‑guarded.** Any chain other than Sepolia prompts a one‑click switch, so writes can't hit the wrong network.

## Verified on‑chain facts (Sepolia)

- Wrappers Registry: [`0x2f0750Bbb0A246059d80e94c454586a7F27a128e`](https://sepolia.etherscan.io/address/0x2f0750Bbb0A246059d80e94c454586a7F27a128e)
- SDK: [`@zama-fhe/sdk`](https://www.npmjs.com/package/@zama-fhe/sdk) v3.x
- ERC‑7984 interface id: `0x4958f2a4`

See [`SPEC.md`](../SPEC.md) for the full address table, the verified SDK API surface, and the judging→feature map.

## Run locally

```bash
cd app
npm install
cp .env.example .env   # optional: add a Sepolia RPC URL
npm run dev
```

Open the printed local URL, connect a Sepolia wallet (e.g. MetaMask), grab test tokens from the in‑app faucet, then wrap / unwrap / decrypt.

> **Windows note:** if the default Vite port is blocked by a reserved range, run `npm run dev -- --host 127.0.0.1 --port 5300`.

## Build & deploy

```bash
npm run build      # tsc -b && vite build  ->  dist/
```

Deploys as a static SPA to **Vercel** / Netlify / Cloudflare Pages. The dev server sets `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` for the FHE WASM worker; replicate those headers in production (a `vercel.json` `headers` block) for full threading support.

## Tech

React + TypeScript · Vite · wagmi + viem · TanStack Query · `@zama-fhe/sdk` (FHE wrap/unwrap + user‑decryption).

## License

MIT.
