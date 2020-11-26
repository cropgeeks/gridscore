<template>
  <div>
    <h1>{{ $t('pageHeatmapTitle') }}</h1>
    <p>{{ $t('pageHeatmapText') }}</p>
    <div v-if="dataset && dataset.data && dataset.data.length > 0 && dataset.traits && dataset.traits.length > 0">
      <!-- Trait selection box -->
      <b-form-group :label="$t('formLabelHeatmapTrait')" label-for="trait">
        <b-form-select id="trait" :options="traits" v-model="trait" />
      </b-form-group>
      <!-- Heatmap element -->
      <div id="heatmap-chart"/>
    </div>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
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
  watch: {
    trait: function () {
      this.update()
    },
    locale: function () {
      this.update()
    }
  },
  methods: {
    update: function () {
      this.$plotly.purge('heatmap-chart')

      const rows = this.dataset.rows
      const cols = this.dataset.cols
      const actualTrait = this.dataset.traits[this.trait]
      let hasData = false
      let data = null

      if (actualTrait.type === 'date' || actualTrait.type === 'text') {
        // If we're dealing with dates or text, check if there is date data
        outer:
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (this.dataset.data[row][col].dates[this.trait] !== null) {
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
            if (this.dataset.data[row][col].values[this.trait] !== null) {
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
              const date = this.dataset.data[row][col].dates[this.trait]

              if (date) {
                minDateString = date < minDateString ? date : minDateString
              }
            }
          }

          // Parse it
          const minDate = Date.parse(minDateString)

          data = [{
            // X values are the column indices
            x: Array.from({ length: cols }, (v, k) => k + 1),
            // Y Values are the row indices
            y: Array.from({ length: rows }, (v, k) => k + 1),
            z: this.dataset.data.map((row, index) => {
              let result = []
              for (let col = 0; col < cols; col++) {
                // Get the cell date
                const dateString = this.dataset.data[rows - index - 1][col].dates[this.trait]

                if (dateString) {
                  // If there is one, return the time difference to the minimum date in days
                  const date = Date.parse(dateString)

                  result.push((date - minDate) / (1000 * 60 * 60 * 24))
                } else {
                  // Else return NaN
                  result.push(NaN)
                }
              }
              return result
            }),
            text: this.dataset.data.map((row, index) => {
              // Return variety names
              let result = []
              for (let col = 0; col < cols; col++) {
                result.push(this.dataset.data[rows - index - 1][col].name)
              }
              return result
            }),
            type: 'heatmap',
            hoverongaps: false,
            colorscale: [[0, '#dddddd'], [1, this.colors[this.trait % this.colors.length]]],
            colorbar: {
              title: {
                text: this.$t('plotLegendDaysSinceFirstRecording'),
                side: 'right'
              }
            }
          }]
        } else {
          // For all other data types use the actual data instead of the date for plotting
          const isCategorical = actualTrait.type === 'categorical' && actualTrait.restrictions && actualTrait.restrictions.categories
          data = [{
            // X values are the column indices
            x: Array.from({ length: cols }, (v, k) => k + 1),
            // Y Values are the row indices
            y: Array.from({ length: rows }, (v, k) => k + 1),
            z: this.dataset.data.map((row, index) => {
              let result = []
              for (let col = 0; col < cols; col++) {
                const value = this.dataset.data[rows - index - 1][col].values[this.trait]

                if (value) {
                  if (isCategorical) {
                    // For categorical traits use the index, because the heatmap doesn't support categorical data
                    result.push(actualTrait.restrictions.categories.indexOf(value))
                  } else {
                    // Else just plot the value
                    result.push(value)
                  }
                } else {
                  result.push(NaN)
                }
              }
              return result
            }),
            text: this.dataset.data.map((row, index) => {
              let result = []
              for (let col = 0; col < cols; col++) {
                if (isCategorical) {
                  // Plot the actual category rather than just its index
                  result.push(`x: ${col}<br>y: ${rows - index - 1}<br>z: ${this.dataset.data[rows - index - 1][col].values[this.trait]}<br>${this.dataset.data[rows - index - 1][col].name}`)
                } else {
                  result.push(this.dataset.data[rows - index - 1][col].name)
                }
              }
              return result
            }),
            type: 'heatmap',
            hoverongaps: false,
            colorscale: [[0, '#dddddd'], [1, this.colors[this.trait % this.colors.length]]],
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
          xaxis: {
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(cols).keys()).map(i => i + 1),
            title: this.$t('chartLabelHeatmapCol'),
            range: [0, cols + 1]
          },
          yaxis: {
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(rows).keys()).map(i => i + 1),
            ticktext: Array.from(Array(rows).keys()).map(i => '' + (rows - i)),
            title: this.$t('chartLabelHeatmapRow'),
            range: [0, rows + 1]
          },
          annotations: []
        }

        this.$plotly.newPlot('heatmap-chart', data, layout, { responsive: true })
      }
    }
  },
  mounted: function () {
    this.traits = this.dataset.traits.map((t, index) => {
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
