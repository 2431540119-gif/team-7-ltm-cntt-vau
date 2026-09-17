/* ==========================================================================
   BOBA & CHILL - UTILITY HELPERS
   ========================================================================== */

/**
 * Formats a number into Vietnamese Dong (VND) representation
 * @param {number} amount 
 * @returns {string} e.g. "45.000đ"
 */
export function formatVND(amount) {
  if (isNaN(amount)) return '0đ';
  return amount.toLocaleString('vi-VN') + 'đ';
}

/**
 * Creates a toast notification on the bottom right of the page
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-solid fa-check-circle';
  if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';
  if (type === 'info') iconClass = 'fa-solid fa-circle-info';

  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

/**
 * Generates a unique order code e.g. "BC-8942"
 */
export function generateOrderCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BC-${randomNum}`;
}
