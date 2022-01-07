<template>
  <b-container>
    <h1><b-button :to="{ name: 'data' }"><BIconArrowLeft /></b-button> {{ $t('pageShareTitle') }}</h1>
    <hr/>
    <p v-html="$t('pageShareText')" />
    <h2>{{ $t('modalTitleExportConfig') }}</h2>
    <Export />
  </b-container>
</template>

<script>
import Export from '@/components/Export'

import { BIconArrowLeft } from 'bootstrap-vue'

export default {
  components: {
    BIconArrowLeft,
    Export
  }
}
</script>

<style>

</style>
