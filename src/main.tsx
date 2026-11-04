import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SoundStoreProvider } from './hooks/useSoundStore';
import './styles/global.css';
import { CLOUDFLARE_ANALYTICS_TOKEN } from './config';
import { setupPwa } from './pwa';

setupPwa();

// 익명 방문자 통계 (토큰을 넣었을 때만)
if (CLOUDFLARE_ANALYTICS_TOKEN && import.meta.env.PROD) {
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.dataset.cfBeacon = JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN });
  document.head.appendChild(s);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SoundStoreProvider>
      <App />
    </SoundStoreProvider>
  </React.StrictMode>,
);
