<template>
  <div v-if="trait">
    <h2><span :style="{ color: storeTraitColors[traitIndex % storeTraitColors.length] }"><BIconCircleFill /> {{ trait.name }} <b-badge variant="light" class="ml-1">{{ getTraitTypeText(trait) }}</b-badge></span></h2>

    <b-button-group class="mb-3">
      <b-button v-for="mode in plotModes" :key="`plot-mode-${mode.value}`" :pressed="plotMode === mode.value" @click="plotMode = mode.value">
        <component :is="mode.icon" /> {{ mode.name }}
      </b-button>
    </b-button-group>
    <div v-if="plotMode === 'selection'" class="select-search-wrapper">
      <b-form-input v-model="searchTerm" type="search" :placeholder="$t('formPlaceholderTimelinePlotSearch')" />
      <b-input-group>
        <b-select multiple :options="filteredGermplasm" v-model="selectedGermplasmTemp" />
        <b-input-group-append>
          <b-button @click="addGermplasm"><BIconPlusSquareFill /></b-button>
        </b-input-group-append>
      </b-input-group>

      <div class="my-3">
        <b-badge class="mr-2" v-for="(germplasm, index) in selectedGermplasm" :key="`germplasm-badge-${germplasm}`">
          {{ germplasm }} <button type="button" class="close badge-close" @click="removeGermplasm(index)">×</button>
        </b-badge>
      </div>
    </div>
    <div ref="tlTrait" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconCardChecklist, BIconCircleFill, BIconCardList, BIconHr, BIconPlusSquareFill } from 'bootstrap-vue'

const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/scatter')
])

export default {
  components: {
    BIconCircleFill,
    BIconPlusSquareFill
  },
  props: {
    trait: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      plotMode: 'average',
      selectedGermplasmTemp: [],
      selectedGermplasm: [],
      searchTerm: null
    }
  },
  computed: {
    ...mapGetters([
      'storeDatasetName',
      'storeDarkMode',
      'storeTraits',
      'storeTraitColors'
    ]),
    searchTermLowerCase: function () {
      if (this.searchTerm) {
        return this.searchTerm.toLowerCase()
      } else {
        return null
      }
    },
    filteredGermplasm: function () {
      if (this.searchTerm) {
        return this.allGermplasm.filter(g => g.toLowerCase().includes(this.searchTermLowerCase))
      } else {
        return this.allGermplasm
      }
    },
    allGermplasm: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.size < 1 || !this.trait) {
        return []
      } else {
        const result = []

        storeData.forEach(c => result.push(c.displayName))

        return result.sort()
      }
    },
    plotModes: function () {
      return [{
        name: this.$t('timelinePlotTypeAverage'),
        value: 'average',
        icon: BIconHr
      }, {
        name: this.$t('timelinePlotTypeAll'),
        value: 'all',
        icon: BIconCardChecklist
      }, {
        name: this.$t('timelinePlotTypeSelection'),
        value: 'selection',
        icon: BIconCardList
      }]
    },
    traitIndex: function () {
      return this.storeTraits.findIndex(t => t.name === this.trait.name)
    },
    safeDatasetName: function () {
      if (this.storeDatasetName) {
        return this.storeDatasetName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    },
    plotData: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.size < 1 || !this.trait) {
        return []
      }

      const traitIndex = this.storeTraits.findIndex(t => t.name === this.trait.name)

      const allDates = new Set()
      storeData.forEach(c => {
        if (c.values[traitIndex] !== undefined && c.values[traitIndex] !== null) {
          c.dates[traitIndex].forEach(d => allDates.add(d))
        }
      })

      const sortedDates = [...allDates].sort((a, b) => a - b)

      // Keep track of statistics
      const mins = sortedDates.map(d => Number.MAX_SAFE_INTEGER)
      const maxs = mins.map(d => -d)
      const totals = mins.map(d => 0)
      const counts = mins.map(d => 0)
      const traces = []
      // For each field cell
      storeData.forEach(c => {
        if (c.values[traitIndex] !== undefined && c.values[traitIndex] !== null) {
          const values = c.values[traitIndex]
          // Update statistics
          mins.forEach((m, i) => {
            if (values[i] !== undefined && values[i] !== null) {
              mins[i] = Math.min(mins[i], +values[i])
              maxs[i] = Math.max(maxs[i], +values[i])
              totals[i] += +values[i]
              counts[i]++
            }
          })

          if (this.plotMode === 'all' || (this.plotMode === 'selection' && this.selectedGermplasm.indexOf(c.displayName) !== -1)) {
            traces.push({
              type: 'scatter',
              mode: 'lines+markers',
              name: c.displayName,
              x: c.dates[traitIndex],
              y: values
            })
          }
        }
      })

      const background = {
        x: [],
        y: [],
        fill: 'tozerox',
        fillcolor: 'rgba(200, 200, 200, .3)',
        line: { color: 'transparent' },
        name: this.$t('plotTraceValueRange'),
        hoverinfo: 'skip',
        type: 'scatter'
      }
      const avg = {
        x: sortedDates,
        y: totals.map((t, i) => t / counts[i]),
        type: 'scatter',
        mode: 'lines',
        name: this.$t('plotTraceAverage'),
        line: { color: '#7f8c8d' }
      }

      for (let i = 0; i < sortedDates.length; i++) {
        background.x.push(sortedDates[i])
        background.y.push(maxs[i])
      }
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        background.x.push(sortedDates[i])
        background.y.push(mins[i])
      }

      traces.unshift(avg)
      traces.unshift(background)

      return traces
    }
  },
  watch: {
    plotData: function () {
      this.plot()
    },
    storeDarkMode: function () {
      this.plot()
    }
  },
  methods: {
    removeGermplasm: function (index) {
      this.selectedGermplasm.splice(index, 1)
    },
    addGermplasm: function () {
      const set = new Set()
      this.selectedGermplasm.forEach(g => set.add(g))
      this.selectedGermplasmTemp.forEach(g => set.add(g))
      this.selectedGermplasm = [...set]
      this.selectedGermplasmTemp = []
    },
    plot: function () {
      Plotly.purge(this.$refs.tlTrait)

      const layout = {
        hovermode: 'x',
        height: 500 + this.plotData.length * 5,
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

      Plotly.newPlot(this.$refs.tlTrait, this.plotData, layout, config)
    }
  },
  mounted: function () {
    this.plot()
  }
}
</script>

<style scoped>
.badge-close {
  color: inherit;
  font-size: 125%;
  line-height: 1;
  float: none;
  margin-left: 0.25rem;
}
.select-search-wrapper input {
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.select-search-wrapper select {
  border-top-right-radius: 0;
  border-top-left-radius: 0;
  border-top: 0;
}
</style>
