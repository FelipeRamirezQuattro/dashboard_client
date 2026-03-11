/**
 * useAccessibilityAudit Hook
 *
 * React hook for running accessibility audits on components
 * Automatically runs in development mode when component mounts
 *
 * Usage:
 * ```tsx
 * import { useAccessibilityAudit } from '@/hooks/useAccessibilityAudit';
 *
 * const MyComponent = () => {
 *   const auditRef = useAccessibilityAudit({ runOnMount: true });
 *
 *   return <div ref={auditRef}>Content</div>;
 * };
 * ```
 */

import { useEffect, useRef } from "react";
import { runAccessibilityAudit } from "../utils/axe-testing";

interface UseAccessibilityAuditOptions {
  /**
   * Whether to run audit when component mounts
   * @default false
   */
  runOnMount?: boolean;

  /**
   * Delay before running audit (in ms)
   * Useful to wait for dynamic content to load
   * @default 500
   */
  delay?: number;

  /**
   * Only run in development mode
   * @default true
   */
  devOnly?: boolean;

  /**
   * Component name for debugging
   */
  componentName?: string;
}

/**
 * Hook to run accessibility audits on a component
 *
 * @param options - Configuration options
 * @returns Ref to attach to the element to audit
 */
export const useAccessibilityAudit = (
  options: UseAccessibilityAuditOptions = {},
) => {
  const {
    runOnMount = false,
    delay = 500,
    devOnly = true,
    componentName = "Component",
  } = options;

  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Skip in production if devOnly is true
    if (devOnly && import.meta.env.PROD) {
      return;
    }

    // Skip if not configured to run on mount
    if (!runOnMount) {
      return;
    }

    const timer = setTimeout(() => {
      if (elementRef.current) {
        console.log(`🔍 Auditing ${componentName}...`);
        runAccessibilityAudit(elementRef.current);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [runOnMount, delay, devOnly, componentName]);

  return elementRef;
};

/**
 * Helper hook to audit entire page on route change
 * Use this in a layout component or route wrapper
 */
export const usePageAccessibilityAudit = (
  pathname: string,
  options: Pick<UseAccessibilityAuditOptions, "delay" | "devOnly"> = {},
) => {
  const { delay = 1000, devOnly = true } = options;

  useEffect(() => {
    if (devOnly && import.meta.env.PROD) {
      return;
    }

    const timer = setTimeout(() => {
      console.log(`🔍 Auditing page: ${pathname}`);
      runAccessibilityAudit();
    }, delay);

    return () => clearTimeout(timer);
  }, [pathname, delay, devOnly]);
};
