/**
 * Mobile and Performance Optimization Utilities
 */

/**
 * Check if device is mobile based on screen width
 */
export const isMobileDevice = (): boolean => {
  return window.innerWidth < 768;
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load image with IntersectionObserver
 */
export const lazyLoadImage = (
  imgElement: HTMLImageElement,
  src: string,
): void => {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          imgElement.src = src;
          imgElement.classList.remove("lazy");
          imageObserver.unobserve(imgElement);
        }
      });
    });

    imageObserver.observe(imgElement);
  } else {
    // Fallback for older browsers
    imgElement.src = src;
  }
};

/**
 * Get optimized image URL based on screen size
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  width?: number,
): string => {
  const screenWidth = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = width || screenWidth;
  const optimalWidth = Math.ceil(targetWidth * dpr);

  // If using a CDN that supports dynamic resizing (like Cloudinary, imgix)
  // This is a placeholder - adjust based on your image CDN
  if (baseUrl.includes("placeholder")) {
    return baseUrl;
  }

  return `${baseUrl}?w=${optimalWidth}&q=80`;
};

/**
 * Trigger haptic feedback on supported devices
 */
export const hapticFeedback = (
  type: "light" | "medium" | "heavy" = "light",
): void => {
  if ("vibrate" in navigator) {
    const durations = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(durations[type]);
  }
};

/**
 * Detect reduced motion preference
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get safe area insets for notched devices
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue("--sat") || "0"),
    right: parseInt(style.getPropertyValue("--sar") || "0"),
    bottom: parseInt(style.getPropertyValue("--sab") || "0"),
    left: parseInt(style.getPropertyValue("--sal") || "0"),
  };
};

/**
 * Check if running as PWA/standalone app
 */
export const isPWA = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Smooth scroll to element
 */
export const smoothScrollTo = (
  element: HTMLElement | null,
  offset: number = 0,
): void => {
  if (!element) return;

  const targetPosition =
    element.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};
