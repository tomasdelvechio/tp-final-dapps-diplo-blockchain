// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AcademicCredentials} from "../src/AcademicCredentials.sol";

/// @title AcademicCredentialsTest
/// @notice Unit + fuzz tests for the credential registry
contract AcademicCredentialsTest is Test {
    AcademicCredentials public credentials;

    address public admin = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public issuer = makeAddr("issuer");

    string public constant DEGREE_NAME = "Licenciatura en Sistemas de Informacion";
    bytes32 public constant STUDENT_NAME_HASH = keccak256("Alice Smith DNI 12345678");
    bytes32 public constant DOCUMENT_HASH = keccak256("PDF content signature");
    string public constant METADATA_URI = "ipfs://bafy.../credential-1.json";

    function setUp() public {
        credentials = new AcademicCredentials();
    }

    // ==========================================================================
    // DEPLOYMENT
    // ==========================================================================

    function test_NameAndSymbol() public view {
        assertEq(credentials.name(), "UNLu Academic Credential");
        assertEq(credentials.symbol(), "UNLu-CRED");
    }

    function test_DeployerHasRoles() public view {
        assertTrue(credentials.hasRole(credentials.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(credentials.hasRole(credentials.ISSUER_ROLE(), admin));
    }

    // ==========================================================================
    // 1. Asignacion de Issuer (Camino Feliz)
    // ==========================================================================
    function test_AdminCanGrantAndRevokeIssuer() public {
        // Initially, 'issuer' doesn't have the role
        assertFalse(credentials.hasRole(credentials.ISSUER_ROLE(), issuer));

        // Grant role
        credentials.grantIssuer(issuer);
        assertTrue(credentials.hasRole(credentials.ISSUER_ROLE(), issuer));

        // Revoke role
        credentials.revokeIssuer(issuer);
        assertFalse(credentials.hasRole(credentials.ISSUER_ROLE(), issuer));
    }

    // ==========================================================================
    // 2. Emision de Credencial (Camino Feliz)
    // ==========================================================================
    function test_IssuerCanIssue() public {
        credentials.grantIssuer(issuer);
        
        vm.prank(issuer);
        credentials.issueCredential(
            alice,
            1,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );

        assertEq(credentials.ownerOf(1), alice);
        assertEq(credentials.balanceOf(alice), 1);
        assertEq(credentials.tokenURI(1), METADATA_URI);
        assertTrue(credentials.isValid(1));

        (
            string memory degreeName,
            bytes32 studentNameHash,
            uint256 issueDate,
            bytes32 documentHash,
            bool active
        ) = credentials.credentials(1);

        assertEq(degreeName, DEGREE_NAME);
        assertEq(studentNameHash, STUDENT_NAME_HASH);
        assertEq(documentHash, DOCUMENT_HASH);
        assertEq(issueDate, block.timestamp);
        assertTrue(active);
    }

    // ==========================================================================
    // 3. Verificacion de Credencial (Camino Feliz)
    // ==========================================================================
    function test_VerifyReturnsCorrectData() public {
        credentials.grantIssuer(issuer);
        
        vm.prank(issuer);
        credentials.issueCredential(
            alice,
            1,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );

        (AcademicCredentials.Credential memory cred, bool isValid) = credentials.verify(1);
        assertEq(cred.degreeName, DEGREE_NAME);
        assertEq(cred.studentNameHash, STUDENT_NAME_HASH);
        assertEq(cred.documentHash, DOCUMENT_HASH);
        assertEq(cred.issueDate, block.timestamp);
        assertTrue(cred.active);
        assertTrue(isValid);
    }

    // ==========================================================================
    // 4. Revocacion de Credencial (Camino Feliz)
    // ==========================================================================
    function test_IssuerCanRevoke() public {
        credentials.grantIssuer(issuer);
        
        vm.startPrank(issuer);
        credentials.issueCredential(
            alice,
            1,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
        assertTrue(credentials.isValid(1));

        credentials.revoke(1, "Error in name input");
        vm.stopPrank();

        assertFalse(credentials.isValid(1));
        
        // After burn, ownerOf(1) should revert
        vm.expectRevert();
        credentials.ownerOf(1);

        (AcademicCredentials.Credential memory cred, bool isValid) = credentials.verify(1);
        assertFalse(cred.active);
        assertFalse(isValid);
    }

    // ==========================================================================
    // 5. Emision no autorizada (Casos de Error)
    // ==========================================================================
    function test_NonIssuerCannotIssue() public {
        vm.prank(alice);
        vm.expectRevert();
        credentials.issueCredential(
            bob,
            2,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    // ==========================================================================
    // 6. Soulbound (Intransferibilidad / Casos de Error)
    // ==========================================================================
    function test_CannotTransfer() public {
        credentials.grantIssuer(issuer);
        
        vm.prank(issuer);
        credentials.issueCredential(
            alice,
            1,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );

        vm.prank(alice);
        vm.expectRevert("Soulbound: non-transferable");
        credentials.transferFrom(alice, bob, 1);
    }

    // ==========================================================================
    // 7. TokenID duplicado (Casos de Error)
    // ==========================================================================
    function test_CannotIssueDuplicateTokenId() public {
        credentials.grantIssuer(issuer);
        
        vm.startPrank(issuer);
        credentials.issueCredential(
            alice,
            1,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );

        vm.expectRevert();
        credentials.issueCredential(
            bob,
            1,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
        vm.stopPrank();
    }

    // ==========================================================================
    // 8. Revocacion inexistente (Casos de Error)
    // ==========================================================================
    function test_CannotRevokeNonExistent() public {
        credentials.grantIssuer(issuer);

        vm.prank(issuer);
        vm.expectRevert("AcademicCredentials: token does not exist");
        credentials.revoke(999, "No reason");
    }

    // ==========================================================================
    // 9. Administracion no autorizada (Casos de Error)
    // ==========================================================================
    function test_NonAdminCannotManageIssuers() public {
        vm.startPrank(alice);
        
        vm.expectRevert();
        credentials.grantIssuer(bob);

        vm.expectRevert();
        credentials.revokeIssuer(issuer);

        vm.stopPrank();
    }

    // ==========================================================================
    // 10. Fuzz de Emision (Fuzz)
    // ==========================================================================
    function testFuzz_IssueToAnyAddress(address student, uint256 tokenId) public {
        vm.assume(student != address(0));

        credentials.grantIssuer(issuer);

        vm.prank(issuer);
        credentials.issueCredential(
            student,
            tokenId,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );

        assertEq(credentials.ownerOf(tokenId), student);
        assertTrue(credentials.isValid(tokenId));
    }
}
