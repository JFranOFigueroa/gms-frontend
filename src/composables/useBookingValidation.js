import { classCategories } from '@/config/classCategories'

export function useBookingValidation() {
  const overlaps = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB
  }

  const validateBooking = ({ branchClass, userBookings, settings, role }) => {
    const categoryConfig = classCategories.find((c) => c.id === branchClass.category)

    /*
      =====================
      CAPACITY
      =====================
      */

    if (branchClass.attendees.length >= branchClass.capacity) {
      return {
        valid: false,

        reason: 'Clase llena',
      }
    }

    /*
      =====================
      GUEST LIMIT
      =====================
      */

    if (role === 'guest' && userBookings.length >= 1) {
      return {
        valid: false,

        reason: 'Los invitados solo pueden reservar una clase demo',
      }
    }

    /*
      =====================
      SAME DAY BOOKINGS
      =====================
      */

    const sameDayBookings = userBookings.filter((booking) => booking.date === branchClass.date)

    /*
      =====================
      MULTIPLE NORMAL
      =====================
      */

    const isNormalClass = branchClass.category === 'normal'

    if (!settings.allowMultipleNormalClassesPerDay && isNormalClass) {
      const alreadyHasNormal = sameDayBookings.some((booking) => booking.category === 'normal')

      if (alreadyHasNormal) {
        return {
          valid: false,

          reason: 'Solo puedes reservar una clase normal por día',
        }
      }
    }

    /*
      =====================
      TIME OVERLAP
      =====================
      */

    if (categoryConfig?.allowOverlap) {
      return {
        valid: true,
      }
    }

    const overlapping = sameDayBookings.some((booking) => {
      const bookingCategory = classCategories.find((c) => c.id === booking.category)

      if (bookingCategory?.allowOverlap) {
        return false
      }

      return overlaps(
        branchClass.startTime,
        branchClass.endTime,

        booking.startTime,
        booking.endTime,
      )
    })

    if (overlapping) {
      return {
        valid: false,

        reason: 'Ya tienes una clase en ese horario',
      }
    }

    return {
      valid: true,
    }
  }

  return {
    validateBooking,
  }
}
