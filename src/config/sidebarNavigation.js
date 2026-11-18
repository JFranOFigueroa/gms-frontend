export const sidebarNavigation = {
  admin: [
    {
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      label: 'POS',
      path: '/dashboard/pos',
      module: 'pos',
    },
    {
      label: 'Calendario',
      path: '/dashboard/calendar',
      module: 'calendar',
    },
    {
      label: 'Rutinas',
      path: '/dashboard/routines',
      moduleAny: ['routines', 'calendar'],
    },
    {
      label: 'Miembros',
      path: '/dashboard/members',
    },
    {
      label: 'Gestión',
      path: '/dashboard/management',
    },
    {
      label: 'Check-in',
      path: '/dashboard/checkin-audit',
      module: 'checkin',
    },
    {
      label: 'Landing Builder',
      path: '/dashboard/landing-builder',
    },
  ],

  owner: [
    {
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      label: 'POS',
      path: '/dashboard/pos',
      module: 'pos',
    },
    {
      label: 'Calendario',
      path: '/dashboard/calendar',
      module: 'calendar',
    },
    {
      label: 'Rutinas',
      path: '/dashboard/routines',
      moduleAny: ['routines', 'calendar'],
    },
    {
      label: 'Miembros',
      path: '/dashboard/members',
    },
    {
      label: 'Gestión',
      path: '/dashboard/management',
    },
    {
      label: 'Check-in',
      path: '/dashboard/checkin-audit',
      module: 'checkin',
    },
    {
      label: 'Landing Builder',
      path: '/dashboard/landing-builder',
    },
  ],

  trainer: [
    {
      label: 'POS',
      path: '/dashboard/pos',
      module: 'pos',
    },
    {
      label: 'Rutinas',
      path: '/dashboard/routines',
      module: 'routines',
    },
  ],

  member: [
    {
      label: 'Check-in',
      path: '/dashboard/checkin',
      module: 'checkin',
    },
    {
      label: 'Mi Rutina',
      path: '/dashboard/routine',
      module: 'routines',
    },
    {
      label: 'Calendario',
      path: '/dashboard/calendar',
      module: 'calendar',
    },
  ],

  guest: [
    {
      label: 'Check-in',
      path: '/dashboard/checkin',
      module: 'checkin',
    },
    {
      label: 'Calendario',
      path: '/dashboard/calendar',
      module: 'calendar',
    },
  ],
}
