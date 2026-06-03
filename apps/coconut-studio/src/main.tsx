import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { ThemeProvider } from './theme/ThemeProvider';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
