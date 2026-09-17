/* ==========================================================================
   BOBA & CHILL - MENU GRID COMPONENT
   ========================================================================== */

import { CATEGORIES, MENU_ITEMS } from '../data/menuData.js';
import { formatVND } from '../utils/helpers.js';

let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'featured';
let onOpenDrinkModalCallback = null;

export function initMenuGrid({ onOpenDrinkModal }) {
  onOpenDrinkModalCallback = onOpenDrinkModal;
  
  renderCategories();
  renderProducts();

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      currentCategory = 'all';
      searchQuery = '';
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';
      const clearBtn = document.getElementById('clearSearchBtn');
      if (clearBtn) clearBtn.classList.add('hidden');

      renderCategories();
      renderProducts();
    });
  }
}

export function setCategoryFilter(categoryId) {
  currentCategory = categoryId;
  renderCategories();
  renderProducts();
}

export function setSearchQuery(query) {
  searchQuery = query;
  renderProducts();
}

function renderCategories() {
  const container = document.getElementById('categoryNav');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    const isActive = cat.id === currentCategory ? 'active' : '';
    return `
      <li>
        <button class="cat-tab-btn ${isActive}" data-category="${cat.id}">
          <i class="${cat.icon}"></i>
          <span>${cat.name}</span>
        </button>
      </li>
    `;
  }).join('');

  // Add event listeners to category buttons
  container.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.getAttribute('data-category');
      currentCategory = catId;
      renderCategories();
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('menuGrid');
  const emptyState = document.getElementById('emptyMenuState');
  const resultsCount = document.getElementById('resultsCount');

  if (!grid) return;

  // Filter items
  let filtered = MENU_ITEMS.filter(item => {
    const matchesCategory = currentCategory === 'all' || item.categoryId === currentCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Sort items
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.basePrice - b.basePrice);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.basePrice - a.basePrice);
  } else if (currentSort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Update counter
  if (resultsCount) {
    resultsCount.textContent = `Hiển thị ${filtered.length} món uống`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = filtered.map(item => `
    <article class="drink-card" data-id="${item.id}">
      <div class="card-img-wrapper">
        ${item.tag ? `<span class="card-tag">${item.tag}</span>` : ''}
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-category-row">
          <span class="category-badge">${getCategoryName(item.categoryId)}</span>
          <span class="card-rating"><i class="fa-solid fa-star"></i> ${item.rating}</span>
        </div>
        <h3 class="card-title">${item.name}</h3>
        <p class="card-description">${item.description}</p>
        <div class="card-footer">
          <span class="card-price">${formatVND(item.basePrice)}</span>
          <button class="btn-add-option" data-id="${item.id}">
            <i class="fa-solid fa-plus"></i> Chọn Món
          </button>
        </div>
      </div>
    </article>
  `).join('');

  // Attach click events
  grid.querySelectorAll('.drink-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const drinkId = card.getAttribute('data-id');
      const item = MENU_ITEMS.find(i => i.id === drinkId);
      if (item && onOpenDrinkModalCallback) {
        onOpenDrinkModalCallback(item);
      }
    });
  });
}

function getCategoryName(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? cat.name : 'Nước uống';
}
