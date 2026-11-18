import { endpoints as e, itemUrl } from './endpoints'
import { http, request, getAll } from './http'
const resource = (resolve) => ({
  list: (branch) => getAll(resolve(branch)),
  one: (branch, id) => http.get(itemUrl(resolve(branch), id)),
  create: (branch, value) => http.post(resolve(branch), value),
  update: (branch, id, value) => http.patch(itemUrl(resolve(branch), id), value),
  remove: (branch, id) => http.delete(itemUrl(resolve(branch), id)),
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
  branches: {
    list: () => getAll(e.branches),
    one: (id) => http.get(e.branch(id)),
    create: (value) => http.post(e.branches, value),
    update: (id, value) => http.patch(e.branch(id), value),
    remove: (id) => http.delete(e.branch(id)),
  },
  staff: {
    ...resource(e.staff),
    list: (branch) => http.get(e.staff(branch)), // No admite offset/limit.
    register: (branch, user) => http.post(e.staffRegister(branch), { user, role: 'trainer' }),
  },
  users: {
    list: (params = {}) => http.get(e.users, params),
    one: (id) => http.get(itemUrl(e.users, id)),
    create: (data) => http.post(e.users, data),
    update: (id, data) => http.patch(itemUrl(e.users, id), data),
    changeStatus: (id, status) => http.patch(e.userStatus(id), { status }),
    search: (email, branchId) => http.get(e.userSearch, { email, branchId }),
  },
  members: {
    ...resource(e.members),
    register: (branch, data) => http.post(e.memberRegister(branch), data),
    me: (branch) => http.get(e.memberMe(branch)),
    photo: (branch, memberId) =>
      http.get(e.memberPhoto(branch, memberId), undefined, { responseType: 'blob' }),
    uploadPhoto: (branch, memberId, file) => {
      const body = new FormData()
      body.append('file', file)
      return http.post(e.memberPhoto(branch, memberId), body)
    },
    removePhoto: (branch, memberId) => http.delete(e.memberPhoto(branch, memberId)),
  },
  plans: resource(e.plans),
  adminPlans: resource(e.adminPlans),
  payments: {
    list: (branch, memberId) => http.get(e.payments(branch), { limit: 100, memberId }),
    create: (branch, data, idempotencyKey) =>
      http.post(e.payments(branch), data, {
        extraHeaders: { 'Idempotency-Key': idempotencyKey },
      }),
  },
  classes: {
    ...resource(e.classes),
    listRange: (branch, params) => getAll(e.classes(branch), { query: params }),
    availability: (branch, classId) => http.get(e.classAvailability(branch, classId)),
  },
  templates: resource(e.classTemplates),
  reservations: {
    list: (branch, classId) => http.get(e.reservations(branch), { classId }),
    create: (branch, classId) => http.post(e.reservations(branch), { classId }),
    cancel: (branch, id) => http.delete(itemUrl(e.reservations(branch), id)),
    mine: (branch, params = {}) => http.get(e.reservationsMe(branch), params),
  },
  routines: resource(e.routines),
  products: resource(e.products),
  sales: {
    list: (branch) => http.get(e.sales(branch), { limit: 100 }),
    checkout: (branch, items, idempotencyKey) =>
      http.post(
        e.sales(branch),
        { items },
        {
          extraHeaders: { 'Idempotency-Key': idempotencyKey },
        },
      ),
  },
  checkins: {
    list: (branch) => http.get(e.checkins(branch), { limit: 100 }),
    manual: (branch, memberId) => http.post(e.checkins(branch), { memberId }),
    mine: (branch, params = {}) => http.get(e.checkinsMe(branch), params),
    scanBranchQr: (branch, kioskToken, idempotencyKey) =>
      http.post(
        e.checkinScanBranchQr(branch),
        { kioskToken },
        { extraHeaders: { 'Idempotency-Key': idempotencyKey } },
      ),
    issueMyQr: (branch) => http.post(e.checkinMyQr(branch)),
    issueMyCode: (branch) => http.post(e.checkinMyCode(branch)),
    stats: (branch, params) => http.get(e.checkinStats(branch), params),
  },
  // El kiosco usa solamente su cookie HttpOnly y CSRF, jamás el Bearer privado.
  kiosk: {
    publicConfig: (code) => http.get(e.publicCheckinConfig(code), undefined, { auth: false }),
    session: () => http.get(e.kioskSession, undefined, { auth: false, credentials: 'include' }),
    activate: (code, activationCode) =>
      http.post(e.kioskActivate, { code, activationCode }, { auth: false, credentials: 'include' }),
    issueBranchQr: (csrfToken) =>
      http.post(e.kioskBranchQr, undefined, {
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
    list: (branch) => http.get(e.checkinDevices(branch)),
    create: (branch, deviceName) => http.post(e.checkinDevices(branch), { deviceName }),
    reissue: (branch, deviceId) => http.post(e.checkinDeviceReissue(branch, deviceId)),
    update: (branch, deviceId, active) => http.patch(e.checkinDevice(branch, deviceId), { active }),
    remove: (branch, deviceId) => http.delete(e.checkinDevice(branch, deviceId)),
  },
  settings: {
    get: (branch) => http.get(e.settings(branch)),
    update: (branch, body) => http.patch(e.settings(branch), body),
    modules: (branch) => http.get(e.modules(branch)),
    updateModule: (branch, key, enabled) =>
      http.patch(itemUrl(e.modules(branch), key), { enabled }),
  },
  site: {
    publicPage: ({ signal } = {}) => http.get(e.publicSite, undefined, { auth: false, signal }),
    settings: {
      get: () => http.get(e.siteSettings),
      update: (body) => http.patch(e.siteSettings, body),
    },
    landing: resource(() => e.siteLanding),
    media: {
      ...resource(() => e.siteMedia),
      // El catálogo del sitio no pagina: se solicita completo en una sola llamada.
      list: () => http.get(e.siteMedia),
      upload: (file, name = '') => {
        const body = new FormData()
        body.append('file', file)
        if (name) body.append('name', name)
        return http.post(e.siteMediaUpload, body)
      },
    },
  },
  dashboard: {
    summary: (branch, params = {}) => http.get(e.dashboardSummary(branch), params),
  },
}
