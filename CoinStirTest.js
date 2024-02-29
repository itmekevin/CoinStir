const { expect } = require("chai");
const hre = require("hardhat");

const msg = "This signature is used to prove ownership of this account, similar to using a password for a username in a more traditional login.";
let enclave;
let host;
let admin;
let user;
let access;
let relayer;
let signInSignature;
let gasWallet;
let authorizedUser;
let userAddress;
let nowBlocked;


describe("GasCheck", function() {
    it("Should confirm the gas cost set by the contract", async function () {
    	const accounts = await ethers.getSigners();
    	let first = accounts[0].address;
    	let nextHostAddr;
    	let _nonce = await ethers.provider.getTransactionCount(first);
    	let nonce = _nonce + 1;
            console.log("Deploying Address: " + first);
            console.log("and here is the nonce: " + _nonce);
    calculateContractAddress()
    .then(contractAddress => {
        console.log("Future Host Contract Address:", contractAddress);
    })
    .catch(error => {
        console.error("Error calculating contract address:", error);
    });
    async function calculateContractAddress() {
        let from = first;
        nextHostAddr = ethers.getCreateAddress({from, nonce});
    return nextHostAddr;
    }
    const StirEnclave = await ethers.getContractFactory('StirEnclave');
    enclave = await StirEnclave.deploy(nextHostAddr);
    await enclave.waitForDeployment();
    const enclaveAddress = await enclave.getAddress();
        console.log('StirEnclave deployed to address: ' + enclaveAddress);
    const StirHost = await ethers.getContractFactory('StirHost');
    host = await StirHost.deploy(enclaveAddress);
    const setGas = 2000000000000000;
    expect(await enclave.depositGasPrice()).to.equal(setGas);
    });
});

describe("FeeWalletCheck", function() {
	it("Should confirm the current fee wallet", async function () {
		const checkWallet = "0x0D78a2d04B925f50Ee233735b60C862357492D2d";
		expect(await enclave.feeWallet()).to.equal(checkWallet);
	});	
});

describe("checkBal", function() {
	it("Should return the users balance", async function () {
		const accounts = await ethers.getSigners();
		user = accounts[1];
		userAddress = user.address;


const msgParams = {
    domain: {
        // Give a user friendly name to the specific contract you are signing for.
        name: "CoinStir",
        // Just let's you know the latest version.
        version: "1",
        // Defining the chain aka Rinkeby testnet or Ethereum Main Net
        chainId: 23295,
        // Make sure you are establishing contracts with the proper entity
        verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
        /*
        - Anything you want. Just a JSON Blob that encodes the data you want to send
        - No required fields
        - This is DApp Specific
        - Be as explicit as possible when building out the message schema.
        */
        note: msg,
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
        Message: [
            { name: "note", type: "string" }
        ],
    }
};

    signInSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);

		console.log("sig is: " + signInSignature);

		await enclave.connect(user).recoverAddrCheckBal(signInSignature, msg);
		expect(await enclave.recoverAddrCheckBal(signInSignature, msg)).to.equal("0");
	});	
});

describe("SetTheFeeWallet", function() {
	it("Should set a new fee wallet", async function () {
		const accounts = await ethers.getSigners();
		const setWallet = "0x33b116255283955d31f86659538E24a0C73d3C04";
		admin = accounts[0];
		await enclave.connect(admin).setFeeWallet(setWallet);
		expect(await enclave.feeWallet()).to.equal(setWallet);
		await expect (enclave.connect(user).setFeeWallet(setWallet)).to.be.reverted;
	});	
});

describe("SetTheGasWallet", function() {
	it("Should set a new gas wallet", async function () {
		const accounts = await ethers.getSigners();
		gasWallet = accounts[8];
		await enclave.connect(admin).setGasWallet(gasWallet);
		expect(await enclave.gasWallet()).to.equal(gasWallet);
		await expect (enclave.connect(user).setGasWallet(gasWallet)).to.be.reverted;
	});	
});


describe("flipRelayerStatus", function() {
	it("Should flip the relayer status for an address", async function () {
		const accounts = await ethers.getSigners();
		relayer = accounts[3];
		await enclave.connect(admin).flipRelayer(relayer);
		const newStatus = await enclave.relayerStatus(relayer);
		expect(newStatus).to.equal(true);
		await expect (enclave.connect(user).flipRelayer(relayer)).to.be.reverted;
	});	
});

describe("flipAuthStatus", function() {
	it("Should flip the authorization status for an address", async function () {
		const accounts = await ethers.getSigners();
		authorizedUser = accounts[6];
		await enclave.connect(admin).flipAuth(authorizedUser);
		const newStatus = await enclave.authStatus(authorizedUser);
		expect(newStatus).to.equal(true);
		await expect (enclave.connect(user).flipAuth(authorizedUser)).to.be.reverted;
	});	
});

describe("flipAdminStatus", function() {
	it("Should flip the administrator status for an address", async function () {
		const accounts = await ethers.getSigners();
		newAdmin = accounts[7];
		await enclave.connect(admin).flipAdmin(newAdmin);
		const newStatus = await enclave.adminStatus(newAdmin);
		expect(newStatus).to.equal(true);
		await expect (enclave.connect(user).flipAdmin(newAdmin)).to.be.reverted;
	});	
});

describe("blockWallet", function() {
	it("Should flip the blocked status for a given users address", async function () {
		const accounts = await ethers.getSigners();
		nowBlocked = accounts[10];
		await enclave.connect(admin).blockWallet(nowBlocked);
		const newStatus = await enclave.blockedList(nowBlocked);
		expect(newStatus).to.equal(true);
		await expect (enclave.connect(user).blockWallet(nowBlocked)).to.be.reverted;
	});	
});




//////////////////////////////////////////////// - DEPOSIT - ////////////////////////////////////////////////
//////////////////////////////////////////////// - DEPOSIT - ////////////////////////////////////////////////
//////////////////////////////////////////////// - DEPOSIT - ////////////////////////////////////////////////

describe("makeDeposit", function() {
	it("Should create a deposit", async function () {
			const accounts = await ethers.getSigners();
			const _payload = "1"
    		const payload = {value: ethers.parseEther(_payload)}
			console.log("depositing address: " + user.address);
			const tx = await host.connect(user).deposit(payload);
			expect(tx).to.exist;
	});	
});


describe("createTxn", function() {
	it("Should create a new txn to be executed by the relayer", async function () {
		const accounts = await ethers.getSigners();
		const _num = ".01"
    	const num = {value: ethers.parseEther(_num)}
    	const numvalue = num.value;
    	const numString = numvalue.toString();
		let recipiant = accounts[4].address;
		const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */
      recipiant: recipiant,
      value: numString,

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
      ],
    },
  };
let txnSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature
      };
		const metatxn = await enclave.connect(user).createmetaTXN(_data);
		console.log(metatxn);
		const actualtxn = await enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10);
		expect(actualtxn).to.exist;
		await expect (enclave.connect(user)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.reverted;

	});	
});

describe("blockedTXN", function() {
	it("Should block the txn of a user who is on the blocked list", async function () {
		const accounts = await ethers.getSigners();
		const _num = ".01"
    	const num = {value: ethers.parseEther(_num)}
    	const numvalue = num.value;
    	const numString = numvalue.toString();
		let recipiant = accounts[4].address;
		const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */
      recipiant: recipiant,
      value: numString,

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
      ],
    },
  };
console.log("blocked: " + nowBlocked.address);
console.log("recipiant: " + recipiant);

let txnSignature = await nowBlocked.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature
      };
		const metatxn = await enclave.connect(nowBlocked).createmetaTXN(_data);
		console.log(metatxn);
		//const actualtxn = await enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10);
		await expect (enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.reverted;

	});	
});

describe("createWithdrawal", function() {
	it("Should create a new withdrawal to be executed by the relayer", async function () {
		const accounts = await ethers.getSigners();
		const _num = ".01"
    	const num = {value: ethers.parseEther(_num)}
    	const numvalue = num.value;
    	const numString = numvalue.toString();
		let recipiant = userAddress;
		const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */
      recipiant: recipiant,
      value: numString,

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
      ],
    },
  };
let txnSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature
      };
		const metatxn = await enclave.connect(user).createmetaTXN(_data);
		console.log(metatxn);
		const actualtxn = await enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10);
		expect(actualtxn).to.exist;
		await expect (enclave.connect(user)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.reverted;

	});	
});

//////////////////////////////////////////////// - ADD APPROVED ADDR HERE - ////////////////////////////////////////////////
//////////////////////////////////////////////// - ADD APPROVED ADDR HERE - ////////////////////////////////////////////////
//////////////////////////////////////////////// - ADD APPROVED ADDR HERE - ////////////////////////////////////////////////


describe("approveAddress", function() {
	it("Should approve a new address", async function () {
		const approvalString = "Sign to grant access to your funds by the new wallet shown above";
		const accounts = await ethers.getSigners();
		let _approvedAddress = accounts[2].address;
		console.log("here is the address hoping for approval: " + _approvedAddress);
		const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */
      recipiant: _approvedAddress,
      value: approvalString,

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
      ],
    },
  };
	let approveSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
	console.log(approveSignature);
	const _data = {
    	_walletB: _approvedAddress,
    	_signature: approveSignature
    	};
    	console.log("data: " + _data);
	var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
	console.log("meta: " + metatxn);
	const actualtxn = await enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000);
	expect(actualtxn).to.exist;
	await expect (enclave.connect(user).proposeAddress(metatxn, approvalString, 2000000000000000)).to.be.reverted;

// PART 2 
			let approvedAddressSign = accounts[2];
			console.log(approvedAddressSign);

		const msgParamsFinal = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */
      recipiant: userAddress,
      value: approvalString,

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
      ],
    },
  };

	let approveSignatureFinal = await approvedAddressSign.signTypedData(msgParamsFinal.domain, msgParamsFinal.types, msgParamsFinal.message);
	console.log(approveSignatureFinal);
	const _dataFinal = {
    	_walletB: userAddress,
    	_signature: approveSignatureFinal
    	};
    	console.log("dataFinal: " + _dataFinal);
	var metatxnFinal = await enclave.connect(approvedAddressSign).createMetaTxnAddr(_dataFinal);
	console.log("metaFinal: " + metatxnFinal);
	const actualtxnFinal = await enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, 2000000000000000);
	expect(actualtxnFinal).to.exist;
	await expect (enclave.connect(user).confirmApproval(metatxnFinal, approvalString, 2000000000000000)).to.be.reverted;
	await expect (await enclave.connect(user).getApprovedAddr(signInSignature, msg, 0)).to.equal(_approvedAddress);
	await expect (await enclave.connect(user).approvalCheck(user)).to.equal("1");
	await expect(enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000)).to.be.reverted;

	});	
});


describe("recoverAddrTXNdata", function() {
	it("Should return txn data for the user", async function () {
		const result = await enclave.connect(user).recoverAddrTXNdata(signInSignature, msg, 0, 2);
		console.log("result: " + result);
		expect(result).to.exist;
	});	
});

describe("recoverAddressFromSignature", function() {
	it("Should return users address", async function () {
		const result = await enclave.connect(user).recoverAddressFromSignature(signInSignature, msg);
		console.log("result: " + result);
		expect(result).to.exist;
	});	
});

describe("recoverOriginFromSignature", function() {
	it("Should return users origin address", async function () {
		const result = await enclave.connect(user).recoverOriginFromSignature(signInSignature, msg);
		console.log("result: " + result);
		expect(result).to.equal(user);
	});	
});


//////////////////////////////////////////////// - AUTH STUFF - ////////////////////////////////////////////////
//////////////////////////////////////////////// - AUTH STUFF - ////////////////////////////////////////////////
//////////////////////////////////////////////// - AUTH STUFF - ////////////////////////////////////////////////


describe("SetDepositGasPrice", function() {
	it("Should set a new gas price", async function () {
		const _num = ".00069";
    	const num = {value: ethers.parseEther(_num)};
    	const numvalue = num.value;
    	const numString = numvalue.toString();
		await enclave.connect(admin).setDepositGasPrice(numString);
		expect(await enclave.depositGasPrice()).to.equal(numString);
		await expect (enclave.connect(user).setDepositGasPrice(numString)).to.be.reverted;
	});	
});

describe("claimGas", function() {
	it("Should claim gas fees earned", async function () {
		const tx = await enclave.connect(admin).claimGas();
		expect(tx).to.exist;
		await expect (enclave.connect(user).claimGas()).to.be.reverted;
	});	
});

describe("claimFee", function() {
	it("Should claim service fees earned", async function () {
		const tx = await enclave.connect(admin).claimFee();
		expect(tx).to.exist;
		await expect (enclave.connect(user).claimFee()).to.be.reverted;
		expect(await enclave.feeClaim()).to.equal("0");
	});	
});



describe("authGetTXNinfo", function() {
	it("Should return txn data for the user when searched by an authorized wallet", async function () {
		const msgParams = {
    domain: {
        // Give a user friendly name to the specific contract you are signing for.
        name: "CoinStir",
        // Just let's you know the latest version.
        version: "1",
        // Defining the chain aka Rinkeby testnet or Ethereum Main Net
        chainId: 23295,
        // Make sure you are establishing contracts with the proper entity
        verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
        /*
        - Anything you want. Just a JSON Blob that encodes the data you want to send
        - No required fields
        - This is DApp Specific
        - Be as explicit as possible when building out the message schema.
        */
        note: msg,
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
        Message: [
            { name: "note", type: "string" }
        ],
    }
};

    authSignInSignature = await authorizedUser.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
		const result = await enclave.connect(authorizedUser).authGetTXNinfo(authSignInSignature, msg, user, 0, 2);
		console.log("result: " + result);
		expect(result).to.exist;
		await expect (enclave.connect(user).authGetTXNinfo(signInSignature, msg, user, 0, 2)).to.be.reverted;
	});	
});

describe("authGetTxnList", function() {
	it("Should return the list of txns for a user when searched by an authorized wallet", async function () {
		const result = await enclave.connect(authorizedUser).authGetTxnList(authSignInSignature, msg, user);
		console.log("result: " + result);
		expect(result).to.exist;
		await expect (enclave.connect(user).authGetTxnList(signInSignature, msg, user)).to.be.reverted;
	});	
});

describe("revokeAddress", function() {
	it("Should revoke a previously approved address", async function () {
  		const revokeString = "Sign to remove access to your funds by the wallet shown above";
		const accounts = await ethers.getSigners();
		let _approvedAddress = accounts[2].address;
		console.log("here is the address to be revoked: " + _approvedAddress);
		const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */
      recipiant: _approvedAddress,
      value: revokeString,

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
      ],
    },
  };
	let revokeSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
	console.log(revokeSignature);
	const _data = {
    	_walletB: _approvedAddress,
    	_signature: revokeSignature
    	};
    	console.log("data: " + _data);
	var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
	console.log("meta: " + metatxn);
	const actualtxn = await enclave.connect(relayer).revokeAddress(metatxn, revokeString, 2000000000000000);
	expect(actualtxn).to.exist;
	await expect (enclave.connect(user).revokeAddress(metatxn, revokeString, 2000000000000000)).to.be.reverted;
	await expect (enclave.connect(user).revokeAddress(metatxn, revokeString, "2000000000000000000")).to.be.reverted;
	await expect (enclave.connect(admin).revokeAddress(metatxn, revokeString, 2000000000000000)).to.be.reverted;
		});	
});
