// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AcademicCredentials
/// @notice ERC-721 to issue and verify academic credentials (titulos) on-chain
/// @dev Each tokenId represents a single, unique credential. Metadata (degree
///      name, student name hash, issue date, PDF hash) lives off-chain in IPFS
///      and is referenced by the tokenURI.
contract AcademicCredentials is ERC721URIStorage, AccessControl {
    // ==========================================================================
    // ROLES & DATA STRUCTURES
    // ==========================================================================

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Credential {
        string nombreEstudiante;
        string dni;
        string carrera;
        uint256 fechaEmision;
        uint256 promedio;
    }

    /// @notice Mapping from tokenId to Credential data
    mapping(uint256 => Credential) public credentials;

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

    /// @notice Deploys the credential registry.
    constructor()
        ERC721("UNLu Academic Credential", "UNLu-CRED")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    // ==========================================================================
    // EXTERNAL — ISSUER
    // ==========================================================================

    /// @notice Issues a new credential to a student with on-chain data
    /// @param student     wallet that will own the credential
    /// @param tokenId     unique id assigned to this credential
    /// @param nombre      student's full name
    /// @param dni         student's ID number
    /// @param carrera     degree name
    /// @param promedio    student's average grade
    /// @param metadataURI ipfs:// or https:// URI pointing to the credential JSON
    function issueCredential(
        address student,
        uint256 tokenId,
        string memory nombre,
        string memory dni,
        string memory carrera,
        uint256 promedio,
        string memory metadataURI
    )
        public
        onlyRole(ISSUER_ROLE)
    {
        _mint(student, tokenId);
        _setTokenURI(tokenId, metadataURI);

        credentials[tokenId] = Credential({
            nombreEstudiante: nombre,
            dni: dni,
            carrera: carrera,
            fechaEmision: block.timestamp,
            promedio: promedio
        });

        emit CredentialIssued(student, tokenId, metadataURI);
    }

    /// @notice Revokes (burns) a previously issued credential
    /// @param tokenId credential id to revoke
    function revoke(uint256 tokenId) public onlyRole(ISSUER_ROLE) {
        _burn(tokenId);
        emit CredentialRevoked(tokenId);
    }

    // ==========================================================================
    // INTERNAL — SOULBOUND LOGIC
    // ==========================================================================

    /// @notice Overrides the _update function to block transfers (Soulbound)
    /// @dev Transfers from address(0) (minting) or to address(0) (burning) are allowed.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    // ==========================================================================
    // PUBLIC — VERIFIERS & OVERRIDES
    // ==========================================================================

    /// @notice Convenience helper: tells you whether a credential is currently valid
    /// @param tokenId credential id
    /// @return true if a credential with this id exists, false otherwise
    function isValid(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /// @dev Required override for AccessControl and ERC721
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}