import { NavLink } from 'react-router-dom';
import { MAIN_NAV } from './nav';

/** Phone and tablet bottom tabs. Active tab: bold ink with a 4px plum underline. Hidden on laptop. */
export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 grid h-16 grid-cols-4 border-t-2 border-rule-strong bg-surface lg:hidden"
    >
      {MAIN_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center justify-center text-[15px] no-underline ${
              isActive
                ? 'font-bold text-ink shadow-[inset_0_-4px_0_var(--plum-500)]'
                : 'text-muted'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
