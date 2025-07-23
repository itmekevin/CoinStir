// admin/admin.js
import { ethers } from "../../ethers/dist/ethers.esm.min.js";
import { 
  claimFee, 
  reclaimGas, 
  grantAuthority, 
  setFeeWallet,
  getAdminTransactionList,
  getAdminTransactionInfo 
} from '../services/contracts.js';
import { enclaveSigner } from '../config/network.js';
import { formatAddress, formatEthAmount, formatFeeForAdmin, formatGasForAdmin } from '../utils/formatters.js';
import { createHoverPopup } from '../ui/popups.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { ADDRESSES, APP_CONFIG } from '../config/constants.js';

let currentPage = 1;

// Admin fee management
export async function adminClaimFee() {
  await claimFee();
}

export async function adminReclaimGas() {
  await reclaimGas();
}

export async function adminSetGasPrice(newGasPrice) {
  console.log("New gas price set:", newGasPrice);
}

export async function adminSetAuthority() {
  const newAuthority = document.getElementById('setAuth').value;
  await grantAuthority(newAuthority);
}

export async function adminSetFeeWallet() {
  const newFeeWallet = document.getElementById('setWallet').value;
  await setFeeWallet(newFeeWallet);
}

// Generate admin table for specific address
export async function generateAdminTable() {
  const targetAddress = document.getElementById("usethisAddr").value;
  console.log("Generating admin table for:", targetAddress);
  
  const message = "Hello, world!";
  const messageHash = ethers.utils.solidityKeccak256(["string"], [message]);
  const messageHashBinary = ethers.utils.arrayify(messageHash);
  const signature = await enclaveSigner.signMessage(messageHashBinary);
  
  const txnCount_ = await getAdminTransactionList(signature, message, targetAddress);
  const txnCount = txnCount_.toString();
  console.log("Total transactions:", txnCount);
  
  let startPoint, endPoint;
  if (txnCount > APP_CONFIG.PAGE_SIZE) {
    startPoint = txnCount - APP_CONFIG.PAGE_SIZE;
    endPoint = txnCount;
  } else {
    startPoint = 0;
    endPoint = txnCount;
  }
  
  const totalPages = Math.ceil(txnCount / APP_CONFIG.PAGE_SIZE);
  
  await renderAdminTable(message, signature, startPoint, endPoint, txnCount, totalPages, targetAddress);
}

// Render admin table with transaction data
async function renderAdminTable(message, signature, startPoint, endPoint, txnCount, totalPages, targetAddress) {
  let table = document.getElementById("container");
  table.innerHTML = '';
  table.createTBody();
  
  // Create header
  createAdminTableHeader(table);
  
  console.log("Admin table - startPoint:", startPoint, "endPoint:", endPoint);
  
  const result = await getAdminTransactionInfo(signature, message, targetAddress, startPoint, endPoint);
  console.log("Admin transaction data:", result);
  
  // Create rows for each transaction
  for (let i = (endPoint - startPoint); i > 0; i--) {
    console.log("Processing transaction:", i);
    const currentStruct = result[i - 1];
    console.log("Transaction struct:", currentStruct);
    
    createAdminTableRow(table, currentStruct, targetAddress);
  }
  
  // Create footer with pagination
  createAdminTableFooter(table, currentPage, totalPages, message, signature, startPoint, endPoint, txnCount, targetAddress);
}

// Create admin table header
function createAdminTableHeader(table) {
  let headerRow = table.insertRow();
  
  const headers = ["Date", "Recipient", "Sender", "Amount", "Available Balance"];
  headers.forEach(headerText => {
    let header = headerRow.insertCell();
    header.innerHTML = headerText;
  });
}

// Create admin table row
function createAdminTableRow(table, currentStruct, targetAddress) {
  let row = table.insertRow();
  let dateCell = row.insertCell();
  let recipientCell = row.insertCell();
  let sendingWalletCell = row.insertCell();
  let amountCell = row.insertCell();
  let availBalanceCell = row.insertCell();
  
  // Set date
  dateCell.innerHTML = currentStruct.date;
  
  // Process recipient
  const _recip = currentStruct.recipient;
  console.log("Recipient:", _recip);
  
  if (_recip == ADDRESSES.HOST) {
    recipientCell.innerHTML = "DEPOSIT";
  } else if (_recip == targetAddress) {
    recipientCell.innerHTML = "WITHDRAW";
  } else {
    recipientCell.innerHTML = formatAddress(_recip);
  }
  recipientCell.style.width = "100px";
  
  // Process amount
  const amt = formatEthAmount(currentStruct.amount);
  const hostAddressString = ADDRESSES.HOST.toString();
  
  if (_recip == hostAddressString) {
    amountCell.innerHTML = `+ ${amt} ETH`;
  } else {
    amountCell.innerHTML = `(${amt}) ETH`;
    amountCell.style.color = "#FCBF9D";
  }
  
  // Setup amount hover for fee/gas info
  setupAdminAmountHover(amountCell, currentStruct);
  
  // Process available balance
  const availBal = formatEthAmount(currentStruct.availBal);
  availBalanceCell.innerHTML = `${availBal} ETH`;
  availBalanceCell.style.width = "100px";
  
  // Process sender
  const senderAddress = currentStruct.sendingWallet;
  const senderDisplay = formatAddress(senderAddress);
  
  if (senderAddress == ADDRESSES.HOST) {
    sendingWalletCell.innerHTML = "WITHDRAW";
  } else if (parseFloat(amt) == 0) {
    sendingWalletCell.innerHTML = "WALLET APPROVAL";
  } else {
    sendingWalletCell.innerHTML = senderDisplay;
  }
  sendingWalletCell.style.width = "100px";
  
  // Setup cell interactions
  setupAdminCellEvents(recipientCell, sendingWalletCell, _recip, senderAddress);
}

// Setup amount cell hover for admin table
function setupAdminAmountHover(amountCell, currentStruct) {
  const fee = formatFeeForAdmin(currentStruct.fee);
  const gas = formatGasForAdmin(currentStruct.gas);
  
  amountCell.addEventListener("mouseover", function() {
    const popup = createHoverPopup(`Fee: ${fee} & Gas: ${gas}`);
    amountCell.appendChild(popup);
    amountCell.classList.add('centered');
  });
  
  amountCell.addEventListener("mouseout", function() {
    const popup = amountCell.querySelector(".popup");
    if (popup) amountCell.removeChild(popup);
  });
  
  amountCell.setAttribute("class", "hoverable");
}

// Setup cell events for admin table
function setupAdminCellEvents(recipientCell, sendingWalletCell, recipientAddress, senderAddress) {
  // Recipient cell events
  setupAdminClickableCell(recipientCell, recipientAddress);
  setupAdminClickableCell(sendingWalletCell, senderAddress);
  
  recipientCell.setAttribute("class", "hoverable");
  sendingWalletCell.setAttribute("class", "hoverable");
}

// Setup clickable cell for admin table
function setupAdminClickableCell(cell, address) {
  cell.addEventListener("mouseover", function() {
    const popup = createHoverPopup(address);
    cell.appendChild(popup);
    cell.classList.add('centered');
  });
  
  cell.addEventListener("mouseout", function() {
    const popup = cell.querySelector(".popup");
    if (popup) cell.removeChild(popup);
  });
  
  cell.addEventListener("click", function() {
    copyToClipboard(address);
    cell.removeChild(cell.lastChild);
    const popup = createHoverPopup("copied!");
    popup.textContent = "copied!";
    cell.appendChild(popup);
    cell.classList.add('centered');
  });
}

// Create admin table footer with pagination
function createAdminTableFooter(table, currentPage, totalPages, message, signature, startPoint, endPoint, txnCount, targetAddress) {
  let footerRow = table.insertRow();
  footerRow.className = "footerRow";
  
  let leftFooter = footerRow.insertCell();
  leftFooter.className = "footerArrows";
  leftFooter.innerHTML = "<";
  
  let recipientFooter = footerRow.insertCell();
  recipientFooter.innerHTML = "";
  
  let sendingFooter = footerRow.insertCell();
  sendingFooter.innerHTML = `Viewing page ${currentPage} of ${totalPages}`;
  
  let amountFooter = footerRow.insertCell();
  amountFooter.innerHTML = "";
  
  let rightFooter = footerRow.insertCell();
  rightFooter.className = "footerArrows";
  rightFooter.innerHTML = ">";
  
  // Setup pagination
  setupAdminPagination(leftFooter, rightFooter, message, signature, startPoint, endPoint, txnCount, totalPages, targetAddress);
}

// Setup pagination for admin table
function setupAdminPagination(leftFooter, rightFooter, message, signature, startPoint, endPoint, txnCount, totalPages, targetAddress) {
  leftFooter.addEventListener("click", function() {
    console.log("Previous page clicked");
    if (currentPage > 1) {
      currentPage--;
      const newStartPoint = startPoint + endPoint;
      const newEndPoint = endPoint + APP_CONFIG.PAGE_SIZE;
      document.getElementById("container").innerHTML = '';
      renderAdminTable(message, signature, newStartPoint, newEndPoint, txnCount, totalPages, targetAddress);
    }
  });
  
  rightFooter.addEventListener("click", function() {
    console.log("Next page clicked");
    if (txnCount > currentPage * APP_CONFIG.PAGE_SIZE) {
      let newStartPoint, newEndPoint;
      
      if (startPoint > 0 && (startPoint - APP_CONFIG.PAGE_SIZE >= 0)) {
        currentPage++;
        newStartPoint = startPoint - APP_CONFIG.PAGE_SIZE;
        newEndPoint = endPoint - APP_CONFIG.PAGE_SIZE;
        console.log("Pagination condition 1");
      } else {
        currentPage++;
        newStartPoint = 0;
        newEndPoint = endPoint - APP_CONFIG.PAGE_SIZE;
        console.log("Pagination condition 2");
      }
      
      document.getElementById("container").innerHTML = '';
      renderAdminTable(message, signature, newStartPoint, newEndPoint, txnCount, totalPages, targetAddress);
    }
  });
}