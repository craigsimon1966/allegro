import { createBrowserRouter } from 'react-router-dom';
import { Landing } from '@/features/landing/Landing';
import { Placeholder } from './Placeholder';

// Routes from SPEC.md section 6 and TECH_SPEC.md section 9.1.
// Each placeholder names the milestone that builds the real screen.
export const routes = [
  { path: '/', element: <Landing /> },
  { path: '/demo', element: <Placeholder title="Choose a teacher" milestone="M1" /> },
  { path: '/signin', element: <Placeholder title="Sign in" milestone="M1" /> },
  { path: '/auth/callback', element: <Placeholder title="Signing you in" milestone="M1" /> },
  { path: '/start', element: <Placeholder title="Tell us your situation" milestone="M1" /> },
  { path: '/needs', element: <Placeholder title="Your learning needs" milestone="M1" /> },
  { path: '/pathway', element: <Placeholder title="Your pathway" milestone="M2" /> },
  { path: '/learn/:unitId', element: <Placeholder title="Learn" milestone="M2" /> },
  { path: '/plan', element: <Placeholder title="Plan a lesson" milestone="M3" /> },
  { path: '/plan/:lessonId', element: <Placeholder title="Your lesson" milestone="M3" /> },
  { path: '/reflect', element: <Placeholder title="Reflect" milestone="M4" /> },
  { path: '/growth', element: <Placeholder title="Your growth" milestone="M4" /> },
  { path: '/help', element: <Placeholder title="Quick Help" milestone="M4" /> },
  { path: '/leader', element: <Placeholder title="Leader preview" milestone="M5" /> },
  { path: '/admin/feedback', element: <Placeholder title="Pilot feedback" milestone="M5" /> },
  { path: '/about-demo', element: <Placeholder title="About this demo" milestone="M0" /> },
  { path: '/styleguide', element: <Placeholder title="Style guide" milestone="M0" /> },
  { path: '*', element: <Placeholder title="Page not found" /> },
];

export const router = createBrowserRouter(routes);
