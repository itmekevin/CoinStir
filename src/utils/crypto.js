// utils/crypto.js
import { EIP712_DOMAIN } from '../config/constants.js';

// Create EIP-712 signature for login
export async function createLoginSignature(message, deadline) {
  const from = await ethereum.request({ method: "eth_requestAccounts" });
  
  const msgParams = JSON.stringify({
    domain: EIP712_DOMAIN,
    message: {
      note: message,
      deadline: deadline,
    },
    primaryType: "Message",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Message: [
        { name: "note", type: "string" },
        { name: "deadline", type: "uint256" },
      ],
    },
  });
  
  return await signTypedData(from[0], msgParams);
}

// Create EIP-712 signature for transactions
export async function createTransactionSignature(recipient, value, nonce) {
  const from = await ethereum.request({ method: "eth_requestAccounts" });
  
  const msgParams = JSON.stringify({
    domain: EIP712_DOMAIN,
    message: {
      recipiant: recipient,
      value: value,
      nonce: nonce
    },
    primaryType: "Message",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Message: [
        { name: "recipiant", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" }
      ],
    },
  });
  
  return await signTypedData(from[0], msgParams);
}

// Create EIP-712 signature for withdrawals
export async function createWithdrawSignature(recipient, value, nonce) {
  const from = await ethereum.request({ method: "eth_requestAccounts" });
  
  const msgParams = JSON.stringify({
    domain: EIP712_DOMAIN,
    message: {
      recipient: recipient,
      value: value,
      nonce: nonce,
    },
    primaryType: "Message",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Message: [
        { name: "recipient", type: "address" },
        { name: "value", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    },
  });
  
  return await signTypedData(from[0], msgParams);
}

// Generic typed data signing function
async function signTypedData(fromAddress, msgParams) {
  return new Promise((resolve, reject) => {
    window.ethereum.sendAsync(
      {
        method: "eth_signTypedData_v4",
        params: [fromAddress, msgParams],
        from: fromAddress,
      },
      function (err, result) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        if (result.error) {
          console.error(result.error.message);
          reject(result.error);
          return;
        }
        console.log("TYPED SIGNED:", result.result);
        resolve(result.result);
      }
    );
  });
}