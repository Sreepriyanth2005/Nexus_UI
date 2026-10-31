import { useEffect, useRef } from 'react';
import { initWebVitalsTracking } from './web-vitals';
import { initResourceTracking } from './resource-tracker';

/**
 * A headless component that initializes global frontend performance monitoring.
 * It tracks Core Web Vitals (LCP, INP, CLS), TTFB, FCP, and static asset sizes.
 * Render this near the root of the React tree (e.g. inside App.tsx or main.tsx).
 */
export const PerformanceMonitor = () => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (process.env.NODE_ENV !== 'test') {
      initWebVitalsTracking();
      initResourceTracking();
      console.log("⚡ Frontend Performance Monitoring Initialized");
    }
  }, []);

  return null; // Headless component
};

