<template>
  <div>
    <div class="d-flex justify-content-between mb-3" v-if="storeTraits && storeTraits.length > 0">
      <p>{{ $t('pageHomeText') }}</p>
      <b-form inline @submit.prevent="openDataInput">
        <b-input-group>
          <b-input v-model="searchTerm" ref="searchInput" autofocus />
          <b-input-group-append>
            <b-button @click="openDataInput"><BIconSearch /></b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form>
    </div>
    <div class="d-flex flex-row align-items-end top-banner">
      <b-button @click="$router.push({ name: 'setup' })" id="setup-button">{{ $t('buttonSettingsModal') }}</b-button>
      <b-button class="mx-1" @click="$router.push({ name: 'settings' })" v-if="storeTraits && storeTraits.length > 0"><BIconGearFill /></b-button>

      <b-button-group class="d-flex flex-row align-items-center flex-wrap">
        <b-button v-for="(trait, index) in storeTraits" :key="`trait-${index}`" variant="light" @click="toggleVisibility(index)" v-b-tooltip="$t('tooltipTraitToggle')">
          <span class="mx-1" :style="{ color: (visibleTraits && visibleTraits[index] === true) ? storeTraitColors[index % storeTraitColors.length] : 'lightgray' }"><BIconCircleFill /> {{ trait.name }}</span>
        </b-button>
      </b-button-group>

      <b-button @click="$router.push({ name: 'export' })" class="ml-auto">{{ $t('buttonExport') }}</b-button>
    </div>

    <GridTableLite v-on:cell-clicked="onCellClicked" :visibleTraits="visibleTraits" :highlightPosition="userPosition" v-if="storeTraits && storeTraits.length > 0" />
    <div v-else>
      <h3 class="ml-3 mt-3"><BIconArrowUpCircleFill /> {{ $t('labelHomeIntro') }} Alternatively, <b-button @click="loadExampleData">{{ $t('buttonLoadExampleData') }}</b-button></h3>
    </div>

    <DataPointModal ref="dataPointModal" :row="cell.row" :col="cell.col" />
  </div>
</template>

<script>
// import GridTable from '@/components/tables/GridTable'
import GridTableLite from '@/components/tables/GridTableLite'
import DataPointModal from '@/components/modals/DataPointModal'
import { BIconArrowUpCircleFill, BIconCircleFill, BIconGearFill, BIconSearch } from 'bootstrap-vue'

import { mapGetters } from 'vuex'

const fixPer = require('fix-perspective')

export default {
  data: function () {
    return {
      searchTerm: null,
      focusInterval: null,
      cell: {
        row: null,
        col: null
      },
      visibleTraits: null
    }
  },
  watch: {
    storeTraits: function (newValue) {
      if (newValue) {
        this.visibleTraits = newValue.map(t => true)
      } else {
        this.visibleTraits = null
      }
    },
    storeContinuousInput: function (newValue) {
      if (newValue === true) {
        if (this.focusInterval === null) {
          this.focusInterval = setInterval(this.forceFocus, 1000)
        }
      } else {
        if (this.focusInterval !== null) {
          clearInterval(this.focusInterval)
        }
      }
    }
  },
  components: {
    BIconArrowUpCircleFill,
    BIconCircleFill,
    BIconGearFill,
    BIconSearch,
    // GridTable,
    GridTableLite,
    DataPointModal
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeData'
    ]),
    searchTermLowerCase: function () {
      if (this.searchTerm) {
        return this.searchTerm.toLowerCase()
      } else {
        return null
      }
    },
    userPosition: function () {
      if (this.storeCornerPoints && (this.storeCornerPoints.length === 4) && this.storeGeolocation) {
        const from = this.storeCornerPoints.filter(c => c !== null).map(c => { return { x: c[0], y: c[1] } })
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
        let result = perspT(this.storeGeolocation.lat, this.storeGeolocation.lng)
        result.heading = this.storeGeolocation.heading
        return result
      } else {
        return null
      }
    }
  },
  methods: {
    loadExampleData: function () {
      this.$store.commit('ON_DATASET_CHANGED', require('@/example-data.json'))
    },
    openDataInput: function () {
      if (this.searchTermLowerCase === null) {
        return
      }
      this.storeData.forEach((r, rowIndex) => {
        r.forEach((c, columnIndex) => {
          if (c.name !== undefined && c.name !== null && c.name.toLowerCase() === this.searchTermLowerCase) {
            this.onCellClicked({
              row: rowIndex,
              col: columnIndex
            })
            this.searchTerm = null
          }
        })
      })
    },
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
        let rowData = []
        for (let x = 0; x < settings.cols; x++) {
          rowData.push({
            name: settings.varieties.length > counter ? settings.varieties[counter++] : null,
            dates: new Array(settings.traits.length).fill(null),
            values: new Array(settings.traits.length).fill(null),
            geolocation: null,
            comment: null
          })
        }
        data.push(rowData)
      }
      this.$store.dispatch('setData', data)
    },
    onCellClicked: function (cell) {
      this.cell = cell
      this.$nextTick(() => this.$refs.dataPointModal.show())
    },
    forceFocus: function () {
      if (this.$refs.searchInput && !document.body.classList.contains('modal-open')) {
        const x = window.scrollX
        const y = window.scrollY
        this.$refs.searchInput.focus({
          preventScroll: true
        })
        window.scrollTo(x, y)
      }
    }
  },
  mounted: function () {
    if (this.storeTraits) {
      this.visibleTraits = this.storeTraits.map(t => true)
    } else {
      this.visibleTraits = null
    }

    if (this.storeContinuousInput === true) {
      this.focusInterval = setInterval(this.forceFocus, 1000)
    }
  },
  beforeDestroy: function () {
    if (this.focusInterval) {
      clearInterval(this.focusInterval)
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
