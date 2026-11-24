import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Register cross-platform PWA service worker with silent auto-update
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      // Ready for offline browsing on iOS & Android
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
