<template>
  <div>
    <div id="timeseries-chart" class="time-chart" v-if="dataset && dataset.data && dataset.data.length > 0 && dataset.traits && dataset.traits.length > 0"/>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
export default {
  watch: {
    locale: function () {
      this.plot()
    }
  },
  methods: {
    plot: function () {
      if (!this.dataset || !this.dataset.data || this.dataset.data.length < 1 || !this.dataset.traits || this.dataset.traits.length < 1) {
        return
      }

      this.$plotly.purge('timeseries-chart')

      const plots = this.dataset.rows * this.dataset.cols

      let mapping = []
      let traces = []
      this.dataset.traits.forEach((t, index) => {
        mapping.push({})
        traces.push({})
      })
      this.dataset.data.forEach(r => {
        Object.keys(r).forEach(k => {
          r[k].dates.forEach((d, i) => {
            if (d) {
              let count = mapping[i][d]

              if (!count) {
                count = 1
              } else {
                count++
              }

              mapping[i][d] = count
            }
          })
        })
      })

      mapping.forEach((t, index) => {
        const dates = Object.keys(t).sort()
        traces[index] = {
          type: 'scatter',
          mode: 'lines+markers',
          name: this.dataset.traits[index],
          line: {
            color: this.colors[index % this.colors.length]
          },
          x: dates,
          y: []
        }

        var counter = 0
        dates.forEach(d => {
          counter += t[d]
          traces[index].y.push(counter)
        })
      })

      traces.forEach(t => {
        t.y = t.y.map(y => y / plots * 100)
      })

      var layout = {
        xaxis: {
          showgrid: true,
          zeroline: true,
          showline: true,
          title: this.$t('chartLabelTimeseriesTime')
        },
        yaxis: {
          showgrid: true,
          zeroline: true,
          showline: true,
          rangemode: 'tozero',
          title: this.$t('chartLabelTimeseriesPlotsScores')
        }
      }

      this.$plotly.newPlot('timeseries-chart', traces, layout, { responsive: true })
    }
  },
  mounted: function () {
    this.plot()
  }
}
</script>

<style scoped>
.time-chart {
  height: 80vh;
}
</style>
