//SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import {Enclave, Result, autoswitch} from "@oasisprotocol/sapphire-contracts/contracts/OPL.sol";
import "./accessControl.sol";
import "./VerifyTypedData.sol";

/**
* @title coinStirEnclave
* @dev coinStirEnclave acts as the data-storage half of a larger application used to obfuscate txn history and user account balance from the public eye.
* This half exists on the Oasis Network's Sapphire Paratime, while the other half exsits on Ethereum where all funds are actually transacted.
* No funds are transacted in this contract, only information about the transactions carried out on Ethereum are maintained here.
* As detailed below, much of the txn data stored in the Enclave is only visible to the users that initated those txns.
* Additionally, permissions have been built in for regulatory agencies to maintain oversight of activity within CoinStir in congruence with various anti-money laundering policies.
*/
contract StirEnclave is Enclave, accessControl {

/**
* @dev explicitly sets the starting balance of the entire contract to zero.
*/
    uint256 private contractBalance;

/**
* @dev explicitly sets the starting txn number to zero.
*/
    uint256 private txnNumber;

/**
* @dev explicitly sets the value of fees earned to zero.
*/
    uint256 public feeClaim;

/**
* @dev explicitly sets the amount of gas earned from meta-txn logic to zero.
*/
    uint256 public reclaimGas;

/**
* @dev sets the gas price charged on deposits including celer message bridge fee.
*/
    uint256 public depositGasPrice = 200000000000000;

/**
* @dev sets the Celer message fee for messages originating on Sapphire.
*/
    uint256 public celerFeeROSE = 200000000000000;

/**
* @dev placeholder for the address of the host counterpart of this contract.
*/
    address public stirHost;

/**
* @dev placeholder for the wallet where funds will be sent to upon admin claiming fees.
*/
    address public feeWallet;

/**
* @dev placeholder for the wallet where funds will be sent to upon admin claiming gas fees.
*/
    address public gasWallet;

/**
* @dev placeholder for the wallet that will act as the relayer.
*/
    address public relayer;

/**
* @notice metaTXN structure. This is used in packaging of meta-txns related to txns defined by users to send or receive funds.
* @param _payload is the value in Ethere.
* @param _dest is the destination wallet address.
* @param _signature is the signature generated from the front-end.
* @param nonce ensures signature can be used only once for a given operation.
*/
    struct metaTXN {
        uint256 _payload;
        address _dest;
        bytes _signature;
        uint256 nonce;
    }

/**
* @notice TXN structure. Every txn results in a TXN being created and includes all of the relevant information detailed below.
* @param blocknum is the block number the txn got submitted in.
* @param recipient is the destination of the assets.
* @param sendingWallet is the wallet that initated the txn.
* @param amount is the payload in ETH.
* @param fee is the amount charged for the TXN by CoinStir, charged to the initiating account.
* @param availBal is the remaining balance held by the initiator of the txn.
*/
    struct TXN {
        uint256 blocknum;
        address recipient;
        address sendingWallet;
        uint256 amount;
        uint256 fee;
        uint256 availBal;
    }

/**
* @dev maps the amount in Ether held by a specific user.
*/
    mapping (address => uint256) private userBalance;

/**
* @dev maps the TXN struct to a number. This is how TXNs are organized. A given number references all of the data within that TXN struct.
*/
    mapping (uint256 => TXN) private TXNno;

/**
* @dev maps the users wallet address to an array of numbers corresponding to that addresses TXN structs. This lists out an user's TXN's.
* @notice any sending wallet ia credited with the txn number for future reference.
* @notice any receiving wallet of an internalTxn also gets credited with a txn number to log the receipt of funds within CoinStir.
*/
    mapping (address => uint256[]) private userTxns;

/**
* @dev logic for blocking wallets deemed by regulatory agencies as 'high-risk'.
* @notice even if on the blockedList, a wallet can always withdraw its own funds from CoinStir, even if blocked from sending funds to other accounts.
*/
    mapping (address => bool) public blockedList; 

/**
* @dev sets the address for the Host side of CoinStir, ensures correct chain, sets an endpoint, and assigns critical permissions and supporting addresses. 
* @param _stirHost only messages received from the entered address will be acted upon by this contract.
* @notice the autoswitch functionality ensures the contract is on mainnet or testnet and is congruent with the settings of the Host contract.
* @notice the address of the Host is stored for various logic below.
* @notice adminStatus of a specified wallet is set, this address should be updated at the time of deploying.
* @notice relayerStatus of a specified wallet is set, this address should be updated at the time of deploying.
* @notice a feeWallet is set, providing a destination for fees accrued by the service to be sent. This address should be updated at the time of deploying.
* @notice a gasWallet is set, providing a destination for gas fees accrued by the service to be sent. This address should be updated at the time of deploying.
*/
    constructor(address _stirHost) Enclave(_stirHost, "bsc-testnet") {
        registerEndpoint("trackDeposit", _trackDeposit);
        stirHost = _stirHost;
        adminStatus[msg.sender] = true;
        relayerStatus[0x365232724539ecc206B4E840e21102107BCB7133] = true;
        feeWallet = 0x57a48723Bcb08B0C48dd42c531D9C4BbF50b373e;
        gasWallet = 0x365232724539ecc206B4E840e21102107BCB7133;
    }

////////////////////////////////////////////////// - TRANSACTIONAL - //////////////////////////////////////////////////

/**
* @dev creates a meta-txn in the correct format for a txn to be created and executed by the relayer.
* @param _metaTxn includes the payload, destination and signature data necessary to execute the txn.
* @notice nonce ensures signature can be used only once for a given operation.
* @return data in the proper format for the relayer to initate a txn per specs issued by the user.
*/
    function createmetaTXN(metaTXN calldata _metaTxn) external pure returns (bytes memory) {
        return (abi.encode(
            _metaTxn._payload,
            _metaTxn._dest,
            _metaTxn._signature,
            _metaTxn.nonce
        ));
    }

/**
* @dev accepts info from the relayer to verify if a proposed txn will succeed, provides failure reason if not. This is to prevent relayer abuse.
* @param signedMsg is the return data from 'createMetaTxnAddr'
* @param val is the value in Ether of the txn.
* @param gasPrice is the amount charged by CoinStir to actually execute the meta-txn the user signed. This prevents the user from needing to buy the $ROSE token, but still charges them for CoinStir's use of the token.
* @param feeRate is the amount charged by CoinStir for the services provided.
* @param isInternal states if the txn being checked will incur Celer message fees or not.
* @notice nonce ensures signature can be used only once for a given operation.
* @notice users must have enough funds deposited into CoinStir to cover the (payload + gas fee + the fee rate) for this function. Front-end should run similar checks for quality of UX.
* @notice if the sending wallet is on the blocked list AND they are attempting to send funds to a different wallet, an error will throw. Users can always withdraw their own funds, but may be prevented from creating txns.
*/
    function validateTrackTxn(bytes memory signedMsg, string memory val, uint256 gasPrice, uint256 feeRate, bool isInternal) external view returns (bool success, string memory reason) {
        (uint256 payload, address recipient, bytes memory signature, uint256 nonce) = abi.decode(signedMsg, (uint256, address, bytes, uint256));
            address sender = txn712Lib(recipient, val, signature, nonce);
            if (blockedList[sender] == true && recipient != sender) {
                return (false, "blocked sender");
            } else {
                if (nonce != userTxns[sender].length) {
                    return (false, "bad sig");
                }
           uint256 fee = ((payload*feeRate)/1000);
               if (recipient == sender) {
                   fee = 0;
               }
            uint256 adjustedPayload = (payload + fee + gasPrice);
                if (isInternal == false) {  // External transactions need celer fee
                    adjustedPayload += celerFeeROSE;
                }
                    if (userBalance[sender] < adjustedPayload) {
                        return (false, "insufficient funds");
                    }
                }
            return (true, "");
    }

/**
* @dev accepts info from the relayer to initiate a txn on behalf of the user.
* @param signedMsg is the return data from 'createMetaTxnAddr'
* @param val is the value in Ether of the txn.
* @param gasPrice is the amount charged by CoinStir to actually execute the meta-txn the user signed. This prevents the user from needing to buy the $ROSE token, but still charges them for CoinStir's use of the token.
* @param feeRate is the amount charged by CoinStir for the services provided.
* @notice nonce ensures signature can be used only once for a given operation.
* @notice users must have enough funds deposited into CoinStir to cover the (payload + gas fee + the fee rate) for this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
* @notice if the sending wallet is on the blocked list AND they are attempting to send funds to a different wallet, an error will throw. Users can always withdraw their own funds, but may be prevented from creating txns.
*/
    function _trackTxn(bytes memory signedMsg, string memory val, uint256 gasPrice, uint256 feeRate) external payable onlyRelayer {
        (uint256 payload, address recipient, bytes memory signature, uint256 nonce) = abi.decode(signedMsg, (uint256, address, bytes, uint256));
            address sender = txn712Lib(recipient, val, signature, nonce);
            if (blockedList[sender] == true && recipient != sender) {
                revert("blocked sender");
            } else {
                require(nonce == userTxns[sender].length, "bad sig");
                uint256 fee = ((payload*feeRate)/1000);
                    if (recipient == sender) {
                        fee = 0;
                    }
                    feeClaim += fee;
                uint256 adjustedPayload = (payload + fee + gasPrice + celerFeeROSE);
                require(userBalance[sender] >= adjustedPayload, "insufficient funds");
                    userBalance[sender] -= adjustedPayload;
                    record(sender, recipient, payload, fee, sender);
                    contractBalance -= payload;
                    postMessage("executeTxn", abi.encode(recipient, payload));
                    reclaimGas += gasPrice;
            }
    }

    /**
* @dev Allows users to directly withdraw funds, bypassing the CoinStir relayer. This is not a private txn, but ensures users can always access their funds.
* @param signedMsg is the return data from 'createMetaTxnAddr'
* @param val is the value in Ether of the txn.
* @param gasPrice is the amount charged by CoinStir to actually execute the meta-txn the user signed. This prevents the user from needing to buy the $ROSE token, but still charges them for CoinStir's use of the token.
* @notice nonce ensures signature can be used only once for a given operation.
* @notice users must have enough funds deposited into CoinStir to cover the (payload + gas fee) for this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
*/
    function withdraw(bytes memory signedMsg, string memory val, uint256 gasPrice) external payable {
        (uint256 payload, address recipient, bytes memory signature, uint256 nonce) = abi.decode(signedMsg, (uint256, address, bytes, uint256));
            address sender = txn712Lib(recipient, val, signature, nonce);
                require(nonce == userTxns[sender].length, "bad sig");
                uint256 adjustedPayload = (payload + gasPrice + celerFeeROSE);
                require(userBalance[sender] >= adjustedPayload, "insufficient funds");
                    userBalance[sender] -= adjustedPayload;
                    record(sender, recipient, payload, 0, sender);
                    contractBalance -= payload;
                    postMessage("executeTxn", abi.encode(recipient, payload));
                    reclaimGas += gasPrice;
            }

    /**
* @dev Allows users to send funds between other users without actually settling on Ethereum. This type of txn only updates balances without transmitting funds on the L1 for additional privacy, time and gas savings.
* @param signedMsg is the return data from 'createMetaTxnAddr'
* @param val is the value in Ether of the txn.
* @param gasPrice is the amount charged by CoinStir to actually execute the meta-txn the user signed. This prevents the user from needing to buy the $ROSE token, but still charges them for CoinStir's use of the token.
* @param feeRate is the amount charged by CoinStir for the services provided.
* @notice nonce ensures signature can be used only once for a given operation.
* @notice users must have enough funds deposited into CoinStir to cover the (payload + gas fee) for this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
*/
    function internalTxn(bytes memory signedMsg, string memory val, uint256 gasPrice, uint256 feeRate) external onlyRelayer {
        (uint256 payload, address recipient, bytes memory signature, uint256 nonce) = abi.decode(signedMsg, (uint256, address, bytes, uint256));
            address sender = txn712Lib(recipient, val, signature, nonce);
            if (blockedList[sender] == true && recipient != sender) {
                revert("blocked sender");
            } else {
                require(nonce == userTxns[sender].length, "bad sig");
                uint256 fee = ((payload*feeRate)/1000);
                    feeClaim += fee;
                uint256 adjustedPayload = (payload + fee + gasPrice);
                require(userBalance[sender] >= adjustedPayload, "insufficient funds");
                    userBalance[sender] -= adjustedPayload;
                    record(sender, recipient, payload, fee, sender);
                    userBalance[recipient] += payload;
                    record(sender, recipient, payload, 0, recipient);
                    reclaimGas += gasPrice;
            }
    }

/**
* @dev accepts the deposit message from the Host contract and updates the users account information.
* @param _args is the data included in the message created upon 'deposit' into the Host contract, and is delivered by the Celer IM Bridge.
* @return success if completed as expected, an indicator the Celer IM Bridge that the txn is complete.
*/
    function _trackDeposit(bytes calldata _args) internal returns (Result) {
        (address sender, uint256 payload) = abi.decode(_args, (address, uint256));
            userBalance[sender] += (payload - depositGasPrice);
            record(sender, stirHost, payload, 0, sender);
            contractBalance += payload;
        return (Result.Success);
    }

/**
* @dev Records the txn data.
* @param sender is who is sending the funds.
* @param recipient is who is recieving the funds.
* @param payload is the value of the txn.
* @param fee is the amount charged by CoinStir for the services provided.
* @notice This is to simplify repeate operations.
*/
    function record(address sender, address recipient, uint256 payload, uint256 fee, address viewWallet) private {
        txnNumber ++;
            TXN storage t = TXNno[txnNumber];
            t.blocknum = block.number;
            t.recipient = recipient;
            t.sendingWallet = sender;
            t.amount = payload;
            t.fee = fee;
            t.availBal = userBalance[viewWallet];
        userTxns[viewWallet].push(txnNumber);
    }

////////////////////////////////////////////////// - GETTERS - ///////////////////////////////////////////////////////////

/**
* @dev retrieves the TXN data for a specific range of TXNs for a specific user.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own.
* @param _msg used for EIP712 spec and sender address derivation.
* @param start is the starting point of users txn lookup.
* @param stop is the stopping point of users txn lookup.
* @notice deadline ensures signature can be used only once for a given time period.
* @notice a user can only pull up information from its own account due to signature verification.
* @return all TXN data for specified range of a specific wallet.
*/
    function recoverAddrTXNdata(bytes memory signedMsg, string memory _msg, uint256 deadline, uint256 start, uint256 stop) external view returns (TXN[] memory) {
        require(block.number <= (deadline + 600), "time expired");
        address recoveredAddress = use712Lib(_msg, deadline, signedMsg);
            uint256 iterations = stop - start;
                TXN[] memory txnData = new TXN[](iterations);
                for (uint256 i = 0; i < iterations; i++) {
                    uint256 current = userTxns[recoveredAddress][i + start];
                    txnData[i] = getTxnData(current);
                }
            return (txnData);
    }

/**
* @dev used internally by the above function 'recoverAddrTXNdata' to retrieve the actual TXN data.
* @param _TXNno pulls the TXN data by number that TXN is mapped to.
* @return the data for the TXN number requested.
*/
    function getTxnData(uint256 _TXNno) private view returns (TXN memory) {
        return TXNno[_TXNno];
    }

/**
* @dev extracts a users address from a signed message and determines the number of txns they have made and its current balance.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own.
* @param _msg used for EIP712 spec and sender address derivation.
* @param deadline ensures signature can be used only once for a given time period.
* @return users address, their number of TXNs made and the balance of their account.
*/
    function recoverAddressFromSignature(bytes memory signedMsg, string memory _msg, uint256 deadline) external view returns (address, uint256, uint256) {
        require(block.number <= (deadline + 600), "time expired");
        address recoveredAddress = use712Lib(_msg, deadline, signedMsg);
            uint256 txnCount = userTxns[recoveredAddress].length;
            uint256 bal = userBalance[recoveredAddress];
        return (recoveredAddress, txnCount, bal);
    }

////////////////////////////////////////////////// - AUTHORIZED ACCESS - ///////////////////////////////////////////////////////////

/**
* @dev retrieves the TXN data for a specific range of TXNs for a specific user for an authorized user only.
* @param signature generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own. In this case, proving the account has authStatus.
* @param _msg used for EIP712 spec and sender address derivation.
* @param start is the starting point of users txn lookup.
* @param stop is the stopping point of users txn lookup.
* @param deadline ensures signature can be used only once for a given time period.
* @notice this function is only available to users with authStatus of 'true' which would only be granted to a regulatory agency or government.
* @return all TXN data for specified range of a specific wallet.
*/
    function authGetTXNinfo(bytes memory signature, string memory _msg, address _addr, uint256 start, uint256 stop, uint256 deadline) external view returns (TXN[] memory) {
        address recoveredAddress = use712Lib(_msg, deadline, signature);
        require (authStatus[recoveredAddress] == true, "Invalid permissions");
        require(block.number <= (deadline + 600), "time expired");
            uint256 iterations = stop - start;
                TXN[] memory txnData = new TXN[](iterations);
                for (uint256 i = 0; i < iterations; i++) {
                    uint256 current = userTxns[_addr][i + start];
                    txnData[i] = getTxnData(current);
                }
            return (txnData);
    }

/**
* @dev retrieves the number of txns a specific account has made for an authorized user only.
* @param signature generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own. In this case, proving the account has authStatus.
* @param _msg used for EIP712 spec and sender address derivation.
* @param _addr is the specific address being referenced.
* @param deadline ensures signature can be used only once for a given time period.
* @notice this function is only available to users with authStatus of 'true' which would only be granted to a regulatory agency or government.
* @return number of txns made by a given account.
*/
    function authGetTxnList(bytes memory signature, string memory _msg, address _addr, uint256 deadline) external view returns (uint256) {
        address recoveredAddress = use712Lib(_msg, deadline, signature);
        require (authStatus[recoveredAddress] == true, "Invalid permissions");
        require(block.number <= (deadline + 600), "time expired");
            return userTxns[_addr].length;
    }

////////////////////////////////////////////////// - OWNER CONTROLS - //////////////////////////////////////////////////

/**
* @dev allows an admin to send the accrued gas fees to the specified wallet.
* @notice the gas fees accrued are reset to zero.
* @notice in the event sapphire adds a celer message fee, the value of the message passed to this function must be at least the value of any such fee. Currently the fee is zero.
*/
    function claimGas() external payable onlyAdmin {
        require (msg.value >= celerFeeROSE);
        uint256 _reclaimGas = reclaimGas;
        reclaimGas = 0;
        postMessage("executeTxn", abi.encode(gasWallet, _reclaimGas));
    }

/**
* @dev allows an admin to change the wallet gas fees are sent to.
*/
    function setGasWallet(address _gasWallet) external onlyAdmin {
        gasWallet = _gasWallet;
    }

/**
* @dev allows an admin to send the accrued service fees to the specified wallet.
* @notice the service fees accrued are reset to zero.
* @notice in the event sapphire adds a celer message fee, the value of the message passed to this function must be at least the value of any such fee. Currently the fee is zero.
*/
    function claimFee() external payable onlyAdmin {
        require (msg.value >= celerFeeROSE);
        uint256 _feeClaim = feeClaim;
        feeClaim = 0;
        postMessage("executeTxn", abi.encode(feeWallet, _feeClaim));
    }

/**
* @dev allows an admin to change the wallet service fees are sent to.
*/
    function setFeeWallet(address _feeWallet) external onlyAdmin {
        feeWallet = _feeWallet;
    }

/**
* @dev add or remove wallet addresses from the blockedList.
* @notice default is to NOT be on the blockedList.
*/
    function blockWallet(address[] calldata _badWallets) external onlyAdmin {
        for (uint256 i = 0; i < _badWallets.length; i++) {
            blockedList[_badWallets[i]] = !blockedList[_badWallets[i]];
        }
    }

/**
* @dev signature verification for all login/getter functions.
* @param deadline ensures signature can be used only once for a given time period.
*/
    function use712Lib(string memory note, uint256 deadline, bytes memory _signature) public view returns (address) {
        return VerifyTypedData.getSigner(note, deadline, _signature, address(this));
    }

/**
* @dev signature verification for all txn/approval functions.
* @param nonce ensures signature can be used for only one transaction.
*/
    function txn712Lib(address recipient, string memory value, bytes memory _signature, uint256 nonce) public view returns (address) {
        return VerifyTypedData.txnSigner(recipient, value, _signature, nonce, address(this));
    }
}
