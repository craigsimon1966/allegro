/* eslint-disable react-refresh/only-export-components -- route table module, not a component module */
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Landing } from '@/features/landing/Landing';
import { AllegroMark } from '@/components/AllegroMark';
import { Placeholder } from './Placeholder';

const AboutDemo = lazy(() => import('@/features/about/AboutDemo'));
const Styleguide = lazy(() => import('@/features/styleguide/Styleguide'));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <AllegroMark size={48} loading label="Loading" />
    </div>
  );
}

const lazyPage = (node: ReactNode) => <Suspense fallback={<Loading />}>{node}</Suspense>;

// Routes from SPEC.md section 6 and TECH_SPEC.md section 9.1.
// Each placeholder names the milestone that builds the real screen.
export const routes = [
  { path: '/', element: <Landing /> },
  { path: '/about-demo', element: lazyPage(<AboutDemo />) },
  { path: '/styleguide', element: lazyPage(<Styleguide />) },
  { path: '/demo', element: <Placeholder title="Choose a teacher" milestone="M1" /> },
  { path: '/signin', element: <Placeholder title="Sign in" milestone="M1" /> },
  { path: '/auth/callback', element: <Placeholder title="Signing you in" milestone="M1" /> },
  {
    path: '/start',
    element: <Placeholder title="Tell us your situation" milestone="M1" shell step={1} />,
  },
  {
    path: '/needs',
    element: <Placeholder title="Your learning needs" milestone="M1" shell step={2} />,
  },
  { path: '/pathway', element: <Placeholder title="This week" milestone="M2" shell step={3} /> },
  { path: '/learn/:unitId', element: <Placeholder title="Learn" milestone="M2" shell step={4} /> },
  { path: '/plan', element: <Placeholder title="Plan a lesson" milestone="M3" shell step={5} /> },
  {
    path: '/plan/:lessonId',
    element: <Placeholder title="Your lesson" milestone="M3" shell step={5} />,
  },
  { path: '/reflect', element: <Placeholder title="Reflect" milestone="M4" shell step={6} /> },
  { path: '/growth', element: <Placeholder title="Your growth" milestone="M4" shell /> },
  { path: '/help', element: <Placeholder title="Quick Help" milestone="M4" shell /> },
  { path: '/leader', element: <Placeholder title="Leader preview" milestone="M5" /> },
  { path: '/admin/feedback', element: <Placeholder title="Pilot feedback" milestone="M5" /> },
  { path: '*', element: <Placeholder title="Page not found" /> },
];

export const router = createBrowserRouter(routes);
