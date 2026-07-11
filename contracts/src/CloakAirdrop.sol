// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CloakAirdrop — on-chain claim registry for Zama FHE confidential airdrops.
 *
 * Flow:
 *   1. Admin deploys with deadline, claimLimit, and claimFee (in wei).
 *   2. Admin calls addEligible() in batches.
 *   3. Admin shares /claim?c=<contractAddress>.
 *   4. Users call claim{ value: claimFee }() — FCFS, deadline, fee, dedup enforced here.
 *   5. Admin withdraws accumulated ETH to cover FHE transfer gas costs.
 *   6. Admin (or script) reads ClaimRegistered events and sends FHE tokens.
 */
contract CloakAirdrop {
    address public immutable admin;
    uint256 public immutable deadline;    // unix timestamp; 0 = no deadline
    uint256 public immutable claimLimit;  // max claims; 0 = unlimited
    uint256 public claimFee;             // wei per claim; 0 = free
    uint256 public claimCount;

    mapping(address => bool) public eligible;
    mapping(address => bool) public claimed;

    event ClaimRegistered(address indexed claimant, uint256 indexed position, uint256 ts);
    event EligibleAdded(uint256 count);
    event FeeUpdated(uint256 newFee);
    event Withdrawn(address to, uint256 amount);

    error NotAdmin();
    error NotEligible();
    error AlreadyClaimed();
    error DeadlinePassed();
    error ClaimLimitReached();
    error InsufficientFee(uint256 required, uint256 sent);
    error WithdrawFailed();
    error NothingToWithdraw();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(uint256 _deadline, uint256 _claimLimit, uint256 _claimFee) {
        admin = msg.sender;
        deadline = _deadline;
        claimLimit = _claimLimit;
        claimFee = _claimFee;
    }

    /// Add eligible addresses in batches (call multiple times for large lists).
    function addEligible(address[] calldata addrs) external onlyAdmin {
        for (uint256 i = 0; i < addrs.length; i++) {
            eligible[addrs[i]] = true;
        }
        emit EligibleAdded(addrs.length);
    }

    /// Remove an address from eligibility.
    function removeEligible(address addr) external onlyAdmin {
        eligible[addr] = false;
    }

    /// Update the claim fee (e.g. if ETH price changes).
    function setClaimFee(uint256 _fee) external onlyAdmin {
        claimFee = _fee;
        emit FeeUpdated(_fee);
    }

    /**
     * Register a claim on-chain. Caller must send >= claimFee in ETH.
     * FCFS: first claimLimit callers win. Hard deadline enforced by block.timestamp.
     * Duplicate claims from the same wallet revert.
     */
    function claim() external payable {
        if (!eligible[msg.sender])                               revert NotEligible();
        if (claimed[msg.sender])                                 revert AlreadyClaimed();
        if (deadline > 0 && block.timestamp > deadline)          revert DeadlinePassed();
        if (claimLimit > 0 && claimCount >= claimLimit)          revert ClaimLimitReached();
        if (msg.value < claimFee)                                revert InsufficientFee(claimFee, msg.value);

        // Refund any excess payment
        if (msg.value > claimFee) {
            (bool ok,) = payable(msg.sender).call{value: msg.value - claimFee}("");
            require(ok, "Refund failed");
        }

        claimed[msg.sender] = true;
        uint256 position = ++claimCount;

        emit ClaimRegistered(msg.sender, position, block.timestamp);
    }

    /// Withdraw accumulated claim fees to admin wallet.
    function withdraw() external onlyAdmin {
        uint256 bal = address(this).balance;
        if (bal == 0) revert NothingToWithdraw();
        (bool ok,) = payable(admin).call{value: bal}("");
        if (!ok) revert WithdrawFailed();
        emit Withdrawn(admin, bal);
    }

    /// Convenience read for the claim page — one call instead of many.
    function getStatus(address addr) external view returns (
        bool isEligible,
        bool hasClaimed,
        bool deadlinePassed,
        bool limitReached,
        uint256 currentCount,
        uint256 limitVal,
        uint256 deadlineTs,
        uint256 feeWei,
        uint256 accumulatedFees
    ) {
        return (
            eligible[addr],
            claimed[addr],
            deadline > 0 && block.timestamp > deadline,
            claimLimit > 0 && claimCount >= claimLimit,
            claimCount,
            claimLimit,
            deadline,
            claimFee,
            address(this).balance
        );
    }
}
