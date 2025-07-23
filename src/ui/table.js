// ui/table.js
import { getTransactionData } from '../services/contracts.js';
import { formatAddress, formatEthAmount, formatFee } from '../utils/formatters.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { createHoverPopup } from './popups.js';
import { getCurrentAccount } from '../services/wallet.js';
import { ADDRESSES, MESSAGES, APP_CONFIG, COLORS } from '../config/constants.js';

let currentPage = 1;

// Generate transaction table
export async function generateTable(startPoint, endPoint, txnCount, signature, deadline) {
  let table = document.getElementById("container");
  if (table !== null) {
    table.innerHTML = '';
  }
  
  const totalPages = Math.ceil(txnCount / APP_CONFIG.PAGE_SIZE);
  table.createTBody();
  
  // Create header row
  createTableHeader(table);
  
  console.log("True startPoint:", startPoint);
  console.log("True endPoint:", endPoint);
  
  let iterations = endPoint - startPoint;
  const result = await getTransactionData(signature, MESSAGES.LOGIN, deadline, startPoint, endPoint);
  
  // Process each transaction
  for (let i = iterations; i > 0; i--) {
    const currentStruct = result[i - 1];
    console.log("current struct:", currentStruct);
    
    createTransactionRow(table, currentStruct, signature);
  }
  
  // Create footer with pagination
  createTableFooter(table, currentPage, totalPages, startPoint, endPoint, txnCount, signature, deadline);
}

// Create table header
function createTableHeader(table) {
  let headerRow = table.insertRow();
  
  const headers = ["Block Num", "Recipient", "Sender", "Amount", "Available Balance"];
  headers.forEach(headerText => {
    let header = headerRow.insertCell();
    header.innerHTML = headerText;
  });
}

// Create individual transaction row
function createTransactionRow(table, currentStruct, signature) {
  let row = table.insertRow();
  let blockCell = row.insertCell();
  let recipientCell = row.insertCell();
  let sendingWalletCell = row.insertCell();
  let amountCell = row.insertCell();
  let availBalanceCell = row.insertCell();
  
  // Set block number
  blockCell.innerHTML = currentStruct.blocknum;
  
  // Process recipient and sender data
  const _recip = currentStruct.recipient;
  const currentSender = currentStruct.sendingWallet;
  const lowerRecip = _recip.toLowerCase();
  const lowerSender = currentSender.toLowerCase();
  
  // Set recipient display
  if (_recip == ADDRESSES.HOST) {
    recipientCell.innerHTML = "DEPOSIT";
  } else if (lowerRecip == lowerSender) {
    recipientCell.innerHTML = "WITHDRAW";
  } else {
    recipientCell.innerHTML = formatAddress(_recip);
  }
  
  // Set sender display
  const sender = formatAddress(currentStruct.sendingWallet);
  sendingWalletCell.innerHTML = sender;
  sendingWalletCell.style.width = "100px";
  
  // Set amount display
  const amt = formatEthAmount(currentStruct.amount);
  const hostAddressString = ADDRESSES.HOST.toString();
  const currentAccount = getCurrentAccount();
  
  if (_recip == hostAddressString) {
    amountCell.innerHTML = `+ ${amt} ETH`;
  } else if (lowerRecip == currentAccount?.toLowerCase() && lowerSender != currentAccount?.toLowerCase()) {
    amountCell.innerHTML = `+ ${amt} ETH`;
  } else {
    amountCell.innerHTML = `(${amt}) ETH`;
    amountCell.style.color = COLORS.OUTGOING;
  }
  
  // Set available balance
  const availBal = formatEthAmount(currentStruct.availBal);
  availBalanceCell.innerHTML = `${availBal} ETH`;
  
  // Add event listeners
  setupCellEvents(recipientCell, sendingWalletCell, amountCell, _recip, currentSender, currentStruct);
}

// Setup event listeners for table cells
function setupCellEvents(recipientCell, sendingWalletCell, amountCell, _recip, currentSender, currentStruct) {
  let isClicked = false;
  
  // Amount cell hover for fee/gas info
  const fee = formatFee(currentStruct.fee);
  const gas = ".00003"; // From constants
  
  amountCell.addEventListener("mouseover", function() {
    if (!this.dataset.originalColor) {
      this.dataset.originalColor = getComputedStyle(this).color;
    }
    this.style.color = COLORS.HOVER;
    const popup = createHoverPopup(`Fee: ${fee} ETH & Gas: ${gas} ETH`);
    amountCell.appendChild(popup);
    amountCell.classList.add('centered');
  });
  
  amountCell.addEventListener("mouseout", function() {
    this.style.color = this.dataset.originalColor;
    const popup = amountCell.querySelector(".popup");
    if (popup) amountCell.removeChild(popup);
  });
  
  // Recipient cell events
  setupClickableCellEvents(recipientCell, _recip, isClicked);
  setupClickableCellEvents(sendingWalletCell, currentSender, isClicked);
  
  // Add CSS classes
  amountCell.setAttribute("class", "hoverable");
  recipientCell.setAttribute("class", "hoverable");
  sendingWalletCell.setAttribute("class", "hoverable");
}

// Setup clickable cell events (copy functionality)
function setupClickableCellEvents(cell, fullAddress, isClicked) {
  cell.addEventListener("mouseover", function() {
    if (isClicked) return;
    cell.style.color = COLORS.HOVER;
    
    const existingPopup = cell.querySelector(".popup");
    if (existingPopup) existingPopup.remove();
    
    const popup = createHoverPopup(fullAddress);
    cell.appendChild(popup);
    cell.classList.add('centered');
  });
  
  cell.addEventListener("mouseout", function() {
    if (isClicked) return;
    cell.style.color = COLORS.DEFAULT;
    const popup = cell.querySelector(".popup");
    if (popup) popup.remove();
  });
  
  cell.addEventListener("click", function() {
    isClicked = true;
    copyToClipboard(fullAddress);
    
    const existingPopup = cell.querySelector('.popup');
    if (existingPopup) existingPopup.remove();
    
    const popup = createHoverPopup("copied!");
    popup.textContent = "copied!";
    cell.appendChild(popup);
    cell.classList.add('centered');
    
    setTimeout(() => {
      isClicked = false;
      if (popup.parentNode) popup.remove();
      cell.style.color = COLORS.DEFAULT;
    }, 1000);
  });
}

// Create table footer with pagination
function createTableFooter(table, currentPage, totalPages, startPoint, endPoint, txnCount, signature, deadline) {
  let footerRow = table.insertRow();
  let leftFooter = footerRow.insertCell();
  leftFooter.className = "footerArrows";
  leftFooter.innerHTML = "<";
  
  let recipiantFooter = footerRow.insertCell();
  recipiantFooter.innerHTML = "";
  
  let sendingFooter = footerRow.insertCell();
  sendingFooter.innerHTML = `Viewing page ${currentPage} of ${totalPages}`;
  
  let amountFooter = footerRow.insertCell();
  amountFooter.innerHTML = "";
  
  let rightFooter = footerRow.insertCell();
  rightFooter.className = "footerArrows";
  rightFooter.innerHTML = ">";
  
  // Pagination event listeners
  setupPaginationEvents(leftFooter, rightFooter, startPoint, endPoint, txnCount, signature, deadline);
}

// Setup pagination click events
function setupPaginationEvents(leftFooter, rightFooter, startPoint, endPoint, txnCount, signature, deadline) {
  leftFooter.addEventListener("click", function() {
    if (currentPage > 1) {
      currentPage--;
      const newStartPoint = endPoint;
      const newEndPoint = endPoint + APP_CONFIG.PAGE_SIZE;
      document.getElementById("container").innerHTML = '';
      generateTable(newStartPoint, newEndPoint, txnCount, signature, deadline);
    }
  });
  
  rightFooter.addEventListener("click", function() {
    if (txnCount > currentPage * APP_CONFIG.PAGE_SIZE) {
      let newStartPoint, newEndPoint;
      
      if (startPoint - APP_CONFIG.PAGE_SIZE >= 0) {
        currentPage++;
        newStartPoint = startPoint - APP_CONFIG.PAGE_SIZE;
        newEndPoint = endPoint - APP_CONFIG.PAGE_SIZE;
      } else {
        currentPage++;
        newStartPoint = 0;
        newEndPoint = endPoint - APP_CONFIG.PAGE_SIZE;
      }
      
      document.getElementById("container").innerHTML = '';
      generateTable(newStartPoint, newEndPoint, txnCount, signature, deadline);
    }
  });
}

// Clear table
export function clearTable() {
  const table = document.getElementById('container');
  if (table) table.remove();
}