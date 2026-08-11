import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/main.css";
import { registerSW } from "virtual:pwa-register";

// Registra el service worker. Con registerType 'autoUpdate', cuando se
// despliegue una versión nueva el SW se actualiza solo (skipWaiting +
// clientsClaim), sin que el usuario deba reinstalar la app.
const updateSW = registerSW({
  immediate: true,
  onOfflineReady() {
    console.log("OncoDetect listo para usarse sin conexión.");
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    } else {
      console.log("Service worker registrado:", swUrl);
    }
  },
});

// Expón un helper para forzar la recarga cuando hay una versión nueva.
if (import.meta.env.DEV) {
  window.__ONCODETECT_UPDATE__ = updateSW;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
