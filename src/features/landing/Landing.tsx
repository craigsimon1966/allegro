import { Link } from 'react-router-dom';

// Minimal scaffold of SPEC 7.1. The full landing page (hero illustration, how it works strip,
// product rows with AllegroMark, honesty strip) is built in M0.
export function Landing() {
  return (
    <>
      <header className="bg-sage-500 px-4 pb-8 pt-10 sm:px-content">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink">
          Allegro Learning
        </p>
        <h1 className="mt-3 max-w-prose text-[32px] leading-tight text-ink">
          Learn it in five minutes. Teach it with confidence.
        </h1>
        <p className="mt-3 max-w-prose text-ink">
          Professional learning that fits your week and turns into tomorrow&apos;s lesson.
        </p>
        <Link
          to="/demo"
          className="mt-6 inline-flex min-h-tap items-center rounded bg-green-700 px-5 font-bold text-white hover:bg-green-800"
        >
          Try the demo
        </Link>
      </header>
      <main className="px-4 py-8 sm:px-content">
        <p className="max-w-prose text-muted">
          Built with teachers. AI helps, humans write the content.
        </p>
      </main>
    </>
  );
}
