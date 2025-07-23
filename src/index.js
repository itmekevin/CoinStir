// index.js - Main entry point
import { initializeEventListeners } from './ui/events.js';
import { generateAdminTable } from './admin/admin.js';

// Initialize the application
function initializeApp() {
  console.log("Initializing CoinStir application...");
  
  // Setup all event listeners
  initializeEventListeners();
  
  console.log("CoinStir application initialized successfully");
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export initialization function for manual initialization if needed
export { initializeApp };