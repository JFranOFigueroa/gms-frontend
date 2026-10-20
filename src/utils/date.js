/**
 * Utilidades de fecha para valores date-only (YYYY-MM-DD).
 *
 * Se evita `toISOString()` porque convierte a UTC y puede desplazar el día
 * en zonas horarias al este de UTC. Todas las funciones trabajan en hora local.
 */

export const toDateOnly = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const todayISO = () => toDateOnly(new Date())

export const parseDate = (value) => {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? null : date
}

export const addMonths = (dateString, months) => {
  const date = parseDate(dateString) || parseDate(todayISO())
  const day = date.getDate()

  date.setDate(1)
  date.setMonth(date.getMonth() + months)

  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))

  return toDateOnly(date)
}

export const addYears = (dateString, years) => {
  return addMonths(dateString, years * 12)
}

export const calculateNextPaymentDate = (startDate, paymentModality, periods = 1) => {
  if (!startDate || !paymentModality) return null

  return paymentModality === 'yearly'
    ? addYears(startDate, periods)
    : addMonths(startDate, periods)
}
