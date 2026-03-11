/**
 * Accessibility Utilities for OSI Dashboard
 */

/**
 * Generate unique ID for ARIA labels
 */
export const generateId = (prefix: string = "id"): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: "polite" | "assertive" = "polite",
): void => {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Trap focus within a modal or dialog
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener("keydown", handleKeyDown);
  firstFocusable?.focus();

  return () => {
    element.removeEventListener("keydown", handleKeyDown);
  };
};

/**
 * Check if element has proper ARIA labels
 */
export const hasAccessibleName = (element: HTMLElement): boolean => {
  return !!(
    element.getAttribute("aria-label") ||
    element.getAttribute("aria-labelledby") ||
    element.textContent?.trim()
  );
};

/**
 * Get contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Simple luminance calculation
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;

    const [r, g, b] = rgb.map(Number).map((val) => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export const meetsWCAGAA = (
  color1: string,
  color2: string,
  fontSize: number = 16,
): boolean => {
  const ratio = getContrastRatio(color1, color2);
  const isLargeText = fontSize >= 18 || fontSize >= 14; // 14pt bold is considered large

  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Add keyboard navigation to a list
 */
export const enableKeyboardNavigation = (
  listElement: HTMLElement,
  itemSelector: string,
  onSelect?: (item: HTMLElement) => void,
): (() => void) => {
  const items = Array.from(
    listElement.querySelectorAll<HTMLElement>(itemSelector),
  );
  let currentIndex = 0;

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        items[currentIndex]?.focus();
        break;

      case "ArrowUp":
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        items[currentIndex]?.focus();
        break;

      case "Home":
        e.preventDefault();
        currentIndex = 0;
        items[currentIndex]?.focus();
        break;

      case "End":
        e.preventDefault();
        currentIndex = items.length - 1;
        items[currentIndex]?.focus();
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        if (onSelect && items[currentIndex]) {
          onSelect(items[currentIndex]);
        }
        break;
    }
  };

  listElement.addEventListener("keydown", handleKeyDown);

  return () => {
    listElement.removeEventListener("keydown", handleKeyDown);
  };
};

/**
 * Screen reader only (sr-only) class utility
 */
export const srOnly =
  "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0";

/**
 * Skip to main content link handler
 */
export const skipToMainContent = (
  mainElementId: string = "main-content",
): void => {
  const mainElement = document.getElementById(mainElementId);
  if (mainElement) {
    mainElement.setAttribute("tabindex", "-1");
    mainElement.focus();
    mainElement.removeAttribute("tabindex");
  }
};

/**
 * Create accessible button from div/span
 */
export const makeAccessibleButton = (
  element: HTMLElement,
  onClick: () => void,
): void => {
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");

  const handleClick = () => onClick();
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  element.addEventListener("click", handleClick);
  element.addEventListener("keypress", handleKeyPress);
};

/**
 * Validate form accessibility
 */
export const validateFormAccessibility = (
  formElement: HTMLFormElement,
): string[] => {
  const issues: string[] = [];

  // Check inputs have labels
  const inputs = formElement.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const id = input.getAttribute("id");
    if (!id) {
      issues.push(
        `Input missing ID: ${input.getAttribute("name") || "unknown"}`,
      );
      return;
    }

    const label = formElement.querySelector(`label[for="${id}"]`);
    const ariaLabel = input.getAttribute("aria-label");
    const ariaLabelledBy = input.getAttribute("aria-labelledby");

    if (!label && !ariaLabel && !ariaLabelledBy) {
      issues.push(`Input "${id}" missing label`);
    }
  });

  // Check required fields have aria-required
  const requiredInputs = formElement.querySelectorAll("[required]");
  requiredInputs.forEach((input) => {
    if (!input.getAttribute("aria-required")) {
      issues.push(
        `Required input "${input.getAttribute("id")}" missing aria-required`,
      );
    }
  });

  return issues;
};

export default {
  generateId,
  announceToScreenReader,
  trapFocus,
  hasAccessibleName,
  getContrastRatio,
  meetsWCAGAA,
  enableKeyboardNavigation,
  srOnly,
  skipToMainContent,
  makeAccessibleButton,
  validateFormAccessibility,
};
