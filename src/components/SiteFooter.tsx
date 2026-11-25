import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/brand/logo-white.svg"
            alt="Allegro Learning. All learn grow."
            width={196}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-1 text-sm">
          <Link to="/about-demo" className="text-white underline">
            About this demo, privacy and AI
          </Link>
          <Link to="/leader" className="text-white underline">
            For school leaders
          </Link>
        </nav>
      </div>
    </footer>
  );
}
