// ui/display.js
import { getEthPrice } from '../services/api.js';
import { getBalance, getCurrentAccount } from '../services/wallet.js';
import { formatEthAmount, formatUsdValue } from '../utils/formatters.js';
import { createHoverPopup } from './popups.js';
import { COLORS } from '../config/constants.js';

// Update balance display in UI
export async function updateBalanceDisplay() {
  const price = await getEthPrice();
  if (!price) return;
  
  const priceFormatted = parseFloat(price).toFixed(2);
  const balanceWei = getBalance();
  const balanceEth = parseFloat(formatEthAmount(balanceWei));
  const balanceEthFormatted = balanceEth.toFixed(4);
  
  // Update ETH balance display
  document.getElementById('bal').innerHTML = 
    `ETH Balance:<br> <span style='font-size: smaller; font-style: italic;margin-left:12.5vw;'>&#926; ${balanceEthFormatted}</span>`;
  
  // Update USD value display
  const usdValue = formatUsdValue(balanceEth, 3500); // Using fixed price for now
  document.getElementById('balusd').innerHTML = 
    `Dollar Value: <br> <span style='font-size: smaller; font-style: italic;margin-left:12.5vw;'>$${usdValue}</span>`;
  
  // Add hover events for USD display
  setupBalanceHoverEvents(priceFormatted);
}

// Update account display in UI
export function updateAccountDisplay() {
  const account = getCurrentAccount();
  console.log("Displaying account:", account);
  
  document.getElementById('originID').innerHTML = 
    `Now viewing the account:<br> <span style='font-size: smaller; margin-left:12.5vw; font-style: italic;'>${account}</span>`;
}

// Setup hover events for balance USD display
function setupBalanceHoverEvents(price) {
  const balusd = document.getElementById('balusd');
  
  balusd.addEventListener("mouseover", function() {
    balusd.style.color = COLORS.HOVER;
    const popup = createHoverPopup(`$ ${price}`);
    balusd.appendChild(popup);
    balusd.classList.add('centered');
  });
  
  balusd.addEventListener("mouseout", function() {
    balusd.style.color = COLORS.DEFAULT;
    const popup = balusd.querySelector(".popup");
    if (popup) {
      balusd.removeChild(popup);
    }
  });
}