import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./App";
import { Providers } from "./providers";


import "../../index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Automatically reload the page when a new version is deployed and the browser tries to fetch an outdated chunk
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('Failed to fetch dynamically imported module')) {
    event.preventDefault();
    window.location.reload();
  }
});

import { PerformanceMonitor } from "../core/performance/PerformanceMonitor";

const bootstrap = async () => {

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Providers>
          <PerformanceMonitor />
          <App />
        </Providers>
      </BrowserRouter>
    </React.StrictMode>
  );
};

bootstrap();

