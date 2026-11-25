/* eslint-disable react-refresh/only-export-components -- route table module, not a component module */
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { RouteFocus } from '@/components/RouteFocus';
import { SkipLink } from '@/components/SkipLink';
import { UpdateNotice } from '@/components/UpdateNotice';
import { Landing } from '@/features/landing/Landing';
import { AllegroMark } from '@/components/AllegroMark';
import { Placeholder } from './Placeholder';
import { RouteError } from './RouteError';

const AboutDemo = lazy(() => import('@/features/about/AboutDemo'));
const Styleguide = lazy(() => import('@/features/styleguide/Styleguide'));
const DemoPicker = lazy(() => import('@/features/demo/DemoPicker'));
const SignInPage = lazy(() => import('@/features/auth/SignInPage'));
const AuthCallback = lazy(() => import('@/features/auth/AuthCallback'));
const Intake = lazy(() => import('@/features/intake/Intake'));
const Needs = lazy(() => import('@/features/needs/Needs'));
const Pathway = lazy(() => import('@/features/pathway/Pathway'));
const Learn = lazy(() => import('@/features/learn/Learn'));
const PlanForm = lazy(() => import('@/features/plan/PlanForm'));
const LessonView = lazy(() => import('@/features/plan/LessonView'));
const Reflect = lazy(() => import('@/features/reflect/Reflect'));
const Growth = lazy(() => import('@/features/growth/Growth'));
const Help = lazy(() => import('@/features/help/Help'));
const Leader = lazy(() => import('@/features/leader/Leader'));
const Survey = lazy(() => import('@/features/feedback/Survey'));
const AdminFeedback = lazy(() => import('@/features/admin/AdminFeedback'));
const Me = lazy(() => import('@/features/me/Me'));

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
  { path: '/demo', element: lazyPage(<DemoPicker />) },
  { path: '/signin', element: lazyPage(<SignInPage />) },
  { path: '/auth/callback', element: lazyPage(<AuthCallback />) },
  { path: '/start', element: lazyPage(<Intake />) },
  { path: '/needs', element: lazyPage(<Needs />) },
  { path: '/pathway', element: lazyPage(<Pathway />) },
  { path: '/learn/:unitId', element: lazyPage(<Learn />) },
  { path: '/plan', element: lazyPage(<PlanForm />) },
  { path: '/plan/:lessonId', element: lazyPage(<LessonView />) },
  { path: '/reflect', element: lazyPage(<Reflect />) },
  { path: '/growth', element: lazyPage(<Growth />) },
  { path: '/help', element: lazyPage(<Help />) },
  { path: '/me', element: lazyPage(<Me />) },
  { path: '/leader', element: lazyPage(<Leader />) },
  { path: '/survey', element: lazyPage(<Survey />) },
  { path: '/admin/feedback', element: lazyPage(<AdminFeedback />) },
  { path: '*', element: <Placeholder title="Page not found" /> },
];

// One error screen for every route, so a crash never leaves a blank page.
function Root() {
  return (
    <>
      <SkipLink />
      <RouteFocus />
      <UpdateNotice />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  { element: <Root />, errorElement: <RouteError />, children: routes },
]);
