export function useBookingEngine() {
  const hasTimeCollision = (existingBookings, newBooking) => {
    return existingBookings.some((booking) => {
      const existingStart = new Date(booking.start)

      const existingEnd = new Date(booking.end)

      const newStart = new Date(newBooking.start)

      const newEnd = new Date(newBooking.end)

      return newStart < existingEnd && newEnd > existingStart
    })
  }

  const isSameDay = (a, b) => {
    return new Date(a).toDateString() === new Date(b).toDateString()
  }

  const validateBooking = ({ existingBookings, newBooking, settings }) => {
    // 1. COLLISION
    const collision = hasTimeCollision(existingBookings, newBooking)

    if (collision) {
      return {
        valid: false,

        reason: 'Horario en conflicto',
      }
    }

    // 2. SAME DAY NORMAL CLASS
    if (!settings.allowMultipleNormalPerDay && !newBooking.special) {
      const sameDayNormal = existingBookings.some((booking) => {
        return isSameDay(booking.start, newBooking.start) && !booking.special
      })

      if (sameDayNormal) {
        return {
          valid: false,

          reason: 'Ya existe una clase normal este día',
        }
      }
    }

    // VALID
    return {
      valid: true,
    }
  }

  return {
    validateBooking,
  }
}
