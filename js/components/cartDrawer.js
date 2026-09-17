/* ==========================================================================
   BOBA & CHILL - CART DRAWER COMPONENT
   ========================================================================== */

import { VOUCHERS } from '../data/menuData.js';
import { formatVND, showToast } from '../utils/helpers.js';
import { 
  getCartFromStorage, 
  saveCartToStorage, 
  getActiveVoucherFromStorage, 
  saveActiveVoucherToStorage 
} from '../utils/storage.js';

let cart = [];
let activeVoucherCode = null;
let onProceedCheckoutCallback = null;

const SHIPPING_FEE = 15000;

export function initCartDrawer({ onProceedCheckout }) {
  onProceedCheckoutCallback = onProceedCheckout;

  cart = getCartFromStorage();
  activeVoucherCode = getActiveVoucherFromStorage();

  const backdrop = document.getElementById('cartBackdrop');
  const drawer = document.getElementById('cartDrawer');
  const closeBtn = document.getElementById('closeCartBtn');
  const applyVoucherBtn = document.getElementById('applyVoucherBtn');
  const voucherInput = document.getElementById('voucherInput');
  const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
  if (backdrop) backdrop.addEventListener('click', closeCartDrawer);

  if (applyVoucherBtn && voucherInput) {
    applyVoucherBtn.addEventListener('click', () => {
      const code = voucherInput.value.trim().toUpperCase();
      applyVoucher(code);
    });
  }

  if (proceedCheckoutBtn) {
    proceedCheckoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      closeCartDrawer();
      if (onProceedCheckoutCallback) {
        const summary = calculateCartTotals();
        onProceedCheckoutCallback({ cart, voucher: activeVoucherCode, totals: summary });
      }
    });
  }

  if (activeVoucherCode && voucherInput) {
    voucherInput.value = activeVoucherCode;
  }

  renderCart();
}

export function openCartDrawer() {
  const backdrop = document.getElementById('cartBackdrop');
  const drawer = document.getElementById('cartDrawer');

  renderCart();
  if (backdrop) backdrop.classList.remove('hidden');
  if (drawer) drawer.classList.add('open');
}

export function closeCartDrawer() {
  const backdrop = document.getElementById('cartBackdrop');
  const drawer = document.getElementById('cartDrawer');

  if (backdrop) backdrop.classList.add('hidden');
  if (drawer) drawer.classList.remove('open');
}

export function addItemToCart(newItem) {
  const existingIdx = cart.findIndex(item => item.cartItemId === newItem.cartItemId);
  if (existingIdx > -1) {
    cart[existingIdx].quantity += newItem.quantity;
    cart[existingIdx].totalPrice = cart[existingIdx].unitPrice * cart[existingIdx].quantity;
  } else {
    cart.push(newItem);
  }

  saveCartToStorage(cart);
  renderCart();
}

export function clearCart() {
  cart = [];
  activeVoucherCode = null;
  saveCartToStorage(cart);
  saveActiveVoucherToStorage(null);
  renderCart();
}

export function renderCart() {
  const cartBody = document.getElementById('cartBody');
  const badgeCounter = document.getElementById('cartBadgeCounter');
  const itemCountBadge = document.getElementById('cartItemCountBadge');
  const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');

  const totalItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (badgeCounter) badgeCounter.textContent = totalItemsCount;
  if (itemCountBadge) itemCountBadge.textContent = `${totalItemsCount} món`;

  if (!cartBody) return;

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-basket-shopping"></i></div>
        <h3>Giỏ hàng đang trống!</h3>
        <p>Hãy chọn cho mình những món nước uống thật ngon nhé.</p>
      </div>
    `;

    if (proceedCheckoutBtn) proceedCheckoutBtn.disabled = true;
    updateTotalsDisplay(0, 0, 0);
    return;
  }

  if (proceedCheckoutBtn) proceedCheckoutBtn.disabled = false;

  cartBody.innerHTML = cart.map((item, index) => {
    const toppingText = item.toppings.length > 0
      ? `<div class="cart-item-toppings">+ Topping: ${item.toppings.map(t => t.name).join(', ')}</div>`
      : '';
    
    const notesText = item.notes ? `<div class="cart-item-notes">Note: "${item.notes}"</div>` : '';

    return `
      <div class="cart-item" data-index="${index}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title-row">
            <h4 class="cart-item-name">${item.name}</h4>
            <button class="btn-remove-item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <div class="cart-item-meta">
            <div>Size: <strong>${item.size.name}</strong> | Đá: <strong>${item.ice.name}</strong> | Đường: <strong>${item.sweet.name}</strong></div>
            ${toppingText}
            ${notesText}
          </div>
          <div class="cart-item-bottom">
            <span class="cart-item-price">${formatVND(item.totalPrice)}</span>
            <div class="quantity-controls">
              <button class="btn-qty btn-minus" data-index="${index}"><i class="fa-solid fa-minus"></i></button>
              <span class="qty-number">${item.quantity}</span>
              <button class="btn-qty btn-plus" data-index="${index}"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners for item quantity +/- and deletion
  cartBody.querySelectorAll('.btn-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      if (cart[idx].quantity > 1) {
        cart[idx].quantity--;
        cart[idx].totalPrice = cart[idx].unitPrice * cart[idx].quantity;
      } else {
        cart.splice(idx, 1);
      }
      saveCartToStorage(cart);
      renderCart();
    });
  });

  cartBody.querySelectorAll('.btn-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      cart[idx].quantity++;
      cart[idx].totalPrice = cart[idx].unitPrice * cart[idx].quantity;
      saveCartToStorage(cart);
      renderCart();
    });
  });

  cartBody.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const removedName = cart[idx].name;
      cart.splice(idx, 1);
      saveCartToStorage(cart);
      renderCart();
      showToast(`Đã xóa ${removedName} khỏi giỏ hàng`, 'info');
    });
  });

  const totals = calculateCartTotals();
  updateTotalsDisplay(totals.subtotal, totals.discount, totals.total);
}

function applyVoucher(code) {
  const msgElem = document.getElementById('voucherMessage');
  if (!code) {
    activeVoucherCode = null;
    saveActiveVoucherToStorage(null);
    if (msgElem) msgElem.classList.add('hidden');
    renderCart();
    return;
  }

  const voucher = VOUCHERS[code];
  if (!voucher) {
    if (msgElem) {
      msgElem.className = 'voucher-msg text-danger';
      msgElem.textContent = '❌ Mã giảm giá không tồn tại!';
      msgElem.classList.remove('hidden');
    }
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  if (subtotal < voucher.minSubtotal) {
    if (msgElem) {
      msgElem.className = 'voucher-msg text-danger';
      msgElem.textContent = `❌ Mã yêu cầu đơn hàng tối thiểu ${formatVND(voucher.minSubtotal)}`;
      msgElem.classList.remove('hidden');
    }
    return;
  }

  activeVoucherCode = code;
  saveActiveVoucherToStorage(code);

  if (msgElem) {
    msgElem.className = 'voucher-msg text-success';
    msgElem.textContent = `🎉 Áp dụng thành công: ${voucher.description}`;
    msgElem.classList.remove('hidden');
  }

  showToast(`Đã áp dụng mã giảm giá ${code}`, 'success');
  renderCart();
}

function calculateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  let discount = 0;

  if (activeVoucherCode && VOUCHERS[activeVoucherCode]) {
    const v = VOUCHERS[activeVoucherCode];
    if (subtotal >= v.minSubtotal) {
      if (v.type === 'percent') {
        discount = Math.round((subtotal * v.value) / 100);
      } else if (v.type === 'fixed') {
        discount = v.value;
      }
    }
  }

  const total = Math.max(0, subtotal - discount + (subtotal > 0 ? SHIPPING_FEE : 0));
  return { subtotal, discount, shipping: SHIPPING_FEE, total };
}

function updateTotalsDisplay(subtotal, discount, total) {
  const subtotalElem = document.getElementById('cartSubtotal');
  const discountRow = document.getElementById('discountRow');
  const discountElem = document.getElementById('cartDiscount');
  const totalElem = document.getElementById('cartTotal');

  if (subtotalElem) subtotalElem.textContent = formatVND(subtotal);
  if (totalElem) totalElem.textContent = formatVND(total);

  if (discountRow && discountElem) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountElem.textContent = `-${formatVND(discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
}
