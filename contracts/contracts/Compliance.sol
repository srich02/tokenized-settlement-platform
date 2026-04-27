// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Compliance
 * @notice On-chain allowlist and transfer-restriction logic.
 *         Integrated with Settlement to gate deal creation and funding.
 */
contract Compliance is AccessControl {
    bytes32 public constant COMPLIANCE_OFFICER = keccak256("COMPLIANCE_OFFICER");

    // address => allowed to participate in settlements
    mapping(address => bool) public allowlisted;

    // address => blocked (overrides allowlist)
    mapping(address => bool) public blocked;

    // Per-asset daily transfer limit (tokenId => max amount per 24h)
    mapping(uint256 => uint256) public dailyLimit;

    // Tracking daily usage: keccak256(tokenId, date) => amount used
    mapping(bytes32 => uint256) public dailyUsage;

    event AddressAllowlisted(address indexed account);
    event AddressRemoved(address indexed account);
    event AddressBlocked(address indexed account);
    event AddressUnblocked(address indexed account);
    event DailyLimitSet(uint256 indexed tokenId, uint256 limit);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_OFFICER, admin);
    }

    /// @notice Add an address to the allowlist (e.g. after KYC)
    function allowlist(address account) external onlyRole(COMPLIANCE_OFFICER) {
        allowlisted[account] = true;
        emit AddressAllowlisted(account);
    }

    /// @notice Remove an address from the allowlist
    function removeFromAllowlist(address account) external onlyRole(COMPLIANCE_OFFICER) {
        allowlisted[account] = false;
        emit AddressRemoved(account);
    }

    /// @notice Block an address (sanctions, fraud)
    function blockAddress(address account) external onlyRole(COMPLIANCE_OFFICER) {
        blocked[account] = true;
        emit AddressBlocked(account);
    }

    /// @notice Unblock an address
    function unblockAddress(address account) external onlyRole(COMPLIANCE_OFFICER) {
        blocked[account] = false;
        emit AddressUnblocked(account);
    }

    /// @notice Set daily transfer limit for a token
    function setDailyLimit(uint256 tokenId, uint256 limit) external onlyRole(COMPLIANCE_OFFICER) {
        dailyLimit[tokenId] = limit;
        emit DailyLimitSet(tokenId, limit);
    }

    /// @notice Check if a transfer is compliant
    function checkTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount
    ) external view returns (bool compliant, string memory reason) {
        if (blocked[from]) return (false, "Sender is blocked");
        if (blocked[to]) return (false, "Recipient is blocked");
        if (!allowlisted[from]) return (false, "Sender not allowlisted");
        if (!allowlisted[to]) return (false, "Recipient not allowlisted");

        uint256 limit = dailyLimit[tokenId];
        if (limit > 0) {
            bytes32 key = _dailyKey(tokenId);
            if (dailyUsage[key] + amount > limit) {
                return (false, "Exceeds daily limit");
            }
        }

        return (true, "");
    }

    /// @notice Record usage against daily limit (called by Settlement)
    function recordUsage(uint256 tokenId, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 key = _dailyKey(tokenId);
        dailyUsage[key] += amount;
    }

    function _dailyKey(uint256 tokenId) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(tokenId, block.timestamp / 1 days));
    }
}
