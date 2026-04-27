// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AssetToken
 * @notice ERC-1155 token representing tokenized trade assets / invoices.
 *         Each token ID maps to a distinct asset class.
 */
contract AssetToken is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // tokenId => metadata CID / URI override
    mapping(uint256 => string) private _tokenURIs;

    event AssetMinted(address indexed to, uint256 indexed tokenId, uint256 amount);

    constructor(string memory baseURI, address admin) ERC1155(baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /// @notice Mint tokenized assets to a recipient
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, tokenId, amount, data);
        emit AssetMinted(to, tokenId, amount);
    }

    /// @notice Set per-token URI override
    function setTokenURI(uint256 tokenId, string calldata newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _tokenURIs[tokenId] = newURI;
    }

    /// @notice Returns token URI, falling back to base URI
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        return super.uri(tokenId);
    }

    /// @dev Required override for AccessControl + ERC1155
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
