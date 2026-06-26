# 3‑Minute Video Pitch — Confidential Wrapper Registry

Total ~2:50. Record screen + voiceover. Keep the wallet pre‑funded with Sepolia ETH.

---

### 0:00 – 0:25 · The problem
> "Zama maintains an official registry of ERC‑20 to ERC‑7984 wrapper pairs — the canonical confidential versions of tokens. But almost nobody uses it. Developers keep deploying their own throwaway test tokens and wrappers, and the ecosystem fragments. There was no product that made the registry usable. So I built one."

*(Show: the registry contract on Etherscan, then cut to the app.)*

### 0:25 – 1:00 · Coverage (no wallet needed)
> "This is the Confidential Wrapper Registry app. The moment you land, with no wallet connected, it reads every pair live from the on‑chain registry — eight pairs right now, each enriched with name, symbol, decimals, and total supply. Nothing here is hardcoded: register a new pair on chain and it shows up automatically. Revoked pairs are surfaced and clearly flagged. Search filters by symbol, name, or address."

*(Show: stats row, scroll the grid, type "USDC" in search.)*

### 1:00 – 1:35 · Faucet + Wrap
> "Let's actually use it. I connect a Sepolia wallet. Every underlying mock has a permissionless faucet built right in — one click mints test USDC. Now I wrap it: the app handles the ERC‑20 approval and the shield call in a single action, turning public USDC into confidential cUSDC."

*(Show: connect, expand USDC card, Mint, then Wrap 100, confirm txns, show the ↗ tx links.)*

### 1:35 – 2:10 · Decrypt the confidential balance
> "Here's the confidential part. My cUSDC balance is encrypted on chain — invisible to everyone. I click Decrypt, sign a single EIP‑712 message, and the app performs user‑decryption through the Zama relayer to reveal my private balance — to me, and only me."

*(Show: the encrypted "Hidden" state → click Decrypt → wallet signature → plaintext balance appears.)*

### 2:10 – 2:30 · Confidential send (the privacy money-shot)
> "Now the part that makes privacy real. I send 50 cUSDC to another address. The amount is encrypted with FHE before it ever leaves my browser. Look at the transaction on Etherscan — you can see that I sent something, to whom, when… but the amount is just ciphertext. Nobody can read it but the people involved."

*(Show: enter recipient, pick 50%, Send, sign, then open the tx on Etherscan and point at the encrypted amount.)*

### 2:30 – 2:45 · Unwrap
> "And it round‑trips — unwrap any amount, or everything, back to the public ERC‑20."

*(Show: Unwrap, confirm, balance updates.)*

### 2:45 – 2:55 · Close
> "Every official pair, discoverable and usable in one place: wrap, unwrap, decrypt, and a faucet to get started. Registry‑driven, network‑guarded, production‑ready. That's the Confidential Wrapper Registry. Built on Zama FHE."

*(Show: full dashboard. End card with repo URL + #ZamaDeveloperProgram.)*

---

**Submission checklist**
- [ ] Deploy to Vercel, confirm COOP/COEP headers live (`vercel.json`).
- [ ] Record the flow end‑to‑end on a funded Sepolia wallet.
- [ ] Public GitHub repo with this README.
- [ ] Submit via the Bounty Track link; post on X tagging **@zama** + **#ZamaDeveloperProgram**.
