// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AcademicCredentials} from "../src/AcademicCredentials.sol";

/// @title AcademicCredentialsTest
/// @notice Unit + fuzz tests for the credential registry
contract AcademicCredentialsTest is Test {
    AcademicCredentials public credentials;

    address public issuer;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    string public constant METADATA_URI = "ipfs://bafy.../credential-1.json";

    function setUp() public {
        issuer = address(this);
        credentials = new AcademicCredentials();
    }

    // ==========================================================================
    // DEPLOYMENT
    // ==========================================================================

    function test_NameAndSymbol() public view {
        assertEq(credentials.name(), "UNQ Academic Credential");
        assertEq(credentials.symbol(), "UNQ-CRED");
    }

    function test_DeployerIsOwner() public view {
        assertEq(credentials.owner(), issuer);
    }

    // ==========================================================================
    // ISSUE
    // ==========================================================================

    function test_IssuerCanIssue() public {
        credentials.issueCredential(alice, 1, METADATA_URI);

        assertEq(credentials.ownerOf(1), alice);
        assertEq(credentials.balanceOf(alice), 1);
        assertEq(credentials.tokenURI(1), METADATA_URI);
        assertTrue(credentials.isValid(1));
    }

    function test_NonIssuerCannotIssue() public {
        vm.prank(alice);
        vm.expectRevert();
        credentials.issueCredential(bob, 2, METADATA_URI);
    }

    function test_CannotIssueDuplicateTokenId() public {
        credentials.issueCredential(alice, 1, METADATA_URI);

        vm.expectRevert();
        credentials.issueCredential(bob, 1, METADATA_URI);
    }

    function test_IssuingEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit AcademicCredentials.CredentialIssued(alice, 42, METADATA_URI);

        credentials.issueCredential(alice, 42, METADATA_URI);
    }

    // ==========================================================================
    // REVOKE
    // ==========================================================================

    function test_IssuerCanRevoke() public {
        credentials.issueCredential(alice, 1, METADATA_URI);
        assertTrue(credentials.isValid(1));

        credentials.revoke(1);

        assertFalse(credentials.isValid(1));
        assertEq(credentials.balanceOf(alice), 0);
    }

    function test_NonIssuerCannotRevoke() public {
        credentials.issueCredential(alice, 1, METADATA_URI);

        vm.prank(alice);
        vm.expectRevert();
        credentials.revoke(1);
    }

    function test_CannotRevokeNonExistent() public {
        vm.expectRevert();
        credentials.revoke(999);
    }

    function test_RevokingEmitsEvent() public {
        credentials.issueCredential(alice, 7, METADATA_URI);

        vm.expectEmit(true, false, false, false);
        emit AcademicCredentials.CredentialRevoked(7);

        credentials.revoke(7);
    }

    // ==========================================================================
    // VERIFICATION
    // ==========================================================================

    function test_IsValidReturnsFalseForNonExistent() public view {
        assertFalse(credentials.isValid(123));
    }

    function test_TokenURIReturnsMetadataURI() public {
        credentials.issueCredential(alice, 5, "ipfs://bafy.../degree-systems-2025.json");

        assertEq(credentials.tokenURI(5), "ipfs://bafy.../degree-systems-2025.json");
    }

    // ==========================================================================
    // FUZZ
    // ==========================================================================

    function testFuzz_IssueToAnyAddress(address student, uint256 tokenId) public {
        vm.assume(student != address(0));

        credentials.issueCredential(student, tokenId, METADATA_URI);

        assertEq(credentials.ownerOf(tokenId), student);
        assertTrue(credentials.isValid(tokenId));
    }

    function testFuzz_IssuerCannotIssueToZeroAddress(uint256 tokenId) public {
        vm.expectRevert();
        credentials.issueCredential(address(0), tokenId, METADATA_URI);
    }
}