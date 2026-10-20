/**
 * Matriz central de roles y permisos de GMS.
 *
 * - admin: staff de GMS. Administra la plataforma, gimnasios y módulos.
 * - owner: propietario de un gimnasio. Acceso completo excepto lo exclusivo de admin.
 * - trainer: entrenador. Acceso operativo limitado a sus gimnasios.
 * - member: miembro del gimnasio.
 * - guest: acceso temporal.
 */

export const ROLE_LABELS = {
  admin: 'Administrador GMS',
  owner: 'Propietario',
  trainer: 'Entrenador',
  member: 'Miembro',
  guest: 'Invitado',
}

export const isAdmin = (role) => role === 'admin'
export const isOwner = (role) => role === 'owner'
export const isTrainer = (role) => role === 'trainer'
export const isMember = (role) => role === 'member'
export const isGuest = (role) => role === 'guest'

/** Admin y owner comparten la vista de gestión del gimnasio. */
export const isManager = (role) => isAdmin(role) || isOwner(role)

/** Solo el staff de GMS puede activar/desactivar módulos. */
export const canManageModules = (role) => isAdmin(role)

/** Solo el staff de GMS puede crear/editar/eliminar gimnasios. */
export const canManageGyms = (role) => isAdmin(role)

/** Landing builder y multimedia son de admin y owner. */
export const canAccessLandingBuilder = (role) => isAdmin(role) || isOwner(role)
export const canAccessMedia = (role) => isAdmin(role) || isOwner(role)

/** Miembros: admin y owner gestionan; trainer solo lectura. */
export const canViewMembers = (role) => isAdmin(role) || isOwner(role) || isTrainer(role)
export const canManageMembers = (role) => isAdmin(role) || isOwner(role)
export const canManagePayments = (role) => isAdmin(role) || isOwner(role)

/** Usuarios internos (staff): admin y owner gestionan. */
export const canManageStaff = (role) => isAdmin(role) || isOwner(role)

/** Qué roles puede crear/editar cada rol dentro de Usuarios. */
export const assignableRoles = (role) => {
  if (isAdmin(role)) return ['owner', 'trainer']
  if (isOwner(role)) return ['trainer']

  return []
}

export const canEditStaffRole = (actorRole, targetRole) => {
  return assignableRoles(actorRole).includes(targetRole)
}
