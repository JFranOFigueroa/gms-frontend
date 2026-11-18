<script setup>
import { computed, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useClassTemplateStore } from '@/stores/useClassTemplateStore'
import { classCategories } from '@/config/classCategories'

const props = defineProps({ embedded: { type: Boolean, default: false } })
const store = useClassTemplateStore()
const actionError = ref('')
const formError = ref('')
const busy = ref(false)
const open = ref(false)
const editingId = ref(null)
const name = ref('')
const color = ref('#22c55e')
const duration = ref(60)
const capacity = ref(20)
const category = ref('normal')
const menuId = ref(null)
const templates = computed(() => store.templates)

const reset = () => {
  editingId.value = null
  name.value = ''
  color.value = '#22c55e'
  duration.value = 60
  capacity.value = 20
  category.value = 'normal'
  formError.value = ''
}
const openCreate = () => { reset(); menuId.value = null; open.value = true }
const openEdit = (item) => {
  reset()
  editingId.value = item.id
  name.value = item.name || ''
  color.value = item.color || '#22c55e'
  duration.value = Number(item.duration)
  capacity.value = Number(item.capacity)
  category.value = item.category || 'normal'
  menuId.value = null
  open.value = true
}
const close = () => { if (!busy.value) open.value = false }
const save = async () => {
  if (busy.value) return
  formError.value = ''
  if (!name.value.trim()) { formError.value = 'Escribe el nombre de la plantilla.'; return }
  if (!Number.isInteger(Number(duration.value)) || Number(duration.value) <= 0 || !Number.isInteger(Number(capacity.value)) || Number(capacity.value) <= 0) {
    formError.value = 'Duración y capacidad deben ser números enteros positivos.'
    return
  }
  busy.value = true
  try {
    const data = { name: name.value.trim(), color: color.value, duration: Number(duration.value), capacity: Number(capacity.value), category: category.value }
    if (editingId.value) await store.updateTemplate(editingId.value, data)
    else await store.addTemplate(data)
    actionError.value = ''
    open.value = false
    reset()
  } catch (error) { formError.value = error.message || 'No fue posible guardar la plantilla.' }
  finally { busy.value = false }
}
const remove = async (item) => {
  menuId.value = null
  if (!window.confirm(`¿Eliminar la plantilla “${item.name}”?`)) return
  try { await store.removeTemplate(item.id); actionError.value = '' }
  catch (error) { actionError.value = error.message || 'No se pudo eliminar la plantilla.' }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 :class="embedded ? 'text-2xl font-black' : 'text-3xl font-black sm:text-4xl'">Plantillas de clases</h1>
        <p class="mt-1 text-sm text-[var(--color-text-secondary)]">Gestiona los tipos de entrenamiento y sus características.</p>
      </div>
      <BaseButton @click="openCreate">+ Crear plantilla</BaseButton>
    </div>
    <p v-if="actionError" role="alert" class="text-red-400">{{ actionError }}</p>
    <p v-if="!templates.length" class="rounded-2xl border border-[var(--color-border)] p-6 text-[var(--color-text-secondary)]">Todavía no hay plantillas de clases. Crea la primera para utilizarla en el calendario.</p>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="item in templates" :key="item.id" class="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div class="flex justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2"><span class="h-3 w-3 shrink-0 rounded-full" :style="{ background: item.color || '#22c55e' }" /><h2 class="truncate text-xl font-bold">{{ item.name }}</h2></div>
            <p class="mt-2 text-sm text-[var(--color-text-secondary)]">{{ classCategories.find(c => c.id === item.category)?.name || 'Clase' }}</p>
          </div>
          <div class="relative shrink-0">
            <button type="button" class="rounded-lg border border-[var(--color-border)] px-3 py-1.5" :aria-label="`Opciones de ${item.name}`" :aria-expanded="menuId === item.id" @click="menuId = menuId === item.id ? null : item.id">⋮</button>
            <div v-if="menuId === item.id" class="absolute right-0 top-10 z-10 min-w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl">
              <button type="button" class="block w-full rounded-lg p-2 text-left hover:bg-[var(--color-surface-hover)]" @click="openEdit(item)">Editar plantilla</button>
              <button type="button" class="block w-full rounded-lg p-2 text-left text-red-400 hover:bg-[var(--color-surface-hover)]" @click="remove(item)">Eliminar plantilla</button>
            </div>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]"><span>◷ {{ item.duration }} min</span><span>♙ {{ item.capacity }} cupos</span></div>
        <div class="mt-5 flex gap-2"><BaseButton variant="secondary" size="sm" @click="openEdit(item)">Editar</BaseButton><BaseButton variant="secondary" size="sm" @click="remove(item)">Eliminar</BaseButton></div>
      </article>
    </div>
    <BaseModal :open="open" @close="close">
      <form class="space-y-4" @submit.prevent="save">
        <h3 class="text-2xl font-black">{{ editingId ? 'Editar plantilla' : 'Crear plantilla' }}</h3>
        <label class="block space-y-2"><span>Nombre de la clase</span><input v-model="name" required maxlength="120" class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3" placeholder="Ej. Funcional" /></label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2"><span>Duración (minutos)</span><input v-model.number="duration" type="number" required min="1" step="1" class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3" /></label>
          <label class="block space-y-2"><span>Capacidad (cupos)</span><input v-model.number="capacity" type="number" required min="1" step="1" class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3" /></label>
          <label class="block space-y-2"><span>Categoría</span><select v-model="category" class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><option v-for="option in classCategories" :key="option.id" :value="option.id">{{ option.name }}</option></select></label>
          <label class="block space-y-2"><span>Color de la clase</span><input v-model="color" type="color" class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3" /></label>
        </div>
        <p v-if="formError" role="alert" class="text-sm text-red-400">{{ formError }}</p>
        <div class="flex justify-end gap-3"><BaseButton type="button" variant="secondary" :disabled="busy" @click="close">Cancelar</BaseButton><BaseButton type="submit" :disabled="busy">{{ busy ? 'Guardando…' : 'Guardar plantilla' }}</BaseButton></div>
      </form>
    </BaseModal>
  </section>
</template>
