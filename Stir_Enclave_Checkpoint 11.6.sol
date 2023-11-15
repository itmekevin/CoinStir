//SPDX-License-Identifier: MIT

pragma solidity 0.8.22;

import {Enclave, Result, autoswitch} from "@oasisprotocol/sapphire-contracts/contracts/OPL.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "contracts/accessControl.sol";

contract StirEnclave is Enclave, accessControl {

    uint256 private contractBalance = 0;
    uint256 private txnNumber = 0;
    uint256 public feeClaim = 0;
    uint256 public reclaimGas = 0;
    uint256 public depositGasPrice = 2000000000000000;

    address public stir;
    address public feeWallet;
    address public gasWallet;
    address public relayer;

    struct metaddr {
        address _walletB;
        bytes _signature;
    }

    struct metaTXN {
        uint256 _payload;
        address _dest;
        bytes _signature;
    }

    struct TXN {
        uint256 date;
        address recipiant;
        address sendingWallet;
        uint256 amount;
        uint256 fee;
        uint256 availBal;
    }

    mapping (address => uint256) private userBalance;
    mapping (address => address) private originAddress;
    mapping (uint256 => TXN) private TXNno;
    mapping (address => uint256[]) private origintxns;
    mapping (address => address[]) private approvedAddress;


    constructor(address stirHost) Enclave(stirHost, autoswitch("ethereum")) {
        registerEndpoint("trackDeposit", _trackDeposit);
        stir = stirHost;
        adminStatus[0x0D78a2d04B925f50Ee233735b60C862357492D2d] = true;
        relayerStatus[0xF30CcB655090a190178D75bdFC8203eb826Ab066] = true;
        feeWallet = 0x0D78a2d04B925f50Ee233735b60C862357492D2d;
        gasWallet = 0xF30CcB655090a190178D75bdFC8203eb826Ab066;
    }


////////////////////////////////////////////////// - WALLET APPROVALS - //////////////////////////////////////////////////


// CREATES THE INFO TO BE PASSED BY RELAYER TO CoinStir TO APPROVE THE SIGNERS 'WALLET B' ADDRESS
    function createMetaTxnAddr(metaddr memory _metaddr) external pure returns (bytes memory) {
        return (abi.encode(
            _metaddr._walletB,
            _metaddr._signature
        ));
    }

// ACCEPTS INFO FROM RELAYER TO APPROVE THE ADDRESS DICTATED BY USER
    function approveAddress(bytes memory input, string calldata _msg, uint256 gasPrice) external onlyRelayer returns (Result) {
        (address _walletB, bytes memory signature) = abi.decode(input, (address, bytes));
            bytes32 messageHash = keccak256(abi.encodePacked(_msg));
            bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
            address sender = ECDSA.recover(message, signature);
                    approvedAddress[sender].push(_walletB);
                    originAddress[_walletB] = sender;
                    txnNumber ++;
                        TXN storage t = TXNno[txnNumber];
                        t.date = block.number;
                        t.recipiant = _walletB;
                        t.sendingWallet = sender;
                        t.amount = 0;
                        t.fee = 0;
                    origintxns[sender].push(txnNumber);
                    userBalance[sender] -= gasPrice;
                    t.availBal = userBalance[sender];
                    reclaimGas += gasPrice;
                    return (Result.Success);
    }

// ACCEPTS INFO FROM RELAYER TO REVOKE THE ADDRESS DICTATED BY USER
    function revokeAddress(bytes memory input, string calldata _msg, uint256 gasPrice) external onlyRelayer returns (Result) {
        (address _walletB, bytes memory signature) = abi.decode(input, (address, bytes));
            bytes32 messageHash = keccak256(abi.encodePacked(_msg));
            bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
            address sender = ECDSA.recover(message, signature);
                    userBalance[sender] -= gasPrice;
                    // DELETE SUBMITTED ADDRESS FROM APPROVAL LIST
                            for (uint i = 0; i < approvedAddress[sender].length; i++) {
                                if (approvedAddress[sender][i] == _walletB) {
                                    if (i != approvedAddress[sender].length - 1) {
                                        approvedAddress[sender][i] = approvedAddress[sender][approvedAddress[sender].length - 1];
                                    }
                                    approvedAddress[sender].pop();
                                    break;
                                }
                            }
                    txnNumber ++;
                        TXN storage t = TXNno[txnNumber];
                        t.date = block.number;
                        t.recipiant = _walletB;
                        t.sendingWallet = sender;
                        t.amount = 0;
                        t.fee = 0;
                        t.availBal = userBalance[sender];
                    origintxns[sender].push(txnNumber);
                    reclaimGas += gasPrice;
                    return (Result.Success);
    }

////////////////////////////////////////////////// - TRANSACTIONAL - //////////////////////////////////////////////////

// CREATES THE INFO TO BE PASSED BY RELAYER TO CoinStir TO INITIATE A TXN && CONFIRM IF MEMORY IS REQUIRED OR CAN USE CALLDATA
    function createmetaTXN(metaTXN memory _metaTxn) external pure returns (bytes memory) {
        return (abi.encode(
            _metaTxn._payload,
            _metaTxn._dest,
            _metaTxn._signature
        ));
    }
 
 // ACCEPTS INFO FROM RELAYER TO INITIATE A TXN ON BEHALF OF A USER && CONFIRM IF 'MEMORY' IS REQUIRED OR CAN USE CALLDATA 
    function _trackTxn(bytes memory input, string calldata _msg, uint256 gasPrice, uint256 feeRate) external onlyRelayer returns (Result) {
        (uint256 payload, address recipiant, bytes memory signature) = abi.decode(input, (uint256, address, bytes));
            bytes32 messageHash = keccak256(abi.encodePacked(_msg));
            bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
            address sender = ECDSA.recover(message, signature);
                address _originAddr = originAddress[sender];
                uint256 fee = ((payload/1000)*feeRate);
                    if (recipiant == _originAddr) {
                        fee = 0;
                    }
                    feeClaim += fee;
                uint256 adjustedPayload = (payload + fee + gasPrice);
                require(userBalance[_originAddr] >= adjustedPayload, "insufficient funds");
                require(contractBalance >= adjustedPayload, "insufficient contract balance"); 
                    txnNumber ++;
                        TXN storage t = TXNno[txnNumber];
                        t.date = block.number;
                        t.recipiant = recipiant;
                        t.sendingWallet = sender;
                        t.amount = payload;
                        t.fee = fee;
                    origintxns[_originAddr].push(txnNumber);
                    contractBalance -= payload;
                    postMessage("executeTxn", abi.encode(recipiant, payload));
                    userBalance[_originAddr] -= adjustedPayload;
                    t.availBal = userBalance[_originAddr];
                    reclaimGas += gasPrice;
                return (Result.Success);
    }

// TRACKS DEPOSITS TO THE HOST CONTRACT, INITIATED BY THE MESSAGE BRIDGE.
    function _trackDeposit(bytes calldata _args) internal returns (Result) {
        (address sender, uint256 payload) = abi.decode(_args, (address, uint256));
            originAddress[sender] = sender;
            userBalance[sender] += (payload - depositGasPrice);
            txnNumber ++;
                TXN storage t = TXNno[txnNumber];
                t.date = block.number;
                t.recipiant = stir;
                t.sendingWallet = sender;
                t.amount = payload;
                t.fee = 0;
                t.availBal = userBalance[sender];
            origintxns[sender].push(txnNumber);
            contractBalance += payload;
            reclaimGas += depositGasPrice;
        return (Result.Success);
    }

////////////////////////////////////////////////// - GETTERS - ///////////////////////////////////////////////////////////

// RETURNS THE TXN DATA FOR THE REQUESTED NUM OF TXNS
    function recoverAddrTXNdata(bytes calldata signature, string calldata input, uint256 start, uint256 stop) external view returns (TXN[] memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(input));
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredAddress = ECDSA.recover(message, signature);
            uint256 iterations = stop - start;
            address _addr = originAddress[recoveredAddress];
                TXN[] memory txnData = new TXN[](iterations);
                for (uint256 i = 0; i < iterations; i++) {
                    uint256 current = origintxns[_addr][i + start];
                    txnData[i] = getTxnData(current);
                }
            return (txnData);
    }

// RETURNS TXN DATA FOR A SPECIFIC TXN
    function getTxnData(uint256 _TXNno) private view returns (TXN memory) {
        return TXNno[_TXNno];
    }

// EXTRACTS USERS ADDRESS FROM A SIGNED MESSAGE && CAN MEMORY BE SWAPPED TO CALLDATA HERE? ADDITIONALLY, ENFORCE EIP-712 HERE
    function recoverAddressFromSignature(bytes memory signature, string memory input) external view returns (address, uint256) {
        bytes32 messageHash = keccak256(abi.encodePacked(input));
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredAddress = ECDSA.recover(message, signature);
            address _addr = originAddress[recoveredAddress];
            uint256 txnCount = getTxnCount(_addr);
        return (recoveredAddress, txnCount);
    }

// GETS NUMBER OF TXNS FOR A GIVEN ORIGIN ADDRESS
    function getTxnCount(address _addr) private view returns (uint256) {
        return origintxns[_addr].length;
    }

// GETS BALANCE OF AN ORIGIN ADDRESS && CAN MEMORY BE SWAPPED TO CALLDATA? ADDITIONALLY, ENFORCE EIP-712 HERE
    function recoverAddrCheckBal(bytes memory signature, string memory input) external view returns (uint256) {
        bytes32 messageHash = keccak256(abi.encodePacked(input));
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredAddress = ECDSA.recover(message, signature);
            address _addr = originAddress[recoveredAddress];
            uint256 bal = userBalance[_addr];
        return (bal);
    }

// GETS A USERS ORIGIN ADDRESS FROM A SIGNATURE
    function recoverOriginFromSignature(bytes memory signature, string memory input) external view returns (address) {
        bytes32 messageHash = keccak256(abi.encodePacked(input));
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredAddress = ECDSA.recover(message, signature);
            address _addr = originAddress[recoveredAddress];
        return (_addr);
    }


// GETS NUMBER OF APPROVED ADDRESSES TIED TO AN ACCOUNT
    function approvalCheck(address addr) public view returns (uint256) {
        return approvedAddress[addr].length;
    }

// GETS APPROVED ADDRESSES FOR A GIVEN ORIGIN ADDRESS
    function getApprovedAddr(bytes calldata signature, string calldata input, uint256 index) public view returns (address) {
        bytes32 messageHash = keccak256(abi.encodePacked(input));
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredAddress = ECDSA.recover(message, signature);
            return approvedAddress[recoveredAddress][index];
    }

////////////////////////////////////////////////// - AUTHORIZED ACCESS - ///////////////////////////////////////////////////////////

// ALLOWS AUTHORIZED ACCOUNT TO GET TXN DATA FOR A SPECIFIC ACCOUNT
    function authGetTXNinfo(bytes calldata signature, string calldata input, address _addr, uint256 start, uint256 stop) external view returns (TXN[] memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(input));
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredAddress = ECDSA.recover(message, signature);
        require (authStatus[recoveredAddress] == true, "User is not permissioned");
            uint256 iterations = stop - start;
            address addr = originAddress[_addr];
                TXN[] memory txnData = new TXN[](iterations);
                for (uint256 i = 0; i < iterations; i++) {
                    uint256 current = origintxns[addr][i + start];
                    txnData[i] = getTxnData(current);
                }
            return (txnData);
    }

// ALLOWS AUTHORIZED ACCOUNT TO GET HOW MANY TXNS BELONG TO AN ACCOUNT
    function authGetTxnList(bytes calldata signature, string calldata input, address _addr) external view returns (uint256) {
        bytes32 messageHash = keccak256(abi.encodePacked(input));
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredAddress = ECDSA.recover(message, signature);
        require (authStatus[recoveredAddress] == true, "User is not permissioned");
        address addr = originAddress[_addr];
            return origintxns[addr].length;
    }

////////////////////////////////////////////////// - OWNER CONTROLS - //////////////////////////////////////////////////

// SETS GAS PRICE FOR DEPOSITS ONLY
function setDepositGasPrice(uint256 _depositGasPrice) external onlyAdmin {
    depositGasPrice = _depositGasPrice;
}

// WITHDRAWS ALL GAS FEES ACCRUED AND RESETS VARIABLE BACK TO 0
    function claimGas() external onlyAdmin {
        postMessage("executeTxn", abi.encode(gasWallet, reclaimGas));
        reclaimGas = 0;
    }

// ALLOWS FOR CHANGING OF WALLET GAS SHOULD BE SENT TO UPON CLAIM
    function setGasWallet(address _gasWallet) external onlyAdmin {
        gasWallet = _gasWallet;
    }

// WITHDRAWS ALL FEES AND RESETS VARIABLE BACK TO 0
    function claimFee() external onlyAdmin {
        postMessage("executeTxn", abi.encode(feeWallet, feeClaim));
        feeClaim = 0;
    }

// ALLOWS FOR CHANGING OF WALLET FEES SHOULD BE SENT TO UPON CLAIM
    function setFeeWallet(address _feeWallet) external onlyAdmin {
        feeWallet = _feeWallet;
    }

}