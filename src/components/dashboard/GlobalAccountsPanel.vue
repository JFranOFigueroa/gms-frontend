<script setup>
import { ref } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useGlobalAccountsStore } from '@/stores/useGlobalAccountsStore'

const accounts = useGlobalAccountsStore()
const expanded = ref(false)
const search = ref('')
const editingId = ref(null)
const fullName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const error = ref('')
const notice = ref('')
const saving = ref(false)

async function load() {
  error.value = ''
  try {
    await accounts.load(search.value, 0)
  } catch (e) {
    error.value = e.message
  }
}
async function open() {
  expanded.value = !expanded.value
  if (expanded.value) await load()
}
function resetForm() {
  editingId.value = null
  fullName.value = ''
  email.value = ''
  phone.value = ''
  password.value = ''
  error.value = ''
}
async function edit(id) {
  try {
    const row = await accounts.one(id)
    editingId.value = id
    fullName.value = row.fullName || ''
    email.value = row.email || ''
    phone.value = row.phone || ''
    password.value = ''
  } catch (e) {
    error.value = e.message
  }
}
async function save() {
  error.value = ''
  notice.value = ''
  saving.value = true
  try {
    if (!fullName.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
      throw new Error('Nombre y correo válidos son obligatorios')
    if (!editingId.value && password.value.length < 10)
      throw new Error('La contraseña debe contener 10 caracteres o más')
    const body = {
      fullName: fullName.value.trim(),
      email: email.value.trim().toLowerCase(),
      phone: phone.value.trim(),
    }
    if (editingId.value) await accounts.update(editingId.value, body)
    else await accounts.create({ ...body, password: password.value, status: 'active' })
    resetForm()
    notice.value = 'Cuenta guardada.'
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
async function changeStatus(user) {
  const next = user.status === 'active' ? 'disabled' : 'active'
  if (!confirm(`¿Cambiar estado de ${user.fullName} a ${next}?`)) return
  try {
    await accounts.changeStatus(user.id, next)
    notice.value = 'Estado actualizado.'
  } catch (e) {
    error.value = e.message
  }
}
async function findEmail() {
  if (!email.value.trim()) return
  try {
    const row = await accounts.search(email.value.trim())
    await edit(row.id)
  } catch (e) {
    error.value = e.message
  }
}
</script>
<template>
  <BaseCard
    ><div class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold">Cuentas del sistema</h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Administra los accesos de las personas que utilizan el sistema.
          </p>
        </div>
        <BaseButton variant="secondary" @click="open">{{
          expanded ? 'Cerrar cuentas' : 'Administrar cuentas'
        }}</BaseButton>
      </div>
      <div v-if="expanded" class="space-y-5">
        <form class="flex gap-2 flex-wrap" @submit.prevent="load">
          <div class="flex-1">
            <BaseInput v-model="search" placeholder="Buscar nombre o correo" />
          </div>
          <BaseButton type="submit">Buscar</BaseButton>
        </form>
        <div v-if="accounts.loading">Cargando cuentas…</div>
        <p
          v-if="!accounts.loading && accounts.items.length === 0"
          class="text-sm text-[var(--color-text-secondary)]"
        >
          No hay cuentas para mostrar.
        </p>
        <div class="grid gap-2">
          <div
            v-for="user in accounts.items"
            :key="user.id"
            class="flex flex-wrap justify-between gap-2 rounded-2xl border border-[var(--color-border)] p-3"
          >
            <div class="min-w-0">
              <p class="font-semibold">{{ user.fullName }}</p>
              <p class="break-all text-sm">
                {{ user.email }} · {{ user.status === 'active' ? 'Activo' : 'Inactivo' }}
              </p>
            </div>
            <div class="flex gap-2">
              <BaseButton size="sm" variant="secondary" @click="edit(user.id)">Editar</BaseButton
              ><BaseButton size="sm" variant="secondary" @click="changeStatus(user)">{{
                user.status === 'active' ? 'Desactivar' : 'Activar'
              }}</BaseButton>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <BaseButton
            size="sm"
            variant="secondary"
            :disabled="accounts.offset <= 0"
            @click="
              accounts
                .load(search, Math.max(0, accounts.offset - accounts.limit))
                .catch((e) => (error = e.message))
            "
            >Anterior</BaseButton
          ><span
            >{{ accounts.items.length ? accounts.offset + 1 : 0 }}–{{
              accounts.offset + accounts.items.length
            }}
            de {{ accounts.total }}</span
          ><BaseButton
            size="sm"
            variant="secondary"
            :disabled="accounts.offset + accounts.items.length >= accounts.total"
            @click="
              accounts
                .load(search, accounts.offset + accounts.limit)
                .catch((e) => (error = e.message))
            "
            >Siguiente</BaseButton
          >
        </div>
        <form
          class="space-y-3 rounded-2xl border border-[var(--color-border)] p-4"
          @submit.prevent="save"
        >
          <h3 class="font-bold">
            {{ editingId ? 'Editar cuenta global' : 'Crear cuenta global' }}
          </h3>
          <BaseInput v-model="fullName" placeholder="Nombre completo" />
          <BaseInput v-model="email" type="email" placeholder="Correo" />
          <BaseInput v-model="phone" placeholder="Teléfono" />
          <BaseInput
            v-if="!editingId"
            v-model="password"
            type="password"
            placeholder="Contraseña de acceso (mín. 10 caracteres)"
          />
          <div class="flex flex-wrap gap-2">
            <BaseButton type="submit" :disabled="saving">Guardar cuenta</BaseButton
            ><BaseButton variant="secondary" @click="resetForm">Nueva cuenta</BaseButton
            ><BaseButton variant="secondary" @click="findEmail">Buscar correo exacto</BaseButton>
          </div>
        </form>
        <p v-if="error || accounts.error" role="alert" class="text-sm text-red-400">
          {{ error || accounts.error }}
        </p>
        <p v-if="notice" role="status" class="text-sm text-emerald-400">{{ notice }}</p>
        <p class="text-xs text-[var(--color-text-secondary)]">
          La asignación de gimnasios y permisos se realiza desde la sección de usuarios.
        </p>
      </div>
    </div></BaseCard
  >
</template>
