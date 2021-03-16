<template>
  <div>
    <b-container class="py-3">
      <div class="text-center">
        <img src="img/gridscore2.svg" fluid  class="about-header-logo" alt="GridScore logo">
        <h1 class="py-3">{{ $t('appTitle') }}</h1>
      </div>
      <h2>{{ $t('pageHomeWelcome') }}</h2>
      <p v-html="$t('pageHomeInstructions')" />
    </b-container>
    <div class="text-center">
      <b-button class="mx-2" :to="{ name: 'setup' }"><BIconJournalPlus /> {{ $t('buttonSetupTrial') }}</b-button>
      <b-button class="mx-2" @click="loadExampleData"><BIconFileSpreadsheet /> {{ $t('buttonLoadExampleData') }}</b-button>
      <b-button class="mx-2" @click="startTour"><BIconPlayFill /> {{ $t('buttonStartIntroductionTour') }}</b-button>
    </div>
  </div>
</template>

<script>
import { EventBus } from '@/plugins/event-bus'

import { BIconJournalPlus, BIconFileSpreadsheet, BIconPlayFill } from 'bootstrap-vue'

export default {
  components: {
    BIconJournalPlus,
    BIconFileSpreadsheet,
    BIconPlayFill
  },
  methods: {
    startTour: function () {
      EventBus.$emit('show-introduction-tour')
    },
    loadExampleData: function () {
      this.$store.dispatch('addDataset', require('@/example-data.json'))
    },
    redirect: function () {
      this.$router.push({ name: 'dataset', params: { datasetId: this.storeDatasetId } })
    }
  },
  created: function () {
    if (this.storeDatasetId) {
      this.redirect()
    }

    EventBus.$on('datasets-changed', this.redirect)
  },
  destroyed: function () {
    EventBus.$off('datasets-changed', this.redirect)
  }
}
</script>

<style>
.about-header-logo {
  max-height: 200px;
}
</style>
