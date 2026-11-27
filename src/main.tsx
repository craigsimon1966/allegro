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
// Reviewer edits and approvals (in-app content review): approved items drop the Draft label.
void import('./lib/contentReview').then((m) => m.loadContentReviews());

createRoot(root).render(
  <StrictMode>
    <OfflineNotice />
    <RouterProvider router={router} />
  </StrictMode>,
);
