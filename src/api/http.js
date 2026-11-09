/** Cliente fetch central: JSON, multipart, binarios y renovación única de sesión. */
const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()
const baseUrl = configuredBase?.replace(/\/+$/, '')
const TOKEN_KEY = 'gymback:access-token'
let refreshTokenInMemory = null // Nunca se escribe en localStorage/sessionStorage.
let expiresAt = null
let renewal = null
let authVersion = 0
let onAuthExpired = null
let onSessionRenewed = null

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}
export const tokenStorage = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
}
export const sessionTokens = {
  getRefresh: () => refreshTokenInMemory,
  getExpiresAt: () => expiresAt,
  set: (access, refresh, expiresIn) => {
    authVersion++
    if (access) tokenStorage.set(access)
    refreshTokenInMemory = refresh || null
    expiresAt =
      Number.isFinite(Number(expiresIn)) && Number(expiresIn) > 0
        ? Date.now() + Number(expiresIn) * 1000
        : null
  },
  clear: () => {
    authVersion++
    tokenStorage.clear()
    refreshTokenInMemory = null
    expiresAt = null
  },
}
export function registerSessionHandlers({ expired, renewed } = {}) {
  onAuthExpired = expired || null
  onSessionRenewed = renewed || null
}
export function resolveApiUrl(value) {
  if (!value || !baseUrl) return null
  try {
    if (/^https?:\/\//i.test(value)) return value
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) return null
    const root = new URL(baseUrl, window.location.origin)
    if (value.startsWith('/')) return new URL(value, root.origin).href
    return new URL(value.replace(/^\/+/, ''), `${root.href}/`).href
  } catch {
    return null
  }
}
function safeErrorMessage(response, data) {
  const supplied = data?.message || data?.detail || data?.error
  const defaults = {
    400: 'Revisa los datos e inténtalo de nuevo.',
    401: 'La sesión no es válida o expiró.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'La información solicitada no está disponible.',
    409: 'Este valor ya está en uso. Intenta con otro.',
    413: 'El archivo supera el tamaño permitido.',
  }
  const message =
    typeof supplied === 'string'
      ? supplied
      : defaults[response.status] || 'No se pudo completar la operación.'
  if (
    /\b(?:UUID|userId|gymId|USER_API_ENABLED|SQL|JDBC|constraint|stacktrace|org\.springframework|java\.|endpoint|\/api\/v1)\b/i.test(
      message,
    )
  ) {
    return defaults[response.status] || 'No se pudo completar la operación.'
  }
  return message.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    'registro',
  )
}
async function renewAccess() {
  if (!refreshTokenInMemory) throw new ApiError('Tu sesión expiró. Vuelve a iniciar sesión.', 401)
  if (!renewal) {
    const version = authVersion
    renewal = (async () => {
      const data = await request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refreshTokenInMemory },
        auth: false,
      })
      if (!data?.token || !data?.refreshToken || !data?.user) {
        throw new ApiError('Tu sesión expiró. Vuelve a iniciar sesión.', 401)
      }
      if (version !== authVersion) throw new ApiError('Tu sesión ha finalizado.', 401)
      // Rotación: descartar el refresh anterior en cuanto llega el nuevo.
      sessionTokens.set(data.token, data.refreshToken, data.expiresIn)
      onSessionRenewed?.(data)
      return data.token
    })().finally(() => {
      renewal = null
    })
  }
  return renewal
}

export async function request(
  path,
  {
    method = 'GET',
    body,
    auth = true,
    query,
    signal,
    responseType = 'json',
    retried = false,
    extraHeaders = {},
    credentials,
  } = {},
) {
  if (!baseUrl) throw new ApiError('El servicio no está configurado. Comunícate con soporte.')
  const root = new URL(baseUrl, window.location.origin)
  const url = new URL(`${root.href.replace(/\/+$/, '')}${path}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value != null && value !== '') url.searchParams.set(key, String(value))
  }
  const form = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = { Accept: responseType === 'blob' ? '*/*' : 'application/json', ...extraHeaders }
  if (body !== undefined && !form) headers['Content-Type'] = 'application/json'
  const sentToken = tokenStorage.get()
  if (auth) {
    if (!sentToken) throw new ApiError('Inicia sesión para continuar.', 401)
    headers.Authorization = `Bearer ${sentToken}`
  }
  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
      signal,
      cache: 'no-store',
      ...(credentials ? { credentials } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('No fue posible conectar con el servicio. Inténtalo más tarde.')
  }
  // Solo rutas privadas y solo un reintento. Nunca renovar login/refresh/logout.
  const isAuthRoute = /^\/auth\/(?:login|refresh|logout)(?:\?|$)/.test(path)
  if (response.status === 401 && auth && !isAuthRoute) {
    if (!retried) {
      try {
        // Otra petición pudo haber renovado el token antes de esta respuesta.
        if (sentToken === tokenStorage.get()) await renewAccess()
      } catch (error) {
        // No cerrar una sesión nueva si la persona cambió de cuenta durante el refresh.
        if (sentToken === tokenStorage.get()) {
          sessionTokens.clear()
          onAuthExpired?.()
        }
        throw error
      }
      // Errores 400/403/404 de la petición reintentada no deben cerrar la sesión.
      return request(path, {
        method,
        body,
        auth,
        query,
        signal,
        responseType,
        extraHeaders,
        credentials,
        retried: true,
      })
    }
    sessionTokens.clear()
    onAuthExpired?.()
  }
  if (response.status === 204) return null
  if (responseType === 'blob' && response.ok) return response.blob()
  const type = response.headers.get('content-type') || ''
  const data =
    type.includes('application/json') || type.includes('+json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '')
  if (!response.ok) throw new ApiError(safeErrorMessage(response, data), response.status, data)
  return data
}
export const http = {
  get: (path, query, options = {}) => request(path, { ...options, query }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
}
// No truncar silenciosamente resultados paginados de otros módulos.
export async function getAll(path, { limit = 50, maxPages = 100, query = {} } = {}) {
  const rows = []
  for (let i = 0; i < maxPages; i++) {
    const chunk = await http.get(path, { ...query, offset: i * limit, limit })
    if (!Array.isArray(chunk)) throw new ApiError('Ocurrió un problema al cargar la información.')
    rows.push(...chunk)
    if (chunk.length < limit) return rows
  }
  throw new ApiError('Hay demasiados resultados para mostrar. Ajusta los filtros.')
}
