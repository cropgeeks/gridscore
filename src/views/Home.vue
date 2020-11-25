<template>
  <div>
    <p v-if="dataset && dataset.traits && dataset.traits.length > 0">{{ $t('pageHomeText') }}</p>
    <div class="d-flex flex-row align-items-end top-banner">
      <b-button @click="$refs.setupModal.show()" id="setup-button">{{ $t('buttonSettingsModal') }}</b-button>
      <b-button class="mx-1" @click="$refs.settingsModal.show()" v-if="dataset && dataset.traits && dataset.traits.length > 0"><BIconGearFill /></b-button>

      <b-button-group class="d-flex flex-row align-items-center flex-wrap">
        <b-button v-for="(trait, index) in dataset.traits" :key="`trait-${index}`" variant="light" @click="toggleVisibility(index)" v-b-tooltip="$t('tooltipTraitToggle')">
          <span class="mx-1" :style="{ color: (visibleTraits && visibleTraits[index] === true) ? colors[index % colors.length] : 'lightgray' }"><BIconCircleFill /> {{ trait.name }}</span>
        </b-button>
      </b-button-group>

      <b-button @click="onExportClicked" class="ml-auto">{{ $t('buttonExport') }}</b-button>
    </div>

    <GridTableLite v-on:cell-clicked="onCellClicked" :visibleTraits="visibleTraits" :highlightPosition="userPosition" v-if="dataset && dataset.traits && dataset.traits.length > 0" />
    <h3 class="ml-3 mt-3" v-else><BIconArrowUpCircleFill /> {{ $t('labelHomeIntro') }}</h3>

    <!-- <GridTable v-on:cell-clicked="onCellClicked" v-if="dataset && dataset.traits && dataset.traits.length > 0" :visibleTraits="visibleTraits" :highlightPosition="userPosition" />
    <h3 class="ml-3 mt-3" v-else><BIconArrowUpCircleFill /> {{ $t('labelHomeIntro') }}</h3> -->

    <ExportModal ref="exportModal" />
    <SetupModal ref="setupModal" v-on:settings-changed="onSettingsChanged" />
    <SettingsModal ref="settingsModal" />

    <DataPointModal ref="dataPointModal" :row="cell.row" :col="cell.col" />
  </div>
</template>

<script>
// import GridTable from '@/components/tables/GridTable'
import GridTableLite from '@/components/tables/GridTableLite'
import DataPointModal from '@/components/modals/DataPointModal'
import SetupModal from '@/components/modals/SetupModal'
import SettingsModal from '@/components/modals/SettingsModal'
import ExportModal from '@/components/modals/ExportModal'
import { BIconArrowUpCircleFill, BIconCircleFill, BIconGearFill } from 'bootstrap-vue'

const fixPer = require('fix-perspective')

export default {
  data: function () {
    return {
      cell: {
        row: null,
        col: null
      },
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
    BIconArrowUpCircleFill,
    BIconCircleFill,
    BIconGearFill,
    // GridTable,
    GridTableLite,
    DataPointModal,
    SetupModal,
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
        result.heading = this.geolocation.heading
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
    },
    onCellClicked: function (cell) {
      this.cell = cell
      this.$nextTick(() => this.$refs.dataPointModal.show())
    },
    onExportClicked: function () {
      this.$refs.exportModal.show()
    }
  },
  mounted: function () {
    if (this.dataset && this.dataset.traits) {
      this.visibleTraits = this.dataset.traits.map(t => true)
    } else {
      this.visibleTraits = null
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
