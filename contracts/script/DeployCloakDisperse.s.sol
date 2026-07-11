// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CloakDisperse} from "../src/CloakDisperse.sol";

contract DeployCloakDisperse is Script {
    function run() external {
        vm.startBroadcast();
        CloakDisperse disperse = new CloakDisperse();
        console.log("CloakDisperse deployed at:", address(disperse));
        vm.stopBroadcast();
    }
}
