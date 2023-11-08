# CoinStir

CoinStir: Explained.

Overview.

CoinStir is a privacy enabling app that allows users to send ETH or ERC20 tokens to other wallets without recipiants being able to see who specifically sent the funds. Additionally CoinStir allows for a 'web' of wallets to be created and managed from one dashboard to assist in managing personal or business finances across multiple wallets. Financial privacy is instrumental in a multide of business and personal relationships, and while the open nature of the blockchain is often superior, there are instances in which privacy remains critical.

There are 2 halves to CoinStir that work together in order to achieve this:
- The 'Host' contract which exists on ETH and handles the receipt and dispersement of funds - and nothing else. While these events are public on the blockchain, the Host contract does not track any information whatsoever.
- The 'Enclave' contract exists on the Sapphire paratime of the Oasis Network. The Enclave keeps the entirety of the contract's state. Account balances and transactions are managed by the Enclave, which must dictate action to the Host contract via a message bridge for a txn to occur.

The Sapphire paratime is a privacy enabled blockchain with all computation and private contract state managed within a TEE (Trusted Execution Environment) which ensures state cannot be queried by anyone not explicitly permissioned to view the relevant information. By extracting the contract's state and maintaining it off of the public ledger, privacy can be granted while still allowing many of the other benefits found on the Ethereum Network.


Logic Flow.
Funds are deposited into the Host contract triggering a message to the Enclave contract including details of the transaction (amount and sender). The user then approves other wallets to spend the funds it deposited, however this step occurs in private via Sapphire which means the approved wallets are able to initiate txn's without anyone knowing what wallet it is tied to. The user then connects with these approved wallets and is able to send funds freely without concern if the recipiant will be able to track their account activity on the original wallet. 

Deposits:
A deposit is made on Ethereum triggering a message to be passed from the Host contract to the Enclave contract via Celr's IM bridge.
The Enclave contract receives this message and logs details of the txn. TXN's are stored as structs mapped to a number to organize them. The struct stores the blocknumber, recipiant, sender, amount, fee and the users available balance for all transactions. The number of the struct is attached to the connected wallet for quearying later.

Transactions:
A user creates a message that is passed to a relayer on Sapphire. This allows the user to enjoy the benefits of the Sapphire paratime while preventing them from needing the Sapphire gas token, $ROSE. The message includes the value, destination and a signature, and is passed by the relayer to the Enclave contract which sends a message to the Host contract dictating where to send funds. The state is then updated only in the Enclave. On ETH, the user is charged both a fee as a percent of the amount transferred, as well as the gas spent by the relayer on Sapphire.

Withdraws:
A user may initiate a withdraw in the same way a transaction is initiated, however the recipiant is themself. Gas is still charged to the user, but no fee is.

Oversight:
In an effort to prevent money laundering, there is the ability for oversight organizations to be granted access to review all history for any wallet. This grants the ability to "look behind the curtain" of the app to permissioned users such as governments or other regulatory agencies.


