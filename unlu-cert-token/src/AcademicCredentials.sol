// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AcademicCredentials
/// @notice ERC-721 to issue and verify academic credentials on-chain
/// @dev Each tokenId represents a single, unique credential. Metadata (degree
///      name, student name hash, issue date, PDF hash) lives off-chain in IPFS
///      and is referenced by the tokenURI.
contract AcademicCredentials is ERC721URIStorage, AccessControl {
    // ==========================================================================
    // ROLES & DATA STRUCTURES
    // ==========================================================================

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Credential {
        string degreeName;       // "Licenciatura en Sistemas de Información"
        bytes32 studentNameHash; // keccak256(nombre completo + DNI) — privacidad
        uint256 issueDate;       // timestamp de emisión
        bytes32 documentHash;    // keccak256 del PDF original del título
        bool active;             // false si fue revocado
    }

    /// @notice Mapping from tokenId to Credential data
    mapping(uint256 => Credential) public credentials;

    // ==========================================================================
    // EVENTS
    // ==========================================================================

    /// @notice Emitted when the issuer mints a new credential
    event CredentialIssued(
        address indexed student,
        uint256 indexed tokenId,
        string degreeName,
        bytes32 studentNameHash
    );

    /// @notice Emitted when the issuer revokes (burns) a credential
    event CredentialRevoked(
        uint256 indexed tokenId,
        address indexed by,
        string reason
    );

    /// @notice Emitted when the admin grants issuer role to an account
    event IssuerGranted(address indexed account, address indexed by);

    /// @notice Emitted when the admin revokes issuer role from an account
    event IssuerRevoked(address indexed account, address indexed by);

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
    // EXTERNAL — ADMIN
    // ==========================================================================

    /// @notice Grants the issuer role to a new address
    /// @param account The address to receive the ISSUER_ROLE
    function grantIssuer(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "AcademicCredentials: account address cannot be zero");
        grantRole(ISSUER_ROLE, account);
        emit IssuerGranted(account, msg.sender);
    }

    /// @notice Revokes the issuer role from an address
    /// @param account The address to lose the ISSUER_ROLE
    function revokeIssuer(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "AcademicCredentials: account address cannot be zero");
        revokeRole(ISSUER_ROLE, account);
        emit IssuerRevoked(account, msg.sender);
    }

    // ==========================================================================
    // EXTERNAL — ISSUER
    // ==========================================================================

    /// @notice Issues a new credential to a student with on-chain data
    /// @param student          wallet that will own the credential
    /// @param tokenId          unique id assigned to this credential
    /// @param degreeName       degree name
    /// @param studentNameHash  keccak256 hash of student's name and DNI
    /// @param documentHash     keccak256 hash of the PDF certificate
    /// @param metadataURI      ipfs:// or https:// URI pointing to the credential JSON
    function issueCredential(
        address student,
        uint256 tokenId,
        string memory degreeName,
        bytes32 studentNameHash,
        bytes32 documentHash,
        string memory metadataURI
    )
        public
        onlyRole(ISSUER_ROLE)
    {
        require(student != address(0), "AcademicCredentials: student address cannot be zero");
        require(studentNameHash != bytes32(0), "AcademicCredentials: name hash cannot be empty");
        require(documentHash != bytes32(0), "AcademicCredentials: document hash cannot be empty");
        require(bytes(degreeName).length > 0, "AcademicCredentials: degree name cannot be empty");
        require(bytes(metadataURI).length > 0, "AcademicCredentials: metadata URI cannot be empty");

        _mint(student, tokenId);
        _setTokenURI(tokenId, metadataURI);

        credentials[tokenId] = Credential({
            degreeName: degreeName,
            studentNameHash: studentNameHash,
            issueDate: block.timestamp,
            documentHash: documentHash,
            active: true
        });

        emit CredentialIssued(student, tokenId, degreeName, studentNameHash);
    }

    /// @notice Revokes (burns) a previously issued credential
    /// @param tokenId  credential id to revoke
    /// @param reason   reason for revocation
    function revoke(uint256 tokenId, string memory reason) public onlyRole(ISSUER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "AcademicCredentials: token does not exist");
        require(bytes(reason).length > 0, "AcademicCredentials: reason cannot be empty");

        credentials[tokenId].active = false;
        _burn(tokenId);

        emit CredentialRevoked(tokenId, msg.sender, reason);
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

    /// @notice Tells you whether a credential is currently valid
    /// @param tokenId credential id
    /// @return true if a credential with this id exists and is active, false otherwise
    function isValid(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0) && credentials[tokenId].active;
    }

    /// @notice Verifies a credential, returning the struct and if it is valid
    /// @param tokenId credential id
    /// @return The Credential struct and its validity state
    function verify(uint256 tokenId) public view returns (Credential memory, bool) {
        Credential memory cred = credentials[tokenId];
        bool valid = _ownerOf(tokenId) != address(0) && cred.active;
        return (cred, valid);
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