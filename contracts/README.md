# Cloak contracts

Foundry project for Cloak's on-chain components (Sepolia).

| Contract | Address | Purpose |
|---|---|---|
| `CloakDisperse` | [`0x52149648f00105c728401B9f55dCEd2fDC4Ad8dA`](https://sepolia.etherscan.io/address/0x52149648f00105c728401B9f55dCEd2fDC4Ad8dA) | V2 batch confidential disperse — N recipients, 1 signature, 1 transaction |
| `CloakAirdrop` | deployed per campaign | On-chain claim registry: eligibility, deadline, claim fee, FCFS limit |

## CloakDisperse — design

The fhEVM input verifier binds a ZK input proof to the contract that calls
`FHE.fromExternal`. A proof generated for the token cannot be routed through an
intermediary — so CloakDisperse verifies the proof **itself**, then forwards
already-verified internal handles to the token:

```
for each recipient i:
    amount = FHE.fromExternal(encryptedAmounts[i], inputProof)  // one shared batch proof
    FHE.allowTransient(amount, token)                           // token may use the handle
    token.confidentialTransferFrom(from, recipient[i], amount)  // internal-handle overload
```

Requirements enforced:

- `msg.sender == from` — only the fund owner can disperse their tokens.
- The sender must have approved CloakDisperse as an ERC-7984 operator
  (`token.setOperator(disperse, until)`) — one-time per wallet per token.
- The contract holds no funds and accepts no ETH.

## Build & deploy

```bash
npm install          # @fhevm/solidity + encrypted-types (see remappings.txt)
forge build

forge script script/DeployCloakDisperse.s.sol \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --account <keystore-account> --broadcast
```
