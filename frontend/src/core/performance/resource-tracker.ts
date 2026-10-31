export const initResourceTracking = () => {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      let jsBytes = 0;
      let cssBytes = 0;

      entries.forEach((entry) => {
        // Only count actual network transfers (ignore fully cached items with transferSize 0 unless we want to track decoded body size)
        const size = entry.transferSize || entry.decodedBodySize || 0;

        if (entry.name.endsWith('.js') || entry.initiatorType === 'script') {
          jsBytes += size;
        } else if (entry.name.endsWith('.css') || entry.initiatorType === 'css' || entry.initiatorType === 'link') {
          cssBytes += size;
        }
      });

      if (jsBytes > 0 || cssBytes > 0) {
        console.groupCollapsed("[Performance] Static Assets Loaded");
        if (jsBytes > 0) console.log(`Total JS: ${(jsBytes / 1024).toFixed(2)} KB`);
        if (cssBytes > 0) console.log(`Total CSS: ${(cssBytes / 1024).toFixed(2)} KB`);
        console.groupEnd();
      }
    });

    observer.observe({ type: "resource", buffered: true });
    
    // Also log the initial bundle on load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        let totalJs = 0;
        let totalCss = 0;

        entries.forEach(entry => {
          const size = entry.transferSize || entry.decodedBodySize || 0;
          if (entry.initiatorType === 'script' || entry.name.match(/\.js(\?.*)?$/)) {
            totalJs += size;
          } else if (entry.initiatorType === 'css' || entry.initiatorType === 'link' || entry.name.match(/\.css(\?.*)?$/)) {
            totalCss += size;
          }
        });

        console.log(`[Performance Summary] Initial Load JS: ${(totalJs / 1024 / 1024).toFixed(2)} MB`);
        console.log(`[Performance Summary] Initial Load CSS: ${(totalCss / 1024 / 1024).toFixed(2)} MB`);
      }, 1000);
    });

  } catch (err) {
    console.error("Failed to initialize resource tracking:", err);
  }
};

