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
    // ISSUE
    // ==========================================================================

    function test_IssuerCanIssue() public {
        credentials.issueCredential(alice, 1, "Alice Smith", "12345678", "Ingenieria", 9, METADATA_URI);

        assertEq(credentials.ownerOf(1), alice);
        assertEq(credentials.balanceOf(alice), 1);
        assertEq(credentials.tokenURI(1), METADATA_URI);
        assertTrue(credentials.isValid(1));

        (string memory nombre, string memory dni, string memory carrera, uint256 fecha, uint256 promedio) = credentials.credentials(1);
        assertEq(nombre, "Alice Smith");
        assertEq(dni, "12345678");
        assertEq(carrera, "Ingenieria");
        assertEq(promedio, 9);
        assertEq(fecha, block.timestamp);
    }

    function test_NonIssuerCannotIssue() public {
        vm.prank(alice);
        vm.expectRevert();
        credentials.issueCredential(bob, 2, "Bob", "87654321", "Sistemas", 8, METADATA_URI);
    }

    function test_CannotIssueDuplicateTokenId() public {
        credentials.issueCredential(alice, 1, "Alice", "1", "A", 10, METADATA_URI);

        vm.expectRevert();
        credentials.issueCredential(bob, 1, "Bob", "2", "B", 10, METADATA_URI);
    }

    // ==========================================================================
    // REVOKE
    // ==========================================================================

    function test_IssuerCanRevoke() public {
        credentials.issueCredential(alice, 1, "A", "1", "C", 10, METADATA_URI);
        assertTrue(credentials.isValid(1));

        credentials.revoke(1);

        assertFalse(credentials.isValid(1));
        assertEq(credentials.balanceOf(alice), 0);
    }

    function test_NonIssuerCannotRevoke() public {
        credentials.issueCredential(alice, 1, "A", "1", "C", 10, METADATA_URI);

        vm.prank(alice);
        vm.expectRevert();
        credentials.revoke(1);
    }

    function test_CannotRevokeNonExistent() public {
        vm.expectRevert();
        credentials.revoke(999);
    }

    // ==========================================================================
    // SOULBOUND
    // ==========================================================================

    function test_CannotTransfer() public {
        credentials.issueCredential(alice, 1, "A", "1", "C", 10, METADATA_URI);
        
        vm.prank(alice);
        vm.expectRevert("Soulbound: non-transferable");
        credentials.transferFrom(alice, bob, 1);
    }

    // ==========================================================================
    // VERIFICATION
    // ==========================================================================

    function test_IsValidReturnsFalseForNonExistent() public view {
        assertFalse(credentials.isValid(123));
    }

    function test_TokenURIReturnsMetadataURI() public {
        credentials.issueCredential(alice, 5, "A", "1", "C", 10, "ipfs://bafy.../degree-systems-2025.json");

        assertEq(credentials.tokenURI(5), "ipfs://bafy.../degree-systems-2025.json");
    }

    // ==========================================================================
    // FUZZ
    // ==========================================================================

    function testFuzz_IssueToAnyAddress(address student, uint256 tokenId) public {
        vm.assume(student != address(0));

        credentials.issueCredential(student, tokenId, "Student", "ID", "Major", 10, METADATA_URI);

        assertEq(credentials.ownerOf(tokenId), student);
        assertTrue(credentials.isValid(tokenId));
    }
}
