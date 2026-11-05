<script setup>
import { toRef } from 'vue'
import { usePrivateMemberPhoto } from '@/composables/usePrivateMemberPhoto'
const props = defineProps({ member: { type: Object, default: null }, placeholderClass: { type: String, default: 'text-2xl' } })
const { source } = usePrivateMemberPhoto(toRef(props, 'member'))
</script>
<template>
  <img v-if="source" :src="source" alt="Foto del miembro" class="h-full w-full object-cover" />
  <span v-else :class="placeholderClass">👤</span>
</template>
