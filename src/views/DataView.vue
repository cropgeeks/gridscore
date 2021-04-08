<template>
  <div>
    <div class="d-flex justify-content-between mb-3" v-if="storeTraits && storeTraits.length > 0">
      <p>{{ $t('pageHomeText') }}</p>
      <b-form inline @submit.prevent.stop>
        <b-input-group>
          <b-input v-model="searchTerm" ref="searchInput" autofocus @keyup.enter.prevent="openDataInput" />
          <b-input-group-append>
            <b-button @click="openDataInput"><BIconSearch /></b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form>
    </div>
    <div class="d-flex flex-row align-items-end top-banner">
      <b-button @click="$router.push({ name: 'settings' })" v-if="storeTraits && storeTraits.length > 0"><BIconGearFill /></b-button>

      <b-button @click="$router.push({ name: 'share' })" class="mx-1" v-b-tooltip="$t('tooltipShare')"><BIconShareFill /></b-button>

      <b-button-group class="d-flex flex-row align-items-center flex-wrap">
        <b-button v-for="(trait, index) in storeTraits" :key="`trait-${index}`" class="position-relative" variant="light" @click="toggleVisibility(index)" v-b-tooltip="$t('tooltipTraitToggle')">
          <span class="mx-1" :style="{ color: (visibleTraits && visibleTraits[index] === true) ? storeTraitColors[index % storeTraitColors.length] : 'lightgray' }"><BIconCircleFill /> {{ trait.name }}</span>
          <b-progress class="trait-progress" height="3px" v-if="traitStats && traitStats[trait.name]">
            <b-progress-bar :value="traitStats[trait.name].count / traitStats[trait.name].total * 100" :style="{ backgroundColor: storeTraitColors[index % storeTraitColors.length] }"/>
          </b-progress>
        </b-button>
      </b-button-group>

      <b-button @click="$router.push({ name: 'export' })" class="ml-auto">{{ $t('buttonExport') }}</b-button>
    </div>

    <GridTableIndividualCell @cell-clicked="onCellClicked" :traitStats="storeShowStatsInTable ? traitStats : null" :visibleTraits="visibleTraits" :highlightPosition="userPosition" v-if="storeTraits && storeTraits.length > 0" />
    <DataPointModal ref="dataPointModal" :row="cell.row" :col="cell.col" />
  </div>
</template>

<script>
import GridTableIndividualCell from '@/components/tables/GridTableIndividualCell'
import DataPointModal from '@/components/modals/DataPointModal'
import { BIconCircleFill, BIconGearFill, BIconSearch, BIconShareFill } from 'bootstrap-vue'

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
      visibleTraits: null,
      traitStats: null
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
    BIconCircleFill,
    BIconGearFill,
    BIconSearch,
    BIconShareFill,
    GridTableIndividualCell,
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
    openDataInput: function () {
      if (this.searchTermLowerCase === null) {
        return
      }
      this.storeData.forEach((r, rowIndex) => {
        r.forEach((c, columnIndex) => {
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
      })
    },
    toggleVisibility: function (index) {
      this.visibleTraits.splice(index, 1, !this.visibleTraits[index])
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
        this.visibleTraits = this.storeTraits.map(t => true)
      } else {
        this.visibleTraits = null
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

        this.storeTraits.forEach((t, tIndex) => {
          tempStats[t.name] = {
            rows: Array.from(Array(this.storeRows).keys()).map(i => { return { count: 0, total: 0 } }),
            cols: Array.from(Array(this.storeCols).keys()).map(i => { return { count: 0, total: 0 } }),
            count: 0,
            total: 0
          }

          this.storeData.forEach((r, rowIndex) => {
            r.forEach((c, colIndex) => {
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
        })

        Object.freeze(tempStats)

        this.traitStats = tempStats
      }
    }
  },
  mounted: function () {
    const datasetId = this.$route.params.datasetId

    if (datasetId) {
      this.$store.dispatch('loadDataset', +datasetId)
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
  bottom: 0;
  right: 0;
  left: 0;
}
.grayed-out {
  filter: grayscale(100%);
}
.top-banner .btn {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
