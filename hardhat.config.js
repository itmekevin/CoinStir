/*
DEPLOYMENT INSTRUCTIONS:

1) Create hardhat project, upload all 4 contracts, and use this file for hardhat.config.js.
2) Run the following task with included params: npx hardhat deploy-enclave --network oasistest --host-network goerli
3) Take the address of the newly deployed enclave contract, and pass as a param in the following function: npx hardhat deploy-host --network goerli --enclaveaddr <insert the enclave address here>
*/

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-toolbox/network-helpers");
require("solidity-coverage");

const { HardhatUserConfig, task } = require('hardhat/config');
const { ethers } = require("ethers");

const oasis_API_KEY = "https://testnet.sapphire.oasis.dev";
const INFURA_API_KEY = "https://goerli.infura.io/v3/c893b23e8bb14c85899887b76b2bd363";
const WALLET_KEY = "fb55ff6133a9674e59e3de02bce7fb3d810c700ff30fbafd035b93af45f4434f";
const adminKey = "7b39d312e9335eb3bfe7bf570e2d7b352da33bc85e5ee971f773421b9b417f08";


module.exports = {
  solidity: "0.8.24",
  networks: {
    oasistest: {
      url: oasis_API_KEY,
      accounts: [WALLET_KEY, adminKey],
      chainId: 23295,
    },
    goerli: {
      url: INFURA_API_KEY,
      accounts: [WALLET_KEY, adminKey],
      chainId: 5,
    }
  }
};


task("deploy-enclave", "calculates host address and deploys enclave")
    .addParam('hostNetwork')
    .setAction(async (args, hre) => {
    await hre.run('compile');
    const ethers = hre.ethers;
    const accounts = await ethers.getSigners();
    const StirEnclave = await ethers.getContractFactory('StirEnclave');
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


