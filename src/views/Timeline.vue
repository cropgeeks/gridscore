<template>
  <div>
    <h1>{{ $t('pageTimelineTitle') }}</h1>
    <p>{{ $t('pageTimelineText') }}</p>
    <div id="timeseries-chart" class="time-chart" v-if="storeData && storeData.size > 0 && storeTraits && storeTraits.length > 0"/>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

/**
 * Shows the timeline for data recording of each trait as a percentage of all plots scored.
 */
export default {
  watch: {
    storeLocale: function () {
      this.plot()
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeData',
      'storeDatasetName',
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
  methods: {
    plot: function () {
      if (!this.storeData || this.storeData.size < 1 || !this.storeTraits || this.storeTraits.length < 1) {
        return
      }

      this.$plotly.purge('timeseries-chart')

      const plots = this.storeRows * this.storeCols

      // The mapping is used to figure out for each trait how many fields were scored at each timepoint
      let mapping = []
      let traces = []
      // For each trait, add an empty object to the fields
      this.storeTraits.forEach(() => {
        mapping.push({})
        traces.push({})
      })
      // For each field row
      this.storeData.forEach((c, k) => {
        c.dates.forEach((d, i) => {
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

      // For each trait in the mapping
      mapping.forEach((t, index) => {
        // Get all the dates sorted
        const dates = Object.keys(t).sort()
        traces[index] = {
          type: 'scatter',
          mode: 'lines+markers',
          name: this.storeTraits[index].name,
          line: {
            color: this.storeTraitColors[index % this.storeTraitColors.length]
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
          automargin: true,
          showgrid: true,
          zeroline: true,
          showline: true,
          title: this.$t('chartLabelTimeseriesTime')
        },
        yaxis: {
          automargin: true,
          showgrid: true,
          zeroline: true,
          showline: true,
          rangemode: 'tozero',
          title: this.$t('chartLabelTimeseriesPlotsScores')
        },
        legend: { orientation: 'h' }
      }

      const config = {
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: `timeline-${this.safeDatasetName}-${new Date().toISOString().split('T')[0]}`
        }
      }

      this.$plotly.newPlot('timeseries-chart', traces, layout, config)
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
