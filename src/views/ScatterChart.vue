<template>
  <div>
    <h1>{{ $t('pageScatterTitle') }} <small><a href="#" class="text-secondary" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></a></small></h1>
    <p>{{ $t('pageScatterText') }}</p>
    <div v-if="storeDatasetId && storeTraits && storeTraits.length > 0">
      <b-row>
        <b-col cols=12 md=6>
          <!-- Trait selection box -->
          <b-form-group :label="$t('formLabelTrait')" label-for="trait-one">
            <b-form-select id="trait-one" :options="traits" v-model="traitOne" />
          </b-form-group>
          <b-form-group :label="$t('formLabelMultiTraitVizType')" label-for="trait-viz-type-one" v-if="traitOne !== null && storeTraits[traitOne].mType === 'multi'">
            <b-form-select id="trait-viz-type-one" :options="multiTraitOptionsOne" v-model="selectedMultiTraitMethodOne" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelTrait')" label-for="trait-two">
            <b-form-select id="trait-two" :options="traits" v-model="traitTwo" />
          </b-form-group>
          <b-form-group :label="$t('formLabelMultiTraitVizType')" label-for="trait-viz-type-two" v-if="traitTwo !== null && storeTraits[traitTwo].mType === 'multi'">
            <b-form-select id="trait-viz-type-two" :options="multiTraitOptionsTwo" v-model="selectedMultiTraitMethodTwo" />
          </b-form-group>
        </b-col>
      </b-row>
      <!-- Scatter element -->
      <div id="scatter-chart"/>
    </div>
    <h3 v-else>{{ $t('labelNoData') }}</h3>

    <HelpModal url="https://cropgeeks.github.io/gridscore/visualizing-data.html#scatter-plot" ref="helpModal" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconQuestionCircleFill } from 'bootstrap-vue'

import HelpModal from '@/components/modals/HelpModal'

const emitter = require('tiny-emitter/instance')
const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/scatter')
])

export default {
  components: {
    BIconQuestionCircleFill,
    HelpModal
  },
  data: function () {
    return {
      traits: [],
      traitOne: null,
      traitTwo: null,
      selectedMultiTraitMethodOne: 'last',
      selectedMultiTraitMethodTwo: 'last',
      multiTraitOptionsOne: [],
      multiTraitOptionsTwo: []
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDarkMode',
      'storeDatasetId',
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
    traitOne: function (newValue) {
      this.selectedMultiTraitMethod = 'last'
    this.multiTraitOptionsOne = this.getMultiTraitMethods(this.storeTraits[newValue])
      this.update()
    },
    traitTwo: function (newValue) {
      this.selectedMultiTraitMethod = 'last'
      this.multiTraitOptionsTwo = this.getMultiTraitMethods(this.storeTraits[newValue])
      this.update()
    },
    storeDarkMode: function () {
      this.update()
    },
    selectedMultiTraitMethodOne: function () {
      this.update()
    },
    selectedMultiTraitMethodTwo: function () {
      this.update()
    }
  },
  methods: {
    update: function () {
      Plotly.purge('scatter-chart')

      const data = [{
        x: [],
        y: [],
        text: [],
        mode: 'markers',
        type: 'scatter'
      }]

      // For each data point
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      storeData.forEach((c, k) => {
        if (c.values) {
          const one = this.extractMultiTraitDatum(this.traitOne, this.storeTraits[this.traitOne].mType, this.selectedMultiTraitMethodOne, c, true)
          const two = this.extractMultiTraitDatum(this.traitTwo, this.storeTraits[this.traitTwo].mType, this.selectedMultiTraitMethodTwo, c, true)

          if (one !== undefined && one !== null && two !== undefined && two !== null) {
            data[0].x.push(one)
            data[0].y.push(two)
            data[0].text.push(c.displayName)
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

      Plotly.newPlot('scatter-chart', data, layout, config)
    },
    init: function () {
      this.traits = this.storeTraits.map((t, index) => {
        return {
          value: index,
          text: t.name
        }
      })
      // Select the first two traits (if available) initially
      this.traitOne = this.traits.length > 0 ? 0 : null
      this.traitTwo = this.traits.length > 1 ? 1 : this.traitOne

      this.multiTraitOptionsOne = this.getMultiTraitMethods(this.storeTraits[this.traitOne])
      this.multiTraitOptionsTwo = this.getMultiTraitMethods(this.storeTraits[this.traitTwo])
    }
  },
  mounted: function () {
    if (this.storeDatasetId !== undefined && this.storeDatasetId !== null && (!this.$store.state.dataset.data || this.$store.state.dataset.data.length < 1)) {
      this.$store.dispatch('loadDataset', { datasetId: this.storeDatasetId, redirect: false })
    } else {
      this.$nextTick(() => this.init())
    }
    emitter.on('dataset-changed', this.init)
  },
  beforeDestroy: function () {
    emitter.off('dataset-changed', this.init)
  }
}
</script>

<style>

</style>
