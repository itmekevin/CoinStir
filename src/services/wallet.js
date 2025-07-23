// services/wallet.js
import { initializeNetwork, switchToCorrectChain, provider } from '../config/network.js';
import { createLoginSignature } from '../utils/crypto.js';
import { MESSAGES } from '../config/constants.js';
import { getCurrentAndQuantity } from './contracts.js';
import { updateBalanceDisplay, updateAccountDisplay } from '../ui/display.js';
import { generateTable } from '../ui/table.js';
import { APP_CONFIG } from '../config/constants.js';

// Application state
export let signInSignature = null;
export let currentAccount = null;
export let txnCount = null;
export let bal = null;
export let deadline = null;

// Connect wallet and initialize application
export async function connectWallet() {
  console.log("Connecting wallet...");
  
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not detected");
  }
  
  await ethereum.request({ method: "eth_requestAccounts" });
  const accounts = await ethereum.request({ method: "eth_accounts" });
  
  await window.ethereum.request({
    method: 'eth_blockNumber'
  });
  
  await switchToCorrectChain();
  await initializeNetwork();
  await performLogin();
  
  document.getElementById('connectButton').innerHTML = "CONNECTED!";
}

// Perform login flow with signature
async function performLogin() {
  const from = await ethereum.request({ method: "eth_requestAccounts" });
  
  let _deadline = await provider.getBlockNumber();
  deadline = _deadline.toString();
  console.log("User deadline:", deadline);
  
  console.log("Creating login signature...");
  console.log("Account:", from[0]);
  
  signInSignature = await createLoginSignature(MESSAGES.LOGIN, deadline);
  console.log("Login signature created:", signInSignature);
  
  // Get account data
  txnCount = await getCurrentAndQuantity(deadline, signInSignature);
  updateBalanceDisplay();
  updateAccountDisplay();
  
  console.log(`Account ${currentAccount} has completed ${txnCount} transactions`);
  
  // Generate initial table
  let startPoint, endPoint;
  if (txnCount > APP_CONFIG.PAGE_SIZE) {
    startPoint = txnCount - APP_CONFIG.PAGE_SIZE;
    endPoint = txnCount;
  } else {
    startPoint = 0;
    endPoint = txnCount;
  }
  
  generateTable(startPoint, endPoint, txnCount, signInSignature, deadline);
  console.log("Transaction count:", txnCount);
}

// Update account state
export function updateAccountState(account, count, balance) {
  currentAccount = account;
  txnCount = count;
  bal = balance;
}

// Getters for state
export function getSignInSignature() {
  return signInSignature;
}

export function getCurrentAccount() {
  return currentAccount;
}

export function getTxnCount() {
  return txnCount;
}

export function getBalance() {
  return bal;
}

export function getDeadline() {
  return deadline;
}