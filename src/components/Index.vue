<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { composables } from '@kalisio/kdk/core.client'

// Data
const { installPwa } = composables.usePwa()

// Immediate
composables.useSession()

// Hooks
onMounted(() => {
  installPwa()
})
</script>
