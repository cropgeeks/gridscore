<template>
  <div v-if="trait">
    <h2><span :style="{ color: storeTraitColors[traitIndex % storeTraitColors.length] }"><BIconCircleFill /> {{ trait.name }} <b-badge variant="light" class="ml-1">{{ getTraitTypeText(trait) }}</b-badge></span></h2>
    <div ref="tlTrait" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconCircleFill } from 'bootstrap-vue'

const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/scatter')
])

export default {
  components: {
    BIconCircleFill
  },
  props: {
    trait: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapGetters([
      'storeDatasetName',
      'storeDarkMode',
      'storeTraits',
      'storeTraitColors'
    ]),
    traitIndex: function () {
      return this.storeTraits.findIndex(t => t.name === this.trait.name)
    },
    safeDatasetName: function () {
      if (this.storeDatasetName) {
        return this.storeDatasetName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    }
  },
  watch: {
    trait: function () {
      this.plot()
    },
    storeDarkMode: function () {
      this.plot()
    }
  },
  methods: {
    plot: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.size < 1 || !this.trait) {
        return
      }

      Plotly.purge(this.$refs.tlTrait)
      const traitIndex = this.storeTraits.findIndex(t => t.name === this.trait.name)

      // For each field cell
      const traces = Array.from(storeData.values()).filter(c => c.values[traitIndex] !== undefined && c.values[traitIndex] !== null)
        .map(c => {
          return {
            type: 'scatter',
            mode: 'lines+markers',
            name: c.name,
            x: c.dates[traitIndex],
            y: c.values[traitIndex]
          }
        })

      const layout = {
        hovermode: 'x',
        height: 500 + traces.length * 5,
        autosize: true,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
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
          title: { text: this.trait.name, font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        legend: { orientation: 'h', x: 1, y: 1.2, xanchor: 'right', font: { color: this.storeDarkMode ? 'white' : 'black' } }
      }

      const config = {
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: `timeline-${this.safeDatasetName}-${this.trait.name}-${new Date().toISOString().split('T')[0]}`,
          width: 1280,
          height: 720
        },
        displaylogo: false
      }

      Plotly.newPlot(this.$refs.tlTrait, traces, layout, config)
    }
  },
  mounted: function () {
    this.plot()
  }
}
</script>

<style>

</style>
