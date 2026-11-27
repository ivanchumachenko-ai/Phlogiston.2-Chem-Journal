import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isPinnedApp, openPreferredApp, recordLaunch } from "./lib/launchStatistics";
// @ts-ignore
import { registerSW } from "virtual:pwa-register";

async function start() {
  if (await openPreferredApp().catch(() => false)) return;
  if (import.meta.env.DEV && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key);
        });
      });
    }
  } else if (isPinnedApp) {
    void navigator.serviceWorker?.register("./phlogiston-sw.js", { updateViaCache: "none" }).catch(console.error);
  } else if (import.meta.env.PROD) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true);
      },
      onOfflineReady() {
        console.log("App is ready to work offline");
      },
    });
  }

  recordLaunch(fetch, () => false);
  createRoot(document.getElementById("root")!).render(<App />);
}

void start();
