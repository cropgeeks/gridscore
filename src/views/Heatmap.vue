<template>
  <div>
    <h1>{{ $t('pageHeatmapTitle') }}</h1>
    <p>{{ $t('pageHeatmapText') }}</p>
    <div v-if="storeData && storeData.size > 0 && storeTraits && storeTraits.length > 0">
      <!-- Trait selection box -->
      <b-form-group :label="$t('formLabelTrait')" label-for="trait">
        <b-form-select id="trait" :options="traits" v-model="trait" />
      </b-form-group>
      <!-- Heatmap element -->
      <div id="heatmap-chart"/>
    </div>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

/**
 * Component that shows a heatmap for the selected trait
 */
export default {
  data: function () {
    return {
      traits: [],
      trait: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeData',
      'storeDatasetName',
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
    trait: function () {
      this.update()
    },
    storeLocale: function () {
      this.update()
    },
    storeDarkMode: function () {
      this.update()
    }
  },
  methods: {
    update: function () {
      this.$plotly.purge('heatmap-chart')

      const rows = this.storeRows
      const cols = this.storeCols
      const actualTrait = this.storeTraits[this.trait]
      let hasData = false
      let data = null

      if (actualTrait.type === 'date' || actualTrait.type === 'text') {
        // If we're dealing with dates or text, check if there is date data
        outer:
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (this.storeData.get(`${row}-${col}`).dates[this.trait] !== null) {
              hasData = true
              break outer
            }
          }
        }
      } else {
        // Else check if there is value data
        outer:
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (this.storeData.get(`${row}-${col}`).values[this.trait] !== null) {
              hasData = true
              break outer
            }
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
              const date = this.storeData.get(`${row}-${col}`).dates[this.trait]

              if (date) {
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
              const cell = this.storeData.get(`${row}-${col}`)
              textZ.push(cell.name)
              // Get the cell date
              const dateString = cell.dates[this.trait]

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
            colorscale: [[0, '#dddddd'], [1, this.storeTraitColors[this.trait % this.storeTraitColors.length]]],
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
              const cell = this.storeData.get(`${row}-${col}`)

              if (isCategorical) {
                // Plot the actual category rather than just its index
                textZ.push(`x: ${col}<br>y: ${row}<br>z: ${cell.values[this.trait]}<br>${cell.name}`)
              } else {
                textZ.push(cell.name)
              }

              // Get the cell date
              const value = cell.values[this.trait]

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
            colorscale: [[0, '#dddddd'], [1, this.storeTraitColors[this.trait % this.storeTraitColors.length]]],
            hoverinfo: isCategorical ? 'text' : 'all',
            colorbar: isCategorical ? {
              tickmode: 'array',
              tickvals: actualTrait.restrictions.categories.map((c, i) => i),
              ticktext: actualTrait.restrictions.categories
            } : null
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
          }
        }

        this.$plotly.newPlot('heatmap-chart', data, layout, config)
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
  }
}
</script>

<style>
</style>
