<script setup>
defineProps({ embedded: { type: Boolean, default: false } })
import MediaLibrary from '@/components/dashboard/MediaLibrary.vue'
</script>

<template>
  <MediaLibrary :embedded="embedded" />
</template>
