// utils/clipboard.js

// Copy text to clipboard using fallback method
export function copyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

// Modern clipboard API (with fallback)
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback to older method
      copyToClipboard(text);
    }
  } else {
    // Fallback to older method
    copyToClipboard(text);
  }
}