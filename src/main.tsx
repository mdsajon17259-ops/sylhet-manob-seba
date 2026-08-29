import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

// Register Service Worker for offline caching
registerServiceWorker({
  onSuccess: () => {
    console.log('App is ready for offline usage via Service Worker caching.');
  },
  onUpdate: () => {
    console.log('New update available.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

