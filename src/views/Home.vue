<template>
  <b-container class="py-3">
    <div class="text-center">
      <img src="img/gridscore2.svg" fluid  class="about-header-logo" alt="GridScore logo">
      <h1 class="py-3">{{ $t('appTitle') }}</h1>
    </div>
    <h2>{{ $t('pageHomeWelcome') }}</h2>
    <p v-html="$t('pageHomeInstructions')" />

    <div class="text-center">
      <b-button class="mx-2 mb-3" :to="{ name: 'setup' }"><BIconJournalPlus /> {{ $t('buttonSetupTrial') }}</b-button>
      <b-button class="mx-2 mb-3" @click="loadExampleData"><BIconFileSpreadsheet /> {{ $t('buttonLoadExampleData') }}</b-button>
      <b-button class="mx-2 mb-3" @click="startTour"><BIconPlayFill /> {{ $t('buttonStartIntroductionTour') }}</b-button>
    </div>

    <div v-if="datasets && datasets.length > 0" class="mt-3">
      <h2>{{ $t('pageHomeDatasetsTitle') }} - <small>{{ $t('pageHomeDatasetsSubtitle') }}</small></h2>
      <b-row>
        <b-col cols=12 sm=6 lg=3 v-for="dataset in datasets" :key="`dataset-${dataset.id}`" class="mb-3">
          <b-card :title="`${dataset.id} - ${dataset.name}`" class="h-100" :bg-variant="dataset.id === storeDatasetId ? 'light' : null">
            <b-card-text><BIconLayoutThreeColumns rotate="90" /> {{ $t('formLabelSettingsRows') }} {{ dataset.rows }}</b-card-text>
            <b-card-text><BIconLayoutThreeColumns /> {{ $t('formLabelSettingsCols') }} {{ dataset.cols }}</b-card-text>
            <b-card-text v-if="dataset.lastUpdatedOn"><BIconCalendarDate /> {{ new Date(dataset.lastUpdatedOn).toLocaleString() }}</b-card-text>
            <b-button variant="primary" @click="onDatasetSelected(dataset.id)">{{ $t('buttonSelect') }}</b-button>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { EventBus } from '@/plugins/event-bus'

import idb from '@/plugins/idb'

import { BIconJournalPlus, BIconFileSpreadsheet, BIconPlayFill, BIconLayoutThreeColumns, BIconCalendarDate } from 'bootstrap-vue'

export default {
  components: {
    BIconJournalPlus,
    BIconFileSpreadsheet,
    BIconPlayFill,
    BIconCalendarDate,
    BIconLayoutThreeColumns
  },
  data: function () {
    return {
      datasets: []
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetId'
    ])
  },
  methods: {
    startTour: function () {
      EventBus.$emit('show-introduction-tour')
    },
    loadExampleData: function () {
      this.$store.dispatch('addDataset', require('@/example-data.json'))
    },
    redirect: function () {
      this.$router.push({ name: 'data' })
    },
    loadDataset: function () {
      if (this.storeDatasetId !== undefined && this.storeDatasetId !== null) {
        this.$store.dispatch('loadDataset', this.storeDatasetId)
      }
    },
    updateDatasets: function () {
      idb.getDatasets().then(datasets => {
        const ds = JSON.parse(JSON.stringify(datasets))
        if (ds) {
          ds.sort((a, b) => {
            if (a.lastUpdatedOn && b.lastUpdatedOn) {
              return (new Date(b.lastUpdatedOn)) - (new Date(a.lastUpdatedOn))
            } else if (a.lastUpdatedOn) {
              return a
            } else if (b.lastUpdatedOn) {
              return b
            } else {
              return a.name - b.name
            }
          })
        }
        this.datasets = ds
      })
    },
    onDatasetSelected: function (datasetId) {
      this.$store.dispatch('loadDataset', datasetId)
    }
  },
  created: function () {
    this.updateDatasets()

    EventBus.$on('datasets-changed', this.updateDatasets)
  },
  destroyed: function () {
    EventBus.$off('datasets-changed', this.updateDatasets)
  }
}
</script>

<style>
.about-header-logo {
  max-height: 200px;
}
</style>
