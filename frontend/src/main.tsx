import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Global: Prevent mouse wheel from changing number input values
document.addEventListener('wheel', function (e) {
  if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });
