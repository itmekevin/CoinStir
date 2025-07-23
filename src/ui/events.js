// ui/events.js
import { connectWallet } from '../services/wallet.js';
import { sendTransaction, withdrawFunds, setInternalTransaction } from '../services/transactions.js';
import { createTooltip } from './popups.js';

// Initialize all event listeners
export function initializeEventListeners() {
  setupWalletEvents();
  setupTransactionEvents();
  setupTabEvents();
  setupTooltipEvents();
  setupToggleEvents();
}

// Setup wallet connection events
function setupWalletEvents() {
  const connectButton = document.getElementById('connectButton');
  if (connectButton) {
    connectButton.addEventListener("click", connectWallet);
  }
}

// Setup transaction events
function setupTransactionEvents() {
  const sendButton = document.getElementById('enclaveTxnButton');
  if (sendButton) {
    sendButton.addEventListener("click", sendTransaction);
  }
  
  const withdrawButton = document.getElementById('withdrawButton');
  if (withdrawButton) {
    withdrawButton.addEventListener("click", withdrawFunds);
  }
}

// Helper function to reset toggle to off position
function resetToggle() {
  const toggle = document.querySelector('.switch input[type="checkbox"]');
  const span = document.getElementById('internalText');
  
  if (toggle) {
    toggle.checked = false;
    setInternalTransaction(false);
    console.log("Toggle reset - Internal transaction:", false);
  }
  
  if (span) {
    span.classList.remove('active-color');
  }
}

// Setup tab navigation events
function setupTabEvents() {
  const div1 = document.getElementById('div1');
  const div2 = document.getElementById('div2');
  const txnTab = document.getElementById('txnTab');
  const withdrawTab = document.getElementById('withdrawTab');
  const manageTab = document.getElementById('manageTab');
  
  if (div1) {
    div1.addEventListener("click", function() {
      txnTab?.classList.remove("hidden");
      withdrawTab?.classList.add("hidden");
      manageTab?.classList.add("hidden");
      div1.classList.add("activetab");
      div2?.classList.remove("activetab");
      
      // Reset toggle when switching tabs
      resetToggle();
    });
  }
  
  if (div2) {
    div2.addEventListener("click", function() {
      txnTab?.classList.add("hidden");
      withdrawTab?.classList.add("tabBody");
      withdrawTab?.classList.remove("hidden");
      manageTab?.classList.add("hidden");
      div1?.classList.remove("activetab");
      div1?.classList.add("tab");
      div2.classList.add("activetab");
      
      // Reset toggle when switching tabs
      resetToggle();
    });
  }
}

// Setup tooltip events
function setupTooltipEvents() {
  const accountSummaryTip = document.getElementById("accountSummaryTip");
  
  if (accountSummaryTip) {
    accountSummaryTip.addEventListener("mouseenter", function() {
      const tooltip = createTooltip(
        "Connect your wallet to see your funds and send ETH in private! <br><br>You'll need to either have deposited ETH or received some in CoinStir from another wallet first."
      );
      accountSummaryTip.appendChild(tooltip);
    });
    
    accountSummaryTip.addEventListener("mouseleave", function() {
      const tooltip = accountSummaryTip.querySelector(".tip");
      if (tooltip) {
        accountSummaryTip.removeChild(tooltip);
      }
    });
  }
}

// Setup toggle events
function setupToggleEvents() {
  const toggle = document.querySelector('.switch input[type="checkbox"]');
  
  if (toggle) {
    toggle.addEventListener('change', function() {
      const isInternal = this.checked;
      setInternalTransaction(isInternal);
      console.log("Internal transaction:", isInternal);
      
      const span = document.getElementById('internalText');
      if (span) {
        if (isInternal) {
          span.classList.add('active-color');
        } else {
          span.classList.remove('active-color');
        }
      }
    });
  }
}