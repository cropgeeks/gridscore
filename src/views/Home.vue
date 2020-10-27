<template>
  <div>
    <div class="d-flex flex-row align-items-end top-banner">
      <b-button @click="$refs.settingsModal.show()" id="setup-button">{{ $t('buttonSettingsModal') }}</b-button>

      <b-form-checkbox :checked="useGps" switch @change="setUseGps" class="mx-3 my-2">{{ $t('buttonToggleGps') }}</b-form-checkbox>

      <b-button-group class="d-flex flex-row align-items-center flex-wrap">
        <b-button v-for="(trait, index) in dataset.traits" :key="`trait-${index}`" variant="light" @click="toggleVisibility(index)">
          <span class="mx-1" :style="{ color: (visibleTraits && visibleTraits[index] === true) ? colors[index % colors.length] : 'lightgray' }"><BIconCircleFill /> {{ trait.name }}</span>
        </b-button>
      </b-button-group>

      <b-button @click="onExportClicked" class="ml-auto">{{ $t('buttonExport') }}</b-button>
    </div>

    <GridTable v-on:cell-clicked="onCellClicked" v-if="dataset && dataset.traits && dataset.traits.length > 0" :visibleTraits="visibleTraits" :highlightPosition="userPosition" />
    <h3 class="ml-3 mt-3" v-else><BIconArrowUpSquareFill /> {{ $t('labelHomeIntro') }}</h3>
    <ExportModal ref="exportModal" />
    <SettingsModal ref="settingsModal" v-on:settings-changed="onSettingsChanged" :geolocation="geolocation" />
    <DataPointModal ref="dataPointModal" :row="cell.row" :col="cell.col" :geolocation="geolocation" />
  </div>
</template>

<script>
import GridTable from '@/components/tables/GridTable'
import DataPointModal from '@/components/modals/DataPointModal'
import SettingsModal from '@/components/modals/SettingsModal'
import ExportModal from '@/components/modals/ExportModal'
import { BIconArrowUpSquareFill, BIconCircleFill } from 'bootstrap-vue'

const fixPer = require('fix-perspective')

export default {
  data: function () {
    return {
      cell: {
        row: null,
        col: null
      },
      geolocation: null,
      geolocationHeading: null,
      geolocationWatchId: null,
      visibleTraits: null
    }
  },
  watch: {
    dataset: function (newValue) {
      if (newValue && newValue.traits) {
        this.visibleTraits = newValue.traits.map(t => true)
      } else {
        this.visibleTraits = null
      }
    }
  },
  components: {
    BIconArrowUpSquareFill,
    BIconCircleFill,
    GridTable,
    DataPointModal,
    SettingsModal,
    ExportModal
  },
  computed: {
    userPosition: function () {
      if (this.dataset.cornerPoints && (this.dataset.cornerPoints.length === 4) && this.geolocation) {
        const from = this.dataset.cornerPoints.filter(c => c !== null).map(c => { return { x: c[0], y: c[1] } })
        if (from.length !== 4) {
          return null
        }
        const to = [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 }
        ]
        const perspT = fixPer(from, to)
        let result = perspT(this.geolocation.lat, this.geolocation.lng)
        result.heading = this.geolocationHeading
        return result
      } else {
        return null
      }
    }
  },
  methods: {
    toggleVisibility: function (index) {
      this.visibleTraits.splice(index, 1, !this.visibleTraits[index])
    },
    onSettingsChanged: function (settings) {
      this.$store.dispatch('setRows', settings.rows)
      this.$store.dispatch('setCols', settings.cols)
      this.$store.dispatch('setTraits', settings.traits)
      // TODO: Change this to acual values
      if (settings.cornerPoints && settings.cornerPoints.length === 4) {
        this.$store.dispatch('setCornerPoints', settings.cornerPoints)
      }
      this.visibleTraits = settings.traits.map(t => true)
      let data = []
      let counter = 0
      for (let y = 0; y < settings.rows; y++) {
        let rowData = {}
        for (let x = 0; x < settings.cols; x++) {
          rowData[x + 1] = {
            name: settings.varieties.length > counter ? settings.varieties[counter++] : null,
            dates: new Array(settings.traits.length).fill(null),
            values: new Array(settings.traits.length).fill(null),
            geolocation: null,
            comment: null
          }
        }
        data.push(rowData)
      }
      this.$store.dispatch('setData', data)
      this.startGeoTracking()
    },
    onCellClicked: function (cell) {
      this.cell = cell
      this.$nextTick(() => this.$refs.dataPointModal.show())
    },
    onExportClicked: function () {
      this.$refs.exportModal.show()
    },
    setUseGps: function (value) {
      this.$store.dispatch('setUseGps', value)
    },
    startGeoTracking: function () {
      if (this.geolocationWatchId === null) {
        if (navigator.geolocation) {
          const options = { enableHighAccuracy: true, maximumAge: 100, timeout: 20000 }
          this.geolocationWatchId = navigator.geolocation.watchPosition(position => {
            if (position && position.coords) {
              this.geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                elv: position.coords.altitude
              }

              // Update the heading only if it's available. When stationaty, the heading is NaN, ignore it and keep the old heading
              if (position.coords.heading !== undefined && position.coords.heading !== null && !isNaN(position.coords.heading)) {
                this.geolocationHeading = position.coords.heading
              }
            }
          }, null, options)
        }
      }
    }
  },
  mounted: function () {
    this.startGeoTracking()
    if (this.dataset && this.dataset.traits) {
      this.visibleTraits = this.dataset.traits.map(t => true)
    } else {
      this.visibleTraits = null
    }
  },
  destroyed: function () {
    if (this.geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }
  }
}
</script>

<style>
.grayed-out {
  filter: grayscale(100%);
}
.top-banner .btn {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
