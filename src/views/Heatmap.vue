<template>
  <div>
    <h1>{{ $t('pageHeatmapTitle') }} <small><a href="#" class="text-secondary" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></a></small></h1>
    <p>{{ $t('pageHeatmapText') }}</p>
    <div v-if="storeDatasetId && storeTraits && storeTraits.length > 0">
      <b-row>
        <b-col cols=12 md=6 lg=4>
          <!-- Trait selection box -->
          <b-form-group :label="$t('formLabelTrait')" label-for="trait">
            <b-form-select id="trait" :options="traits" v-model="trait" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6 lg=4>
          <b-form-group :label="$t('formLabelMultiTraitVizType')" label-for="trait-viz-type" v-if="trait !== null && storeTraits[trait].mType === 'multi'">
            <b-form-select id="trait-viz-type" :options="multiTraitOptions" v-model="selectedMultiTraitMethod" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6 lg=4>
          <b-form-group :label="$t('formLabelMultiTraitVizTimeline')" label-for="timepoint" v-if="trait !== null && storeTraits[trait].mType === 'multi' && selectedMultiTraitMethod === 'timeline'" :description="$t('formDescriptionCurrentTimepoint', { date: timepoints[currentTimepoint] })">
            <b-form-input type="range" v-model.number="currentTimepoint" :min="0" :max="timepoints.length - 1" />
          </b-form-group>
        </b-col>
      </b-row>
      <!-- Heatmap element -->
      <div id="heatmap-chart"/>
    </div>
    <h3 v-else>{{ $t('labelNoData') }}</h3>

    <HelpModal url="https://cropgeeks.github.io/gridscore/visualizing-data.html#heatmap" ref="helpModal" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconQuestionCircleFill } from 'bootstrap-vue'

import HelpModal from '@/components/modals/HelpModal'

const emitter = require('tiny-emitter/instance')
const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/heatmap')
])

/**
 * Component that shows a heatmap for the selected trait
 */
export default {
  components: {
    BIconQuestionCircleFill,
    HelpModal
  },
  data: function () {
    return {
      traits: [],
      trait: null,
      selectedMultiTraitMethod: 'last',
      multiTraitOptions: [],
      currentTimepoint: 0
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeDatasetName',
      'storeDatasetId',
      'storeDarkMode',
      'storeInvertNumberingX',
      'storeInvertNumberingY',
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
    timepoints: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null

      const set = new Set()
      storeData.forEach(c => {
        const t = this.storeTraits[this.trait]

        if (t.mType === 'multi' && c.dates[this.trait]) {
          c.dates[this.trait].forEach(date => set.add(date))
        }
      })

      set.delete(null)

      const sorted = [...set]
      sorted.sort()
      return sorted
    }
  },
  watch: {
    trait: function (newValue) {
      this.selectedMultiTraitMethod = 'last'
      this.currentTimepoint = 0
      this.multiTraitOptions = this.getMultiTraitMethods(this.storeTraits[newValue], true)

      this.update()
    },
    storeLocale: function () {
      this.update()
    },
    storeDarkMode: function () {
      this.update()
    },
    selectedMultiTraitMethod: function () {
      this.update()
    },
    currentTimepoint: function () {
      this.update()
    }
  },
  methods: {
    update: function () {
      Plotly.purge('heatmap-chart')

      const rows = this.storeRows
      const cols = this.storeCols
      const actualTrait = this.storeTraits[this.trait]
      let hasData = false
      let data = null

      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null

      outer:
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // If we're dealing with dates or text, check if there is date data, else check if there is value data
          const cell = storeData.get(`${row}-${col}`)

          if (cell.values[this.trait]) {
            const dps = (actualTrait.type === 'date' || actualTrait.type === 'text') ? cell.dates[this.trait] : cell.values[this.trait]
            if ((actualTrait.mType === 'multi' && dps !== null && dps.length > 0) ||
              (actualTrait.mType !== 'multi' && dps !== null)) {
              hasData = true
              break outer
            }
          }
        }
      }

      if (hasData === true) {
        let minScale = null
        let maxScale = null

        // If there is data, plot the data differently for dates and text
        if (actualTrait.type === 'date' || actualTrait.type === 'text') {
          // Assume a maximum date
          let minDateString = '9999-12-31'
          let minDateMultiString = '9999-12-31'

          // Find the minimum in the data
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              if (actualTrait.mType === 'multi' && this.timepoints) {
                // Get the min and max across all timepoints for the scale
                this.timepoints.forEach(tp => {
                  const d = this.extractMultiTraitDatum(this.trait, actualTrait.mType, tp, this.selectedMultiTraitMethod, storeData.get(`${row}-${col}`), true)

                  if (d !== null) {
                    minDateMultiString = d < minDateMultiString ? d : minDateMultiString
                  }
                })
              }

              const date = this.extractMultiTraitDatum(this.trait, actualTrait.mType, this.timepoints[this.currentTimepoint], this.selectedMultiTraitMethod, storeData.get(`${row}-${col}`), true)

              if (date !== null) {
                minDateString = date < minDateString ? date : minDateString
              }
            }
          }

          // Parse it
          const minDate = Date.parse(minDateString)
          const minDateMulti = Date.parse(minDateMultiString)

          const z = []
          const text = []

          let minZ = Number.MAX_SAFE_INTEGER
          let maxZ = -Number.MAX_SAFE_INTEGER
          for (let row = rows - 1; row >= 0; row--) {
            const rowZ = []
            const textZ = []
            for (let col = 0; col < cols; col++) {
              const cell = storeData.get(`${row}-${col}`)

              textZ.push(cell.displayName)
              // Get the cell date
              const dateString = this.extractMultiTraitDatum(this.trait, actualTrait.mType, this.timepoints[this.currentTimepoint], this.selectedMultiTraitMethod, cell, true)

              if (dateString) {
                // If there is one, return the time difference to the minimum date in days
                const date = Date.parse(dateString)

                // If it's a multi-trait, take the difference to the minimum across timepoints (so it matches the global scale)
                if (actualTrait.mType === 'multi') {
                  rowZ.push((date - minDateMulti) / (1000 * 60 * 60 * 24))
                } else {
                  rowZ.push((date - minDate) / (1000 * 60 * 60 * 24))
                }

                minZ = Math.min(minZ, rowZ[rowZ.length - 1])
                maxZ = Math.max(maxZ, rowZ[rowZ.length - 1])
              } else {
                // Else return NaN
                rowZ.push(NaN)
              }

              if (actualTrait.mType === 'multi' && this.timepoints) {
                // Get the min and max across all timepoints for the scale
                if (cell.values && cell.values[this.trait]) {
                  cell.values[this.trait].forEach(d => {
                    if (d) {
                      // If there is one, return the time difference to the minimum date in days
                      const date = Date.parse(d)

                      const diff = (date - minDateMulti) / (1000 * 60 * 60 * 24)

                      if (minScale === null) {
                        minScale = diff
                      } else {
                        minScale = Math.min(diff, minScale)
                      }
                      if (maxScale === null) {
                        maxScale = diff
                      } else {
                        maxScale = Math.max(diff, maxScale)
                      }
                    }
                  })
                }
              }
            }
            z.push(rowZ)
            text.push(textZ)
          }

          const zero = (0 - minZ) / (maxZ - minZ)
          let colorscale = [[0, this.storeDarkMode ? '#444444' : '#dddddd'], [1, this.storeTraitColors[this.trait % this.storeTraitColors.length]]]

          if (zero > 0) {
            const top = this.storeTraitColors[this.trait % this.storeTraitColors.length]
            const bottom = this.storeTraitColors[(this.trait + 1) % this.storeTraitColors.length]
            colorscale = [[0, bottom], [zero, this.storeDarkMode ? '#444444' : '#dddddd'], [1, top]]
          }

          data = [{
            // X values are the column indices
            x: Array.from({ length: cols }, (v, k) => k + 1),
            // Y Values are the row indices
            y: Array.from({ length: rows }, (v, k) => k + 1),
            z: z,
            text: text,
            type: 'heatmap',
            hoverongaps: false,
            colorscale: colorscale,
            colorbar: {
              title: {
                text: this.$t('plotLegendDaysSinceFirstRecording'),
                side: 'right',
                font: { color: this.storeDarkMode ? 'white' : 'black' }
              },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
              orientation: window.innerWidth < 768 ? 'h' : 'v'
            }
          }]
        } else {
          // For all other data types use the actual data instead of the date for plotting
          const isCategorical = actualTrait.type === 'categorical' && actualTrait.restrictions && actualTrait.restrictions.categories

          const z = []
          const text = []

          let minZ = Number.MAX_SAFE_INTEGER
          let maxZ = -Number.MAX_SAFE_INTEGER
          for (let row = rows - 1; row >= 0; row--) {
            const rowZ = []
            const textZ = []
            for (let col = 0; col < cols; col++) {
              const cell = storeData.get(`${row}-${col}`)

              if (actualTrait.mType === 'multi' && !isCategorical && this.timepoints) {
                if (cell.values && cell.values[this.trait]) {
                  cell.values[this.trait].forEach(d => {
                    if (minScale === null) {
                      minScale = d
                    } else {
                      minScale = Math.min(minScale, d)
                    }
                    if (maxScale === null) {
                      maxScale = d
                    } else {
                      maxScale = Math.max(maxScale, d)
                    }
                  })
                }
              }

              // Get the cell date
              const value = this.extractMultiTraitDatum(this.trait, actualTrait.mType, this.timepoints[this.currentTimepoint], this.selectedMultiTraitMethod, cell, true)

              if (isCategorical) {
                // Plot the actual category rather than just its index
                textZ.push(`x: ${col}<br>y: ${row}<br>z: ${value}<br>${cell.displayName}`)
              } else {
                textZ.push(cell.displayName)
              }

              if (value !== undefined && value !== null) {
                if (isCategorical) {
                  // For categorical traits use the index, because the heatmap doesn't support categorical data
                  rowZ.push(actualTrait.restrictions.categories.indexOf(value))
                } else {
                  // Else just plot the value
                  rowZ.push(value)
                }
                minZ = Math.min(minZ, rowZ[rowZ.length - 1])
                maxZ = Math.max(maxZ, rowZ[rowZ.length - 1])
              } else {
                rowZ.push(NaN)
              }
            }
            z.push(rowZ)
            text.push(textZ)
          }

          const zero = (0 - minZ) / (maxZ - minZ)
          let colorscale = [[0, this.storeDarkMode ? '#444444' : '#dddddd'], [1, this.storeTraitColors[this.trait % this.storeTraitColors.length]]]

          if (zero > 0) {
            const top = this.storeTraitColors[this.trait % this.storeTraitColors.length]
            const bottom = this.storeTraitColors[(this.trait + 1) % this.storeTraitColors.length]
            colorscale = [[0, bottom], [zero, this.storeDarkMode ? '#444444' : '#dddddd'], [1, top]]
          }

          data = [{
            // X values are the column indices
            x: Array.from({ length: cols }, (v, k) => k + 1),
            // Y Values are the row indices
            y: Array.from({ length: rows }, (v, k) => k + 1),
            z: z,
            text: text,
            type: 'heatmap',
            hoverongaps: false,
            colorscale: colorscale,
            hoverinfo: isCategorical ? 'text' : 'all',
            colorbar: isCategorical
              ? {
                tickmode: 'array',
                tickvals: actualTrait.restrictions.categories.map((c, i) => i),
                ticktext: actualTrait.restrictions.categories,
                title: {
                  side: 'right',
                  font: { color: this.storeDarkMode ? 'white' : 'black' }
                },
                tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
              }
              : {
                title: {
                  side: 'right',
                  font: { color: this.storeDarkMode ? 'white' : 'black' }
                },
                tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
              }
          }]
        }

        // If minScale and maxScale are set (means we have a multi-trait with timepoints), then adjust the z-scale to show the overall min
        // and max instead of just the min and max for the current timepoint
        if (minScale !== null && maxScale !== null) {
          data[0].zauto = false
          data[0].zmin = minScale
          data[0].zmax = maxScale
        }

        // Get the axis ticks based on inversion state
        const xTicks = this.storeInvertNumberingX ? Array.from(Array(cols).keys()).map(i => cols - i) : Array.from(Array(cols).keys()).map(i => i + 1)
        const yTicks = this.storeInvertNumberingY ? Array.from(Array(rows).keys()).map(i => i + 1) : Array.from(Array(rows).keys()).map(i => rows - i)

        const layout = {
          margin: { autoexpand: true },
          autosize: true,
          height: (25 * rows) + 200,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(cols).keys()).map(i => i + 1),
            ticktext: xTicks,
            title: { text: this.$t('chartLabelHeatmapCol'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
          },
          yaxis: {
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(rows).keys()).map(i => i + 1),
            ticktext: yTicks,
            title: { text: this.$t('chartLabelHeatmapRow'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
          }
        }

        const filename = this.traits[this.trait].text.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const config = {
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: `heatmap-${this.safeDatasetName}-${filename}-${new Date().toISOString().split('T')[0]}`
          },
          displaylogo: false
        }

        Plotly.newPlot('heatmap-chart', data, layout, config)
      }
    },
    init: function () {
      this.traits = this.storeTraits.map((t, index) => {
        return {
          value: index,
          text: t.name
        }
      })
      this.trait = this.traits.length > 0 ? 0 : null

      this.multiTraitOptions = this.getMultiTraitMethods(this.storeTraits[this.trait])
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
</style>
