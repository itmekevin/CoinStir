//SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import {Host, Result} from "@oasisprotocol/sapphire-contracts/contracts/OPL.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
* @title CoinStirHost
* @dev CoinStirHost acts as the asset transacting half of a larger application used to obfuscate txn history and user account balance from the public eye.
* This half of the application exists on Ethereum, while the other half exsits on the Oasis Network's Sapphire Paratime which enables custom visibility settings on sensitive data.
* The Ethereum component and the Sapphire component communicate via the Celer IM Bridge.
*/

contract StirHost is Host {

/**
* @dev sets the Enclave address for the sapphire component of the application. This ensures only messages received from this specific address are acted upon, increasing security.
* @notice an endpoint is set, causing the subsequent function "_executeTxn" to execute upon receipt of a message including the keyword "executeTxn".
*/
    constructor(address enclave) Host(enclave) {
        registerEndpoint("executeTxn", _executeTxn);
    }

/**
* @dev accepts a deposit of any amount and tracks the details in the Enclave contract
* @notice funds stay in this contract, while both the sender and the message value are sent via Celer IM Bridge to the Enclave, where the details of the txn are stored.
* @notice no state is kept in this contract, only the assets. All contract state is stored in the Enclave on Sapphire for privacy.
* @return success upon proper execution.
*/
    function deposit() external payable returns (Result) {
        address sender = msg.sender;
        uint256 payload = msg.value;
        postMessage("trackDeposit", abi.encode(sender, payload));
        return Result.Success;
    }

/**
* @dev accepts messages delivered via the Celer IM Bridge from the Enclave contract only, extracts the recipiant and value of the txn request, and executes the transfer of funds.
* @notice security and permissions are handled entirely by the Enclave prior to the message being sent.
* @notice funds are sent but no state is updated in this contract.
* @return success upon proper execution.
*/
    function _executeTxn(bytes calldata _args) internal returns (Result) {
        (address recipiant, uint256 payload) = abi.decode(_args, (address, uint256));
        payable(recipiant).transfer(payload);
        return Result.Success;
    }

}
