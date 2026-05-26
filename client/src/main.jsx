import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';

// Google Analytics 4 — dynamic injection using VITE_GA4_ID env variable
// Set VITE_GA4_ID=G-XXXXXXXXXX in .env.production to enable tracking
const GA4_ID = import.meta.env.VITE_GA4_ID;
if (GA4_ID) {
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(gtagScript);

  const gtagInit = document.createElement('script');
  gtagInit.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA4_ID}', { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
  `;
  document.head.appendChild(gtagInit);

  console.log('[GA4] Google Analytics initialized with ID:', GA4_ID);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);


// Register PWA Service worker in production environments
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('PWA Service Worker registered on scope:', reg.scope))
      .catch((err) => console.warn('PWA Service Worker registration skipped/failed:', err.message));
  });
}
