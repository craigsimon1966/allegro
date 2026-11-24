import { Link } from 'react-router-dom';
import { AllegroMark } from './AllegroMark';

export function SiteFooter() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <AllegroMark size={30} tone="white" />
          <div>
            <div className="font-heading text-lg font-semibold">Allegro Learning</div>
            <div className="text-sm">All learn grow</div>
          </div>
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
