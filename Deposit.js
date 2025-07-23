// Deposit.js
import { ethers } from "./ethers/dist/ethers.esm.min.js";
import { hostABI } from './abi_Host.js';
import { USDCabi } from './USDC_future/USDC_abi.js';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION & STATE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Contract addresses
let hostAddress = "0x4d48c82CA673ae0816881113EF90ba46ccfD62cc";
let USDCaddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
let hostAddressString = hostAddress.toString();

// Network configuration
let hostNetwork = '0x61'; // BSC Testnet
let hostNetworkSettings = ethers.providers.getNetwork(hostNetwork);

// Provider and contract instances
let hostProvider = null;
let hostSigner = null;
let hostContract = null;
let USDCcontract = null;

// Application state
let currentAccount = null;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

connectButton.addEventListener("click", connect);
depositButton.addEventListener("click", bankDeposit);

// Deposit tooltip
const depositTip = document.getElementById("depositTip");

depositTip.addEventListener("mouseenter", function() {
  const popupTip = document.createElement("div");
  popupTip.className = "tip";
  popupTip.innerHTML = "Funds deposited on this page will only be available to the depositing address. On the Account Summary page, you can view those assets and send them to other wallets in private.";
  depositTip.appendChild(popupTip);
});

depositTip.addEventListener("mouseleave", function() {
  const popupTip = depositTip.querySelector(".tip");
  if (popupTip) {
    depositTip.removeChild(popupTip);
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NETWORK & CONNECTION FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function loadAllETH() {
  hostProvider = new ethers.providers.Web3Provider(window.ethereum);
  hostNetworkSettings = ethers.providers.getNetwork(hostNetwork);
  hostSigner = hostProvider.getSigner();
  hostContract = new ethers.Contract(hostAddress, hostABI, hostSigner);
  USDCcontract = new ethers.Contract(USDCaddress, USDCabi, hostSigner);
}

async function correctChainETH() {
  let chainId = await window.ethereum.request({ method: 'eth_chainId' });
  
  if (chainId === hostNetwork) {
    console.log("You are on the correct network");
  } else {
    console.log("Switching to the correct network");
    
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }],
      });
    } catch (switchError) {
      // Chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x61',
                chainName: 'bsc-testnet',
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
    }
  }
  
  chainId = await window.ethereum.request({ method: 'eth_chainId' });
  await loadAllETH();
  console.log("Chain updated!");
}

async function connect() {
  console.log("Connecting...");
  
  if (typeof window.ethereum !== "undefined") {
    await ethereum.request({ method: "eth_requestAccounts" });
  }
  
  const accounts = await ethereum.request({ method: "eth_accounts" });
  let currentAccount = accounts[0];
  
  handleAccountsChanged(accounts);
  await correctChainETH();
  await originCheck(currentAccount);
}

async function handleAccountsChanged(accounts) {
  console.log("Account changed");
  
  if (accounts.length === 0) {
    document.getElementById('connectButton').innerHTML = "CONNECT";
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    document.getElementById('connectButton').innerHTML = "CONNECTED!";
  }
}

async function originCheck(currentAccount) {
  document.getElementById('AccountDetails').innerHTML = 
    `Now connected to wallet:<br> <span style='font-size: 60%; margin-left:8%; font-weight:200; font-style: italic;'>${currentAccount}</span>`;
  console.log("Current account:", currentAccount);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DEPOSIT FUNCTIONALITY
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function bankDeposit() {
  const _payload = document.getElementById('depositField').value;
  
  if (_payload < 0.001) {
    showTXNpopup();
    document.querySelector('.txnPopupContainer').innerHTML = "Deposits must be .001 ETH or greater.";
    return;
  }
  
  try {
    const options = { value: ethers.utils.parseEther(_payload) };
    const tx = await hostContract.deposit(options);
    
    showLoadingAnimation();
    const receipt = await tx.wait();
    hideLoadingAnimation();
    showTXNpopup();
    
    if (receipt.status === 1) {
      console.log('Deposit transaction was successful.');
      document.querySelector('.txnPopupContainer').innerHTML = 
        "Congratulations! The Deposit was successful. Please allow 5 to 10 minutes for the funds to settle before they become available for transfer or withdraw.";
    } else {
      console.error('Deposit transaction failed.');
      document.querySelector('.txnPopupContainer').innerHTML = 
        "The Deposit failed. Check your wallet balance is greater than the amount being deposited and that you have enough to cover gas.";
    }
  } catch (error) {
    hideLoadingAnimation();
    showTXNpopup();
    console.error('Deposit error:', error);
    document.querySelector('.txnPopupContainer').innerHTML = 
      "The Deposit failed. Check your wallet balance and try again.";
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UI UTILITY FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Show loading animation
async function showLoadingAnimation() {
  document.querySelector('.loading-container').style.display = 'flex';
}

// Hide loading animation
async function hideLoadingAnimation() {
  document.querySelector('.loading-container').style.display = 'none';
}

// Show transaction popup
async function showTXNpopup() {
  document.querySelector('.txnPopupContainer').style.display = 'flex';
  document.querySelector('.txnPopupBg').style.display = 'flex';
  
  const txnPopupBg = document.getElementById("txnPopupBg");
  txnPopupBg.addEventListener("click", function() {
    document.querySelector('.txnPopupContainer').style.display = 'none';
    document.querySelector('.txnPopupBg').style.display = 'none';
  });
}

// Hide transaction popup
async function hideTXNpopup() {
  document.querySelector('.txnPopupContainer').style.display = 'none';
}