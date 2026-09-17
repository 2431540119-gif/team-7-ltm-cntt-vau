/* ==========================================================================
   BOBA & CHILL - HEADER COMPONENT
   ========================================================================== */

import { getOrdersFromStorage } from '../utils/storage.js';

export function initHeader({ onSearchChange, onOpenCart, onOpenOrders }) {
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const cartToggleBtn = document.getElementById('cartToggleBtn');
  const trackOrderBtn = document.getElementById('trackOrderBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (clearSearchBtn) {
        if (query.trim().length > 0) {
          clearSearchBtn.classList.remove('hidden');
        } else {
          clearSearchBtn.classList.add('hidden');
        }
      }
      onSearchChange(query);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        onSearchChange('');
      }
    });
  }

  if (cartToggleBtn) {
    cartToggleBtn.addEventListener('click', onOpenCart);
  }

  if (trackOrderBtn) {
    trackOrderBtn.addEventListener('click', onOpenOrders);
  }

  updateHeaderActiveOrdersBadge();
}

export function updateHeaderActiveOrdersBadge() {
  const orders = getOrdersFromStorage();
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const badgeDot = document.getElementById('activeOrdersBadge');

  if (badgeDot) {
    if (activeOrders.length > 0) {
      badgeDot.classList.remove('hidden');
    } else {
      badgeDot.classList.add('hidden');
    }
  }
}
