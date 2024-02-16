The Host Contract is very simple. There are only 2 functions and the Constructor:

  1) Constructor
        - Points the Host Contract at the Enclave Contract to ensure only messages from the Enclave are acted upon. Additionally, the Constructor also creates the 'endpoint' that triggers the _executeTxn function.
     
  2) 'deposit'
        - Accepts any amount of Ether on behalf of the user, then creates a message to be passed to the Enclave by the Celer IM bridge. The message simply includes the amount and the depositing wallet address, and returns 'Success' if completed as expected. This function is marked external to allow for interaction by anyone outside of the contract itself. 
     
  3) '_executeTxn'
        - Recevies messages from only the Enclave Contract, extracting the recipiant and value from those messages, then executes transactions based on those instructions. 'Success' is returned if all goes as expected. This function is marked internal to ensure only a message initiated by the Enclave Contract can interact.




The Enclave Contract is much more robust than the Host Contract, and includes the following functions:

  1) 'createMetaTxnAddr'
        - Called by the user to approve a new address, accepts the input of the desired address.
        - Returns all txn data needed by the relayer, in the proper format.
        - The front-end then pings the relayer account to pass this txn data along.
        - EIP712/signature logic ensures only the user has access to their funds, and all transactions are explicitly signed for.
        - Marked 'external' as this is available to anyone except the contract itself.

  2) 'approveAddress'
        - An external function that can *only* be called by the relayer to prevent abuse.
        - Ensures that the sender of this transaction is its own origin address, preventing an approved address from approving another address directly.
        - Ensures the origin address has high enough balance to cover the gas costs of this txn.
        - Approves the address specified by the user in their call to 'createMetaTxnAddr' (above), and sets the sending address as its 'originAddress'.
        - A new txn is created, paying gas fees and updating the users balance.

  3) 'revokeAddress'
        - An external function that can *only* be called by the relayer to prevent abuse.
        - Does the exact opposite of 'approveAddress', removing permissions of the address input by the user.
        - Prior to execution, ensures the calling account has permission and gas fees to complete this transaction, and that the address in question actually was approved in the first place.
        - A new txn is created, paying gas fees and updating the users balance.

  4) 'createMetaTXN'
        - Called by the user to create a new txn, accepts the amount and destination as well as a signature generated for this specific txn.
        - Returns all relevant transaction data in the correct format for execution by the relayer. This includes the amount, destination and signature of the transaction.
        - The signature is used to extract the senders address and ensure the amount is not fabricated.

  5) '_trackTxn'
        - Available only to the relayer.
        - Called by the relayer automatically in the front-end following a users request.
        - The recipiant is checked to ensure funds are not deposited directly into the Enclave Contract via this function.
        - The sending address and value are extracted from the signature, ensuring the txn cannot be forged.
        - Checks are in place to ensure a blocked wallet address can still withdraw their funds, but cannot transfer them to others.
        - Users balance is adjusted according to value of the txn + fee + gas.
        - A new txn is created and logged, the number of the txn is mapped to the origin address, and the block number, recipiant, sender, amount, fee and available balance are all tracked.
        - A message is then created including the destination and value of the txn, and the Celer IM Bridge passes this to the Host Contract where the txn is executed.

  6) '_trackDeposit'
        - Marked 'internal' to ensure this function can only be called by the IM Bridge/endpoint logic.
        - Ensures the 0 address is not the caller.
        - The sender and value are tracked, updating the relevant account balance by the value specified.
        - If this is the first txn by an account that has not previously been approved by another account, then the depositing address is set as its own originAddress.
        - A new txn is created and logged, the number of the txn is mapped to the origin address, and the block number, recipiant, sender, amount, fee and available balance are all tracked.
        - Gas is charged and the reclaimGas variable is updated accordingly.

  7) 'recoverAddrTXNdata'
        - An external function that is intended to be used by the front-end when populating a users txn history.
        - Users are pinged with a signature request at the time of connecting to the front-end. That signature is passed along with a range of txn numbers into this function. All txns in that range are looped through, returning a block of data from multiple txns.
        - Returned data then populates a table for users to easily see their txn history.
        - Use of the 'login signature' ensures that users are only able to see their own history, preventing anyone else from gaining visibility.

  8) 'getTxnData'
        - A private function for use only by the 'recoverAddrTXNdata' function listed above. This function returns the specific data for a single txn.

  9) 'recoverAddressFromSignature'
        - An external function that is intended to be used by the front-end for determining the current users wallet address and the number of txns associated with that address.
        - The returned data is used by the front-end in a number of ways.
        - The signature argument is used to ensure that only the user can retrieve this info for their account, preventing anyone else from gaining visibility.

  10) 'getTxnCount'
        - A private function that is used by the above 'recoverAddressFromSignature' function to pull the specific number of txns by a given origin Address.
        - If the current account is not the origin, the origin txn count is still pulled and populated in the front-end.

  11) 'recoverAddrCheckBal'
        - An external function intended to be used by the front end for populating a users current balance.
        - The 'login signature' is accepted as an argument to ensure only the user is able to retrieve this info for their account.

  12) 'recoverOriginFromSignature'
        - An external function intended to be used by the front end for populating a users origin address.
        - Recovers the originAddress of a current user, returning it for use by the front end.

  13) 'approvalCheck'
        - Returns only the number of approved addresses tied to an originAddress.
        - Marked public for use by the contract or the front end (or anyone else).

  14) 'getApprovedAddr'
        - Returns the specific approved addresses for a specific originAddress.
        - Marked public for use by the contract or the front end (or anyone else).
        - Accepts the 'login signature' as an argument to ensure only the user is able to retrieve this info for their account.

  15) 'authGetTXNinfo'
        - Allows an authorized party such as a government or regulatory agency to pull txn data from any account.
        - Marked external for use outside of contract only.
        - Only previously approved addresses are able to use this function due to the 'authStatus' require statement.
        - Works just like 'getTxnData' above, however rather than only showing the users info, it allows for looking up any users info.
        - This is for compliance purposes and in an effort to prevent money laundering attempts.

  16) 'authGetTxnList'
        - Allows an authorized party such as a government or regulatory agency to pull txn data count for any account.
        - Marked external for use outside of contract only.
        - Only previously approved addresses are able to use this function due to the 'authStatus' require statement.
        - Works just like 'getTxnCount' above, however rather than only showing the users txn count, it allows for looking up any users txn count.
        - This is for compliance purposes and in an effort to prevent money laundering attempts.

  17) 'setDepositGasPrice'
        - Sets gas price for use throughout contract.
        - For use by admin Only (see onlyAdmin modifier).

  18) 'claimGas'
        - Transfers all gas accrued by above functions to the specified gasWallet.
        - For use by admin Only (see onlyAdmin modifier).
        - Creates a message to be sent to the Host Contract via the Celer IM Bridge including the gasWallet address and the total 'reclaimGas' (value) to be sent.
        - This is how the protocol reclaims gas it has fronted via the relayer.

  19) 'setGasWallet'
        - Updates the wallet that the above 'claimGas' function pays out to.
        - For use by admin Only (see onlyAdmin modifier).

  20) 'claimFee'
        - Transfers all fees accrued by above functions to the specified feeWallet.
        - For use by admin Only (see onlyAdmin modifier).
        - Creates a message to be sent to the Host Contract via the Celer IM Bridge including the feeWallet address and the total 'claimFee' (value) to be sent.
        - This is how the protocol claims fees it has earned via the service.

  21) 'setFeeWallet'
        - Updates the wallet that the above 'claimFee' function pays out to.
        - For use by admin Only (see onlyAdmin modifier).

  23) 'blockWallet'
        - Allows for the blocking of specific wallet addresses in the event a regulatory agency or government deems a specific wallet to be laundering money or in some other way outside the law.
        - For use by admin Only (see onlyAdmin modifier).
        - Blocked wallets can still deposit/withdraw, but they cannot under any circumstances complete an actual transfer of funds. This ensures CoinStir does not have the ability to sieze any users funds, but the ability to send private transactions can be revoked.
