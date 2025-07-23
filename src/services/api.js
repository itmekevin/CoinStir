// services/api.js
import { API } from '../config/constants.js';

// Get current ETH price from Etherscan API
export async function getEthPrice() {
  const apiUrl = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${API.ETH_PRICE_KEY}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Network problem');
    }
    const data = await response.json();
    return data.result.ethusd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return null;
  }
}

// Submit withdrawal transaction via Lambda API
export async function submitWithdrawalTransaction(result, numString, gasPrice, feeRate) {
  const url = `${API.WITHDRAW_ENDPOINT}?result=${result}&numString=${numString}&gasPrice=${gasPrice}&feeRate=${feeRate}`;
  console.log("API Call:", url);
  
  const options = {
    method: 'POST',
  };
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Data received:', data.status);
    return data.status;
  } catch (error) {
    console.error('Error with withdrawal API:', error);
    throw error;
  }
}