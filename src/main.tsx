import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SoundStoreProvider } from './hooks/useSoundStore';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SoundStoreProvider>
      <App />
    </SoundStoreProvider>
  </React.StrictMode>,
);
