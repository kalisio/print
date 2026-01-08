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
import _ from 'lodash'
import config from 'config'
import { Store } from '@kalisio/kdk/core.client'

// Data
const playgroundPdfme = `${Store.get('capabilities.api.playgroundPdfme')}/?jwt=${window.localStorage.getItem(_.get(config, 'apiJwt'))}`
</script>
