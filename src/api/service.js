import { endpoints as e, itemUrl } from './endpoints'
import { http, request, getAll } from './http'
const resource = (resolve) => ({
  list: (gym) => getAll(resolve(gym)),
  one: (gym, id) => http.get(itemUrl(resolve(gym), id)),
  create: (gym, value) => http.post(resolve(gym), value),
  update: (gym, id, value) => http.patch(itemUrl(resolve(gym), id), value),
  remove: (gym, id) => http.delete(itemUrl(resolve(gym), id)),
})
export const api = {
  auth: {
    login: (email, password) =>
      request(e.auth.login, { method: 'POST', body: { email, password }, auth: false }),
    me: () => http.get(e.auth.me),
    refresh: (refreshToken) =>
      request(e.auth.refresh, { method: 'POST', body: { refreshToken }, auth: false }),
    logout: (refreshToken) =>
      request(e.auth.logout, { method: 'POST', body: { refreshToken }, auth: false }),
  },
  gyms: { ...resource(() => e.gyms) },
  staff: {
    ...resource(e.staff),
    list: (gym) => http.get(e.staff(gym)), // No admite offset/limit.
    register: (gym, user) => http.post(e.staffRegister(gym), { user, role: 'trainer' }),
  },
  users: {
    list: (params = {}) => http.get(e.users, params),
    one: (id) => http.get(itemUrl(e.users, id)),
    create: (data) => http.post(e.users, data),
    update: (id, data) => http.patch(itemUrl(e.users, id), data),
    changeStatus: (id, status) => http.patch(e.userStatus(id), { status }),
    search: (email, gymId) => http.get(e.userSearch, { email, gymId }),
  },
  members: {
    ...resource(e.members),
    register: (gym, data) => http.post(e.memberRegister(gym), data),
    me: (gym) => http.get(e.memberMe(gym)),
  },
  plans: resource(e.plans),
  payments: {
    list: (gym, memberId) => http.get(e.payments(gym), { limit: 100, memberId }),
    create: (gym, data, idempotencyKey) =>
      http.post(e.payments(gym), data, {
        extraHeaders: { 'Idempotency-Key': idempotencyKey },
      }),
  },
  classes: {
    ...resource(e.classes),
    listRange: (gym, params) => getAll(e.classes(gym), { query: params }),
    availability: (gym, classId) => http.get(e.classAvailability(gym, classId)),
  },
  templates: resource(e.classTemplates),
  reservations: {
    list: (gym, classId) => http.get(e.reservations(gym), { classId }),
    create: (gym, classId) => http.post(e.reservations(gym), { classId }),
    cancel: (gym, id) => http.delete(itemUrl(e.reservations(gym), id)),
    mine: (gym, params = {}) => http.get(e.reservationsMe(gym), params),
  },
  routines: resource(e.routines),
  products: resource(e.products),
  sales: {
    list: (gym) => http.get(e.sales(gym), { limit: 100 }),
    checkout: (gym, items, idempotencyKey) =>
      http.post(e.sales(gym), { items }, {
        extraHeaders: { 'Idempotency-Key': idempotencyKey },
      }),
  },
  checkins: {
    list: (gym) => http.get(e.checkins(gym), { limit: 100 }),
    manual: (gym, memberId) => http.post(e.checkins(gym), { memberId }),
    mine: (gym, params = {}) => http.get(e.checkinsMe(gym), params),
    scanGymQr: (gym, kioskToken, idempotencyKey) =>
      http.post(
        e.checkinScanGymQr(gym),
        { kioskToken },
        { extraHeaders: { 'Idempotency-Key': idempotencyKey } },
      ),
    issueMyQr: (gym) => http.post(e.checkinMyQr(gym)),
    issueMyCode: (gym) => http.post(e.checkinMyCode(gym)),
    stats: (gym, params) => http.get(e.checkinStats(gym), params),
  },
  // El kiosco usa solamente su cookie HttpOnly y CSRF, jamás el Bearer privado.
  kiosk: {
    publicConfig: (slug) => http.get(e.publicCheckinConfig(slug), undefined, { auth: false }),
    session: () => http.get(e.kioskSession, undefined, { auth: false, credentials: 'include' }),
    activate: (slug, activationCode) =>
      http.post(e.kioskActivate, { slug, activationCode }, { auth: false, credentials: 'include' }),
    issueGymQr: (csrfToken) =>
      http.post(e.kioskGymQr, undefined, {
        auth: false,
        credentials: 'include',
        extraHeaders: { 'X-CSRF-Token': csrfToken },
      }),
    scanMemberQr: (memberQr, idempotencyKey, csrfToken) =>
      http.post(
        e.kioskScanMemberQr,
        { memberQr },
        {
          auth: false,
          credentials: 'include',
          extraHeaders: {
            'X-CSRF-Token': csrfToken,
            'Idempotency-Key': idempotencyKey,
          },
        },
      ),
    validateCode: (accessCode, idempotencyKey, csrfToken) =>
      http.post(
        e.kioskValidateCode,
        { accessCode },
        {
          auth: false,
          credentials: 'include',
          extraHeaders: {
            'X-CSRF-Token': csrfToken,
            'Idempotency-Key': idempotencyKey,
          },
        },
      ),
    logout: (csrfToken) =>
      http.post(e.kioskLogout, undefined, {
        auth: false,
        credentials: 'include',
        extraHeaders: { 'X-CSRF-Token': csrfToken },
      }),
  },
  checkinDevices: {
    list: (gym) => http.get(e.checkinDevices(gym)),
    create: (gym, deviceName) => http.post(e.checkinDevices(gym), { deviceName }),
    reissue: (gym, deviceId) => http.post(e.checkinDeviceReissue(gym, deviceId)),
    update: (gym, deviceId, active) => http.patch(e.checkinDevice(gym, deviceId), { active }),
    remove: (gym, deviceId) => http.delete(e.checkinDevice(gym, deviceId)),
  },
  settings: {
    get: (gym) => http.get(e.settings(gym)),
    update: (gym, body) => http.patch(e.settings(gym), body),
    modules: (gym) => http.get(e.modules(gym)),
    updateModule: (gym, key, enabled) => http.patch(itemUrl(e.modules(gym), key), { enabled }),
  },
  landing: {
    ...resource(e.landing),
    link: (gym) => http.get(e.landingLink(gym)),
    changeSlug: (gym, slug) => http.patch(e.landingSlug(gym), { slug }),
    changeLogo: (gym, imageAssetId) => http.patch(e.landingLogo(gym), { imageAssetId }),
    publicPage: (slug, { signal } = {}) =>
      http.get(e.publicLanding(slug), undefined, { auth: false, signal }),
  },
  dashboard: {
    summary: (gym, params = {}) => http.get(e.dashboardSummary(gym), params),
  },
  media: {
    ...resource(e.media), // Se conserva el registro de imágenes HTTPS.
    upload: (gym, file, name = '') => {
      const body = new FormData()
      body.append('file', file)
      if (name) body.append('name', name)
      return http.post(e.mediaUpload(gym), body)
    },
    content: (gym, assetId) =>
      http.get(e.mediaContent(gym, assetId), undefined, { responseType: 'blob' }),
  },
}
