// ui/popups.js

// Show transaction result popup
export function showTransactionPopup() {
  document.querySelector('.txnPopupContainer').style.display = 'flex';
  document.querySelector('.txnPopupBg').style.display = 'flex';
  
  const txnPopupBg = document.getElementById("txnPopupBg");
  txnPopupBg.addEventListener("click", hideTransactionPopup);
}

// Hide transaction result popup
export function hideTransactionPopup() {
  document.querySelector('.txnPopupContainer').style.display = 'none';
  document.querySelector('.txnPopupBg').style.display = 'none';
}

// Set transaction popup message
export function setTransactionPopupMessage(message) {
  document.querySelector('.txnPopupContainer').innerHTML = message;
}

// Create hover popup element
export function createHoverPopup(content, className = "popup") {
  const popup = document.createElement("div");
  popup.className = className;
  popup.innerHTML = content;
  return popup;
}

// Create hover tooltip
export function createTooltip(content, className = "tip") {
  const tooltip = document.createElement("div");
  tooltip.className = className;
  tooltip.innerHTML = content;
  return tooltip;
}