// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AcademicCredentials} from "../src/AcademicCredentials.sol";

/// @title DeployAcademicCredentials
/// @notice Deploys the AcademicCredentials registry. The deployer becomes the owner/issuer.
/// @dev    To deploy, first set up your .env file and run:
///         source .env && forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
contract DeployAcademicCredentials is Script {
    function run() external returns (AcademicCredentials) {
        vm.startBroadcast();

        AcademicCredentials credentials = new AcademicCredentials();

        vm.stopBroadcast();

        console.log("AcademicCredentials deployed at:", address(credentials));
        console.log("Admin/Issuer address:", msg.sender);

        return credentials;
    }
}