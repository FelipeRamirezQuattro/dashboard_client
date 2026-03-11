/**
 * Accessibility Testing Utilities using axe-core
 *
 * This module provides utilities for automated accessibility testing
 * during development and testing. It integrates @axe-core/react for
 * runtime accessibility auditing.
 *
 * Usage:
 * 1. In development: Automatically runs on every render
 * 2. Manual testing: Use runAccessibilityAudit() function
 * 3. Component testing: Use within test files
 */

import type { Result, RunOptions } from "axe-core";

/**
 * Configuration for axe-core testing
 */
export const axeConfig: RunOptions = {
  rules: {
    // ARIA rules
    "aria-allowed-attr": { enabled: true },
    "aria-required-attr": { enabled: true },
    "aria-valid-attr": { enabled: true },
    "aria-valid-attr-value": { enabled: true },

    // Color contrast (WCAG AA)
    "color-contrast": { enabled: true },

    // Forms
    "label": { enabled: true },
    "autocomplete-valid": { enabled: true },

    // Images
    "image-alt": { enabled: true },

    // Headings
    "heading-order": { enabled: true },

    // Links
    "link-name": { enabled: true },

    // Buttons
    "button-name": { enabled: true },

    // Keyboard navigation
    "focus-order-semantics": { enabled: true },
    "tabindex": { enabled: true },
  },
};

/**
 * Format axe-core violations for console output
 */
export const formatViolation = (violation: Result): string => {
  const { id, impact, description, nodes, helpUrl } = violation;

  let output = `\n🚨 ${impact?.toUpperCase()} - ${id}\n`;
  output += `   ${description}\n`;
  output += `   Affected elements (${nodes.length}):\n`;

  nodes.forEach((node, index) => {
    if (index < 3) {
      // Only show first 3 to avoid console spam
      output += `   - ${node.html}\n`;
      output += `     ${node.failureSummary}\n`;
    }
  });

  if (nodes.length > 3) {
    output += `   ... and ${nodes.length - 3} more\n`;
  }

  output += `   📖 Learn more: ${helpUrl}\n`;

  return output;
};

/**
 * Run manual accessibility audit on a specific element
 *
 * @param element - The DOM element to audit (defaults to document.body)
 * @param config - Custom axe configuration (optional)
 * @returns Promise<void>
 */
export const runAccessibilityAudit = async (
  element: HTMLElement = document.body,
  config: RunOptions = axeConfig,
): Promise<void> => {
  try {
    // Dynamically import axe-core to avoid bundling in production
    const axe = await import("axe-core");

    console.log("🔍 Running accessibility audit...");

    const results = await axe.default.run(element, config);

    const { violations, passes, incomplete } = results;

    // Log summary
    console.log(`\n✅ ${passes.length} accessibility checks passed`);
    console.log(`⚠️  ${incomplete.length} checks need review`);
    console.log(`❌ ${violations.length} violations found\n`);

    // Log violations
    if (violations.length > 0) {
      console.group("🚨 ACCESSIBILITY VIOLATIONS");
      violations.forEach((violation: Result) => {
        console.log(formatViolation(violation));
      });
      console.groupEnd();
    }

    // Log incomplete (needs manual review)
    if (incomplete.length > 0) {
      console.group("⚠️  INCOMPLETE (Manual Review Required)");
      incomplete.forEach((item: Result) => {
        console.log(`\n${item.id}: ${item.description}`);
        console.log(`Help: ${item.helpUrl}`);
      });
      console.groupEnd();
    }

    // Generate summary
    if (violations.length === 0 && incomplete.length === 0) {
      console.log("🎉 No accessibility violations found!");
    } else {
      console.log(`\n📊 SUMMARY:`);
      console.log(
        `   Critical: ${violations.filter((v: Result) => v.impact === "critical").length}`,
      );
      console.log(
        `   Serious: ${violations.filter((v: Result) => v.impact === "serious").length}`,
      );
      console.log(
        `   Moderate: ${violations.filter((v: Result) => v.impact === "moderate").length}`,
      );
      console.log(
        `   Minor: ${violations.filter((v: Result) => v.impact === "minor").length}`,
      );
    }
  } catch (error) {
    console.error("Failed to run accessibility audit:", error);
  }
};

/**
 * Generate accessibility report as JSON
 * Useful for CI/CD or automated testing
 */
export const generateAccessibilityReport = async (
  element: HTMLElement = document.body,
): Promise<{
  passed: number;
  violations: number;
  incomplete: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  details: Result[];
}> => {
  const axe = await import("axe-core");
  const results = await axe.default.run(element, axeConfig);

  return {
    passed: results.passes.length,
    violations: results.violations.length,
    incomplete: results.incomplete.length,
    critical: results.violations.filter((v: Result) => v.impact === "critical")
      .length,
    serious: results.violations.filter((v: Result) => v.impact === "serious")
      .length,
    moderate: results.violations.filter((v: Result) => v.impact === "moderate")
      .length,
    minor: results.violations.filter((v: Result) => v.impact === "minor")
      .length,
    details: results.violations,
  };
};

/**
 * Add accessibility testing to browser DevTools console
 * Call this in development mode to enable manual testing via console
 */
export const enableConsoleAccessibilityTesting = (): void => {
  if (typeof window !== "undefined") {
    // Add to window for console access
    (window as any).runA11yAudit = runAccessibilityAudit;
    (window as any).generateA11yReport = generateAccessibilityReport;

    console.log("✨ Accessibility testing enabled!");
    console.log("   Run: runA11yAudit() to test current page");
    console.log("   Run: generateA11yReport() for JSON report");
  }
};

/**
 * Run accessibility audit on page load (for development)
 */
export const auditOnPageLoad = (delay: number = 1000): void => {
  if (typeof window !== "undefined") {
    window.addEventListener("load", () => {
      setTimeout(() => {
        runAccessibilityAudit();
      }, delay);
    });
  }
};
