<script>
const modalStack = []
</script>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  open: {
    type: Boolean,

    default: false,
  },
})

const emit = defineEmits(['close'])

const { lock, unlock } = useScrollLock()

const panel = ref(null)

let previouslyFocused = null

const id = Symbol('modal')

const getFocusable = () =>
  Array.from(
    panel.value?.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((element) => element.offsetParent !== null)

const onKeydown = (event) => {
  if (modalStack[modalStack.length - 1] !== id) return

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')

    return
  }

  if (event.key !== 'Tab') return

  const focusable = getFocusable()

  if (!focusable.length) {
    event.preventDefault()

    return
  }

  const first = focusable[0]

  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const activate = async () => {
  previouslyFocused = document.activeElement

  modalStack.push(id)
  lock()

  window.addEventListener('keydown', onKeydown)

  await nextTick()

  getFocusable()[0]?.focus()
}

const deactivate = () => {
  const index = modalStack.indexOf(id)

  if (index !== -1) modalStack.splice(index, 1)

  unlock()

  window.removeEventListener('keydown', onKeydown)

  if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()

  previouslyFocused = null
}

watch(
  () => props.open,
  (open) => {
    if (open) activate()
    else deactivate()
  },
  { immediate: true },
)

onBeforeUnmount(deactivate)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--color-background)]/70 p-4 backdrop-blur-sm sm:p-6"
        @click.self="emit('close')"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          class="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
          <div class="overflow-y-auto p-5 sm:p-8">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
