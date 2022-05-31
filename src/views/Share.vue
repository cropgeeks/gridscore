<template>
  <b-container>
    <h1><b-button :to="{ name: 'data' }"><BIconArrowLeft /></b-button> {{ $t('pageShareTitle') }} <small><a href="#" class="text-secondary" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></a></small></h1>
    <hr/>
    <p v-html="$t('pageShareText')" />
    <h2>{{ $t('modalTitleExportConfig') }}</h2>
    <Export />

    <HelpModal url="https://cropgeeks.github.io/gridscore/sharing.html" ref="helpModal" />
  </b-container>
</template>

<script>
import Export from '@/components/Export'
import HelpModal from '@/components/modals/HelpModal'

import { BIconArrowLeft, BIconQuestionCircleFill } from 'bootstrap-vue'

export default {
  components: {
    BIconArrowLeft,
    BIconQuestionCircleFill,
    Export,
    HelpModal
  }
}
</script>

<style>

</style>
