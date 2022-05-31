<template>
  <div>
    <div class="d-flex justify-content-between mb-3" v-if="storeTraits && storeTraits.length > 0">
      <p>{{ $t('pageHomeText') }}</p>
      <b-form inline @submit.prevent.stop>
        <VueTypeaheadBootstrap id="typeahead" v-model="searchTerm" @hit="openDataInput" :data="germplasmNames">
          <template slot="append">
            <b-button @click="openDataInput"><BIconSearch /></b-button>
          </template>
          <template slot="prepend">
            <b-button @click="$refs.barcodeScannerModal.show()" v-b-tooltip="$t('tooltipScanQRCodeFindPlot')">
              <!-- TODO: Replace with bootstrap-vue icon once new version is released -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16">
                <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/>
                <path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/>
                <path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/>
                <path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/>
                <path d="M12 9h2V8h-2v1Z"/>
              </svg>
            </b-button>
          </template>
        </VueTypeaheadBootstrap>
      </b-form>
    </div>
    <div class="d-flex flex-row align-items-end top-banner">
      <b-button @click="$router.push({ name: 'settings' })" class="mr-1" v-b-tooltip="$t('tooltipSettings')" v-if="storeTraits && storeTraits.length > 0">
        <BIconGearFill /> <span class="d-none d-lg-inline-block">{{ $t('tooltipSettings') }}</span>
      </b-button>

      <!-- If it's a dataset that has been shared, show save and load buttons -->
      <b-dropdown v-if="storeDatasetUuid" class="mr-1" v-b-tooltip="$t('tooltipShare')">
        <template v-slot:button-content><BIconShareFill /> <span class="d-none d-lg-inline-block">{{ $t('tooltipShare') }}</span></template>

        <b-dropdown-item-button @click="onLoad" class="mr-1"><BIconCloudDownloadFill /> {{ $t('tooltipLoad') }}</b-dropdown-item-button>
        <b-dropdown-item-button @click="onSave" class="mr-1"><BIconCloudUploadFill /> {{ $t('tooltipSave') }}</b-dropdown-item-button>
        <b-dropdown-item-button @click="$refs.barcodeViewModal.show()" class="mr-1">
          <!-- TODO: Replace with bootstrap-vue icon once new version is released -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code" viewBox="0 0 16 16">
            <path d="M2 2h2v2H2V2Z"/>
            <path d="M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z"/>
            <path d="M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z"/>
            <path d="M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 0h-1v2h2v-1h-1V9Zm-4 0h2v1h-1v1h-1V9Zm2 3v-1h-1v1h-1v1H9v1h3v-2h1Zm0 0h3v1h-2v1h-1v-2Zm-4-1v1h1v-2H7v1h2Z"/>
            <path d="M7 12h1v3h4v1H7v-4Zm9 2v2h-3v-1h2v-1h1Z"/>
          </svg> {{ $t('tooltipShowSharingCode') }}
        </b-dropdown-item-button>
      </b-dropdown>

      <!-- Else, show the share button -->
      <b-button v-else @click="$router.push({ name: 'share' })" class="mr-1" v-b-tooltip="$t('tooltipShare')">
        <BIconShareFill /> <span class="d-none d-lg-inline-block">{{ $t('tooltipShare') }}</span>
      </b-button>

      <b-dropdown class="mr-1" v-b-tooltip="$t('tooltipJumpTo')" ref="cornerDropdown">
        <template v-slot:button-content>
          <BIconArrowsFullscreen /> <span class="d-none d-lg-inline-block">{{ $t('tooltipJumpTo') }}</span>
        </template>

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

      <b-dropdown v-b-tooltip="$t('widgetTraitSelectorTitle')" class="trait-dropdown mr-1">
        <template #button-content>
          <BIconCircleHalf /> <span class="d-none d-lg-inline-block">{{ $t('widgetTraitSelectorTitle') }}</span>
        </template>
        <b-dropdown-form>
          <b-button-group>
            <b-button @click="toggleVisibilityAll(true)"><BIconCircleFill /> {{ $t('buttonSelectAll') }}</b-button>
            <b-button @click="toggleVisibilityAll(false)"><BIconCircle /> {{ $t('buttonDeselectAll') }}</b-button>
          </b-button-group>
        </b-dropdown-form>
        <b-dropdown-item v-for="(trait, index) in storeTraits" :key="`trait-${index}`" @click.native.capture.stop="toggleVisibility(index)">
          <span :style="{ color: (storeVisibleTraits && storeVisibleTraits[index] === true) ? storeTraitColors[index % storeTraitColors.length] : 'lightgray' }"><BIconCircleFill /> {{ trait.name }}</span>
          <b-progress class="trait-progress" height="3px" v-if="traitStats && traitStats[trait.name]">
            <b-progress-bar :value="traitStats[trait.name].count / traitStats[trait.name].total * 100" :style="{ backgroundColor: (storeVisibleTraits && storeVisibleTraits[index] === true) ? storeTraitColors[index % storeTraitColors.length] : 'dimgray' }"/>
          </b-progress>
        </b-dropdown-item>
      </b-dropdown>

      <b-button @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></b-button>

      <b-button @click="$router.push({ name: 'export' })" class="ml-auto">
        <BIconDownload /> <span class="d-none d-lg-inline-block">{{ $t('buttonExport') }}</span>
      </b-button>
    </div>

    <GridTableCanvas @cell-clicked="onCellClicked" :traitStats="storeShowStatsInTable ? traitStats : null" v-if="storeTraits && storeTraits.length > 0" :highlightPosition="userPosition" ref="canvas" />
    <DataPointModal ref="dataPointModal" :row="cell.row" :col="cell.col" />
    <BarcodeScannerModal ref="barcodeScannerModal" @code-scanned="searchByBarcode" />
    <BarcodeViewerModal ref="barcodeViewModal" :text="storeDatasetUuid" v-if="storeDatasetUuid" />
    <HelpModal url="https://cropgeeks.github.io/gridscore/collecting-data.html" ref="helpModal" />

    <template v-if="storeNavigationMode === 'jump'">
      <b-button class="btn-circle" id="jump-navigation" variant="primary"><BIconArrowsMove /></b-button>

      <b-popover ref="navigationPopover" target="jump-navigation" triggers="click blur" placement="left" :variant="storeDarkMode ? 'dark' : null">
        <div class="grid-direction-grid p-2">
          <div><b-button @click="moveCanvas('topleft')"><BIconArrowUpLeft /></b-button></div>
          <div><b-button @click="moveCanvas('top')"><BIconArrowUp /></b-button></div>
          <div><b-button @click="moveCanvas('topright')"><BIconArrowUpRight /></b-button></div>
          <div><b-button @click="moveCanvas('left')"><BIconArrowLeft /></b-button></div>
          <div><b-button @click="$refs.navigationPopover.$emit('close')"><BIconSlashCircle /></b-button></div>
          <div><b-button @click="moveCanvas('right')"><BIconArrowRight /></b-button></div>
          <div><b-button @click="moveCanvas('bottomleft')"><BIconArrowDownLeft /></b-button></div>
          <div><b-button @click="moveCanvas('bottom')"><BIconArrowDown /></b-button></div>
          <div><b-button @click="moveCanvas('bottomright')"><BIconArrowDownRight /></b-button></div>
        </div>
      </b-popover>
    </template>
  </div>
</template>

<script>
import GridTableCanvas from '@/components/tables/GridTableCanvas'
import DataPointModal from '@/components/modals/DataPointModal'
import BarcodeScannerModal from '@/components/modals/BarcodeScannerModal'
import BarcodeViewerModal from '@/components/modals/BarcodeViewerModal'
import HelpModal from '@/components/modals/HelpModal'
import { BIconCircleFill, BIconGearFill, BIconSearch, BIconArrowsMove, BIconQuestionCircleFill, BIconSlashCircle, BIconCloudDownloadFill, BIconCircleHalf, BIconCircle, BIconCloudUploadFill, BIconDownload, BIconShareFill, BIconArrowsFullscreen, BIconGeoAltFill, BIconArrowUpLeft, BIconArrowUp, BIconArrowUpRight, BIconArrowLeft, BIconArrowRight, BIconArrowDownLeft, BIconArrowDown, BIconArrowDownRight } from 'bootstrap-vue'
import { mapGetters } from 'vuex'
import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap'

const emitter = require('tiny-emitter/instance')
const fixPer = require('fix-perspective')

export default {
  data: function () {
    return {
      searchTerm: null,
      focusInterval: null,
      germplasmNames: [],
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
        // this.$store.dispatch('setVisibleTraits', null)
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
    BIconSlashCircle,
    BIconGearFill,
    BIconCircleHalf,
    BIconCircle,
    BIconArrowsMove,
    BIconSearch,
    BIconShareFill,
    BIconArrowsFullscreen,
    BIconDownload,
    BIconArrowUpLeft,
    BIconArrowUp,
    BIconArrowUpRight,
    BIconArrowLeft,
    BIconArrowRight,
    BIconArrowDownLeft,
    BIconArrowDown,
    BIconArrowDownRight,
    BIconGeoAltFill,
    BIconCloudDownloadFill,
    BIconQuestionCircleFill,
    BIconCloudUploadFill,
    BarcodeScannerModal,
    BarcodeViewerModal,
    GridTableCanvas,
    DataPointModal,
    VueTypeaheadBootstrap,
    HelpModal
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeContinuousInput',
      'storeCornerPoints',
      'storeDarkMode',
      'storeDatasetId',
      'storeDatasetUuid',
      'storeGeolocation',
      'storeRows',
      'storeShowStatsInTable',
      'storeTraitColors',
      'storeTraits',
      'storeUseGps',
      'storeVisibleTraits',
      'storeNavigationMode'
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
        const result = perspT(this.storeGeolocation.lat, this.storeGeolocation.lng)
        result.heading = this.storeGeolocation.heading
        return result
      } else {
        return null
      }
    }
  },
  methods: {
    searchByBarcode: function (code) {
      this.searchTerm = code

      this.$nextTick(() => this.openDataInput())
    },
    scrollTo: function (corner) {
      this.$refs.canvas.scrollToCorner(corner)
      this.$refs.cornerDropdown.hide()
    },
    moveCanvas: function (direction) {
      this.$refs.canvas.moveInDirection(direction)
    },
    openDataInput: function () {
      this.$nextTick(() => {
        if (this.searchTermLowerCase === null) {
          return
        }
        this.$store.state.dataset.data.forEach((c, k) => {
          if (c.name !== undefined && c.name !== null && c.name.toLowerCase() === this.searchTermLowerCase) {
            this.$nextTick(() => {
              const [rowIndex, columnIndex] = k.split('-').map(i => +i)

              this.onCellClicked({
                row: rowIndex,
                col: columnIndex
              })
            })

            this.searchTerm = ''
          }
        })
      })
    },
    toggleVisibilityAll: function (select) {
      this.$store.dispatch('setVisibleTraits', this.storeTraits.map(i => select))
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
      const el = document.querySelector('#typeahead input')
      if (el && !document.body.classList.contains('modal-open')) {
        const x = window.scrollX
        const y = window.scrollY
        el.focus({
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

      const germplasmArray = []
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (storeData) {
        storeData.forEach((value, key) => {
          if (value.name && value.name.length > 0) {
            germplasmArray.push(value.name)
          }
        })
        germplasmArray.sort()
        Object.freeze(germplasmArray)
      }
      this.germplasmNames = germplasmArray
    },
    updateTraitStats: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (this.storeTraits && storeData) {
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

        storeData.forEach((c, k) => {
          const [rowIndex, colIndex] = k.split('-').map(i => +i)

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
    },
    onLoad: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextReplaceDatasets'), {
          title: this.$t('modalTitleReplaceDatasets'),
          okTitle: this.$t('buttonReplace'),
          cancelTitle: this.$t('buttonCancel')
        }).then(value => {
          if (value) {
            this.loadData()
          }
        })
    },
    onSave: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextSaveToServerWarning'), {
          title: this.$t('modalTitleSaveToServerWarning'),
          okTitle: this.$t('buttonSave'),
          cancelTitle: this.$t('buttonCancel')
        }).then(value => {
          if (value) {
            this.sendData()
          }
        })
    },
    loadData: function () {
      emitter.emit('set-loading', true)
      this.getConfigFromSharing(this.storeDatasetUuid)
        .then(result => {
          if (result) {
            result.id = this.storeDatasetId
            this.$store.dispatch('updateDataset', result)
          }
        })
        .catch(err => {
          this.serverError = this.getErrorMessage(err)
        })
        .finally(() => emitter.emit('set-loading', false))
    },
    sendData: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (storeData) {
        emitter.emit('set-loading', true)
        const dataset = this.$store.state.dataset
        const dataCopy = JSON.parse(JSON.stringify(dataset))

        this.postConfigForSharing(dataCopy, storeData, this.storeDatasetUuid, this.storeRows, this.storeCols)
          .catch(err => {
            this.serverError = this.getErrorMessage(err)
          })
          .finally(() => emitter.emit('set-loading', false))
      }
    }
  },
  mounted: function () {
    if (this.storeDatasetId !== undefined && this.storeDatasetId !== null && (!this.$store.state.dataset.data || this.$store.state.dataset.data.length < 1)) {
      this.$store.dispatch('loadDataset', { datasetId: this.storeDatasetId, redirect: false })
    } else {
      this.$nextTick(() => this.update())
    }
    emitter.on('dataset-changed', this.update)
    emitter.on('data-point-changed', this.updateTraitStats)
  },
  beforeDestroy: function () {
    if (this.focusInterval) {
      clearInterval(this.focusInterval)
    }
    emitter.off('dataset-changed', this.update)
    emitter.off('data-point-changed', this.updateTraitStats)
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
#jump-navigation {
  position: fixed;
  right: 1em;
  bottom: 20%;
  transition: opacity linear 0.1s;
  opacity: 0.66;
}
#jump-navigation:hover,
#jump-navigation:focus {
  opacity: 1;
}
.btn-circle {
  width: 50px;
  height: 50px;
  padding: 7px 10px;
  border-radius: 25px;
  text-align: center;
}
</style>
