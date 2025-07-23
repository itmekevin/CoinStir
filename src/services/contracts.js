// services/contracts.js
import { contract, contractCall, enclaveProviderStatic } from '../config/network.js';
import { ADDRESSES, MESSAGES } from '../config/constants.js';
import { hexToAddress, hexToUint256 } from '../utils/formatters.js';
import { updateAccountState } from './wallet.js';

// Get current address and transaction count from signature
export async function getCurrentAndQuantity(deadline, signature) {
  const functionName = 'recoverAddressFromSignature';
  const functionArgs = [signature, MESSAGES.LOGIN, deadline];
  console.log("Function args:", functionArgs);
  
  const data = contractCall.interface.encodeFunctionData(functionName, functionArgs);
  const fromAddress = ADDRESSES.RELAYER;
  
  const call = {
    to: ADDRESSES.ENCLAVE,
    data: data,
    from: fromAddress,
  };
  
  console.log("Contract call:", call);
  
  // Perform the eth_call
  let returnData = await enclaveProviderStatic.send('eth_call', [call, 'latest']);
  console.log("Contract response:", returnData);
  
  // Extract data from return
  const recoveredAddress = hexToAddress(returnData.slice(26, 66));
  const txnCount = hexToUint256(returnData.slice(66, 130));
  const bal = hexToUint256(returnData.slice(130, 194));
  
  console.log("Recovered Address:", recoveredAddress);
  console.log("Transaction Count:", txnCount);
  console.log("Balance:", bal);
  
  // Update application state
  updateAccountState(recoveredAddress, txnCount, bal);
  
  return txnCount;
}

// Get transaction data for table
export async function getTransactionData(signature, message, deadline, startPoint, endPoint) {
  return await contractCall.callStatic.recoverAddrTXNdata(signature, message, deadline, startPoint, endPoint);
}

// Create meta transaction
export async function createMetaTransaction(data) {
  console.log("Creating meta transaction with data:", data);
  const result = await contract.createmetaTXN(data);
  console.log("Meta transaction result:", result);
  return result;
}

// Calculate current fee rate
export async function calculateFeeRate() {
  // Placeholder for NFT balance check
  // const result = await getNFTBalance();
  // if (result > minNFT) {
  //   return 5;
  // }
  const feeRate = 10; // Default fee rate
  console.log("Current Fee % (div by 10) =", feeRate);
  return feeRate;
}

// Admin functions
export async function claimFee() {
  await contract.claimFee();
  console.log("Fee claimed");
}

export async function reclaimGas() {
  await contract.claimGas();
  console.log("Gas reclaimed");
}

export async function grantAuthority(newAuthority) {
  await contract.grantAuth(newAuthority);
  console.log("Authority granted to:", newAuthority);
}

export async function setFeeWallet(newFeeWallet) {
  await contract.setFeeWallet(newFeeWallet);
  console.log("Fee wallet set to:", newFeeWallet);
}

// Admin table functions
export async function getAdminTransactionList(signature, message, address) {
  return await contract.callStatic.authGetTxnList(signature, message, address);
}

export async function getAdminTransactionInfo(signature, message, address, startPoint, endPoint) {
  return await contract.callStatic.authGetTXNinfo(signature, message, address, startPoint, endPoint);
}