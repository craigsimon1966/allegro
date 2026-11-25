import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { OfflineNotice } from './components/OfflineNotice';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

// Loaded after first paint so the landing page stays small.
void import('./lib/session').then((m) => m.restoreSession());
void import('./lib/errorReport').then((m) => m.installErrorReporting());

createRoot(root).render(
  <StrictMode>
    <OfflineNotice />
    <RouterProvider router={router} />
  </StrictMode>,
);
