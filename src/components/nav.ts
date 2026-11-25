// Day-to-day navigation (SPEC 5, 10.6).
export const MAIN_NAV = [
  { label: 'Week', sidebarLabel: 'This week', to: '/pathway' },
  { label: 'Lessons', sidebarLabel: 'Lessons', to: '/plan' },
  { label: 'Growth', sidebarLabel: 'Growth', to: '/growth' },
  { label: 'Me', sidebarLabel: 'Me', to: '/me' },
] as const;
