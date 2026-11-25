import { Link, NavLink } from 'react-router-dom';
import { Label } from './Label';
import { MAIN_NAV } from './nav';
import { StepSquares } from './StepSquares';

/** Laptop "Contents" sidebar: ruled list, active item with a green left edge (SPEC 10.6). */
export function Sidebar({ step }: { step?: number }) {
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r-2 border-rule-strong py-7 lg:flex"
    >
      <Link to="/" className="block px-5 pb-5 no-underline">
        <img
          src="/brand/logo-green.svg"
          alt="Allegro Learning home"
          width={180}
          height={44}
          className="h-auto w-full"
        />
      </Link>
      <Label className="px-5 pb-2">Contents</Label>
      <div className="border-t border-rule">
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex h-[46px] items-center border-b border-rule px-5 text-base no-underline ${
                isActive
                  ? 'bg-sage-100 font-bold text-ink shadow-[inset_4px_0_0_var(--green-700)]'
                  : 'text-ink hover:bg-sage-100'
              }`
            }
          >
            {item.sidebarLabel}
          </NavLink>
        ))}
      </div>
      {step !== undefined && (
        <div className="mt-auto flex flex-col gap-1.5 px-5">
          <Label>Your loop</Label>
          <StepSquares current={step} />
        </div>
      )}
    </nav>
  );
}
