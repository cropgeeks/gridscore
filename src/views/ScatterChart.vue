<template>
  <div>
    <h1>{{ $t('pageScatterTitle') }}</h1>
    <p>{{ $t('pageScatterText') }}</p>
    <div v-if="storeData && storeData.size > 0 && storeTraits && storeTraits.length > 0">
      <b-row>
        <b-col cols=12 md=6>
          <!-- Trait selection box -->
          <b-form-group :label="$t('formLabelTrait')" label-for="trait-one">
            <b-form-select id="trait-one" :options="traits" v-model="traitOne" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelTrait')" label-for="trait-two">
            <b-form-select id="trait-two" :options="traits" v-model="traitTwo" />
          </b-form-group>
        </b-col>
      </b-row>
      <!-- Scatter element -->
      <div id="scatter-chart"/>
    </div>
    <h3 v-else>{{ $t('labelNoData') }}</h3>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data: function () {
    return {
      traits: [],
      traitOne: null,
      traitTwo: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDarkMode',
      'storeData',
      'storeDatasetName',
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
    traitOne: function () {
      this.update()
    },
    traitTwo: function () {
      this.update()
    },
    storeDarkMode: function () {
      this.update()
    }
  },
  methods: {
    update: function () {
      this.$plotly.purge('scatter-chart')

      const data = [{
        x: [],
        y: [],
        text: [],
        mode: 'markers',
        type: 'scatter'
      }]

      // For each data point
      this.storeData.forEach((c, k) => {
        if (c.values) {
          const one = c.values[this.traitOne]
          const two = c.values[this.traitTwo]

          if (one !== undefined && one !== null && two !== undefined && two !== null) {
            data[0].x.push(one)
            data[0].y.push(two)
            data[0].text.push(c.name)
          }
        }
      })

      const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          title: { text: this.traits[this.traitOne].text, font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        yaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          title: { text: this.traits[this.traitTwo].text, font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        hovermode: 'closest',
        legend: { orientation: 'h', font: { color: this.storeDarkMode ? 'white' : 'black' } }
      }

      const filename = `${this.traits[this.traitOne].text.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${this.traits[this.traitTwo].text.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
      const config = {
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: `scatter-${this.safeDatasetName}-${filename}-${new Date().toISOString().split('T')[0]}`,
          width: 1280,
          height: 720
        },
        displaylogo: false
      }

      this.$plotly.newPlot('scatter-chart', data, layout, config)
    }
  },
  created: function () {
    this.traits = this.storeTraits.map((t, index) => {
      return {
        value: index,
        text: t.name
      }
    })
    this.traitOne = this.traits.length > 0 ? 0 : null
    this.traitTwo = this.traitOne
  }
}
</script>

<style>

</style>
