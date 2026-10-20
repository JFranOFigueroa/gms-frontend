<script setup>
import { computed, reactive, ref, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useMemberStore } from '@/stores/useMemberStore'
import { useUserStore } from '@/stores/useUserStore'
import { calculateNextPaymentDate, todayISO } from '@/utils/date'

const props = defineProps({
  member: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['saved', 'cancel'])

const memberStore = useMemberStore()
const userStore = useUserStore()

const today = todayISO()

const isEdit = computed(() => !!props.member)

const step = ref(1)
const error = ref('')
const photoError = ref('')
const photoInput = ref(null)

const form = reactive({
  name: '',
  email: '',
  password: '',
  birthDate: '',
  phone: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  photo: null,
  startDate: today,
  paymentModality: 'monthly',
  notes: '',
})

const loadMember = (member) => {
  form.name = member?.name || ''
  form.email = member?.email || ''
  form.password = ''
  form.birthDate = member?.birthDate || ''
  form.phone = member?.phone || ''
  form.address = member?.address || ''
  form.emergencyContactName = member?.emergencyContactName || ''
  form.emergencyContactPhone = member?.emergencyContactPhone || ''
  form.photo = member?.photo || null
  form.startDate = member?.startDate || today
  form.paymentModality = member?.paymentModality || 'monthly'
  form.notes = member?.notes || ''
}

watch(
  () => props.member,
  (member) => {
    loadMember(member)
    step.value = 1
    error.value = ''
    photoError.value = ''
  },
  { immediate: true },
)

const previewNextPayment = computed(() => {
  if (!form.startDate || !form.paymentModality) return '—'

  return calculateNextPaymentDate(form.startDate, form.paymentModality, 1) || '—'
})

const validateStepOne = () => {
  if (!form.name.trim()) return 'El nombre completo es obligatorio'
  if (!form.email.trim()) return 'El correo es obligatorio'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Ingresa un correo válido'

  if (!isEdit.value && !form.password.trim()) return 'La contraseña es obligatoria'
  if (form.password && form.password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres'
  }

  const duplicate = memberStore.allMembers.find((entry) => {
    return (
      entry.email.toLowerCase() === form.email.trim().toLowerCase() &&
      String(entry.id) !== String(props.member?.id)
    )
  })

  if (duplicate) return 'Ya existe un miembro con ese correo'

  if (userStore.findByEmail(form.email.trim().toLowerCase())) {
    return 'Ese correo ya pertenece a un usuario del staff'
  }

  return ''
}

const goNext = () => {
  error.value = validateStepOne()

  if (!error.value) {
    step.value = 2
  }
}

const goBack = () => {
  error.value = ''
  step.value = 1
}

const triggerPhotoInput = () => {
  photoInput.value?.click()
}

const onPhotoSelected = (event) => {
  const file = event.target.files?.[0]

  photoError.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    photoError.value = 'El archivo debe ser una imagen'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    photoError.value = 'La imagen debe pesar menos de 5 MB'
    return
  }

  const reader = new FileReader()

  reader.onload = () => {
    const image = new Image()

    image.onload = () => {
      const maxSide = 512
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')

      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))

      const context = canvas.getContext('2d')

      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      form.photo = canvas.toDataURL('image/jpeg', 0.82)
    }

    image.onerror = () => {
      photoError.value = 'No se pudo procesar la imagen'
    }

    image.src = String(reader.result)
  }

  reader.readAsDataURL(file)
}

const removePhoto = () => {
  form.photo = null

  if (photoInput.value) {
    photoInput.value.value = ''
  }
}

const submit = () => {
  const stepOneError = validateStepOne()

  if (stepOneError) {
    error.value = stepOneError
    step.value = 1
    return
  }

  if (!form.startDate) {
    error.value = 'La fecha de inscripción es obligatoria'
    return
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password || props.member?.password || '',
    birthDate: form.birthDate || null,
    phone: form.phone.trim(),
    address: form.address.trim(),
    emergencyContactName: form.emergencyContactName.trim(),
    emergencyContactPhone: form.emergencyContactPhone.trim(),
    photo: form.photo,
    startDate: form.startDate,
    paymentModality: form.paymentModality,
    notes: form.notes.trim(),
  }

  if (isEdit.value) {
    memberStore.updateMember(props.member.id, payload)
  } else {
    memberStore.addMember(payload)
  }

  emit('saved')
}

const cancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-8">
    <!-- Stepper -->
    <div class="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        class="rounded-2xl border p-4 text-left transition"
        :class="
          step === 1
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
            : 'border-[var(--color-border)]'
        "
        @click="step = 1"
      >
        <p class="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Paso 1</p>
        <p class="font-bold mt-1">Datos personales</p>
      </button>

      <button
        type="button"
        class="rounded-2xl border p-4 text-left transition"
        :class="
          step === 2
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
            : 'border-[var(--color-border)]'
        "
        @click="goNext"
      >
        <p class="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Paso 2</p>
        <p class="font-bold mt-1">Foto y membresía</p>
      </button>
    </div>

    <p
      v-if="error"
      class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
    >
      {{ error }}
    </p>

    <!-- Step 1 -->
    <div v-if="step === 1" class="grid gap-4 md:grid-cols-2">
      <BaseInput v-model="form.name" placeholder="Nombre completo *" />

      <BaseInput v-model="form.email" type="email" placeholder="Correo *" />

      <BaseInput
        v-model="form.password"
        type="password"
        :placeholder="isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'"
      />

      <div>
        <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Fecha de nacimiento</p>
        <BaseInput v-model="form.birthDate" type="date" />
      </div>

      <BaseInput v-model="form.phone" placeholder="Teléfono" />

      <BaseInput v-model="form.address" placeholder="Dirección" />

      <BaseInput v-model="form.emergencyContactName" placeholder="Contacto de emergencia" />

      <BaseInput
        v-model="form.emergencyContactPhone"
        placeholder="Teléfono de emergencia"
      />

      <div class="md:col-span-2">
        <p class="mb-2 text-sm text-[var(--color-text-secondary)]">
          Información adicional
        </p>

        <textarea
          v-model="form.notes"
          rows="3"
          placeholder="Notas, condiciones médicas, observaciones..."
          class="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>
    </div>

    <!-- Step 2 -->
    <div v-else class="space-y-6">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          class="h-32 w-32 shrink-0 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center"
        >
          <img
            v-if="form.photo"
            :src="form.photo"
            alt="Foto del miembro"
            class="h-full w-full object-cover"
          />

          <span v-else class="text-4xl">👤</span>
        </div>

        <div class="space-y-3">
          <input
            ref="photoInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onPhotoSelected"
          />

          <div class="flex flex-wrap gap-3">
            <BaseButton type="button" variant="secondary" @click="triggerPhotoInput">
              Subir foto
            </BaseButton>

            <BaseButton
              v-if="form.photo"
              type="button"
              variant="secondary"
              @click="removePhoto"
            >
              Quitar foto
            </BaseButton>
          </div>

          <p class="text-sm text-[var(--color-text-secondary)]">
            JPG o PNG, máximo 5 MB. La imagen se optimiza y guarda localmente en esta demo.
          </p>

          <p v-if="photoError" class="text-sm text-red-400">
            {{ photoError }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Fecha de inscripción *</p>
          <BaseInput v-model="form.startDate" type="date" />
        </div>

        <div>
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Modalidad de pago</p>

          <select
            v-model="form.paymentModality"
            class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
        <p class="text-sm text-[var(--color-text-secondary)]">Próximo pago estimado</p>
        <p class="text-2xl font-black mt-1">{{ previewNextPayment }}</p>

        <p v-if="isEdit && member?.nextPaymentDate" class="text-sm text-[var(--color-text-secondary)] mt-2">
          Próximo pago actual: {{ member.nextPaymentDate }}. Se conserva salvo que registres un pago.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap justify-between gap-3 pt-2">
      <BaseButton type="button" variant="secondary" @click="cancel">
        Cancelar
      </BaseButton>

      <div class="flex flex-wrap gap-3">
        <BaseButton v-if="step === 2" type="button" variant="secondary" @click="goBack">
          Atrás
        </BaseButton>

        <BaseButton v-if="step === 1" type="button" @click="goNext">
          Siguiente
        </BaseButton>

        <BaseButton v-else type="button" @click="submit">
          {{ isEdit ? 'Guardar cambios' : 'Registrar miembro' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
