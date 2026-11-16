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
import { ShieldCheck } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@odessa-separator/ui";
import {
  runAccessibilityAudit,
  generateAccessibilityReport,
} from "../utils/axe-testing";

type AccessibilityReport = Awaited<
  ReturnType<typeof generateAccessibilityReport>
>;

export const AccessibilityPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);

  const handleRunAudit = async () => {
    setIsRunning(true);
    await runAccessibilityAudit();
    const reportData = await generateAccessibilityReport();
    setReport(reportData);
    setIsRunning(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="accent"
            size="icon"
            aria-label="Accessibility testing panel"
            title="Accessibility Testing"
          >
            <ShieldCheck size={20} aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          aria-label="Accessibility testing"
          className="max-h-96 w-96 max-w-[calc(100vw-2rem)] overflow-y-auto"
        >
          <h3 className="font-semibold text-text">A11y Testing</h3>
          <p className="mb-4 mt-1 text-sm text-text-muted">
            Run automated accessibility tests using axe-core
          </p>

          <Button
            onClick={handleRunAudit}
            disabled={isRunning}
            className="mb-4 w-full"
          >
            {isRunning ? "Running Audit..." : "Run Accessibility Audit"}
          </Button>

          {report && (
            <div className="space-y-3">
              <Alert variant="success">
                <AlertTitle>Passed: {report.passed}</AlertTitle>
              </Alert>

              {report.violations > 0 && (
                <Alert variant="danger">
                  <AlertTitle>Violations: {report.violations}</AlertTitle>
                  <AlertDescription>
                    <ul className="space-y-1">
                      {report.critical > 0 && <li>Critical: {report.critical}</li>}
                      {report.serious > 0 && <li>Serious: {report.serious}</li>}
                      {report.moderate > 0 && (
                        <li>Moderate: {report.moderate}</li>
                      )}
                      {report.minor > 0 && <li>Minor: {report.minor}</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {report.incomplete > 0 && (
                <Alert variant="warning">
                  <AlertTitle>Needs Manual Review: {report.incomplete}</AlertTitle>
                </Alert>
              )}

              <p className="border-t border-border pt-2 text-xs text-text-muted">
                Check browser console for detailed report
              </p>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <h4 className="mb-2 text-sm font-semibold text-text">Quick Tips:</h4>
            <ul className="list-disc space-y-1 pl-4 text-xs text-text-muted">
              <li>Check console for detailed violations</li>
              <li>Test with keyboard navigation (Tab key)</li>
              <li>Test with screen reader (VoiceOver/NVDA)</li>
              <li>Verify color contrast meets WCAG AA</li>
            </ul>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AccessibilityPanel;
