/* ==========================================================================
   BOBA & CHILL - LOCAL STORAGE SERVICES
   ========================================================================== */

const CART_KEY = 'bobachill_cart';
const ORDERS_KEY = 'bobachill_orders';
const VOUCHER_KEY = 'bobachill_active_voucher';

export function getCartFromStorage() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading cart from LocalStorage', e);
    return [];
  }
}

export function saveCartToStorage(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving cart to LocalStorage', e);
  }
}

export function clearCartFromStorage() {
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(VOUCHER_KEY);
}

export function getActiveVoucherFromStorage() {
  try {
    return localStorage.getItem(VOUCHER_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function saveActiveVoucherToStorage(code) {
  if (code) {
    localStorage.setItem(VOUCHER_KEY, code);
  } else {
    localStorage.removeItem(VOUCHER_KEY);
  }
}

export function getOrdersFromStorage() {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading orders from LocalStorage', e);
    return [];
  }
}

export function saveOrderToStorage(order) {
  try {
    const orders = getOrdersFromStorage();
    orders.unshift(order); // add to top
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving order to LocalStorage', e);
  }
}
