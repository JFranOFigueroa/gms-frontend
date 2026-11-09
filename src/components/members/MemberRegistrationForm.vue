<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useMemberStore } from '@/stores/useMemberStore'
import { api } from '@/api/service'
import { useGymsStore } from '@/stores/useGymsStore'
import { calculateNextPaymentDate, todayISO } from '@/utils/date'
import { validateImageFile } from '@/stores/useMediaStore'
import { usePrivateMemberPhoto } from '@/composables/usePrivateMemberPhoto'

const props = defineProps({
  member: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['saved', 'cancel'])

const memberStore = useMemberStore()
const gymsStore = useGymsStore()

const today = todayISO()

const isEdit = computed(() => !!props.member)
const creationMode = ref('new')
const searchingAccount = ref(false)
const verifiedEmail = ref('')

const step = ref(1)
const error = ref('')
const submitting = ref(false)
const photoError = ref('')
const photoInput = ref(null)
const selectedPhoto = ref(null)
let localPhotoUrl = null
const { source: storedPhoto } = usePrivateMemberPhoto(() => props.member)
const shownPhoto = computed(() => form.photo || storedPhoto.value)
const releaseLocalPhoto = () => {
  if (localPhotoUrl) URL.revokeObjectURL(localPhotoUrl)
  localPhotoUrl = null
}
onBeforeUnmount(releaseLocalPhoto)

const form = reactive({
  userId: '',
  code: '',
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
  releaseLocalPhoto()
  selectedPhoto.value = null
  form.userId = ''
  form.code = member?.code || ''
  form.name = member?.name || ''
  form.email = member?.email || ''
  form.password = ''
  form.birthDate = member?.birthDate || ''
  form.phone = member?.phone || ''
  form.address = member?.address || ''
  form.emergencyContactName = member?.emergencyContactName || ''
  form.emergencyContactPhone = member?.emergencyContactPhone || ''
  form.photo = null
  form.startDate = member?.startDate || today
  form.paymentModality = member?.paymentModality || 'monthly'
  form.notes = member?.notes || ''
}

watch(
  () => props.member,
  (member) => {
    loadMember(member)
    creationMode.value = 'new'
    verifiedEmail.value = ''
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
  if (isEdit.value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Ingresa un correo válido.'
  if (creationMode.value === 'existing') return ''
  if (!form.name.trim()) return 'Introduce el nombre completo.'
  if (form.password.length < 10) return 'La contraseña debe tener al menos 10 caracteres.'
  return ''
}

const goNext = async () => {
  error.value = validateStepOne()
  if (error.value) return
  if (creationMode.value === 'existing' && !isEdit.value) {
    searchingAccount.value = true
    try {
      const account = await api.users.search(form.email.trim().toLowerCase(), gymsStore.activeGymId)
      if (account.status !== 'active') throw new Error('Esta cuenta no está activa.')
      form.userId = account.id // Identificador de uso interno; nunca se muestra en pantalla.
      verifiedEmail.value = form.email.trim().toLowerCase()
      form.name = account.fullName || ''
      form.phone = account.phone || ''
    } catch (e) {
      form.userId = ''
      verifiedEmail.value = ''
      error.value =
        e.status === 404 || e.status === 403
          ? 'No se encontró una cuenta disponible para vincular. Puedes darla de alta como nueva o solicitar ayuda al administrador.'
          : e.message
      return
    } finally {
      searchingAccount.value = false
    }
  }
  step.value = 2
}

const changeMode = (mode) => {
  creationMode.value = mode
  form.userId = ''
  verifiedEmail.value = ''
  form.name = ''
  form.email = ''
  form.password = ''
  form.phone = ''
  error.value = ''
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
  try {
    validateImageFile(file)
    releaseLocalPhoto()
    selectedPhoto.value = file
    localPhotoUrl = URL.createObjectURL(file)
    form.photo = localPhotoUrl
  } catch (error) {
    photoError.value = error.message
  }
}
const removePhoto = () => {
  selectedPhoto.value = null
  releaseLocalPhoto()
  form.photo = null
  if (photoInput.value) photoInput.value.value = ''
}

const submit = async () => {
  if (submitting.value) return
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
    userId: form.userId.trim(),
    code: form.code.trim() || undefined,
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password || props.member?.password || '',
    birthDate: form.birthDate || null,
    phone: form.phone.trim(),
    address: form.address.trim(),
    emergencyContactName: form.emergencyContactName.trim(),
    emergencyContactPhone: form.emergencyContactPhone.trim(),
    startDate: form.startDate,
    paymentModality: form.paymentModality,
    notes: form.notes.trim(),
  }

  submitting.value = true
  try {
    let saved
    if (isEdit.value) saved = await memberStore.updateMember(props.member.id, payload)
    else if (creationMode.value === 'new') saved = await memberStore.registerNewMember(payload)
    else {
      if (!form.userId || form.email.trim().toLowerCase() !== verifiedEmail.value) {
        error.value = 'Verifica nuevamente la cuenta por correo.'
        step.value = 1
        return
      }
      saved = await memberStore.addMember(payload)
    }
    if (selectedPhoto.value) {
      const memberId =
        saved?.member?.id ||
        saved?.id ||
        memberStore.members.find((m) => m.email?.toLowerCase() === form.email.trim().toLowerCase())
          ?.id
      try {
        if (!memberId) throw new Error('No se encontró el miembro registrado.')
        await memberStore.updateMemberPhoto(memberId, selectedPhoto.value)
      } catch (photoFailure) {
        // El registro ya se guardó: no invitar a repetirlo y duplicar la cuenta.
        alert(`Los datos del miembro se guardaron, pero su fotografía no: ${photoFailure.message}`)
      }
    }
    removePhoto()
    emit('saved')
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
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

    <!-- Paso 1 conserva el orden y la distribución original de los datos personales. -->
    <div v-if="step === 1" class="grid gap-4 md:grid-cols-2">
      <div v-if="!isEdit" class="md:col-span-2 flex justify-end">
        <button
          type="button"
          class="text-sm underline text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          @click="changeMode(creationMode === 'new' ? 'existing' : 'new')"
        >
          {{
            creationMode === 'new'
              ? '¿Ya tiene una cuenta? Vincular por correo'
              : 'Registrar persona nueva'
          }}
        </button>
      </div>
      <BaseInput
        v-model="form.name"
        :placeholder="
          creationMode === 'existing' && !isEdit
            ? 'Nombre (se obtiene al buscar la cuenta)'
            : 'Nombre completo *'
        "
        :disabled="isEdit || creationMode === 'existing'"
      />
      <BaseInput
        v-model="form.email"
        type="email"
        placeholder="Correo electrónico *"
        :disabled="isEdit"
      />
      <BaseInput
        v-if="!isEdit && creationMode === 'new'"
        v-model="form.password"
        type="password"
        placeholder="Contraseña *"
      />
      <div v-else class="flex items-center text-sm text-[var(--color-text-secondary)]">
        {{ creationMode === 'existing' ? 'El acceso se mantiene en la cuenta original.' : '' }}
      </div>
      <div>
        <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Fecha de nacimiento</p>
        <BaseInput v-model="form.birthDate" type="date" />
      </div>
      <BaseInput
        v-model="form.phone"
        placeholder="Teléfono"
        :disabled="isEdit || creationMode === 'existing'"
      />
      <BaseInput v-model="form.address" placeholder="Dirección" />
      <BaseInput v-model="form.emergencyContactName" placeholder="Contacto de emergencia" />
      <BaseInput v-model="form.emergencyContactPhone" placeholder="Teléfono de emergencia" />
      <div class="md:col-span-2">
        <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Información adicional</p>
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
            v-if="shownPhoto"
            :src="shownPhoto"
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

            <BaseButton v-if="selectedPhoto" type="button" variant="secondary" @click="removePhoto">
              Quitar foto
            </BaseButton>
          </div>

          <p class="text-sm text-[var(--color-text-secondary)]">
            Puedes agregar una imagen PNG, JPG o WebP de hasta 8 MB.
          </p>

          <p v-if="photoError" class="text-sm text-red-400">
            {{ photoError }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <BaseInput v-if="!isEdit" v-model="form.code" placeholder="Código de miembro (opcional)" />
        <div>
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Fecha de inscripción *</p>
          <BaseInput v-model="form.startDate" type="date" />
        </div>

        <div>
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">
            Modalidad actual (se asigna mediante pagos y planes)
          </p>

          <select
            v-model="form.paymentModality"
            disabled
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

        <p
          v-if="isEdit && member?.nextPaymentDate"
          class="text-sm text-[var(--color-text-secondary)] mt-2"
        >
          Próximo pago actual: {{ member.nextPaymentDate }}. Se conserva salvo que registres un
          pago.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap justify-between gap-3 pt-2">
      <BaseButton type="button" variant="secondary" @click="cancel"> Cancelar </BaseButton>

      <div class="flex flex-wrap gap-3">
        <BaseButton v-if="step === 2" type="button" variant="secondary" @click="goBack">
          Atrás
        </BaseButton>

        <BaseButton v-if="step === 1" type="button" :disabled="searchingAccount" @click="goNext">
          Siguiente
        </BaseButton>

        <BaseButton v-else type="button" :disabled="submitting" @click="submit">
          {{ isEdit ? 'Guardar cambios' : 'Registrar miembro' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
