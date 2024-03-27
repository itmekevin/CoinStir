/*
DEPLOYMENT INSTRUCTIONS:

1) Create hardhat project, upload all 4 contracts, and use this file for hardhat.config.js.
2) Run the following task with included params: npx hardhat deploy-enclave --network oasistest --host-network bsc
3) Take the address of the newly deployed enclave contract, and pass as a param in the following function: npx hardhat deploy-host --network bsc --enclaveaddr <insert the enclave address here>
*/

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-toolbox/network-helpers");
require("solidity-coverage");

const { HardhatUserConfig, task } = require('hardhat/config');
const { ethers } = require("ethers");

const oasis_API_KEY = "https://testnet.sapphire.oasis.dev";
const INFURA_API_KEY = "https://public.stackup.sh/api/v1/node/bsc-testnet";
const WALLET_KEY = "fb55ff6133a9674e59e3de02bce7fb3d810c700ff30fbafd035b93af45f4434f";
const adminKey = "7b39d312e9335eb3bfe7bf570e2d7b352da33bc85e5ee971f773421b9b417f08";

let libAddr;


module.exports = {
  solidity: "0.8.24",
  networks: {
    oasistest: {
      url: oasis_API_KEY,
      accounts: [WALLET_KEY, adminKey],
      chainId: 23295,
    },
    bsc: {
      url: INFURA_API_KEY,
      accounts: [WALLET_KEY, adminKey],
      chainId: 97,
    }
  }
};

task("calc-enclave", "calculates next enclave address")
    .setAction(async (args, hre) => {
    await hre.run('compile');
    const ethers = hre.ethers;
    const accounts = await ethers.getSigners();
    let first = accounts[0].address;
    console.log(first);

    const provider = await new ethers.JsonRpcProvider("https://testnet.sapphire.oasis.dev");

    let nonce = await provider.getTransactionCount(first);
            console.log("Deploying Address: " + first);
            console.log("and here is the nonce: " + nonce);

    calculateContractAddress()
    .then(contractAddress => {
        console.log("Future Enclave Contract Address:", contractAddress);
    })
    .catch(error => {
        console.error("Error calculating contract address:", error);
    });


    
    async function calculateContractAddress() {
        let from = first;
        nextHostAddr = ethers.getCreateAddress({from, nonce});
    return nextHostAddr;
    }
});


task("deploy-library", "launches the VerifyTypedData library")
    .setAction(async (args, hre) => {
    const ethers = hre.ethers;
        const accounts = await ethers.getSigners();
        const lib = await ethers.getContractFactory('VerifyTypedData');
        const library = await lib.deploy();
        await library.waitForDeployment();
        libAddr = await library.getAddress();
            console.log('library deployed to address: ' + libAddr);
});


task("deploy-enclave", "calculates host address and deploys enclave")
    .addParam('hostNetwork')
    .setAction(async (args, hre) => {
    await hre.run('compile');
    const ethers = hre.ethers;
    const accounts = await ethers.getSigners();
    const StirEnclave = await ethers.getContractFactory('StirEnclave', {
        libraries: {
        VerifyTypedData: "0xa6CDAB56cAc4Cd47Ca3875658334ca6c1Ad66062",
        },
    });
    let first = accounts[0].address;
    let nextHostAddr;

    const hostConfig = hre.config.networks[args.hostNetwork];
    if (!('url' in hostConfig)) throw new Error(`${args.hostNetwork} not configured`);
    const provider = await new ethers.JsonRpcProvider(hostConfig.url, undefined, { staticNetwork: true });
    
    let nonce = await provider.getTransactionCount(first);
            console.log("Deploying Address: " + first);
            console.log("and here is the nonce: " + nonce);

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

    const enclave = await StirEnclave.deploy(nextHostAddr);
    await enclave.waitForDeployment();
    const thisAddr = await enclave.getAddress();
        console.log('StirEnclave deployed to address: ' + thisAddr);

});


task("deploy-host", "launches host address, requires enclave deployed address")
    .addParam('enclaveaddr')
    .setAction(async (args, hre) => {
    const ethers = hre.ethers;
    const _currentEnclave = [args.enclaveaddr];
    const currentEnclave = _currentEnclave.toString();
        const [deployer] = await ethers.getSigners();
            console.log("deploying from the address: " + deployer.address);
        const StirHost = await ethers.getContractFactory('StirHost');
        const host = await StirHost.deploy(currentEnclave);
        await host.waitForDeployment();
        const thisAddr = await host.getAddress();
            console.log('StirHost deployed to address: ' + thisAddr);
});

