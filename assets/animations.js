/**
 * Estelle Atelier - Animation System
 * Scroll-triggered animations using IntersectionObserver
 * Based on Shopify Dawn theme animations.js
 */

const animationObserver = () => {
  // Elements to animate
  const animateElements = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const animationType = element.dataset.animate || 'fade-in';

        // Add animation class
        element.classList.add('is-animated');
        element.classList.add(`animate--${animationType}`);

        // Stop observing once animated
        observer.unobserve(element);
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  });

  animateElements.forEach((element) => observer.observe(element));
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', animationObserver);
} else {
  animationObserver();
}

// Re-initialize on section refresh (Shopify Theme Editor)
document.addEventListener('shopify:section:load', animationObserver);
