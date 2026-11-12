import { onBeforeUnmount } from 'vue'

let lockCount = 0
let previousOverflow = ''

export function useScrollLock() {
  let locked = false

  const lock = () => {
    if (locked) return

    locked = true

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }

    lockCount += 1
  }

  const unlock = () => {
    if (!locked) return

    locked = false
    lockCount = Math.max(0, lockCount - 1)

    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow
    }
  }

  onBeforeUnmount(unlock)

  return { lock, unlock }
}
