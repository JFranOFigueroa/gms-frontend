// Registro único de rutas: todos los módulos consumen estos contratos.
// La API base se configura exclusivamente en VITE_API_BASE_URL.
const branch = (branchId) => {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(branchId || ''))) {
    throw new Error('Selecciona una sucursal válida para consultar sus datos.')
  }
  return `/branches/${encodeURIComponent(branchId)}`
}
const site = '/site'
export const endpoints = Object.freeze({
  auth: { login: '/auth/login', me: '/auth/me', refresh: '/auth/refresh', logout: '/auth/logout' },
  branches: '/branches',
  branch: (id) => branch(id),
  staff: (id) => `${branch(id)}/staff`,
  members: (id) => `${branch(id)}/members`,
  plans: (id) => `${branch(id)}/plans`,
  payments: (id) => `${branch(id)}/payments`,
  classes: (id) => `${branch(id)}/classes`,
  classTemplates: (id) => `${branch(id)}/class-templates`,
  reservations: (id) => `${branch(id)}/reservations`,
  routines: (id) => `${branch(id)}/routines`,
  products: (id) => `${branch(id)}/products`,
  sales: (id) => `${branch(id)}/sales`,
  checkins: (id) => `${branch(id)}/checkins`,
  settings: (id) => `${branch(id)}/settings`,
  modules: (id) => `${branch(id)}/modules`,
  siteSettings: `${site}/settings`,
  siteLanding: `${site}/landing-blocks`,
  siteMedia: `${site}/media`,
  siteMediaUpload: `${site}/media/upload`,
  publicSite: '/public/site',
  publicMedia: (assetId) => `/public/media/${encodeURIComponent(assetId)}`,
  users: '/users',
  userSearch: '/users/search',
  userStatus: (id) => `/users/${encodeURIComponent(id)}/status`,
  staffRegister: (id) => `${branch(id)}/staff/register`,
  memberRegister: (id) => `${branch(id)}/members/register`,
  memberMe: (id) => `${branch(id)}/members/me`,
  memberPhoto: (id, memberId) =>
    `${branch(id)}/members/${encodeURIComponent(memberId)}/photo`,
  reservationsMe: (id) => `${branch(id)}/reservations/me`,
  classAvailability: (id, classId) =>
    `${branch(id)}/classes/${encodeURIComponent(classId)}/availability`,
  checkinsMe: (id) => `${branch(id)}/checkins/me`,
  // Check-in QR y dispositivos: el kiosco usa el código de sucursal, no una landing.
  publicCheckinConfig: (code) =>
    `/public/branches/${encodeURIComponent(code)}/checkin-config`,
  kioskSession: '/kiosk/session',
  kioskActivate: '/kiosk/activate',
  kioskLogout: '/kiosk/logout',
  kioskBranchQr: '/kiosk/qr/issue',
  kioskScanMemberQr: '/kiosk/checkins/scan-member-qr',
  checkinScanBranchQr: (id) => `${branch(id)}/checkins/scan-branch-qr`,
  checkinMyQr: (id) => `${branch(id)}/checkins/me/qr`,
  // Código personal temporal, separado de la credencial QR.
  checkinMyCode: (id) => `${branch(id)}/checkins/me/code`,
  kioskValidateCode: '/kiosk/checkins/validate-code',
  checkinStats: (id) => `${branch(id)}/checkins/stats`,
  checkinDevices: (id) => `${branch(id)}/checkin-devices`,
  checkinDevice: (id, deviceId) => `${branch(id)}/checkin-devices/${encodeURIComponent(deviceId)}`,
  checkinDeviceReissue: (id, deviceId) =>
    `${branch(id)}/checkin-devices/${encodeURIComponent(deviceId)}/reissue-activation`,
  dashboardSummary: (id) => `${branch(id)}/dashboard/summary`,
})
export const itemUrl = (collection, id) => `${collection}/${encodeURIComponent(id)}`
