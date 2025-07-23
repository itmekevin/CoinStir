// config/network.js
import { ethers } from "../../ethers/dist/ethers.esm.min.js";
import * as sapphire from "../../bundle.js";
import { NETWORK, ADDRESSES } from './constants.js';
import { enclaveABI } from "../../abi_Enclave.js";
import { relayerABI } from "../../abi_relayer.js";

// Network providers and signers
export let provider = null;
export let enclaveSigner = null;
export let providerStatic = null;
export let enclaveProviderStatic = null;

// Contract instances
export let contract = null;
export let relayerContract = null;
export let contractCall = null;

// Initialize all network connections and contracts
export async function initializeNetwork() {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  const enclaveNetworkSettings = ethers.providers.getNetwork(NETWORK.CHAIN_ID);
  enclaveSigner = provider.getSigner();
  
  providerStatic = sapphire.wrap(
    new ethers.providers.JsonRpcProvider(NETWORK.BSC_RPC_URL)
  );
  
  enclaveProviderStatic = sapphire.wrap(
    new ethers.providers.JsonRpcProvider(NETWORK.RPC_URL)
  );
  
  contract = new ethers.Contract(ADDRESSES.ENCLAVE, enclaveABI, enclaveSigner);
  relayerContract = new ethers.Contract(ADDRESSES.RELAYER, relayerABI, enclaveSigner);
  contractCall = new ethers.Contract(ADDRESSES.ENCLAVE, enclaveABI, enclaveProviderStatic);
}

// Switch to correct network
export async function switchToCorrectChain() {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  console.log("Current chain ID:", chainId);
  
  if (chainId === NETWORK.CHAIN_ID) {
    console.log("You are on the correct network");
    return;
  }
  
  console.log("Switching to the correct network");
  
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK.CHAIN_ID }],
    });
  } catch (switchError) {
    // Chain hasn't been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: NETWORK.CHAIN_ID,
              chainName: NETWORK.NAME,
              rpcUrls: [NETWORK.RPC_URL],
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add network:", addError);
        throw addError;
      }
    } else {
      console.error("Failed to switch network:", switchError);
      throw switchError;
    }
  }
}