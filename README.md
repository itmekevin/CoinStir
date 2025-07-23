# CoinStir
Overview:

CoinStir is a privacy enabling app that allows users to send ETH and, in the future, ERC20 tokens to other wallets without recipiants being able to see the senders address. Financial privacy is instrumental in a multide of business and personal relationships, and while the open nature of the blockchain is often superior, there are instances in which privacy remains critical.

There are 2 halves to CoinStir that work together in order to achieve this:
- The 'Host' contract which exists on Ethereum and handles the receipt and dispersement of funds - nothing else. While these events are public on the blockchain, the Host contract does not track any information whatsoever.
- The 'Enclave' contract exists on the Sapphire paratime of the Oasis Network. The Enclave keeps the entirety of the contract's state. Account balances and transactions are managed by the Enclave, which must dictate action to the Host contract via a message bridge for a txn to occur.

The Sapphire paratime is a privacy enabled blockchain with all computation and private contract state managed within a TEE (Trusted Execution Environment) which ensures state cannot be queried by anyone not explicitly permissioned to view the relevant information. By extracting the contract's state and maintaining it off of the public ledger of Ethereum, privacy can be granted while still allowing many of the other benefits found on the Ethereum Network.


Logic Flow:

Funds are deposited into the Host contract by the user, which triggers a message to the Enclave contract including details of the transaction. The user can then interact with an on-chain relayer through the front end or directly to create meta-txns that get submitted by the relayer, keeping the wallet that initiated the txn private. Txns can be made in 2 different ways, internally and externally. Internal transactions are contained entirely within the CoinStir Enclave, and no funds are moved on ETH making them faster and cheaper. External transactions trigger funds to be distributed on Ethereum, meaning they will be directly accessible to the receiving wallet, though it will take slightly longer and be more gas intensive.

Deposits:

When a user creates a deposit on Ethereum, a message is triggered to be passed from the Host contract to the Enclave contract via Celer's IM bridge inclucding the amount and sender of the txn.
The Enclave contract receives this message and logs details of the txn, as well as updates the total account balance. TXN's are stored as structs mapped to a number and their initiating wallet for referencing later. The struct stores the blocknumber, recipiant, sender, amount, fee and the users available balance for all transactions.

Transactions:

A user creates a meta-txn that is passed to and executed by a relayer on Sapphire, including the value, destination and a signature. Upon execution of this meta-txn, a message gets sent from the Enclave to the Host contract dictating where to send funds, and the state is updated in the Enclave. The user is charged both a 1% fee of the amount transferred, as well as the gas spent by the relayer on Sapphire and Host contract on ETH.

Withdraws:

A user may initiate a withdraw in the same way a transaction is initiated, however the recipiant is themself. No 1% fee is charged on withdrawals, only gas used in the operation. There is an emergency withdraw function built-in that bypasses the relayer entirely, compromising privacy but ensuring users are able to access their funds in the event of a relayer issue.

Oversight:

In an effort to prevent money laundering, there is the ability for oversight organizations to be granted access to review all history for any wallet. This grants the ability to "look behind the curtain" of the app for permissioned users such as governments or other regulatory agencies. Wallets may also be blocked from creating transactions, though they can never be blocked from withdrawing their own funds.

