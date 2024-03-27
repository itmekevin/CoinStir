const { expect } = require("chai");
const hre = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

const msg = "This signature is used to prove ownership of this account, similar to using a password for a username in a more traditional login.";
let enclave;
let host;
let lib;
let admin;
let user;
let access;
let relayer;
let signInSignature;
let gasWallet;
let authorizedUser;
let userAddress;
let nowBlocked;
let enclaveAddress;
let libraryAddress;
let txnCount;


describe("GasCheck", function() {
    it("Should confirm the gas cost set by the contract", async function () {
      const accounts = await ethers.getSigners();
      let first = accounts[0].address;

          const VerifyTypedData = await ethers.getContractFactory('VerifyTypedData');
    lib = await VerifyTypedData.deploy();
    libraryAddress = await lib.getAddress();


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


    console.log("the library address is: " + libraryAddress);

        const StirEnclave = await ethers.getContractFactory('StirEnclave', {
        libraries: {
        VerifyTypedData: libraryAddress,
        },
    });
    enclave = await StirEnclave.deploy(nextHostAddr);
    await enclave.waitForDeployment();
    enclaveAddress = await enclave.getAddress();
        console.log('StirEnclave deployed to address: ' + enclaveAddress);
    const StirHost = await ethers.getContractFactory('StirHost');
    host = await StirHost.deploy(enclaveAddress);
    const setGas = 2300000000000000;
    expect(await enclave.depositGasPrice()).to.equal(setGas);
    });
});

describe("FeeWalletCheck", function() {
  it("Should confirm the current fee wallet", async function () {
    const checkWallet = "0x0D78a2d04B925f50Ee233735b60C862357492D2d";
    expect(await enclave.feeWallet()).to.equal(checkWallet);
  }); 
});

describe("recoverAddressFromSignature", function() {
  it("Should return users address, number of txns, account balance, number of approved wallets and origin address", async function () {
    const accounts = await ethers.getSigners();
    user = accounts[1];
    userAddress = user.address;

      let _deadline = await ethers.provider.getBlockNumber();
      deadline = _deadline.toString();
console.log("users deadline: "+ deadline);

  const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: enclaveAddress,
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
      deadline: deadline, // Add deadline to the message
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "note", type: "string" },
        { name: "deadline", type: "uint256" },
      ],
    },
  };
console.log(msgParams);
    signInSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);

    console.log("sig is: " + signInSignature);

    const result = await enclave.connect(user).recoverAddressFromSignature(signInSignature, msg, deadline);
    console.log("The result is: " + result);
    console.log("The current address is: " + result[0]);
    console.log("The origin account for this address has: " + result[1] + " transactions");
    txnCount = result[1];
    console.log("The balance of the origin address is: " + result[2]);
    console.log("The number of approved addresses for this origin address is: " + result[3]);
    console.log("This users origin address is: " + result[4]);
    expect(result).to.exist;

    await expect (enclave.connect(user).recoverAddressFromSignature((signInSignature + "00"), msg, deadline)).to.exist;

    let invalidSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    invalidSignatureBytes = ethers.getBytes(invalidSignature);
    console.log(invalidSignatureBytes);
    invalidSignatureBytes[64] = 26;
    const modifiedSignature = ethers.toQuantity(invalidSignatureBytes)
    console.log(modifiedSignature);

    await expect (enclave.connect(user).recoverAddressFromSignature(modifiedSignature, msg, deadline)).to.exist;

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

    await expect (enclave.connect(admin).flipAdmin(admin)).to.be.revertedWith("cannot revoke own access");

  }); 
});

describe("blockWallet", function() {
  it("Should flip the blocked status for a given users address", async function () {
    const accounts = await ethers.getSigners();
    nowBlocked = [accounts[10].address];
    await enclave.connect(admin).blockWallet(nowBlocked);
    const newStatus = await enclave.blockedList(nowBlocked[0]);
    expect(newStatus).to.equal(true);
    await expect (enclave.connect(user).blockWallet(nowBlocked)).to.be.reverted;
  }); 
});



//////////////////////////////////////////////// - DEPOSIT - ////////////////////////////////////////////////
//////////////////////////////////////////////// - DEPOSIT - ////////////////////////////////////////////////
//////////////////////////////////////////////// - DEPOSIT - ////////////////////////////////////////////////

describe("invalidValueTXN", function() {
  it("Should fail due to sending more ether than user has deposited", async function () {
    const accounts = await ethers.getSigners();
    const _num = "50";
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" }
      ],
    },
  };
let txnSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature,
      nonce: txnCount
      };
    const metatxn = await enclave.connect(user).createmetaTXN(_data);
    console.log(metatxn);
    await expect (enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.revertedWith("insufficient funds");
  }); 
});

describe("badSignatureTXN", function() {
  it("Should fail due bad signature", async function () {
    const accounts = await ethers.getSigners();
    const _num = "50";
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" }
      ],
    },
  };
let txnSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature + "00",
      nonce: txnCount
      };
    const metatxn = await enclave.connect(user).createmetaTXN(_data);
    console.log("the metatxn: " + metatxn);
    await expect (enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.revertedWith("insufficient funds");


let invalidSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);

    invalidSignatureBytes = ethers.getBytes(invalidSignature);
    console.log(invalidSignatureBytes);
    invalidSignatureBytes[64] = 26;
    const modifiedSignature = ethers.toQuantity(invalidSignatureBytes)
    console.log(modifiedSignature);

    const _dataV = {
      _payload: numString,
      _dest: recipiant,
      _signature: modifiedSignature,
      nonce: txnCount
      };

    const metatxnV = await enclave.connect(user).createmetaTXN(_dataV);

    await expect (enclave.connect(relayer)._trackTxn(metatxnV, numString, 2000000000000000, 10)).to.exist;
    txnCount++;
  }); 
});

describe("makeDeposit", function() {
  it("Should create a deposit", async function () {
      const _payload = "10"
      const payload = {value: ethers.parseEther(_payload)}
      console.log("depositing address: " + user.address);
      const tx = await host.connect(user).deposit(payload);
      expect(tx).to.exist;
      const tx0 = await host.connect(user).deposit(payload);
      expect(tx0).to.exist;
      const _badPayload = ".00000000001"
      const badPayload = {value: ethers.parseEther(_badPayload)}
      await expect (host.connect(user).deposit(badPayload)).to.be.reverted;
      txnCount++;
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
let txnSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature,
      nonce: txnCount
      };
    const metatxn = await enclave.connect(user).createmetaTXN(_data);
    console.log(metatxn);
    await expect (enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.exist;
    await expect (enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.revertedWith("bad sig");
    await expect (enclave.connect(user)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.reverted;
    txnCount++;
  }); 
});
/*
describe("invalidRecipiantTXN", function() {
  it("Should fail due to sending txn to the enclave contract address itself", async function () {
    const accounts = await ethers.getSigners();
    const _num = ".01"
      const num = {value: ethers.parseEther(_num)}
      const numvalue = num.value;
      const numString = numvalue.toString();
    let recipiant = enclaveAddress;
    const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: enclaveAddress,
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */ /*
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
    await expect (enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.reverted;
  }); 
});
*/


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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
console.log("blocked: " + accounts[10].address);
console.log("recipiant: " + recipiant);

let badAddr = accounts[10];

let txnSignature = await badAddr.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature,
      nonce: txnCount
      };
    const metatxn = await enclave.connect(badAddr).createmetaTXN(_data);
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
let txnSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const _data = {
      _payload: numString,
      _dest: recipiant,
      _signature: txnSignature,
      nonce: txnCount
      };
    const metatxn = await enclave.connect(user).createmetaTXN(_data);
    console.log(metatxn);
    const actualtxn = await enclave.connect(relayer)._trackTxn(metatxn, numString, 2000000000000000, 10);
    expect(actualtxn).to.exist;
    await expect (enclave.connect(user)._trackTxn(metatxn, numString, 2000000000000000, 10)).to.be.reverted;
    txnCount++;
  }); 
});

//////////////////////////////////////////////// - ADD APPROVED ADDR HERE - ////////////////////////////////////////////////
//////////////////////////////////////////////// - ADD APPROVED ADDR HERE - ////////////////////////////////////////////////
//////////////////////////////////////////////// - ADD APPROVED ADDR HERE - ////////////////////////////////////////////////

describe("approveAddressInvalidSender", function() {
  it("Should fail to approve a new address due to non originAddress sender", async function () {
    const approvalString = "Sign to grant access to your funds by the new wallet shown above";
    const accounts = await ethers.getSigners();
    let _approvedAddress = accounts[2].address;
    let invalidSigner = accounts[2];
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let approveSignature = await invalidSigner.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(approveSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: approveSignature,
      nonce: txnCount
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(invalidSigner).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000)).to.be.revertedWith("must use origin address");
  }); 
});

describe("approveAddress", function() {
  it("Should approve a new address", async function () {
    const approvalString = "Sign to grant access to your funds by the new wallet shown above";
    const accounts = await ethers.getSigners();
    console.log("the current nonce is: " + txnCount);
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let approveSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(approveSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: approveSignature,
      nonce: txnCount
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).proposeAddress(metatxn, approvalString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  let replayTxn = await enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000);
  expect(replayTxn).to.exist;
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };

  let approveSignatureFinal = await approvedAddressSign.signTypedData(msgParamsFinal.domain, msgParamsFinal.types, msgParamsFinal.message);
  console.log(approveSignatureFinal);
  const _dataFinal = {
      _walletB: userAddress,
      _signature: approveSignatureFinal,
      nonce: txnCount
      };
      console.log("dataFinal: " + _dataFinal);
  var metatxnFinal = await enclave.connect(approvedAddressSign).createMetaTxnAddr(_dataFinal);
  console.log("metaFinal: " + metatxnFinal);
  await expect (enclave.connect(user).confirmApproval(metatxnFinal, approvalString, 2000000000000000)).to.be.reverted;
  await expect(enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  const actualtxnFinal = await enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, 2000000000000000);
  expect(actualtxnFinal).to.exist;
  await expect (enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000)).to.be.revertedWith("propose a different address");

  // CONFIRM APPROVALS REQUIRE STATEMENTS FAIL:


      let adminAddress = admin.address;
      console.log(adminAddress);

    const invalidMsgParamsFinal = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: enclaveAddress,
    },
    // Defining the message signing data content.
    message: {
      /*
      - Anything you want. Just a JSON Blob that encodes the data you want to send
      - No required fields
      - This is DApp Specific
      - Be as explicit as possible when building out the message schema.
      */
      recipiant: adminAddress,
      value: approvalString,
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };

  let invalidApproveSignatureFinal = await approvedAddressSign.signTypedData(invalidMsgParamsFinal.domain, invalidMsgParamsFinal.types, invalidMsgParamsFinal.message);
  console.log(invalidApproveSignatureFinal);
  const invalidDataFinal = {
      _walletB: adminAddress,
      _signature: invalidApproveSignatureFinal,
      nonce: txnCount
      };
      console.log("dataFinal: " + invalidDataFinal);
  await enclave.connect(approvedAddressSign).createMetaTxnAddr(invalidDataFinal);
  console.log("metaFinal: " + metatxnFinal);
  await expect(enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, 2000000000000000)).to.be.revertedWith("invalid address");  
  txnCount++;
  }); 
});





describe("getApprovedAddr", function() {
  it("Should return the specific approved address by array position of an origin address", async function () {
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
        verifyingContract: enclaveAddress,
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
        deadline: deadline
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
        Message: [
            { name: "note", type: "string" },
            { name: "deadline", type: "uint256" }
        ],
    }
};

    signInSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);

    console.log("sig is: " + signInSignature);

    const result = await enclave.connect(user).getApprovedAddr(signInSignature, msg, 0, deadline);
    console.log("The address in the requested position is: " + result);
    expect(result).to.exist;
  }); 
});


describe("recoverAddrTXNdata", function() {
  it("Should return txn data for the user", async function () {
    const result = await enclave.connect(user).recoverAddrTXNdata(signInSignature, msg, deadline, 0, 2);
    console.log("result: " + result);
    expect(result).to.exist;

    await mine(601);

    await expect (enclave.connect(user).recoverAddrTXNdata(signInSignature, msg, deadline, 0, 2)).to.be.revertedWith("time expired");
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


describe("SetCelerFeeROSE", function() {
  it("Should update the celer fee for rose", async function () {
    const _num = ".00069";
      const num = {value: ethers.parseEther(_num)};
      const numvalue = num.value;
      const numString = numvalue.toString();
    await enclave.connect(admin).setCelerFeeROSE(numString);
    expect(await enclave.celerFeeROSE()).to.equal(numString);
    await expect (enclave.connect(user).setCelerFeeROSE(numString)).to.be.reverted;
  }); 
});

describe("claimGas", function() {
  it("Should claim gas fees earned", async function () {
      const _payload = "1"
      const payload = {value: ethers.parseEther(_payload)}
    const tx = await enclave.connect(admin).claimGas(payload);
    expect(tx).to.exist;
    await expect (enclave.connect(user).claimGas(payload)).to.be.reverted;

        const _num = "5";
      const num = {value: ethers.parseEther(_num)};
      const numvalue = num.value;
      const numString = numvalue.toString();
    await enclave.connect(admin).setCelerFeeROSE(numString);

    await expect (enclave.connect(admin).claimGas(payload)).to.be.reverted;

    await enclave.connect(admin).setCelerFeeROSE(numString);
  }); 
});

describe("claimFee", function() {
  it("Should claim service fees earned", async function () {
      const _payload = "6"
      const payload = {value: ethers.parseEther(_payload)}
    const tx = await enclave.connect(admin).claimFee(payload);
    expect(tx).to.exist;
    await expect (enclave.connect(user).claimFee(payload)).to.be.reverted;

      const _badPayload = "2"
      const badPayload = {value: ethers.parseEther(_badPayload)}

    await expect (enclave.connect(admin).claimFee(badPayload)).to.be.reverted;
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
        verifyingContract: enclaveAddress,
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
        deadline: deadline
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
        Message: [
            { name: "note", type: "string" },
            { name: "deadline", type: "uint256" }
        ],
    }
};

    authSignInSignature = await authorizedUser.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
    const result = await enclave.connect(authorizedUser).authGetTXNinfo(authSignInSignature, msg, user, 0, 2, deadline);
    console.log("result: " + result);
    expect(result).to.exist;
    await expect (enclave.connect(user).authGetTXNinfo(signInSignature, msg, user, 0, 2, deadline)).to.be.reverted;
  }); 
});

describe("authGetTxnList", function() {
  it("Should return the list of txns for a user when searched by an authorized wallet", async function () {
    const result = await enclave.connect(authorizedUser).authGetTxnList(authSignInSignature, msg, user, deadline);
    console.log("result: " + result);
    expect(result).to.exist;
    await expect (enclave.connect(user).authGetTxnList(signInSignature, msg, user, deadline)).to.be.reverted;
  }); 
});

describe("SetMinDeposit", function() {
  it("Should update the minimum deposit amount", async function () {

    let minDeposit = await host.minAmount();
      console.log("the current minimum deposit is: " + minDeposit);
    const _num = "420";
    const num = {value: ethers.parseEther(_num)};
    const numvalue = num.value;
    const numString = numvalue.toString();

    await host.connect(admin).setMinAmount(numString);
    expect(await host.minAmount()).to.equal(numString);
    await expect (host.connect(user).setMinAmount(numString)).to.be.reverted;
  }); 
});

describe("revokeAddressIncorrectUser", function() {
  it("Should fail to revoke address due to not originAddress", async function () {
    const revokeString = "Sign to remove access to your funds by the wallet shown above";
    const accounts = await ethers.getSigners();
    let _approvedAddress = accounts[2].address;
    let invalidSigner = accounts[2];
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let revokeSignature = await invalidSigner.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(revokeSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: revokeSignature,
      nonce: txnCount
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(invalidSigner).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).revokeAddress(metatxn, revokeString, 2000000000000000)).to.be.revertedWith("must use origin address");
    }); 
});

describe("revokeSecondAddress", function() {
  it("Should revoke a previously approved address", async function () {
    const revokeString = "Sign to remove access to your funds by the wallet shown above";
    const accounts = await ethers.getSigners();
    let _approvedAddress = accounts[9].address;
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let revokeSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(revokeSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: revokeSignature,
      nonce: txnCount
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).revokeAddress(metatxn, revokeString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  const actualtxn = await enclave.connect(relayer).revokeAddress(metatxn, revokeString, 2000000000000000);
  expect(actualtxn).to.exist;
  await expect (enclave.connect(user).revokeAddress(metatxn, revokeString, 2000000000000000)).to.be.reverted;
  txnCount++;
    }); 
});

describe("revokeAddress", function() {
  it("Should revoke a previously approved address", async function () {
    const revokeString = "Sign to remove access to your funds by the wallet shown above";
    const accounts = await ethers.getSigners();
    console.log("current txn count: " + txnCount);
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let revokeSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(revokeSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: revokeSignature,
      nonce: txnCount
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).revokeAddress(metatxn, revokeString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  const actualtxn = await enclave.connect(relayer).revokeAddress(metatxn, revokeString, 2000000000000000);
  expect(actualtxn).to.exist;
  await expect (enclave.connect(user).revokeAddress(metatxn, revokeString, 2000000000000000)).to.be.reverted;
  txnCount++;
    }); 
});

describe("replayApproval", function() {
  it("Should fail due to re-using old signature", async function () {
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
      verifyingContract: enclaveAddress,
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
      nonce: 4

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let approveSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(approveSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: approveSignature,
      nonce: 4
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).proposeAddress(metatxn, approvalString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  let replayTxn = await enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000);
  expect(replayTxn).to.exist;
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
      verifyingContract: enclaveAddress,
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
      nonce: 4

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };

  let approveSignatureFinal = await approvedAddressSign.signTypedData(msgParamsFinal.domain, msgParamsFinal.types, msgParamsFinal.message);
  console.log(approveSignatureFinal);
  const _dataFinal = {
      _walletB: userAddress,
      _signature: approveSignatureFinal,
      nonce: 4
      };
      console.log("dataFinal: " + _dataFinal);
  var metatxnFinal = await enclave.connect(approvedAddressSign).createMetaTxnAddr(_dataFinal);
  console.log("metaFinal: " + metatxnFinal);
  await expect (enclave.connect(user).confirmApproval(metatxnFinal, approvalString, 2000000000000000)).to.be.reverted;
  await expect(enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  await expect (enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, 2000000000000000)).to.be.revertedWith("bad sig");

  }); 
});


describe("approveAddress", function() {
  it("Should approve a new address", async function () {
    const approvalString = "Sign to grant access to your funds by the new wallet shown above";
    const accounts = await ethers.getSigners();
    console.log("the current nonce is: " + txnCount);
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let approveSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(approveSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: approveSignature,
      nonce: txnCount
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).proposeAddress(metatxn, approvalString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  let replayTxn = await enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000);
  expect(replayTxn).to.exist;
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
      verifyingContract: enclaveAddress,
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
      nonce: txnCount

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };

  let approveSignatureFinal = await approvedAddressSign.signTypedData(msgParamsFinal.domain, msgParamsFinal.types, msgParamsFinal.message);
  console.log(approveSignatureFinal);
  const _dataFinal = {
      _walletB: userAddress,
      _signature: approveSignatureFinal,
      nonce: txnCount
      };
      console.log("dataFinal: " + _dataFinal);
  var metatxnFinal = await enclave.connect(approvedAddressSign).createMetaTxnAddr(_dataFinal);
  console.log("metaFinal: " + metatxnFinal);
  await expect (enclave.connect(user).confirmApproval(metatxnFinal, approvalString, 2000000000000000)).to.be.reverted;
  await expect(enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  const actualtxnFinal = await enclave.connect(relayer).confirmApproval(metatxnFinal, approvalString, 2000000000000000);
  expect(actualtxnFinal).to.exist;
  await expect (enclave.connect(relayer).proposeAddress(metatxn, approvalString, 2000000000000000)).to.be.revertedWith("propose a different address");
  txnCount++;
  }); 
});

describe("replayRevokeAddress", function() {
  it("Should do nothing due to signature replay", async function () {
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
      verifyingContract: enclaveAddress,
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
      nonce: 6

    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  };
  let revokeSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);
  console.log(revokeSignature);
  const _data = {
      _walletB: _approvedAddress,
      _signature: revokeSignature,
      nonce: 6
      };
      console.log("data: " + _data);
  var metatxn = await enclave.connect(user).createMetaTxnAddr(_data);
  console.log("meta: " + metatxn);
  await expect (enclave.connect(relayer).revokeAddress(metatxn, revokeString, "20000000000000000000")).to.be.revertedWith("insufficient balance");
  await expect (enclave.connect(relayer).revokeAddress(metatxn, revokeString, 2000000000000000)).to.be.revertedWith("bad sig");
  await expect (enclave.connect(user).revokeAddress(metatxn, revokeString, 2000000000000000)).to.be.reverted;
  txnCount++;
    }); 
});

describe("recoverAddrTXNdata", function() {
  it("Should return txn data for the user", async function () {

    await mine(601);

    await expect (enclave.connect(user).recoverAddrTXNdata(signInSignature, msg, deadline, 0, 2)).to.be.revertedWith("time expired");
  }); 
});

describe("recoverAddressFromSignatureTimeExpired", function() {
  it("Should fail due to time on the signature expiring", async function () {
    const accounts = await ethers.getSigners();
    user = accounts[1];
    userAddress = user.address;

      let _deadline = await ethers.provider.getBlockNumber();
      deadline = _deadline.toString();
console.log("users deadline: "+ deadline);

  const msgParams = {
    domain: {
      // Give a user friendly name to the specific contract you are signing for.
      name: "CoinStir",
      // Just let's you know the latest version.
      version: "1",
      // Defining the chain aka Rinkeby testnet or Ethereum Main Net
      chainId: 23295,
      // Make sure you are establishing contracts with the proper entity
      verifyingContract: enclaveAddress,
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
      deadline: deadline, // Add deadline to the message
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
      // Refer to primaryType
      Message: [
        { name: "note", type: "string" },
        { name: "deadline", type: "uint256" },
      ],
    },
  };
console.log(msgParams);
    signInSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);

    console.log("sig is: " + signInSignature);
await mine(601);
    await expect (enclave.connect(user).recoverAddressFromSignature(signInSignature, msg, deadline)).to.be.revertedWith("time expired");


  }); 
});

describe("getApprovedAddrTimeExpired", function() {
  it("Should fail due to time on the signature expiring", async function () {
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
        verifyingContract: enclaveAddress,
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
        deadline: deadline
    },
    // Refers to the keys of the *types* object below.
    primaryType: "Message",
    types: {
        Message: [
            { name: "note", type: "string" },
            { name: "deadline", type: "uint256" }
        ],
    }
};

    signInSignature = await user.signTypedData(msgParams.domain, msgParams.types, msgParams.message);

    console.log("sig is: " + signInSignature);
await mine(601);
    await expect (enclave.connect(user).getApprovedAddr(signInSignature, msg, 0, deadline)).to.be.revertedWith("time expired");

  }); 
});
