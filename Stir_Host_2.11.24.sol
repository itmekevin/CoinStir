//SPDX-License-Identifier: MIT

pragma solidity 0.8.22;

import {Host, Result} from "@oasisprotocol/sapphire-contracts/contracts/OPL.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract StirHost is Host {

    constructor(address enclave) Host(enclave) {
        registerEndpoint("executeTxn", _executeTxn);
    }

// ACCEPTS DEPOSIT AND TRACKS DETAILS IN ENCLAVE
    function deposit() external payable returns (Result) {
        address sender = msg.sender;
        uint256 payload = msg.value;
        postMessage("trackDeposit", abi.encode(sender, payload));
        return Result.Success;
    }
    
// ACCEPTS TXN FROM ENCLAVE AND DISTRIBUTES FUNDS
    function _executeTxn(bytes calldata _args) internal returns (Result) {
        (address recipiant, uint256 payload) = abi.decode(_args, (address, uint256));
        payable(recipiant).transfer(payload);
        return Result.Success;
    }

}
