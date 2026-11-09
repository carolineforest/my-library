// Starting point: loads the theme and shows the app.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/theme.css';
import './theme/global.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
