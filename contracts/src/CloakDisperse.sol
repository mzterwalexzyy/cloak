// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * CloakDisperse V2 — batch confidential token dispatch in a single transaction.
 *
 * Flow:
 *   1. Sender approves this contract as an operator on the token:
 *        token.setOperator(address(this), type(uint48).max)
 *   2. Client generates ONE batch proof for all amounts, bound to THIS contract's
 *      address (not the token's) — because this contract is the one calling
 *      FHE.fromExternal, the fhEVM input verifier checks the proof against it.
 *   3. Sender calls disperseConfidential() — one tx, one signature, N recipients.
 *      Each handle is verified here, granted transiently to the token via the ACL,
 *      then transferred with the token's internal-handle confidentialTransferFrom.
 *
 * Security:
 *   - require(msg.sender == from)  — only the fund owner can initiate a disperse.
 *   - The token contract enforces the operator check on confidentialTransferFrom.
 *   - No ETH accepted; contract holds no funds.
 */
interface IERC7984Partial {
    function confidentialTransferFrom(
        address from,
        address to,
        euint64 amount
    ) external returns (euint64);
}

contract CloakDisperse is ZamaEthereumConfig {

    event BatchDisperseCompleted(
        address indexed token,
        address indexed from,
        uint256 recipientCount
    );

    error LengthMismatch();
    error NoRecipients();
    error OnlySenderCanDisperse();

    /**
     * Disperse confidential tokens to N recipients in a single transaction.
     *
     * @param token            ERC-7984 confidential token address.
     * @param from             Token owner (msg.sender, who has approved this contract).
     * @param recipients       Recipient addresses.
     * @param encryptedAmounts Per-recipient encrypted amount handles (externalEuint64).
     * @param inputProof       Single ZK proof covering all encrypted amounts, generated
     *                         for THIS contract's address and the sender's address.
     */
    function disperseConfidential(
        address token,
        address from,
        address[] calldata recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes calldata inputProof
    ) external {
        if (msg.sender != from) revert OnlySenderCanDisperse();
        if (recipients.length == 0) revert NoRecipients();
        if (recipients.length != encryptedAmounts.length) revert LengthMismatch();

        IERC7984Partial t = IERC7984Partial(token);
        for (uint256 i = 0; i < recipients.length; ) {
            euint64 amount = FHE.fromExternal(encryptedAmounts[i], inputProof);
            FHE.allowTransient(amount, token);
            t.confidentialTransferFrom(from, recipients[i], amount);
            unchecked { ++i; }
        }

        emit BatchDisperseCompleted(token, from, recipients.length);
    }
}
