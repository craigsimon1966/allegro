import { buttonClasses } from './buttonClasses';
import { Link } from 'react-router-dom';

/**
 * "Ask a question" sits above the tab bar on phone and tablet (SPEC 10.6).
 * Links to /help for now; becomes a Radix Dialog slide-over in M4. On laptop, Quick Help docks on the right.
 */
export function QuickHelpButton() {
  return (
    <Link to="/help" className={buttonClasses('ask', 'fixed bottom-[84px] right-5 z-10 lg:hidden')}>
      Ask a question
    </Link>
  );
}
