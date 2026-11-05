// Registro único de rutas: todos los módulos consumen estos contratos.
// La API base se configura exclusivamente en VITE_API_BASE_URL.
const gym = (gymId) => {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(gymId || ''))) {
    throw new Error('Selecciona un gimnasio válido para consultar sus datos.');
  }
  return `/gyms/${encodeURIComponent(gymId)}`;
};
export const endpoints = Object.freeze({
  auth: { login: '/auth/login', me: '/auth/me', refresh: '/auth/refresh', logout: '/auth/logout' },
  gyms: '/gyms',
  gym: (id) => gym(id),
  staff: (id) => `${gym(id)}/staff`,
  members: (id) => `${gym(id)}/members`,
  plans: (id) => `${gym(id)}/plans`,
  payments: (id) => `${gym(id)}/payments`,
  classes: (id) => `${gym(id)}/classes`,
  classTemplates: (id) => `${gym(id)}/class-templates`,
  reservations: (id) => `${gym(id)}/reservations`,
  routines: (id) => `${gym(id)}/routines`,
  products: (id) => `${gym(id)}/products`,
  sales: (id) => `${gym(id)}/sales`,
  checkins: (id) => `${gym(id)}/checkins`,
  settings: (id) => `${gym(id)}/settings`,
  modules: (id) => `${gym(id)}/modules`,
  landing: (id) => `${gym(id)}/landing-blocks`,
  media: (id) => `${gym(id)}/media-assets`,
  mediaUpload: (id) => `${gym(id)}/media-assets/upload`,
  mediaContent: (id, assetId) => `${gym(id)}/media-assets/${encodeURIComponent(assetId)}/content`,
  landingLogo: (id) => `${gym(id)}/landing/logo`,
  users: '/users',
  userSearch: '/users/search',
  userStatus: (id) => `/users/${encodeURIComponent(id)}/status`,
  staffRegister: (id) => `${gym(id)}/staff/register`,
  memberRegister: (id) => `${gym(id)}/members/register`,
  memberMe: (id) => `${gym(id)}/members/me`,
  reservationsMe: (id) => `${gym(id)}/reservations/me`,
  classAvailability: (id, classId) => `${gym(id)}/classes/${encodeURIComponent(classId)}/availability`,
  checkinsMe: (id) => `${gym(id)}/checkins/me`,
  landingLink: (id) => `${gym(id)}/landing/link`,
  landingSlug: (id) => `${gym(id)}/landing/slug`,
  publicLanding: (slug) => `/public/gyms/${encodeURIComponent(slug)}/landing`,
  publicMedia: (assetId) => `/public/media/${encodeURIComponent(assetId)}`, 
  dashboardSummary: (id) => `${gym(id)}/dashboard/summary`,
});
export const itemUrl = (collection, id) => `${collection}/${encodeURIComponent(id)}`;
