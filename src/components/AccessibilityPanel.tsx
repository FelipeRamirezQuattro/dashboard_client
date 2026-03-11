/**
 * Accessibility Testing Panel Component
 *
 * A floating panel for running accessibility audits during development.
 * Add this component to your app in development mode to enable
 * manual accessibility testing.
 *
 * Usage in App.tsx:
 * ```tsx
 * {import.meta.env.DEV && <AccessibilityPanel />}
 * ```
 */

import React, { useState } from "react";
import {
  runAccessibilityAudit,
  generateAccessibilityReport,
} from "../utils/axe-testing";

export const AccessibilityPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleRunAudit = async () => {
    setIsRunning(true);
    await runAccessibilityAudit();
    const reportData = await generateAccessibilityReport();
    setReport(reportData);
    setIsRunning(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
        aria-label="Open accessibility testing panel"
        title="Accessibility Testing"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="bg-purple-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h3 className="font-semibold">A11y Testing</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-purple-700 p-1 rounded transition-colors"
          aria-label="Close panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <p className="text-sm text-gray-600 mb-4">
          Run automated accessibility tests using axe-core
        </p>

        {/* Run Audit Button */}
        <button
          onClick={handleRunAudit}
          disabled={isRunning}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-4"
        >
          {isRunning ? "Running Audit..." : "Run Accessibility Audit"}
        </button>

        {/* Report */}
        {report && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Passed: {report.passed}
              </div>
            </div>

            {report.violations > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Violations: {report.violations}
                </div>
                <div className="space-y-1 text-sm">
                  {report.critical > 0 && (
                    <div className="text-red-900">
                      🔴 Critical: {report.critical}
                    </div>
                  )}
                  {report.serious > 0 && (
                    <div className="text-red-800">
                      🟠 Serious: {report.serious}
                    </div>
                  )}
                  {report.moderate > 0 && (
                    <div className="text-orange-700">
                      🟡 Moderate: {report.moderate}
                    </div>
                  )}
                  {report.minor > 0 && (
                    <div className="text-yellow-700">
                      ⚪ Minor: {report.minor}
                    </div>
                  )}
                </div>
              </div>
            )}

            {report.incomplete > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-700 font-medium">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Needs Manual Review: {report.incomplete}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              Check browser console for detailed report
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Quick Tips:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Check console for detailed violations</li>
            <li>• Test with keyboard navigation (Tab key)</li>
            <li>• Test with screen reader (VoiceOver/NVDA)</li>
            <li>• Verify color contrast meets WCAG AA</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
