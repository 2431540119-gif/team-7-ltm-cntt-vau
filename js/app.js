/* ==========================================================================
   BOBA & CHILL - MAIN APPLICATION ENTRY POINT
   ========================================================================== */

import { initHeader } from './components/header.js';
import { initMenuGrid, setSearchQuery } from './components/menuGrid.js';
import { initDrinkModal, openDrinkModal } from './components/drinkModal.js';
import { 
  initCartDrawer, 
  openCartDrawer, 
  addItemToCart, 
  clearCart 
} from './components/cartDrawer.js';
import { 
  initCheckoutModal, 
  openCheckoutModal 
} from './components/checkoutModal.js';
import { 
  initOrderTracker, 
  openOrderTracker, 
  startSimulatedOrderProgress 
} from './components/orderTracker.js';
import { MENU_ITEMS } from './data/menuData.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Header Component
  initHeader({
    onSearchChange: (query) => {
      setSearchQuery(query);
    },
    onOpenCart: () => {
      openCartDrawer();
    },
    onOpenOrders: () => {
      openOrderTracker();
    }
  });

  // 2. Initialize Menu Product Grid
  initMenuGrid({
    onOpenDrinkModal: (drinkItem) => {
      openDrinkModal(drinkItem);
    }
  });

  // 3. Initialize Drink Customize Modal
  initDrinkModal({
    onAddToCart: (cartItem) => {
      addItemToCart(cartItem);
    }
  });

  // 4. Initialize Cart Drawer
  initCartDrawer({
    onProceedCheckout: (checkoutData) => {
      openCheckoutModal(checkoutData);
    }
  });

  // 5. Initialize Checkout Modal
  initCheckoutModal({
    onOrderCreated: (order) => {
      clearCart();
      openOrderTracker(order.orderCode);
      startSimulatedOrderProgress(order.orderCode);
    }
  });

  // 6. Initialize Order Tracker
  initOrderTracker();

  // Attach Hero Quick Add Button Event
  const heroOrderBtn = document.getElementById('heroOrderBtn');
  if (heroOrderBtn) {
    heroOrderBtn.addEventListener('click', () => {
      const heroDrink = MENU_ITEMS[0]; // Trà Sữa Trân Châu Hoàng Gia
      if (heroDrink) openDrinkModal(heroDrink);
    });
  }

  // Global exposure for inline onclick fallbacks
  window.app = {
    quickAddHeroDrink: () => {
      const heroDrink = MENU_ITEMS[0];
      if (heroDrink) openDrinkModal(heroDrink);
    }
  };
});
