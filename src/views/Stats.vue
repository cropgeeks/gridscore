<template>
  <div>
    <h1>{{ $t('pageStatsTitle') }} <small><a href="#" class="text-secondary" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></a></small></h1>
    <p>{{ $t('pageStatsText') }}</p>

    <template v-if="storeTraits && storeTraits.length > 0">
      <div v-for="(trait, index) in storeTraits" :key="`trait-stats-${index}`">
        <h2>
          <TraitHeading :trait="trait" mode="full" />
        </h2>
        <b-form-group :label="$t('formLabelMultiTraitVizType')" :label-for="`trait-viz-type-${index}`" v-if="trait.mType === 'multi'">
          <b-form-select :id="`trait-viz-type-${index}`" :options="multiTraitOptions[index]" v-model="selectedMultiTraitMethods[index]" />
        </b-form-group>
        <div class="stats-chart" :ref="`trait-chart-${index}`" />
      </div>
    </template>

    <HelpModal url="https://cropgeeks.github.io/gridscore/visualizing-data.html#trait-statistics" ref="helpModal" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconQuestionCircleFill } from 'bootstrap-vue'

import HelpModal from '@/components/modals/HelpModal'
import TraitHeading from '@/components/TraitHeading'

const emitter = require('tiny-emitter/instance')
const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/bar'),
  require('plotly.js/lib/box')
])

export default {
  components: {
    BIconQuestionCircleFill,
    HelpModal,
    TraitHeading
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDarkMode',
      'storeDatasetName',
      'storeDatasetId',
      'storeTraitColors',
      'storeTraits'
    ]),
    safeDatasetName: function () {
      if (this.storeDatasetName) {
        return this.storeDatasetName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    }
  },
  data: function () {
    return {
      selectedMultiTraitMethods: [],
      multiTraitOptions: []
    }
  },
  watch: {
    storeDarkMode: function () {
      this.update()
    },
    storeTraits: function (newValue) {
      this.selectedMultiTraitMethods = newValue.map(t => 'last')
      this.multiTraitOptions = newValue.map(t => this.getMultiTraitMethods(t))
    },
    selectedMultiTraitMethods: {
      deep: true,
      handler: function () {
        this.$nextTick(() => this.update())
      }
    }
  },
  methods: {
    update: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (storeData && this.storeTraits && this.storeTraits.length > 0) {
        this.storeTraits.forEach((trait, index) => {
          const div = this.$refs[`trait-chart-${index}`][0]
          Plotly.purge(div)

          const data = []
          let chartType

          switch (trait.type) {
            case 'float':
            case 'int':
            case 'date': {
              chartType = 'box'
              const datapoints = []
              storeData.forEach((c, k) => datapoints.push({ value: this.extractMultiTraitDatum(index, trait.mType, this.selectedMultiTraitMethods[index], c, true), name: c.name }))
              data.push({
                x: datapoints.map(d => d.value),
                text: datapoints.map(d => d.name),
                marker: {
                  color: this.storeTraitColors[index % this.storeTraitColors.length]
                },
                name: '',
                type: chartType,
                jitter: 0.5,
                pointpos: 2,
                boxpoints: 'all'
              })
              break
            }
            case 'text':
            case 'categorical': {
              chartType = 'bar'
              const map = {}
              const datapoints = []
              storeData.forEach((c, k) => datapoints.push(this.extractMultiTraitDatum(index, trait.mType, this.selectedMultiTraitMethods[index], c, true)))
              datapoints.forEach(c => {
                if (map[c]) {
                  map[c] += 1
                } else {
                  map[c] = 1
                }
              })

              let keys
              if (trait.type === 'categorical' && trait.restrictions && trait.restrictions.categories) {
                keys = trait.restrictions.categories
              } else {
                keys = Object.keys(map).sort()
              }

              data.push({
                x: keys,
                y: keys.map(k => map[k]),
                type: chartType,
                marker: {
                  color: this.storeTraitColors[index % this.storeTraitColors.length]
                }
              })
              break
            }
          }

          const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: {
              l: 30,
              r: 30
            },
            autosize: true,
            yaxis: {
              automargin: true,
              title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
              gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
              showgrid: chartType === 'bar'
            },
            xaxis: {
              zeroline: false,
              title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
              gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
              showgrid: chartType === 'box'
            },
            hovermode: 'closest'
          }

          if (trait.type === 'categorical' || trait.type === 'text') {
            layout.xaxis.type = 'category'
            layout.xaxis.title.text = trait.name
            layout.yaxis.title.text = this.$t('widgetChartAxisCount')
          } else {
            layout.xaxis.title.text = trait.name
          }

          const filename = trait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
          const config = {
            responsive: true,
            toImageButtonOptions: {
              format: 'png',
              filename: `stats-${this.safeDatasetName}-${filename}-${new Date().toISOString().split('T')[0]}`,
              width: 1280,
              height: 720
            },
            displaylogo: false
          }

          Plotly.newPlot(div, data, layout, config)
        })
      }
    },
    init: function () {
      this.selectedMultiTraitMethods = this.storeTraits.map(t => 'last')
      this.multiTraitOptions = this.storeTraits.map(t => this.getMultiTraitMethods(t))
      this.update()
    }
  },
  mounted: function () {
    if (this.storeDatasetId !== undefined && this.storeDatasetId !== null && (!this.$store.state.dataset.data || this.$store.state.dataset.data.length < 1)) {
      this.$store.dispatch('loadDataset', { datasetId: this.storeDatasetId, redirect: false })
    } else {
      this.$nextTick(() => this.init())
    }
    emitter.on('dataset-changed', this.init)
  },
  beforeDestroy: function () {
    emitter.off('dataset-changed', this.init)
  }
}
</script>

<style>
.stats-chart {
  min-height: 300px;
  height: 40vh;
}
</style>
