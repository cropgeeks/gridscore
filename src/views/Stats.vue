<template>
  <div>
    <h1>{{ $t('pageStatsTitle') }}</h1>
    <p>{{ $t('pageStatsText') }}</p>

    <template v-if="storeTraits && storeTraits.length > 0">
      <div v-for="(trait, index) in storeTraits" :key="`trait-stats-${index}`">
        <h2><span :style="{ color: storeTraitColors[index % storeTraitColors.length] }"><BIconCircleFill /> {{ trait.name }} <b-badge variant="light" class="ml-1">{{ getTraitTypeText(trait) }}</b-badge></span></h2>
        <div class="stats-chart" :id="`trait-chart-${index}`" />
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
      'storeData'
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
    update: function () {
      this.storeTraits.forEach((trait, index) => {
        const id = `trait-chart-${index}`
        this.$plotly.purge(id)

        const data = []

        switch (trait.type) {
          case 'float':
          case 'int':
          case 'date': {
            const datapoints = this.storeData.map(row => row.map(cell => { return { value: cell.values[index], name: cell.name } }).reduce((a, b) => a.concat(b), [])).reduce((a, b) => a.concat(b), [])
            data.push({
              x: datapoints.map(d => d.value),
              text: datapoints.map(d => d.name),
              marker: {
                color: this.storeTraitColors[index % this.storeTraitColors.length]
              },
              name: '',
              type: 'box',
              jitter: 0.5,
              pointpos: 2,
              boxpoints: 'all'
            })
            break
          }
          case 'text':
          case 'categorical':
            const map = {}
            const array = this.storeData.map(row => row.map(cell => cell.values[index]).reduce((a, b) => a.concat(b), [])).reduce((a, b) => a.concat(b), [])
            array.forEach(c => {
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
              type: 'bar',
              marker: {
                color: this.storeTraitColors[index % this.storeTraitColors.length]
              }
            })
            break
        }

        const layout = {
          margin: {
            l: 30,
            r: 30
          },
          autosize: true,
          yaxis: {
            automargin: true
          },
          xaxis: {
            zeroline: false
          }
        }

        const filename = trait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const config = {
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: `stats-${this.safeDatasetName}-${filename}-${new Date().toISOString().split('T')[0]}`
          }
        }

        this.$plotly.newPlot(id, data, layout, config)
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