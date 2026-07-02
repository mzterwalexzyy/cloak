# 3‑Minute Video Pitch — Cloak · Confidential Token Distribution

Total ~3:00. Record screen + voiceover. Pre-fund wallet with Sepolia ETH before recording.
This one video covers all three track submissions: Bounty, Builder, and Special Bounty × TokenOps.

---

### 0:00 – 0:20 · Hook
> "On Ethereum, every token transfer is public. You can see who sent what to whom, right down to the exact amount. Zama's FHE protocol changes that — but until now there was no usable product on top of it. I built Cloak: wrap any token into its confidential version, hide your balance, send hidden amounts, and airdrop to hundreds of wallets without leaking a single allocation."

*(Show: home page loading, hero headline visible, registry populating live below.)*

---

### 0:20 – 0:50 · Live registry coverage
> "The moment you land — no wallet needed — Cloak reads every ERC-7984 wrapper pair from Zama's official on-chain registry. Eight pairs live right now. Nothing hardcoded: register a new pair and it appears automatically. Search by name, symbol, or contract address."

*(Show: pairs grid loading, type "USDC" in search to filter, click All to clear, scroll pairs.)*

---

### 0:50 – 1:20 · Faucet → Wrap → Decrypt
> "Let's run the full flow. Connect a wallet — it switches to Sepolia automatically if you're on the wrong network. Mint test USDC from the built-in faucet. Now wrap it: one click handles the ERC-20 approval and the confidential shield. My public USDC is gone — replaced by encrypted cUSDC. I click Decrypt, sign one EIP-712 message, and my private balance is revealed — to me, and only me. Nobody else on-chain can read this number."

*(Show: connect wallet → ChainPill auto-switching → Faucet page, mint 500 USDC → home console, wrap 100 → tx confirms → Decrypt, sign EIP-712 → balance appears.)*

---

### 1:20 – 1:45 · Confidential send
> "Now send. I pick 50 cUSDC, enter a recipient. The amount is FHE-encrypted before it leaves my browser. On Etherscan you can see: sender, recipient, timestamp — but the amount is pure ciphertext. No analyst, no competitor, no one can see what moved."

*(Show: /app swap page → Send tab → enter recipient address → 50% quick pick → Send → sign → open tx on Etherscan → point at encrypted calldata.)*

---

### 1:45 – 2:15 · Disperse — batch confidential distribution
> "Now the distribution tools. Disperse lets you send confidential tokens to dozens of wallets at once. Paste your list — address and amount per line. Cloak previews every recipient, validates the addresses in real time, then sends each transfer sequentially. Every amount encrypted. Every tx trackable. A $200,000 team payout that leaves no salary information on-chain."

*(Show: /disperse → paste 4–5 fake addresses with amounts → preview table populates → click Disperse → watch status change: queued → sending → sent with tx links.)*

---

### 2:15 – 2:50 · Airdrop campaigns
> "And for token launches — Airdrop campaigns. Give it a name, pick a token, set a deadline, paste your allocation list. Save it as a draft. When you're ready, hit Launch: Cloak iterates through every recipient, sends their confidential allocation, and tracks each one. Close the tab and come back — it picks up where it left off. Every participant receives their tokens privately. No one knows who got what."

*(Show: /airdrop → New Campaign tab → fill name "Season 1 Airdrop", pick cUSDC, paste 3 recipients → Save campaign draft → switches to campaign detail → Launch airdrop → watch 3 rows go: pending → sent.)*

---

### 2:50 – 3:00 · Close
> "Wrap. Decrypt. Send. Disperse. Airdrop. The complete confidential token lifecycle — built on Zama FHE, live on Sepolia. Cloak."

*(Show: home page full view with registry loaded. Hold on the URL and GitHub link. Fade.)*

---

## Pre-recording checklist
- [ ] Wallet has 0.1+ Sepolia ETH (for gas)
- [ ] Mint 500 USDC from Faucet page before recording
- [ ] Pre-type 4-5 recipient addresses in a notepad for the Disperse shot
- [ ] Pre-fill one airdrop campaign form in a draft (can delete after)
- [ ] Turn off notifications / Do Not Disturb
- [ ] 1920×1080, browser zoom at 90%

## Submission checklist
- [x] Live on Vercel with COOP/COEP headers (credentialless)
- [x] Public GitHub: https://github.com/mzterwalexzyy/cloak
- [ ] Record the 3-min video above
- [ ] **Bounty Track**: Submit form, post on X tagging @zama + #ZamaDeveloperProgram
- [ ] **Builder Track**: Submit same video + repo link to Builder Track form
- [ ] **Special Bounty × TokenOps**: Submit, highlighting Disperse + Airdrop as the confidential distribution flow
- [ ] X post: "Just shipped Cloak — confidential token wrappers, disperse, and airdrop on @zama_fhe. Wrap any token, hide balances, send and airdrop without leaking amounts. Live: [URL] #ZamaDeveloperProgram @zama"
