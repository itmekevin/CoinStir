// ui/animations.js

// Show loading animation
export function showLoadingAnimation() {
  document.querySelector('.loading-container').style.display = 'flex';
}

// Hide loading animation
export function hideLoadingAnimation() {
  document.querySelector('.loading-container').style.display = 'none';
}