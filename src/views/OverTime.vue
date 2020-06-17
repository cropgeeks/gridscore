<template>
  <div id="timeseries-chart" class="time-chart"/>
</template>

<script>
export default {
  mounted: function () {
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
        mode: 'lines',
        name: this.dataset.traits[index],
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
}
</script>

<style scoped>
.time-chart {
  height: 80vh;
}
</style>
