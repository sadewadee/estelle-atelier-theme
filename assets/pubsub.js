/**
 * Estelle Atelier - PubSub Event System
 * Lightweight publish/subscribe pattern for component communication
 * Based on Shopify Dawn theme event system
 */

class PubSub {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Publish an event
   * @param {string} event - Event name
   * @param {*} data - Data to pass to subscribers
   */
  publish(event, data) {
    if (!this.events[event]) return;

    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeOnce(event, callback) {
    const unsubscribe = this.subscribe(event, (...args) => {
      callback(...args);
      unsubscribe();
    });

    return unsubscribe;
  }

  /**
   * Clear all subscribers for an event
   * @param {string} event - Event name
   */
  clear(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Create global instance
const pubsub = new PubSub();

// Define standard event names (following Shopify Dawn conventions)
const PubSubEvents = {
  CART_UPDATE: 'cart:update',
  CART_ADD: 'cart:add',
  CART_REMOVE: 'cart:remove',
  CART_DRAWER_OPEN: 'cart-drawer:open',
  CART_DRAWER_CLOSE: 'cart-drawer:close',
  PRODUCT_ADD_TO_CART: 'product:add-to-cart',
  PRODUCT_VARIANT_CHANGE: 'product:variant-change',
  QUICK_VIEW_OPEN: 'quick-view:open',
  QUICK_VIEW_CLOSE: 'quick-view:close',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  HEADER_UPDATE: 'header:update',
  AJAX_REQUEST_START: 'ajax:start',
  AJAX_REQUEST_END: 'ajax:end',
  RECENTLY_VIEWED_UPDATE: 'recently-viewed:update',
  ANIMATION_COMPLETE: 'animation:complete'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { pubsub, PubSubEvents };
}

// Make available globally for inline scripts
window.pubsub = pubsub;
window.PubSubEvents = PubSubEvents;

// Shopify Theme Editor compatibility
document.addEventListener('shopify:section:load', () => {
  pubsub.publish('shopify:section:load');
});

document.addEventListener('shopify:section:unload', () => {
  pubsub.publish('shopify:section:unload');
});

document.addEventListener('shopify:section:select', () => {
  pubsub.publish('shopify:section:select');
});

document.addEventListener('shopify:section:deselect', () => {
  pubsub.publish('shopify:section:deselect');
});

document.addEventListener('shopify:block:select', () => {
  pubsub.publish('shopify:block:select');
});

document.addEventListener('shopify:block:deselect', () => {
  pubsub.publish('shopify:block:deselect');
});
