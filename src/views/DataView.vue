<template>
  <div>
    <div class="d-flex justify-content-between mb-3" v-if="storeTraits && storeTraits.length > 0">
      <p>{{ $t('pageHomeText') }}</p>
      <b-form inline @submit.prevent.stop>
        <b-input-group>
          <b-input v-model="searchTerm" ref="searchInput" @keyup.enter.prevent="openDataInput" />
          <b-input-group-append>
            <b-button @click="openDataInput"><BIconSearch /></b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form>
    </div>
    <div class="d-flex flex-row align-items-end top-banner">
      <b-button @click="$router.push({ name: 'settings' })" class="mr-1" v-if="storeTraits && storeTraits.length > 0"><BIconGearFill /></b-button>

      <b-button @click="$router.push({ name: 'share' })" class="mr-1" v-b-tooltip="$t('tooltipShare')"><BIconShareFill /></b-button>

      <b-dropdown class="mr-1" v-b-tooltip="$t('tooltipJumpTo')" ref="cornerDropdown">
        <template v-slot:button-content><BIconArrowsFullscreen /></template>

        <div class="grid-direction-grid p-2">
          <div><b-button @click="scrollTo('topleft')"><BIconArrowUpLeft /></b-button></div>
          <div><b-button @click="scrollTo('top')"><BIconArrowUp /></b-button></div>
          <div><b-button @click="scrollTo('topright')"><BIconArrowUpRight /></b-button></div>
          <div><b-button @click="scrollTo('left')"><BIconArrowLeft /></b-button></div>
          <div><b-button @click="scrollTo('center')"><BIconCircleFill /></b-button></div>
          <div><b-button @click="scrollTo('right')"><BIconArrowRight /></b-button></div>
          <div><b-button @click="scrollTo('bottomleft')"><BIconArrowDownLeft /></b-button></div>
          <div><b-button @click="scrollTo('bottom')"><BIconArrowDown /></b-button></div>
          <div><b-button @click="scrollTo('bottomright')"><BIconArrowDownRight /></b-button></div>
          <b-button @click="scrollTo('gps')" class="gps-button" v-if="storeUseGps && userPosition"><BIconGeoAltFill /> {{ $t('buttonGPS') }}</b-button>
        </div>
      </b-dropdown>

      <b-dropdown :text="$t('widgetTraitSelectorTitle')" class="trait-dropdown">
        <b-dropdown-form>
          <b-button-group>
            <b-button @click="toggleVisibilityAll(true)">{{ $t('buttonSelectAll') }}</b-button>
            <b-button @click="toggleVisibilityAll(false)">{{ $t('buttonDeselectAll') }}</b-button>
          </b-button-group>
        </b-dropdown-form>
        <b-dropdown-item v-for="(trait, index) in storeTraits" :key="`trait-${index}`" @click.native.capture.stop="toggleVisibility(index)">
          <span :style="{ color: (storeVisibleTraits && storeVisibleTraits[index] === true) ? storeTraitColors[index % storeTraitColors.length] : 'lightgray' }"><BIconCircleFill /> {{ trait.name }}</span>
          <b-progress class="trait-progress" height="3px" v-if="traitStats && traitStats[trait.name]">
            <b-progress-bar :value="traitStats[trait.name].count / traitStats[trait.name].total * 100" :style="{ backgroundColor: storeTraitColors[index % storeTraitColors.length] }"/>
          </b-progress>
        </b-dropdown-item>
      </b-dropdown>

      <b-button @click="$router.push({ name: 'export' })" class="ml-auto">{{ $t('buttonExport') }}</b-button>
    </div>

    <GridTableCanvas @cell-clicked="onCellClicked" :traitStats="storeShowStatsInTable ? traitStats : null" v-if="storeTraits && storeTraits.length > 0" :highlightPosition="userPosition" ref="canvas" />
    <!-- <GridTableIndividualCell @cell-clicked="onCellClicked" :traitStats="storeShowStatsInTable ? traitStats : null" :highlightPosition="userPosition" v-if="storeTraits && storeTraits.length > 0" /> -->
    <DataPointModal ref="dataPointModal" :row="cell.row" :col="cell.col" />
  </div>
</template>

<script>
// import GridTableIndividualCell from '@/components/tables/GridTableIndividualCell'
import GridTableCanvas from '@/components/tables/GridTableCanvas'
import DataPointModal from '@/components/modals/DataPointModal'
import { BIconCircleFill, BIconGearFill, BIconSearch, BIconShareFill, BIconArrowsFullscreen, BIconGeoAltFill, BIconArrowUpLeft, BIconArrowUp, BIconArrowUpRight, BIconArrowLeft, BIconArrowRight, BIconArrowDownLeft, BIconArrowDown, BIconArrowDownRight } from 'bootstrap-vue'

import { EventBus } from '@/plugins/event-bus'

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
      traitStats: null
    }
  },
  watch: {
    storeTraits: function (newValue) {
      if (newValue) {
        if (!this.storeVisibleTraits || (this.storeVisibleTraits.length !== newValue.length)) {
          this.$store.dispatch('setVisibleTraits', newValue.map(t => true))
        }
      } else {
        this.$store.dispatch('setVisibleTraits', null)
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
    BIconCircleFill,
    BIconGearFill,
    BIconSearch,
    BIconShareFill,
    BIconArrowsFullscreen,
    BIconArrowUpLeft,
    BIconArrowUp,
    BIconArrowUpRight,
    BIconArrowLeft,
    BIconArrowRight,
    BIconArrowDownLeft,
    BIconArrowDown,
    BIconArrowDownRight,
    BIconGeoAltFill,
    // GridTableIndividualCell,
    GridTableCanvas,
    DataPointModal
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeContinuousInput',
      'storeCornerPoints',
      'storeData',
      'storeDatasetId',
      'storeGeolocation',
      'storeRows',
      'storeShowStatsInTable',
      'storeTraitColors',
      'storeTraits',
      'storeUseGps',
      'storeVisibleTraits'
    ]),
    searchTermLowerCase: function () {
      if (this.searchTerm) {
        return this.searchTerm.toLowerCase()
      } else {
        return null
      }
    },
    userPosition: function () {
      if (this.storeUseGps && this.storeCornerPoints && (this.storeCornerPoints.length === 4) && this.storeGeolocation) {
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
    scrollTo: function (corner) {
      this.$refs.canvas.scrollToCorner(corner)
      this.$refs.cornerDropdown.hide()
    },
    openDataInput: function () {
      if (this.searchTermLowerCase === null) {
        return
      }
      this.storeData.forEach((c, k) => {
        const [ rowIndex, columnIndex ] = k.split('-').map(i => +i)

        if (c.name !== undefined && c.name !== null && c.name.toLowerCase() === this.searchTermLowerCase) {
          const cell = document.querySelector(`#grid-table table tr:nth-child(${rowIndex}) td:nth-child(${columnIndex + 1})`)

          if (cell) {
            cell.scrollIntoView()
          }

          this.$nextTick(() => {
            this.onCellClicked({
              row: rowIndex,
              col: columnIndex
            })
          })

          this.searchTerm = null
        }
      })
    },
    toggleVisibilityAll: function (select) {
      this.$store.dispatch('setVisibleTraits', this.storeVisibleTraits.map(i => select))
    },
    toggleVisibility: function (index) {
      const temp = this.storeVisibleTraits.concat()
      temp[index] = !temp[index]
      this.$store.dispatch('setVisibleTraits', temp)
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
    },
    update: function () {
      this.traitStats = null
      if (this.storeTraits) {
        if (!this.storeVisibleTraits || (this.storeVisibleTraits.length !== this.storeTraits.length)) {
          this.$store.dispatch('setVisibleTraits', this.storeTraits.map(t => true))
        }
      } else {
        this.$store.dispatch('setVisibleTraits', null)
      }

      if (this.storeContinuousInput === true) {
        this.focusInterval = setInterval(this.forceFocus, 1000)
      }

      this.updateTraitStats()
    },
    updateTraitStats: function () {
      if (this.storeTraits) {
        // If we don't have stats yet, get them from the dataset
        const tempStats = {}

        this.storeTraits.forEach(t => {
          tempStats[t.name] = {
            rows: Array.from(Array(this.storeRows).keys()).map(i => { return { count: 0, total: 0 } }),
            cols: Array.from(Array(this.storeCols).keys()).map(i => { return { count: 0, total: 0 } }),
            count: 0,
            total: 0
          }
        })

        this.storeData.forEach((c, k) => {
          const [ rowIndex, colIndex ] = k.split('-').map(i => +i)

          this.storeTraits.forEach((t, tIndex) => {
            tempStats[t.name].total++
            tempStats[t.name].rows[rowIndex].total++
            tempStats[t.name].cols[colIndex].total++
            if (c.values[tIndex] !== undefined && c.values[tIndex] !== null && c.values[tIndex] !== '') {
              tempStats[t.name].rows[rowIndex].count++
              tempStats[t.name].cols[colIndex].count++
              tempStats[t.name].count++
            }
          })
        })

        // Freeze it to stop reactivity
        Object.freeze(tempStats)

        this.traitStats = tempStats
      }
    }
  },
  mounted: function () {
    if (this.storeDatasetId !== undefined && this.storeDatasetId !== null && (!this.storeData || this.storeData.length < 1)) {
      this.$store.dispatch('loadDataset', this.storeDatasetId)
    } else {
      this.update()
    }
    EventBus.$on('dataset-changed', this.update)
    EventBus.$on('data-point-changed', this.updateTraitStats)
  },
  beforeDestroy: function () {
    if (this.focusInterval) {
      clearInterval(this.focusInterval)
    }
    EventBus.$off('dataset-changed', this.update)
    EventBus.$off('data-point-changed', this.updateTraitStats)
  }
}
</script>

<style>
.trait-progress {
  position: absolute;
  /* bottom: 0; */
  right: 0;
  left: 0;
}
.grayed-out {
  filter: grayscale(100%);
}
.top-banner > .btn,
.top-banner > .dropdown > .btn {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.trait-dropdown ul {
  max-height: 80vh;
  overflow-y: auto;
}
.grid-direction-grid {
  display: grid;
  grid-gap: 1px;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 10px;
}
.grid-direction-grid > div {
  justify-self: center;
  align-self: center;
}
.grid-direction-grid .gps-button {
  grid-column: 1 / span 3;
}
</style>
