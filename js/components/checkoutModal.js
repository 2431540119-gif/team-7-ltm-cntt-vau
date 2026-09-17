/* ==========================================================================
   BOBA & CHILL - CHECKOUT MODAL COMPONENT
   ========================================================================== */

import { formatVND, generateOrderCode, showToast } from '../utils/helpers.js';
import { saveOrderToStorage } from '../utils/storage.js';

let currentCheckoutData = null;
let onOrderCreatedCallback = null;

export function initCheckoutModal({ onOrderCreated }) {
  onOrderCreatedCallback = onOrderCreated;

  const backdrop = document.getElementById('checkoutModalBackdrop');
  const closeBtn = document.getElementById('closeCheckoutBtn');
  const form = document.getElementById('checkoutForm');
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');

  if (closeBtn) closeBtn.addEventListener('click', closeCheckoutModal);

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeCheckoutModal();
    });
  }

  paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.payment-card').forEach(card => card.classList.remove('active'));
      const parentCard = radio.closest('.payment-card');
      if (parentCard) parentCard.classList.add('active');

      const vietqrBox = document.getElementById('vietqrBox');
      if (vietqrBox) {
        if (e.target.value === 'VIETQR') {
          vietqrBox.classList.remove('hidden');
        } else {
          vietqrBox.classList.add('hidden');
        }
      }
    });
  });

  if (form) {
    form.addEventListener('submit', handleOrderSubmit);
  }
}

export function openCheckoutModal(checkoutData) {
  currentCheckoutData = checkoutData;
  const backdrop = document.getElementById('checkoutModalBackdrop');

  renderCheckoutSummary();
  if (backdrop) backdrop.classList.remove('hidden');
}

export function closeCheckoutModal() {
  const backdrop = document.getElementById('checkoutModalBackdrop');
  if (backdrop) backdrop.classList.add('hidden');
}

function renderCheckoutSummary() {
  if (!currentCheckoutData) return;
  const { cart, totals } = currentCheckoutData;

  const itemsContainer = document.getElementById('checkoutItemsList');
  const totalCountElem = document.getElementById('checkoutTotalCount');
  const finalTotalElem = document.getElementById('checkoutFinalTotal');
  const qrRefNote = document.getElementById('qrRefNote');
  const qrImage = document.getElementById('qrImage');

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (itemsContainer) {
    itemsContainer.innerHTML = cart.map(item => `
      <div class="checkout-summary-item">
        <div>
          <div class="checkout-item-title">${item.quantity}x ${item.name} (${item.size.id})</div>
          <div class="checkout-item-sub">Đá: ${item.ice.name} | Đường: ${item.sweet.name}</div>
        </div>
        <strong>${formatVND(item.totalPrice)}</strong>
      </div>
    `).join('');
  }

  if (totalCountElem) totalCountElem.textContent = `${totalCount} món`;
  if (finalTotalElem) finalTotalElem.textContent = formatVND(totals.total);

  const orderCode = generateOrderCode();
  if (qrRefNote) qrRefNote.textContent = orderCode;

  if (qrImage) {
    // Generate VietQR dynamic link with price and content
    const qrData = `STK: 999988886666 | MBBANK | SOTIEN: ${totals.total} | ND: ${orderCode}`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;
  }
}

function handleOrderSubmit(e) {
  e.preventDefault();
  if (!currentCheckoutData || currentCheckoutData.cart.length === 0) return;

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const notes = document.getElementById('orderNotes').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  const orderCode = document.getElementById('qrRefNote').textContent || generateOrderCode();

  const newOrder = {
    orderCode: orderCode,
    createdAt: new Date().toISOString(),
    customer: { name, phone, address, notes },
    paymentMethod: paymentMethod,
    items: currentCheckoutData.cart,
    voucher: currentCheckoutData.voucher,
    totals: currentCheckoutData.totals,
    status: 'received', // 'received' -> 'preparing' -> 'delivering' -> 'completed'
    statusHistory: [
      { status: 'received', title: 'Đã Nhận Đơn', time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
    ]
  };

  saveOrderToStorage(newOrder);
  closeCheckoutModal();

  showToast(`🎉 Đặt hàng thành công! Mã đơn: ${orderCode}`, 'success');

  if (onOrderCreatedCallback) {
    onOrderCreatedCallback(newOrder);
  }
}
