import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Optional: Enable accessibility testing in development
// Uncomment the lines below to enable automatic accessibility auditing
/*
import { enableConsoleAccessibilityTesting, auditOnPageLoad } from "./utils/axe-testing";

if (import.meta.env.DEV) {
  // Method 1: Enable console testing (run runA11yAudit() in console)
  enableConsoleAccessibilityTesting();
  
  // Method 2: Run audit automatically on page load (optional)
  // auditOnPageLoad(1000);
}
*/

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
