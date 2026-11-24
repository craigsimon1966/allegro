import { SiteHeader } from '@/components/SiteHeader';
import { MarginLayout } from '@/components/MarginLayout';
import { SignInForm } from './SignInForm';

export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <MarginLayout className="lg:mx-auto lg:max-w-[720px]">
          <h1 className="mb-6 text-[30px] leading-tight">Sign in to Allegro</h1>
          <SignInForm />
        </MarginLayout>
      </main>
    </>
  );
}
