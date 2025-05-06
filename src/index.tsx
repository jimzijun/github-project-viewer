import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './theme.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './utils/ThemeContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Track web vitals performance metrics
reportWebVitals(metric => {
  // Only log metrics in development environment
  if (process.env.NODE_ENV === 'development') {
    // Log to console but don't clutter production logs
    console.debug('[Web Vitals]', metric.name, metric.value);
  }
  
  // In production, you would send to an analytics service instead
  // Example implementation:
  // if (process.env.NODE_ENV === 'production') {
  //   if (window.gtag) {
  //     window.gtag('event', metric.name, {
  //       value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //       event_category: 'Web Vitals',
  //       event_label: metric.id,
  //       non_interaction: true,
  //     });
  //   }
  // }
});
