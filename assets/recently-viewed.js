/**
 * Estelle Atelier - Recently Viewed Products
 * Pure Vanilla JS - No third-party dependencies
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'estelle_recently_viewed';
  const MAX_ITEMS = 8;

  /**
   * Get recently viewed products from localStorage
   */
  function getRecentlyViewed() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      return [];
    }
  }

  /**
   * Save product handles to localStorage
   */
  function saveRecentlyViewed(handles) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
    }
  }

  /**
   * Add current product to recently viewed
   */
  function addCurrentProduct() {
    const productHandle = window.location.pathname.match(/\/products\/([^\/]+)/);
    if (!productHandle) return;

    const handle = productHandle[1];
    let recentlyViewed = getRecentlyViewed();

    // Remove current handle if already exists
    recentlyViewed = recentlyViewed.filter(h => h !== handle);

    // Add to front
    recentlyViewed.unshift(handle);

    // Keep only MAX_ITEMS
    if (recentlyViewed.length > MAX_ITEMS) {
      recentlyViewed = recentlyViewed.slice(0, MAX_ITEMS);
    }

    saveRecentlyViewed(recentlyViewed);
  }

  /**
   * Render recently viewed products in the carousel
   */
  function renderRecentlyViewed() {
    const container = document.querySelector('[data-recently-viewed-container]');
    if (!container) return;

    const recentlyViewed = getRecentlyViewed();
    if (recentlyViewed.length === 0) {
      container.style.display = 'none';
      return;
    }

    // Show container
    container.style.display = 'block';

    // Fetch product data for each handle
    const promises = recentlyViewed.map(handle =>
      fetch(`/products/${handle}.js`)
        .then(res => res.json())
        .catch(() => null)
    );

    Promise.all(promises).then(products => {
      const validProducts = products.filter(p => p !== null);
      if (validProducts.length === 0) {
        container.style.display = 'none';
        return;
      }

      const carousel = container.querySelector('[data-recently-viewed-carousel]');
      if (!carousel) return;

      carousel.innerHTML = validProducts.map(product => `
        <div class="min-w-[280px] flex-shrink-0 snap-start group cursor-pointer">
          <a href="${product.url}" class="block">
            <div class="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-sage-pale/30">
              <img
                src="${product.featured_image}"
                alt="${product.title}"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div class="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button class="w-full bg-white text-text-charcoal py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-xl">
                  Quick View
                </button>
              </div>
            </div>
            <h3 class="text-base font-medium mb-1 text-text-charcoal">${product.title}</h3>
            <p class="text-sage-dark font-sans text-sm font-semibold tracking-wide">
              ${product.price ? Shopify.formatMoney(product.price, '{{amount}}') : ''}
            </p>
          </a>
        </div>
      `).join('');

      // Initialize carousel navigation
      initCarouselNavigation(container);
    });
  }

  /**
   * Initialize carousel navigation buttons
   */
  function initCarouselNavigation(container) {
    const carousel = container.querySelector('[data-recently-viewed-carousel]');
    const prevBtn = container.querySelector('[data-carousel-prev]');
    const nextBtn = container.querySelector('[data-carousel-next]');

    if (!carousel || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -300, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: 300, behavior: 'smooth' });
    });
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Add current product if on product page
    addCurrentProduct();

    // Render recently viewed carousel
    renderRecentlyViewed();
  });

  // Re-render on theme editor changes
  if (Shopify.designMode) {
    document.addEventListener('shopify:section:load', renderRecentlyViewed);
    document.addEventListener('shopify:section:select', renderRecentlyViewed);
  }
})();
