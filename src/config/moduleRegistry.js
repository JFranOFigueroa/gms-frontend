export const moduleRegistry = [
  {
    id: 'calendar',
    label: 'Calendario de clases',
    description: 'Agenda, horarios, plantillas y reservas de clases grupales.',
    defaultEnabled: false,
    icon: '📅',
  },
  {
    id: 'routines',
    label: 'Rutinas generales',
    description: 'Biblioteca de rutinas para consulta de los miembros.',
    defaultEnabled: true,
    icon: '🏋️',
  },
  {
    id: 'checkin',
    label: 'Check-in de miembros',
    description: 'Registro de llegada, QR efímero y auditoría para administradores.',
    defaultEnabled: true,
    icon: '✅',
  },
  {
    id: 'pos',
    label: 'POS e inventario',
    description: 'Ventas, inventario y reportes para administración.',
    defaultEnabled: true,
    icon: '🧾',
  },
]

export const modulePresets = {
  traditional: {
    calendar: false,
    routines: true,
    checkin: true,
    users: true,
    pos: true,
  },
  crossfit: {
    calendar: true,
    routines: false,
    checkin: true,
    users: true,
    pos: true,
  },
  mixed: {
    calendar: true,
    routines: true,
    checkin: true,
    users: true,
    pos: true,
  },
}