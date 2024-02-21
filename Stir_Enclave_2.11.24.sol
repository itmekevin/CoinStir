//SPDX-License-Identifier: MIT

pragma solidity 0.8.22;

import {Enclave, Result, autoswitch} from "@oasisprotocol/sapphire-contracts/contracts/OPL.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "contracts/accessControl.sol";
import "contracts/EIP712Signer.sol";

/**
* @title coinStirEnclave
* @dev coinStirEnclave acts as the data-storage half of a larger application used to obfuscate txn history and user account balance from the public eye.
* This half exists on the Oasis Network's Sapphire Paratime, while the other half exsits on Ethereum where all funds are actually transacted.
* No funds are transacted in this contract, only information about the transactions carried out on Ethereum are maintained here.
* As detailed below, much of the txn data stored in the Enclave is only visible to the users that initated those txns.
* Additionally, permissions have been built in for regulatory agencies to maintain oversight of activity within CoinStir in congruence with various anti-money laundering policies.
*/
contract coinStirEnclave is Enclave, accessControl, VerifyTypedData {

/**
* @dev explicitly sets the starting balance of the entire contract to zero.
*/
    uint256 private contractBalance = 0;

/**
* @dev explicitly sets the starting txn number to zero.
*/
    uint256 private txnNumber = 0;

/**
* @dev explicitly sets the value of fees earned to zero.
*/
    uint256 public feeClaim = 0;

/**
* @dev explicitly sets the amount of gas earned from meta-txn logic to zero.
*/
    uint256 public reclaimGas = 0;

/**
* @dev sets the gas price charged on deposits.
*/
    uint256 public depositGasPrice = 2000000000000000;

/**
* @dev placeholder for the address of the host counterpart of this contract.
*/
    address public coinStir;

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
* @notice metaddr structure. This is used in packaging of meta-txns related to address approvals and revocation of address approvals.
* @param _walletB is the wallet that will have permission granted or revoked.
*/
    struct metaddr {
        address _walletB;
        bytes _signature;
    }

/**
* @notice metaTXN structure. This is used in packaging of meta-txns related to txns defined by users to send or receive funds.
* @param _payload is the value in Ethere.
* @param _dest is the destination wallet address.
* @param _signature is the signature generated from the front-end.
*/
    struct metaTXN {
        uint256 _payload;
        address _dest;
        bytes _signature;
    }

/**
* @notice TXN structure. Every txn results in a TXN being created and includes all of the relevant information detailed below.
* @param blocknum is the block number the txn got submitted in.
* @param recipiant is the destination of the assets.
* @param sendingWallet is the wallet that initated the txn.
* @param amount is the payload in ETH.
* @param fee is the amount charged for the TXN by CoinStir, charged to the initiating account.
* @param availBal is the remaining balance held by the initiator of the txn.
*/
    struct TXN {
        uint256 blocknum;
        address recipiant;
        address sendingWallet;
        uint256 amount;
        uint256 fee;
        uint256 availBal;
    }

/**
* @dev maps the amount in Ether held by a speecific user.
*/
    mapping (address => uint256) private userBalance;

/**
* @dev maps any address to the original address that holds the ultimate permission for a given wallet.
* @notice a wallet that has never interacted with CoinStir becomes its own originAddress. Any wallets that become linked via approvals to this originAddress get mapped back to that originAddress.
* @notice when a wallet that is already mapped to an originAddress makes a deposit, the originAddress is credited with those funds even though.
* The 'wallet B' that is tied to the originAddress has access to them unless approval is revoked by the originAddress.
* @notice a wallet B cannot approve or revoke other wallets. Only an originAddress can do so for its own 'web' of wallets.
* @notice multiple wallets can be tied back to a single originAddress creating a web of wallets that can be used as burners, ways to recieve funds without giving up a users originAddress, or organization purposes within the app.
*/
    mapping (address => address) private originAddress;

/**
* @dev maps the TXN struct to a number. This is how TXNs are organized. A given number references all of the data within that TXN struct.
*/
    mapping (uint256 => TXN) private TXNno;

/**
* @dev maps an originAddress (described above) to an array of numbers corresponding to that addresses TXN structs. This lists out an originAddress's TXN's.
* @notice regardless of if an originAddress or one of its approved wallets (wallet B's), the originAddress is credited with the TXN number.
* @notice the wallet B's origintxns are irrelevant from a back-end perspective because the originAddress is always queried.
* @notice the wallet B's origintxns can become relevant for organizational purposes in the front-end.
*/
    mapping (address => uint256[]) private origintxns;

/**
* @dev maps one originAddress to any of its approved wallets (wallet B's).
*/
    mapping (address => address[]) private approvedAddress;

/**
* @dev logic for blocking wallets deemed by regulatory agencies as 'high-risk'.
* @notice even if on the blockedList, a wallet can always withdraw its own funds from CoinStir, even if blocked from sending funds to other accounts.
*/
    mapping (address => bool) public blockedList; 

/**
* @dev sets the address for the Host side of CoinStir, ensures correct chain, sets an endpoint, and assigns critical permissions and supporting addresses. 
* @param stirHost only messages received from the entered address will be acted upon by this contract.
* @notice the autoswitch functionality ensures the contract is on mainnet or testnet and is congruent with the settings of the Host contract.
* @notice the address of the Host is stored for various logic below.
* @notice adminStatus of a specified wallet is set, this address should be updated at the time of deploying.
* @notice relayerStatus of a specified wallet is set, this address should be updated at the time of deploying.
* @notice a feeWallet is set, providing a destination for fees accrued by the service to be sent. This address should be updated at the time of deploying.
* @notice a gasWallet is set, providing a destination for gas fees accrued by the service to be sent. This address should be updated at the time of deploying.
*/
    constructor(address stirHost) Enclave(stirHost, autoswitch("ethereum")) {
        registerEndpoint("trackDeposit", _trackDeposit);
        coinStir = stirHost;
        adminStatus[0x0D78a2d04B925f50Ee233735b60C862357492D2d] = true; // UPDATE
        relayerStatus[0xF30CcB655090a190178D75bdFC8203eb826Ab066] = true; // UPDATE
        feeWallet = 0x0D78a2d04B925f50Ee233735b60C862357492D2d; // UPDATE
        gasWallet = 0xF30CcB655090a190178D75bdFC8203eb826Ab066; //UPDATE
    }


////////////////////////////////////////////////// - WALLET APPROVALS - //////////////////////////////////////////////////

/**
* @dev creates a meta-txn in the correct format for approval of a wallet to be granted or revoked.
* @param _metaddr includes the wallet B and signature data necessary to execute the granting or revocation of approval on the users behalf.
* @return data in the proper format for the relayer to initate granting or revocation of approval for a specified wallet.
*/
    function createMetaTxnAddr(metaddr calldata _metaddr) external pure returns (bytes memory) {
        return (abi.encode(
            _metaddr._walletB,
            _metaddr._signature
        ));
    }

/**
* @dev accepts info from the relayer to approve the address dictated by a user in the above meta-txn
* @param signedMsg is the return data from 'createMetaTxnAddr'
* @param value is always zero in this case, but allows access to the function 'txnSigner' which allows the sending wallet address to be derived and ensures a user can only implement this function on themselves.
* @param gasPrice is the amount charged by CoinStir to actually execute the meta-txn the user signed. This prevents the user from needing to buy the $ROSE token, but still charges them for CoinStir's use of the token.
* @notice users must have created the meta-txn with their originAddress to utilize this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
* @notice users must have enough funds deposited into CoinStir to cover the gas fee for this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
* @return success if completed as expected, an indicator the Celer IM Bridge that the txn is complete.
*/
    function approveAddress(bytes memory signedMsg, string memory value, uint256 gasPrice) external onlyRelayer returns (Result) {
        (address _walletB, bytes memory signature) = abi.decode(signedMsg, (address, bytes));
        address sender = txnSigner(_walletB, value, signature);
                require (sender == originAddress[sender], "must use origin address");
                require (userBalance[sender] > gasPrice, "insufficient balance");
                    userBalance[sender] -= gasPrice;
                    approvedAddress[sender].push(_walletB);
                    originAddress[_walletB] = sender;
                    txnNumber ++;
                        TXN storage t = TXNno[txnNumber];
                        t.blocknum = block.number;
                        t.recipiant = _walletB;
                        t.sendingWallet = sender;
                        t.amount = 0;
                        t.fee = 0;
                        t.availBal = userBalance[sender];
                    origintxns[sender].push(txnNumber);
                    reclaimGas += gasPrice;
                    return (Result.Success);
    }

/**
* @dev accepts info from the relayer to revoke approval of the address dictated by a user in the above meta-txn
* @param signedMsg is the return data from 'createMetaTxnAddr'
* @param value is always zero in this case, but allows access to the function 'txnSigner' which allows the sending wallet address to be derived and ensures a user can only implement this function on themselves.
* @param gasPrice is the amount charged by CoinStir to actually execute the meta-txn the user signed. This prevents the user from needing to buy the $ROSE token, but still charges them for CoinStir's use of the token.
* @notice users must have created the meta-txn with their originAddress to utilize this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
* @notice users must have enough funds deposited into CoinStir to cover the gas fee for this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
* @return success if completed as expected, an indicator the Celer IM Bridge that the txn is complete.
*/
    function revokeAddress(bytes memory signedMsg, string memory value, uint256 gasPrice) external onlyRelayer returns (Result) {
        (address _walletB, bytes memory signature) = abi.decode(signedMsg, (address, bytes));
        address sender = txnSigner(_walletB, value, signature);
                require (sender == originAddress[sender], "must use origin address");
                require (userBalance[sender] > gasPrice, "insufficient balance");
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
                        t.blocknum = block.number;
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
/**
* @dev creates a meta-txn in the correct format for a txn to be created and executed by the relayer.
* @param _metaTxn includes the payload, destination and signature data necessary to execute the txn.
* @return data in the proper format for the relayer to initate a txn per specs issued by the user.
*/
    function createmetaTXN(metaTXN calldata _metaTxn) external pure returns (bytes memory) {
        return (abi.encode(
            _metaTxn._payload,
            _metaTxn._dest,
            _metaTxn._signature
        ));
    }

/**
* @dev accepts info from the relayer to initiate a txn on behalf of the user.
* @param signedMsg is the return data from 'createMetaTxnAddr'
* @param value is the value in Ether of the txn.
* @param gasPrice is the amount charged by CoinStir to actually execute the meta-txn the user signed. This prevents the user from needing to buy the $ROSE token, but still charges them for CoinStir's use of the token.
* @param feeRate is the amount charged by CoinStir for the services provided.
* @notice users must have enough funds deposited into CoinStir to cover the (payload + gas fee + the fee rate) for this function. Checks exist in the front-end to prevent the signing of the meta-txn as well.
* @notice if the sending wallet is on the blocked list AND they are attempting to send funds to a different wallet, an error will throw. Users can always withdraw their own funds, but may be prevented from creating txns.
* @return success if completed as expected, an indicator the Celer IM Bridge that the txn is complete.
*/
    function _trackTxn(bytes memory signedMsg, string memory val, uint256 gasPrice, uint256 feeRate) external onlyRelayer returns (Result) {
        (uint256 payload, address recipiant, bytes memory signature) = abi.decode(signedMsg, (uint256, address, bytes));
            require(recipiant != address(this), "invalid recipiant");
            address sender = txnSigner(recipiant, val, signature);
            if (blockedList[sender] == true && recipiant != sender) {
                return (Result.PermanentFailure);
            } else {
                address _originAddr = originAddress[sender];
                uint256 fee = ((payload/1000)*feeRate);
                    if (recipiant == _originAddr) {
                        fee = 0;
                    }
                    feeClaim += fee;
                uint256 adjustedPayload = (payload + fee + gasPrice);
                require(userBalance[_originAddr] >= adjustedPayload, "insufficient funds");
                require(contractBalance >= adjustedPayload, "insufficient contract balance"); 
                    userBalance[_originAddr] -= adjustedPayload;
                    txnNumber ++;
                        TXN storage t = TXNno[txnNumber];
                        t.blocknum = block.number;
                        t.recipiant = recipiant;
                        t.sendingWallet = sender;
                        t.amount = payload;
                        t.fee = fee;
                        t.availBal = userBalance[_originAddr];
                    origintxns[_originAddr].push(txnNumber);
                    contractBalance -= payload;
                    postMessage("executeTxn", abi.encode(recipiant, payload));
                    reclaimGas += gasPrice;
                return (Result.Success);
            }
    }

/**
* @dev accepts the deposit message from the Host contract and updates the users account information.
* @param _args is the data included in the message created upon 'deposit' into the Host contract, and is delivered by the Celer IM Bridge.
* @notice the sending wallet is checked for its originAddress, if there is none, its originAddress is set as itself. If one already exists, the txn is credited against its originAddress.
* @return success if completed as expected, an indicator the Celer IM Bridge that the txn is complete.
*/
    function _trackDeposit(bytes calldata _args) internal returns (Result) {
        (address sender, uint256 payload) = abi.decode(_args, (address, uint256));
        if (originAddress[sender] == address(0)) {
            originAddress[sender] = sender;
        }
            address OG = originAddress[sender];
            userBalance[OG] += (payload - depositGasPrice);
            txnNumber ++;
                TXN storage t = TXNno[txnNumber];
                t.blocknum = block.number;
                t.recipiant = coinStir;
                t.sendingWallet = sender;
                t.amount = payload;
                t.fee = 0;
                t.availBal = userBalance[OG];
            origintxns[OG].push(txnNumber);
            contractBalance += payload;
            reclaimGas += depositGasPrice;
        return (Result.Success);
    }

////////////////////////////////////////////////// - GETTERS - ///////////////////////////////////////////////////////////

/**
* @dev retrieves the TXN data for a specific range of TXNs for a specific user.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own.
* @param _msg used for EIP712 spec and sender address derivation.
* @param start is the starting point of users txn lookup.
* @param stop is the stopping point of users txn lookup.
* @notice a user can only pull up information from its own account due to signature verification.
* @return all TXN data for specified range of a specific wallet.
*/
    function recoverAddrTXNdata(bytes memory signedMsg, string memory _msg, uint256 start, uint256 stop) external view returns (TXN[] memory) {
        address recoveredAddress = getSigner(_msg, signedMsg);
        address _addr = originAddress[recoveredAddress];
            uint256 iterations = stop - start;
                TXN[] memory txnData = new TXN[](iterations);
                for (uint256 i = 0; i < iterations; i++) {
                    uint256 current = origintxns[_addr][i + start];
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
* @dev extracts a users address from a signed message and determines the number of txns they have made.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own.
* @param _msg used for EIP712 spec and sender address derivation.
* @return users address and their number of TXNs made.
*/
    function recoverAddressFromSignature(bytes memory signedMsg, string memory _msg) external view returns (address, uint256) {
        address recoveredAddress = getSigner(_msg, signedMsg);
            address _addr = originAddress[recoveredAddress];
            uint256 txnCount = getTxnCount(_addr);
        return (recoveredAddress, txnCount);
    }

/**
* @dev internal function called by 'recoverAddressFromSignature' above to determine the number of txns incurred by a specific address.
* @return number of txns made by an address.
*/
    function getTxnCount(address _addr) private view returns (uint256) {
        return origintxns[_addr].length;
    }

/**
* @dev gets balance of a wallets originAddress
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own.
* @param _msg used for EIP712 spec and sender address derivation.
* @notice the originAddress balance is available to all accounts in the 'web' of approved accounts, any funds deposited by any account in the web updates this value.
* @return account balance of the users originAddress.
*/
    function recoverAddrCheckBal(bytes memory signature, string memory _msg) external view returns (uint256) {
        address recoveredAddress = getSigner(_msg, signature);
            address _addr = originAddress[recoveredAddress];
            uint256 bal = userBalance[_addr];
        return (bal);
    }

/**
* @dev gets a users originAddress from their signature.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own.
* @param _msg used for EIP712 spec and sender address derivation.
* @return originAddress for a users current wallet.
*/
    function recoverOriginFromSignature(bytes memory signature, string memory _msg) external view returns (address) {
        address recoveredAddress = getSigner(_msg, signature);
            address _addr = originAddress[recoveredAddress];
        return (_addr);
    }

/**
* @dev gets the number of approved wallets for a users originAddress.
* @param addr is the address for which the number of approved wallets should be looked up.
* @return number of wallets in a users web of wallets.
*/
    function approvalCheck(address addr) public view returns (uint256) {
        return approvedAddress[addr].length;
    }

/**
* @dev gets a specific approved wallet for a users originAddress in a specific index slot.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own.
* @param _msg used for EIP712 spec and sender address derivation.
* @param index is the slot number in the array of wallets to be returned.
* @return wallet address in the specific slot number of approved wallets for the originAddress.
*/
    function getApprovedAddr(bytes memory signature, string memory _msg, uint256 index) public view returns (address) {
        address recoveredAddress = getSigner(_msg, signature);
            return approvedAddress[recoveredAddress][index];
    }

////////////////////////////////////////////////// - AUTHORIZED ACCESS - ///////////////////////////////////////////////////////////

/**
* @dev retrieves the TXN data for a specific range of TXNs for a specific user for an authorized user only.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own. In this case, proving the account has authStatus.
* @param _msg used for EIP712 spec and sender address derivation.
* @param start is the starting point of users txn lookup.
* @param stop is the stopping point of users txn lookup.
* @notice this function is only available to users with authStatus of 'true' which would only be granted to a regulatory agency or government.
* @return all TXN data for specified range of a specific wallet.
*/
    function authGetTXNinfo(bytes memory signature, string memory _msg, address _addr, uint256 start, uint256 stop) external view returns (TXN[] memory) {
        address recoveredAddress = getSigner(_msg, signature);
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

/**
* @dev retrieves the number of txns a specific account has made for an authorized user only.
* @param signedMsg generated from front-end and used to derive callers wallet address while preventing other addresses from retrieving information on accounts not their own. In this case, proving the account has authStatus.
* @param _msg used for EIP712 spec and sender address derivation.
* @param _addr is the specific address being referenced
* @notice this function is only available to users with authStatus of 'true' which would only be granted to a regulatory agency or government.
* @return all TXN data for specified range of a specific wallet.
*/
    function authGetTxnList(bytes memory signature, string memory _msg, address _addr) external view returns (uint256) {
        address recoveredAddress = getSigner(_msg, signature);
        require (authStatus[recoveredAddress] == true, "User is not permissioned");
        address addr = originAddress[_addr];
            return origintxns[addr].length;
    }

////////////////////////////////////////////////// - OWNER CONTROLS - //////////////////////////////////////////////////

/**
* @dev sets the gas price on deposits
*/
    function setDepositGasPrice(uint256 _depositGasPrice) external onlyAdmin {
        depositGasPrice = _depositGasPrice;
    }

/**
* @dev allows an admin to send the accrued gas fees to the specified wallet.
* @notice the gas fees accrued are reset to zero.
*/
    function claimGas() external onlyAdmin {
        postMessage("executeTxn", abi.encode(gasWallet, reclaimGas));
        reclaimGas = 0;
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
*/
    function claimFee() external onlyAdmin {
        postMessage("executeTxn", abi.encode(feeWallet, feeClaim));
        feeClaim = 0;
    }

/**
* @dev allows an admin to change the wallet service fees are sent to.
*/
    function setFeeWallet(address _feeWallet) external onlyAdmin {
        feeWallet = _feeWallet;
    }

/**
* @dev add or remove a wallet address from the blockedList.
* @notice default is to NOT be on the blockedList.
*/
    function blockWallet(address _badWallet) external onlyAdmin {
        blockedList[_badWallet] = !blockedList[_badWallet];
    }

}
