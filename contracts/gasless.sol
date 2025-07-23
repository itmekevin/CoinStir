// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { encryptCallData } from "@oasisprotocol/sapphire-contracts/contracts/CalldataEncryption.sol";
import { EIP155Signer } from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";

struct EthereumKeypair {
    address addr;
    bytes32 secret;
    uint64 nonce;
}

struct EthTx {
    uint64 nonce;
    uint256 gasPrice;
    uint64 gasLimit;
    address to;
    uint256 value;
    bytes data;
    uint256 chainId;
}

// Custom errors for better gas efficiency and clarity
error TransactionWillFail(string reason);
error UnauthorizedKeypairUpdate();

// Gasless relayer to transact on behalf of users with pre-flight checks
contract Gasless {
    EthereumKeypair[] private keypairs;
    uint256 private currentKeypairIndex;
    address public owner;

    uint256 private MAX_KEYPAIRS = 5;
    uint256 private nextReplaceIndex = 0;
    address constant public TARGET_CONTRACT = 0xc0d72DD01AC4a5f8335DB2b302cbCbA4fA10683b; // HARDCODE THIS IN
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedKeypairUpdate();
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
function addKeypair(EthereumKeypair memory keypair) external onlyOwner {
    if (keypairs.length < MAX_KEYPAIRS) {
        // Still have room, just add the new keypair
        keypairs.push(keypair);
    } else {
        // At maximum capacity, replace the keypair at nextReplaceIndex
        keypairs[nextReplaceIndex] = keypair;
        
        // Update the replace index for next time (circular)
        nextReplaceIndex = (nextReplaceIndex + 1) % MAX_KEYPAIRS;
        
        // Reset currentKeypairIndex if it was pointing to the replaced keypair
        if (currentKeypairIndex == nextReplaceIndex - 1 || 
            (nextReplaceIndex == 0 && currentKeypairIndex == MAX_KEYPAIRS - 1)) {
            currentKeypairIndex = 0;
        }
    }
}

function format(
    bytes memory signedMsg,
    string memory val,
    bool isInternal
) public pure returns (bytes memory) {
    
    uint256 feeRate = 10;
    uint256 gasPrice = 300000000000000;

    // Choose the function signature based on isInternal flag
    string memory functionSig = isInternal ? 
        "internalTxn(bytes,string,uint256,uint256)" : 
        "_trackTxn(bytes,string,uint256,uint256)";
        
    return abi.encodeWithSignature(
        functionSig,
        signedMsg,
        val,
        gasPrice,
        feeRate
    );
}
    
    /**
     * @dev Performs privacy-compliant pre-flight checks using destination contract validation
     * @param innercall Encoded function call data
     * @return success Whether the transaction would succeed
     * @return reason Failure reason if transaction would fail
     */
function preflightCheck(bytes memory innercall) public view returns (bool success, string memory reason) {
    // Reject empty calldata - no pure ETH sends allowed
    if (innercall.length < 4) {
        return (false, "Empty calldata not allowed");
    }
    
    // Check 1: Contract existence  
    if (TARGET_CONTRACT.code.length == 0) {
        return (false, "Target is not a contract");
    }
    
    // Check 2: Only allow specific function selectors
    bytes4 selector = bytes4(innercall);
    bytes4 trackTxnSelector = bytes4(keccak256("_trackTxn(bytes,string,uint256,uint256)"));
    bytes4 internalTxnSelector = bytes4(keccak256("internalTxn(bytes,string,uint256,uint256)"));
    
    if (selector == trackTxnSelector || selector == internalTxnSelector) {
        return validateUsingDestinationContract(innercall);
    }
    
    return (false, "Function selector not allowed");
}
    
    /**
     * @dev Decode the parameters from _trackTxn or internalTxn call data
     * @param callData The encoded function call data
     * @return signedMsg The signed message bytes
     * @return val The value string
     * @return gasPrice
     * @return feeRate
     */
    function decodeTrackTxnParams(bytes memory callData) 
        external 
        pure 
        returns (bytes memory signedMsg, string memory val, uint256 gasPrice, uint256 feeRate) 
    {
        // Skip the function selector (first 4 bytes) and decode the parameters
        bytes memory paramData = new bytes(callData.length - 4);
        for (uint i = 0; i < paramData.length; i++) {
            paramData[i] = callData[i + 4];
        }
        
        (signedMsg, val, gasPrice, feeRate) = abi.decode(
            paramData, 
            (bytes, string, uint256, uint256)
        );
    }
    
    /**
     * @dev Uses the destination contract's own validateTrackTxn function
     * @param callData The encoded transaction call data
     * @return success Whether the call would succeed
     * @return reason Failure reason if call would fail
     */
    function validateUsingDestinationContract(
        bytes memory callData
    ) internal view returns (bool success, string memory reason) {
        // Decode the function call parameters
        (bool decodeSuccess, bytes memory decodeResult) = address(this).staticcall(
            abi.encodeWithSignature("decodeTrackTxnParams(bytes)", callData)
        );
        
        if (!decodeSuccess) {
            return (false, "Could not decode transaction parameters");
        }
        
        (bytes memory signedMsg, string memory val, uint256 gasPrice, uint256 feeRate) = 
            abi.decode(decodeResult, (bytes, string, uint256, uint256));
        
        // Determine if this is an internal transaction (no Celer fees)
        bytes4 selector = bytes4(callData);
        bytes4 internalTxnSelector = bytes4(keccak256("internalTxn(bytes,string,uint256,uint256)"));
        bool isInternal = (selector == internalTxnSelector);
        
        // Call the destination contract's validation function
        (bool validationSuccess, bytes memory validationResult) = TARGET_CONTRACT.staticcall(
            abi.encodeWithSignature(
                "validateTrackTxn(bytes,string,uint256,uint256,bool)",
                signedMsg,
                val,
                gasPrice,
                feeRate,
                isInternal
            )
        );
        
        if (!validationSuccess) {
            return (false, "Validation call to destination contract failed");
        }
        
        // Decode the validation result
        (bool isValid, string memory validationReason) = abi.decode(
            validationResult, 
            (bool, string)
        );
        
        if (!isValid) {
            return (false, validationReason);
        }
        
        return (true, "Transaction validation passed");
    }
    
    /**
     * @dev Creates a proxy transaction with pre-flight validation
     * @param innercall Encoded function call data
     */
    function makeProxyTx(
        bytes memory innercall
    ) external view returns (bytes memory output) {
        // Perform pre-flight checks
        (bool willSucceed, string memory failureReason) = preflightCheck(innercall);
        
        if (!willSucceed) {
            revert TransactionWillFail(failureReason);
        }
        
        // Get keypair for this transaction
        require(keypairs.length > 0, "No keypairs available");
        EthereumKeypair memory selectedKeypair = keypairs[currentKeypairIndex];
        
        bytes memory data = abi.encode(innercall, currentKeypairIndex);
        
        return EIP155Signer.sign(
            selectedKeypair.addr,
            selectedKeypair.secret,
            EIP155Signer.EthTx({
                nonce: selectedKeypair.nonce,
                gasPrice: 100_000_000_000,
                gasLimit: 2500000,
                to: address(this),
                value: 0,
                data: encryptCallData(abi.encodeCall(this.proxy, data)),
                chainId: block.chainid
            })
        );
    }
    
    /**
     * @dev Execute the proxied transaction
     * @param data Encoded call data and keypair index
     */
    function proxy(bytes memory data) external payable {
        (bytes memory subcallData, uint256 keypairIndex) = abi.decode(
            data,
            (bytes, uint256)
        );
        
        require(keypairIndex < keypairs.length, "Invalid keypair index");
        
        // Perform the call to the hardcoded target contract
        (bool success, bytes memory outData) = TARGET_CONTRACT.call(subcallData);
        
        if (!success) {
            // Add inner-transaction meaningful data in case of error
            assembly {
                revert(add(outData, 32), mload(outData))
            }
        }
        
        // Only increment nonce on successful execution
        keypairs[keypairIndex].nonce += 1;
        currentKeypairIndex = (currentKeypairIndex + 1) % keypairs.length;
    }
    
    /**
     * @dev Get a keypair address by index number
     */
    function getKeypairAddress(uint256 keypairIndex) external view returns (address) {
        require(keypairIndex < keypairs.length, "Invalid keypair index");
        return keypairs[keypairIndex].addr;
    }
    
    /**
     * @dev Get total number of keypairs
     */
    function getKeypairCount() external view returns (uint256) {
        return keypairs.length;
    }
    
}
