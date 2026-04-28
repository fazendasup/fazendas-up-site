import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function injectUmamiAnalytics() {
  const raw = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
  if (!raw?.trim() || !websiteId?.trim()) return;

  const endpoint = raw.replace(/\/$/, "");
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.setAttribute("data-website-id", websiteId.trim());
  document.body.appendChild(script);
}

injectUmamiAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
