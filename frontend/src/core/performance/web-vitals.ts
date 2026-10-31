import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

const reportToAnalytics = (metric: Metric) => {
  // In a real production environment, you would stringify this and send it via navigator.sendBeacon
  // or push it to an analytics tool (like Sentry, Google Analytics, Datadog).
  
  const thresholds: Record<string, number> = {
    LCP: 2500, // <= 2.5s
    INP: 200,  // <= 200ms
    CLS: 0.1,  // <= 0.1
  };

  const isPoor = thresholds[metric.name] && metric.value > thresholds[metric.name];

  console.groupCollapsed(`[Web Vitals] ${metric.name} ${isPoor ? "🔴 POOR" : "🟢 GOOD"}`);
  console.log(`Value: ${Math.round(metric.value * 1000) / 1000}`);
  console.log(`Rating: ${metric.rating}`);
  console.log(`Delta: ${metric.delta}`);
  console.log(metric);
  console.groupEnd();

  // Example of sending to an endpoint (fire and forget)
  // if (process.env.NODE_ENV === 'production') {
  //   navigator.sendBeacon('/api/v1/analytics/vitals', JSON.stringify(metric));
  // }
};

export const initWebVitalsTracking = () => {
  try {
    onCLS(reportToAnalytics);
    onINP(reportToAnalytics);
    onLCP(reportToAnalytics);
    onFCP(reportToAnalytics);
    onTTFB(reportToAnalytics);
  } catch (error) {
    console.error("Failed to initialize web vitals tracking", error);
  }
};

