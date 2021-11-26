<template>
  <div>
    <h1>{{ $t('pageStatsTitle') }}</h1>
    <p>{{ $t('pageStatsText') }}</p>

    <template v-if="storeTraits && storeTraits.length > 0">
      <div v-for="(trait, index) in storeTraits" :key="`trait-stats-${index}`">
        <h2><span :style="{ color: storeTraitColors[index % storeTraitColors.length] }"><BIconCircleFill /> {{ trait.name }} <b-badge variant="light" class="ml-1">{{ getTraitTypeText(trait) }}</b-badge></span></h2>
        <div class="stats-chart" :ref="`trait-chart-${index}`" />
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconCircleFill } from 'bootstrap-vue'

export default {
  components: {
    BIconCircleFill
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDarkMode',
      'storeData',
      'storeDatasetName',
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
    storeDarkMode: function () {
      this.update()
    }
  },
  methods: {
    update: function () {
      this.storeTraits.forEach((trait, index) => {
        const div = this.$refs[`trait-chart-${index}`][0]
        this.$plotly.purge(div)

        const data = []
        let chartType

        switch (trait.type) {
          case 'float':
          case 'int':
          case 'date': {
            chartType = 'box'
            const datapoints = []
            this.storeData.forEach((c, k) => datapoints.push({ value: c.values[index], name: c.name }))
            data.push({
              x: datapoints.map(d => d.value),
              text: datapoints.map(d => d.name),
              marker: {
                color: this.storeTraitColors[index % this.storeTraitColors.length]
              },
              name: '',
              type: chartType,
              jitter: 0.5,
              pointpos: 2,
              boxpoints: 'all'
            })
            break
          }
          case 'text':
          case 'categorical':
            chartType = 'bar'
            const map = {}
            const datapoints = []
            this.storeData.forEach((c, k) => datapoints.push(c.values[index]))
            datapoints.forEach(c => {
              if (map[c]) {
                map[c] += 1
              } else {
                map[c] = 1
              }
            })

            let keys
            if (trait.type === 'categorical' && trait.restrictions && trait.restrictions.categories) {
              keys = trait.restrictions.categories
            } else {
              keys = Object.keys(map).sort()
            }

            data.push({
              x: keys,
              y: keys.map(k => map[k]),
              type: chartType,
              marker: {
                color: this.storeTraitColors[index % this.storeTraitColors.length]
              }
            })
            break
        }

        const layout = {
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: {
            l: 30,
            r: 30
          },
          autosize: true,
          yaxis: {
            automargin: true,
            title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
            showgrid: chartType === 'bar'
          },
          xaxis: {
            zeroline: false,
            title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
            showgrid: chartType === 'box'
          },
          hovermode: 'closest'
        }

        if (trait.type === 'categorical' || trait.type === 'text') {
          layout.xaxis.type = 'category'
          layout.xaxis.title.text = trait.name
          layout.yaxis.title.text = this.$t('widgetChartAxisCount')
        } else {
          layout.xaxis.title.text = trait.name
        }

        const filename = trait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const config = {
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: `stats-${this.safeDatasetName}-${filename}-${new Date().toISOString().split('T')[0]}`,
            width: 1280,
            height: 720
          },
          displaylogo: false
        }

        this.$plotly.newPlot(div, data, layout, config)
        // div.on('plotly_click', data => {
        //   // One point was clicked
        //   if (data.points && data.points.length === 1) {
        //   }
        // })
      })
    }
  },
  mounted: function () {
    this.update()
  }
}
</script>

<style>
.stats-chart {
  min-height: 300px;
  height: 40vh;
}
</style>
