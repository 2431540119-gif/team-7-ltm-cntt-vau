/* ==========================================================================
   BOBA & CHILL - ORDER TRACKER COMPONENT
   ========================================================================== */

import { formatVND } from '../utils/helpers.js';
import { getOrdersFromStorage, saveOrderToStorage } from '../utils/storage.js';
import { updateHeaderActiveOrdersBadge } from './header.js';

let statusTimers = [];

export function initOrderTracker() {
  const backdrop = document.getElementById('orderTrackerModalBackdrop');
  const closeBtn = document.getElementById('closeTrackerBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeOrderTracker);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeOrderTracker();
    });
  }
}

export function openOrderTracker(targetOrderCode = null) {
  const backdrop = document.getElementById('orderTrackerModalBackdrop');

  renderTrackerBody(targetOrderCode);
  if (backdrop) backdrop.classList.remove('hidden');
}

export function closeOrderTracker() {
  const backdrop = document.getElementById('orderTrackerModalBackdrop');
  if (backdrop) backdrop.classList.add('hidden');
}

/**
 * Simulates automatic progression of order status for demo purposes:
 * received -> preparing (in 10s) -> delivering (in 20s) -> completed (in 35s)
 */
export function startSimulatedOrderProgress(orderCode) {
  // Clear previous timers
  statusTimers.forEach(t => clearTimeout(t));
  statusTimers = [];

  // Stage 1: Preparing in 10s
  const t1 = setTimeout(() => {
    updateOrderStatus(orderCode, 'preparing', 'Đang Pha Chế');
  }, 10000);

  // Stage 2: Delivering in 22s
  const t2 = setTimeout(() => {
    updateOrderStatus(orderCode, 'delivering', 'Tài Xế Đang Giao');
  }, 22000);

  // Stage 3: Completed in 35s
  const t3 = setTimeout(() => {
    updateOrderStatus(orderCode, 'completed', 'Giao Hàng Thành Công');
  }, 35000);

  statusTimers.push(t1, t2, t3);
}

function updateOrderStatus(orderCode, newStatus, title) {
  const orders = getOrdersFromStorage();
  const orderIdx = orders.findIndex(o => o.orderCode === orderCode);
  if (orderIdx === -1) return;

  orders[orderIdx].status = newStatus;
  const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  orders[orderIdx].statusHistory.push({ status: newStatus, title, time: timeStr });

  localStorage.setItem('bobachill_orders', JSON.stringify(orders));
  updateHeaderActiveOrdersBadge();

  // If tracker modal is visible, re-render
  const backdrop = document.getElementById('orderTrackerModalBackdrop');
  if (backdrop && !backdrop.classList.contains('hidden')) {
    renderTrackerBody(orderCode);
  }
}

function renderTrackerBody(targetOrderCode = null) {
  const container = document.getElementById('trackerBody');
  if (!container) return;

  const orders = getOrdersFromStorage();

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
        <h3>Bạn chưa có đơn hàng nào!</h3>
        <p>Thưởng thức ngay trà sữa & cà phê bằng cách chọn món vào giỏ hàng nhé.</p>
      </div>
    `;
    return;
  }

  // Select target order or the most recent order
  let activeOrder = orders.find(o => o.orderCode === targetOrderCode) || orders[0];

  const steps = [
    { key: 'received', label: 'Đã Nhận Đơn', icon: 'fa-solid fa-clipboard-check' },
    { key: 'preparing', label: 'Đang Pha Chế', icon: 'fa-solid fa-blender' },
    { key: 'delivering', label: 'Đang Giao Hàng', icon: 'fa-solid fa-motorcycle' },
    { key: 'completed', label: 'Hoàn Thành', icon: 'fa-solid fa-heart' }
  ];

  const currentStatusIndex = getStatusIndex(activeOrder.status);

  container.innerHTML = `
    <div class="tracker-card">
      <div class="tracker-header-info">
        <div>
          <span class="order-code">Mã Đơn: ${activeOrder.orderCode}</span>
          <div class="order-time">Đặt lúc: ${new Date(activeOrder.createdAt).toLocaleString('vi-VN')}</div>
        </div>
        <span class="pill-badge">${activeOrder.paymentMethod}</span>
      </div>

      <!-- STEPPER PROGRESS BAR -->
      <div class="tracker-stepper">
        ${steps.map((s, idx) => {
          let stateClass = '';
          if (idx < currentStatusIndex) stateClass = 'completed';
          else if (idx === currentStatusIndex) stateClass = 'active';

          return `
            <div class="step-item ${stateClass}">
              <div class="step-icon"><i class="${s.icon}"></i></div>
              <span class="step-label">${s.label}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- ORDER METADATA & ITEMS -->
      <div class="tracker-order-details">
        <p><strong>Người Nhận:</strong> ${activeOrder.customer.name} (${activeOrder.customer.phone})</p>
        <p><strong>Địa Chỉ:</strong> ${activeOrder.customer.address}</p>
        ${activeOrder.customer.notes ? `<p><strong>Ghi Chú:</strong> ${activeOrder.customer.notes}</p>` : ''}
        
        <div style="margin-top: 1rem; border-top: 1px dashed var(--border-glass); padding-top: 0.8rem;">
          <strong>Danh Sách Món Uống:</strong>
          <ul style="margin-top: 0.4rem;">
            ${activeOrder.items.map(item => `
              <li style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                <span>${item.quantity}x ${item.name} (${item.size.id})</span>
                <strong>${formatVND(item.totalPrice)}</strong>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="tracker-detail-row" style="margin-top: 0.8rem; font-size: 1.05rem; border-top: 1px solid var(--border-glass); padding-top: 0.6rem;">
          <span>Tổng Tiền Đã Thanh Toán:</span>
          <strong style="color: var(--accent-primary);">${formatVND(activeOrder.totals.total)}</strong>
        </div>
      </div>
    </div>

    ${orders.length > 1 ? `
      <div class="order-history-section" style="margin-top: 1.5rem;">
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Lịch Sử Các Đơn Hàng Khác (${orders.length - 1}):</h4>
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${orders.filter(o => o.orderCode !== activeOrder.orderCode).map(o => `
            <div class="history-item-row" data-code="${o.orderCode}" style="background: rgba(15,23,42,0.6); border: 1px solid var(--border-glass); padding: 0.75rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
              <div>
                <strong>${o.orderCode}</strong> - <span style="font-size:0.8rem; color: var(--text-muted);">${new Date(o.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style="display:flex; align-items:center; gap: 0.75rem;">
                <span style="font-weight:700; color: var(--accent-primary);">${formatVND(o.totals.total)}</span>
                <button class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;">Xem</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  // Attach click events for history switching
  container.querySelectorAll('.history-item-row').forEach(row => {
    row.addEventListener('click', () => {
      const code = row.getAttribute('data-code');
      renderTrackerBody(code);
    });
  });
}

function getStatusIndex(status) {
  switch (status) {
    case 'received': return 0;
    case 'preparing': return 1;
    case 'delivering': return 2;
    case 'completed': return 3;
    default: return 0;
  }
}
