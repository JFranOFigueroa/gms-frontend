/** Textos públicos de los códigos técnicos del backend. No alterar los códigos de la API. */
const REASONS = Object.freeze({
  granted: 'Acceso autorizado.',
  allowed: 'Acceso autorizado.',
  ok: 'Acceso autorizado.',
  no_active_subscription: 'No se encontró una membresía activa para autorizar el acceso.',
  inactive_subscription: 'La membresía se encuentra inactiva.',
  subscription_expired: 'La membresía ha vencido. Solicita su renovación en recepción.',
  membership_expired: 'La membresía ha vencido. Solicita su renovación en recepción.',
  expired: 'La membresía ha vencido. Solicita su renovación en recepción.',
  no_payment: 'No hay un pago registrado para la membresía.',
  inactive: 'La membresía se encuentra inactiva.',
  member_inactive: 'El perfil del miembro se encuentra inactivo.',
  duplicate: 'El acceso ya fue registrado anteriormente.',
  already_checked_in: 'El acceso ya fue registrado anteriormente.',
  wrong_gym: 'La credencial corresponde a otro gimnasio.',
  not_found: 'No se encontró una membresía asociada.',
  invalid_code: 'El código de acceso no es válido.',
  expired_code: 'El código de acceso ha caducado.',
  invalid_token: 'La credencial de acceso no es válida.',
  unauthorized: 'No fue posible autorizar el acceso.',
  access_denied: 'No fue posible autorizar el acceso.',
})

const METHODS = Object.freeze({
  manual: 'Registro en recepción',
  kiosk_qr: 'Código QR',
  kiosk_code: 'Código temporal',
  qr: 'Código QR',
  administrative: 'Registro administrativo',
})

const ROLES = Object.freeze({
  member: 'Miembro',
  staff: 'Personal',
  guest: 'Invitado',
  trainer: 'Entrenador',
  owner: 'Propietario',
  admin: 'Administrador',
})

export function formatCheckinReason(value) {
  const reason = String(value ?? '').trim()
  if (!reason) return 'No fue posible autorizar el acceso.'
  const key = reason.toLowerCase().replace(/[\s-]+/g, '_')
  if (REASONS[key]) return REASONS[key]
  // Evitar presentar enums del backend (como active_subscription) al usuario.
  if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/i.test(reason))
    return 'No fue posible autorizar el acceso. Verifica tu membresía en recepción.'
  return reason
}

export function formatCheckinMethod(value) {
  return METHODS[String(value ?? '').toLowerCase()] || 'Registro de acceso'
}

export function formatCheckinRole(value) {
  return ROLES[String(value ?? '').toLowerCase()] || 'Usuario'
}
