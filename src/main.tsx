import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { pwaManager } from "./lib/pwa.ts";
import { pushNotificationManager } from "./lib/notifications.ts";

// Import debugging utilities
import "./lib/debug-supabase.ts";

// Initialize PWA features
pwaManager.init();
pushNotificationManager.init();

createRoot(document.getElementById("root")!).render(<App />);
