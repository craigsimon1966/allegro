import { Link } from 'react-router-dom';
import { AllegroMark } from './AllegroMark';
import { buttonClasses } from './buttonClasses';

/** Marketing header for public pages (SPEC 7.1). */
export function SiteHeader() {
  return (
    <header className="border-b-2 border-rule-strong bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-ink no-underline">
          <AllegroMark size={30} label="Allegro Learning home" />
          <span className="font-heading text-lg font-semibold sm:text-xl">
            Allegro<span className="hidden min-[400px]:inline"> Learning</span>
          </span>
        </Link>
        <nav aria-label="Site" className="ml-auto flex items-center gap-5">
          <a
            href="/#how-it-works"
            className="hidden min-h-tap items-center text-green-700 sm:inline-flex"
          >
            How it works
          </a>
          <Link
            to="/leader"
            className="hidden min-h-tap items-center text-green-700 sm:inline-flex"
          >
            For leaders
          </Link>
          <Link to="/demo" className={buttonClasses('primary')}>
            Try the demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
