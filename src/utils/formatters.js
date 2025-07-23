// utils/formatters.js

// Format address for display (shortened version)
export function formatAddress(address) {
  if (!address) return '';
  return address.substring(0, 5) + '...' + address.substring(38, 42);
}

// Format ETH amount from wei
export function formatEthAmount(weiAmount, decimals = 4) {
  const ethAmount = weiAmount / 1000000000000000000;
  return ethAmount.toFixed(decimals);
}

// Format number string (add leading zero if starts with decimal)
export function formatNumberString(numString) {
  if (numString.startsWith('.')) {
    return '0' + numString;
  }
  return numString;
}

// Convert hex string to address
export function hexToAddress(hexString) {
  return "0x" + hexString.slice(-40);
}

// Convert hex string to uint256
export function hexToUint256(hexString) {
  return parseInt(hexString, 16);
}

// Format fee display
export function formatFee(feeWei) {
  if (feeWei === 0) {
    return "0";
  }
  const fee = feeWei / 1000000000000000000;
  return fee.toFixed(4);
}

// Format gas display for admin table
export function formatGasForAdmin(gasWei) {
  if (gasWei === 0) {
    return "N/A";
  }
  const gas = gasWei / 1000000000000000000;
  return gas.toFixed(15);
}

// Format fee display for admin table
export function formatFeeForAdmin(feeWei) {
  if (feeWei === 0) {
    return "N/A";
  }
  const fee = feeWei / 1000000000000000000;
  return fee.toFixed(6);
}

// Format USD value
export function formatUsdValue(ethAmount, ethPrice) {
  const usdValue = ethAmount * ethPrice;
  return usdValue.toFixed(2);
}