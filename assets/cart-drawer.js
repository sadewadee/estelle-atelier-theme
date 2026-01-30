/**
 * Estelle Atelier - Cart Drawer
 * Pure Vanilla JS - No third-party dependencies
 * Uses PubSub event system for component communication
 */

(function() {
  'use strict';

  const CART_DRAWER_ID = 'cart-drawer';
  const CART_DRAWER_OPEN_CLASS = 'cart-drawer-open';
  const CART_DRAWER_BODY_CLASS = 'cart-drawer-open';

  // PubSub events
  const PUBSUB_EVENTS = {
    CART_UPDATE: 'cart:update',
    CART_ADD: 'cart:add',
    CART_REMOVE: 'cart:remove',
    CART_DRAWER_OPEN: 'cart-drawer:open',
    CART_DRAWER_CLOSE: 'cart-drawer:close'
  };

  /**
   * Get drawer element
   */
  function getDrawer() {
    return document.getElementById(CART_DRAWER_ID);
  }

  /**
   * Open cart drawer
   */
  function openCartDrawer() {
    const drawer = getDrawer();
    if (!drawer) return;

    drawer.classList.add(CART_DRAWER_OPEN_CLASS);
    document.body.classList.add(CART_DRAWER_BODY_CLASS);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus trap
    const firstFocusable = drawer.querySelector('button, input, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();

    // Publish event
    if (window.pubsub) {
      window.pubsub.publish(PUBSUB_EVENTS.CART_DRAWER_OPEN);
    }
  }

  /**
   * Close cart drawer
   */
  function closeCartDrawer() {
    const drawer = getDrawer();
    if (!drawer) return;

    drawer.classList.remove(CART_DRAWER_OPEN_CLASS);
    document.body.classList.remove(CART_DRAWER_BODY_CLASS);

    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to trigger
    if (window.cartDrawerTrigger) {
      window.cartDrawerTrigger.focus();
    }

    // Publish event
    if (window.pubsub) {
      window.pubsub.publish(PUBSUB_EVENTS.CART_DRAWER_CLOSE);
    }
  }

  /**
   * Toggle cart drawer
   */
  function toggleCartDrawer(event) {
    if (event) {
      event.preventDefault();
      window.cartDrawerTrigger = event.currentTarget;
    }

    const drawer = getDrawer();
    if (!drawer) return;

    if (drawer.classList.contains(CART_DRAWER_OPEN_CLASS)) {
      closeCartDrawer();
    } else {
      openCartDrawer();
    }
  }

  /**
   * Fetch and render cart contents
   */
  function updateCartDrawer() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const container = document.querySelector('[data-cart-items-container]');
        const subtotal = document.querySelector('[data-cart-subtotal]');
        const count = document.querySelector('[data-cart-count]');
        const itemCount = document.querySelector('[data-cart-item-count]');

        if (!container) return;

        // Update item count badges
        if (count) count.textContent = cart.item_count;
        if (itemCount) itemCount.textContent = `(${cart.item_count})`;

        // Update subtotal
        if (subtotal) {
          subtotal.textContent = Shopify.formatMoney(cart.total_price, '{{amount}}');
        }

        // Render cart items
        if (cart.items.length === 0) {
          container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-center">
              <span class="material-symbols-outlined text-6xl text-sage-dark/30 mb-4">shopping_bag</span>
              <p class="text-text-charcoal/70 text-lg">Your bag is empty</p>
              <a href="/collections/all" class="mt-4 text-sage-dark font-medium border-b border-sage-dark/30 pb-0.5 hover:border-sage-dark transition-all">
                Continue Shopping
              </a>
            </div>
          `;
          return;
        }

        container.innerHTML = cart.items.map(item => `
          <div class="flex gap-6 py-6 border-b border-sage-accent last:border-0" data-cart-item-id="${item.id}">
            <a href="${item.url}" class="w-20 h-24 shrink-0 bg-center bg-no-repeat bg-cover bg-sage-pale/50 rounded-lg overflow-hidden" style="background-image: url('${item.image ? item.image.replace(/(\.[^.]*)$/, '_compact$1') : ''}')">
            </a>
            <div class="flex flex-col flex-1">
              <div class="flex justify-between items-start">
                <a href="${item.url}">
                  <h3 class="text-[11px] font-medium tracking-widest uppercase text-text-charcoal line-clamp-2">${item.product_title}</h3>
                </a>
                <p class="text-sm font-serif text-text-olive-deep">${Shopify.formatMoney(item.price, '{{amount}}')}</p>
              </div>
              ${item.variant_title && item.variant_title !== 'Default Title' ? `
                <p class="text-[11px] font-light text-muted mt-1 italic">${item.variant_title}</p>
              ` : ''}
              <div class="flex items-center justify-between mt-auto">
                <div class="flex items-center border border-sage-accent/50 h-8 px-1">
                  <button data-quantity-minus="${item.id}" class="material-symbols-outlined text-[14px] w-7 h-7 flex items-center justify-center hover:bg-sage-pale transition-colors" aria-label="Decrease quantity">remove</button>
                  <span class="text-[11px] w-8 text-center font-medium">${item.quantity}</span>
                  <button data-quantity-plus="${item.id}" class="material-symbols-outlined text-[14px] w-7 h-7 flex items-center justify-center hover:bg-sage-pale transition-colors" aria-label="Increase quantity">add</button>
                </div>
                <button data-remove-item="${item.id}" class="text-[9px] uppercase tracking-[0.2em] text-muted hover:text-text-charcoal border-b border-transparent hover:border-text-charcoal transition-all pb-0.5">
                  Remove
                </button>
              </div>
            </div>
          </div>
        `).join('');

        // Attach event listeners to new buttons
        attachCartItemListeners();
      })
      .catch(error => console.error('Error fetching cart:', error));
  }

  /**
   * Attach event listeners to cart item buttons
   */
  function attachCartItemListeners() {
    // Quantity plus buttons
    document.querySelectorAll('[data-quantity-plus]').forEach(button => {
      button.addEventListener('click', (e) => {
        const itemId = e.target.dataset.quantityPlus;
        const itemRow = document.querySelector(`[data-cart-item-id="${itemId}"]`);
        const quantitySpan = itemRow.querySelector('span');
        const newQuantity = parseInt(quantitySpan.textContent) + 1;

        updateCartItemQuantity(itemId, newQuantity);
      });
    });

    // Quantity minus buttons
    document.querySelectorAll('[data-quantity-minus]').forEach(button => {
      button.addEventListener('click', (e) => {
        const itemId = e.target.dataset.quantityMinus;
        const itemRow = document.querySelector(`[data-cart-item-id="${itemId}"]`);
        const quantitySpan = itemRow.querySelector('span');
        const currentQuantity = parseInt(quantitySpan.textContent);

        if (currentQuantity > 1) {
          updateCartItemQuantity(itemId, currentQuantity - 1);
        }
      });
    });

    // Remove buttons
    document.querySelectorAll('[data-remove-item]').forEach(button => {
      button.addEventListener('click', (e) => {
        const itemId = e.target.dataset.removeItem;
        updateCartItemQuantity(itemId, 0);
      });
    });
  }

  /**
   * Update cart item quantity
   */
  function updateCartItemQuantity(itemId, quantity) {
    const formData = new FormData();
    formData.append('id', itemId);
    formData.append('quantity', quantity);

    fetch('/cart/change.js', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(() => {
      updateCartDrawer();
      // Update page cart count if exists
      fetchCartCount();

      // Publish update event
      if (window.pubsub) {
        window.pubsub.publish(quantity === 0 ? PUBSUB_EVENTS.CART_REMOVE : PUBSUB_EVENTS.CART_UPDATE, { itemId, quantity });
      }
    })
    .catch(error => console.error('Error updating cart:', error));
  }

  /**
   * Fetch and update cart count badge
   */
  function fetchCartCount() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        document.querySelectorAll('[data-cart-count]').forEach(el => {
          el.textContent = cart.item_count;
          el.classList.toggle('hidden', cart.item_count === 0);
        });
      });
  }

  /**
   * Initialize cart drawer
   */
  function initCartDrawer() {
    // Cart drawer toggle buttons
    document.querySelectorAll('[data-cart-drawer-toggle]').forEach(button => {
      button.addEventListener('click', toggleCartDrawer);
    });

    // Close button
    document.querySelectorAll('[data-cart-drawer-close]').forEach(button => {
      button.addEventListener('click', closeCartDrawer);
    });

    // Close on backdrop click
    const drawer = getDrawer();
    if (drawer) {
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer || e.target.dataset.cartDrawerBackdrop) {
          closeCartDrawer();
        }
      });
    }

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer && drawer.classList.contains(CART_DRAWER_OPEN_CLASS)) {
        closeCartDrawer();
      }
    });

    // Initial cart load
    updateCartDrawer();
    fetchCartCount();
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartDrawer);
  } else {
    initCartDrawer();
  }

  // Listen for cart events from theme
  document.addEventListener('cart:refresh', updateCartDrawer);
  document.addEventListener('cart:open', openCartDrawer);
  document.addEventListener('cart:close', closeCartDrawer);

  // Listen for PubSub events (if available)
  if (window.pubsub) {
    window.pubsub.subscribe(PUBSUB_EVENTS.CART_UPDATE, updateCartDrawer);
    window.pubsub.subscribe(PUBSUB_EVENTS.CART_ADD, updateCartDrawer);
    window.pubsub.subscribe(PUBSUB_EVENTS.CART_REMOVE, updateCartDrawer);

    // Subscribe to drawer open/close requests
    window.pubsub.subscribe(PUBSUB_EVENTS.CART_DRAWER_OPEN, openCartDrawer);
    window.pubsub.subscribe(PUBSUB_EVENTS.CART_DRAWER_CLOSE, closeCartDrawer);
  }

  // Make functions globally available
  window.EstelleCart = {
    open: openCartDrawer,
    close: closeCartDrawer,
    toggle: toggleCartDrawer,
    refresh: updateCartDrawer
  };
})();
