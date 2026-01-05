<template>
  <KActivity name="print" class="full-height full-width q-pa-none">
    <iframe
      :src="playgroundPdfme"
      frameborder="0"
      class="full-width full-height"
    ></iframe>
  </KActivity>
</template>

<script setup>
import { Store } from '@kalisio/kdk/core.client'

const playgroundPdfme = Store.get('capabilities.api.playgroundPdfme')
</script>
