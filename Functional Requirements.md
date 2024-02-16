The Host Contract
The Host Contract is very simple. There are only 2 functions and the Constructor:

  1) Constructor
        - Points the Host Contract at the Enclave Contract to ensure only messages from the Enclave are acted upon. Additionally, the Constructor also creates the 'endpoint' that triggers the _executeTxn function.
     
  2) 'deposit'
        - Accepts any amount of Ether on behalf of the user, then creates a message to be passed to the Enclave by the Celer IM bridge. The message simply includes the amount and the depositing wallet address, and returns 'Success' if completed as expected. This function is marked external to allow for interaction by anyone outside of the contract itself. 
     
  3) '_executeTxn'
        - Recevies messages from only the Enclave Contract, extracting the recipiant and value from those messages, then executes transactions based on those instructions. 'Success' is returned if all goes as expected. This function is marked internal to ensure only a message initiated by the Enclave Contract can interact.


The Enclave Contract
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
        - For calling by the user, returns all relevant transaction data in the correct format for execution by the relayer. This includes the amount, destination and signature of the transaction.

  5) '_trackTxn'
        - Available only to the relayer, _trackTxn is called by the relayer automatically in the front-end following a users request. First the recipiant is checked to ensure funds are not deposited into the Enclave Contract via txn, then the signature is validated and the sending address extracted. 

  6) '_trackDeposit'
        -

  7) 'recoverAddrTXNdata'
        -

  8) 'getTxnData'
        -

  9) 'recoverAddressFromSignature'
        -

  10) 'getTxnCount'
        -

  11) 'recoverAddrCheckBal'
        -

  12) 'recoverOriginFromSignature'
        -

  13) 'approvalCheck'
        -

  14) 'getApprovedAddr'
        -

  15) 'authGetTXNinfo'
        -

  16) 'authGetTxnList'
        -

  17) 'setDepositGasPrice'
        -

  18) 'claimGas'
        -

  19) 'setGasWallet'
        -

  20) 'claimFee'
        -

  21) 'setFeeWallet'
        -

  23) 'blockWallet'
        -
