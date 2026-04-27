// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Settlement
 * @notice Escrow-based settlement contract with multi-party approval.
 *         Assets are locked in escrow until all required parties approve,
 *         then released to the counterparty.
 */
contract Settlement is AccessControl, ERC1155Holder, ReentrancyGuard {
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    enum Status { Created, Funded, Approved, Settled, Cancelled }

    struct Deal {
        address seller;
        address buyer;
        address tokenContract;
        uint256 tokenId;
        uint256 amount;
        uint256 approvalsRequired;
        uint256 approvalsReceived;
        Status status;
    }

    uint256 public dealCount;
    mapping(uint256 => Deal) public deals;
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    event DealCreated(uint256 indexed dealId, address seller, address buyer);
    event DealFunded(uint256 indexed dealId);
    event DealApproved(uint256 indexed dealId, address approver);
    event DealSettled(uint256 indexed dealId);
    event DealCancelled(uint256 indexed dealId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(APPROVER_ROLE, admin);
    }

    /// @notice Create a new settlement deal
    function createDeal(
        address seller,
        address buyer,
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        uint256 approvalsRequired
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        require(seller != address(0) && buyer != address(0), "Invalid addresses");
        require(approvalsRequired > 0, "Need at least 1 approval");

        uint256 dealId = dealCount++;
        deals[dealId] = Deal({
            seller: seller,
            buyer: buyer,
            tokenContract: tokenContract,
            tokenId: tokenId,
            amount: amount,
            approvalsRequired: approvalsRequired,
            approvalsReceived: 0,
            status: Status.Created
        });

        emit DealCreated(dealId, seller, buyer);
        return dealId;
    }

    /// @notice Seller funds the escrow by transferring tokens to this contract
    function fundDeal(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Created, "Deal not in Created state");
        require(msg.sender == deal.seller, "Only seller can fund");

        IERC1155(deal.tokenContract).safeTransferFrom(
            deal.seller,
            address(this),
            deal.tokenId,
            deal.amount,
            ""
        );

        deal.status = Status.Funded;
        emit DealFunded(dealId);
    }

    /// @notice Approve a funded deal (multi-party)
    function approveDeal(uint256 dealId) external onlyRole(APPROVER_ROLE) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Funded, "Deal not funded");
        require(!hasApproved[dealId][msg.sender], "Already approved");

        hasApproved[dealId][msg.sender] = true;
        deal.approvalsReceived++;

        emit DealApproved(dealId, msg.sender);

        if (deal.approvalsReceived >= deal.approvalsRequired) {
            deal.status = Status.Approved;
        }
    }

    /// @notice Settle an approved deal — release tokens to buyer
    function settleDeal(uint256 dealId) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Approved, "Deal not approved");

        deal.status = Status.Settled;

        IERC1155(deal.tokenContract).safeTransferFrom(
            address(this),
            deal.buyer,
            deal.tokenId,
            deal.amount,
            ""
        );

        emit DealSettled(dealId);
    }

    /// @notice Cancel a deal and return tokens to seller (if funded)
    function cancelDeal(uint256 dealId) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Created || deal.status == Status.Funded, "Cannot cancel");

        Status prev = deal.status;
        deal.status = Status.Cancelled;

        if (prev == Status.Funded) {
            IERC1155(deal.tokenContract).safeTransferFrom(
                address(this),
                deal.seller,
                deal.tokenId,
                deal.amount,
                ""
            );
        }

        emit DealCancelled(dealId);
    }

    /// @dev Required override for AccessControl + ERC1155Holder
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
