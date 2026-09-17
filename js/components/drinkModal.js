/* ==========================================================================
   BOBA & CHILL - DRINK CUSTOMIZE MODAL COMPONENT
   ========================================================================== */

import { SIZES, ICE_LEVELS, SWEET_LEVELS, TOPPINGS } from '../data/menuData.js';
import { formatVND, showToast } from '../utils/helpers.js';

let currentDrink = null;
let selectedSize = SIZES[0];
let selectedIce = ICE_LEVELS[0];
let selectedSweet = SWEET_LEVELS[0];
let selectedToppings = [];
let currentQuantity = 1;
let onAddToCartCallback = null;

export function initDrinkModal({ onAddToCart }) {
  onAddToCartCallback = onAddToCart;

  const backdrop = document.getElementById('drinkModalBackdrop');
  const closeBtn = document.getElementById('closeDrinkModalBtn');
  const decreaseQtyBtn = document.getElementById('decreaseQtyBtn');
  const increaseQtyBtn = document.getElementById('increaseQtyBtn');
  const addToCartBtn = document.getElementById('addToCartBtn');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrinkModal);
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDrinkModal();
    });
  }

  if (decreaseQtyBtn) {
    decreaseQtyBtn.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        updateQtyAndPriceDisplay();
      }
    });
  }

  if (increaseQtyBtn) {
    increaseQtyBtn.addEventListener('click', () => {
      currentQuantity++;
      updateQtyAndPriceDisplay();
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', handleAddToCart);
  }
}

export function openDrinkModal(drinkItem) {
  currentDrink = drinkItem;
  selectedSize = SIZES[0];
  selectedIce = ICE_LEVELS[0];
  selectedSweet = SWEET_LEVELS[0];
  selectedToppings = [];
  currentQuantity = 1;

  const backdrop = document.getElementById('drinkModalBackdrop');
  const modalImg = document.getElementById('modalDrinkImg');
  const modalCategory = document.getElementById('modalDrinkCategory');
  const modalName = document.getElementById('modalDrinkName');
  const modalDesc = document.getElementById('modalDrinkDesc');
  const modalBasePrice = document.getElementById('modalDrinkBasePrice');
  const notesInput = document.getElementById('modalItemNotes');

  if (modalImg) modalImg.src = drinkItem.image;
  if (modalCategory) modalCategory.textContent = drinkItem.categoryId.toUpperCase();
  if (modalName) modalName.textContent = drinkItem.name;
  if (modalDesc) modalDesc.textContent = drinkItem.description;
  if (modalBasePrice) modalBasePrice.textContent = formatVND(drinkItem.basePrice);
  if (notesInput) notesInput.value = '';

  renderSizeOptions();
  renderIceOptions();
  renderSweetOptions();
  renderToppingOptions();
  updateQtyAndPriceDisplay();

  if (backdrop) backdrop.classList.remove('hidden');
}

export function closeDrinkModal() {
  const backdrop = document.getElementById('drinkModalBackdrop');
  if (backdrop) backdrop.classList.add('hidden');
  currentDrink = null;
}

function renderSizeOptions() {
  const container = document.getElementById('sizeOptionsGrid');
  if (!container) return;

  container.innerHTML = SIZES.map(s => {
    const isActive = s.id === selectedSize.id ? 'active' : '';
    return `<div class="opt-pill ${isActive}" data-size-id="${s.id}">${s.name}</div>`;
  }).join('');

  container.querySelectorAll('.opt-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const sizeId = pill.getAttribute('data-size-id');
      selectedSize = SIZES.find(s => s.id === sizeId) || SIZES[0];
      renderSizeOptions();
      updateQtyAndPriceDisplay();
    });
  });
}

function renderIceOptions() {
  const container = document.getElementById('iceOptionsGrid');
  if (!container) return;

  container.innerHTML = ICE_LEVELS.map(i => {
    const isActive = i.id === selectedIce.id ? 'active' : '';
    return `<div class="opt-pill ${isActive}" data-ice-id="${i.id}">${i.name}</div>`;
  }).join('');

  container.querySelectorAll('.opt-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const iceId = pill.getAttribute('data-ice-id');
      selectedIce = ICE_LEVELS.find(i => i.id === iceId) || ICE_LEVELS[0];
      renderIceOptions();
    });
  });
}

function renderSweetOptions() {
  const container = document.getElementById('sweetOptionsGrid');
  if (!container) return;

  container.innerHTML = SWEET_LEVELS.map(sw => {
    const isActive = sw.id === selectedSweet.id ? 'active' : '';
    return `<div class="opt-pill ${isActive}" data-sweet-id="${sw.id}">${sw.name}</div>`;
  }).join('');

  container.querySelectorAll('.opt-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const sweetId = pill.getAttribute('data-sweet-id');
      selectedSweet = SWEET_LEVELS.find(sw => sw.id === sweetId) || SWEET_LEVELS[0];
      renderSweetOptions();
    });
  });
}

function renderToppingOptions() {
  const container = document.getElementById('toppingsList');
  if (!container) return;

  container.innerHTML = TOPPINGS.map(top => {
    const isSelected = selectedToppings.some(t => t.id === top.id) ? 'selected' : '';
    return `
      <div class="topping-checkbox-card ${isSelected}" data-topping-id="${top.id}">
        <span>${top.name}</span>
        <span class="topping-price">+${formatVND(top.price)}</span>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.topping-checkbox-card').forEach(card => {
    card.addEventListener('click', () => {
      const topId = card.getAttribute('data-topping-id');
      const foundTopping = TOPPINGS.find(t => t.id === topId);
      if (!foundTopping) return;

      const idx = selectedToppings.findIndex(t => t.id === topId);
      if (idx > -1) {
        selectedToppings.splice(idx, 1);
      } else {
        selectedToppings.push(foundTopping);
      }

      renderToppingOptions();
      updateQtyAndPriceDisplay();
    });
  });
}

function calculateUnitPrice() {
  if (!currentDrink) return 0;
  const base = currentDrink.basePrice;
  const sizeCost = selectedSize.price;
  const toppingsCost = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  return base + sizeCost + toppingsCost;
}

function updateQtyAndPriceDisplay() {
  const qtyVal = document.getElementById('modalQtyVal');
  const totalPriceElem = document.getElementById('modalTotalPrice');

  if (qtyVal) qtyVal.textContent = currentQuantity;
  if (totalPriceElem) {
    const unitPrice = calculateUnitPrice();
    totalPriceElem.textContent = formatVND(unitPrice * currentQuantity);
  }
}

function handleAddToCart() {
  if (!currentDrink) return;

  const notesInput = document.getElementById('modalItemNotes');
  const notes = notesInput ? notesInput.value.trim() : '';

  const unitPrice = calculateUnitPrice();

  const cartItem = {
    cartItemId: `${currentDrink.id}_${selectedSize.id}_${selectedIce.id}_${selectedSweet.id}_${selectedToppings.map(t => t.id).sort().join('-')}`,
    drinkId: currentDrink.id,
    name: currentDrink.name,
    image: currentDrink.image,
    size: selectedSize,
    ice: selectedIce,
    sweet: selectedSweet,
    toppings: [...selectedToppings],
    quantity: currentQuantity,
    unitPrice: unitPrice,
    totalPrice: unitPrice * currentQuantity,
    notes: notes
  };

  if (onAddToCartCallback) {
    onAddToCartCallback(cartItem);
  }

  showToast(`Đã thêm ${currentQuantity}x ${currentDrink.name} vào giỏ hàng!`, 'success');
  closeDrinkModal();
}
