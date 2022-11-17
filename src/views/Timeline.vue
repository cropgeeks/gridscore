<template>
  <div>
    <h1>{{ $t('pageTimelineTitle') }} <small><a href="#" class="text-secondary" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></a></small></h1>
    <p>{{ $t('pageTimelineText') }}</p>
    <div id="timeseries-chart" class="time-chart" v-if="storeDatasetId && storeTraits && storeTraits.length > 0"/>
    <h3 v-else>{{ $t('labelNoData') }}</h3>

    <div v-if="multiTraits && multiTraits.length > 0" class="mt-3">
      <h1>{{ $t('pageTimelineMultiTitle') }}</h1>
      <p>{{ $t('pageTimelineMultipleText') }}</p>
      <MultiTraitTimeline :trait="mt" v-for="mt in multiTraits" :key="`mt-${mt.name}`" />
    </div>
    <HelpModal url="https://cropgeeks.github.io/gridscore/visualizing-data.html#timeline" ref="helpModal" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconQuestionCircleFill } from 'bootstrap-vue'

import MultiTraitTimeline from '@/components/MultiTraitTimeline'
import HelpModal from '@/components/modals/HelpModal'

const emitter = require('tiny-emitter/instance')
const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/scatter')
])

/**
 * Shows the timeline for data recording of each trait as a percentage of all plots scored.
 */
export default {
  components: {
    BIconQuestionCircleFill,
    MultiTraitTimeline,
    HelpModal
  },
  watch: {
    storeLocale: function () {
      this.plot()
    },
    storeDarkMode: function () {
      this.plot()
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeDarkMode',
      'storeDatasetId',
      'storeDatasetName',
      'storeLocale',
      'storeRows',
      'storeTraitColors',
      'storeTraits'
    ]),
    safeDatasetName: function () {
      if (this.storeDatasetName) {
        return this.storeDatasetName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    },
    multiTraits: function () {
      return this.storeTraits.filter(t => t.mType === 'multi' && (t.type === 'int' || t.type === 'float'))
    }
  },
  methods: {
    plot: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.size < 1 || !this.storeTraits || this.storeTraits.length < 1) {
        return
      }

      Plotly.purge('timeseries-chart')

      const plots = this.storeRows * this.storeCols

      // The mapping is used to figure out for each trait how many fields were scored at each timepoint
      const mapping = []
      const traces = []
      // For each trait, add an empty object to the fields
      this.storeTraits.forEach(() => {
        mapping.push({})
        traces.push({})
      })
      // For each field cell
      storeData.forEach((c, k) => {
        c.dates.forEach((d, i) => {
          let value = c.values[i]
          let date = d
          if (this.storeTraits[i].mType === 'multi') {
            value = this.extractMultiTraitDatum(i, this.storeTraits[i].mType, null, 'last', c, true)
            date = this.extractMultiTraitDatum(i, this.storeTraits[i].mType, null, 'last', c, false)
          }
          // If it exists
          if (value !== undefined && value !== null && date) {
            // Get the current count for that trait and date
            let count = mapping[i][date]

            // Increment it
            if (!count) {
              count = 1
            } else {
              count++
            }

            // Put it back
            mapping[i][date] = count
          }
        })
      })

      // For each trait in the mapping
      mapping.forEach((t, index) => {
        // Get all the dates sorted
        const dates = Object.keys(t).sort()
        traces[index] = {
          type: 'scatter',
          mode: 'lines+markers',
          name: this.storeTraits[index].name,
          line: {
            color: this.storeTraitColors[index % this.storeTraitColors.length]
          },
          // X values are the dates
          x: dates,
          // Y values are filled later
          y: []
        }

        // Calculate the cumulative sum of plots scored at a certain date
        let counter = 0
        dates.forEach(d => {
          counter += t[d]
          traces[index].y.push(counter)
        })
      })

      // Relativize the value to a percentage
      traces.forEach(t => {
        t.y = t.y.map(y => y / plots * 100)
      })

      const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        hovermode: 'x',
        xaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          title: { text: this.$t('chartLabelTimeseriesTime'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        yaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          rangemode: 'tozero',
          title: { text: this.$t('chartLabelTimeseriesPlotsScores'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        legend: { orientation: 'h', font: { color: this.storeDarkMode ? 'white' : 'black' } }
      }

      const config = {
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: `timeline-${this.safeDatasetName}-${new Date().toISOString().split('T')[0]}`,
          width: 1280,
          height: 720
        },
        displaylogo: false
      }

      Plotly.newPlot('timeseries-chart', traces, layout, config)
    }
  },
  mounted: function () {
    if (this.storeDatasetId !== undefined && this.storeDatasetId !== null && (!this.$store.state.dataset.data || this.$store.state.dataset.data.length < 1)) {
      this.$store.dispatch('loadDataset', { datasetId: this.storeDatasetId, redirect: false })
    } else {
      this.$nextTick(() => this.plot())
    }
    emitter.on('dataset-changed', this.plot)
  },
  beforeDestroy: function () {
    emitter.off('dataset-changed', this.plot)
  }
}
</script>

<style scoped>
.time-chart {
  height: 80vh;
}
</style>
