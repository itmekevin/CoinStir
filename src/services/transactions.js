// services/transactions.js
import { ethers } from "../../ethers/dist/ethers.esm.min.js";
import { createTransactionSignature, createWithdrawSignature } from '../utils/crypto.js';
import { formatNumberString } from '../utils/formatters.js';
import { createMetaTransaction, calculateFeeRate } from './contracts.js';
import { relayerContract, provider } from '../config/network.js';
import { submitWithdrawalTransaction } from './api.js';
import { showLoadingAnimation, hideLoadingAnimation } from '../ui/animations.js';
import { showTransactionPopup, setTransactionPopupMessage } from '../ui/popups.js';
import { getCurrentAndQuantity } from './contracts.js';
import { generateTable } from '../ui/table.js';
import { getTxnCount, getBalance, getSignInSignature, getDeadline, getCurrentAccount, currentAccount } from './wallet.js';
import { MESSAGES, APP_CONFIG } from '../config/constants.js';

let isInternal = false;

// Send transaction through enclave
export async function sendTransaction() {
  const desty = document.getElementById('recipientField').value;
  const _num = document.getElementById('valueField').value;
  const num = ethers.utils.parseEther(_num);
  const numString = formatNumberString(_num);
  
  console.log("Transaction count:", getTxnCount());
  console.log("Destination address:", desty);
  console.log("Amount string:", numString);
  
  // Create transaction signature
  const txnSignature = await createTransactionSignature(desty, numString, getTxnCount());
  
  // Format transaction data
  const transactionData = {
    _payload: num,
    _dest: desty,
    _signature: txnSignature,
    nonce: getTxnCount()
  };
  
  console.log("Transaction data:", transactionData);
  const result = await createMetaTransaction(transactionData);
  console.log("Meta transaction result:", result);
  
  await calculateFeeRate();
  
  // Check if user has sufficient funds
  const numint = parseInt(num);
  const feeRateint = parseInt(await calculateFeeRate());
  const gasPriceint = parseInt(ethers.utils.parseEther(".00003"));
  
  const userBalance = getBalance();
  const requiredFunds = numint + feeRateint + gasPriceint;
  
  console.log(`User has: ${userBalance} vs. required: ${requiredFunds} (delta: ${userBalance - requiredFunds})`);
  
  if (userBalance >= requiredFunds) {
    await processTransactionWithRelayer(result, numString, gasPriceint, feeRateint);
  } else {
    console.log("Transaction failed - insufficient funds");
    showTransactionPopup();
    setTransactionPopupMessage(MESSAGES.INSUFFICIENT_FUNDS);
  }
}

// Process transaction with on-chain relayer
async function processTransactionWithRelayer(result, numString, gasPrice, feeRate) {
  gasPrice = gasPrice._isBigNumber ? gasPrice.toString() : gasPrice;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("Formatting call data for relayer...");
  
  try {
    const formattedCallData = await relayerContract.format(
      result,
      numString,
      parseInt(gasPrice),
      parseInt(feeRate),
      isInternal
    );
    console.log("Call data formatted");
    
    showLoadingAnimation();
    
    const proxyTxData = await relayerContract.makeProxyTx(formattedCallData);
    console.log("Proxy transaction created");
    
    // Submit transaction
    const txResponse = await provider.sendTransaction(proxyTxData);
    console.log("Transaction sent:", txResponse.hash);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    handleTransactionResult(receipt.status);
    
  } catch (error) {
    console.error('On-chain relayer error:', error);
    handleTransactionError(error);
  }
}

// Handle transaction result
async function handleTransactionResult(status) {
  hideLoadingAnimation();
  showTransactionPopup();
  
  if (status == 1) {
    console.log('Transaction was successful.');
    setTransactionPopupMessage(MESSAGES.SUCCESS);
    await refreshAccountData();
  } else {
    console.error('Transaction failed.');
    setTransactionPopupMessage(MESSAGES.TRANSFER_FAILED);
  }
}

// Handle transaction error
function handleTransactionError(error) {
  hideLoadingAnimation();
  showTransactionPopup();
  
  if (error.message.includes("TransactionWillFail")) {
    console.log("Pre-flight check failed");
  } else if (error.message.includes("insufficient funds")) {
    console.log("Relayer keypair needs more gas");
  } else if (error.message.includes("bad sig")) {
    console.log("Signature validation failed");
  }
  
  setTransactionPopupMessage(MESSAGES.TRANSFER_FAILED);
}

// Withdraw funds
export async function withdrawFunds() {
  const desty = currentAccount;
  const _num = document.getElementById('withdrawValueField').value;
  const num = ethers.utils.parseEther(_num);
  const numString = formatNumberString(_num);
  
  console.log("Transaction count:", getTxnCount());
  console.log("Destination address:", desty);
  console.log("Amount string:", numString);
  
  // Create transaction signature
  const txnSignature = await createTransactionSignature(desty, numString, getTxnCount());
  
  // Format transaction data
  const transactionData = {
    _payload: num,
    _dest: desty,
    _signature: txnSignature,
    nonce: getTxnCount()
  };
  
  console.log("Transaction data:", transactionData);
  const result = await createMetaTransaction(transactionData);
  console.log("Meta transaction result:", result);
  
  await calculateFeeRate();
  
  // Check if user has sufficient funds
  const numint = parseInt(num);
  const feeRateint = 0;
  const gasPriceint = parseInt(ethers.utils.parseEther(".00003"));
  
  const userBalance = getBalance();
  const requiredFunds = numint + feeRateint + gasPriceint;
  
  console.log(`User has: ${userBalance} vs. required: ${requiredFunds} (delta: ${userBalance - requiredFunds})`);
  
  if (userBalance >= requiredFunds) {
    await processTransactionWithRelayer(result, numString, gasPriceint, feeRateint);
  } else {
    console.log("Transaction failed - insufficient funds");
    showTransactionPopup();
    setTransactionPopupMessage(MESSAGES.INSUFFICIENT_FUNDS);
  }
}

// Refresh account data after transaction
async function refreshAccountData() {
  const deadline = getDeadline();
  const signature = getSignInSignature();
  
  await getCurrentAndQuantity(deadline, signature);
  console.log("Updated transaction count:", getTxnCount());
  
  // Regenerate table
  let startPoint, endPoint;
  const txnCount = getTxnCount();
  
  if (txnCount > APP_CONFIG.PAGE_SIZE) {
    startPoint = txnCount - APP_CONFIG.PAGE_SIZE;
    endPoint = txnCount;
  } else {
    startPoint = 0;
    endPoint = txnCount;
  }
  
  generateTable(startPoint, endPoint, txnCount, signature, deadline);
}

// Set internal transaction flag
export function setInternalTransaction(value) {
  isInternal = value;
}