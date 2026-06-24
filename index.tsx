
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Dynamically Initialize Google Analytics 4
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-1ES343KS3J';
if (GA_ID && typeof window !== 'undefined') {
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}', {
      page_path: window.location.pathname + window.location.search
    });
    window.gtag = gtag;
  `;
  document.head.appendChild(script2);
  console.log(`[Analytics] Google Analytics 4 initialized successfully: ${GA_ID}`);
} else {
  // Safe mock function to prevent runtime reference errors if no tag is active
  (window as any).gtag = function() {
    if (import.meta.env.DEV) {
      console.log('[Analytics Dry Run]', arguments);
    }
  };
}

// Register Service Worker for System Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

