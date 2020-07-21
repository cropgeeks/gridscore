<template>
  <div>
    <div v-if="dataset && dataset.data && dataset.data.length > 0 && dataset.traits && dataset.traits.length > 0">
      <b-form-group :label="$t('formLabelHeatmapTrait')" label-for="trait">
        <b-form-select id="trait" :options="traits" v-model="trait" />
      </b-form-group>
      <div id="heatmap-chart"/>
    </div>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
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
      let hasData = false
      let data = null

      if (this.dataset.traits[this.trait].type === 'date' || this.dataset.traits[this.trait].type === 'text') {
        outer:
        for (let row = 1; row <= rows; row++) {
          for (let col = 1; col <= cols; col++) {
            if (this.dataset.data[row - 1][col].dates[this.trait] !== null) {
              hasData = true
              break outer
            }
          }
        }
      } else {
        outer:
        for (let row = 1; row <= rows; row++) {
          for (let col = 1; col <= cols; col++) {
            if (this.dataset.data[row - 1][col].values[this.trait] !== null) {
              hasData = true
              break outer
            }
          }
        }
      }

      if (hasData === true) {
        if (this.dataset.traits[this.trait].type === 'date' || this.dataset.traits[this.trait].type === 'text') {
          let minDateString = '9999-12-31'

          for (let row = 1; row <= rows; row++) {
            for (let col = 1; col <= cols; col++) {
              const date = this.dataset.data[row - 1][col].dates[this.trait]

              if (date) {
                minDateString = date < minDateString ? date : minDateString
              }
            }
          }

          const minDate = Date.parse(minDateString)

          data = [{
            x: Array.from({ length: cols }, (v, k) => k + 1),
            y: Array.from({ length: rows }, (v, k) => k + 1),
            z: this.dataset.data.map((row, index) => {
              let result = []
              for (let col = 1; col <= cols; col++) {
                const dateString = this.dataset.data[rows - index - 1][col].dates[this.trait]

                if (dateString) {
                  const date = Date.parse(dateString)

                  result.push((date - minDate) / (1000 * 60 * 60 * 24))
                } else {
                  result.push(NaN)
                }
              }
              return result
            }),
            text: this.dataset.data.map((row, index) => {
              let result = []
              for (let col = 1; col <= cols; col++) {
                result.push(this.dataset.data[rows - index - 1][col].name)
              }
              return result
            }),
            type: 'heatmap',
            hoverongaps: false,
            colorscale: [[0, '#dddddd'], [1, this.colors[this.trait % this.colors.length]]]
          }]
        } else {
          data = [{
            x: Array.from({ length: cols }, (v, k) => k + 1),
            y: Array.from({ length: rows }, (v, k) => k + 1),
            z: this.dataset.data.map((row, index) => {
              let result = []
              for (let col = 1; col <= cols; col++) {
                const value = this.dataset.data[rows - index - 1][col].values[this.trait]

                if (value) {
                  result.push(value)
                } else {
                  result.push(NaN)
                }
              }
              return result
            }),
            text: this.dataset.data.map((row, index) => {
              let result = []
              for (let col = 1; col <= cols; col++) {
                result.push(this.dataset.data[rows - index - 1][col].name)
              }
              return result
            }),
            type: 'heatmap',
            hoverongaps: false,
            colorscale: [[0, '#dddddd'], [1, this.colors[this.trait % this.colors.length]]]
          }]
        }

        var layout = {
          height: 25 * rows,
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