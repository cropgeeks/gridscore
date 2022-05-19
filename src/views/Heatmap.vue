<template>
  <div>
    <h1>{{ $t('pageHeatmapTitle') }}</h1>
    <p>{{ $t('pageHeatmapText') }}</p>
    <div v-if="storeDatasetId && storeTraits && storeTraits.length > 0">
      <!-- Trait selection box -->
      <b-form-group :label="$t('formLabelTrait')" label-for="trait">
        <b-form-select id="trait" :options="traits" v-model="trait" />
      </b-form-group>
      <b-form-group :label="$t('formLabelMultiTraitVizType')" label-for="trait-viz-type" v-if="trait !== null && storeTraits[trait].mType === 'multi'">
        <b-form-select id="trait-viz-type" :options="multiTraitOptions" v-model="selectedMultiTraitMethod" />
      </b-form-group>
      <!-- Heatmap element -->
      <div id="heatmap-chart"/>
    </div>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/heatmap')
])

/**
 * Component that shows a heatmap for the selected trait
 */
export default {
  data: function () {
    return {
      traits: [],
      trait: null,
      selectedMultiTraitMethod: 'last',
      multiTraitOptions: []
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeDatasetName',
      'storeDatasetId',
      'storeDarkMode',
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
    }
  },
  watch: {
    trait: function (newValue) {
      this.selectedMultiTraitMethod = 'last'
      this.multiTraitOptions = this.getMultiTraitMethods(this.storeTraits[newValue])
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
          const dps = (actualTrait.type === 'date' || actualTrait.type === 'text') ? storeData.get(`${row}-${col}`).dates[this.trait] : storeData.get(`${row}-${col}`).values[this.trait]
          if ((actualTrait.mType === 'multi' && dps !== null && dps.length > 0) ||
              (actualTrait.mType !== 'multi' && dps !== null)) {
            hasData = true
            break outer
          }
        }
      }

      if (hasData === true) {
        // If there is data, plot the data differently for dates and text
        if (actualTrait.type === 'date' || actualTrait.type === 'text') {
          // Assume a maximum date
          let minDateString = '9999-12-31'

          // Find the minimum in the data
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const date = this.extractMultiTraitDatum(this.trait, actualTrait.mType, this.selectedMultiTraitMethod, storeData.get(`${row}-${col}`), false)

              if (date !== null) {
                minDateString = date < minDateString ? date : minDateString
              }
            }
          }

          // Parse it
          const minDate = Date.parse(minDateString)

          const z = []
          const text = []

          for (let row = rows - 1; row >= 0; row--) {
            const rowZ = []
            const textZ = []
            for (let col = 0; col < cols; col++) {
              const cell = storeData.get(`${row}-${col}`)
              textZ.push(cell.name)
              // Get the cell date
              const dateString = this.extractMultiTraitDatum(this.trait, actualTrait.mType, this.selectedMultiTraitMethod, cell, false)

              if (dateString) {
                // If there is one, return the time difference to the minimum date in days
                const date = Date.parse(dateString)

                rowZ.push((date - minDate) / (1000 * 60 * 60 * 24))
              } else {
                // Else return NaN
                rowZ.push(NaN)
              }
            }
            z.push(rowZ)
            text.push(textZ)
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
            colorscale: [[0, this.storeDarkMode ? '#444444' : '#dddddd'], [1, this.storeTraitColors[this.trait % this.storeTraitColors.length]]],
            colorbar: {
              title: {
                text: this.$t('plotLegendDaysSinceFirstRecording'),
                side: 'right',
                font: { color: this.storeDarkMode ? 'white' : 'black' }
              },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
            }
          }]
        } else {
          // For all other data types use the actual data instead of the date for plotting
          const isCategorical = actualTrait.type === 'categorical' && actualTrait.restrictions && actualTrait.restrictions.categories

          const z = []
          const text = []

          for (let row = rows - 1; row >= 0; row--) {
            const rowZ = []
            const textZ = []
            for (let col = 0; col < cols; col++) {
              const cell = storeData.get(`${row}-${col}`)

              // Get the cell date
              const value = this.extractMultiTraitDatum(this.trait, actualTrait.mType, this.selectedMultiTraitMethod, cell, true)

              if (isCategorical) {
                // Plot the actual category rather than just its index
                textZ.push(`x: ${col}<br>y: ${row}<br>z: ${value}<br>${cell.name}`)
              } else {
                textZ.push(cell.name)
              }

              if (value !== undefined && value !== null) {
                if (isCategorical) {
                  // For categorical traits use the index, because the heatmap doesn't support categorical data
                  rowZ.push(actualTrait.restrictions.categories.indexOf(value))
                } else {
                  // Else just plot the value
                  rowZ.push(value)
                }
              } else {
                rowZ.push(NaN)
              }
            }
            z.push(rowZ)
            text.push(textZ)
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
            colorscale: [[0, this.storeDarkMode ? '#444444' : '#dddddd'], [1, this.storeTraitColors[this.trait % this.storeTraitColors.length]]],
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
            title: { text: this.$t('chartLabelHeatmapCol'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            range: [0, cols + 1]
          },
          yaxis: {
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(rows).keys()).map(i => i + 1),
            ticktext: Array.from(Array(rows).keys()).map(i => '' + (rows - i)),
            title: { text: this.$t('chartLabelHeatmapRow'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            range: [0, rows + 1]
          },
          annotations: []
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
    }
  },
  mounted: function () {
    this.traits = this.storeTraits.map((t, index) => {
      return {
        value: index,
        text: t.name
      }
    })
    this.trait = this.traits.length > 0 ? 0 : null

    this.multiTraitOptions = this.getMultiTraitMethods(this.storeTraits[this.trait])
  }
}
</script>

<style>
</style>
