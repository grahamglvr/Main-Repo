import { LOCKED_TABS } from '../data/lines';

export function LockedTab({ tab }: { tab: keyof typeof LOCKED_TABS }) {
  return (
    <div className="locked-tab">
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="currentColor"
          d="M17 10V7a5 5 0 0 0-10 0v3H5v11h14V10zm-8-3a3 3 0 0 1 6 0v3H9zm4 10.7V19h-2v-1.3a2 2 0 1 1 2 0z"
        />
      </svg>
      <p>{LOCKED_TABS[tab]}</p>
    </div>
  );
}
