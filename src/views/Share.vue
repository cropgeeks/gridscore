<template>
  <b-container>
    <h1><b-button :to="{ name: 'home' }"><BIconArrowLeft /></b-button> {{ $t('pageShareTitle') }}</h1>
    <hr/>
    <p v-html="$t('pageShareText')" />
    <b-row>
      <b-col cols=12 md=6 class="mb-3 pb-3 border-bottom border-md-bottom-0 border-md-right">
        <h2>{{ $t('modalTitleExportConfig') }}</h2>
        <Export />
      </b-col>
      <b-col cols=12 md=6 class="mb-3 pb-3">
        <h2>{{ $t('modalTitleImportConfig') }}</h2>
        <Import />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Export from '@/components/Export'
import Import from '@/components/Import'

import { BIconArrowLeft } from 'bootstrap-vue'

export default {
  components: {
    BIconArrowLeft,
    Export,
    Import
  }
}
</script>

<style>

</style>
