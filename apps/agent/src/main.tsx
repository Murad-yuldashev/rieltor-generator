import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/providers';
import './app/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root topilmadi');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
