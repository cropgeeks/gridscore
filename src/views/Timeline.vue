<template>
  <div>
    <div id="timeseries-chart" class="time-chart" v-if="dataset && dataset.data && dataset.data.length > 0 && dataset.traits && dataset.traits.length > 0"/>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
/**
 * Shows the timeline for data recording of each trait as a percentage of all plots scored.
 */
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

      // The mapping is used to figure out for each trait how many fields were scored at each timepoint
      let mapping = []
      let traces = []
      // For each trait, add an empty object to the fields
      this.dataset.traits.forEach((t, index) => {
        mapping.push({})
        traces.push({})
      })
      // For each field row
      this.dataset.data.forEach(r => {
        // For each column
        Object.keys(r).forEach(k => {
          // For each date
          r[k].dates.forEach((d, i) => {
            // If it exists
            if (d) {
              // Get the current count for that trait and date
              let count = mapping[i][d]

              // Increment it
              if (!count) {
                count = 1
              } else {
                count++
              }

              // Put it back
              mapping[i][d] = count
            }
          })
        })
      })

      // For each trait in the mapping
      mapping.forEach((t, index) => {
        // Get all the dates sorted
        const dates = Object.keys(t).sort()
        traces[index] = {
          type: 'scatter',
          mode: 'lines+markers',
          name: this.dataset.traits[index].name,
          line: {
            color: this.colors[index % this.colors.length]
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
