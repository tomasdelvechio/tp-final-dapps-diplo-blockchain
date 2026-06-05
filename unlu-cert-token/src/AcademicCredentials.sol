// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AcademicCredentials
/// @notice ERC-721 to issue and verify academic credentials (titulos) on-chain
/// @dev Each tokenId represents a single, unique credential. Metadata (degree
///      name, student name hash, issue date, PDF hash) lives off-chain in IPFS
///      and is referenced by the tokenURI.
contract AcademicCredentials is ERC721URIStorage, Ownable {
    // ==========================================================================
    // EVENTS
    // ==========================================================================

    /// @notice Emitted when the issuer mints a new credential
    /// @param student     wallet address of the student that receives the title
    /// @param tokenId     unique credential id (assigned by the issuer)
    /// @param metadataURI ipfs URI of the credential JSON metadata
    event CredentialIssued(address indexed student, uint256 indexed tokenId, string metadataURI);

    /// @notice Emitted when the issuer revokes (burns) a credential
    /// @param tokenId   credential id that was revoked
    event CredentialRevoked(uint256 indexed tokenId);

    // ==========================================================================
    // CONSTRUCTOR
    // ==========================================================================

    /// @notice Deploys the credential registry. The deployer becomes the issuer.
    /// @dev    The owner is the only address allowed to issue or revoke credentials.
    constructor()
        ERC721("UNQ Academic Credential", "UNQ-CRED")
        Ownable(msg.sender)
    {}

    // ==========================================================================
    // EXTERNAL — ISSUER
    // ==========================================================================

    /// @notice Issues a new credential to a student
    /// @param student     wallet that will own the credential
    /// @param tokenId     unique id assigned to this credential
    /// @param metadataURI ipfs:// or https:// URI pointing to the credential JSON
    function issueCredential(address student, uint256 tokenId, string memory metadataURI)
        public
        onlyOwner
    {
        // We use _mint (not _safeMint) because credentials are always issued to
        // student wallets (EOAs or smart-contract wallets that already accept transfers).
        // _mint already reverts if `student` is the zero address.
        _mint(student, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit CredentialIssued(student, tokenId, metadataURI);
    }

    /// @notice Revokes (burns) a previously issued credential
    /// @param tokenId credential id to revoke
    function revoke(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
        emit CredentialRevoked(tokenId);
    }

    // ==========================================================================
    // PUBLIC — VERIFIERS (anyone)
    // ==========================================================================

    /// @notice Convenience helper: tells you whether a credential is currently valid
    /// @param tokenId credential id
    /// @return true if a credential with this id exists, false otherwise
    function isValid(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}